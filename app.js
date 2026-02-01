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

// Stroke mode DOM elements (will be initialized after DOM loads)
let strokeModeToggle, strokeModeControls, strokeListContainer;
let strokeCountSpan, generateFromStrokesBtn, previewStrokesBtn, clearStrokesBtn;
let interStrokePauseInput, interStrokePauseValue, finalHoldInput, finalHoldValue;
let pointsPerFrameInput, pointsPerFrameValue;
let characterNameInput, downloadBundleBtn;

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

// Stroke mode state
let isStrokeMode = false;
let strokes = [];  // Array of stroke objects
let currentStrokeData = null;  // Current stroke being recorded
let strokeStartTime = null;

// Stroke data structure:
// {
//   strokeNumber: number,
//   points: [{x, y, timestamp}],
//   color: string,
//   brushSize: number,
//   startTime: number,
//   endTime: number
// }

// Initialize canvas with white background
function initCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveCanvasState();
    initStrokeModeElements();
}

// Initialize stroke mode DOM elements
function initStrokeModeElements() {
    strokeModeToggle = document.getElementById('strokeModeToggle');
    strokeModeControls = document.getElementById('strokeModeControls');
    clearStrokesBtn = document.getElementById('clearStrokesBtn');
    strokeListContainer = document.getElementById('strokeListContainer');
    strokeCountSpan = document.getElementById('strokeCount');
    generateFromStrokesBtn = document.getElementById('generateFromStrokes');
    previewStrokesBtn = document.getElementById('previewStrokes');
    interStrokePauseInput = document.getElementById('interStrokePause');
    interStrokePauseValue = document.getElementById('interStrokePauseValue');
    finalHoldInput = document.getElementById('finalHold');
    finalHoldValue = document.getElementById('finalHoldValue');
    pointsPerFrameInput = document.getElementById('pointsPerFrame');
    pointsPerFrameValue = document.getElementById('pointsPerFrameValue');
    characterNameInput = document.getElementById('characterName');
    downloadBundleBtn = document.getElementById('downloadBundle');

    // Add event listeners for stroke mode controls
    if (strokeModeToggle) {
        strokeModeToggle.addEventListener('change', toggleStrokeMode);
    }
    if (clearStrokesBtn) {
        clearStrokesBtn.addEventListener('click', clearStrokes);
    }
    if (generateFromStrokesBtn) {
        generateFromStrokesBtn.addEventListener('click', generateGifFromStrokes);
    }
    if (previewStrokesBtn) {
        previewStrokesBtn.addEventListener('click', previewStrokeAnimation);
    }
    if (interStrokePauseInput) {
        interStrokePauseInput.addEventListener('input', () => {
            interStrokePauseValue.textContent = interStrokePauseInput.value;
        });
    }
    if (finalHoldInput) {
        finalHoldInput.addEventListener('input', () => {
            finalHoldValue.textContent = finalHoldInput.value;
        });
    }
    if (pointsPerFrameInput) {
        pointsPerFrameInput.addEventListener('input', () => {
            pointsPerFrameValue.textContent = pointsPerFrameInput.value;
        });
    }
    if (downloadBundleBtn) {
        downloadBundleBtn.addEventListener('click', downloadBundle);
    }
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

    // In stroke mode, start recording stroke data
    if (isStrokeMode) {
        strokeStartTime = performance.now();
        currentStrokeData = {
            strokeNumber: strokes.length + 1,
            points: [{
                x: pos.x,
                y: pos.y,
                timestamp: 0
            }],
            color: brushColorInput.value,
            brushSize: parseInt(brushSizeInput.value),
            startTime: strokeStartTime,
            endTime: null
        };
    }
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

    // In stroke mode, record point data
    if (isStrokeMode && currentStrokeData) {
        currentStrokeData.points.push({
            x: pos.x,
            y: pos.y,
            timestamp: performance.now() - strokeStartTime
        });
    }
}

