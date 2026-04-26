export class UpperBase {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 120;
    this.health = 1000;
    this.maxHealth = 1000;
    this.color = '#34495e'; // Dark fortified color
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Draw main building
    ctx.fillStyle = this.color;
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    
    // Draw some architectural details (windows/battlements)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, 20, 20);
    ctx.fillRect(drawX + this.width / 2 - 20, drawY - this.height / 2, 20, 20);
    
    // Draw an entrance
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(drawX + this.width / 2 - 20, drawY + 10, 20, 50);
    // Modern Health Bar
    const barWidth = 140;
    const barHeight = 8;
    const barX = drawX - barWidth / 2;
    const barY = drawY + this.height / 2 + 10;

    // Shadow/Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';

    // Background (Dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 4);
    ctx.fill();

    // Foreground (Blue/Green Gradient)
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    if (healthPercent > 0) {
        const grad = ctx.createLinearGradient(barX, 0, barX + barWidth * healthPercent, 0);
        grad.addColorStop(0, '#2ecc71');
        grad.addColorStop(1, '#27ae60');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * healthPercent, barHeight, 4);
        ctx.fill();
    }
    
    ctx.shadowBlur = 0; // Reset shadow

    // Text label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`OUR FORTRESS`, drawX, barY + barHeight + 15);
  }
}
