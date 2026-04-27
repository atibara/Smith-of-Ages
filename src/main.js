import { Player } from './entities/Player.js';
import { Smithy } from './entities/Smithy.js';
import { Soldier } from './entities/Soldier.js';
import { Archer } from './entities/Archer.js';
import { Mangonel } from './entities/Mangonel.js';
import { Stone } from './entities/Stone.js';
import { Enemy } from './entities/Enemy.js';
import { EnemyArcher } from './entities/EnemyArcher.js';
import { IronMine } from './entities/IronMine.js';
import { Forest } from './entities/Forest.js';
import { Armory } from './entities/Armory.js';
import { SiegeWorkshop } from './entities/SiegeWorkshop.js';
import { UpperBase } from './entities/UpperBase.js';
import { Market } from './entities/Market.js';
import { EnemyBase } from './entities/EnemyBase.js';
import { UPPER_WORLD_HEIGHT, LANE_Y, GRID_SIZE } from './Constants.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- FIXED VIRTUAL RESOLUTION ---
let width = 1200;
let height = 800;

const player = new Player(400, 300);
const smithy = new Smithy(400, 300);
const mine = new IronMine(0, 0);
const forest = new Forest(0, 0);
const armory = new Armory(0, 0);
const workshop = new SiegeWorkshop(0, 0);
const market = new Market(0, 0);
const upperBase = new UpperBase(0, 0);
const enemyBase = new EnemyBase(0, 0);
const soldiers = [];
const archers = [];
const mangonels = [];
const enemies = [];
const arrows = [];
const stones = [];
const camera = { x: 0, y: 0 };

// Enemy Spawning
let lastEnemySpawn = Date.now();
const ENEMY_SPAWN_INTERVAL_MAX = 8000; 
const ENEMY_SPAWN_INTERVAL_MIN = 2000;
let currentSpawnInterval = ENEMY_SPAWN_INTERVAL_MAX;
let gold = 0;

let nextSoldierLane = 0;
let nextEnemyLane = 0;

// XP System
let playerLevel = 1;
let playerXP = 0;
let xpToNextLevel = 100;
const xpOrbs = [];

