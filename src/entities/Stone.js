import { LANE_Y } from '../Constants.js';

export class Stone {
  constructor(x, y, targetX, targetY, damage, team = 'player', targetLane = 1) {
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.lane = targetLane;
    
    this.color = '#95a5a6';
    this.speed = 3;
    this.team = team;
    this.damage = damage;
    this.radius = 30; // Visual radius
    this.aoeRadius = 80; // Splash damage radius
    
    this.progress = 0; // 0 to 1
    this.arcHeight = 150; // How high the stone flies
    
    this.active = true;
    
    // Calculate distance for speed normalization
    this.dist = Math.abs(targetX - x);
    this.duration = this.dist / this.speed;
    this.step = 1 / this.duration;
  }

  update(targets, targetBase) {
    this.progress += this.step;
    
    // Horizontal linear interpolation
    this.x = this.startX + (this.targetX - this.startX) * this.progress;
    
    // Vertical arc interpolation (parabola: y = startY + progress*(targetY-startY) - height_offset)
    const baseLineY = this.startY + (this.targetY - this.startY) * this.progress;
    const heightOffset = Math.sin(this.progress * Math.PI) * this.arcHeight;
    this.y = baseLineY - heightOffset;

    // Check for impact
    if (this.progress >= 1) {
      this.explode(targets, targetBase);
      this.active = false;
    }
  }

  explode(targets, targetBase) {
    // Area-of-Effect Damage
    for (const target of targets) {
      const dx = target.x - this.targetX;
      const dy = target.y - this.targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.aoeRadius) {
        // Full damage at center, slightly less at edges? 
        // For simplicity: full damage if in range
        target.takeDamage(this.damage);
      }
    }

    // Check base
    if (targetBase) {
      const dx = targetBase.x - this.targetX;
      const dy = targetBase.y - this.targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.aoeRadius + targetBase.width / 2) {
        targetBase.health = Math.max(0, targetBase.health - this.damage);
      }
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Stone shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    const shadowY = (this.startY + (this.targetY - this.startY) * this.progress) - camera.y;
    ctx.beginPath();
    ctx.ellipse(drawX, shadowY, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone body
    ctx.fillStyle = '#4a4a4a'; // Dark stone grey
    ctx.beginPath();
    ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(drawX - 3, drawY - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
