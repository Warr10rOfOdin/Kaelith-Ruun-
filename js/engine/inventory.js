// ============================================
// INVENTORY ENGINE
// ============================================

const Inventory = {
    render() {
        const panel = document.getElementById('side-panel-content');
        if (!panel || !GameState.player) return;
        const p = GameState.player;

        let html = '<h3>Equipment</h3>';
        html += '<div class="equipment-slots">';

        const slots = ['weapon', 'armor', 'offhand', 'accessory'];
        slots.forEach(slot => {
            const itemKey = p.equipment[slot];
            const item = itemKey ? ITEMS[itemKey] : null;
            const rarity = item ? item.rarity : 'common';

            html += `<div class="inv-slot equipped" title="${item ? item.name : 'Empty ' + slot}" onclick="Inventory.showEquipmentDetail('${slot}')">`;
            if (item) {
                html += `<span class="item-rarity-${rarity}">${item.icon}</span>`;
            } else {
                html += `<span style="color:var(--text-dim);font-size:0.8rem">${slot}</span>`;
            }
            html += '</div>';
        });

        html += '</div>';

        // Dynamic inventory display
        const maxSlots = GameState.MAX_INVENTORY_SIZE || 40;
        const displaySlots = Math.max(20, Math.min(maxSlots, p.inventory.length + 5));
        html += `<h3 style="margin-top:1rem">Inventory (${p.inventory.length}/${maxSlots})</h3>`;
        html += '<div class="inventory-grid">';

        for (let i = 0; i < displaySlots; i++) {
            const invItem = p.inventory[i];
            if (invItem) {
                const item = ITEMS[invItem.key];
                if (item) {
                    html += `<div class="inv-slot" onclick="Inventory.showItemDetail('${invItem.key}')">`;
                    html += `<span class="item-rarity-${item.rarity || 'common'}">${item.icon}</span>`;
                    if (invItem.quantity > 1) {
                        html += `<span class="item-count">${invItem.quantity}</span>`;
                    }
                    html += '</div>';
                } else {
                    html += '<div class="inv-slot"></div>';
                }
            } else {
                html += '<div class="inv-slot"></div>';
            }
        }

        html += '</div>';

        panel.innerHTML = html;
    },

    showItemDetail(itemKey) {
        const item = ITEMS[itemKey];
        if (!item) return;

        const invEntry = GameState.player.inventory.find(i => i.key === itemKey);
        if (!invEntry) return;

        let html = `<h3>${item.icon} ${item.name}</h3>`;
        html += `<p class="item-rarity-${item.rarity || 'common'}" style="text-transform:capitalize;margin-bottom:0.5rem">${item.rarity || 'common'}</p>`;
        html += `<p style="color:var(--text-secondary);font-style:italic;margin-bottom:1rem">${item.description}</p>`;

        if (item.stats) {
            html += '<div class="char-sheet"><div class="stat-group"><h4>Stats</h4>';
            for (const [stat, val] of Object.entries(item.stats)) {
                html += `<div class="stat-row"><span class="stat-name">${this.formatStatName(stat)}</span><span class="stat-value stat-bonus">+${val}</span></div>`;
            }
            html += '</div></div>';
        }

        if (item.effect) {
            html += `<p style="color:var(--accent-green-bright);margin-bottom:1rem">Effect: ${item.description}</p>`;
        }

        html += '<div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap">';

        if (item.type === 'weapon' || item.type === 'armor') {
            html += `<button class="action-btn primary" onclick="Inventory.equipFromInventory('${itemKey}')">Equip</button>`;
        }

        if (item.type === 'consumable') {
            html += `<button class="action-btn primary" onclick="Inventory.useFromInventory('${itemKey}')">Use</button>`;
        }

        if (item.value > 0) {
            html += `<button class="action-btn" onclick="Inventory.sellItem('${itemKey}')">Sell (${Math.floor(item.value * 0.5)}g)</button>`;
        }

        html += `<button class="action-btn" onclick="Inventory.render()">Back</button>`;
        html += '</div>';

        const panel = document.getElementById('side-panel-content');
        if (panel) panel.innerHTML = html;
    },

    showEquipmentDetail(slot) {
        const itemKey = GameState.player.equipment[slot];
        if (!itemKey) return;

        const item = ITEMS[itemKey];
        if (!item) return;

        let html = `<h3>${item.icon} ${item.name}</h3>`;
        html += `<p style="color:var(--text-dim);margin-bottom:0.5rem">Equipped — ${slot}</p>`;
        html += `<p class="item-rarity-${item.rarity || 'common'}" style="text-transform:capitalize;margin-bottom:0.5rem">${item.rarity || 'common'}</p>`;
        html += `<p style="color:var(--text-secondary);font-style:italic;margin-bottom:1rem">${item.description}</p>`;

        if (item.stats) {
            html += '<div class="char-sheet"><div class="stat-group"><h4>Stats</h4>';
            for (const [stat, val] of Object.entries(item.stats)) {
                html += `<div class="stat-row"><span class="stat-name">${this.formatStatName(stat)}</span><span class="stat-value stat-bonus">+${val}</span></div>`;
            }
            html += '</div></div>';
        }

        html += '<div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap">';
        html += `<button class="action-btn" onclick="Inventory.unequip('${slot}')">Unequip</button>`;
        html += `<button class="action-btn" onclick="Inventory.render()">Back</button>`;
        html += '</div>';

        const panel = document.getElementById('side-panel-content');
        if (panel) panel.innerHTML = html;
    },

    equipFromInventory(itemKey) {
        if (GameState.equipItem(itemKey)) {
            const item = ITEMS[itemKey];
            if (item) Notifications.show(`Equipped ${item.name}`, 'gold');
            HUD.update();
            this.render();
        }
    },

    unequip(slot) {
        const itemKey = GameState.player.equipment[slot];
        if (!itemKey) return;

        // Check if inventory has space
        const maxSlots = GameState.MAX_INVENTORY_SIZE || 40;
        if (GameState.player.inventory.length >= maxSlots) {
            Notifications.show('Inventory is full! Sell something first.', 'red');
            return;
        }

        GameState.addToInventory(itemKey);
        GameState.player.equipment[slot] = null;
        GameState.recalculateStats();
        const item = ITEMS[itemKey];
        if (item) Notifications.show(`Unequipped ${item.name}`, 'gold');
        HUD.update();
        this.render();
    },

    useFromInventory(itemKey) {
        const item = ITEMS[itemKey];
        if (!item || item.type !== 'consumable' || !item.effect) return;

        if (item.effect.type === 'heal') {
            if (item.effect.stat === 'hp') {
                GameState.healPlayer(item.effect.amount, 0);
                Notifications.show(`Restored ${item.effect.amount} HP`, 'green');
            } else if (item.effect.stat === 'mp') {
                GameState.healPlayer(0, item.effect.amount);
                Notifications.show(`Restored ${item.effect.amount} MP`, 'blue');
            } else if (item.effect.stat === 'both') {
                GameState.healPlayer(item.effect.hpAmount || 0, item.effect.mpAmount || 0);
                Notifications.show(`Restored ${item.effect.hpAmount || 0} HP and ${item.effect.mpAmount || 0} MP`, 'green');
            }
        }

        GameState.removeFromInventory(itemKey);
        HUD.update();
        this.render();
    },

    sellItem(itemKey) {
        const item = ITEMS[itemKey];
        if (!item) return;

        const sellPrice = Math.floor(item.value * 0.5);
        GameState.player.gold += sellPrice;
        GameState.removeFromInventory(itemKey);
        Notifications.show(`Sold ${item.name} for ${sellPrice} gold`, 'gold');
        HUD.update();
        this.render();
    },

    formatStatName(stat) {
        const names = {
            attack: 'Attack',
            defense: 'Defense',
            magicAttack: 'Magic ATK',
            magicDefense: 'Magic DEF',
            speed: 'Speed',
            critChance: 'Crit %',
            fireDamage: 'Fire DMG',
            lifesteal: 'Lifesteal %'
        };
        return names[stat] || stat;
    }
};
