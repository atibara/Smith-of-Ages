import { Arrow } from './Arrow.js';

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
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allArchers, allEnemies, enemyBase, arrows) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 20;

    // 1. Check for targets in the SAME LANE in range
    let targetX = -1;
    
    // Check enemies first
    for (const enemy of allEnemies) {
      if (enemy.lane !== this.lane) continue;
      const dist = enemy.x - this.x;
      if (dist > 0 && dist < this.range) {
        targetX = enemy.x;
        canMove = false;
        break;
      }
    }

    // Check enemy base if no enemies in range (base is accessible from all lanes)
    if (canMove && enemyBase && enemyBase.x - this.x < this.range) {
      targetX = enemyBase.x;
      canMove = false;
    }

    if (targetX !== -1) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        // Fire an arrow in the SAME LANE
        const newArrow = new Arrow(this.x + 10, this.y, this.attackDamage, 'player', this.lane);
        arrows.push(newArrow);
        this.lastAttack = now;
      }
    } else {
      // 2. Normal movement collision with other archers in the SAME LANE
      for (const other of allArchers) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x > this.x && other.x - this.x < this.width + padding) {
          canMove = false;
          break;
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
