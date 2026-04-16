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
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allSoldiers, allEnemies, enemyBase) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 10;
    const attackRange = 40;

    // 1. Check for enemies in the SAME LANE to attack
    let targetEnemy = null;
    for (const enemy of allEnemies) {
      if (enemy.lane !== this.lane) continue;
      const dist = Math.abs(enemy.x - this.x);
      if (enemy.x > this.x && dist < attackRange) {
        targetEnemy = enemy;
        canMove = false;
        break;
      }
    }

    if (targetEnemy) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        targetEnemy.takeDamage(this.attackDamage);
        this.lastAttack = now;
      }
    } else if (enemyBase && this.x > enemyBase.x - enemyBase.width / 2 - attackRange) {
      // 2. Check for enemy base to attack (any lane can hit base)
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        enemyBase.health = Math.max(0, enemyBase.health - this.attackDamage);
        this.lastAttack = now;
      }
      canMove = false;
    } else {
      // 3. Normal movement collision with other soldiers in the SAME LANE
      for (const other of allSoldiers) {
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
