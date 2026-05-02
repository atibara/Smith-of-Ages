import { Pathfinder } from '../Pathfinder.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 100;
    this.radius = 20;
    this.color = '#f39c12';
    this.speedBase = 1.5;
    this.speed = 1.5;
    
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.path = [];
    
    this.inventory = [];
    this.maxInventory = 5;

    // --- SPRITE ANIMATION ---
    this.idleImage = new Image();
    this.idleImage.src = 'assets/The Male adventurer - Free/Idle/idle.png';
    this.walkImage = new Image();
    this.walkImage.src = 'assets/The Male adventurer - Free/Walk/walk.png';
    
    this.currentFrame = 0;
    this.currentRow = 0;
    this.lastDirectionRow = 0;
    this.animationSpeed = 80; // Frame transition speed (ms)
    this.lastAnimTime = Date.now();
  }

  getDirectionRow(dx, dy) {
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;

    if (angle >= Math.PI / 3 && angle < 2 * Math.PI / 3) return 0; // down
    if (angle >= 2 * Math.PI / 3 && angle < Math.PI) return 1; // left_down
    if (angle >= Math.PI && angle < 4 * Math.PI / 3) return 2; // left_up
    if (angle >= 4 * Math.PI / 3 && angle < 5 * Math.PI / 3) return 3; // up
    if (angle >= 5 * Math.PI / 3 && angle < 2 * Math.PI) return 4; // right_up
    return 5; // right_down
  }

  setTarget(x, y, obstacles = [], worldBounds = null) {
    if (worldBounds) {
      // Player hitbox size for pathfinding
      const paddingX = 20; 
      const paddingY = 15; 
      const feetY = this.y + 40; 
      
      // We pass the exact obstacles; Pathfinder uses padding to ensure the player doesn't clip.
      this.path = Pathfinder.findPath(this.x, feetY, x, y, obstacles, worldBounds, paddingX, paddingY);
      
      if (this.path && this.path.length > 0) {
         this.isMoving = true;
         this.targetX = this.path[0].x;
         this.targetY = this.path[0].y; 
      } else {
         this.isMoving = false;
      }
    } else {
      this.targetX = x;
      this.targetY = y;
      this.isMoving = true;
    }
  }

  update(worldBounds, obstacles = []) {
    if (this.isMoving) {
      const feetY = this.y + 40;
      const dx = this.targetX - this.x;
      const dy = this.targetY - feetY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.speed) {
        // Snap to target waypoint
        this.x = this.targetX;
        this.y = this.targetY - 40;
        
        if (this.path && this.path.length > 0) {
            this.path.shift(); // Remove the reached waypoint
            if (this.path.length > 0) {
                // Proceed to next waypoint
                this.targetX = this.path[0].x;
                this.targetY = this.path[0].y;
            } else {
                this.isMoving = false; // Reached final destination
            }
        } else {
            this.isMoving = false;
        }
      } else {
        // Move smoothly towards current waypoint
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      }
    }

    // Keep within world boundaries
    if (worldBounds) {
      this.x = Math.max(worldBounds.minX + 20, Math.min(this.x, worldBounds.maxX - 20));
      let fY = this.y + 40;
      fY = Math.max(worldBounds.minY + 15, Math.min(fY, worldBounds.maxY - 15));
      this.y = fY - 40;
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const activeImage = this.isMoving ? this.walkImage : this.idleImage;

    if (activeImage && activeImage.complete && activeImage.naturalWidth > 0) {
      // SPRITE DRAWING
      const cols = 8;  
      const rows = 6; 
      const frameWidth = 48;
      const frameHeight = 64;

      const now = Date.now();
      if (now - this.lastAnimTime > this.animationSpeed) {
        this.currentFrame = (this.currentFrame + 1) % cols; 
        this.lastAnimTime = now;
      }
      
      if (this.isMoving) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            this.lastDirectionRow = this.getDirectionRow(dx, dy);
        }
      }
      this.currentRow = this.lastDirectionRow;

      const renderSize = 120; // Scale up the 64x64 frame for visibility

      ctx.drawImage(
        activeImage,
        this.currentFrame * frameWidth,
        this.currentRow * frameHeight,
        frameWidth,
        frameHeight,
        drawX - renderSize / 2,
        drawY - renderSize / 2 - 10,
        renderSize,
        renderSize
      );
    } else {
      // FALLBACK: Draw the old orange player if the image is not loaded
      ctx.beginPath();
      ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, this.radius);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.closePath();
    }
    
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
