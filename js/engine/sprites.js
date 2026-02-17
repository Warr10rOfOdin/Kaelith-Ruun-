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

        // Generate multiple variations for common tiles
        for (let v = 0; v < 4; v++) {
            this.cache[`grass_${v}`] = this.drawGrass(v);
        }
        for (let v = 0; v < 3; v++) {
            this.cache[`path_${v}`] = this.drawPath(v);
        }
        for (let v = 0; v < 3; v++) {
            this.cache[`tree_${v}`] = this.drawTree(v);
        }
        for (let v = 0; v < 2; v++) {
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
            case '.': return this.cache[`grass_${h % 4}`];
            case 'p': return this.cache[`path_${h % 3}`];
            case '#': return this.cache.wall;
            case 'T': return this.cache[`tree_${h % 3}`];
            case 'R': return this.cache[`rock_${h % 2}`];
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

        // Base
        ctx.fillStyle = P[1];
        ctx.fillRect(0, 0, T, T);

        // Color variation patches
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = P[Math.floor(rng() * P.length)];
            const x = Math.floor(rng() * T);
            const y = Math.floor(rng() * T);
            ctx.fillRect(x, y, 2 + Math.floor(rng() * 4), 2 + Math.floor(rng() * 3));
        }

        // Small grass blades
        ctx.fillStyle = P[3];
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(rng() * (T - 2));
            const y = Math.floor(rng() * (T - 4));
            ctx.fillRect(x, y, 1, 3);
            ctx.fillRect(x + 1, y + 1, 1, 2);
        }

        // Occasional tiny flowers
        if (variant === 2) {
            ctx.fillStyle = '#dddd44';
            ctx.fillRect(10, 14, 2, 2);
            ctx.fillStyle = '#ee6666';
            ctx.fillRect(22, 8, 2, 2);
        }
        if (variant === 3) {
            ctx.fillStyle = '#aaddff';
            ctx.fillRect(6, 20, 2, 2);
        }

        return c;
    },

    drawPath(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.path;
        const rng = this.seeded(variant * 2000 + 77);

        ctx.fillStyle = P[0];
        ctx.fillRect(0, 0, T, T);

        // Texture
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = P[Math.floor(rng() * P.length)];
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T),
                2 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 2));
        }

        // Small pebbles
        ctx.fillStyle = '#9a8a7a';
        for (let i = 0; i < 3; i++) {
            const x = 4 + Math.floor(rng() * (T - 8));
            const y = 4 + Math.floor(rng() * (T - 8));
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        return c;
    },

    drawWall() {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.wall;

        // Base dark
        ctx.fillStyle = P[1];
        ctx.fillRect(0, 0, T, T);

        // Stone block pattern
        for (let row = 0; row < 4; row++) {
            const offset = (row % 2) * 8;
            for (let col = 0; col < 3; col++) {
                const x = offset + col * 12;
                const y = row * 8;
                // Block face
                ctx.fillStyle = P[0];
                ctx.fillRect(x + 1, y + 1, 10, 6);
                // Highlight top edge
                ctx.fillStyle = P[2];
                ctx.fillRect(x + 1, y + 1, 10, 1);
                // Shadow bottom edge
                ctx.fillStyle = P[1];
                ctx.fillRect(x + 1, y + 7, 10, 1);
            }
        }

        return c;
    },

    drawTree(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 3000 + 13);

        // Grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = P.grass[Math.floor(rng() * P.grass.length)];
            ctx.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 3, 2);
        }

        // Shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(16, 28, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        const tw = 4 + Math.floor(rng() * 2);
        const tx = 16 - tw / 2;
        ctx.fillStyle = P.trunk[0];
        ctx.fillRect(tx, 16, tw, 14);
        ctx.fillStyle = P.trunk[1];
        ctx.fillRect(tx + 1, 16, tw - 2, 12);

        // Canopy layers (bottom to top, dark to light)
        const cx = 16 + (variant - 1) * 1;
        const cy = 10 + (variant === 1 ? -1 : 0);

        ctx.fillStyle = P.leaves[0];
        ctx.beginPath();
        ctx.ellipse(cx, cy + 3, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = P.leaves[2];
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = P.leaves[1];
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy - 2, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = P.leaves[4];
        ctx.beginPath();
        ctx.ellipse(cx - 1, cy - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Texture dots on canopy
        ctx.fillStyle = P.leaves[0];
        for (let i = 0; i < 5; i++) {
            const dx = cx - 8 + Math.floor(rng() * 16);
            const dy = cy - 6 + Math.floor(rng() * 12);
            ctx.fillRect(dx, dy, 2, 2);
        }

        return c;
    },

    drawRock(variant) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL;
        const rng = this.seeded(variant * 4000 + 31);

        // Grass base
        ctx.fillStyle = P.grass[1];
        ctx.fillRect(0, 0, T, T);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(16, 26, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rock body
        const rx = variant === 0 ? 16 : 14;
        const ry = variant === 0 ? 16 : 14;

        ctx.fillStyle = P.rock[2];
        ctx.beginPath();
        ctx.ellipse(rx, ry + 2, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = P.rock[0];
        ctx.beginPath();
        ctx.ellipse(rx, ry, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = P.rock[3];
        ctx.beginPath();
        ctx.ellipse(rx - 2, ry - 3, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Cracks
        ctx.strokeStyle = P.rock[2];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx - 3, ry - 1);
        ctx.lineTo(rx + 2, ry + 2);
        ctx.lineTo(rx + 5, ry);
        ctx.stroke();

        return c;
    },

    drawWater(frame) {
        const c = this.mkCanvas(); const ctx = c.getContext('2d'); const T = this.TS;
        const P = this.PAL.water;

        // Deep water base
        ctx.fillStyle = P[0];
        ctx.fillRect(0, 0, T, T);

        // Wave pattern (shifts with frame)
        const offset = frame * 4;
        for (let row = 0; row < 4; row++) {
            ctx.fillStyle = P[1 + (row + frame) % 2];
            for (let col = 0; col < 5; col++) {
                const x = ((col * 8 + offset + row * 3) % (T + 4)) - 2;
                const y = row * 8 + 2;
                ctx.beginPath();
                ctx.ellipse(x, y, 5, 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Sparkle highlights
        ctx.fillStyle = 'rgba(180,220,255,0.3)';
        const sparkX = (8 + frame * 11) % T;
        const sparkY = (4 + frame * 7) % T;
        ctx.fillRect(sparkX, sparkY, 2, 2);
        ctx.fillRect((sparkX + 15) % T, (sparkY + 12) % T, 1, 1);

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

        ctx.fillStyle = P.grass[4];
        ctx.fillRect(0, 0, T, T);

        // Purple glow
        ctx.fillStyle = 'rgba(120,60,180,0.2)';
        ctx.beginPath();
        ctx.ellipse(16, 18, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crystal shards
        const drawShard = (x, y, w, h, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h);
            ctx.closePath();
            ctx.fill();
        };

        drawShard(10, 8, 6, 18, P.crystal[0]);
        drawShard(16, 5, 5, 20, P.crystal[1]);
        drawShard(20, 10, 4, 14, P.crystal[2]);

        // Highlights
        ctx.fillStyle = P.crystal[3];
        ctx.fillRect(12, 12, 2, 4);
        ctx.fillRect(18, 9, 1, 3);

        // Sparkle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(17, 7, 1, 1);

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

        // Warm ground glow
        ctx.fillStyle = 'rgba(200,120,40,0.15)';
        ctx.beginPath();
        ctx.ellipse(16, 24, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone ring
        ctx.fillStyle = P.rock[2];
        for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2;
            const x = 16 + Math.cos(angle) * 8;
            const y = 22 + Math.sin(angle) * 5;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fire (animated)
        const fOff = frame * 2;
        // Outer flame
        ctx.fillStyle = P.fire[2];
        ctx.beginPath();
        ctx.moveTo(10, 22);
        ctx.quadraticCurveTo(12 + fOff, 6 - fOff, 16, 10 + fOff);
        ctx.quadraticCurveTo(20 - fOff, 6 + fOff, 22, 22);
        ctx.closePath();
        ctx.fill();

        // Middle flame
        ctx.fillStyle = P.fire[0];
        ctx.beginPath();
        ctx.moveTo(12, 22);
        ctx.quadraticCurveTo(14 - fOff, 10 + fOff, 16, 12 - fOff);
        ctx.quadraticCurveTo(18 + fOff, 10 - fOff, 20, 22);
        ctx.closePath();
        ctx.fill();

        // Inner flame (bright)
        ctx.fillStyle = P.fire[3];
        ctx.beginPath();
        ctx.moveTo(14, 22);
        ctx.quadraticCurveTo(15, 14 + fOff, 16, 15 - fOff);
        ctx.quadraticCurveTo(17, 14 - fOff, 18, 22);
        ctx.closePath();
        ctx.fill();

        // Sparks
        ctx.fillStyle = P.fire[1];
        ctx.fillRect(13 + frame * 3, 8 - frame, 1, 1);
        ctx.fillRect(18 - frame * 2, 6 + frame, 1, 1);

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
        const c = this.mkCanvas(24, 32);
        const ctx = c.getContext('2d');
        const sk = this.PAL.skin[0];
        const hair = '#5a3020';
        const shirt = '#3a6aaa';
        const pants = '#4a3a30';
        const boots_ = '#3a2a1a';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(12, 30, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animation offsets
        const walkBob = frame === 0 ? 0 : (frame === 1 ? -1 : -1);
        const legOff = frame === 0 ? 0 : (frame === 1 ? 2 : -2);

        // -- Legs / Boots --
        ctx.fillStyle = pants;
        if (dir === 'left' || dir === 'right') {
            // Side view legs
            ctx.fillRect(8, 22 + walkBob, 4, 6);
            ctx.fillRect(12 + legOff, 22 + walkBob, 4, 6);
            ctx.fillStyle = boots_;
            ctx.fillRect(8, 27 + walkBob, 5, 3);
            ctx.fillRect(12 + legOff, 27 + walkBob, 5, 3);
        } else {
            // Front/back legs
            ctx.fillRect(6 - legOff, 22 + walkBob, 5, 6);
            ctx.fillRect(13 + legOff, 22 + walkBob, 5, 6);
            ctx.fillStyle = boots_;
            ctx.fillRect(5 - legOff, 27 + walkBob, 6, 3);
            ctx.fillRect(13 + legOff, 27 + walkBob, 6, 3);
        }

        // -- Body --
        ctx.fillStyle = shirt;
        ctx.fillRect(5, 14 + walkBob, 14, 9);

        // -- Arms --
        const armSwing = frame === 0 ? 0 : (frame === 1 ? 2 : -2);
        ctx.fillStyle = shirt;
        if (dir === 'left') {
            ctx.fillRect(2, 15 + walkBob - armSwing, 4, 7);
            ctx.fillStyle = sk;
            ctx.fillRect(2, 20 + walkBob - armSwing, 4, 3);
        } else if (dir === 'right') {
            ctx.fillRect(18, 15 + walkBob + armSwing, 4, 7);
            ctx.fillStyle = sk;
            ctx.fillRect(18, 20 + walkBob + armSwing, 4, 3);
        } else {
            ctx.fillRect(1, 15 + walkBob + armSwing, 4, 7);
            ctx.fillRect(19, 15 + walkBob - armSwing, 4, 7);
            ctx.fillStyle = sk;
            ctx.fillRect(1, 20 + walkBob + armSwing, 4, 3);
            ctx.fillRect(19, 20 + walkBob - armSwing, 4, 3);
        }

        // -- Head --
        ctx.fillStyle = sk;
        ctx.fillRect(5, 3 + walkBob, 14, 12);

        // -- Hair --
        ctx.fillStyle = hair;
        ctx.fillRect(4, 1 + walkBob, 16, 6);
        if (dir === 'down') {
            ctx.fillRect(4, 3 + walkBob, 3, 5);
            ctx.fillRect(17, 3 + walkBob, 3, 5);
        } else if (dir === 'up') {
            ctx.fillRect(4, 1 + walkBob, 16, 10);
        } else if (dir === 'left') {
            ctx.fillRect(4, 1 + walkBob, 6, 10);
        } else {
            ctx.fillRect(14, 1 + walkBob, 6, 10);
        }

        // -- Face --
        if (dir === 'down') {
            // Eyes
            ctx.fillStyle = '#222';
            ctx.fillRect(8, 8 + walkBob, 2, 2);
            ctx.fillRect(14, 8 + walkBob, 2, 2);
            // Eye highlights
            ctx.fillStyle = '#fff';
            ctx.fillRect(8, 8 + walkBob, 1, 1);
            ctx.fillRect(14, 8 + walkBob, 1, 1);
            // Mouth
            ctx.fillStyle = '#aa8878';
            ctx.fillRect(10, 12 + walkBob, 4, 1);
        } else if (dir === 'left') {
            ctx.fillStyle = '#222';
            ctx.fillRect(6, 8 + walkBob, 2, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(6, 8 + walkBob, 1, 1);
        } else if (dir === 'right') {
            ctx.fillStyle = '#222';
            ctx.fillRect(16, 8 + walkBob, 2, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(16, 8 + walkBob, 1, 1);
        }

        return c;
    },

    // ── Entity Sprite Generation ────────────

    genEntitySprites() {
        // NPC generic (with color param)
        const npcColors = [
            { hair: '#8a4a2a', shirt: '#aa3a3a', name: 'npc_red' },
            { hair: '#3a3a5a', shirt: '#3a7a3a', name: 'npc_green' },
            { hair: '#aa8a4a', shirt: '#6a5a8a', name: 'npc_purple' },
            { hair: '#2a2a2a', shirt: '#8a7a5a', name: 'npc_tan' },
        ];
        for (const npc of npcColors) {
            this.cache[npc.name] = this.drawNPC(npc.hair, npc.shirt);
        }

        // Merchant
        this.cache.npc_merchant = this.drawNPC('#aa8a2a', '#2a5a2a');

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

    drawNPC(hairColor, shirtColor) {
        const c = this.mkCanvas(24, 32);
        const ctx = c.getContext('2d');
        const sk = this.PAL.skin[1];

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(12, 30, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#4a4040';
        ctx.fillRect(6, 22, 5, 6);
        ctx.fillRect(13, 22, 5, 6);
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(5, 27, 6, 3);
        ctx.fillRect(13, 27, 6, 3);

        // Body
        ctx.fillStyle = shirtColor;
        ctx.fillRect(5, 14, 14, 9);

        // Arms
        ctx.fillRect(1, 15, 4, 7);
        ctx.fillRect(19, 15, 4, 7);
        ctx.fillStyle = sk;
        ctx.fillRect(1, 20, 4, 3);
        ctx.fillRect(19, 20, 4, 3);

        // Head
        ctx.fillStyle = sk;
        ctx.fillRect(5, 3, 14, 12);

        // Hair
        ctx.fillStyle = hairColor;
        ctx.fillRect(4, 1, 16, 6);
        ctx.fillRect(4, 3, 3, 5);
        ctx.fillRect(17, 3, 3, 5);

        // Eyes
        ctx.fillStyle = '#222';
        ctx.fillRect(8, 8, 2, 2);
        ctx.fillRect(14, 8, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(8, 8, 1, 1);
        ctx.fillRect(14, 8, 1, 1);

        // Mouth
        ctx.fillStyle = '#aa8878';
        ctx.fillRect(10, 12, 4, 1);

        return c;
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
        const c = this.mkCanvas(16, 16);
        const ctx = c.getContext('2d');

        // Red exclamation mark
        ctx.fillStyle = '#ee3333';
        ctx.fillRect(6, 2, 4, 8);
        ctx.fillRect(6, 12, 4, 3);

        return c;
    },

    drawBossMarker() {
        const c = this.mkCanvas(20, 20);
        const ctx = c.getContext('2d');

        // Skull icon
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(10, 8, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#220000';
        ctx.fillRect(6, 7, 3, 3);
        ctx.fillRect(11, 7, 3, 3);

        ctx.fillStyle = '#ff4444';
        ctx.fillRect(7, 14, 6, 3);

        ctx.fillStyle = '#220000';
        ctx.fillRect(8, 14, 1, 3);
        ctx.fillRect(10, 14, 1, 3);
        ctx.fillRect(12, 14, 1, 3);

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

    // ── Region Tinting ──────────────────────

    applyRegionTint(ctx, w, h, region) {
        if (region === 'hollowfen') {
            ctx.fillStyle = 'rgba(20,40,60,0.12)';
            ctx.fillRect(0, 0, w, h);
        } else if (region === 'void_sanctum') {
            ctx.fillStyle = 'rgba(40,10,50,0.18)';
            ctx.fillRect(0, 0, w, h);
        } else if (region === 'ashen_wastes') {
            ctx.fillStyle = 'rgba(40,25,10,0.08)';
            ctx.fillRect(0, 0, w, h);
        }
    },

    // ── Vignette Effect ─────────────────────

    drawVignette(ctx, w, h) {
        const grd = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
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
