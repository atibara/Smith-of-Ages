import { LANE_Y } from '../Constants.js';
import { Stone } from './Stone.js';

export class Mangonel {
  constructor(x, y, lane = 1) {
    this.width = 40;
    this.height = 30;
    this.x = x;
    this.y = y;
    this.lane = lane;
    this.color = '#8b4513';
    this.speed = 0.6;
    
    // States: 'FOLLOWING', 'COMBAT'
    this.state = 'FOLLOWING';
    this.world = 'lower'; // Starts in lower world with player
    
    // Combat Stats
    this.health = 150;
    this.maxHealth = 150;
    this.attackDamage = 80;
    this.attackDelay = 4000;
    this.lastAttack = 0;
    this.range = 550;
    this.minRange = 150;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
  }

  update(allMangonels, allEnemies, enemyBase, stones, player, allOthers = []) {
    if (this.health <= 0) return;

    if (this.state === 'FOLLOWING') {
      // 1. Follow Player Logic (Lower World)
      const targetX = player.x - 60; // Stay behind player
      const targetY = player.y;
      
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 10) {
        this.x += dx * 0.05;
        this.y += dy * 0.05;
      }
    } else {
      // 2. Combat Logic (Upper World)
      let canMove = true;
      const padding = 30;
      const allTeammates = allMangonels.concat(allOthers);

      // Morale Boost
      let currentSpeed = this.speed;
      const isNearTeammate = allTeammates.some(other => other !== this && Math.abs(other.x - this.x) < 100);
      if (isNearTeammate) currentSpeed *= 1.15;

      // Find closest enemy horizontally
      let closestEnemy = null;
      let minXDist = Infinity;

      for (const enemy of allEnemies) {
        const dist = enemy.x - this.x;
        if (dist > this.minRange && dist < this.range) {
          if (dist < minXDist) {
            minXDist = dist;
            closestEnemy = enemy;
          }
        }
      }

      let targetX = -1;
      let targetLane = this.lane;
      let targetY = this.y;

      if (closestEnemy) {
        targetX = closestEnemy.x;
        targetLane = closestEnemy.lane;
        targetY = LANE_Y[targetLane];
        // ONLY stop if the enemy is in our lane OR if we are close to our minimum range
        if (targetLane === this.lane || minXDist < this.minRange + 50) {
          canMove = false;
        }
      } else if (enemyBase && enemyBase.x - this.x < this.range && enemyBase.x - this.x > this.minRange) {
        targetX = enemyBase.x;
        targetLane = this.lane;
        targetY = this.y;
        canMove = false;
      }

      if (targetX !== -1) {
        const now = Date.now();
        if (now - this.lastAttack > this.attackDelay) {
          const newStone = new Stone(this.x + 20, this.y - 10, targetX, targetY, this.attackDamage, 'player', targetLane);
          stones.push(newStone);
          this.lastAttack = now;
        }
      }
      
      // Normal movement collision logic - always check this if not explicitly shooting/stopped
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

        if (blockedByTeammate && Date.now() - this.lastLaneSwitch > 1000) {
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

      // Anti-overlap logic for same lane
      for (const other of allTeammates) {
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
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Only draw health bar in combat
    if (this.state === 'COMBAT') {
      const barWidth = 50;
      const barHeight = 6;
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(drawX - barWidth / 2, drawY - this.height / 2 - 15, barWidth, barHeight);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(drawX - barWidth / 2, drawY - this.height / 2 - 15, barWidth * (this.health / this.maxHealth), barHeight);
    }

    // Drawing the machine
    ctx.fillStyle = '#34495e'; // Wheels
    ctx.beginPath();
    ctx.arc(drawX - 20, drawY + 15, 10, 0, Math.PI * 2);
    ctx.arc(drawX + 20, drawY + 15, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color; // Body
    ctx.fillRect(drawX - this.width / 2, drawY - 10, this.width, 20);
    
    ctx.strokeStyle = '#5d4037'; // Arm
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY);
    ctx.lineTo(drawX + 10, drawY - 20);
    ctx.stroke();

    ctx.fillStyle = '#4e342e'; // Bucket
    ctx.beginPath();
    ctx.arc(drawX + 10, drawY - 20, 8, 0, Math.PI, true);
    ctx.fill();
    
    if (this.state === 'FOLLOWING') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      ctx.fillText('FOLLOWING', drawX, drawY - 25);
    }
  }
}
