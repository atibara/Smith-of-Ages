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
    const detectionRange = 250; // How far to look for enemies in other lanes

    // 1. Find the absolute closest enemy horizontally (to decide engagement)
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

    // 2. Decision Logic
    if (closestEnemy) {
      if (closestEnemy.lane === this.lane) {
        // Enemy is in our lane!
        if (minXDist < attackRange) {
          // In attack range
          const now = Date.now();
          if (now - this.lastAttack > this.attackDelay) {
            closestEnemy.takeDamage(this.attackDamage);
            this.lastAttack = now;
          }
          canMove = false;
        }
      } else {
        // Enemy is in another lane! Switch to it to engage
        if (Date.now() - this.lastLaneSwitch > 500) {
          this.lane = closestEnemy.lane;
          this.y = LANE_Y[this.lane];
          this.lastLaneSwitch = Date.now();
          // We won't set canMove=false here so they can keep moving towards the enemy in the new lane
        }
      }
    }

    // 3. Base detection (always hits base if close enough, logic is fixed)
    if (canMove && enemyBase && this.x > enemyBase.x - enemyBase.width / 2 - attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        enemyBase.health = Math.max(0, enemyBase.health - this.attackDamage);
        this.lastAttack = now;
      }
      canMove = false;
    }

    // 4. Teammate collision and dynamic lane avoiding (if not in combat)
    if (canMove) {
      let blockedByTeammate = false;
      const allTeammates = allSoldiers.concat(allArchers);
      
      for (const other of allTeammates) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x > this.x && other.x - this.x < this.width + padding) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }
      }

      if (blockedByTeammate && Date.now() - this.lastLaneSwitch > 500) {
        // Only avoid if NOT following an enemy (closestEnemy check above covers most cases)
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
        this.x += this.speed;
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
