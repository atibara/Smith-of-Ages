export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 60;
    this.radius = 15;
    this.color = '#f39c12';
    this.speed = 4;
    
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
  }

  update(worldBounds) {
    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
      } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }

    if (worldBounds) {
      this.x = Math.max(worldBounds.minX + this.width / 2, Math.min(this.x, worldBounds.maxX - this.width / 2));
      this.y = Math.max(worldBounds.minY + this.height / 2, Math.min(this.y, worldBounds.maxY - this.height / 2));
    }
  }

  draw(ctx, camera) {
    ctx.beginPath();
    ctx.roundRect(this.x - camera.x - this.width / 2, this.y - camera.y - this.height / 2, this.width, this.height, this.radius);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.closePath();
    
    // Reset shadow for subsequent draws
    ctx.shadowBlur = 0;
  }
}
