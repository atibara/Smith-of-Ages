export class Arrow {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.speed = 7;
    this.damage = damage;
    this.width = 15;
    this.height = 3;
    this.active = true;
  }

  update(allEnemies, enemyBase) {
    this.x += this.speed;

    // Check collision with enemies
    for (const enemy of allEnemies) {
      if (this.x > enemy.x - enemy.width / 2 && 
          this.x < enemy.x + enemy.width / 2 &&
          Math.abs(this.y - enemy.y) < enemy.height / 2) {
        enemy.takeDamage(this.damage);
        this.active = false;
        break;
      }
    }

    // Check collision with enemy base
    if (this.active && enemyBase && 
        this.x > enemyBase.x - enemyBase.width / 2 &&
        Math.abs(this.y - enemyBase.y) < enemyBase.height / 2) {
      enemyBase.health = Math.max(0, enemyBase.health - this.damage);
      this.active = false;
    }

    // Deactivate if offscreen
    if (this.x > window.innerWidth + 100) {
      this.active = false;
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    
    // Arrow head
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.moveTo(drawX + this.width / 2, drawY);
    ctx.lineTo(drawX + this.width / 2 - 5, drawY - 4);
    ctx.lineTo(drawX + this.width / 2 - 5, drawY + 4);
    ctx.fill();
    ctx.closePath();
  }
}
