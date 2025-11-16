// script.js — patched to ensure the Play Sound button appears styled and enabled when solved

// Global error handlers
window.addEventListener('error', e => console.error('Window error:', e.error || e.message, e.filename + ':' + e.lineno));
window.addEventListener('unhandledrejection', e => console.error('Unhandled rejection:', e.reason));

// Maximum width to display the puzzle/preview (prevents huge images)
const MAX_DISPLAY_WIDTH = 600;

function startPuzzle(gridSize, imageSrc) {
    const container = document.getElementById("puzzle-container");
    const status = document.getElementById("status");
    container.innerHTML = ""; // clear previous puzzle
    if (status) status.textContent = "";

    // Hide the play button whenever a new puzzle starts (support both ids)
    let playBtn = document.getElementById("playButton") || document.getElementById("play-sound");
    if (playBtn) {
        // normalize id to expected one
        playBtn.id = "play-sound";

        // Remove generic class that may override the intended play-button style
        playBtn.classList.remove('size-button');

        // Apply robust inline styles so it appears as the orange action button
        playBtn.style.display = "none"; // hidden until solved
        playBtn.style.backgroundColor = "#ff9800";
        playBtn.style.color = "#ffffff";
        playBtn.style.border = "none";
        playBtn.style.padding = "12px 20px";
        playBtn.style.fontSize = "18px";
        playBtn.style.fontWeight = "700";
        playBtn.style.borderRadius = "8px";
        playBtn.style.cursor = "pointer";
        playBtn.style.opacity = "0.6"; // visually disabled until solved
        playBtn.disabled = true; // ensure disabled until solved
        // Ensure label
        if (!playBtn.textContent.trim()) playBtn.textContent = "Play Sound";
    } else {
        // Create play button if it doesn't exist
        playBtn = document.createElement('button');
        playBtn.id = 'play-sound';
        playBtn.textContent = 'Play Sound';
        playBtn.style.display = 'none';
        playBtn.style.backgroundColor = "#ff9800";
        playBtn.style.color = "#ffffff";
        playBtn.style.border = "none";
        playBtn.style.padding = "12px 20px";
        playBtn.style.fontSize = "18px";
        playBtn.style.fontWeight = "700";
        playBtn.style.borderRadius = "8px";
        playBtn.style.cursor = "pointer";
        playBtn.style.opacity = "0.6";
        playBtn.disabled = true;
        playBtn.onclick = () => document.getElementById('puzzleSound')?.play();
        // append after puzzle container
        container.parentNode.insertBefore(playBtn, container.nextSibling);
    }

    // Ensure hint is present and visible
    let hint = document.getElementById('puzzleHint');
    if (!hint) {
        hint = document.createElement('p');
        hint.id = 'puzzleHint';
        hint.className = 'hint';
        hint.textContent = 'Solve this puzzle to play the sound';
        const learning = document.querySelector('#learning-center .content-section') || document.body;
        learning.insertBefore(hint, container);
    } else {
        hint.style.display = 'block';
        hint.textContent = 'Solve this puzzle to play the sound';
    }

    // Make Start buttons match your CSS (if they exist)
    const controlButtons = document.querySelectorAll('.controls button, #size-selector button');
    controlButtons.forEach(btn => {
        btn.classList.add('size-button');
    });

    // Ensure preview img exists (create if missing)
    let preview = document.getElementById('puzzle-preview');
    let wrapper = document.getElementById('preview-wrapper');
    if (!preview) {
        wrapper = document.createElement('div');
        wrapper.id = 'preview-wrapper';
        preview = document.createElement('img');
        preview.id = 'puzzle-preview';
        preview.alt = 'Puzzle guide preview';
        wrapper.appendChild(preview);
        // insert preview above the container
        container.parentNode.insertBefore(wrapper, container);
    }

    // Make sure preview is visible and styled (inline styles to override any CSS hiding)
    preview.style.display = 'block';
    preview.style.maxWidth = MAX_DISPLAY_WIDTH + 'px';
    preview.style.width = '100%';
    preview.style.height = 'auto';
    preview.style.margin = '10px auto';
    preview.style.border = '2px dashed rgba(0,0,0,0.08)';
    preview.style.borderRadius = '6px';
    preview.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';

    // Helper to attempt to load the preview and show informative error
    function loadPreview(url) {
        console.log('Trying preview:', url);
        preview.src = url;
        preview.onload = () => {
            console.log('Preview loaded:', url);
            if (status) status.textContent = '';
            preview.style.display = 'block';
        };
        preview.onerror = () => {
            console.warn('Preview failed to load:', url);
            if (status) {
                status.textContent = `Preview image not found: "${url}". Check file name, extension, and that the file is in the same folder as this HTML page (case-sensitive).`;
            }
            preview.style.display = 'none';
        };
    }

    // Try the exact filename first (user indicated puzzle.jpg / puzzle2.png / puzzle3.png)
    loadPreview(imageSrc);

    // Create main high-res image used to slice for tiles
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
        console.log('Image loaded for slicing:', imageSrc, img.naturalWidth, img.naturalHeight);

        // Determine scaling so the puzzle fits the MAX_DISPLAY_WIDTH
        const scale = Math.min(1, MAX_DISPLAY_WIDTH / img.naturalWidth);
        const displayWidth = Math.floor(img.naturalWidth * scale);
        const displayHeight = Math.floor(img.naturalHeight * scale);

        // Source tile size (from full-resolution image)
        const srcTileW = img.naturalWidth / gridSize;
        const srcTileH = img.naturalHeight / gridSize;

        // Destination tile size (on-screen)
        const tileWidth = Math.floor(displayWidth / gridSize);
        const tileHeight = Math.floor(displayHeight / gridSize);

        // Build correct order (strings like "0-0", "1-0")
        let correctOrder = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                correctOrder.push(`${x}-${y}`);
            }
        }

        // Shuffle and ensure we don't accidentally start solved
        let currentOrder;
        do {
            currentOrder = [...correctOrder].sort(() => Math.random() - 0.5);
        } while (arraysEqual(currentOrder, correctOrder));

        // Size container to the display dimensions
        container.style.position = "relative";
        container.style.width = displayWidth + "px";
        container.style.height = displayHeight + "px";
        container.style.border = "5px solid #a1887f";
        container.classList.add('puzzle-board');

        // Create tiles (draw scaled slices so tiles match preview)
        currentOrder.forEach((pos, index) => {
            let [sx, sy] = pos.split("-").map(Number);

            const tile = document.createElement("canvas");

            // For crispness on HiDPI screens, consider devicePixelRatio
            const ratio = window.devicePixelRatio || 1;
            tile.width = tileWidth * ratio;
            tile.height = tileHeight * ratio;
            tile.style.width = tileWidth + "px";
            tile.style.height = tileHeight + "px";

            tile.classList.add("tile");
            tile.draggable = true;

            let ctx = tile.getContext("2d");
            // scale drawing to account for ratio
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

            // draw the corresponding slice from the full-resolution source, scaled into tile size
            ctx.drawImage(
                img,
                sx * srcTileW,    // source x
                sy * srcTileH,    // source y
                srcTileW,         // source width
                srcTileH,         // source height
                0, 0,             // dest x,y
                tileWidth,        // dest width
                tileHeight        // dest height
            );

            // Metadata for tile
            tile.dataset.correct = pos;      // which piece (sx-sy) this tile contains
            tile.dataset.index = index.toString(); // its current slot index (0..N*N-1)

            // Position on the board (based on current shuffled index)
            tile.style.position = "absolute";
            tile.style.left = (index % gridSize) * tileWidth + "px";
            tile.style.top = Math.floor(index / gridSize) * tileHeight + "px";
            tile.style.border = "1px solid rgba(0,0,0,0.1)";
            tile.style.boxSizing = "border-box";
            tile.style.cursor = "grab";

            attachDragHandlers(tile, container, tileWidth, tileHeight);
            container.appendChild(tile);
        });

        // Quick check in case shuffle somehow placed all correctly
        checkIfCorrect(container, tileWidth, tileHeight);
    };

    img.onerror = (e) => {
        console.error('Failed to load image for slicing:', imageSrc, e);
        if (status) status.textContent = 'Error: could not load puzzle image: ' + imageSrc + '. Check the path or run a local server.';
    };
}

