import { Player } from './entities/Player.js';
import { Smithy } from './entities/Smithy.js';
import { Soldier } from './entities/Soldier.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const UPPER_WORLD_HEIGHT = 150;
const player = new Player(400, 300);
const smithy = new Smithy(400, 300);
const soldiers = [];
const camera = { x: 0, y: 0 };
const GRID_SIZE = 100;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  smithy.x = width / 2;
  smithy.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2;
}

window.addEventListener('resize', resize);
resize();
player.x = width / 2;
player.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2 + 50;
player.targetX = player.x;
player.targetY = player.y;

// Input handling - keyboard
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (smithy.isPlayerNear(player)) {
      soldiers.push(new Soldier(UPPER_WORLD_HEIGHT / 2));
    }
  }
});

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
  const startY = Math.max(UPPER_WORLD_HEIGHT, Math.floor(camera.y / GRID_SIZE) * GRID_SIZE);
  const endX = camera.x + width;
  const endY = camera.y + height;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    ctx.moveTo(x - camera.x, UPPER_WORLD_HEIGHT);
    ctx.lineTo(x - camera.x, height);
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    if (y >= UPPER_WORLD_HEIGHT) {
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(width, y - camera.y);
    }
  }
  ctx.stroke();
  
  // Draw world bounds
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, UPPER_WORLD_HEIGHT, width, height - UPPER_WORLD_HEIGHT);
}

function update() {
  player.update({ minX: 0, maxX: width, minY: UPPER_WORLD_HEIGHT, maxY: height });
  
  for (let i = soldiers.length - 1; i >= 0; i--) {
    soldiers[i].update();
    if (soldiers[i].x > width + 50) {
      soldiers.splice(i, 1);
    }
  }
  
  // Static world camera
  camera.x = 0;
  camera.y = 0;
}

function render() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, UPPER_WORLD_HEIGHT, width, height - UPPER_WORLD_HEIGHT);
  
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, width, UPPER_WORLD_HEIGHT);
  
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, UPPER_WORLD_HEIGHT);
  ctx.lineTo(width, UPPER_WORLD_HEIGHT);
  ctx.stroke();
  
  drawGrid();
  smithy.draw(ctx, camera);
  player.draw(ctx, camera);
  soldiers.forEach(s => s.draw(ctx, camera));
  
  if (smithy.isPlayerNear(player)) {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to forge', smithy.x - camera.x, smithy.y - camera.y + smithy.height / 2 + 20);
  }
  
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  update();
  render();
}

gameLoop();
