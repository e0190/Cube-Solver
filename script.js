const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const FACE_LABELS = {
    'U': 'Up Face (White Center Anchor)',
    'R': 'Right Face (Red Center Anchor)',
    'F': 'Front Face (Blue Center Anchor)',
    'D': 'Down Face (Yellow Center Anchor)',
    'L': 'Left Face (Orange Center Anchor)',
    'B': 'Back Face (Green Center Anchor)'
};

let currentFaceIdx = -1; // -1 means start application in hidden, uninitialized mode
let activeColor = 'U';
let solutionMoves = [];
let currentMoveIndex = 0;

// Internal data structures tracking face color assignments
// Starts with 'X' (unpainted dark state), but center blocks (index 4) get anchored right away to anchor layout orientation mapping rules
let cubeState = {};
FACES.forEach(f => {
    cubeState[f] = Array(9).fill('X');
    cubeState[f][4] = f; // Center anchors stay true to standard cube hardware
});

const gridEl = document.getElementById('cubeGrid');
const titleEl = document.getElementById('faceTitle');

function renderActiveFace() {
    gridEl.innerHTML = '';
    const activeFaceLetter = FACES[currentFaceIdx];
    
    // Update structural text title heading 
    titleEl.textContent = FACE_LABELS[activeFaceLetter];

    for (let i = 0; i < 9; i++) {
        const sticker = document.createElement('div');
        const colorCode = cubeState[activeFaceLetter][i];
        sticker.className = `sticker c-${colorCode}`;

        // Anchor block center guard rules mapping index element 4
        if (i === 4) {
            sticker.classList.add('center-lock');
        } else {
            sticker.addEventListener('click', () => {
                cubeState[activeFaceLetter][i] = activeColor;
                sticker.className = `sticker c-${activeColor}`;
            });
        }
        gridEl.appendChild(sticker);
    }
}

// Next Face visual animation sequence processor
document.getElementById('nextFaceBtn').addEventListener('click', () => {
    // Check if app is launching out of its initial hidden boot mode state
    if (currentFaceIdx === -1) {
        currentFaceIdx = 2; // Default launch pulls open Front (F) face directly
        gridEl.classList.remove('hidden');
        renderActiveFace();
        return;
    }

    // Run standard page-turn flip slide transition mechanics
    gridEl.classList.add('slide-out');

    setTimeout(() => {
        currentFaceIdx = (currentFaceIdx + 1) % FACES.length;
        renderActiveFace();
        
        gridEl.classList.remove('slide-out');
        gridEl.classList.add('slide-in');
        
        gridEl.offsetHeight; // Force DOM node rendering recalculation layout engine hack
        gridEl.classList.remove('slide-in');
    }, 250);
});

// Color Picker switch bindings
document.getElementById('palette').addEventListener('click', (e) => {
    if (e.target.classList.contains('palette-color')) {
        document.querySelector('.palette-color.selected').classList.remove('selected');
        e.target.classList.add('selected');
        activeColor = e.target.dataset.color;
    }
});

// --- Solve Request Math Engine Pipeline ---
Cube.initSolver();

document.getElementById('solveBtn').addEventListener('click', () => {
    let cubeString = '';
    
    // Loop mapping verification checks ensuring all values have been filled
    let incomplete = false;
    ['U', 'R', 'F', 'D', 'L', 'B'].forEach(f => {
        cubeString += cubeState[f].join('');
        if(cubeState[f].includes('X')) incomplete = true;
    });

    if (incomplete) {
        alert("Error: Incomplete Grid. You must click through and paint every square before running the solver engine!");
        return;
    }

    try {
        const solverInstance = Cube.fromString(cubeString);
        const rawMoves = solverInstance.solve();
        
        if (!rawMoves) {
            alert("The cube configuration matches a completed solved state already.");
            return;
        }

        solutionMoves = rawMoves.split(' ');
        currentMoveIndex = 0;
        document.getElementById('playerPanel').style.display = 'block';
        updatePlaybackDisplay();
    } catch (err) {
        alert("Invalid Layout Map Configuration. Verify your physical sticker coordinates don't contain mirrored duplicates or matching edge anomalies.");
    }
});

function updatePlaybackDisplay() {
    const total = solutionMoves.length;
    if (currentMoveIndex < total) {
        document.getElementById('stepStatus').textContent = `Step ${currentMoveIndex + 1} of ${total}`;
        document.getElementById('currentMove').textContent = solutionMoves[currentMoveIndex];
        document.getElementById('nextMoveBtn').disabled = false;
    } else {
        document.getElementById('stepStatus').textContent = `Complete!`;
        document.getElementById('currentMove').textContent = "Solved";
        document.getElementById('nextMoveBtn').disabled = true;
    }
    document.getElementById('prevMoveBtn').disabled = (currentMoveIndex === 0);
}

document.getElementById('nextMoveBtn').addEventListener('click', () => {
    if (currentMoveIndex >= solutionMoves.length) return;
    currentMoveIndex++;
    updatePlaybackDisplay();
});

document.getElementById('prevMoveBtn').addEventListener('click', () => {
    if (currentMoveIndex <= 0) return;
    currentMoveIndex--;
    updatePlaybackDisplay();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    FACES.forEach(f => {
        cubeState[f] = Array(9).fill('X');
        cubeState[f][4] = f;
    });
    document.getElementById('playerPanel').style.display = 'none';
    solutionMoves = [];
    currentMoveIndex = 0;
    currentFaceIdx = -1; // Reset back to hidden state
    titleEl.textContent = 'Click "Next Face" to Begin';
    gridEl.classList.add('hidden');
    gridEl.innerHTML = '';
});
