# Shuffler Photo Viewer

A modern, browser-based photo viewer inspired by Windows Photo Viewer, featuring shuffle, auto-advance, and timer controls. Select a folder or multiple images from your computer and enjoy seamless, privacy-friendly image browsing with keyboard and mouse navigation.

## Features

- Select a folder or multiple images (no upload required)
- Shuffle/random order viewing (always uses a random order, never repeats until all images are shown)
- Auto-advance with customizable timer
- Pause/play with a click on the image or spacebar
- Keyboard navigation (←/→ arrows for previous/next, spacebar for pause/play)
- Live countdown timer in the UI
- Responsive, immersive fullscreen UI
- 100% frontend: your images never leave your device

## Requirements

- [Node.js](https://nodejs.org/) (for serving the frontend)

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/cc0407/image-viewer.git
   cd image-viewer
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
   (Installs Express for static file serving)

## Usage

1. **Start the server:**
   ```sh
   node server.js
   ```
2. **Open your browser and go to:**
   [http://localhost:3000](http://localhost:3000)
3. **Click "Select Folder"** (or "Select Images" in Firefox) and choose your images.
4. Use the left/right hitboxes or arrow keys to navigate, or click the image/spacebar to pause/play auto-advance.
5. Adjust the timer and toggle "Auto" for slideshow mode.

## Browser Support

- Folder selection uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), supported in:
  - Chrome (v86+)
  - Edge (v86+)
  - Opera, Brave, and other Chromium browsers
- Not supported in Firefox or Safari as of 2024 (but you can select multiple images manually).

## License

MIT License
