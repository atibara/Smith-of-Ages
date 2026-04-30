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
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;
    
    const promptY = drawY - this.height / 2 - 45;

    // Check if we recovered from cooldown silently
    if (this.craftCount >= this.maxCrafts && Date.now() - this.lastCooldownStart >= this.cooldown) {
      this.craftCount = 0;
    }
    
    const isReady = this.canCraft();

    ctx.save();
    
    ctx.font = 'bold 12px Outfit, sans-serif';
    let textStr = '';
    if (isReady) {
      textStr = `Forge (${this.maxCrafts - this.craftCount}/${this.maxCrafts})`;
    } else {
      const timeSinceCooldown = Date.now() - this.lastCooldownStart;
      const secondsLeft = Math.ceil((this.cooldown - timeSinceCooldown) / 1000);
      textStr = `Wait ${secondsLeft}s`;
    }
    
    const spaceStr = (isNear && isReady) ? '[SPACE]  ' : '';
    const fullText = spaceStr + textStr;
    
    const textWidth = ctx.measureText(fullText).width;
    const boxWidth = textWidth + 30;
    const boxOffset = boxWidth / 2;

    const gradient = ctx.createLinearGradient(drawX - boxOffset, promptY - 15, drawX + boxOffset, promptY + 15);
    gradient.addColorStop(0, 'rgba(20, 25, 30, 0.95)');
    gradient.addColorStop(1, 'rgba(40, 50, 60, 0.85)');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.roundRect(drawX - boxOffset, promptY - 15, boxWidth, 30, 15);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isReady) {
      if (isNear) {
        // Measure where to put SPACE and text so they center together
        const spaceWidth = ctx.measureText('[SPACE]').width;
        const mainWidth = ctx.measureText(textStr).width;
        const totalW = spaceWidth + 8 + mainWidth;
        const startX = drawX - totalW / 2;

        ctx.fillStyle = '#f39c12';
        ctx.textAlign = 'left';
        ctx.fillText('[SPACE]', startX, promptY + 1);
        
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText(textStr, startX + spaceWidth + 8, promptY + 1);
      } else {
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText(textStr, drawX, promptY + 1);
      }
    } else {
      ctx.fillStyle = '#e74c3c'; // Red
      ctx.fillText(textStr, drawX, promptY + 1);
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
