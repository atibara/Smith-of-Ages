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
import { UPPER_WORLD_HEIGHT, LANE_Y, GRID_SIZE, HUD_OFFSET } from './Constants.js';

// Systems
import { RenderSystem } from './systems/RenderSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { UISystem } from './systems/UISystem.js';
import { InputSystem } from './systems/InputSystem.js';

// --- COMPATIBILITY SHIM ---
if (typeof CanvasRenderingContext2D.prototype.roundRect !== 'function') {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = 1200;
let height = 800;

// Game State & Entities
const player = new Player(400, 300);
const entities = {
  player,
  smithy: new Smithy(400, 300),
  mine: new IronMine(0, 0),
  forest: new Forest(0, 0),
  armory: new Armory(0, 0),
  workshop: new SiegeWorkshop(0, 0),
  market: new Market(0, 0),
  upperBase: new UpperBase(0, 0),
  enemyBase: new EnemyBase(0, 0),
  soldiers: [],
  archers: [],
  mangonels: [],
  enemies: [],
  arrows: [],
  stones: [],
  xpOrbs: [],
  damageEffects: [],
  playerSpawnQueue: [],
  goldReward: 0
};

const camera = { x: 0, y: 0 };
let gameState = 'MENU';
let loopRunning = false;

// Initialize Systems
const economySystem = new EconomySystem();
const renderSystem = new RenderSystem(canvas, ctx, width, height);
const combatSystem = new CombatSystem();
const uiSystem = new UISystem(economySystem);
const inputSystem = new InputSystem(canvas, player, camera, width, height);

function resize() {
  renderSystem.updateSize(width, height);
  inputSystem.updateSize(width, height);

  const { forest, mine, armory, workshop, smithy, market, upperBase, enemyBase } = entities;
  
  forest.x = 180;
  forest.y = UPPER_WORLD_HEIGHT + 120;
  mine.x = 180;
  mine.y = (height - HUD_OFFSET) - 160;

  armory.x = width - 180;
  armory.y = UPPER_WORLD_HEIGHT + 120;
  workshop.x = width - 180;
  workshop.y = (height - HUD_OFFSET) - 160;

  const lowerWorldCenterY = UPPER_WORLD_HEIGHT + (height - HUD_OFFSET - UPPER_WORLD_HEIGHT) / 2;
  smithy.x = width / 2;
  smithy.y = lowerWorldCenterY - 120; 
  market.x = width / 2 - 150;
  market.y = lowerWorldCenterY + 140; 

  upperBase.x = 80;
  upperBase.y = UPPER_WORLD_HEIGHT / 2;
  enemyBase.x = width - 80;
  enemyBase.y = UPPER_WORLD_HEIGHT / 2;

  renderSystem.generateBackgroundTexture(mine, forest, smithy);
}

// Input Callbacks
inputSystem.init(
  // onInteraction
  () => {
    const { market, mine, forest, smithy, workshop, armory, mangonels } = entities;
    
    if (market.isPlayerNear(player)) {
      gameState = 'SHOPPING';
      inputSystem.setGameState(gameState);
      uiSystem.showMenu('market-ui');
      uiSystem.updateShopButtons();
      return;
    }

    if (mine.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) player.inventory.push('iron');
    } else if (forest.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) player.inventory.push('wood');
    } else if (smithy.isPlayerNear(player)) {
      const ironIndex = player.inventory.indexOf('iron');
      const woodIndex = player.inventory.indexOf('wood');
      if (ironIndex !== -1) player.inventory[ironIndex] = 'sword';
      else if (woodIndex !== -1) player.inventory[woodIndex] = 'bow';
    } else if (workshop.isPlayerNear(player)) {
      if (mangonels.length > 0) return;
      const woodCount = player.inventory.filter(i => i === 'wood').length;
      const ironCount = player.inventory.filter(i => i === 'iron').length;
      if (woodCount >= 2 && ironCount >= 1) {
        // Find indices to remove
        const woodIndices = player.inventory.map((item, i) => item === 'wood' ? i : -1).filter(i => i !== -1);
        const ironIndices = player.inventory.map((item, i) => item === 'iron' ? i : -1).filter(i => i !== -1);
        const toRemove = [woodIndices[0], woodIndices[1], ironIndices[0]].sort((a,b) => b-a);
        toRemove.forEach(idx => player.inventory.splice(idx, 1));
        mangonels.push(new Mangonel(player.x - 60, player.y));
      }
    } else if (armory.isPlayerNear(player)) {
      const followingMangonel = mangonels.find(m => m.state === 'FOLLOWING');
      if (followingMangonel) {
        followingMangonel.state = 'COMBAT';
        followingMangonel.world = 'upper';
        followingMangonel.x = entities.upperBase.x;
        const lane = combatSystem.nextSoldierLane || 0;
        followingMangonel.y = LANE_Y[lane];
        followingMangonel.lane = lane;
        combatSystem.nextSoldierLane = (lane + 1) % 3;
        return;
      }

      const swordIndex = player.inventory.indexOf('sword');
      const bowIndex = player.inventory.indexOf('bow');
      if (swordIndex !== -1 || bowIndex !== -1) {
        let spawnLane = (combatSystem.nextSoldierLane || 0);
        if (swordIndex !== -1) {
          player.inventory.splice(swordIndex, 1);
          entities.playerSpawnQueue.push({ type: 'soldier', lane: spawnLane });
        } else if (bowIndex !== -1) {
          player.inventory.splice(bowIndex, 1);
          entities.playerSpawnQueue.push({ type: 'archer', lane: spawnLane });
        }
        combatSystem.nextSoldierLane = (spawnLane + 1) % 3;
      }
    }
  },
  // onRestart
  () => restartGame(),
  // onMenuToggle
  () => {
    if (gameState === 'PLAYING') {
      gameState = 'MENU';
      inputSystem.setGameState(gameState);
      uiSystem.showMenu('main-menu');
      const playBtn = document.getElementById('btn-play');
      if (playBtn) playBtn.innerText = 'Resume';
    } else if (gameState === 'MENU') {
      const settingsMenu = document.getElementById('settings-menu');
      if (settingsMenu && !settingsMenu.classList.contains('hidden')) {
        uiSystem.hideMenu('settings-menu');
        uiSystem.showMenu('main-menu');
      } else {
        const playBtn = document.getElementById('btn-play');
        if (playBtn && playBtn.innerText === 'Resume') {
          uiSystem.hideMenu('main-menu');
          gameState = 'PLAYING';
          inputSystem.setGameState(gameState);
        }
      }
    }
  }
);

