# GIF Creator

A web-based application for creating animated GIFs by recording your freehand drawings in real-time.

## Features

- **Freehand Drawing**: Draw on an HTML5 canvas with customizable brush size and color
- **Real-time Recording**: Automatically captures frames as you draw
- **Adjustable Capture Rate**: Control how often frames are captured (50-500ms)
- **Frame Preview**: View captured frames with the ability to delete unwanted ones
- **GIF Generation**: Combine frames into an animated GIF with configurable playback speed
- **Touch Support**: Works on touch devices

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for running local server)

### Running the Application

1. Open a terminal and navigate to the project folder:
   ```bash
   cd /path/to/gif-creator
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8080
   ```

3. Open your browser and go to:
   ```
   http://localhost:8080
   ```

## How to Use

### Recording a Drawing Animation

1. **Adjust Settings** (optional):
   - Set brush size using the slider
   - Pick a brush color using the color picker
   - Set capture interval (lower = smoother animation, more frames)

2. **Start Recording**:
   - Click the **"Start Recording"** button (it will turn green)
   - The canvas border will turn red to indicate recording is active

3. **Draw**:
   - Draw or write on the canvas
   - Frames are automatically captured at the set interval

4. **Stop Recording**:
   - Click **"Stop Recording"** when finished
   - You'll see the captured frames in the preview section

5. **Generate GIF**:
   - Adjust the frame delay if needed (controls playback speed)
   - Click **"Generate GIF"**
   - Wait for the progress to complete

6. **Save Your GIF**:
   - Click **"Open in New Tab"** to preview the animation in your browser
   - Click **"Download GIF"** to save the file
   - Right-click the preview and select "Save image as..." for an alternative download method

### Manual Frame Capture

If you prefer to capture frames manually:

1. Draw something on the canvas
2. Click **"Capture Frame"**
3. Click **"Clear Canvas"** to start the next frame
4. Repeat until you have all your frames
5. Generate and download the GIF

### Additional Controls

- **Clear Canvas**: Clears the drawing area
- **Undo Stroke**: Reverts the last stroke drawn
- **Delete Frame**: Click on any frame thumbnail to remove it

## Viewing GIFs on Mac

Mac's Preview app displays animated GIFs as separate pages instead of animating them. To view your GIF properly:

- **Option 1**: Right-click the file → Open With → Google Chrome
- **Option 2**: Drag the file into a browser window
- **Option 3**: Set Chrome as the default app for `.gif` files

## File Structure

```
gif-creator/
├── index.html      # Main HTML structure
├── style.css       # Styling
├── app.js          # Application logic
├── gif.worker.js   # GIF encoding worker
└── README.md       # This file
```

## Deploying to Cloudflare Pages

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Cloudflare account

### Deploy

1. Login to Cloudflare:
   ```bash
   wrangler login
   ```

2. Deploy the site:
   ```bash
   wrangler pages deploy ./
   ```

3. Follow the prompts to create a new project or deploy to an existing one.

Your site will be available at `https://gif-creator.pages.dev` (or your custom domain).

## Technologies Used

- HTML5 Canvas
- Vanilla JavaScript
- [gif.js](https://github.com/jnordberg/gif.js) - Client-side GIF encoding library
- CSS3

## Tips for Better GIFs

- Use a lower capture interval (50-100ms) for smoother animations
- Keep drawings simple for smaller file sizes
- Use a consistent drawing speed for even frame distribution
- The frame delay setting controls playback speed (lower = faster)
