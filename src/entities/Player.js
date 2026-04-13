export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
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

  update() {
    if (!this.isMoving) return;

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

  draw(ctx, camera) {
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.closePath();
    
    // Reset shadow for subsequent draws
    ctx.shadowBlur = 0;
  }
}
