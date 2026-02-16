// ============================================
// MAP RENDERER
// ============================================

const MapUI = {
    render() {
        const panel = document.getElementById('side-panel-content');

        let html = '<h3>World Map</h3>';
        html += '<div class="world-map">';

        for (const [regionKey, region] of Object.entries(WORLD.regions)) {
            const isCurrent = regionKey === GameState.currentRegion;
            const isLocked = !region.unlocked;

            html += `<div class="world-location ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}" ${!isLocked ? `onclick="Exploration.travelToRegion('${regionKey}')"` : ''}>`;
            html += `<span class="loc-icon">${region.icon}</span>`;
            html += `<div class="loc-info">`;
            html += `<div class="loc-name">${region.name} ${isCurrent ? '(Here)' : ''}</div>`;
            html += `<div class="loc-desc">${region.description.substring(0, 80)}...</div>`;
            if (!isLocked) {
                html += `<div class="loc-level">Levels ${region.levelRange[0]}–${region.levelRange[1]}</div>`;
            } else {
                html += `<div class="loc-level">${region.unlockCondition || 'Locked'}</div>`;
            }
            html += `</div></div>`;
        }

        html += '</div>';

        // Current region locations
        const currentRegion = WORLD.regions[GameState.currentRegion];
        if (currentRegion) {
            html += `<p style="color:var(--accent-gold);margin-top:1rem;margin-bottom:0.5rem;font-family:var(--font-heading);font-size:0.9rem">${currentRegion.name} — Locations</p>`;

            currentRegion.locations.forEach(locKey => {
                const loc = WORLD.locations[locKey];
                if (!loc) return;
                const isCurrent = locKey === GameState.currentLocation;
                const visited = GameState.visitedLocations.includes(locKey);

                html += `<div class="world-location ${isCurrent ? 'current' : ''}" onclick="Exploration.travelTo('${locKey}')" style="padding:0.5rem 0.8rem">`;
                html += `<span class="loc-icon" style="font-size:1.2rem">${loc.icon}</span>`;
                html += `<div class="loc-info">`;
                html += `<div class="loc-name" style="font-size:0.85rem">${loc.name} ${isCurrent ? '(Here)' : ''}</div>`;
                html += `<div class="loc-desc" style="font-size:0.75rem">${visited ? loc.description.substring(0, 50) + '...' : '???'}</div>`;
                html += `</div></div>`;
            });
        }

        panel.innerHTML = html;
    }
};
