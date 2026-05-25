// Mathematical face orientation arrays
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

// Map structural orientation pointers tracking what face is currently viewed top/left/right
let currentOrientation = {
    top: 'U',
    left: 'F',
    right: 'R'
};

let activeColor = 'R'; // Default selected color match
let solutionMoves = [];
let currentMoveIndex = 0;

// Initialize all 54 stickers as completely blank ('X') unpainted slate pieces
let cubeState = {};
FACES.forEach(f => {
    cubeState[f] = Array(9).fill('X');
});

// Coordinate matrices building our isometric 2D perspective views
function getIsometricPoints(face, row, col) {
    const size = 32;
    const gap = 1.1; // Grid layout separation index offset
    
    // Shift index calculation weights to space elements outward cleanly
    let u = (col - 1) * size * gap;
    let v = (row - 1) * size * gap;

    let pts = [];
    if (face === 'top') {
        // Top Face skew lines mapping logic
        let cx = (u - v) * Math.cos(Math.PI / 6);
        let cy = -size - 16 + (u + v) * Math.sin(Math.PI / 6);
        pts = [
            [cx, cy],
            [cx + size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6)],
            [cx, cy + size * 2 * Math.sin(Math.PI / 6)],
            [cx - size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6)]
        ];
    } else if (face === 'left') {
        // Left Face skewed polygon map vectors
        let cx = -size * Math.cos(Math.PI / 6) + (u - v) * Math.cos(Math.PI / 6);
        let cy = (u + v) * Math.sin(Math.PI / 6) + v * size * 0.15; 
        pts = [
            [cx, cy],
            [cx + size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6)],
            [cx + size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6) + size],
            [cx, cy + size]
        ];
    } else if (face === 'right') {
        // Right Face skewed polygon vectors
        let cx = (u - v) * Math.cos(Math.PI / 6);
        let cy = size * Math.sin(Math.PI / 6) + (u + v) * Math.sin(Math.PI / 6) + u * size * 0.15;
        pts = [
            [cx, cy],
            [cx + size * Math.cos(Math.PI / 6), cy - size * Math.sin(Math.PI / 6)],
            [cx + size * Math.cos(Math.PI / 6), cy - size * Math.sin(Math.PI / 6) + size],
            [cx, cy + size]
        ];
    }
    return pts.map(p => p.join(',')).join(' ');
}

// Map logical square indexes inside our grid structure to flat UI rendering coordinates
function getCubeStateIndex(faceName, row, col) {
    return row * 3 + col;
}

// Build the isometric SVG layers dynamically on screen
function renderIsometricCubeView() {
    const views = [
        { id: 'top-face', logicalFace: currentOrientation.top, type: 'top' },
        { id: 'left-face', logicalFace: currentOrientation.left, type: 'left' },
        { id: 'right-face', logicalFace: currentOrientation.right, type: 'right' }
    ];

    views.forEach(view => {
        const container = document.getElementById(view.id);
        container.innerHTML = '';

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const stateIdx = getCubeStateIndex(view.logicalFace, r, c);
                const currentColor = cubeState[view.logicalFace][stateIdx];

                poly.setAttribute('points', getIsometricPoints(view.type, r, c));
                poly.className.baseVal = `c-${currentColor}`;

                // Painting action handler link bound directly to the polygon shapes
                poly.addEventListener('click', () => {
                    cubeState[view.logicalFace][stateIdx] = activeColor;
                    poly.className.baseVal = `c-${activeColor}`;
                });

                container.appendChild(poly);
            }
        }
    });
}

