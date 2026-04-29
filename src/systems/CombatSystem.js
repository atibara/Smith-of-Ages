import { LANE_Y } from '../Constants.js';
import { Soldier } from '../entities/Soldier.js';
import { Archer } from '../entities/Archer.js';
import { Enemy } from '../entities/Enemy.js';
import { EnemyArcher } from '../entities/EnemyArcher.js';
import { XPOrb } from '../entities/XPOrb.js';
import { DamageEffect } from '../entities/DamageEffect.js';

export class CombatSystem {
  constructor() {
    this.lastEnemySpawn = Date.now();
    this.ENEMY_SPAWN_INTERVAL_MAX = 8000;
    this.ENEMY_SPAWN_INTERVAL_MIN = 2000;
    this.currentSpawnInterval = this.ENEMY_SPAWN_INTERVAL_MAX;
    this.nextEnemyLane = 0;
    this.nextSoldierLane = 0;
  }

  update(entities, economySystem, dt) {
    const { player, soldiers, archers, enemies, mangonels, arrows, stones, xpOrbs, damageEffects, enemyBase, upperBase, playerSpawnQueue } = entities;
    const allPlayerUnits = soldiers.concat(archers);

    // 1. Player Spawning
    this.handlePlayerSpawning(playerSpawnQueue, allPlayerUnits, soldiers, archers, upperBase);

    // 2. Enemy Spawning
    this.handleEnemySpawning(entities, allPlayerUnits);

    // 3. Update Units
    this.updateUnits(entities, damageEffects);

    // 4. Update Projectiles
    this.updateProjectiles(entities, damageEffects);

    // 5. Update XP Orbs and Damage Effects
    this.updateParticles(entities, economySystem);
  }

  handlePlayerSpawning(queue, allUnits, soldiers, archers, upperBase) {
    if (queue.length > 0) {
      let spawnedIndex = -1;
      for (let i = 0; i < queue.length; i++) {
        const req = queue[i];
        let laneClear = true;
        for (const u of allUnits) {
          if (u.lane === req.lane && Math.abs(u.x - upperBase.x) < 50) {
            laneClear = false;
            break;
          }
        }
        if (laneClear) {
          if (req.type === 'soldier') soldiers.push(new Soldier(upperBase.x, LANE_Y[req.lane], req.lane));
          else if (req.type === 'archer') archers.push(new Archer(upperBase.x, LANE_Y[req.lane], req.lane));
          spawnedIndex = i;
          break;
        }
      }
      if (spawnedIndex !== -1) queue.splice(spawnedIndex, 1);
    }
  }

  handleEnemySpawning(entities, allPlayerUnits) {
    const { enemies, enemyBase, upperBase } = entities;
    if (allPlayerUnits.length > 0) {
      const maxX = Math.max(...allPlayerUnits.map(u => u.x));
      const proximity = Math.min(1, Math.max(0, (maxX - upperBase.x) / (enemyBase.x - upperBase.x)));
      this.currentSpawnInterval = this.ENEMY_SPAWN_INTERVAL_MAX - (this.ENEMY_SPAWN_INTERVAL_MAX - this.ENEMY_SPAWN_INTERVAL_MIN) * proximity;
    } else {
      this.currentSpawnInterval = this.ENEMY_SPAWN_INTERVAL_MAX;
    }

    if (enemyBase.health > 0 && Date.now() - this.lastEnemySpawn > this.currentSpawnInterval) {
      let targetLane = -1;
      if (allPlayerUnits.length > 0) {
        const laneCounts = [0, 0, 0];
        allPlayerUnits.forEach(p => laneCounts[p.lane]++);
        let maxCount = 0;
        for (let l = 0; l < 3; l++) {
          if (laneCounts[l] > maxCount) {
            maxCount = laneCounts[l];
            targetLane = l;
          }
        }
      }
      const lane = targetLane !== -1 ? targetLane : this.nextEnemyLane;
      if (Math.random() < 0.75) {
        enemies.push(new Enemy(enemyBase.x, LANE_Y[lane], lane));
      } else {
        enemies.push(new EnemyArcher(enemyBase.x, LANE_Y[lane], lane));
      }
      if (targetLane === -1) this.nextEnemyLane = (this.nextEnemyLane + 1) % LANE_Y.length;
      this.lastEnemySpawn = Date.now();
    }
  }

  updateUnits(entities, damageEffects) {
    const { soldiers, archers, enemies, mangonels, enemyBase, upperBase, arrows, stones, player } = entities;
    const allPlayerUnits = soldiers.concat(archers);

    for (let i = soldiers.length - 1; i >= 0; i--) {
      soldiers[i].update(soldiers, enemies, enemyBase, archers, mangonels, damageEffects);
      if (soldiers[i].health <= 0) soldiers.splice(i, 1);
    }
    for (let i = archers.length - 1; i >= 0; i--) {
      archers[i].update(archers, enemies, enemyBase, arrows, soldiers, mangonels, damageEffects);
      if (archers[i].health <= 0) archers.splice(i, 1);
    }
    for (let i = mangonels.length - 1; i >= 0; i--) {
      mangonels[i].update(mangonels, enemies, enemyBase, stones, player, allPlayerUnits, damageEffects);
      if (mangonels[i].health <= 0) mangonels.splice(i, 1);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].update(enemies, allPlayerUnits.concat(mangonels.filter(m => m.state === 'COMBAT')), upperBase, arrows, damageEffects);
      if (enemies[i].health <= 0 || enemies[i].x < -100) {
        if (enemies[i].health <= 0) {
          entities.goldReward = (entities.goldReward || 0) + (enemies[i].goldReward || 0);
          const xpAmount = Math.floor(Math.random() * 3) + 2;
          for (let j = 0; j < xpAmount; j++) {
            entities.xpOrbs.push(new XPOrb(enemies[i].x, enemies[i].y, 5));
          }
        }
        enemies.splice(i, 1);
      }
    }
  }

  updateProjectiles(entities, damageEffects) {
    const { arrows, stones, enemies, enemyBase, soldiers, archers, mangonels, upperBase } = entities;
    const allPlayerUnits = soldiers.concat(archers);

    for (let i = arrows.length - 1; i >= 0; i--) {
      if (arrows[i].team === 'player') {
        arrows[i].update(enemies, enemyBase, damageEffects);
      } else {
        arrows[i].update(allPlayerUnits.concat(mangonels), upperBase, damageEffects);
      }
      if (!arrows[i].active) arrows.splice(i, 1);
    }
    for (let i = stones.length - 1; i >= 0; i--) {
      stones[i].update(enemies, enemyBase, damageEffects);
      if (!stones[i].active) stones.splice(i, 1);
    }
  }

  updateParticles(entities, economySystem) {
    const { xpOrbs, damageEffects, player } = entities;
    for (let i = xpOrbs.length - 1; i >= 0; i--) {
      if (xpOrbs[i].update(player)) {
        economySystem.addXP(xpOrbs[i].value);
        xpOrbs.splice(i, 1);
      }
    }
    for (let j = damageEffects.length - 1; j >= 0; j--) {
      if (!(damageEffects[j] instanceof DamageEffect)) {
        const eff = damageEffects[j];
        damageEffects[j] = new DamageEffect(eff.x, eff.y, eff.text, eff.color);
      }
      if (!damageEffects[j].update()) {
        damageEffects.splice(j, 1);
      }
    }
  }
}
