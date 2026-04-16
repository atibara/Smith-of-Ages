import { Arrow } from './Arrow.js';
import { LANE_Y } from '../Constants.js';

export class Archer {
  constructor(yOffset, lane = 1) {
    this.width = 25;
    this.height = 40;
    this.x = 0; // Starts at base position set by main.js
    this.y = yOffset;
    this.lane = lane; // 0, 1, 2
    this.color = '#27ae60'; // Green theme for archers
    this.speed = 1.8;
    
    // Health and Combat
    this.health = 60; // Lower than soldiers
    this.maxHealth = 60;
    this.attackDamage = 15;
    this.attackDelay = 1500; // Slower than melee
    this.lastAttack = 0;
    this.range = 350;
    this.lastLaneSwitch = 0;
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allArchers, allEnemies, enemyBase, arrows, allSoldiers = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 20;
    const allTeammates = allArchers.concat(allSoldiers);

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
      if (dist > 0 && dist < this.range) {
        if (dist < minXDist) {
          minXDist = dist;
          closestEnemy = enemy;
        }
      }
    }

    // 3. Engagement & Kiting Logic
    let targetX = -1;
    let targetLane = this.lane;
    let targetY = this.y;

    if (closestEnemy) {
      targetX = closestEnemy.x;
      targetLane = closestEnemy.lane;
      targetY = LANE_Y[targetLane];
      canMove = false;

      // KITE: If enemy is too close, try to back up
      if (minXDist < 120 && this.x > 100) { // Safety buffer from base at 80
        let backPathClear = true;
        for (const other of allTeammates) {
          if (other.lane === this.lane && other.x < this.x && this.x - other.x < this.width + padding) {
            backPathClear = false;
            break;
          }
        }
        if (backPathClear) {
          this.x -= currentSpeed * 0.5; // Backpedal
        }
      }
    } else if (enemyBase && enemyBase.x - this.x < this.range) {
      targetX = enemyBase.x;
      targetLane = this.lane;
      targetY = this.y;
      canMove = false;
    }

    if (targetX !== -1) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        const newArrow = new Arrow(this.x + 10, targetY, this.attackDamage, 'player', targetLane);
        arrows.push(newArrow);
        this.lastAttack = now;
      }
    } else {
      // 4. Normal movement collision with other UNITS in the SAME LANE
      let blockedByTeammate = false;
      for (const other of allTeammates) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x > this.x && other.x - this.x < this.width + padding) {
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

    // Draw archer body
    ctx.beginPath();
    ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, 5);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw bow visually
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawX + 10, drawY, 15, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    ctx.closePath();
  }
}
