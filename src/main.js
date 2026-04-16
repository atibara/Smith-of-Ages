import { Player } from './entities/Player.js';
import { Smithy } from './entities/Smithy.js';
import { Soldier } from './entities/Soldier.js';
import { Archer } from './entities/Archer.js';
import { Enemy } from './entities/Enemy.js';
import { EnemyArcher } from './entities/EnemyArcher.js';
import { IronMine } from './entities/IronMine.js';
import { Forest } from './entities/Forest.js';
import { Armory } from './entities/Armory.js';
import { UpperBase } from './entities/UpperBase.js';
import { EnemyBase } from './entities/EnemyBase.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const UPPER_WORLD_HEIGHT = 150;
const player = new Player(400, 300);
const smithy = new Smithy(400, 300);
const mine = new IronMine(0, 0);
const forest = new Forest(0, 0);
const armory = new Armory(0, 0);
const upperBase = new UpperBase(0, 0);
const enemyBase = new EnemyBase(0, 0);
const soldiers = [];
const archers = [];
const enemies = [];
const arrows = [];
const camera = { x: 0, y: 0 };
const GRID_SIZE = 100;

// Enemy Spawning
let lastEnemySpawn = Date.now();
const ENEMY_SPAWN_INTERVAL_MAX = 8000; 
const ENEMY_SPAWN_INTERVAL_MIN = 2000;
let currentSpawnInterval = ENEMY_SPAWN_INTERVAL_MAX;

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

  forest.x = 100;
  forest.y = UPPER_WORLD_HEIGHT + 100;
  
  armory.x = width - 150;
  armory.y = UPPER_WORLD_HEIGHT + 60;

  upperBase.x = 80;
  upperBase.y = UPPER_WORLD_HEIGHT / 2;
  
  enemyBase.x = width - 80;
  enemyBase.y = UPPER_WORLD_HEIGHT / 2;
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
    // 2. Interaction with Forest (Gather Wood)
    else if (forest.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) {
        player.inventory.push('wood');
      }
    }
    // 3. Interaction with Smithy (Forge Iron -> Sword or Wood -> Bow)
    else if (smithy.isPlayerNear(player)) {
      const ironIndex = player.inventory.indexOf('iron');
      const woodIndex = player.inventory.indexOf('wood');
      
      if (ironIndex !== -1) {
        player.inventory[ironIndex] = 'sword';
      } else if (woodIndex !== -1) {
        player.inventory[woodIndex] = 'bow';
      }
    }
    // 4. Interaction with Armory (Deliver Sword/Bow -> Spawn Soldier/Archer)
    else if (armory.isPlayerNear(player)) {
      const swordIndex = player.inventory.indexOf('sword');
      const bowIndex = player.inventory.indexOf('bow');
      
      if (swordIndex !== -1) {
        player.inventory.splice(swordIndex, 1);
        const newSoldier = new Soldier(UPPER_WORLD_HEIGHT / 2);
        newSoldier.x = upperBase.x; 
        soldiers.push(newSoldier);
      } else if (bowIndex !== -1) {
        player.inventory.splice(bowIndex, 1);
        const newArcher = new Archer(UPPER_WORLD_HEIGHT / 2);
        newArcher.x = upperBase.x; 
        archers.push(newArcher);
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
  
  // Calculate dynamic spawn interval based on player proximity to enemy base
  const allPlayerUnits = soldiers.concat(archers);
  if (allPlayerUnits.length > 0) {
    const maxX = Math.max(...allPlayerUnits.map(u => u.x));
    // Normalize proximity (0 when at upperBase, 1 when at enemyBase)
    const proximity = Math.min(1, Math.max(0, (maxX - upperBase.x) / (enemyBase.x - upperBase.x)));
    currentSpawnInterval = ENEMY_SPAWN_INTERVAL_MAX - (ENEMY_SPAWN_INTERVAL_MAX - ENEMY_SPAWN_INTERVAL_MIN) * proximity;
  } else {
    currentSpawnInterval = ENEMY_SPAWN_INTERVAL_MAX;
  }

  // Spawning enemies from the enemy base if it's not destroyed
  if (enemyBase.health > 0 && Date.now() - lastEnemySpawn > currentSpawnInterval) {
    // 75% Melee Enemy, 25% Archer Enemy
    if (Math.random() < 0.75) {
      enemies.push(new Enemy(enemyBase.x, UPPER_WORLD_HEIGHT / 2));
    } else {
      enemies.push(new EnemyArcher(enemyBase.x, UPPER_WORLD_HEIGHT / 2));
    }
    lastEnemySpawn = Date.now();
  }

  // Update soldiers
  for (let i = soldiers.length - 1; i >= 0; i--) {
    soldiers[i].update(soldiers, enemies, enemyBase);
    if (soldiers[i].health <= 0) soldiers.splice(i, 1);
  }

  // Update archers
  for (let i = archers.length - 1; i >= 0; i--) {
    archers[i].update(archers, enemies, enemyBase, arrows);
    if (archers[i].health <= 0) archers.splice(i, 1);
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(enemies, allPlayerUnits, upperBase, arrows);
    if (enemies[i].health <= 0 || enemies[i].x < -100) {
      enemies.splice(i, 1);
    }
  }

  // Update arrows
  for (let i = arrows.length - 1; i >= 0; i--) {
    if (arrows[i].team === 'player') {
      arrows[i].update(enemies, enemyBase);
    } else {
      arrows[i].update(allPlayerUnits, upperBase);
    }
    if (!arrows[i].active) arrows.splice(i, 1);
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
  enemyBase.draw(ctx, camera);
  mine.draw(ctx, camera);
  forest.draw(ctx, camera);
  smithy.draw(ctx, camera);
  armory.draw(ctx, camera);
  player.draw(ctx, camera);
  
  soldiers.forEach(s => s.draw(ctx, camera));
  archers.forEach(a => a.draw(ctx, camera));
  enemies.forEach(e => e.draw(ctx, camera));
  arrows.forEach(a => a.draw(ctx, camera));
  
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
  } else if (forest.isPlayerNear(player)) {
    if (player.inventory.length < player.maxInventory) {
      ctx.fillText('Press SPACE to gather wood', forest.x, forest.y + forest.height / 2 + 20);
    } else {
      ctx.fillText('Inventory Full!', forest.x, forest.y + forest.height / 2 + 20);
    }
  } else if (smithy.isPlayerNear(player)) {
    const hasIron = player.inventory.includes('iron');
    const hasWood = player.inventory.includes('wood');
    if (hasIron) {
      ctx.fillText('Press SPACE to forge sword', smithy.x, smithy.y + smithy.height / 2 + 20);
    } else if (hasWood) {
      ctx.fillText('Press SPACE to forge bow', smithy.x, smithy.y + smithy.height / 2 + 20);
    } else {
      ctx.fillText('Need Iron or Wood!', smithy.x, smithy.y + smithy.height / 2 + 20);
    }
  } else if (armory.isPlayerNear(player)) {
    const hasSword = player.inventory.includes('sword');
    const hasBow = player.inventory.includes('bow');
    if (hasSword) {
      ctx.fillText('Press SPACE to deliver sword', armory.x, armory.y + armory.height / 2 + 20);
    } else if (hasBow) {
      ctx.fillText('Press SPACE to deliver bow', armory.x, armory.y + armory.height / 2 + 20);
    } else {
      ctx.fillText('Need Sword or Bow!', armory.x, armory.y + armory.height / 2 + 20);
    }
  }

  // End Game Check
  if (upperBase.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('DEFEAT - BASE DESTROYED', width / 2, height / 2);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Refresh to restart', width / 2, height / 2 + 50);
  } else if (enemyBase.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('VICTORY - ENEMY BASE DESTROYED', width / 2, height / 2);
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