class XPOrb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 4;
    this.speed = 3 + Math.random() * 2;
    this.color = '#9b59b6'; // Purple
    this.active = true;
  }

  update(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {
      this.active = false;
      return true; // Collected
    }

    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
    return false;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');

function generateBackgroundTexture() {
  if (!width || !height) return;
  bgCanvas.width = width;
  bgCanvas.height = height;

  // Upper world (Battlefield)
  bgCtx.fillStyle = '#2c3e50';
  bgCtx.fillRect(0, 0, width, UPPER_WORLD_HEIGHT);
  
  // Add dirt/battle marks to upper world
  for(let i=0; i<800; i++) {
    let rx = Math.random() * width;
    let ry = Math.random() * UPPER_WORLD_HEIGHT;
    bgCtx.fillStyle = Math.random() > 0.5 ? '#1a252f' : '#34495e';
    bgCtx.fillRect(rx, ry, 4 + Math.random()*4, 4 + Math.random()*4);
  }

  // Lower world (Base grass)
  bgCtx.fillStyle = '#1e8449'; // Base grassy green
  bgCtx.fillRect(0, UPPER_WORLD_HEIGHT, width, height - UPPER_WORLD_HEIGHT);

  // Add grass texture
  for(let i=0; i<2000; i++) {
    let rx = Math.random() * width;
    let ry = UPPER_WORLD_HEIGHT + Math.random() * (height - UPPER_WORLD_HEIGHT);
    bgCtx.fillStyle = Math.random() > 0.5 ? '#27ae60' : '#196f3d';
    bgCtx.fillRect(rx, ry, 6, 6);
  }

  const drawBiome = (x, y, r, innerColor, outerColor) => {
    let grad = bgCtx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(1, outerColor);
    bgCtx.fillStyle = grad;
    bgCtx.beginPath();
    bgCtx.arc(x, y, r, 0, Math.PI * 2);
    bgCtx.fill();
  };

  // Rocky area for Mine
  drawBiome(mine.x, mine.y, 300, 'rgba(127, 140, 141, 0.95)', 'rgba(127, 140, 141, 0)');
  drawBiome(mine.x, mine.y, 200, 'rgba(96, 105, 107, 0.9)', 'rgba(96, 105, 107, 0)');
  
  // Dense forest grass for Forest
  drawBiome(forest.x, forest.y, 300, 'rgba(21, 67, 32, 0.8)', 'rgba(21, 67, 32, 0)');
  
  // Dirt path/area for Smithy & Armory & Workshop
  drawBiome(smithy.x, smithy.y, 250, 'rgba(110, 44, 0, 0.7)', 'rgba(110, 44, 0, 0)');
  drawBiome(armory.x, armory.y, 250, 'rgba(110, 44, 0, 0.7)', 'rgba(110, 44, 0, 0)');
  drawBiome(workshop.x, workshop.y, 250, 'rgba(110, 44, 0, 0.7)', 'rgba(110, 44, 0, 0)');
}

function resize() {
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = false;
  
  // Position buildings based on 1200x800 virtual space
  smithy.x = width / 2;
  smithy.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2;
  
  mine.x = 200;
  mine.y = height - 120;

  forest.x = 200;
  forest.y = UPPER_WORLD_HEIGHT + 140;
  
  armory.x = width - 200;
  armory.y = UPPER_WORLD_HEIGHT + 140;

  workshop.x = width - 200;
  workshop.y = height - 120;

  market.x = width / 2 - 250;
  market.y = (forest.y + mine.y) / 2;

  upperBase.x = 80;
  upperBase.y = UPPER_WORLD_HEIGHT / 2;
  
  enemyBase.x = width - 80;
  enemyBase.y = UPPER_WORLD_HEIGHT / 2;

  generateBackgroundTexture();
}

window.addEventListener('resize', resize);
resize();

player.x = width / 2;
player.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2 + 100;
player.targetX = player.x;
player.targetY = player.y;

let gameState = 'MENU'; // 'MENU', 'PLAYING', 'SHOPPING', 'EXIT'

// Input handling - keyboard
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (gameState === 'PLAYING') {
      gameState = 'MENU';
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) {
        mainMenu.classList.remove('hidden');
        const playBtn = document.getElementById('btn-play');
        if (playBtn) playBtn.innerText = 'Resume';
      }
    } else if (gameState === 'MENU') {
      const settingsMenu = document.getElementById('settings-menu');
      const mainMenu = document.getElementById('main-menu');
      if (settingsMenu && !settingsMenu.classList.contains('hidden')) {
          settingsMenu.classList.add('hidden');
          if (mainMenu) mainMenu.classList.remove('hidden');
      } else if (mainMenu && !mainMenu.classList.contains('hidden')) {
          const playBtn = document.getElementById('btn-play');
          if (playBtn && playBtn.innerText === 'Resume') {
              mainMenu.classList.add('hidden');
              gameState = 'PLAYING';
          }
      }
    }
    return;
  }

  if (gameState !== 'PLAYING') return;

  if (e.code === 'Space') {
    if (market.isPlayerNear(player)) {
      gameState = 'SHOPPING';
      const marketUI = document.getElementById('market-ui');
      if (marketUI) marketUI.classList.remove('hidden');
      updateShopButtons();
      return;
    }

    if (mine.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) {
        player.inventory.push('iron');
      }
    }
    else if (forest.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) {
        player.inventory.push('wood');
      }
    }
    else if (smithy.isPlayerNear(player)) {
      const ironIndex = player.inventory.indexOf('iron');
      const woodIndex = player.inventory.indexOf('wood');
      if (ironIndex !== -1) {
        player.inventory[ironIndex] = 'sword';
      } else if (woodIndex !== -1) {
        player.inventory[woodIndex] = 'bow';
      }
    }
    else if (workshop.isPlayerNear(player)) {
      if (mangonels.length > 0) return;
      const ironIndices = player.inventory.map((item, i) => item === 'iron' ? i : -1).filter(i => i !== -1);
      const woodIndices = player.inventory.map((item, i) => item === 'wood' ? i : -1).filter(i => i !== -1);
      if (woodIndices.length >= 2 && ironIndices.length >= 1) {
        const toRemove = [woodIndices[0], woodIndices[1], ironIndices[0]].sort((a,b) => b-a);
        toRemove.forEach(idx => player.inventory.splice(idx, 1));
        const newMangonel = new Mangonel(player.x - 60, player.y);
        mangonels.push(newMangonel);
      }
    }
    else if (armory.isPlayerNear(player)) {
      const followingMangonel = mangonels.find(m => m.state === 'FOLLOWING');
      if (followingMangonel) {
        followingMangonel.state = 'COMBAT';
        followingMangonel.world = 'upper';
        followingMangonel.x = upperBase.x;
        followingMangonel.y = LANE_Y[nextSoldierLane];
        followingMangonel.lane = nextSoldierLane;
        nextSoldierLane = (nextSoldierLane + 1) % 3;
        return;
      }

      const swordIndex = player.inventory.indexOf('sword');
      const bowIndex = player.inventory.indexOf('bow');
      if (swordIndex !== -1 || bowIndex !== -1) {
        let targetLane = -1;
        if (enemies.length > 0) {
          const laneCounts = [0, 0, 0];
          enemies.forEach(e => laneCounts[e.lane]++);
          let maxCount = 0;
          for (let l = 0; l < 3; l++) {
            if (laneCounts[l] > maxCount) {
              maxCount = laneCounts[l];
              targetLane = l;
            }
          }
        }
        const spawnLane = targetLane !== -1 ? targetLane : nextSoldierLane;
        if (swordIndex !== -1) {
          player.inventory.splice(swordIndex, 1);
          soldiers.push(new Soldier(upperBase.x, LANE_Y[spawnLane], spawnLane));
        } else if (bowIndex !== -1) {
          player.inventory.splice(bowIndex, 1);
          archers.push(new Archer(upperBase.x, LANE_Y[spawnLane], spawnLane));
        }
        if (targetLane === -1) {
          nextSoldierLane = (nextSoldierLane + 1) % LANE_Y.length;
        }
      }
    }
  }
});