inputSystem.onMove = (worldX, worldY) => {
  const obstacles = [entities.smithy, entities.mine, entities.forest, entities.armory, entities.workshop, entities.market];
  let targetX = worldX;
  let targetY = worldY;

  for (const obs of obstacles) {
    const obsLeft = obs.x - obs.width / 2;
    const obsRight = obs.x + obs.width / 2;
    const obsTop = obs.y - obs.height / 2 - 40; 
    const obsBottom = obs.y + obs.height / 2 + 10;
    
    if (worldX >= obsLeft && worldX <= obsRight && worldY >= obsTop && worldY <= obsBottom) {
        if (obs === entities.market) targetX = obs.x;
        else if (obs === entities.workshop) targetX = obs.x + 45;
        else if (obs === entities.forest) targetX = obs.x + 40;
        else targetX = obs.x + 35;
        targetY = obs.y + obs.height / 2 + 35;
        break;
    }
  }
  player.setTarget(targetX, targetY, obstacles, { minX: 0, maxX: width, minY: UPPER_WORLD_HEIGHT, maxY: height - HUD_OFFSET - 20 });
};

// UI Listeners
document.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
        const cost = parseInt(btn.getAttribute('data-cost'));
        const action = btn.parentElement.id;
        if (economySystem.handlePurchase(cost, action, player, entities.upperBase)) {
            uiSystem.updateShopButtons();
            uiSystem.updateHUD(player);
        }
    });
});

