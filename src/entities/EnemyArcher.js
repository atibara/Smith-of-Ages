import { Arrow } from './Arrow.js';
import { LANE_Y } from '../Constants.js';

export class EnemyArcher {
  constructor(x, yOffset, lane = 1) {
    this.width = 25;
    this.height = 40;
    this.x = x;
    this.y = yOffset;
    this.lane = lane; // 0, 1, 2
    this.color = '#c0392b'; // Darker red
    this.speed = 0.7; // Slightly slower
    
    // Health and Combat
    this.health = 50;
    this.maxHealth = 50;
    this.attackDamage = 8;
    this.attackDelay = 1800; // Slower attack rate
    this.lastAttack = 0;
    this.range = 300;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allEnemies, allPlayers, playerBase, arrows) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 20;

    // 1. Morale Boost (Group Marching)
    let currentSpeed = this.speed;
    const isNearTeammate = allEnemies.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    // 2. Find the absolute closest player unit horizontally (any lane)
    let closestPlayer = null;
    let minXDist = Infinity;

    for (const playerUnit of allPlayers) {
      const dist = this.x - playerUnit.x; // Moving left, player is on the left
      if (dist > 0 && dist < this.range) {
        if (dist < minXDist) {
          minXDist = dist;
          closestPlayer = playerUnit;
        }
      }
    }

    // 3. Engagement & Kiting Logic
    let targetX = -1;
    let targetLane = this.lane;
    let targetY = this.y;

    if (closestPlayer) {
      targetX = closestPlayer.x;
      targetLane = closestPlayer.lane;
      targetY = LANE_Y[targetLane];
      canMove = false;

      // KITE: If player is too close, try to back up
      if (minXDist < 120 && this.x < window.innerWidth - 100) {
        let backPathClear = true;
        for (const other of allEnemies) {
          if (other.lane === this.lane && other.x > this.x && other.x - this.x < this.width + padding) {
            backPathClear = false;
            break;
          }
        }
        if (backPathClear) {
          this.x += currentSpeed * 0.5; // Backpedal to the right
        }
      }
    } else if (playerBase && this.x - playerBase.x < this.range) {
      targetX = playerBase.x;
      targetLane = this.lane;
      targetY = this.y;
      canMove = false;
    }

    if (targetX !== -1) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        const newArrow = new Arrow(this.x - 10, targetY, this.attackDamage, 'enemy', targetLane);
        arrows.push(newArrow);
        this.lastAttack = now;
      }
    } else {
      // 4. Normal movement collision with other enemies in the SAME LANE
      let blockedByTeammate = false;
      for (const other of allEnemies) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x < this.x && this.x - other.x < this.width + padding) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }
      }

      // 5. Dynamic Lane Switching if blocked by a teammate
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
    const targetLaneY = LANE_Y[this.lane];
    if (this.y !== targetLaneY) {
      const diff = targetLaneY - this.y;
      if (Math.abs(diff) <= this.speed * 2) {
        this.y = targetLaneY;
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

    // Draw enemy archer body
    ctx.beginPath();
    ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, 5);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw bow visually (flipped for enemy)
    ctx.strokeStyle = '#5d2906';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawX - 10, drawY, 15, Math.PI/2, -Math.PI/2);
    ctx.stroke();
    ctx.closePath();
  }
}