// --- Navigation Spin Engine Map Loops ---
// Map orientation adjustments when clicking arrows to spin views safely
document.getElementById('rotLeftBtn').addEventListener('click', () => {
    // Spin left layout shifts
    const oldLeft = currentOrientation.left;
    currentOrientation.left = currentOrientation.right;
    
    // Deduce opposing face logic paths mapping standard positions layout configurations
    if (oldLeft === 'F') currentOrientation.right = 'B';
    else if (oldLeft === 'R') currentOrientation.right = 'L';
    else if (oldLeft === 'B') currentOrientation.right = 'F';
    else if (oldLeft === 'L') currentOrientation.right = 'R';

    renderIsometricCubeView();
    triggerSpinEffect('left-face');
});

document.getElementById('rotRightBtn').addEventListener('click', () => {
    // Spin right layout shifts
    const oldRight = currentOrientation.right;
    currentOrientation.right = currentOrientation.left;

    if (oldRight === 'R') currentOrientation.left = 'B';
    else if (oldRight === 'B') currentOrientation.left = 'L';
    else if (oldRight === '?.') currentOrientation.left = 'F'; // Default safety fallback
    else if (oldRight === 'F') currentOrientation.left = 'R';
    else currentOrientation.left = 'F';

    renderIsometricCubeView();
    triggerSpinEffect('right-face');
});

document.getElementById('rotUpBtn').addEventListener('click', () => {
    // Flip cube upward to view the down face structural profiles
    const oldTop = currentOrientation.top;
    currentOrientation.top = currentOrientation.left;
    currentOrientation.left = (oldTop === 'U') ? 'D' : 'U';
    
    renderIsometricCubeView();
    triggerSpinEffect('top-face');
});

function triggerSpinEffect(groupId) {
    const target = document.getElementById(groupId);
    target.style.transform = 'scale(0.95)';
    setTimeout(() => { target.style.transform = 'none'; }, 150);
}

// Palette bar handling
document.querySelector('.palette-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('color-block')) {
        document.querySelector('.color-block.selected').classList.remove('selected');
        e.target.classList.add('selected');
        activeColor = e.target.dataset.color;
    }
});

// --- Mathematical Structural Grid Parsing Solver Engine ---
Cube.initSolver();

document.getElementById('solveBtn').addEventListener('click', () => {
    // Deduce which colors match which face by sampling centers dynamically
    let userCenterMap = {};
    FACES.forEach(f => {
        userCenterMap[f] = cubeState[f][4];
    });

    let incomplete = false;
    FACES.forEach(f => {
        if (cubeState[f].includes('X')) incomplete = true;
    });

    if (incomplete) {
        alert("Error: Please look over every side by spinning your view and paint all 54 squares!");
        return;
    }

    let centerColors = Object.values(userCenterMap);
    let uniqueCenters = new Set(centerColors);
    if (uniqueCenters.size !== 6 || centerColors.includes('X')) {
        alert("Error: Each side center piece must contain a totally unique color to serve as an orientation anchor mapping vector!");
        return;
    }

    let reverseLookup = {};
    for (let targetFace in userCenterMap) {
        reverseLookup[userCenterMap[targetFace]] = targetFace;
    }

    let compiledFormulaString = '';
    FACES.forEach(f => {
        for (let i = 0; i < 9; i++) {
            compiledFormulaString += reverseLookup[cubeState[f][i]] || 'U';
        }
    });

    try {
        const solverInstance = Cube.fromString(compiledFormulaString);
        const rawMoves = solverInstance.solve();
        
        if (!rawMoves) {
            alert("The puzzle is already sorted!");
            return;
        }

        solutionMoves = rawMoves.split(' ');
        currentMoveIndex = 0;
        document.getElementById('playerPanel').style.display = 'block';
        updatePlaybackDisplay();
    } catch (err) {
        alert("Invalid Grid Map Setup. Confirm that edge borders match adjacent spaces on opposing faces accurately.");
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
    });
    document.getElementById('playerPanel').style.display = 'none';
    solutionMoves = [];
    currentMoveIndex = 0;
    currentOrientation = { top: 'U', left: 'F', right: 'R' };
    renderIsometricCubeView();
});

// App Launch Initializer Lifecycle
renderIsometricCubeView();
