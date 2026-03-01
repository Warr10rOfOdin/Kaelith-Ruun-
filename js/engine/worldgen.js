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

        // 6) Stamp narrative props (hand-placed tiles)
        if (mapDef.stamps) {
            mapDef.stamps.forEach(s => {
                if (s.x >= 0 && s.x < w && s.y >= 0 && s.y < h) {
                    grid[s.y][s.x] = s.ch;
                    // Clear a small area around props for readability
                    this.clearArea(grid, s.x, s.y, 0);
                }
            });
        }

        // 7) Place building spots for camps
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

    // Ashen Wastes — mixed forests, rocky outcrops, dead trees, hills, wildflowers
    ashenTile(elev, moist, detail) {
        if (elev > 0.68) return 'P';              // pine trees on high ground
        if (elev > 0.62) return 'T';              // regular trees
        if (elev > 0.55 && detail > 0.45) return detail > 0.65 ? 'P' : 'T';
        if (elev > 0.5 && detail > 0.7 && moist < 0.35) return 'K'; // dead trees in dry areas
        if (elev > 0.48 && elev < 0.55 && detail > 0.55) return 'h'; // rolling hills
        if (elev < 0.18 && moist > 0.55) return 'O'; // small ponds in low areas
        if (elev < 0.22 && moist > 0.5) return 'R';  // rocky lowlands
        if (elev < 0.28 && moist > 0.6) return 'I';  // iron in deep rock
        if (detail > 0.72 && elev > 0.35) return 'E'; // ember root
        if (detail > 0.75 && elev < 0.35) return 'R'; // occasional rock
        if (detail > 0.8 && elev > 0.3 && elev < 0.5) return 'H'; // herbs
        if (detail > 0.82 && moist > 0.5 && elev > 0.35) return 'w'; // wildflowers
        if (detail > 0.88 && moist > 0.6) return 'L'; // lantern post
        if (detail > 0.4 && detail < 0.45 && elev > 0.35) return 'g'; // tall grass patches
        if (detail > 0.9 && elev < 0.3 && moist < 0.4) return 'c'; // rare cave
        return '.';
    },

    ashenWildTile(elev, moist, detail) {
        if (elev > 0.62) return 'P';              // more pines in wilderness
        if (elev > 0.55) return 'T';
        if (elev > 0.50 && detail > 0.4) return detail > 0.6 ? 'K' : 'T';
        if (elev > 0.45 && detail > 0.55) return 'h'; // hills
        if (elev < 0.15 && moist > 0.5) return 'O';  // ponds
        if (elev < 0.2) return 'R';
        if (elev < 0.25 && moist > 0.55) return 'I';
        if (detail > 0.68 && elev > 0.3) return 'E';
        if (detail > 0.7 && elev < 0.3) return 'R';
        if (detail > 0.75) return 'H';
        if (detail > 0.78 && moist > 0.5) return 'w'; // wildflowers
        if (detail > 0.85 && moist > 0.65) return 'X'; // bones
        if (detail > 0.35 && detail < 0.42) return 'g'; // tall grass
        return '.';
    },

    // Hollowfen — dense swamp with water, mushrooms, herbs, dead trees, ponds
    fenTile(elev, moist, detail) {
        if (elev < 0.22) return '~';              // deep water
        if (elev < 0.28 && moist > 0.42) return '~'; // shallow water
        if (elev < 0.32 && moist > 0.55) return 'O'; // ponds at water edges
        if (elev > 0.62 && moist > 0.4) return 'T';  // swamp trees
        if (elev > 0.55 && detail > 0.45) return detail > 0.6 ? 'K' : 'T'; // dead trees mixed
        if (elev > 0.48 && detail > 0.6) return 'h';  // marshy mounds
        if (detail > 0.68 && moist > 0.45) return 'M'; // mushrooms
        if (detail > 0.65 && moist < 0.45) return 'H'; // herbs
        if (detail > 0.78) return 'S';                  // shadow silk
        if (detail > 0.82 && elev > 0.4) return 'L';   // lantern
        if (detail > 0.38 && detail < 0.44 && elev > 0.32) return 'g'; // tall swamp grass
        if (detail > 0.84 && moist > 0.5 && elev > 0.35) return 'w'; // swamp flowers
        return '.';
    },

    fenWildTile(elev, moist, detail) {
        if (elev < 0.25) return '~';
        if (elev < 0.32 && moist > 0.4) return '~';
        if (elev < 0.35 && moist > 0.55) return 'O'; // ponds
        if (elev > 0.58) return 'K';                   // lots of dead trees
        if (elev > 0.52 && detail > 0.4) return 'T';
        if (elev > 0.46 && detail > 0.55) return 'h'; // hills
        if (detail > 0.62 && moist > 0.45) return 'M';
        if (detail > 0.58 && moist < 0.45) return 'H';
        if (detail > 0.75) return 'S';
        if (detail > 0.8 && elev < 0.4) return 'X';   // bones
        if (detail > 0.35 && detail < 0.42) return 'g';
        if (detail > 0.9 && elev < 0.35) return 'c';  // rare cave
        return '.';
    },

    // Void Sanctum — dark crystals, walls, bones, dead trees, caves
    voidTile(elev, moist, detail) {
        if (elev > 0.68) return '#';               // dense stone walls
        if (elev > 0.6 && detail > 0.4) return '#';
        if (elev > 0.55 && detail > 0.6) return 'K'; // dead trees in void
        if (elev < 0.18 && moist > 0.5) return 'R';  // deep rock
        if (elev < 0.22) return 'R';
        if (detail > 0.68 && moist > 0.45) return 'V'; // veil crystals
        if (detail > 0.7 && moist < 0.45) return 'X';  // bones
        if (detail > 0.78) return 'S';                  // shadow silk
        if (detail > 0.82 && elev > 0.4) return 'L';   // lantern
        if (detail > 0.88 && elev < 0.35) return 'c';  // cave entrances
        if (elev > 0.45 && elev < 0.55 && detail > 0.5) return 'h'; // dark hills
        return '.';
    },

    voidWildTile(elev, moist, detail) {
        if (elev > 0.62) return '#';
        if (elev > 0.56 && detail > 0.35) return '#';
        if (elev > 0.5 && detail > 0.55) return 'K'; // dead trees
        if (elev < 0.2) return 'R';
        if (detail > 0.62 && moist > 0.45) return 'V';
        if (detail > 0.65 && moist < 0.45) return 'X';
        if (detail > 0.75) return 'S';
        if (detail > 0.85 && elev < 0.3) return 'c'; // caves
        if (elev > 0.42 && elev < 0.52 && detail > 0.48) return 'h';
        return '.';
    },

    // Village — lush with flowers, some trees, decorative rocks, gardens
    villageTile(elev, moist, detail) {
        if (elev > 0.72) return 'T';
        if (elev > 0.68 && detail > 0.5) return detail > 0.7 ? 'P' : 'T';
        if (elev > 0.6 && detail > 0.65) return 'h'; // gentle hills
        if (detail > 0.82 && moist > 0.5) return 'w'; // wildflowers
        if (detail > 0.85) return 'H';                 // herb garden
        if (detail > 0.88 && elev < 0.3) return 'R';   // decorative rock
        if (detail > 0.38 && detail < 0.44 && elev > 0.4) return 'g'; // grass patches
        return '.';
    },

    // Camp — open with some trees, flowers, grass patches
    campTile(elev, moist, detail) {
        if (elev > 0.78) return 'T';
        if (elev > 0.74 && detail > 0.6) return 'P'; // occasional pine
        if (detail > 0.88) return 'R';                 // occasional rock
        if (detail > 0.82 && moist > 0.5) return 'w'; // flowers
        if (detail > 0.35 && detail < 0.4 && elev > 0.5) return 'g'; // tall grass
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
        // Tiles that paths can overwrite (anything except water, campfire, chest, building spot, doors)
        const canReplace = new Set(['.', 'T', 'R', '#', 'f', 'E', 'H', 'S', 'X', 'M', 'V', 'I']);

        // L-shaped path: horizontal first, then vertical
        while (x !== tx) {
            if (x >= 0 && x < mapW && y >= 0 && y < mapH) {
                if (canReplace.has(grid[y][x])) {
                    grid[y][x] = 'p';
                }
                // Widen the path
                if (y + 1 < mapH && canReplace.has(grid[y + 1][x])) {
                    grid[y + 1][x] = 'p';
                }
            }
            x += x < tx ? 1 : -1;
        }
        while (y !== ty) {
            if (x >= 0 && x < mapW && y >= 0 && y < mapH) {
                if (canReplace.has(grid[y][x])) {
                    grid[y][x] = 'p';
                }
                if (x + 1 < mapW && canReplace.has(grid[y][x + 1])) {
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
        const clearW = 4; // half-width of opening
        const depth = 5;  // how many rows/cols deep to clear

        switch (direction) {
            case 'north':
                for (let dx = -clearW; dx <= clearW; dx++) {
                    const xx = ex + dx;
                    if (xx >= 0 && xx < w) {
                        for (let d = 0; d < depth && d < h; d++) {
                            rows[d][xx] = 'p';
                        }
                    }
                }
                break;
            case 'south':
                for (let dx = -clearW; dx <= clearW; dx++) {
                    const xx = ex + dx;
                    if (xx >= 0 && xx < w) {
                        for (let d = 0; d < depth && d < h; d++) {
                            rows[h - 1 - d][xx] = 'p';
                        }
                    }
                }
                break;
            case 'west':
                for (let dy = -clearW; dy <= clearW; dy++) {
                    const yy = ey + dy;
                    if (yy >= 0 && yy < h) {
                        for (let d = 0; d < depth && d < w; d++) {
                            rows[yy][d] = 'p';
                        }
                    }
                }
                break;
            case 'east':
                for (let dy = -clearW; dy <= clearW; dy++) {
                    const yy = ey + dy;
                    if (yy >= 0 && yy < h) {
                        for (let d = 0; d < depth && d < w; d++) {
                            rows[yy][w - 1 - d] = 'p';
                        }
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
