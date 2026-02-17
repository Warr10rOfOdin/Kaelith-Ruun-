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

    // Input state (held keys)
    keys: { up: false, down: false, left: false, right: false },

    // Entity / resource tracking
    entityMap: {},
    removedResources: {},
    removedEntities: {},

    // Game loop
    running: false,
    lastTime: 0,
    animTimer: 0,

    // Interaction cooldown
    interactCooldown: 0,

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
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;
        this.vpW = container.clientWidth;
        this.vpH = container.clientHeight;
        this.canvas.width = this.vpW;
        this.canvas.height = this.vpH;
        if (this.ctx) this.ctx.imageSmoothingEnabled = false;
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

        // Camera follow with lerp
        const targetCamX = this.px - this.vpW / 2;
        const targetCamY = this.py - this.vpH / 2;
        const smoothing = 1 - Math.pow(this.camSmooth, dt);
        this.camX += (targetCamX - this.camX) * smoothing;
        this.camY += (targetCamY - this.camY) * smoothing;

        // Update particles
        Sprites.updateParticles(dt);

        // Update ambient particles
        Sprites.updateAmbientParticles(dt, GameState.currentRegion,
            this.camX, this.camY, this.vpW, this.vpH);

        // Update diegetic overlay
        if (typeof DiegeticFX !== 'undefined') DiegeticFX.update();
    },

    handleMovement(dt) {
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

        const speed = this.moveSpeed * dt;
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
        this.loadMap(exit.to, exit.entryX, exit.entryY);
    },

    // ---- TERRAIN ----
    getTerrainChar(x, y) {
        if (y < 0 || y >= this.terrain.length || x < 0 || x >= this.terrain[0].length) {
            return '#';
        }
        const removedKey = `${this.currentMap}:${x},${y}`;
        if (this.removedResources[removedKey]) return '.';
        return this.terrain[y][x];
    },

    getTileType(x, y) {
        const ch = this.getTerrainChar(x, y);
        return TILE_TYPES[ch] || TILE_TYPES['.'];
    },

    getEntityAt(x, y) {
        return this.entityMap[`${x},${y}`] || null;
    },

    // ---- DRAW ----
    draw() {
        const ctx = this.ctx;
        if (!ctx || !this.terrain) return;

        const w = this.vpW;
        const h = this.vpH;
        const T = this.TS;

        // Clear
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Which tiles are visible
        const startTX = Math.floor(this.camX / T) - 1;
        const startTY = Math.floor(this.camY / T) - 1;
        const endTX = Math.ceil((this.camX + w) / T) + 1;
        const endTY = Math.ceil((this.camY + h) / T) + 1;

        const mapH = this.terrain.length;
        const mapW = this.terrain[0].length;

        // Draw terrain tiles
        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) continue;

                const screenX = Math.floor(tx * T - this.camX);
                const screenY = Math.floor(ty * T - this.camY);

                const ch = this.getTerrainChar(tx, ty);
                const tileCanvas = Sprites.getTile(ch, tx, ty);
                if (tileCanvas) {
                    ctx.drawImage(tileCanvas, screenX, screenY, T, T);
                }
            }
        }

        // Draw entities
        for (const key in this.entityMap) {
            const entity = this.entityMap[key];
            const [ex, ey] = key.split(',').map(Number);
            const screenX = Math.floor(ex * T - this.camX);
            const screenY = Math.floor(ey * T - this.camY);

            // Skip if off-screen
            if (screenX < -T || screenX > w || screenY < -T || screenY > h) continue;

            this.drawEntity(ctx, entity, screenX, screenY);
        }

        // Draw player
        this.drawPlayer(ctx);

        // Draw interaction prompt
        this.drawInteractPrompt(ctx);

        // Gathering particles
        Sprites.drawParticles(ctx, this.camX, this.camY);

        // Ambient biome particles (ash, fog, corruption motes)
        Sprites.drawAmbientParticles(ctx, this.camX, this.camY);

        // Region tint
        Sprites.applyRegionTint(ctx, w, h, GameState.currentRegion);

        // Dynamic lighting (darkness + light sources)
        Sprites.collectLightSources(this.terrain, this.entityMap,
            this.camX, this.camY, w, h, this.TS);
        Sprites.drawLighting(ctx, w, h, GameState.currentRegion);

        // Vignette
        Sprites.drawVignette(ctx, w, h);
    },

    drawPlayer(ctx) {
        const sprite = Sprites.getPlayer(this.facing, this.walkFrame);
        if (!sprite) return;

        // Player drawn centered at their position
        const screenX = Math.floor(this.px - this.camX - sprite.width / 2);
        const screenY = Math.floor(this.py - this.camY - sprite.height / 2 - 4); // offset up slightly
        ctx.drawImage(sprite, screenX, screenY);
    },

    drawEntity(ctx, entity, screenX, screenY) {
        const T = this.TS;
        switch (entity.type) {
            case 'npc': {
                const npcSprite = Sprites.getNPC(entity.id);
                if (npcSprite) {
                    ctx.drawImage(npcSprite, screenX + (T - npcSprite.width) / 2, screenY + (T - npcSprite.height) / 2);
                }
                break;
            }
            case 'enemy_spawn': {
                const marker = Sprites.cache.enemy_marker;
                if (marker) {
                    ctx.drawImage(marker, screenX + (T - marker.width) / 2, screenY + 2);
                }
                break;
            }
            case 'boss': {
                const boss = Sprites.cache.boss_marker;
                if (boss) {
                    ctx.drawImage(boss, screenX + (T - boss.width) / 2, screenY + 2);
                }
                break;
            }
            case 'chest': {
                const chest = Sprites.cache.chest;
                if (chest) {
                    ctx.drawImage(chest, screenX, screenY, T, T);
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
        } else if (this.mapData && this.mapData.isCamp && this.getTerrainChar(fx, fy) === 'B') {
            promptText = 'Build';
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

        // Building spot
        if (this.mapData && this.mapData.isCamp && this.getTerrainChar(fx, fy) === 'B') {
            this.interactBuildingSpot(fx, fy);
            return;
        }

        // Check standing tile
        const standTile = this.getTileType(faceTX, faceTY);
        if (standTile.name === 'Building Spot' && this.mapData && this.mapData.isCamp) {
            this.interactBuildingSpot(faceTX, faceTY);
            return;
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

        // Tool bonus
        if (GameState.player && GameState.player.equipment) {
            const weapon = GameState.player.equipment.weapon;
            if (weapon && ITEMS[weapon] && ITEMS[weapon].gatherBonus) {
                qty += ITEMS[weapon].gatherBonus;
            }
        }

        GameState.addToInventory(resourceKey, qty);
        Narrative.addLoot(`${tile.gatherText} (+${qty} ${ITEMS[resourceKey].name})`);

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
        }

        Actions.setButtons(buttons);
    },

    // ---- CONTROLS ----
    bindControls() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (GameState.currentScreen !== 'game') return;
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    e.preventDefault(); this.keys.up = true; break;
                case 'ArrowDown': case 's': case 'S':
                    e.preventDefault(); this.keys.down = true; break;
                case 'ArrowLeft': case 'a': case 'A':
                    e.preventDefault(); this.keys.left = true; break;
                case 'ArrowRight': case 'd': case 'D':
                    e.preventDefault(); this.keys.right = true; break;
                case ' ': case 'e': case 'E': case 'Enter':
                    e.preventDefault(); this.interact(); break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    this.keys.up = false; break;
                case 'ArrowDown': case 's': case 'S':
                    this.keys.down = false; break;
                case 'ArrowLeft': case 'a': case 'A':
                    this.keys.left = false; break;
                case 'ArrowRight': case 'd': case 'D':
                    this.keys.right = false; break;
            }
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
        this.removedResources = data.removedResources || {};
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
                this.camX = this.px - this.vpW / 2;
                this.camY = this.py - this.vpH / 2;
            } else {
                // Old tile-based save — convert
                this.loadMap(data.currentMap, data.playerX, data.playerY);
            }
        }
    }
};
