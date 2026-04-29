export class UISystem {
  constructor(economySystem) {
    this.economySystem = economySystem;
  }

  updateHUD(player) {
    const goldEl = document.getElementById('gold-amount');
    const xpBar = document.getElementById('xp-bar');
    const levelEl = document.getElementById('player-level');
    const invSlots = document.getElementById('inventory-slots');

    if (goldEl) goldEl.innerText = Math.floor(this.economySystem.gold);

    if (xpBar) {
      const xpPercent = (this.economySystem.playerXP / this.economySystem.xpToNextLevel) * 100;
      xpBar.style.width = `${xpPercent}%`;
    }
    if (levelEl) levelEl.innerText = this.economySystem.playerLevel;

    if (invSlots && player) {
        invSlots.innerHTML = '';
        for (let i = 0; i < player.maxInventory; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            if (player.inventory[i]) {
                const item = player.inventory[i];
                if (item === 'iron') slot.innerText = '⛓️';
                else if (item === 'wood') slot.innerText = '🪵';
                else if (item === 'sword') slot.innerText = '⚔️';
                else if (item === 'bow') slot.innerText = '🏹';
            }
            invSlots.appendChild(slot);
        }
    }
  }

  updateShopButtons() {
      const buttons = document.querySelectorAll('.btn-buy');
      buttons.forEach(btn => {
          const cost = parseInt(btn.getAttribute('data-cost'));
          btn.disabled = this.economySystem.gold < cost;
      });
  }

  showMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.remove('hidden');
  }

  hideMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.add('hidden');
  }
}
