// =========================
// Constants & Configuration
// =========================
const DEFAULT_TIMER = 3;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

// =========================
// DOM Element References
// =========================
const photo = document.getElementById("photo");
const timerInput = document.getElementById("timer");
const selectFolderBtn = document.getElementById("select-folder");
const selectFilesBtn = document.getElementById("select-files");
const fileInput = document.getElementById("file-input");
const browserWarning = document.getElementById("browser-warning");
const pausedIndicator = document.getElementById("paused-indicator");
const hitboxLeft = document.getElementById("hitbox-left");
const hitboxRight = document.getElementById("hitbox-right");
const countdownSpan = document.getElementById("countdown");
const bottomBar = document.getElementById("bottom-bar");
const timerInputField = document.getElementById("timer");
const arrowLeft = document.getElementById("arrow-left");
const arrowRight = document.getElementById("arrow-right");
const autoCheckbox = document.getElementById("auto");

// =========================
// State Variables (attach to window for testability)
// =========================
window.images = window.images || [];
window.shuffleOrder = window.shuffleOrder || [];
window.shuffleIndex = window.shuffleIndex || 0;
window.shuffleInterval = window.shuffleInterval || null;
window.timer = window.timer || DEFAULT_TIMER;
window.countdownValue = window.countdownValue || window.timer;
window.countdownInterval = window.countdownInterval || null;
window.autoPaused = window.autoPaused || false;

// =========================
// Helper Functions
// =========================
// Returns the current image index based on shuffle order
const getCurrentImageIndex = () =>
  window.shuffleOrder[window.shuffleIndex] ?? 0;

// Hides the top bar (select buttons and info messages)
const hideInfoMessages = () => {
  document.getElementById("top-bar").style.display = "none";
};

// Checks if the browser supports the File System Access API
const hasFileSystemAccess = "showDirectoryPicker" in window;

// =========================
// Shuffle & Image Logic
// =========================
// Sets and sorts images, then handles post-load logic
const setImages = (newImages) => {
  window.images = newImages.slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  hideInfoMessages();
  onImagesLoaded();
};

// Generates a new random shuffle order
const generateShuffleOrder = () => {
  window.shuffleOrder = window.images.map((_, i) => i);
  for (let i = window.shuffleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [window.shuffleOrder[i], window.shuffleOrder[j]] = [
      window.shuffleOrder[j],
      window.shuffleOrder[i],
    ];
  }
  window.shuffleIndex = 0;
};

// Displays the current image in the viewer
const updateImage = () => {
  if (window.images.length === 0) {
    photo.src = "";
    photo.alt = "No images found.";
    return;
  }
  const file = window.images[getCurrentImageIndex()];
  photo.src = URL.createObjectURL(file);
  photo.alt = file.name;
};

// =========================
// Navigation Logic
// =========================
const showNext = () => {
  window.shuffleIndex = (window.shuffleIndex + 1) % window.shuffleOrder.length;
  updateImage();
  resetAutoTimer();
};

const showPrev = () => {
  window.shuffleIndex =
    (window.shuffleIndex - 1 + window.shuffleOrder.length) %
    window.shuffleOrder.length;
  updateImage();
  resetAutoTimer();
};

// =========================
// Timer & Auto-Advance Logic
// =========================
const updateCountdown = () => {
  countdownSpan.textContent = `(${window.countdownValue}s)`;
  if (autoCheckbox.checked && !window.autoPaused) {
    countdownSpan.classList.remove("invisible");
  } else {
    countdownSpan.classList.add("invisible");
  }
};

const startAutoTimer = () => {
  if (window.shuffleInterval) clearInterval(window.shuffleInterval);
  if (window.countdownInterval) clearInterval(window.countdownInterval);
  window.countdownValue = window.timer;
  updateCountdown();
  window.countdownInterval = setInterval(() => {
    if (autoCheckbox.checked && !window.autoPaused) {
      window.countdownValue--;
      updateCountdown();
      if (window.countdownValue <= 0) {
        window.countdownValue = window.timer;
      }
    }
  }, 1000);
  window.shuffleInterval = setInterval(() => {
    if (window.shuffleIndex === window.shuffleOrder.length - 1) {
      generateShuffleOrder();
      updateImage();
    } else {
      showNext();
    }
    window.countdownValue = window.timer;
    updateCountdown();
  }, window.timer * 1000);
};

const stopAutoTimer = () => {
  if (window.shuffleInterval) clearInterval(window.shuffleInterval);
  window.shuffleInterval = null;
  if (window.countdownInterval) clearInterval(window.countdownInterval);
  window.countdownInterval = null;
  window.countdownValue = parseInt(timerInput.value) || DEFAULT_TIMER;
  updateCountdown();
};

const resetAutoTimer = () => {
  if (autoCheckbox.checked && !window.autoPaused) {
    startAutoTimer();
  } else {
    updateCountdown();
  }
};

const pauseAuto = () => {
  if (autoCheckbox.checked && !window.autoPaused) {
    stopAutoTimer();
    window.autoPaused = true;
    pausedIndicator.style.display = "";
    window.countdownValue = parseInt(timerInput.value) || DEFAULT_TIMER;
    updateCountdown();
  }
};

