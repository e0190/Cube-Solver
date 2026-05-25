const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

let currentOrientation = {
    top: 'U',
    left: 'F',
    right: 'R'
};

let activeColor = 'R'; 
let solutionMoves = [];
let currentMoveIndex = 0;

let cubeState = {};
FACES.forEach(f => {
    cubeState[f] = Array(9).fill('X');
});

function getIsometricPoints(face, row, col) {
    const size = 35;
    const gap = 2; 
    let u = (col - 1) * (size + gap);
    let v = (row - 1) * (size + gap);

    let pts = [];
    if (face === 'top') {
        let cx = (u - v) * Math.cos(Math.PI / 6);
        let cy = -60 + (u + v) * Math.sin(Math.PI / 6);
        pts = [[cx, cy], [cx + size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6)], [cx, cy + size * 2 * Math.sin(Math.PI / 6)], [cx - size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6)]];
    } else if (face === 'left') {
        let cx = -55 + (u * Math.cos(Math.PI / 6));
        let cy = 30 + (u * Math.sin(Math.PI / 6)) + (v * size);
        pts = [[cx, cy], [cx + size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6)], [cx + size * Math.cos(Math.PI / 6), cy + size * Math.sin(Math.PI / 6) + size], [cx, cy + size]];
    } else if (face === 'right') {
        let cx = 55 - (v * Math.cos(Math.PI / 6));
        let cy = 30 + (v * Math.sin(Math.PI / 6)) + (u * size);
        pts = [[cx, cy], [cx + size * Math.cos(Math.PI / 6), cy - size * Math.sin(Math.PI / 6)], [cx + size * Math.cos(Math.PI / 6), cy - size * Math.sin(Math.PI / 6) + size], [cx, cy + size]];
    }
    return pts.map(p => p.join(',')).join(' ');
}

function renderIsometricCubeView() {
    const views = [
        { id: 'top-face', logicalFace: currentOrientation.top, type: 'top' },
        { id: 'left-face', logicalFace: currentOrientation.left, type: 'left' },
        { id: 'right-face', logicalFace: currentOrientation.right, type: 'right' }
    ];

    views.forEach(view => {
        const container = document.getElementById(view.id);
        if (!container) return;
        container.innerHTML = '';

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const stateIdx = r * 3 + c;
                const currentColor = cubeState[view.logicalFace][stateIdx];

                poly.setAttribute('points', getIsometricPoints(view.type, r, c));
                poly.className.baseVal = `c-${currentColor}`;

                poly.addEventListener('click', () => {
                    cubeState[view.logicalFace][stateIdx] = activeColor;
                    poly.className.baseVal = `c-${activeColor}`;
                });

                container.appendChild(poly);
            }
        }
    });
}

document.getElementById('rotLeftBtn').addEventListener('click', () => {
    const oldLeft = currentOrientation.left;
    currentOrientation.left = currentOrientation.right;
    if (oldLeft === 'F') currentOrientation.right = 'B';
    else if (oldLeft === 'R') currentOrientation.right = 'L';
    else if (oldLeft === 'B') currentOrientation.right = 'F';
    else if (oldLeft === 'L') currentOrientation.right = 'R';
    renderIsometricCubeView();
});

document.getElementById('rotRightBtn').addEventListener('click', () => {
    const oldRight = currentOrientation.right;
    currentOrientation.right = currentOrientation.left;
    if (oldRight === 'R') currentOrientation.left = 'B';
    else if (oldRight === 'B') currentOrientation.left = 'L';
    else if (oldRight === 'L') currentOrientation.left = 'F';
    else if (oldRight === 'F') currentOrientation.left = 'R';
    renderIsometricCubeView();
});

document.getElementById('rotUpBtn').addEventListener('click', () => {
    const oldTop = currentOrientation.top;
    currentOrientation.top = currentOrientation.left;
    currentOrientation.left = (oldTop === 'U') ? 'D' : 'U';
    renderIsometricCubeView();
});

document.querySelector('.palette-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('color-block')) {
        const selectedEl = document.querySelector('.color-block.selected');
        if (selectedEl) selectedEl.classList.remove('selected');
        e.target.classList.add('selected');
        activeColor = e.target.dataset.color;
    }
});

// Initialize client-side brain logic tool
Cube.initSolver();

document.getElementById('solveBtn').addEventListener('click', () => {
    // 1. Audit check to make sure the user filled in all 54 stickers across all orientations
    let unpaintedTilesFound = false;
    FACES.forEach(f => { 
        if (cubeState[f].includes('X')) unpaintedTilesFound = true; 
    });

    if (unpaintedTilesFound) {
        alert("Error: Look over all sides using the arrow buttons and paint all 54 tiles completely before clicking Solve!");
        return;
    }

    // 2. Identify center tile assignments to establish system orientation map definitions
    let centerMappingTable = {};
    FACES.forEach(f => {
        centerMappingTable[f] = cubeState[f][4];
    });

    // 3. Prevent duplicate center mapping errors
    let assignedCenterColors = Object.values(centerMappingTable);
    let uniqueCentersCheck = new Set(assignedCenterColors);
    if (uniqueCentersCheck.size !== 6) {
        alert("Error: Every single face must have a unique center color block! Make sure you didn't paint the same color in the center of two different sides.");
        return;
    }

    // 4. Construct reverse mapping configuration pairs
    let reverseLookup = {};
    for (let systemFace in centerMappingTable) {
        reverseLookup[centerMappingTable[systemFace]] = systemFace;
    }

    // 5. Build Kociemba standard definition string matrix paths
    let compiledFormulaString = '';
    FACES.forEach(f => {
        for (let i = 0; i < 9; i++) {
            let selectedColorToken = cubeState[f][i];
            compiledFormulaString += reverseLookup[selectedColorToken] || 'U';
        }
    });

    try {
        const solverInstance = Cube.fromString(compiledFormulaString);
        const rawMoves = solverInstance.solve();

        if (!rawMoves) {
            alert("The cube is already completely solved!");
            return;
        }

        solutionMoves = rawMoves.split(' ');
        currentMoveIndex = 0;
        document.getElementById('playerPanel').style.display = 'block';
        updatePlaybackDisplay();
    } catch (err) {
        alert("Error: Invalid physical cube scramble configuration! This layout has impossible corner or edge pairings (e.g. a corner with two identical colors, or pieces flipped in a way a real cube cannot do). Check your colors and try again.");
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
    FACES.forEach(f => cubeState[f] = Array(9).fill('X'));
    document.getElementById('playerPanel').style.display = 'none';
    solutionMoves = [];
    currentMoveIndex = 0;
    currentOrientation = { top: 'U', left: 'F', right: 'R' };
    renderIsometricCubeView();
});

renderIsometricCubeView();
