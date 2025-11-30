// --- Grid Constants ---
const GRID_HEIGHT = 25; // 25 nodes high
const GRID_WIDTH = 40;  // 40 nodes wide

// --- Global State ---
let isMouseDown = false;
let startNode = null; 
let endNode = null;   
let isPlacingStart = false;
let isPlacingEnd = false;
let isAddingWeight = false; // --- NEW ---
let isRunning = false;      // --- NEW: Prevents clicks while animating

// --- Grid Array ---
const grid = [];

// --- DOM Elements ---
const gridContainer = document.getElementById('grid-container');

// --- Queue Class (FIFO) ---
// (Unchanged from before)
class Queue {
    constructor() {
        this.items = {};
        this.head = 0;
        this.tail = 0;
    }
    enqueue(item) {
        this.items[this.tail] = item;
        this.tail++;
    }
    dequeue() {
        if (this.isEmpty()) return null;
        const item = this.items[this.head];
        delete this.items[this.head];
        this.head++;
        return item;
    }
    isEmpty() {
        return this.head === this.tail;
    }
}

// --- Grid Creation ---

function createGrid() {
    gridContainer.style.setProperty('--grid-width', GRID_WIDTH);
    gridContainer.style.setProperty('--grid-height', GRID_HEIGHT);
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_WIDTH}, 1fr)`;

    for (let r = 0; r < GRID_HEIGHT; r++) {
        const row = [];
        for (let c = 0; c < GRID_WIDTH; c++) {
            const node = createNode(r, c);
            gridContainer.appendChild(node);
            row.push(node);
        }
        grid.push(row);
    }
}

function createNode(r, c) {
    const node = document.createElement('div');
    node.classList.add('grid-node');
    node.dataset.row = r;
    node.dataset.col = c;

    node.addEventListener('mousedown', () => handleMouseDown(node));
    node.addEventListener('mouseenter', () => handleMouseEnter(node));
    // --- UPDATED: Use 'document' for mouseup ---
    document.addEventListener('mouseup', handleMouseUp);
    
    if (r === 12 && c === 10) {
        node.classList.add('node-start');
        startNode = node;
    } else if (r === 12 && c === 30) {
        node.classList.add('node-end');
        endNode = node;
    }
    return node;
}

// --- NEW: Key Listeners for Weights ---

document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') {
        isAddingWeight = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') {
        isAddingWeight = false;
    }
});

// --- UPDATED: Event Handlers ---

function handleMouseDown(node) {
    if (isRunning) return; // Don't do anything if algorithm is running
    isMouseDown = true;
    
    if (node === startNode) {
        isPlacingStart = true;
    } else if (node === endNode) {
        isPlacingEnd = true;
    } else if (isAddingWeight) { // --- NEW: Check for weight
        toggleWeight(node);
    } else {
        toggleWall(node);
    }
}

function handleMouseEnter(node) {
    if (isRunning) return;
    
    if (isPlacingStart && node !== endNode) {
        startNode.classList.remove('node-start');
        node.classList.add('node-start');
        startNode = node;
    } else if (isPlacingEnd && node !== startNode) {
        endNode.classList.remove('node-end');
        node.classList.add('node-end');
        endNode = node;
    } else if (isMouseDown && !isPlacingStart && !isPlacingEnd) {
        if (isAddingWeight) { // --- NEW: Check for weight
            toggleWeight(node);
        } else {
            toggleWall(node);
        }
    }
}

function handleMouseUp() {
    if (isRunning) return;
    isMouseDown = false;
    isPlacingStart = false;
    isPlacingEnd = false;
}

function toggleWall(node) {
    if (node === startNode || node === endNode) return; 
    // Don't allow placing a wall on a weight
    if (!node.classList.contains('node-weight')) {
        node.classList.toggle('node-wall');
    }
}

// --- NEW: Toggle Weight Function ---
function toggleWeight(node) {
    if (node === startNode || node === endNode) return;
    // Don't allow placing a weight on a wall
    if (!node.classList.contains('node-wall')) {
        node.classList.toggle('node-weight');
    }
}

// --- UPDATED & NEW: Clear Functions ---

/**
 * Clears any 'visited' and 'path' nodes.
 */
function clearPath() {
    if (isRunning) return; // Don't clear while running
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            const node = grid[r][c];
            node.classList.remove('node-visited', 'node-path');
        }
    }
}

/**
 * --- NEW ---
 * Clears everything: path, visited, walls, and weights.
 */
function clearBoard() {
    if (isRunning) return;
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            const node = grid[r][c];
            node.classList.remove('node-visited', 'node-path', 'node-wall', 'node-weight');
        }
    }
}


// --- BFS Algorithm (Unchanged) ---
// (We just rename the function 'runBFS' to avoid conflicts)

function getValidNeighbors(node) {
    // (This function is identical to the one in the BFS step)
    const neighbors = [];
    const r = parseInt(node.dataset.row);
    const c = parseInt(node.dataset.col);
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of deltas) {
        const newR = r + dr;
        const newC = c + dc;
        if (newR >= 0 && newR < GRID_HEIGHT && newC >= 0 && newC < GRID_WIDTH) {
            const neighborNode = grid[newR][newC];
            if (!neighborNode.classList.contains('node-wall')) {
                neighbors.push(neighborNode);
            }
        }
    }
    return neighbors;
}

function runBFS() {
    if (isRunning) return;
    isRunning = true;
    clearPath(); 

    const queue = new Queue();
    const visited = new Set();
    const predecessors = new Map(); 
    const visitedNodesInOrder = [];

    queue.enqueue(startNode);
    visited.add(startNode);
    predecessors.set(startNode, null); 

    let pathFound = false;

    while (!queue.isEmpty()) {
        const currentNode = queue.dequeue();
        visitedNodesInOrder.push(currentNode);

        if (currentNode === endNode) {
            pathFound = true;
            break; 
        }

        const neighbors = getValidNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                predecessors.set(neighbor, currentNode);
                queue.enqueue(neighbor);
            }
        }
    }
    
    const path = pathFound ? reconstructPath(predecessors, endNode) : [];
    animateVisualization(visitedNodesInOrder, path);
}

// --- NEW: Dijkstra's Algorithm ---

/**
 * Initializes all nodes for Dijkstra's.
 * Sets distance to Infinity and predecessor to null.
 * @returns {Object} { distances, predecessors, unvisitedNodes }
 */
function initializeDijkstraMaps() {
    const distances = new Map();
    const predecessors = new Map();
    const unvisitedNodes = new Set();

    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            const node = grid[r][c];
            distances.set(node, Infinity); // Distance from start
            predecessors.set(node, null);  // Path tracking
            unvisitedNodes.add(node);      // All nodes are unvisited
        }
    }
    distances.set(startNode, 0); // Start node distance is 0
    return { distances, predecessors, unvisitedNodes };
}

/**
 * Finds the unvisited node with the smallest distance.
 * This is our simple "Priority Queue" simulation.
 */
function getClosestNode(unvisitedNodes, distances) {
    let closestNode = null;
    let minDistance = Infinity;

    for (const node of unvisitedNodes) {
        const distance = distances.get(node);
        if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }
    return closestNode;
}

/**
 * Gets all neighbors, even if they are walls (we check walls in the main loop).
 */
function getDijkstraNeighbors(node) {
    const neighbors = [];
    const r = parseInt(node.dataset.row);
    const c = parseInt(node.dataset.col);
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of deltas) {
        const newR = r + dr;
        const newC = c + dc;
        // Check if on the grid
        if (newR >= 0 && newR < GRID_HEIGHT && newC >= 0 && newC < GRID_WIDTH) {
            neighbors.push(grid[newR][newC]);
        }
    }
    return neighbors;
}

/**
 * Runs Dijkstra's Algorithm.
 */
function runDijkstra() {
    if (isRunning) return;
    isRunning = true;
    clearPath();

    const { distances, predecessors, unvisitedNodes } = initializeDijkstraMaps();
    const visitedNodesInOrder = []; // For animation
    
    let pathFound = false;

    while (unvisitedNodes.size > 0) {
        // 1. Get the unvisited node with the smallest distance
        const currentNode = getClosestNode(unvisitedNodes, distances);

        // If no node is reachable (e.g., trapped by walls)
        if (currentNode === null || distances.get(currentNode) === Infinity) {
            break;
        }
        
        // If it's a wall, skip it (but still mark as "visited")
        if (currentNode.classList.contains('node-wall')) {
            unvisitedNodes.delete(currentNode);
            continue;
        }
        
        // Mark as visited
        unvisitedNodes.delete(currentNode);
        visitedNodesInOrder.push(currentNode);

        // 2. Check if we found the end
        if (currentNode === endNode) {
            pathFound = true;
            break;
        }

        // 3. Update neighbors
        const neighbors = getDijkstraNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (!unvisitedNodes.has(neighbor)) continue; // Skip if already visited

            // 4. Calculate cost
            // Cost is 1, plus 9 if it's a weight (total 10)
            const cost = 1 + (neighbor.classList.contains('node-weight') ? 9 : 0);
            const newDist = distances.get(currentNode) + cost;

            if (newDist < distances.get(neighbor)) {
                // We found a new, cheaper path to this neighbor
                distances.set(neighbor, newDist);
                predecessors.set(neighbor, currentNode);
            }
        }
    }
    
    const path = pathFound ? reconstructPath(predecessors, endNode) : [];
    animateVisualization(visitedNodesInOrder, path);
}


// --- Common Functions (Used by Both Algos) ---

/**
 * Reconstructs the shortest path.
 * (Unchanged from before)
 */
function reconstructPath(predecessors, endNode) {
    const path = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        path.push(currentNode);
        currentNode = predecessors.get(currentNode);
    }
    return path.reverse();
}

/**
 * Animates the visualization.
 * (Unchanged from before, but we set isRunning)
 */
function animateVisualization(visitedNodesInOrder, path) {
    for (let i = 0; i < visitedNodesInOrder.length; i++) {
        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            if (node !== startNode && node !== endNode) {
                node.classList.add('node-visited');
            }
            
            if (i === visitedNodesInOrder.length - 1) {
                animatePath(path);
            }
        }, 10 * i);
    }
}

function animatePath(path) {
    for (let i = 0; i < path.length; i++) {
        setTimeout(() => {
            const node = path[i];
            if (node !== startNode && node !== endNode) {
                node.classList.add('node-path');
            }
            // --- NEW: When path animation is done, set isRunning to false
            if (i === path.length - 1) {
                isRunning = false;
            }
        }, 50 * i);
    }
    // Handle case of no path found
    if (path.length === 0) {
        isRunning = false;
    }
}

// --- Run the Application ---
createGrid();

// --- UPDATED: Add Event Listeners for All Buttons ---
document.getElementById('bfs-btn').addEventListener('click', runBFS);
document.getElementById('dijkstra-btn').addEventListener('click', runDijkstra);
document.getElementById('clear-path-btn').addEventListener('click', clearPath);
document.getElementById('clear-board-btn').addEventListener('click', clearBoard);