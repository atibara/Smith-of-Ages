export class Forest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 100;
    this.interactionRadius = 120;
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // 3D Depth Floor base for Forest
    ctx.fillStyle = '#1e8449'; // Darker green for depth
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2 + 10, this.width, this.height);
    
    // Ground base
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);

    // Draw some trees
    this.drawTree(ctx, drawX - 30, drawY + 10, 0.8);
    this.drawTree(ctx, drawX + 30, drawY + 15, 0.9);
    this.drawTree(ctx, drawX, drawY - 10, 1.1);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Forest', drawX, drawY - this.height / 2 - 20);
  }

  drawTree(ctx, x, y, scale) {
    // Tree Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 20 * scale, 15 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(x - 5 * scale, y, 10 * scale, 20 * scale);
    
    // Foliage 3D depth (right side darker)
    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.moveTo(x - 20 * scale, y);
    ctx.lineTo(x + 25 * scale, y);
    ctx.lineTo(x, y - 40 * scale);
    ctx.fill();

    // Foliage
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(x - 25 * scale, y);
    ctx.lineTo(x + 20 * scale, y);
    ctx.lineTo(x, y - 40 * scale);
    ctx.fill();
    
    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.moveTo(x - 15 * scale, y - 20 * scale);
    ctx.lineTo(x + 20 * scale, y - 20 * scale);
    ctx.lineTo(x, y - 55 * scale);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(x - 20 * scale, y - 20 * scale);
    ctx.lineTo(x + 15 * scale, y - 20 * scale);
    ctx.lineTo(x, y - 55 * scale);
    ctx.fill();
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
