export class Forest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 100;
    this.interactionRadius = 120;
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // 3D Depth Floor base for Forest
    ctx.fillStyle = '#1e8449'; // Darker green for depth
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2 + 10, this.width, this.height);
    
    // Ground base
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);

    // Draw some trees
    this.drawTree(ctx, drawX - 30, drawY + 10, 0.8);
    this.drawTree(ctx, drawX + 30, drawY + 15, 0.9);
    this.drawTree(ctx, drawX, drawY - 10, 1.1);

    // Draw Lumberjack NPC
    const npcX = drawX + 40;
    const npcY = drawY + this.height / 2 + 10;
    this.drawNPC(ctx, npcX, npcY, '#c0392b', '#f39c12');

    if (player && this.isPlayerNear(player)) {
      this.drawSpeechBubble(ctx, "I'm the Lumberjack! The Forest provides excellent wood.", npcX, npcY - 25);
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Forest', drawX, drawY - this.height / 2 - 20);
  }

  drawNPC(ctx, x, y, clothesColor, skinColor) {
    // Body
    ctx.fillStyle = clothesColor;
    ctx.fillRect(x - 8, y - 10, 16, 20);
    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
    ctx.fill();
    // Tiny axe
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(x + 5, y - 10, 8, 4);
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(x + 7, y - 15, 2, 16);
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

  drawTree(ctx, x, y, scale) {
    // Tree Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 20 * scale, 15 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(x - 5 * scale, y, 10 * scale, 20 * scale);
    
    // Foliage 3D depth (right side darker)
    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.moveTo(x - 20 * scale, y);
    ctx.lineTo(x + 25 * scale, y);
    ctx.lineTo(x, y - 40 * scale);
    ctx.fill();

    // Foliage
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(x - 25 * scale, y);
    ctx.lineTo(x + 20 * scale, y);
    ctx.lineTo(x, y - 40 * scale);
    ctx.fill();
    
    ctx.fillStyle = '#1e8449';
    ctx.beginPath();
    ctx.moveTo(x - 15 * scale, y - 20 * scale);
    ctx.lineTo(x + 20 * scale, y - 20 * scale);
    ctx.lineTo(x, y - 55 * scale);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(x - 20 * scale, y - 20 * scale);
    ctx.lineTo(x + 15 * scale, y - 20 * scale);
    ctx.lineTo(x, y - 55 * scale);
    ctx.fill();
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