canvas.addEventListener('mousedown', (e) => {
  if (gameState !== 'PLAYING') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const screenX = (e.clientX - rect.left) * scaleX;
  const screenY = (e.clientY - rect.top) * scaleY;
  const worldX = screenX + camera.x;
  const worldY = screenY + camera.y;
  const obstacles = [smithy, mine, forest, armory, workshop, market];
  // Subtract 80px from maxY for HUD area
  player.setTarget(worldX, worldY, obstacles, { minX: 0, maxX: width, minY: UPPER_WORLD_HEIGHT, maxY: height - 80 });
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
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, UPPER_WORLD_HEIGHT, width, height - UPPER_WORLD_HEIGHT);
}

function update() {
  if (gameState !== 'PLAYING' && gameState !== 'SHOPPING') return;

  const obstacles = [smithy, mine, forest, armory, workshop, market];
  // Subtract 80px from maxY for HUD area
  player.update({ minX: 0, maxX: width, minY: UPPER_WORLD_HEIGHT, maxY: height - 80 }, obstacles);
  
  const isTowing = mangonels.some(m => m.state === 'FOLLOWING');
  player.speedBase = player.speedBase || 2.5;
  player.speed = isTowing ? player.speedBase * 0.48 : player.speedBase;

  if (gameState !== 'PLAYING') return;

  const allPlayerUnits = soldiers.concat(archers);
  if (allPlayerUnits.length > 0) {
    const maxX = Math.max(...allPlayerUnits.map(u => u.x));
    const proximity = Math.min(1, Math.max(0, (maxX - upperBase.x) / (enemyBase.x - upperBase.x)));
    currentSpawnInterval = ENEMY_SPAWN_INTERVAL_MAX - (ENEMY_SPAWN_INTERVAL_MAX - ENEMY_SPAWN_INTERVAL_MIN) * proximity;
  } else {
    currentSpawnInterval = ENEMY_SPAWN_INTERVAL_MAX;
  }

  if (enemyBase.health > 0 && Date.now() - lastEnemySpawn > currentSpawnInterval) {
    let targetLane = -1;
    const allPlayers = soldiers.concat(archers);
    if (allPlayers.length > 0) {
      const laneCounts = [0, 0, 0];
      allPlayers.forEach(p => laneCounts[p.lane]++);
      let maxCount = 0;
      for (let l = 0; l < 3; l++) {
        if (laneCounts[l] > maxCount) {
          maxCount = laneCounts[l];
          targetLane = l;
        }
      }
    }
    const lane = targetLane !== -1 ? targetLane : nextEnemyLane;
    if (Math.random() < 0.75) {
      enemies.push(new Enemy(enemyBase.x, LANE_Y[lane], lane));
    } else {
      enemies.push(new EnemyArcher(enemyBase.x, LANE_Y[lane], lane));
    }
    if (targetLane === -1) {
      nextEnemyLane = (nextEnemyLane + 1) % LANE_Y.length;
    }
    lastEnemySpawn = Date.now();
  }

  for (let i = soldiers.length - 1; i >= 0; i--) {
    soldiers[i].update(soldiers, enemies, enemyBase, archers, mangonels);
    if (soldiers[i].health <= 0) soldiers.splice(i, 1);
  }
  for (let i = archers.length - 1; i >= 0; i--) {
    archers[i].update(archers, enemies, enemyBase, arrows, soldiers, mangonels);
    if (archers[i].health <= 0) archers.splice(i, 1);
  }
  for (let i = mangonels.length - 1; i >= 0; i--) {
    mangonels[i].update(mangonels, enemies, enemyBase, stones, player, allPlayerUnits);
    if (mangonels[i].health <= 0) mangonels.splice(i, 1);
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(enemies, allPlayerUnits.concat(mangonels.filter(m => m.state === 'COMBAT')), upperBase, arrows);
    if (enemies[i].health <= 0 || enemies[i].x < -100) {
      if (enemies[i].health <= 0) {
        gold += enemies[i].goldReward || 0;
        // Spawn XP Orbs
        const xpAmount = Math.floor(Math.random() * 3) + 2; // 2-4 orbs
        for (let j = 0; j < xpAmount; j++) {
            xpOrbs.push(new XPOrb(enemies[i].x, enemies[i].y, 5));
        }
      }
      enemies.splice(i, 1);
    }
  }

  // Update XP Orbs
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
      if (xpOrbs[i].update(player)) {
          playerXP += xpOrbs[i].value;
          if (playerXP >= xpToNextLevel) {
              playerXP -= xpToNextLevel;
              playerLevel++;
              xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
          }
          xpOrbs.splice(i, 1);
      }
  }
  for (let i = arrows.length - 1; i >= 0; i--) {
    if (arrows[i].team === 'player') {
      arrows[i].update(enemies, enemyBase);
    } else {
      arrows[i].update(allPlayerUnits.concat(mangonels), upperBase);
    }
    if (!arrows[i].active) arrows.splice(i, 1);
  }
  for (let i = stones.length - 1; i >= 0; i--) {
    stones[i].update(enemies, enemyBase);
    if (!stones[i].active) stones.splice(i, 1);
  }
  
  updateHUD();
}

