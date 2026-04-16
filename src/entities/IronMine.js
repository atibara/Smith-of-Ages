export class IronMine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 90;
    this.color = '#7f8c8d'; // Rock color
    this.interactionRadius = 120;
  }

  draw(ctx, camera) {
    // Draw mountain/rock shape
    ctx.beginPath();
    ctx.moveTo(this.x - camera.x - this.width / 2, this.y - camera.y + this.height / 2);
    ctx.lineTo(this.x - camera.x - this.width / 4, this.y - camera.y - this.height / 2);
    ctx.lineTo(this.x - camera.x + this.width / 4, this.y - camera.y - this.height / 4);
    ctx.lineTo(this.x - camera.x + this.width / 2, this.y - camera.y + this.height / 2);
    ctx.closePath();
    
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw little iron ores embedded
    ctx.fillStyle = '#34495e';
    ctx.fillRect(this.x - camera.x - 20, this.y - camera.y, 10, 10);
    ctx.fillRect(this.x - camera.x + 10, this.y - camera.y + 20, 12, 12);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Iron Mine', this.x - camera.x, this.y - camera.y - this.height / 2 - 15);
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
