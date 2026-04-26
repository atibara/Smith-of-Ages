export class IronMine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 90;
    this.color = '#7f8c8d'; // Rock color
    this.interactionRadius = 120;
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // 3D Depth
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2, drawY + this.height / 2 + 10);
    ctx.lineTo(drawX - this.width / 4, drawY - this.height / 2 + 10);
    ctx.lineTo(drawX + this.width / 4, drawY - this.height / 4 + 10);
    ctx.lineTo(drawX + this.width / 2, drawY + this.height / 2 + 10);
    ctx.closePath();
    ctx.fillStyle = '#616a6b'; // Darker grey for depth
    ctx.fill();

    // Draw mountain/rock shape main face
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2, drawY + this.height / 2);
    ctx.lineTo(drawX - this.width / 4, drawY - this.height / 2);
    ctx.lineTo(drawX + this.width / 4, drawY - this.height / 4);
    ctx.lineTo(drawX + this.width / 2, drawY + this.height / 2);
    ctx.closePath();
    
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw little iron ores embedded
    ctx.fillStyle = '#34495e';
    ctx.fillRect(drawX - 20, drawY, 10, 10);
    ctx.fillRect(drawX + 10, drawY + 20, 12, 12);

    // Draw Miner NPC
    const npcX = drawX + 35;
    const npcY = drawY + this.height / 2 + 10;
    this.drawNPC(ctx, npcX, npcY, '#95a5a6', '#f39c12'); // grey uniform, yellow hard hat

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Iron Mine', drawX, drawY - this.height / 2 - 15);
  }

  drawNPC(ctx, x, y, clothesColor, hatColor) {
    // Body
    ctx.fillStyle = clothesColor;
    ctx.fillRect(x - 8, y - 10, 16, 20);
    // Head (skin)
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
    ctx.fill();
    // Hat
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(x, y - 16, 8, Math.PI, 0);
    ctx.fill();
    
    // Tiny pickaxe
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(x + 3, y - 12, 10, 3);
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(x + 7, y - 16, 2, 16);
  }

  drawUI(ctx, camera, player) {
    if (player && this.isPlayerNear(player)) {
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y;
      const npcX = drawX + 35;
      const npcY = drawY + this.height / 2 + 10;
      this.drawSpeechBubble(ctx, "Greetings! This Iron Mine holds sturdy iron ores.", npcX, npcY - 25);
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

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
