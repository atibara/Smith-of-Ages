import { LANE_Y } from '../Constants.js';

export class Soldier {
  constructor(x, yOffset, lane = 1) {
    this.width = 40;
    this.height = 60;
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
    this.isNearTeammate = false; // Initial status

    this.sprite = new Image();
    this.processedSprite = null;
    this.sprite.onload = () => {
        this.processedSprite = this.removeWhiteBackground(this.sprite);
    };
    this.sprite.src = 'assets/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier with shadows/Soldier.png';
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
      // We pass a simple object that main.js will convert to a DamageEffect instance
      effectsArray.push({ x: this.x, y: this.y - 20, text: `-${Math.floor(amount)}`, color: '#f1c40f' }); // Yellow for friendly hit
    }
  }

  update(allSoldiers, allEnemies, enemyBase, allArchers = [], mangonels = [], damageEffects = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 15; 
    const attackRange = 40;
    const detectionRange = 250;
    const allTeammates = [...allSoldiers, ...allArchers, ...mangonels.filter(m => m.state === 'COMBAT')];

    // 1. Morale Boost (Group Marching)
    let currentSpeed = this.speed;
    this.isNearTeammate = allSoldiers.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (this.isNearTeammate) {
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
    if (!closestEnemy || closestEnemy.lane !== this.lane) {
      for (const archer of allArchers) {
        if (Math.abs(archer.lane - this.lane) === 1 && Math.abs(archer.x - this.x) < 100) {
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
            closestEnemy.takeDamage(this.attackDamage, damageEffects);
            this.lastAttack = now;
            this.isAttacking = true;
          }
          canMove = false;
        } else {
            this.isAttacking = false;
        }
      } else {
        this.isAttacking = false;
        if (Date.now() - this.lastLaneSwitch > 800) {
          this.lane = closestEnemy.lane;
          this.lastLaneSwitch = Date.now();
        }
      }
    } else {
        this.isAttacking = false;
    }

    // 5. Base detection
    const distToBase = enemyBase ? Math.abs(enemyBase.x - this.x) : Infinity;
    if (enemyBase && distToBase < enemyBase.width / 2 + attackRange) {
      const now = Date.now();
      if (now - this.lastAttack > this.attackDelay) {
        enemyBase.takeDamage(this.attackDamage, damageEffects);
        this.lastAttack = now;
        this.isAttacking = true;
      }
      canMove = false;
    } 

    if (canMove) {
      let blockedByTeammate = false;
      for (const other of allTeammates) {
        if (other === this || other.lane !== this.lane) continue;
        
        const isArcher = other.constructor.name === 'Archer' || other.constructor.name === 'EnemyArcher';
        const effectivePadding = isArcher ? -this.width : padding; 

        if (other.x > this.x && other.x - this.x < this.width + effectivePadding - 5) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }
      }

      if (blockedByTeammate && !closestEnemy && Date.now() - this.lastLaneSwitch > 1000) {
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
         this.x += dist > 0 ? 2.0 : -2.0; // Firmer push
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
        this.currentRow = 2; // Attack01
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

    // Draw Morale Aura if active
    if (this.isNearTeammate) {
      ctx.save();
      const glow = ctx.createRadialGradient(drawX, drawY + 10, 0, drawX, drawY + 10, 35);
      glow.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
      glow.addColorStop(1, 'rgba(52, 152, 219, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(drawX, drawY + 10, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const barWidth = 40;
    const barHeight = 6;
    const healthY = drawY - 35; 
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth, barHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth * (this.health / this.maxHealth), barHeight);

    if (this.processedSprite) {
        // Updated for 100x100 grid from Tiny RPG pack
        const frameWidth = 100;
        const frameHeight = 100;
        const renderSize = 150; 

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