function updateHUD() {
  const goldEl = document.getElementById('gold-amount');
  const xpBar = document.getElementById('xp-bar');
  const levelEl = document.getElementById('player-level');
  const invSlots = document.getElementById('inventory-slots');

  if (goldEl) goldEl.innerText = Math.floor(gold);

  if (xpBar) {
    const xpPercent = (playerXP / xpToNextLevel) * 100;
    xpBar.style.width = `${xpPercent}%`;
  }
  if (levelEl) levelEl.innerText = playerLevel;

  if (invSlots && player) {
      invSlots.innerHTML = '';
      for (let i = 0; i < player.maxInventory; i++) {
          const slot = document.createElement('div');
          slot.className = 'inv-slot';
          if (player.inventory[i]) {
              const item = player.inventory[i];
              if (item === 'iron') slot.innerText = '⛓️';
              else if (item === 'wood') slot.innerText = '🪵';
              else if (item === 'sword') slot.innerText = '⚔️';
              else if (item === 'bow') slot.innerText = '🏹';
          }
          invSlots.appendChild(slot);
      }
  }
}

function render() {
  ctx.drawImage(bgCanvas, -camera.x, -camera.y);
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, UPPER_WORLD_HEIGHT);
  ctx.lineTo(width, UPPER_WORLD_HEIGHT);
  ctx.stroke();
  drawGrid();
  upperBase.draw(ctx, camera);
  enemyBase.draw(ctx, camera);
  mine.draw(ctx, camera, player);
  forest.draw(ctx, camera, player);
  market.draw(ctx, camera, player);
  workshop.draw(ctx, camera, player);
  smithy.draw(ctx, camera, player);
  armory.draw(ctx, camera, player);
  player.draw(ctx, camera);
  mine.drawUI(ctx, camera, player);
  forest.drawUI(ctx, camera, player);
  market.drawUI(ctx, camera, player);
  workshop.drawUI(ctx, camera, player);
  smithy.drawUI(ctx, camera, player);
  armory.drawUI(ctx, camera, player);
  mangonels.filter(m => m.state === 'FOLLOWING').forEach(m => m.draw(ctx, camera));
  soldiers.forEach(s => s.draw(ctx, camera));
  archers.forEach(a => a.draw(ctx, camera));
  mangonels.filter(m => m.state === 'COMBAT').forEach(m => m.draw(ctx, camera));
  enemies.forEach(e => e.draw(ctx, camera));
  arrows.forEach(a => a.draw(ctx, camera));
  stones.forEach(s => s.draw(ctx, camera));
  xpOrbs.forEach(orb => orb.draw(ctx));

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  if (mine.isPlayerNear(player)) {
    if (player.inventory.length < player.maxInventory) ctx.fillText('Press SPACE to mine iron', mine.x, mine.y + mine.height / 2 + 20);
    else ctx.fillText('Inventory Full!', mine.x, mine.y + mine.height / 2 + 20);
  } else if (forest.isPlayerNear(player)) {
    if (player.inventory.length < player.maxInventory) ctx.fillText('Press SPACE to gather wood', forest.x, forest.y + forest.height / 2 + 20);
    else ctx.fillText('Inventory Full!', forest.x, forest.y + forest.height / 2 + 20);
  } else if (smithy.isPlayerNear(player)) {
    const hasIron = player.inventory.includes('iron');
    const hasWood = player.inventory.includes('wood');
    if (hasIron) ctx.fillText('Press SPACE to forge SWORD (1 Iron)', smithy.x, smithy.y + smithy.height / 2 + 20);
    else if (hasWood) ctx.fillText('Press SPACE to forge BOW (1 Wood)', smithy.x, smithy.y + smithy.height / 2 + 20);
    else ctx.fillText('Need Iron or Wood!', smithy.x, smithy.y + smithy.height / 2 + 20);
  } else if (workshop.isPlayerNear(player)) {
    const woodCount = player.inventory.filter(i => i === 'wood').length;
    const ironCount = player.inventory.filter(i => i === 'iron').length;
    if (mangonels.length > 0) ctx.fillText('Already have a Mangonel!', workshop.x, workshop.y + workshop.height / 2 + 20);
    else if (woodCount >= 2 && ironCount >= 1) ctx.fillText('Press SPACE to build MANGONEL (2W + 1I)', workshop.x, workshop.y + workshop.height / 2 + 20);
    else ctx.fillText('Need 2 Wood and 1 Iron!', workshop.x, workshop.y + workshop.height / 2 + 20);
  } else if (armory.isPlayerNear(player)) {
    const hasSword = player.inventory.includes('sword');
    const hasBow = player.inventory.includes('bow');
    const followingMangonel = mangonels.find(m => m.state === 'FOLLOWING');
    if (followingMangonel) ctx.fillText('Press SPACE to deploy MANGONEL to battlefield', armory.x, armory.y + armory.height / 2 + 20);
    else if (hasSword) ctx.fillText('Press SPACE to deliver sword', armory.x, armory.y + armory.height / 2 + 20);
    else if (hasBow) ctx.fillText('Press SPACE to deliver bow', armory.x, armory.y + armory.height / 2 + 20);
    else ctx.fillText('Need Sword, Bow or Follower Mangonel!', armory.x, armory.y + armory.height / 2 + 20);
  }

  if (upperBase.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('DEFEAT - BASE DESTROYED', width / 2, height / 2);
  } else if (enemyBase.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('VICTORY - ENEMY BASE DESTROYED', width / 2, height / 2);
  } else {
    requestAnimationFrame(gameLoop);
  }
}

