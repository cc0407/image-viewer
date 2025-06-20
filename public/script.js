// Default timer value (seconds)
const DEFAULT_TIMER = 3;

// List of loaded image File objects
let images = [];
// Index of the currently displayed image
let currentIndex = 0;
// Shuffle mode toggle
let shuffle = false;
// Timer interval (seconds) for shuffle mode
let timer = DEFAULT_TIMER;
// Shuffle order and index for shuffle navigation
let shuffleOrder = [];
let shuffleIndex = 0;
// Reference to the shuffle timer interval
let shuffleInterval = null;

// Auto-advance toggle and timer
const autoCheckbox = document.getElementById("auto");
let autoPaused = false;

// DOM elements
const photo = document.getElementById("photo");
const shuffleCheckbox = document.getElementById("shuffle");
const timerInput = document.getElementById("timer");
const selectFolderBtn = document.getElementById("select-folder");
const selectFilesBtn = document.getElementById("select-files");
const fileInput = document.getElementById("file-input");
const browserWarning = document.getElementById("browser-warning");
const pausedIndicator = document.getElementById("paused-indicator");

// New hitbox elements
const hitboxLeft = document.getElementById("hitbox-left");
const hitboxRight = document.getElementById("hitbox-right");

// Supported image file extensions
const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

// Helper: Get the current image index based on shuffle order
const getCurrentImageIndex = () => shuffleOrder[shuffleIndex] ?? 0;

// Helper: Set and sort images, then handle post-load logic
const setImages = (newImages) => {
  images = newImages.slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  hideInfoMessages();
  onImagesLoaded();
};

// Generate a new random shuffle order
const generateShuffleOrder = () => {
  shuffleOrder = images.map((_, i) => i);
  for (let i = shuffleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
  }
  shuffleIndex = 0;
};

// Display the current image in the viewer
const updateImage = () => {
  if (images.length === 0) {
    photo.src = "";
    photo.alt = "No images found.";
    return;
  }
  const file = images[getCurrentImageIndex()];
  photo.src = URL.createObjectURL(file);
  photo.alt = file.name;
};

// Show the next image in shuffle order
const showNext = () => {
  shuffleIndex = (shuffleIndex + 1) % shuffleOrder.length;
  updateImage();
  resetAutoTimer();
};

// Show the previous image in shuffle order
const showPrev = () => {
  shuffleIndex = (shuffleIndex - 1 + shuffleOrder.length) % shuffleOrder.length;
  updateImage();
  resetAutoTimer();
};

const countdownSpan = document.getElementById("countdown");
let countdownValue = timer;
let countdownInterval = null;

// Update the countdown display
const updateCountdown = () => {
  countdownSpan.textContent = `(${countdownValue}s)`;
  if (autoCheckbox.checked && !autoPaused) {
    countdownSpan.classList.remove("invisible");
  } else {
    countdownSpan.classList.add("invisible");
  }
};

// Start the auto-advance timer and countdown
const startAutoTimer = () => {
  if (shuffleInterval) clearInterval(shuffleInterval);
  if (countdownInterval) clearInterval(countdownInterval);
  countdownValue = timer;
  updateCountdown();
  countdownInterval = setInterval(() => {
    if (autoCheckbox.checked && !autoPaused) {
      countdownValue--;
      updateCountdown();
      if (countdownValue <= 0) {
        countdownValue = timer;
      }
    }
  }, 1000);
  shuffleInterval = setInterval(() => {
    if (shuffleIndex === shuffleOrder.length - 1) {
      generateShuffleOrder();
      updateImage();
    } else {
      showNext();
    }
    countdownValue = timer;
    updateCountdown();
  }, timer * 1000);
};

// Stop the auto-advance timer and countdown
const stopAutoTimer = () => {
  if (shuffleInterval) clearInterval(shuffleInterval);
  shuffleInterval = null;
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
  countdownValue = parseInt(timerInput.value) || DEFAULT_TIMER;
  updateCountdown();
};

// Reset and restart the auto-advance timer and countdown if auto is enabled
const resetAutoTimer = () => {
  if (autoCheckbox.checked && !autoPaused) {
    startAutoTimer();
  } else {
    updateCountdown();
  }
};

// Pause auto-advance and show indicator
const pauseAuto = () => {
  if (autoCheckbox.checked && !autoPaused) {
    stopAutoTimer();
    autoPaused = true;
    pausedIndicator.style.display = "";
    countdownValue = parseInt(timerInput.value) || DEFAULT_TIMER;
    updateCountdown();
  }
};
// Resume auto-advance and hide indicator
const resumeAuto = () => {
  if (autoCheckbox.checked && autoPaused) {
    startAutoTimer();
    autoPaused = false;
    pausedIndicator.style.display = "none";
  }
};
// Hide paused indicator and reset pause state
const resetPause = () => {
  autoPaused = false;
  pausedIndicator.style.display = "none";
};

// Navigation and auto/timer event listeners for hitboxes
hitboxLeft.addEventListener("click", showPrev);
hitboxRight.addEventListener("click", showNext);

autoCheckbox.addEventListener("change", (e) => {
  if (autoCheckbox.checked) {
    startAutoTimer();
  } else {
    stopAutoTimer();
    resetPause();
    countdownValue = parseInt(timerInput.value) || DEFAULT_TIMER;
    updateCountdown();
  }
});

timerInput.addEventListener("change", (e) => {
  timer = parseInt(e.target.value) || DEFAULT_TIMER;
  resetAutoTimer();
});

// Detect if the browser supports the File System Access API (for folder selection)
const hasFileSystemAccess = "showDirectoryPicker" in window;

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

// Hide the top bar (select buttons and info messages) after selection
const hideInfoMessages = () => {
  document.getElementById("top-bar").style.display = "none";
};

// Folder selection (Chromium browsers)
selectFolderBtn.addEventListener("click", async () => {
  if (!hasFileSystemAccess) return;
  try {
    const dirHandle = await window.showDirectoryPicker();
    const newImages = [];
    for await (const entry of dirHandle.values()) {
      if (
        entry.kind === "file" &&
        imageExtensions.some((ext) => entry.name.toLowerCase().endsWith(ext))
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
    imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
  setImages(newImages);
});

// When new images are loaded, always generate shuffle order and start at the first image
const onImagesLoaded = () => {
  generateShuffleOrder();
  shuffleIndex = 0;
  updateImage();
  stopAutoTimer();
  resetPause();
  updateCountdown();
};

const bottomBar = document.getElementById("bottom-bar");
const timerInputField = document.getElementById("timer");

// Toggle auto when clicking anywhere on the bottom bar except the timer input
bottomBar.addEventListener("click", (e) => {
  if (e.target === timerInputField) return;
  autoCheckbox.checked = !autoCheckbox.checked;
  autoCheckbox.dispatchEvent(new Event("change"));
});

// DRY: Toggle pause/play logic
function togglePausePlay() {
  if (!autoCheckbox.checked) return;
  if (autoPaused) {
    resumeAuto();
    updateCountdown();
  } else {
    pauseAuto();
  }
}

// Pause/play is now handled by clicking the image itself
photo.addEventListener("click", togglePausePlay);

const arrowLeft = document.getElementById("arrow-left");
const arrowRight = document.getElementById("arrow-right");

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
