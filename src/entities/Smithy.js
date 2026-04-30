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
      
      // Building Name
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Smithy', drawX, drawY - this.height / 2 - 30);
      ctx.restore();
    }
  }

  drawUI(ctx, camera, player, entities, economySystem) {
    const isNear = player && this.isPlayerNear(player);
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;
    
    const promptY = drawY - this.height / 2 - 20;

    // Check if we recovered from cooldown silently
    if (this.craftCount >= this.maxCrafts && Date.now() - this.lastCooldownStart >= this.cooldown) {
      this.craftCount = 0;
    }
    
    const isReady = this.canCraft();

    ctx.save();
    ctx.fillStyle = 'rgba(20, 25, 30, 0.85)';
    ctx.beginPath();
    
    // Determine box width based on whether we show SPACE
    const boxWidth = isNear && isReady ? 150 : 100;
    const boxOffset = boxWidth / 2;
    ctx.roundRect(drawX - boxOffset, promptY - 15, boxWidth, 30, 15);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isReady) {
      if (isNear) {
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('[SPACE]', drawX - 35, promptY + 1);
        
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText(`Forge (${this.maxCrafts - this.craftCount}/${this.maxCrafts})`, drawX + 25, promptY + 1);
      } else {
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Forge (${this.maxCrafts - this.craftCount}/${this.maxCrafts})`, drawX, promptY + 1);
      }
    } else {
      const timeSinceCooldown = Date.now() - this.lastCooldownStart;
      const secondsLeft = Math.ceil((this.cooldown - timeSinceCooldown) / 1000);
      ctx.fillStyle = '#e74c3c'; // Red
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Wait ${secondsLeft}s`, drawX, promptY + 1);
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
