export class Market {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 60;
    this.interactionRadius = 100;
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
    if (player && this.isPlayerNear(player)) {
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y;
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('Press [SPACE] to interact', drawX, drawY + this.height / 2 + 30);
      
      this.drawSpeechBubble(ctx, "I'm a traveling merchant! I have great wares.", drawX, drawY - this.height / 2 - 45);
    }
  }

  drawSpeechBubble(ctx, text, x, y) {
    ctx.font = '12px Outfit';
    const textWidth = ctx.measureText(text).width;
    const padding = 12;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = 35;

    // Bubble
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x - bubbleWidth / 2, y - bubbleHeight, bubbleWidth, bubbleHeight, 10);
    } else {
        ctx.rect(x - bubbleWidth / 2, y - bubbleHeight, bubbleWidth, bubbleHeight);
    }
    ctx.fill();
    
    // Pointer
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 2);
    ctx.lineTo(x + 6, y - 2);
    ctx.lineTo(x, y + 8);
    ctx.fill();

    // Text
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - bubbleHeight / 2);
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
