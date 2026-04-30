import { UPPER_WORLD_HEIGHT, LANE_Y, HUD_OFFSET } from '../Constants.js';

export class InputSystem {
  constructor(canvas, player, camera, width, height) {
    this.canvas = canvas;
    this.player = player;
    this.camera = camera;
    this.width = width;
    this.height = height;
    this.gameState = 'MENU';
    
    this.onInteraction = null; // Callback for spacebar
    this.onRestart = null; // Callback for 'R'
    this.onMove = null; // Callback for mouse move/click
  }

  init(onInteraction, onRestart, onMenuToggle) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        onMenuToggle();
        return;
      }

      if (e.code === 'KeyR' && this.gameState === 'GAMEOVER') {
        onRestart();
        return;
      }

      if (this.gameState !== 'PLAYING') return;

      if (e.code === 'Space') {
        e.preventDefault();
        onInteraction();
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.gameState !== 'PLAYING') return;
      
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;
      
      const worldX = screenX + this.camera.x;
      const worldY = screenY + this.camera.y - HUD_OFFSET;

      if (this.onMove) this.onMove(worldX, worldY);
    });

    // --- VIEWPORT & GESTURE LOCKDOWN ---
    // Deeply debugged fix for browser auto-refresh and pull-to-refresh
    
    // 1. Prevent scroll wheel (blocks trackpad swipe/scroll-to-refresh)
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });

    // 2. Prevent touch gestures (blocks mobile pull-to-refresh)
    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    // 3. Prevent right-click context menu
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 4. Prevent pointer-based scroll actions on the canvas
    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  setGameState(state) {
    this.gameState = state;
  }

  updateSize(width, height) {
    this.width = width;
    this.height = height;
  }
}
