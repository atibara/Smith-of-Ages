export class Smithy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 80;
    this.color = '#7f8c8d'; // Greyish color for a smithy
    this.interactionRadius = 100; // How close player needs to be
  }

  draw(ctx, camera, player = null) {
    // Draw interaction radius for debugging or visual feedback
    /*
    ctx.beginPath();
    ... (omitted debugging code if necessary, or just keep what's present)
    */

    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Build 3D depth (bottom offset)
    ctx.beginPath();
    ctx.rect(drawX - this.width / 2, drawY - this.height / 2 + 20, this.width, this.height);
    ctx.fillStyle = '#636e72'; // Darker grey for depth
    ctx.fill();
    ctx.closePath();

    // Draw Smithy building (Anvil / Shop) main surface
    ctx.beginPath();
    ctx.rect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Draw 3D shadow for anvil
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(drawX - 20, drawY + 15, 40, 20);

    // Draw an anvil-like shape inside
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(drawX - 20, drawY + 10, 40, 20);
    ctx.fillRect(drawX - 10, drawY, 20, 10);
    
    ctx.closePath();
    
    // Draw Blacksmith NPC
    const npcX = drawX + 35;
    const npcY = drawY + this.height / 2 + 10;
    this.drawNPC(ctx, npcX, npcY, '#34495e', '#e67e22');

    if (player && this.isPlayerNear(player)) {
      this.drawSpeechBubble(ctx, "Welcome to the Smithy! I forge weapons from iron.", npcX, npcY - 25);
    }

    // Draw text "Smithy" above it
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Smithy', drawX, drawY - this.height / 2 - 10);
  }

  drawNPC(ctx, x, y, clothesColor, skinColor) {
    // Body
    ctx.fillStyle = clothesColor;
    ctx.fillRect(x - 8, y - 10, 16, 20);
    // Apron
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x - 6, y - 5, 12, 15);
    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(x, y - 15, 8, 0, Math.PI * 2);
    ctx.fill();
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
