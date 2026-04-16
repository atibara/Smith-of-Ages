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
    // Trunk
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(x - 5 * scale, y, 10 * scale, 20 * scale);
    
    // Foliage
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(x - 25 * scale, y);
    ctx.lineTo(x + 25 * scale, y);
    ctx.lineTo(x, y - 40 * scale);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x - 20 * scale, y - 20 * scale);
    ctx.lineTo(x + 20 * scale, y - 20 * scale);
    ctx.lineTo(x, y - 55 * scale);
    ctx.fill();
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
