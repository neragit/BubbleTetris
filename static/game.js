
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const blockSize = 30;  // Grid block
let width, height;     // Canvas 

const gameState = {
  score: 0,
  grid: createMatrix(10, 20),
  pieces: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [1],
      [1],
      [1],
      [1],
    ],
  ],
  player: {
    pos: { x: 0, y: 0 },
    matrix: null,
  },
  dropCounter: 0,
  dropInterval: 1000,
  lastTime: 0,
};


function updateCanvasSize() {
  width = 10 * blockSize;
  height = 20 * blockSize;
  canvas.width = width;
  canvas.height = height;
  context.scale(blockSize, blockSize); // Scale the context
  console.log(`Canvas width: ${canvas.width}, height: ${canvas.height}`);
}

function createMatrix(width, height) {
  const matrix = [];
  
  while (height--) {
    matrix.push(new Array(width).fill(0));
  }
  return matrix;
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.shadowColor = 'cyan';
        context.shadowBlur = 15;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;

        const gradient = context.createRadialGradient(
          x + offset.x + 0.5,
          y + offset.y + 0.5,
          0,
          x + offset.x + 0.5,
          y + offset.y + 0.5,
          0.5
        );
        
        gradient.addColorStop(0, 'rgba(0, 206, 209, 0.1)');
        gradient.addColorStop(0.2, 'rgba(0, 206, 209, 0.1)');
        gradient.addColorStop(0.25, 'rgba(0, 206, 209, 0.2)');
        gradient.addColorStop(0.5, 'rgba(0, 206, 209, 0.4)');
        gradient.addColorStop(0.6, 'rgba(73, 226, 226, 0.4)');
        gradient.addColorStop(0.7, 'rgba(73, 226, 226, 0.5)');
        gradient.addColorStop(0.75, 'rgba(0, 226, 226, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 206, 209, 0.5)');

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(
          x + offset.x + 0.5,
          y + offset.y + 0.5,
          0.5,
          0,
          Math.PI * 2
        );
        context.fill();
        context.shadowColor = 'transparent';
      }
    });
  });
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawMatrix(gameState.grid, { x: 0, y: 0 });
  drawMatrix(gameState.player.matrix, gameState.player.pos);
}

function update(time = 0) {
  const deltaTime = time - gameState.lastTime;
  gameState.lastTime = time;
  gameState.dropCounter += deltaTime;

  if (gameState.dropCounter > gameState.dropInterval) {
    playerDrop();
    gameState.dropCounter = 0;
  }

  draw();
  gameLoopId = requestAnimationFrame(update);
}

function merge(grid, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        grid[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function collide(grid, player) {
  const [matrix, pos] = [player.matrix, player.pos];

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0 && (grid[y + pos.y] && grid[y + pos.y][x + pos.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function clearRows() {
  for (let y = gameState.grid.length - 1; y >= 0; y--) {

    if (gameState.grid[y].every(value => value !== 0)) {
      gameState.grid.splice(y, 1);
      gameState.grid.push(new Array(gameState.grid[0].length).fill(0));
      gameState.score += 10;
      updateScore();
      y++;
    }
  }
}

function resetPlayer() {
  const randomPiece = gameState.pieces[Math.floor(Math.random() * gameState.pieces.length)];
  gameState.player.matrix = randomPiece;
  gameState.player.pos.y = gameState.grid.length - gameState.player.matrix.length;
  gameState.player.pos.x = Math.floor(gameState.grid[0].length / 2) - Math.floor(randomPiece[0].length / 2);

  if (collide(gameState.grid, gameState.player)) {
    gameOver();
  }
}

function playerMove(offset) {
  gameState.player.pos.x += offset;

  if (collide(gameState.grid, gameState.player)) {
    gameState.player.pos.x -= offset;
  }
}

function playerDrop() {
  gameState.player.pos.y--;

  if (collide(gameState.grid, gameState.player)) {
    gameState.player.pos.y++;
    merge(gameState.grid, gameState.player);
    clearRows();
    resetPlayer();
  }
}

function playerRotate() {
  const matrix = gameState.player.matrix;
  const rotated = matrix[0].map((_, index) => matrix.map(row => row[index])).reverse();

  if (!collide(gameState.grid, { matrix: rotated, pos: gameState.player.pos })) {
    gameState.player.matrix = rotated;
  }
}

function updateScore() {
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = `Score: ${gameState.score}`;
}

function gameOver() {
  cancelAnimationFrame(gameLoopId);

  const scoreElement = document.getElementById('score');
  const finalScoreElement = document.getElementById('final-score');
  finalScoreElement.innerText = scoreElement.innerText.replace('Score: ', '');

  document.getElementById('game-over-message').style.display = 'block';
  document.getElementById('restart-game').addEventListener('click', initializeGame);
}

function initializeGame() {
  document.getElementById('start-message').style.display = 'none';
  document.getElementById('game-over-message').style.display = 'none';
  
  gameState.score = 0;
  gameState.grid = createMatrix(10, 20);
  gameState.dropCounter = 0;
  gameState.lastTime = 0;
  gameState.player = {
    pos: { x: 0, y: 0 },
    matrix: null,
  };

  updateScore();
  resetPlayer();
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCanvasSize();
  document.getElementById('start-message').style.display = 'block';
  document.getElementById('game-over-message').style.display = 'none';
  const restartGameButton = document.getElementById('start-game');
  restartGameButton.addEventListener('click', initializeGame);
});

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowUp') {
    playerDrop();
  } else if (event.key === 'ArrowDown') {
    playerRotate();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowUp') {
    playerDrop();
  } else if (event.key === 'ArrowDown') {
    playerRotate();
  }
});

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let moveDirection = 0;
let moveDelay = 300;

document.addEventListener('touchstart', event => {
  touchStartTime = Date.now();
  const touch = event.touches[0];
  touchStartX = touch.pageX;
  touchStartY = touch.pageY;
});

document.addEventListener('touchmove', event => {
  const touch = event.touches[0];
  const touchX = touch.pageX;
  const screenWidth = window.innerWidth;

  if (touchX < screenWidth / 2 && moveDirection !== -1) {
    moveDirection = -1;
    movePlayer();
  } else if (touchX >= screenWidth / 2 && moveDirection !== 1) {
    moveDirection = 1;
    movePlayer();
  }
});

document.addEventListener('touchend', event => {
  clearInterval(moveInterval);
  moveDirection = 0;
});

function movePlayer() {
  if (moveDirection !== 0) {
    playerMove(moveDirection);
    setTimeout(() => {
      movePlayer();
    }, moveDelay);
  }
}