function stopDrawing(e) {
    if (isDrawing && currentStroke) {
        strokeHistory.push(currentStroke);
        if (strokeHistory.length > 50) {
            strokeHistory.shift();
        }
        currentStroke = null;
    }

    // In stroke mode, finalize the current stroke data
    if (isDrawing && isStrokeMode && currentStrokeData && currentStrokeData.points.length > 1) {
        currentStrokeData.endTime = performance.now();
        strokes.push(currentStrokeData);
        currentStrokeData = null;
        updateStrokesList();
        showStatus(`Stroke ${strokes.length} recorded (${strokes[strokes.length - 1].points.length} points)`, 'success');
    }

    isDrawing = false;
}

// ============= STROKE MODE FUNCTIONS =============

// Toggle stroke mode on/off
function toggleStrokeMode() {
    isStrokeMode = strokeModeToggle.checked;

    if (isStrokeMode) {
        strokeModeControls.style.display = 'block';
        recordingControls.style.display = 'none';
        document.querySelector('.action-buttons').style.display = 'none';
        canvas.classList.add('stroke-mode');
        clearStrokes();
        showStatus('Stroke mode enabled. Draw each stroke separately.', 'info');
    } else {
        strokeModeControls.style.display = 'none';
        recordingControls.style.display = 'flex';
        document.querySelector('.action-buttons').style.display = 'flex';
        canvas.classList.remove('stroke-mode');
        showStatus('Stroke mode disabled', 'info');
    }
}

// Clear all recorded strokes
function clearStrokes() {
    strokes = [];
    currentStrokeData = null;
    generatedGifBlob = null;
    frames = [];
    updateStrokesList();
    updateFramesDisplay();
    clearCanvas();

    // Disable download button
    if (downloadBundleBtn) {
        downloadBundleBtn.disabled = true;
    }
    previewSection.style.display = 'none';

    showStatus('All strokes cleared', 'info');
}

// Delete a specific stroke
function deleteStroke(index) {
    strokes.splice(index, 1);
    // Renumber remaining strokes
    strokes.forEach((stroke, i) => {
        stroke.strokeNumber = i + 1;
    });
    redrawAllStrokes();
    updateStrokesList();
    showStatus(`Stroke deleted. ${strokes.length} strokes remaining.`, 'info');
}

// Redraw all strokes on canvas
function redrawAllStrokes() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
        drawStrokeOnCanvas(stroke);
    });
}

// Draw a single stroke on the canvas
function drawStrokeOnCanvas(stroke) {
    if (stroke.points.length < 2) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
}

// Update the strokes list display
function updateStrokesList() {
    if (!strokeListContainer) return;

    strokeListContainer.innerHTML = '';
    strokeCountSpan.textContent = strokes.length;

    if (strokes.length === 0) {
        strokeListContainer.innerHTML = '<div class="no-strokes">No strokes recorded yet. Draw on the canvas.</div>';
        return;
    }

    strokes.forEach((stroke, index) => {
        const strokeItem = document.createElement('div');
        strokeItem.className = 'stroke-item';
        strokeItem.innerHTML = `
            <span class="stroke-number">${index + 1}</span>
            <span class="stroke-info">${stroke.points.length} pts</span>
            <span class="stroke-color" style="background-color: ${stroke.color}"></span>
            <button class="stroke-delete" onclick="deleteStroke(${index})">×</button>
        `;
        strokeListContainer.appendChild(strokeItem);
    });
}

// Interpolate points for smoother animation
function interpolatePoints(points, targetPointsPerSegment = 3) {
    if (points.length < 2) return points;

    const interpolated = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        interpolated.push(p1);

        // Add intermediate points
        for (let j = 1; j < targetPointsPerSegment; j++) {
            const t = j / targetPointsPerSegment;
            interpolated.push({
                x: p1.x + (p2.x - p1.x) * t,
                y: p1.y + (p2.y - p1.y) * t,
                timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t
            });
        }
    }
    interpolated.push(points[points.length - 1]);

    return interpolated;
}

