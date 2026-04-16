export class Soldier {
  constructor(yOffset) {
    this.width = 25;
    this.height = 40;
    this.x = -this.width; // Start slightly offscreen to the left
    this.y = yOffset; // Vertical center of the upper world path
    this.color = '#3498db'; // Look like blue soldiers
    this.speed = 2;
  }

  update(allSoldiers) {
    let canMove = true;
    const padding = 10; // 10px distance between soldiers

    for (const other of allSoldiers) {
      if (other === this) continue;
      
      // Since they only move right, check if 'other' is in front of 'this'
      if (other.x > this.x && other.x - this.x < this.width + padding) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      this.x += this.speed;
    }
  }

  draw(ctx, camera) {
    // Draw soldier
    ctx.beginPath();
    ctx.roundRect(this.x - camera.x - this.width / 2, this.y - camera.y - this.height / 2, this.width, this.height, 5);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw a small sword visually
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(this.x - camera.x + this.width / 2, this.y - camera.y - 5, 20, 5);
    ctx.closePath();
  }
}
