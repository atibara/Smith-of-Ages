export class Armory {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 150;
    this.height = 70;
    this.color = '#c0392b'; // Dark red theme
    this.interactionRadius = 150;
  }

  draw(ctx, camera) {
    // Draw building
    ctx.beginPath();
    ctx.rect(this.x - camera.x - this.width / 2, this.y - camera.y - this.height / 2, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw tent-like entrance
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y + this.height / 2, 20, Math.PI, 0);
    ctx.fill();
    ctx.closePath();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Armory', this.x - camera.x, this.y - camera.y - this.height / 2 - 10);
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
