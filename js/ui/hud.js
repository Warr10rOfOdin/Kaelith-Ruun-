// ============================================
// HUD MANAGER
// ============================================

const HUD = {
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
    }
};
