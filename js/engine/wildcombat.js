// ============================================
// WORLD COMBAT — LIVE COMBAT IN THE OPEN WORLD
// ============================================
// Enemies roam the world maps and hunt you in real
// time. Your weapons fire themselves — movement is
// positioning. Kills feed XP straight into the RPG
// level system; level-ups draft permanent weapon and
// boon ranks. Hunger gnaws, nights are dangerous,
// and death sends you home to camp.
//
// Runs inside the WorldMap loop (update/draw hooks).
// Weapon & boon definitions are shared with breach.js
// (BREACH_WEAPONS / BREACH_PASSIVES / BREACH_CLASSES).
// ============================================

const WorldCombat = {
    enemies: [],
    projectiles: [],
    effects: [],
    texts: [],
    pickups: [],

    paused: false,          // true while the draft overlay is open
    spawnTimer: 4,
    eliteTimer: 75,
    _spriteCache: {},
    _prevTimeOfDay: null,
    _growthTimer: 0,
    _hungerWarned: false,
    _deathShown: false,

    MAX_ENEMIES: 12,
    MAX_ENEMIES_NIGHT: 18,

    // ── combat build (permanent, lives on the save) ──
    ensureBuild() {
        const p = GameState.player;
        if (!p) return null;
        if (!p.combat) {
            const cls = (typeof BREACH_CLASSES !== 'undefined' && BREACH_CLASSES[p.class]) || null;
            p.combat = {
                weapons: {},
                boons: {}
            };
            p.combat.weapons[cls ? cls.weapon : 'voidblade'] = 1;
            if (cls && cls.perk) p.combat.boons[cls.perk] = 1;
        }
        if (!p.combat._t) p.combat._t = {}; // weapon cooldown timers (not saved meaningfully)
        return p.combat;
    },

    boon(key) {
        const c = GameState.player && GameState.player.combat;
        return c && c.boons ? (c.boons[key] || 0) : 0;
    },

    dmgMult() {
        const p = GameState.player;
        let m = 1 + (p.attack || 0) * 0.012;
        m *= 1 + this.boon('might') * 0.10;
        if (typeof Echoes !== 'undefined') m *= Echoes.damageDealtMult();
        return m;
    },

    cdMult() {
        return 1 / (1 + this.boon('alacrity') * 0.08);
    },

    playerSpeedMult() {
        return 1 + this.boon('swiftness') * 0.08;
    },

    magnetRadius() {
        return 44 * (1 + this.boon('magnet') * 0.30);
    },

    isNight() {
        const t = typeof WorldMap !== 'undefined' ? WorldMap.timeOfDay : 0.5;
        return t < 0.2 || t > 0.8;
    },

    // Combat happens on wild maps; villages and safe havens spawn nothing
    spawningAllowed() {
        if (typeof WorldMap === 'undefined' || !WorldMap.currentMap) return false;
        const loc = WORLD.locations[WorldMap.currentMap];
        if (!loc) return false;
        if (loc.type === 'village' || loc.type === 'npc' || loc.type === 'base') return false;
        if (WorldMap.currentMap === 'player_camp') return false;
        return true;
    },

    // ────────────────────────────────────────
    // FOOD / HUNGER
    // ────────────────────────────────────────
    isFood(item) {
        if (!item || item.type !== 'consumable' || !item.effect) return false;
        if (item.effect.type === 'heal' && (item.effect.stat === 'hp' || item.effect.stat === 'both')) return true;
        if (typeof item.effect.heal === 'number') return true;
        return false;
    },

    foodValue(item) {
        const e = item.effect || {};
        return e.amount || e.hpAmount || e.heal || 20;
    },

    autoEat() {
        const p = GameState.player;
        for (const inv of p.inventory) {
            const item = ITEMS[inv.key];
            if (item && this.isFood(item)) {
                const v = this.foodValue(item);
                GameState.removeFromInventory(inv.key, 1);
                GameState.survival.hunger = Math.min(100, GameState.survival.hunger + Math.min(60, v * 1.6));
                GameState.healPlayer(Math.floor(v * 0.4));
                this.floatText(WorldMap.px, WorldMap.py - 22, `${item.icon} ate ${item.name}`, '#7be3a0', true);
                if (item.survivalEffect && GameState.survival) {
                    const se = item.survivalEffect;
                    if (se.morale) GameState.survival.morale = Math.min(100, GameState.survival.morale + se.morale);
                    if (se.fatigue) GameState.survival.fatigue = Math.max(0, GameState.survival.fatigue + se.fatigue);
                }
                HUD.update();
                return true;
            }
        }
        return false;
    },

    updateHunger(dt) {
        const s = GameState.survival;
        if (!s) return;
        if (typeof s.hunger !== 'number') s.hunger = 85;

        const drain = 0.26 + (WorldMap.isSprinting ? 0.3 : 0);
        s.hunger = Math.max(0, s.hunger - drain * dt);

        if (s.hunger < 25 && !this._eating) {
            this._eating = true;
            if (!this.autoEat() && !this._hungerWarned) {
                this._hungerWarned = true;
                Notifications.show('🍖 You are hungry and have no food!', 'red');
            }
            this._eating = false;
        }
        if (s.hunger > 40) this._hungerWarned = false;

        // Starvation bites
        if (s.hunger <= 0) {
            this._starveT = (this._starveT || 0) + dt;
            if (this._starveT >= 1) {
                this._starveT = 0;
                GameState.player.hp = Math.max(0, GameState.player.hp - 2);
                this.floatText(WorldMap.px, WorldMap.py - 24, 'starving!', '#ff5b5b', true);
                if (GameState.player.hp <= 0) this.onPlayerDeath('starvation');
            }
        }
    },

    // ────────────────────────────────────────
    // SPAWNING
    // ────────────────────────────────────────
    regionPool() {
        const region = WORLD.regions[GameState.currentRegion];
        if (!region || !region.enemies) return [];
        const lvl = GameState.player ? GameState.player.level : 1;
        const valid = region.enemies.filter(k => ENEMIES[k] && ENEMIES[k].level <= lvl + 3);
        return valid.length ? valid : [region.enemies[0]];
    },

    updateSpawning(dt) {
        if (!this.spawningAllowed()) return;
        const night = this.isNight();
        const cap = night ? this.MAX_ENEMIES_NIGHT : this.MAX_ENEMIES;
        const liveCount = this.enemies.filter(e => e.hp > 0).length;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = (night ? 2.6 : 5.2) * (0.8 + Math.random() * 0.5);
            if (liveCount < cap) {
                const pack = 1 + Math.floor(Math.random() * (night ? 3 : 2));
                const pool = this.regionPool();
                for (let i = 0; i < pack; i++) {
                    this.spawnEnemy(pool[Math.floor(Math.random() * pool.length)], false);
                }
            }
        }

        this.eliteTimer -= dt;
        if (this.eliteTimer <= 0) {
            this.eliteTimer = 75 + Math.random() * 40;
            if (liveCount < cap + 2) {
                const pool = this.regionPool();
                this.spawnEnemy(pool[pool.length - 1], true);
            }
        }
    },

    // Spawn just off-screen around the player
    spawnEnemy(key, elite, nearX, nearY) {
        const t = ENEMIES[key];
        if (!t) return null;
        const a = Math.random() * Math.PI * 2;
        const dist = nearX !== undefined ? 60 + Math.random() * 60 : 300 + Math.random() * 120;
        const cx = nearX !== undefined ? nearX : WorldMap.px;
        const cy = nearY !== undefined ? nearY : WorldMap.py;
        let x = cx + Math.cos(a) * dist;
        let y = cy + Math.sin(a) * dist;

        // clamp into map bounds
        const mapW = WorldMap.terrain[0].length * WorldMap.TS;
        const mapH = WorldMap.terrain.length * WorldMap.TS;
        x = Math.max(16, Math.min(mapW - 16, x));
        y = Math.max(16, Math.min(mapH - 16, y));

        const lvl = GameState.player ? GameState.player.level : 1;
        const scale = (0.9 + lvl * 0.06) * (elite ? 3.2 : 1);

        const e = {
            key,
            name: t.name,
            x, y,
            r: elite ? 18 : 12,
            hp: Math.max(8, Math.floor(t.hp * scale)),
            maxHp: Math.max(8, Math.floor(t.hp * scale)),
            dmg: Math.max(2, Math.floor(t.attack * (elite ? 1.3 : 0.85))),
            speed: (50 + (t.speed || 8) * 5 + Math.random() * 12) * (elite ? 0.85 : 1),
            xp: Math.max(4, Math.floor((t.xpReward || 10) * (elite ? 2.5 : 1))),
            gold: t.goldReward || [2, 8],
            lootTable: t.lootTable || null,
            elite, isBoss: false,
            flash: 0, kx: 0, ky: 0, deathT: 0.25, orbCd: 0, hitCd: 0
        };
        this.enemies.push(e);
        return e;
    },

    // Named engagement: events, raids, hunt actions, enemy camps
    engage(key, count, opts) {
        count = count || 1;
        for (let i = 0; i < count; i++) {
            this.spawnEnemy(key, false, WorldMap.px + (Math.random() * 160 - 80), WorldMap.py + (Math.random() * 160 - 80));
        }
        if (!opts || !opts.silent) {
            Notifications.show(`⚔ ${ENEMIES[key] ? ENEMIES[key].name : 'Enemies'} ${count > 1 ? '×' + count : ''} attack!`, 'red');
        }
    },

    // Live boss fight in the world
    startBoss(bossKey, onDeath) {
        const t = ENEMIES[bossKey];
        if (!t) return;
        const e = this.spawnEnemy(bossKey, true, WorldMap.px + 140, WorldMap.py - 60);
        if (!e) return;
        e.isBoss = true;
        e.r = 26;
        e.hp = Math.floor(t.hp * 5.5);
        e.maxHp = e.hp;
        e.dmg = Math.floor(t.attack * 1.1);
        e.speed = 78;
        e.deathT = 1.0;
        e.onDeath = onDeath || null;

        const banner = document.getElementById('breach-boss-banner');
        if (banner) {
            banner.textContent = `☠ ${t.name} ☠`;
            banner.classList.add('visible');
            setTimeout(() => banner.classList.remove('visible'), 3200);
        }
        if (typeof Audio !== 'undefined') { try { Audio.playBossIntro(); } catch (err) {} }
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticHeavy();
    },

    // Clear live combat (map transitions, death)
    clear() {
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.texts = [];
        this.pickups = [];
    },

    // ────────────────────────────────────────
    // MAIN UPDATE (called from WorldMap.update)
    // ────────────────────────────────────────
    update(dt) {
        if (!GameState.player || GameState.currentScreen !== 'game') return;
        const build = this.ensureBuild();
        if (!build) return;

        // day rollover — the world keeps living
        const tod = WorldMap.timeOfDay;
        if (this._prevTimeOfDay !== null && tod < this._prevTimeOfDay - 0.5) {
            GameState.advanceDay();
            Notifications.show(`☀️ Day ${GameState.survival.dayCount + 1} dawns`, 'blue');
            GameState.save();
        }
        this._prevTimeOfDay = tod;

        // crops grow with real time (≈12 growth ticks per day)
        this._growthTimer += dt;
        if (this._growthTimer >= 16) {
            this._growthTimer = 0;
            if (typeof Homestead !== 'undefined') Homestead.tickGrowth(1);
        }

        this.updateHunger(dt);

        if (this.paused) return;

        this.updateSpawning(dt);
        this.updateWeapons(dt, build);

        const px = WorldMap.px, py = WorldMap.py;
        const p = GameState.player;
        if (this._iframes > 0) this._iframes -= dt;

        // ── projectiles ──
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.life -= dt;
            if (pr.life <= 0) { this.projectiles.splice(i, 1); continue; }
            if (pr.homing) {
                const tgt = pr.target && pr.target.hp > 0 ? pr.target : this.nearestEnemy(pr.x, pr.y, 320);
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
            for (const e of this.enemies) {
                if (e.hp <= 0) continue;
                if (pr.hit && pr.hit.has(e)) continue;
                const rr = e.r + pr.r;
                if ((e.x - pr.x) ** 2 + (e.y - pr.y) ** 2 < rr * rr) {
                    this.hitEnemy(e, pr.dmg, pr.color, pr.vx * 0.03, pr.vy * 0.03);
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

        // ── enemies chase (terrain-aware) ──
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.hp <= 0) {
                e.deathT -= dt;
                if (e.deathT <= 0) this.enemies.splice(i, 1);
                continue;
            }
            const dx = px - e.x, dy = py - e.y;
            const d = Math.hypot(dx, dy) || 1;

            // sleep far-away enemies; despawn very distant trash
            if (d > 760 && !e.isBoss && !e.elite) { this.enemies.splice(i, 1); continue; }
            if (d > 560) continue;

            e.kx *= (1 - Math.min(1, dt * 8)); e.ky *= (1 - Math.min(1, dt * 8));
            const step = e.speed * dt;
            const nx = e.x + (dx / d) * step + e.kx * dt * 10;
            const ny = e.y + (dy / d) * step + e.ky * dt * 10;
            // slide along impassable terrain
            if (this.passable(nx, e.y)) e.x = nx;
            if (this.passable(e.x, ny)) e.y = ny;

            if (e.flash > 0) e.flash -= dt;
            if (e.orbCd > 0) e.orbCd -= dt;
            if (e.hitCd > 0) e.hitCd -= dt;

            // contact damage
            if (d < e.r + 11 && this._iframes <= 0 && e.hitCd <= 0) {
                e.hitCd = 0.8;
                this.hurtPlayer(e.dmg);
            }
        }

        // ── pickups ──
        const mr = this.magnetRadius();
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const g = this.pickups[i];
            const dx = px - g.x, dy = py - g.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < mr) g.pull = Math.min(480, (g.pull || 100) + 800 * dt);
            if (g.pull) { g.x += dx / d * g.pull * dt; g.y += dy / d * g.pull * dt; }
            if (d < 16) {
                this.pickups.splice(i, 1);
                this.collectPickup(g);
            }
        }

        // ── effects & texts ──
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];
            fx.t += dt;
            if (fx.t >= fx.dur) this.effects.splice(i, 1);
        }
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.t += dt; t.y -= 26 * dt;
            if (t.t >= 0.9) this.texts.splice(i, 1);
        }
    },

    passable(x, y) {
        const tx = Math.floor(x / WorldMap.TS), ty = Math.floor(y / WorldMap.TS);
        if (!WorldMap.terrain[ty] || WorldMap.terrain[ty][tx] === undefined) return false;
        const tile = TILE_TYPES[WorldMap.terrain[ty][tx]];
        return tile ? !!tile.passable : false;
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
    // WEAPONS (shared defs with BREACH_WEAPONS)
    // ────────────────────────────────────────
    weaponStats(key, lvl) {
        return BREACH_WEAPONS[key].levels[Math.min(4, lvl - 1)];
    },

    updateWeapons(dt, build) {
        const px = WorldMap.px, py = WorldMap.py;
        const dmgMult = this.dmgMult();
        const cdMult = this.cdMult();
        const R = 0.78; // world-scale factor for breach ranges

        for (const [key, lvl] of Object.entries(build.weapons)) {
            if (!BREACH_WEAPONS[key]) continue;
            const s = this.weaponStats(key, lvl);

            if (key === 'soulward') {
                build._orbAngle = (build._orbAngle || 0) + s.rot * dt;
                const dmg = s.dmg * dmgMult;
                for (let i = 0; i < s.count; i++) {
                    const o = this.orbPos(build, s, i, px, py, R);
                    for (const e of this.enemies) {
                        if (e.hp <= 0 || e.orbCd > 0) continue;
                        const rr = e.r + 10;
                        if ((e.x - o.x) ** 2 + (e.y - o.y) ** 2 < rr * rr) {
                            e.orbCd = 0.4;
                            this.hitEnemy(e, dmg, '#b58aff', (e.x - px) * 0.05, (e.y - py) * 0.05);
                        }
                    }
                }
                continue;
            }

            build._t[key] = (build._t[key] || 0) - dt;
            if (build._t[key] > 0) continue;

            // only fire when something is near — the world stays calm otherwise
            const target = this.nearestEnemy(px, py, 300);
            if (!target) { build._t[key] = 0.12; continue; }

            build._t[key] = s.cd * cdMult;
            const dmg = s.dmg * dmgMult;
            const fa = Math.atan2(target.y - py, target.x - px);

            if (key === 'voidblade') {
                const range = s.range * R;
                this.effects.push({ kind: 'slash', x: px, y: py, a: fa, arc: s.arc, range, t: 0, dur: 0.18, color: '#cfa9ff' });
                for (const e of this.enemies) {
                    if (e.hp <= 0) continue;
                    const dx = e.x - px, dy = e.y - py;
                    const d = Math.hypot(dx, dy);
                    if (d > range + e.r) continue;
                    let da = Math.atan2(dy, dx) - fa;
                    while (da > Math.PI) da -= Math.PI * 2;
                    while (da < -Math.PI) da += Math.PI * 2;
                    if (Math.abs(da) < s.arc / 2) {
                        this.hitEnemy(e, dmg, '#cfa9ff', dx / d * 12, dy / d * 12);
                    }
                }
                if (typeof Audio !== 'undefined') { try { Audio.playAttack(); } catch (err) {} }
            } else if (key === 'runebolt') {
                for (let i = 0; i < s.count; i++) {
                    const tgt = this.nearestEnemy(px, py, 360, i) || target;
                    const a = Math.atan2(tgt.y - py, tgt.x - px);
                    this.projectiles.push({
                        x: px, y: py - 8, vx: Math.cos(a) * s.speed * R, vy: Math.sin(a) * s.speed * R,
                        r: 5, dmg, life: 1.8, homing: true, target: tgt, pierce: 0, color: '#8ad0ff', kind: 'bolt'
                    });
                }
            } else if (key === 'duskfan') {
                for (let i = 0; i < s.count; i++) {
                    const off = (i - (s.count - 1) / 2) * (s.spread / Math.max(1, s.count - 1) * 2);
                    const a = fa + off;
                    this.projectiles.push({
                        x: px, y: py - 8, vx: Math.cos(a) * s.speed * R, vy: Math.sin(a) * s.speed * R,
                        r: 4, dmg, life: 0.9, homing: false, pierce: s.pierce, color: '#9fb4d8', kind: 'dagger', rot: a
                    });
                }
            } else if (key === 'bloodlash') {
                const w = s.w * R, h = s.h * R;
                for (const side of [-1, 1]) {
                    this.effects.push({ kind: 'lash', x: px, y: py, side, w, h, t: 0, dur: 0.16, color: '#e0455a' });
                    for (const e of this.enemies) {
                        if (e.hp <= 0) continue;
                        const lx = e.x - px, ly = e.y - py;
                        if ((side === 1 ? (lx > 0 && lx < w) : (lx < 0 && lx > -w)) && Math.abs(ly) < h) {
                            this.hitEnemy(e, dmg, '#e0455a', side * 6, 0);
                            GameState.healPlayer(Math.max(1, Math.floor(dmg * s.steal)));
                        }
                    }
                }
            } else if (key === 'embernova') {
                const radius = s.radius * R;
                this.effects.push({ kind: 'nova', x: px, y: py, radius, t: 0, dur: 0.4, color: '#ff9a3d' });
                for (const e of this.enemies) {
                    if (e.hp <= 0) continue;
                    const d2 = (e.x - px) ** 2 + (e.y - py) ** 2;
                    if (d2 < (radius + e.r) ** 2) {
                        const d = Math.sqrt(d2) || 1;
                        this.hitEnemy(e, dmg, '#ff9a3d', (e.x - px) / d * 10, (e.y - py) / d * 10);
                    }
                }
            }
        }
    },

    orbPos(build, s, i, px, py, R) {
        const a = (build._orbAngle || 0) + (Math.PI * 2 / s.count) * i;
        const r = s.radius * R * (0.42 + 0.58 * (0.5 + 0.5 * Math.sin((build._orbAngle || 0) * 1.35 + i * 2.1)));
        return { x: px + Math.cos(a) * r, y: py + Math.sin(a) * r };
    },

    // ────────────────────────────────────────
    // DAMAGE & REWARDS
    // ────────────────────────────────────────
    floatText(x, y, v, color, label) {
        this.texts.push({ x, y, v, t: 0, color: color || '#fff', label: !!label });
        if (this.texts.length > 40) this.texts.shift();
    },

    hitEnemy(e, dmg, color, kx, ky) {
        const final = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.2)));
        e.hp -= final;
        e.flash = 0.1;
        e.kx += kx || 0; e.ky += ky || 0;
        this.floatText(e.x + (Math.random() * 10 - 5), e.y - e.r - 6, final, color, false);

        if (e.hp <= 0) this.onEnemyDeath(e);
    },

    onEnemyDeath(e) {
        GameState.trackStat('enemiesKilled');
        this.effects.push({ kind: 'pop', x: e.x, y: e.y, t: 0, dur: 0.3, color: '#fff', r: e.r });

        // XP straight into the RPG
        let xp = e.xp;
        if (typeof Echoes !== 'undefined') xp = Math.floor(xp * Echoes.xpMult());
        this.floatText(e.x, e.y - 22, `+${xp} XP`, '#8ad0ff', true);
        const leveled = GameState.gainXp(xp);
        if (leveled) {
            if (typeof Effects !== 'undefined') Effects.levelUp();
            if (typeof Audio !== 'undefined') { try { Audio.playLevelUp(); } catch (err) {} }
            setTimeout(() => this.openDraft(), 650);
        }

        // gold
        if (Math.random() < (e.elite ? 1 : 0.45)) {
            const g = e.gold;
            const v = Math.max(1, (g[0] || 2) + Math.floor(Math.random() * ((g[1] || 6) - (g[0] || 2) + 1)));
            this.pickups.push({ x: e.x + Math.random() * 16 - 8, y: e.y + Math.random() * 16 - 8, kind: 'gold', v: Math.floor(v * (typeof Echoes !== 'undefined' ? Echoes.goldMult() : 1)) });
        }

        // region material
        const matTable = typeof BREACH_MATERIALS !== 'undefined' ? BREACH_MATERIALS[GameState.currentRegion] : null;
        if (matTable && (e.elite || Math.random() < 0.22)) {
            const rare = Math.random() < 0.15;
            const key = matTable[rare ? matTable.length - 1 : Math.floor(Math.random() * (matTable.length - 1))];
            this.pickups.push({ x: e.x + Math.random() * 16 - 8, y: e.y + Math.random() * 16 - 8, kind: 'mat', key });
        }

        // creature loot table (halved odds — the world is generous enough)
        if (e.lootTable) {
            for (const [itemKey, chance] of Object.entries(e.lootTable)) {
                if (ITEMS[itemKey] && Math.random() < chance * 0.5) {
                    this.pickups.push({ x: e.x + Math.random() * 20 - 10, y: e.y + Math.random() * 20 - 10, kind: 'item', key: itemKey });
                }
            }
        }

        if (e.elite && !e.isBoss) {
            this.floatText(e.x, e.y - 34, 'ELITE DOWN', '#ffd166', true);
        }

        if (e.isBoss) {
            GameState.trackStat('bossesKilled');
            if (typeof Audio !== 'undefined') { try { Audio.playVictory(); } catch (err) {} }
            for (let i = 0; i < 5; i++) {
                this.pickups.push({ x: e.x + Math.random() * 50 - 25, y: e.y + Math.random() * 50 - 25, kind: 'gold', v: 25 + Math.floor(Math.random() * 25) });
            }
            if (e.onDeath) e.onDeath();
        }

        GameState.save();
    },

    collectPickup(g) {
        if (g.kind === 'gold') {
            GameState.player.gold += g.v;
            GameState.trackStat('goldEarned', g.v);
            this.floatText(WorldMap.px, WorldMap.py - 20, `+${g.v} 🪙`, '#ffd166', true);
        } else {
            const item = ITEMS[g.key];
            if (GameState.addToInventory(g.key, 1)) {
                this.floatText(WorldMap.px, WorldMap.py - 20, `+1 ${item ? item.icon : '▪'}`, '#cfc8b8', true);
            } else if (typeof Homestead !== 'undefined') {
                Homestead.addToStockpile(g.key, 1);
            }
        }
        HUD.update();
    },

    _iframes: 0,

    hurtPlayer(dmg) {
        const p = GameState.player;
        let final = dmg - Math.floor((p.defense || 0) * 0.3) - this.boon('warding');
        if (typeof Echoes !== 'undefined') final = Math.floor(final * Echoes.damageTakenMult());
        final = Math.max(1, final);
        p.hp = Math.max(0, p.hp - final);
        this._iframes = 0.7;
        this.floatText(WorldMap.px, WorldMap.py - 24, `-${final}`, '#ff5b5b', false);
        if (typeof Effects !== 'undefined') Effects.screenFlash('rgba(190,30,30,0.12)');
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticMedium();
        HUD.update();
        if (p.hp <= 0) this.onPlayerDeath('combat');
    },

    onPlayerDeath(cause) {
        if (this._deathShown) return;
        this._deathShown = true;
        GameState.trackStat('deathCount');
        this.paused = true;

        const p = GameState.player;
        const goldLost = Math.floor(p.gold * 0.1);
        const days = GameState.survival ? GameState.survival.dayCount + 1 : 1;

        const el = document.getElementById('breach-results');
        if (!el) { this.respawn(goldLost); return; }
        el.innerHTML = `<div class="bresults-inner">
            <div class="bresults-title">YOU HAVE FALLEN</div>
            <div class="bresults-sub">${cause === 'starvation'
                ? 'Hunger took what the monsters could not. Keep your camp fed.'
                : 'The wilds close over you — but your camp endures, and so do you.'}</div>
            <div class="bresults-stats">
                <div class="bstat"><span>📅</span><strong>${days}</strong><em>days survived</em></div>
                <div class="bstat"><span>☠</span><strong>${GameState.stats.enemiesKilled || 0}</strong><em>lifetime kills</em></div>
                <div class="bstat"><span>⭐</span><strong>${p.level}</strong><em>level</em></div>
                <div class="bstat gold"><span>🪙</span><strong>-${goldLost}</strong><em>gold lost</em></div>
            </div>
            <div class="bresults-actions">
                <button class="bstart-btn" onclick="WorldCombat.respawn(${goldLost})">🏕️ WAKE AT CAMP</button>
            </div>
        </div>`;
        el.classList.remove('hidden');
        if (typeof Audio !== 'undefined') { try { Audio.playDefeat(); } catch (err) {} }
    },

    respawn(goldLost) {
        const el = document.getElementById('breach-results');
        if (el) el.classList.add('hidden');
        const p = GameState.player;
        p.gold = Math.max(0, p.gold - (goldLost || 0));
        p.hp = Math.floor(p.maxHp * 0.5);
        if (GameState.survival) GameState.survival.hunger = Math.max(GameState.survival.hunger, 50);
        this.clear();
        this.paused = false;
        this._deathShown = false;
        WorldMap.loadMap('player_camp');
        Narrative.addSystem('You wake at camp, aching but alive.');
        HUD.update();
        GameState.save();
    },

    // ────────────────────────────────────────
    // LEVEL-UP DRAFT (permanent ranks)
    // ────────────────────────────────────────
    openDraft() {
        const build = this.ensureBuild();
        if (!build) return;
        this.paused = true;

        const options = [];
        for (const k of Object.keys(build.weapons)) {
            if (build.weapons[k] < 5) options.push({ type: 'weapon', key: k, isNew: false });
        }
        if (Object.keys(build.weapons).length < 4) {
            for (const k of Object.keys(BREACH_WEAPONS)) {
                if (!build.weapons[k]) options.push({ type: 'weapon', key: k, isNew: true });
            }
        }
        const boonKeys = ['might', 'alacrity', 'vitality', 'swiftness', 'magnet', 'warding'];
        for (const k of boonKeys) {
            const cur = build.boons[k] || 0;
            if (cur < 5 && (cur > 0 || Object.keys(build.boons).length < 4)) {
                options.push({ type: 'boon', key: k, isNew: cur === 0 });
            }
        }
        // everything maxed → raw power
        if (options.length === 0) {
            options.push({ type: 'stat', key: 'str' }, { type: 'stat', key: 'con' });
        }

        const picks = [];
        while (picks.length < 3 && options.length > 0) {
            picks.push(options.splice(Math.floor(Math.random() * options.length), 1)[0]);
        }
        this._draftPicks = picks;

        const el = document.getElementById('breach-draft');
        if (!el) { this.paused = false; return; }

        let html = `<div class="bdraft-inner">`;
        html += `<div class="bdraft-title">LEVEL ${GameState.player.level}</div>`;
        html += `<div class="bdraft-sub">Your legend grows — choose a permanent power</div>`;
        html += `<div class="bdraft-cards">`;
        picks.forEach((opt, i) => {
            if (opt.type === 'weapon') {
                const def = BREACH_WEAPONS[opt.key];
                const lvl = opt.isNew ? 1 : build.weapons[opt.key] + 1;
                html += `<button class="bdraft-card ${opt.isNew ? 'new' : ''}" onclick="WorldCombat.pickDraft(${i})">
                    <span class="bdraft-icon">${def.icon}</span>
                    <span class="bdraft-name">${def.name}</span>
                    <span class="bdraft-lvl">${opt.isNew ? 'NEW WEAPON' : 'Rank ' + lvl}</span>
                    <span class="bdraft-desc">${opt.isNew ? def.desc : def.upgradeText[lvl - 2]}</span>
                </button>`;
            } else if (opt.type === 'boon') {
                const def = BREACH_PASSIVES[opt.key];
                const lvl = opt.isNew ? 1 : build.boons[opt.key] + 1;
                html += `<button class="bdraft-card ${opt.isNew ? 'new' : ''}" onclick="WorldCombat.pickDraft(${i})">
                    <span class="bdraft-icon">${def.icon}</span>
                    <span class="bdraft-name">${def.name}</span>
                    <span class="bdraft-lvl">${opt.isNew ? 'NEW BOON' : 'Rank ' + lvl}</span>
                    <span class="bdraft-desc">${def.desc}</span>
                </button>`;
            } else {
                const isStr = opt.key === 'str';
                html += `<button class="bdraft-card" onclick="WorldCombat.pickDraft(${i})">
                    <span class="bdraft-icon">${isStr ? '⚔️' : '❤️'}</span>
                    <span class="bdraft-name">${isStr ? 'Raw Strength' : 'Iron Constitution'}</span>
                    <span class="bdraft-lvl">ATTRIBUTE</span>
                    <span class="bdraft-desc">${isStr ? '+2 Strength' : '+2 Constitution'}</span>
                </button>`;
            }
        });
        html += `</div></div>`;
        el.innerHTML = html;
        el.classList.remove('hidden');
    },

    pickDraft(i) {
        const opt = this._draftPicks && this._draftPicks[i];
        const build = this.ensureBuild();
        if (opt && build) {
            if (opt.type === 'weapon') {
                build.weapons[opt.key] = (build.weapons[opt.key] || 0) + 1;
            } else if (opt.type === 'boon') {
                build.boons[opt.key] = (build.boons[opt.key] || 0) + 1;
                if (opt.key === 'vitality') GameState.recalculateStats();
            } else if (opt.type === 'stat') {
                GameState.player.stats[opt.key] += 2;
                GameState.recalculateStats();
            }
        }
        const el = document.getElementById('breach-draft');
        if (el) el.classList.add('hidden');
        this.paused = false;
        HUD.update();
        GameState.save();
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticLight();
    },

    // ────────────────────────────────────────
    // DRAW (called inside WorldMap's zoomed pass)
    // ────────────────────────────────────────
    getScaledSprite(key, size) {
        const id = `${key}_${size}`;
        if (this._spriteCache[id] !== undefined) return this._spriteCache[id];
        let src = null;
        try {
            if (typeof Sprites !== 'undefined' && Sprites.getCombatSprite) src = Sprites.getCombatSprite(key);
        } catch (err) { src = null; }
        if (!src) { this._spriteCache[id] = null; return null; }
        const cv = document.createElement('canvas');
        cv.width = size; cv.height = size;
        const cx = cv.getContext('2d');
        cx.imageSmoothingEnabled = false;
        cx.drawImage(src, 0, 0, size, size);
        this._spriteCache[id] = cv;
        return cv;
    },

    draw(ctx) {
        if (!GameState.player) return;
        const camX = WorldMap.camX, camY = WorldMap.camY;
        const px = WorldMap.px, py = WorldMap.py;
        const build = GameState.player.combat;

        // pickups
        for (const g of this.pickups) {
            const sx = g.x - camX, sy = g.y - camY;
            if (g.kind === 'gold') {
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd166';
                ctx.fill();
                ctx.strokeStyle = '#a87b1d';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
                ctx.fillStyle = '#b08d57';
                ctx.fillRect(sx - 4, sy - 4, 8, 8);
                ctx.strokeStyle = '#5e4426';
                ctx.lineWidth = 1;
                ctx.strokeRect(sx - 4, sy - 4, 8, 8);
            }
        }

        // enemies
        for (const e of this.enemies) {
            const sx = e.x - camX, sy = e.y - camY;
            const size = e.isBoss ? 84 : (e.elite ? 46 : 32);
            const dead = e.hp <= 0;
            const k = dead ? e.deathT / (e.isBoss ? 1.0 : 0.25) : 1;

            ctx.beginPath();
            ctx.ellipse(sx, sy + size * 0.26, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fill();

            ctx.save();
            if (dead) {
                ctx.globalAlpha = Math.max(0, k);
                ctx.translate(sx, sy);
                ctx.scale(Math.max(0.01, k), Math.max(0.01, k));
                ctx.translate(-sx, -sy);
            }
            const sprite = this.getScaledSprite(e.key, e.isBoss ? 96 : (e.elite ? 56 : 40));
            if (sprite) {
                ctx.imageSmoothingEnabled = false;
                if (e.flash > 0) ctx.filter = 'brightness(2.2)';
                ctx.drawImage(sprite, sx - size / 2, sy - size * 0.7, size, size);
                ctx.filter = 'none';
            } else {
                ctx.beginPath();
                ctx.arc(sx, sy, e.r, 0, Math.PI * 2);
                ctx.fillStyle = e.flash > 0 ? '#fff' : (e.elite ? '#a4422f' : '#6e3535');
                ctx.fill();
            }
            if (e.elite && !dead && !e.isBoss) {
                ctx.beginPath();
                ctx.arc(sx, sy + size * 0.2, size * 0.38, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,209,102,0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            if (!dead && e.hp < e.maxHp) {
                const w = e.isBoss ? 60 : 24;
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.fillRect(sx - w / 2, sy - size * 0.78, w, 3);
                ctx.fillStyle = e.isBoss ? '#c95cff' : '#d8453e';
                ctx.fillRect(sx - w / 2, sy - size * 0.78, w * (e.hp / e.maxHp), 3);
            }
            ctx.restore();
        }

        // projectiles
        for (const pr of this.projectiles) {
            const sx = pr.x - camX, sy = pr.y - camY;
            ctx.save();
            ctx.translate(sx, sy);
            if (pr.kind === 'bolt') {
                ctx.fillStyle = pr.color;
                ctx.shadowColor = pr.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, 0, pr.r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.rotate(pr.rot || 0);
                ctx.fillStyle = pr.color;
                ctx.fillRect(-5, -1, 10, 2);
            }
            ctx.restore();
        }
        ctx.shadowBlur = 0;

        // soul ward orbs
        if (build && build.weapons && build.weapons.soulward) {
            const s = this.weaponStats('soulward', build.weapons.soulward);
            for (let i = 0; i < s.count; i++) {
                const o = this.orbPos(build, s, i, px, py, 0.78);
                ctx.beginPath();
                ctx.arc(o.x - camX, o.y - camY, 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(181,138,255,0.9)';
                ctx.shadowColor = '#b58aff';
                ctx.shadowBlur = 8;
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        // effects
        for (const fx of this.effects) {
            const k = fx.t / fx.dur;
            const sx = fx.x - camX, sy = fx.y - camY;
            ctx.save();
            ctx.globalAlpha = 1 - k;
            if (fx.kind === 'slash') {
                ctx.translate(sx, sy);
                ctx.rotate(fx.a);
                ctx.beginPath();
                ctx.arc(0, 0, fx.range * (0.85 + k * 0.3), -fx.arc / 2, fx.arc / 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 7 * (1 - k) + 1.5;
                ctx.stroke();
            } else if (fx.kind === 'nova') {
                ctx.beginPath();
                ctx.arc(sx, sy, fx.radius * (0.3 + k * 0.7), 0, Math.PI * 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 9 * (1 - k) + 1.5;
                ctx.stroke();
            } else if (fx.kind === 'lash') {
                ctx.translate(sx, sy);
                ctx.fillStyle = fx.color;
                ctx.globalAlpha = (1 - k) * 0.5;
                if (fx.side === 1) ctx.fillRect(0, -fx.h, fx.w, fx.h * 2);
                else ctx.fillRect(-fx.w, -fx.h, fx.w, fx.h * 2);
            } else if (fx.kind === 'pop') {
                ctx.beginPath();
                ctx.arc(sx, sy, fx.r * (1 + k * 1.5), 0, Math.PI * 2);
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 2.5 * (1 - k);
                ctx.stroke();
            }
            ctx.restore();
        }

        // damage / info texts
        for (const t of this.texts) {
            const sx = t.x - camX, sy = t.y - camY;
            ctx.save();
            ctx.globalAlpha = 1 - (t.t / 0.9);
            ctx.font = t.label ? '600 9px Rajdhani, sans-serif' : '700 11px Rajdhani, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0,0,0,0.75)';
            ctx.lineWidth = 2.5;
            ctx.strokeText(String(t.v), sx, sy);
            ctx.fillStyle = t.color;
            ctx.fillText(String(t.v), sx, sy);
            ctx.restore();
        }
    }
};
