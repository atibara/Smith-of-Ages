import { Pathfinder } from '../Pathfinder.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 100;
    this.radius = 20;
    this.color = '#f39c12';
    this.speedBase = 2.0;
    this.speed = 2.0;
    
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.path = [];
    
    this.inventory = [];
    this.maxInventory = 5;

    // --- SPRITE ANIMATION ---
    this.image = new Image();
    this.processedImage = null;
    this.image.onload = () => {
        this.processedImage = this.removeWhiteBackground(this.image);
    };
    this.image.src = 'assets/player.png'; // Path to the player sprite
    this.currentFrame = 0;
    this.currentRow = 0;
    this.animationSpeed = 100; // Frame transition speed (ms)
    this.lastAnimTime = Date.now();
  }

  removeWhiteBackground(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      if (brightness > 240) {
        data[i+3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  setTarget(x, y, obstacles = [], worldBounds = null) {
    if (worldBounds) {
      // Use dimensions that match the collision box in update()
      // width/2 = 30, height/2 = 50
      const paddingX = this.width / 2;
      const paddingY = this.height / 2;
      this.path = Pathfinder.findPath(this.x, this.y, x, y, obstacles, worldBounds, paddingX, paddingY);
      if (this.path.length > 0) {
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
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let nextX = this.x;
      let nextY = this.y;

      if (distance < this.speed) {
        nextX = this.targetX;
        nextY = this.targetY;
        
        if (this.path.length > 0) {
            this.path.shift();
            if (this.path.length > 0) {
                this.targetX = this.path[0].x;
                this.targetY = this.path[0].y;
                // Don't stop moving, continue to next frame logic
                nextX = this.x;
                nextY = this.y;
            } else {
                this.isMoving = false;
            }
        } else {
            this.isMoving = false;
        }
      } else {
        nextX += (dx / distance) * this.speed;
        nextY += (dy / distance) * this.speed;
      }

      // Check collision
      let collides = false;
      for (const obs of obstacles) {
        const obsLeft = obs.x - obs.width / 2;
        const obsRight = obs.x + obs.width / 2;
        const obsTop = obs.y - obs.height / 2;
        const obsBottom = obs.y + obs.height / 2;

        const pLeft = nextX - this.width / 2;
        const pRight = nextX + this.width / 2;
        // make collision box slightly smaller than the sprite for better feel
        const pTop = nextY - this.height / 4; 
        const pBottom = nextY + this.height / 2;

        if (pRight > obsLeft && pLeft < obsRight && pBottom > obsTop && pTop < obsBottom) {
           collides = true;
           break;
        }
      }

      if (collides) {
        this.isMoving = false;
        this.path = [];
        this.targetX = this.x;
        this.targetY = this.y;
      } else {
        this.x = nextX;
        this.y = nextY;
      }
    }

    if (worldBounds) {
      this.x = Math.max(worldBounds.minX + this.width / 2, Math.min(this.x, worldBounds.maxX - this.width / 2));
      this.y = Math.max(worldBounds.minY + this.height / 2, Math.min(this.y, worldBounds.maxY - this.height / 2));
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    if (this.processedImage) {
      // SPRITE DRAWING
      const cols = 7;  
      const rows = 4; 
      const frameWidth = this.processedImage.width / cols;
      const frameHeight = this.processedImage.height / rows;

      if (this.isMoving) {
        const now = Date.now();
        if (now - this.lastAnimTime > this.animationSpeed) {
          this.currentFrame = ((this.currentFrame + 1) % (cols - 1)) + 1; 
          this.lastAnimTime = now;
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          this.currentRow = dx > 0 ? 3 : 2; 
        } else {
          this.currentRow = dy > 0 ? 1 : 2; 
        }
      } else {
        this.currentFrame = 0; 
        this.currentRow = 0;   
      }
      
      const renderWidth = this.width; 
      const renderHeight = this.height;

      ctx.drawImage(
        this.processedImage,
        this.currentFrame * frameWidth,
        this.currentRow * frameHeight,
        frameWidth,
        frameHeight,
        drawX - renderWidth / 2,
        drawY - renderHeight / 2,
        renderWidth,
        renderHeight
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
