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

// --- Serverless Communication Handler Endpoint Link ---
document.getElementById('solveBtn').addEventListener('click', async () => {
    let userCenterMap = {};
    FACES.forEach(f => userCenterMap[f] = cubeState[f][4]);

    let incomplete = false;
    FACES.forEach(f => { if (cubeState[f].includes('X')) incomplete = true; });

    if (incomplete) {
        alert("Error: Rotate your view angles and fill out all 54 fields completely.");
        return;
    }

    let reverseLookup = {};
    for (let targetFace in userCenterMap) {
        reverseLookup[userCenterMap[targetFace]] = targetFace.toLowerCase();
    }

    let compiledFormulaString = '';
    FACES.forEach(f => {
        for (let i = 0; i < 9; i++) {
            compiledFormulaString += reverseLookup[cubeState[f][i]] || 'u';
        }
    });

    try {
        // Point fetch directly to your serverless endpoint file location path
        const response = await fetch('/api/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cube: compiledFormulaString })
        });

        const result = await response.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        solutionMoves = result.moves;
        if (solutionMoves.length === 0) {
            alert("The grid parameters are already fully solved!");
            return;
        }

        currentMoveIndex = 0;
        document.getElementById('playerPanel').style.display = 'block';
        updatePlaybackDisplay();
    } catch (err) {
        alert("Serverless infrastructure computation runtime routing failure.");
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
