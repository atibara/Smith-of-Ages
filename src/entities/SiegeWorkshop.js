export class SiegeWorkshop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 180; // Hitbox width (matches visual size)
    this.height = 180; // Hitbox height (matches visual size)
    this.color = '#5d4037'; // Heavy dark wood
    this.interactionRadius = 160;
    this.sprite = new Image();
    this.sprite.src = 'assets/Building.png';
  }

  draw(ctx, camera, player = null) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const sw = this.sprite.width / 4;
    const sh = this.sprite.height / 2;
    const sx = sw;
    const sy = sh;
    
    const renderSize = 240; // Slightly larger
    if (this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 12;
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
    const isNear = player && this.isPlayerNear(player);
    
    // Only show popup when player is nearby
    if (!isNear) return;
    
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;
    
    const popupY = drawY - this.height / 2 - 120;
    const popupWidth = 280;
    const popupHeight = 140;
    const popupX = drawX - popupWidth / 2;
    
    ctx.save();
    
    // Background with gradient
    const gradient = ctx.createLinearGradient(popupX, popupY, popupX, popupY + popupHeight);
    gradient.addColorStop(0, 'rgba(50, 50, 70, 0.95)');
    gradient.addColorStop(1, 'rgba(30, 30, 45, 0.95)');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 12);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Title
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🎯 Catapult Crafting', drawX, popupY + 12);
    
    // Requirements text
    ctx.font = '11px Outfit, sans-serif';
    ctx.fillStyle = '#ecf0f1';
    
    const lineSpacing = 18;
    let currentY = popupY + 38;
    
    // Requirement 1: Wood
    ctx.textAlign = 'left';
    ctx.fillText('🪵 x2 Wood', popupX + 20, currentY);
    
    // Requirement 2: Iron
    currentY += lineSpacing;
    ctx.fillText('⛓️ x1 Iron', popupX + 20, currentY);
    
    // Plus symbol
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillStyle = '#27ae60';
    ctx.textAlign = 'center';
    ctx.fillText('+', popupX + 240, popupY + 48);
    
    // Info text
    ctx.font = '9px Outfit, sans-serif';
    ctx.fillStyle = '#95a5a6';
    currentY += lineSpacing + 5;
    ctx.textAlign = 'center';
    ctx.fillText('Gather resources to craft', drawX, currentY);
    
    ctx.restore();
  }

  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
