export class EconomySystem {
  constructor() {
    this.gold = 0;
    this.playerLevel = 1;
    this.playerXP = 0;
    this.xpToNextLevel = 100;
  }

  addGold(amount) {
    this.gold += amount;
  }

  addXP(amount) {
    this.playerXP += amount;
    if (this.playerXP >= this.xpToNextLevel) {
      this.playerXP -= this.xpToNextLevel;
      this.playerLevel++;
      this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    }
  }

  buyUpgrade(action, player, upperBase) {
    const costs = {
      'buy-speed': 50, // Example costs if not defined in HTML
      'buy-capacity': 40,
      'repair-base': 100
    };
    
    // In current main.js, costs are pulled from HTML data-cost.
    // We'll pass the cost to this function from the UI listener.
  }

  handlePurchase(cost, action, player, upperBase) {
    if (this.gold >= cost) {
      this.gold -= cost;
      if (action === 'buy-speed') player.speedBase = (player.speedBase || 2.5) * 1.2;
      else if (action === 'buy-capacity') player.maxInventory += 2;
      else if (action === 'repair-base') upperBase.health = Math.min(upperBase.maxHealth, upperBase.health + upperBase.maxHealth * 0.25);
      return true;
    }
    return false;
  }
}