// Generate frames from stroke data for progressive animation
function generateFramesFromStrokes() {
    const frameInterval = parseInt(frameDelayInput.value);
    const interStrokePause = parseInt(interStrokePauseInput?.value || 200);
    const finalHold = parseInt(finalHoldInput?.value || 800);
    const pointsPerFrame = parseInt(pointsPerFrameInput?.value || 5);

    frames = [];

    // Create a temporary canvas for frame generation
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Start with white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Capture initial empty frame
    frames.push(tempCanvas.toDataURL('image/png'));

    // Process each stroke
    strokes.forEach((stroke, strokeIndex) => {
        const points = stroke.points;

        tempCtx.strokeStyle = stroke.color;
        tempCtx.lineWidth = stroke.brushSize;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';

        // Draw stroke progressively
        for (let i = 0; i < points.length; i += pointsPerFrame) {
            const endIndex = Math.min(i + pointsPerFrame, points.length);

            // Draw segment
            if (i > 0 || strokeIndex > 0) {
                tempCtx.beginPath();
                const startIdx = Math.max(0, i - 1);
                tempCtx.moveTo(points[startIdx].x, points[startIdx].y);

                for (let j = i; j < endIndex; j++) {
                    tempCtx.lineTo(points[j].x, points[j].y);
                }
                tempCtx.stroke();
            } else if (points.length > 1) {
                // First segment of first stroke
                tempCtx.beginPath();
                tempCtx.moveTo(points[0].x, points[0].y);
                for (let j = 1; j < endIndex; j++) {
                    tempCtx.lineTo(points[j].x, points[j].y);
                }
                tempCtx.stroke();
            }

            // Capture frame
            frames.push(tempCanvas.toDataURL('image/png'));
        }

        // Add inter-stroke pause frames (show completed stroke)
        if (strokeIndex < strokes.length - 1) {
            const pauseFrames = Math.ceil(interStrokePause / frameInterval);
            for (let p = 0; p < pauseFrames; p++) {
                frames.push(tempCanvas.toDataURL('image/png'));
            }
        }
    });

    // Add final hold frames
    const holdFrames = Math.ceil(finalHold / frameInterval);
    const finalFrame = tempCanvas.toDataURL('image/png');
    for (let h = 0; h < holdFrames; h++) {
        frames.push(finalFrame);
    }

    return frames;
}

// Generate GIF from recorded strokes
function generateGifFromStrokes() {
    if (strokes.length === 0) {
        showStatus('Please record at least one stroke first', 'error');
        return;
    }

    showStatus('Generating frames from strokes...', 'info');

    // Generate frames from stroke data
    generateFramesFromStrokes();
    updateFramesDisplay();

    showStatus(`Generated ${frames.length} frames. Click "Generate GIF" to create the animation.`, 'success');

    // Automatically trigger GIF generation
    setTimeout(() => {
        generateGif();
    }, 100);
}

// Preview stroke animation without generating GIF
let previewAnimationId = null;

function previewStrokeAnimation() {
    if (strokes.length === 0) {
        showStatus('Please record at least one stroke first', 'error');
        return;
    }

    // Cancel any existing preview
    if (previewAnimationId) {
        cancelAnimationFrame(previewAnimationId);
        previewAnimationId = null;
    }

    showStatus('Playing stroke preview...', 'info');

    const frameInterval = parseInt(frameDelayInput.value);
    const interStrokePause = parseInt(interStrokePauseInput?.value || 200);
    const pointsPerFrame = parseInt(pointsPerFrameInput?.value || 5);

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentStrokeIndex = 0;
    let currentPointIndex = 0;
    let isPausing = false;
    let pauseEndTime = 0;

    function animatePreview() {
        const now = performance.now();

        if (isPausing) {
            if (now >= pauseEndTime) {
                isPausing = false;
            }
            previewAnimationId = requestAnimationFrame(animatePreview);
            return;
        }

        if (currentStrokeIndex >= strokes.length) {
            showStatus('Preview complete!', 'success');
            previewAnimationId = null;
            return;
        }

        const stroke = strokes[currentStrokeIndex];
        const points = stroke.points;

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw next segment
        const endIndex = Math.min(currentPointIndex + pointsPerFrame, points.length);

        if (currentPointIndex < points.length - 1) {
            ctx.beginPath();
            ctx.moveTo(points[Math.max(0, currentPointIndex - 1)].x,
                       points[Math.max(0, currentPointIndex - 1)].y);

            for (let j = currentPointIndex; j < endIndex; j++) {
                ctx.lineTo(points[j].x, points[j].y);
            }
            ctx.stroke();
        }

        currentPointIndex = endIndex;

        // Check if stroke is complete
        if (currentPointIndex >= points.length) {
            currentStrokeIndex++;
            currentPointIndex = 0;

            // Add pause between strokes
            if (currentStrokeIndex < strokes.length) {
                isPausing = true;
                pauseEndTime = now + interStrokePause;
            }
        }

        previewAnimationId = requestAnimationFrame(animatePreview);
    }

    // Start animation with frame interval timing
    let lastFrameTime = 0;
    function timedAnimate(timestamp) {
        if (timestamp - lastFrameTime >= frameInterval) {
            lastFrameTime = timestamp;
            animatePreview();
        }
        if (previewAnimationId !== null && currentStrokeIndex < strokes.length) {
            previewAnimationId = requestAnimationFrame(timedAnimate);
        }
    }

    previewAnimationId = requestAnimationFrame(timedAnimate);
}

