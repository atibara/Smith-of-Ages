import { LANE_Y } from '../Constants.js';

export class Soldier {
  constructor(x, yOffset, lane = 1) {
    this.width = 25;
    this.height = 40;
    this.x = x;
    this.y = yOffset; // Vertical center of the upper world path
    this.lane = lane; // 0 (top), 1 (middle), 2 (bottom)
    this.color = '#3498db'; // Look like blue soldiers
    this.speed = 0.4;
    
    // Health and Combat
    this.health = 100;
    this.maxHealth = 100;
    this.attackDamage = 10;
    this.attackDelay = 1000;
    this.lastAttack = 0;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
    
    // Animation State
    this.animTimer = 0;
    this.currentFrame = 0;
    this.currentRow = 0; // 0: Walk, 1: Attack
    this.isMoving = false;
    this.isAttacking = false;

    this.sprite = new Image();
    this.processedSprite = null;
    this.sprite.onload = () => {
        this.processedSprite = this.removeWhiteBackground(this.sprite);
    };
    this.sprite.src = 'assets/soldier_blue.png';
  }

  removeWhiteBackground(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // More aggressive white removal: anything very bright
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      if (brightness > 240) {
        data[i+3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  update(allSoldiers, allEnemies, enemyBase, allArchers = [], mangonels = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 15; // Increased padding for better visual spacing
    const attackRange = 40;
    const detectionRange = 250;
    const allTeammates = [...allSoldiers, ...allArchers, ...mangonels.filter(m => m.state === 'COMBAT')];

    // 1. Morale Boost (Group Marching)
    let currentSpeed = this.speed;
    const isNearTeammate = allTeammates.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    // 2. Find the absolute closest enemy horizontally (any lane)
    let closestEnemy = null;
    let minXDist = Infinity;

    for (const enemy of allEnemies) {
      const dist = enemy.x - this.x;
      if (dist > 0 && dist < detectionRange) {
        if (dist < minXDist) {
          minXDist = dist;
          closestEnemy = enemy;
        }
      }
    }

    // 3. Bodyguard Logic (Interception)
    // If no enemy in current lane, check if an archer nearby needs protection
    if (!closestEnemy || closestEnemy.lane !== this.lane) {
      for (const archer of allArchers) {
        if (Math.abs(archer.lane - this.lane) === 1 && Math.abs(archer.x - this.x) < 100) {
          // Check if this archer has an enemy close to them
          const archerThreat = allEnemies.find(e => e.lane === archer.lane && Math.abs(e.x - archer.x) < 150);
          if (archerThreat && Date.now() - this.lastLaneSwitch > 800) {
            this.lane = archer.lane;
            this.lastLaneSwitch = Date.now();
            break;
          }
        }
      }
    }

    // 4. Decision Logic (Combat & Targeted Lane Switch)
    if (closestEnemy) {
      if (closestEnemy.lane === this.lane) {
        if (minXDist < attackRange) {
          const now = Date.now();
          if (now - this.lastAttack > this.attackDelay) {
            closestEnemy.takeDamage(this.attackDamage);
            this.lastAttack = now;
          }
          canMove = false;
        }
      } else {
        // Target is in another lane, switch to it!
        if (Date.now() - this.lastLaneSwitch > 800) {
          this.lane = closestEnemy.lane;
          this.lastLaneSwitch = Date.now();
        }
      }
    }

    // 5. Base detection (Fix: Allow attacking even if partially blocked)
    const distToBase = enemyBase ? Math.abs(enemyBase.x - this.x) : Infinity;
    if (enemyBase && distToBase < enemyBase.width / 2 + attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        enemyBase.health = Math.max(0, enemyBase.health - this.attackDamage);
        this.lastAttack = now;
        this.isAttacking = true;
        this.lastAttackTime = now;
      }
      canMove = false;
    } else {
        this.isAttacking = false;
    }

    // 6. Teammate collision and dynamic lane avoiding
    if (canMove) {
      let blockedByTeammate = false;
      for (const other of allTeammates) {
        if (other === this || other.lane !== this.lane) continue;
        
        // Only block if the other is ahead AND we are actually overlapping roughly
        if (other.x > this.x && other.x - this.x < this.width + padding - 5) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }
      }

      if (blockedByTeammate && Date.now() - this.lastLaneSwitch > 500) {
        const candidateLanes = [];
        if (this.lane > 0) candidateLanes.push(this.lane - 1);
        if (this.lane < LANE_Y.length - 1) candidateLanes.push(this.lane + 1);

        for (const nextLane of candidateLanes) {
          let laneClear = true;
          for (const other of allTeammates) {
            if (other.lane === nextLane && Math.abs(other.x - this.x) < this.width + padding) {
              laneClear = false;
              break;
            }
          }

          if (laneClear) {
            this.lane = nextLane;
            this.lastLaneSwitch = Date.now();
            canMove = true;
            break;
          }
        }
      }

      if (canMove) {
        this.x += currentSpeed;
        this.isMoving = true;
      } else {
        this.isMoving = false;
      }
    } else {
      this.isMoving = false;
    }

    // Anti-overlap logic for same lane
    for (const other of allTeammates) {
      if (other === this || other.lane !== this.lane) continue;
      let dist = this.x - other.x;
      if (dist === 0 && this.id && other.id) {
         dist = this.id > other.id ? 0.1 : -0.1;
      }
      if (Math.abs(dist) < this.width + 5) {
         this.x += dist > 0 ? 0.5 : -0.5;
      }
    }

    // Smooth lane transition
    const targetY = LANE_Y[this.lane];
    if (this.y !== targetY) {
      const diff = targetY - this.y;
      if (Math.abs(diff) <= this.speed * 2) {
        this.y = targetY;
      } else {
        this.y += Math.sign(diff) * this.speed * 2;
      }
    }

    // Animation update
    const now = Date.now();
    if (this.isAttacking) {
        this.currentRow = 1;
        const attackProgress = (now - this.lastAttack) / this.attackDelay;
        this.currentFrame = Math.floor(attackProgress * 2) % 2; // 2 frames for attack
    } else if (this.isMoving) {
        this.currentRow = 0;
        this.animTimer += 0.1;
        this.currentFrame = Math.floor(this.animTimer) % 2; // 2 frames for walking
    } else {
        this.currentRow = 0;
        this.currentFrame = 0; 
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    // Health bar
    const barWidth = 30;
    const barHeight = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(drawX - barWidth / 2, drawY - this.height / 2 - 15, barWidth, barHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(drawX - barWidth / 2, drawY - this.height / 2 - 15, barWidth * (this.health / this.maxHealth), barHeight);

    if (this.processedSprite) {
        // High-res sprite sheet (1024x1024, 2x2 grid)
        const frameWidth = 512;
        const frameHeight = 512;
        const renderSize = 85; 

        ctx.drawImage(
            this.processedSprite,
            this.currentFrame * frameWidth,
            this.currentRow * frameHeight,
            frameWidth,
            frameHeight,
            drawX - renderSize / 2,
            drawY - renderSize / 2,
            renderSize,
            renderSize
        );
    } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    }
  }
}
