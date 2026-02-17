// ============================================
// MAP RENDERER — Visual World Map
// ============================================

const MapUI = {
    // Node positions for the visual map (relative to canvas size)
    regionNodes: {
        ashen_wastes: { rx: 0.25, ry: 0.25, color: '#aa6a30' },
        hollowfen:    { rx: 0.55, ry: 0.50, color: '#3a7a5a' },
        void_sanctum: { rx: 0.75, ry: 0.20, color: '#7a3aaa' }
    },

    locationNodes: {
        // Ashen Wastes
        ruined_outpost:   { rx: 0.15, ry: 0.12 },
        scorched_village: { rx: 0.20, ry: 0.28 },
        emberhold:        { rx: 0.28, ry: 0.42 },
        player_camp:      { rx: 0.38, ry: 0.30 },
        ashen_throne:     { rx: 0.32, ry: 0.55 },
        // Hollowfen
        sunken_chapel:    { rx: 0.48, ry: 0.35 },
        stilthaven:       { rx: 0.55, ry: 0.50 },
        witchs_hut:       { rx: 0.52, ry: 0.65 },
        heart_of_the_fen: { rx: 0.60, ry: 0.78 },
        // Void Sanctum
        outer_gate:          { rx: 0.70, ry: 0.15 },
        last_vigil:          { rx: 0.78, ry: 0.28 },
        hall_of_echoes:      { rx: 0.82, ry: 0.42 },
        throne_of_unmaking:  { rx: 0.88, ry: 0.55 }
    },

    // Connections between locations
    connections: [
        ['ruined_outpost', 'scorched_village'],
        ['scorched_village', 'emberhold'],
        ['scorched_village', 'player_camp'],
        ['emberhold', 'ashen_throne'],
        // Ashen → Hollowfen transition
        ['ashen_throne', 'sunken_chapel'],
        ['sunken_chapel', 'stilthaven'],
        ['stilthaven', 'witchs_hut'],
        ['witchs_hut', 'heart_of_the_fen'],
        // Hollowfen → Void transition
        ['heart_of_the_fen', 'outer_gate'],
        ['outer_gate', 'last_vigil'],
        ['last_vigil', 'hall_of_echoes'],
        ['hall_of_echoes', 'throne_of_unmaking']
    ],

    render() {
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;

        panel.innerHTML = `
            <h3 style="margin:0 0 0.5rem 0;color:var(--accent-gold)">World Map</h3>
            <canvas id="world-map-canvas" style="width:100%;border-radius:8px;background:#0a0a0f;cursor:pointer"></canvas>
            <div id="map-info" style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-secondary);min-height:2.5rem"></div>
            <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap">
                <span style="font-size:0.7rem;color:#aa6a30">● Ashen Wastes</span>
                <span style="font-size:0.7rem;color:#3a7a5a">● Hollowfen</span>
                <span style="font-size:0.7rem;color:#7a3aaa">● Void Sanctum</span>
            </div>
        `;

        const canvas = document.getElementById('world-map-canvas');
        if (!canvas) return;

        // Size canvas to container
        const cw = panel.clientWidth - 16;
        const ch = Math.min(cw * 0.75, 400);
        canvas.width = cw * 2;   // 2x for retina
        canvas.height = ch * 2;
        canvas.style.height = ch + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);

        this.drawMap(ctx, cw, ch);

        // Click handler for travel
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width;
            const my = (e.clientY - rect.top) / rect.height;
            this.handleClick(mx, my, cw, ch);
        };
    },

    drawMap(ctx, w, h) {
        // Parchment-style background
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, '#1a1814');
        bg.addColorStop(0.3, '#1e1c16');
        bg.addColorStop(0.6, '#1c1a14');
        bg.addColorStop(1, '#181610');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Parchment texture noise
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(${150 + Math.random() * 40},${130 + Math.random() * 40},${90 + Math.random() * 30},${0.02 + Math.random() * 0.03})`;
            ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1 + Math.random() * 3);
        }

        // Subtle compass lines
        ctx.strokeStyle = 'rgba(200,180,120,0.04)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Border frame
        ctx.strokeStyle = 'rgba(200,180,120,0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.strokeStyle = 'rgba(200,180,120,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        // Region background zones with terrain texture
        for (const [rk, rn] of Object.entries(this.regionNodes)) {
            const region = WORLD.regions[rk];
            if (!region) continue;
            const x = rn.rx * w, y = rn.ry * h;
            // Larger, more visible region glow
            const grd = ctx.createRadialGradient(x, y, 15, x, y, w * 0.25);
            grd.addColorStop(0, this._alpha(rn.color, region.unlocked ? 0.2 : 0.06));
            grd.addColorStop(0.5, this._alpha(rn.color, region.unlocked ? 0.08 : 0.02));
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, w, h);
        }

        // Region name labels (background text)
        const regionLabels = {
            ashen_wastes: { name: 'Ashen Wastes', rx: 0.25, ry: 0.18 },
            hollowfen: { name: 'Hollowfen', rx: 0.55, ry: 0.42 },
            void_sanctum: { name: 'Void Sanctum', rx: 0.75, ry: 0.12 }
        };
        for (const [rk, rl] of Object.entries(regionLabels)) {
            const region = WORLD.regions[rk];
            if (!region) continue;
            const rn = this.regionNodes[rk];
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = region.unlocked ? this._alpha(rn.color, 0.5) : 'rgba(100,100,100,0.2)';
            ctx.fillText(rl.name.toUpperCase(), rl.rx * w, rl.ry * h);
        }

        // Draw connections as curved paths
        for (const [a, b] of this.connections) {
            const na = this.locationNodes[a];
            const nb = this.locationNodes[b];
            if (!na || !nb) continue;

            const aRegion = this._getRegion(a);
            const bRegion = this._getRegion(b);
            const aUnlocked = WORLD.regions[aRegion] && WORLD.regions[aRegion].unlocked;
            const bUnlocked = WORLD.regions[bRegion] && WORLD.regions[bRegion].unlocked;
            const visible = aUnlocked || bUnlocked;

            const ax = na.rx * w, ay = na.ry * h;
            const bx = nb.rx * w, by = nb.ry * h;
            // Slight curve for natural path look
            const mx = (ax + bx) / 2 + (by - ay) * 0.1;
            const my = (ay + by) / 2 - (bx - ax) * 0.1;

            ctx.strokeStyle = visible ? 'rgba(200,180,120,0.35)' : 'rgba(100,100,100,0.1)';
            ctx.lineWidth = visible ? 2 : 0.5;
            ctx.setLineDash(visible ? [4, 2] : [3, 5]);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.quadraticCurveTo(mx, my, bx, by);
            ctx.stroke();
            ctx.setLineDash([]);

            // Path dots along the route for unlocked paths
            if (visible) {
                const dots = 5;
                ctx.fillStyle = 'rgba(200,180,120,0.15)';
                for (let i = 1; i < dots; i++) {
                    const t = i / dots;
                    const dx = (1-t)*(1-t)*ax + 2*(1-t)*t*mx + t*t*bx;
                    const dy = (1-t)*(1-t)*ay + 2*(1-t)*t*my + t*t*by;
                    ctx.beginPath();
                    ctx.arc(dx, dy, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw location nodes
        for (const [locKey, node] of Object.entries(this.locationNodes)) {
            const loc = WORLD.locations[locKey];
            if (!loc) continue;

            const regionKey = this._getRegion(locKey);
            const region = WORLD.regions[regionKey];
            const unlocked = region && region.unlocked;
            const visited = GameState.visitedLocations.includes(locKey);
            const isCurrent = locKey === GameState.currentLocation;
            const regionNode = this.regionNodes[regionKey];
            const nodeColor = regionNode ? regionNode.color : '#888';

            const x = node.rx * w;
            const y = node.ry * h;

            if (!unlocked) {
                // Locked — dim dot
                ctx.fillStyle = 'rgba(80,80,80,0.3)';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                continue;
            }

            // Glow for current location
            if (isCurrent) {
                ctx.fillStyle = this._alpha(nodeColor, 0.3);
                ctx.beginPath();
                ctx.arc(x, y, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this._alpha(nodeColor, 0.15);
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.fill();
            }

            // Node circle
            const radius = isCurrent ? 8 : (visited ? 6 : 5);
            ctx.fillStyle = visited ? nodeColor : this._alpha(nodeColor, 0.5);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Outline
            ctx.strokeStyle = isCurrent ? '#fff' : (visited ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)');
            ctx.lineWidth = isCurrent ? 2 : 1;
            ctx.stroke();

            // Inner highlight
            if (visited) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Label
            ctx.font = isCurrent ? 'bold 9px monospace' : '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = isCurrent ? '#fff' : (visited ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)');
            const label = loc.name.length > 16 ? loc.name.substring(0, 14) + '...' : loc.name;
            ctx.fillText(label, x, y + radius + 10);

            // Type icon
            if (loc.type === 'village') {
                ctx.fillText('🏘', x, y - radius - 4);
            } else if (loc.type === 'base') {
                ctx.fillText('⛺', x, y - radius - 4);
            } else if (isCurrent) {
                ctx.fillText('📍', x, y - radius - 4);
            }
        }

        // Player marker pulsing
        const curNode = this.locationNodes[GameState.currentLocation];
        if (curNode) {
            const px = curNode.rx * w;
            const py = curNode.ry * h;
            const pulse = 0.5 + Math.sin(Date.now() / 400) * 0.3;
            ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    handleClick(mx, my, w, h) {
        let closest = null;
        let closestDist = Infinity;

        for (const [locKey, node] of Object.entries(this.locationNodes)) {
            const dx = mx - node.rx;
            const dy = my - node.ry;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.06 && dist < closestDist) {
                closestDist = dist;
                closest = locKey;
            }
        }

        const info = document.getElementById('map-info');
        if (closest) {
            const loc = WORLD.locations[closest];
            const regionKey = this._getRegion(closest);
            const region = WORLD.regions[regionKey];

            if (!region || !region.unlocked) {
                if (info) info.innerHTML = `<span style="color:#888">🔒 ${region ? region.unlockCondition : 'Locked'}</span>`;
                return;
            }

            if (loc) {
                const visited = GameState.visitedLocations.includes(closest);
                const isCurrent = closest === GameState.currentLocation;
                if (info) {
                    info.innerHTML = `<strong style="color:var(--accent-gold)">${loc.name}</strong><br>` +
                        `<span>${visited ? loc.description.substring(0, 80) + '...' : '???'}</span>` +
                        (isCurrent ? '<br><span style="color:#5a9a5a">You are here</span>' :
                            `<br><button onclick="Exploration.travelTo('${closest}')" class="action-btn" style="margin-top:0.3rem;padding:0.3rem 0.8rem;font-size:0.8rem">Travel Here</button>`);
                }
            }
        }
    },

    _getRegion(locKey) {
        for (const [rk, region] of Object.entries(WORLD.regions)) {
            if (region.locations && region.locations.includes(locKey)) return rk;
        }
        return 'ashen_wastes';
    },

    _alpha(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a})`;
    }
};
