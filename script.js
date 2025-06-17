// --- Configuration ---
const TILE_SIZE = 16; // Size of each tile in pixels
const MAP_WIDTH_TILES = 40; // Number of tiles wide
const MAP_HEIGHT_TILES = 30; // Number of tiles high

// --- Canvas Setup ---
const canvas = document.getElementById('dungeonCanvas');
const ctx = canvas.getContext('2d');

canvas.width = MAP_WIDTH_TILES * TILE_SIZE;
canvas.height = MAP_HEIGHT_TILES * TILE_SIZE;

// --- UI Elements ---
const generateButton = document.getElementById('generateButton');
const mapSizeInfo = document.getElementById('mapSizeInfo');
const algorithmInfo = document.getElementById('algorithmInfo');

// --- Dungeon State ---
let dungeonMap = []; // 2D array representing the dungeon (0=wall, 1=floor)

// --- Colors (for drawing) ---
const WALL_COLOR = '#2C323B';
const FLOOR_COLOR = '#444B57';

// --- Utility Functions ---
function create2DArray(width, height, fillValue) {
    return Array.from({ length: height }, () =>
        Array.from({ length: width }, () => fillValue)
    );
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Dungeon Generation: Drunkard's Walk ---
function generateDungeonDrunkardsWalk() {
    // Initialize map with all walls
    dungeonMap = create2DArray(MAP_WIDTH_TILES, MAP_HEIGHT_TILES, 0); // 0 = wall

    // Starting point for the drunkard (roughly center)
    let currentX = getRandomInt(MAP_WIDTH_TILES * 0.25, MAP_WIDTH_TILES * 0.75);
    let currentY = getRandomInt(MAP_HEIGHT_TILES * 0.25, MAP_HEIGHT_TILES * 0.75);

    const maxSteps = MAP_WIDTH_TILES * MAP_HEIGHT_TILES * 0.5; // Roughly half the map tiles converted to floor
    let stepsTaken = 0;

    // Carve out floors
    while (stepsTaken < maxSteps) {
        // Ensure current position is within bounds
        currentX = Math.max(1, Math.min(currentX, MAP_WIDTH_TILES - 2));
        currentY = Math.max(1, Math.min(currentY, MAP_HEIGHT_TILES - 2));

        // Carve a floor tile
        if (dungeonMap[currentY][currentX] === 0) {
            dungeonMap[currentY][currentX] = 1; // 1 = floor
            stepsTaken++;
        }

        // Randomly choose a direction (0: up, 1: right, 2: down, 3: left)
        const direction = getRandomInt(0, 3);
        switch (direction) {
            case 0: currentY--; break; // Up
            case 1: currentX++; break; // Right
            case 2: currentY++; break; // Down
            case 3: currentX--; break; // Left
        }
    }
}

// --- Drawing Functions ---
function drawDungeon() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tileType = dungeonMap[y][x];
            ctx.fillStyle = (tileType === 0) ? WALL_COLOR : FLOOR_COLOR;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

// --- Game Initialization & Loop (Simplified for now) ---
function initGame() {
    mapSizeInfo.textContent = `${MAP_WIDTH_TILES}x${MAP_HEIGHT_TILES}`;
    // We'll add player init and game loop in future steps
    generateAndDraw();
}

function generateAndDraw() {
    generateDungeonDrunkardsWalk();
    drawDungeon();
}

// --- Event Listeners ---
generateButton.addEventListener('click', generateAndDraw);

// --- Start the game! ---
initGame();