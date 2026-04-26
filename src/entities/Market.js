export class Market {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 140;
    this.height = 110;
    this.interactionRadius = 130;
    this.color = '#e67e22'; // Orange/Brown for market
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Base/Floor
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(drawX - this.width / 2 - 10, drawY - this.height / 2 - 10, this.width + 20, this.height + 20);

    // Main tent structure
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.moveTo(drawX - this.width / 2, drawY + this.height / 2);
    ctx.lineTo(drawX - this.width / 3, drawY - this.height / 2);
    ctx.lineTo(drawX + this.width / 3, drawY - this.height / 2);
    ctx.lineTo(drawX + this.width / 2, drawY + this.height / 2);
    ctx.fill();

    // Stripes on the tent
    ctx.fillStyle = '#f39c12';
    for (let i = -1; i <= 1; i++) {
        ctx.fillRect(drawX + i * 20 - 5, drawY - this.height / 2, 10, this.height);
    }

    // Counter/Table
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(drawX - this.width / 2 + 10, drawY + 10, this.width - 20, 20);

    // Some goods on the counter
    ctx.fillStyle = '#e74c3c'; // red fruit?
    ctx.beginPath();
    ctx.arc(drawX - 20, drawY + 15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2ecc71'; // green something?
    ctx.beginPath();
    ctx.arc(drawX - 5, drawY + 15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f1c40f'; // gold/yellow?
    ctx.fillRect(drawX + 10, drawY + 12, 8, 6);

    // NPC (Merchant)
    this.drawNPC(ctx, drawX, drawY + 5, '#2980b9', '#f39c12');

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('MARKET', drawX, drawY - this.height / 2 - 20);
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
    // Turban/Hat
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y - 18, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
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
