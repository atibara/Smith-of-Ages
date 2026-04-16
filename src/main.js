import { Player } from './entities/Player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const player = new Player(400, 300);
const camera = { x: 0, y: 0 };
const GRID_SIZE = 100;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener('resize', resize);
resize();
player.x = width / 2;
player.y = height / 2;
player.targetX = player.x;
player.targetY = player.y;

// Input handling
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  
  // Convert screen to world coordinates
  const worldX = screenX + camera.x;
  const worldY = screenY + camera.y;
  
  player.setTarget(worldX, worldY);
});

function drawGrid() {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  
  const startX = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor(camera.y / GRID_SIZE) * GRID_SIZE;
  const endX = camera.x + width;
  const endY = camera.y + height;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    ctx.moveTo(x - camera.x, 0);
    ctx.lineTo(x - camera.x, height);
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    ctx.moveTo(0, y - camera.y);
    ctx.lineTo(width, y - camera.y);
  }
  ctx.stroke();
  
  // Draw world bounds
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, width, height);
}

function update() {
  player.update({ width, height });
  
  // Static world camera
  camera.x = 0;
  camera.y = 0;
}

function render() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);
  
  drawGrid();
  player.draw(ctx, camera);
  
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  update();
  render();
}

gameLoop();
