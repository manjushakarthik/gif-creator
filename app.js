// DOM Elements
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brushColorInput = document.getElementById('brushColor');
const captureFrameBtn = document.getElementById('captureFrame');
const clearCanvasBtn = document.getElementById('clearCanvas');
const undoStrokeBtn = document.getElementById('undoStroke');
const framesContainer = document.getElementById('framesContainer');
const frameCountSpan = document.getElementById('frameCount');
const frameDelayInput = document.getElementById('frameDelay');
const frameDelayValue = document.getElementById('frameDelayValue');
const generateGifBtn = document.getElementById('generateGif');
const downloadGifBtn = document.getElementById('downloadGif');
const previewSection = document.getElementById('previewSection');
const gifPreview = document.getElementById('gifPreview');
const statusMessage = document.getElementById('statusMessage');
const recordBtn = document.getElementById('recordBtn');
const openGifBtn = document.getElementById('openGif');
const captureIntervalInput = document.getElementById('captureInterval');
const captureIntervalValue = document.getElementById('captureIntervalValue');
const recordingControls = document.querySelector('.recording-controls');

// State
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let frames = [];
let generatedGifBlob = null;
let strokeHistory = [];
let currentStroke = null;

// Recording state
let isRecording = false;
let recordingInterval = null;

// Initialize canvas with white background
function initCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveCanvasState();
}

// Save canvas state for undo
function saveCanvasState() {
    strokeHistory.push(canvas.toDataURL());
    if (strokeHistory.length > 50) {
        strokeHistory.shift();
    }
}

// Get mouse/touch position relative to canvas
function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Drawing functions
function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPosition(e);
    lastX = pos.x;
    lastY = pos.y;
    currentStroke = canvas.toDataURL();
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const pos = getPosition(e);

    ctx.strokeStyle = brushColorInput.value;
    ctx.lineWidth = brushSizeInput.value;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing(e) {
    if (isDrawing && currentStroke) {
        strokeHistory.push(currentStroke);
        if (strokeHistory.length > 50) {
            strokeHistory.shift();
        }
        currentStroke = null;
    }
    isDrawing = false;
}

// Undo last stroke
function undoLastStroke() {
    if (strokeHistory.length > 1) {
        strokeHistory.pop();
        const previousState = strokeHistory[strokeHistory.length - 1];
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = previousState;
        showStatus('Stroke undone', 'info');
    } else {
        showStatus('Nothing to undo', 'info');
    }
}

// Clear canvas
function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
    showStatus('Canvas cleared', 'info');
}

// Capture current canvas as frame (silent mode for recording)
function captureFrame(silent = false) {
    const frameData = canvas.toDataURL('image/png');
    frames.push(frameData);
    updateFramesDisplay();
    if (!silent) {
        showStatus(`Frame ${frames.length} captured!`, 'success');
    }
}

// Start/Stop Recording
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    // Clear previous frames
    frames = [];
    updateFramesDisplay();

    isRecording = true;
    recordBtn.textContent = 'Stop Recording';
    recordBtn.classList.add('recording');
    recordingControls.classList.add('is-recording');
    canvas.classList.add('recording');

    // Disable interval slider during recording
    captureIntervalInput.disabled = true;

    const interval = parseInt(captureIntervalInput.value);

    // Capture first frame immediately
    captureFrame(true);

    // Set up interval for capturing frames
    recordingInterval = setInterval(() => {
        captureFrame(true);
    }, interval);

    // Sync frame delay with capture interval for smooth playback
    frameDelayInput.value = interval;
    frameDelayValue.textContent = interval;

    showStatus('Recording started! Draw on the canvas...', 'info');
}

function stopRecording() {
    isRecording = false;
    recordBtn.textContent = 'Start Recording';
    recordBtn.classList.remove('recording');
    recordingControls.classList.remove('is-recording');
    canvas.classList.remove('recording');

    // Re-enable interval slider
    captureIntervalInput.disabled = false;

    if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
    }

    showStatus(`Recording stopped! ${frames.length} frames captured.`, 'success');
}

