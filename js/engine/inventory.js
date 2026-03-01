// ============================================
// INVENTORY ENGINE
// ============================================

const Inventory = {
    render() {
        const panel = document.getElementById('side-panel-content');
        if (!panel || !GameState.player) return;
        const p = GameState.player;

        let html = '<div class="inv-panel-header"><h3>Equipment &amp; Inventory</h3></div>';

        // Equipment with slot labels and rarity glow
        html += '<div class="equipment-section-label">Equipped</div>';
        html += '<div class="equipment-slots">';

        const slotConfig = [
            ['weapon', 'Weapon', '&#9876;'],
            ['helmet', 'Helmet', '&#9898;'],
            ['armor', 'Armor', '&#9899;'],
            ['boots', 'Boots', '&#9898;'],
            ['offhand', 'Offhand', '&#9917;'],
            ['accessory', 'Accessory', '&#9830;']
        ];

        slotConfig.forEach(([slot, label, fallbackIcon]) => {
            const itemKey = p.equipment[slot];
            const item = itemKey ? ITEMS[itemKey] : null;
            const rarity = item ? (item.rarity || 'common') : '';

            html += `<div class="equip-slot ${item ? 'has-item' : ''} ${item ? 'rarity-' + rarity : ''}" onclick="Inventory.showEquipmentDetail('${slot}')">`;
            html += `<span class="slot-label">${label}</span>`;
            if (item) {
                html += `<span class="slot-icon item-rarity-${rarity}">${item.icon}</span>`;
                html += `<span class="slot-name">${item.name}</span>`;
            } else {
                html += `<span class="slot-empty">${fallbackIcon}</span>`;
            }
            html += '</div>';
        });

        html += '</div>';

        // Inventory grid with capacity indicator
        const maxSlots = GameState.MAX_INVENTORY_SIZE || 40;
        const displaySlots = Math.max(20, Math.min(maxSlots, p.inventory.length + 5));
        html += `<div class="inv-section-label">Inventory ${p.inventory.length}/${maxSlots}</div>`;
        html += '<div class="inventory-grid">';

        for (let i = 0; i < displaySlots; i++) {
            const invItem = p.inventory[i];
            if (invItem) {
                const item = ITEMS[invItem.key];
                if (item) {
                    const rarity = item.rarity || 'common';
                    html += `<div class="inv-slot rarity-${rarity}" onclick="Inventory.showItemDetail('${invItem.key}')">`;
                    html += `<span class="item-rarity-${rarity}">${item.icon}</span>`;
                    if (invItem.quantity > 1) {
                        html += `<span class="item-count">${invItem.quantity}</span>`;
                    }
                    html += '</div>';
                } else {
                    html += '<div class="inv-slot empty"></div>';
                }
            } else {
                html += '<div class="inv-slot empty"></div>';
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

        const rarity = item.rarity || 'common';

        let html = '<div class="item-detail-panel">';
        html += `<div class="item-title"><span class="item-icon-lg">${item.icon}</span><h3>${item.name}</h3></div>`;
        html += `<span class="item-rarity-tag ${rarity}">${rarity}</span>`;
        html += `<p style="color:var(--text-secondary);font-style:italic;margin-bottom:0.8rem;font-size:0.85rem;line-height:1.4">${item.description}</p>`;

        if (item.stats) {
            const slot = item.slot || this.guessSlot(item);
            const equippedKey = slot && GameState.player.equipment[slot] ? GameState.player.equipment[slot] : null;
            const equippedItem = equippedKey ? ITEMS[equippedKey] : null;
            const equippedStats = equippedItem && equippedItem.stats ? equippedItem.stats : {};

            html += '<div class="char-sheet"><div class="stat-group"><h4>Stats</h4>';
            const allStats = new Set([...Object.keys(item.stats), ...Object.keys(equippedStats)]);
            for (const stat of allStats) {
                const newVal = item.stats[stat] || 0;
                const oldVal = equippedStats[stat] || 0;
                const diff = newVal - oldVal;
                let diffHtml = '';
                if (equippedItem && diff !== 0) {
                    const color = diff > 0 ? 'var(--accent-green-bright)' : 'var(--accent-red-bright)';
                    const sign = diff > 0 ? '+' : '';
                    diffHtml = ` <span style="color:${color};font-size:0.72rem">(${sign}${diff})</span>`;
                }
                if (newVal > 0) {
                    html += `<div class="stat-row"><span class="stat-name">${this.formatStatName(stat)}</span><span class="stat-value stat-bonus">+${newVal}${diffHtml}</span></div>`;
                } else if (diff < 0) {
                    html += `<div class="stat-row"><span class="stat-name">${this.formatStatName(stat)}</span><span class="stat-value" style="color:var(--accent-red-bright)">&mdash;${diffHtml}</span></div>`;
                }
            }
            html += '</div></div>';

            if (equippedItem) {
                html += `<p style="color:var(--text-dim);font-size:0.72rem;margin:0.4rem 0">Replacing: ${equippedItem.icon} ${equippedItem.name}</p>`;
            }
        }

        if (item.effect) {
            html += `<p style="color:var(--accent-green-bright);margin-bottom:0.8rem;font-size:0.82rem">Effect: ${item.description}</p>`;
        }

        html += '<div style="display:flex;gap:0.4rem;margin-top:0.8rem;flex-wrap:wrap">';

        if (item.type === 'weapon' || item.type === 'armor' || item.type === 'tool') {
            html += `<button class="action-btn primary" onclick="Inventory.equipFromInventory('${itemKey}')">Equip</button>`;
        }

        if (item.type === 'consumable') {
            html += `<button class="action-btn primary" onclick="Inventory.useFromInventory('${itemKey}')">Use</button>`;
        }

        if (item.type === 'placeable') {
            html += `<button class="action-btn primary" onclick="Base.placePlaceable('${itemKey}'); Inventory.render()">Place</button>`;
        }

        if (item.value > 0) {
            html += `<button class="action-btn" onclick="Inventory.sellItem('${itemKey}')">Sell (${Math.floor(item.value * 0.5)}g)</button>`;
        }

        html += `<button class="action-btn" onclick="Inventory.render()">Back</button>`;
        html += '</div></div>';

        const panel = document.getElementById('side-panel-content');
        if (panel) panel.innerHTML = html;
    },

    showEquipmentDetail(slot) {
        const itemKey = GameState.player.equipment[slot];
        if (!itemKey) return;

        const item = ITEMS[itemKey];
        if (!item) return;

        const rarity = item.rarity || 'common';

        let html = '<div class="item-detail-panel">';
        html += `<div class="item-title"><span class="item-icon-lg">${item.icon}</span><h3>${item.name}</h3></div>`;
        html += `<span class="item-rarity-tag ${rarity}">${rarity}</span>`;
        html += `<p style="color:var(--text-dim);font-size:0.72rem;margin-bottom:0.3rem">Equipped &mdash; ${slot}</p>`;
        html += `<p style="color:var(--text-secondary);font-style:italic;margin-bottom:0.8rem;font-size:0.85rem;line-height:1.4">${item.description}</p>`;

        if (item.stats) {
            html += '<div class="char-sheet"><div class="stat-group"><h4>Stats</h4>';
            for (const [stat, val] of Object.entries(item.stats)) {
                html += `<div class="stat-row"><span class="stat-name">${this.formatStatName(stat)}</span><span class="stat-value stat-bonus">+${val}</span></div>`;
            }
            html += '</div></div>';
        }

        html += '<div style="display:flex;gap:0.4rem;margin-top:0.8rem;flex-wrap:wrap">';
        html += `<button class="action-btn" onclick="Inventory.unequip('${slot}')">Unequip</button>`;
        html += `<button class="action-btn" onclick="Inventory.render()">Back</button>`;
        html += '</div></div>';

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
        if (!item || item.type !== 'consumable') return;

        // Healing effect
        if (item.effect) {
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
            // Old-style heal/mana shorthand (fish items)
            if (item.effect.heal) GameState.healPlayer(item.effect.heal, 0);
            if (item.effect.mana) GameState.healPlayer(0, item.effect.mana);
        }

        // Apply food/potion buff
        if (item.buff) {
            GameState.addBuff(item.buff);
        }

        // Apply survival effects (temperature, fatigue, morale)
        if (item.survivalEffect && GameState.survival) {
            const s = GameState.survival;
            const fx = item.survivalEffect;
            if (fx.temperature) s.temperature = Math.max(0, Math.min(100, s.temperature + fx.temperature));
            if (fx.fatigue) s.fatigue = Math.max(0, Math.min(100, s.fatigue + fx.fatigue));
            if (fx.morale) s.morale = Math.max(0, Math.min(100, s.morale + fx.morale));
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

    guessSlot(item) {
        if (item.slot) return item.slot;
        if (item.type === 'weapon' || item.type === 'tool') return 'weapon';
        if (item.type === 'armor') {
            if (item.name && item.name.toLowerCase().includes('helm')) return 'helmet';
            if (item.name && item.name.toLowerCase().includes('boot')) return 'boots';
            if (item.name && item.name.toLowerCase().includes('shield')) return 'offhand';
            return 'armor';
        }
        return null;
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
