import { LANE_Y } from '../Constants.js';

export class Enemy {
  constructor(x, yOffset, lane = 1) {
    this.width = 40;
    this.height = 60;
    this.x = x;
    this.y = yOffset;
    this.lane = lane; // 0, 1, 2
    this.color = '#e74c3c'; // Red theme for enemies
    this.speed = 0.35;
    
    // Health and Combat
    this.health = 80;
    this.maxHealth = 80;
    this.attackDamage = 8;
    this.attackDelay = 1200;
    this.lastAttack = 0;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
    this.goldReward = 10;

    // Animation State
    this.animTimer = Math.random() * 10;
    this.currentFrame = 0;
    this.currentRow = 0; // 0: Walk, 1: Attack
    this.isMoving = false;
    this.isAttacking = false;

    this.sprite = new Image();
    this.processedSprite = null;
    this.sprite.onload = () => {
        this.processedSprite = this.removeWhiteBackground(this.sprite);
    };
    this.sprite.src = 'assets/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc with shadows/Orc.png';
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
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      if (brightness > 240) {
        data[i+3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  takeDamage(amount, effectsArray) {
    this.health -= amount;
    if (effectsArray) {
      effectsArray.push({ x: this.x, y: this.y - 20, text: `-${Math.floor(amount)}`, color: '#e74c3c' }); // Red for enemy hit
    }
  }

  update(allEnemies, allPlayers, upperBase, arrows = [], damageEffects = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 10;
    const attackRange = 40;
    const detectionRange = 250;

    let currentSpeed = this.speed;
    const isNearTeammate = allEnemies.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    let closestPlayer = null;
    let minXDist = Infinity;

    for (const playerUnit of allPlayers) {
      const dist = this.x - playerUnit.x;
      if (dist > 0 && dist < detectionRange) {
        if (dist < minXDist) {
          minXDist = dist;
          closestPlayer = playerUnit;
        }
      }
    }

    if (!closestPlayer || closestPlayer.lane !== this.lane) {
      for (const other of allEnemies) {
        if (other.constructor.name === 'EnemyArcher' && Math.abs(other.lane - this.lane) === 1 && Math.abs(other.x - this.x) < 100) {
          const threat = allPlayers.find(p => p.lane === other.lane && Math.abs(p.x - other.x) < 150);
          if (threat && Date.now() - this.lastLaneSwitch > 500) {
            this.lane = other.lane;
            this.lastLaneSwitch = Date.now();
            break;
          }
        }
      }
    }

    if (closestPlayer) {
      if (closestPlayer.lane === this.lane) {
        if (minXDist < attackRange) {
          const now = Date.now();
          if (now - this.lastAttack > this.attackDelay) {
            closestPlayer.takeDamage(this.attackDamage, damageEffects);
            this.lastAttack = now;
            this.isAttacking = true;
          }
          canMove = false;
        } else {
            this.isAttacking = false;
        }
      } else {
        this.isAttacking = false;
        if (Date.now() - this.lastLaneSwitch > 500) {
          this.lane = closestPlayer.lane;
          this.lastLaneSwitch = Date.now();
        }
      }
    } else {
        this.isAttacking = false;
    }

    const distToBase = upperBase ? Math.abs(upperBase.x - this.x) : Infinity;
    if (upperBase && distToBase < upperBase.width / 2 + attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        upperBase.takeDamage(this.attackDamage, damageEffects);
        this.lastAttack = now;
        this.isAttacking = true;
      }
      canMove = false;
    }

    if (canMove) {
      let blockedByTeammate = false;
      for (const other of allEnemies) {
        if (other === this || other.lane !== this.lane) continue;
        
        const isArcher = other.constructor.name === 'EnemyArcher';
        const effectivePadding = isArcher ? -this.width : padding;

        if (other.x < this.x && this.x - other.x < this.width + effectivePadding) {
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
          for (const other of allEnemies) {
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
        this.x -= currentSpeed;
        this.isMoving = true;
      } else {
        this.isMoving = false;
      }
    } else {
        this.isMoving = false;
    }

    // Anti-overlap logic for same lane
    for (const other of allEnemies) {
      if (other === this || other.lane !== this.lane) continue;
      let dist = this.x - other.x;
      if (dist === 0 && this.id && other.id) {
         dist = this.id > other.id ? 0.1 : -0.1;
      }
      if (Math.abs(dist) < this.width + 5) {
         this.x += dist > 0 ? 2.0 : -2.0;
      }
    }

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
        this.currentRow = 2; // Attack
        this.animTimer += 0.15;
        this.currentFrame = Math.floor(this.animTimer) % 6; 
    } else if (this.isMoving) {
        this.currentRow = 1; // Walk
        this.animTimer += 0.15;
        this.currentFrame = Math.floor(this.animTimer) % 6; 
    } else {
        this.currentRow = 0; // Idle
        this.animTimer += 0.1;
        this.currentFrame = Math.floor(this.animTimer) % 6; 
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const barWidth = 40;
    const barHeight = 6;
    const healthY = drawY - 35;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth, barHeight);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth * (this.health / this.maxHealth), barHeight);

    if (this.processedSprite) {
        const frameWidth = 100;
        const frameHeight = 100;
        const renderSize = 150;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.scale(-1, 1); // Flip to face left

        ctx.drawImage(
            this.processedSprite,
            this.currentFrame * frameWidth,
            this.currentRow * frameHeight,
            frameWidth,
            frameHeight,
            -renderSize / 2,
            -renderSize / 2,
            renderSize,
            renderSize
        );
        ctx.restore();
    } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height);
    }
  }
}
