export class SiegeWorkshop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 90;
    this.color = '#5d4037'; // Heavy dark wood
    this.interactionRadius = 120;
  }

  draw(ctx, camera) {
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

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Siege Workshop', drawX, drawY - this.height / 2 - 40);
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
