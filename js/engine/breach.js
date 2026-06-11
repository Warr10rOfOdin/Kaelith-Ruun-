// ============================================
// THE BREACH — REAL-TIME ACTION ROGUELITE
// ============================================
// The new core game mode of Kaelith Ruun.
// One-thumb survivors-style runs: swarms of enemies,
// auto-attacking weapons, XP gems, level-up drafts,
// region bosses at the 5-minute mark, and permanent
// meta-progression banked between runs.
//
// Pure canvas + DOM overlays. No dependencies.
// ============================================

// ── Region configuration (content pulled from WORLD/ENEMIES) ──
const BREACH_REGIONS = [
    {
        key: 'ashen_wastes', name: 'The Ashen Wastes', icon: '🔥',
        ground: '#191412', groundDetail: '#241c17', prop: '#0e0b09',
        glow: 'rgba(200,90,30,0.10)', gem: '#ffb347'
    },
    {
        key: 'hollowfen', name: 'The Hollowfen', icon: '🌿',
        ground: '#0f1a15', groundDetail: '#16241d', prop: '#080d0b',
        glow: 'rgba(60,180,120,0.08)', gem: '#7be3a0'
    },
    {
        key: 'void_sanctum', name: 'The Void Sanctum', icon: '🌀',
        ground: '#120f1e', groundDetail: '#1a1530', prop: '#0a0814',
        glow: 'rgba(140,80,220,0.10)', gem: '#c08aff'
    },
    {
        key: 'shattered_spire', name: 'The Shattered Spire', icon: '💎',
        ground: '#0e1420', groundDetail: '#15203250', prop: '#080c14',
        glow: 'rgba(90,140,230,0.10)', gem: '#8ad0ff'
    }
];

// ── Weapons: auto-firing, 5 levels each ──
const BREACH_WEAPONS = {
    voidblade: {
        name: 'Voidblade', icon: '🗡️',
        desc: 'Sweeping arc slashes where you face.',
        levels: [
            { dmg: 16, cd: 0.70, arc: 2.4, range: 86 },
            { dmg: 21, cd: 0.68, arc: 2.8, range: 94 },
            { dmg: 25, cd: 0.72, arc: 3.3, range: 102 },
            { dmg: 33, cd: 0.65, arc: 4.2, range: 112 },
            { dmg: 45, cd: 0.55, arc: 6.3, range: 126 }
        ],
        upgradeText: ['Wider, faster arcs', 'Heavier blade', 'Greater reach', 'A full circle of edges']
    },
    runebolt: {
        name: 'Runebolt', icon: '✨',
        desc: 'Seeking bolts strike the nearest foes.',
        levels: [
            { dmg: 11, cd: 1.05, count: 1, speed: 330 },
            { dmg: 13, cd: 0.95, count: 2, speed: 345 },
            { dmg: 16, cd: 0.88, count: 3, speed: 360 },
            { dmg: 20, cd: 0.78, count: 4, speed: 380 },
            { dmg: 26, cd: 0.65, count: 5, speed: 420 }
        ],
        upgradeText: ['+1 bolt', '+1 bolt', '+1 bolt, faster', '+1 bolt, far faster']
    },
    duskfan: {
        name: 'Dusk Fan', icon: '🌙',
        desc: 'A fan of piercing daggers thrown ahead.',
        levels: [
            { dmg: 9, cd: 1.15, count: 3, spread: 0.5, speed: 420, pierce: 1 },
            { dmg: 11, cd: 1.05, count: 4, spread: 0.6, speed: 440, pierce: 1 },
            { dmg: 14, cd: 0.95, count: 5, spread: 0.7, speed: 460, pierce: 2 },
            { dmg: 17, cd: 0.85, count: 6, spread: 0.8, speed: 480, pierce: 2 },
            { dmg: 22, cd: 0.70, count: 8, spread: 1.0, speed: 520, pierce: 3 }
        ],
        upgradeText: ['+1 dagger', '+1 dagger, +pierce', '+1 dagger', '+2 daggers, +pierce']
    },
    soulward: {
        name: 'Soul Ward', icon: '🔮',
        desc: 'Spirit orbs orbit you, burning what they touch.',
        levels: [
            { dmg: 10, count: 2, radius: 68, rot: 2.6 },
            { dmg: 13, count: 3, radius: 72, rot: 2.8 },
            { dmg: 16, count: 4, radius: 78, rot: 3.0 },
            { dmg: 20, count: 5, radius: 86, rot: 3.3 },
            { dmg: 26, count: 6, radius: 96, rot: 3.8 }
        ],
        upgradeText: ['+1 orb', '+1 orb', '+1 orb, wider', '+1 orb, faster']
    },
    bloodlash: {
        name: 'Blood Lash', icon: '🩸',
        desc: 'Whip strikes lash both sides. Drinks a little life.',
        levels: [
            { dmg: 16, cd: 1.35, w: 130, h: 46, steal: 0.04 },
            { dmg: 22, cd: 1.25, w: 150, h: 52, steal: 0.05 },
            { dmg: 29, cd: 1.12, w: 172, h: 58, steal: 0.06 },
            { dmg: 38, cd: 1.00, w: 196, h: 64, steal: 0.07 },
            { dmg: 52, cd: 0.85, w: 230, h: 76, steal: 0.09 }
        ],
        upgradeText: ['Longer reach', 'Deeper cuts', 'Thirstier', 'Arterial spray']
    },
    embernova: {
        name: 'Ember Nova', icon: '☀️',
        desc: 'A burning ring erupts from your body.',
        levels: [
            { dmg: 20, cd: 3.6, radius: 110 },
            { dmg: 27, cd: 3.3, radius: 126 },
            { dmg: 36, cd: 3.0, radius: 144 },
            { dmg: 47, cd: 2.7, radius: 164 },
            { dmg: 64, cd: 2.2, radius: 195 }
        ],
        upgradeText: ['Wider blast', 'Hotter core', 'Faster eruption', 'A small sun']
    }
};

// ── Passives: 5 levels each ──
const BREACH_PASSIVES = {
    might:    { name: 'Might',    icon: '⚔️', desc: '+10% damage per rank',          per: 0.10 },
    alacrity: { name: 'Alacrity', icon: '⚡', desc: '+8% attack speed per rank',     per: 0.08 },
    vitality: { name: 'Vitality', icon: '❤️', desc: '+20 max HP per rank (and heal 20)', per: 20 },
    swiftness:{ name: 'Swiftness',icon: '👢', desc: '+8% move speed per rank',       per: 0.08 },
    magnet:   { name: 'Magnet',   icon: '🧲', desc: '+30% pickup radius per rank',   per: 0.30 },
    warding:  { name: 'Warding',  icon: '🛡️', desc: '-1 damage taken per rank',      per: 1 },
    insight:  { name: 'Insight',  icon: '📖', desc: '+10% experience per rank',      per: 0.10 },
    greed:    { name: 'Greed',    icon: '🪙', desc: '+15% gold per rank',            per: 0.15 }
};

// ── Classes: starting weapon + perk ──
const BREACH_CLASSES = {
    voidblade:  { name: 'Voidblade',  icon: '🗡️', weapon: 'voidblade', perk: 'might',    perkText: '+10% damage' },
    runecaster: { name: 'Runecaster', icon: '✨', weapon: 'runebolt',  perk: 'alacrity', perkText: '+8% attack speed' },
    duskwalker: { name: 'Duskwalker', icon: '🌙', weapon: 'duskfan',   perk: 'swiftness',perkText: '+8% move speed' },
    soulwarden: { name: 'Soulwarden', icon: '🔮', weapon: 'soulward',  perk: 'vitality', perkText: '+20 max HP' },
    bloodweaver:{ name: 'Bloodweaver',icon: '🩸', weapon: 'bloodlash', perk: 'warding',  perkText: '-1 damage taken' }
};

