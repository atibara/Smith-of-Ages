export class Smithy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 80;
    this.color = '#7f8c8d'; // Greyish color for a smithy
    this.interactionRadius = 100; // How close player needs to be
  }

  draw(ctx, camera) {
    // Draw interaction radius for debugging or visual feedback
    /*
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y, this.interactionRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();
    ctx.closePath();
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
    
    // Draw text "Smithy" above it
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Smithy', drawX, drawY - this.height / 2 - 10);
  }

  // Check if player is near enough to forge
  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.interactionRadius;
  }
}
