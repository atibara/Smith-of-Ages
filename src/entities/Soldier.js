import { LANE_Y } from '../Constants.js';

export class Soldier {
  constructor(yOffset, lane = 1) {
    this.width = 25;
    this.height = 40;
    this.x = -this.width; // Start slightly offscreen to the left
    this.y = yOffset; // Vertical center of the upper world path
    this.lane = lane; // 0 (top), 1 (middle), 2 (bottom)
    this.color = '#3498db'; // Look like blue soldiers
    this.speed = 2;
    
    // Health and Combat
    this.health = 100;
    this.maxHealth = 100;
    this.attackDamage = 10;
    this.attackDelay = 1000; // 1 second between attacks
    this.lastAttack = 0;
    this.lastLaneSwitch = 0;
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allSoldiers, allEnemies, enemyBase, allArchers = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 10;
    const attackRange = 40;
    const detectionRange = 250;
    const allTeammates = allSoldiers.concat(allArchers);

    // 1. Morale Boost (Group Marching)
    let currentSpeed = this.speed;
    const isNearTeammate = allTeammates.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    // 2. Find the absolute closest enemy horizontally (any lane)
    let closestEnemy = null;
    let minXDist = Infinity;

    for (const enemy of allEnemies) {
      const dist = enemy.x - this.x;
      if (dist > 0 && dist < detectionRange) {
        if (dist < minXDist) {
          minXDist = dist;
          closestEnemy = enemy;
        }
      }
    }

    // 3. Bodyguard Logic (Interception)
    // If no enemy in current lane, check if an archer nearby needs protection
    if (!closestEnemy || closestEnemy.lane !== this.lane) {
      for (const archer of allArchers) {
        if (Math.abs(archer.lane - this.lane) === 1 && Math.abs(archer.x - this.x) < 100) {
          // Check if this archer has an enemy close to them
          const archerThreat = allEnemies.find(e => e.lane === archer.lane && Math.abs(e.x - archer.x) < 150);
          if (archerThreat && Date.now() - this.lastLaneSwitch > 500) {
            this.lane = archer.lane;
            this.y = LANE_Y[this.lane];
            this.lastLaneSwitch = Date.now();
            break;
          }
        }
      }
    }

    // 4. Decision Logic (Combat & Targeted Lane Switch)
    if (closestEnemy) {
      if (closestEnemy.lane === this.lane) {
        if (minXDist < attackRange) {
          const now = Date.now();
          if (now - this.lastAttack > this.attackDelay) {
            closestEnemy.takeDamage(this.attackDamage);
            this.lastAttack = now;
          }
          canMove = false;
        }
      } else {
        // Target is in another lane, switch to it!
        if (Date.now() - this.lastLaneSwitch > 500) {
          this.lane = closestEnemy.lane;
          this.y = LANE_Y[this.lane];
          this.lastLaneSwitch = Date.now();
        }
      }
    }

    // 5. Base detection
    if (canMove && enemyBase && this.x > enemyBase.x - enemyBase.width / 2 - attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        enemyBase.health = Math.max(0, enemyBase.health - this.attackDamage);
        this.lastAttack = now;
      }
      canMove = false;
    }

    // 6. Teammate collision and dynamic lane avoiding
    if (canMove) {
      let blockedByTeammate = false;
      for (const other of allTeammates) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x > this.x && other.x - this.x < this.width + padding) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }
      }

      if (blockedByTeammate && Date.now() - this.lastLaneSwitch > 500) {
        const candidateLanes = [];
        if (this.lane > 0) candidateLanes.push(this.lane - 1);
        if (this.lane < LANE_Y.length - 1) candidateLanes.push(this.lane + 1);

        for (const nextLane of candidateLanes) {
          let laneClear = true;
          for (const other of allTeammates) {
            if (other.lane === nextLane && Math.abs(other.x - this.x) < this.width + padding) {
              laneClear = false;
              break;
            }
          }

          if (laneClear) {
            this.lane = nextLane;
            this.y = LANE_Y[nextLane];
            this.lastLaneSwitch = Date.now();
            canMove = true;
            break;
          }
        }
      }

      if (canMove) {
        this.x += currentSpeed;
      }
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Draw health bar
    const barWidth = 30;
    const barHeight = 4;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(drawX - barWidth / 2, drawY - this.height / 2 - 10, barWidth, barHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(drawX - barWidth / 2, drawY - this.height / 2 - 10, barWidth * (this.health / this.maxHealth), barHeight);

    // Draw soldier
    ctx.beginPath();
    ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, 5);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw a small sword visually
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(drawX + this.width / 2, drawY - 5, 20, 5);
    ctx.closePath();
  }
}
