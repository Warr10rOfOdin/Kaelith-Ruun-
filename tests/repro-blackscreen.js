// Headless reproduction of the live black-screen bug.
// Loads the REAL engine files with a browser-faithful canvas stub
// (drawImage throws on bad images, like real browsers) and replays
// the exact RISE-with-old-save flow, reporting the first exception.

// ── canvas stub ──
function makeCtx(canvas) {
    const grad = () => ({ addColorStop() {} });
    return {
        canvas,
        // state
        save() {}, restore() {}, scale() {}, translate() {}, rotate() {}, transform() {}, setTransform() {},
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, rect() {}, quadraticCurveTo() {}, bezierCurveTo() {},
        fill() {}, stroke() {}, clip() {},
        fillRect() {}, strokeRect() {}, clearRect() {},
        fillText() {}, strokeText() {},
        measureText() { return { width: 8 }; },
        createLinearGradient: grad, createRadialGradient: grad,
        createPattern() { return {}; },
        getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }; },
        putImageData() {},
        drawImage(img) {
            if (!img || typeof img !== 'object' || !('width' in img)) {
                throw new TypeError(`Failed to execute 'drawImage': image is ${img}`);
            }
        },
        setLineDash() {},
        // settable props
        fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
        globalAlpha: 1, globalCompositeOperation: '', imageSmoothingEnabled: false, filter: 'none',
        shadowColor: '', shadowBlur: 0, lineCap: '', lineJoin: ''
    };
}

// Browser layout emulation: the game screen is display:none for the
// first 200ms of the screen transition, so containers measure 0 until
// "layout" completes.
global.__layoutReady = false;

function makeCanvas() {
    const cv = {
        width: 800, height: 600, clientWidth: 800, clientHeight: 600,
        style: {},
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        addEventListener() {}, removeEventListener() {},
        getContext() { if (!cv._ctx) cv._ctx = makeCtx(cv); return cv._ctx; },
        getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
        parentElement: {
            get clientWidth() { return global.__layoutReady ? 800 : 0; },
            get clientHeight() { return global.__layoutReady ? 600 : 0; }
        }
    };
    return cv;
}

function makeEl(id) {
    const el = {
        id, style: {}, dataset: {},
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        textContent: '', innerHTML: '',
        children: [],
        addEventListener() {}, removeEventListener() {},
        appendChild(c) { el.children.push(c); if (c) c.parentNode = el; return c; },
        removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); },
        remove() {},
        firstChild: null,
        querySelector() { return null; }, querySelectorAll() { return []; },
        getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 50 }; },
        offsetWidth: 0, clientWidth: 800, clientHeight: 600,
        scrollTop: 0, scrollHeight: 0,
        disabled: false, onclick: null, value: '', focus() {}
    };
    Object.defineProperty(el, 'firstChild', { get() { return el.children[0] || null; } });
    return el;
}

const elements = {};
const canvases = {};
global.document = {
    getElementById(id) {
        if (id === 'game-canvas' || id === 'hud-minimap' || id === 'combat-bg-canvas') {
            if (!canvases[id]) canvases[id] = makeCanvas();
            return canvases[id];
        }
        if (!elements[id]) elements[id] = makeEl(id);
        return elements[id];
    },
    createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl('dyn'); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    body: makeEl('body'),
    documentElement: { style: { setProperty() {} } },
    addEventListener() {}, removeEventListener() {}
};
global.window = {
    addEventListener() {}, removeEventListener() {},
    devicePixelRatio: 2,
    innerWidth: 800, innerHeight: 600,
    matchMedia() { return { matches: false }; },
    visualViewport: null
};
global.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
global.performance = { now: () => Date.now() };
let rafCb = null;
global.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
global.cancelAnimationFrame = () => {};
global.setTimeout = (fn) => { try { fn(); } catch (e) { console.log('ERROR in setTimeout cb:', e.message); } return 0; };
global.setInterval = () => 0;
global.clearInterval = () => {};
global.navigator = { userAgent: 'node' };

// stubs for modules we don't load
const anyObj = () => new Proxy({}, { get: (t, k) => { if (k === 'isNative') return false; if (typeof k !== 'string') return undefined; return (t[k] = t[k] || (() => {})); } });
global.NativeBridge = anyObj();
global.Audio = undefined; // worldmap guards with typeof
global.Touch = { init() {} };
global.Combat = { active: false, start() { console.log('!! legacy Combat.start called'); } };
global.Dialogue = { start() {} };
global.Inventory = { render() {} };
global.Progression = { checkQuestCompletion() {}, renderCharacterSheet() {}, renderJournal() {}, renderAchievements() {} };
global.MapUI = { render() {} };
global.DiegeticFX = { update() {} };

const fs = require('fs');
const path = require('path');
function load(file, exports) {
    let src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    src += '\n;' + exports.map(e => `globalThis.${e} = typeof ${e} !== 'undefined' ? ${e} : undefined;`).join('');
    try {
        (0, eval)(src);
    } catch (e) {
        console.log(`LOAD ERROR in ${file}:`, e.message);
        throw e;
    }
}

