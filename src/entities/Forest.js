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
      
      // Building Name
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillStyle = '#f1c40f'; // Yellowish/Gold for points of interest
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Forest', drawX, drawY - this.height / 2 - 30);
      ctx.restore();
    }
  }

  drawUI(ctx, camera, player) {
    if (player && this.isPlayerNear(player)) {
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y;
      
      // Modern Interaction Prompt
      const promptY = drawY - this.height / 2 - 10;
      
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
