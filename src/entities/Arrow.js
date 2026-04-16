export class Arrow {
  constructor(x, y, damage, team = 'player', lane = 1) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.lane = lane;
    this.speed = team === 'player' ? 7 : -7;
    this.damage = damage;
    this.width = 15;
    this.height = 3;
    this.active = true;
  }

  update(targets, targetBase) {
    this.x += this.speed;

    // Check collision with targets (soldiers, archers, or enemies) IN THE SAME LANE
    for (const target of targets) {
      if (target.lane !== this.lane) continue;
      if (this.x > target.x - target.width / 2 && 
          this.x < target.x + target.width / 2 &&
          Math.abs(this.y - target.y) < target.height / 2) {
        target.takeDamage(this.damage);
        this.active = false;
        break;
      }
    }

    // Check collision with target base (base is any-lane)
    if (this.active && targetBase && 
        ((this.team === 'player' && this.x > targetBase.x - targetBase.width / 2) ||
         (this.team === 'enemy' && this.x < targetBase.x + targetBase.width / 2)) &&
        Math.abs(this.y - targetBase.y) < targetBase.height / 2) {
      targetBase.health = Math.max(0, targetBase.health - this.damage);
      this.active = false;
    }

    // Deactivate if offscreen
    if (this.x > window.innerWidth + 100 || this.x < -100) {
      this.active = false;
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    
    // Arrow head
    ctx.fillStyle = this.team === 'player' ? '#7f8c8d' : '#e74c3c';
    ctx.beginPath();
    const headDir = this.team === 'player' ? 1 : -1;
    ctx.moveTo(drawX + (this.width / 2) * headDir, drawY);
    ctx.lineTo(drawX + (this.width / 2 - 5) * headDir, drawY - 4);
    ctx.lineTo(drawX + (this.width / 2 - 5) * headDir, drawY + 4);
    ctx.fill();
    ctx.closePath();
  }
}
