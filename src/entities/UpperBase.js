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

    // Health Bar
    const barWidth = 100;
    const barHeight = 10;
    const barX = drawX - barWidth / 2;
    const barY = drawY - this.height / 2 - 25;

    // Background (red)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Foreground (green)
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Text label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BASE HP: ${this.health}`, drawX, barY - 10);
  }
}
