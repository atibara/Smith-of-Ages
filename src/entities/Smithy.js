export class Smithy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 60;
    this.color = '#7f8c8d'; // Greyish color for a smithy
    this.interactionRadius = 100; // How close player needs to be
    
    this.sprite = new Image();
    this.sprite.src = 'assets/Building.png';
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const sw = this.sprite.width / 4;
    const sh = this.sprite.height / 2;
    const sx = sw * 2;
    const sy = 0;
    
    const renderSize = 220; // Slightly larger
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
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

  drawUI(ctx, camera, player) {
    if (player && this.isPlayerNear(player)) {
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y;
      const npcX = drawX + 35;
      const npcY = drawY + this.height / 2 + 10;
      this.drawSpeechBubble(ctx, "Welcome to the Smithy! I forge weapons from iron.", npcX, npcY - 25);
    }
  }

  drawSpeechBubble(ctx, text, x, y) {
    ctx.font = '12px monospace';
    const textWidth = ctx.measureText(text).width;
    const padding = 10;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = 30;

    const screenW = window.innerWidth;
    let bubbleX = x;
    if (bubbleX - bubbleWidth / 2 < 10) bubbleX = bubbleWidth / 2 + 10;
    if (bubbleX + bubbleWidth / 2 > screenW - 10) bubbleX = screenW - bubbleWidth / 2 - 10;

    // Bubble
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.roundRect(bubbleX - bubbleWidth / 2, y - bubbleHeight, bubbleWidth, bubbleHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pointer
    ctx.beginPath();
    const mapVal = Math.max(bubbleX - bubbleWidth/2 + 15, Math.min(x, bubbleX + bubbleWidth/2 - 15));
    ctx.moveTo(mapVal - 6, y - 2);
    ctx.lineTo(mapVal + 6, y - 2);
    ctx.lineTo(x, y + 10);
    ctx.fill();
    ctx.stroke();

    // Fix pointer overlap using a rectangle patch
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(mapVal - 5, y - 4, 10, 4);

    // Text
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bubbleX, y - bubbleHeight / 2);
  }

  // Check if player is near enough to forge
  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.interactionRadius;
  }
}
