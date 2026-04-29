export class DamageEffect {
  constructor(x, y, text, color = '#e74c3c') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.opacity = 1.0;
    this.vY = -0.8; // Slower upward movement
    this.life = 1.0; 
  }

  update() {
    this.y += this.vY;
    this.life -= 0.02;
    this.opacity = Math.max(0, this.life);
    return this.life > 0;
  }

  draw(ctx, camera) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 16px Outfit'; // Smaller, better font
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x - camera.x, this.y - camera.y);
    ctx.restore();
  }
}
