// --- Grid Constants ---
const GRID_HEIGHT = 25;
const GRID_WIDTH = 40;

// --- Global State ---
let isMouseDown = false;
let startNode = null; 
let endNode = null;   
let isPlacingStart = false;
let isPlacingEnd = false;
let isAddingWeight = false;
let isRunning = false;

// --- Grid Array ---
const grid = [];

// --- DOM Elements ---
const gridContainer = document.getElementById('grid-container');

// --- Queue Class (FIFO) ---
// (Unchanged)
class Queue {
    constructor() { this.items = {}; this.head = 0; this.tail = 0; }
    enqueue(item) { this.items[this.tail] = item; this.tail++; }
    dequeue() { if (this.isEmpty()) return null; const item = this.items[this.head]; delete this.items[this.head]; this.head++; return item; }
    isEmpty() { return this.head === this.tail; }
}

// --- Grid Creation ---
// (Unchanged)
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

// (Unchanged)
function createNode(r, c) {
    const node = document.createElement('div');
    node.classList.add('grid-node');
    node.dataset.row = r;
    node.dataset.col = c;

    node.addEventListener('mousedown', () => handleMouseDown(node));
    node.addEventListener('mouseenter', () => handleMouseEnter(node));
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

// --- Key Listeners ---
// (Unchanged)
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') { isAddingWeight = true; }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') { isAddingWeight = false; }
});

// --- Event Handlers ---
// (Unchanged)
function handleMouseDown(node) {
    if (isRunning) return;
    isMouseDown = true;
    
    if (node === startNode) { isPlacingStart = true; }
    else if (node === endNode) { isPlacingEnd = true; }
    else if (isAddingWeight) { toggleWeight(node); }
    else { toggleWall(node); }
}

// (Unchanged)
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
        if (isAddingWeight) { toggleWeight(node); }
        else { toggleWall(node); }
    }
}

// (Unchanged)
function handleMouseUp() {
    if (isRunning) return;
    isMouseDown = false;
    isPlacingStart = false;
    isPlacingEnd = false;
}

// (Unchanged)
function toggleWall(node) {
    if (node === startNode || node === endNode) return; 
    if (!node.classList.contains('node-weight')) {
        node.classList.toggle('node-wall');
    }
}

// (Unchanged)
function toggleWeight(node) {
    if (node === startNode || node === endNode) return;
    if (!node.classList.contains('node-wall')) {
        node.classList.toggle('node-weight');
    }
}

// --- Clear Functions ---
// (Unchanged)
function clearPath() {
    if (isRunning) return;
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            grid[r][c].classList.remove('node-visited', 'node-path');
        }
    }
}

// (Unchanged)
function clearBoard() {
    if (isRunning) return;
    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            grid[r][c].classList.remove('node-visited', 'node-path', 'node-wall', 'node-weight');
        }
    }
}

// --- BFS Algorithm ---
// (Unchanged)
function getValidNeighbors(node) {
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

// (Unchanged)
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

// --- Dijkstra's Algorithm ---
// (All functions unchanged from the previous step)

function initializeDijkstraMaps() {
    const distances = new Map();
    const predecessors = new Map();
    const unvisitedNodes = new Set();

    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            const node = grid[r][c];
            distances.set(node, Infinity);
            predecessors.set(node, null);
            unvisitedNodes.add(node);
        }
    }
    distances.set(startNode, 0);
    return { distances, predecessors, unvisitedNodes };
}

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

function getDijkstraNeighbors(node) {
    const neighbors = [];
    const r = parseInt(node.dataset.row);
    const c = parseInt(node.dataset.col);
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of deltas) {
        const newR = r + dr;
        const newC = c + dc;
        if (newR >= 0 && newR < GRID_HEIGHT && newC >= 0 && newC < GRID_WIDTH) {
            neighbors.push(grid[newR][newC]);
        }
    }
    return neighbors;
}

function runDijkstra() {
    if (isRunning) return;
    isRunning = true;
    clearPath();

    const { distances, predecessors, unvisitedNodes } = initializeDijkstraMaps();
    const visitedNodesInOrder = [];
    
    let pathFound = false;

    while (unvisitedNodes.size > 0) {
        const currentNode = getClosestNode(unvisitedNodes, distances); // Uses gCost

        if (currentNode === null || distances.get(currentNode) === Infinity) break;
        if (currentNode.classList.contains('node-wall')) {
            unvisitedNodes.delete(currentNode);
            continue;
        }
        
        unvisitedNodes.delete(currentNode);
        visitedNodesInOrder.push(currentNode);

        if (currentNode === endNode) {
            pathFound = true;
            break;
        }

        const neighbors = getDijkstraNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (!unvisitedNodes.has(neighbor)) continue;

            const cost = 1 + (neighbor.classList.contains('node-weight') ? 9 : 0);
            const newDist = distances.get(currentNode) + cost; // new gCost

            if (newDist < distances.get(neighbor)) {
                distances.set(neighbor, newDist);
                predecessors.set(neighbor, currentNode);
            }
        }
    }
    
    const path = pathFound ? reconstructPath(predecessors, endNode) : [];
    animateVisualization(visitedNodesInOrder, path);
}

// --- NEW: A* (A-star) Algorithm ---