const resumeAuto = () => {
  if (autoCheckbox.checked && window.autoPaused) {
    startAutoTimer();
    window.autoPaused = false;
    pausedIndicator.style.display = "none";
  }
};

const resetPause = () => {
  window.autoPaused = false;
  pausedIndicator.style.display = "none";
};

// DRY: Toggle pause/play logic
const togglePausePlay = () => {
  if (!autoCheckbox.checked) return;
  if (window.autoPaused) {
    resumeAuto();
    updateCountdown();
  } else {
    pauseAuto();
  }
};

// =========================
// Image Loading Logic
// =========================
const onImagesLoaded = () => {
  generateShuffleOrder();
  window.shuffleIndex = 0;
  updateImage();
  stopAutoTimer();
  resetPause();
  updateCountdown();
};

// =========================
// Event Listeners
// =========================
// Navigation
hitboxLeft.addEventListener("click", showPrev);
hitboxRight.addEventListener("click", showNext);

// Auto-advance toggle
autoCheckbox.addEventListener("change", () => {
  if (autoCheckbox.checked) {
    startAutoTimer();
  } else {
    stopAutoTimer();
    resetPause();
    window.countdownValue = parseInt(timerInput.value) || DEFAULT_TIMER;
    updateCountdown();
  }
});

timerInput.addEventListener("change", (e) => {
  window.timer = parseInt(e.target.value) || DEFAULT_TIMER;
  resetAutoTimer();
});

// Folder selection (Chromium browsers)
selectFolderBtn.addEventListener("click", async () => {
  if (!hasFileSystemAccess) return;
  try {
    const dirHandle = await window.showDirectoryPicker();
    const newImages = [];
    for await (const entry of dirHandle.values()) {
      if (
        entry.kind === "file" &&
        IMAGE_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))
      ) {
        const file = await entry.getFile();
        newImages.push(file);
      }
    }
    setImages(newImages);
  } catch (err) {
    console.error("Folder selection cancelled or failed", err);
  }
});

// File selection fallback (all browsers)
selectFilesBtn.addEventListener("click", () => {
  fileInput.value = "";
  fileInput.click();
});

// Handle file input change (user selects images)
fileInput.addEventListener("change", (e) => {
  const newImages = Array.from(e.target.files).filter((file) =>
    IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
  setImages(newImages);
});

// Toggle auto when clicking anywhere on the bottom bar except the timer input
bottomBar.addEventListener("click", (e) => {
  if (e.target === timerInputField) return;
  autoCheckbox.checked = !autoCheckbox.checked;
  autoCheckbox.dispatchEvent(new Event("change"));
});

// Pause/play is now handled by clicking the image itself
photo.addEventListener("click", togglePausePlay);

// Show/hide arrow icons on hitbox hover
hitboxLeft.addEventListener("mouseenter", () =>
  arrowLeft.classList.add("visible")
);
hitboxLeft.addEventListener("mouseleave", () =>
  arrowLeft.classList.remove("visible")
);
hitboxRight.addEventListener("mouseenter", () =>
  arrowRight.classList.add("visible")
);
hitboxRight.addEventListener("mouseleave", () =>
  arrowRight.classList.remove("visible")
);

// Keyboard navigation for left/right arrow keys and spacebar for pause/play
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    showPrev();
  } else if (e.key === "ArrowRight") {
    showNext();
  } else if (e.key === " " || e.key === "Spacebar") {
    togglePausePlay();
    e.preventDefault();
  }
});

// Ensure auto and timer are visually reset to default on page load
window.addEventListener("DOMContentLoaded", () => {
  autoCheckbox.checked = false;
  timerInput.value = DEFAULT_TIMER;
  updateCountdown();
});

// =========================
// Initialization
// =========================
// Show/hide UI elements based on browser capability
if (!hasFileSystemAccess) {
  selectFolderBtn.style.display = "none";
  selectFilesBtn.style.display = "";
  browserWarning.style.display = "";
  browserWarning.textContent =
    "Folder selection is only available in Chromium browsers (Chrome, Edge, etc.). You can still select multiple images manually.";
} else {
  selectFilesBtn.style.display = "none";
  browserWarning.style.display = "none";
}

// =========================
// Attach functions and state to window for testing and app access
// =========================
if (typeof window !== "undefined") {
  window.DEFAULT_TIMER = DEFAULT_TIMER;
  window.getCurrentImageIndex = getCurrentImageIndex;
  window.hideInfoMessages = hideInfoMessages;
  window.setImages = setImages;
  window.generateShuffleOrder = generateShuffleOrder;
  window.updateImage = updateImage;
  window.showNext = showNext;
  window.showPrev = showPrev;
  window.startAutoTimer = startAutoTimer;
  window.stopAutoTimer = stopAutoTimer;
  window.pauseAuto = pauseAuto;
  window.resumeAuto = resumeAuto;
  window.resetAutoTimer = resetAutoTimer;
  window.resetPause = resetPause;
  window.togglePausePlay = togglePausePlay;
  window.images = window.images;
  window.shuffleOrder = window.shuffleOrder;
  window.shuffleIndex = window.shuffleIndex;
  window.timer = window.timer;
  window.autoPaused = window.autoPaused;
}
