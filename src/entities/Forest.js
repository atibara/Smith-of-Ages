export class Forest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 100;
    this.interactionRadius = 120;
    this.sprite = new Image();
    this.sprite.src = 'assets/Building.png';
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const sw = this.sprite.width / 4;
    const sh = this.sprite.height / 2;
    const sx = 0;
    const sy = 0;
    
    const renderSize = 220;
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.save();
      // Sharp pixel art rendering
      ctx.imageSmoothingEnabled = false;
      
      // Subtle drop shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 10;
      
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
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
