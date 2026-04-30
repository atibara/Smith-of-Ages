export class Market {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 160; // Hitbox width (matches visual size)
    this.height = 160; // Hitbox height (matches visual size)
    this.interactionRadius = 150;
    this.color = '#e67e22'; // Orange/Brown for market
    this.sprite = new Image();
    this.sprite.src = 'assets/Building.png';
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const sw = this.sprite.width / 4;
    const sh = this.sprite.height / 2;
    const sx = sw * 3;
    const sy = 0;
    
    const renderSize = 220; // Slightly larger
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(
        this.sprite,
        sx, sy, sw, sh,
        drawX - renderSize / 2,
        drawY - renderSize / 2,
        renderSize,
        renderSize
      );
      
      // Building Name
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Market', drawX, drawY - this.height / 2 - 30);
      ctx.restore();
    }
  }

  drawUI(ctx, camera, player) {
    if (player && this.isPlayerNear(player)) {
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y;
      
      // Modern Interaction Prompt
      const promptY = drawY - this.height / 2 - 20;
      
      ctx.save();
      // Background pill
      ctx.fillStyle = 'rgba(20, 25, 30, 0.85)';
      ctx.beginPath();
      ctx.roundRect(drawX - 55, promptY - 15, 110, 30, 15);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Key icon (Space)
      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[SPACE]', drawX - 20, promptY + 1);
      
      // Text
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '12px Outfit, sans-serif';
      ctx.fillText('Interact', drawX + 25, promptY + 1);
      ctx.restore();
    }
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
