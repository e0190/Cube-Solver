// Map ordering sequence arrays matching standard solver library configurations
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const FACE_LABELS = {
    'U': 'Up Face (White Center)',
    'R': 'Right Face (Red Center)',
    'F': 'Front Face (Blue Center)',
    'D': 'Down Face (Yellow Center)',
    'L': 'Left Face (Orange Center)',
    'B': 'Back Face (Green Center)'
};

let currentFaceIdx = 2; // Start on Front (F) face by default
let activeColor = 'U';
let solutionMoves = [];
let currentMoveIndex = 0;

// Internal multidimensional data map layout tracking paints
let cubeState = {};
FACES.forEach(f => cubeState[f] = Array(9).fill(f));

const gridEl = document.getElementById('cubeGrid');
const titleEl = document.getElementById('faceTitle');

// Render the 3x3 square grid matrix
function renderActiveFace() {
    gridEl.innerHTML = '';
    const activeFaceLetter = FACES[currentFaceIdx];
    
    // Update structural text title
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

// Next Face slide handler sequence loops
document.getElementById('nextFaceBtn').addEventListener('click', () => {
    // Add slide-out visual transform animation
    gridEl.classList.add('slide-out');

    setTimeout(() => {
        // Cycle face target pointer
        currentFaceIdx = (currentFaceIdx + 1) % FACES.length;
        renderActiveFace();
        
        // Snap element to opposite side seamlessly for incoming slide placement 
        gridEl.classList.remove('slide-out');
        gridEl.classList.add('slide-in');
        
        // Force layout repaint trigger boundary recalculation
        gridEl.offsetHeight; 
        
        // Remove slide-in constraints allowing standard position resets
        gridEl.classList.remove('slide-in');
    }, 250);
});

// Color Picker tool switch links
document.getElementById('palette').addEventListener('click', (e) => {
    if (e.target.classList.contains('palette-color')) {
        document.querySelector('.palette-color.selected').classList.remove('selected');
        e.target.classList.add('selected');
        activeColor = e.target.dataset.color;
    }
});

// --- Solve Compute Request Engine Pipelines ---
Cube.initSolver();

document.getElementById('solveBtn').addEventListener('click', () => {
    let cubeString = '';
    // Concat layout configuration maps matching sequence structures order parsed by library
    ['U', 'R', 'F', 'D', 'L', 'B'].forEach(f => {
        cubeString += cubeState[f].join('');
    });

    try {
        const solverInstance = Cube.fromString(cubeString);
        const rawMoves = solverInstance.solve();
        
        if (!rawMoves) {
            alert("The cube is already fully solved!");
            return;
        }

        solutionMoves = rawMoves.split(' ');
        currentMoveIndex = 0;
        document.getElementById('playerPanel').style.display = 'block';
        updatePlaybackDisplay();
    } catch (err) {
        alert("Invalid Layout. Make sure your color counts match a real physical configuration map (e.g., check for cloned corners or edge conflicts) and try again.");
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
    FACES.forEach(f => cubeState[f] = Array(9).fill(f));
    document.getElementById('playerPanel').style.display = 'none';
    solutionMoves = [];
    currentMoveIndex = 0;
    currentFaceIdx = 2; // Jump back to Front
    renderActiveFace();
});

// Initial boot initialization script run lifecycle link
renderActiveFace();
