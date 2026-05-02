export class Smithy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 160; // Hitbox width (matches visual size)
    this.height = 160; // Hitbox height (matches visual size)
    this.color = '#7f8c8d'; // Greyish color for a smithy
    this.interactionRadius = 150; // How close player needs to be
    
    this.craftCount = 0;
    this.maxCrafts = 3;
    this.lastCooldownStart = 0;
    this.cooldown = 10000; // 10 seconds

    this.sprite = new Image();
    this.sprite.src = 'assets/Building.png';
  }

  canCraft() {
    if (this.craftCount < this.maxCrafts) return true;
    return Date.now() - this.lastCooldownStart >= this.cooldown;
  }

  doCraft() {
    if (this.craftCount >= this.maxCrafts) {
      if (Date.now() - this.lastCooldownStart >= this.cooldown) {
        this.craftCount = 0; // reset after cooldown
      }
    }
    this.craftCount++;
    if (this.craftCount >= this.maxCrafts) {
      this.lastCooldownStart = Date.now();
    }
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

  drawUI(ctx, camera, player, entities, economySystem) {
    const isNear = player && this.isPlayerNear(player);
    
    // Only show popup when player is nearby
    if (!isNear) return;
    
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;
    
    // Check if we recovered from cooldown silently
    if (this.craftCount >= this.maxCrafts && Date.now() - this.lastCooldownStart >= this.cooldown) {
      this.craftCount = 0;
    }
    
    const isReady = this.canCraft();
    const popupY = drawY - this.height / 2 - 160;
    const popupWidth = 280;
    const popupHeight = isReady ? 155 : 130;
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
    
    // Border color changes based on ready state
    ctx.strokeStyle = isReady ? 'rgba(244, 208, 63, 0.6)' : 'rgba(231, 76, 60, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Title
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillStyle = isReady ? '#f4d03f' : '#e74c3c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🔨 Forge', drawX, popupY + 12);
    
    if (isReady) {
      // Show crafting options
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      
      const lineSpacing = 18;
      let currentY = popupY + 38;
      
      // Sword crafting
      ctx.textAlign = 'left';
      ctx.fillText('⚔️ Sword:', popupX + 20, currentY);
      ctx.font = '10px Outfit, sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('⛓️ 1x Iron', popupX + 35, currentY + 12);
      
      // Bow crafting
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      currentY += lineSpacing + 8;
      ctx.fillText('🏹 Bow:', popupX + 20, currentY);
      ctx.font = '10px Outfit, sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('🪵 1x Wood', popupX + 35, currentY + 12);
      
      // Craft counter
      ctx.font = '9px Outfit, sans-serif';
      ctx.fillStyle = '#95a5a6';
      currentY += lineSpacing + 5;
      ctx.textAlign = 'center';
      ctx.fillText(`Ready (${this.maxCrafts - this.craftCount}/${this.maxCrafts})`, drawX, currentY);
    } else {
      // Show cooldown timer
      const timeSinceCooldown = Date.now() - this.lastCooldownStart;
      const secondsLeft = Math.ceil((this.cooldown - timeSinceCooldown) / 1000);
      
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Cooling down...`, drawX, popupY + 50);
      
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText(`${secondsLeft}s`, drawX, popupY + 75);
    }
    
    ctx.restore();
  }

  // Check if player is near enough to forge
  isPlayerNear(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.interactionRadius;
  }
}
