// JS/app.js - Motor de Juego y Dibujado

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// La variable scoreDisplay ya no es necesaria, accedemos directamente por ID.

// Variables de main.js
const BOARD_ROWS = ROWS; 
const BOARD_COLS = COLUMNS; 
const BLOCK_SIZE = 30; 

// Ajustamos el tamaño del canvas al tablero de 10x20
canvas.width = BOARD_COLS * BLOCK_SIZE; // 300
canvas.height = BOARD_ROWS * BLOCK_SIZE; // 600

const cellSize = BLOCK_SIZE; 

// Cargar imágenes
const images = {};
let loadedCount = 0;
// Son 7 bloques (0.png a 6.png)
const totalImages = 7; 

for (let i = 0; i < totalImages; i++) {
  const img = new Image();
  // RUTA CORREGIDA: Apunta a la carpeta ASSETS/
  img.src = `ASSETS/${i}.png`; 
  img.onload = () => {
    loadedCount++;
    if (loadedCount === totalImages) {
      // Iniciar el juego solo cuando todas estén listas
      randomPiece(); 
      startGameLoop(); 
    }
  };
  images[i] = img;
}

// --- Dibujado del Tablero y la Pieza ---
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); 

  // 1. Dibujar el Tablero Fijo (Matrix del juego)
  for (let r = PADDING; r < BOARD_ROWS + PADDING; r++) {
    for (let c = 1; c <= BOARD_COLS; c++) {
      const value = gameGrid.getValue(r, c);
      
      const drawX = (c - 1) * cellSize; 
      const drawY = (r - PADDING) * cellSize;

      // Dibujar el fondo oscuro de la celda
      ctx.fillStyle = '#1c1c1c'; 
      ctx.fillRect(drawX, drawY, cellSize, cellSize);

      // Dibujar las líneas de la cuadrícula
      ctx.strokeStyle = '#2d2d2d'; 
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX, drawY, cellSize, cellSize);
      
      if (value > 0) {
        // Dibujar la imagen del bloque
        const img = images[value - 1]; 
        if (img && img.complete) {
          ctx.drawImage(img, drawX, drawY, cellSize, cellSize);
        }
      }
    }
  }

  // 2. Dibujar la Pieza Actual (superpuesta)
  if (currentPiece) {
    const matrix = currentPiece.matrix;
    const size = matrix.length;
    const imageToUse = images[currentPiece.imageIndex - 1]; 

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] > 0) {
          const drawX = (currentPiece.x + c) * cellSize;
          const drawY = (currentPiece.y + r) * cellSize;

          if (imageToUse && imageToUse.complete) {
            ctx.drawImage(imageToUse, drawX, drawY, cellSize, cellSize);
          }
        }
      }
    }
  }

  // NOTA: Se ha eliminado el dibujado de 'GAME OVER' en el Canvas, 
  // ya que la redirección a game-over.html manejará la visualización.
}

// --- Bucle principal del juego (Game Loop) ---
// --- Bucle principal del juego (Game Loop) ---
let dropCounter = 0;
let lastTime = 0;

function startGameLoop(time = 0) {
    // 1. Verificar si el juego ha terminado (Derrota o Victoria)
    if (gameOver) {
      // La derrota debe redirigir a game-over.html (modificación anterior)
      window.location.href = 'game-over.html'; 
      return; 
    }

    if (gameWin) {
      // La victoria ya ejecuta la redirección en main.js, 
      // pero este 'return' asegura que el bucle se detenga.
      return; 
    }
    
    // Obtener la velocidad de caída basada en el nivel actual de main.js
    // DROP_SPEEDS es un array global en main.js
    const dropInterval = DROP_SPEEDS[level] || DROP_SPEEDS[1]; 
    
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        dropPiece(); 
        dropCounter = 0;
    }

    drawMap();
    requestAnimationFrame(startGameLoop);
}

// --- Manejo de Eventos de Teclado ---
document.addEventListener('keydown', (e) => {
    // También verificar gameWin, aunque su redirección está en main.js, 
    // es buena práctica evitar interacciones si el juego ya terminó.
    if (gameOver || gameWin || !currentPiece) return;

    if (e.key === 'ArrowLeft') {
        movePiece(-1);
    } else if (e.key === 'ArrowRight') {
        movePiece(1);
    } else if (e.key === 'ArrowDown') {
        // Caída suave: la pieza cae y el dropCounter se reinicia para mantener el ritmo
        dropPiece(); 
        dropCounter = 0;
    } else if (e.key === 'ArrowUp' || e.key === ' ') {
        rotatePiece(); 
    }
    drawMap();
});

// === Música de fondo ===
function getBgm() {
  const el = document.getElementById('bgm');
  if (!el) console.warn('No se encontró <audio id="bgm"> en game.html');
  return el;
}

// Desmutar y ajustar volumen tras primera interacción:
function enableSound() {
  const audio = getBgm();
  if (!audio) return;

  // El navegador permite autoplay porque está muted.
  // Tras el primer gesto del usuario, desmuteamos para que se escuche.
  audio.muted = false;
  audio.volume = 0.5;  // ajusta a gusto
  // Si por alguna razón quedó pausado, intenta reproducir:
  if (audio.paused) {
    audio.play().catch(err => console.warn('Play bloqueado:', err));
  }
  console.log('Música activada (desmute).');
}

// Primer gesto del usuario: activar sonido
window.addEventListener('click', enableSound, { once: true });
window.addEventListener('keydown', enableSound, { once: true });

// === Overlays de victoria y game over ===
const winOverlay = document.getElementById('winOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');

function showWinOverlay() {
  if (winOverlay) winOverlay.classList.add('visible');
}
function showGameOverOverlay() {
  if (gameOverOverlay) gameOverOverlay.classList.add('visible');
}
function hideOverlays() {
  if (winOverlay) winOverlay.classList.remove('visible');
  if (gameOverOverlay) gameOverOverlay.classList.remove('visible');
}

// Botones "Volver a Jugar" / "Intentar de nuevo"
const btnPlayAgainWin = document.getElementById('btnPlayAgainWin');
const btnPlayAgainOver = document.getElementById('btnPlayAgainOver');

function resetGameState() {
  // Reinicia variables globales del juego
  score = 0;
  level = 1;
  gameOver = false;
  gameWin = false;
  document.getElementById('score').innerText = score;
  document.getElementById('level-display').innerText = level;

  // Limpia el tablero
  gameGrid = new Matrix(ROWS + PADDING, COLUMNS + 2, 0);
  currentPiece = null;
  randomPiece();
  hideOverlays();

  // Reinicia el loop si fuera necesario
  dropCounter = 0;
  lastTime = 0;
  requestAnimationFrame(startGameLoop);
}

if (btnPlayAgainWin) btnPlayAgainWin.addEventListener('click', resetGameState);
if (btnPlayAgainOver) btnPlayAgainOver.addEventListener('click', resetGameState);

// ✅ Asegúrate de NO detener la música al terminar.
// Si en versiones anteriores añadiste stopMusic() en startGameLoop, elimínalo.
