// --- Configuration ---
const TILE_SIZE = 16; // Size of each tile in pixels
const MAP_WIDTH_TILES = 40; // Number of tiles wide
const MAP_HEIGHT_TILES = 30; // Number of tiles high
const NUM_ENEMIES = 5; // Number of enemies to spawn per dungeon

// --- Tile Types ---
const TILE_WALL = 0;
const TILE_FLOOR = 1;
const TILE_EXIT = 2;

// --- Canvas Setup ---
const canvas = document.getElementById('dungeonCanvas');
const ctx = canvas.getContext('2d');

canvas.width = MAP_WIDTH_TILES * TILE_SIZE;
canvas.height = MAP_HEIGHT_TILES * TILE_SIZE;

// --- UI Elements ---
const generateButton = document.getElementById('generateButton');
const mapSizeInfo = document.getElementById('mapSizeInfo');
const algorithmInfo = document.getElementById('algorithmInfo');

// Game Message Panel (created dynamically if not in HTML)
let gameMessage = document.getElementById('gameMessage');
if (!gameMessage) {
    gameMessage = document.createElement('div');
    gameMessage.id = 'gameMessage';
    document.getElementById('game-container').appendChild(gameMessage);
}
gameMessage.style.cssText = `
    margin-top: 15px;
    font-size: 1.2em;
    color: #e5c07b; /* Yellowish color for messages */
    min-height: 1.5em; /* Reserve space to prevent layout shift */
`;

// Enemies Remaining Info (New UI Element)
const enemiesRemainingInfo = document.createElement('div');
enemiesRemainingInfo.id = 'enemiesRemainingInfo';
enemiesRemainingInfo.style.cssText = `
    font-size: 1em;
    color: #ef5350; /* Reddish color for enemy info */
`;
document.getElementById('game-container').appendChild(enemiesRemainingInfo);


// --- Dungeon State ---
let dungeonMap = []; // 2D array representing the dungeon

// --- Player State ---
const player = {
    x: 0, // Player's X tile coordinate
    y: 0, // Player's Y tile coordinate
    color: '#E6B0FF' // Pinkish-purple for the player
};

// --- Exit State ---
const exit = {
    x: 0,
    y: 0,
    color: '#D8BFD8' // Lighter purple for the exit
};

// --- Enemies State (New) ---
let enemies = []; // Array to hold enemy objects
const ENEMY_COLOR = '#FF5733'; // Orange-red for enemies


