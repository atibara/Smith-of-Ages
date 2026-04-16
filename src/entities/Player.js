export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 60;
    this.radius = 15;
    this.color = '#f39c12';
    this.speed = 4;
    
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    
    this.inventory = [];
    this.maxInventory = 5;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.isMoving = true;
  }

  update(worldBounds) {
    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
      } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }

    if (worldBounds) {
      this.x = Math.max(worldBounds.minX + this.width / 2, Math.min(this.x, worldBounds.maxX - this.width / 2));
      this.y = Math.max(worldBounds.minY + this.height / 2, Math.min(this.y, worldBounds.maxY - this.height / 2));
    }
  }

  draw(ctx, camera) {
    ctx.beginPath();
    ctx.roundRect(this.x - camera.x - this.width / 2, this.y - camera.y - this.height / 2, this.width, this.height, this.radius);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.closePath();
    
    // Reset shadow for subsequent draws
    ctx.shadowBlur = 0;
    
    // Draw inventory stack (rendered on top of player's head)
    this.inventory.forEach((item, index) => {
      // Start slightly above the player head and go up
      const stackHeightOffset = this.height / 2 + 15 + index * 20; 
      const drawX = this.x - camera.x;
      const drawY = this.y - camera.y - stackHeightOffset;

      ctx.beginPath();
      if (item === 'iron') {
        ctx.fillStyle = '#95a5a6'; // Iron color
        ctx.fillRect(drawX - 10, drawY - 10, 20, 20);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 10, drawY - 10, 20, 20);
      } else if (item === 'wood') {
        ctx.fillStyle = '#a0522d'; // Sienna/Wood brown
        ctx.fillRect(drawX - 12, drawY - 8, 24, 16);
        ctx.strokeStyle = '#5d2906';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 12, drawY - 8, 24, 16);
      } else if (item === 'sword') {
        // Draw a tiny sword
        ctx.fillStyle = '#bdc3c7'; // blade
        ctx.fillRect(drawX - 2, drawY - 12, 4, 18);
        ctx.fillStyle = '#c0392b'; // handle
        ctx.fillRect(drawX - 6, drawY + 6, 12, 3);
        ctx.fillRect(drawX - 2, drawY + 6, 4, 6);
      } else if (item === 'bow') {
        // Draw a tiny bow
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 10, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        // Bow string
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY - 10);
        ctx.lineTo(drawX, drawY + 10);
        ctx.stroke();
      }
      ctx.closePath();
    });
  }
}
