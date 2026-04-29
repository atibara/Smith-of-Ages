import { UPPER_WORLD_HEIGHT, GRID_SIZE } from '../Constants.js';
import { DamageEffect } from '../entities/DamageEffect.js';

export class RenderSystem {
  constructor(canvas, ctx, width, height) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');
  }

  generateBackgroundTexture(mine, forest, smithy) {
    if (!this.width || !this.height) return;
    this.bgCanvas.width = this.width;
    this.bgCanvas.height = this.height;

    // 1. Upper world (Battlefield) - Solid, serious tone
    this.bgCtx.fillStyle = '#2c3e50';
    this.bgCtx.fillRect(0, 0, this.width, UPPER_WORLD_HEIGHT);
    
    // Minimal texture for battlefield
    this.bgCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for(let i=0; i<40; i++) {
      let rx = Math.random() * this.width;
      let ry = Math.random() * UPPER_WORLD_HEIGHT;
      this.bgCtx.fillRect(rx, ry, 20, 2);
    }

    // 2. Lower world (Base grass) - Flat, modern green
    this.bgCtx.fillStyle = '#27ae60'; 
    this.bgCtx.fillRect(0, UPPER_WORLD_HEIGHT, this.width, this.height - UPPER_WORLD_HEIGHT);

    // Minimalist grass
    this.bgCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for(let i=0; i<150; i++) {
      let rx = Math.random() * this.width;
      let ry = UPPER_WORLD_HEIGHT + Math.random() * (this.height - UPPER_WORLD_HEIGHT);
      this.bgCtx.fillRect(rx, ry, 2, 2);
    }

    const drawSubtleAura = (x, y, r, color) => {
      let grad = this.bgCtx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.bgCtx.fillStyle = grad;
      this.bgCtx.beginPath();
      this.bgCtx.arc(x, y, r, 0, Math.PI * 2);
      this.bgCtx.fill();
    };

    drawSubtleAura(mine.x, mine.y, 250, 'rgba(0, 0, 0, 0.1)');
    drawSubtleAura(forest.x, forest.y, 250, 'rgba(255, 255, 255, 0.05)');
    drawSubtleAura(smithy.x, smithy.y, 200, 'rgba(0, 0, 0, 0.08)');
  }

  drawGrid(camera) {
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    const startX = Math.floor(camera.x / GRID_SIZE) * GRID_SIZE;
    const startY = Math.max(UPPER_WORLD_HEIGHT, Math.floor(camera.y / GRID_SIZE) * GRID_SIZE);
    const endX = camera.x + this.width;
    const endY = camera.y + this.height;
    
    this.ctx.beginPath();
    for (let x = startX; x <= endX; x += GRID_SIZE) {
      this.ctx.moveTo(x - camera.x, UPPER_WORLD_HEIGHT);
      this.ctx.lineTo(x - camera.x, this.height);
    }
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      if (y >= UPPER_WORLD_HEIGHT) {
        this.ctx.moveTo(0, y - camera.y);
        this.ctx.lineTo(this.width, y - camera.y);
      }
    }
    this.ctx.stroke();
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 5;
    this.ctx.strokeRect(0, UPPER_WORLD_HEIGHT, this.width, this.height - UPPER_WORLD_HEIGHT);
  }

  render(gameState, camera, player, entities, hudOffset) {
    const { smithy, mine, forest, armory, workshop, market, enemyBase, upperBase, soldiers, archers, enemies, mangonels, stones, arrows, xpOrbs, damageEffects } = entities;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.ctx.translate(0, hudOffset);

    this.ctx.drawImage(this.bgCanvas, -camera.x, -camera.y);
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, UPPER_WORLD_HEIGHT);
    this.ctx.lineTo(this.width, UPPER_WORLD_HEIGHT);
    this.ctx.stroke();

    this.drawGrid(camera);

    const drawables = [smithy, mine, forest, armory, workshop, market, enemyBase, upperBase, player, ...soldiers, ...archers, ...enemies, ...mangonels, ...stones, ...arrows];
    drawables.sort((a, b) => {
        const getBaseY = (obj) => {
            if (obj.constructor.name === 'Player') return obj.y + 40;
            return obj.y + (obj.height ? obj.height / 2 : 0);
        };
        return getBaseY(a) - getBaseY(b);
    });
    
    drawables.forEach(d => {
        if (typeof d.draw === 'function') d.draw(this.ctx, camera, player);
    });

    [mine, forest, market, workshop, smithy, armory].forEach(b => {
        if (typeof b.drawUI === 'function') b.drawUI(this.ctx, camera, player);
    });
    
    xpOrbs.forEach(orb => orb.draw(this.ctx));
    damageEffects.forEach(eff => {
      if (eff instanceof DamageEffect) eff.draw(this.ctx, camera);
    });

    this.drawInteractionPrompts(player, entities);

    this.ctx.restore();

    if (gameState === 'GAMEOVER') {
      this.drawGameOver(upperBase.health <= 0 ? 'DEFEAT' : 'VICTORY');
    }
  }

  drawInteractionPrompts(player, entities) {
    const { mine, forest, smithy, workshop, armory, mangonels } = entities;
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'center';

    if (mine.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) this.ctx.fillText('Press SPACE to mine iron', mine.x, mine.y + mine.height / 2 + 20);
      else this.ctx.fillText('Inventory Full!', mine.x, mine.y + mine.height / 2 + 20);
    } else if (forest.isPlayerNear(player)) {
      if (player.inventory.length < player.maxInventory) this.ctx.fillText('Press SPACE to gather wood', forest.x, forest.y + forest.height / 2 + 20);
      else this.ctx.fillText('Inventory Full!', forest.x, forest.y + forest.height / 2 + 20);
    } else if (smithy.isPlayerNear(player)) {
      const hasIron = player.inventory.includes('iron');
      const hasWood = player.inventory.includes('wood');
      if (hasIron) this.ctx.fillText('Press SPACE to forge SWORD (1 Iron)', smithy.x, smithy.y + smithy.height / 2 + 20);
      else if (hasWood) this.ctx.fillText('Press SPACE to forge BOW (1 Wood)', smithy.x, smithy.y + smithy.height / 2 + 20);
      else this.ctx.fillText('Need Iron or Wood!', smithy.x, smithy.y + smithy.height / 2 + 20);
    } else if (workshop.isPlayerNear(player)) {
      const woodCount = player.inventory.filter(i => i === 'wood').length;
      const ironCount = player.inventory.filter(i => i === 'iron').length;
      if (mangonels.length > 0) this.ctx.fillText('Already have a Mangonel!', workshop.x, workshop.y + workshop.height / 2 + 20);
      else if (woodCount >= 2 && ironCount >= 1) this.ctx.fillText('Press SPACE to build MANGONEL (2W + 1I)', workshop.x, workshop.y + workshop.height / 2 + 20);
      else this.ctx.fillText('Need 2 Wood and 1 Iron!', workshop.x, workshop.y + workshop.height / 2 + 20);
    } else if (armory.isPlayerNear(player)) {
      const hasSword = player.inventory.includes('sword');
      const hasBow = player.inventory.includes('bow');
      const followingMangonel = mangonels.find(m => m.state === 'FOLLOWING');
      if (followingMangonel) this.ctx.fillText('Press SPACE to deploy MANGONEL to battlefield', armory.x, armory.y + armory.height / 2 + 20);
      else if (hasSword) this.ctx.fillText('Press SPACE to deliver sword', armory.x, armory.y + armory.height / 2 + 20);
      else if (hasBow) this.ctx.fillText('Press SPACE to deliver bow', armory.x, armory.y + armory.height / 2 + 20);
      else this.ctx.fillText('Need Sword, Bow or Follower Mangonel!', armory.x, armory.y + armory.height / 2 + 20);
    }
  }

  drawGameOver(type) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = type === 'DEFEAT' ? '#e74c3c' : '#2ecc71';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(type === 'DEFEAT' ? 'DEFEAT - BASE DESTROYED' : 'VICTORY - ENEMY BASE DESTROYED', this.width / 2, this.height / 2);
    this.ctx.font = '24px monospace';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 60);
  }

  updateSize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }
}
