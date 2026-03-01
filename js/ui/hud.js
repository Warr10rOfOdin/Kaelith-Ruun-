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

        // Biome-aware background color
        const bgColors = {
            ashen_wastes: 'rgba(20,15,8,0.92)',
            hollowfen: 'rgba(8,18,20,0.92)',
            void_sanctum: 'rgba(15,8,20,0.92)'
        };
        ctx.fillStyle = bgColors[GameState.currentRegion] || 'rgba(10,10,15,0.92)';
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

        // Biome-adjusted minimap tile colors
        const region = GameState.currentRegion;
        const tileColors = this._getMinimapColors(region);

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

        // Draw viewport rectangle (what the player can see)
        const Z = WorldMap.zoom || 1;
        const vpW = WorldMap.vpW / (Z * WorldMap.TS);
        const vpH = WorldMap.vpH / (Z * WorldMap.TS);
        const vpTX = WorldMap.camX / WorldMap.TS;
        const vpTY = WorldMap.camY / WorldMap.TS;
        ctx.strokeStyle = 'rgba(200,180,120,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            Math.floor(offsetX + vpTX * scale),
            Math.floor(offsetY + vpTY * scale),
            Math.ceil(vpW * scale),
            Math.ceil(vpH * scale)
        );

        // Draw entities as colored dots with glow
        for (const key in WorldMap.entityMap) {
            const entity = WorldMap.entityMap[key];
            const [ex, ey] = key.split(',').map(Number);
            const sx = Math.floor(offsetX + ex * scale);
            const sy = Math.floor(offsetY + ey * scale);
            const dotSize = Math.max(2, Math.ceil(scale));

            switch (entity.type) {
                case 'npc':
                    ctx.fillStyle = 'rgba(60,180,80,0.3)';
                    ctx.fillRect(sx - 1, sy - 1, dotSize + 2, dotSize + 2);
                    ctx.fillStyle = '#44cc55';
                    break;
                case 'enemy_spawn':
                    ctx.fillStyle = 'rgba(180,50,50,0.25)';
                    ctx.fillRect(sx - 1, sy - 1, dotSize + 2, dotSize + 2);
                    ctx.fillStyle = '#cc4444';
                    break;
                case 'boss':
                    ctx.fillStyle = 'rgba(220,60,60,0.3)';
                    ctx.fillRect(sx - 1, sy - 1, dotSize + 2, dotSize + 2);
                    ctx.fillStyle = '#ff4444';
                    break;
                case 'chest':
                    ctx.fillStyle = 'rgba(200,180,60,0.3)';
                    ctx.fillRect(sx - 1, sy - 1, dotSize + 2, dotSize + 2);
                    ctx.fillStyle = '#ddbb44';
                    break;
                case 'campfire':
                    ctx.fillStyle = 'rgba(200,130,40,0.3)';
                    ctx.fillRect(sx - 1, sy - 1, dotSize + 2, dotSize + 2);
                    ctx.fillStyle = '#ee9933';
                    break;
                default: ctx.fillStyle = '#888888';
            }
            ctx.fillRect(sx, sy, dotSize, dotSize);
        }

        // Draw player as pulsing bright dot
        const playerTX = Math.floor(WorldMap.px / WorldMap.TS);
        const playerTY = Math.floor(WorldMap.py / WorldMap.TS);
        const px = Math.floor(offsetX + playerTX * scale);
        const py = Math.floor(offsetY + playerTY * scale);
        const playerSize = Math.max(3, Math.ceil(scale * 1.5));
        const pulse = 0.7 + Math.sin(Date.now() * 0.003) * 0.3;

        // Player glow
        ctx.fillStyle = `rgba(255,255,255,${(0.15 * pulse).toFixed(2)})`;
        ctx.fillRect(px - 2, py - 2, playerSize + 3, playerSize + 3);
        // Player dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 1, py - 1, playerSize, playerSize);

        // Border with biome-tinted color
        const borderColors = {
            ashen_wastes: 'rgba(201,148,56,0.35)',
            hollowfen: 'rgba(80,160,140,0.35)',
            void_sanctum: 'rgba(160,80,200,0.35)'
        };
        ctx.strokeStyle = borderColors[region] || 'rgba(201,168,76,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, w, h);
    },

    // Biome-specific minimap color palettes
    _getMinimapColors(region) {
        const base = {
            'p': '#4a3a2a', '#': '#3a3a3a', 'R': '#5a5a5a', 'I': '#5a4a3a',
            'E': '#5a3a1a', 'V': '#4a2a6a', 'S': '#3a3a4a', 'H': '#2a5a2a',
            'B': '#4a4a3a', 'F': '#6a4a1a', 'f': '#4a3a2a', 'D': '#5a4a3a',
            'b': '#5a4a2a', 'O': '#2a4a6a', 'M': '#3a2a3a', 'W': '#5a5a1a',
            'c': '#2a2a2a', 'L': '#5a5a2a', 'X': '#4a4a3a', 'A': '#5a4a6a',
            'Y': '#5a4a3a', 'Z': '#6a5a3a', 'Q': '#4a3a5a', 'N': '#6a2a2a',
            'J': '#6a6a5a', 'U': '#4a3a2a', 'G': '#3a2a1a',
        };

        if (region === 'hollowfen') {
            return Object.assign(base, {
                '.': '#1a2a25', 'T': '#1a3a1a', 'P': '#1a3a1a', 'K': '#2a2a1a',
                '~': '#1a3050', 'g': '#1a3a20', 'h': '#2a4a2a', 'w': '#3a3a4a',
            });
        } else if (region === 'void_sanctum') {
            return Object.assign(base, {
                '.': '#1a1520', 'T': '#1a2a1a', 'P': '#1a2a1a', 'K': '#2a1a2a',
                '~': '#1a2040', 'g': '#2a1a2a', 'h': '#2a2a3a', 'w': '#3a2a4a',
            });
        } else {
            return Object.assign(base, {
                '.': '#2a3a2a', 'T': '#1a4a1a', 'P': '#1a4a1a', 'K': '#3a2a1a',
                '~': '#1a3a6a', 'g': '#3a5a2a', 'h': '#4a6a3a', 'w': '#5a4a5a',
            });
        }
    }
};
