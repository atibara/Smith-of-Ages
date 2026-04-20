import { LANE_Y } from '../Constants.js';

export class Enemy {
  constructor(x, yOffset, lane = 1) {
    this.width = 25;
    this.height = 40;
    this.x = x;
    this.y = yOffset;
    this.lane = lane; // 0, 1, 2
    this.color = '#e74c3c'; // Red-ish for enemies
    this.speed = 1.5;
    
    // Health and Combat
    this.health = 80;
    this.maxHealth = 80;
    this.attackDamage = 8;
    this.attackDelay = 1200;
    this.lastAttack = 0;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allEnemies, allPlayers, upperBase) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 10;
    const attackRange = 40;
    const detectionRange = 250;

    // 1. Morale Boost (Group Marching)
    let currentSpeed = this.speed;
    const isNearTeammate = allEnemies.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    // 2. Find the absolute closest player unit horizontally
    let closestPlayer = null;
    let minXDist = Infinity;

    for (const playerUnit of allPlayers) {
      const dist = this.x - playerUnit.x;
      if (dist > 0 && dist < detectionRange) {
        if (dist < minXDist) {
          minXDist = dist;
          closestPlayer = playerUnit;
        }
      }
    }

    // 3. Bodyguard Logic (Interception for EnemyArchers)
    if (!closestPlayer || closestPlayer.lane !== this.lane) {
      for (const other of allEnemies) {
        // Look for allied archers nearby in adjacent lanes
        if (other.constructor.name === 'EnemyArcher' && Math.abs(other.lane - this.lane) === 1 && Math.abs(other.x - this.x) < 100) {
          const threat = allPlayers.find(p => p.lane === other.lane && Math.abs(p.x - other.x) < 150);
          if (threat && Date.now() - this.lastLaneSwitch > 500) {
            this.lane = other.lane;
            this.lastLaneSwitch = Date.now();
            break;
          }
        }
      }
    }

    // 4. Decision Logic (Combat & Targeted Lane Switch)
    if (closestPlayer) {
      if (closestPlayer.lane === this.lane) {
        if (minXDist < attackRange) {
          const now = Date.now();
          if (now - this.lastAttack > this.attackDelay) {
            closestPlayer.takeDamage(this.attackDamage);
            this.lastAttack = now;
          }
          canMove = false;
        }
      } else {
        // Target is in another lane, switch to it!
        if (Date.now() - this.lastLaneSwitch > 500) {
          this.lane = closestPlayer.lane;
          this.lastLaneSwitch = Date.now();
        }
      }
    }

    // 5. Base detection (always hits base if close enough)
    if (canMove && upperBase && this.x < upperBase.x + upperBase.width / 2 + attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        upperBase.health = Math.max(0, upperBase.health - this.attackDamage);
        this.lastAttack = now;
      }
      canMove = false;
    }

    // 6. Teammate collision and dynamic lane avoiding
    if (canMove) {
      let blockedByTeammate = false;
      for (const other of allEnemies) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x < this.x && this.x - other.x < this.width + padding) {
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
          for (const other of allEnemies) {
            if (other.lane === nextLane && Math.abs(other.x - this.x) < this.width + padding) {
              laneClear = false;
              break;
            }
          }

          if (laneClear) {
            this.lane = nextLane;
            this.lastLaneSwitch = Date.now();
            canMove = true;
            break;
          }
        }
      }

      if (canMove) {
        this.x -= currentSpeed;
      }
    }

    // Anti-overlap logic for same lane
    for (const other of allEnemies) {
      if (other === this || other.lane !== this.lane) continue;
      let dist = this.x - other.x;
      if (dist === 0 && this.id && other.id) {
         dist = this.id > other.id ? 0.1 : -0.1;
      }
      if (Math.abs(dist) < this.width + 5) {
         this.x += dist > 0 ? 0.5 : -0.5;
      }
    }

    // Smooth lane transition
    const targetY = LANE_Y[this.lane];
    if (this.y !== targetY) {
      const diff = targetY - this.y;
      if (Math.abs(diff) <= this.speed * 2) {
        this.y = targetY;
      } else {
        this.y += Math.sign(diff) * this.speed * 2;
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

    // Draw enemy
    ctx.beginPath();
    ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, 5);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw a small axe or weapon visually
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(drawX - this.width / 2 - 15, drawY - 5, 15, 5);
    ctx.fillRect(drawX - this.width / 2 - 15, drawY - 10, 5, 15);
    ctx.closePath();
  }
}
