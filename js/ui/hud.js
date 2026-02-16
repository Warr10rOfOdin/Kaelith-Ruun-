// ============================================
// HUD MANAGER
// ============================================

const HUD = {
    update() {
        const p = GameState.player;
        if (!p) return;

        // Name and level
        document.getElementById('hud-name').textContent = p.name;
        document.getElementById('hud-level').textContent = `Lv.${p.level}`;

        // HP bar
        const hpPercent = (p.hp / p.maxHp) * 100;
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('hp-text').textContent = `HP ${p.hp}/${p.maxHp}`;

        // MP bar
        const mpPercent = (p.mp / p.maxMp) * 100;
        document.getElementById('mp-bar').style.width = `${mpPercent}%`;
        document.getElementById('mp-text').textContent = `MP ${p.mp}/${p.maxMp}`;

        // XP bar
        const xpPercent = (p.xp / p.xpToNext) * 100;
        document.getElementById('xp-bar').style.width = `${xpPercent}%`;
        document.getElementById('xp-text').textContent = `XP ${p.xp}/${p.xpToNext}`;

        // Gold
        document.getElementById('hud-gold').textContent = `Gold: ${p.gold}`;

        // Location
        const location = WORLD.locations[GameState.currentLocation];
        if (location) {
            document.getElementById('hud-location').textContent = location.name;
        }
    }
};
