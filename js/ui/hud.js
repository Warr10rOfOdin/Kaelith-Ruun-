// ============================================
// HUD MANAGER
// ============================================

const HUD = {
    _minimapDirty: true,

    update() {
        const p = GameState.player;
        if (!p) return;

        // Name and level
        const hudName = document.getElementById('hud-name');
        const hudLevel = document.getElementById('hud-level');
        if (hudName) hudName.textContent = p.name;
        if (hudLevel) hudLevel.textContent = `Lv.${p.level}`;

        // HP bar — guard against division by zero, clamp 0-100%
        const hpPercent = p.maxHp > 0 ? Math.min(100, Math.max(0, (p.hp / p.maxHp) * 100)) : 0;
        const hpBar = document.getElementById('hp-bar');
        const hpText = document.getElementById('hp-text');
        if (hpBar) hpBar.style.width = `${hpPercent}%`;
        if (hpText) hpText.textContent = `HP ${p.hp}/${p.maxHp}`;

        // MP bar
        const mpPercent = p.maxMp > 0 ? Math.min(100, Math.max(0, (p.mp / p.maxMp) * 100)) : 0;
        const mpBar = document.getElementById('mp-bar');
        const mpText = document.getElementById('mp-text');
        if (mpBar) mpBar.style.width = `${mpPercent}%`;
        if (mpText) mpText.textContent = `MP ${p.mp}/${p.maxMp}`;

        // XP bar
        const xpPercent = p.xpToNext > 0 ? Math.min(100, Math.max(0, (p.xp / p.xpToNext) * 100)) : 0;
        const xpBar = document.getElementById('xp-bar');
        const xpText = document.getElementById('xp-text');
        if (xpBar) xpBar.style.width = `${xpPercent}%`;
        if (xpText) xpText.textContent = `XP ${p.xp}/${p.xpToNext}`;

        // Gold
        const hudGold = document.getElementById('hud-gold');
        if (hudGold) hudGold.textContent = `Gold: ${p.gold}`;

        // Stamina bar (updates frequently via game loop)
        if (typeof WorldMap !== 'undefined') {
            const stPercent = WorldMap.maxStamina > 0
                ? Math.min(100, Math.max(0, (WorldMap.stamina / WorldMap.maxStamina) * 100)) : 100;
            const stBar = document.getElementById('stamina-bar');
            const stText = document.getElementById('stamina-text');
            if (stBar) stBar.style.width = `${stPercent}%`;
            if (stText) stText.textContent = `STA ${Math.floor(WorldMap.stamina)}/${WorldMap.maxStamina}`;
        }

        // Location and time of day
        const location = WORLD.locations[GameState.currentLocation];
        const hudLocation = document.getElementById('hud-location');
        if (hudLocation && location) {
            const timeLabel = (typeof WorldMap !== 'undefined' && WorldMap.getTimeLabel)
                ? WorldMap.getTimeLabel() : '';
            const weatherLabel = (typeof WorldMap !== 'undefined' && WorldMap.weather && WorldMap.weather !== 'clear')
                ? ' | ' + WorldMap.weather.charAt(0).toUpperCase() + WorldMap.weather.slice(1) : '';
            hudLocation.textContent = timeLabel
                ? `${location.name} — ${timeLabel}${weatherLabel}`
                : location.name;
        }

        // Status icons
        this.updateStatusIcons();

        // Mark minimap dirty
        this._minimapDirty = true;
    },

    // Fast update for stamina only (called from game loop)
    updateStamina() {
        if (typeof WorldMap === 'undefined') return;
        const stPercent = WorldMap.maxStamina > 0
            ? Math.min(100, Math.max(0, (WorldMap.stamina / WorldMap.maxStamina) * 100)) : 100;
        const stBar = document.getElementById('stamina-bar');
        const stText = document.getElementById('stamina-text');
        if (stBar) stBar.style.width = `${stPercent}%`;
        if (stText) stText.textContent = `STA ${Math.floor(WorldMap.stamina)}/${WorldMap.maxStamina}`;

        // Update minimap periodically (every ~10 frames)
        if (this._minimapDirty || Math.random() < 0.1) {
            this.drawMinimap();
            this._minimapDirty = false;
        }
    },

    // ---- STATUS ICONS ----
    updateStatusIcons() {
        const container = document.getElementById('hud-status-icons');
        if (!container) return;

        const p = GameState.player;
        if (!p) { container.innerHTML = ''; return; }

        let html = '';

        // Active buffs (combat buffs are temporary, but show enchantments)
        if (p.enchantments) {
            for (const [slot, ench] of Object.entries(p.enchantments)) {
                if (ench) {
                    const statIcons = { attack: '⚔️', magicAttack: '🔮', defense: '🛡️', magicDefense: '💎' };
                    html += `<span class="status-icon enchant">${statIcons[ench.stat] || '✨'} +${ench.amount}</span>`;
                }
            }
        }

        // Active status effects (poison, etc.)
        if (p.statusEffects && p.statusEffects.length > 0) {
            for (const se of p.statusEffects) {
                if (se.type === 'poison') {
                    html += `<span class="status-icon debuff">☠️ Poison (${se.duration})</span>`;
                }
            }
        }

        // Show equipped tool type
        if (p.equipment && p.equipment.weapon) {
            const weapon = ITEMS[p.equipment.weapon];
            if (weapon && weapon.toolType) {
                const toolIcons = { axe: '🪓', pickaxe: '⛏️', sickle: '🌾', hammer: '🔨', fishing: '🎣' };
                html += `<span class="status-icon buff">${toolIcons[weapon.toolType] || '🔧'} T${weapon.toolTier || 1}</span>`;
            }
        }

        container.innerHTML = html;
    },

    // ---- MINIMAP ----
    drawMinimap() {
        const canvas = document.getElementById('hud-minimap');
        if (!canvas || typeof WorldMap === 'undefined' || !WorldMap.terrain) return;
        if (GameState.currentScreen !== 'game') return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Clear
        ctx.fillStyle = 'rgba(10,10,15,0.9)';
        ctx.fillRect(0, 0, w, h);

        const terrain = WorldMap.terrain;
        const mapH = terrain.length;
        const mapW = terrain[0] ? terrain[0].length : 0;
        if (mapW === 0 || mapH === 0) return;

        // Calculate scale so entire map fits
        const scaleX = w / mapW;
        const scaleY = h / mapH;
        const scale = Math.min(scaleX, scaleY, 3); // Cap at 3px per tile

        // Center the map
        const offsetX = (w - mapW * scale) / 2;
        const offsetY = (h - mapH * scale) / 2;

        // Minimap tile colors
        const tileColors = {
            '.': '#2a3a2a', 'p': '#4a3a2a', '#': '#3a3a3a',
            'T': '#1a4a1a', 'P': '#1a4a1a', 'K': '#3a2a1a',
            'R': '#5a5a5a', 'I': '#5a4a3a', '~': '#1a3a6a',
            'E': '#5a3a1a', 'V': '#4a2a6a', 'S': '#3a3a4a',
            'H': '#2a5a2a', 'B': '#4a4a3a', 'F': '#6a4a1a',
            'f': '#4a3a2a', 'D': '#5a4a3a', 'G': '#3a2a1a',
            'b': '#5a4a2a', 'g': '#3a5a2a', 'h': '#4a6a3a',
            'O': '#2a4a6a', 'w': '#5a4a5a', 'M': '#3a2a3a',
            'W': '#5a5a1a', 'c': '#2a2a2a', 'L': '#5a5a2a',
            'X': '#4a4a3a', 'A': '#5a4a6a', 'Y': '#5a4a3a',
            'Z': '#6a5a3a', 'Q': '#4a3a5a', 'N': '#6a2a2a',
            'J': '#6a6a5a', 'U': '#4a3a2a',
        };

        // Draw tiles
        for (let ty = 0; ty < mapH; ty++) {
            for (let tx = 0; tx < mapW; tx++) {
                const ch = WorldMap.getTerrainChar(tx, ty);
                ctx.fillStyle = tileColors[ch] || '#2a2a2a';
                ctx.fillRect(
                    Math.floor(offsetX + tx * scale),
                    Math.floor(offsetY + ty * scale),
                    Math.ceil(scale), Math.ceil(scale)
                );
            }
        }

        // Draw entities as colored dots
        for (const key in WorldMap.entityMap) {
            const entity = WorldMap.entityMap[key];
            const [ex, ey] = key.split(',').map(Number);
            const sx = Math.floor(offsetX + ex * scale);
            const sy = Math.floor(offsetY + ey * scale);
            const dotSize = Math.max(2, Math.ceil(scale));

            switch (entity.type) {
                case 'npc': ctx.fillStyle = '#44aa55'; break;
                case 'enemy_spawn': ctx.fillStyle = '#aa4444'; break;
                case 'boss': ctx.fillStyle = '#cc4444'; break;
                case 'chest': ctx.fillStyle = '#ccaa44'; break;
                case 'campfire': ctx.fillStyle = '#cc8833'; break;
                default: ctx.fillStyle = '#888888';
            }
            ctx.fillRect(sx, sy, dotSize, dotSize);
        }

        // Draw player as bright dot
        const playerTX = Math.floor(WorldMap.px / WorldMap.TS);
        const playerTY = Math.floor(WorldMap.py / WorldMap.TS);
        const px = Math.floor(offsetX + playerTX * scale);
        const py = Math.floor(offsetY + playerTY * scale);
        const playerSize = Math.max(3, Math.ceil(scale * 1.5));

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 1, py - 1, playerSize, playerSize);

        // Border
        ctx.strokeStyle = 'rgba(201,168,76,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);
    }
};
