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
      
      ctx.restore();
    }
  }

  drawUI(ctx, camera, player) {
    const isNear = player && this.isPlayerNear(player);
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;
    
    const promptY = drawY - this.height / 2 - 45;
    
    ctx.save();
    ctx.font = 'bold 12px Outfit, sans-serif';
    
    const textStr = 'Market';
    const spaceStr = isNear ? '[SPACE]  ' : '';
    const fullText = spaceStr + textStr;
    
    const textWidth = ctx.measureText(fullText).width;
    const boxWidth = textWidth + 30;
    const boxOffset = boxWidth / 2;

    const gradient = ctx.createLinearGradient(drawX - boxOffset, promptY - 15, drawX + boxOffset, promptY + 15);
    gradient.addColorStop(0, 'rgba(20, 25, 30, 0.95)');
    gradient.addColorStop(1, 'rgba(40, 50, 60, 0.85)');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(drawX - boxOffset, promptY - 15, boxWidth, 30, 15);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isNear) {
      const spaceWidth = ctx.measureText('[SPACE]').width;
      const mainWidth = ctx.measureText(textStr).width;
      const totalW = spaceWidth + 8 + mainWidth;
      const startX = drawX - totalW / 2;

      ctx.fillStyle = '#f39c12';
      ctx.textAlign = 'left';
      ctx.fillText('[SPACE]', startX, promptY + 1);
      
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText(textStr, startX + spaceWidth + 8, promptY + 1);
    } else {
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText(textStr, drawX, promptY + 1);
    }
    
    ctx.restore();
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
