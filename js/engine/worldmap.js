// ============================================
// WORLD MAP ENGINE — Canvas Rendering + Smooth Movement
// ============================================

const WorldMap = {
    currentMap: null,
    mapData: null,
    terrain: null,

    // Player position in world pixels (not tile coords)
    px: 0, py: 0,
    facing: 'down',
    walkFrame: 0,
    walkTimer: 0,
    isMoving: false,
    moveSpeed: 120,  // pixels per second

    // Camera
    camX: 0, camY: 0,
    camSmooth: 0.08,

    // Canvas
    canvas: null,
    ctx: null,
    vpW: 0, vpH: 0,

    // Tile size
    TS: 32,

    // Camera zoom (1.0 = default, higher = closer)
    zoom: 1.35,

    // Input state (held keys)
    keys: { up: false, down: false, left: false, right: false, sprint: false },

    // Sprint / Stamina
    stamina: 100,
    maxStamina: 100,
    staminaDrain: 30,     // per second while sprinting
    staminaRegen: 20,     // per second while not sprinting
    isSprinting: false,
    sprintMultiplier: 1.8,

    // Entity / resource tracking
    entityMap: {},
    removedResources: {},
    removedEntities: {},

    // Day/night cycle
    timeOfDay: 0.25,       // 0.0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
    daySpeed: 0.005,       // ~200s full cycle

    // Weather system
    weather: 'clear',
    weatherTimer: 0,
    weatherTransition: 0,
    weatherParticles: [],
    fogEllipses: [],

    // Game loop
    running: false,
    lastTime: 0,
    animTimer: 0,

    // Interaction cooldown
    interactCooldown: 0,

    // Screen transition
    _transition: null,  // { phase: 'out'|'in', alpha: 0-1, callback: null }

    // ---- INIT ----
    init() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        Sprites.init();
        this.resizeCanvas();
        this.bindControls();

        window.addEventListener('resize', () => this.resizeCanvas());

        // Deferred resize — container may not be laid out when init() runs
        requestAnimationFrame(() => this.resizeCanvas());
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;
        const oldW = this.vpW;
        const oldH = this.vpH;
        this.vpW = container.clientWidth;
        this.vpH = container.clientHeight;
        this.canvas.width = this.vpW;
        this.canvas.height = this.vpH;
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;

        // If viewport went from 0 to nonzero (container wasn't laid out yet), re-snap camera
        if ((oldW === 0 || oldH === 0) && this.vpW > 0 && this.vpH > 0 && this.terrain) {
            this.camX = this.px - this.vpW / 2;
            this.camY = this.py - this.vpH / 2;
        }
    },

    // ---- MAP LOADING ----
    loadMap(mapKey, entryX, entryY) {
        const map = MAPS[mapKey];
        if (!map) return;

        this.currentMap = mapKey;
        this.mapData = map;
        this.terrain = map.terrain.map(row => row.split(''));

        // Player position (tile coords → pixel coords)
        const startX = entryX !== undefined ? entryX : map.playerStart.x;
        const startY = entryY !== undefined ? entryY : map.playerStart.y;
        this.px = startX * this.TS + this.TS / 2;
        this.py = startY * this.TS + this.TS / 2;

        // Snap camera immediately
        this.camX = this.px - this.vpW / 2;
        this.camY = this.py - this.vpH / 2;

        // Build entity map
        this.entityMap = {};
        if (map.entities) {
            map.entities.forEach(e => {
                const key = `${e.x},${e.y}`;
                const removedKey = `${mapKey}:${key}`;
                if (!this.removedEntities[removedKey]) {
                    this.entityMap[key] = e;
                }
            });
        }

        // Update game state
        GameState.currentLocation = mapKey;
        GameState.currentRegion = MAP_REGIONS[mapKey] || 'ashen_wastes';
        GameState.playerMapPos = { x: Math.floor(this.px / this.TS), y: Math.floor(this.py / this.TS) };

        // Show location name for first visit
        const locData = WORLD.locations[mapKey];
        if (locData && !GameState.visitedLocations.includes(mapKey)) {
            GameState.visitedLocations.push(mapKey);
            if (locData.narrative && locData.narrative.enter) {
                Narrative.addSeparator();
                Narrative.addStory(locData.narrative.enter);
            }
        }

        HUD.update();
        this.updateActions();

        // Start game loop if not running
        if (!this.running) this.startLoop();
    },

    // ---- GAME LOOP ----
    startLoop() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    },

    stopLoop() {
        this.running = false;
    },

    loop(now) {
        if (!this.running) return;
        requestAnimationFrame((t) => this.loop(t));

        const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = now;

        this.update(dt);
        this.draw();
    },

    // ---- UPDATE ----
    update(dt) {
        if (!this.terrain) return;
        if (GameState.currentScreen !== 'game') return;
        if (GameState.combatState) return;

        // Screen transition (block input during transition)
        this.updateTransition(dt);

        // Interaction cooldown
        if (this.interactCooldown > 0) this.interactCooldown -= dt;

        // Animation timer (for water, fire, etc.)
        this.animTimer += dt;
        if (this.animTimer >= 0.4) {
            this.animTimer -= 0.4;
            Sprites.animFrame = (Sprites.animFrame + 1) % 3;
        }

        // Movement
        this.handleMovement(dt);

        // Camera follow with lerp (account for zoom)
        const targetCamX = this.px - this.vpW / (2 * this.zoom);
        const targetCamY = this.py - this.vpH / (2 * this.zoom);
        const smoothing = 1 - Math.pow(this.camSmooth, dt);
        this.camX += (targetCamX - this.camX) * smoothing;
        this.camY += (targetCamY - this.camY) * smoothing;

        // Update particles
        Sprites.updateParticles(dt);

        // Update ambient particles (use zoomed viewport)
        Sprites.updateAmbientParticles(dt, GameState.currentRegion,
            this.camX, this.camY, this.vpW / this.zoom, this.vpH / this.zoom);

        // Update diegetic overlay
        if (typeof DiegeticFX !== 'undefined') DiegeticFX.update();

        // Day/night cycle
        this.timeOfDay += this.daySpeed * dt;
        if (this.timeOfDay >= 1.0) this.timeOfDay -= 1.0;

        // Weather system
        this.updateWeather(dt);

        // Update stamina bar in HUD (fast path, every frame)
        if (typeof HUD !== 'undefined' && HUD.updateStamina) HUD.updateStamina();
    },

    handleMovement(dt) {
        // Block input during transitions
        if (this._transition) return;

        let dx = 0, dy = 0;
        if (this.keys.up) dy = -1;
        if (this.keys.down) dy = 1;
        if (this.keys.left) dx = -1;
        if (this.keys.right) dx = 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.SQRT2;
            dx *= inv;
            dy *= inv;
        }

        this.isMoving = dx !== 0 || dy !== 0;

        // Cancel fishing if player moves
        if (this.isMoving && this._fishingState === 'casting') {
            clearTimeout(this._fishingTimer);
            this._fishingState = null;
            this._fishingData = null;
            this.interactCooldown = 0;
            Narrative.addFlavor('You reel in your line.');
        }

        // Sprint / Stamina management
        this.isSprinting = this.keys.sprint && this.isMoving && this.stamina > 0;
        if (this.isSprinting) {
            this.stamina = Math.max(0, this.stamina - this.staminaDrain * dt);
            if (this.stamina <= 0) this.isSprinting = false;
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
        }

        if (!this.isMoving) {
            this.walkFrame = 0;
            this.walkTimer = 0;
            return;
        }

        // Update facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            this.facing = dy > 0 ? 'down' : 'up';
        }

        const speedMult = this.isSprinting ? this.sprintMultiplier : 1.0;
        const speed = this.moveSpeed * speedMult * dt;
        const newX = this.px + dx * speed;
        const newY = this.py + dy * speed;

        // Collision: try both axes, then each separately (wall sliding)
        const halfW = 5;   // player collision half-width
        const halfH = 5;   // player collision half-height

        const canMoveX = this.canMoveTo(newX, this.py, halfW, halfH);
        const canMoveY = this.canMoveTo(this.px, newY, halfW, halfH);

        if (canMoveX) this.px = newX;
        if (canMoveY) this.py = newY;

        // Check for map edge transitions
        this.checkTransitions();

        // Update game state position
        GameState.playerMapPos = { x: Math.floor(this.px / this.TS), y: Math.floor(this.py / this.TS) };

        // Walk animation
        this.walkTimer += dt;
        if (this.walkTimer >= 0.15) {
            this.walkTimer -= 0.15;
            this.walkFrame = (this.walkFrame + 1) % 3;
        }

        // Random encounter check (low frequency)
        this.encounterTimer = (this.encounterTimer || 0) + dt;
        if (this.encounterTimer >= 2.0) {
            this.encounterTimer = 0;
            this.checkRandomEncounter();
        }
    },

    canMoveTo(x, y, hw, hh) {
        // Check all four corners of the player's collision box
        const corners = [
            { x: x - hw, y: y - hh },
            { x: x + hw, y: y - hh },
            { x: x - hw, y: y + hh },
            { x: x + hw, y: y + hh },
        ];

        for (const c of corners) {
            const tx = Math.floor(c.x / this.TS);
            const ty = Math.floor(c.y / this.TS);

            // Out of bounds
            if (tx < 0 || ty < 0 || !this.terrain[ty] || tx >= this.terrain[0].length) {
                return true; // allow - we'll handle transitions
            }

            const ch = this.getTerrainChar(tx, ty);
            const tileType = TILE_TYPES[ch] || TILE_TYPES['.'];
            if (!tileType.passable) return false;

            // Entity blocking
            const entity = this.entityMap[`${tx},${ty}`];
            if (entity && (entity.type === 'npc' || entity.type === 'boss')) return false;
        }
        return true;
    },

    checkTransitions() {
        if (!this.mapData || !this.mapData.exits) return;

        const tx = Math.floor(this.px / this.TS);
        const ty = Math.floor(this.py / this.TS);
        const mapH = this.terrain.length;
        const mapW = this.terrain[0].length;

        let direction = null;
        if (ty < 0) direction = 'north';
        else if (ty >= mapH) direction = 'south';
        else if (tx < 0) direction = 'west';
        else if (tx >= mapW) direction = 'east';

        if (!direction) return;

        const exit = this.mapData.exits[direction];
        if (!exit) {
            // Push player back into bounds
            this.px = Math.max(this.TS / 2, Math.min(this.px, (mapW - 0.5) * this.TS));
            this.py = Math.max(this.TS / 2, Math.min(this.py, (mapH - 0.5) * this.TS));
            return;
        }

        // Check region lock
        const targetRegion = MAP_REGIONS[exit.to];
        if (targetRegion && WORLD.regions[targetRegion] && !WORLD.regions[targetRegion].unlocked) {
            Narrative.addSystem(`The path to ${WORLD.regions[targetRegion].name} is blocked. Defeat the region boss to unlock it.`);
            this.px = Math.max(this.TS / 2, Math.min(this.px, (mapW - 0.5) * this.TS));
            this.py = Math.max(this.TS / 2, Math.min(this.py, (mapH - 0.5) * this.TS));
            return;
        }

        Narrative.addAction(`You travel ${direction}...`);
        this.transitionToMap(exit.to, exit.entryX, exit.entryY);
    },

    // Fade-out → load map → fade-in transition
    transitionToMap(mapKey, entryX, entryY) {
        // Start fade-out
        this._transition = { phase: 'out', alpha: 0, speed: 3.5 };
        this._pendingMap = { mapKey, entryX, entryY };
    },

    updateTransition(dt) {
        if (!this._transition) return false;
        const t = this._transition;
        const step = t.speed * dt;

        if (t.phase === 'out') {
            t.alpha = Math.min(1, t.alpha + step);
            if (t.alpha >= 1) {
                // Fully black — load the new map
                if (this._pendingMap) {
                    this.loadMap(this._pendingMap.mapKey, this._pendingMap.entryX, this._pendingMap.entryY);
                    this._pendingMap = null;
                }
                t.phase = 'in';
            }
        } else {
            t.alpha = Math.max(0, t.alpha - step);
            if (t.alpha <= 0) {
                this._transition = null;
            }
        }
        return true;
    },

    drawTransition(ctx, w, h) {
        if (!this._transition) return;
        ctx.fillStyle = `rgba(0,0,0,${this._transition.alpha.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
    },

    // ---- TERRAIN ----
    getTerrainChar(x, y) {
        if (y < 0 || y >= this.terrain.length || x < 0 || x >= this.terrain[0].length) {
            return '#';
        }
        const removedKey = `${this.currentMap}:${x},${y}`;
        if (this.removedResources[removedKey]) {
            return this.currentMap === 'scorched_village' ? 'a' : '.';
        }
        return this.terrain[y][x];
    },

    getTileType(x, y) {
        const ch = this.getTerrainChar(x, y);
        return TILE_TYPES[ch] || TILE_TYPES['.'];
    },

    getEntityAt(x, y) {
        return this.entityMap[`${x},${y}`] || null;
    },

    // ---- DAY/NIGHT CYCLE ----
    getTimeLabel() {
        const t = this.timeOfDay;
        if (t < 0.15) return 'Night';
        if (t < 0.3) return 'Dawn';
        if (t < 0.4) return 'Morning';
        if (t < 0.6) return 'Midday';
        if (t < 0.7) return 'Afternoon';
        if (t < 0.8) return 'Dusk';
        return 'Night';
    },

    // ---- WEATHER SYSTEM ----
    updateWeather(dt) {
        this.weatherTimer += dt;
        // Change weather every 60-120 seconds
        const interval = 60 + Math.random() * 60;
        if (this.weatherTimer >= interval) {
            this.weatherTimer = 0;
            const region = GameState.currentRegion;
            const roll = Math.random();
            if (region === 'ashen_wastes') {
                if (roll < 0.6) this.weather = 'clear';
                else if (roll < 0.8) this.weather = 'fog';
                else this.weather = 'rain';
            } else if (region === 'hollowfen') {
                if (roll < 0.3) this.weather = 'clear';
                else if (roll < 0.6) this.weather = 'fog';
                else if (roll < 0.9) this.weather = 'rain';
                else this.weather = 'snow';
            } else if (region === 'void_sanctum') {
                if (roll < 0.4) this.weather = 'clear';
                else if (roll < 0.8) this.weather = 'fog';
                else this.weather = 'rain';
            } else if (region === 'shattered_spire') {
                if (roll < 0.45) this.weather = 'clear';
                else if (roll < 0.7) this.weather = 'fog';
                else if (roll < 0.85) this.weather = 'snow';
                else this.weather = 'rain';
            }
        }

        // Update weather particles
        if (this.weather === 'rain') {
            // Spawn ~5 rain particles per frame
            for (let i = 0; i < 5; i++) {
                this.weatherParticles.push({
                    x: Math.random() * this.vpW,
                    y: -10,
                    speed: 400 + Math.random() * 200,
                    length: 10 + Math.random() * 8
                });
            }
            // Update rain
            for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
                const p = this.weatherParticles[i];
                p.y += p.speed * dt;
                p.x += p.speed * 0.15 * dt; // diagonal
                if (p.y > this.vpH) {
                    this.weatherParticles.splice(i, 1);
                }
            }
            // Limit particles
            if (this.weatherParticles.length > 300) {
                this.weatherParticles = this.weatherParticles.slice(-300);
            }
        } else if (this.weather === 'snow') {
            // Spawn ~2 snow particles per frame
            for (let i = 0; i < 2; i++) {
                this.weatherParticles.push({
                    x: Math.random() * this.vpW,
                    y: -5,
                    speed: 30 + Math.random() * 30,
                    sway: Math.random() * Math.PI * 2
                });
            }
            // Update snow
            for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
                const p = this.weatherParticles[i];
                p.y += p.speed * dt;
                p.sway += dt * 2;
                p.x += Math.sin(p.sway) * 20 * dt;
                if (p.y > this.vpH) {
                    this.weatherParticles.splice(i, 1);
                }
            }
            if (this.weatherParticles.length > 200) {
                this.weatherParticles = this.weatherParticles.slice(-200);
            }
        } else if (this.weather === 'fog') {
            // Initialize fog ellipses if needed
            if (this.fogEllipses.length === 0) {
                for (let i = 0; i < 5; i++) {
                    this.fogEllipses.push({
                        x: Math.random() * this.vpW,
                        y: Math.random() * this.vpH,
                        rx: 150 + Math.random() * 200,
                        ry: 60 + Math.random() * 80,
                        speed: 10 + Math.random() * 15
                    });
                }
            }
            // Update fog
            for (const f of this.fogEllipses) {
                f.x += f.speed * dt;
                if (f.x - f.rx > this.vpW) {
                    f.x = -f.rx;
                    f.y = Math.random() * this.vpH;
                }
            }
        } else {
            // Clear weather — remove particles gradually
            if (this.weatherParticles.length > 0) {
                this.weatherParticles = this.weatherParticles.slice(Math.ceil(this.weatherParticles.length * 0.1));
            }
            if (this.fogEllipses.length > 0 && this.weather !== 'fog') {
                this.fogEllipses = [];
            }
        }
    },

    drawWeather(ctx) {
        if (this.weather === 'rain') {
            ctx.strokeStyle = 'rgba(150,180,220,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (const p of this.weatherParticles) {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.length * 0.15, p.y + p.length);
            }
            ctx.stroke();

            // Splash effects at bottom
            ctx.fillStyle = 'rgba(150,180,220,0.2)';
            for (const p of this.weatherParticles) {
                if (p.y > this.vpH - 20) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (this.weather === 'snow') {
            ctx.fillStyle = 'rgba(220,230,255,0.6)';
            for (const p of this.weatherParticles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.weather === 'fog') {
            for (const f of this.fogEllipses) {
                ctx.fillStyle = 'rgba(150,160,170,0.06)';
                ctx.beginPath();
                ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    // ---- DRAW ----
    draw() {
        const ctx = this.ctx;
        if (!ctx || !this.terrain) return;

        const w = this.vpW;
        const h = this.vpH;
        const T = this.TS;
        const Z = this.zoom;

        // Clear with biome-appropriate color
        const bgColors = {
            ashen_wastes: '#2a1f14',
            hollowfen: '#0f1a1f',
            void_sanctum: '#15081a',
            shattered_spire: '#0a0e22'
        };
        ctx.fillStyle = bgColors[GameState.currentRegion] || '#1a2a15';
        ctx.fillRect(0, 0, w, h);

        // Apply zoom — crisp pixel scaling
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.scale(Z, Z);

        // Effective viewport in world space (smaller when zoomed)
        const vw = w / Z;
        const vh = h / Z;

        // Which tiles are visible
        const startTX = Math.floor(this.camX / T) - 1;
        const startTY = Math.floor(this.camY / T) - 1;
        const endTX = Math.ceil((this.camX + vw) / T) + 1;
        const endTY = Math.ceil((this.camY + vh) / T) + 1;

        const mapH = this.terrain.length;
        const mapW = this.terrain[0].length;

        // ── Pass 1: Base terrain tiles ──
        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);

                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) {
                    const oobTile = Sprites.getTile('.', Math.abs(tx) % 64, Math.abs(ty) % 64);
                    if (oobTile) ctx.drawImage(oobTile, screenX, screenY, T, T);
                    continue;
                }

                const ch = this.getTerrainChar(tx, ty);
                const tileCanvas = Sprites.getTile(ch, tx, ty);
                if (tileCanvas) {
                    ctx.drawImage(tileCanvas, screenX, screenY, T, T);
                }
            }
        }

        // ── Pass 2: Ground detail overlay — contextual details based on neighbors ──
        this.drawGroundDetails(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 2b: Water edge blending — foam and shore transitions ──
        this.drawWaterEdges(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 2c: Animated grass sway on grass/tall grass tiles ──
        this.drawGrassSway(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 2d: Animated water surface shimmer ──
        this.drawWaterShimmer(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 2e: Banner wave animation ──
        this.drawBannerWave(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 2f: Fire spark particles ──
        this.drawFireSparks(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 2g: Smoke wisps from scorched vents and ruins ──
        this.drawSmokeWisps(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 3: Terrain shadows — tall objects cast directional shadows ──
        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = this.getTerrainChar(tx, ty);
                if (ch === 'T' || ch === '#' || ch === 'R' || ch === 'P' || ch === 'K' || ch === 'N' || ch === 'U' || ch === 'A' || ch === 'e' || ch === 'r' || ch === 'k' || ch === 'l') {
                    const sx = Math.floor(tx * T - this.camX) + 5;
                    const sy = Math.floor(ty * T - this.camY) + 5;
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.beginPath();
                    ctx.ellipse(sx + T * 0.4, sy + T * 0.5, T * 0.45, T * 0.3, 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // ── Pass 4+5+6: Y-sorted depth rendering (entities + player) ──
        // Collect all drawable entities and the player, sort by Y position, draw back-to-front
        const drawables = [];

        // Add entities
        for (const key in this.entityMap) {
            const entity = this.entityMap[key];
            const [ex, ey] = key.split(',').map(Number);
            const screenX = Math.floor(ex * T - this.camX);
            const screenY = Math.floor(ey * T - this.camY);
            if (screenX < -T || screenX > vw || screenY < -T || screenY > vh) continue;
            drawables.push({
                type: 'entity',
                entity,
                screenX,
                screenY,
                sortY: ey * T + T  // Bottom of tile for depth
            });
        }

        // Add player
        const playerSprite = Sprites.getPlayer(this.facing, this.walkFrame);
        if (playerSprite) {
            drawables.push({
                type: 'player',
                sortY: this.py + playerSprite.height / 2  // Bottom of player
            });
        }

        // Sort back-to-front by Y position
        drawables.sort((a, b) => a.sortY - b.sortY);

        // Draw all in sorted order (shadow first, then sprite)
        for (const d of drawables) {
            if (d.type === 'entity') {
                // Entity shadow
                if (d.entity.type === 'npc' || d.entity.type === 'enemy_spawn' || d.entity.type === 'boss') {
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.beginPath();
                    ctx.ellipse(d.screenX + T / 2, d.screenY + T - 3, T * 0.35, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Entity sprite
                this.drawEntity(ctx, d.entity, d.screenX, d.screenY);
            } else {
                // Player shadow + sprite
                this.drawPlayer(ctx);
            }
        }

        // ── Pass 7: Forest edge canopy overhang (drawn over entities for depth) ──
        this.drawForestEdges(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T);

        // ── Pass 8: Interaction prompt ──
        this.drawInteractPrompt(ctx);

        // ── Pass 9: Particles ──
        Sprites.drawParticles(ctx, this.camX, this.camY);
        Sprites.drawAmbientParticles(ctx, this.camX, this.camY);

        // Restore zoom transform before post-processing (these work in screen space)
        ctx.restore();

        // ── Pass 10: Post-processing (in screen space) ──
        Sprites.applyRegionTint(ctx, w, h, GameState.currentRegion);

        Sprites.collectLightSources(this.terrain, this.entityMap,
            this.camX, this.camY, vw, vh, this.TS);
        Sprites.drawLighting(ctx, w, h, GameState.currentRegion, this.timeOfDay);

        this.drawWeather(ctx);
        Sprites.drawVignette(ctx, w, h);

        // ── Pass 11: Screen transition overlay ──
        this.drawTransition(ctx, w, h);
    },

    // ── Ground detail overlay — contextual details clustered near features ──
    drawGroundDetails(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const terrainSet = new Set(['T', 'P', 'K', '#', 'R', 'I', '~', 'O', 'F', 'E', 'V', 'L']);

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 1 || ty < 1 || ty >= mapH - 1 || tx >= mapW - 1) continue;
                const ch = this.getTerrainChar(tx, ty);
                // Only overlay on walkable ground tiles
                if (ch !== '.' && ch !== 'g' && ch !== 'w' && ch !== 'h' && ch !== 'B'
                    && ch !== 'a' && ch !== 'd' && ch !== 'o') continue;

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);
                const hash = Sprites.hash(tx, ty);

                // Check what's adjacent
                const n = this.getTerrainChar(tx, ty - 1);
                const s = this.getTerrainChar(tx, ty + 1);
                const e = this.getTerrainChar(tx + 1, ty);
                const w = this.getTerrainChar(tx - 1, ty);

                const nearPath = n === 'p' || s === 'p' || e === 'p' || w === 'p';
                const nearTree = n === 'T' || s === 'T' || e === 'T' || w === 'T' ||
                                 n === 'P' || s === 'P' || e === 'P' || w === 'P';
                const nearWall = n === '#' || s === '#' || e === '#' || w === '#';
                const nearWater = n === '~' || s === '~' || e === '~' || w === '~' ||
                                  n === 'O' || s === 'O' || e === 'O' || w === 'O';
                const nearFire = n === 'F' || s === 'F' || e === 'F' || w === 'F';
                const nearDead = n === 'K' || s === 'K' || e === 'K' || w === 'K' ||
                                 n === 'X' || s === 'X' || e === 'X' || w === 'X';

                // Path-edge worn blend — gradient dirt transition at path borders
                if (nearPath) {
                    const pN = n === 'p', pS = s === 'p', pW = w === 'p', pE = e === 'p';

                    // Soft dirt gradient fading away from path edge
                    if (pN) {
                        const grd = ctx.createLinearGradient(screenX, screenY, screenX, screenY + T);
                        grd.addColorStop(0, 'rgba(90,80,60,0.35)');
                        grd.addColorStop(0.4, 'rgba(90,80,60,0.12)');
                        grd.addColorStop(1, 'rgba(90,80,60,0)');
                        ctx.fillStyle = grd;
                        ctx.fillRect(screenX, screenY, T, T);
                    }
                    if (pS) {
                        const grd = ctx.createLinearGradient(screenX, screenY + T, screenX, screenY);
                        grd.addColorStop(0, 'rgba(90,80,60,0.35)');
                        grd.addColorStop(0.4, 'rgba(90,80,60,0.12)');
                        grd.addColorStop(1, 'rgba(90,80,60,0)');
                        ctx.fillStyle = grd;
                        ctx.fillRect(screenX, screenY, T, T);
                    }
                    if (pW) {
                        const grd = ctx.createLinearGradient(screenX, screenY, screenX + T, screenY);
                        grd.addColorStop(0, 'rgba(90,80,60,0.35)');
                        grd.addColorStop(0.4, 'rgba(90,80,60,0.12)');
                        grd.addColorStop(1, 'rgba(90,80,60,0)');
                        ctx.fillStyle = grd;
                        ctx.fillRect(screenX, screenY, T, T);
                    }
                    if (pE) {
                        const grd = ctx.createLinearGradient(screenX + T, screenY, screenX, screenY);
                        grd.addColorStop(0, 'rgba(90,80,60,0.35)');
                        grd.addColorStop(0.4, 'rgba(90,80,60,0.12)');
                        grd.addColorStop(1, 'rgba(90,80,60,0)');
                        ctx.fillStyle = grd;
                        ctx.fillRect(screenX, screenY, T, T);
                    }

                    // Scattered dirt specks along the path edge
                    ctx.fillStyle = '#7a6a55';
                    ctx.globalAlpha = 0.3;
                    for (let i = 0; i < 5; i++) {
                        const sx = (hash + i * 7) % (T - 2);
                        const sy = (hash + i * 11) % (T - 2);
                        ctx.fillRect(screenX + sx, screenY + sy, 2, 1);
                    }

                    // Trampled grass (shorter, yellowed blades near path)
                    ctx.fillStyle = '#8a8a5a';
                    ctx.globalAlpha = 0.2;
                    const dx = (hash % 7) * 4;
                    const dy = ((hash >> 3) % 6) * 4;
                    ctx.fillRect(screenX + dx, screenY + dy, 2, 1);
                    if ((hash % 3) === 0) ctx.fillRect(screenX + dx + 10, screenY + dy + 8, 2, 1);
                    ctx.globalAlpha = 1;
                }

                // Fallen leaves near trees
                if (nearTree && (hash % 7) < 3) {
                    const leafColors = ['#5a7a2a', '#4a6a1a', '#6a5a2a', '#7a6a3a'];
                    ctx.fillStyle = leafColors[hash % leafColors.length];
                    ctx.globalAlpha = 0.4;
                    const lx = (hash % 5) * 5 + 2;
                    const ly = ((hash >> 4) % 5) * 5 + 2;
                    ctx.fillRect(screenX + lx, screenY + ly, 2, 1);
                    ctx.fillRect(screenX + lx + 10, screenY + ly + 8, 1, 2);
                    ctx.globalAlpha = 1;
                }

                // Rubble and moss near walls/ruins
                if (nearWall && (hash % 4) < 2) {
                    // Rubble
                    ctx.fillStyle = '#5a5a5a';
                    ctx.globalAlpha = 0.3;
                    const rx = (hash % 6) * 4;
                    const ry = ((hash >> 2) % 5) * 5;
                    ctx.fillRect(screenX + rx, screenY + ry, 3, 2);
                    ctx.fillRect(screenX + rx + 7, screenY + ry + 4, 2, 2);
                    // Green moss patch
                    ctx.fillStyle = '#3a6a3a';
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(screenX + rx + 14, screenY + ry + 10, 4, 3);
                    ctx.globalAlpha = 1;
                }

                // Wet darkening near water
                if (nearWater) {
                    ctx.fillStyle = '#1a3a2a';
                    ctx.globalAlpha = 0.15;
                    ctx.fillRect(screenX, screenY, T, T);
                    ctx.globalAlpha = 1;
                }

                // Scorch marks near campfires
                if (nearFire) {
                    ctx.fillStyle = '#3a2a1a';
                    ctx.globalAlpha = 0.2;
                    ctx.beginPath();
                    ctx.ellipse(screenX + T / 2, screenY + T / 2, T * 0.4, T * 0.35, hash * 0.1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }

                // Bone fragments and dried patches near dead trees/bones
                if (nearDead && (hash % 6) < 2) {
                    ctx.fillStyle = '#8a7a6a';
                    ctx.globalAlpha = 0.25;
                    const bx = (hash % 8) * 3;
                    const by = ((hash >> 3) % 7) * 3;
                    ctx.fillRect(screenX + bx, screenY + by, 3, 1);
                    ctx.globalAlpha = 1;
                }

                // Scorched details — soot staining near scorched walls and rubble
                const nearScorchedWall = n === 'e' || s === 'e' || e === 'e' || w === 'e';
                const nearRubble = n === 'r' || s === 'r' || e === 'r' || w === 'r' ||
                                   n === 'k' || s === 'k' || e === 'k' || w === 'k';
                const nearSmokeVent = n === 'v' || s === 'v' || e === 'v' || w === 'v';
                const nearBurnedTimber = n === 'l' || s === 'l' || e === 'l' || w === 'l';

                if (nearScorchedWall) {
                    // Dark soot streaks radiating outward
                    ctx.fillStyle = '#1a1616';
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(screenX, screenY, T, T);
                    ctx.globalAlpha = 0.15;
                    for (let i = 0; i < 3; i++) {
                        const sx = (hash + i * 9) % (T - 3);
                        const sy = (hash + i * 13) % (T - 2);
                        ctx.fillRect(screenX + sx, screenY + sy, 3, 1);
                    }
                    ctx.globalAlpha = 1;
                }

                if (nearRubble && (hash % 5) < 3) {
                    // Scattered stone chips
                    ctx.fillStyle = '#5a5555';
                    ctx.globalAlpha = 0.25;
                    const rx = (hash % 7) * 4;
                    const ry = ((hash >> 2) % 6) * 4;
                    ctx.fillRect(screenX + rx, screenY + ry, 2, 2);
                    ctx.fillRect(screenX + rx + 8, screenY + ry + 6, 1, 1);
                    ctx.globalAlpha = 1;
                }

                if (nearSmokeVent) {
                    // Warm glow near smoke vents
                    ctx.fillStyle = '#4a2a1a';
                    ctx.globalAlpha = 0.12;
                    ctx.beginPath();
                    ctx.ellipse(screenX + T / 2, screenY + T / 2, T * 0.5, T * 0.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }

                if (nearBurnedTimber && (hash % 4) < 2) {
                    // Charcoal and ash specks
                    ctx.fillStyle = '#2a2420';
                    ctx.globalAlpha = 0.2;
                    for (let i = 0; i < 4; i++) {
                        ctx.fillRect(screenX + (hash + i * 5) % T, screenY + (hash + i * 8) % T, 1, 1);
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }
    },

    // ── Forest edge canopy overhang — trees cast leaf-shadow onto adjacent ground ──
    drawForestEdges(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const treeSet = new Set(['T', 'P', 'K']);
        const groundSet = new Set(['.', 'p', 'g', 'w', 'h', 'B', 'J', 'Q', 'X', 'a', 'd', 'o']);

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 1 || ty < 1 || ty >= mapH - 1 || tx >= mapW - 1) continue;
                const ch = this.getTerrainChar(tx, ty);
                if (!groundSet.has(ch)) continue;

                const hash = Sprites.hash(tx, ty);
                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);

                // Check which sides have trees
                const tN = treeSet.has(this.getTerrainChar(tx, ty - 1));
                const tS = treeSet.has(this.getTerrainChar(tx, ty + 1));
                const tW = treeSet.has(this.getTerrainChar(tx - 1, ty));
                const tE = treeSet.has(this.getTerrainChar(tx + 1, ty));

                if (!tN && !tS && !tW && !tE) continue;

                // Dappled leaf shadow overhang from adjacent trees
                const leafColors = ['#1a5a0a', '#0a4a00', '#2a6a1a'];
                ctx.globalAlpha = 0.18;

                if (tN) {
                    // Canopy hangs down from north
                    ctx.fillStyle = leafColors[hash % 3];
                    const depth = 6 + (hash % 5);
                    ctx.beginPath();
                    ctx.ellipse(screenX + T / 2 + ((hash % 7) - 3), screenY + depth / 2,
                        T * 0.55, depth, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (tS && (hash % 3) < 2) {
                    ctx.fillStyle = leafColors[(hash + 1) % 3];
                    const depth = 4 + (hash % 4);
                    ctx.beginPath();
                    ctx.ellipse(screenX + T / 2, screenY + T - depth / 2,
                        T * 0.45, depth, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (tW) {
                    ctx.fillStyle = leafColors[(hash + 2) % 3];
                    const depth = 5 + (hash % 4);
                    ctx.beginPath();
                    ctx.ellipse(screenX + depth / 2, screenY + T / 2 + ((hash % 5) - 2),
                        depth, T * 0.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (tE && (hash % 3) < 2) {
                    ctx.fillStyle = leafColors[hash % 3];
                    const depth = 4 + (hash % 5);
                    ctx.beginPath();
                    ctx.ellipse(screenX + T - depth / 2, screenY + T / 2,
                        depth, T * 0.35, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalAlpha = 1;

                // Dappled light spots under canopy overhang
                if ((tN || tW) && (hash % 4) === 0) {
                    ctx.fillStyle = 'rgba(180,220,100,0.08)';
                    const sx = (hash % 5) * 5 + 4;
                    const sy = ((hash >> 3) % 4) * 5 + 3;
                    ctx.fillRect(screenX + sx, screenY + sy, 3, 2);
                }
            }
        }
    },

    // ── Water edge blending — shoreline transitions with foam/mud ──
    drawWaterEdges(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const waterSet = new Set(['~', 'O']);
        const time = Date.now() * 0.001;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 1 || ty < 1 || ty >= mapH - 1 || tx >= mapW - 1) continue;
                const ch = this.getTerrainChar(tx, ty);
                if (!waterSet.has(ch)) continue;

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);
                const hash = Sprites.hash(tx, ty);

                // Check which sides adjoin land
                const landN = !waterSet.has(this.getTerrainChar(tx, ty - 1));
                const landS = !waterSet.has(this.getTerrainChar(tx, ty + 1));
                const landW = !waterSet.has(this.getTerrainChar(tx - 1, ty));
                const landE = !waterSet.has(this.getTerrainChar(tx + 1, ty));

                if (!landN && !landS && !landW && !landE) continue;

                // Animated foam line at shore edge
                const waveOff = Math.sin(time * 1.5 + tx * 0.8 + ty * 0.5) * 2;

                if (landN) {
                    // Foam along top edge
                    ctx.fillStyle = 'rgba(180,200,220,0.25)';
                    for (let i = 0; i < 6; i++) {
                        const fx = (hash + i * 5) % T;
                        ctx.fillRect(screenX + fx, screenY + waveOff, 3, 1);
                    }
                    // Muddy shore blend
                    ctx.fillStyle = 'rgba(90,70,40,0.15)';
                    ctx.fillRect(screenX, screenY, T, 3 + waveOff);
                }
                if (landS) {
                    ctx.fillStyle = 'rgba(180,200,220,0.2)';
                    for (let i = 0; i < 5; i++) {
                        const fx = (hash + i * 7) % T;
                        ctx.fillRect(screenX + fx, screenY + T - 2 + waveOff * 0.5, 3, 1);
                    }
                    ctx.fillStyle = 'rgba(90,70,40,0.12)';
                    ctx.fillRect(screenX, screenY + T - 3, T, 3);
                }
                if (landW) {
                    ctx.fillStyle = 'rgba(180,200,220,0.2)';
                    for (let i = 0; i < 4; i++) {
                        const fy = (hash + i * 6) % T;
                        ctx.fillRect(screenX + waveOff, screenY + fy, 1, 3);
                    }
                    ctx.fillStyle = 'rgba(90,70,40,0.12)';
                    ctx.fillRect(screenX, screenY, 3, T);
                }
                if (landE) {
                    ctx.fillStyle = 'rgba(180,200,220,0.18)';
                    for (let i = 0; i < 4; i++) {
                        const fy = (hash + i * 8) % T;
                        ctx.fillRect(screenX + T - 2 + waveOff * 0.5, screenY + fy, 1, 3);
                    }
                    ctx.fillStyle = 'rgba(90,70,40,0.1)';
                    ctx.fillRect(screenX + T - 3, screenY, 3, T);
                }
            }
        }
    },

    // ── Animated grass sway — subtle wind-driven blade movement ──
    drawGrassSway(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const time = Date.now() * 0.001;
        const bladeColors = ['#5aaa3e', '#6aba4e', '#4a9a2e'];
        ctx.globalAlpha = 0.5;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = this.getTerrainChar(tx, ty);
                // Only sway on grass/tallgrass/wildflower tiles
                if (ch !== '.' && ch !== 'g' && ch !== 'w') continue;

                const hash = Sprites.hash(tx, ty);
                // Only some tiles get sway (not every one — performance + visual rhythm)
                if ((hash % 4) !== 0) continue;

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);

                // Wind wave: phase varies by position for natural wave effect
                const phase = tx * 0.7 + ty * 0.4 + time * 2.5;
                const sway = Math.sin(phase) * 2;

                ctx.fillStyle = bladeColors[hash % bladeColors.length];

                // Draw 2-3 swaying grass blades
                const bx1 = (hash % 6) * 4 + 4;
                const bx2 = ((hash >> 2) % 5) * 4 + 8;
                const bh = ch === 'g' ? 6 : 4;

                ctx.fillRect(screenX + bx1 + sway, screenY + T - bh - 2, 1, bh);
                ctx.fillRect(screenX + bx2 + sway * 0.7, screenY + T - bh - 4, 1, bh + 1);
            }
        }
        ctx.globalAlpha = 1;
    },

    // ── Animated water surface shimmer — moving light reflections on water tiles ──
    drawWaterShimmer(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const time = Date.now() * 0.001;
        const waterSet = new Set(['~', 'O']);

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = this.getTerrainChar(tx, ty);
                if (!waterSet.has(ch)) continue;

                const hash = Sprites.hash(tx, ty);
                if ((hash % 3) !== 0) continue;  // Only 1/3 of water tiles

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);

                // Traveling light reflection
                const phase = tx * 0.5 + ty * 0.3 + time * 1.2;
                const shimmerX = Math.sin(phase) * 8 + T / 2;
                const shimmerY = Math.cos(phase * 0.7 + 1.3) * 6 + T / 2;
                const alpha = 0.15 + Math.sin(phase * 2.3) * 0.1;

                ctx.fillStyle = `rgba(200,230,255,${alpha.toFixed(2)})`;
                ctx.fillRect(Math.floor(screenX + shimmerX), Math.floor(screenY + shimmerY), 2, 1);

                // Secondary smaller sparkle
                const phase2 = tx * 1.1 - ty * 0.6 + time * 1.8;
                const sx2 = Math.sin(phase2) * 10 + T / 2;
                const sy2 = Math.cos(phase2 * 0.5) * 8 + T / 2;
                const a2 = 0.1 + Math.sin(phase2 * 3.1) * 0.08;
                ctx.fillStyle = `rgba(255,255,255,${a2.toFixed(2)})`;
                ctx.fillRect(Math.floor(screenX + sx2), Math.floor(screenY + sy2), 1, 1);
            }
        }
    },

    // ── Animated banner/flag wave — cloth physics on banner tiles ──
    drawBannerWave(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const time = Date.now() * 0.001;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = this.getTerrainChar(tx, ty);
                if (ch !== 'N') continue;  // Banner tiles only

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);

                // Cloth wave — animates the right edge of the banner
                const wave = Math.sin(time * 3 + tx * 2.1 + ty * 0.7) * 2;
                const wave2 = Math.sin(time * 4.5 + tx * 1.3) * 1.5;

                // Animated cloth edge strip (overwrites static banner edge)
                ctx.fillStyle = '#8a2222';
                ctx.globalAlpha = 0.7;
                // Wave the bottom-right portion of the banner
                for (let i = 0; i < 5; i++) {
                    const fx = 18 + 8 + wave + i * 0.5;
                    const fy = 4 + i * 3 + wave2 * (i / 5);
                    ctx.fillRect(Math.floor(screenX + fx), Math.floor(screenY + fy), 2, 3);
                }
                ctx.globalAlpha = 1;
            }
        }
    },

    // ── Animated torch/fire spark particles — small sparks rise from campfires ──
    drawFireSparks(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const time = Date.now() * 0.001;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = this.getTerrainChar(tx, ty);
                if (ch !== 'F' && ch !== 'L') continue;

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);
                const hash = Sprites.hash(tx, ty);

                // 2-3 rising sparks per fire tile
                const numSparks = ch === 'F' ? 3 : 2;
                for (let i = 0; i < numSparks; i++) {
                    const phase = time * 1.5 + i * 2.1 + hash * 0.1;
                    const cycle = phase % 3;  // 3-second cycle
                    const progress = cycle / 3;

                    // Spark rises and fades
                    const sparkX = screenX + T / 2 + Math.sin(phase * 2 + i) * 6;
                    const sparkY = screenY + T * 0.4 - progress * T * 0.8;
                    const alpha = Math.max(0, (1 - progress) * 0.6);

                    if (alpha > 0.05) {
                        ctx.fillStyle = i === 0 ? `rgba(255,200,50,${alpha.toFixed(2)})` :
                                                  `rgba(255,120,30,${alpha.toFixed(2)})`;
                        ctx.fillRect(Math.floor(sparkX), Math.floor(sparkY), 1, 1);
                    }
                }
            }
        }
    },

    drawSmokeWisps(ctx, startTX, startTY, endTX, endTY, mapW, mapH, T) {
        const time = Date.now() * 0.001;

        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;
                const ch = this.getTerrainChar(tx, ty);
                // Smoke from vents, and subtle wisps from scorched walls and burned timber
                if (ch !== 'v' && ch !== 'e' && ch !== 'l') continue;

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);
                const hash = Sprites.hash(tx, ty);

                // Smoke vents get thick smoke; walls/timber get subtle wisps
                const numPuffs = ch === 'v' ? 3 : 1;
                const maxAlpha = ch === 'v' ? 0.18 : 0.08;
                // Only some walls/timbers actually smoke (for variety)
                if (ch !== 'v' && (hash % 5) > 1) continue;

                for (let i = 0; i < numPuffs; i++) {
                    const phase = time * 0.6 + i * 2.5 + hash * 0.05;
                    const cycle = phase % 5;
                    const progress = cycle / 5;

                    // Smoke puff rises slowly and drifts
                    const puffX = screenX + T / 2 + Math.sin(phase * 0.8 + i) * 8;
                    const puffY = screenY + T * 0.3 - progress * T * 1.5;
                    const size = 3 + progress * 6;
                    const alpha = Math.max(0, (1 - progress) * maxAlpha);

                    if (alpha > 0.01) {
                        ctx.fillStyle = `rgba(80,75,70,${alpha.toFixed(3)})`;
                        ctx.beginPath();
                        ctx.ellipse(Math.floor(puffX), Math.floor(puffY), size, size * 0.7, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    },

    drawPlayer(ctx) {
        const sprite = Sprites.getPlayer(this.facing, this.walkFrame);
        if (!sprite) return;

        // Player drawn centered at their position
        const screenX = Math.floor(this.px - this.camX - sprite.width / 2);
        const screenY = Math.floor(this.py - this.camY - sprite.height / 2 - 4);

        // Shadow under player's feet
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(screenX + sprite.width / 2, screenY + sprite.height - 2,
            sprite.width * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw player sprite
        ctx.drawImage(sprite, screenX, screenY);
    },

    drawEntity(ctx, entity, screenX, screenY) {
        const T = this.TS;
        switch (entity.type) {
            case 'npc': {
                const npcSprite = Sprites.getNPC(entity.id);
                if (npcSprite) {
                    // NPC quest/talk indicator
                    const bob = Math.sin(Date.now() * 0.003) * 2;
                    ctx.fillStyle = '#ffcc00';
                    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(screenX + T / 2, screenY - 4 + bob);
                    ctx.lineTo(screenX + T / 2 - 3, screenY - 10 + bob);
                    ctx.lineTo(screenX + T / 2 + 3, screenY - 10 + bob);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.drawImage(npcSprite, screenX + (T - npcSprite.width) / 2, screenY + (T - npcSprite.height) / 2);
                }
                break;
            }
            case 'enemy_spawn': {
                // Danger marker with pulse
                const pulse = 0.6 + Math.sin(Date.now() * 0.004 + screenX) * 0.4;
                ctx.fillStyle = `rgba(180,40,40,${(0.15 * pulse).toFixed(2)})`;
                ctx.beginPath();
                ctx.ellipse(screenX + T / 2, screenY + T / 2, T * 0.5, T * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                const marker = Sprites.cache.enemy_marker;
                if (marker) {
                    ctx.drawImage(marker, screenX + (T - marker.width) / 2, screenY + 2);
                }
                break;
            }
            case 'boss': {
                // Boss aura
                const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
                ctx.fillStyle = `rgba(200,160,40,${(0.12 * pulse).toFixed(2)})`;
                ctx.beginPath();
                ctx.ellipse(screenX + T / 2, screenY + T / 2, T * 0.6, T * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                const boss = Sprites.cache.boss_marker;
                if (boss) {
                    ctx.drawImage(boss, screenX + (T - boss.width) / 2, screenY + 2);
                }
                break;
            }
            case 'chest': {
                // Sparkle effect on chest
                const chest = Sprites.cache.chest;
                if (chest) {
                    ctx.drawImage(chest, screenX, screenY, T, T);
                    // Sparkle particles
                    const t = Date.now() * 0.002;
                    for (let i = 0; i < 3; i++) {
                        const angle = t + i * 2.1;
                        const dist = 4 + Math.sin(t * 1.5 + i) * 3;
                        const sx = screenX + T / 2 + Math.cos(angle) * dist;
                        const sy = screenY + T * 0.3 + Math.sin(angle) * dist * 0.6;
                        const alpha = 0.3 + Math.sin(t * 3 + i * 1.7) * 0.3;
                        ctx.fillStyle = `rgba(255,220,100,${alpha.toFixed(2)})`;
                        ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
                    }
                }
                break;
            }
            case 'campfire': {
                const fire = Sprites.cache[`campfire_${Sprites.animFrame % 3}`];
                if (fire) {
                    ctx.drawImage(fire, screenX, screenY, T, T);
                }
                break;
            }
        }
    },

    drawInteractPrompt(ctx) {
        // Get tile player is facing
        const faceTX = Math.floor(this.px / this.TS);
        const faceTY = Math.floor(this.py / this.TS);
        let fx = faceTX, fy = faceTY;
        switch (this.facing) {
            case 'up': fy--; break;
            case 'down': fy++; break;
            case 'left': fx--; break;
            case 'right': fx++; break;
        }

        // Check for interactable
        const entity = this.getEntityAt(fx, fy);
        const tile = this.getTileType(fx, fy);
        let promptText = null;

        if (entity) {
            switch (entity.type) {
                case 'npc': {
                    const npc = NPCS[entity.id];
                    promptText = npc ? `Talk to ${npc.name}` : 'Talk';
                    break;
                }
                case 'enemy_spawn': promptText = 'Fight'; break;
                case 'boss': promptText = 'Challenge'; break;
                case 'chest': promptText = 'Open'; break;
                case 'campfire': promptText = 'Rest'; break;
            }
        } else if (tile.resource) {
            promptText = 'Gather';
        } else if (tile.name === 'Water' || tile.name === 'Pond') {
            // Check if player has a fishing rod equipped
            if (GameState.player && GameState.player.equipment && GameState.player.equipment.weapon) {
                const weapon = ITEMS[GameState.player.equipment.weapon];
                if (weapon && weapon.toolType === 'fishing') {
                    promptText = 'Fish';
                }
            }
        } else if (this.mapData && this.mapData.isCamp) {
            const campCh = this.getTerrainChar(fx, fy);
            if (campCh === 'B' || campCh === '.' || campCh === 'p' || campCh === 'g' || campCh === 'w' || campCh === 'h') {
                promptText = 'Build';
            }
        }

        if (promptText) {
            // Highlight the faced tile
            const hx = Math.floor(fx * this.TS - this.camX);
            const hy = Math.floor(fy * this.TS - this.camY);
            ctx.strokeStyle = 'rgba(200,180,120,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 1, hy + 1, this.TS - 2, this.TS - 2);

            // Draw prompt above tile
            ctx.font = '11px monospace';
            Sprites.drawInteractPrompt(ctx, hx + this.TS / 2, hy, promptText);
        }
    },

    // ---- INTERACTION ----
    interact() {
        if (GameState.currentScreen !== 'game') return;
        if (GameState.combatState) return;

        // Fishing reel-in check — bypass cooldown
        if (this._fishingState === 'bite') {
            this.reelIn();
            return;
        }

        if (this.interactCooldown > 0) return;
        this.interactCooldown = 0.3;

        const faceTX = Math.floor(this.px / this.TS);
        const faceTY = Math.floor(this.py / this.TS);
        let fx = faceTX, fy = faceTY;
        switch (this.facing) {
            case 'up': fy--; break;
            case 'down': fy++; break;
            case 'left': fx--; break;
            case 'right': fx++; break;
        }

        // Entity interaction
        const entity = this.getEntityAt(fx, fy);
        if (entity) {
            this.interactEntity(entity, fx, fy);
            return;
        }

        // Tile resource
        const tile = this.getTileType(fx, fy);
        if (tile.resource) {
            this.gatherResource(fx, fy, tile);
            return;
        }

        // Fishing at water tiles
        if ((tile.name === 'Water' || tile.name === 'Pond') && GameState.player && GameState.player.equipment) {
            const weapon = ITEMS[GameState.player.equipment.weapon];
            if (weapon && weapon.toolType === 'fishing') {
                this.fish(fx, fy, weapon);
                return;
            }
        }

        // Building spot (legacy) or free building in camp
        if (this.mapData && this.mapData.isCamp) {
            const ch = this.getTerrainChar(fx, fy);
            if (ch === 'B' || ch === '.' || ch === 'p' || ch === 'g' || ch === 'w' || ch === 'h') {
                this.interactBuildingSpot(fx, fy);
                return;
            }
        }

        Narrative.addSystem('Nothing to interact with here.');
    },

    interactEntity(entity, x, y) {
        switch (entity.type) {
            case 'npc':
                if (NPCS[entity.id]) {
                    Dialogue.start(entity.id);
                }
                break;

            case 'enemy_spawn': {
                const enemies = entity.enemies || [];
                const enemyKey = enemies[Math.floor(Math.random() * enemies.length)];
                if (enemyKey && ENEMIES[enemyKey]) {
                    Narrative.addFlavor('You engage the enemy!');
                    setTimeout(() => {
                        Combat.start(enemyKey, (result) => {
                            if (result === 'victory') {
                                const key = `${x},${y}`;
                                const removedKey = `${this.currentMap}:${key}`;
                                this.removedEntities[removedKey] = true;
                                delete this.entityMap[key];
                            }
                        });
                    }, 300);
                }
                break;
            }

            case 'boss': {
                const boss = ENEMIES[entity.id];
                if (!boss) return;

                if (GameState.bossesDefeated.includes(entity.id)) {
                    Narrative.addSystem(`The ${boss.name} has already been defeated.`);
                    return;
                }

                const locData = WORLD.locations[this.currentMap];
                if (locData && locData.narrative && locData.narrative.preBoss) {
                    Narrative.addStory(locData.narrative.preBoss);
                }

                setTimeout(() => {
                    Combat.start(entity.id, (result) => {
                        if (result === 'victory') {
                            const mapData = MAPS[this.currentMap];
                            if (mapData && mapData.regionUnlock) {
                                const ru = mapData.regionUnlock;
                                if (ru.unlocks && WORLD.regions[ru.unlocks]) {
                                    GameState.unlockRegion(ru.unlocks);
                                    Narrative.addStory(`A new path opens. ${WORLD.regions[ru.unlocks].name} is now accessible.`);
                                    if (typeof Notifications !== 'undefined') {
                                        Notifications.show(`Region Unlocked: ${WORLD.regions[ru.unlocks].name}!`, 'gold');
                                    }
                                }
                            }
                            const key = `${x},${y}`;
                            const removedKey = `${this.currentMap}:${key}`;
                            this.removedEntities[removedKey] = true;
                            delete this.entityMap[key];
                        }
                    });
                }, 1000);
                break;
            }

            case 'chest': {
                const loot = entity.loot || [];
                loot.forEach(itemKey => {
                    if (ITEMS[itemKey]) {
                        GameState.addToInventory(itemKey);
                        Narrative.addLoot(`Found: ${ITEMS[itemKey].icon} ${ITEMS[itemKey].name}`);
                    }
                });
                const key = `${x},${y}`;
                const removedKey = `${this.currentMap}:${key}`;
                this.removedEntities[removedKey] = true;
                delete this.entityMap[key];

                // Particles
                const worldX = x * this.TS + this.TS / 2;
                const worldY = y * this.TS + this.TS / 2;
                Sprites.addParticles(worldX, worldY, '#ccaa44', 8);

                HUD.update();
                GameState.save();
                break;
            }

            case 'campfire': {
                Narrative.addFlavor('The fire crackles warmly. You rest for a moment.');
                const healAmt = Math.floor(GameState.player.maxHp * 0.2);
                const mpAmt = Math.floor(GameState.player.maxMp * 0.15);
                GameState.healPlayer(healAmt, mpAmt);
                Narrative.addHeal(`Restored ${healAmt} HP and ${mpAmt} MP.`);
                HUD.update();
                GameState.save();
                break;
            }
        }
    },

    gatherResource(x, y, tile) {
        const resourceKey = tile.resource;
        if (!resourceKey || !ITEMS[resourceKey]) return;

        // Gather 1-3 of the resource
        let qty = 1 + Math.floor(Math.random() * 2);

        // Tool bonus (from equipped weapon)
        if (GameState.player && GameState.player.equipment) {
            const weapon = GameState.player.equipment.weapon;
            if (weapon && ITEMS[weapon] && ITEMS[weapon].gatherBonus) {
                // Check tool-type matching for extra bonus
                const tool = ITEMS[weapon];
                const isTree = (tile.name === 'Tree' || tile.name === 'Pine Tree' || tile.name === 'Dead Tree');
                const isRock = (tile.name === 'Rock' || tile.name === 'Iron Vein');
                const isHerb = (tile.name === 'Herb' || tile.name === 'Ember Root' || tile.name === 'Shadow Silk' || tile.name === 'Veil Crystal');

                if ((tool.toolType === 'axe' && isTree) ||
                    (tool.toolType === 'pickaxe' && isRock) ||
                    (tool.toolType === 'sickle' && isHerb)) {
                    qty += tool.gatherBonus; // Full bonus for matching tool
                } else {
                    qty += Math.max(1, Math.floor(tool.gatherBonus / 2)); // Half bonus for mismatched tool
                }
            }

            // Armor work bonus (miner's gear, forester's cloak)
            const armor = ITEMS[GameState.player.equipment.armor];
            if (armor && armor.workBonus) {
                const isTree = (tile.name === 'Tree' || tile.name === 'Pine Tree' || tile.name === 'Dead Tree');
                const isRock = (tile.name === 'Rock' || tile.name === 'Iron Vein');
                if (armor.workBonus.type === 'mining' && isRock && armor.workBonus.gatherBonus) {
                    qty += armor.workBonus.gatherBonus;
                } else if (armor.workBonus.type === 'woodcutting' && isTree && armor.workBonus.gatherBonus) {
                    qty += armor.workBonus.gatherBonus;
                }
            }
        }

        GameState.addToInventory(resourceKey, qty);
        GameState.trackStat('resourcesGathered', qty);
        Narrative.addLoot(`${tile.gatherText} (+${qty} ${ITEMS[resourceKey].name})`);
        if (typeof Audio !== 'undefined') Audio.playGather();

        // Particles at the gathered tile
        const worldX = x * this.TS + this.TS / 2;
        const worldY = y * this.TS + this.TS / 2;
        const colors = ['#8a7a5a', '#6a9a4a', '#aaa'];
        Sprites.addParticles(worldX, worldY, colors[Math.floor(Math.random() * colors.length)], 6);

        // Remove the resource
        const removedKey = `${this.currentMap}:${x},${y}`;
        this.removedResources[removedKey] = true;
        this.terrain[y][x] = '.';

        // Respawn after 50 seconds
        setTimeout(() => {
            delete this.removedResources[removedKey];
            if (this.currentMap === removedKey.split(':')[0]) {
                const origMap = MAPS[this.currentMap];
                if (origMap) {
                    const origChar = origMap.terrain[y] ? origMap.terrain[y][x] : '.';
                    this.terrain[y][x] = origChar;
                }
            }
        }, 50 * 1000);

        // Tick farming / turn counter
        GameState.turnCount++;
        if (typeof Base !== 'undefined' && Base.tickFarming) {
            Base.tickFarming();
        }

        HUD.update();
        GameState.save();
    },

    interactBuildingSpot(x, y) {
        if (typeof Base !== 'undefined') {
            Base.showBuildMenu(x, y);
        }
    },

    // ---- FISHING ----
    _fishingState: null, // null | 'casting' | 'waiting' | 'bite' | 'reeling'
    _fishingTimer: null,
    _fishingData: null,

    fish(x, y, rod) {
        // If already fishing, ignore
        if (this._fishingState) return;

        const tier = rod.toolTier || 1;
        const region = GameState.currentRegion || 'ashen_wastes';

        this._fishingData = { x, y, rod, tier, region };
        this._fishingState = 'casting';

        Narrative.addFlavor('You cast your line into the water...');
        if (typeof Audio !== 'undefined') Audio.playFishCast();

        // Splash particles
        const worldX = x * this.TS + this.TS / 2;
        const worldY = y * this.TS + this.TS / 2;
        Sprites.addParticles(worldX, worldY, '#4488cc', 4);

        // Wait 1.5-4 seconds for a bite
        const waitTime = 1500 + Math.random() * 2500;
        this._fishingTimer = setTimeout(() => {
            if (this._fishingState !== 'casting') return;
            this._fishingState = 'bite';
            Narrative.addSystem('Something tugs at your line! Press interact to reel in!');
            if (typeof Audio !== 'undefined') Audio.playFishBite();
            if (typeof Notifications !== 'undefined') Notifications.show('A bite! Reel in!', 'gold');

            // If player doesn't reel within 2s, the fish escapes
            this._fishingTimer = setTimeout(() => {
                if (this._fishingState === 'bite') {
                    this._fishingState = null;
                    this._fishingData = null;
                    Narrative.addFlavor('The fish got away...');
                    this.interactCooldown = 0.5;
                }
            }, 2000);
        }, waitTime);

        // Block movement/interaction while casting
        this.interactCooldown = waitTime / 1000 + 3;
    },

    reelIn() {
        if (this._fishingState !== 'bite' || !this._fishingData) return;
        clearTimeout(this._fishingTimer);
        this._fishingState = null;

        const { x, y, rod, tier, region } = this._fishingData;
        this._fishingData = null;

        // Check angler's hat for quality boost
        let qualityMult = 1.0;
        if (GameState.player && GameState.player.equipment) {
            const helmet = ITEMS[GameState.player.equipment.helmet];
            if (helmet && helmet.workBonus && helmet.workBonus.type === 'fishing') {
                qualityMult = helmet.workBonus.qualityMult || 1.0;
            }
        }

        // Determine catch based on rod tier and luck
        const roll = Math.random() * qualityMult;
        let catchItem, catchQty;

        if (roll > 0.95 && region === 'void_sanctum') {
            catchItem = 'void_fish'; catchQty = 1;
        } else if (roll > 0.9) {
            catchItem = 'golden_fish'; catchQty = 1;
        } else if (roll > 0.8 && tier >= 2) {
            catchItem = 'treasure_chest_fish'; catchQty = 1;
        } else if (roll > 0.6) {
            catchItem = 'large_fish'; catchQty = 1;
        } else if (roll > 0.15) {
            catchItem = tier >= 2 ? 'raw_fish' : 'small_fish';
            catchQty = 1 + Math.floor(Math.random() * tier);
        } else {
            catchItem = 'old_boot'; catchQty = 1;
        }

        const item = ITEMS[catchItem];
        if (!item) return;

        GameState.addToInventory(catchItem, catchQty);
        if (catchItem !== 'old_boot') GameState.trackStat('fishCaught', catchQty);

        // Flavor text
        if (catchItem === 'old_boot') {
            Narrative.addFlavor('You pull your line and reel in... an old boot. Better luck next time.');
        } else if (catchItem === 'golden_fish') {
            Narrative.addLoot(`A golden shimmer breaks the surface! You caught a ${item.name}!`);
        } else if (catchItem === 'void_fish') {
            Narrative.addLoot(`Something otherworldly tugs at your line... You caught a ${item.name}!`);
        } else if (catchItem === 'treasure_chest_fish') {
            Narrative.addLoot('Your hook snags something heavy... a sunken treasure chest!');
            GameState.player.gold += 15 + Math.floor(Math.random() * 20);
        } else {
            Narrative.addLoot(`You reel in ${catchQty > 1 ? catchQty + 'x ' : ''}${item.name}!`);
        }

        if (typeof Audio !== 'undefined') Audio.playFishCatch();

        if (typeof Notifications !== 'undefined') {
            Notifications.show(`Caught ${item.name}!`, catchItem === 'old_boot' ? 'red' : 'gold');
        }

        // Particles
        const worldX = x * this.TS + this.TS / 2;
        const worldY = y * this.TS + this.TS / 2;
        Sprites.addParticles(worldX, worldY, '#4488cc', 6);

        // Cooldown and turn tick
        this.interactCooldown = 1.0;
        GameState.turnCount++;
        if (typeof Base !== 'undefined' && Base.tickFarming) Base.tickFarming();

        HUD.update();
        GameState.save();
    },

    // ---- RANDOM ENCOUNTERS ----
    checkRandomEncounter() {
        const locData = WORLD.locations[this.currentMap];
        if (!locData || locData.type === 'village' || locData.type === 'base' || locData.type === 'npc') return;
        if (!this.isMoving) return;

        // 4% chance per check (every 2 seconds of movement)
        if (Math.random() < 0.04) {
            const region = WORLD.regions[GameState.currentRegion];
            if (!region || !region.enemies || !region.enemies.length) return;

            const playerLevel = GameState.player.level;
            const validEnemies = region.enemies.filter(key => {
                const e = ENEMIES[key];
                return e && e.level <= playerLevel + 2;
            });

            const pool = validEnemies.length > 0 ? validEnemies : [region.enemies[0]];
            const enemyKey = pool[Math.floor(Math.random() * pool.length)];

            if (enemyKey && ENEMIES[enemyKey]) {
                Narrative.addFlavor('A hostile presence emerges...');
                setTimeout(() => Combat.start(enemyKey), 400);
            }
        }
    },

    // ---- ACTIONS ----
    updateActions() {
        const buttons = [];
        const locData = WORLD.locations[this.currentMap];

        if (!locData) {
            Actions.setButtons([{ text: 'Interact', class: 'primary', action: 'WorldMap.interact()' }]);
            return;
        }

        buttons.push({ text: 'Interact', class: 'primary', action: 'WorldMap.interact()' });

        if (locData.type === 'village') {
            if (locData.npcs) {
                locData.npcs.forEach(npcId => {
                    const npc = NPCS[npcId];
                    if (npc) {
                        buttons.push({ text: npc.name, class: '', action: `Dialogue.start('${npcId}')` });
                    }
                });
            }
        } else if (locData.type === 'base') {
            buttons.push({ text: 'Build', class: 'primary', action: 'Base.showBuildPanel()' });
            if (GameState.base && GameState.base.buildings.forge) {
                buttons.push({ text: 'Craft', class: '', action: 'Base.showCraftPanel()' });
            }
            if (GameState.base && (GameState.base.buildings.garden || GameState.base.buildings.farm)) {
                buttons.push({ text: 'Farm', class: '', action: 'Base.showFarmPanel()' });
            }
            if (GameState.base && GameState.base.buildings.shelter) {
                buttons.push({ text: 'Rest', class: '', action: 'Base.restAtShelter()' });
            }
            if (typeof Base !== 'undefined' && Base.hasPlaceable && Base.hasPlaceable('enchanting')) {
                buttons.push({ text: 'Enchant', class: '', action: 'Base.showEnchantPanel()' });
            }
        }

        Actions.setButtons(buttons);
    },

    // ---- CONTROLS ----
    bindControls() {
        // Keyboard — uses Settings keybindings
        document.addEventListener('keydown', (e) => {
            if (GameState.currentScreen !== 'game') return;
            // Skip if rebinding is active
            if (typeof Settings !== 'undefined' && Settings._rebinding) return;

            const S = typeof Settings !== 'undefined' ? Settings : null;
            const isA = S ? (key, act) => S.isAction(key, act) : () => false;

            if (isA(e.key, 'moveUp')) { e.preventDefault(); this.keys.up = true; }
            else if (isA(e.key, 'moveDown')) { e.preventDefault(); this.keys.down = true; }
            else if (isA(e.key, 'moveLeft')) { e.preventDefault(); this.keys.left = true; }
            else if (isA(e.key, 'moveRight')) { e.preventDefault(); this.keys.right = true; }
            else if (isA(e.key, 'interact')) { e.preventDefault(); this.interact(); }
            else if (isA(e.key, 'sprint')) { e.preventDefault(); this.keys.sprint = true; }
            // Quick-access tabs
            else if (isA(e.key, 'map')) { e.preventDefault(); Game.handleTabChange('map'); document.getElementById('side-panel').classList.remove('hidden'); }
            else if (isA(e.key, 'inventory')) { e.preventDefault(); Game.handleTabChange('inventory'); document.getElementById('side-panel').classList.remove('hidden'); }
            else if (isA(e.key, 'character')) { e.preventDefault(); Game.handleTabChange('character'); document.getElementById('side-panel').classList.remove('hidden'); }
            else if (e.key === 'Escape') {
                const sp = document.getElementById('side-panel');
                if (sp && !sp.classList.contains('hidden')) { sp.classList.add('hidden'); e.preventDefault(); }
            }
        });

        document.addEventListener('keyup', (e) => {
            const S = typeof Settings !== 'undefined' ? Settings : null;
            const isA = S ? (key, act) => S.isAction(key, act) : () => false;

            if (isA(e.key, 'moveUp')) this.keys.up = false;
            else if (isA(e.key, 'moveDown')) this.keys.down = false;
            else if (isA(e.key, 'moveLeft')) this.keys.left = false;
            else if (isA(e.key, 'moveRight')) this.keys.right = false;
            else if (isA(e.key, 'sprint')) this.keys.sprint = false;
        });

        // D-pad buttons (continuous hold)
        const dpad = {
            'dpad-up': 'up',
            'dpad-down': 'down',
            'dpad-left': 'left',
            'dpad-right': 'right',
        };

        for (const [id, dir] of Object.entries(dpad)) {
            const btn = document.getElementById(id);
            if (!btn) continue;

            const startMove = (e) => {
                e.preventDefault();
                this.keys[dir] = true;
            };
            const stopMove = (e) => {
                e.preventDefault();
                this.keys[dir] = false;
            };

            btn.addEventListener('touchstart', startMove, { passive: false });
            btn.addEventListener('touchend', stopMove, { passive: false });
            btn.addEventListener('touchcancel', stopMove, { passive: false });
            btn.addEventListener('mousedown', startMove);
            btn.addEventListener('mouseup', stopMove);
            btn.addEventListener('mouseleave', stopMove);
        }

        // Action button
        const actionBtn = document.getElementById('dpad-action');
        if (actionBtn) {
            const doInteract = (e) => { e.preventDefault(); this.interact(); };
            actionBtn.addEventListener('touchstart', doInteract, { passive: false });
            actionBtn.addEventListener('mousedown', doInteract);
        }
    },

    // ---- SAVE/LOAD ----
    getSaveData() {
        return {
            currentMap: this.currentMap,
            playerX: this.px,
            playerY: this.py,
            facing: this.facing,
            removedResources: this.removedResources,
            removedEntities: this.removedEntities
        };
    },

    // Backward compat — old code calls render() directly; game loop handles it now
    render() {},

    loadSaveData(data) {
        if (!data) return;
        // Don't restore removedResources — respawn timers are lost on reload,
        // so cleared resources would stay gone forever. Let them respawn fresh.
        this.removedResources = {};
        this.removedEntities = data.removedEntities || {};
        // Convert old facing values (north/south/east/west) to new (up/down/left/right)
        const facingMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
        this.facing = facingMap[data.facing] || data.facing || 'down';
        if (data.currentMap && MAPS[data.currentMap]) {
            // If save has pixel positions, use them; otherwise convert tile coords
            if (data.playerX > 100) {
                // Likely pixel coords from new system
                this.loadMap(data.currentMap);
                this.px = data.playerX;
                this.py = data.playerY;
                // Snap camera (if vpW is still 0, resizeCanvas will re-snap later)
                if (this.vpW > 0 && this.vpH > 0) {
                    this.camX = this.px - this.vpW / 2;
                    this.camY = this.py - this.vpH / 2;
                }
            } else {
                // Old tile-based save — convert
                this.loadMap(data.currentMap, data.playerX, data.playerY);
            }
        }
    }
};
