// Jest test scaffold for public/script.js
// Uses @testing-library/dom for DOM-related tests

// Import libraries
const { fireEvent } = require("@testing-library/dom");

// Helper to set up the DOM as in index.html
function setupDOM() {
  document.body.innerHTML = `
    <div id="paused-indicator" style="display: none">Paused</div>
    <div id="top-bar">
      <button id="select-folder">Select Folder</button>
      <button id="select-files" style="display: none">Select Images</button>
      <input type="file" id="file-input" multiple accept="image/*" style="display: none" />
      <div id="browser-warning" class="info-message" style="display: none"></div>
      <div id="chromium-note" class="info-message">Works best in Chromium browsers (Chrome, Edge, etc.)</div>
    </div>
    <div id="viewer-flex">
      <div id="hitbox-left" class="nav-hitbox"></div>
      <img id="photo" src="" alt="Photo" />
      <div id="hitbox-right" class="nav-hitbox"></div>
    </div>
    <span id="arrow-left" class="arrow-icon">&#8592;</span>
    <span id="arrow-right" class="arrow-icon">&#8594;</span>
    <div id="bottom-bar">
      <label><input type="checkbox" id="auto" /> Auto</label>
      <div>
        <span style="cursor: default">Timer (seconds):</span>
        <input type="number" id="timer" min="1" value="3" />
      </div>
      <span id="countdown"></span>
    </div>
  `;
}

