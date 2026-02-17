// ============================================
// SPRITES — Procedural Pixel Art Generator
// ============================================
// All game visuals drawn with Canvas primitives
// Cached as offscreen canvases for performance

const Sprites = {
    TS: 32,          // tile size in canvas pixels
    cache: {},
    animFrame: 0,    // global animation frame (for water, fire, etc.)
    regionTint: null, // current region color tint

    init() {
        this.genTerrainTiles();
        this.genPlayerSprites();
        this.genEntitySprites();
    },

    // ── Helpers ─────────────────────────────

    mkCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w || this.TS;
        c.height = h || this.TS;
        return c;
    },

    hash(x, y) {
        return ((x * 73856093) ^ (y * 19349663)) & 0x7FFFFFFF;
    },

    // Seeded pseudo-random from hash
    seeded(seed) {
        let s = seed | 0;
        return () => { s = (s * 1103515245 + 12345) & 0x7FFFFFFF; return (s >> 16) / 32768; };
    },

    lerp(a, b, t) { return a + (b - a) * t; },

    // ── Color Palettes ──────────────────────

    PAL: {
        // Grass
        grass:   ['#3d6b2e','#4a7a2e','#5a8a3e','#6a9a4e','#3a6a1e'],
        // Path
        path:    ['#8b7355','#7b6345','#9b8365','#6b5335'],
        // Water
        water:   ['#1a5a8a','#2a6a9a','#3a7aaa','#4a8aba'],
        // Wall / Stone
        wall:    ['#4a4a4a','#3a3a3a','#5a5a5a','#555555'],
        // Tree
        trunk:   ['#5a3a1a','#6a4a2a','#4a2a10'],
        leaves:  ['#1a5a0a','#2a7a1a','#1d5e0d','#3a8a2a','#4a9a3a'],
        // Rock
        rock:    ['#6a6a6a','#7a7a7a','#5a5a5a','#8a8a8a'],
        // Iron
        iron:    ['#8a6a4a','#9a7a5a','#7a5a3a','#aa8a6a'],
        // Ember
        ember:   ['#aa4422','#cc5533','#ee7744','#ffaa66'],
        // Crystal
        crystal: ['#6a3a8a','#8a5aaa','#aa7acc','#cc9aee'],
        // Fire
        fire:    ['#ff6600','#ffaa00','#ff4400','#ffcc33','#ff8800'],
        // Skin
        skin:    ['#e8c8a8','#d8b898','#c8a888'],
        // Wood
        wood:    ['#5a3a1a','#6a4a2a','#7a5a3a'],
        // Shadow silk
        shadow:  ['#2a2a3a','#3a3a4a','#1a1a2a','#4a4a5a'],
        // Herb
        herb:    ['#2a6a2a','#3a8a3a','#4aaa4a'],
        // Fence
        fence:   ['#6a4a2a','#7a5a3a','#5a3a1a'],
        // Soil
        soil:    ['#4a3020','#5a4030','#3a2010'],
        // Wheat
        wheat:   ['#ccaa44','#ddbb55','#bbaa33'],
        // Mushroom
        mush:    ['#cc3333','#ee4444','#ffffff'],
        // Bone
        bone:    ['#d0c8b8','#c0b8a8','#e0d8c8'],
        // Lantern
        lantern: ['#ffcc00','#ffdd44','#ffaa00'],
        // Void
        void_:   ['#3a1a4a','#5a2a6a','#7a3a8a','#9a4aaa']
    },

    // ── Terrain Tile Generation ─────────────

    genTerrainTiles() {
        const T = this.TS;
        const P = this.PAL;

        // Generate multiple variations for common tiles (more = richer world)
        for (let v = 0; v < 8; v++) {
            this.cache[`grass_${v}`] = this.drawGrass(v);
        }
        for (let v = 0; v < 4; v++) {
            this.cache[`path_${v}`] = this.drawPath(v);
        }
        for (let v = 0; v < 5; v++) {
            this.cache[`tree_${v}`] = this.drawTree(v);
        }
        for (let v = 0; v < 3; v++) {
            this.cache[`rock_${v}`] = this.drawRock(v);
        }

        // Single variants
        this.cache.wall = this.drawWall();
        this.cache.iron = this.drawIronVein();
        this.cache.ember = this.drawEmberRoot();
        this.cache.crystal = this.drawVeilCrystal();
        this.cache.shadowsilk = this.drawShadowSilk();
        this.cache.herb = this.drawHerb();
        this.cache.buildspot = this.drawBuildSpot();
        this.cache.fence = this.drawFence();
        this.cache.door = this.drawDoor();
        this.cache.chest = this.drawChest();
        this.cache.gardensoil = this.drawGardenSoil();
        this.cache.wheat_ = this.drawWheat();
        this.cache.mushroom = this.drawMushroom();
        this.cache.bridge = this.drawBridge();
        this.cache.bones = this.drawBones();
        this.cache.lantern = this.drawLantern();

        // Animated tiles (multiple frames)
        for (let f = 0; f < 3; f++) {
            this.cache[`water_${f}`] = this.drawWater(f);
            this.cache[`campfire_${f}`] = this.drawCampfire(f);
        }
    },

    // Get the right cached tile for a given tile char and position
    getTile(ch, tx, ty) {
        const h = this.hash(tx, ty);
        switch (ch) {
            case '.': return this.cache[`grass_${h % 8}`];
            case 'p': return this.cache[`path_${h % 4}`];
            case '#': return this.cache.wall;
            case 'T': return this.cache[`tree_${h % 5}`];
            case 'R': return this.cache[`rock_${h % 3}`];
            case 'I': return this.cache.iron;
            case '~': return this.cache[`water_${this.animFrame % 3}`];
            case 'E': return this.cache.ember;
            case 'V': return this.cache.crystal;
            case 'S': return this.cache.shadowsilk;
            case 'H': return this.cache.herb;
            case 'B': return this.cache.buildspot;
            case 'F': return this.cache[`campfire_${this.animFrame % 3}`];
            case 'f': return this.cache.fence;
            case 'D': return this.cache.door;
            case 'C': return this.cache.chest;
            case 'G': return this.cache.gardensoil;
            case 'W': return this.cache.wheat_;
            case 'M': return this.cache.mushroom;
            case 'b': return this.cache.bridge;
            case 'X': return this.cache.bones;
            case 'L': return this.cache.lantern;
            default: return this.cache.grass_0;
        }
    },

    // ── Individual Tile Drawers ─────────────

    drawGrass(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.grass;
        const rng = this.seeded(variant * 1000 + 42);

        // Rich multi-tone base: gradient feel with two-pass fill
        ctx.fillStyle = P[1];
        ctx.fillRect(0, 0, T, T);

        // Layer 1: Large soft patches for natural color variation (like the mockup)
        for (let i = 0; i < 8; i++) {
            const shade = P[Math.floor(rng() * P.length)];
            ctx.fillStyle = shade;
            const x = Math.floor(rng() * T);
            const y = Math.floor(rng() * T);
            const w = 6 + Math.floor(rng() * 10);
            const h = 5 + Math.floor(rng() * 8);
            ctx.globalAlpha = 0.4 + rng() * 0.3;
            ctx.beginPath();
            ctx.ellipse(x, y, w / 2, h / 2, rng() * 3.14, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Layer 2: Fine grain noise — 25+ small patches for texture
        for (let i = 0; i < 28; i++) {
            ctx.fillStyle = P[Math.floor(rng() * P.length)];
            const x = Math.floor(rng() * T);
            const y = Math.floor(rng() * T);
            ctx.fillRect(x, y, 1 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 3));
        }

        // Layer 3: Darker undertone speckles for depth
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#2a5a1a';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 2, 2);
        }
        ctx.globalAlpha = 1;

        // Grass blades — varied heights and angles
        const bladeColors = ['#5a9a3e', '#6aaa4e', '#4a8a2e', '#7aba5e'];
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = bladeColors[Math.floor(rng() * bladeColors.length)];
            const x = Math.floor(rng() * (T - 2));
            const y = Math.floor(rng() * (T - 5));
            const h = 2 + Math.floor(rng() * 4);
            ctx.fillRect(x, y, 1, h);
            if (rng() > 0.5) ctx.fillRect(x + 1, y + 1, 1, h - 1);
        }

        // Occasional details per variant
        if (variant === 2) {
            // Small yellow wildflowers
            ctx.fillStyle = '#dddd44';
            ctx.fillRect(10, 14, 2, 2);
            ctx.fillStyle = '#cccc33';
            ctx.fillRect(11, 13, 1, 1);
            ctx.fillStyle = '#ee6666';
            ctx.fillRect(22, 8, 2, 2);
            ctx.fillStyle = '#dd5555';
            ctx.fillRect(23, 7, 1, 1);
        }
        if (variant === 3) {
            // Blue flowers + clover
            ctx.fillStyle = '#aaddff';
            ctx.fillRect(6, 20, 2, 2);
            ctx.fillStyle = '#88ccee';
            ctx.fillRect(7, 19, 1, 1);
            // Tiny clover
            ctx.fillStyle = '#3a7a2a';
            ctx.fillRect(20, 24, 3, 1);
            ctx.fillRect(21, 23, 1, 1);
            ctx.fillRect(21, 25, 1, 1);
        }
        if (variant === 0) {
            // Tiny pebble
            ctx.fillStyle = '#8a8a7a';
            ctx.fillRect(14 + Math.floor(rng() * 6), 22 + Math.floor(rng() * 4), 2, 1);
        }

        return c;
    },

    drawPath(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.path;
        const rng = this.seeded(variant * 2000 + 77);

        // Rich base with subtle variation
        ctx.fillStyle = P[0];
        ctx.fillRect(0, 0, T, T);

        // Large soft patches for worn-path look
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = P[Math.floor(rng() * P.length)];
            ctx.globalAlpha = 0.35 + rng() * 0.3;
            const x = Math.floor(rng() * T);
            const y = Math.floor(rng() * T);
            ctx.beginPath();
            ctx.ellipse(x, y, 4 + rng() * 6, 3 + rng() * 5, rng() * 3.14, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Fine grain texture
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = P[Math.floor(rng() * P.length)];
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T),
                1 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2));
        }

        // Darker edge dirt
        ctx.fillStyle = '#5a4a35';
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 2);
        }
        ctx.globalAlpha = 1;

        // Pebbles — varied sizes
        const pebbleColors = ['#9a8a7a', '#8a7a6a', '#aaa09a', '#7a6a5a'];
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = pebbleColors[Math.floor(rng() * pebbleColors.length)];
            const x = 2 + Math.floor(rng() * (T - 4));
            const y = 2 + Math.floor(rng() * (T - 4));
            const r = 0.8 + rng() * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cart rut marks on variant 1
        if (variant === 1) {
            ctx.strokeStyle = '#6a5a45';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(0, 10); ctx.lineTo(T, 12);
            ctx.moveTo(0, 22); ctx.lineTo(T, 20);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        return c;
    },

    drawWall() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.wall;
        const rng = this.seeded(7777);

        // Base dark mortar
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, T, T);

        // Stone block pattern with varied colors
        for (let row = 0; row < 4; row++) {
            const offset = (row % 2) * 8;
            for (let col = 0; col < 3; col++) {
                const x = offset + col * 12;
                const y = row * 8;
                // Block face — varied shade per block
                const shade = P[Math.floor(rng() * P.length)];
                ctx.fillStyle = shade;
                ctx.fillRect(x + 1, y + 1, 10, 6);
                // Texture speckle on face
                ctx.fillStyle = P[2];
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x + 2 + Math.floor(rng() * 6), y + 2 + Math.floor(rng() * 3), 2, 2);
                ctx.globalAlpha = 1;
                // Highlight top edge
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(x + 1, y + 1, 10, 1);
                // Shadow bottom + right edge
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(x + 1, y + 7, 10, 1);
                ctx.fillRect(x + 11, y + 1, 1, 7);
            }
        }

        // Occasional moss stain
        ctx.fillStyle = '#3a5a3a';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(2, 24, 4, 3);
        ctx.fillRect(20, 4, 3, 2);
        ctx.globalAlpha = 1;

        return c;
    },

    drawTree(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 3000 + 13);

        // Rich grass base (match the overhaul)
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 10; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.globalAlpha = 0.5 + rng() * 0.3;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 2 + Math.floor(rng() * 4), 2 + Math.floor(rng() * 3));
        }
        ctx.globalAlpha = 1;

        // Larger shadow on ground — darker, more spread
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(16, 28, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(18, 27, 10, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Trunk with bark texture
        const tw = 5 + Math.floor(rng() * 2);
        const tx = 16 - tw / 2;
        ctx.fillStyle = P.trunk[0];
        ctx.fillRect(tx, 14, tw, 16);
        // Bark highlights
        ctx.fillStyle = P.trunk[1];
        ctx.fillRect(tx + 1, 14, tw - 2, 14);
        // Bark grain lines
        ctx.fillStyle = P.trunk[2];
        for (let i = 0; i < 4; i++) {
            const by = 15 + Math.floor(rng() * 12);
            ctx.fillRect(tx + 1, by, tw - 2, 1);
        }
        // Knot
        if (variant === 1) {
            ctx.fillStyle = '#4a2a10';
            ctx.beginPath();
            ctx.arc(16, 20, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Root flare at base
        ctx.fillStyle = P.trunk[0];
        ctx.fillRect(tx - 1, 28, tw + 2, 2);

        // Canopy — 5+ overlapping layers for lush, full look
        const cx = 16 + (variant - 1) * 1;
        const cy = 9 + (variant === 1 ? -1 : 0);

        // Layer 1: darkest, largest (base shadow of canopy)
        ctx.fillStyle = '#0a4a00';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: dark green base
        ctx.fillStyle = P.leaves[0];
        ctx.beginPath();
        ctx.ellipse(cx - 1, cy + 3, 13, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: mid-left cluster
        ctx.fillStyle = P.leaves[2];
        ctx.beginPath();
        ctx.ellipse(cx - 3, cy + 1, 9, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: mid-right cluster
        ctx.fillStyle = P.leaves[1];
        ctx.beginPath();
        ctx.ellipse(cx + 3, cy - 1, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Layer 5: bright highlight top
        ctx.fillStyle = P.leaves[3];
        ctx.beginPath();
        ctx.ellipse(cx, cy - 2, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 6: brightest highlight (sun catch)
        ctx.fillStyle = P.leaves[4];
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 4, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Leaf texture — lots of small dots for depth
        for (let i = 0; i < 14; i++) {
            const shade = [P.leaves[0], P.leaves[2], '#1a5a0a', '#2d6d1d'][Math.floor(rng() * 4)];
            ctx.fillStyle = shade;
            const dx = cx - 10 + Math.floor(rng() * 20);
            const dy = cy - 6 + Math.floor(rng() * 14);
            ctx.fillRect(dx, dy, 1 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
        }

        // Bright leaf specks (sunlight through canopy)
        ctx.fillStyle = '#7aca5a';
        for (let i = 0; i < 4; i++) {
            const dx = cx - 8 + Math.floor(rng() * 16);
            const dy = cy - 5 + Math.floor(rng() * 10);
            ctx.fillRect(dx, dy, 1, 1);
        }

        return c;
    },

    drawRock(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 4000 + 31);

        // Rich grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.globalAlpha = 0.4;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 2);
        }
        ctx.globalAlpha = 1;

        // Larger shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(17, 27, 12, 5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        const rx = variant === 0 ? 16 : 14;
        const ry = variant === 0 ? 16 : 14;

        // Rock body — darker bottom layer for depth
        ctx.fillStyle = P.rock[2];
        ctx.beginPath();
        ctx.ellipse(rx, ry + 3, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main rock face
        ctx.fillStyle = P.rock[0];
        ctx.beginPath();
        ctx.ellipse(rx, ry, 11, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Texture noise on rock surface
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = P.rock[Math.floor(rng() * P.rock.length)];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(rx - 8 + Math.floor(rng() * 16), ry - 6 + Math.floor(rng() * 12), 2, 2);
        }
        ctx.globalAlpha = 1;

        // Highlight — upper left
        ctx.fillStyle = P.rock[3];
        ctx.beginPath();
        ctx.ellipse(rx - 3, ry - 3, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Small bright speck
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(rx - 4, ry - 5, 2, 1);

        // Cracks — more detail
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx - 4, ry - 1);
        ctx.lineTo(rx + 1, ry + 2);
        ctx.lineTo(rx + 5, ry);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx + 2, ry + 3);
        ctx.lineTo(rx + 6, ry + 5);
        ctx.stroke();

        // Moss on bottom
        if (variant === 0) {
            ctx.fillStyle = '#3a6a2a';
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.ellipse(rx + 4, ry + 6, 4, 2, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        return c;
    },

    drawWater(frame) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.water;

        // Deep water base gradient
        ctx.fillStyle = P[0];
        ctx.fillRect(0, 0, T, T);

        // Depth variation patches
        ctx.fillStyle = '#1a4a7a';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(10, 12, 8, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a5a8a';
        ctx.beginPath();
        ctx.ellipse(22, 22, 7, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Wave pattern (shifts with frame) — more waves
        const offset = frame * 4;
        for (let row = 0; row < 5; row++) {
            ctx.fillStyle = P[1 + (row + frame) % 3];
            ctx.globalAlpha = 0.5 + (row % 2) * 0.2;
            for (let col = 0; col < 6; col++) {
                const x = ((col * 7 + offset + row * 3) % (T + 4)) - 2;
                const y = row * 7 + 1;
                ctx.beginPath();
                ctx.ellipse(x, y, 4, 1.2, 0.1 * row, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Sparkle highlights — more varied
        ctx.fillStyle = 'rgba(200,230,255,0.4)';
        const sparkX = (8 + frame * 11) % T;
        const sparkY = (4 + frame * 7) % T;
        ctx.fillRect(sparkX, sparkY, 2, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect((sparkX + 15) % T, (sparkY + 12) % T, 1, 1);
        ctx.fillRect((sparkX + 7) % T, (sparkY + 20) % T, 1, 1);

        return c;
    },

    drawIronVein() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        // Rock base (reuse rock drawing)
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        ctx.fillStyle = P.rock[2];
        ctx.beginPath();
        ctx.ellipse(16, 16, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.rock[0];
        ctx.beginPath();
        ctx.ellipse(16, 15, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iron veins (orange-brown streaks)
        ctx.fillStyle = P.iron[0];
        ctx.fillRect(8, 12, 6, 3);
        ctx.fillRect(18, 10, 5, 3);
        ctx.fillRect(12, 17, 7, 2);

        ctx.fillStyle = P.iron[1];
        ctx.fillRect(9, 13, 4, 1);
        ctx.fillRect(19, 11, 3, 1);

        // Metallic sparkle
        ctx.fillStyle = P.iron[3];
        ctx.fillRect(10, 12, 2, 1);
        ctx.fillRect(20, 10, 1, 1);

        return c;
    },

    drawEmberRoot() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        // Grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Glow on ground
        ctx.fillStyle = 'rgba(200,80,20,0.15)';
        ctx.beginPath();
        ctx.ellipse(16, 22, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Root/plant
        ctx.fillStyle = P.ember[0];
        ctx.fillRect(14, 10, 4, 16);
        ctx.fillRect(12, 14, 8, 4);

        // Leaves
        ctx.fillStyle = '#aa5522';
        ctx.beginPath();
        ctx.ellipse(10, 12, 4, 6, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(22, 10, 4, 5, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Glowing tips
        ctx.fillStyle = P.ember[2];
        ctx.fillRect(14, 8, 4, 3);
        ctx.fillStyle = P.ember[3];
        ctx.fillRect(15, 9, 2, 1);

        return c;
    },

    drawVeilCrystal() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        // Dark ground base for void areas
        ctx.fillStyle = P.grass[4];
        ctx.fillRect(0, 0, T, T);

        // Strong purple glow radiating outward
        const grd = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
        grd.addColorStop(0, 'rgba(150,60,220,0.35)');
        grd.addColorStop(0.5, 'rgba(120,40,180,0.15)');
        grd.addColorStop(1, 'rgba(80,20,120,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, T, T);

        // Crystal shards — more of them, varied
        const drawShard = (x, y, w, h, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h);
            ctx.closePath();
            ctx.fill();
        };

        // Back shards (darker)
        drawShard(7, 10, 5, 16, P.crystal[0]);
        drawShard(22, 12, 4, 12, '#5a2a7a');

        // Main shards
        drawShard(10, 6, 6, 20, P.crystal[0]);
        drawShard(15, 3, 6, 22, P.crystal[1]);
        drawShard(20, 8, 5, 16, P.crystal[2]);

        // Highlight edges
        ctx.fillStyle = P.crystal[3];
        ctx.fillRect(12, 10, 1, 6);
        ctx.fillRect(18, 7, 1, 4);
        ctx.fillRect(17, 5, 1, 3);

        // Inner glow line
        ctx.fillStyle = '#ddaaff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(16, 6, 1, 8);
        ctx.fillRect(11, 10, 1, 5);
        ctx.globalAlpha = 1;

        // Sparkles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(17, 5, 1, 1);
        ctx.fillRect(12, 8, 1, 1);
        ctx.fillRect(21, 10, 1, 1);

        return c;
    },

    drawShadowSilk() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        ctx.fillStyle = P.grass[4];
        ctx.fillRect(0, 0, T, T);

        // Web strands
        ctx.strokeStyle = P.shadow[1];
        ctx.lineWidth = 1;
        // Radial web
        const cx = 16, cy = 14;
        for (let a = 0; a < 8; a++) {
            const angle = (a / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * 13, cy + Math.sin(angle) * 11);
            ctx.stroke();
        }
        // Circular strands
        for (let r = 4; r <= 12; r += 4) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Center blob
        ctx.fillStyle = P.shadow[2];
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shimmer
        ctx.fillStyle = 'rgba(140,140,180,0.3)';
        ctx.fillRect(10, 10, 2, 1);
        ctx.fillRect(20, 16, 1, 2);

        return c;
    },

    drawHerb() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Bush shape
        ctx.fillStyle = P.herb[0];
        ctx.beginPath();
        ctx.ellipse(16, 18, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = P.herb[1];
        ctx.beginPath();
        ctx.ellipse(14, 16, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = P.herb[2];
        ctx.beginPath();
        ctx.ellipse(18, 14, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Small leaves on top
        ctx.fillStyle = P.herb[1];
        for (const [lx, ly] of [[10, 12], [16, 10], [22, 13]]) {
            ctx.beginPath();
            ctx.ellipse(lx, ly, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        return c;
    },

    drawBuildSpot() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        // Grass base
        ctx.fillStyle = this.PAL.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Subtle dashed border
        ctx.strokeStyle = 'rgba(200,180,120,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(3, 3, T - 6, T - 6);
        ctx.setLineDash([]);

        // Small + marker in center
        ctx.fillStyle = 'rgba(200,180,120,0.35)';
        ctx.fillRect(14, 10, 4, 12);
        ctx.fillRect(10, 14, 12, 4);

        return c;
    },

    drawCampfire(frame) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Strong warm ground glow — radiates out from center
        const warmGrd = ctx.createRadialGradient(16, 20, 2, 16, 20, 16);
        warmGrd.addColorStop(0, 'rgba(255,160,60,0.3)');
        warmGrd.addColorStop(0.5, 'rgba(200,100,30,0.15)');
        warmGrd.addColorStop(1, 'rgba(200,80,20,0)');
        ctx.fillStyle = warmGrd;
        ctx.fillRect(0, 0, T, T);

        // Stone ring — varied sizes
        for (let a = 0; a < 7; a++) {
            const angle = (a / 7) * Math.PI * 2;
            const x = 16 + Math.cos(angle) * 8;
            const y = 21 + Math.sin(angle) * 5;
            ctx.fillStyle = P.rock[a % 2 === 0 ? 2 : 0];
            ctx.beginPath();
            ctx.arc(x, y, 2.5 + (a % 2), 0, Math.PI * 2);
            ctx.fill();
            // Stone highlight
            ctx.fillStyle = P.rock[3];
            ctx.beginPath();
            ctx.arc(x - 0.5, y - 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fire (animated) — larger, more dramatic
        const fOff = frame * 2;

        // Outer glow haze
        ctx.fillStyle = 'rgba(255,100,20,0.12)';
        ctx.beginPath();
        ctx.ellipse(16, 16, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer flame
        ctx.fillStyle = P.fire[2];
        ctx.beginPath();
        ctx.moveTo(9, 22);
        ctx.quadraticCurveTo(11 + fOff, 4 - fOff, 16, 8 + fOff);
        ctx.quadraticCurveTo(21 - fOff, 4 + fOff, 23, 22);
        ctx.closePath();
        ctx.fill();

        // Middle flame
        ctx.fillStyle = P.fire[0];
        ctx.beginPath();
        ctx.moveTo(11, 22);
        ctx.quadraticCurveTo(13 - fOff, 8 + fOff, 16, 10 - fOff);
        ctx.quadraticCurveTo(19 + fOff, 8 - fOff, 21, 22);
        ctx.closePath();
        ctx.fill();

        // Inner flame (bright yellow-white)
        ctx.fillStyle = P.fire[3];
        ctx.beginPath();
        ctx.moveTo(13, 22);
        ctx.quadraticCurveTo(14, 12 + fOff, 16, 13 - fOff);
        ctx.quadraticCurveTo(18, 12 - fOff, 19, 22);
        ctx.closePath();
        ctx.fill();

        // Hot white core
        ctx.fillStyle = '#ffe8cc';
        ctx.beginPath();
        ctx.moveTo(14, 22);
        ctx.quadraticCurveTo(15, 16 + fOff, 16, 17 - fOff);
        ctx.quadraticCurveTo(17, 16, 18, 22);
        ctx.closePath();
        ctx.fill();

        // Sparks — more of them
        ctx.fillStyle = P.fire[1];
        ctx.fillRect(12 + frame * 3, 6 - frame, 1, 1);
        ctx.fillRect(19 - frame * 2, 4 + frame, 1, 1);
        ctx.fillRect(10 + frame, 3 + frame * 2, 1, 1);
        ctx.fillStyle = '#ffcc66';
        ctx.fillRect(16 + frame - 1, 2 + frame, 1, 1);
        ctx.fillRect(14 - frame, 5 - frame, 1, 1);

        return c;
    },

    drawFence() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Posts
        ctx.fillStyle = P.fence[0];
        ctx.fillRect(4, 8, 4, 20);
        ctx.fillRect(24, 8, 4, 20);

        // Horizontal bars
        ctx.fillStyle = P.fence[1];
        ctx.fillRect(2, 12, 28, 3);
        ctx.fillRect(2, 20, 28, 3);

        // Top caps
        ctx.fillStyle = P.fence[2];
        ctx.fillRect(3, 7, 6, 3);
        ctx.fillRect(23, 7, 6, 3);

        return c;
    },

    drawDoor() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        // Wall background
        ctx.fillStyle = this.PAL.wall[0];
        ctx.fillRect(0, 0, T, T);

        // Door frame
        ctx.fillStyle = '#6a5030';
        ctx.fillRect(6, 2, 20, 28);

        // Door
        ctx.fillStyle = '#8a6a40';
        ctx.fillRect(8, 4, 16, 24);

        // Wood grain
        ctx.fillStyle = '#7a5a30';
        ctx.fillRect(10, 6, 12, 1);
        ctx.fillRect(10, 14, 12, 1);
        ctx.fillRect(10, 22, 12, 1);

        // Handle
        ctx.fillStyle = '#ccaa44';
        ctx.fillRect(20, 14, 2, 4);

        // Threshold
        ctx.fillStyle = this.PAL.path[0];
        ctx.fillRect(6, 28, 20, 4);

        return c;
    },

    drawChest() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(16, 26, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chest body
        ctx.fillStyle = '#7a5020';
        ctx.fillRect(6, 14, 20, 12);

        // Chest lid
        ctx.fillStyle = '#8a6030';
        ctx.fillRect(5, 10, 22, 6);

        // Metal bands
        ctx.fillStyle = '#aa8840';
        ctx.fillRect(5, 10, 22, 1);
        ctx.fillRect(5, 15, 22, 1);
        ctx.fillRect(5, 25, 22, 1);

        // Lock
        ctx.fillStyle = '#ccaa44';
        ctx.fillRect(14, 13, 4, 5);
        ctx.fillStyle = '#aa8830';
        ctx.fillRect(15, 14, 2, 3);

        return c;
    },

    drawGardenSoil() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.soil[0];
        ctx.fillRect(0, 0, T, T);

        // Furrow lines
        for (let row = 0; row < 4; row++) {
            ctx.fillStyle = this.PAL.soil[2];
            ctx.fillRect(0, row * 8 + 4, T, 2);
            ctx.fillStyle = this.PAL.soil[1];
            ctx.fillRect(0, row * 8 + 6, T, 2);
        }

        return c;
    },

    drawWheat() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.soil[0];
        ctx.fillRect(0, 0, T, T);

        // Stalks
        for (let i = 0; i < 5; i++) {
            const x = 4 + i * 6;
            ctx.strokeStyle = this.PAL.wheat[2];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, T);
            ctx.lineTo(x + 1, 8);
            ctx.stroke();

            // Wheat head
            ctx.fillStyle = this.PAL.wheat[0];
            ctx.beginPath();
            ctx.ellipse(x + 1, 6, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.PAL.wheat[1];
            ctx.fillRect(x, 4, 2, 2);
        }

        return c;
    },

    drawMushroom() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.grass[4];
        ctx.fillRect(0, 0, T, T);

        const drawShroom = (x, y, size) => {
            // Stem
            ctx.fillStyle = '#e8dcc8';
            ctx.fillRect(x - 1, y, 3 * size, 6 * size);
            // Cap
            ctx.fillStyle = this.PAL.mush[0];
            ctx.beginPath();
            ctx.ellipse(x + 1, y, 5 * size, 4 * size, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 1, y, 5 * size, 3 * size, 0, 0, Math.PI);
            ctx.fill();
            // Spots
            ctx.fillStyle = this.PAL.mush[2];
            ctx.fillRect(x - 2, y - 2, 2, 2);
            ctx.fillRect(x + 2, y - 1, 1, 1);
        };

        drawShroom(12, 16, 1);
        drawShroom(22, 18, 0.8);
        drawShroom(8, 22, 0.6);

        return c;
    },

    drawBridge() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        // Water underneath
        ctx.fillStyle = this.PAL.water[0];
        ctx.fillRect(0, 0, T, T);

        // Planks
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#7a5a3a' : '#8a6a4a';
            ctx.fillRect(2, i * 8, T - 4, 7);
            ctx.fillStyle = '#6a4a2a';
            ctx.fillRect(2, i * 8 + 7, T - 4, 1);
        }

        // Side rails
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(0, 0, 3, T);
        ctx.fillRect(T - 3, 0, 3, T);

        return c;
    },

    drawBones() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.grass[4];
        ctx.fillRect(0, 0, T, T);

        // Skull
        ctx.fillStyle = this.PAL.bone[0];
        ctx.beginPath();
        ctx.ellipse(16, 14, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye sockets
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(13, 13, 2, 2);
        ctx.fillRect(17, 13, 2, 2);

        // Jaw
        ctx.fillStyle = this.PAL.bone[1];
        ctx.fillRect(12, 18, 8, 2);

        // Scattered bones
        ctx.fillStyle = this.PAL.bone[2];
        ctx.save();
        ctx.translate(8, 24);
        ctx.rotate(-0.3);
        ctx.fillRect(-5, -1, 10, 2);
        ctx.fillRect(-5, -2, 2, 4);
        ctx.fillRect(3, -2, 2, 4);
        ctx.restore();

        ctx.save();
        ctx.translate(24, 22);
        ctx.rotate(0.5);
        ctx.fillRect(-4, -1, 8, 2);
        ctx.restore();

        return c;
    },

    drawLantern() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Warm glow
        const grd = ctx.createRadialGradient(16, 14, 2, 16, 14, 14);
        grd.addColorStop(0, 'rgba(255,200,80,0.25)');
        grd.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, T, T);

        // Post
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(14, 14, 4, 18);

        // Lantern body
        ctx.fillStyle = '#aa3333';
        ctx.fillRect(10, 6, 12, 10);

        // Frame
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(10, 5, 12, 2);
        ctx.fillRect(10, 15, 12, 2);
        ctx.fillRect(10, 6, 1, 10);
        ctx.fillRect(21, 6, 1, 10);

        // Light inside
        ctx.fillStyle = this.PAL.lantern[0];
        ctx.fillRect(12, 8, 8, 6);
        ctx.fillStyle = this.PAL.lantern[1];
        ctx.fillRect(14, 9, 4, 4);

        // Top hook
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(15, 2, 2, 4);

        return c;
    },

    // ── Player Sprite Generation ────────────

    genPlayerSprites() {
        const dirs = ['down', 'up', 'left', 'right'];
        const frames = [0, 1, 2];
        for (const dir of dirs) {
            for (const frame of frames) {
                this.cache[`player_${dir}_${frame}`] = this.drawPlayerFrame(dir, frame);
            }
        }
    },

    getPlayer(dir, frame) {
        return this.cache[`player_${dir}_${frame}`] || this.cache.player_down_0;
    },

    drawPlayerFrame(dir, frame) {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const sk = this.PAL.skin[0];
        const skShade = '#c9956a';
        const hair = '#5a3020';
        const hairHi = '#7a4a30';
        const shirt = '#3a6aaa';
        const shirtHi = '#5a8acc';
        const shirtDk = '#2a5a8a';
        const pants = '#4a3a30';
        const pantsDk = '#3a2a20';
        const boots_ = '#3a2a1a';
        const bootsHi = '#5a4a3a';
        const belt = '#6a5a3a';
        const cape = '#2a4a6a';
        const cx = 16; // center x

        // Shadow — larger oval
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, 40, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animation offsets
        const walkBob = frame === 0 ? 0 : -1;
        const legOff = frame === 0 ? 0 : (frame === 1 ? 2 : -2);
        const armSwing = frame === 0 ? 0 : (frame === 1 ? 3 : -3);
        const by = walkBob; // body y offset

        // -- Cape (back, shows when facing up or sides) --
        if (dir === 'up') {
            ctx.fillStyle = cape;
            ctx.fillRect(6, 17 + by, 20, 14);
            ctx.fillStyle = '#1a3a5a';
            ctx.fillRect(8, 18 + by, 16, 12);
        }

        // -- Legs / Boots --
        const lx1 = dir === 'left' || dir === 'right' ? 10 : 8 - legOff;
        const lx2 = dir === 'left' || dir === 'right' ? 16 + legOff : 18 + legOff;
        // Pants
        ctx.fillStyle = pants;
        ctx.fillRect(lx1, 28 + by, 6, 8);
        ctx.fillRect(lx2, 28 + by, 6, 8);
        // Pant shade
        ctx.fillStyle = pantsDk;
        ctx.fillRect(lx1, 32 + by, 6, 2);
        ctx.fillRect(lx2, 32 + by, 6, 2);
        // Boots
        ctx.fillStyle = boots_;
        ctx.fillRect(lx1 - 1, 35 + by, 7, 4);
        ctx.fillRect(lx2 - 1, 35 + by, 7, 4);
        // Boot highlight
        ctx.fillStyle = bootsHi;
        ctx.fillRect(lx1, 35 + by, 5, 1);
        ctx.fillRect(lx2, 35 + by, 5, 1);

        // -- Body / Torso --
        ctx.fillStyle = shirt;
        ctx.fillRect(7, 17 + by, 18, 12);
        // Shirt shading (darker sides)
        ctx.fillStyle = shirtDk;
        ctx.fillRect(7, 17 + by, 3, 12);
        ctx.fillRect(22, 17 + by, 3, 12);
        // Shirt highlight center
        ctx.fillStyle = shirtHi;
        ctx.fillRect(12, 18 + by, 8, 4);
        // Belt
        ctx.fillStyle = belt;
        ctx.fillRect(7, 27 + by, 18, 2);
        // Belt buckle
        ctx.fillStyle = '#aa9a5a';
        ctx.fillRect(14, 27 + by, 4, 2);

        // -- Arms --
        if (dir === 'left') {
            // Back arm
            ctx.fillStyle = shirtDk;
            ctx.fillRect(22, 18 + by + armSwing, 5, 9);
            ctx.fillStyle = sk;
            ctx.fillRect(22, 25 + by + armSwing, 5, 3);
            // Front arm
            ctx.fillStyle = shirt;
            ctx.fillRect(5, 18 + by - armSwing, 5, 9);
            ctx.fillStyle = sk;
            ctx.fillRect(5, 25 + by - armSwing, 5, 3);
        } else if (dir === 'right') {
            // Back arm
            ctx.fillStyle = shirtDk;
            ctx.fillRect(5, 18 + by - armSwing, 5, 9);
            ctx.fillStyle = sk;
            ctx.fillRect(5, 25 + by - armSwing, 5, 3);
            // Front arm
            ctx.fillStyle = shirt;
            ctx.fillRect(22, 18 + by + armSwing, 5, 9);
            ctx.fillStyle = sk;
            ctx.fillRect(22, 25 + by + armSwing, 5, 3);
        } else {
            // Both arms visible
            ctx.fillStyle = shirt;
            ctx.fillRect(2, 18 + by + armSwing, 5, 10);
            ctx.fillRect(25, 18 + by - armSwing, 5, 10);
            ctx.fillStyle = sk;
            ctx.fillRect(2, 26 + by + armSwing, 5, 3);
            ctx.fillRect(25, 26 + by - armSwing, 5, 3);
        }

        // -- Neck --
        ctx.fillStyle = sk;
        ctx.fillRect(12, 14 + by, 8, 4);

        // -- Head --
        ctx.fillStyle = sk;
        ctx.fillRect(7, 3 + by, 18, 14);
        // Face shading (sides)
        ctx.fillStyle = skShade;
        ctx.fillRect(7, 5 + by, 2, 10);
        ctx.fillRect(23, 5 + by, 2, 10);

        // -- Hair --
        ctx.fillStyle = hair;
        if (dir === 'down') {
            ctx.fillRect(5, 1 + by, 22, 7);
            ctx.fillRect(5, 4 + by, 4, 7);   // left sideburn
            ctx.fillRect(23, 4 + by, 4, 7);   // right sideburn
            ctx.fillStyle = hairHi;
            ctx.fillRect(10, 2 + by, 12, 3);  // highlight
        } else if (dir === 'up') {
            ctx.fillRect(5, 1 + by, 22, 14);
            ctx.fillStyle = hairHi;
            ctx.fillRect(9, 2 + by, 14, 4);
        } else if (dir === 'left') {
            ctx.fillRect(5, 1 + by, 16, 7);
            ctx.fillRect(5, 4 + by, 6, 10);
            ctx.fillStyle = hairHi;
            ctx.fillRect(10, 2 + by, 8, 3);
        } else {
            ctx.fillRect(11, 1 + by, 16, 7);
            ctx.fillRect(21, 4 + by, 6, 10);
            ctx.fillStyle = hairHi;
            ctx.fillRect(14, 2 + by, 8, 3);
        }

        // -- Face --
        if (dir === 'down') {
            // Eyes — larger, expressive
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, 9 + by, 4, 3);
            ctx.fillRect(18, 9 + by, 4, 3);
            ctx.fillStyle = '#3a5aaa';  // iris
            ctx.fillRect(11, 9 + by, 3, 3);
            ctx.fillRect(19, 9 + by, 3, 3);
            ctx.fillStyle = '#111';     // pupil
            ctx.fillRect(12, 10 + by, 2, 2);
            ctx.fillRect(20, 10 + by, 2, 2);
            ctx.fillStyle = '#fff';     // highlight
            ctx.fillRect(11, 9 + by, 1, 1);
            ctx.fillRect(19, 9 + by, 1, 1);
            // Eyebrows
            ctx.fillStyle = hair;
            ctx.fillRect(9, 8 + by, 5, 1);
            ctx.fillRect(18, 8 + by, 5, 1);
            // Nose
            ctx.fillStyle = skShade;
            ctx.fillRect(15, 12 + by, 2, 2);
            // Mouth
            ctx.fillStyle = '#c07060';
            ctx.fillRect(13, 15 + by, 6, 1);
        } else if (dir === 'left') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(9, 9 + by, 4, 3);
            ctx.fillStyle = '#3a5aaa';
            ctx.fillRect(9, 9 + by, 3, 3);
            ctx.fillStyle = '#111';
            ctx.fillRect(9, 10 + by, 2, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, 9 + by, 1, 1);
            ctx.fillStyle = hair;
            ctx.fillRect(8, 8 + by, 5, 1);
            ctx.fillStyle = skShade;
            ctx.fillRect(7, 12 + by, 2, 2);
            ctx.fillStyle = '#c07060';
            ctx.fillRect(8, 15 + by, 5, 1);
        } else if (dir === 'right') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(19, 9 + by, 4, 3);
            ctx.fillStyle = '#3a5aaa';
            ctx.fillRect(20, 9 + by, 3, 3);
            ctx.fillStyle = '#111';
            ctx.fillRect(21, 10 + by, 2, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(21, 9 + by, 1, 1);
            ctx.fillStyle = hair;
            ctx.fillRect(19, 8 + by, 5, 1);
            ctx.fillStyle = skShade;
            ctx.fillRect(23, 12 + by, 2, 2);
            ctx.fillStyle = '#c07060';
            ctx.fillRect(19, 15 + by, 5, 1);
        }
        // No face for 'up' direction

        // -- Weapon hint (small sword at belt) --
        if (dir === 'down' || dir === 'left') {
            ctx.fillStyle = '#888';
            ctx.fillRect(4, 26 + by, 2, 6);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(4, 26 + by, 2, 1);
            ctx.fillStyle = belt;
            ctx.fillRect(3, 28 + by, 4, 2);
        }

        return c;
    },

    // ── Entity Sprite Generation ────────────

    genEntitySprites() {
        // NPC generic (with color + accessory)
        const npcColors = [
            { hair: '#8a4a2a', shirt: '#aa3a3a', acc: 'hammer', name: 'npc_red' },
            { hair: '#3a3a5a', shirt: '#3a7a3a', acc: 'hood', name: 'npc_green' },
            { hair: '#aa8a4a', shirt: '#6a5a8a', acc: 'staff', name: 'npc_purple' },
            { hair: '#2a2a2a', shirt: '#8a7a5a', acc: null, name: 'npc_tan' },
        ];
        for (const npc of npcColors) {
            this.cache[npc.name] = this.drawNPC(npc.hair, npc.shirt, npc.acc);
        }

        // Merchant — with apron
        this.cache.npc_merchant = this.drawNPC('#aa8a2a', '#2a5a2a', 'apron');

        // Building icons
        this.cache.building_generic = this.drawBuildingIcon();

        // Enemy marker
        this.cache.enemy_marker = this.drawEnemyMarker();
        this.cache.boss_marker = this.drawBossMarker();
    },

    getNPC(npcId) {
        if (npcId && npcId.includes('merchant')) return this.cache.npc_merchant;
        if (npcId && npcId.includes('blacksmith')) return this.cache.npc_red;
        if (npcId && npcId.includes('herbalist')) return this.cache.npc_green;
        if (npcId && npcId.includes('innkeeper')) return this.cache.npc_purple;
        const variants = ['npc_red', 'npc_green', 'npc_purple', 'npc_tan'];
        const idx = npcId ? this.hash(npcId.length, npcId.charCodeAt(0) || 0) % variants.length : 0;
        return this.cache[variants[idx]];
    },

    drawNPC(hairColor, shirtColor, accessory) {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const sk = this.PAL.skin[1];
        const skShade = '#b08060';
        const cx = 16;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(cx, 40, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs + boots
        ctx.fillStyle = '#4a4040';
        ctx.fillRect(8, 28, 6, 8);
        ctx.fillRect(18, 28, 6, 8);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(7, 35, 7, 4);
        ctx.fillRect(17, 35, 7, 4);
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(8, 35, 5, 1);
        ctx.fillRect(18, 35, 5, 1);

        // Body
        ctx.fillStyle = shirtColor;
        ctx.fillRect(7, 17, 18, 12);
        // Shirt shade
        const shDk = this._darken(shirtColor, 0.7);
        ctx.fillStyle = shDk;
        ctx.fillRect(7, 17, 3, 12);
        ctx.fillRect(22, 17, 3, 12);

        // Belt
        ctx.fillStyle = '#5a4a30';
        ctx.fillRect(7, 27, 18, 2);

        // Arms
        ctx.fillStyle = shirtColor;
        ctx.fillRect(2, 18, 5, 10);
        ctx.fillRect(25, 18, 5, 10);
        ctx.fillStyle = sk;
        ctx.fillRect(2, 26, 5, 3);
        ctx.fillRect(25, 26, 5, 3);

        // Neck
        ctx.fillStyle = sk;
        ctx.fillRect(12, 14, 8, 4);

        // Head
        ctx.fillStyle = sk;
        ctx.fillRect(7, 3, 18, 14);
        ctx.fillStyle = skShade;
        ctx.fillRect(7, 5, 2, 10);
        ctx.fillRect(23, 5, 2, 10);

        // Hair
        ctx.fillStyle = hairColor;
        ctx.fillRect(5, 1, 22, 7);
        ctx.fillRect(5, 4, 4, 7);
        ctx.fillRect(23, 4, 4, 7);
        // Hair highlight
        const hairHi = this._lighten(hairColor, 1.3);
        ctx.fillStyle = hairHi;
        ctx.fillRect(10, 2, 12, 3);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(10, 9, 4, 3);
        ctx.fillRect(18, 9, 4, 3);
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(11, 9, 3, 3);
        ctx.fillRect(19, 9, 3, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(12, 10, 2, 2);
        ctx.fillRect(20, 10, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(11, 9, 1, 1);
        ctx.fillRect(19, 9, 1, 1);

        // Eyebrows
        ctx.fillStyle = hairColor;
        ctx.fillRect(9, 8, 5, 1);
        ctx.fillRect(18, 8, 5, 1);

        // Nose
        ctx.fillStyle = skShade;
        ctx.fillRect(15, 12, 2, 2);

        // Mouth
        ctx.fillStyle = '#c07060';
        ctx.fillRect(13, 15, 6, 1);

        // Accessory-specific details
        if (accessory === 'apron') {
            ctx.fillStyle = '#ddd8d0';
            ctx.fillRect(9, 20, 14, 10);
            ctx.fillStyle = '#ccc5b8';
            ctx.fillRect(11, 22, 10, 6);
        } else if (accessory === 'hammer') {
            ctx.fillStyle = '#666';
            ctx.fillRect(26, 14, 3, 8);
            ctx.fillStyle = '#8a6a3a';
            ctx.fillRect(25, 22, 5, 2);
        } else if (accessory === 'hood') {
            ctx.fillStyle = '#3a5a3a';
            ctx.fillRect(4, 0, 24, 8);
            ctx.fillRect(4, 3, 4, 8);
            ctx.fillRect(24, 3, 4, 8);
        } else if (accessory === 'staff') {
            ctx.fillStyle = '#8a6a3a';
            ctx.fillRect(28, 6, 2, 32);
            ctx.fillStyle = '#aaddff';
            ctx.beginPath();
            ctx.arc(29, 6, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        return c;
    },

    _darken(hex, factor) {
        const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
        return `rgb(${r},${g},${b})`;
    },

    _lighten(hex, factor) {
        const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
        const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
        const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
        return `rgb(${r},${g},${b})`;
    },

    drawBuildingIcon() {
        const c = this.mkCanvas();
        const ctx = c.getContext('2d');
        const T = this.TS;

        // Simple house shape
        ctx.fillStyle = '#8a6a40';
        ctx.fillRect(6, 14, 20, 16);

        // Roof
        ctx.fillStyle = '#aa3a2a';
        ctx.beginPath();
        ctx.moveTo(4, 14);
        ctx.lineTo(16, 4);
        ctx.lineTo(28, 14);
        ctx.closePath();
        ctx.fill();

        // Door
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(12, 20, 8, 10);

        // Window
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(22, 18, 4, 4);

        return c;
    },

    drawEnemyMarker() {
        const W = 28, H = 36;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const cx = 14;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, 34, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark hostile figure
        ctx.fillStyle = '#3a1a1a';
        ctx.fillRect(8, 24, 5, 8);
        ctx.fillRect(15, 24, 5, 8);
        ctx.fillStyle = '#5a1a1a';
        ctx.fillRect(6, 14, 16, 11);
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(2, 15, 5, 9);
        ctx.fillRect(21, 15, 5, 9);
        // Head
        ctx.fillStyle = '#6a3a2a';
        ctx.fillRect(7, 3, 14, 12);
        // Dark hood/mask
        ctx.fillStyle = '#2a0a0a';
        ctx.fillRect(5, 1, 18, 8);
        ctx.fillRect(5, 4, 4, 6);
        ctx.fillRect(19, 4, 4, 6);
        // Glowing red eyes
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(9, 7, 3, 2);
        ctx.fillRect(16, 7, 3, 2);
        ctx.fillStyle = '#ff8888';
        ctx.fillRect(10, 7, 1, 1);
        ctx.fillRect(17, 7, 1, 1);

        return c;
    },

    drawBossMarker() {
        const W = 32, H = 40;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const cx = 16;

        // Ominous glow
        ctx.fillStyle = 'rgba(200,40,40,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, 20, 16, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, 38, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Large armored figure
        ctx.fillStyle = '#2a0a0a';
        ctx.fillRect(9, 26, 6, 10);
        ctx.fillRect(17, 26, 6, 10);
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(5, 14, 22, 14);
        // Armor plates
        ctx.fillStyle = '#5a2a2a';
        ctx.fillRect(7, 16, 18, 4);
        ctx.fillRect(7, 22, 18, 4);
        // Pauldrons
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(1, 13, 7, 8);
        ctx.fillRect(24, 13, 7, 8);
        ctx.fillStyle = '#5a2a2a';
        ctx.fillRect(2, 14, 5, 3);
        ctx.fillRect(25, 14, 5, 3);
        // Head — dark helm with crown
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(8, 2, 16, 13);
        // Crown spikes
        ctx.fillStyle = '#aa6a2a';
        ctx.fillRect(9, 0, 2, 4);
        ctx.fillRect(15, 0, 2, 4);
        ctx.fillRect(21, 0, 2, 4);
        ctx.fillRect(8, 2, 16, 2);
        // Glowing eyes
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(11, 8, 3, 3);
        ctx.fillRect(18, 8, 3, 3);
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(12, 8, 1, 1);
        ctx.fillRect(19, 8, 1, 1);
        // Mouth slit
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(12, 12, 8, 1);

        return c;
    },

    // ── Interaction Indicator ───────────────

    drawInteractPrompt(ctx, x, y, text) {
        const w = ctx.measureText(text).width + 12;
        const h = 18;
        const px = x - w / 2;
        const py = y - 24;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(px, py, w, h, 4);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(200,180,120,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px, py, w, h, 4);
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, py + h / 2);
    },

    // ── Region Tinting (enhanced biome identity) ──

    applyRegionTint(ctx, w, h, region) {
        if (region === 'hollowfen') {
            ctx.fillStyle = 'rgba(15,35,50,0.14)';
            ctx.fillRect(0, 0, w, h);
        } else if (region === 'void_sanctum') {
            ctx.fillStyle = 'rgba(35,10,45,0.2)';
            ctx.fillRect(0, 0, w, h);
        } else if (region === 'ashen_wastes') {
            ctx.fillStyle = 'rgba(40,25,10,0.1)';
            ctx.fillRect(0, 0, w, h);
        }
    },

    // ── Vignette Effect ─────────────────────

    drawVignette(ctx, w, h) {
        const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.65);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
    },

    // ── Dynamic Lighting System ─────────────

    lightSources: [],
    _lightCanvas: null,
    _lightCtx: null,

    collectLightSources(terrain, entityMap, camX, camY, vpW, vpH, TS) {
        this.lightSources = [];
        if (!terrain) return;

        const startTX = Math.floor(camX / TS) - 2;
        const startTY = Math.floor(camY / TS) - 2;
        const endTX = Math.ceil((camX + vpW) / TS) + 2;
        const endTY = Math.ceil((camY + vpH) / TS) + 2;
        const mapH = terrain.length;
        const mapW = terrain[0] ? terrain[0].length : 0;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = terrain[ty][tx];

                // Campfires emit strong warm light (large radius for dramatic glow)
                if (ch === 'F') {
                    const flicker = 0.9 + Math.sin(this.animFrame * 2.1 + tx * 3.7) * 0.1;
                    this.lightSources.push({
                        x: tx * TS + TS / 2 - camX,
                        y: ty * TS + TS / 2 - camY,
                        radius: 220 * flicker,
                        color: [255, 160, 60],
                        intensity: 0.85 * flicker
                    });
                }
                // Lanterns emit warm glow
                if (ch === 'L') {
                    this.lightSources.push({
                        x: tx * TS + TS / 2 - camX,
                        y: ty * TS + TS / 2 - camY,
                        radius: 160,
                        color: [255, 200, 80],
                        intensity: 0.6
                    });
                }
                // Ember roots glow warmly
                if (ch === 'E') {
                    this.lightSources.push({
                        x: tx * TS + TS / 2 - camX,
                        y: ty * TS + TS / 2 - camY,
                        radius: 90,
                        color: [220, 100, 30],
                        intensity: 0.4
                    });
                }
                // Veil crystals emit eerie purple light
                if (ch === 'V') {
                    const pulse = 0.8 + Math.sin(this.animFrame * 1.5 + tx * 2.3) * 0.2;
                    this.lightSources.push({
                        x: tx * TS + TS / 2 - camX,
                        y: ty * TS + TS / 2 - camY,
                        radius: 120 * pulse,
                        color: [150, 80, 220],
                        intensity: 0.5 * pulse
                    });
                }
            }
        }

        // Entity-based lights (campfire entities — dramatic large glow)
        for (const key in entityMap) {
            const entity = entityMap[key];
            if (entity.type === 'campfire') {
                const [ex, ey] = key.split(',').map(Number);
                const flicker = 0.85 + Math.sin(this.animFrame * 2.5 + ex * 4.1) * 0.15;
                this.lightSources.push({
                    x: ex * TS + TS / 2 - camX,
                    y: ey * TS + TS / 2 - camY,
                    radius: 260 * flicker,
                    color: [255, 140, 50],
                    intensity: 0.9 * flicker
                });
            }
        }
    },

    drawLighting(ctx, w, h, region) {
        // Determine ambient darkness level by region
        let ambientDark = 0.25; // base darkness
        if (region === 'void_sanctum') ambientDark = 0.4;
        else if (region === 'hollowfen') ambientDark = 0.3;

        // Create or reuse offscreen lighting canvas
        if (!this._lightCanvas || this._lightCanvas.width !== w || this._lightCanvas.height !== h) {
            this._lightCanvas = document.createElement('canvas');
            this._lightCanvas.width = w;
            this._lightCanvas.height = h;
            this._lightCtx = this._lightCanvas.getContext('2d');
        }

        const lctx = this._lightCtx;

        // Fill with ambient darkness
        lctx.globalCompositeOperation = 'source-over';
        lctx.fillStyle = `rgba(0,0,0,${ambientDark})`;
        lctx.fillRect(0, 0, w, h);

        // Cut out light circles (additive blending to remove darkness)
        lctx.globalCompositeOperation = 'destination-out';
        for (const light of this.lightSources) {
            const grd = lctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            grd.addColorStop(0, `rgba(0,0,0,${light.intensity})`);
            grd.addColorStop(0.5, `rgba(0,0,0,${light.intensity * 0.4})`);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            lctx.fillStyle = grd;
            lctx.fillRect(light.x - light.radius, light.y - light.radius,
                light.radius * 2, light.radius * 2);
        }

        // Player emits a personal light (wider radius for visibility)
        const px = w / 2, py = h / 2;
        const playerGrd = lctx.createRadialGradient(px, py, 0, px, py, 130);
        playerGrd.addColorStop(0, 'rgba(0,0,0,0.45)');
        playerGrd.addColorStop(0.6, 'rgba(0,0,0,0.15)');
        playerGrd.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = playerGrd;
        lctx.fillRect(px - 130, py - 130, 260, 260);

        // Apply darkness overlay to main canvas
        ctx.drawImage(this._lightCanvas, 0, 0);

        // Colored light glows — warm tint cast on surrounding tiles
        lctx.globalCompositeOperation = 'source-over';
        lctx.clearRect(0, 0, w, h);
        for (const light of this.lightSources) {
            const grd = lctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius * 0.8
            );
            const [r, g, b] = light.color;
            grd.addColorStop(0, `rgba(${r},${g},${b},${(light.intensity * 0.25).toFixed(3)})`);
            grd.addColorStop(0.4, `rgba(${r},${g},${b},${(light.intensity * 0.12).toFixed(3)})`);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            lctx.fillStyle = grd;
            lctx.fillRect(light.x - light.radius, light.y - light.radius,
                light.radius * 2, light.radius * 2);
        }
        ctx.drawImage(this._lightCanvas, 0, 0);
    },

    // ── Ambient Particle System ─────────────

    ambientParticles: [],
    _ambientTimer: 0,
    _currentBiome: null,

    updateAmbientParticles(dt, region, camX, camY, vpW, vpH) {
        this._ambientTimer += dt;

        // Spawn new ambient particles periodically
        const spawnRate = region === 'void_sanctum' ? 0.08 : 0.15;
        if (this._ambientTimer >= spawnRate) {
            this._ambientTimer -= spawnRate;
            this.spawnAmbientParticle(region, camX, camY, vpW, vpH);
        }

        // Update existing particles
        for (let i = this.ambientParticles.length - 1; i >= 0; i--) {
            const p = this.ambientParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Slight wave motion
            if (p.wave) {
                p.x += Math.sin(p.life * p.waveFreq + p.waveOffset) * p.waveAmp * dt;
            }

            p.life -= dt;
            if (p.life <= 0) {
                this.ambientParticles.splice(i, 1);
            }
        }

        // Cap particle count
        while (this.ambientParticles.length > 80) {
            this.ambientParticles.shift();
        }
    },

    spawnAmbientParticle(region, camX, camY, vpW, vpH) {
        const worldX = camX + Math.random() * vpW;
        const worldY = camY + Math.random() * vpH;

        if (region === 'ashen_wastes') {
            // Drifting ash particles — rise slowly
            this.ambientParticles.push({
                x: worldX, y: worldY,
                vx: (Math.random() - 0.5) * 15,
                vy: -8 - Math.random() * 12,
                life: 3 + Math.random() * 3,
                maxLife: 3 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#8a7a6a' : '#6a5a4a',
                size: 1 + Math.random() * 2,
                wave: true,
                waveFreq: 2 + Math.random() * 2,
                waveAmp: 8 + Math.random() * 5,
                waveOffset: Math.random() * 6.28
            });
        } else if (region === 'hollowfen') {
            // Fog wisps — slow horizontal drift
            this.ambientParticles.push({
                x: worldX, y: worldY,
                vx: 5 + Math.random() * 10,
                vy: (Math.random() - 0.5) * 3,
                life: 4 + Math.random() * 4,
                maxLife: 4 + Math.random() * 4,
                color: 'rgba(120,150,170,0.15)',
                size: 6 + Math.random() * 10,
                wave: true,
                waveFreq: 0.5 + Math.random(),
                waveAmp: 3,
                waveOffset: Math.random() * 6.28,
                isBlob: true
            });
        } else if (region === 'void_sanctum') {
            // Corruption motes — erratic, purple
            this.ambientParticles.push({
                x: worldX, y: worldY,
                vx: (Math.random() - 0.5) * 20,
                vy: -5 + (Math.random() - 0.5) * 15,
                life: 2 + Math.random() * 3,
                maxLife: 2 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#8a3aaa' : '#6a2a8a',
                size: 1 + Math.random() * 2.5,
                wave: true,
                waveFreq: 3 + Math.random() * 3,
                waveAmp: 12 + Math.random() * 8,
                waveOffset: Math.random() * 6.28
            });
        }
    },

    drawAmbientParticles(ctx, camX, camY) {
        for (const p of this.ambientParticles) {
            const alpha = Math.min(1, (p.life / p.maxLife) * 2) * Math.min(1, p.life);
            if (alpha <= 0) continue;

            const sx = p.x - camX;
            const sy = p.y - camY;

            if (p.isBlob) {
                // Fog blob
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(sx, sy, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillStyle = p.color;
                ctx.fillRect(sx, sy, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    },

    // ── Gathering Particles ─────────────────

    particles: [],

    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 60,
                vy: -Math.random() * 40 - 20,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
                color,
                size: 2 + Math.random() * 2
            });
        }
    },

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 80 * dt; // gravity
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    },

    drawParticles(ctx, camX, camY) {
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - camX, p.y - camY, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
};
