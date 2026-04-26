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
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // 3D Depth
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2, drawY + this.height / 2 + 10);
    ctx.lineTo(drawX - this.width / 4, drawY - this.height / 2 + 10);
    ctx.lineTo(drawX + this.width / 4, drawY - this.height / 4 + 10);
    ctx.lineTo(drawX + this.width / 2, drawY + this.height / 2 + 10);
    ctx.closePath();
    ctx.fillStyle = '#616a6b'; // Darker grey for depth
    ctx.fill();

    // Draw mountain/rock shape main face
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2, drawY + this.height / 2);
    ctx.lineTo(drawX - this.width / 4, drawY - this.height / 2);
    ctx.lineTo(drawX + this.width / 4, drawY - this.height / 4);
    ctx.lineTo(drawX + this.width / 2, drawY + this.height / 2);
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