// --- Colors (for drawing) ---
const WALL_COLOR = '#2C323B'; // Dark grey
const FLOOR_COLOR = '#444B57'; // Slightly lighter grey


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
    dungeonMap = create2DArray(MAP_WIDTH_TILES, MAP_HEIGHT_TILES, TILE_WALL);

    // Starting point for the drunkard (roughly center)
    let currentX = getRandomInt(MAP_WIDTH_TILES * 0.25, MAP_WIDTH_TILES * 0.75);
    let currentY = getRandomInt(MAP_HEIGHT_TILES * 0.25, MAP_HEIGHT_TILES * 0.75);

    const maxSteps = MAP_WIDTH_TILES * MAP_HEIGHT_TILES * 0.5; // Roughly half the map tiles converted to floor
    let stepsTaken = 0;

    // Carve out floors
    while (stepsTaken < maxSteps) {
        // Ensure current position is within bounds (1 tile in from edge)
        currentX = Math.max(1, Math.min(currentX, MAP_WIDTH_TILES - 2));
        currentY = Math.max(1, Math.min(currentY, MAP_HEIGHT_TILES - 2));

        // Carve a floor tile
        if (dungeonMap[currentY][currentX] === TILE_WALL) {
            dungeonMap[currentY][currentX] = TILE_FLOOR;
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

// --- Player Management ---
function spawnPlayer() {
    let spawned = false;
    while (!spawned) {
        // Try to place player at a random floor tile
        const randX = getRandomInt(1, MAP_WIDTH_TILES - 2);
        const randY = getRandomInt(1, MAP_HEIGHT_TILES - 2);

        if (dungeonMap[randY][randX] === TILE_FLOOR) { // If it's a floor tile
            player.x = randX;
            player.y = randY;
            spawned = true;
        }
    }
}

// --- Exit Placement ---
function placeExit() {
    let placed = false;
    while (!placed) {
        const randX = getRandomInt(1, MAP_WIDTH_TILES - 2);
        const randY = getRandomInt(1, MAP_HEIGHT_TILES - 2);

        // Ensure it's a floor tile and not where the player spawned
        if (dungeonMap[randY][randX] === TILE_FLOOR &&
            (randX !== player.x || randY !== player.y)) {
            exit.x = randX;
            exit.y = randY;
            dungeonMap[randY][randX] = TILE_EXIT; // Mark the tile as exit
            placed = true;
        }
    }
}

// --- Enemy Management (New Functions) ---
function spawnEnemies() {
    enemies = []; // Clear existing enemies

    for (let i = 0; i < NUM_ENEMIES; i++) {
        let spawned = false;
        while (!spawned) {
            const randX = getRandomInt(1, MAP_WIDTH_TILES - 2);
            const randY = getRandomInt(1, MAP_HEIGHT_TILES - 2);

            // Ensure tile is floor, not player's spot, not exit's spot, and not already an enemy's spot
            const isPlayerSpot = (randX === player.x && randY === player.y);
            const isExitSpot = (randX === exit.x && randY === exit.y);
            const isOccupiedByEnemy = enemies.some(e => e.x === randX && e.y === randY);

            if (dungeonMap[randY][randX] === TILE_FLOOR &&
                !isPlayerSpot && !isExitSpot && !isOccupiedByEnemy) {
                
                enemies.push({ x: randX, y: randY, id: i }); // Give enemies an ID for easy removal
                spawned = true;
            }
        }
    }
    updateEnemiesRemainingUI();
}

function updateEnemiesRemainingUI() {
    enemiesRemainingInfo.textContent = `Enemies Remaining: ${enemies.length}`;
}

function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    // Check bounds
    if (newX < 0 || newX >= MAP_WIDTH_TILES ||
        newY < 0 || newY >= MAP_HEIGHT_TILES) {
        return; // Can't move out of bounds
    }

    const targetTileType = dungeonMap[newY][newX];

    // Check for wall collision
    if (targetTileType === TILE_WALL) {
        return; // Can't move into walls
    }

    // Check for enemy collision
    const enemyAtTarget = enemies.find(e => e.x === newX && e.y === newY);
    if (enemyAtTarget) {
        // Enemy defeated!
        enemies = enemies.filter(e => e.id !== enemyAtTarget.id); // Remove enemy
        gameMessage.textContent = `You defeated an enemy! ${enemies.length} left.`;
        updateEnemiesRemainingUI();
    } else {
        gameMessage.textContent = ""; // Clear message if not on enemy
    }

    // Move player
    player.x = newX;
    player.y = newY;
    drawGame(); // Redraw the game after movement

    // Check for exit condition after moving
    if (player.x === exit.x && player.y === exit.y) {
        if (enemies.length === 0) {
            gameMessage.textContent = "You found the exit! All enemies defeated! Well done!";
            // Optionally disable controls or trigger next level logic here
        } else {
            gameMessage.textContent = "The exit is blocked! Defeat all enemies first!";
            // To prevent player from staying on exit while enemies remain,
            // we could revert player position, but for simplicity, just show message.
        }
    }
}

// --- Drawing Functions ---
function drawDungeon() {
    for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
        for (let x = 0; x < MAP_WIDTH_TILES; x++) {
            const tileType = dungeonMap[y][x];
            let color;
            switch (tileType) {
                case TILE_WALL:
                    color = WALL_COLOR;
                    break;
                case TILE_FLOOR:
                    color = FLOOR_COLOR;
                    break;
                case TILE_EXIT:
                    color = exit.color;
                    break;
                default:
                    color = FLOOR_COLOR; // Fallback in case of unknown tile type
            }
            ctx.fillStyle = color;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    // Draw player slightly smaller than tile for visual clarity
    ctx.fillRect(player.x * TILE_SIZE + TILE_SIZE * 0.1,
                 player.y * TILE_SIZE + TILE_SIZE * 0.1,
                 TILE_SIZE * 0.8,
                 TILE_SIZE * 0.8);
}

// --- Drawing Enemies (New) ---
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = ENEMY_COLOR;
        // Draw enemy slightly smaller than tile for visual clarity
        ctx.fillRect(enemy.x * TILE_SIZE + TILE_SIZE * 0.1,
                     enemy.y * TILE_SIZE + TILE_SIZE * 0.1,
                     TILE_SIZE * 0.8,
                     TILE_SIZE * 0.8);
    });
}

// --- Main Drawing Function (Game Loop) ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
    drawDungeon();
    drawEnemies(); // Draw enemies before player (or after, depending on desired layering)
    drawPlayer();
}

// --- Game Initialization & Flow ---
function initGame() {
    mapSizeInfo.textContent = `${MAP_WIDTH_TILES}x${MAP_HEIGHT_TILES}`;
    setupEventListeners(); // Set up keyboard listeners once
    generateAndDraw(); // Generate initial dungeon and draw it
}

function generateAndDraw() {
    gameMessage.textContent = ""; // Clear any previous messages
    generateDungeonDrunkardsWalk();
    spawnPlayer(); // Place player on the newly generated map
    placeExit(); // Place the exit on the newly generated map
    spawnEnemies(); // Place enemies
    drawGame(); // Draw the dungeon, enemies, and player
}

// --- Event Listeners ---
function setupEventListeners() {
    generateButton.addEventListener('click', generateAndDraw);

    document.addEventListener('keydown', (event) => {
        // Prevent default scroll behavior for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(event.key)) {
            event.preventDefault();
        }

        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                movePlayer(0, -1); // Move up
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                movePlayer(0, 1); // Move down
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                movePlayer(-1, 0); // Move left
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                movePlayer(1, 0); // Move right
                break;
        }
    });
}

// --- Start the game! ---
initGame();