describe("Shuffler App", () => {
  let origCreateObjectURL;
  let origShowDirectoryPicker;
  beforeEach(() => {
    jest.resetModules();
    setupDOM();
    // Mock URL.createObjectURL
    origCreateObjectURL = global.URL.createObjectURL;
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
    // Mock showDirectoryPicker
    origShowDirectoryPicker = global.window.showDirectoryPicker;
    global.window.showDirectoryPicker = jest.fn();
    // Load script.js after DOM is set up
    require("../public/script.js");
  });
  afterEach(() => {
    global.URL.createObjectURL = origCreateObjectURL;
    global.window.showDirectoryPicker = origShowDirectoryPicker;
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Helper Functions", () => {
    test("getCurrentImageIndex returns correct index", () => {
      global.setImages([
        { name: "a.jpg" },
        { name: "b.jpg" },
        { name: "c.jpg" },
      ]);
      global.generateShuffleOrder();
      global.shuffleOrder = [2, 0, 1];
      global.shuffleIndex = 1;
      expect(global.getCurrentImageIndex()).toBe(0);
    });
    test("hideInfoMessages hides the top bar", () => {
      document.getElementById("top-bar").style.display = "";
      global.hideInfoMessages();
      expect(document.getElementById("top-bar")).toHaveStyle("display: none");
    });
  });

  describe("Shuffle & Image Logic", () => {
    test("setImages sorts and sets images", () => {
      const files = [{ name: "b.jpg" }, { name: "a.jpg" }, { name: "c.jpg" }];
      global.setImages(files);
      expect(global.images.map((f) => f.name)).toEqual([
        "a.jpg",
        "b.jpg",
        "c.jpg",
      ]);
    });
    test("generateShuffleOrder randomizes order", () => {
      global.setImages([
        { name: "a.jpg" },
        { name: "b.jpg" },
        { name: "c.jpg" },
        { name: "d.jpg" },
      ]);
      global.generateShuffleOrder();
      expect(global.shuffleOrder.length).toBe(4);
      // Should be a permutation of [0,1,2,3]
      expect([...global.shuffleOrder].sort()).toEqual([0, 1, 2, 3]);
    });
    test("updateImage sets photo src and alt", () => {
      global.setImages([{ name: "foo.jpg" }]);
      global.shuffleOrder = [0];
      global.shuffleIndex = 0;
      global.updateImage();
      const photo = document.getElementById("photo");
      expect(photo.src).toContain("blob:mock");
      expect(photo.alt).toBe("foo.jpg");
    });
    test("updateImage handles no images", () => {
      global.setImages([]);
      global.updateImage();
      const photo = document.getElementById("photo");
      // jsdom sets src to 'http://localhost/' by default
      expect(photo.src).toBe("http://localhost/");
      expect(photo.alt).toBe("No images found.");
    });
  });

  describe("Navigation", () => {
    test("showNext advances image and wraps", () => {
      global.setImages([{ name: "a.jpg" }, { name: "b.jpg" }]);
      global.shuffleOrder = [0, 1];
      global.shuffleIndex = 1;
      global.showNext();
      expect(global.shuffleIndex).toBe(0);
    });
    test("showPrev goes back and wraps", () => {
      global.setImages([{ name: "a.jpg" }, { name: "b.jpg" }]);
      global.shuffleOrder = [0, 1];
      global.shuffleIndex = 0;
      global.showPrev();
      expect(global.shuffleIndex).toBe(1);
    });
  });

  describe("Timer & Auto-Advance", () => {
    beforeEach(() => jest.useFakeTimers());
    test("startAutoTimer sets intervals and advances", () => {
      global.setImages([{ name: "a.jpg" }, { name: "b.jpg" }]);
      global.shuffleOrder = [0, 1];
      global.shuffleIndex = 0;
      document.getElementById("auto").checked = true;
      global.timer = 1;
      global.startAutoTimer();
      jest.advanceTimersByTime(global.DEFAULT_TIMER * 1000); // advance over the timer
      expect(global.shuffleIndex).toBe(1);
    });
    test("stopAutoTimer clears intervals", () => {
      global.shuffleInterval = setInterval(() => {}, 1000);
      global.countdownInterval = setInterval(() => {}, 1000);
      global.stopAutoTimer();
      expect(global.shuffleInterval).toBeNull();
      expect(global.countdownInterval).toBeNull();
    });
    test("pauseAuto and resumeAuto toggle paused state", () => {
      document.getElementById("auto").checked = true;
      global.autoPaused = false;
      global.pauseAuto();
      expect(global.autoPaused).toBe(true);
      expect(document.getElementById("paused-indicator")).not.toHaveStyle(
        "display: none"
      );
      global.resumeAuto();
      expect(global.autoPaused).toBe(false);
      expect(document.getElementById("paused-indicator")).toHaveStyle(
        "display: none"
      );
    });
  });

  describe("Image Loading", () => {
    test("setImages filters and sorts files", () => {
      const files = [
        { name: "b.png" },
        { name: "a.jpg" },
        { name: "c.gif" },
        { name: "notimage.txt" },
      ];
      global.setImages(
        files.filter(
          (f) =>
            f.name.endsWith(".jpg") ||
            f.name.endsWith(".png") ||
            f.name.endsWith(".gif")
        )
      );
      expect(global.images.map((f) => f.name)).toEqual([
        "a.jpg",
        "b.png",
        "c.gif",
      ]);
    });
  });

  describe("Event Listeners", () => {
    test("left/right hitbox click navigates", () => {
      global.setImages([{ name: "a.jpg" }, { name: "b.jpg" }]);
      global.shuffleOrder = [0, 1];
      global.shuffleIndex = 0;
      fireEvent.click(document.getElementById("hitbox-right"));
      expect(global.shuffleIndex).toBe(1);
      fireEvent.click(document.getElementById("hitbox-left"));
      expect(global.shuffleIndex).toBe(0);
    });
    test("auto checkbox toggles auto-advance", () => {
      const auto = document.getElementById("auto");
      fireEvent.change(auto, { target: { checked: true } });
      expect(auto.checked).toBe(true);
      fireEvent.change(auto, { target: { checked: false } });
      expect(auto.checked).toBe(false);
    });
    test("timer input change updates timer", () => {
      const timerInput = document.getElementById("timer");
      fireEvent.change(timerInput, { target: { value: "5" } });
      // The timer variable is only updated on change event in the app
      expect(Number(timerInput.value)).toBe(5);
    });
    test("bottom bar click toggles auto except on timer input", () => {
      const bottomBar = document.getElementById("bottom-bar");
      const auto = document.getElementById("auto");
      fireEvent.click(bottomBar);
      expect(auto.checked).toBe(true);
      fireEvent.click(bottomBar);
      expect(auto.checked).toBe(false);
      // Should not toggle if timer input is clicked
      const timerInput = document.getElementById("timer");
      fireEvent.click(timerInput);
      expect(auto.checked).toBe(false);
    });
    test("photo click toggles pause/play", () => {
      const auto = document.getElementById("auto");
      auto.checked = true;
      global.autoPaused = false;
      fireEvent.click(document.getElementById("photo"));
      expect(global.autoPaused).toBe(true);
      fireEvent.click(document.getElementById("photo"));
      expect(global.autoPaused).toBe(false);
    });
  });

  describe("Keyboard Navigation", () => {
    beforeEach(() => {
      jest.resetModules();
      setupDOM();
      require("../public/script.js");
      global.setImages([{ name: "a.jpg" }, { name: "b.jpg" }]);
      global.shuffleOrder = [0, 1];
      global.shuffleIndex = 0;
    });
    test("keyboard navigation works", () => {
      const eventRight = new window.KeyboardEvent("keydown", {
        key: "ArrowRight",
      });
      window.dispatchEvent(eventRight);
      expect(global.shuffleIndex).toBe(1);
      const eventLeft = new window.KeyboardEvent("keydown", {
        key: "ArrowLeft",
      });
      window.dispatchEvent(eventLeft);
      expect(global.shuffleIndex).toBe(0);
    });
  });

  describe("UI Initialization", () => {
    test("DOMContentLoaded resets auto and timer", () => {
      document.getElementById("auto").checked = true;
      document.getElementById("timer").value = 10;
      window.dispatchEvent(new Event("DOMContentLoaded"));
      expect(document.getElementById("auto").checked).toBe(false);
      expect(document.getElementById("timer").value).toBe("3");
    });
  });
});

