// Map sequence structural order arrays matching standard mathematical algorithm structures
const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
const COLOR_MAP = {
    'U': 0xffffff, 'R': 0xb71234, 'F': 0x0046ad,
    'D': 0xffd500, 'L': 0xff5800, 'B': 0x009b48
};
const INTERNAL_BLACK = 0x151517;

// Fixed camera matrix vectors for snapping directly to faces
const FACE_VIEWS = [
    { name: 'U', pos: [0, 7, 0.1] },  // Top Face
    { name: 'F', pos: [0, 0, 7] },    // Front Face
    { name: 'R', pos: [7, 0, 0] },    // Right Face
    { name: 'B', pos: [0, 0, -7] },   // Back Face
    { name: 'L', pos: [-7, 0, 0] },   // Left Face
    { name: 'D', pos: [0, -7, 0.1] }  // Bottom Face
];
let currentViewIdx = 1; // Default viewport targeting Front face initialization bounds

let activeColor = 'U';
let solutionMoves = [];
let currentMoveIndex = 0;
let isAnimating = false;

// Generate structural data tracker maps initializing standard clean matrix layouts
let cubeState = {};
FACE_NAMES.forEach(f => cubeState[f] = Array(9).fill(f));

// --- Three.js Setup Pipeline Configuration ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111113);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(...FACE_VIEWS[currentViewIdx].pos);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

const cubeGroup = new THREE.Group();
scene.add(cubeGroup);
let stickerMeshes = [];

// Method constructing block matrix geometric layers dynamically
function buildCube3D() {
    stickerMeshes.forEach(s => scene.remove(s));
    while(cubeGroup.children.length > 0){ cubeGroup.remove(cubeGroup.children[0]); }
    stickerMeshes = [];

    const size = 0.96;
    const offset = 1.0;

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const cubieGeo = new THREE.BoxGeometry(size, size, size);
                const cubieMat = new THREE.MeshLambertMaterial({ color: INTERNAL_BLACK });
                const cubieMesh = new THREE.Mesh(cubieGeo, cubieMat);
                cubieMesh.position.set(x * offset, y * offset, z * offset);
                cubeGroup.add(cubieMesh);

                // Inject dynamic face parameters mapping structural index keys natively
                if (y === 1)  createSticker(cubieMesh, new THREE.Vector3(0, size/2 + 0.01, 0), new THREE.Euler(-Math.PI/2, 0, 0), 'U', (x + 1) + (1 - z) * 3);
                if (y === -1) createSticker(cubieMesh, new THREE.Vector3(0, -size/2 - 0.01, 0), new THREE.Euler(Math.PI/2, 0, 0), 'D', (x + 1) + (z + 1) * 3);
                if (z === 1)  createSticker(cubieMesh, new THREE.Vector3(0, 0, size/2 + 0.01), new THREE.Euler(0, 0, 0), 'F', (x + 1) + (1 - y) * 3);
                if (z === -1) createSticker(cubieMesh, new THREE.Vector3(0, 0, -size/2 - 0.01), new THREE.Euler(0, Math.PI, 0), 'B', (1 - x) + (1 - y) * 3);
                if (x === -1) createSticker(cubieMesh, new THREE.Vector3(-size/2 - 0.01, 0, 0), new THREE.Euler(0, -Math.PI/2, 0), 'L', (z + 1) + (1 - y) * 3);
                if (x === 1)  createSticker(cubieMesh, new THREE.Vector3(size/2 + 0.01, 0, 0), new THREE.Euler(0, Math.PI/2, 0), 'R', (1 - z) + (1 - y) * 3);
            }
        }
    }
}

function createSticker(parent, position, rotation, faceName, index) {
    const stickerGeo = new THREE.PlaneGeometry(0.82, 0.82);
    const colorVal = COLOR_MAP[cubeState[faceName][index]];
    const stickerMat = new THREE.MeshLambertMaterial({ color: colorVal, side: THREE.DoubleSide });
    const stickerMesh = new THREE.Mesh(stickerGeo, stickerMat);
    stickerMesh.position.copy(position);
    stickerMesh.rotation.copy(rotation);
    stickerMesh.userData = { faceName: faceName, index: index };
    parent.add(stickerMesh);
    stickerMeshes.push(stickerMesh);
}

// --- Interaction Control Routines ---
document.getElementById('palette').addEventListener('click', (e) => {
    if (e.target.classList.contains('palette-color')) {
        document.querySelector('.palette-color.selected').classList.remove('selected');
        e.target.classList.add('selected');
        activeColor = e.target.dataset.color;
    }
});

// Next Face View Loop Snap Trigger
document.getElementById('snapFaceBtn').addEventListener('click', () => {
    currentViewIdx = (currentViewIdx + 1) % FACE_VIEWS.length;
    const targetView = FACE_VIEWS[currentViewIdx];
    camera.position.set(...targetView.pos);
    controls.target.set(0,0,0);
});

// Setup Click/Touch Object Detection via Raycasting logic links
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

