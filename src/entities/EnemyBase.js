export class EnemyBase {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 70;
    this.health = 1000;
    this.maxHealth = 1000;
    this.color = '#c0392b';
    this.sprite = new Image();
    this.sprite.src = 'assets/Building.png';
  }

  takeDamage(amount, effectsArray) {
    this.health = Math.max(0, this.health - amount);
    if (effectsArray) {
      effectsArray.push({ x: this.x, y: this.y - 40, text: `-${Math.floor(amount)}`, color: '#e74c3c' });
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const sw = this.sprite.width / 4;
    const sh = this.sprite.height / 2;
    const sx = sw * 3;
    const sy = sh;

    const renderSize = 220; // Reduced size for the enemy fortress
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 15;
      ctx.drawImage(
        this.sprite,
        sx, sy, sw, sh,
        drawX - renderSize / 2,
        drawY - renderSize / 2,
        renderSize,
        renderSize
      );
      ctx.restore();
    }

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

    // Foreground (Red Gradient)
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    if (healthPercent > 0) {
      const grad = ctx.createLinearGradient(barX, 0, barX + barWidth * healthPercent, 0);
      grad.addColorStop(0, '#ff4d4d');
      grad.addColorStop(1, '#990000');
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
    ctx.fillText(`ENEMY FORTRESS`, drawX, barY + barHeight + 15);
    ctx.font = '9px Outfit';
    ctx.fillText(`${Math.floor(this.health)} / ${this.maxHealth}`, drawX, barY + barHeight + 25);
  }
}
