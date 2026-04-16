export class Enemy {
  constructor(x, yOffset) {
    this.width = 25;
    this.height = 40;
    this.x = x;
    this.y = yOffset;
    this.color = '#e74c3c'; // Red-ish for enemies
    this.speed = 1.5;
    
    // Health and Combat
    this.health = 80;
    this.maxHealth = 80;
    this.attackDamage = 8;
    this.attackDelay = 1200; // Slightly slower than soldiers
    this.lastAttack = 0;
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allEnemies, allSoldiers, upperBase) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 10;
    const attackRange = 40;

    // 1. Check for soldiers to attack
    let targetSoldier = null;
    for (const soldier of allSoldiers) {
      const dist = Math.abs(soldier.x - this.x);
      // Enemy is on the right, soldier is on the left
      if (soldier.x < this.x && dist < attackRange) {
        targetSoldier = soldier;
        canMove = false;
        break;
      }
    }

    if (targetSoldier) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        targetSoldier.takeDamage(this.attackDamage);
        this.lastAttack = now;
      }
      return; // Stop moving if attacking
    }

    // 2. Check for base to attack
    if (upperBase && this.x < upperBase.x + upperBase.width / 2 + attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        upperBase.health = Math.max(0, upperBase.health - this.attackDamage);
        this.lastAttack = now;
      }
      canMove = false;
    }

    // 3. Normal movement collision with other enemies
    if (canMove) {
      for (const other of allEnemies) {
        if (other === this) continue;
        // Since they only move left, check if 'other' is in front of 'this' (smaller X)
        if (other.x < this.x && this.x - other.x < this.width + padding) {
          canMove = false;
          break;
        }
      }
    }

    if (canMove) {
      this.x -= this.speed;
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
