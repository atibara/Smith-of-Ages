export class SiegeWorkshop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 90;
    this.color = '#5d4037'; // Heavy dark wood
    this.interactionRadius = 120;
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // 3D Depth
    ctx.fillStyle = '#3e2723'; // Dark background depth layer
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2 + 20, this.width, this.height);

    // Building Base
    ctx.fillStyle = this.color;
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    
    // Roof (Heavy beams) depth
    ctx.fillStyle = '#1f1311';
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2 - 10, drawY - this.height / 2 + 5);
    ctx.lineTo(drawX, drawY - this.height / 2 - 25);
    ctx.lineTo(drawX + this.width / 2 + 10, drawY - this.height / 2 + 5);
    ctx.fill();
    ctx.closePath();

    // Roof (Heavy beams)
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2 - 10, drawY - this.height / 2);
    ctx.lineTo(drawX, drawY - this.height / 2 - 30);
    ctx.lineTo(drawX + this.width / 2 + 10, drawY - this.height / 2);
    ctx.fill();
    ctx.closePath();

    // Wheels/Catapult parts visual
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(drawX - 30, drawY + 10, 15, 0, Math.PI * 2);
    ctx.arc(drawX + 30, drawY + 10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Siege Engineer NPC
    const npcX = drawX + 45;
    const npcY = drawY + this.height / 2 + 10;
    this.drawNPC(ctx, npcX, npcY, '#8e44ad', '#e67e22'); // purple-ish clothes

    if (player && this.isPlayerNear(player)) {
      this.drawSpeechBubble(ctx, "Siege Engineer! Bring materials to build Mangonels.", npcX, npcY - 25);
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Siege Workshop', drawX, drawY - this.height / 2 - 40);
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
    // Tiny wrench/hammer
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(x + 5, y - 12, 4, 10);
    ctx.fillRect(x + 3, y - 12, 8, 3);
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
