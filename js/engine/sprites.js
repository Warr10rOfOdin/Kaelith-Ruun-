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
        // Grass — muted dark fantasy greens, not candy/bright
        grass:   ['#2d5a22','#35662a','#3d6e30','#456a2a','#2a5520','#3a6828','#325e24'],
        // Path — worn, dusty, darker
        path:    ['#6a5a42','#5e5038','#7a6a50','#544830'],
        // Water — deeper, moodier
        water:   ['#15466a','#1e5578','#286686','#1a3a5a'],
        // Wall / Stone — darker, grittier
        wall:    ['#3a3838','#2e2e2e','#484646','#424040'],
        // Tree — darker canopy, less saturated
        trunk:   ['#4a3018','#5a3a22','#3a2010'],
        leaves:  ['#155508','#1e6610','#18580c','#287020','#347a2a','#3e8a34'],
        // Rock — darker grays
        rock:    ['#555555','#656565','#4a4a4a','#707070'],
        // Iron
        iron:    ['#7a5a3a','#8a6a4a','#6a4a2a','#9a7a5a'],
        // Ember
        ember:   ['#aa4422','#cc5533','#ee7744','#ffaa66'],
        // Crystal
        crystal: ['#6a3a8a','#8a5aaa','#aa7acc','#cc9aee'],
        // Fire
        fire:    ['#ff6600','#ffaa00','#ff4400','#ffcc33','#ff8800'],
        // Skin — Kaelith Ruun infernal red
        skin:    ['#c04030','#a83828','#882820'],
        // Wood — darker
        wood:    ['#4a3018','#5a3a22','#6a4a30'],
        // Shadow silk
        shadow:  ['#2a2a3a','#3a3a4a','#1a1a2a','#4a4a5a'],
        // Herb — muted
        herb:    ['#225520','#2a6828','#328a32'],
        // Fence
        fence:   ['#5a3a20','#6a4a2a','#4a3018'],
        // Soil
        soil:    ['#3a2818','#4a3828','#2a1810'],
        // Wheat
        wheat:   ['#b89838','#c8a848','#a88828'],
        // Mushroom
        mush:    ['#aa2828','#cc3838','#e8e0d8'],
        // Bone
        bone:    ['#c8c0b0','#b8b0a0','#d8d0c0'],
        // Lantern
        lantern: ['#e8b800','#f0cc30','#d89800'],
        // Void
        void_:   ['#3a1a4a','#5a2a6a','#7a3a8a','#9a4aaa'],
        // Pine — darker
        pine:    ['#082e08', '#143e14', '#0c320c', '#1e4a18'],
        // Dead Wood
        deadwood: ['#4a3a2a', '#3a2a1a', '#5a4a38', '#302218'],
        // Hill — muted
        hill:    ['#4a6430', '#3e5828', '#587438', '#627e48'],
        // Flower — slightly desaturated
        flower:  ['#c05888', '#d870a8', '#e888c0', '#8838cc', '#d89028', '#d85858'],
        // Tall Grass — muted
        tallgrass: ['#3a7030', '#4a8038', '#306828', '#508848'],
        // Pond — deeper
        pond:    ['#143a62', '#1e4a72', '#285a82', '#103054'],
        // Cave
        cave:    ['#141414', '#222222', '#2e2e2e', '#0e0e0e']
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
        for (let v = 0; v < 3; v++) {
            this.cache[`pine_${v}`] = this.drawPineTree(v);
        }
        for (let v = 0; v < 2; v++) {
            this.cache[`deadtree_${v}`] = this.drawDeadTree(v);
        }
        for (let v = 0; v < 3; v++) {
            this.cache[`hill_${v}`] = this.drawHill(v);
        }
        for (let v = 0; v < 4; v++) {
            this.cache[`tallgrass_${v}`] = this.drawTallGrass(v);
        }
        for (let v = 0; v < 3; v++) {
            this.cache[`flower_${v}`] = this.drawWildflower(v);
        }
        this.cache.pond = this.drawPond();
        this.cache.cave = this.drawCaveEntrance();

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
        this.cache.altar = this.drawAltar();
        this.cache.broken_cart = this.drawBrokenCart();
        this.cache.signpost = this.drawSignpost();
        this.cache.ritual_circle = this.drawRitualCircle();
        this.cache.banner = this.drawBanner();
        this.cache.skeleton = this.drawSkeleton();
        this.cache.barricade = this.drawBarricade();

        // Scorched village tiles
        for (let v = 0; v < 4; v++) {
            this.cache[`ash_${v}`] = this.drawAshGround(v);
        }
        for (let v = 0; v < 3; v++) {
            this.cache[`charred_${v}`] = this.drawCharredGround(v);
        }
        for (let v = 0; v < 2; v++) {
            this.cache[`rubble_${v}`] = this.drawRubblePile(v);
        }
        this.cache.burned_timber = this.drawBurnedTimber();
        this.cache.smoke_vent = this.drawSmokeVent();
        this.cache.scorched_wall = this.drawScorchedWall();
        this.cache.collapsed_roof = this.drawCollapsedRoof();
        for (let v = 0; v < 3; v++) {
            this.cache[`ashpile_${v}`] = this.drawAshPile(v);
        }

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
            case 'P': return this.cache[`pine_${h % 3}`];
            case 'K': return this.cache[`deadtree_${h % 2}`];
            case 'h': return this.cache[`hill_${h % 3}`];
            case 'g': return this.cache[`tallgrass_${h % 4}`];
            case 'w': return this.cache[`flower_${h % 3}`];
            case 'O': return this.cache.pond;
            case 'c': return this.cache.cave;
            case 'A': return this.cache.altar;
            case 'Y': return this.cache.broken_cart;
            case 'Z': return this.cache.signpost;
            case 'Q': return this.cache.ritual_circle;
            case 'N': return this.cache.banner;
            case 'J': return this.cache.skeleton;
            case 'U': return this.cache.barricade;
            // Scorched village tiles
            case 'a': return this.cache[`ash_${h % 4}`];
            case 'd': return this.cache[`charred_${h % 3}`];
            case 'r': return this.cache[`rubble_${h % 2}`];
            case 'l': return this.cache.burned_timber;
            case 'v': return this.cache.smoke_vent;
            case 'e': return this.cache.scorched_wall;
            case 'k': return this.cache.collapsed_roof;
            case 'o': return this.cache[`ashpile_${h % 3}`];
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

        // Wall background — dark stone
        ctx.fillStyle = this.PAL.wall[0];
        ctx.fillRect(0, 0, T, T);

        // Door frame — dark iron-banded
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(6, 2, 20, 28);
        // Iron bands on frame
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(6, 4, 20, 1);
        ctx.fillRect(6, 26, 20, 1);

        // Door — heavy dark wood
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(8, 4, 16, 24);
        ctx.fillStyle = '#3a2410';
        ctx.fillRect(8, 4, 16, 1);

        // Wood grain — subtle
        ctx.fillStyle = '#3a2410';
        ctx.fillRect(10, 8, 12, 1);
        ctx.fillRect(10, 16, 12, 1);
        ctx.fillRect(10, 22, 12, 1);

        // Iron handle — bronze
        ctx.fillStyle = '#8a6a2a';
        ctx.fillRect(20, 14, 2, 4);
        ctx.fillStyle = '#aa8a3a';
        ctx.fillRect(20, 15, 2, 1);

        // Warm light leaking under door
        ctx.fillStyle = 'rgba(255,140,50,0.15)';
        ctx.fillRect(8, 26, 16, 2);

        // Threshold — worn stone
        ctx.fillStyle = '#3a3838';
        ctx.fillRect(6, 28, 20, 4);

        return c;
    },

    drawChest() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;

        ctx.fillStyle = this.PAL.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Shadow — deeper
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(16, 26, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chest body — dark aged wood
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(6, 14, 20, 12);
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(6, 14, 20, 2);

        // Chest lid — dark
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(5, 10, 22, 6);
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(5, 10, 22, 1);

        // Iron bands — dark metal
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(5, 10, 22, 1);
        ctx.fillRect(5, 15, 22, 1);
        ctx.fillRect(5, 25, 22, 1);
        // Band rivets
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(7, 15, 1, 1); ctx.fillRect(24, 15, 1, 1);
        ctx.fillRect(7, 10, 1, 1); ctx.fillRect(24, 10, 1, 1);

        // Lock — bronze with faint glow
        ctx.fillStyle = '#8a6a2a';
        ctx.fillRect(14, 13, 4, 5);
        ctx.fillStyle = '#aa8a3a';
        ctx.fillRect(15, 14, 2, 2);
        // Lock glow hint
        ctx.fillStyle = 'rgba(200,160,60,0.1)';
        ctx.beginPath(); ctx.arc(16, 15, 4, 0, Math.PI * 2); ctx.fill();

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

    // ── Narrative Props ─────────────────────

    drawAltar() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        // Grass base
        ctx.fillStyle = this.PAL.grass[2]; ctx.fillRect(0, 0, T, T);
        // Dark stone floor
        ctx.fillStyle = '#3a3a4a'; ctx.fillRect(4, 10, 24, 18);
        // Altar body
        ctx.fillStyle = '#5a5a6a'; ctx.fillRect(8, 8, 16, 14);
        ctx.fillStyle = '#6a6a7a'; ctx.fillRect(9, 9, 14, 4);
        // Top slab
        ctx.fillStyle = '#7a7a8a'; ctx.fillRect(6, 6, 20, 4);
        ctx.fillStyle = '#8a8aaa'; ctx.fillRect(8, 6, 16, 2);
        // Carved runes (glowing)
        ctx.fillStyle = '#aa66ff';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(10, 14, 2, 2); ctx.fillRect(14, 14, 2, 2);
        ctx.fillRect(18, 14, 2, 2); ctx.fillRect(12, 18, 2, 1);
        ctx.fillRect(16, 18, 2, 1);
        ctx.globalAlpha = 1;
        // Candles
        ctx.fillStyle = '#eee'; ctx.fillRect(7, 3, 2, 3); ctx.fillRect(23, 3, 2, 3);
        ctx.fillStyle = '#ffaa00'; ctx.fillRect(7, 2, 2, 2); ctx.fillRect(23, 2, 2, 2);
        return c;
    },

    drawBrokenCart() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        ctx.fillStyle = this.PAL.grass[1]; ctx.fillRect(0, 0, T, T);
        // Cart body (broken, tilted)
        ctx.fillStyle = '#5a4a3a'; ctx.fillRect(4, 12, 20, 10);
        ctx.fillStyle = '#6a5a4a'; ctx.fillRect(5, 13, 18, 4);
        // Broken side
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(22, 14, 3, 8); ctx.fillRect(24, 12, 2, 6);
        // Wheel (broken)
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath(); ctx.arc(8, 24, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath(); ctx.arc(8, 24, 3, 0, Math.PI * 2); ctx.fill();
        // Second wheel (fallen off)
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath(); ctx.arc(24, 26, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath(); ctx.arc(24, 26, 2, 0, Math.PI * 2); ctx.fill();
        // Spilled cargo
        ctx.fillStyle = '#8a7a5a'; ctx.fillRect(14, 22, 4, 3);
        ctx.fillStyle = '#7a6a4a'; ctx.fillRect(10, 24, 3, 3);
        ctx.fillStyle = '#6a8a4a'; ctx.fillRect(18, 23, 3, 2);
        return c;
    },

    drawSignpost() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        ctx.fillStyle = this.PAL.grass[1]; ctx.fillRect(0, 0, T, T);
        // Post
        ctx.fillStyle = '#5a4a3a'; ctx.fillRect(14, 10, 4, 22);
        ctx.fillStyle = '#6a5a4a'; ctx.fillRect(15, 10, 2, 20);
        // Sign boards (pointing different directions)
        ctx.fillStyle = '#6a5a3a'; ctx.fillRect(8, 6, 18, 6);
        ctx.fillStyle = '#7a6a4a'; ctx.fillRect(9, 7, 16, 4);
        // Arrow direction
        ctx.fillStyle = '#4a3a2a';
        ctx.beginPath();
        ctx.moveTo(26, 9); ctx.lineTo(28, 9); ctx.lineTo(26, 12); ctx.fill();
        // Second sign
        ctx.fillStyle = '#5a4a2a'; ctx.fillRect(4, 13, 14, 5);
        ctx.fillStyle = '#6a5a3a'; ctx.fillRect(5, 14, 12, 3);
        // Text scratches
        ctx.fillStyle = '#3a2a1a'; ctx.globalAlpha = 0.4;
        ctx.fillRect(10, 8, 8, 1); ctx.fillRect(11, 10, 6, 1);
        ctx.fillRect(6, 15, 6, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawRitualCircle() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        ctx.fillStyle = this.PAL.grass[0]; ctx.fillRect(0, 0, T, T);
        // Darkened ground
        ctx.fillStyle = '#2a2a2a'; ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(T/2, T/2, 14, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Outer circle (carved stones)
        ctx.strokeStyle = '#6a5a7a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(T/2, T/2, 12, 0, Math.PI * 2); ctx.stroke();
        // Inner runes (glowing purple)
        ctx.strokeStyle = '#8a4aaa'; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(T/2, T/2, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        // Rune marks
        ctx.fillStyle = '#aa66cc'; ctx.globalAlpha = 0.5;
        ctx.fillRect(T/2-1, 6, 2, 3); ctx.fillRect(T/2-1, T-9, 2, 3);
        ctx.fillRect(6, T/2-1, 3, 2); ctx.fillRect(T-9, T/2-1, 3, 2);
        ctx.globalAlpha = 1;
        return c;
    },

    drawBanner() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        ctx.fillStyle = this.PAL.grass[1]; ctx.fillRect(0, 0, T, T);
        // Pole
        ctx.fillStyle = '#4a4a4a'; ctx.fillRect(14, 2, 4, 30);
        ctx.fillStyle = '#5a5a5a'; ctx.fillRect(15, 2, 2, 28);
        // Banner cloth (tattered)
        ctx.fillStyle = '#8a2222'; ctx.fillRect(18, 4, 10, 14);
        ctx.fillStyle = '#aa3333'; ctx.fillRect(19, 5, 8, 6);
        // Torn edge
        ctx.fillStyle = '#8a2222';
        ctx.fillRect(18, 17, 8, 2); ctx.fillRect(20, 19, 5, 2);
        ctx.fillRect(22, 21, 3, 1);
        // Symbol on banner
        ctx.fillStyle = '#cc9944'; ctx.globalAlpha = 0.7;
        ctx.fillRect(21, 7, 4, 4);
        ctx.fillRect(22, 6, 2, 1); ctx.fillRect(22, 11, 2, 1);
        ctx.globalAlpha = 1;
        // Pole top
        ctx.fillStyle = '#6a6a6a'; ctx.fillRect(13, 0, 6, 3);
        return c;
    },

    drawSkeleton() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        ctx.fillStyle = this.PAL.grass[0]; ctx.fillRect(0, 0, T, T);
        const b = this.PAL.bone;
        // Ribcage (collapsed)
        ctx.fillStyle = b[0]; ctx.fillRect(8, 14, 16, 8);
        ctx.fillStyle = b[1]; ctx.fillRect(10, 15, 12, 6);
        // Ribs
        ctx.fillStyle = b[2];
        ctx.fillRect(10, 15, 12, 1); ctx.fillRect(10, 17, 12, 1);
        ctx.fillRect(10, 19, 12, 1);
        // Skull
        ctx.fillStyle = b[0];
        ctx.beginPath(); ctx.ellipse(12, 10, 5, 4, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b[2];
        ctx.beginPath(); ctx.ellipse(12, 10, 4, 3, -0.2, 0, Math.PI * 2); ctx.fill();
        // Eye sockets
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(10, 9, 2, 2); ctx.fillRect(13, 9, 2, 2);
        // Arm bones
        ctx.fillStyle = b[0];
        ctx.fillRect(4, 16, 6, 2); ctx.fillRect(22, 18, 7, 2);
        // Leg bones
        ctx.fillRect(10, 22, 2, 8); ctx.fillRect(20, 22, 2, 7);
        // Scattered gear
        ctx.fillStyle = '#6a6a7a'; ctx.fillRect(26, 12, 3, 8); // rusted sword
        ctx.fillStyle = '#8a8a9a'; ctx.fillRect(26, 12, 3, 1);
        return c;
    },

    drawBarricade() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        ctx.fillStyle = this.PAL.grass[1]; ctx.fillRect(0, 0, T, T);
        const w = this.PAL.wood;
        // Horizontal logs
        ctx.fillStyle = w[0]; ctx.fillRect(2, 10, 28, 5);
        ctx.fillStyle = w[1]; ctx.fillRect(3, 11, 26, 3);
        ctx.fillStyle = w[0]; ctx.fillRect(2, 18, 28, 5);
        ctx.fillStyle = w[1]; ctx.fillRect(3, 19, 26, 3);
        // Vertical supports
        ctx.fillStyle = w[2]; ctx.fillRect(6, 6, 4, 22);
        ctx.fillStyle = w[0]; ctx.fillRect(7, 7, 2, 20);
        ctx.fillStyle = w[2]; ctx.fillRect(22, 6, 4, 22);
        ctx.fillStyle = w[0]; ctx.fillRect(23, 7, 2, 20);
        // Damage/cracks
        ctx.fillStyle = '#3a2a1a'; ctx.globalAlpha = 0.4;
        ctx.fillRect(14, 11, 6, 1); ctx.fillRect(16, 19, 4, 1);
        ctx.globalAlpha = 1;
        // Rope binding
        ctx.fillStyle = '#8a7a5a';
        ctx.fillRect(6, 10, 4, 2); ctx.fillRect(22, 18, 4, 2);
        return c;
    },

    drawPineTree(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 5000 + 55);

        // Grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.globalAlpha = 0.4;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 2);
        }
        ctx.globalAlpha = 1;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(16, 29, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk (thinner than regular tree)
        ctx.fillStyle = P.trunk[0];
        ctx.fillRect(14, 18, 4, 14);
        ctx.fillStyle = P.trunk[1];
        ctx.fillRect(15, 18, 2, 12);

        // Pine triangular canopy - 3 layers
        const cx = 16 + (variant - 1);
        // Bottom layer (widest)
        ctx.fillStyle = P.pine[0];
        ctx.beginPath();
        ctx.moveTo(cx - 12, 22);
        ctx.lineTo(cx, 12);
        ctx.lineTo(cx + 12, 22);
        ctx.closePath();
        ctx.fill();
        // Middle layer
        ctx.fillStyle = P.pine[1];
        ctx.beginPath();
        ctx.moveTo(cx - 9, 17);
        ctx.lineTo(cx, 7);
        ctx.lineTo(cx + 9, 17);
        ctx.closePath();
        ctx.fill();
        // Top layer
        ctx.fillStyle = P.pine[2];
        ctx.beginPath();
        ctx.moveTo(cx - 6, 12);
        ctx.lineTo(cx, 2);
        ctx.lineTo(cx + 6, 12);
        ctx.closePath();
        ctx.fill();
        // Highlight
        ctx.fillStyle = P.pine[3];
        ctx.beginPath();
        ctx.moveTo(cx - 3, 8);
        ctx.lineTo(cx, 3);
        ctx.lineTo(cx + 3, 8);
        ctx.closePath();
        ctx.fill();
        // Snow/detail on variant 2
        if (variant === 2) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(cx - 3, 5, 6, 1);
            ctx.fillRect(cx - 5, 10, 4, 1);
            ctx.globalAlpha = 1;
        }
        return c;
    },

    drawDeadTree(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 6000 + 33);

        // Grass base
        ctx.fillStyle = P.grass[4];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 2);
        }
        ctx.globalAlpha = 1;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(16, 28, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gnarled trunk
        ctx.fillStyle = P.deadwood[0];
        ctx.fillRect(13, 10, 6, 20);
        ctx.fillStyle = P.deadwood[1];
        ctx.fillRect(14, 10, 4, 18);

        // Bare branches
        ctx.strokeStyle = P.deadwood[2];
        ctx.lineWidth = 2;
        // Right branch
        ctx.beginPath();
        ctx.moveTo(17, 14);
        ctx.lineTo(24, 8);
        ctx.lineTo(27, 5);
        ctx.stroke();
        // Left branch
        ctx.beginPath();
        ctx.moveTo(15, 12);
        ctx.lineTo(8, 6);
        ctx.lineTo(5, 3);
        ctx.stroke();
        // Small twig
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(16, 18);
        ctx.lineTo(22, 16);
        ctx.stroke();

        // Bark cracks
        ctx.fillStyle = P.deadwood[3];
        ctx.fillRect(14, 15, 4, 1);
        ctx.fillRect(15, 22, 2, 1);

        return c;
    },

    drawHill(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 7000 + 77);

        // Base grass
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Hill mound
        ctx.fillStyle = P.hill[variant % P.hill.length];
        ctx.beginPath();
        ctx.ellipse(16, 20, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lighter top
        ctx.fillStyle = P.hill[3];
        ctx.beginPath();
        ctx.ellipse(14, 16, 10, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Grass on hill
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = ['#6a9a4a', '#5a8a3a', '#7aaa5a'][Math.floor(rng() * 3)];
            const x = 6 + Math.floor(rng() * 20);
            const y = 12 + Math.floor(rng() * 12);
            ctx.fillRect(x, y, 1, 2 + Math.floor(rng() * 2));
        }

        // Shadow at base
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(16, 27, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Small rocks on variant 1
        if (variant === 1) {
            ctx.fillStyle = '#7a7a6a';
            ctx.fillRect(8, 22, 3, 2);
            ctx.fillRect(22, 20, 2, 2);
        }

        return c;
    },

    drawTallGrass(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 8000 + 11);

        // Base grass (slightly darker)
        ctx.fillStyle = P.grass[0];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.globalAlpha = 0.4;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 3);
        }
        ctx.globalAlpha = 1;

        // Tall grass blades (many, varied height)
        const colors = P.tallgrass;
        for (let i = 0; i < 18; i++) {
            const x = Math.floor(rng() * (T - 2));
            const baseY = 14 + Math.floor(rng() * 12);
            const h = 8 + Math.floor(rng() * 12);
            const sway = (variant === 0 ? 1 : variant === 1 ? -1 : 0) * Math.floor(rng() * 3);
            ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
            ctx.fillRect(x + sway, baseY - h, 1, h);
            if (rng() > 0.4) ctx.fillRect(x + sway + 1, baseY - h + 2, 1, h - 3);
        }

        // Seeds/tips on some
        if (variant === 2 || variant === 3) {
            ctx.fillStyle = '#ccbb66';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(2 + Math.floor(rng() * 28), 3 + Math.floor(rng() * 8), 2, 2);
            }
        }

        return c;
    },

    drawWildflower(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 9000 + 22);

        // Rich grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.globalAlpha = 0.4;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 2);
        }
        ctx.globalAlpha = 1;

        // Grass blades
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#5a9a3e';
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * (T - 4)), 1, 3 + Math.floor(rng() * 3));
        }

        // Flowers — different colors per variant
        const flowerColors = variant === 0 ? ['#dd66aa', '#ee88cc', '#ff99dd'] :
                             variant === 1 ? ['#ffaa33', '#ffcc55', '#ff8811'] :
                                            ['#aa44ff', '#cc66ff', '#8822dd'];
        for (let i = 0; i < 5 + variant; i++) {
            const fx = 3 + Math.floor(rng() * (T - 6));
            const fy = 6 + Math.floor(rng() * (T - 12));
            // Stem
            ctx.fillStyle = '#3a7a2a';
            ctx.fillRect(fx, fy + 2, 1, 4 + Math.floor(rng() * 3));
            // Petals
            ctx.fillStyle = flowerColors[Math.floor(rng() * flowerColors.length)];
            ctx.beginPath();
            ctx.arc(fx, fy, 2 + rng(), 0, Math.PI * 2);
            ctx.fill();
            // Center
            ctx.fillStyle = '#ffee44';
            ctx.fillRect(fx - 0.5, fy - 0.5, 1, 1);
        }

        return c;
    },

    drawPond() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        // Grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Muddy shore
        ctx.fillStyle = '#5a4a30';
        ctx.beginPath();
        ctx.ellipse(16, 17, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water surface
        ctx.fillStyle = P.pond[0];
        ctx.beginPath();
        ctx.ellipse(16, 16, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Depth variation
        ctx.fillStyle = P.pond[3];
        ctx.beginPath();
        ctx.ellipse(15, 15, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lighter shallows
        ctx.fillStyle = P.pond[2];
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(20, 20, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Highlight/reflection
        ctx.fillStyle = 'rgba(200,230,255,0.3)';
        ctx.fillRect(12, 12, 3, 1);
        ctx.fillRect(14, 11, 2, 1);

        // Lily pad
        ctx.fillStyle = '#2a6a2a';
        ctx.beginPath();
        ctx.ellipse(20, 14, 3, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a8a3a';
        ctx.fillRect(19, 13, 2, 1);

        // Reeds on edge
        ctx.fillStyle = '#4a6a2a';
        ctx.fillRect(6, 6, 1, 6);
        ctx.fillRect(8, 8, 1, 5);
        ctx.fillRect(25, 7, 1, 5);

        return c;
    },

    drawCaveEntrance() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;

        // Rock face background
        ctx.fillStyle = P.rock[2];
        ctx.fillRect(0, 0, T, T);

        // Stone texture
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = P.cave[Math.floor(Math.random() * P.cave.length)];
            ctx.fillRect(Math.random() * T, Math.random() * T, 3 + Math.random() * 5, 2 + Math.random() * 4);
        }

        // Dark cave opening
        ctx.fillStyle = P.cave[3];
        ctx.beginPath();
        ctx.ellipse(16, 18, 10, 12, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(16, 20, 7, 8, 0, 0, Math.PI);
        ctx.fill();

        // Darker interior gradient
        const grd = ctx.createRadialGradient(16, 22, 0, 16, 22, 8);
        grd.addColorStop(0, 'rgba(0,0,0,0.9)');
        grd.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.ellipse(16, 22, 6, 6, 0, 0, Math.PI);
        ctx.fill();

        // Rock overhang (arch)
        ctx.fillStyle = P.rock[0];
        ctx.beginPath();
        ctx.ellipse(16, 12, 12, 8, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = P.rock[1];
        ctx.beginPath();
        ctx.ellipse(16, 12, 10, 6, 0, Math.PI, Math.PI * 2);
        ctx.fill();

        // Highlight on arch
        ctx.fillStyle = P.rock[3];
        ctx.fillRect(10, 8, 6, 1);

        // Moss
        ctx.fillStyle = '#3a5a2a';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(4, 16, 3, 4);
        ctx.fillRect(26, 14, 2, 5);
        ctx.globalAlpha = 1;

        // Stalactite hint at top of entrance
        ctx.fillStyle = P.cave[2];
        ctx.fillRect(13, 12, 1, 3);
        ctx.fillRect(18, 11, 1, 4);

        return c;
    },

    // ── Scorched Village Tile Drawers ──────

    drawAshGround(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const rng = this.seeded(variant * 7100 + 17);
        // Ashy grey-brown base
        const bases = ['#4a4540', '#3e3a35', '#454038', '#3a3632'];
        ctx.fillStyle = bases[variant];
        ctx.fillRect(0, 0, T, T);
        // Mottled ash patches
        const ashColors = ['#5a5550', '#4e4a44', '#565250', '#484440', '#3a3835'];
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = ashColors[Math.floor(rng() * ashColors.length)];
            ctx.globalAlpha = 0.4 + rng() * 0.3;
            const x = Math.floor(rng() * T), y = Math.floor(rng() * T);
            ctx.beginPath();
            ctx.ellipse(x, y, 2 + rng() * 6, 2 + rng() * 5, rng() * 3.14, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Dark char streaks
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = '#2a2622';
            ctx.globalAlpha = 0.3 + rng() * 0.2;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 1 + Math.floor(rng() * 4), 1);
        }
        ctx.globalAlpha = 1;
        // Tiny ember glints (rare)
        if (variant === 0 || variant === 2) {
            ctx.fillStyle = '#aa5522';
            ctx.globalAlpha = 0.3;
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 1, 1);
            ctx.globalAlpha = 1;
        }
        return c;
    },

    drawCharredGround(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const rng = this.seeded(variant * 7200 + 29);
        // Very dark charred base
        const bases = ['#2a2420', '#22201c', '#2e2824'];
        ctx.fillStyle = bases[variant];
        ctx.fillRect(0, 0, T, T);
        // Cracked char texture
        const charColors = ['#1a1816', '#322e28', '#282420', '#201c18'];
        for (let i = 0; i < 10; i++) {
            ctx.fillStyle = charColors[Math.floor(rng() * charColors.length)];
            ctx.globalAlpha = 0.5 + rng() * 0.3;
            const x = Math.floor(rng() * T), y = Math.floor(rng() * T);
            ctx.beginPath();
            ctx.ellipse(x, y, 2 + rng() * 5, 1 + rng() * 4, rng() * 3.14, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Crack lines
        ctx.strokeStyle = '#1a1614';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.floor(rng() * T), Math.floor(rng() * T));
            ctx.lineTo(Math.floor(rng() * T), Math.floor(rng() * T));
            ctx.stroke();
        }
        // Hot ember spots
        if (variant === 1) {
            ctx.fillStyle = '#cc4411';
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.ellipse(16, 16, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        return c;
    },

    drawRubblePile(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const rng = this.seeded(variant * 7300 + 41);
        // Ash ground base
        ctx.fillStyle = '#3e3a35';
        ctx.fillRect(0, 0, T, T);
        // Shadow under pile
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(16, 22, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Rubble stones — mixed sizes
        const stoneColors = ['#5a5555', '#4a4545', '#6a6060', '#3a3535', '#504a48'];
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = stoneColors[Math.floor(rng() * stoneColors.length)];
            const sx = 4 + Math.floor(rng() * 24);
            const sy = 8 + Math.floor(rng() * 18);
            const sw = 3 + Math.floor(rng() * 6);
            const sh = 2 + Math.floor(rng() * 5);
            ctx.beginPath();
            ctx.ellipse(sx, sy, sw / 2, sh / 2, rng() * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Burned wood fragments
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(6 + Math.floor(rng() * 8), 12, 8, 2);
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(14 + Math.floor(rng() * 6), 18, 6, 2);
        // Highlight on top stones
        ctx.fillStyle = '#7a7570';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(10, 10, 3, 1);
        ctx.fillRect(18, 14, 2, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawBurnedTimber() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const rng = this.seeded(7400);
        // Ash ground base
        ctx.fillStyle = '#3e3a35';
        ctx.fillRect(0, 0, T, T);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(16, 24, 13, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Main charred beam (diagonal)
        ctx.save();
        ctx.translate(16, 16);
        ctx.rotate(-0.3);
        // Dark charred wood
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(-14, -3, 28, 6);
        ctx.fillStyle = '#3a2a14';
        ctx.fillRect(-12, -2, 24, 4);
        // Char cracks
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(-8, -1, 1, 2);
        ctx.fillRect(2, -2, 1, 3);
        ctx.fillRect(8, 0, 1, 2);
        // Ember glow at broken end
        ctx.fillStyle = '#cc5520';
        ctx.globalAlpha = 0.25;
        ctx.fillRect(10, -2, 4, 4);
        ctx.globalAlpha = 1;
        ctx.restore();
        // Splinter fragment
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(6, 22, 5, 2);
        return c;
    },

    drawSmokeVent() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        // Charred ground base
        ctx.fillStyle = '#2a2420';
        ctx.fillRect(0, 0, T, T);
        // Darker center
        ctx.fillStyle = '#1a1614';
        ctx.beginPath();
        ctx.ellipse(16, 18, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cracked edges
        ctx.fillStyle = '#3a3430';
        ctx.beginPath();
        ctx.ellipse(16, 18, 10, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Ember ring
        ctx.fillStyle = '#aa4411';
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.ellipse(16, 18, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Hot spots
        ctx.fillStyle = '#dd6622';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(14, 16, 2, 2);
        ctx.fillRect(18, 19, 1, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawScorchedWall() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        // Dark mortar base
        ctx.fillStyle = '#1a1818';
        ctx.fillRect(0, 0, T, T);
        // Blackened stone blocks
        const stoneShades = ['#2a2626', '#322e2e', '#262222', '#3a3434'];
        for (let by = 0; by < 4; by++) {
            for (let bx = 0; bx < 3; bx++) {
                const off = (by % 2 === 0) ? 0 : 5;
                ctx.fillStyle = stoneShades[(bx + by) % stoneShades.length];
                ctx.fillRect(bx * 11 + off + 1, by * 8 + 1, 9, 6);
            }
        }
        // Soot/char staining
        ctx.fillStyle = '#0a0808';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, T, 4);
        ctx.fillRect(0, T - 6, T, 6);
        ctx.globalAlpha = 1;
        // Crack details
        ctx.strokeStyle = '#1a1212';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 2); ctx.lineTo(12, 12); ctx.lineTo(10, 20);
        ctx.stroke();
        // Slight heat stain
        ctx.fillStyle = '#4a2a1a';
        ctx.globalAlpha = 0.15;
        ctx.fillRect(16, 12, 8, 10);
        ctx.globalAlpha = 1;
        return c;
    },

    drawCollapsedRoof() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const rng = this.seeded(7600);
        // Ash base
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(0, 0, T, T);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(16, 20, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Collapsed timber planks (overlapping)
        const woodDark = ['#2a1a0a', '#3a2a14', '#22180c'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = woodDark[i % woodDark.length];
            const angle = -0.5 + rng() * 1.0;
            ctx.save();
            ctx.translate(8 + rng() * 16, 10 + rng() * 12);
            ctx.rotate(angle);
            ctx.fillRect(-8, -2, 16, 3);
            ctx.restore();
        }
        // Tile/thatch fragments
        ctx.fillStyle = '#5a4a3a';
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(4 + Math.floor(rng() * 24), 6 + Math.floor(rng() * 20), 3, 2);
        }
        ctx.globalAlpha = 1;
        // Dust/debris
        ctx.fillStyle = '#6a6055';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(2, 24, 28, 4);
        ctx.globalAlpha = 1;
        return c;
    },

    drawAshPile(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const rng = this.seeded(variant * 7700 + 53);
        // Ash ground
        ctx.fillStyle = '#3e3a35';
        ctx.fillRect(0, 0, T, T);
        // Soft ash mound
        const ashBase = ['#5a5550', '#555048', '#4e4a44'];
        ctx.fillStyle = ashBase[variant];
        ctx.beginPath();
        ctx.ellipse(16, 18, 10 + variant * 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Lighter top
        ctx.fillStyle = '#6a6560';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(15, 16, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Dark edges
        ctx.fillStyle = '#3a3530';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(16, 22, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Fragments in ash
        if (variant === 1) {
            ctx.fillStyle = '#8a7a6a';
            ctx.fillRect(12, 16, 2, 1);
            ctx.fillRect(18, 18, 3, 1);
        }
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
        // Kaelith Ruun — infernal red-skinned demon warrior
        const sk = '#c04030';         // Infernal red skin
        const skShade = '#8a2820';    // Darker red shadow
        const skHi = '#d85040';       // Skin highlight
        const hornColor = '#3a2a1a';  // Dark horn/bone
        const hornHi = '#5a4a38';     // Horn highlight
        const armor = '#2a2228';      // Dark leather/armor
        const armorHi = '#3a3238';    // Armor highlight
        const armorDk = '#1a1418';    // Armor shadow
        const pants = '#2a2020';      // Dark pants
        const pantsDk = '#1a1414';
        const boots_ = '#1a1210';
        const bootsHi = '#3a2a22';
        const belt = '#4a3a22';       // Dark leather belt
        const beltBuckle = '#aa7a2a'; // Bronze/gold buckle
        const markColor = '#1a1018';  // Dark body markings
        const glowColor = '#ff8830';  // Ember-orange weapon glow
        const glowHi = '#ffcc55';     // Hot glow center
        const outline = '#0a0808';    // Very dark outline
        const cx = 16;

        // Animation offsets
        const walkBob = frame === 0 ? 0 : -1;
        const legOff = frame === 0 ? 0 : (frame === 1 ? 2 : -2);
        const armSwing = frame === 0 ? 0 : (frame === 1 ? 3 : -3);
        const by = walkBob;

        // -- Dark cloak (back, shows when facing up) --
        if (dir === 'up') {
            ctx.fillStyle = '#1a1418';
            ctx.fillRect(6, 17 + by, 20, 14);
            ctx.fillStyle = '#2a2228';
            ctx.fillRect(8, 18 + by, 16, 12);
            // Cloak texture lines
            ctx.fillStyle = '#141014';
            ctx.fillRect(12, 20 + by, 1, 8);
            ctx.fillRect(19, 21 + by, 1, 7);
        }

        // -- Legs / Boots --
        const lx1 = dir === 'left' || dir === 'right' ? 10 : 8 - legOff;
        const lx2 = dir === 'left' || dir === 'right' ? 16 + legOff : 18 + legOff;
        ctx.fillStyle = pants;
        ctx.fillRect(lx1, 28 + by, 6, 8);
        ctx.fillRect(lx2, 28 + by, 6, 8);
        ctx.fillStyle = pantsDk;
        ctx.fillRect(lx1, 32 + by, 6, 2);
        ctx.fillRect(lx2, 32 + by, 6, 2);
        // Heavy boots
        ctx.fillStyle = boots_;
        ctx.fillRect(lx1 - 1, 35 + by, 7, 4);
        ctx.fillRect(lx2 - 1, 35 + by, 7, 4);
        ctx.fillStyle = bootsHi;
        ctx.fillRect(lx1, 35 + by, 5, 1);
        ctx.fillRect(lx2, 35 + by, 5, 1);
        // Boot straps
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(lx1, 36 + by, 5, 1);
        ctx.fillRect(lx2, 36 + by, 5, 1);

        // -- Body / Dark Armor --
        ctx.fillStyle = armor;
        ctx.fillRect(7, 17 + by, 18, 12);
        ctx.fillStyle = armorDk;
        ctx.fillRect(7, 17 + by, 3, 12);
        ctx.fillRect(22, 17 + by, 3, 12);
        // Armor highlight — leather chest plate
        ctx.fillStyle = armorHi;
        ctx.fillRect(12, 18 + by, 8, 3);
        // Armor trim / studs
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(10, 21 + by, 1, 1);
        ctx.fillRect(21, 21 + by, 1, 1);
        ctx.fillRect(10, 24 + by, 1, 1);
        ctx.fillRect(21, 24 + by, 1, 1);
        // Belt
        ctx.fillStyle = belt;
        ctx.fillRect(7, 27 + by, 18, 2);
        ctx.fillStyle = beltBuckle;
        ctx.fillRect(14, 27 + by, 4, 2);

        // -- Arms (red skin + armor sleeves) --
        if (dir === 'left') {
            ctx.fillStyle = armorDk;
            ctx.fillRect(22, 18 + by + armSwing, 5, 5);
            ctx.fillStyle = sk;
            ctx.fillRect(22, 23 + by + armSwing, 5, 3);
            ctx.fillStyle = skShade;
            ctx.fillRect(22, 25 + by + armSwing, 5, 3);
            ctx.fillStyle = armor;
            ctx.fillRect(5, 18 + by - armSwing, 5, 5);
            ctx.fillStyle = sk;
            ctx.fillRect(5, 23 + by - armSwing, 5, 3);
            ctx.fillStyle = skShade;
            ctx.fillRect(5, 25 + by - armSwing, 5, 3);
        } else if (dir === 'right') {
            ctx.fillStyle = armorDk;
            ctx.fillRect(5, 18 + by - armSwing, 5, 5);
            ctx.fillStyle = sk;
            ctx.fillRect(5, 23 + by - armSwing, 5, 3);
            ctx.fillStyle = skShade;
            ctx.fillRect(5, 25 + by - armSwing, 5, 3);
            ctx.fillStyle = armor;
            ctx.fillRect(22, 18 + by + armSwing, 5, 5);
            ctx.fillStyle = sk;
            ctx.fillRect(22, 23 + by + armSwing, 5, 3);
            ctx.fillStyle = skShade;
            ctx.fillRect(22, 25 + by + armSwing, 5, 3);
        } else {
            ctx.fillStyle = armor;
            ctx.fillRect(2, 18 + by + armSwing, 5, 5);
            ctx.fillRect(25, 18 + by - armSwing, 5, 5);
            ctx.fillStyle = sk;
            ctx.fillRect(2, 23 + by + armSwing, 5, 3);
            ctx.fillRect(25, 23 + by - armSwing, 5, 3);
            ctx.fillStyle = skShade;
            ctx.fillRect(2, 25 + by + armSwing, 5, 3);
            ctx.fillRect(25, 25 + by - armSwing, 5, 3);
        }

        // -- Neck (red skin) --
        ctx.fillStyle = sk;
        ctx.fillRect(12, 14 + by, 8, 4);
        // Dark neckguard
        ctx.fillStyle = armor;
        ctx.fillRect(11, 16 + by, 10, 2);

        // -- Head (infernal red) --
        ctx.fillStyle = sk;
        ctx.fillRect(7, 4 + by, 18, 12);
        // Darker sides
        ctx.fillStyle = skShade;
        ctx.fillRect(7, 5 + by, 2, 10);
        ctx.fillRect(23, 5 + by, 2, 10);
        // Highlight
        ctx.fillStyle = skHi;
        ctx.fillRect(12, 5 + by, 8, 2);

        // -- Horns --
        ctx.fillStyle = hornColor;
        if (dir !== 'up') {
            // Left horn
            ctx.fillRect(7, 2 + by, 3, 4);
            ctx.fillRect(6, 0 + by, 2, 3);
            // Right horn
            ctx.fillRect(22, 2 + by, 3, 4);
            ctx.fillRect(24, 0 + by, 2, 3);
            // Horn highlights
            ctx.fillStyle = hornHi;
            ctx.fillRect(8, 2 + by, 1, 3);
            ctx.fillRect(23, 2 + by, 1, 3);
        } else {
            ctx.fillRect(6, 2 + by, 3, 4);
            ctx.fillRect(5, 0 + by, 2, 3);
            ctx.fillRect(23, 2 + by, 3, 4);
            ctx.fillRect(25, 0 + by, 2, 3);
            ctx.fillStyle = hornHi;
            ctx.fillRect(7, 2 + by, 1, 3);
            ctx.fillRect(24, 2 + by, 1, 3);
        }

        // -- Body Markings (dark patterns on skin) --
        if (dir === 'down') {
            ctx.fillStyle = markColor;
            ctx.globalAlpha = 0.35;
            // Shoulder marks
            ctx.fillRect(9, 6 + by, 2, 1);
            ctx.fillRect(21, 6 + by, 2, 1);
            // Cheek marks
            ctx.fillRect(9, 12 + by, 2, 1);
            ctx.fillRect(21, 12 + by, 2, 1);
            ctx.globalAlpha = 1;
        }

        // -- Face --
        if (dir === 'down') {
            // Eyes — glowing ember orange
            ctx.fillStyle = '#111';
            ctx.fillRect(10, 9 + by, 4, 3);
            ctx.fillRect(18, 9 + by, 4, 3);
            ctx.fillStyle = glowColor;
            ctx.fillRect(11, 9 + by, 2, 2);
            ctx.fillRect(19, 9 + by, 2, 2);
            ctx.fillStyle = glowHi;
            ctx.fillRect(11, 9 + by, 1, 1);
            ctx.fillRect(19, 9 + by, 1, 1);
            // Eye glow effect
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.15;
            ctx.fillRect(9, 8 + by, 6, 5);
            ctx.fillRect(17, 8 + by, 6, 5);
            ctx.globalAlpha = 1;
            // Brow ridge
            ctx.fillStyle = skShade;
            ctx.fillRect(9, 8 + by, 5, 1);
            ctx.fillRect(18, 8 + by, 5, 1);
            // Nose
            ctx.fillStyle = skShade;
            ctx.fillRect(15, 12 + by, 2, 2);
            // Mouth
            ctx.fillStyle = '#6a2020';
            ctx.fillRect(13, 14 + by, 6, 1);
        } else if (dir === 'left') {
            ctx.fillStyle = '#111';
            ctx.fillRect(9, 9 + by, 4, 3);
            ctx.fillStyle = glowColor;
            ctx.fillRect(9, 9 + by, 2, 2);
            ctx.fillStyle = glowHi;
            ctx.fillRect(9, 9 + by, 1, 1);
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.15;
            ctx.fillRect(8, 8 + by, 6, 5);
            ctx.globalAlpha = 1;
            ctx.fillStyle = skShade;
            ctx.fillRect(8, 8 + by, 5, 1);
            ctx.fillRect(7, 12 + by, 2, 2);
            ctx.fillStyle = '#6a2020';
            ctx.fillRect(8, 14 + by, 5, 1);
        } else if (dir === 'right') {
            ctx.fillStyle = '#111';
            ctx.fillRect(19, 9 + by, 4, 3);
            ctx.fillStyle = glowColor;
            ctx.fillRect(21, 9 + by, 2, 2);
            ctx.fillStyle = glowHi;
            ctx.fillRect(22, 9 + by, 1, 1);
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.15;
            ctx.fillRect(18, 8 + by, 6, 5);
            ctx.globalAlpha = 1;
            ctx.fillStyle = skShade;
            ctx.fillRect(19, 8 + by, 5, 1);
            ctx.fillRect(23, 12 + by, 2, 2);
            ctx.fillStyle = '#6a2020';
            ctx.fillRect(19, 14 + by, 5, 1);
        }

        // -- Glowing Curved Blade (dao) --
        if (dir === 'down' || dir === 'left') {
            // Blade (left side)
            ctx.fillStyle = '#888';
            ctx.fillRect(3, 22 + by, 2, 8);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(3, 22 + by, 2, 1);
            // Ember glow on blade
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(2, 23 + by, 4, 6);
            ctx.globalAlpha = 0.2;
            ctx.fillRect(1, 24 + by, 6, 4);
            ctx.globalAlpha = 1;
            // Hilt
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(2, 28 + by, 4, 2);
            ctx.fillStyle = beltBuckle;
            ctx.fillRect(3, 28 + by, 2, 1);
        } else if (dir === 'right') {
            // Blade (right side)
            ctx.fillStyle = '#888';
            ctx.fillRect(27, 22 + by, 2, 8);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(27, 22 + by, 2, 1);
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(26, 23 + by, 4, 6);
            ctx.globalAlpha = 0.2;
            ctx.fillRect(25, 24 + by, 6, 4);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(26, 28 + by, 4, 2);
            ctx.fillStyle = beltBuckle;
            ctx.fillRect(27, 28 + by, 2, 1);
        }

        // -- Dark cloak glimpse on sides/down --
        if (dir === 'down') {
            ctx.fillStyle = '#1a1418';
            ctx.fillRect(5, 20 + by, 2, 10);
            ctx.fillRect(25, 20 + by, 2, 10);
            ctx.fillStyle = '#141014';
            ctx.fillRect(5, 28 + by, 2, 3);
            ctx.fillRect(25, 28 + by, 2, 3);
        } else if (dir === 'left') {
            ctx.fillStyle = '#1a1418';
            ctx.fillRect(24, 18 + by, 3, 12);
            ctx.fillStyle = '#141014';
            ctx.fillRect(25, 28 + by, 2, 3);
        } else if (dir === 'right') {
            ctx.fillStyle = '#1a1418';
            ctx.fillRect(5, 18 + by, 3, 12);
            ctx.fillStyle = '#141014';
            ctx.fillRect(5, 28 + by, 2, 3);
        }

        // -- 1px dark outline for silhouette readability --
        return this._outlineSprite(c, W, H);
    },

    // ── Entity Sprite Generation ────────────

    genEntitySprites() {
        // Dark fantasy NPC archetypes — distinct silhouette classes
        this.cache.npc_red = this.drawNPCDemonWarrior();       // blacksmith → demon warrior
        this.cache.npc_green = this.drawNPCHuntress();         // herbalist → huntress
        this.cache.npc_purple = this.drawNPCVillageElder();    // innkeeper → village elder
        this.cache.npc_tan = this.drawNPCDarkCultist();        // generic → dark cultist
        this.cache.npc_merchant = this.drawNPCMerchant();      // merchant

        // Building icons
        this.cache.building_generic = this.drawBuildingIcon();

        // Enemy marker
        this.cache.enemy_marker = this.drawEnemyMarker();
        this.cache.boss_marker = this.drawBossMarker();

        // Combat enemy sprites (larger, for combat screen)
        this.cache.combat_void_rat = this.drawCombatEnemy('void_rat');
        this.cache.combat_ashen_wraith = this.drawCombatEnemy('ashen_wraith');
        this.cache.combat_scorched_bandit = this.drawCombatEnemy('scorched_bandit');
        this.cache.combat_ember_hound = this.drawCombatEnemy('ember_hound');
        this.cache.combat_bog_crawler = this.drawCombatEnemy('bog_crawler');
        this.cache.combat_fen_witch = this.drawCombatEnemy('fen_witch');
        this.cache.combat_drowned_knight = this.drawCombatEnemy('drowned_knight');
        this.cache.combat_void_acolyte = this.drawCombatEnemy('void_acolyte');
        this.cache.combat_reality_shard = this.drawCombatEnemy('reality_shard');
        this.cache.combat_shadow_sentinel = this.drawCombatEnemy('shadow_sentinel');
        this.cache.combat_the_ashen_king = this.drawCombatEnemy('the_ashen_king');
        this.cache.combat_mother_of_the_fen = this.drawCombatEnemy('mother_of_the_fen');
        this.cache.combat_ruun_the_unraveler = this.drawCombatEnemy('ruun_the_unraveler');
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

    // ── NPC Archetype: Dark Cultist (hooded, torch, hunched) ──
    drawNPCDarkCultist() {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(16, 40, 10, 3, 0, 0, Math.PI * 2); ctx.fill();

        // Robes — long, dark, concealing legs
        ctx.fillStyle = '#1a1418';
        ctx.fillRect(8, 18, 16, 20);
        ctx.fillStyle = '#221a20';
        ctx.fillRect(10, 18, 12, 18);
        // Robe hem — ragged
        ctx.fillStyle = '#141014';
        ctx.fillRect(7, 35, 3, 3); ctx.fillRect(22, 36, 3, 2);
        ctx.fillRect(12, 37, 2, 1); ctx.fillRect(18, 36, 2, 2);

        // Arms hidden in sleeves
        ctx.fillStyle = '#1a1418';
        ctx.fillRect(3, 19, 5, 12);
        ctx.fillRect(24, 19, 5, 12);
        ctx.fillStyle = '#221a20';
        ctx.fillRect(4, 20, 3, 10);
        ctx.fillRect(25, 20, 3, 10);

        // Hood — large, concealing face
        ctx.fillStyle = '#1a1418';
        ctx.fillRect(5, 0, 22, 12);
        ctx.fillRect(4, 3, 24, 8);
        ctx.fillStyle = '#221a20';
        ctx.fillRect(7, 1, 18, 10);
        // Hood peak
        ctx.fillStyle = '#1a1418';
        ctx.fillRect(13, 0, 6, 2);
        // Face void (dark hole under hood)
        ctx.fillStyle = '#0a0608';
        ctx.fillRect(10, 6, 12, 8);
        ctx.fillStyle = '#050304';
        ctx.fillRect(12, 8, 8, 5);

        // Glowing eyes in shadow
        ctx.fillStyle = '#cc4422';
        ctx.fillRect(12, 9, 2, 2);
        ctx.fillRect(18, 9, 2, 2);
        ctx.fillStyle = '#ff7744';
        ctx.fillRect(12, 9, 1, 1);
        ctx.fillRect(18, 9, 1, 1);
        // Eye glow
        ctx.fillStyle = 'rgba(204,68,34,0.15)';
        ctx.fillRect(10, 8, 12, 5);

        // Torch in right hand
        ctx.fillStyle = '#5a3a18';
        ctx.fillRect(27, 12, 2, 18);
        // Torch head — fire
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(26, 6, 4, 7);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(27, 7, 2, 4);
        ctx.fillStyle = '#ffcc33';
        ctx.fillRect(27, 8, 1, 2);
        // Fire glow
        ctx.fillStyle = 'rgba(255,140,0,0.12)';
        ctx.beginPath(); ctx.arc(28, 9, 8, 0, Math.PI * 2); ctx.fill();

        // Dark belt / cord
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(8, 26, 16, 1);

        return this._outlineSprite(c, W, H);
    },

    // ── NPC Archetype: Demon Warrior (armored, red-skinned, broad) ──
    drawNPCDemonWarrior() {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const sk = '#b83828';
        const skDk = '#8a2018';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(16, 40, 11, 3, 0, 0, Math.PI * 2); ctx.fill();

        // Heavy boots
        ctx.fillStyle = '#1a1210';
        ctx.fillRect(6, 35, 8, 4); ctx.fillRect(18, 35, 8, 4);
        ctx.fillStyle = '#2a1a14';
        ctx.fillRect(7, 35, 6, 1); ctx.fillRect(19, 35, 6, 1);
        // Boot straps
        ctx.fillStyle = '#4a3218';
        ctx.fillRect(7, 36, 6, 1); ctx.fillRect(19, 36, 6, 1);

        // Legs — armored
        ctx.fillStyle = '#2a2028';
        ctx.fillRect(8, 28, 6, 8); ctx.fillRect(18, 28, 6, 8);
        ctx.fillStyle = '#3a2a30';
        ctx.fillRect(9, 28, 4, 6); ctx.fillRect(19, 28, 4, 6);

        // Torso — heavy plate armor
        ctx.fillStyle = '#2a2228';
        ctx.fillRect(5, 16, 22, 13);
        ctx.fillStyle = '#3a3038';
        ctx.fillRect(8, 17, 16, 10);
        // Armor plates
        ctx.fillStyle = '#4a3a40';
        ctx.fillRect(10, 18, 12, 3);
        ctx.fillRect(10, 23, 12, 3);
        // Center chest plate accent
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(14, 19, 4, 2);

        // Pauldrons (broad shoulders)
        ctx.fillStyle = '#2a2228';
        ctx.fillRect(1, 14, 8, 7); ctx.fillRect(23, 14, 8, 7);
        ctx.fillStyle = '#3a3038';
        ctx.fillRect(2, 15, 6, 4); ctx.fillRect(24, 15, 6, 4);
        // Pauldron spikes
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(3, 13, 2, 3); ctx.fillRect(27, 13, 2, 3);

        // Belt
        ctx.fillStyle = '#4a3218';
        ctx.fillRect(5, 27, 22, 2);
        ctx.fillStyle = '#aa7a2a';
        ctx.fillRect(14, 27, 4, 2);

        // Arms — red skin below armor
        ctx.fillStyle = sk;
        ctx.fillRect(1, 20, 5, 8); ctx.fillRect(26, 20, 5, 8);
        ctx.fillStyle = skDk;
        ctx.fillRect(1, 25, 5, 3); ctx.fillRect(26, 25, 5, 3);

        // Neck
        ctx.fillStyle = sk;
        ctx.fillRect(12, 13, 8, 4);

        // Head — red-skinned, angular
        ctx.fillStyle = sk;
        ctx.fillRect(8, 3, 16, 12);
        ctx.fillStyle = skDk;
        ctx.fillRect(8, 4, 2, 10); ctx.fillRect(22, 4, 2, 10);

        // Small horns
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(8, 1, 2, 4); ctx.fillRect(22, 1, 2, 4);
        ctx.fillStyle = '#4a3a28';
        ctx.fillRect(9, 2, 1, 2); ctx.fillRect(22, 2, 1, 2);

        // Eyes — glowing amber
        ctx.fillStyle = '#111';
        ctx.fillRect(10, 8, 4, 3); ctx.fillRect(18, 8, 4, 3);
        ctx.fillStyle = '#ff8830';
        ctx.fillRect(11, 8, 2, 2); ctx.fillRect(19, 8, 2, 2);
        ctx.fillStyle = '#ffcc55';
        ctx.fillRect(11, 8, 1, 1); ctx.fillRect(19, 8, 1, 1);

        // Brow ridge
        ctx.fillStyle = skDk;
        ctx.fillRect(9, 7, 6, 1); ctx.fillRect(17, 7, 6, 1);

        // Mouth
        ctx.fillStyle = '#5a1818';
        ctx.fillRect(13, 13, 6, 1);

        // Weapon — large axe on back
        ctx.fillStyle = '#555';
        ctx.fillRect(28, 4, 2, 22);
        ctx.fillStyle = '#888';
        ctx.fillRect(27, 4, 4, 6);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(28, 5, 2, 4);

        return this._outlineSprite(c, W, H);
    },

    // ── NPC Archetype: Village Elder (robed, lantern, hunched posture) ──
    drawNPCVillageElder() {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const sk = '#c8a888';
        const skDk = '#a88868';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(16, 40, 10, 3, 0, 0, Math.PI * 2); ctx.fill();

        // Long robes — earth tones, flowing
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(8, 17, 16, 22);
        ctx.fillStyle = '#5a4838';
        ctx.fillRect(10, 18, 12, 18);
        // Robe underskirt
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(7, 34, 18, 5);
        // Robe fold lines
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(13, 22, 1, 14);
        ctx.fillRect(18, 23, 1, 12);

        // Outer cloak / mantle
        ctx.fillStyle = '#3a3028';
        ctx.fillRect(4, 15, 6, 16);
        ctx.fillRect(22, 15, 6, 16);
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(5, 16, 4, 14);
        ctx.fillRect(23, 16, 4, 14);

        // Hands
        ctx.fillStyle = sk;
        ctx.fillRect(3, 28, 4, 3); ctx.fillRect(25, 28, 4, 3);

        // Belt / sash
        ctx.fillStyle = '#6a5a3a';
        ctx.fillRect(8, 25, 16, 2);
        ctx.fillStyle = '#8a7a4a';
        ctx.fillRect(14, 25, 4, 2);

        // Neck
        ctx.fillStyle = sk;
        ctx.fillRect(12, 13, 8, 4);

        // Head — aged, thinner
        ctx.fillStyle = sk;
        ctx.fillRect(9, 3, 14, 12);
        ctx.fillStyle = skDk;
        ctx.fillRect(9, 4, 2, 10); ctx.fillRect(21, 4, 2, 10);

        // Wispy white hair
        ctx.fillStyle = '#c8c0b0';
        ctx.fillRect(7, 1, 18, 5);
        ctx.fillRect(7, 3, 3, 6);
        ctx.fillRect(22, 3, 3, 6);
        ctx.fillStyle = '#d8d0c0';
        ctx.fillRect(10, 2, 12, 2);

        // Beard
        ctx.fillStyle = '#b8b0a0';
        ctx.fillRect(11, 14, 10, 6);
        ctx.fillRect(13, 19, 6, 3);
        ctx.fillStyle = '#c8c0b0';
        ctx.fillRect(13, 15, 6, 3);

        // Eyes — weary, wise
        ctx.fillStyle = '#222';
        ctx.fillRect(11, 8, 3, 2); ctx.fillRect(18, 8, 3, 2);
        ctx.fillStyle = '#8aa8cc';
        ctx.fillRect(12, 8, 1, 1); ctx.fillRect(19, 8, 1, 1);

        // Eyebrows — bushy white
        ctx.fillStyle = '#b8b0a0';
        ctx.fillRect(10, 7, 5, 1); ctx.fillRect(17, 7, 5, 1);

        // Lantern in left hand
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(1, 22, 2, 10);
        // Lantern body
        ctx.fillStyle = '#8a6a2a';
        ctx.fillRect(0, 18, 4, 5);
        ctx.fillStyle = '#aa8a3a';
        ctx.fillRect(1, 19, 2, 3);
        // Lantern glow
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(1, 19, 1, 2);
        ctx.fillStyle = 'rgba(255,200,60,0.15)';
        ctx.beginPath(); ctx.arc(2, 20, 8, 0, Math.PI * 2); ctx.fill();

        // Walking staff in right hand
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(28, 8, 2, 30);
        ctx.fillStyle = '#6a5040';
        ctx.fillRect(28, 8, 2, 2);

        return this._outlineSprite(c, W, H);
    },

    // ── NPC Archetype: Huntress (leather armor, bow, athletic) ──
    drawNPCHuntress() {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const sk = '#c8a888';
        const skDk = '#a88068';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(16, 40, 10, 3, 0, 0, Math.PI * 2); ctx.fill();

        // Legs — fitted leather
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(9, 28, 5, 8); ctx.fillRect(18, 28, 5, 8);
        ctx.fillStyle = '#4a3a28';
        ctx.fillRect(10, 28, 3, 6); ctx.fillRect(19, 28, 3, 6);
        // Boots — lighter, wrapped
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(8, 35, 6, 4); ctx.fillRect(17, 35, 7, 4);
        // Boot wrappings
        ctx.fillStyle = '#5a4a30';
        ctx.fillRect(9, 33, 4, 1); ctx.fillRect(18, 33, 5, 1);
        ctx.fillRect(9, 35, 4, 1); ctx.fillRect(18, 35, 5, 1);

        // Torso — form-fitting leather vest
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(8, 16, 16, 13);
        ctx.fillStyle = '#5a4838';
        ctx.fillRect(10, 17, 12, 10);
        // Leather vest lacing
        ctx.fillStyle = '#6a5838';
        ctx.fillRect(15, 18, 2, 8);
        // Strap across chest
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(8, 18, 16, 1);
        ctx.fillRect(21, 18, 2, 10);

        // Belt with pouches
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(8, 27, 16, 2);
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(10, 27, 3, 2); ctx.fillRect(19, 27, 3, 2);

        // Arms — bare skin below shoulders
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(3, 17, 5, 4); ctx.fillRect(24, 17, 5, 4);
        ctx.fillStyle = sk;
        ctx.fillRect(3, 21, 5, 6); ctx.fillRect(24, 21, 5, 6);
        ctx.fillStyle = skDk;
        ctx.fillRect(3, 25, 5, 2); ctx.fillRect(24, 25, 5, 2);
        // Bracers
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(3, 23, 5, 2); ctx.fillRect(24, 23, 5, 2);

        // Neck
        ctx.fillStyle = sk;
        ctx.fillRect(12, 13, 8, 4);

        // Head
        ctx.fillStyle = sk;
        ctx.fillRect(8, 3, 16, 12);
        ctx.fillStyle = skDk;
        ctx.fillRect(8, 4, 2, 10); ctx.fillRect(22, 4, 2, 10);

        // Hair — dark, pulled back with a few loose strands
        ctx.fillStyle = '#2a1a14';
        ctx.fillRect(6, 1, 20, 5);
        ctx.fillRect(6, 3, 3, 6);
        ctx.fillRect(23, 3, 3, 6);
        // Ponytail
        ctx.fillStyle = '#2a1a14';
        ctx.fillRect(22, 8, 4, 8);
        ctx.fillStyle = '#3a2a20';
        ctx.fillRect(23, 9, 2, 6);

        // Hair highlight
        ctx.fillStyle = '#3a2a20';
        ctx.fillRect(10, 2, 12, 2);

        // Eyes — sharp, alert
        ctx.fillStyle = '#222';
        ctx.fillRect(10, 8, 4, 3); ctx.fillRect(18, 8, 4, 3);
        ctx.fillStyle = '#55aa55';
        ctx.fillRect(11, 8, 2, 2); ctx.fillRect(19, 8, 2, 2);
        ctx.fillStyle = '#88cc88';
        ctx.fillRect(11, 8, 1, 1); ctx.fillRect(19, 8, 1, 1);

        // Nose
        ctx.fillStyle = skDk;
        ctx.fillRect(15, 11, 2, 2);

        // Bow — slung across back
        ctx.strokeStyle = '#5a3a18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(28, 6);
        ctx.quadraticCurveTo(30, 20, 28, 34);
        ctx.stroke();
        // Bowstring
        ctx.strokeStyle = '#8a8a7a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(28, 6);
        ctx.lineTo(28, 34);
        ctx.stroke();

        // Quiver on back
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(24, 10, 4, 14);
        ctx.fillStyle = '#5a4028';
        ctx.fillRect(25, 11, 2, 12);
        // Arrow fletching
        ctx.fillStyle = '#aaa';
        ctx.fillRect(25, 8, 1, 3);
        ctx.fillRect(26, 9, 1, 3);

        return this._outlineSprite(c, W, H);
    },

    // ── NPC Archetype: Merchant (robed, belt pouches, friendly) ──
    drawNPCMerchant() {
        const W = 32, H = 42;
        const c = this.mkCanvas(W, H);
        const ctx = c.getContext('2d');
        const sk = '#c8a888';
        const skDk = '#a88868';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(16, 40, 10, 3, 0, 0, Math.PI * 2); ctx.fill();

        // Legs
        ctx.fillStyle = '#3a3028';
        ctx.fillRect(9, 28, 5, 8); ctx.fillRect(18, 28, 5, 8);
        // Boots
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(8, 35, 7, 4); ctx.fillRect(17, 35, 7, 4);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(9, 35, 5, 1); ctx.fillRect(18, 35, 5, 1);

        // Tunic — rich dark green
        ctx.fillStyle = '#2a4a2a';
        ctx.fillRect(7, 16, 18, 13);
        ctx.fillStyle = '#3a5a3a';
        ctx.fillRect(9, 17, 14, 10);
        // Gold trim
        ctx.fillStyle = '#aa8a3a';
        ctx.fillRect(7, 16, 18, 1);
        ctx.fillRect(7, 28, 18, 1);

        // Apron / trade cloth
        ctx.fillStyle = '#c8c0a8';
        ctx.fillRect(10, 20, 12, 10);
        ctx.fillStyle = '#b8b098';
        ctx.fillRect(12, 22, 8, 6);

        // Belt — loaded with pouches
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(7, 27, 18, 2);
        ctx.fillStyle = '#8a6a2a';
        ctx.fillRect(14, 27, 4, 2);
        // Pouches
        ctx.fillStyle = '#6a5028';
        ctx.fillRect(8, 26, 4, 3); ctx.fillRect(20, 26, 4, 3);
        ctx.fillStyle = '#7a6038';
        ctx.fillRect(9, 26, 2, 2); ctx.fillRect(21, 26, 2, 2);

        // Arms
        ctx.fillStyle = '#2a4a2a';
        ctx.fillRect(2, 17, 5, 10); ctx.fillRect(25, 17, 5, 10);
        ctx.fillStyle = sk;
        ctx.fillRect(2, 25, 5, 3); ctx.fillRect(25, 25, 5, 3);

        // Neck
        ctx.fillStyle = sk;
        ctx.fillRect(12, 13, 8, 4);

        // Head
        ctx.fillStyle = sk;
        ctx.fillRect(8, 3, 16, 12);
        ctx.fillStyle = skDk;
        ctx.fillRect(8, 4, 2, 10); ctx.fillRect(22, 4, 2, 10);

        // Hat — traveling merchant cap
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(5, 0, 22, 6);
        ctx.fillRect(4, 4, 24, 2);
        ctx.fillStyle = '#5a4028';
        ctx.fillRect(8, 1, 16, 4);
        // Hat band
        ctx.fillStyle = '#aa8a3a';
        ctx.fillRect(6, 4, 20, 1);

        // Eyes — friendly
        ctx.fillStyle = '#222';
        ctx.fillRect(10, 8, 4, 3); ctx.fillRect(18, 8, 4, 3);
        ctx.fillStyle = '#6a5a3a';
        ctx.fillRect(11, 8, 2, 2); ctx.fillRect(19, 8, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(11, 8, 1, 1); ctx.fillRect(19, 8, 1, 1);

        // Smile
        ctx.fillStyle = '#8a5a4a';
        ctx.fillRect(13, 13, 6, 1);
        ctx.fillStyle = skDk;
        ctx.fillRect(15, 11, 2, 2);

        return this._outlineSprite(c, W, H);
    },

    // ── Shared NPC outline utility ──
    _outlineSprite(c, W, H) {
        const ctx = c.getContext('2d');
        const imgData = ctx.getImageData(0, 0, W, H);
        const d = imgData.data;
        const outC = this.mkCanvas(W, H);
        const outCtx = outC.getContext('2d');
        for (let py = 0; py < H; py++) {
            for (let px = 0; px < W; px++) {
                const idx = (py * W + px) * 4;
                if (d[idx + 3] > 0) continue;
                let hasNeighbor = false;
                for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
                    const nx = px + dx, ny = py + dy;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    if (d[(ny * W + nx) * 4 + 3] > 128) { hasNeighbor = true; break; }
                }
                if (hasNeighbor) {
                    outCtx.fillStyle = '#0a0808';
                    outCtx.fillRect(px, py, 1, 1);
                }
            }
        }
        outCtx.drawImage(c, 0, 0);
        return outC;
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

        // Dark stone building
        ctx.fillStyle = '#2e2e2e';
        ctx.fillRect(5, 12, 22, 18);
        ctx.fillStyle = '#3a3838';
        ctx.fillRect(7, 13, 18, 15);
        // Stone texture
        ctx.fillStyle = '#222';
        ctx.fillRect(8, 16, 7, 1); ctx.fillRect(17, 20, 6, 1);
        ctx.fillRect(10, 22, 8, 1); ctx.fillRect(8, 26, 5, 1);

        // Damaged roof — dark slate
        ctx.fillStyle = '#222020';
        ctx.beginPath();
        ctx.moveTo(3, 12);
        ctx.lineTo(16, 2);
        ctx.lineTo(29, 12);
        ctx.closePath();
        ctx.fill();
        // Roof highlight
        ctx.fillStyle = '#2a2828';
        ctx.beginPath();
        ctx.moveTo(6, 12);
        ctx.lineTo(16, 4);
        ctx.lineTo(26, 12);
        ctx.closePath();
        ctx.fill();

        // Door — dark wood
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(12, 20, 8, 10);
        ctx.fillStyle = '#2a1810';
        ctx.fillRect(12, 20, 8, 1);

        // Window — warm firelight glow
        ctx.fillStyle = '#ff9944';
        ctx.fillRect(22, 16, 4, 4);
        ctx.fillStyle = '#ffcc66';
        ctx.fillRect(23, 17, 2, 2);
        // Window glow
        ctx.fillStyle = 'rgba(255,150,60,0.1)';
        ctx.beginPath(); ctx.arc(24, 18, 6, 0, Math.PI * 2); ctx.fill();

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

    // ── Combat Enemy Sprites ────────────────

    getCombatSprite(enemyKey) {
        return this.cache[`combat_${enemyKey}`] || null;
    },

    drawCombatEnemy(type) {
        switch (type) {
            case 'void_rat': return this.drawCombatVoidRat();
            case 'ashen_wraith': return this.drawCombatAshenWraith();
            case 'scorched_bandit': return this.drawCombatScorchedBandit();
            case 'ember_hound': return this.drawCombatEmberHound();
            case 'bog_crawler': return this.drawCombatBogCrawler();
            case 'fen_witch': return this.drawCombatFenWitch();
            case 'drowned_knight': return this.drawCombatDrownedKnight();
            case 'void_acolyte': return this.drawCombatVoidAcolyte();
            case 'reality_shard': return this.drawCombatRealityShard();
            case 'shadow_sentinel': return this.drawCombatShadowSentinel();
            case 'the_ashen_king': return this.drawCombatAshenKing();
            case 'mother_of_the_fen': return this.drawCombatMotherFen();
            case 'ruun_the_unraveler': return this.drawCombatRuun();
            default: return this.drawCombatGenericEnemy();
        }
    },

    drawCombatVoidRat() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 70, 18, 5, 0, 0, Math.PI*2); ctx.fill();
        // Body
        ctx.fillStyle = '#3a2a3a';
        ctx.beginPath(); ctx.ellipse(32, 54, 16, 12, -0.1, 0, Math.PI*2); ctx.fill();
        // Fur texture
        ctx.fillStyle = '#4a3a4a';
        ctx.beginPath(); ctx.ellipse(30, 52, 12, 9, 0, 0, Math.PI*2); ctx.fill();
        // Head
        ctx.fillStyle = '#3a2a3a';
        ctx.beginPath(); ctx.ellipse(20, 42, 10, 9, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4a3a4a';
        ctx.beginPath(); ctx.ellipse(19, 41, 8, 7, -0.2, 0, Math.PI*2); ctx.fill();
        // Ears
        ctx.fillStyle = '#5a3a5a';
        ctx.beginPath(); ctx.ellipse(14, 34, 4, 6, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(24, 33, 4, 6, 0.2, 0, Math.PI*2); ctx.fill();
        // Inner ears
        ctx.fillStyle = '#8a5a7a';
        ctx.beginPath(); ctx.ellipse(14, 35, 2, 3, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(24, 34, 2, 3, 0.2, 0, Math.PI*2); ctx.fill();
        // Eyes (glowing purple)
        ctx.fillStyle = '#bb66ff';
        ctx.fillRect(15, 40, 3, 3);
        ctx.fillRect(22, 39, 3, 3);
        ctx.fillStyle = '#dd99ff';
        ctx.fillRect(16, 40, 1, 1);
        ctx.fillRect(23, 39, 1, 1);
        // Nose
        ctx.fillStyle = '#8a5a6a';
        ctx.fillRect(12, 44, 3, 2);
        // Snout whiskers
        ctx.strokeStyle = '#6a5a6a';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(10, 43); ctx.lineTo(4, 41); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 45); ctx.lineTo(3, 46); ctx.stroke();
        // Legs
        ctx.fillStyle = '#3a2a3a';
        ctx.fillRect(20, 62, 5, 8); ctx.fillRect(36, 62, 5, 8);
        ctx.fillStyle = '#2a1a2a';
        ctx.fillRect(19, 68, 7, 3); ctx.fillRect(35, 68, 7, 3);
        // Tail
        ctx.strokeStyle = '#4a3a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(48, 52); ctx.quadraticCurveTo(56, 40, 52, 30);
        ctx.quadraticCurveTo(50, 24, 54, 20);
        ctx.stroke();
        return c;
    },

    drawCombatAshenWraith() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Ethereal glow
        ctx.fillStyle = 'rgba(180,180,200,0.08)';
        ctx.beginPath(); ctx.ellipse(32, 40, 28, 35, 0, 0, Math.PI*2); ctx.fill();
        // Wispy lower body (no legs)
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#8a9aaa';
        ctx.beginPath(); ctx.moveTo(20, 50); ctx.quadraticCurveTo(22, 75, 18, 78);
        ctx.lineTo(46, 78); ctx.quadraticCurveTo(42, 75, 44, 50); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.5;
        // Cloak body
        ctx.fillStyle = '#6a7a8a';
        ctx.beginPath(); ctx.ellipse(32, 42, 14, 18, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#7a8a9a';
        ctx.beginPath(); ctx.ellipse(32, 38, 11, 14, 0, 0, Math.PI*2); ctx.fill();
        // Tattered edges
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#8a9aaa';
        for (let i = 0; i < 6; i++) {
            const x = 22 + i * 4, y = 55 + Math.sin(i * 1.5) * 3;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+2, y+10); ctx.lineTo(x+4, y); ctx.fill();
        }
        ctx.globalAlpha = 0.6;
        // Head (hooded)
        ctx.fillStyle = '#5a6a7a';
        ctx.beginPath(); ctx.ellipse(32, 24, 10, 11, 0, 0, Math.PI*2); ctx.fill();
        // Hood
        ctx.fillStyle = '#4a5a6a';
        ctx.beginPath(); ctx.arc(32, 20, 12, Math.PI, 0); ctx.fill();
        // Dark face hollow
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath(); ctx.ellipse(32, 26, 6, 7, 0, 0, Math.PI*2); ctx.fill();
        // Glowing eyes
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(28, 24, 3, 2);
        ctx.fillRect(34, 24, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(29, 24, 1, 1);
        ctx.fillRect(35, 24, 1, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawCombatScorchedBandit() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 74, 16, 5, 0, 0, Math.PI*2); ctx.fill();
        // Boots
        ctx.fillStyle = '#2a1a1a';
        ctx.fillRect(18, 68, 10, 6); ctx.fillRect(36, 68, 10, 6);
        // Legs
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(20, 54, 8, 16); ctx.fillRect(36, 54, 8, 16);
        // Torso
        ctx.fillStyle = '#4a2a1a';
        ctx.fillRect(16, 30, 32, 26);
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(18, 32, 28, 20);
        // Belt
        ctx.fillStyle = '#3a3a2a';
        ctx.fillRect(16, 52, 32, 3);
        ctx.fillStyle = '#8a7a3a';
        ctx.fillRect(28, 52, 8, 3);
        // Arms
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(8, 32, 8, 18); ctx.fillRect(48, 32, 8, 18);
        // Hands (charred skin)
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(8, 48, 8, 5); ctx.fillRect(48, 48, 8, 5);
        // Head
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(20, 10, 24, 22);
        ctx.fillStyle = '#5a3a2a';
        ctx.fillRect(22, 12, 20, 18);
        // Bandana
        ctx.fillStyle = '#6a2a1a';
        ctx.fillRect(18, 10, 28, 7);
        // Eyes (angry)
        ctx.fillStyle = '#ff6633';
        ctx.fillRect(26, 18, 4, 3);
        ctx.fillRect(36, 18, 4, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(27, 19, 2, 2);
        ctx.fillRect(37, 19, 2, 2);
        // Mouth snarl
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(28, 26, 10, 2);
        // Scars
        ctx.fillStyle = '#6a4a3a';
        ctx.fillRect(24, 22, 1, 6);
        ctx.fillRect(40, 16, 1, 8);
        // Curved blade in right hand
        ctx.fillStyle = '#8a8a9a';
        ctx.beginPath();
        ctx.moveTo(52, 36); ctx.lineTo(58, 18); ctx.lineTo(60, 20); ctx.lineTo(54, 38);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#aaaabc';
        ctx.fillRect(57, 16, 2, 4);
        return c;
    },

    drawCombatEmberHound() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Warm ground glow
        ctx.fillStyle = 'rgba(200,80,20,0.1)';
        ctx.beginPath(); ctx.ellipse(32, 68, 24, 10, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(32, 70, 20, 5, 0, 0, Math.PI*2); ctx.fill();
        // Legs
        ctx.fillStyle = '#4a2a1a';
        ctx.fillRect(14, 58, 6, 12); ctx.fillRect(22, 58, 6, 12);
        ctx.fillRect(38, 58, 6, 12); ctx.fillRect(46, 58, 6, 12);
        // Paws
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(13, 68, 8, 4); ctx.fillRect(21, 68, 8, 4);
        ctx.fillRect(37, 68, 8, 4); ctx.fillRect(45, 68, 8, 4);
        // Body
        ctx.fillStyle = '#5a2a1a';
        ctx.beginPath(); ctx.ellipse(32, 50, 20, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#6a3a2a';
        ctx.beginPath(); ctx.ellipse(32, 48, 17, 10, 0, 0, Math.PI*2); ctx.fill();
        // Ember glow between ribs
        ctx.fillStyle = '#ff6600';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(22, 48, 2, 6); ctx.fillRect(28, 47, 2, 7);
        ctx.fillRect(34, 47, 2, 7); ctx.fillRect(40, 48, 2, 6);
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(23, 49, 1, 4); ctx.fillRect(29, 48, 1, 5);
        ctx.fillRect(35, 48, 1, 5); ctx.fillRect(41, 49, 1, 4);
        ctx.globalAlpha = 1;
        // Neck/head
        ctx.fillStyle = '#5a2a1a';
        ctx.fillRect(10, 36, 14, 10);
        ctx.fillStyle = '#6a3a2a';
        ctx.beginPath(); ctx.ellipse(12, 32, 10, 9, -0.2, 0, Math.PI*2); ctx.fill();
        // Ears
        ctx.fillStyle = '#4a2a1a';
        ctx.beginPath(); ctx.moveTo(6, 24); ctx.lineTo(4, 30); ctx.lineTo(10, 30); ctx.fill();
        ctx.beginPath(); ctx.moveTo(18, 23); ctx.lineTo(16, 29); ctx.lineTo(22, 29); ctx.fill();
        // Eyes (fiery)
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(7, 30, 4, 3);
        ctx.fillRect(14, 30, 4, 3);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(8, 30, 2, 1);
        ctx.fillRect(15, 30, 2, 1);
        // Mouth/jaw
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(4, 36, 12, 3);
        // Teeth
        ctx.fillStyle = '#ddd';
        ctx.fillRect(5, 36, 2, 2); ctx.fillRect(9, 36, 2, 2); ctx.fillRect(13, 36, 2, 2);
        // Tail (ember)
        ctx.strokeStyle = '#5a2a1a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(52, 46); ctx.quadraticCurveTo(58, 38, 56, 30);
        ctx.stroke();
        ctx.fillStyle = '#ff6600';
        ctx.beginPath(); ctx.arc(56, 28, 3, 0, Math.PI*2); ctx.fill();
        return c;
    },

    drawCombatBogCrawler() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Murky swamp glow on ground
        ctx.fillStyle = 'rgba(40,80,30,0.1)';
        ctx.beginPath(); ctx.ellipse(32, 68, 28, 10, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 72, 22, 6, 0, 0, Math.PI*2); ctx.fill();
        // Mud puddle beneath
        ctx.fillStyle = 'rgba(60,50,30,0.25)';
        ctx.beginPath(); ctx.ellipse(32, 74, 18, 4, 0, 0, Math.PI*2); ctx.fill();
        // Hind legs (wide stance)
        ctx.fillStyle = '#3a5a2a';
        ctx.fillRect(6, 58, 8, 14); ctx.fillRect(50, 58, 8, 14);
        // Front legs
        ctx.fillRect(16, 60, 7, 12); ctx.fillRect(42, 60, 7, 12);
        // Leg joint highlights
        ctx.fillStyle = '#4a6a3a';
        ctx.fillRect(7, 58, 4, 3); ctx.fillRect(51, 58, 4, 3);
        ctx.fillRect(17, 60, 4, 3); ctx.fillRect(43, 60, 4, 3);
        // Claws with individual toes
        ctx.fillStyle = '#2a3a1a';
        ctx.fillRect(4, 70, 4, 4); ctx.fillRect(9, 70, 4, 4);
        ctx.fillRect(48, 70, 4, 4); ctx.fillRect(53, 70, 4, 4);
        ctx.fillRect(14, 70, 3, 3); ctx.fillRect(18, 70, 3, 3);
        ctx.fillRect(42, 70, 3, 3); ctx.fillRect(46, 70, 3, 3);
        // Claw tips (bone-colored)
        ctx.fillStyle = '#aaa08a';
        ctx.fillRect(3, 73, 2, 2); ctx.fillRect(10, 73, 2, 2);
        ctx.fillRect(47, 73, 2, 2); ctx.fillRect(54, 73, 2, 2);
        // Body (wide, low, reptilian)
        ctx.fillStyle = '#3a5a2a';
        ctx.beginPath(); ctx.ellipse(32, 50, 22, 14, 0, 0, Math.PI*2); ctx.fill();
        // Dorsal scales - darker ridge along spine
        ctx.fillStyle = '#2a4a1a';
        ctx.beginPath(); ctx.ellipse(32, 46, 16, 6, 0, 0, Math.PI*2); ctx.fill();
        // Scale detail - lighter belly area
        ctx.fillStyle = '#4a6a3a';
        ctx.beginPath(); ctx.ellipse(32, 48, 18, 11, 0, 0, Math.PI*2); ctx.fill();
        // Individual scale pattern (two rows)
        ctx.fillStyle = '#3a5a2a';
        for (let i = 0; i < 8; i++) {
            const x = 18 + i * 4, y = 44 + (i % 2) * 3;
            ctx.fillRect(x, y, 3, 3);
        }
        for (let i = 0; i < 6; i++) {
            const x = 20 + i * 4, y = 50 + (i % 2) * 2;
            ctx.fillRect(x, y, 2, 2);
        }
        // Spines along back
        ctx.fillStyle = '#2a4a1a';
        for (let i = 0; i < 5; i++) {
            const x = 22 + i * 5;
            ctx.beginPath();
            ctx.moveTo(x, 42); ctx.lineTo(x + 2, 36); ctx.lineTo(x + 4, 42);
            ctx.fill();
        }
        // Belly (pale)
        ctx.fillStyle = '#5a7a4a';
        ctx.beginPath(); ctx.ellipse(32, 54, 14, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#6a8a5a';
        ctx.beginPath(); ctx.ellipse(32, 55, 10, 4, 0, 0, Math.PI*2); ctx.fill();
        // Head
        ctx.fillStyle = '#3a5a2a';
        ctx.beginPath(); ctx.ellipse(32, 34, 14, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4a6a3a';
        ctx.beginPath(); ctx.ellipse(32, 33, 11, 8, 0, 0, Math.PI*2); ctx.fill();
        // Brow ridges
        ctx.fillStyle = '#2a4a1a';
        ctx.fillRect(22, 28, 6, 2); ctx.fillRect(34, 28, 6, 2);
        // Eyes (yellow, reptilian)
        ctx.fillStyle = '#ddcc22';
        ctx.fillRect(24, 30, 4, 4);
        ctx.fillRect(36, 30, 4, 4);
        ctx.fillStyle = '#eedd44';
        ctx.fillRect(25, 30, 2, 2);
        ctx.fillRect(37, 30, 2, 2);
        // Slit pupils
        ctx.fillStyle = '#111';
        ctx.fillRect(25, 30, 1, 4);
        ctx.fillRect(37, 30, 1, 4);
        // Nostrils
        ctx.fillStyle = '#2a3a1a';
        ctx.fillRect(27, 36, 2, 2); ctx.fillRect(35, 36, 2, 2);
        // Mouth open - dark maw
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(24, 38, 16, 4);
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(26, 39, 12, 2);
        // Fangs (upper and lower)
        ctx.fillStyle = '#ddd';
        ctx.fillRect(26, 38, 2, 3); ctx.fillRect(36, 38, 2, 3);
        ctx.fillRect(30, 41, 1, 2); ctx.fillRect(33, 41, 1, 2);
        // Tongue
        ctx.fillStyle = '#8a3a3a';
        ctx.fillRect(30, 39, 4, 1);
        // Mud dripping from body
        ctx.fillStyle = 'rgba(70,55,30,0.4)';
        ctx.fillRect(18, 56, 2, 5); ctx.fillRect(44, 54, 2, 6);
        ctx.fillRect(28, 58, 1, 4); ctx.fillRect(36, 57, 1, 5);
        // Tail (thick, tapering)
        ctx.fillStyle = '#3a5a2a';
        ctx.beginPath();
        ctx.moveTo(50, 54); ctx.quadraticCurveTo(60, 52, 62, 44);
        ctx.lineTo(60, 46); ctx.quadraticCurveTo(58, 52, 48, 56);
        ctx.closePath(); ctx.fill();
        // Tail scales
        ctx.fillStyle = '#4a6a3a';
        ctx.fillRect(54, 50, 3, 2); ctx.fillRect(58, 48, 2, 2);
        // Tail spine tip
        ctx.fillStyle = '#2a4a1a';
        ctx.beginPath();
        ctx.moveTo(62, 42); ctx.lineTo(63, 38); ctx.lineTo(60, 42);
        ctx.fill();
        return c;
    },

    drawCombatFenWitch() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Eerie swamp glow around figure
        ctx.fillStyle = 'rgba(40,100,40,0.06)';
        ctx.beginPath(); ctx.ellipse(32, 40, 28, 36, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 74, 14, 4, 0, 0, Math.PI*2); ctx.fill();
        // Robes (long, flowing, tattered)
        ctx.fillStyle = '#2a3a2a';
        ctx.beginPath();
        ctx.moveTo(20, 36); ctx.lineTo(14, 74); ctx.lineTo(50, 74); ctx.lineTo(44, 36);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a4a3a';
        ctx.beginPath();
        ctx.moveTo(22, 38); ctx.lineTo(16, 72); ctx.lineTo(48, 72); ctx.lineTo(42, 38);
        ctx.closePath(); ctx.fill();
        // Robe seam
        ctx.strokeStyle = '#1a2a1a';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(32, 40); ctx.lineTo(32, 72); ctx.stroke();
        // Tattered robe edges
        ctx.fillStyle = '#2a3a2a';
        for (let i = 0; i < 6; i++) {
            const x = 16 + i * 5;
            ctx.beginPath();
            ctx.moveTo(x, 72); ctx.lineTo(x - 1, 78); ctx.lineTo(x + 3, 72);
            ctx.fill();
        }
        // Robe stitching/patches
        ctx.fillStyle = '#344a34';
        ctx.fillRect(24, 50, 5, 6); ctx.fillRect(36, 56, 4, 5);
        // Body
        ctx.fillStyle = '#3a4a3a';
        ctx.fillRect(22, 30, 20, 16);
        // Necklace of bones/charms
        ctx.fillStyle = '#8a7a5a';
        ctx.fillRect(24, 34, 2, 2); ctx.fillRect(28, 35, 2, 2);
        ctx.fillRect(32, 35, 2, 2); ctx.fillRect(36, 34, 2, 2);
        ctx.strokeStyle = '#6a5a3a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(24, 34); ctx.quadraticCurveTo(30, 37, 38, 34);
        ctx.stroke();
        // Arms (thin, bony)
        ctx.fillStyle = '#2a3a2a';
        ctx.fillRect(10, 32, 12, 6);
        ctx.fillRect(42, 32, 12, 6);
        // Left hand (casting)
        ctx.fillStyle = '#6a8a5a';
        ctx.fillRect(6, 32, 6, 5);
        // Bony fingers on left hand
        ctx.fillStyle = '#5a7a4a';
        ctx.fillRect(4, 32, 2, 6); ctx.fillRect(7, 31, 1, 5); ctx.fillRect(10, 32, 1, 5);
        // Spell glow in left hand
        ctx.fillStyle = 'rgba(80,200,80,0.4)';
        ctx.beginPath(); ctx.arc(9, 34, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#44ff44';
        ctx.beginPath(); ctx.arc(9, 34, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#aaffaa';
        ctx.fillRect(8, 33, 2, 2);
        // Spell particles
        ctx.fillStyle = '#66ff66';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(4, 28, 2, 2); ctx.fillRect(14, 30, 1, 1);
        ctx.fillRect(6, 38, 1, 1); ctx.fillRect(12, 26, 1, 1);
        ctx.globalAlpha = 1;
        // Right hand holding gnarled staff
        ctx.fillStyle = '#6a8a5a';
        ctx.fillRect(52, 32, 6, 5);
        // Gnarled staff
        ctx.fillStyle = '#4a3a1a';
        ctx.fillRect(56, 10, 3, 54);
        ctx.fillStyle = '#5a4a2a';
        ctx.fillRect(57, 12, 1, 50);
        // Staff top - skull/orb
        ctx.fillStyle = '#3a6a3a';
        ctx.beginPath(); ctx.arc(57, 10, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#55ff55';
        ctx.beginPath(); ctx.arc(57, 10, 2, 0, Math.PI*2); ctx.fill();
        // Staff glow
        ctx.fillStyle = 'rgba(80,200,80,0.25)';
        ctx.beginPath(); ctx.arc(57, 10, 7, 0, Math.PI*2); ctx.fill();
        // Head (hooded)
        ctx.fillStyle = '#2a3a2a';
        ctx.beginPath(); ctx.arc(32, 20, 12, Math.PI, 0); ctx.fill();
        ctx.fillRect(20, 16, 24, 16);
        // Hood point
        ctx.fillStyle = '#2a3a2a';
        ctx.beginPath(); ctx.moveTo(26, 16); ctx.lineTo(32, 4); ctx.lineTo(38, 16); ctx.fill();
        // Hood shadow inner
        ctx.fillStyle = '#1a2a1a';
        ctx.beginPath(); ctx.moveTo(28, 16); ctx.lineTo(32, 7); ctx.lineTo(36, 16); ctx.fill();
        // Face shadow
        ctx.fillStyle = '#1a2a1a';
        ctx.beginPath(); ctx.ellipse(32, 24, 8, 9, 0, 0, Math.PI*2); ctx.fill();
        // Face (gaunt, greenish)
        ctx.fillStyle = '#6a7a5a';
        ctx.beginPath(); ctx.ellipse(32, 24, 6, 7, 0, 0, Math.PI*2); ctx.fill();
        // Sunken cheeks
        ctx.fillStyle = '#5a6a4a';
        ctx.fillRect(26, 25, 2, 3); ctx.fillRect(36, 25, 2, 3);
        // Eyes (eerie green, glowing)
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(28, 22, 3, 2);
        ctx.fillRect(34, 22, 3, 2);
        ctx.fillStyle = '#88ff88';
        ctx.fillRect(29, 22, 1, 1);
        ctx.fillRect(35, 22, 1, 1);
        // Eye glow effect
        ctx.fillStyle = 'rgba(68,255,68,0.15)';
        ctx.beginPath(); ctx.arc(29, 23, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(35, 23, 4, 0, Math.PI*2); ctx.fill();
        // Crooked nose
        ctx.fillStyle = '#5a6a4a';
        ctx.fillRect(31, 26, 2, 3);
        ctx.fillRect(30, 27, 1, 1);
        // Crooked grin with teeth
        ctx.fillStyle = '#2a2a1a';
        ctx.fillRect(28, 29, 8, 2);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(29, 29, 1, 1); ctx.fillRect(32, 29, 1, 1); ctx.fillRect(35, 29, 1, 1);
        // Wart
        ctx.fillStyle = '#5a7a3a';
        ctx.fillRect(36, 26, 2, 2);
        return c;
    },

    drawCombatDrownedKnight() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Watery aura around figure
        ctx.fillStyle = 'rgba(40,100,140,0.08)';
        ctx.beginPath(); ctx.ellipse(32, 40, 28, 36, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(32, 74, 18, 5, 0, 0, Math.PI*2); ctx.fill();
        // Water puddle at feet
        ctx.fillStyle = 'rgba(60,120,160,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 75, 16, 3, 0, 0, Math.PI*2); ctx.fill();
        // Water drip trails from body
        ctx.fillStyle = 'rgba(80,140,180,0.15)';
        ctx.fillRect(26, 72, 2, 6); ctx.fillRect(38, 70, 2, 8);
        ctx.fillRect(18, 68, 1, 6); ctx.fillRect(46, 69, 1, 7);
        // Boots (heavy, waterlogged)
        ctx.fillStyle = '#2a3a3a';
        ctx.fillRect(16, 66, 12, 8); ctx.fillRect(36, 66, 12, 8);
        ctx.fillStyle = '#1a2a2a';
        ctx.fillRect(16, 72, 12, 2); ctx.fillRect(36, 72, 12, 2);
        // Greaves
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(18, 52, 10, 16); ctx.fillRect(36, 52, 10, 16);
        ctx.fillStyle = '#4a6a6a';
        ctx.fillRect(20, 54, 6, 12); ctx.fillRect(38, 54, 6, 12);
        // Knee guards
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(19, 52, 8, 3); ctx.fillRect(37, 52, 8, 3);
        // Torso armor (corroded)
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(14, 26, 36, 28);
        ctx.fillStyle = '#4a6a6a';
        ctx.fillRect(16, 28, 32, 24);
        // Armor plates with rivets
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(16, 34, 32, 2);
        ctx.fillRect(16, 42, 32, 2);
        // Rivets
        ctx.fillStyle = '#5a7a7a';
        ctx.fillRect(18, 34, 2, 2); ctx.fillRect(30, 34, 2, 2); ctx.fillRect(44, 34, 2, 2);
        ctx.fillRect(18, 42, 2, 2); ctx.fillRect(30, 42, 2, 2); ctx.fillRect(44, 42, 2, 2);
        // Rust stains (more extensive)
        ctx.fillStyle = 'rgba(120,80,40,0.3)';
        ctx.fillRect(20, 30, 6, 8);
        ctx.fillRect(38, 36, 8, 6);
        ctx.fillStyle = 'rgba(100,70,30,0.25)';
        ctx.fillRect(28, 44, 5, 4);
        ctx.fillRect(16, 38, 4, 5);
        // Barnacles on armor
        ctx.fillStyle = '#6a6a5a';
        ctx.fillRect(22, 46, 3, 2); ctx.fillRect(40, 30, 2, 3);
        ctx.fillRect(34, 48, 2, 2);
        // Seaweed draped on shoulders
        ctx.fillStyle = '#2a5a2a';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(8, 24, 2, 12); ctx.fillRect(10, 28, 1, 8);
        ctx.fillRect(52, 26, 2, 10); ctx.fillRect(54, 24, 1, 8);
        ctx.globalAlpha = 1;
        // Pauldrons (barnacle-encrusted)
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(6, 24, 12, 10);
        ctx.fillRect(46, 24, 12, 10);
        ctx.fillStyle = '#4a6a6a';
        ctx.fillRect(8, 26, 8, 6);
        ctx.fillRect(48, 26, 8, 6);
        // Pauldron barnacles
        ctx.fillStyle = '#5a5a4a';
        ctx.fillRect(9, 27, 2, 2); ctx.fillRect(49, 28, 2, 2);
        // Arms
        ctx.fillStyle = '#3a4a4a';
        ctx.fillRect(6, 32, 10, 16);
        ctx.fillRect(48, 32, 10, 16);
        // Gauntlets
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(6, 44, 10, 5);
        ctx.fillRect(48, 44, 10, 5);
        // Helmet (great helm style)
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(18, 6, 28, 22);
        ctx.fillStyle = '#4a6a6a';
        ctx.fillRect(20, 8, 24, 18);
        // Helmet face plate with breathing holes
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(24, 20, 16, 6);
        ctx.fillStyle = '#1a2a2a';
        ctx.fillRect(26, 21, 2, 1); ctx.fillRect(30, 21, 2, 1);
        ctx.fillRect(34, 21, 2, 1); ctx.fillRect(38, 21, 2, 1);
        // Visor slit
        ctx.fillStyle = '#1a2a2a';
        ctx.fillRect(22, 14, 20, 4);
        // Eyes (dim blue glow, spectral)
        ctx.fillStyle = '#6699bb';
        ctx.fillRect(26, 15, 3, 2);
        ctx.fillRect(36, 15, 3, 2);
        ctx.fillStyle = '#88bbdd';
        ctx.fillRect(27, 15, 1, 1);
        ctx.fillRect(37, 15, 1, 1);
        // Eye glow
        ctx.fillStyle = 'rgba(80,140,200,0.15)';
        ctx.beginPath(); ctx.arc(27, 16, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(37, 16, 3, 0, Math.PI*2); ctx.fill();
        // Helmet crest (damaged)
        ctx.fillStyle = '#3a5a5a';
        ctx.fillRect(28, 2, 8, 6);
        ctx.fillStyle = '#4a6a6a';
        ctx.fillRect(30, 3, 4, 4);
        // Crest damage
        ctx.fillStyle = '#2a4a4a';
        ctx.fillRect(34, 2, 2, 3);
        // Sword (rusted, large)
        ctx.fillStyle = '#5a6a7a';
        ctx.fillRect(56, 10, 4, 40);
        ctx.fillStyle = '#6a7a8a';
        ctx.fillRect(57, 12, 2, 36);
        // Sword rust patches
        ctx.fillStyle = 'rgba(120,80,40,0.4)';
        ctx.fillRect(57, 18, 2, 6); ctx.fillRect(56, 30, 3, 4);
        // Sword edge highlight
        ctx.fillStyle = '#8a9aaa';
        ctx.fillRect(56, 12, 1, 36);
        // Crossguard
        ctx.fillStyle = '#4a5a5a';
        ctx.fillRect(52, 48, 12, 3);
        // Grip (waterlogged leather)
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(56, 51, 4, 8);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(57, 52, 2, 2); ctx.fillRect(57, 56, 2, 2);
        // Water drips on armor (more)
        ctx.fillStyle = 'rgba(100,160,200,0.3)';
        ctx.fillRect(24, 38, 1, 4); ctx.fillRect(40, 32, 1, 6);
        ctx.fillRect(32, 50, 1, 3); ctx.fillRect(20, 44, 1, 5);
        return c;
    },

    drawCombatVoidAcolyte() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Purple glow aura
        ctx.fillStyle = 'rgba(80,20,120,0.1)';
        ctx.beginPath(); ctx.ellipse(32, 40, 28, 35, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(100,30,140,0.06)';
        ctx.beginPath(); ctx.ellipse(32, 40, 22, 28, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 74, 14, 4, 0, 0, Math.PI*2); ctx.fill();
        // Robes (dark purple, cultist)
        ctx.fillStyle = '#2a1a3a';
        ctx.beginPath();
        ctx.moveTo(18, 34); ctx.lineTo(12, 74); ctx.lineTo(52, 74); ctx.lineTo(46, 34);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a2a4a';
        ctx.beginPath();
        ctx.moveTo(20, 36); ctx.lineTo(14, 72); ctx.lineTo(50, 72); ctx.lineTo(44, 36);
        ctx.closePath(); ctx.fill();
        // Robe hem runes (glowing)
        ctx.fillStyle = '#6a3a8a';
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 5; i++) {
            const x = 18 + i * 6, y = 66;
            ctx.fillRect(x, y, 3, 1);
            ctx.fillRect(x + 1, y + 1, 1, 2);
        }
        ctx.globalAlpha = 1;
        // Void symbol on chest
        ctx.strokeStyle = '#7a3a9a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(32, 42, 5, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(32, 37); ctx.lineTo(32, 47); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(27, 42); ctx.lineTo(37, 42); ctx.stroke();
        // Body
        ctx.fillStyle = '#3a2a4a';
        ctx.fillRect(20, 28, 24, 14);
        // Belt/sash
        ctx.fillStyle = '#4a2a5a';
        ctx.fillRect(18, 48, 28, 3);
        ctx.fillStyle = '#6a3a8a';
        ctx.fillRect(28, 48, 8, 3);
        // Arms raised in worship
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(8, 24, 12, 6);
        ctx.fillRect(44, 24, 12, 6);
        // Forearms angled up
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(4, 18, 8, 8);
        ctx.fillRect(52, 18, 8, 8);
        // Hands (pale, withered)
        ctx.fillStyle = '#5a4a5a';
        ctx.fillRect(4, 16, 6, 5);
        ctx.fillRect(54, 16, 6, 5);
        // Bony fingers
        ctx.fillStyle = '#4a3a4a';
        ctx.fillRect(3, 15, 1, 4); ctx.fillRect(6, 14, 1, 4); ctx.fillRect(9, 15, 1, 4);
        ctx.fillRect(53, 15, 1, 4); ctx.fillRect(56, 14, 1, 4); ctx.fillRect(59, 15, 1, 4);
        // Dark energy between hands (void orb)
        ctx.fillStyle = 'rgba(60,10,100,0.4)';
        ctx.beginPath(); ctx.ellipse(32, 18, 18, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(120,40,180,0.3)';
        ctx.beginPath(); ctx.ellipse(32, 18, 12, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(160,60,220,0.25)';
        ctx.beginPath(); ctx.ellipse(32, 18, 6, 3, 0, 0, Math.PI*2); ctx.fill();
        // Void sparks in energy
        ctx.fillStyle = '#bb66ff';
        ctx.fillRect(24, 16, 1, 1); ctx.fillRect(38, 17, 1, 1);
        ctx.fillRect(30, 14, 1, 1); ctx.fillRect(34, 20, 1, 1);
        // Head with deep hood
        ctx.fillStyle = '#2a1a3a';
        ctx.fillRect(20, 6, 24, 24);
        ctx.beginPath(); ctx.arc(32, 6, 12, Math.PI, 0); ctx.fill();
        // Hood peak
        ctx.fillStyle = '#2a1a3a';
        ctx.beginPath(); ctx.moveTo(26, 6); ctx.lineTo(32, -2); ctx.lineTo(38, 6); ctx.fill();
        // Hood shadow (deeper)
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath(); ctx.ellipse(32, 18, 8, 10, 0, 0, Math.PI*2); ctx.fill();
        // Empty eye sockets with void glow
        ctx.fillStyle = '#000';
        ctx.fillRect(26, 15, 4, 5);
        ctx.fillRect(36, 15, 4, 5);
        ctx.fillStyle = '#6a2a8a';
        ctx.fillRect(26, 16, 4, 4);
        ctx.fillRect(36, 16, 4, 4);
        ctx.fillStyle = '#8a4aaa';
        ctx.fillRect(27, 17, 2, 2);
        ctx.fillRect(37, 17, 2, 2);
        // Eye glow effect
        ctx.fillStyle = 'rgba(120,40,180,0.2)';
        ctx.beginPath(); ctx.arc(28, 18, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(38, 18, 4, 0, Math.PI*2); ctx.fill();
        // Void tendrils from sockets (more visible)
        ctx.strokeStyle = 'rgba(120,40,180,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(28, 20); ctx.quadraticCurveTo(24, 24, 26, 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(38, 20); ctx.quadraticCurveTo(42, 24, 40, 28); ctx.stroke();
        // Mouth (void chanting)
        ctx.fillStyle = '#3a1a4a';
        ctx.fillRect(28, 24, 8, 2);
        // Floating void particles around figure
        ctx.fillStyle = '#7a3a9a';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(8, 44, 2, 2); ctx.fillRect(54, 38, 2, 2);
        ctx.fillRect(12, 64, 1, 1); ctx.fillRect(50, 60, 1, 1);
        ctx.fillRect(6, 54, 1, 1); ctx.fillRect(56, 50, 1, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawCombatRealityShard() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Distortion glow (layered)
        ctx.fillStyle = 'rgba(100,150,255,0.08)';
        ctx.beginPath(); ctx.ellipse(32, 40, 30, 35, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(120,100,200,0.06)';
        ctx.beginPath(); ctx.ellipse(32, 38, 24, 28, 0, 0, Math.PI*2); ctx.fill();
        // Floating shadow (small, it hovers)
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.ellipse(32, 74, 12, 3, 0, 0, Math.PI*2); ctx.fill();
        // Distortion rings (reality bending)
        ctx.strokeStyle = 'rgba(150,120,255,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const r = 20 + i * 5;
            ctx.beginPath();
            ctx.arc(32, 34, r, Math.PI * i * 0.3, Math.PI * i * 0.3 + 0.8);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(180,150,255,0.1)';
        for (let i = 0; i < 3; i++) {
            const r = 12 + i * 8;
            ctx.beginPath();
            ctx.arc(32, 36, r, Math.PI * (1 + i * 0.4), Math.PI * (1 + i * 0.4) + 0.6);
            ctx.stroke();
        }
        // Crystal shard helper with fracture lines
        const drawShard = (x, y, w, h, color, angle) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle || 0);
            // Shard body
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, h/2); ctx.lineTo(w/2, -h/2); ctx.lineTo(-w/2, -h/2); ctx.closePath();
            ctx.fill();
            // Edge highlight (left facet)
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.moveTo(-w/2, -h/2); ctx.lineTo(0, h/2); ctx.lineTo(-1, h/4); ctx.lineTo(-w/2+1, -h/2+2);
            ctx.closePath(); ctx.fill();
            // Inner highlight streak
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(-1, -h/4, 2, h/3);
            // Fracture lines
            ctx.strokeStyle = 'rgba(200,180,255,0.25)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-w/4, -h/4); ctx.lineTo(w/4, 0);
            ctx.moveTo(0, -h/3); ctx.lineTo(-w/4, h/6);
            ctx.stroke();
            ctx.restore();
        };
        // Tiny debris shards (floating around)
        ctx.fillStyle = '#5a4a9a';
        ctx.globalAlpha = 0.4;
        ctx.save(); ctx.translate(8, 30); ctx.rotate(0.5); ctx.fillRect(-2, -2, 4, 4); ctx.restore();
        ctx.save(); ctx.translate(54, 26); ctx.rotate(-0.3); ctx.fillRect(-2, -1, 3, 3); ctx.restore();
        ctx.save(); ctx.translate(12, 58); ctx.rotate(0.8); ctx.fillRect(-1, -1, 3, 3); ctx.restore();
        ctx.save(); ctx.translate(52, 54); ctx.rotate(-0.6); ctx.fillRect(-2, -2, 3, 4); ctx.restore();
        ctx.globalAlpha = 1;
        // Back shards
        drawShard(20, 38, 10, 30, '#4a3a8a', -0.2);
        drawShard(44, 36, 8, 26, '#3a2a7a', 0.3);
        drawShard(16, 44, 6, 18, '#3a2a6a', -0.4);
        // Main shards (central cluster)
        drawShard(28, 32, 12, 36, '#5a4aaa', -0.1);
        drawShard(36, 30, 14, 40, '#6a5abb', 0.1);
        drawShard(32, 28, 10, 42, '#7a6acc', 0);
        // Front shard
        drawShard(40, 40, 8, 24, '#5a4a9a', 0.25);
        drawShard(24, 42, 6, 20, '#4a3a8a', -0.15);
        // Inner glow (energy core)
        ctx.fillStyle = 'rgba(140,100,220,0.3)';
        ctx.beginPath(); ctx.ellipse(32, 34, 10, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(180,150,255,0.3)';
        ctx.beginPath(); ctx.ellipse(32, 34, 8, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(220,200,255,0.25)';
        ctx.beginPath(); ctx.ellipse(32, 32, 5, 7, 0, 0, Math.PI*2); ctx.fill();
        // Core bright point
        ctx.fillStyle = 'rgba(240,230,255,0.4)';
        ctx.beginPath(); ctx.ellipse(32, 30, 2, 3, 0, 0, Math.PI*2); ctx.fill();
        // Sparkles (more)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(30, 20, 2, 2);
        ctx.fillRect(36, 26, 2, 2);
        ctx.fillRect(26, 36, 1, 1);
        ctx.fillRect(42, 30, 1, 1);
        ctx.fillRect(22, 28, 1, 1);
        ctx.fillRect(40, 22, 1, 1);
        ctx.fillRect(34, 44, 1, 1);
        // Bright sparkle pulse at center
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(31, 32, 2, 2);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(30, 33, 1, 1); ctx.fillRect(33, 33, 1, 1);
        ctx.fillRect(31, 31, 1, 1); ctx.fillRect(32, 34, 1, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawCombatShadowSentinel() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Dark aura (layered)
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.ellipse(32, 40, 30, 38, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(10,10,20,0.1)';
        ctx.beginPath(); ctx.ellipse(32, 40, 24, 30, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(32, 74, 20, 5, 0, 0, Math.PI*2); ctx.fill();
        // Ghost/shadow duplicates (afterimages, offset)
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(8, 14, 28, 54);
        ctx.globalAlpha = 0.08;
        ctx.fillRect(30, 10, 28, 56);
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(6, 16, 24, 50);
        ctx.fillRect(34, 12, 24, 52);
        ctx.globalAlpha = 1;
        // Shadow wisps rising from body
        ctx.strokeStyle = 'rgba(20,20,40,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(16, 30); ctx.quadraticCurveTo(10, 18, 12, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(48, 28); ctx.quadraticCurveTo(54, 16, 52, 6); ctx.stroke();
        ctx.strokeStyle = 'rgba(20,20,40,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(22, 34); ctx.quadraticCurveTo(18, 22, 20, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(42, 32); ctx.quadraticCurveTo(46, 20, 44, 8); ctx.stroke();
        // Boots (heavy, dark)
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(18, 66, 10, 8); ctx.fillRect(36, 66, 10, 8);
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(18, 72, 10, 2); ctx.fillRect(36, 72, 10, 2);
        // Legs
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(20, 52, 8, 16); ctx.fillRect(36, 52, 8, 16);
        // Knee plates
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(20, 52, 8, 3); ctx.fillRect(36, 52, 8, 3);
        // Heavy armor torso
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(12, 24, 40, 30);
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(14, 26, 36, 26);
        // Armor plates with detail
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(16, 30, 32, 3);
        ctx.fillRect(16, 40, 32, 3);
        // Void rune on chest plate
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(28, 33, 8, 6);
        ctx.fillStyle = '#ff2222';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(29, 34, 6, 4);
        ctx.globalAlpha = 0.7;
        ctx.fillRect(31, 34, 2, 4);
        ctx.fillRect(29, 35, 6, 1);
        ctx.globalAlpha = 1;
        // Armor edge highlights
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(14, 26, 36, 1);
        ctx.fillRect(14, 51, 36, 1);
        // Pauldrons (large, spiked)
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(2, 20, 14, 12);
        ctx.fillRect(48, 20, 14, 12);
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(4, 22, 10, 8);
        ctx.fillRect(50, 22, 10, 8);
        // Pauldron spikes
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(2, 14); ctx.lineTo(8, 20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(56, 20); ctx.lineTo(60, 14); ctx.lineTo(58, 20); ctx.fill();
        // Arms
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(4, 30, 10, 16);
        ctx.fillRect(50, 30, 10, 16);
        // Gauntlets
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(4, 44, 10, 4);
        ctx.fillRect(50, 44, 10, 4);
        // Helmet (imposing)
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(16, 4, 32, 22);
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(18, 6, 28, 18);
        // Helmet face plate
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(20, 18, 24, 6);
        // Visor (glowing red, menacing)
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(20, 12, 24, 5);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(24, 13, 5, 3);
        ctx.fillRect(36, 13, 5, 3);
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(25, 13, 2, 1);
        ctx.fillRect(37, 13, 2, 1);
        // Eye glow effect
        ctx.fillStyle = 'rgba(255,30,30,0.2)';
        ctx.beginPath(); ctx.arc(26, 14, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(38, 14, 4, 0, Math.PI*2); ctx.fill();
        // Helmet horns (larger)
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(14, -2); ctx.lineTo(24, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(40, 6); ctx.lineTo(50, -2); ctx.lineTo(44, 6); ctx.fill();
        // Horn highlights
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath(); ctx.moveTo(21, 6); ctx.lineTo(16, 0); ctx.lineTo(22, 6); ctx.fill();
        ctx.beginPath(); ctx.moveTo(42, 6); ctx.lineTo(48, 0); ctx.lineTo(43, 6); ctx.fill();
        // Large battle axe
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(58, 2, 4, 52);
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(59, 4, 2, 48);
        // Axe head (double-bladed)
        ctx.fillStyle = '#3a3a4a';
        ctx.beginPath();
        ctx.moveTo(58, 6); ctx.lineTo(50, 2); ctx.lineTo(50, 18); ctx.lineTo(58, 14);
        ctx.closePath(); ctx.fill();
        // Axe blade highlight
        ctx.fillStyle = '#4a4a5a';
        ctx.beginPath();
        ctx.moveTo(58, 8); ctx.lineTo(52, 4); ctx.lineTo(52, 16); ctx.lineTo(58, 12);
        ctx.closePath(); ctx.fill();
        // Axe blade edge glow
        ctx.fillStyle = 'rgba(255,30,30,0.15)';
        ctx.beginPath();
        ctx.moveTo(52, 4); ctx.lineTo(50, 4); ctx.lineTo(50, 16); ctx.lineTo(52, 16);
        ctx.closePath(); ctx.fill();
        // Shadow particles
        ctx.fillStyle = 'rgba(10,10,20,0.4)';
        ctx.fillRect(6, 50, 2, 2); ctx.fillRect(56, 44, 2, 2);
        ctx.fillRect(10, 62, 1, 1); ctx.fillRect(52, 58, 1, 1);
        return c;
    },

    // Boss sprites (larger, 96x120)
    drawCombatAshenKing() {
        const W = 96, H = 120;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Fire glow (ambient)
        ctx.fillStyle = 'rgba(200,80,20,0.1)';
        ctx.beginPath(); ctx.ellipse(48, 60, 46, 56, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(220,100,30,0.06)';
        ctx.beginPath(); ctx.ellipse(48, 60, 38, 44, 0, 0, Math.PI*2); ctx.fill();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(48, 112, 30, 7, 0, 0, Math.PI*2); ctx.fill();
        // Ember particles rising
        ctx.fillStyle = '#ff6600';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(20, 18, 2, 2); ctx.fillRect(72, 22, 2, 2);
        ctx.fillRect(14, 40, 1, 1); ctx.fillRect(80, 36, 1, 1);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(26, 8, 1, 1); ctx.fillRect(68, 12, 1, 1);
        ctx.fillRect(34, 4, 1, 1); ctx.fillRect(60, 6, 1, 1);
        ctx.globalAlpha = 1;
        // Cape (tattered, charred edges)
        ctx.fillStyle = '#4a1a0a';
        ctx.beginPath();
        ctx.moveTo(20, 44); ctx.lineTo(12, 110); ctx.lineTo(84, 110); ctx.lineTo(76, 44);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a2a1a';
        ctx.beginPath();
        ctx.moveTo(22, 46); ctx.lineTo(16, 108); ctx.lineTo(80, 108); ctx.lineTo(74, 46);
        ctx.closePath(); ctx.fill();
        // Cape tattered edges
        ctx.fillStyle = '#4a1a0a';
        for (let i = 0; i < 8; i++) {
            const x = 16 + i * 8;
            ctx.beginPath();
            ctx.moveTo(x, 108); ctx.lineTo(x - 1, 114); ctx.lineTo(x + 4, 108);
            ctx.fill();
        }
        // Cape inner pattern
        ctx.fillStyle = 'rgba(80,30,10,0.3)';
        ctx.fillRect(30, 70, 36, 2);
        ctx.fillRect(28, 86, 40, 2);
        // Boots (armored)
        ctx.fillStyle = '#2a0a0a';
        ctx.fillRect(28, 100, 16, 12); ctx.fillRect(52, 100, 16, 12);
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(30, 102, 12, 8); ctx.fillRect(54, 102, 12, 8);
        // Legs (armored greaves)
        ctx.fillStyle = '#3a1a1a';
        ctx.fillRect(32, 78, 12, 24); ctx.fillRect(54, 78, 12, 24);
        ctx.fillStyle = '#4a2a1a';
        ctx.fillRect(34, 80, 8, 18); ctx.fillRect(56, 80, 8, 18);
        // Knee guards
        ctx.fillStyle = '#3a1a1a';
        ctx.fillRect(31, 78, 14, 4); ctx.fillRect(53, 78, 14, 4);
        // Armor torso (imposing)
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(22, 38, 52, 42);
        ctx.fillStyle = '#5a2a2a';
        ctx.fillRect(24, 40, 48, 38);
        // Armor plate lines
        ctx.fillStyle = '#6a3a2a';
        ctx.fillRect(26, 46, 44, 3);
        ctx.fillRect(26, 56, 44, 3);
        ctx.fillRect(26, 66, 44, 3);
        // Armor rivet details
        ctx.fillStyle = '#7a4a3a';
        ctx.fillRect(28, 47, 2, 1); ctx.fillRect(40, 47, 2, 1); ctx.fillRect(54, 47, 2, 1); ctx.fillRect(66, 47, 2, 1);
        // Gold trim (royal)
        ctx.fillStyle = '#aa8a2a';
        ctx.fillRect(24, 40, 48, 2);
        ctx.fillRect(24, 76, 48, 2);
        ctx.fillStyle = '#ccaa3a';
        ctx.fillRect(26, 40, 44, 1);
        ctx.fillRect(26, 77, 44, 1);
        // Chest emblem (flame motif)
        ctx.fillStyle = '#aa4422';
        ctx.beginPath();
        ctx.moveTo(48, 48); ctx.lineTo(44, 56); ctx.lineTo(48, 52); ctx.lineTo(52, 56);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(48, 49); ctx.lineTo(45, 54); ctx.lineTo(48, 52); ctx.lineTo(51, 54);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // Pauldrons (massive, spiked)
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(4, 34, 22, 16);
        ctx.fillRect(70, 34, 22, 16);
        ctx.fillStyle = '#6a3a2a';
        ctx.fillRect(6, 36, 18, 12);
        ctx.fillRect(72, 36, 18, 12);
        // Pauldron spikes
        ctx.fillStyle = '#4a1a1a';
        ctx.beginPath(); ctx.moveTo(8, 34); ctx.lineTo(4, 24); ctx.lineTo(14, 34); ctx.fill();
        ctx.beginPath(); ctx.moveTo(82, 34); ctx.lineTo(90, 24); ctx.lineTo(86, 34); ctx.fill();
        // Fire on pauldrons (larger)
        ctx.fillStyle = '#ff6600';
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(10, 34); ctx.quadraticCurveTo(8, 22, 14, 26); ctx.quadraticCurveTo(12, 18, 18, 30); ctx.fill();
        ctx.beginPath(); ctx.moveTo(82, 34); ctx.quadraticCurveTo(84, 22, 80, 26); ctx.quadraticCurveTo(86, 18, 78, 30); ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(12, 34); ctx.quadraticCurveTo(10, 24, 16, 28); ctx.fill();
        ctx.beginPath(); ctx.moveTo(82, 34); ctx.quadraticCurveTo(84, 24, 80, 28); ctx.fill();
        ctx.globalAlpha = 1;
        // Arms
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(6, 48, 12, 22); ctx.fillRect(78, 48, 12, 22);
        // Gauntlets
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(6, 66, 12, 6); ctx.fillRect(78, 66, 12, 6);
        // Fiery scepter in right hand
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(82, 22, 4, 48);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(83, 24, 2, 44);
        // Scepter head (burning orb)
        ctx.fillStyle = '#aa4422';
        ctx.beginPath(); ctx.arc(84, 20, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.beginPath(); ctx.arc(84, 20, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(84, 20, 2, 0, Math.PI*2); ctx.fill();
        // Scepter glow
        ctx.fillStyle = 'rgba(255,100,0,0.2)';
        ctx.beginPath(); ctx.arc(84, 20, 10, 0, Math.PI*2); ctx.fill();
        // Helmet (imposing great helm)
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(28, 8, 40, 34);
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(30, 10, 36, 30);
        // Helmet face plate
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(32, 28, 32, 10);
        // Visor slit (wide)
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(32, 20, 32, 7);
        // Fiery eyes (larger, more glow)
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(36, 21, 7, 5);
        ctx.fillRect(54, 21, 7, 5);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(37, 22, 5, 3);
        ctx.fillRect(55, 22, 5, 3);
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(38, 22, 3, 2);
        ctx.fillRect(56, 22, 3, 2);
        // Eye glow
        ctx.fillStyle = 'rgba(255,68,0,0.15)';
        ctx.beginPath(); ctx.arc(39, 23, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(57, 23, 5, 0, Math.PI*2); ctx.fill();
        // Crown (grand, multi-pointed)
        ctx.fillStyle = '#aa8a2a';
        ctx.fillRect(28, 6, 40, 5);
        ctx.fillStyle = '#ccaa3a';
        ctx.fillRect(30, 0, 5, 8);
        ctx.fillRect(38, 0, 5, 10);
        ctx.fillRect(48, 0, 5, 10);
        ctx.fillRect(56, 0, 5, 8);
        // Crown point tips
        ctx.fillStyle = '#ddbb44';
        ctx.fillRect(31, 0, 3, 2);
        ctx.fillRect(39, 0, 3, 2);
        ctx.fillRect(49, 0, 3, 2);
        ctx.fillRect(57, 0, 3, 2);
        // Crown gems (fire opals)
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(39, 3, 3, 3);
        ctx.fillRect(49, 3, 3, 3);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(40, 4, 1, 1);
        ctx.fillRect(50, 4, 1, 1);
        // Crown center gem
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(44, 2, 4, 4);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(45, 3, 2, 2);
        // Mouth slit (breathing fire)
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(36, 32, 24, 3);
        ctx.fillStyle = 'rgba(255,100,0,0.3)';
        ctx.fillRect(38, 32, 20, 2);
        return c;
    },

    drawCombatMotherFen() {
        const W = 96, H = 120;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Swamp miasma glow
        ctx.fillStyle = 'rgba(20,60,20,0.1)';
        ctx.beginPath(); ctx.ellipse(48, 60, 46, 58, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(30,80,20,0.06)';
        ctx.beginPath(); ctx.ellipse(48, 60, 36, 44, 0, 0, Math.PI*2); ctx.fill();
        // Swamp mist particles
        ctx.fillStyle = 'rgba(80,120,60,0.15)';
        ctx.beginPath(); ctx.ellipse(16, 96, 10, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(78, 100, 8, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(48, 114, 12, 3, 0, 0, Math.PI*2); ctx.fill();
        // Coiled body (massive serpent)
        ctx.strokeStyle = '#3a5a2a';
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(24, 110); ctx.quadraticCurveTo(10, 86, 36, 74);
        ctx.quadraticCurveTo(62, 62, 74, 80);
        ctx.quadraticCurveTo(86, 98, 60, 104);
        ctx.quadraticCurveTo(36, 110, 30, 96);
        ctx.stroke();
        // Scale overlay
        ctx.strokeStyle = '#4a6a3a';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(24, 110); ctx.quadraticCurveTo(10, 86, 36, 74);
        ctx.quadraticCurveTo(62, 62, 74, 80);
        ctx.quadraticCurveTo(86, 98, 60, 104);
        ctx.stroke();
        // Scale texture on coils
        ctx.fillStyle = '#3a5a2a';
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 12; i++) {
            const angle = i * 0.5;
            const x = 36 + Math.cos(angle) * 20 + i * 2;
            const y = 80 + Math.sin(angle) * 12;
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Belly stripe (lighter underside)
        ctx.strokeStyle = '#6a8a5a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(24, 110); ctx.quadraticCurveTo(10, 86, 36, 74);
        ctx.quadraticCurveTo(62, 62, 74, 80);
        ctx.stroke();
        // Moss growing on coils
        ctx.fillStyle = '#2a6a1a';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(30, 72, 4, 3); ctx.fillRect(56, 78, 5, 2);
        ctx.fillRect(66, 90, 4, 3); ctx.fillRect(42, 100, 3, 2);
        ctx.globalAlpha = 1;
        // Neck rising up (longer, more imposing)
        ctx.fillStyle = '#3a5a2a';
        ctx.beginPath();
        ctx.moveTo(30, 68); ctx.quadraticCurveTo(24, 36, 36, 18);
        ctx.lineTo(52, 18); ctx.quadraticCurveTo(56, 36, 50, 68);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4a6a3a';
        ctx.beginPath();
        ctx.moveTo(34, 64); ctx.quadraticCurveTo(28, 38, 38, 20);
        ctx.lineTo(50, 20); ctx.quadraticCurveTo(52, 38, 48, 64);
        ctx.closePath(); ctx.fill();
        // Neck belly scales (lighter)
        ctx.fillStyle = '#5a7a4a';
        ctx.beginPath();
        ctx.moveTo(38, 60); ctx.quadraticCurveTo(36, 40, 40, 24);
        ctx.lineTo(48, 24); ctx.quadraticCurveTo(46, 40, 44, 60);
        ctx.closePath(); ctx.fill();
        // Neck scale pattern
        ctx.fillStyle = '#3a5a2a';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(38, 28 + i * 6, 12, 2);
        }
        // Head (large serpent)
        ctx.fillStyle = '#3a5a2a';
        ctx.beginPath(); ctx.ellipse(44, 16, 18, 12, -0.1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#4a6a3a';
        ctx.beginPath(); ctx.ellipse(44, 15, 14, 10, -0.1, 0, Math.PI*2); ctx.fill();
        // Head top scales
        ctx.fillStyle = '#3a5a2a';
        ctx.fillRect(34, 8, 4, 3); ctx.fillRect(40, 6, 4, 3);
        ctx.fillRect(46, 7, 4, 3); ctx.fillRect(52, 9, 4, 3);
        // Hood/frill (cobra-like, expanded)
        ctx.fillStyle = '#3a5a2a';
        ctx.beginPath();
        ctx.moveTo(26, 20); ctx.lineTo(18, 8); ctx.lineTo(16, 14); ctx.lineTo(26, 22);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(62, 20); ctx.lineTo(70, 8); ctx.lineTo(72, 14); ctx.lineTo(62, 22);
        ctx.closePath(); ctx.fill();
        // Frill membrane
        ctx.fillStyle = '#5a3a2a';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(26, 20); ctx.lineTo(20, 10); ctx.lineTo(28, 18);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(62, 20); ctx.lineTo(68, 10); ctx.lineTo(60, 18);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // Eyes (large, yellow, slit pupils, menacing)
        ctx.fillStyle = '#ddcc22';
        ctx.fillRect(34, 12, 6, 6);
        ctx.fillRect(48, 12, 6, 6);
        ctx.fillStyle = '#eedd44';
        ctx.fillRect(35, 13, 4, 4);
        ctx.fillRect(49, 13, 4, 4);
        // Slit pupils
        ctx.fillStyle = '#111';
        ctx.fillRect(36, 12, 2, 6);
        ctx.fillRect(50, 12, 2, 6);
        // Eye glow
        ctx.fillStyle = 'rgba(200,180,30,0.15)';
        ctx.beginPath(); ctx.arc(37, 15, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(51, 15, 5, 0, Math.PI*2); ctx.fill();
        // Nostrils
        ctx.fillStyle = '#2a3a1a';
        ctx.fillRect(38, 20, 2, 2); ctx.fillRect(48, 20, 2, 2);
        // Mouth (wide, dangerous)
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(30, 24, 28, 4);
        ctx.fillStyle = '#3a1a0a';
        ctx.fillRect(32, 25, 24, 2);
        // Fangs (large, dripping venom)
        ctx.fillStyle = '#ddd';
        ctx.fillRect(34, 24, 3, 6);
        ctx.fillRect(52, 24, 3, 6);
        // Smaller fangs
        ctx.fillStyle = '#ccc';
        ctx.fillRect(40, 24, 2, 3);
        ctx.fillRect(48, 24, 2, 3);
        // Venom drips from fangs
        ctx.fillStyle = '#44aa22';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(35, 30, 1, 3); ctx.fillRect(53, 30, 1, 4);
        ctx.globalAlpha = 1;
        // Forked tongue
        ctx.fillStyle = '#8a3a3a';
        ctx.fillRect(42, 26, 4, 1);
        ctx.fillRect(41, 27, 2, 2); ctx.fillRect(45, 27, 2, 2);
        // Smaller snake heads (children) - more of them
        const children = [[14, 56], [76, 64], [10, 88], [82, 86], [22, 104]];
        for (const [sx, sy] of children) {
            // Mini snake body segment
            ctx.fillStyle = '#3a5a2a';
            ctx.strokeStyle = '#3a5a2a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(sx, sy + 8); ctx.quadraticCurveTo(sx - 4, sy + 4, sx, sy);
            ctx.stroke();
            // Mini head
            ctx.fillStyle = '#3a5a2a';
            ctx.beginPath(); ctx.ellipse(sx, sy, 6, 5, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#4a6a3a';
            ctx.beginPath(); ctx.ellipse(sx, sy - 1, 4, 3, 0, 0, Math.PI*2); ctx.fill();
            // Mini eyes
            ctx.fillStyle = '#ddcc22';
            ctx.fillRect(sx - 3, sy - 1, 2, 2);
            ctx.fillRect(sx + 1, sy - 1, 2, 2);
            // Mini pupils
            ctx.fillStyle = '#111';
            ctx.fillRect(sx - 2, sy - 1, 1, 2);
            ctx.fillRect(sx + 2, sy - 1, 1, 2);
        }
        return c;
    },

    drawCombatRuun() {
        const W = 96, H = 120;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Void distortion aura (layered)
        ctx.fillStyle = 'rgba(60,20,80,0.12)';
        ctx.beginPath(); ctx.ellipse(48, 60, 46, 58, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(80,30,100,0.08)';
        ctx.beginPath(); ctx.ellipse(48, 60, 36, 44, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(100,40,120,0.05)';
        ctx.beginPath(); ctx.ellipse(48, 60, 28, 34, 0, 0, Math.PI*2); ctx.fill();
        // Distortion rings
        ctx.strokeStyle = 'rgba(120,60,180,0.12)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const r = 20 + i * 6;
            ctx.beginPath();
            ctx.arc(48, 56, r, Math.PI * i * 0.25, Math.PI * i * 0.25 + 0.7);
            ctx.stroke();
        }
        // Floating reality fragments (orbit around, more varied)
        const drawFragment = (x, y, size, color, rot) => {
            ctx.fillStyle = color;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot || 0);
            ctx.fillRect(-size/2, -size/2, size, size);
            // Fragment highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(-size/2, -size/2, size/2, size/2);
            ctx.restore();
        };
        ctx.globalAlpha = 0.5;
        drawFragment(12, 24, 10, '#5a7a3a', 0.3);
        drawFragment(82, 28, 8, '#3a5a8a', 0.7);
        drawFragment(8, 74, 9, '#8a6a4a', 1.2);
        drawFragment(88, 68, 7, '#4a4a6a', 0.5);
        drawFragment(16, 102, 8, '#6a5a3a', 0.9);
        drawFragment(80, 96, 9, '#3a6a5a', 1.4);
        drawFragment(6, 48, 6, '#7a5a3a', 0.2);
        drawFragment(90, 44, 5, '#3a4a7a', 1.1);
        // Smaller debris particles
        drawFragment(24, 10, 4, '#5a5a7a', 0.6);
        drawFragment(72, 14, 3, '#6a4a5a', 1.0);
        drawFragment(4, 90, 4, '#4a6a4a', 0.4);
        drawFragment(92, 84, 3, '#5a4a6a', 0.8);
        ctx.globalAlpha = 1;
        // Central dark void core (radial gradient)
        const grd = ctx.createRadialGradient(48, 56, 6, 48, 56, 32);
        grd.addColorStop(0, '#0a0010');
        grd.addColorStop(0.4, '#1a0a2a');
        grd.addColorStop(0.7, 'rgba(40,15,60,0.5)');
        grd.addColorStop(1, 'rgba(40,15,60,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.ellipse(48, 56, 32, 36, 0, 0, Math.PI*2); ctx.fill();
        // Inner void (deeper darkness)
        ctx.fillStyle = '#050008';
        ctx.beginPath(); ctx.ellipse(48, 56, 18, 22, 0, 0, Math.PI*2); ctx.fill();
        // Void ripple rings inside core
        ctx.strokeStyle = 'rgba(80,30,100,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(48, 56, 14, 17, 0, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(48, 56, 10, 12, 0, 0, Math.PI*2); ctx.stroke();
        // Rune symbols orbiting the void
        ctx.fillStyle = '#8a4aaa';
        ctx.globalAlpha = 0.4;
        // Rune 1
        ctx.fillRect(24, 50, 4, 1); ctx.fillRect(25, 48, 1, 5);
        ctx.fillRect(24, 52, 3, 1);
        // Rune 2
        ctx.fillRect(68, 54, 4, 1); ctx.fillRect(70, 52, 1, 5);
        ctx.fillRect(69, 56, 3, 1);
        // Rune 3
        ctx.fillRect(44, 82, 1, 4); ctx.fillRect(42, 84, 5, 1);
        // Rune 4
        ctx.fillRect(50, 28, 4, 1); ctx.fillRect(52, 26, 1, 5);
        ctx.globalAlpha = 1;
        // Face/visage in the void
        ctx.fillStyle = '#3a1a4a';
        ctx.beginPath(); ctx.ellipse(48, 48, 12, 16, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2a0a3a';
        ctx.beginPath(); ctx.ellipse(48, 48, 10, 13, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath(); ctx.ellipse(48, 48, 8, 10, 0, 0, Math.PI*2); ctx.fill();
        // Brow ridge
        ctx.fillStyle = '#3a1a4a';
        ctx.fillRect(38, 42, 6, 2); ctx.fillRect(50, 42, 6, 2);
        // Eyes (bright purple-white, piercing)
        ctx.fillStyle = '#aa55ee';
        ctx.fillRect(40, 44, 5, 4);
        ctx.fillRect(52, 44, 5, 4);
        ctx.fillStyle = '#cc88ff';
        ctx.fillRect(41, 45, 3, 2);
        ctx.fillRect(53, 45, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(42, 45, 2, 2);
        ctx.fillRect(54, 45, 2, 2);
        // Eye glow effect
        ctx.fillStyle = 'rgba(180,100,255,0.2)';
        ctx.beginPath(); ctx.arc(42, 46, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(54, 46, 5, 0, Math.PI*2); ctx.fill();
        // Nose
        ctx.fillStyle = '#2a0a3a';
        ctx.fillRect(47, 50, 2, 3);
        // Mouth (void gash, wider)
        ctx.fillStyle = '#0a0010';
        ctx.fillRect(40, 56, 16, 3);
        ctx.fillStyle = '#6a2a8a';
        ctx.fillRect(42, 56, 12, 2);
        // Teeth-like void fragments in mouth
        ctx.fillStyle = '#8a5aaa';
        ctx.fillRect(43, 56, 1, 2); ctx.fillRect(46, 56, 1, 2);
        ctx.fillRect(49, 56, 1, 2); ctx.fillRect(52, 56, 1, 2);
        // Energy tendrils radiating outward (more, thicker)
        ctx.strokeStyle = '#8a3aaa';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(48, 24); ctx.quadraticCurveTo(42, 12, 32, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(48, 24); ctx.quadraticCurveTo(54, 10, 66, 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, 56); ctx.quadraticCurveTo(8, 50, 0, 42); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(76, 56); ctx.quadraticCurveTo(88, 48, 96, 40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(36, 84); ctx.quadraticCurveTo(24, 98, 16, 114); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(60, 84); ctx.quadraticCurveTo(72, 96, 82, 112); ctx.stroke();
        // Secondary tendrils (thinner)
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#bb66dd';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(48, 24); ctx.quadraticCurveTo(48, 8, 48, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18, 56); ctx.quadraticCurveTo(6, 62, 0, 70); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(78, 56); ctx.quadraticCurveTo(90, 62, 96, 70); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(30, 78); ctx.quadraticCurveTo(14, 86, 4, 100); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(66, 78); ctx.quadraticCurveTo(82, 86, 92, 100); ctx.stroke();
        // Tertiary wisps
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#cc88ee';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(36, 30); ctx.quadraticCurveTo(24, 18, 18, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(60, 30); ctx.quadraticCurveTo(72, 18, 78, 8); ctx.stroke();
        ctx.globalAlpha = 1;
        // Tendril tips (bright sparks)
        ctx.fillStyle = '#cc88ff';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(31, 3, 2, 2); ctx.fillRect(65, 1, 2, 2);
        ctx.fillRect(0, 41, 2, 2); ctx.fillRect(94, 39, 2, 2);
        ctx.fillRect(15, 113, 2, 2); ctx.fillRect(81, 111, 2, 2);
        ctx.globalAlpha = 1;
        // Central sparkles (reality breaking)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(47, 40, 2, 2);
        ctx.globalAlpha = 0.6;
        ctx.fillRect(54, 50, 1, 1);
        ctx.fillRect(40, 52, 1, 1);
        ctx.fillRect(50, 38, 1, 1);
        ctx.fillRect(44, 54, 1, 1);
        ctx.globalAlpha = 0.4;
        ctx.fillRect(36, 44, 1, 1); ctx.fillRect(58, 48, 1, 1);
        ctx.fillRect(46, 62, 1, 1); ctx.fillRect(50, 34, 1, 1);
        ctx.globalAlpha = 1;
        return c;
    },

    drawCombatGenericEnemy() {
        const W = 64, H = 80;
        const c = this.mkCanvas(W, H); const ctx = c.getContext('2d');
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(32, 72, 16, 4, 0, 0, Math.PI*2); ctx.fill();
        // Generic dark figure
        ctx.fillStyle = '#3a1a1a';
        ctx.fillRect(20, 54, 8, 16); ctx.fillRect(36, 54, 8, 16);
        ctx.fillStyle = '#5a2a2a';
        ctx.fillRect(14, 26, 36, 30);
        ctx.fillRect(4, 28, 12, 16);
        ctx.fillRect(48, 28, 12, 16);
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(18, 6, 28, 22);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(24, 12, 4, 3);
        ctx.fillRect(36, 12, 4, 3);
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
            // Cool teal-green swamp atmosphere
            ctx.fillStyle = 'rgba(10,40,45,0.16)';
            ctx.fillRect(0, 0, w, h);
            // Low mist band across bottom third
            const mistGrd = ctx.createLinearGradient(0, h * 0.6, 0, h);
            mistGrd.addColorStop(0, 'rgba(60,90,80,0)');
            mistGrd.addColorStop(1, 'rgba(60,90,80,0.08)');
            ctx.fillStyle = mistGrd;
            ctx.fillRect(0, h * 0.6, w, h * 0.4);
        } else if (region === 'void_sanctum') {
            // Deep purple void corruption
            ctx.fillStyle = 'rgba(35,10,50,0.22)';
            ctx.fillRect(0, 0, w, h);
            // Subtle chromatic aberration — thin colored bars at screen edges
            ctx.fillStyle = 'rgba(100,40,160,0.04)';
            ctx.fillRect(0, 0, 3, h);
            ctx.fillRect(w - 3, 0, 3, h);
            // Pulsing void distortion at edges
            const t = Date.now() * 0.001;
            const pulse = Math.sin(t * 0.8) * 0.03;
            ctx.fillStyle = `rgba(80,20,120,${(0.05 + pulse).toFixed(3)})`;
            ctx.fillRect(0, 0, w, h);
        } else if (region === 'ashen_wastes') {
            // Warm amber haze — ash and dust in the air
            ctx.fillStyle = 'rgba(45,30,12,0.1)';
            ctx.fillRect(0, 0, w, h);
            // Heat shimmer at horizon (top of screen)
            const heatGrd = ctx.createLinearGradient(0, 0, 0, h * 0.25);
            heatGrd.addColorStop(0, 'rgba(80,50,20,0.06)');
            heatGrd.addColorStop(1, 'rgba(80,50,20,0)');
            ctx.fillStyle = heatGrd;
            ctx.fillRect(0, 0, w, h * 0.25);
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

        // Zoom factor for screen-space scaling
        const Z = typeof WorldMap !== 'undefined' ? WorldMap.zoom : 1;

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

                // Campfires emit strong warm light
                if (ch === 'F') {
                    const flicker = 0.9 + Math.sin(this.animFrame * 2.1 + tx * 3.7) * 0.1;
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 220 * flicker * Z,
                        color: [255, 160, 60],
                        intensity: 0.85 * flicker
                    });
                }
                // Lanterns
                if (ch === 'L') {
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 160 * Z,
                        color: [255, 200, 80],
                        intensity: 0.6
                    });
                }
                // Ember roots
                if (ch === 'E') {
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 90 * Z,
                        color: [220, 100, 30],
                        intensity: 0.4
                    });
                }
                // Veil crystals
                if (ch === 'V') {
                    const pulse = 0.8 + Math.sin(this.animFrame * 1.5 + tx * 2.3) * 0.2;
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 120 * pulse * Z,
                        color: [150, 80, 220],
                        intensity: 0.5 * pulse
                    });
                }
                // Altars glow with eerie light
                if (ch === 'A') {
                    const pulse = 0.7 + Math.sin(this.animFrame * 1.2 + tx * 1.5) * 0.3;
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 100 * pulse * Z,
                        color: [170, 100, 255],
                        intensity: 0.4 * pulse
                    });
                }
                // Smoke vents — dim ember glow
                if (ch === 'v') {
                    const flicker = 0.7 + Math.sin(this.animFrame * 1.8 + tx * 2.9) * 0.3;
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 100 * flicker * Z,
                        color: [200, 80, 30],
                        intensity: 0.35 * flicker
                    });
                }
                // Ritual circles glow faintly
                if (ch === 'Q') {
                    this.lightSources.push({
                        x: (tx * TS + TS / 2 - camX) * Z,
                        y: (ty * TS + TS / 2 - camY) * Z,
                        radius: 70 * Z,
                        color: [140, 80, 200],
                        intensity: 0.25
                    });
                }
            }
        }

        // Entity-based lights
        for (const key in entityMap) {
            const entity = entityMap[key];
            if (entity.type === 'campfire') {
                const [ex, ey] = key.split(',').map(Number);
                const flicker = 0.85 + Math.sin(this.animFrame * 2.5 + ex * 4.1) * 0.15;
                this.lightSources.push({
                    x: (ex * TS + TS / 2 - camX) * Z,
                    y: (ey * TS + TS / 2 - camY) * Z,
                    radius: 260 * flicker * Z,
                    color: [255, 140, 50],
                    intensity: 0.9 * flicker
                });
            }
        }
    },

    drawLighting(ctx, w, h, region, timeOfDay) {
        if (timeOfDay === undefined) timeOfDay = 0.5;

        // Determine base ambient darkness level by region — dark fantasy: overall darker
        let baseDark = 0.32;
        if (region === 'void_sanctum') baseDark = 0.48;
        else if (region === 'hollowfen') baseDark = 0.38;
        else if (region === 'scorched_village') baseDark = 0.35;

        // Time-of-day darkness offset (smooth cosine interpolation via keyframes)
        // Dark fantasy: nights are much darker, days still have a brooding quality
        const todKeys = [
            { t: 0.0, v: 0.40 },
            { t: 0.25, v: 0.12 },
            { t: 0.5, v: 0.0 },
            { t: 0.75, v: 0.18 },
            { t: 1.0, v: 0.40 }
        ];
        let todOffset = 0;
        for (let i = 0; i < todKeys.length - 1; i++) {
            if (timeOfDay >= todKeys[i].t && timeOfDay <= todKeys[i + 1].t) {
                const span = todKeys[i + 1].t - todKeys[i].t;
                const frac = (timeOfDay - todKeys[i].t) / span;
                const smooth = 0.5 - 0.5 * Math.cos(frac * Math.PI);
                todOffset = todKeys[i].v + (todKeys[i + 1].v - todKeys[i].v) * smooth;
                break;
            }
        }
        const ambientDark = Math.min(0.85, baseDark + todOffset);

        // Player light radius — larger at night for visibility, overall slightly smaller for moodier feel
        const isNight = (timeOfDay < 0.15 || timeOfDay >= 0.8);
        const playerLightRadius = isNight ? 170 : 120;

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

        // Player emits a personal light (wider radius at night, scaled by zoom)
        const Z = typeof WorldMap !== 'undefined' ? WorldMap.zoom : 1;
        const plr = playerLightRadius * Z;
        const px = w / 2, py = h / 2;
        const playerGrd = lctx.createRadialGradient(px, py, 0, px, py, plr);
        playerGrd.addColorStop(0, 'rgba(0,0,0,0.45)');
        playerGrd.addColorStop(0.6, 'rgba(0,0,0,0.15)');
        playerGrd.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = playerGrd;
        lctx.fillRect(px - plr, py - plr, plr * 2, plr * 2);

        // Apply darkness overlay to main canvas
        ctx.drawImage(this._lightCanvas, 0, 0);

        // Colored light glows — warmer, stronger tint for dark fantasy fire-lit feel
        lctx.globalCompositeOperation = 'source-over';
        lctx.clearRect(0, 0, w, h);
        for (const light of this.lightSources) {
            const grd = lctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius * 0.9
            );
            const [r, g, b] = light.color;
            grd.addColorStop(0, `rgba(${r},${g},${b},${(light.intensity * 0.35).toFixed(3)})`);
            grd.addColorStop(0.3, `rgba(${r},${g},${b},${(light.intensity * 0.18).toFixed(3)})`);
            grd.addColorStop(0.7, `rgba(${r},${g},${b},${(light.intensity * 0.06).toFixed(3)})`);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            lctx.fillStyle = grd;
            lctx.fillRect(light.x - light.radius, light.y - light.radius,
                light.radius * 2, light.radius * 2);
        }
        ctx.drawImage(this._lightCanvas, 0, 0);

        // Time-of-day color tint overlay — dark fantasy: deeper blues at night, warmer fire at dusk
        // Dawn: warm amber, Noon: slight desaturation, Dusk: blood-orange, Night: deep indigo
        const tintKeys = [
            { t: 0.0, r: 15, g: 20, b: 60, a: 0.18 },
            { t: 0.15, r: 15, g: 20, b: 60, a: 0.18 },
            { t: 0.25, r: 220, g: 130, b: 50, a: 0.10 },
            { t: 0.35, r: 200, g: 120, b: 50, a: 0.03 },
            { t: 0.5, r: 10, g: 10, b: 20, a: 0.03 },
            { t: 0.65, r: 180, g: 80, b: 40, a: 0.04 },
            { t: 0.75, r: 180, g: 60, b: 30, a: 0.14 },
            { t: 0.85, r: 15, g: 20, b: 60, a: 0.18 },
            { t: 1.0, r: 15, g: 20, b: 60, a: 0.18 }
        ];
        let tr = 0, tg = 0, tb = 0, ta = 0;
        for (let i = 0; i < tintKeys.length - 1; i++) {
            if (timeOfDay >= tintKeys[i].t && timeOfDay <= tintKeys[i + 1].t) {
                const span = tintKeys[i + 1].t - tintKeys[i].t;
                const frac = span > 0 ? (timeOfDay - tintKeys[i].t) / span : 0;
                const smooth = 0.5 - 0.5 * Math.cos(frac * Math.PI);
                tr = Math.round(tintKeys[i].r + (tintKeys[i + 1].r - tintKeys[i].r) * smooth);
                tg = Math.round(tintKeys[i].g + (tintKeys[i + 1].g - tintKeys[i].g) * smooth);
                tb = Math.round(tintKeys[i].b + (tintKeys[i + 1].b - tintKeys[i].b) * smooth);
                ta = tintKeys[i].a + (tintKeys[i + 1].a - tintKeys[i].a) * smooth;
                break;
            }
        }
        if (ta > 0.001) {
            ctx.fillStyle = `rgba(${tr},${tg},${tb},${ta.toFixed(3)})`;
            ctx.fillRect(0, 0, w, h);
        }
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
        const roll = Math.random();

        if (region === 'ashen_wastes') {
            if (roll < 0.6) {
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
            } else {
                // Ember sparks — small bright orange motes that rise fast and die
                this.ambientParticles.push({
                    x: worldX, y: worldY,
                    vx: (Math.random() - 0.5) * 10,
                    vy: -20 - Math.random() * 15,
                    life: 1.5 + Math.random() * 2,
                    maxLife: 1.5 + Math.random() * 2,
                    color: Math.random() < 0.5 ? '#ff8830' : '#ffaa44',
                    size: 1,
                    wave: true,
                    waveFreq: 4 + Math.random() * 3,
                    waveAmp: 4,
                    waveOffset: Math.random() * 6.28,
                    isSpark: true
                });
            }
        } else if (region === 'hollowfen') {
            if (roll < 0.5) {
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
            } else if (roll < 0.8) {
                // Fireflies — pulsing green-yellow dots that float and wander
                this.ambientParticles.push({
                    x: worldX, y: worldY,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 6,
                    life: 4 + Math.random() * 5,
                    maxLife: 4 + Math.random() * 5,
                    color: Math.random() < 0.6 ? '#88dd44' : '#aaee66',
                    size: 1.5,
                    wave: true,
                    waveFreq: 1.5 + Math.random() * 2,
                    waveAmp: 10 + Math.random() * 8,
                    waveOffset: Math.random() * 6.28,
                    isFirefly: true,
                    pulsePhase: Math.random() * 6.28
                });
            } else {
                // Spore puffs — tiny, drift upward slowly
                this.ambientParticles.push({
                    x: worldX, y: worldY,
                    vx: (Math.random() - 0.5) * 5,
                    vy: -3 - Math.random() * 5,
                    life: 3 + Math.random() * 3,
                    maxLife: 3 + Math.random() * 3,
                    color: '#aa9966',
                    size: 1,
                    wave: true,
                    waveFreq: 2 + Math.random() * 2,
                    waveAmp: 5,
                    waveOffset: Math.random() * 6.28
                });
            }
        } else if (region === 'void_sanctum') {
            if (roll < 0.5) {
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
            } else if (roll < 0.8) {
                // Reality glitch — a brief horizontal line that flickers
                this.ambientParticles.push({
                    x: worldX, y: worldY,
                    vx: 0, vy: 0,
                    life: 0.2 + Math.random() * 0.4,
                    maxLife: 0.2 + Math.random() * 0.4,
                    color: Math.random() < 0.5 ? '#cc44ff' : '#4488ff',
                    size: 8 + Math.random() * 20,
                    isGlitch: true
                });
            } else {
                // Void eye — a brief flash that looks like a watching eye
                this.ambientParticles.push({
                    x: worldX, y: worldY,
                    vx: 0, vy: 0,
                    life: 0.8 + Math.random() * 1.2,
                    maxLife: 0.8 + Math.random() * 1.2,
                    color: '#cc66ff',
                    size: 2,
                    isVoidEye: true,
                    pulsePhase: Math.random() * 6.28
                });
            }
        }
    },

    drawAmbientParticles(ctx, camX, camY) {
        for (const p of this.ambientParticles) {
            const alpha = Math.min(1, (p.life / p.maxLife) * 2) * Math.min(1, p.life);
            if (alpha <= 0) continue;

            const sx = p.x - camX;
            const sy = p.y - camY;

            if (p.isBlob) {
                // Fog blob — large translucent ellipse
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(sx, sy, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.isFirefly) {
                // Firefly — pulsing glow dot
                const pulse = 0.3 + Math.sin(Date.now() * 0.005 + p.pulsePhase) * 0.7;
                ctx.globalAlpha = alpha * pulse;
                // Glow halo
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
                // Bright center
                ctx.globalAlpha = alpha * pulse * 1.2;
                ctx.fillStyle = '#eeffaa';
                ctx.fillRect(Math.floor(sx) - 0.5, Math.floor(sy) - 0.5, 1, 1);
            } else if (p.isSpark) {
                // Ember spark — tiny bright pixel
                ctx.globalAlpha = alpha * 0.9;
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
            } else if (p.isGlitch) {
                // Reality glitch — horizontal scanline
                ctx.globalAlpha = alpha * 0.4;
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), p.size, 1);
                // Secondary offset line
                ctx.globalAlpha = alpha * 0.2;
                ctx.fillRect(Math.floor(sx) + 2, Math.floor(sy) + 2, p.size * 0.6, 1);
            } else if (p.isVoidEye) {
                // Void eye — brief watching eye shape
                const pulse = Math.sin(Date.now() * 0.008 + p.pulsePhase);
                const openness = Math.max(0, pulse) * alpha;
                if (openness > 0.1) {
                    ctx.globalAlpha = openness * 0.5;
                    ctx.fillStyle = p.color;
                    // Outer eye shape
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, 4, 2 * openness, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Pupil
                    ctx.globalAlpha = openness * 0.8;
                    ctx.fillStyle = '#220044';
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Default — simple pixel particle
                ctx.globalAlpha = alpha * 0.7;
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.floor(sx), Math.floor(sy), p.size, p.size);
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