// ── Permanent meta upgrades (Sanctum) ──
const SANCTUM_UPGRADES = {
    vigor:   { name: 'Vigor',   icon: '❤️', desc: '+12 starting max HP',       per: 12,   max: 5, baseCost: 60 },
    power:   { name: 'Power',   icon: '⚔️', desc: '+5% damage',                per: 0.05, max: 5, baseCost: 80 },
    haste:   { name: 'Haste',   icon: '⚡', desc: '+4% attack speed',          per: 0.04, max: 5, baseCost: 80 },
    fleet:   { name: 'Fleet',   icon: '👢', desc: '+4% move speed',            per: 0.04, max: 5, baseCost: 70 },
    fortune: { name: 'Fortune', icon: '🪙', desc: '+10% gold from runs',       per: 0.10, max: 5, baseCost: 100 },
    resolve: { name: 'Resolve', icon: '🕯️', desc: '+1 revive per run (1 HP)',  per: 1,    max: 1, baseCost: 600 }
};

// ════════════════════════════════════════════
// META PROGRESSION (persists between runs)
// ════════════════════════════════════════════
const BreachMeta = {
    KEY: 'kaelith_breach_meta',
    data: null,

    load() {
        if (this.data) return this.data;
        try {
            this.data = JSON.parse(localStorage.getItem(this.KEY)) || {};
        } catch (e) { this.data = {}; }
        const d = this.data;
        if (typeof d.gold !== 'number') d.gold = 0;
        if (!d.upgrades) d.upgrades = {};
        if (!d.unlockedRegions) d.unlockedRegions = ['ashen_wastes'];
        if (!d.bestTimes) d.bestTimes = {};
        if (!d.cleared) d.cleared = {};
        if (!d.stats) d.stats = { runs: 0, kills: 0, deaths: 0 };
        if (!d.lastClass) d.lastClass = 'voidblade';
        if (!d.lastRegion) d.lastRegion = 'ashen_wastes';
        return d;
    },

    save() {
        try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
    },

    upgradeLevel(key) { return (this.load().upgrades[key] || 0); },

    upgradeCost(key) {
        const def = SANCTUM_UPGRADES[key];
        const lvl = this.upgradeLevel(key);
        return Math.floor(def.baseCost * Math.pow(2.1, lvl));
    },

    buyUpgrade(key) {
        const d = this.load();
        const def = SANCTUM_UPGRADES[key];
        if (!def) return false;
        const lvl = this.upgradeLevel(key);
        if (lvl >= def.max) return false;
        const cost = this.upgradeCost(key);
        if (d.gold < cost) return false;
        d.gold -= cost;
        d.upgrades[key] = lvl + 1;
        this.save();
        return true;
    }
};