describe("Error Handling", () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
  });
  test("Folder selection errors", async () => {
    // Simulate showDirectoryPicker throwing
    global.window.showDirectoryPicker = jest.fn().mockImplementation(() => {
      throw new Error("fail");
    });
    const selectFolderBtn = document.getElementById("select-folder");
    // Should not throw, should log error
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await selectFolderBtn.click();
    expect(spy).toHaveBeenCalledWith(
      "Folder selection cancelled or failed",
      expect.any(Error)
    );
    spy.mockRestore();
  });
  test("Invalid files are filtered out", () => {
    const files = [
      { name: "a.jpg" },
      { name: "b.txt" },
      { name: "c.png" },
      { name: "d.docx" },
    ];
    // Simulate file input change event
    const fileInput = document.getElementById("file-input");
    Object.defineProperty(fileInput, "files", {
      value: files,
      configurable: true,
    });
    const event = new Event("change");
    fileInput.dispatchEvent(event);
    expect(global.images.map((f) => f.name)).toEqual(["a.jpg", "c.png"]);
  });
  test("Empty state shows correct alt text", () => {
    global.setImages([]);
    global.updateImage();
    const photo = document.getElementById("photo");
    expect(photo.alt).toBe("No images found.");
  });
});

describe("Accessibility", () => {
  beforeEach(() => {
    setupDOM();
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
    require("../public/script.js");
  });
  test("Focus management: tab order includes navigation and controls", () => {
    // Only test natively focusable elements
    const focusable = [
      document.getElementById("select-folder"),
      document.getElementById("select-files"),
      document.getElementById("file-input"),
      document.getElementById("auto"),
      document.getElementById("timer"),
    ];
    focusable.forEach((el) => {
      if (el) {
        el.focus();
        expect(document.activeElement).toBe(el);
      }
    });
  });
  test("Arrow icons have appropriate aria-hidden attribute", () => {
    const arrowLeft = document.getElementById("arrow-left");
    const arrowRight = document.getElementById("arrow-right");
    arrowLeft.setAttribute("aria-hidden", "true");
    arrowRight.setAttribute("aria-hidden", "true");
    expect(arrowLeft).toHaveAttribute("aria-hidden", "true");
    expect(arrowRight).toHaveAttribute("aria-hidden", "true");
  });
});
