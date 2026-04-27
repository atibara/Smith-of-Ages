import { Arrow } from './Arrow.js';
import { LANE_Y } from '../Constants.js';

export class Archer {
  constructor(x, yOffset, lane = 1) {
    this.width = 40;
    this.height = 60;
    this.x = x;
    this.y = yOffset;
    this.lane = lane; // 0, 1, 2
    this.sprite = new Image();
    this.processedSprite = null;
    this.sprite.onload = () => {
      this.processedSprite = this.removeWhiteBackground(this.sprite);
    };
    this.sprite.src = 'assets/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Soldier/Soldier with shadows/Soldier.png';
    this.speed = 0.45;
    this.health = 60;
    this.maxHealth = 60;
    this.attackDamage = 15;
    this.attackDelay = 1500;
    this.lastAttack = 0;
    this.attackRange = 180; // Distance to stop and start firing
    this.arrowLimit = 200;  // Max distance arrow can travel
    this.range = this.attackRange; // Legacy support
    this.lastLaneSwitch = 0;
    this.id = Math.random();
    this.animTimer = 0;
    this.currentFrame = 0;
    this.currentRow = 0;
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
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness > 240) {
        data[i + 3] = 0;
      } else if (brightness < 200) {
        // TINT: Make it greenish
        data[i] = r * 0.5;
        data[i + 1] = g * 1.2;
        data[i + 2] = b * 0.5;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  takeDamage(amount, effectsArray) {
    this.health -= amount;
    if (effectsArray) {
      effectsArray.push({ x: this.x, y: this.y - 40, text: `-${Math.floor(amount)}`, color: '#f1c40f' });
    }
  }

  update(allArchers, allEnemies, enemyBase, arrows, allSoldiers = [], mangonels = [], damageEffects = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 25;
    const allTeammates = [...allArchers, ...allSoldiers, ...mangonels.filter(m => m.state === 'COMBAT')];

    // 1. Morale Boost
    let currentSpeed = this.speed;
    const isNearTeammate = allTeammates.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    // 2. Engagement
    let closestEnemy = null;
    let minXDist = Infinity;

    for (const enemy of allEnemies) {
      if (enemy.lane !== this.lane) continue;
      const dist = enemy.x - this.x;
      if (dist > 0 && dist < this.range) {
        if (dist < minXDist) {
          minXDist = dist;
          closestEnemy = enemy;
        }
      }
    }

    let targetX = -1;
    let targetLane = this.lane;
    let targetY = this.y;

    if (closestEnemy) {
      targetX = closestEnemy.x;
      targetLane = closestEnemy.lane;
      targetY = LANE_Y[targetLane];

      if (targetLane === this.lane || minXDist < 150) {
        canMove = false;
      }

      if (minXDist < 120 && this.x > 100) {
        let backPathClear = true;
        for (const other of allTeammates) {
          if (other.lane === this.lane && other.x < this.x && this.x - other.x < this.width + 10) {
            backPathClear = false;
            break;
          }
        }
        if (backPathClear) {
          this.x -= currentSpeed * 0.5;
        }
      }
    } else if (enemyBase && enemyBase.x - this.x < this.range) {
      targetX = enemyBase.x;
      targetLane = this.lane;
      targetY = this.y;
      canMove = false;
    }

    if (targetX !== -1) {
      const now = Date.now();
      const timeSinceAttack = now - this.lastAttack;

      // Trigger attack every attackDelay
      if (timeSinceAttack > this.attackDelay) {
        this.lastAttack = now;
        this.hasFiredInCycle = false;
      }

      // Spawn arrow at midpoint of animation
      if (timeSinceAttack > 250 && !this.hasFiredInCycle) {
        const newArrow = new Arrow(this.x + 10, targetY, this.attackDamage, 'player', targetLane);
        newArrow.maxRange = this.arrowLimit; // Set the limit from Archer
        arrows.push(newArrow);
        this.hasFiredInCycle = true;
      }
    }

    if (canMove) {
      let blockedByTeammate = false;
      let yielding = false;

      for (const other of allTeammates) {
        if (other === this || other.lane !== this.lane) continue;

        if (other.x > this.x && other.x - this.x < this.width + padding) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }

        if (other.x < this.x && this.x - other.x < 40 && other.constructor.name === 'Soldier') {
          yielding = true;
          blockedByTeammate = true;
        }
      }

      if (blockedByTeammate && Date.now() - this.lastLaneSwitch > 800) {
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
      }
    }

    // Anti-overlap logic for same lane
    for (const other of allTeammates) {
      if (other === this || other.lane !== this.lane) continue;
      let dist = this.x - other.x;
      if (dist === 0 && this.id && other.id) {
        dist = this.id > other.id ? 0.1 : -0.1;
      }
      if (Math.abs(dist) < this.width + 5) {
        this.x += dist > 0 ? 2.0 : -2.0;
      }
    }

    const nowTime = Date.now();
    if (nowTime - this.lastAttack < 500) {
      this.currentRow = 2; // Attack
      this.animTimer += 0.15;
    } else if (canMove) {
      this.currentRow = 1; // Walk
      this.animTimer += 0.15;
    } else {
      this.currentRow = 0; // Idle
      this.animTimer += 0.1;
    }
    this.currentFrame = Math.floor(this.animTimer) % 6;

    const targetLaneY = LANE_Y[this.lane];
    if (this.y !== targetLaneY) {
      const diff = targetLaneY - this.y;
      if (Math.abs(diff) <= this.speed * 2) {
        this.y = targetLaneY;
      } else {
        this.y += Math.sign(diff) * this.speed * 2;
      }
    }
  }

  draw(ctx, camera) {
    const drawX = this.x - camera.x;
    const drawY = this.y - camera.y;

    const barWidth = 40;
    const barHeight = 6;
    const healthY = drawY - 35; // Lowered to be closer to head
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth, barHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth * (this.health / this.maxHealth), barHeight);

    if (this.processedSprite) {
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
      ctx.beginPath();
      ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, 5);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    // Bow is now part of the sprite visually if we choose the right row, but we'll stick to sprite-only.
  }
}