/**
 * Heuristic: Calculates the Manhattan distance from nodeA to nodeB.
 * @param {HTMLElement} nodeA 
 * @param {HTMLElement} nodeB 
 * @returns {number} The Manhattan distance.
 */
function manhattanDistance(nodeA, nodeB) {
    const rA = parseInt(nodeA.dataset.row);
    const cA = parseInt(nodeA.dataset.col);
    const rB = parseInt(nodeB.dataset.row);
    const cB = parseInt(nodeB.dataset.col);
    return Math.abs(rA - rB) + Math.abs(cA - cB);
}

/**
 * Initializes maps for A*.
 * gScore is the cost from start (like Dijkstra's 'distances').
 * fScore is gScore + heuristic.
 * @returns {Object} { gScores, fScores, predecessors, unvisitedNodes }
 */
function initializeAStarMaps() {
    const gScores = new Map();
    const fScores = new Map();
    const predecessors = new Map();
    const unvisitedNodes = new Set(); // This is the "Open Set"

    for (let r = 0; r < GRID_HEIGHT; r++) {
        for (let c = 0; c < GRID_WIDTH; c++) {
            const node = grid[r][c];
            gScores.set(node, Infinity);
            fScores.set(node, Infinity);
            predecessors.set(node, null);
            unvisitedNodes.add(node);
        }
    }
    
    gScores.set(startNode, 0); // Cost from start to start is 0
    // fScore = gScore + hCost
    fScores.set(startNode, manhattanDistance(startNode, endNode));
    
    return { gScores, fScores, predecessors, unvisitedNodes };
}

/**
 * Finds the unvisited node with the smallest fScore.
 * (Identical to getClosestNode, but uses fScores map)
 */
function getLowestFScoreNode(unvisitedNodes, fScores) {
    let closestNode = null;
    let minFScore = Infinity;

    for (const node of unvisitedNodes) {
        const fScore = fScores.get(node);
        if (fScore < minFScore) {
            minFScore = fScore;
            closestNode = node;
        }
    }
    return closestNode;
}

/**
 * Runs A* (A-star) Algorithm.
 */
function runAStar() {
    if (isRunning) return;
    isRunning = true;
    clearPath();

    const { gScores, fScores, predecessors, unvisitedNodes } = initializeAStarMaps();
    const visitedNodesInOrder = [];
    
    let pathFound = false;

    while (unvisitedNodes.size > 0) {
        // 1. Get the unvisited node with the lowest fScore
        const currentNode = getLowestFScoreNode(unvisitedNodes, fScores);

        if (currentNode === null || gScores.get(currentNode) === Infinity) break;
        if (currentNode.classList.contains('node-wall')) {
            unvisitedNodes.delete(currentNode);
            continue;
        }

        // Mark as "visited" (remove from open set)
        unvisitedNodes.delete(currentNode);
        visitedNodesInOrder.push(currentNode);

        // 2. Check if we found the end
        if (currentNode === endNode) {
            pathFound = true;
            break;
        }

        // 3. Update neighbors
        const neighbors = getDijkstraNeighbors(currentNode); // Same neighbors as Dijkstra
        for (const neighbor of neighbors) {
            
            // 4. Calculate cost
            const cost = 1 + (neighbor.classList.contains('node-weight') ? 9 : 0);
            
            // tentative_gScore is the distance from start to the neighbor
            // through the currentNode
            const tentativeGScore = gScores.get(currentNode) + cost;

            if (tentativeGScore < gScores.get(neighbor)) {
                // This path to the neighbor is better!
                predecessors.set(neighbor, currentNode);
                gScores.set(neighbor, tentativeGScore);
                
                // Update the fScore for the neighbor
                const hScore = manhattanDistance(neighbor, endNode);
                fScores.set(neighbor, tentativeGScore + hScore);
            }
        }
    }
    
    const path = pathFound ? reconstructPath(predecessors, endNode) : [];
    animateVisualization(visitedNodesInOrder, path);
}

// --- Common Functions (Used by All Algos) ---

// (Unchanged)
function reconstructPath(predecessors, endNode) {
    const path = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        path.push(currentNode);
        currentNode = predecessors.get(currentNode);
    }
    return path.reverse();
}

// (Unchanged)
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

// (Unchanged)
function animatePath(path) {
    let delay = 0;
    for (let i = 0; i < path.length; i++) {
        delay = 50 * i;
        setTimeout(() => {
            const node = path[i];
            if (node !== startNode && node !== endNode) {
                node.classList.add('node-path');
            }
        }, delay);
    }
    
    // Set isRunning to false after all animations are scheduled
    setTimeout(() => {
        isRunning = false;
    }, 10 * visitedNodesInOrder.length + delay); // Wait for both anims
    
    // Handle case of no path found
    if (path.length === 0) {
        setTimeout(() => {
            isRunning = false;
        }, 10 * visitedNodesInOrder.length);
    }
}

// --- Run the Application ---
createGrid();

// --- UPDATED: Add Event Listeners for All Buttons ---
document.getElementById('bfs-btn').addEventListener('click', runBFS);
document.getElementById('dijkstra-btn').addEventListener('click', runDijkstra);
document.getElementById('astar-btn').addEventListener('click', runAStar); // NEW
document.getElementById('clear-path-btn').addEventListener('click', clearPath);
document.getElementById('clear-board-btn').addEventListener('click', clearBoard);