// Generate metadata JSON for Telugu app integration
function generateMetadata() {
    const characterName = characterNameInput?.value || 'unknown';

    // Simplify stroke paths by sampling points (reduce file size)
    const simplifyPoints = (points, maxPoints = 50) => {
        if (points.length <= maxPoints) {
            return points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
        }
        const step = Math.floor(points.length / maxPoints);
        const simplified = [];
        for (let i = 0; i < points.length; i += step) {
            simplified.push({ x: Math.round(points[i].x), y: Math.round(points[i].y) });
        }
        // Always include last point
        const last = points[points.length - 1];
        simplified.push({ x: Math.round(last.x), y: Math.round(last.y) });
        return simplified;
    };

    return {
        character: characterName,
        canvas_width: canvas.width,
        canvas_height: canvas.height,
        frame_rate: Math.round(1000 / parseInt(frameDelayInput.value)),
        frame_delay_ms: parseInt(frameDelayInput.value),
        created_at: new Date().toISOString(),
        total_frames: frames.length,
        stroke_count: strokes.length,
        strokes: strokes.map((stroke, index) => ({
            stroke_number: index + 1,
            point_count: stroke.points.length,
            color: stroke.color,
            brush_size: stroke.brushSize,
            duration_ms: Math.round(stroke.endTime - stroke.startTime),
            // Include simplified path for Telugu app comparison
            path: simplifyPoints(stroke.points)
        })),
        settings: {
            inter_stroke_pause_ms: parseInt(interStrokePauseInput?.value || 200),
            final_hold_ms: parseInt(finalHoldInput?.value || 800),
            points_per_frame: parseInt(pointsPerFrameInput?.value || 5)
        }
    };
}

// Download ZIP bundle with GIF and metadata
async function downloadBundle() {
    if (!generatedGifBlob) {
        showStatus('Please generate a GIF first', 'error');
        return;
    }

    if (typeof JSZip === 'undefined') {
        showStatus('Error: JSZip library not loaded', 'error');
        return;
    }

    showStatus('Creating ZIP bundle...', 'info');

    const characterName = characterNameInput?.value.trim() || 'character';
    const metadata = generateMetadata();
    const jsonStr = JSON.stringify(metadata, null, 2);

    try {
        const zip = new JSZip();

        // Add GIF to zip
        zip.file(`${characterName}.gif`, generatedGifBlob);

        // Add metadata JSON to zip
        zip.file(`${characterName}_metadata.json`, jsonStr);

        // Generate ZIP blob
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        // Download ZIP
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${characterName}_bundle.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showStatus('ZIP bundle downloaded!', 'success');
    } catch (err) {
        showStatus('Error creating ZIP: ' + err.message, 'error');
    }
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

        // Enable ZIP download button in stroke mode
        if (isStrokeMode && downloadBundleBtn) {
            downloadBundleBtn.disabled = false;
        }

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

    // Determine filename based on mode
    let filename = 'animation.gif';
    if (isStrokeMode && characterNameInput && characterNameInput.value.trim()) {
        filename = `${characterNameInput.value.trim()}.gif`;
    }

    // Convert blob to base64 data URL for reliable download
    const reader = new FileReader();
    reader.onload = function() {
        const dataUrl = reader.result;

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;

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
