export class Arrow {
  constructor(x, y, damage, team = 'player', lane = 1) {
    this.x = x;
    this.y = y;
    this.team = team;
    this.lane = lane;
    this.speed = team === 'player' ? 5 : -5;
    this.damage = damage;
    this.width = 40;
    this.height = 40;
    this.active = true;
    this.spawnX = x;
    this.maxRange = 400; // Arrows disappear after 400 pixels
    this.sprite = new Image();
    this.sprite.src = 'assets/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Arrow(Projectile)/Arrow01(100x100).png';
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

    // Deactivate if too far or offscreen
    if (Math.abs(this.x - this.spawnX) > this.maxRange || this.x > 2000 || this.x < -100) {
      this.active = false;
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Draw sprite if loaded, fallback to rect
    if (this.sprite.complete) {
      ctx.save();
      ctx.translate(drawX, drawY);
      if (this.team === 'enemy') ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    }
  }
}
