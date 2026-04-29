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
  }

  setGameState(state) {
    this.gameState = state;
  }

  updateSize(width, height) {
    this.width = width;
    this.height = height;
  }
}