// real data + engine, index.html order
load('js/data/races.js', ['RACES']);
load('js/data/classes.js', ['CLASSES']);
load('js/data/items.js', ['ITEMS', 'LOOT_TABLES']);
load('js/data/enemies.js', ['ENEMIES']);
load('js/data/world.js', ['WORLD']);
load('js/data/lore.js', ['LORE']);
load('js/data/npcs.js', ['NPCS']);
load('js/data/quests.js', ['QUESTS']);
load('js/engine/worldgen.js', ['WorldGen']);
load('js/data/maps.js', ['TILE_TYPES', 'MAPS', 'MAP_REGIONS', 'REGION_ENTRIES', 'BUILDINGS', 'BUILDING_UPGRADES', 'RECIPES', 'CROPS']);
load('js/data/tech.js', ['TECH_TREE', 'TechTree']);
load('js/engine/state.js', ['GameState']);
load('js/engine/echoes.js', ['ECHOES', 'Echoes']);
load('js/engine/narrative.js', ['Narrative']);
load('js/engine/exploration.js', ['Exploration']);
load('js/engine/sprites.js', ['Sprites']);
load('js/engine/worldmap.js', ['WorldMap']);
load('js/engine/base.js', ['Base']);
load('js/engine/homestead.js', ['Homestead']);
load('js/engine/breach.js', ['BREACH_WEAPONS', 'BREACH_PASSIVES', 'BREACH_CLASSES', 'BREACH_MATERIALS', 'BreachMeta', 'Breach', 'SANCTUM_UPGRADES']);
load('js/engine/wildcombat.js', ['WorldCombat']);
load('js/engine/hub.js', ['Hub']);
load('js/ui/screens.js', ['ScreenManager']);
load('js/ui/hud.js', ['HUD']);
load('js/ui/actions.js', ['Actions']);
load('js/ui/effects.js', ['Effects', 'Notifications']);
load('js/ui/settings.js', ['Settings']);
load('js/main.js', ['Game']);

console.log('=== all real files loaded OK ===');

// ── craft an OLD (v0.11-era) save: no combat build, no hunger, no plots ──
GameState.initialize('OldHero', 'human', 'voidblade');
GameState.player.gold = 725;
GameState.player.level = 3;
GameState.currentLocation = 'scorched_village';
GameState.currentRegion = 'ashen_wastes';
GameState.save();
const raw = JSON.parse(localStorage.getItem('kaelith_ruun_save'));
delete raw.player.combat;
delete raw.survival.hunger;
delete raw.base.plots; delete raw.base.terraform; delete raw.base.mine; delete raw.base.automation;
raw.worldMap = { currentMap: 'scorched_village', playerX: 2000, playerY: 800, facing: 'down', removedEntities: {} };
localStorage.setItem('kaelith_ruun_save', JSON.stringify(raw));
GameState.player = null; // fresh boot

// ── replay the RISE flow ──
ScreenManager.init();
if (Narrative.init) Narrative.init();
console.log('load():', GameState.load());

// instrument: count real draw work on the game canvas (pre-create it)
const gameCtx = global.document.getElementById('game-canvas').getContext();
let tileDraws = 0;
if (gameCtx) {
    const origDrawImage = gameCtx.drawImage.bind(gameCtx);
    gameCtx.drawImage = function (img) { tileDraws++; return origDrawImage(img); };
}
try {
    Game.enterWorld(false);
    console.log('enterWorld OK | map:', WorldMap.currentMap, '| screen:', GameState.currentScreen, '| ctx:', !!WorldMap.ctx, '| vp:', WorldMap.vpW, 'x', WorldMap.vpH);
} catch (e) {
    console.log('!! ERROR in enterWorld:', e.message, '\n', e.stack.split('\n').slice(0, 6).join('\n'));
}

// ── step the loop manually for 600 frames, catching the first failure ──
let updateErr = null, drawErr = null;
for (let f = 0; f < 600; f++) {
    if (f === 15) { global.__layoutReady = true; } // layout completes ~250ms in (after the screen transition)
    if (f === 30) { WorldCombat.spawnTimer = 0; } // force spawns early
    try { WorldMap.update(1 / 60); } catch (e) { updateErr = e; console.log(`!! UPDATE ERROR frame ${f}:`, e.message, '\n', e.stack.split('\n').slice(0, 6).join('\n')); break; }
    try { WorldMap.draw(); } catch (e) { drawErr = e; console.log(`!! DRAW ERROR frame ${f}:`, e.message, '\n', e.stack.split('\n').slice(0, 6).join('\n')); break; }
}
if (!updateErr && !drawErr) {
    console.log('=== 600 frames clean ===');
    console.log('ctx set:', !!WorldMap.ctx, '| viewport:', WorldMap.vpW, 'x', WorldMap.vpH, '| map:', WorldMap.currentMap);
    console.log('images drawn on game canvas across run:', tileDraws, '(pipeline is', tileDraws > 1000 ? 'ALIVE' : 'DEAD', ')');
    console.log('live enemies:', WorldCombat.enemies.length, '| player combat build:', JSON.stringify(GameState.player.combat && { w: GameState.player.combat.weapons, b: GameState.player.combat.boons }));
    console.log('hunger:', GameState.survival.hunger && GameState.survival.hunger.toFixed(1));
}
