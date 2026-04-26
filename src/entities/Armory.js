export class Armory {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 150;
    this.height = 70;
    this.color = '#c0392b'; // Dark red theme
    this.interactionRadius = 150;
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // 3D Depth
    ctx.beginPath();
    ctx.rect(drawX - this.width / 2, drawY - this.height / 2 + 20, this.width, this.height);
    ctx.fillStyle = '#922b21'; // Darker red
    ctx.fill();
    ctx.closePath();

    // Draw building
    ctx.beginPath();
    ctx.rect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    
    // Tent entrance depth
    ctx.fillStyle = '#1a252f';
    ctx.beginPath();
    ctx.arc(drawX, drawY + this.height / 2 + 5, 20, Math.PI, 0);
    ctx.fill();
    ctx.closePath();

    // Draw tent-like entrance
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(drawX, drawY + this.height / 2, 20, Math.PI, 0);
    ctx.fill();
    ctx.closePath();

    // Draw Quartermaster NPC
    const npcX = drawX + 35;
    const npcY = drawY + this.height / 2 + 10;
    this.drawNPC(ctx, npcX, npcY, '#c0392b', '#e67e22'); // dark red uniform

    if (player && this.isPlayerNear(player)) {
      this.drawSpeechBubble(ctx, "Armory Quartermaster! Deliver gear to arm our troops.", npcX, npcY - 25);
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Armory', drawX, drawY - this.height / 2 - 10);
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
    // Tiny sword/stick
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(x + 5, y - 12, 2, 12);
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