// ════════════════════════════════════════════
// THE BREACH ENGINE
// ════════════════════════════════════════════
const Breach = {
    // run state
    running: false,
    state: 'idle', // idle | running | draft | paused | over | victory
    time: 0,
    region: null,
    regionIdx: 0,

    BOSS_TIME: 300,       // boss arrives at 5:00
    ARENA_R: 1340,        // soft arena radius

    canvas: null, ctx: null,
    vw: 0, vh: 0, dpr: 1,
    camX: 0, camY: 0, shake: 0,

    player: null,
    enemies: [], projectiles: [], gems: [], coins: [], effects: [], texts: [],
    boss: null,
    props: [],

    spawnTimer: 0, eliteTimer: 0,
    kills: 0, goldRun: 0,
    _lastTime: 0, _raf: null,
    _spriteCache: {},
    _groundPattern: null,
    _hudCache: {},

    // input
    keys: { up: false, down: false, left: false, right: false },
    joy: { active: false, sx: 0, sy: 0, dx: 0, dy: 0 },

    // ────────────────────────────────────────
    // SETUP FLOW (class + region select)
    // ────────────────────────────────────────
    openSetup() {
        const meta = BreachMeta.load();
        const el = document.getElementById('breach-setup');
        if (!el) return;

        let html = `<div class="bsetup-panel">`;
        html += `<div class="bsetup-title">Enter the Breach</div>`;
        html += `<div class="bsetup-sub">Choose your vessel</div>`;
        html += `<div class="bclass-grid">`;
        for (const [key, cls] of Object.entries(BREACH_CLASSES)) {
            const w = BREACH_WEAPONS[cls.weapon];
            html += `<button class="bclass-card ${meta.lastClass === key ? 'selected' : ''}" data-class="${key}" onclick="Breach.pickClass('${key}')">
                <span class="bclass-icon">${cls.icon}</span>
                <span class="bclass-name">${cls.name}</span>
                <span class="bclass-weapon">${w.icon} ${w.name}</span>
                <span class="bclass-perk">${cls.perkText}</span>
            </button>`;
        }
        html += `</div>`;

        html += `<div class="bsetup-sub" style="margin-top:0.9rem">Choose your realm</div>`;
        html += `<div class="bregion-row">`;
        BREACH_REGIONS.forEach(r => {
            const unlocked = meta.unlockedRegions.includes(r.key);
            const best = meta.bestTimes[r.key];
            const cleared = meta.cleared[r.key];
            html += `<button class="bregion-chip ${meta.lastRegion === r.key ? 'selected' : ''} ${unlocked ? '' : 'locked'}"
                data-region="${r.key}" ${unlocked ? `onclick="Breach.pickRegion('${r.key}')"` : ''}>
                <span class="bregion-icon">${unlocked ? r.icon : '🔒'}</span>
                <span class="bregion-name">${r.name.replace('The ', '')}</span>
                <span class="bregion-best">${cleared ? '✓ cleared' : (best ? this.fmtTime(best) : (unlocked ? 'unconquered' : 'defeat the previous boss'))}</span>
            </button>`;
        });
        html += `</div>`;

        html += `<button class="bstart-btn" onclick="Breach.startFromSetup()">⚔ BEGIN THE RUN</button>`;
        html += `<button class="bsetup-close" onclick="Breach.closeSetup()">✕</button>`;
        html += `</div>`;

        el.innerHTML = html;
        el.classList.remove('hidden');
    },

    pickClass(key) {
        BreachMeta.load().lastClass = key;
        BreachMeta.save();
        document.querySelectorAll('.bclass-card').forEach(c =>
            c.classList.toggle('selected', c.dataset.class === key));
    },

    pickRegion(key) {
        BreachMeta.load().lastRegion = key;
        BreachMeta.save();
        document.querySelectorAll('.bregion-chip').forEach(c =>
            c.classList.toggle('selected', c.dataset.region === key));
    },

    closeSetup() {
        const el = document.getElementById('breach-setup');
        if (el) el.classList.add('hidden');
    },

    startFromSetup() {
        const meta = BreachMeta.load();
        this.closeSetup();
        this.start(meta.lastClass, meta.lastRegion);
    },

    // ────────────────────────────────────────
    // RUN LIFECYCLE
    // ────────────────────────────────────────
    start(classKey, regionKey) {
        const cls = BREACH_CLASSES[classKey] || BREACH_CLASSES.voidblade;
        this.regionIdx = Math.max(0, BREACH_REGIONS.findIndex(r => r.key === regionKey));
        this.region = BREACH_REGIONS[this.regionIdx];
        const meta = BreachMeta.load();

        // Ensure sprite generators are ready (Breach can launch before Story mode ever runs)
        try {
            if (typeof Sprites !== 'undefined' && Sprites.init && !Sprites._breachInit) {
                if (!Sprites.cache || Object.keys(Sprites.cache).length === 0) Sprites.init();
                Sprites._breachInit = true;
            }
        } catch (e) { /* sprite fallbacks cover us */ }

        // Meta bonuses
        const up = (k) => BreachMeta.upgradeLevel(k) * SANCTUM_UPGRADES[k].per;
        const maxHp = 100 + up('vigor');

        this.player = {
            x: 0, y: 0, r: 13,
            hp: maxHp, maxHp,
            speed: 148 * (1 + up('fleet')),
            facing: { x: 1, y: 0 }, dir: 'down', moving: false,
            walkTimer: 0, walkFrame: 0,
            iframes: 0,
            level: 1, xp: 0, xpNext: 6,
            weapons: {},   // key -> { lvl, t, angle }
            passives: {},  // key -> lvl
            metaDmg: 1 + up('power'),
            metaCd: 1 / (1 + up('haste')),
            metaGold: 1 + up('fortune'),
            revives: BreachMeta.upgradeLevel('resolve'),
            classKey
        };
        this.player.weapons[cls.weapon] = { lvl: 1, t: 0, angle: 0 };
        this.player.passives[cls.perk] = 1;
        if (cls.perk === 'vitality') { this.player.maxHp += 20; this.player.hp += 20; }

        this.enemies = []; this.projectiles = []; this.gems = [];
        this.coins = []; this.effects = []; this.texts = [];
        this.boss = null;
        this.time = 0; this.kills = 0; this.goldRun = 0;
        this.spawnTimer = 0.5; this.eliteTimer = 45;
        this.camX = 0; this.camY = 0; this.shake = 0;
        this._spriteCache = {};
        this._groundPattern = null;
        this._hudCache = {};
        this.seedProps();

        ScreenManager.showScreen('breach');
        this.setupCanvas();
        // The screen fades in async — re-measure once it's actually visible
        setTimeout(() => { if (this.running) this.setupCanvas(); }, 300);
        this.bindInput();
        this.hideOverlays();
        this.updateHud(true);

        if (typeof Audio !== 'undefined') {
            try { Audio.ensure(); Audio.startCombatAmbient(false); } catch (e) {}
        }

        this.state = 'running';
        this.running = true;
        this._lastTime = performance.now();
        if (this._raf) cancelAnimationFrame(this._raf);
        this.loop(this._lastTime);
    },

    seedProps() {
        // Scattered silhouettes for depth — deterministic per region
        this.props = [];
        let seed = 1234 + this.regionIdx * 777;
        const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 46; i++) {
            const a = rng() * Math.PI * 2;
            const d = 160 + rng() * (this.ARENA_R - 120);
            this.props.push({
                x: Math.cos(a) * d, y: Math.sin(a) * d,
                kind: rng() < 0.5 ? 'rock' : 'snag',
                s: 0.7 + rng() * 0.9, flip: rng() < 0.5 ? -1 : 1
            });
        }
    },

    setupCanvas() {
        this.canvas = document.getElementById('breach-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        const resize = () => {
            this.dpr = Math.min(2, window.devicePixelRatio || 1);
            this.vw = this.canvas.clientWidth;
            this.vh = this.canvas.clientHeight;
            this.canvas.width = Math.floor(this.vw * this.dpr);
            this.canvas.height = Math.floor(this.vh * this.dpr);
        };
        resize();
        if (!this._resizeBound) {
            this._resizeBound = true;
            window.addEventListener('resize', () => { if (this.running) resize(); });
        }
    },

    bindInput() {
        if (this._inputBound) return;
        this._inputBound = true;

        // Keyboard (desktop)
        window.addEventListener('keydown', (e) => {
            if (!this.running) return;
            const k = e.key;
            if (k === 'ArrowUp' || k === 'w' || k === 'W') this.keys.up = true;
            if (k === 'ArrowDown' || k === 's' || k === 'S') this.keys.down = true;
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.keys.left = true;
            if (k === 'ArrowRight' || k === 'd' || k === 'D') this.keys.right = true;
            if (k === 'Escape' && this.state === 'running') this.pause();
        });
        window.addEventListener('keyup', (e) => {
            const k = e.key;
            if (k === 'ArrowUp' || k === 'w' || k === 'W') this.keys.up = false;
            if (k === 'ArrowDown' || k === 's' || k === 'S') this.keys.down = false;
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.keys.left = false;
            if (k === 'ArrowRight' || k === 'd' || k === 'D') this.keys.right = false;
        });

        // Touch joystick — drag anywhere on the canvas
        const cv = document.getElementById('breach-canvas');
        if (!cv) return;
        const joyBase = document.getElementById('joy-base');
        const joyKnob = document.getElementById('joy-knob');

        const start = (x, y) => {
            this.joy.active = true;
            this.joy.sx = x; this.joy.sy = y;
            this.joy.dx = 0; this.joy.dy = 0;
            if (joyBase) {
                joyBase.style.left = x + 'px'; joyBase.style.top = y + 'px';
                joyBase.classList.add('visible');
            }
            if (joyKnob) { joyKnob.style.left = x + 'px'; joyKnob.style.top = y + 'px'; }
        };
        const move = (x, y) => {
            if (!this.joy.active) return;
            const MAX = 52;
            let dx = x - this.joy.sx, dy = y - this.joy.sy;
            const d = Math.hypot(dx, dy);
            if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; }
            this.joy.dx = dx / MAX; this.joy.dy = dy / MAX;
            if (joyKnob) {
                joyKnob.style.left = (this.joy.sx + dx) + 'px';
                joyKnob.style.top = (this.joy.sy + dy) + 'px';
            }
        };
        const end = () => {
            this.joy.active = false;
            this.joy.dx = 0; this.joy.dy = 0;
            if (joyBase) joyBase.classList.remove('visible');
        };

        cv.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) { e.preventDefault(); start(e.touches[0].clientX, e.touches[0].clientY); }
        }, { passive: false });
        cv.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }
        }, { passive: false });
        cv.addEventListener('touchend', end);
        cv.addEventListener('touchcancel', end);

        // Mouse drag (desktop testing)
        cv.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
        window.addEventListener('mouseup', end);
    },

    // ────────────────────────────────────────
    // MAIN LOOP
    // ────────────────────────────────────────
    loop(now) {
        if (!this.running) return;
        this._raf = requestAnimationFrame((t) => this.loop(t));
        const dt = Math.min((now - this._lastTime) / 1000, 0.05);
        this._lastTime = now;

        if (this.state === 'running') {
            this.update(dt);
        }
        this.draw();
    },

    update(dt) {
        this.time += dt;
        const p = this.player;

        // ── movement ──
        let mx = 0, my = 0;
        if (this.joy.active) { mx = this.joy.dx; my = this.joy.dy; }
        else {
            if (this.keys.up) my -= 1;
            if (this.keys.down) my += 1;
            if (this.keys.left) mx -= 1;
            if (this.keys.right) mx += 1;
            const m = Math.hypot(mx, my);
            if (m > 1) { mx /= m; my /= m; }
        }
        p.moving = (mx !== 0 || my !== 0);
        if (p.moving) {
            p.x += mx * p.speed * dt;
            p.y += my * p.speed * dt;
            p.facing.x = mx; p.facing.y = my;
            p.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
            p.walkTimer += dt;
            if (p.walkTimer > 0.14) { p.walkTimer = 0; p.walkFrame = (p.walkFrame + 1) % 3; }
        }
        // soft arena bound
        const pd = Math.hypot(p.x, p.y);
        if (pd > this.ARENA_R) { p.x = p.x / pd * this.ARENA_R; p.y = p.y / pd * this.ARENA_R; }

        if (p.iframes > 0) p.iframes -= dt;

        // camera
        this.camX += (p.x - this.camX) * Math.min(1, dt * 7);
        this.camY += (p.y - this.camY) * Math.min(1, dt * 7);
        if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);

        // ── spawning ──
        this.updateSpawning(dt);

        // ── weapons ──
        this.updateWeapons(dt);

        // ── projectiles ──
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.life -= dt;
            if (pr.life <= 0) { this.projectiles.splice(i, 1); continue; }

            if (pr.homing) {
                const tgt = pr.target && pr.target.hp > 0 ? pr.target : this.nearestEnemy(pr.x, pr.y, 500);
                pr.target = tgt;
                if (tgt) {
                    const a = Math.atan2(tgt.y - pr.y, tgt.x - pr.x);
                    const cur = Math.atan2(pr.vy, pr.vx);
                    let diff = a - cur;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    const turn = 6.5 * dt;
                    const na = cur + Math.max(-turn, Math.min(turn, diff));
                    const sp = Math.hypot(pr.vx, pr.vy);
                    pr.vx = Math.cos(na) * sp; pr.vy = Math.sin(na) * sp;
                }
            }
            pr.x += pr.vx * dt; pr.y += pr.vy * dt;

            // hit check
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                if (e.hp <= 0) continue;
                if (pr.hit && pr.hit.has(e)) continue;
                const rr = e.r + pr.r;
                if (Math.abs(e.x - pr.x) < rr && Math.abs(e.y - pr.y) < rr &&
                    (e.x - pr.x) ** 2 + (e.y - pr.y) ** 2 < rr * rr) {
                    this.hitEnemy(e, pr.dmg, pr.color, pr.vx * 0.04, pr.vy * 0.04);
                    if (pr.pierce > 0) {
                        pr.pierce--;
                        if (!pr.hit) pr.hit = new Set();
                        pr.hit.add(e);
                    } else {
                        this.projectiles.splice(i, 1);
                    }
                    break;
                }
            }
        }

        // ── enemies ──
        const speedScale = 1 + Math.min(0.35, this.time / 850);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            if (e.hp <= 0) {
                e.deathT -= dt;
                if (e.deathT <= 0) this.enemies.splice(i, 1);
                continue;
            }

            const dx = p.x - e.x, dy = p.y - e.y;
            const d = Math.hypot(dx, dy) || 1;
            // knockback decay
            e.kx *= (1 - Math.min(1, dt * 8)); e.ky *= (1 - Math.min(1, dt * 8));
            e.x += (dx / d) * e.speed * speedScale * dt + e.kx * dt * 10;
            e.y += (dy / d) * e.speed * speedScale * dt + e.ky * dt * 10;
            if (e.flash > 0) e.flash -= dt;
            if (e.orbCd > 0) e.orbCd -= dt;

            // gentle separation so swarms don't stack into one pixel
            if ((i & 3) === ((this.time * 60) | 0) % 4) {
                for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
                    const o = this.enemies[j];
                    if (o.hp <= 0) continue;
                    const ox = e.x - o.x, oy = e.y - o.y;
                    const od = ox * ox + oy * oy;
                    const min = (e.r + o.r) * 0.8;
                    if (od < min * min && od > 0.01) {
                        const sd = Math.sqrt(od);
                        const push = (min - sd) * 0.5;
                        e.x += ox / sd * push; e.y += oy / sd * push;
                    }
                }
            }

            // contact damage
            if (d < e.r + p.r && p.iframes <= 0) {
                this.hurtPlayer(e.dmg);
            }
        }

        // ── boss arrival ──
        if (!this.boss && this.time >= this.BOSS_TIME) this.spawnBoss();
        if (this.boss && this.boss.hp <= 0 && !this.boss.done) {
            this.boss.done = true;
            this.victory();
        }

        // ── pickups ──
        const magnetR = 56 * (1 + (p.passives.magnet || 0) * BREACH_PASSIVES.magnet.per);
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const g = this.gems[i];
            const dx = p.x - g.x, dy = p.y - g.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < magnetR) g.pull = Math.min(620, (g.pull || 120) + 900 * dt);
            if (g.pull) { g.x += dx / d * g.pull * dt; g.y += dy / d * g.pull * dt; }
            if (d < p.r + 8) {
                this.gems.splice(i, 1);
                this.gainXp(g.v);
            }
        }
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            const dx = p.x - c.x, dy = p.y - c.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < magnetR) c.pull = Math.min(620, (c.pull || 120) + 900 * dt);
            if (c.pull) { c.x += dx / d * c.pull * dt; c.y += dy / d * c.pull * dt; }
            if (d < p.r + 8) {
                this.coins.splice(i, 1);
                this.goldRun += c.v;
            }
        }

        // ── transient effects/texts ──
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];
            fx.t += dt;
            if (fx.t >= fx.dur) this.effects.splice(i, 1);
        }
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.t += dt; t.y -= 34 * dt;
            if (t.t >= 0.8) this.texts.splice(i, 1);
        }

        this.updateHud();
    },

    // ────────────────────────────────────────
    // SPAWNING
    // ────────────────────────────────────────
    regionEnemyKeys() {
        const w = (typeof WORLD !== 'undefined' && WORLD.regions[this.region.key]) || null;
        return (w && w.enemies) ? w.enemies : [];
    },

    updateSpawning(dt) {
        // no trash spawns once the boss is here and weakened
        const bossPhase = this.boss && this.boss.hp > 0;

        this.spawnTimer -= dt;
        const interval = Math.max(0.25, 1.25 - this.time * 0.003);
        if (this.spawnTimer <= 0 && this.enemies.length < 110) {
            this.spawnTimer = interval * (bossPhase ? 2.2 : 1);
            const batch = 1 + Math.floor(this.time / 75);
            for (let i = 0; i < batch; i++) this.spawnEnemy(false);
        }

        if (!bossPhase) {
            this.eliteTimer -= dt;
            if (this.eliteTimer <= 0) {
                this.eliteTimer = 50;
                this.spawnEnemy(true);
            }
        }
    },

    spawnEnemy(elite) {
        const keys = this.regionEnemyKeys();
        if (keys.length === 0) return;
        // enemy tiers unlock over time
        const unlocked = Math.min(keys.length, 1 + Math.floor(this.time / 55));
        const key = keys[Math.floor(Math.random() * unlocked)];
        const t = (typeof ENEMIES !== 'undefined' && ENEMIES[key]) || { hp: 20, attack: 5, speed: 8 };

        const a = Math.random() * Math.PI * 2;
        const dist = Math.hypot(this.vw, this.vh) / 2 + 60;
        const hpScale = (0.55 + this.time / 240) * (elite ? 7 : 1);
        // Bias the spawn ring toward where the player is heading so
        // kiting in a straight line still means running into trouble
        const cx = this.player.x + (this.player.facing.x || 0) * 150;
        const cy = this.player.y + (this.player.facing.y || 0) * 150;

        this.enemies.push({
            key,
            x: cx + Math.cos(a) * dist,
            y: cy + Math.sin(a) * dist,
            r: elite ? 26 : 16,
            hp: Math.max(8, Math.floor(t.hp * hpScale)),
            maxHp: Math.max(8, Math.floor(t.hp * hpScale)),
            dmg: Math.max(3, Math.floor(t.attack * (elite ? 1.4 : 0.7))),
            speed: (66 + (t.speed || 8) * 7 + Math.random() * 14) * (elite ? 0.85 : 1),
            elite, flash: 0, kx: 0, ky: 0, deathT: 0.22, orbCd: 0,
            xv: elite ? 5 : 1
        });
    },

    spawnBoss() {
        const w = (typeof WORLD !== 'undefined' && WORLD.regions[this.region.key]) || null;
        const bossKey = w ? w.boss : null;
        const t = (bossKey && typeof ENEMIES !== 'undefined' && ENEMIES[bossKey]) || { name: 'The Devourer', hp: 400, attack: 18, speed: 8 };

        const a = Math.random() * Math.PI * 2;
        this.boss = {
            key: bossKey || 'boss',
            name: t.name || 'The Devourer',
            x: this.player.x + Math.cos(a) * 420,
            y: this.player.y + Math.sin(a) * 420,
            r: 42,
            hp: Math.floor((t.hp || 400) * 6.5),
            maxHp: Math.floor((t.hp || 400) * 6.5),
            dmg: Math.max(10, Math.floor((t.attack || 18) * 1.1)),
            speed: 92, elite: true, isBoss: true,
            flash: 0, kx: 0, ky: 0, deathT: 1.2, orbCd: 0, xv: 0
        };
        this.enemies.push(this.boss);

        const banner = document.getElementById('breach-boss-banner');
        if (banner) {
            banner.textContent = `☠ ${this.boss.name} HAS COME ☠`;
            banner.classList.add('visible');
            setTimeout(() => banner.classList.remove('visible'), 3200);
        }
        this.shake = 10;
        if (typeof Audio !== 'undefined') { try { Audio.playBossIntro(); } catch (e) {} }
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticHeavy();
    },

    // ────────────────────────────────────────
    // WEAPONS
    // ────────────────────────────────────────
    weaponStats(key) {
        const w = this.player.weapons[key];
        return BREACH_WEAPONS[key].levels[w.lvl - 1];
    },

    // Soul Ward orbs sweep in and out, covering the whole disc —
    // perimeter defence AND point-blank cleanup
    orbPos(w, s, i) {
        const a = w.angle + (Math.PI * 2 / s.count) * i;
        const r = s.radius * (0.42 + 0.58 * (0.5 + 0.5 * Math.sin(w.angle * 1.35 + i * 2.1)));
        return { x: this.player.x + Math.cos(a) * r, y: this.player.y + Math.sin(a) * r };
    },

    dmgMult() {
        const p = this.player;
        return p.metaDmg * (1 + (p.passives.might || 0) * BREACH_PASSIVES.might.per);
    },

    cdMult() {
        const p = this.player;
        return p.metaCd / (1 + (p.passives.alacrity || 0) * BREACH_PASSIVES.alacrity.per);
    },

    updateWeapons(dt) {
        const p = this.player;
        for (const [key, w] of Object.entries(p.weapons)) {
            const s = this.weaponStats(key);

            if (key === 'soulward') {
                // continuous orbitals
                w.angle += s.rot * dt;
                const dmg = s.dmg * this.dmgMult();
                for (let i = 0; i < s.count; i++) {
                    const o = this.orbPos(w, s, i);
                    for (const e of this.enemies) {
                        if (e.hp <= 0 || e.orbCd > 0) continue;
                        const rr = e.r + 13;
                        if ((e.x - o.x) ** 2 + (e.y - o.y) ** 2 < rr * rr) {
                            e.orbCd = 0.4;
                            this.hitEnemy(e, dmg, '#b58aff', (e.x - p.x) * 0.06, (e.y - p.y) * 0.06);
                        }
                    }
                }
                continue;
            }

            w.t -= dt;
            if (w.t > 0) continue;
            w.t = s.cd * this.cdMult();

            const dmg = s.dmg * this.dmgMult();
            const fx = p.facing.x || 1, fy = p.facing.y || 0;
            let fa = Math.atan2(fy, fx);
            // Weapons auto-aim at the nearest threat — movement is for dodging
            const aimTarget = this.nearestEnemy(p.x, p.y, 420);
            if (aimTarget) fa = Math.atan2(aimTarget.y - p.y, aimTarget.x - p.x);

            if (key === 'voidblade') {
                // arc slash toward the closest pack
                this.effects.push({ kind: 'slash', x: p.x, y: p.y, a: fa, arc: s.arc, range: s.range, t: 0, dur: 0.18, color: '#cfa9ff' });
                for (const e of this.enemies) {
                    if (e.hp <= 0) continue;
                    const dx = e.x - p.x, dy = e.y - p.y;
                    const d = Math.hypot(dx, dy);
                    if (d > s.range + e.r) continue;
                    let da = Math.atan2(dy, dx) - fa;
                    while (da > Math.PI) da -= Math.PI * 2;
                    while (da < -Math.PI) da += Math.PI * 2;
                    if (Math.abs(da) < s.arc / 2) {
                        // Heavy knockback — the blade is crowd control
                        this.hitEnemy(e, dmg, '#cfa9ff', dx / d * 14, dy / d * 14);
                    }
                }
                if (typeof Audio !== 'undefined') { try { Audio.playAttack(); } catch (e) {} }

            } else if (key === 'runebolt') {
                for (let i = 0; i < s.count; i++) {
                    const tgt = this.nearestEnemy(p.x, p.y, 560, i);
                    const a = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : fa + (Math.random() - 0.5);
                    this.projectiles.push({
                        x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
                        r: 7, dmg, life: 2.4, homing: true, target: tgt, pierce: 0,
                        color: '#8ad0ff', kind: 'bolt'
                    });
                }

            } else if (key === 'duskfan') {
                for (let i = 0; i < s.count; i++) {
                    const off = (i - (s.count - 1) / 2) * (s.spread / Math.max(1, s.count - 1) * 2);
                    const a = fa + off;
                    this.projectiles.push({
                        x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
                        r: 6, dmg, life: 1.1, homing: false, pierce: s.pierce,
                        color: '#9fb4d8', kind: 'dagger', rot: a
                    });
                }

            } else if (key === 'bloodlash') {
                // strikes both sides
                for (const side of [-1, 1]) {
                    this.effects.push({ kind: 'lash', x: p.x, y: p.y, side, w: s.w, h: s.h, t: 0, dur: 0.16, color: '#e0455a' });
                    for (const e of this.enemies) {
                        if (e.hp <= 0) continue;
                        const lx = e.x - p.x, ly = e.y - p.y;
                        if (side === 1 ? (lx > 0 && lx < s.w) : (lx < 0 && lx > -s.w)) {
                            if (Math.abs(ly) < s.h) {
                                this.hitEnemy(e, dmg, '#e0455a', side * 5, 0);
                                const heal = Math.max(1, Math.floor(dmg * s.steal));
                                p.hp = Math.min(p.maxHp, p.hp + heal);
                            }
                        }
                    }
                }

            } else if (key === 'embernova') {
                this.effects.push({ kind: 'nova', x: p.x, y: p.y, radius: s.radius, t: 0, dur: 0.4, color: '#ff9a3d' });
                for (const e of this.enemies) {
                    if (e.hp <= 0) continue;
                    const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
                    if (d2 < (s.radius + e.r) ** 2) {
                        const d = Math.sqrt(d2) || 1;
                        this.hitEnemy(e, dmg, '#ff9a3d', (e.x - p.x) / d * 9, (e.y - p.y) / d * 9);
                    }
                }
                this.shake = Math.max(this.shake, 3);
            }
        }
    },

    nearestEnemy(x, y, maxDist, skip) {
        let best = null, bestD = (maxDist || 1e9) ** 2;
        let skipped = 0;
        for (const e of this.enemies) {
            if (e.hp <= 0) continue;
            const d = (e.x - x) ** 2 + (e.y - y) ** 2;
            if (d < bestD) {
                if (skip && skipped < skip) { skipped++; continue; }
                best = e; bestD = d;
            }
        }
        return best;
    },

    // ────────────────────────────────────────
    // DAMAGE / DEATH / PICKUPS
    // ────────────────────────────────────────
    hitEnemy(e, dmg, color, kx, ky) {
        const final = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.2)));
        e.hp -= final;
        e.flash = 0.1;
        e.kx += kx || 0; e.ky += ky || 0;
        this.texts.push({ x: e.x + (Math.random() * 14 - 7), y: e.y - e.r - 4, v: final, t: 0, color: color || '#fff', big: e.isBoss });

        if (e.hp <= 0) {
            this.kills++;
            // drops
            this.gems.push({ x: e.x, y: e.y, v: e.xv, big: e.elite });
            if (e.elite && !e.isBoss) {
                for (let i = 0; i < 4; i++) {
                    this.gems.push({ x: e.x + Math.random() * 50 - 25, y: e.y + Math.random() * 50 - 25, v: 3, big: true });
                }
                this.coins.push({ x: e.x, y: e.y, v: 15 + Math.floor(Math.random() * 15) });
                this.texts.push({ x: e.x, y: e.y - 30, v: 'ELITE DOWN', t: 0, color: '#ffd166', label: true });
            } else if (Math.random() < 0.14) {
                this.coins.push({ x: e.x, y: e.y, v: 2 + Math.floor(Math.random() * 4) });
            }
            if (e.isBoss) {
                this.shake = 14;
                for (let i = 0; i < 14; i++) {
                    this.gems.push({ x: e.x + Math.random() * 90 - 45, y: e.y + Math.random() * 90 - 45, v: 4, big: true });
                }
            }
            this.effects.push({ kind: 'pop', x: e.x, y: e.y, t: 0, dur: 0.3, color: color || '#fff', r: e.r });
        }
    },

    hurtPlayer(dmg) {
        const p = this.player;
        const armor = (p.passives.warding || 0) * BREACH_PASSIVES.warding.per;
        const final = Math.max(1, Math.round(dmg - armor));
        p.hp -= final;
        p.iframes = 0.65;
        this.shake = Math.max(this.shake, 4);
        this.texts.push({ x: p.x, y: p.y - 22, v: final, t: 0, color: '#ff5b5b' });
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticMedium();

        const vig = document.getElementById('breach-vignette');
        if (vig) {
            vig.classList.remove('hurt');
            void vig.offsetWidth;
            vig.classList.add('hurt');
        }

        if (p.hp <= 0) {
            if (p.revives > 0) {
                p.revives--;
                p.hp = Math.max(1, Math.floor(p.maxHp * 0.3));
                p.iframes = 2;
                this.texts.push({ x: p.x, y: p.y - 40, v: 'SECOND WIND', t: 0, color: '#ffd166', label: true });
                this.effects.push({ kind: 'nova', x: p.x, y: p.y, radius: 200, t: 0, dur: 0.5, color: '#ffd166' });
                // shove everything away
                for (const e of this.enemies) {
                    const dx = e.x - p.x, dy = e.y - p.y;
                    const d = Math.hypot(dx, dy) || 1;
                    e.kx += dx / d * 40; e.ky += dy / d * 40;
                }
            } else {
                p.hp = 0;
                this.gameOver(false);
            }
        }
    },

    gainXp(v) {
        const p = this.player;
        const mult = 1 + (p.passives.insight || 0) * BREACH_PASSIVES.insight.per;
        p.xp += v * mult;
        while (p.xp >= p.xpNext) {
            p.xp -= p.xpNext;
            p.level++;
            p.xpNext = 5 + p.level * 3;
            this.openDraft();
        }
    },

    // ────────────────────────────────────────
    // LEVEL-UP DRAFT
    // ────────────────────────────────────────
    openDraft() {
        this.state = 'draft';
        const p = this.player;
        if (typeof Audio !== 'undefined') { try { Audio.playLevelUp(); } catch (e) {} }

        const options = [];
        const weaponKeys = Object.keys(BREACH_WEAPONS);
        const ownedW = Object.keys(p.weapons);
        const ownedP = Object.keys(p.passives);

        // weapon upgrades
        for (const k of ownedW) {
            if (p.weapons[k].lvl < 5) options.push({ type: 'weapon', key: k, isNew: false });
        }
        // new weapons (max 4)
        if (ownedW.length < 4) {
            for (const k of weaponKeys) {
                if (!p.weapons[k]) options.push({ type: 'weapon', key: k, isNew: true });
            }
        }
        // passive upgrades
        for (const k of ownedP) {
            if (p.passives[k] < 5) options.push({ type: 'passive', key: k, isNew: false });
        }
        // new passives (max 4)
        if (ownedP.length < 4) {
            for (const k of Object.keys(BREACH_PASSIVES)) {
                if (!p.passives[k]) options.push({ type: 'passive', key: k, isNew: true });
            }
        }

        // pick 3 distinct
        const picks = [];
        while (picks.length < 3 && options.length > 0) {
            const i = Math.floor(Math.random() * options.length);
            picks.push(options.splice(i, 1)[0]);
        }
        if (picks.length === 0) {
            picks.push({ type: 'heal' });
        }

        const el = document.getElementById('breach-draft');
        if (!el) { this.state = 'running'; return; }

        let html = `<div class="bdraft-inner">`;
        html += `<div class="bdraft-title">LEVEL ${p.level}</div>`;
        html += `<div class="bdraft-sub">The Shattering offers power — choose</div>`;
        html += `<div class="bdraft-cards">`;
        picks.forEach((opt, i) => {
            if (opt.type === 'heal') {
                html += `<button class="bdraft-card" onclick="Breach.pickDraft(${i})">
                    <span class="bdraft-icon">❤️</span>
                    <span class="bdraft-name">Mend</span>
                    <span class="bdraft-lvl">Restore 50% HP</span>
                    <span class="bdraft-desc">The void stitches you back together.</span>
                </button>`;
            } else if (opt.type === 'weapon') {
                const def = BREACH_WEAPONS[opt.key];
                const lvl = opt.isNew ? 1 : p.weapons[opt.key].lvl + 1;
                const sub = opt.isNew ? def.desc : def.upgradeText[lvl - 2];
                html += `<button class="bdraft-card ${opt.isNew ? 'new' : ''}" onclick="Breach.pickDraft(${i})">
                    <span class="bdraft-icon">${def.icon}</span>
                    <span class="bdraft-name">${def.name}</span>
                    <span class="bdraft-lvl">${opt.isNew ? 'NEW WEAPON' : 'Rank ' + lvl}</span>
                    <span class="bdraft-desc">${sub}</span>
                </button>`;
            } else {
                const def = BREACH_PASSIVES[opt.key];
                const lvl = opt.isNew ? 1 : p.passives[opt.key] + 1;
                html += `<button class="bdraft-card ${opt.isNew ? 'new' : ''}" onclick="Breach.pickDraft(${i})">
                    <span class="bdraft-icon">${def.icon}</span>
                    <span class="bdraft-name">${def.name}</span>
                    <span class="bdraft-lvl">${opt.isNew ? 'NEW BOON' : 'Rank ' + lvl}</span>
                    <span class="bdraft-desc">${def.desc}</span>
                </button>`;
            }
        });
        html += `</div></div>`;
        el.innerHTML = html;
        el.classList.remove('hidden');
        this._draftPicks = picks;
    },

    pickDraft(i) {
        const opt = this._draftPicks && this._draftPicks[i];
        const p = this.player;
        if (opt) {
            if (opt.type === 'heal') {
                p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.5));
            } else if (opt.type === 'weapon') {
                if (p.weapons[opt.key]) p.weapons[opt.key].lvl++;
                else p.weapons[opt.key] = { lvl: 1, t: 0, angle: 0 };
            } else if (opt.type === 'passive') {
                p.passives[opt.key] = (p.passives[opt.key] || 0) + 1;
                if (opt.key === 'vitality') {
                    p.maxHp += BREACH_PASSIVES.vitality.per;
                    p.hp = Math.min(p.maxHp, p.hp + BREACH_PASSIVES.vitality.per);
                }
                if (opt.key === 'swiftness') {
                    p.speed = 148 * (1 + BreachMeta.upgradeLevel('fleet') * SANCTUM_UPGRADES.fleet.per)
                        * (1 + p.passives.swiftness * BREACH_PASSIVES.swiftness.per);
                }
            }
        }
        const el = document.getElementById('breach-draft');
        if (el) el.classList.add('hidden');
        this._lastTime = performance.now();
        this.state = 'running';
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticLight();
    },

    // ────────────────────────────────────────
    // PAUSE / END STATES
    // ────────────────────────────────────────
    pause() {
        if (this.state !== 'running') return;
        this.state = 'paused';
        const el = document.getElementById('breach-pause');
        if (el) el.classList.remove('hidden');
    },

    resume() {
        if (this.state !== 'paused') return;
        const el = document.getElementById('breach-pause');
        if (el) el.classList.add('hidden');
        this._lastTime = performance.now();
        this.state = 'running';
    },

    abandon() { this.gameOver(false, true); },

    victory() {
        const meta = BreachMeta.load();
        meta.cleared[this.region.key] = true;
        const idx = BREACH_REGIONS.findIndex(r => r.key === this.region.key);
        const next = BREACH_REGIONS[idx + 1];
        let unlockedNew = false;
        if (next && !meta.unlockedRegions.includes(next.key)) {
            meta.unlockedRegions.push(next.key);
            unlockedNew = true;
        }
        this.goldRun += 150; // boss bounty
        if (typeof Audio !== 'undefined') { try { Audio.playVictory(); } catch (e) {} }
        this.gameOver(true, false, unlockedNew ? next : null);
    },

    gameOver(won, abandoned, unlockedRegion) {
        if (this.state === 'over') return;
        this.state = 'over';

        const meta = BreachMeta.load();
        const p = this.player;
        const goldEarned = Math.floor(this.goldRun * p.metaGold * (1 + (p.passives.greed || 0) * BREACH_PASSIVES.greed.per));
        meta.gold += goldEarned;
        meta.stats.runs++;
        meta.stats.kills += this.kills;
        if (!won) meta.stats.deaths++;
        if (won) {
            const best = meta.bestTimes[this.region.key];
            if (!best || this.time < best) meta.bestTimes[this.region.key] = Math.floor(this.time);
        }
        BreachMeta.save();

        if (!won && typeof Audio !== 'undefined') { try { Audio.playDefeat(); } catch (e) {} }

        const el = document.getElementById('breach-results');
        if (!el) return this.exitToTitle();

        const title = won ? 'REALM CLEARED' : (abandoned ? 'RETREAT' : 'YOU HAVE FALLEN');
        const sub = won
            ? `${this.region.name} is silent. The Breach seals behind you… for now.`
            : (abandoned ? 'You slip back through the Breach, lighter of pride.' : 'The swarm closes over you. But death is never the end here.');

        let html = `<div class="bresults-inner ${won ? 'won' : ''}">`;
        html += `<div class="bresults-title">${title}</div>`;
        html += `<div class="bresults-sub">${sub}</div>`;
        if (unlockedRegion) {
            html += `<div class="bresults-unlock">${unlockedRegion.icon} NEW REALM: ${unlockedRegion.name}</div>`;
        }
        html += `<div class="bresults-stats">`;
        html += `<div class="bstat"><span>⏱</span><strong>${this.fmtTime(this.time)}</strong><em>survived</em></div>`;
        html += `<div class="bstat"><span>☠</span><strong>${this.kills}</strong><em>slain</em></div>`;
        html += `<div class="bstat"><span>⭐</span><strong>${p.level}</strong><em>level</em></div>`;
        html += `<div class="bstat gold"><span>🪙</span><strong>+${goldEarned}</strong><em>gold banked</em></div>`;
        html += `</div>`;
        html += `<div class="bresults-actions">`;
        html += `<button class="bstart-btn" onclick="Breach.retry()">⚔ RUN IT BACK</button>`;
        html += `<button class="action-btn" onclick="Breach.exitToTitle()" style="width:100%">Return to the Dark</button>`;
        html += `</div></div>`;
        el.innerHTML = html;
        el.classList.remove('hidden');
    },

    retry() {
        this.hideOverlays();
        const meta = BreachMeta.load();
        this.start(meta.lastClass, meta.lastRegion);
    },

    exitToTitle() {
        this.running = false;
        this.state = 'idle';
        if (this._raf) cancelAnimationFrame(this._raf);
        this.hideOverlays();
        ScreenManager.showScreen('title');
        if (typeof Game !== 'undefined' && Game.updateTitleMeta) Game.updateTitleMeta();
        if (typeof Audio !== 'undefined') { try { Audio.stopAmbient && Audio.stopAmbient(); } catch (e) {} }
    },

    hideOverlays() {
        ['breach-draft', 'breach-results', 'breach-pause', 'breach-setup'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    },

    fmtTime(t) {
        const m = Math.floor(t / 60), s = Math.floor(t % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    },

    // ────────────────────────────────────────
    // HUD (DOM, updated cheaply)
    // ────────────────────────────────────────
    updateHud(force) {
        const p = this.player;
        const c = this._hudCache;
        const set = (id, val, prop) => {
            if (!force && c[id] === val) return;
            c[id] = val;
            const el = document.getElementById(id);
            if (el) {
                if (prop === 'width') el.style.width = val;
                else el.textContent = val;
            }
        };
        set('bhud-hp-fill', `${Math.max(0, p.hp / p.maxHp * 100).toFixed(1)}%`, 'width');
        set('bhud-hp-text', `${Math.max(0, Math.ceil(p.hp))}`);
        set('bhud-xp-fill', `${Math.min(100, p.xp / p.xpNext * 100).toFixed(1)}%`, 'width');
        set('bhud-level', `LV ${p.level}`);
        set('bhud-timer', this.fmtTime(this.time));
        set('bhud-kills', `☠ ${this.kills}`);
        set('bhud-gold', `🪙 ${this.goldRun}`);

        // boss bar
        const bossBar = document.getElementById('bhud-boss');
        if (bossBar) {
            const show = this.boss && this.boss.hp > 0;
            bossBar.classList.toggle('hidden', !show);
            if (show) {
                set('bhud-boss-fill', `${Math.max(0, this.boss.hp / this.boss.maxHp * 100).toFixed(1)}%`, 'width');
                set('bhud-boss-name', this.boss.name);
            }
        }
    },

    // ────────────────────────────────────────
    // RENDERING
    // ────────────────────────────────────────
    getScaledSprite(key, size) {
        const id = `${key}_${size}`;
        if (this._spriteCache[id]) return this._spriteCache[id];
        let src = null;
        try {
            if (typeof Sprites !== 'undefined' && Sprites.getCombatSprite) {
                src = Sprites.getCombatSprite(key);
            }
        } catch (e) { src = null; }
        if (!src) { this._spriteCache[id] = null; return null; }
        const cv = document.createElement('canvas');
        cv.width = size; cv.height = size;
        const cx = cv.getContext('2d');
        cx.imageSmoothingEnabled = false;
        cx.drawImage(src, 0, 0, size, size);
        this._spriteCache[id] = cv;
        return cv;
    },

    getGroundPattern() {
        if (this._groundPattern) return this._groundPattern;
        const T = 192;
        const cv = document.createElement('canvas');
        cv.width = T; cv.height = T;
        const cx = cv.getContext('2d');
        cx.fillStyle = this.region.ground;
        cx.fillRect(0, 0, T, T);
        let seed = 99 + this.regionIdx;
        const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        cx.fillStyle = this.region.groundDetail;
        for (let i = 0; i < 70; i++) {
            cx.globalAlpha = 0.15 + rng() * 0.3;
            const w = 2 + rng() * 14;
            cx.fillRect(rng() * T, rng() * T, w, 1 + rng() * 3);
        }
        cx.globalAlpha = 0.5;
        cx.strokeStyle = this.region.prop;
        for (let i = 0; i < 5; i++) {
            cx.beginPath();
            cx.moveTo(rng() * T, rng() * T);
            cx.lineTo(rng() * T, rng() * T);
            cx.stroke();
        }
        cx.globalAlpha = 1;
        this._groundPattern = this.ctx.createPattern(cv, 'repeat');
        return this._groundPattern;
    },

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;
        if (this.vw < 10) {
            this.setupCanvas();
            if (this.vw < 10) return;
        }
        const p = this.player;

        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        ctx.clearRect(0, 0, this.vw, this.vh);

        const shx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
        const shy = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
        const ox = this.vw / 2 - this.camX + shx;
        const oy = this.vh / 2 - this.camY + shy;

        // ground
        ctx.save();
        ctx.translate(ox % 192, oy % 192);
        ctx.fillStyle = this.getGroundPattern();
        ctx.fillRect(-192, -192, this.vw + 384, this.vh + 384);
        ctx.restore();

        ctx.save();
        ctx.translate(ox, oy);

        // arena edge
        ctx.beginPath();
        ctx.arc(0, 0, this.ARENA_R, 0, Math.PI * 2);
        ctx.strokeStyle = this.region.glow;
        ctx.lineWidth = 26;
        ctx.stroke();

        // props (behind everything)
        for (const pr of this.props) {
            if (Math.abs(pr.x - this.camX) > this.vw / 2 + 60 || Math.abs(pr.y - this.camY) > this.vh / 2 + 60) continue;
            ctx.fillStyle = this.region.prop;
            if (pr.kind === 'rock') {
                ctx.beginPath();
                ctx.ellipse(pr.x, pr.y, 16 * pr.s, 10 * pr.s, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.save();
                ctx.translate(pr.x, pr.y);
                ctx.scale(pr.flip * pr.s, pr.s);
                ctx.beginPath();
                ctx.moveTo(0, 0); ctx.lineTo(0, -30);
                ctx.moveTo(0, -14); ctx.lineTo(10, -24);
                ctx.moveTo(0, -20); ctx.lineTo(-8, -28);
                ctx.strokeStyle = this.region.prop;
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.restore();
            }
        }

        // gems & coins
        for (const g of this.gems) {
            ctx.fillStyle = this.region.gem;
            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(Math.PI / 4);
            const s = g.big ? 7 : 4.5;
            ctx.globalAlpha = 0.95;
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.globalAlpha = 0.35;
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.restore();
        }
        ctx.globalAlpha = 1;
        for (const c of this.coins) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd166';
            ctx.fill();
            ctx.strokeStyle = '#a87b1d';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // enemies (y-sorted with player)
        const drawables = [];
        for (const e of this.enemies) {
            if (Math.abs(e.x - this.camX) > this.vw / 2 + 80 || Math.abs(e.y - this.camY) > this.vh / 2 + 80) continue;
            drawables.push(e);
        }
        drawables.push(p);
        drawables.sort((a, b) => a.y - b.y);

        for (const d of drawables) {
            if (d === p) { this.drawPlayer(ctx); continue; }
            this.drawEnemy(ctx, d);
        }

        // projectiles
        for (const pr of this.projectiles) {
            ctx.save();
            ctx.translate(pr.x, pr.y);
            if (pr.kind === 'bolt') {
                ctx.fillStyle = pr.color;
                ctx.shadowColor = pr.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 0, pr.r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.rotate(pr.rot || 0);
                ctx.fillStyle = pr.color;
                ctx.fillRect(-7, -1.5, 14, 3);
            }
            ctx.restore();
        }
        ctx.shadowBlur = 0;

        // orbitals
        if (p.weapons.soulward) {
            const s = this.weaponStats('soulward');
            const w = p.weapons.soulward;
            for (let i = 0; i < s.count; i++) {
                const o = this.orbPos(w, s, i);
                ctx.beginPath();
                ctx.arc(o.x, o.y, 9, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(181,138,255,0.9)';
                ctx.shadowColor = '#b58aff';
                ctx.shadowBlur = 12;
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        // effects
        for (const fx of this.effects) {
            const k = fx.t / fx.dur;
            ctx.save();
            ctx.globalAlpha = 1 - k;
            if (fx.kind === 'slash') {
                ctx.translate(fx.x, fx.y);
                ctx.rotate(fx.a);
                ctx.beginPath();
                ctx.arc(0, 0, fx.range * (0.85 + k * 0.3), -fx.arc / 2, fx.arc / 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 10 * (1 - k) + 2;
                ctx.stroke();
            } else if (fx.kind === 'nova') {
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, fx.radius * (0.3 + k * 0.7), 0, Math.PI * 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 14 * (1 - k) + 2;
                ctx.stroke();
            } else if (fx.kind === 'lash') {
                ctx.translate(fx.x, fx.y);
                ctx.fillStyle = fx.color;
                ctx.globalAlpha = (1 - k) * 0.55;
                if (fx.side === 1) ctx.fillRect(0, -fx.h, fx.w, fx.h * 2);
                else ctx.fillRect(-fx.w, -fx.h, fx.w, fx.h * 2);
            } else if (fx.kind === 'pop') {
                ctx.beginPath();
                ctx.arc(fx.x, fx.y, fx.r * (1 + k * 1.5), 0, Math.PI * 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 3 * (1 - k);
                ctx.stroke();
            }
            ctx.restore();
        }

        // damage texts
        for (const t of this.texts) {
            ctx.save();
            ctx.globalAlpha = 1 - (t.t / 0.8);
            ctx.font = t.big ? '800 22px Rajdhani, sans-serif'
                : (t.label ? '700 13px Rajdhani, sans-serif' : '700 15px Rajdhani, sans-serif');
            ctx.textAlign = 'center';
            ctx.fillStyle = t.color;
            ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            ctx.lineWidth = 3;
            ctx.strokeText(String(t.v), t.x, t.y);
            ctx.fillText(String(t.v), t.x, t.y);
            ctx.restore();
        }

        ctx.restore(); // world space
        ctx.restore(); // dpr
    },

    drawPlayer(ctx) {
        const p = this.player;
        // shadow
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 12, 12, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();

        if (p.iframes > 0 && Math.floor(p.iframes * 14) % 2 === 0) return; // flicker

        let sprite = null;
        try {
            if (typeof Sprites !== 'undefined' && Sprites.getPlayer) {
                sprite = Sprites.getPlayer(p.dir, p.moving ? p.walkFrame : 0);
            }
        } catch (e) { sprite = null; }

        if (sprite) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(sprite, p.x - 20, p.y - 30, 40, 40);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y - 6, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#d2ab54';
            ctx.fill();
        }
    },

    drawEnemy(ctx, e) {
        const size = e.isBoss ? 110 : (e.elite ? 64 : 44);
        const dead = e.hp <= 0;
        const k = dead ? e.deathT / (e.isBoss ? 1.2 : 0.22) : 1;

        // shadow
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + size * 0.28, size * 0.3, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();

        ctx.save();
        if (dead) {
            ctx.globalAlpha = k;
            ctx.translate(e.x, e.y);
            ctx.scale(k, k);
            ctx.translate(-e.x, -e.y);
        }

        const sprite = this.getScaledSprite(e.key, e.isBoss ? 128 : (e.elite ? 72 : 48));
        if (sprite) {
            ctx.imageSmoothingEnabled = false;
            if (e.flash > 0) {
                ctx.filter = 'brightness(2.2)';
            }
            ctx.drawImage(sprite, e.x - size / 2, e.y - size * 0.72, size, size);
            ctx.filter = 'none';
        } else {
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.fillStyle = e.flash > 0 ? '#fff' : (e.elite ? '#a4422f' : '#6e3535');
            ctx.fill();
        }

        // elite ring
        if (e.elite && !dead && !e.isBoss) {
            ctx.beginPath();
            ctx.arc(e.x, e.y + size * 0.22, size * 0.4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,209,102,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // mini HP bar for damaged non-boss enemies
        if (!dead && !e.isBoss && e.hp < e.maxHp) {
            const w = 30;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(e.x - w / 2, e.y - size * 0.78, w, 4);
            ctx.fillStyle = '#d8453e';
            ctx.fillRect(e.x - w / 2, e.y - size * 0.78, w * (e.hp / e.maxHp), 4);
        }
        ctx.restore();
    }
};
