// JS/main.js - Lógica completa de Tetris con niveles

// --- CONFIGURACIÓN DEL JUEGO ---
const ROWS = 20; // Filas visibles de Tetris
const COLUMNS = 10; // Columnas visibles de Tetris
const PADDING = 2; // Relleno para el borde de la matriz

let gameGrid = new Matrix(ROWS + PADDING, COLUMNS + 2, 0); 
let currentPiece = null;
let score = 0;
let gameOver = false;
let gameWin = false; // Variable para la condición de victoria

// --- VARIABLES DE NIVEL Y VELOCIDAD ---
let level = 1;
// Puntuación necesaria para subir de nivel (0, Nivel 1, Nivel 2, Nivel 3)
// AJUSTADO: Nivel 2 comienza en 1000
const LEVEL_THRESHOLDS = [0, 0, 1000, 3000];
// Velocidad de caída (en milisegundos, menor es más rápido)
const DROP_SPEEDS = [0, 1000, 700, 400]; 
// NUEVA CONSTANTE: Puntuación para ganar
const WIN_SCORE = 5000;


// --- DEFINICIÓN DE LAS PIEZAS (TETROMINÓS) ---
const PIECES = [
    // 0: T (Matriz valor 1)
    [
        [[0, 1, 0], [1, 1, 1], [0, 0, 0]], 
        [[0, 1, 0], [0, 1, 1], [0, 1, 0]], 
        [[0, 0, 0], [1, 1, 1], [0, 1, 0]], 
        [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
    ],
    // 1: J (Matriz valor 2)
    [
        [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
        [[0, 2, 2], [0, 2, 0], [0, 2, 0]],
        [[0, 0, 0], [2, 2, 2], [0, 0, 2]],
        [[0, 2, 0], [0, 2, 0], [2, 2, 0]]
    ],
    // 2: Z (Matriz valor 3)
    [
        [[3, 3, 0], [0, 3, 3], [0, 0, 0]],
        [[0, 0, 3], [0, 3, 3], [0, 3, 0]]
    ],
    // 3: O (Matriz valor 4)
    [
        [[4, 4], [4, 4]]
    ],
    // 4: S (Matriz valor 5)
    [
        [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
        [[5, 0, 0], [5, 5, 0], [0, 5, 0]]
    ],
    // 5: L (Matriz valor 6)
    [
        [[0, 0, 6], [6, 6, 6], [0, 0, 0]],
        [[0, 6, 0], [0, 6, 0], [0, 6, 6]],
        [[0, 0, 0], [6, 6, 6], [6, 0, 0]],
        [[6, 6, 0], [0, 6, 0], [0, 6, 0]]
    ],
    // 6: I (Matriz valor 7)
    [
        [[0, 0, 0, 0], [7, 7, 7, 7], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 7, 0], [0, 0, 7, 0], [0, 0, 7, 0], [0, 0, 7, 0]]
    ]
];

// --- CLASE PIEZA ---
class Piece {
    constructor(shapeIndex) {
        this.shape = PIECES[shapeIndex];
        this.imageIndex = shapeIndex + 1;
        this.rotation = 0;
        this.matrix = this.getMatrix();
        this.x = Math.floor(COLUMNS / 2) - Math.floor(this.matrix[0].length / 2);
        this.y = 0;
    }

    getMatrix() {
        return this.shape[this.rotation % this.shape.length];
    }
    
    rotate(dir = 1) {
        this.rotation = (this.rotation + dir) % this.shape.length;
        if (this.rotation < 0) {
            this.rotation += this.shape.length;
        }
        this.matrix = this.getMatrix();
    }
}

// --- FUNCIONES DE LÓGICA DE JUEGO ---

function randomPiece() {
    const randomIndex = Math.floor(Math.random() * PIECES.length);
    currentPiece = new Piece(randomIndex);
    
    if (!canMove(currentPiece, 0, 0)) {
        gameOver = true;
    }
}

function canMove(piece, dx, dy, newMatrix = piece.matrix) {
    const pieceMatrix = newMatrix;
    const size = pieceMatrix.length;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (pieceMatrix[r][c] > 0) {
                const gridX = piece.x + c + dx + 1;
                const gridY = piece.y + r + dy + PADDING;

                // 1. Verificar límites
                if (gridX < 1 || gridX > COLUMNS || gridY < PADDING || gridY >= ROWS + PADDING) {
                    return false;
                }
                
                // 2. Verificar colisión con bloques fijos
                if (gameGrid.getValue(gridY, gridX) > 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

function dropPiece() {
    if (gameOver || gameWin) return;

    if (canMove(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        mergePiece();
        clearLines();
        randomPiece();
    }
}

function mergePiece() {
    const pieceMatrix = currentPiece.matrix;
    const size = pieceMatrix.length;
    
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (pieceMatrix[r][c] > 0) {
                const gridX = currentPiece.x + c + 1;
                const gridY = currentPiece.y + r + PADDING;
                gameGrid.setValue(gridY, gridX, currentPiece.imageIndex);
            }
        }
    }
}

// NUEVA FUNCIÓN: Verifica la condición de victoria (5000 puntos)
function checkWinCondition() {
    if (score >= WIN_SCORE) {
        gameWin = true;
        // Redirige a la pantalla de victoria
        window.location.href = 'game-win.html'; 
    }
}

// Nueva función para verificar si la puntuación permite subir de nivel
function checkLevelUp() {
    // Itera desde el nivel más alto (3) hacia el nivel actual (level)
    for (let i = LEVEL_THRESHOLDS.length - 1; i > 0; i--) {
        if (score >= LEVEL_THRESHOLDS[i] && level < i) {
            level = i;
            // Actualizar el display del nivel
            document.getElementById('level-display').innerText = level;
            break; 
        }
    }
}


function clearLines() {
    let linesCleared = 0;

    for (let r = ROWS + PADDING - 1; r >= PADDING; r--) {
        let isRowFull = true;

        for (let c = 1; c <= COLUMNS; c++) {
            if (gameGrid.getValue(r, c) === 0) {
                isRowFull = false;
                break; 
            }
        }

        if (isRowFull) {
            linesCleared++;
            
            // Desplazar las filas superiores hacia abajo
            for (let rr = r; rr >= PADDING; rr--) {
                for (let cc = 1; cc <= COLUMNS; cc++) {
                    let valueAbove = gameGrid.getValue(rr - 1, cc);
                    gameGrid.setValue(rr, cc, valueAbove);
                }
            }
            r++; // Repetir la verificación en esta fila que ahora tiene nuevo contenido
        }
    }
    
    // Actualizar la puntuación y verificar subida de nivel
    if (linesCleared > 0) {
        // Puntuación estándar: 100/300/500/800
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared];
        document.getElementById('score').innerText = score;
        
        checkLevelUp();
        // LLAMADA CLAVE: Verificar si el jugador ha ganado
        checkWinCondition();
    }
}

function movePiece(dx) {
    if (gameOver || gameWin) return;
    if (canMove(currentPiece, dx, 0)) {
        currentPiece.x += dx;
    }
}

function rotatePiece() {
    if (gameOver || gameWin) return;

    const originalRotation = currentPiece.rotation;
    currentPiece.rotate(1);
    
    if (!canMove(currentPiece, 0, 0, currentPiece.getMatrix())) {
        currentPiece.rotation = originalRotation;
        currentPiece.matrix = currentPiece.getMatrix();
    }
}
const bgMusic = document.getElementById("bg-music");

function iniciarMusica() {
    bgMusic.volume = 0.4; // volumen 40%
    bgMusic.play().catch(e => {
        console.log("Autoplay bloqueado, requiere interacción.");
    });
}

// Inicia la música cuando el jugador hace clic o presiona una tecla
window.addEventListener("click", iniciarMusica, { once: true });
window.addEventListener("keydown", iniciarMusica, { once: true });

