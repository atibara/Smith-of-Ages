import { Player } from './entities/Player.js';
import { Smithy } from './entities/Smithy.js';
import { Soldier } from './entities/Soldier.js';
import { Enemy } from './entities/Enemy.js';
import { IronMine } from './entities/IronMine.js';
import { Armory } from './entities/Armory.js';
import { UpperBase } from './entities/UpperBase.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const UPPER_WORLD_HEIGHT = 150;
const player = new Player(400, 300);
const smithy = new Smithy(400, 300);
const mine = new IronMine(0, 0);
const armory = new Armory(0, 0);
const upperBase = new UpperBase(0, 0);
const soldiers = [];
const enemies = [];
const camera = { x: 0, y: 0 };
const GRID_SIZE = 100;

// Enemy Spawning
let lastEnemySpawn = Date.now();
const SPAWN_INTERVAL = 8000; // Spawn every 8 seconds

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  
  // Position buildings
  smithy.x = width / 2;
  smithy.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2;
  
  mine.x = 100;
  mine.y = height - 100;
  
  armory.x = width - 150;
  armory.y = UPPER_WORLD_HEIGHT + 60;

  upperBase.x = 80;
  upperBase.y = UPPER_WORLD_HEIGHT / 2;
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
    // 1. Interaction with Mine (Gather Iron)
    if (mine.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) {
        player.inventory.push('iron');
      }
    }
    // 2. Interaction with Smithy (Forge Iron -> Sword)
    else if (smithy.isPlayerNear(player)) {
      const ironIndex = player.inventory.indexOf('iron');
      if (ironIndex !== -1) {
        player.inventory[ironIndex] = 'sword';
      }
    }
    // 3. Interaction with Armory (Deliver Sword -> Spawn Soldier)
    else if (armory.isPlayerNear(player)) {
      const swordIndex = player.inventory.indexOf('sword');
      if (swordIndex !== -1) {
        player.inventory.splice(swordIndex, 1);
        const newSoldier = new Soldier(UPPER_WORLD_HEIGHT / 2);
        // Spawn "inside" the base
        newSoldier.x = upperBase.x; 
        soldiers.push(newSoldier);
      }
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
  
  // Spawning enemies
  if (Date.now() - lastEnemySpawn > SPAWN_INTERVAL) {
    const newEnemy = new Enemy(width + 50, UPPER_WORLD_HEIGHT / 2);
    enemies.push(newEnemy);
    lastEnemySpawn = Date.now();
  }

  // Update soldiers
  for (let i = soldiers.length - 1; i >= 0; i--) {
    soldiers[i].update(soldiers, enemies);
    if (soldiers[i].health <= 0 || soldiers[i].x > width + 100) {
      soldiers.splice(i, 1);
    }
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(enemies, soldiers, upperBase);
    if (enemies[i].health <= 0 || enemies[i].x < -100) {
      enemies.splice(i, 1);
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
  upperBase.draw(ctx, camera);
  mine.draw(ctx, camera);
  smithy.draw(ctx, camera);
  armory.draw(ctx, camera);
  player.draw(ctx, camera);
  
  soldiers.forEach(s => s.draw(ctx, camera));
  enemies.forEach(e => e.draw(ctx, camera));
  
  // Interaction Prompts
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';

  if (mine.isPlayerNear(player)) {
    if (player.inventory.length < player.maxInventory) {
      ctx.fillText('Press SPACE to mine iron', mine.x, mine.y + mine.height / 2 + 20);
    } else {
      ctx.fillText('Inventory Full!', mine.x, mine.y + mine.height / 2 + 20);
    }
  } else if (smithy.isPlayerNear(player)) {
    if (player.inventory.includes('iron')) {
      ctx.fillText('Press SPACE to forge sword', smithy.x, smithy.y + smithy.height / 2 + 20);
    } else {
      ctx.fillText('Need Iron!', smithy.x, smithy.y + smithy.height / 2 + 20);
    }
  } else if (armory.isPlayerNear(player)) {
    if (player.inventory.includes('sword')) {
      ctx.fillText('Press SPACE to deliver sword', armory.x, armory.y + armory.height / 2 + 20);
    } else {
      ctx.fillText('Need Sword!', armory.x, armory.y + armory.height / 2 + 20);
    }
  }

  // Game Over Check
  if (upperBase.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('GAME OVER - BASE DESTROYED', width / 2, height / 2);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Refresh to restart', width / 2, height / 2 + 50);
  } else {
    requestAnimationFrame(gameLoop);
  }
}

function gameLoop() {
  update();
  render();
}

gameLoop();
