// ============================================
// WORLD MAP ENGINE — Tile rendering & movement
// ============================================

const WorldMap = {
    currentMap: null,
    mapData: null,
    playerX: 0,
    playerY: 0,
    facing: 'south', // n/s/e/w
    viewportW: 11,
    viewportH: 9,
    tileSize: 34,
    entityMap: {}, // "x,y" -> entity
    removedResources: {}, // "mapKey:x,y" -> true (gathered resources)
    removedEntities: {}, // "mapKey:x,y" -> true (defeated enemies, looted chests)

    init() {
        this.viewport = document.getElementById('map-viewport');
        this.buildViewport();
        this.bindControls();
    },

    buildViewport() {
        if (!this.viewport) return;
        this.viewport.innerHTML = '';
        this.viewport.style.gridTemplateColumns = `repeat(${this.viewportW}, ${this.tileSize}px)`;
        this.viewport.style.gridTemplateRows = `repeat(${this.viewportH}, ${this.tileSize}px)`;

        this.cells = [];
        for (let y = 0; y < this.viewportH; y++) {
            for (let x = 0; x < this.viewportW; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                this.viewport.appendChild(cell);
                this.cells.push(cell);
            }
        }
    },

    loadMap(mapKey, entryX, entryY) {
        const map = MAPS[mapKey];
        if (!map) return;

        this.currentMap = mapKey;
        this.mapData = map;

        // Parse terrain into 2D array
        this.terrain = map.terrain.map(row => row.split(''));

        // Player position
        if (entryX !== undefined && entryY !== undefined) {
            this.playerX = entryX;
            this.playerY = entryY;
        } else {
            this.playerX = map.playerStart.x;
            this.playerY = map.playerStart.y;
        }

        // Build entity lookup map
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
        GameState.playerMapPos = { x: this.playerX, y: this.playerY };

        // Show location name
        const locData = WORLD.locations[mapKey];
        if (locData && !GameState.visitedLocations.includes(mapKey)) {
            GameState.visitedLocations.push(mapKey);
            if (locData.narrative && locData.narrative.enter) {
                Narrative.addSeparator();
                Narrative.addStory(locData.narrative.enter);
            }
        }

        this.render();
        HUD.update();
        this.updateActions();
    },

    getTile(x, y) {
        if (y < 0 || y >= this.terrain.length || x < 0 || x >= this.terrain[0].length) {
            return '#';
        }
        // Check if resource was gathered
        const removedKey = `${this.currentMap}:${x},${y}`;
        if (this.removedResources[removedKey]) {
            return '.'; // replaced with grass
        }
        return this.terrain[y][x];
    },

    getTileType(x, y) {
        const char = this.getTile(x, y);
        return TILE_TYPES[char] || TILE_TYPES['.'];
    },

    getEntityAt(x, y) {
        return this.entityMap[`${x},${y}`] || null;
    },

    isPassable(x, y) {
        const tile = this.getTileType(x, y);
        if (!tile.passable) return false;

        // Check for entities blocking
        const entity = this.getEntityAt(x, y);
        if (entity && (entity.type === 'npc' || entity.type === 'boss')) {
            return false;
        }

        return true;
    },

    render() {
        if (!this.cells || !this.terrain) return;

        const cx = Math.floor(this.viewportW / 2);
        const cy = Math.floor(this.viewportH / 2);

        for (let vy = 0; vy < this.viewportH; vy++) {
            for (let vx = 0; vx < this.viewportW; vx++) {
                const idx = vy * this.viewportW + vx;
                const cell = this.cells[idx];
                if (!cell) continue;

                const mx = this.playerX + (vx - cx);
                const my = this.playerY + (vy - cy);

                // Center cell is the player
                if (vx === cx && vy === cy) {
                    const tile = this.getTileType(mx, my);
                    cell.style.backgroundColor = tile.color;
                    cell.textContent = this.getPlayerEmoji();
                    cell.className = 'map-cell player-cell';
                    continue;
                }

                // Check bounds
                if (my < 0 || my >= this.terrain.length || mx < 0 || mx >= this.terrain[0].length) {
                    cell.style.backgroundColor = '#1a1a1a';
                    cell.textContent = '';
                    cell.className = 'map-cell';
                    continue;
                }

                const tile = this.getTileType(mx, my);
                cell.style.backgroundColor = tile.color;

                // Check for entity at this position
                const entity = this.getEntityAt(mx, my);
                if (entity) {
                    cell.textContent = this.getEntityEmoji(entity);
                    cell.className = 'map-cell entity-cell';
                } else {
                    cell.textContent = tile.emoji || '';
                    cell.className = 'map-cell' + (tile.emoji ? ' object-cell' : '');
                }
            }
        }
    },

    getPlayerEmoji() {
        const race = GameState.player ? RACES[GameState.player.race] : null;
        return race ? race.icon : '🧑';
    },

    getEntityEmoji(entity) {
        switch (entity.type) {
            case 'npc': {
                const npc = NPCS[entity.id];
                return npc ? npc.icon : '🧑';
            }
            case 'enemy_spawn': return '💀';
            case 'boss': {
                const boss = ENEMIES[entity.id];
                return boss ? boss.icon : '👹';
            }
            case 'chest': return '📦';
            case 'campfire': return '🔥';
            default: return '❓';
        }
    },

    // ---- MOVEMENT ----
    move(dx, dy) {
        if (GameState.currentScreen !== 'game') return;
        if (GameState.combatState) return; // no moving during combat

        // Update facing
        if (dy < 0) this.facing = 'north';
        else if (dy > 0) this.facing = 'south';
        else if (dx < 0) this.facing = 'west';
        else if (dx > 0) this.facing = 'east';

        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        // Check for map edge transitions
        if (newY < 0 || newY >= this.terrain.length || newX < 0 || newX >= this.terrain[0].length) {
            this.tryTransition(dx, dy);
            return;
        }

        if (!this.isPassable(newX, newY)) {
            return; // blocked
        }

        this.playerX = newX;
        this.playerY = newY;
        GameState.playerMapPos = { x: this.playerX, y: this.playerY };

        // Random encounter chance on wilderness tiles
        this.checkRandomEncounter();

        // Advance turn counter
        GameState.turnCount++;

        // Check farming progress
        if (typeof Base !== 'undefined' && Base.tickFarming) {
            Base.tickFarming();
        }

        this.render();
        this.updateActions();
        GameState.save();
    },

    tryTransition(dx, dy) {
        if (!this.mapData || !this.mapData.exits) return;

        let direction = null;
        if (dy < 0) direction = 'north';
        else if (dy > 0) direction = 'south';
        else if (dx < 0) direction = 'west';
        else if (dx > 0) direction = 'east';

        const exit = this.mapData.exits[direction];
        if (!exit) return;

        // Check if the target region is unlocked
        const targetRegion = MAP_REGIONS[exit.to];
        if (targetRegion && WORLD.regions[targetRegion] && !WORLD.regions[targetRegion].unlocked) {
            Narrative.addSystem(`The path to ${WORLD.regions[targetRegion].name} is blocked. Defeat the region boss to unlock it.`);
            return;
        }

        Narrative.addAction(`You travel ${direction}...`);
        this.loadMap(exit.to, exit.entryX, exit.entryY);
    },

    checkRandomEncounter() {
        // Only in exploration areas, not villages or base
        const mapData = MAPS[this.currentMap];
        const locData = WORLD.locations[this.currentMap];
        if (!locData || locData.type === 'village' || locData.type === 'base' || locData.type === 'npc') return;

        // 8% chance per step
        if (Math.random() < 0.08) {
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

    // ---- INTERACTION ----
    interact() {
        if (GameState.currentScreen !== 'game') return;
        if (GameState.combatState) return;

        // Get the tile the player is facing
        let fx = this.playerX, fy = this.playerY;
        switch (this.facing) {
            case 'north': fy--; break;
            case 'south': fy++; break;
            case 'west': fx--; break;
            case 'east': fx++; break;
        }

        // Check for entity at faced position
        const entity = this.getEntityAt(fx, fy);
        if (entity) {
            this.interactEntity(entity, fx, fy);
            return;
        }

        // Check for interactable tile
        const tile = this.getTileType(fx, fy);
        if (tile.resource) {
            this.gatherResource(fx, fy, tile);
            return;
        }

        // Check for building spot at camp
        if (this.mapData && this.mapData.isCamp && this.getTile(fx, fy) === 'B') {
            this.interactBuildingSpot(fx, fy);
            return;
        }

        // Check if standing on the tile instead (for paths, etc.)
        const standingTile = this.getTileType(this.playerX, this.playerY);
        if (standingTile.name === 'Building Spot' && this.mapData && this.mapData.isCamp) {
            this.interactBuildingSpot(this.playerX, this.playerY);
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
                                // Remove the enemy spawn
                                const key = `${x},${y}`;
                                const removedKey = `${this.currentMap}:${key}`;
                                this.removedEntities[removedKey] = true;
                                delete this.entityMap[key];
                                this.render();
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
                            // Handle region unlocks
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

                            // Remove boss entity
                            const key = `${x},${y}`;
                            const removedKey = `${this.currentMap}:${key}`;
                            this.removedEntities[removedKey] = true;
                            delete this.entityMap[key];
                            this.render();
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
                // Remove chest
                const key = `${x},${y}`;
                const removedKey = `${this.currentMap}:${key}`;
                this.removedEntities[removedKey] = true;
                delete this.entityMap[key];
                this.render();
                HUD.update();
                GameState.save();
                break;
            }

            case 'campfire':
                Narrative.addFlavor('The fire crackles warmly. You rest for a moment.');
                const healAmt = Math.floor(GameState.player.maxHp * 0.2);
                const mpAmt = Math.floor(GameState.player.maxMp * 0.15);
                GameState.healPlayer(healAmt, mpAmt);
                Narrative.addHeal(`Restored ${healAmt} HP and ${mpAmt} MP.`);
                HUD.update();
                GameState.save();
                break;
        }
    },

    gatherResource(x, y, tile) {
        const resourceKey = tile.resource;
        if (!resourceKey || !ITEMS[resourceKey]) return;

        // Gather 1-3 of the resource
        const qty = 1 + Math.floor(Math.random() * 2);
        GameState.addToInventory(resourceKey, qty);

        Narrative.addLoot(`${tile.gatherText} (+${qty} ${ITEMS[resourceKey].name})`);

        // Remove the resource tile (replace with grass)
        const removedKey = `${this.currentMap}:${x},${y}`;
        this.removedResources[removedKey] = true;
        this.terrain[y][x] = '.';

        // Resources respawn after a while (50 turns)
        setTimeout(() => {
            delete this.removedResources[removedKey];
            // Only restore if still on same map
            if (this.currentMap === removedKey.split(':')[0]) {
                const origMap = MAPS[this.currentMap];
                if (origMap) {
                    const origChar = origMap.terrain[y] ? origMap.terrain[y][x] : '.';
                    this.terrain[y][x] = origChar;
                    this.render();
                }
            }
        }, 50 * 1000); // simple timer, not turn-based for simplicity

        this.render();
        HUD.update();
        GameState.save();
    },

    interactBuildingSpot(x, y) {
        if (typeof Base !== 'undefined') {
            Base.showBuildMenu(x, y);
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

        // Always show interact
        buttons.push({ text: 'Interact', class: 'primary', action: 'WorldMap.interact()' });

        // Location-specific actions
        if (locData.type === 'village') {
            // Show village services
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
                case 'ArrowUp':
                case 'w': case 'W':
                    e.preventDefault();
                    this.move(0, -1);
                    break;
                case 'ArrowDown':
                case 's': case 'S':
                    e.preventDefault();
                    this.move(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a': case 'A':
                    e.preventDefault();
                    this.move(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd': case 'D':
                    e.preventDefault();
                    this.move(1, 0);
                    break;
                case ' ':
                case 'e': case 'E':
                case 'Enter':
                    e.preventDefault();
                    this.interact();
                    break;
            }
        });

        // D-pad buttons
        const dpad = {
            'dpad-up': () => this.move(0, -1),
            'dpad-down': () => this.move(0, 1),
            'dpad-left': () => this.move(-1, 0),
            'dpad-right': () => this.move(1, 0),
            'dpad-action': () => this.interact()
        };

        for (const [id, fn] of Object.entries(dpad)) {
            const btn = document.getElementById(id);
            if (btn) {
                // Touch support with repeat
                let interval = null;
                const startMove = (e) => {
                    e.preventDefault();
                    fn();
                    if (id !== 'dpad-action') {
                        interval = setInterval(fn, 180);
                    }
                };
                const stopMove = (e) => {
                    e.preventDefault();
                    if (interval) {
                        clearInterval(interval);
                        interval = null;
                    }
                };

                btn.addEventListener('touchstart', startMove, { passive: false });
                btn.addEventListener('touchend', stopMove, { passive: false });
                btn.addEventListener('touchcancel', stopMove, { passive: false });
                btn.addEventListener('mousedown', startMove);
                btn.addEventListener('mouseup', stopMove);
                btn.addEventListener('mouseleave', stopMove);
            }
        }
    },

    // ---- SAVE/LOAD ----
    getSaveData() {
        return {
            currentMap: this.currentMap,
            playerX: this.playerX,
            playerY: this.playerY,
            facing: this.facing,
            removedResources: this.removedResources,
            removedEntities: this.removedEntities
        };
    },

    loadSaveData(data) {
        if (!data) return;
        this.removedResources = data.removedResources || {};
        this.removedEntities = data.removedEntities || {};
        this.facing = data.facing || 'south';
        if (data.currentMap && MAPS[data.currentMap]) {
            this.loadMap(data.currentMap, data.playerX, data.playerY);
        }
    }
};