// Update frames display
function updateFramesDisplay() {
    framesContainer.innerHTML = '';
    frameCountSpan.textContent = frames.length;

    // Only show last 20 thumbnails to avoid performance issues
    const displayFrames = frames.slice(-20);
    const startIndex = Math.max(0, frames.length - 20);

    displayFrames.forEach((frame, i) => {
        const index = startIndex + i;
        const thumbnail = document.createElement('div');
        thumbnail.className = 'frame-thumbnail';
        thumbnail.innerHTML = `
            <img src="${frame}" alt="Frame ${index + 1}">
            <span class="frame-number">${index + 1}</span>
            <div class="delete-hint">×</div>
        `;
        thumbnail.onclick = () => deleteFrame(index);
        framesContainer.appendChild(thumbnail);
    });

    if (frames.length > 20) {
        const notice = document.createElement('div');
        notice.style.cssText = 'padding: 10px; color: #666; font-size: 0.8rem;';
        notice.textContent = `Showing last 20 of ${frames.length} frames`;
        framesContainer.prepend(notice);
    }

    // Reset generated GIF when frames change
    if (generatedGifBlob) {
        generatedGifBlob = null;
        downloadGifBtn.disabled = true;
        openGifBtn.disabled = true;
        previewSection.style.display = 'none';
    }
}

// Delete a frame
function deleteFrame(index) {
    frames.splice(index, 1);
    updateFramesDisplay();
    showStatus(`Frame ${index + 1} deleted`, 'info');
}

// Generate GIF
function generateGif() {
    if (frames.length < 2) {
        showStatus('Please capture at least 2 frames to create a GIF', 'error');
        return;
    }

    showStatus('Generating GIF...', 'info');
    generateGifBtn.disabled = true;

    if (typeof GIF === 'undefined') {
        showStatus('Error: GIF library failed to load.', 'error');
        generateGifBtn.disabled = false;
        return;
    }

    let gif;
    try {
        gif = new GIF({
            workers: 2,
            quality: 10,
            width: canvas.width,
            height: canvas.height,
            workerScript: './gif.worker.js'
        });
    } catch (err) {
        showStatus('Error creating GIF: ' + err.message, 'error');
        generateGifBtn.disabled = false;
        return;
    }

    const delay = parseInt(frameDelayInput.value);
    let loadedImages = 0;
    const images = [];

    frames.forEach((frameData, index) => {
        const img = new Image();
        img.onload = function() {
            images[index] = img;
            loadedImages++;

            if (loadedImages === frames.length) {
                images.forEach((image) => {
                    gif.addFrame(image, { delay: delay });
                });
                gif.render();
            }
        };
        img.src = frameData;
    });

    gif.on('finished', function(blob) {
        generatedGifBlob = blob;
        const url = URL.createObjectURL(blob);
        gifPreview.src = url;
        previewSection.style.display = 'block';
        downloadGifBtn.disabled = false;
        openGifBtn.disabled = false;
        generateGifBtn.disabled = false;
        showStatus('GIF generated successfully!', 'success');
    });

    gif.on('progress', function(p) {
        showStatus(`Generating GIF... ${Math.round(p * 100)}%`, 'info');
    });

    gif.on('error', function(err) {
        showStatus('Error generating GIF: ' + err, 'error');
        generateGifBtn.disabled = false;
    });
}

// Download GIF
function downloadGif() {
    if (!generatedGifBlob) {
        showStatus('Please generate a GIF first', 'error');
        return;
    }

    // Convert blob to base64 data URL for reliable download
    const reader = new FileReader();
    reader.onload = function() {
        const dataUrl = reader.result;

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'animation.gif';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showStatus('GIF downloaded!', 'success');
    };
    reader.onerror = function() {
        showStatus('Error downloading GIF', 'error');
    };
    reader.readAsDataURL(generatedGifBlob);
}

// Open GIF in new tab (to verify it works)
function openGifInNewTab() {
    if (!generatedGifBlob) {
        showStatus('Please generate a GIF first', 'error');
        return;
    }

    const url = URL.createObjectURL(generatedGifBlob);
    window.open(url, '_blank');
    showStatus('GIF opened in new tab', 'info');
}

// Show status message
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (statusMessage.textContent === message) {
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
            }
        }, 3000);
    }
}

// Event listeners for range inputs
brushSizeInput.addEventListener('input', () => {
    brushSizeValue.textContent = brushSizeInput.value;
});

frameDelayInput.addEventListener('input', () => {
    frameDelayValue.textContent = frameDelayInput.value;
});

captureIntervalInput.addEventListener('input', () => {
    captureIntervalValue.textContent = captureIntervalInput.value;
});

// Mouse events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// Button events
captureFrameBtn.addEventListener('click', () => captureFrame(false));
clearCanvasBtn.addEventListener('click', clearCanvas);
undoStrokeBtn.addEventListener('click', undoLastStroke);
generateGifBtn.addEventListener('click', generateGif);
downloadGifBtn.addEventListener('click', downloadGif);
openGifBtn.addEventListener('click', openGifInNewTab);
recordBtn.addEventListener('click', toggleRecording);

// Initialize
initCanvas();