container.addEventListener('pointerdown', (e) => {
    if (isAnimating) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stickerMeshes);

    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        if (data.index === 4) return; // Keep anchor middle hardware blocks locked tightly 
        cubeState[data.faceName][data.index] = activeColor;
        intersects[0].object.material.color.setHex(COLOR_MAP[activeColor]);
    }
});

// --- Mathematical Algorithm Execution Layer ---
Cube.initSolver();

document.getElementById('solveBtn').addEventListener('click', () => {
    let cubeString = '';
    ['U', 'R', 'F', 'D', 'L', 'B'].forEach(f => { cubeString += cubeState[f].join(''); });

    try {
        const solverInstance = Cube.fromString(cubeString);
        const rawMoves = solverInstance.solve();
        if (!rawMoves) { alert("The cube is already solved!"); return; }
        solutionMoves = rawMoves.split(' ');
        currentMoveIndex = 0;
        document.getElementById('playerPanel').style.display = 'block';
        updatePlaybackDisplay();
    } catch (err) {
        alert("Invalid Cube Layout Configuration. Please look over each side wall and check for matching parity setups.");
    }
});

function updatePlaybackDisplay() {
    const total = solutionMoves.length;
    if(currentMoveIndex < total) {
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
    if (isAnimating || currentMoveIndex >= solutionMoves.length) return;
    animateTurn(solutionMoves[currentMoveIndex], false, () => {
        currentMoveIndex++;
        updatePlaybackDisplay();
    });
});

document.getElementById('prevMoveBtn').addEventListener('click', () => {
    if (isAnimating || currentMoveIndex <= 0) return;
    currentMoveIndex--;
    animateTurn(solutionMoves[currentMoveIndex], true, () => { updatePlaybackDisplay(); });
});

// --- Core Physics Matrix Rotation Motor ---
function animateTurn(moveNotation, inverseFlag, callback) {
    isAnimating = true;
    const baseFace = moveNotation[0];
    let isDouble = moveNotation.includes('2');
    let isPrime = moveNotation.includes("'");
    if (inverseFlag && !isDouble) isPrime = !isPrime;

    let axis = new THREE.Vector3(0, 1, 0);
    let targetCoordVal = 0;

    if (baseFace === 'U') { axis.set(0, 1, 0); targetCoordVal = 1.0; }
    if (baseFace === 'D') { axis.set(0, -1, 0); targetCoordVal = -1.0; }
    if (baseFace === 'R') { axis.set(1, 0, 0); targetCoordVal = 1.0; }
    if (baseFace === 'L') { axis.set(-1, 0, 0); targetCoordVal = -1.0; }
    if (baseFace === 'F') { axis.set(0, 0, 1); targetCoordVal = 1.0; }
    if (baseFace === 'B') { axis.set(0, 0, -1); targetCoordVal = -1.0; }

    const dynamicPivotGroup = new THREE.Group();
    scene.add(dynamicPivotGroup);

    const activeChildren = [...cubeGroup.children];
    activeChildren.forEach(cubie => {
        let posCheck = 0;
        if (baseFace === 'U' || baseFace === 'D') posCheck = cubie.position.y;
        if (baseFace === 'R' || baseFace === 'L') posCheck = cubie.position.x;
        if (baseFace === 'F' || baseFace === 'B') posCheck = cubie.position.z;
        if (Math.abs(posCheck - targetCoordVal) < 0.2) dynamicPivotGroup.attach(cubie);
    });

    let targetAngle = isPrime ? Math.PI / 2 : -Math.PI / 2;
    if (isDouble) targetAngle = Math.PI;

    let currentAngleStep = 0;
    const speed = 0.1; // Turning speed acceleration frame step configurations

    function runFrame() {
        if (Math.abs(currentAngleStep) < Math.abs(targetAngle)) {
            let step = (targetAngle > 0 ? speed : -speed);
            if (Math.abs(currentAngleStep + step) > Math.abs(targetAngle)) step = targetAngle - currentAngleStep;
            dynamicPivotGroup.rotateOnAxis(axis, step);
            currentAngleStep += step;
            requestAnimationFrame(runFrame);
        } else {
            const pivotItems = [...dynamicPivotGroup.children];
            pivotItems.forEach(item => {
                item.position.applyQuaternion(dynamicPivotGroup.quaternion);
                item.quaternion.premultiply(dynamicPivotGroup.quaternion);
                item.position.x = Math.round(item.position.x);
                item.position.y = Math.round(item.position.y);
                item.position.z = Math.round(item.position.z);
                cubeGroup.attach(item);
            });
            scene.remove(dynamicPivotGroup);
            isAnimating = false;
            if (callback) callback();
        }
    }
    runFrame();
}

document.getElementById('resetBtn').addEventListener('click', () => {
    FACE_NAMES.forEach(f => cubeState[f] = Array(9).fill(f));
    document.getElementById('playerPanel').style.display = 'none';
    solutionMoves = []; currentMoveIndex = 0; isAnimating = false;
    buildCube3D();
});

// App loop initialization hooks
buildCube3D();
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
animate();

window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
