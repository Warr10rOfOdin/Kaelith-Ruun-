// ============================================
// WORLD GENERATOR — Procedural Terrain
// ============================================
// Generates large, natural-looking terrain for each zone
// using value noise so the world feels open and explorable.

const WorldGen = {
    // Value noise with smoothstep interpolation
    _noise(x, y, seed) {
        let n = Math.sin((x + seed) * 12.9898 + (y + seed) * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },

    smoothNoise(x, y, seed) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const a = this._noise(ix, iy, seed);
        const b = this._noise(ix + 1, iy, seed);
        const c = this._noise(ix, iy + 1, seed);
        const d = this._noise(ix + 1, iy + 1, seed);
        return a * (1 - sx) * (1 - sy) + b * sx * (1 - sy) + c * (1 - sx) * sy + d * sx * sy;
    },

    // Multi-octave fractal noise
    fbm(x, y, seed, octaves) {
        let val = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < (octaves || 4); i++) {
            val += amp * this.smoothNoise(x * freq, y * freq, seed + i * 31.7);
            amp *= 0.5;
            freq *= 2;
        }
        return val;
    },

    // ── Generate a full map ──────────────────

    generate(mapDef) {
        const w = mapDef.width;
        const h = mapDef.height;
        const seed = mapDef.seed || 0;
        const biome = mapDef.biome || 'ashen_wastes';

        // Initialize terrain grid
        const grid = [];
        for (let y = 0; y < h; y++) {
            grid[y] = new Array(w).fill('.');
        }

        // 1) Generate base terrain from noise
        this.generateBiomeTerrain(grid, w, h, seed, biome);

        // 2) Place natural borders (soft edges, not hard walls)
        this.generateBorders(grid, w, h, biome);

        // 3) Stamp structures (buildings, ruins, etc.)
        if (mapDef.structures) {
            mapDef.structures.forEach(s => this.stampStructure(grid, s, w, h));
        }

        // 4) Draw paths between key points
        if (mapDef.paths) {
            mapDef.paths.forEach(p => this.drawPath(grid, p.from, p.to, w, h));
        }

        // 5) Ensure player start and entity positions are clear
        if (mapDef.playerStart) {
            this.clearArea(grid, mapDef.playerStart.x, mapDef.playerStart.y, 2);
        }
        if (mapDef.entities) {
            mapDef.entities.forEach(e => {
                if (e.type === 'npc' || e.type === 'campfire') {
                    this.clearArea(grid, e.x, e.y, 1);
                }
            });
        }

        // 6) Place building spots for camps
        if (mapDef.buildingSpots) {
            mapDef.buildingSpots.forEach(bs => {
                if (bs.x < w && bs.y < h) {
                    grid[bs.y][bs.x] = 'B';
                    // Clear around it
                    this.clearArea(grid, bs.x, bs.y, 1);
                }
            });
        }

        // Convert to string array for MAPS compatibility
        return grid.map(row => row.join(''));
    },

    // ── Biome terrain generators ─────────────

    generateBiomeTerrain(grid, w, h, seed, biome) {
        const scale = 0.08; // terrain feature scale

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const elevation = this.fbm(x * scale, y * scale, seed, 4);
                const moisture = this.fbm(x * scale * 1.3, y * scale * 1.3, seed + 100, 3);
                const detail = this.fbm(x * scale * 3, y * scale * 3, seed + 200, 2);

                grid[y][x] = this.biomeTile(biome, elevation, moisture, detail, x, y, seed);
            }
        }
    },

    biomeTile(biome, elev, moist, detail, x, y, seed) {
        switch (biome) {
            case 'ashen_wastes': return this.ashenTile(elev, moist, detail);
            case 'ashen_wilderness': return this.ashenWildTile(elev, moist, detail);
            case 'hollowfen': return this.fenTile(elev, moist, detail);
            case 'fen_wilderness': return this.fenWildTile(elev, moist, detail);
            case 'void_sanctum': return this.voidTile(elev, moist, detail);
            case 'void_wilderness': return this.voidWildTile(elev, moist, detail);
            case 'village': return this.villageTile(elev, moist, detail);
            case 'camp': return this.campTile(elev, moist, detail);
            case 'boss_arena': return '.';
            default: return this.ashenTile(elev, moist, detail);
        }
    },

    // Ashen Wastes — dry, scattered trees, rocks, ember roots
    ashenTile(elev, moist, detail) {
        if (elev > 0.72) return 'T';           // tree clusters at high elevation
        if (elev > 0.68 && detail > 0.6) return 'T';
        if (elev < 0.2 && moist > 0.6) return 'R'; // rocky lowlands
        if (elev < 0.25 && moist > 0.7) return 'I'; // iron in deep rock
        if (detail > 0.82 && elev > 0.4) return 'E'; // ember root scattered
        if (detail > 0.85 && elev < 0.4) return 'R'; // occasional rock
        return '.';
    },

    ashenWildTile(elev, moist, detail) {
        if (elev > 0.7) return 'T';
        if (elev > 0.65 && detail > 0.55) return 'T';
        if (elev < 0.18) return 'R';
        if (elev < 0.22 && moist > 0.65) return 'I';
        if (detail > 0.8 && elev > 0.35) return 'E';
        if (detail > 0.78 && elev < 0.35) return 'R';
        if (detail > 0.88) return 'H';
        return '.';
    },

    // Hollowfen — swampy, water pools, mushrooms, herbs
    fenTile(elev, moist, detail) {
        if (elev < 0.22) return '~';            // water pools
        if (elev < 0.28 && moist > 0.5) return '~';
        if (elev > 0.7 && moist > 0.5) return 'T';
        if (elev > 0.65 && detail > 0.6) return 'T';
        if (detail > 0.82 && moist > 0.5) return 'M'; // mushrooms in wet areas
        if (detail > 0.8 && moist < 0.5) return 'H';  // herbs in drier spots
        if (detail > 0.88) return 'S';                  // shadow silk rare
        return '.';
    },

    fenWildTile(elev, moist, detail) {
        if (elev < 0.25) return '~';
        if (elev < 0.3 && moist > 0.45) return '~';
        if (elev > 0.68) return 'T';
        if (elev > 0.62 && detail > 0.5) return 'T';
        if (detail > 0.78 && moist > 0.5) return 'M';
        if (detail > 0.75 && moist < 0.5) return 'H';
        if (detail > 0.85) return 'S';
        return '.';
    },

    // Void Sanctum — dark, crystals, bones
    voidTile(elev, moist, detail) {
        if (elev > 0.75) return '#';             // stone formations
        if (elev > 0.7 && detail > 0.5) return '#';
        if (elev < 0.2) return 'R';
        if (detail > 0.82 && moist > 0.5) return 'V'; // veil crystals
        if (detail > 0.85 && moist < 0.5) return 'X'; // bones
        if (detail > 0.88) return 'S';                  // shadow silk
        return '.';
    },

    voidWildTile(elev, moist, detail) {
        if (elev > 0.72) return '#';
        if (elev > 0.67 && detail > 0.45) return '#';
        if (elev < 0.18) return 'R';
        if (detail > 0.78 && moist > 0.5) return 'V';
        if (detail > 0.8 && moist < 0.5) return 'X';
        if (detail > 0.85) return 'S';
        return '.';
    },

    // Village — mostly open with some trees
    villageTile(elev, moist, detail) {
        if (elev > 0.8) return 'T';
        if (detail > 0.9) return 'T';
        return '.';
    },

    // Camp — mostly open
    campTile(elev, moist, detail) {
        if (elev > 0.85) return 'T';
        return '.';
    },

    // ── Border generation ────────────────────

    generateBorders(grid, w, h, biome) {
        const borderTile = biome.includes('fen') ? '~' : (biome.includes('void') ? '#' : 'T');

        for (let x = 0; x < w; x++) {
            grid[0][x] = borderTile;
            grid[h - 1][x] = borderTile;
        }
        for (let y = 0; y < h; y++) {
            grid[y][0] = borderTile;
            grid[y][w - 1] = borderTile;
        }

        // Softer inner border — random trees/rocks along edges
        for (let x = 1; x < w - 1; x++) {
            if (Math.random() < 0.5) grid[1][x] = borderTile;
            if (Math.random() < 0.5) grid[h - 2][x] = borderTile;
        }
        for (let y = 1; y < h - 1; y++) {
            if (Math.random() < 0.5) grid[y][1] = borderTile;
            if (Math.random() < 0.5) grid[y][w - 2] = borderTile;
        }
    },

    // ── Structure stamps ─────────────────────

    stampStructure(grid, struct, mapW, mapH) {
        const { x, y, w, h, type } = struct;

        switch (type) {
            case 'ruin':
                this.stampRuin(grid, x, y, w, h, mapW, mapH);
                break;
            case 'building':
                this.stampBuilding(grid, x, y, w, h, mapW, mapH);
                break;
            case 'camp_fence':
                this.stampFence(grid, x, y, w, h, mapW, mapH);
                break;
            default:
                this.stampBuilding(grid, x, y, w, h, mapW, mapH);
        }
    },

    stampBuilding(grid, bx, by, bw, bh, mapW, mapH) {
        // Walls
        for (let y = by; y < by + bh && y < mapH; y++) {
            for (let x = bx; x < bx + bw && x < mapW; x++) {
                if (x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1) {
                    grid[y][x] = '#';
                } else {
                    grid[y][x] = '.';
                }
            }
        }
        // Door at bottom center
        const doorX = bx + Math.floor(bw / 2);
        if (doorX < mapW && by + bh - 1 < mapH) {
            grid[by + bh - 1][doorX] = 'D';
        }
    },

    stampRuin(grid, bx, by, bw, bh, mapW, mapH) {
        // Partial walls with gaps
        for (let y = by; y < by + bh && y < mapH; y++) {
            for (let x = bx; x < bx + bw && x < mapW; x++) {
                const isEdge = x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1;
                if (isEdge) {
                    grid[y][x] = Math.random() < 0.6 ? '#' : '.';
                } else {
                    grid[y][x] = Math.random() < 0.1 ? 'X' : '.';
                }
            }
        }
        // Door
        const doorX = bx + Math.floor(bw / 2);
        if (doorX < mapW && by + bh - 1 < mapH) {
            grid[by + bh - 1][doorX] = 'D';
        }
    },

    stampFence(grid, bx, by, bw, bh, mapW, mapH) {
        for (let y = by; y < by + bh && y < mapH; y++) {
            for (let x = bx; x < bx + bw && x < mapW; x++) {
                const isEdge = x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1;
                if (isEdge) {
                    grid[y][x] = 'f';
                } else {
                    grid[y][x] = '.';
                }
            }
        }
    },

    // ── Path drawing ─────────────────────────

    drawPath(grid, from, to, mapW, mapH) {
        let x = from.x, y = from.y;
        const tx = to.x, ty = to.y;

        // L-shaped path: horizontal first, then vertical
        while (x !== tx) {
            if (x >= 0 && x < mapW && y >= 0 && y < mapH) {
                if (grid[y][x] === '.' || grid[y][x] === 'T' || grid[y][x] === 'R') {
                    grid[y][x] = 'p';
                }
                // Widen the path
                if (y + 1 < mapH && (grid[y + 1][x] === '.' || grid[y + 1][x] === 'T' || grid[y + 1][x] === 'R')) {
                    grid[y + 1][x] = 'p';
                }
            }
            x += x < tx ? 1 : -1;
        }
        while (y !== ty) {
            if (x >= 0 && x < mapW && y >= 0 && y < mapH) {
                if (grid[y][x] === '.' || grid[y][x] === 'T' || grid[y][x] === 'R') {
                    grid[y][x] = 'p';
                }
                if (x + 1 < mapW && (grid[y][x + 1] === '.' || grid[y][x + 1] === 'T' || grid[y][x + 1] === 'R')) {
                    grid[y][x + 1] = 'p';
                }
            }
            y += y < ty ? 1 : -1;
        }
    },

    // ── Exit corridors ───────────────────────
    // Open up the border at exit points

    openExit(terrain, exit, direction, w, h) {
        const ex = exit.entryX !== undefined ? exit.entryX : Math.floor(w / 2);
        const ey = exit.entryY !== undefined ? exit.entryY : Math.floor(h / 2);

        const rows = terrain.map(r => r.split(''));
        const clearW = 4; // width of opening

        switch (direction) {
            case 'north':
                for (let dx = -clearW; dx <= clearW; dx++) {
                    const xx = ex + dx;
                    if (xx >= 0 && xx < w) {
                        rows[0][xx] = 'p';
                        rows[1][xx] = 'p';
                    }
                }
                break;
            case 'south':
                for (let dx = -clearW; dx <= clearW; dx++) {
                    const xx = ex + dx;
                    if (xx >= 0 && xx < w) {
                        rows[h - 1][xx] = 'p';
                        rows[h - 2][xx] = 'p';
                    }
                }
                break;
            case 'west':
                for (let dy = -clearW; dy <= clearW; dy++) {
                    const yy = ey + dy;
                    if (yy >= 0 && yy < h) {
                        rows[yy][0] = 'p';
                        rows[yy][1] = 'p';
                    }
                }
                break;
            case 'east':
                for (let dy = -clearW; dy <= clearW; dy++) {
                    const yy = ey + dy;
                    if (yy >= 0 && yy < h) {
                        rows[yy][w - 1] = 'p';
                        rows[yy][w - 2] = 'p';
                    }
                }
                break;
        }
        return rows.map(r => r.join(''));
    },

    // ── Helper: clear a small area ──────────

    clearArea(grid, cx, cy, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = cx + dx, y = cy + dy;
                if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
                    if (grid[y][x] !== 'B' && grid[y][x] !== 'F' && grid[y][x] !== 'f') {
                        grid[y][x] = '.';
                    }
                }
            }
        }
    }
};
