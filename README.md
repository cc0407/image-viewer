# Shuffler Photo Viewer

A simple, modern web-based photo viewer inspired by Windows Photo Viewer, with shuffle and timer features. Select any folder from your computer and view images with left/right navigation or automatic shuffle mode.

## Features

- Select any folder from your computer to view images (no upload required)
- Left/Right navigation (like Windows Photo Viewer)
- Shuffle mode: automatically cycles through all images in random order
- Timer: set how long each image is displayed in shuffle mode
- Responsive, clean UI
- 100% frontend: your images never leave your device

## Requirements

- [Node.js](https://nodejs.org/) (for serving the frontend)
- Chromium-based browser (Chrome, Edge, Brave, etc.) for folder access support

## Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd shuffler
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
3. **Click "Select Folder"** and choose a folder containing images (jpg, png, gif, bmp, webp).
4. Use the left/right buttons or enable shuffle mode with a timer.

## Browser Support

- The folder selection feature uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), which is supported in:
  - Chrome (v86+)
  - Edge (v86+)
  - Opera, Brave, and other Chromium browsers
- Not supported in Firefox or Safari as of 2024.

## License

MIT License