const closeMarketBtn = document.getElementById('btn-close-market');
if (closeMarketBtn) {
  closeMarketBtn.addEventListener('click', () => {
      uiSystem.hideMenu('market-ui');
      gameState = 'PLAYING';
      inputSystem.setGameState(gameState);
  });
}

const playBtn = document.getElementById('btn-play');
if (playBtn) {
  playBtn.addEventListener('click', () => {
      uiSystem.hideMenu('main-menu');
      uiSystem.showMenu('game-hud');
      gameState = 'PLAYING';
      inputSystem.setGameState(gameState);
      if (!loopRunning) gameLoop();
  });
}

const settingsBtn = document.getElementById('btn-settings');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
      uiSystem.hideMenu('main-menu');
      uiSystem.showMenu('settings-menu');
  });
}

const backSettingsBtn = document.getElementById('btn-back-settings');
if (backSettingsBtn) {
  backSettingsBtn.addEventListener('click', () => {
      uiSystem.hideMenu('settings-menu');
      uiSystem.showMenu('main-menu');
  });
}

function update() {
  if (gameState !== 'PLAYING' && gameState !== 'SHOPPING') return;

  const obstacles = [entities.smithy, entities.mine, entities.forest, entities.armory, entities.workshop, entities.market];
  player.update({ minX: 0, maxX: width, minY: UPPER_WORLD_HEIGHT, maxY: height - HUD_OFFSET - 20 }, obstacles);
  
  const isTowing = entities.mangonels.some(m => m.state === 'FOLLOWING');
  player.speedBase = player.speedBase || 2.5;
  player.speed = isTowing ? player.speedBase * 0.48 : player.speedBase;

  if (gameState !== 'PLAYING') return;

  combatSystem.update(entities, economySystem, 16); // Using fixed dt for now

  // Process reward gold from combat
  if (entities.goldReward) {
    economySystem.addGold(entities.goldReward);
    entities.goldReward = 0;
  }

  uiSystem.updateHUD(player);
}

function gameLoop() {
  loopRunning = true;
  update();
  renderSystem.render(gameState, camera, player, entities, HUD_OFFSET);

  if (gameState !== 'GAMEOVER') {
    requestAnimationFrame(gameLoop);
  } else {
    loopRunning = false;
  }
}

function restartGame() {
  entities.upperBase.health = entities.upperBase.maxHealth;
  entities.enemyBase.health = entities.enemyBase.maxHealth;
  entities.soldiers.length = 0;
  entities.archers.length = 0;
  entities.mangonels.length = 0;
  entities.enemies.length = 0;
  entities.arrows.length = 0;
  entities.stones.length = 0;
  entities.xpOrbs.length = 0;
  entities.damageEffects.length = 0;
  entities.playerSpawnQueue.length = 0;
  
  economySystem.gold = 0;
  economySystem.playerLevel = 1;
  economySystem.playerXP = 0;
  economySystem.xpToNextLevel = 100;
  
  combatSystem.nextEnemyLane = 0;
  combatSystem.nextSoldierLane = 0;
  combatSystem.lastEnemySpawn = Date.now();
  
  player.x = width / 2;
  player.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2;
  player.targetX = player.x;
  player.targetY = player.y;
  player.inventory = [];
  player.speedBase = 3.0;
  player.speed = 3.0;
  player.isMoving = false;
  player.path = [];
  
  gameState = 'PLAYING';
  inputSystem.setGameState(gameState);
  if (!loopRunning) gameLoop();
}

window.addEventListener('resize', resize);
resize();

player.x = width / 2;
player.y = UPPER_WORLD_HEIGHT + (height - UPPER_WORLD_HEIGHT) / 2;
player.targetX = player.x;
player.targetY = player.y;
