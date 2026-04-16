import { Arrow } from './Arrow.js';

export class EnemyArcher {
  constructor(x, yOffset, lane = 1) {
    this.width = 25;
    this.height = 40;
    this.x = x;
    this.y = yOffset;
    this.lane = lane; // 0, 1, 2
    this.color = '#c0392b'; // Dark red for enemy archers
    this.speed = 1.2; // Slightly slower
    
    // Health and Combat
    this.health = 50;
    this.maxHealth = 50;
    this.attackDamage = 8;
    this.attackDelay = 1800; // Slower attack rate
    this.lastAttack = 0;
    this.range = 300;
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allEnemies, allPlayers, playerBase, arrows) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 20;

    // 1. Check for player units in the SAME LANE in range
    let targetX = -1;
    for (const playerUnit of allPlayers) {
      if (playerUnit.lane !== this.lane) continue;
      const dist = this.x - playerUnit.x;
      // Enemy is on the right, player is on the left
      if (dist > 0 && dist < this.range) {
        targetX = playerUnit.x;
        canMove = false;
        break;
      }
    }

    // 2. Check for player base (any lane can hit base)
    if (canMove && playerBase && this.x - playerBase.x < this.range) {
      targetX = playerBase.x;
      canMove = false;
    }

    if (targetX !== -1) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        // Fire an arrow to the left in the SAME LANE
        const newArrow = new Arrow(this.x - 10, this.y, this.attackDamage, 'enemy', this.lane);
        arrows.push(newArrow);
        this.lastAttack = now;
      }
    } else {
      // 3. Normal movement collision with other enemies in the SAME LANE
      for (const other of allEnemies) {
        if (other === this || other.lane !== this.lane) continue;
        if (other.x < this.x && this.x - other.x < this.width + padding) {
          canMove = false;
          break;
        }
      }

      if (canMove) {
        this.x -= this.speed;
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
