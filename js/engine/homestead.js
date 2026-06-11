// ============================================
// HOMESTEAD ENGINE — Mining, Farming,
// Terraforming & Automation
// ============================================
// The deep camp-economy layer:
//  · THE DEPTHS — expedition mining beneath the camp
//  · LIVING SOIL — plot-based farming with soil quality,
//    watering, seasons, crop quality and crossbreeding
//  · TERRAFORMING — reshape the camp's terrain permanently
//  · INDUSTRY — automated mining golems, irrigation and
//    harvest sprites unlocked through the tech tree
// ============================================

const Homestead = {

    // ════════════════════════════════════════
    // SHARED STATE & HELPERS
    // ════════════════════════════════════════

    ensure() {
        if (!GameState.base) GameState.base = { buildings: {}, crops: [], placeables: [], placedBuildings: [] };
        const b = GameState.base;
        if (!b.plots) b.plots = [];
        if (!b.terraform) b.terraform = {};
        if (!b.mine) b.mine = { maxDepth: 0, totalMined: 0, runs: 0 };
        if (!b.automation) b.automation = { golems: 0, stockpile: {} };
        if (!b.automation.stockpile) b.automation.stockpile = {};
        return b;
    },

    openPanel() {
        if (typeof Game !== 'undefined' && Game.openPanel) Game.openPanel();
        else {
            const sp = document.getElementById('side-panel');
            if (sp) sp.classList.remove('hidden');
        }
    },

    // Best pickaxe the player owns (equipped or carried)
    bestPickaxe() {
        let best = { tier: 0, name: 'Bare Hands', icon: '✊' };
        const consider = (key) => {
            const item = ITEMS[key];
            if (item && item.toolType === 'pickaxe' && (item.toolTier || 1) > best.tier) {
                best = { tier: item.toolTier || 1, name: item.name, icon: item.icon };
            }
        };
        if (GameState.player) {
            for (const slot of Object.keys(GameState.player.equipment || {})) {
                if (GameState.player.equipment[slot]) consider(GameState.player.equipment[slot]);
            }
            (GameState.player.inventory || []).forEach(inv => consider(inv.key));
        }
        return best;
    },

    addToStockpile(itemKey, qty) {
        const b = this.ensure();
        b.automation.stockpile[itemKey] = (b.automation.stockpile[itemKey] || 0) + qty;
    },

    day() {
        return GameState.survival ? GameState.survival.dayCount : 0;
    },

    // ════════════════════════════════════════
    // THE DEPTHS — EXPEDITION MINING
    // ════════════════════════════════════════
    // The Mineshaft building opens a shaft beneath the camp.
    // Each descent is a push-your-luck run: a wall of cells
    // per depth level, a limited strike budget, hidden rubble
    // that may hide gems or gas pockets, and a shaft cell that
    // must be cracked open to go deeper. Deeper floors hold
    // richer ore but bigger hazards.

    _mine: null, // { depth, strikes, cells[], collected{}, opened }

    STRIKE_BASE: 8,
    STRIKES_PER_TIER: 4,

    mineStartDepth() {
        const upgrade = typeof Base !== 'undefined' ? Base.getUpgradeEffect('mineshaft') : null;
        const maxD = this.ensure().mine.maxDepth;
        if (upgrade === 'deep_winch' && maxD >= 15) return 15;
        if ((upgrade === 'shaft_timbered' || upgrade === 'deep_winch') && maxD >= 5) return 5;
        return 1;
    },

    mineStrikeBudget(pickTier) {
        let strikes = this.STRIKE_BASE + this.STRIKES_PER_TIER * Math.max(1, pickTier);
        const upgrade = typeof Base !== 'undefined' ? Base.getUpgradeEffect('mineshaft') : null;
        if (upgrade === 'shaft_timbered') strikes += 4;
        if (upgrade === 'deep_winch') strikes += 8;
        return strikes;
    },

    // What a stone cell yields at a given depth
    stoneYield(depth) {
        if (depth >= 16) return Math.random() < 0.5 ? 'obsidian' : 'granite';
        if (depth >= 8) return Math.random() < 0.6 ? 'granite' : 'stone';
        return 'stone';
    },

    // Weighted ore subtype for a depth (gated by pickaxe tier)
    rollOre(depth, pickTier) {
        const pool = [{ key: 'iron_ore', w: 10 }];
        if (depth >= 2) pool.push({ key: 'coal', w: 8 });
        if (depth >= 8 && pickTier >= 2) pool.push({ key: 'mithril_ore', w: 5 + Math.floor(depth / 4) });
        if (depth >= 16 && pickTier >= 3) pool.push({ key: 'void_ore', w: 3 + Math.floor(depth / 6) });
        const total = pool.reduce((s, p) => s + p.w, 0);
        let r = Math.random() * total;
        for (const p of pool) { r -= p.w; if (r <= 0) return p.key; }
        return 'iron_ore';
    },

    generateWall(depth, pickTier) {
        const cells = [];
        const push = (type, extra) => cells.push(Object.assign({ type, struck: false }, extra || {}));

        // Exactly one shaft per wall — crack it to descend
        push('shaft');

        for (let i = 0; i < 11; i++) {
            const r = Math.random();
            if (r < 0.30) {
                push('stone');
            } else if (r < 0.52) {
                const ore = this.rollOre(depth, 4); // roll without gating to show locked veins
                const req = ore === 'void_ore' ? 3 : ore === 'mithril_ore' ? 2 : 1;
                push('ore', { ore, req });
            } else if (r < 0.60 && depth >= 12) {
                push('crystal');
            } else if (r < 0.68) {
                push('beam');
            } else if (r < 0.95) {
                // Hidden rubble: could be treasure or trouble
                push('rubble');
            } else if (depth >= 10) {
                push('relic');
            } else {
                push('stone');
            }
        }

        // Shuffle
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        return cells;
    },

    showMinePanel() {
        const b = this.ensure();
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;
        this.openPanel();

        if (!b.buildings.mineshaft) {
            panel.innerHTML = '<h3>The Depths</h3>' +
                '<p style="color:var(--text-secondary)">Build a <strong>Mineshaft</strong> at your camp to open a passage into the depths beneath Kaelith Ruun.</p>' +
                '<button class="action-btn" onclick="Game.closePanel()" style="margin-top:1rem">Close</button>';
            return;
        }

        const pick = this.bestPickaxe();
        const startDepth = this.mineStartDepth();
        const strikes = this.mineStrikeBudget(pick.tier);

        let html = '<h3>The Depths</h3>';
        html += `<div class="mine-summary">`;
        html += `<div class="mine-stat"><span class="mine-stat-label">Deepest Reach</span><span class="mine-stat-value">Level ${b.mine.maxDepth || '—'}</span></div>`;
        html += `<div class="mine-stat"><span class="mine-stat-label">Ore Hauled</span><span class="mine-stat-value">${b.mine.totalMined}</span></div>`;
        html += `<div class="mine-stat"><span class="mine-stat-label">Descents</span><span class="mine-stat-value">${b.mine.runs}</span></div>`;
        html += `</div>`;

        html += `<div class="mine-loadout">`;
        html += `<div class="mine-loadout-row">${pick.icon} <strong>${pick.name}</strong>${pick.tier === 0 ? ' — craft a pickaxe first!' : ` (Tier ${pick.tier})`}</div>`;
        html += `<div class="mine-loadout-row">🕯️ Lantern oil for <strong>${strikes} strikes</strong> · Entry at <strong>level ${startDepth}</strong></div>`;
        html += `</div>`;

        html += `<div class="mine-depth-guide">`;
        html += `<div class="mine-guide-row"><span>Lv 1–7</span><span>Stone · Iron · Coal</span></div>`;
        html += `<div class="mine-guide-row ${b.mine.maxDepth >= 8 ? '' : 'undiscovered'}"><span>Lv 8–15</span><span>${b.mine.maxDepth >= 8 ? 'Granite · Mithril · Gems' : '???'}</span></div>`;
        html += `<div class="mine-guide-row ${b.mine.maxDepth >= 16 ? '' : 'undiscovered'}"><span>Lv 16+</span><span>${b.mine.maxDepth >= 16 ? 'Obsidian · Void Ore · Relics' : '???'}</span></div>`;
        html += `</div>`;

        if (pick.tier === 0) {
            html += `<p style="color:var(--accent-red-bright);font-size:0.85rem;margin-top:0.6rem">You need a pickaxe to mine. Craft a Stone Pickaxe at your workshop.</p>`;
        } else {
            html += `<button class="action-btn primary" style="margin-top:0.8rem;width:100%;padding:0.9rem" onclick="Homestead.startDescent()">⛏️ Descend Into the Depths</button>`;
        }
        html += `<button class="action-btn" onclick="Game.closePanel()" style="margin-top:0.6rem">Close</button>`;
        panel.innerHTML = html;
    },

    startDescent() {
        const b = this.ensure();
        const pick = this.bestPickaxe();
        if (pick.tier === 0) return;

        const depth = this.mineStartDepth();
        this._mine = {
            depth,
            pickTier: pick.tier,
            pickName: pick.name,
            strikes: this.mineStrikeBudget(pick.tier),
            cells: this.generateWall(depth, pick.tier),
            collected: {},
            opened: false,
            cellsStruck: 0
        };

        if (typeof Game !== 'undefined' && Game.closePanel) Game.closePanel();
        this.renderMineOverlay();
        if (typeof Audio !== 'undefined') Audio.playGather();
    },

    renderMineOverlay() {
        let overlay = document.getElementById('mine-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mine-overlay';
            overlay.className = 'mine-overlay';
            (document.getElementById('game-container') || document.body).appendChild(overlay);
        }

        const m = this._mine;
        if (!m) { overlay.remove(); return; }

        const CELL_VIEW = {
            stone: () => ({ icon: '🪨', label: 'Stone' }),
            ore: (c) => {
                const item = ITEMS[c.ore];
                const locked = m.pickTier < c.req;
                return { icon: item ? item.icon : '⛏️', label: locked ? `Tier ${c.req} pick` : (item ? item.name : 'Ore'), locked };
            },
            crystal: () => ({ icon: '💠', label: 'Crystal' }),
            gem: () => ({ icon: '💎', label: 'Gems' }),
            beam: () => ({ icon: '🪵', label: '+2 oil' }),
            rubble: () => ({ icon: '❓', label: 'Rubble' }),
            relic: () => ({ icon: '🗝️', label: 'Relic' }),
            gas: () => ({ icon: '☁️', label: 'Gas!' }),
            shaft: () => ({ icon: '🕳️', label: m.opened ? 'Open!' : 'Shaft' })
        };

        let cellsHtml = '';
        m.cells.forEach((c, i) => {
            const view = (CELL_VIEW[c.type] || CELL_VIEW.stone)(c);
            const cls = [
                'mine-cell',
                c.struck ? 'struck' : '',
                view.locked ? 'locked' : '',
                c.type === 'shaft' ? 'shaft' : '',
                c.type === 'rubble' && !c.struck ? 'rubble' : ''
            ].join(' ');
            const disabled = c.struck || view.locked || m.strikes <= 0;
            cellsHtml += `<button class="${cls}" ${disabled ? 'disabled' : ''} onclick="Homestead.strikeCell(${i})">` +
                `<span class="mine-cell-icon">${c.struck ? (c.revealIcon || '·') : view.icon}</span>` +
                `<span class="mine-cell-label">${c.struck ? (c.revealLabel || '') : view.label}</span>` +
                `</button>`;
        });

        let lootHtml = '';
        const entries = Object.entries(m.collected);
        if (entries.length > 0) {
            lootHtml = entries.map(([k, q]) => {
                const item = ITEMS[k];
                return `<span class="mine-loot-chip">${item ? item.icon : ''} ${q}</span>`;
            }).join('');
        } else {
            lootHtml = '<span style="color:var(--text-dim);font-style:italic;font-size:0.75rem">Nothing yet…</span>';
        }

        const hp = GameState.player ? `${GameState.player.hp}/${GameState.player.maxHp}` : '';

        overlay.innerHTML = `
            <div class="mine-panel">
                <div class="mine-header">
                    <div class="mine-depth-label">⛏️ Depth <strong>Lv ${m.depth}</strong></div>
                    <div class="mine-oil ${m.strikes <= 3 ? 'low' : ''}">🕯️ ${m.strikes}</div>
                    <div class="mine-hp">❤️ ${hp}</div>
                </div>
                <div class="mine-wall">${cellsHtml}</div>
                <div class="mine-loot-bar">${lootHtml}</div>
                <div class="mine-actions">
                    <button class="action-btn primary mine-descend-btn" ${m.opened && m.strikes > 0 ? '' : 'disabled'} onclick="Homestead.descend()">⬇️ Descend (Lv ${m.depth + 1})</button>
                    <button class="action-btn mine-surface-btn" onclick="Homestead.surface()">🪜 Surface &amp; Keep All</button>
                </div>
            </div>
        `;
    },

    strikeCell(idx) {
        const m = this._mine;
        if (!m || m.strikes <= 0) return;
        const c = m.cells[idx];
        if (!c || c.struck) return;
        if (c.type === 'ore' && m.pickTier < c.req) return;

        m.strikes--;
        m.cellsStruck++;
        c.struck = true;

        const give = (key, qty) => {
            m.collected[key] = (m.collected[key] || 0) + qty;
            const item = ITEMS[key];
            c.revealIcon = item ? item.icon : '✦';
            c.revealLabel = `+${qty}`;
        };

        const d = m.depth;
        const bonus = Math.max(0, m.pickTier - 1);

        switch (c.type) {
            case 'stone': {
                give(this.stoneYield(d), 1 + Math.floor(Math.random() * 2) + Math.floor(bonus / 2));
                break;
            }
            case 'ore': {
                give(c.ore, 1 + Math.floor(Math.random() * 2) + bonus);
                // Rich strike: crits scale with pick tier
                if (Math.random() < 0.08 + m.pickTier * 0.04) {
                    give(c.ore, 2);
                    Notifications.show('Rich strike!', 'gold');
                }
                break;
            }
            case 'crystal': {
                give('crystal_shard', 1 + Math.floor(Math.random() * 2));
                break;
            }
            case 'gem': {
                const gems = ['gem_ruby', 'gem_sapphire', 'gem_emerald', 'gem_amethyst'];
                give(gems[Math.floor(Math.random() * gems.length)], 1);
                break;
            }
            case 'beam': {
                m.strikes += 3; // refund this strike +2
                c.revealIcon = '🕯️';
                c.revealLabel = '+2 oil';
                break;
            }
            case 'relic': {
                give('arcane_dust', 1 + Math.floor(Math.random() * 2));
                if (d >= 20 && Math.random() < 0.5) give('ruun_shard', 1);
                break;
            }
            case 'rubble': {
                // Hidden: gem (20%), ore (30%), gas pocket (25%), stone (25%)
                const r = Math.random();
                if (r < 0.20 && d >= 4) {
                    const gems = ['gem_ruby', 'gem_sapphire', 'gem_emerald', 'gem_amethyst'];
                    give(gems[Math.floor(Math.random() * gems.length)], 1);
                } else if (r < 0.50) {
                    const ore = this.rollOre(d, m.pickTier);
                    give(ore, 1 + bonus);
                } else if (r < 0.75 && d >= 3) {
                    // GAS POCKET
                    const dmg = 4 + Math.floor(d / 2);
                    GameState.player.hp = Math.max(1, GameState.player.hp - dmg);
                    c.revealIcon = '💥';
                    c.revealLabel = `-${dmg} HP`;
                    Notifications.show(`Gas pocket! -${dmg} HP`, 'red');
                    if (typeof Effects !== 'undefined') Effects.screenFlash('rgba(120,180,60,0.18)');
                    if (typeof NativeBridge !== 'undefined') NativeBridge.hapticHeavy();
                } else {
                    give(this.stoneYield(d), 1);
                }
                break;
            }
            case 'shaft': {
                m.opened = true;
                c.revealIcon = '🕳️';
                c.revealLabel = 'Open!';
                break;
            }
        }

        if (typeof Audio !== 'undefined') Audio.playGather();
        this.renderMineOverlay();

        // Out of oil: forced surface after a beat
        if (m.strikes <= 0) {
            setTimeout(() => {
                if (this._mine) {
                    Notifications.show('Your lantern gutters out — you climb back up.', 'blue');
                    this.surface();
                }
            }, 900);
        }
    },

    descend() {
        const m = this._mine;
        if (!m || !m.opened || m.strikes <= 0) return;
        m.depth++;
        m.opened = false;
        m.cells = this.generateWall(m.depth, m.pickTier);

        const b = this.ensure();
        if (m.depth > b.mine.maxDepth) {
            b.mine.maxDepth = m.depth;
            if (m.depth === 8) Notifications.show('Pale blue veins glimmer in the walls — mithril!', 'gold');
            if (m.depth === 16) Notifications.show('The stone here flickers in and out of being…', 'gold');
        }

        if (typeof Effects !== 'undefined') Effects.screenFlash('rgba(20,20,40,0.3)');
        this.renderMineOverlay();
    },

    surface() {
        const m = this._mine;
        if (!m) return;
        this._mine = null;
        const overlay = document.getElementById('mine-overlay');
        if (overlay) overlay.remove();

        const b = this.ensure();
        b.mine.runs++;

        let total = 0;
        let overflow = false;
        for (const [key, qty] of Object.entries(m.collected)) {
            total += qty;
            if (!GameState.addToInventory(key, qty)) {
                this.addToStockpile(key, qty);
                overflow = true;
            }
        }
        b.mine.totalMined += total;
        GameState.trackStat('resourcesGathered', total);

        // Mining takes time and effort
        const turns = 2 + Math.floor(m.depth / 5);
        GameState.turnCount += turns;
        this.tickGrowth(turns);
        if (GameState.survival) GameState.survival.fatigue = Math.min(100, GameState.survival.fatigue + 8 + Math.floor(m.depth / 4));

        Narrative.addSeparator();
        Narrative.addStory(`You haul your finds up from level ${m.depth} of the depths — ${total} resources richer.`);
        if (overflow) Narrative.addSystem('Your packs were full; the overflow was left in the camp stockpile.');
        if (typeof Audio !== 'undefined') Audio.playLoot();

        HUD.update();
        GameState.save();
    },

    // ════════════════════════════════════════
    // LIVING SOIL — PLOT-BASED FARMING
    // ════════════════════════════════════════
    // Each plot is real: soil quality that improves with use,
    // daily watering (or irrigation), fertilizer, seasonal
    // growth, quality harvests, and crossbreeding hybrids.

    _plantingIdx: null,

    CROP_SEASONS: {
        ember_root_seed: ['summer', 'autumn'],
        veil_mushroom_seed: ['autumn', 'winter'],
        blood_blossom_seed: ['spring', 'summer'],
        shadow_pepper_seed: ['summer'],
        starfruit_seed: ['spring', 'winter'],
        ironroot_seed: ['autumn'],
        voidberry_seed: ['winter', 'spring'],
        cinderfruit_seed: ['summer', 'autumn'],
        glimmercap_seed: ['winter', 'spring']
    },

    // Crossbreeding: harvesting a crop next to a mature partner
    // can also yield a hybrid fruit
    MUTATIONS: [
        { pair: ['ember_root_seed', 'voidberry_seed'], result: 'cinderfruit', name: 'Cinderfruit' },
        { pair: ['starfruit_seed', 'veil_mushroom_seed'], result: 'glimmercap', name: 'Glimmercap' }
    ],

    plotCapacity() {
        const b = this.ensure();
        if (!b.buildings.garden && !b.buildings.farm) return 0;
        let cap = (b.buildings.garden ? 4 : 0) + (b.buildings.farm ? 6 : 0);
        if (typeof Base !== 'undefined') {
            const gardenEffect = Base.getUpgradeEffect('garden');
            if (gardenEffect === 'garden_upgrade') cap += 1;
            else if (gardenEffect === 'greenhouse') cap += 3;
            if (Base.getUpgradeEffect('farm') === 'farm_expand') cap += 3;
        }
        // Terraforming: every tilled soil tile at camp adds a plot
        cap += Math.min(8, this.countTerraform('G'));
        return Math.min(24, cap);
    },

    countTerraform(ch) {
        const b = this.ensure();
        return Object.values(b.terraform).filter(t => t.ch === ch).length;
    },

    seasonMult(cropId) {
        const season = GameState.survival ? GameState.survival.season : 'summer';
        // Greenhouse ignores seasons entirely
        if (typeof Base !== 'undefined' && Base.getUpgradeEffect('garden') === 'greenhouse') return 1.15;
        const prefs = this.CROP_SEASONS[cropId];
        if (!prefs) return 1.0;
        if (prefs.includes(season)) return 1.35;
        if (season === 'winter') return 0.45;
        return 0.85;
    },

    growthMultiplier(plot) {
        let mult = 1.0;

        // Watering is the heart of it (rain counts)
        const raining = typeof WorldMap !== 'undefined' && WorldMap.weather === 'rain';
        mult *= (plot.watered || raining) ? 1.5 : 0.7;

        // Soil quality
        mult *= 1 + (plot.soil - 1) * 0.15;

        // Fertilizer
        if (plot.fertilized) mult *= 1.3;

        // Garden upgrades
        if (typeof Base !== 'undefined') {
            const gardenEffect = Base.getUpgradeEffect('garden');
            if (gardenEffect === 'garden_upgrade') mult *= 1.25;
            else if (gardenEffect === 'greenhouse') mult *= 1.5;
        }

        // Well placeable
        if (typeof Base !== 'undefined' && Base.hasPlaceable('irrigation')) mult *= 1.25;

        // Ponds dug at camp (up to +15%)
        mult *= 1 + Math.min(3, this.countTerraform('O')) * 0.05;

        // Farmer's garb
        if (GameState.player && GameState.player.equipment) {
            const armor = ITEMS[GameState.player.equipment.armor];
            if (armor && armor.workBonus && armor.workBonus.type === 'farming') {
                mult *= armor.workBonus.speedMult || 1;
            }
        }

        // Camp farmers
        if (GameState.campNPCs) {
            const farmers = GameState.campNPCs.filter(n => n.role === 'farmer').length;
            mult *= 1 + farmers * 0.25;
        }

        return mult;
    },

    tickGrowth(turns = 1) {
        const b = this.ensure();
        const raining = typeof WorldMap !== 'undefined' && WorldMap.weather === 'rain';
        b.plots.forEach(plot => {
            if (!plot.crop) return;
            const cropDef = CROPS[plot.crop];
            if (!cropDef) return;
            const rate = this.growthMultiplier(plot) * this.seasonMult(plot.crop);
            plot.growth += rate * turns;
            plot.totalTurns = (plot.totalTurns || 0) + turns;
            if (plot.watered || raining) plot.wateredTurns = (plot.wateredTurns || 0) + turns;
        });
    },

    showFarmPanel() {
        const b = this.ensure();
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;
        this.openPanel();

        const cap = this.plotCapacity();
        let html = '<h3>Living Soil</h3>';

        if (cap === 0) {
            html += '<p style="color:var(--text-secondary)">Build a <strong>Garden</strong> or <strong>Farm Plot</strong> to start cultivating. Till soil with terraforming to add even more plots.</p>';
            html += '<button class="action-btn" onclick="Game.closePanel()" style="margin-top:1rem">Close</button>';
            panel.innerHTML = html;
            return;
        }

        const season = GameState.survival ? GameState.survival.season : 'summer';
        const seasonIcons = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
        const irrigated = !!b.buildings.irrigation_network;
        const raining = typeof WorldMap !== 'undefined' && WorldMap.weather === 'rain';

        html += `<div class="farm-status-bar">`;
        html += `<span>${seasonIcons[season] || ''} ${season.charAt(0).toUpperCase() + season.slice(1)}</span>`;
        html += `<span>🌱 ${b.plots.length}/${cap} plots</span>`;
        html += irrigated ? `<span class="farm-auto-tag">💧 Irrigated</span>` : (raining ? `<span class="farm-auto-tag">🌧️ Rain</span>` : `<span>💧 Water daily</span>`);
        html += `</div>`;

        // Bulk actions
        const fertCount = GameState.getInventoryCount('fertilizer');
        const dryPlots = b.plots.some(p => !p.watered);
        if (!irrigated && dryPlots && b.plots.length > 0) {
            html += `<button class="action-btn primary" style="width:100%;margin-bottom:0.6rem" onclick="Homestead.waterAll()">💧 Water All Plots</button>`;
        }

        // Plot grid
        html += '<div class="plot-grid">';
        b.plots.forEach((plot, idx) => {
            html += this.renderPlot(plot, idx);
        });
        if (b.plots.length < cap) {
            html += `<button class="plot-card plot-new" onclick="Homestead.preparePlot()">` +
                `<span class="plot-stage">➕</span><span class="plot-crop-name">Prepare Plot</span></button>`;
        }
        html += '</div>';

        // Seed picker (when planting)
        if (this._plantingIdx !== null && b.plots[this._plantingIdx] && !b.plots[this._plantingIdx].crop) {
            html += `<div class="journal-section-label" style="margin-top:0.8rem">Plant in Plot ${this._plantingIdx + 1}</div>`;
            for (const [cropId, cropDef] of Object.entries(CROPS)) {
                // Hybrids stay hidden until you've held the fruit
                const isHybrid = ['cinderfruit_seed', 'glimmercap_seed'].includes(cropId);
                if (isHybrid) {
                    const fruitKey = Object.keys(cropDef.seedCost)[0];
                    const known = GameState.getInventoryCount(fruitKey) > 0 ||
                        (GameState.flags && GameState.flags[`hybrid_${cropId}`]);
                    if (!known) continue;
                }

                const canPlant = typeof Base !== 'undefined' && Base.canAffordRecipe(cropDef.seedCost);
                const prefs = this.CROP_SEASONS[cropId] || [];
                const inSeason = prefs.includes(season);

                html += `<div class="craft-item ${canPlant ? '' : 'locked'}">`;
                html += `<div class="craft-header">`;
                html += `<span class="craft-icon">${cropDef.icon}</span>`;
                html += `<div class="craft-info">`;
                html += `<div class="craft-name">${cropDef.name} ${inSeason ? '<span class="in-season-tag">in season</span>' : ''}</div>`;
                html += `<div class="craft-desc">~${cropDef.growthTurns} turns · yields ${cropDef.harvestQty}x · likes ${prefs.map(s => seasonIcons[s]).join('') || 'any season'}</div>`;
                html += `</div></div>`;
                html += '<div class="craft-cost">';
                for (const [res, qty] of Object.entries(cropDef.seedCost)) {
                    const have = GameState.getInventoryCount(res);
                    const item = ITEMS[res];
                    html += `<span class="cost-item ${have >= qty ? 'have' : 'need'}">${item ? item.icon : ''} ${have}/${qty}</span>`;
                }
                html += '</div>';
                if (canPlant) {
                    html += `<button class="action-btn primary" onclick="Homestead.plant(${this._plantingIdx}, '${cropId}')">Plant</button>`;
                }
                html += '</div>';
            }
            html += `<button class="action-btn" onclick="Homestead._plantingIdx=null;Homestead.showFarmPanel()">Cancel</button>`;
        }

        // Crossbreeding hint
        html += `<div class="farm-hint">🧬 Crops planted side by side sometimes crossbreed at harvest. Fertilizer helps. ${fertCount > 0 ? `(${fertCount} fertilizer ready)` : ''}</div>`;

        html += `<button class="action-btn" onclick="Game.closePanel()" style="margin-top:0.8rem">Close</button>`;
        panel.innerHTML = html;
    },

    renderPlot(plot, idx) {
        const soilStars = '★'.repeat(plot.soil) + '☆'.repeat(3 - plot.soil);
        const raining = typeof WorldMap !== 'undefined' && WorldMap.weather === 'rain';
        const wet = plot.watered || raining;
        const irrigated = this.ensure().buildings.irrigation_network;

        let html = `<div class="plot-card ${wet ? 'wet' : 'dry'}">`;
        html += `<span class="plot-soil" title="Soil quality">${soilStars}</span>`;

        if (!plot.crop) {
            html += `<span class="plot-stage">🟤</span>`;
            html += `<span class="plot-crop-name">Empty</span>`;
            html += `<button class="plot-btn" onclick="Homestead._plantingIdx=${idx};Homestead.showFarmPanel()">Plant</button>`;
        } else {
            const cropDef = CROPS[plot.crop];
            const progress = Math.min(plot.growth / cropDef.growthTurns, 1);
            const stageIdx = Math.floor(progress * (cropDef.stages.length - 1));
            const ready = plot.growth >= cropDef.growthTurns;

            html += `<span class="plot-stage ${ready ? 'ready-pulse' : ''}">${cropDef.stages[stageIdx]}</span>`;
            html += `<span class="plot-crop-name">${cropDef.name}</span>`;
            html += `<div class="plot-badges">`;
            html += wet ? `<span class="plot-badge wet">💧</span>` : `<span class="plot-badge dry">🥀</span>`;
            if (plot.fertilized) html += `<span class="plot-badge">✨</span>`;
            html += `</div>`;

            if (ready) {
                html += `<button class="plot-btn harvest" onclick="Homestead.harvest(${idx})">Harvest</button>`;
            } else {
                html += `<div class="plot-progress-track"><div class="plot-progress-fill" style="width:${Math.floor(progress * 100)}%"></div></div>`;
                let acts = '';
                if (!wet && !irrigated) acts += `<button class="plot-btn" onclick="Homestead.water(${idx})">💧</button>`;
                if (!plot.fertilized && GameState.getInventoryCount('fertilizer') > 0) {
                    acts += `<button class="plot-btn" onclick="Homestead.fertilize(${idx})">✨</button>`;
                }
                if (acts) html += `<div class="plot-actions">${acts}</div>`;
            }
        }
        html += '</div>';
        return html;
    },

    preparePlot() {
        const b = this.ensure();
        if (b.plots.length >= this.plotCapacity()) return;
        b.plots.push({ soil: 1, watered: false, fertilized: false, crop: null, growth: 0, harvests: 0, wateredTurns: 0, totalTurns: 0 });
        GameState.save();
        this.showFarmPanel();
    },

    plant(idx, cropId) {
        const b = this.ensure();
        const plot = b.plots[idx];
        const cropDef = CROPS[cropId];
        if (!plot || plot.crop || !cropDef) return;
        if (typeof Base === 'undefined' || !Base.canAffordRecipe(cropDef.seedCost)) {
            Notifications.show('Not enough to plant!', 'red');
            return;
        }
        for (const [res, qty] of Object.entries(cropDef.seedCost)) {
            GameState.removeFromInventory(res, qty);
        }
        plot.crop = cropId;
        plot.growth = 0;
        plot.wateredTurns = 0;
        plot.totalTurns = 0;
        this._plantingIdx = null;
        Notifications.show(`Planted ${cropDef.name}!`, 'green');
        if (typeof Audio !== 'undefined') Audio.playGather();
        GameState.save();
        this.showFarmPanel();
    },

    water(idx) {
        const b = this.ensure();
        if (!b.plots[idx]) return;
        b.plots[idx].watered = true;
        GameState.save();
        this.showFarmPanel();
    },

    waterAll() {
        const b = this.ensure();
        b.plots.forEach(p => { p.watered = true; });
        Narrative.addFlavor('You make the rounds with the watering can. The soil drinks deep.');
        GameState.save();
        this.showFarmPanel();
    },

    fertilize(idx) {
        const b = this.ensure();
        const plot = b.plots[idx];
        if (!plot || plot.fertilized) return;
        if (GameState.getInventoryCount('fertilizer') < 1) return;
        GameState.removeFromInventory('fertilizer', 1);
        plot.fertilized = true;
        Notifications.show('Fertilized! Growth +30%, better quality.', 'green');
        GameState.save();
        this.showFarmPanel();
    },

    harvest(idx, options) {
        const b = this.ensure();
        const plot = b.plots[idx];
        if (!plot || !plot.crop) return;
        const cropDef = CROPS[plot.crop];
        if (!cropDef || plot.growth < cropDef.growthTurns) return;
        const silent = options && options.silent;

        // Quality roll: soil + watering consistency + fertilizer
        const waterRatio = plot.totalTurns > 0 ? (plot.wateredTurns || 0) / plot.totalTurns : 0;
        const goldChance = 0.04 + (plot.soil - 1) * 0.06 + waterRatio * 0.10 + (plot.fertilized ? 0.10 : 0);
        const roll = Math.random();
        let qty = cropDef.harvestQty;
        let qualityLabel = '';
        if (roll < goldChance) {
            qty *= 2;
            qualityLabel = ' ✨ Gold quality!';
        } else if (roll < goldChance * 3) {
            qty += 1;
            qualityLabel = ' ⭐ Silver quality';
        }

        const target = silent ? null : 'inventory';
        if (target === 'inventory') {
            if (!GameState.addToInventory(cropDef.harvestItem, qty)) this.addToStockpile(cropDef.harvestItem, qty);
        } else {
            this.addToStockpile(cropDef.harvestItem, qty);
        }

        // Crossbreeding: check linear neighbors for a mature partner
        let hybridMsg = '';
        if (!silent) {
            for (const neighborIdx of [idx - 1, idx + 1]) {
                const n = b.plots[neighborIdx];
                if (!n || !n.crop) continue;
                const nDef = CROPS[n.crop];
                if (!nDef || n.growth < nDef.growthTurns * 0.8) continue;
                for (const mut of this.MUTATIONS) {
                    const pairMatch = mut.pair.includes(plot.crop) && mut.pair.includes(n.crop) && plot.crop !== n.crop;
                    if (!pairMatch) continue;
                    const chance = plot.fertilized || n.fertilized ? 0.30 : 0.15;
                    if (Math.random() < chance) {
                        GameState.addToInventory(mut.result, 1);
                        if (!GameState.flags) GameState.flags = {};
                        GameState.flags[`hybrid_${mut.result === 'cinderfruit' ? 'cinderfruit_seed' : 'glimmercap_seed'}`] = true;
                        hybridMsg = ` The roots had tangled with the neighboring ${nDef.name} — a strange ${mut.name} grew between them!`;
                        Notifications.show(`🧬 Crossbreed discovered: ${mut.name}!`, 'gold');
                    }
                }
            }
        }

        // Soil improves with cultivation
        plot.harvests = (plot.harvests || 0) + 1;
        plot.soil = Math.min(3, 1 + Math.floor(plot.harvests / 3));
        plot.crop = null;
        plot.growth = 0;
        plot.fertilized = false;
        plot.wateredTurns = 0;
        plot.totalTurns = 0;

        if (!silent) {
            const item = ITEMS[cropDef.harvestItem];
            Narrative.addLoot(`Harvested ${qty}x ${item ? item.name : cropDef.harvestItem}!${qualityLabel}${hybridMsg}`);
            Notifications.show(`Harvested ${cropDef.name}!${qualityLabel}`, 'green');
            if (typeof Audio !== 'undefined') Audio.playLoot();
            HUD.update();
            GameState.save();
            this.showFarmPanel();
        }
        return qty;
    },

    // ════════════════════════════════════════
    // TERRAFORMING — SHAPE THE CAMP
    // ════════════════════════════════════════
    // Select a tool, then use the action button on the tile
    // you're facing. Edits persist forever in the save.

    activeTool: null,

    TOOLS: {
        lay_path: {
            name: 'Lay Path', icon: '🛤️', prompt: 'Lay Path',
            desc: 'Stone paths. Walking on paths at camp is 12% faster.',
            from: ['.', 'g', 'w', 'h', 'a'], to: 'p', cost: { stone: 1 }
        },
        till_soil: {
            name: 'Till Soil', icon: '🟫', prompt: 'Till Soil',
            desc: 'Till the earth. Every tilled tile adds +1 farm plot (max +8).',
            from: ['.', 'g', 'w'], to: 'G', cost: {}
        },
        dig_pond: {
            name: 'Dig Pond', icon: '💧', prompt: 'Dig Pond',
            desc: 'A camp pond. Boosts crop growth (+5% each, max 3) and lets you fish at home.',
            from: ['.', 'g', 'w', 'G'], to: 'O', cost: { stone: 4 }, maxCount: 3
        },
        plant_sapling: {
            name: 'Plant Sapling', icon: '🌿', prompt: 'Plant Tree',
            desc: 'Plant a tree. Grows in 3 days into harvestable wood — renewable forestry.',
            from: ['.', 'g', 'w'], to: 't', cost: { wood: 1 }
        },
        restore: {
            name: 'Clear / Restore', icon: '🧹', prompt: 'Clear Tile',
            desc: 'Return a tile to open grass. Undo paths, soil, ponds and saplings.',
            from: ['p', 'G', 'O', 't', 'g', 'w', 'h'], to: '.', cost: {}
        }
    },

    showTerraformPanel() {
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;
        this.openPanel();

        const atCamp = typeof WorldMap !== 'undefined' && WorldMap.currentMap === 'player_camp';

        let html = '<h3>Terraforming</h3>';
        if (!atCamp) {
            html += '<p style="color:var(--text-secondary)">You can only reshape the land at your own camp.</p>';
            html += '<button class="action-btn" onclick="Game.closePanel()" style="margin-top:1rem">Close</button>';
            panel.innerHTML = html;
            return;
        }

        html += '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.8rem">Pick a tool, then walk up to a tile and use the action button. The land remembers.</p>';

        const stats = [
            `🛤️ ${this.countTerraform('p')} paths`,
            `🟫 ${this.countTerraform('G')} tilled`,
            `💧 ${this.countTerraform('O')}/3 ponds`,
            `🌿 ${this.countTerraform('t') + this.countTerraform('T')} trees planted`
        ];
        html += `<div class="farm-status-bar">${stats.map(s => `<span>${s}</span>`).join('')}</div>`;

        for (const [toolId, tool] of Object.entries(this.TOOLS)) {
            const active = this.activeTool === toolId;
            const costStr = Object.entries(tool.cost).map(([res, qty]) => {
                const item = ITEMS[res];
                const have = GameState.getInventoryCount(res);
                return `<span class="cost-item ${have >= qty ? 'have' : 'need'}">${item ? item.icon : ''} ${qty}/tile</span>`;
            }).join('') || '<span class="cost-item have">Free</span>';

            html += `<div class="craft-item terraform-tool ${active ? 'tool-active' : ''}">`;
            html += `<div class="craft-header">`;
            html += `<span class="craft-icon">${tool.icon}</span>`;
            html += `<div class="craft-info">`;
            html += `<div class="craft-name">${tool.name} ${active ? '<span class="in-season-tag">ACTIVE</span>' : ''}</div>`;
            html += `<div class="craft-desc">${tool.desc}</div>`;
            html += `</div></div>`;
            html += `<div class="craft-cost">${costStr}</div>`;
            html += active
                ? `<button class="action-btn" onclick="Homestead.cancelTool();Homestead.showTerraformPanel()">Stop</button>`
                : `<button class="action-btn primary" onclick="Homestead.selectTool('${toolId}')">Select</button>`;
            html += '</div>';
        }

        html += `<button class="action-btn" onclick="Game.closePanel()" style="margin-top:0.8rem">Close</button>`;
        panel.innerHTML = html;
    },

    selectTool(toolId) {
        if (!this.TOOLS[toolId]) return;
        this.activeTool = toolId;
        if (typeof Game !== 'undefined' && Game.closePanel) Game.closePanel();
        Notifications.show(`${this.TOOLS[toolId].icon} ${this.TOOLS[toolId].name} — face a tile and press the action button`, 'blue');
        if (typeof Exploration !== 'undefined') Exploration.updateActions();
    },

    cancelTool() {
        this.activeTool = null;
        if (typeof Exploration !== 'undefined') Exploration.updateActions();
    },

    // Apply the active tool at tile (x,y). Returns true if handled.
    applyTool(x, y) {
        const tool = this.TOOLS[this.activeTool];
        if (!tool) return false;
        if (typeof WorldMap === 'undefined' || WorldMap.currentMap !== 'player_camp') return false;

        const ch = WorldMap.getTerrainChar(x, y);
        if (!tool.from.includes(ch)) {
            Notifications.show(`Can't ${tool.name.toLowerCase()} here.`, 'red');
            return true; // handled (consumed the interaction)
        }
        if (WorldMap.entityMap[`${x},${y}`]) {
            Notifications.show('Something is in the way.', 'red');
            return true;
        }
        if (tool.maxCount && this.countTerraform(tool.to) >= tool.maxCount) {
            Notifications.show(`You can only have ${tool.maxCount} of those.`, 'red');
            return true;
        }
        for (const [res, qty] of Object.entries(tool.cost)) {
            if (GameState.getInventoryCount(res) < qty) {
                Notifications.show(`Need ${qty} ${ITEMS[res] ? ITEMS[res].name : res}.`, 'red');
                return true;
            }
        }
        for (const [res, qty] of Object.entries(tool.cost)) {
            GameState.removeFromInventory(res, qty);
        }

        const b = this.ensure();
        const key = `${x},${y}`;
        if (tool.to === '.') {
            // Restoring removes the override entirely (or explicitly stores grass
            // if the original map tile wasn't grass)
            const orig = MAPS.player_camp && MAPS.player_camp.terrain[y] ? MAPS.player_camp.terrain[y][x] : '.';
            if (orig === '.') delete b.terraform[key];
            else b.terraform[key] = { ch: '.', day: this.day() };
        } else {
            b.terraform[key] = { ch: tool.to, day: this.day() };
        }
        WorldMap.terrain[y][x] = tool.to;

        if (typeof Sprites !== 'undefined' && Sprites.addParticles) {
            Sprites.addParticles(x * WorldMap.TS + WorldMap.TS / 2, y * WorldMap.TS + WorldMap.TS / 2, '#8a7a5a', 6);
        }
        if (typeof Audio !== 'undefined') Audio.playBuild();
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticLight();

        HUD.update();
        GameState.save();
        return true;
    },

    // Re-apply persistent terrain edits after the camp map loads
    applyTerraformOverrides() {
        if (typeof WorldMap === 'undefined' || WorldMap.currentMap !== 'player_camp') return;
        const b = this.ensure();
        for (const [key, t] of Object.entries(b.terraform)) {
            const [x, y] = key.split(',').map(Number);
            if (WorldMap.terrain[y] && WorldMap.terrain[y][x] !== undefined) {
                WorldMap.terrain[y][x] = t.ch;
            }
        }
    },

    getOverride(mapKey, x, y) {
        if (mapKey !== 'player_camp') return null;
        const b = this.ensure();
        return b.terraform[`${x},${y}`] || null;
    },

    // Called when a resource tile is gathered. Returns true if the
    // tile was a terraformed feature (e.g. a planted tree) that
    // should NOT respawn — the override is consumed.
    onResourceGathered(mapKey, x, y) {
        const override = this.getOverride(mapKey, x, y);
        if (!override) return false;
        const b = this.ensure();
        delete b.terraform[`${x},${y}`];
        GameState.save();
        return true;
    },

    // ════════════════════════════════════════
    // INDUSTRY — AUTOMATION THROUGH DEVELOPMENT
    // ════════════════════════════════════════
    // · Irrigation Network: plots never dry out
    // · Golem Foundry: forge Cinder Golems that mine daily
    // · Sprite Totem: harvest sprites reap & replant crops daily
    // All passive output lands in the camp stockpile.

    GOLEM_COST: { iron_ingot: 5, flame_essence: 2, coal: 5 },
    MAX_GOLEMS: 3,

    showIndustryPanel() {
        const b = this.ensure();
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;
        this.openPanel();

        let html = '<h3>Industry</h3>';
        html += '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:0.8rem">The camp works while you wander. Daily output collects in the stockpile.</p>';

        // ── Irrigation ──
        html += '<div class="industry-card">';
        html += `<div class="industry-card-header"><span class="industry-icon">💧</span><span class="industry-name">Irrigation Network</span>`;
        html += b.buildings.irrigation_network
            ? '<span class="industry-status on">RUNNING</span>'
            : '<span class="industry-status off">NOT BUILT</span>';
        html += '</div>';
        html += `<div class="industry-desc">${b.buildings.irrigation_network
            ? 'Channels feed every plot. Your crops never dry out.'
            : 'Unlocks at Tech Tier 2. Build it to water all plots automatically, forever.'}</div>`;
        html += '</div>';

        // ── Golems ──
        html += '<div class="industry-card">';
        html += `<div class="industry-card-header"><span class="industry-icon">🗿</span><span class="industry-name">Cinder Golems</span>`;
        if (b.buildings.golem_foundry) {
            html += `<span class="industry-status ${b.automation.golems > 0 ? 'on' : 'off'}">${b.automation.golems}/${this.MAX_GOLEMS} ACTIVE</span>`;
        } else {
            html += '<span class="industry-status off">FOUNDRY NOT BUILT</span>';
        }
        html += '</div>';
        if (b.buildings.golem_foundry) {
            const mineDepth = Math.min(b.mine.maxDepth || 1, 12);
            html += `<div class="industry-desc">Each golem mines the depths daily (working at level ${mineDepth} — limited by your deepest reach, cap 12).</div>`;
            if (b.automation.golems < this.MAX_GOLEMS) {
                const canForge = typeof Base !== 'undefined' && Base.canAfford(this.GOLEM_COST);
                html += '<div class="craft-cost">';
                for (const [res, qty] of Object.entries(this.GOLEM_COST)) {
                    const have = GameState.getInventoryCount(res);
                    const item = ITEMS[res];
                    html += `<span class="cost-item ${have >= qty ? 'have' : 'need'}">${item ? item.icon : ''} ${have}/${qty}</span>`;
                }
                html += '</div>';
                if (canForge) {
                    html += `<button class="action-btn primary" onclick="Homestead.forgeGolem()">Forge Cinder Golem</button>`;
                }
            }
        } else {
            html += '<div class="industry-desc">Unlocks at Tech Tier 3. Forge tireless miners of ember and iron.</div>';
        }
        html += '</div>';

        // ── Harvest Sprites ──
        html += '<div class="industry-card">';
        html += `<div class="industry-card-header"><span class="industry-icon">🧚</span><span class="industry-name">Harvest Sprites</span>`;
        html += b.buildings.sprite_totem
            ? '<span class="industry-status on">BOUND</span>'
            : '<span class="industry-status off">TOTEM NOT BUILT</span>';
        html += '</div>';
        html += `<div class="industry-desc">${b.buildings.sprite_totem
            ? 'Sprites reap every mature crop each day and replant the same seed when supplies allow.'
            : 'Unlocks at Tech Tier 4. Void-bound sprites tend the fields entirely on their own.'}</div>`;
        html += '</div>';

        // ── Stockpile ──
        const entries = Object.entries(b.automation.stockpile).filter(([, q]) => q > 0);
        html += '<div class="industry-card">';
        html += `<div class="industry-card-header"><span class="industry-icon">📦</span><span class="industry-name">Camp Stockpile</span></div>`;
        if (entries.length > 0) {
            html += '<div class="stockpile-grid">';
            entries.forEach(([key, qty]) => {
                const item = ITEMS[key];
                html += `<span class="mine-loot-chip">${item ? item.icon : ''} ${item ? item.name : key} ×${qty}</span>`;
            });
            html += '</div>';
            html += `<button class="action-btn primary" onclick="Homestead.collectStockpile()" style="margin-top:0.5rem">Collect All</button>`;
        } else {
            html += '<div class="industry-desc">Empty. Passive production and overflow are deposited here.</div>';
        }
        html += '</div>';

        html += `<button class="action-btn" onclick="Game.closePanel()" style="margin-top:0.8rem">Close</button>`;
        panel.innerHTML = html;
    },

    forgeGolem() {
        const b = this.ensure();
        if (!b.buildings.golem_foundry || b.automation.golems >= this.MAX_GOLEMS) return;
        if (typeof Base === 'undefined' || !Base.canAfford(this.GOLEM_COST)) {
            Notifications.show('Not enough materials!', 'red');
            return;
        }
        for (const [res, qty] of Object.entries(this.GOLEM_COST)) {
            GameState.removeFromInventory(res, qty);
        }
        b.automation.golems++;
        Narrative.addSeparator();
        Narrative.addStory('Ember light kindles behind stone eyes. The Cinder Golem shoulders its pick and trudges toward the shaft.');
        Notifications.show('Cinder Golem forged!', 'gold');
        if (typeof Audio !== 'undefined') Audio.playCraft();
        HUD.update();
        GameState.save();
        this.showIndustryPanel();
    },

    collectStockpile() {
        const b = this.ensure();
        let collected = 0;
        let blocked = false;
        for (const [key, qty] of Object.entries(b.automation.stockpile)) {
            if (qty <= 0) continue;
            if (GameState.addToInventory(key, qty)) {
                collected += qty;
                b.automation.stockpile[key] = 0;
            } else {
                blocked = true;
            }
        }
        // Prune zeroes
        for (const key of Object.keys(b.automation.stockpile)) {
            if (b.automation.stockpile[key] <= 0) delete b.automation.stockpile[key];
        }
        if (collected > 0) Notifications.show(`Collected ${collected} items from the stockpile.`, 'gold');
        if (blocked) Notifications.show('Inventory full — some items remain stockpiled.', 'red');
        HUD.update();
        GameState.save();
        this.showIndustryPanel();
    },

    // ── Daily processing (hooked into GameState.advanceDay) ──
    processDay() {
        const b = this.ensure();
        const today = this.day();

        // 1. Plots dry out overnight — unless irrigated
        if (!b.buildings.irrigation_network) {
            b.plots.forEach(p => { p.watered = false; });
        } else {
            b.plots.forEach(p => { p.watered = true; });
        }

        // 2. Saplings mature into trees after 3 days
        let grewTree = false;
        for (const [key, t] of Object.entries(b.terraform)) {
            if (t.ch === 't' && today - (t.day || 0) >= 3) {
                t.ch = 'T';
                grewTree = true;
                if (typeof WorldMap !== 'undefined' && WorldMap.currentMap === 'player_camp') {
                    const [x, y] = key.split(',').map(Number);
                    if (WorldMap.terrain[y]) WorldMap.terrain[y][x] = 'T';
                }
            }
        }
        if (grewTree) Notifications.show('🌳 A planted sapling has grown into a tree!', 'green');

        // 3. Cinder Golems mine the depths
        if (b.automation.golems > 0 && b.buildings.golem_foundry) {
            const depth = Math.max(1, Math.min(b.mine.maxDepth || 1, 12));
            let hauled = 0;
            for (let g = 0; g < b.automation.golems; g++) {
                const rolls = 2 + (Math.random() < 0.5 ? 1 : 0);
                for (let r = 0; r < rolls; r++) {
                    const ore = this.rollOre(depth, 2);
                    const qty = 1 + Math.floor(Math.random() * 2);
                    this.addToStockpile(ore, qty);
                    hauled += qty;
                }
                if (depth >= 6 && Math.random() < 0.15) {
                    const gems = ['gem_ruby', 'gem_sapphire', 'gem_emerald', 'gem_amethyst'];
                    this.addToStockpile(gems[Math.floor(Math.random() * gems.length)], 1);
                    hauled += 1;
                }
            }
            b.mine.totalMined += hauled;
        }

        // 4. Harvest sprites reap mature crops & replant
        if (b.buildings.sprite_totem) {
            b.plots.forEach((plot, idx) => {
                if (!plot.crop) return;
                const cropDef = CROPS[plot.crop];
                if (!cropDef || plot.growth < cropDef.growthTurns) return;
                const cropId = plot.crop;
                const qty = this.harvest(idx, { silent: true });
                if (qty) {
                    // Replant the same seed if the camp can afford it
                    if (typeof Base !== 'undefined' && Base.canAffordRecipe(cropDef.seedCost)) {
                        for (const [res, q] of Object.entries(cropDef.seedCost)) {
                            GameState.removeFromInventory(res, q);
                        }
                        plot.crop = cropId;
                        plot.growth = 0;
                    }
                }
            });
        }
    }
};