function updateShopButtons() {
    const buttons = document.querySelectorAll('.btn-buy');
    buttons.forEach(btn => {
        const cost = parseInt(btn.getAttribute('data-cost'));
        btn.disabled = gold < cost;
    });
}

document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
        const cost = parseInt(btn.getAttribute('data-cost'));
        const action = btn.parentElement.id;
        if (gold >= cost) {
            gold -= cost;
            if (action === 'buy-speed') player.speedBase = (player.speedBase || 2.5) * 1.2;
            else if (action === 'buy-capacity') player.maxInventory += 2;
            else if (action === 'repair-base') upperBase.health = Math.min(upperBase.maxHealth, upperBase.health + upperBase.maxHealth * 0.25);
            updateShopButtons();
            updateHUD();
        }
    });
});

const closeMarketBtn = document.getElementById('btn-close-market');
if (closeMarketBtn) {
  closeMarketBtn.addEventListener('click', () => {
      const marketUI = document.getElementById('market-ui');
      if (marketUI) marketUI.classList.add('hidden');
      gameState = 'PLAYING';
  });
}

function gameLoop() {
  update();
  render();
}

gameLoop();

// --- UI EVENT LISTENERS ---
const playBtn = document.getElementById('btn-play');
if (playBtn) {
  playBtn.addEventListener('click', () => {
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) mainMenu.classList.add('hidden');
      const gameHud = document.getElementById('game-hud');
      if (gameHud) gameHud.classList.remove('hidden');
      gameState = 'PLAYING';
  });
}

const settingsBtn = document.getElementById('btn-settings');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) mainMenu.classList.add('hidden');
      const settingsMenu = document.getElementById('settings-menu');
      if (settingsMenu) settingsMenu.classList.remove('hidden');
  });
}

const backSettingsBtn = document.getElementById('btn-back-settings');
if (backSettingsBtn) {
  backSettingsBtn.addEventListener('click', () => {
      const settingsMenu = document.getElementById('settings-menu');
      if (settingsMenu) settingsMenu.classList.add('hidden');
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) mainMenu.classList.remove('hidden');
  });
}

const exitBtn = document.getElementById('btn-exit');
if (exitBtn) {
  exitBtn.addEventListener('click', () => {
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) mainMenu.classList.add('hidden');
      const exitScreen = document.getElementById('exit-screen');
      if (exitScreen) exitScreen.classList.remove('hidden');
  });
}

const backExitBtn = document.getElementById('btn-back-exit');
if (backExitBtn) {
  backExitBtn.addEventListener('click', () => {
      const exitScreen = document.getElementById('exit-screen');
      if (exitScreen) exitScreen.classList.add('hidden');
      const mainMenu = document.getElementById('main-menu');
      if (mainMenu) mainMenu.classList.remove('hidden');
  });
}
