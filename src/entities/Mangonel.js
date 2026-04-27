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
    this.speed = 0.25;
    
    // States: 'FOLLOWING', 'COMBAT'
    this.state = 'FOLLOWING';
    this.world = 'lower'; // Starts in lower world with player
    
    // Combat Stats
    this.health = 150;
    this.maxHealth = 150;
    this.attackDamage = 80;
    this.attackDelay = 6000;
    this.lastAttack = 0;
    this.range = 550;
    this.minRange = 150;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
    this.isNearTeammate = false;
  }

  takeDamage(amount, effectsArray) {
    this.health -= amount;
    if (effectsArray) {
      effectsArray.push({ x: this.x, y: this.y - 20, text: `-${Math.floor(amount)}`, color: '#f1c40f' });
    }
  }

  update(allMangonels, allEnemies, enemyBase, stones, player, allOthers = [], damageEffects = []) {
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
      this.isNearTeammate = allTeammates.some(other => other !== this && Math.abs(other.x - this.x) < 100);
      if (this.isNearTeammate) currentSpeed *= 1.15;

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
        // Target prediction (shoot ahead of enemy)
        const distance = minXDist;
        const travelFrames = distance / 3; // Stone speed is 3
        const enemySpeed = closestEnemy.speed || 0.5;
        targetX = closestEnemy.x - (travelFrames * enemySpeed); // Enemy moves left, so we aim left 
        
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
      
      // Normal movement collision logic
      if (canMove) {
        let blockedByTeammate = false;
        for (const other of allTeammates) {
          if (other === this || other.lane !== this.lane) continue;
          if (other.x > this.x && other.x - this.x < (this.width/2 + other.width/2 + 20)) {
            canMove = false;
            blockedByTeammate = true;
            break;
          }
        }

        // NO LANE SWITCHING FOR MANGONELS - They are heavy and stay in their lane!

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

    // Draw Morale Aura if active
    if (this.isNearTeammate) {
      ctx.save();
      const glow = ctx.createRadialGradient(drawX, drawY + 10, 0, drawX, drawY + 10, 45);
      glow.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
      glow.addColorStop(1, 'rgba(52, 152, 219, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(drawX, drawY + 10, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

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
