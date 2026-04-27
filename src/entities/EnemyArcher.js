import { Arrow } from './Arrow.js';
import { LANE_Y } from '../Constants.js';

export class EnemyArcher {
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
    this.sprite.src = 'assets/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc with shadows/Orc.png';
    this.speed = 0.4;
    this.health = 50;
    this.maxHealth = 50;
    this.attackDamage = 8;
    this.attackDelay = 1800; // Slower attack rate
    this.lastAttack = 0;
    this.attackRange = 100;
    this.arrowLimit = 200;
    this.range = this.attackRange;
    this.lastLaneSwitch = 0;
    this.id = Math.random();
    this.goldReward = 15;
    this.animTimer = 0;
    this.currentFrame = 0;
    this.currentRow = 0;
    this.hasFiredInCycle = false;
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
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 240) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  takeDamage(amount, effectsArray) {
    this.health -= amount;
    if (effectsArray) {
      effectsArray.push({ x: this.x, y: this.y - 20, text: `-${Math.floor(amount)}`, color: '#e74c3c' });
    }
  }

  update(allEnemies, allPlayers, playerBase, arrows, damageEffects = []) {
    if (this.health <= 0) return;

    let canMove = true;
    const padding = 20;

    let currentSpeed = this.speed;
    const isNearTeammate = allEnemies.some(other => other !== this && Math.abs(other.x - this.x) < 100);
    if (isNearTeammate) {
      currentSpeed *= 1.15;
    }

    let closestPlayer = null;
    let minXDist = Infinity;

    for (const playerUnit of allPlayers) {
      if (playerUnit.lane !== this.lane) continue;
      const dist = this.x - playerUnit.x;
      if (dist > 0 && dist < this.range) {
        if (dist < minXDist) {
          minXDist = dist;
          closestPlayer = playerUnit;
        }
      }
    }

    let targetX = -1;
    let targetLane = this.lane;
    let targetY = this.y;

    if (closestPlayer) {
      targetX = closestPlayer.x;
      targetLane = closestPlayer.lane;
      targetY = LANE_Y[targetLane];
      canMove = false;

      if (minXDist < 120 && this.x < 1200 - 100) {
        let backPathClear = true;
        for (const other of allEnemies) {
          if (other.lane === this.lane && other.x > this.x && other.x - this.x < this.width + padding) {
            backPathClear = false;
            break;
          }
        }
        if (backPathClear) {
          this.x += currentSpeed * 0.5;
        }
      }
    } else if (playerBase && this.x - playerBase.x < this.range) {
      targetX = playerBase.x;
      targetLane = this.lane;
      targetY = this.y;
      canMove = false;
    }

    if (targetX !== -1) {
      const now = Date.now();
      const timeSinceAttack = now - this.lastAttack;
      if (timeSinceAttack > this.attackDelay) {
        this.lastAttack = now;
        this.hasFiredInCycle = false;
      }
      if (timeSinceAttack > 250 && !this.hasFiredInCycle) {
        const newArrow = new Arrow(this.x - 10, targetY, this.attackDamage, 'enemy', targetLane);
        newArrow.maxRange = this.arrowLimit;
        arrows.push(newArrow);
        this.hasFiredInCycle = true;
      }
    } else {
      let blockedByTeammate = false;
      for (const other of allEnemies) {
        if (other === this || other.lane !== this.lane) continue;

        if (other.x < this.x && this.x - other.x < this.width + padding) {
          canMove = false;
          blockedByTeammate = true;
          break;
        }

        if (other.x > this.x && other.x - this.x < 40 && other.constructor.name === 'Enemy') {
          blockedByTeammate = true;
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
      }
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

    const nowTime = Date.now();
    if (nowTime - this.lastAttack < 500) {
      this.currentRow = 2; // Attack
      this.animTimer += 0.15;
    } else if (canMove && targetX === -1) {
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
    const healthY = drawY - 35;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth, barHeight);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(drawX - barWidth / 2, healthY, barWidth * (this.health / this.maxHealth), barHeight);

    if (this.processedSprite) {
      const frameWidth = 100;
      const frameHeight = 100;
      const renderSize = 150;

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.scale(-1, 1); // Face left

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
      ctx.beginPath();
      ctx.roundRect(drawX - this.width / 2, drawY - this.height / 2, this.width, this.height, 5);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
}
