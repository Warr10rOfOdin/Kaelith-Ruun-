// ============================================
// THE CAMP — UNIFIED HUB
// ============================================
// One game, one loop:
//   BREACH RUNS  → gold, materials, XP gems, realm bosses
//   THE CAMP     → mine the Depths, craft gear, farm food,
//                  build structures — every building and tool
//                  feeds power back into the next run.
// Each run costs a day: crops grow, plots dry, golems mine,
// sprites harvest, seasons turn.
// ============================================

const Hub = {

    // First entry: make sure a unified save exists
    ensurePlayer(classKey) {
        if (GameState.player) return;
        GameState.initialize('Survivor', 'human', classKey || 'voidblade');
        // The unified game starts at camp, not in the story world
        GameState.currentLocation = 'player_camp';
        GameState.currentRegion = 'ashen_wastes';
        GameState.save();
    },

    enter() {
        // The unified game never runs the tile engine — make sure it's idle
        if (typeof WorldMap !== 'undefined' && WorldMap.stopLoop) WorldMap.stopLoop();
        // Migrate any legacy Breach gold into the unified wallet
        if (typeof BreachMeta !== 'undefined' && GameState.player) {
            const meta = BreachMeta.load();
            if (meta.gold > 0) {
                GameState.player.gold += meta.gold;
                meta.gold = 0;
                BreachMeta.save();
                GameState.save();
            }
        }
        ScreenManager.showScreen('hub');
        this.render();
    },

    fmtSeason(s) {
        const icons = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
        return `${icons[s] || ''} ${s ? s.charAt(0).toUpperCase() + s.slice(1) : ''}`;
    },

    // Count crops ready to harvest
    readyCrops() {
        const b = GameState.base;
        if (!b || !b.plots) return 0;
        return b.plots.filter(p => {
            if (!p.crop) return false;
            const def = CROPS[p.crop];
            return def && p.growth >= def.growthTurns;
        }).length;
    },

    stockpileCount() {
        const b = GameState.base;
        if (!b || !b.automation || !b.automation.stockpile) return 0;
        return Object.values(b.automation.stockpile).reduce((s, q) => s + q, 0);
    },

    // Count of carried food (used as run rations)
    foodCount() {
        if (!GameState.player) return 0;
        return GameState.player.inventory.reduce((n, inv) => {
            const item = ITEMS[inv.key];
            return n + (item && Breach.isFood(item) ? inv.quantity : 0);
        }, 0);
    },

    render() {
        const el = document.getElementById('hub-content');
        if (!el || !GameState.player) return;
        const p = GameState.player;
        const s = GameState.survival || { dayCount: 0, season: 'summer' };
        const b = GameState.base || {};
        const buildings = b.buildings || {};
        const meta = typeof BreachMeta !== 'undefined' ? BreachMeta.load() : { cleared: {}, stats: { runs: 0 } };
        const bonuses = typeof Breach !== 'undefined' ? Breach.campBonuses() : null;

        let html = '';

        // ── Header strip ──
        html += `<div class="hub-header">`;
        html += `<div class="hub-title-row">`;
        html += `<span class="hub-camp-name">🏕️ The Last Camp</span>`;
        html += `<span class="hub-day">Day ${s.dayCount + 1} · ${this.fmtSeason(s.season)}</span>`;
        html += `</div>`;
        html += `<div class="hub-res-row">`;
        html += `<span class="hub-res gold">🪙 ${p.gold}</span>`;
        html += `<span class="hub-res">🪵 ${GameState.getInventoryCount('wood')}</span>`;
        html += `<span class="hub-res">🧱 ${GameState.getInventoryCount('stone')}</span>`;
        html += `<span class="hub-res">🪨 ${GameState.getInventoryCount('iron_ore')}</span>`;
        html += `<span class="hub-res">🍖 ${this.foodCount()}</span>`;
        html += `</div>`;
        html += `</div>`;

        // ── Breach CTA ──
        const cleared = Object.keys(meta.cleared || {}).length;
        html += `<button class="bstart-btn hub-breach-cta" onclick="Breach.openSetup()">⚔ ENTER THE BREACH</button>`;
        html += `<div class="hub-breach-meta">${meta.stats.runs === 0
            ? 'Each run costs a day. Bring back what you can.'
            : `${meta.stats.runs} runs · ${meta.stats.kills || 0} slain · ${cleared}/4 realms cleared`}</div>`;

        // ── Run bonuses from the camp ──
        if (bonuses) {
            const chips = [];
            if (bonuses.hp > 0) chips.push(`+${bonuses.hp} HP`);
            if (bonuses.dmg > 0) chips.push(`+${Math.round(bonuses.dmg * 100)}% dmg`);
            if (bonuses.haste > 0) chips.push(`+${Math.round(bonuses.haste * 100)}% atk spd`);
            if (bonuses.speed > 0) chips.push(`+${Math.round(bonuses.speed * 100)}% move`);
            if (bonuses.xp > 0) chips.push(`+${Math.round(bonuses.xp * 100)}% XP`);
            if (bonuses.armor > 0) chips.push(`-${bonuses.armor} dmg taken`);
            if (bonuses.revive > 0) chips.push(`🕯️ ward revive`);
            if (chips.length > 0) {
                html += `<div class="hub-bonus-row">${chips.map(c => `<span class="hub-bonus-chip">${c}</span>`).join('')}</div>`;
            } else {
                html += `<div class="hub-bonus-row"><span class="hub-bonus-chip dim">Build up the camp to empower your runs</span></div>`;
            }
        }

        // ── Facilities ──
        const ready = this.readyCrops();
        const stock = this.stockpileCount();
        const mine = b.mine || { maxDepth: 0 };
        const builtCount = Object.values(buildings).filter(Boolean).length;

        const cards = [
            {
                icon: '⛏️', name: 'The Depths', onclick: 'Homestead.showMinePanel()',
                status: buildings.mineshaft ? (mine.maxDepth > 0 ? `depth Lv ${mine.maxDepth}` : 'unexplored') : 'build a mineshaft',
                badge: null, locked: !buildings.mineshaft
            },
            {
                icon: '⚒️', name: 'Forge & Craft', onclick: 'Base.showCraftPanel()',
                status: (buildings.forge || buildings.workshop || buildings.herbalist_bench) ? 'craft tools & gear' : 'build a forge or workshop',
                locked: !(buildings.forge || buildings.workshop || buildings.herbalist_bench)
            },
            {
                icon: '🌾', name: 'The Fields', onclick: 'Homestead.showFarmPanel()',
                status: (buildings.garden || buildings.farm) ? 'soil, seasons, crossbreeds' : 'build a garden',
                badge: ready > 0 ? `${ready} ready` : null,
                locked: !buildings.garden && !buildings.farm
            },
            {
                icon: '🏗️', name: 'Build', onclick: 'Base.showBuildPanel()',
                status: `${builtCount} structures raised`,
                locked: false
            },
            {
                icon: '⚙️', name: 'Industry', onclick: 'Homestead.showIndustryPanel()',
                status: 'golems, sprites, irrigation',
                badge: stock > 0 ? `📦 ${stock}` : null,
                locked: false
            },
            {
                icon: '🎒', name: 'Storehouse', onclick: 'Inventory.render();Game.openPanel()',
                status: `${GameState.player.inventory.length}/${GameState.MAX_INVENTORY_SIZE} slots`,
                locked: false
            }
        ];

        html += `<div class="hub-grid">`;
        for (const c of cards) {
            html += `<button class="hub-card ${c.locked ? 'locked' : ''}" onclick="${c.onclick}">`;
            if (c.badge) html += `<span class="hub-card-badge">${c.badge}</span>`;
            html += `<span class="hub-card-icon">${c.icon}</span>`;
            html += `<span class="hub-card-name">${c.name}</span>`;
            html += `<span class="hub-card-status">${c.status}</span>`;
            html += `</button>`;
        }
        html += `</div>`;

        html += `<div class="hub-footer">`;
        html += `<button class="hub-link" onclick="ScreenManager.showScreen('lore')">📖 Lore</button>`;
        html += `<button class="hub-link" onclick="Game.handleHubSettings()">⚙️ Settings</button>`;
        html += `</div>`;

        el.innerHTML = html;
    }
};