// Helper to compare arrays (simple shallow)
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

function attachDragHandlers(tile, container, tileWidth, tileHeight) {
    tile.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", tile.dataset.index);
        try {
            e.dataTransfer.setDragImage(tile, tile.width / 2, tile.height / 2);
        } catch (err) { /* ignore */ }
        setTimeout(() => tile.classList.add("dragging"), 0);
    });

    tile.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
    });

    tile.addEventListener("dragover", (e) => e.preventDefault());

    tile.addEventListener("drop", (e) => {
        e.preventDefault();

        const targetTile = e.target.closest('.tile');
        if (!targetTile) return;

        const fromIndex = e.dataTransfer.getData("text/plain");
        const toIndex = targetTile.dataset.index;

        if (fromIndex === toIndex) return;

        const fromTile = container.querySelector(`[data-index="${fromIndex}"]`);
        const toTile = container.querySelector(`[data-index="${toIndex}"]`);

        if (fromTile && toTile) {
            swapTiles(fromTile, toTile);
            checkIfCorrect(container, tileWidth, tileHeight);
        } else {
            console.warn('Could not find tiles to swap:', fromIndex, toIndex);
        }
    });
}

function swapTiles(tileA, tileB) {
    // swap visual positions
    const tmpLeft = tileA.style.left;
    const tmpTop = tileA.style.top;

    tileA.style.left = tileB.style.left;
    tileA.style.top = tileB.style.top;

    tileB.style.left = tmpLeft;
    tileB.style.top = tmpTop;

    // swap indices
    const tmpIndex = tileA.dataset.index;
    tileA.dataset.index = tileB.dataset.index;
    tileB.dataset.index = tmpIndex;
}

function checkIfCorrect(container, tileWidth, tileHeight) {
    const tiles = [...container.querySelectorAll('.tile')];
    let solved = true;

    for (let tile of tiles) {
        const left = parseFloat(tile.style.left || 0);
        const top = parseFloat(tile.style.top || 0);
        const currentX = Math.round(left / tileWidth);
        const currentY = Math.round(top / tileHeight);

        const [correctX, correctY] = tile.dataset.correct.split("-").map(Number);
        if (correctX !== currentX || correctY !== currentY) {
            solved = false;
            break;
        }
    }

    const playBtn = document.getElementById("play-sound") || document.getElementById("playButton");
    if (playBtn) {
        if (solved) {
            playBtn.style.display = "inline-block";
            playBtn.disabled = false;
            playBtn.style.opacity = "1";
            playBtn.style.cursor = "pointer";
            // ensure it's visible and focused for keyboard users
            playBtn.setAttribute('aria-disabled', 'false');
        } else {
            playBtn.style.display = "none";
            playBtn.disabled = true;
            playBtn.style.opacity = "0.6";
            playBtn.style.cursor = "default";
            playBtn.setAttribute('aria-disabled', 'true');
        }
    }

    if (solved) {
        container.style.border = "5px solid #4CAF50";
        console.log('Puzzle solved!');
    } else {
        container.style.border = "5px solid #a1887f";
    }
}