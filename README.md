# HEIC to JPG Converter

A simple website that converts HEIC/HEIF images to JPG in your browser. No server needed — everything runs locally.

## Features

- **Upload** — Drag & drop or click to add multiple HEIC/HEIF files
- **Convert** — Converts all files to JPG (client-side with heic2any)
- **Gallery** — View all converted images in a grid
- **Download All** — Download every converted image as one ZIP file
- **Download Selected** — Click images to select/deselect, then download only selected as ZIP

## How to run the server

1. Open a terminal in the project folder:
   ```bash
   cd heic-to-jpg-converter
   ```
2. Start a local server (pick one):

   **Option A — Node.js (recommended)**  
   ```bash
   npx serve .
   ```
   Then open the URL it prints, e.g. **http://localhost:3000**

   **Option B — Python 3**  
   ```bash
   python -m http.server 8000
   ```
   Then open **http://localhost:8000**

   **Option C — No server**  
   Double-click `index.html` to open it in your browser (some features may work better with a server).

**Note:** HEIC conversion works best in **Chrome** or **Edge**. Safari and Firefox support may vary.

## Preview

When you select multiple HEIC files, they are converted one by one. After conversion, **all images are shown as preview thumbnails** in a grid. You can see each converted JPG, click to select which ones to download, then use "Download Selected" or "Download All".

## Privacy

All conversion happens in your browser. Your files never leave your device.
