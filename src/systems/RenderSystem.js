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

    this.backgroundImage = new Image();
    this.backgroundImage.src = 'assets/Pocket-Islands-V1.0/tiles-islands-spritesheet-32x32.png';
  }

  render(gameState, camera, player, entities, hudOffset) {
    const { smithy, mine, forest, armory, workshop, market, enemyBase, upperBase, soldiers, archers, enemies, mangonels, stones, arrows, xpOrbs, damageEffects } = entities;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.ctx.translate(0, hudOffset);

    if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
      const tileSize = 32;
      // The plain grass tile in the spritesheet (approximate coordinate based on visual)
      // First tile often has borders, middle tiles are plain
      const sx = 32, sy = 0; // Second tile in first row
      
      const startX = Math.floor(camera.x / tileSize) * tileSize;
      const startY = Math.floor(camera.y / tileSize) * tileSize;

      for (let x = startX - tileSize; x < camera.x + this.width + tileSize; x += tileSize) {
        for (let y = startY - tileSize; y < this.height + tileSize; y += tileSize) {
          this.ctx.drawImage(
            this.backgroundImage,
            sx, sy, tileSize, tileSize,
            x - camera.x, y - camera.y,
            tileSize, tileSize
          );
        }
      }

      // Battlefield Darkening (Upper World)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.fillRect(-camera.x, -camera.y, this.width + camera.x, UPPER_WORLD_HEIGHT);

      // Draw the 3 lanes in battlefield
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const lanesY = [40, 75, 110];
      lanesY.forEach(ly => {
          this.ctx.fillRect(-camera.x, ly - 10, this.width + camera.x, 20);
      });
    }

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
