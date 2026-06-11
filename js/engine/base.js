// ============================================
// PLAYER BASE — Building, Crafting, Farming
// ============================================

const Base = {
    // ---- BUILDING ----
    showBuildPanel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        if (!GameState.base) GameState.base = { buildings: {}, crops: [], placeables: [] };

        const unlockedBuildings = typeof TechTree !== 'undefined' ? TechTree.getUnlockedBuildings() : new Set(Object.keys(BUILDINGS));

        let html = '<h3>Build at Camp</h3>';
        html += '<p style="color:var(--text-secondary);margin-bottom:0.8rem;font-size:0.85rem">Face an open tile, then click Build to place. You can build anywhere in your camp!</p>';

        for (const [id, bld] of Object.entries(BUILDINGS)) {
            const built = GameState.base.buildings[id];
            const unlocked = unlockedBuildings.has(id);
            const canAfford = !built && unlocked && this.canAfford(bld.cost);

            if (!unlocked && !built) continue;

            html += `<div class="build-item ${built ? 'built' : ''} ${!built && !canAfford ? 'locked' : ''}">`;
            html += `<div class="build-header">`;
            html += `<span class="build-icon">${bld.icon}</span>`;
            html += `<div class="build-info">`;
            html += `<div class="build-name">${bld.name} ${built ? '(Built)' : ''}</div>`;
            html += `<div class="build-desc">${bld.description}</div>`;
            html += `</div></div>`;

            if (!built) {
                html += '<div class="build-cost">';
                for (const [res, qty] of Object.entries(bld.cost)) {
                    const have = GameState.getInventoryCount(res);
                    const item = ITEMS[res];
                    const enough = have >= qty;
                    html += `<span class="cost-item ${enough ? 'have' : 'need'}">${item ? item.icon : ''} ${have}/${qty}</span>`;
                }
                html += '</div>';

                if (canAfford) {
                    html += `<button class="action-btn primary" onclick="Base.build('${id}')">Build</button>`;
                }
            } else if (typeof BUILDING_UPGRADES !== 'undefined' && BUILDING_UPGRADES[id]) {
                // Show upgrade option
                const level = this.getBuildingLevel(id);
                const upgradeDef = BUILDING_UPGRADES[id];
                if (level < upgradeDef.maxLevel) {
                    const nextData = upgradeDef.levels[level + 1];
                    if (nextData) {
                        html += `<div style="color:var(--accent-gold-dim);font-size:0.75rem;margin-top:0.3rem">Level ${level}/${upgradeDef.maxLevel}</div>`;
                        html += `<div style="color:var(--text-secondary);font-size:0.8rem;margin-top:0.2rem">Next: ${nextData.name} — ${nextData.description}</div>`;
                        html += '<div class="build-cost">';
                        const canUpgrade = this.canAfford(nextData.cost);
                        for (const [res, qty] of Object.entries(nextData.cost)) {
                            const have = GameState.getInventoryCount(res);
                            const item = ITEMS[res];
                            const enough = have >= qty;
                            html += `<span class="cost-item ${enough ? 'have' : 'need'}">${item ? item.icon : ''} ${have}/${qty}</span>`;
                        }
                        html += '</div>';
                        if (canUpgrade) {
                            html += `<button class="action-btn primary" onclick="Base.upgradeBuilding('${id}')">Upgrade</button>`;
                        }
                    }
                } else {
                    html += `<div style="color:var(--accent-green-bright);font-size:0.75rem;margin-top:0.3rem">MAX LEVEL</div>`;
                }
            }
            html += '</div>';
        }

        // Show active adjacency bonuses
        const adjBonuses = this.getActiveAdjacencyBonuses();
        if (adjBonuses.length > 0) {
            html += '<div style="margin-top:1rem;padding-top:0.5rem;border-top:1px solid rgba(201,168,76,0.2)">';
            html += '<h4 style="color:var(--accent-gold);font-size:0.85rem;margin-bottom:0.4rem">Active Bonuses</h4>';
            for (const ab of adjBonuses) {
                html += `<div style="font-size:0.75rem;color:var(--accent-green-bright);margin-bottom:0.2rem">`;
                html += `${ab.source} + ${ab.neighbor}: ${ab.desc}`;
                html += '</div>';
            }
            html += '</div>';
        }

        // Show camp prestige
        const prestige = this.getCampPrestige();
        if (prestige > 0) {
            html += `<div style="margin-top:0.5rem;font-size:0.75rem;color:var(--accent-gold-dim)">Camp Prestige: ${prestige}</div>`;
        }

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    canAfford(cost) {
        for (const [res, qty] of Object.entries(cost)) {
            if (GameState.getInventoryCount(res) < qty) return false;
        }
        return true;
    },

    build(buildingId) {
        // Redirect to placeBuilding for free placement
        this.placeBuilding(buildingId);
    },

    updateCampTiles() {
        if (typeof WorldMap === 'undefined' || WorldMap.currentMap !== 'player_camp') return;
        if (!GameState.base || !GameState.base.placedBuildings) return;

        GameState.base.placedBuildings.forEach(pb => {
            const bld = BUILDINGS[pb.id];
            if (bld) {
                const key = `${pb.x},${pb.y}`;
                WorldMap.entityMap[key] = {
                    x: pb.x, y: pb.y,
                    type: 'building',
                    id: pb.id,
                    emoji: bld.icon
                };
                if (WorldMap.terrain[pb.y]) {
                    WorldMap.terrain[pb.y][pb.x] = 'D';
                }
            }
        });
    },

    // Build mode state
    buildMode: false,
    selectedBuilding: null,

    showBuildMenu(x, y) {
        // Check if there's already a building placed here
        if (GameState.base && GameState.base.placedBuildings) {
            const existing = GameState.base.placedBuildings.find(b => b.x === x && b.y === y);
            if (existing) {
                const bld = BUILDINGS[existing.id];
                if (bld) {
                    Narrative.addSystem(`${bld.name} is built here.`);
                    this.useBuilding(existing.id);
                    return;
                }
            }
        }

        // Check if this is a valid build location
        if (!this.canPlaceAt(x, y)) {
            Narrative.addSystem('Cannot build here.');
            return;
        }

        // Show the build panel for free placement
        this.showBuildPanel();
    },

    canPlaceAt(x, y) {
        if (!WorldMap.terrain || !WorldMap.terrain[y] || !WorldMap.terrain[y][x]) return false;
        const ch = WorldMap.getTerrainChar(x, y);
        // Can only place on grass, path, tall grass, wildflower, hill tiles
        const placeable = new Set(['.', 'p', 'g', 'w', 'h', 'B']);
        if (!placeable.has(ch)) return false;
        // Can't place on entities
        if (WorldMap.entityMap[`${x},${y}`]) return false;
        return true;
    },

    // Place a building at the player's facing tile
    placeBuilding(buildingId) {
        const bld = BUILDINGS[buildingId];
        if (!bld) return;
        if (!GameState.base) GameState.base = { buildings: {}, crops: [], placeables: [], placedBuildings: [] };
        if (!GameState.base.placedBuildings) GameState.base.placedBuildings = [];

        // Already built?
        if (GameState.base.buildings[buildingId]) {
            Notifications.show('Already built!', 'red');
            return;
        }
        if (!this.canAfford(bld.cost)) {
            Notifications.show('Not enough resources!', 'red');
            return;
        }

        // Get the tile the player is facing
        const faceTX = Math.floor(WorldMap.px / WorldMap.TS);
        const faceTY = Math.floor(WorldMap.py / WorldMap.TS);
        let fx = faceTX, fy = faceTY;
        switch (WorldMap.facing) {
            case 'up': fy--; break;
            case 'down': fy++; break;
            case 'left': fx--; break;
            case 'right': fx++; break;
        }

        if (!this.canPlaceAt(fx, fy)) {
            Notifications.show('Cannot place here! Face an open tile.', 'red');
            return;
        }

        // Deduct resources
        for (const [res, qty] of Object.entries(bld.cost)) {
            GameState.removeFromInventory(res, qty);
        }

        GameState.base.buildings[buildingId] = true;
        GameState.base.placedBuildings.push({ id: buildingId, x: fx, y: fy });

        // Apply building effects
        if (buildingId === 'storage') {
            GameState.MAX_INVENTORY_SIZE += 20;
        }

        // Place the building on the map
        if (WorldMap.terrain[fy]) {
            WorldMap.terrain[fy][fx] = 'D'; // Door tile as building marker
        }
        WorldMap.entityMap[`${fx},${fy}`] = {
            x: fx, y: fy,
            type: 'building',
            id: buildingId,
            emoji: bld.icon
        };

        Narrative.addSeparator();
        Narrative.addStory(`You build a ${bld.name}! ${bld.description}`);
        Notifications.show(`${bld.name} built!`, 'gold');

        GameState.trackStat('buildingsBuilt');
        if (typeof Audio !== 'undefined') Audio.playBuild();

        HUD.update();
        GameState.save();
        if (typeof WorldMap !== 'undefined') WorldMap.updateActions();

        // Close panel
        const sp = document.getElementById('side-panel');
        if (sp) sp.classList.add('hidden');
    },

    useBuilding(buildingId) {
        switch (buildingId) {
            case 'forge':
            case 'workshop':
            case 'herbalist_bench':
                this.showCraftPanel(buildingId);
                break;
            case 'garden':
            case 'farm':
                this.showFarmPanel();
                break;
            case 'mineshaft':
                if (typeof Homestead !== 'undefined') Homestead.showMinePanel();
                break;
            case 'irrigation_network':
                Narrative.addFlavor('Water murmurs through the stone channels, feeding every bed in the camp.');
                break;
            case 'golem_foundry':
            case 'sprite_totem':
                if (typeof Homestead !== 'undefined') Homestead.showIndustryPanel();
                break;
            case 'shelter':
            case 'house':
                this.restAtShelter();
                break;
            case 'storage':
                Narrative.addSystem('Your storage vault holds your extra supplies.');
                break;
            case 'training_dummy':
                this.train();
                break;
            case 'lookout':
                Narrative.addSystem('From the tower, you survey the lands...');
                if (typeof MapUI !== 'undefined') {
                    MapUI.render();
                    document.getElementById('side-panel').classList.remove('hidden');
                }
                break;
            case 'ward_stones':
                Narrative.addFlavor('The ward stones hum with protective energy.');
                break;
        }
    },

    // ---- RESTING ----
    restAtShelter() {
        if (!GameState.player) return;
        GameState.player.hp = GameState.player.maxHp;
        GameState.player.mp = GameState.player.maxMp;
        Narrative.addSeparator();
        Narrative.addFlavor('You rest in your shelter. The world fades away for a blessed moment of peace.');
        Narrative.addHeal(`Fully restored! HP: ${GameState.player.maxHp}/${GameState.player.maxHp} | MP: ${GameState.player.maxMp}/${GameState.player.maxMp}`);

        // Check shelter upgrades
        const shelterEffect = this.getUpgradeEffect('shelter');
        if (shelterEffect === 'rest_cleanse') {
            GameState.player.debuffs = [];
            GameState.player.statusEffects = [];
            Narrative.addHeal('Your reinforced shelter cleanses all ailments.');
        } else if (shelterEffect === 'rest_shield') {
            GameState.player.debuffs = [];
            GameState.player.statusEffects = [];
            // Grant a temporary HP shield (10% of max HP)
            const shieldAmt = Math.floor(GameState.player.maxHp * 0.1);
            GameState.player.hp = Math.min(GameState.player.hp + shieldAmt, GameState.player.maxHp + shieldAmt);
            Narrative.addHeal(`Your fortified lodge grants a shield of ${shieldAmt} bonus HP!`);
        }

        GameState.turnCount += 5;

        for (let i = 0; i < 5; i++) this.tickFarming();

        HUD.update();
        GameState.save();
    },

    // ---- CRAFTING ----
    showCraftPanel(stationFilter) {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        if (!GameState.base) GameState.base = { buildings: {}, crops: [], placeables: [] };

        // Determine available stations
        const availableStations = [];
        if (GameState.base.buildings.forge) availableStations.push('forge');
        if (GameState.base.buildings.workshop) availableStations.push('workshop');
        if (GameState.base.buildings.herbalist_bench) availableStations.push('herbalist_bench');
        if (GameState.base.buildings.shelter || GameState.base.buildings.house) availableStations.push('shelter');

        // Get tech-unlocked recipes
        const unlockedRecipes = typeof TechTree !== 'undefined' ? TechTree.getUnlockedRecipes() : new Set(Object.keys(RECIPES));

        let html = '<h3>Crafting</h3>';

        // Show current tech tier
        if (typeof TechTree !== 'undefined') {
            const tier = TechTree.getUnlockedTier();
            const tierData = TECH_TREE[`tier_${tier}`];
            html += `<p style="color:var(--accent-gold-dim);margin-bottom:0.8rem;font-size:0.8rem">${tierData.icon} Tech: ${tierData.name} (Tier ${tier})</p>`;
        }

        if (availableStations.length === 0) {
            html += '<p style="color:var(--text-secondary)">Build a Forge, Workshop, or Herb Bench to unlock crafting.</p>';
        } else {
            let hasRecipes = false;
            for (const [recipeId, recipe] of Object.entries(RECIPES)) {
                // Filter by available station
                if (!availableStations.includes(recipe.station)) continue;
                if (stationFilter && recipe.station !== stationFilter) continue;
                // Filter by tech tree
                if (!unlockedRecipes.has(recipeId)) continue;

                hasRecipes = true;
                const canCraft = this.canAffordRecipe(recipe.ingredients);

                html += `<div class="craft-item ${canCraft ? '' : 'locked'}">`;
                html += `<div class="craft-header">`;
                html += `<span class="craft-icon">${recipe.icon}</span>`;
                html += `<div class="craft-info">`;
                html += `<div class="craft-name">${recipe.name}</div>`;
                html += `<div class="craft-desc">${recipe.description}</div>`;
                html += `</div></div>`;

                html += '<div class="craft-cost">';
                for (const [res, qty] of Object.entries(recipe.ingredients)) {
                    const have = GameState.getInventoryCount(res);
                    const item = ITEMS[res];
                    const enough = have >= qty;
                    html += `<span class="cost-item ${enough ? 'have' : 'need'}">${item ? item.icon : ''} ${have}/${qty}</span>`;
                }
                html += `<span class="cost-arrow">→</span>`;
                const resultItem = ITEMS[recipe.result.item];
                if (resultItem) {
                    html += `<span class="cost-item result">${resultItem.icon} x${recipe.result.quantity}</span>`;
                }
                html += '</div>';

                if (canCraft) {
                    html += `<button class="action-btn primary" onclick="Base.craft('${recipeId}')">Craft</button>`;
                }
                html += '</div>';
            }

            if (!hasRecipes) {
                html += '<p style="color:var(--text-secondary)">No recipes available at this station yet. Advance the tech tree to unlock more.</p>';
            }
        }

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    canAffordRecipe(ingredients) {
        for (const [res, qty] of Object.entries(ingredients)) {
            if (GameState.getInventoryCount(res) < qty) return false;
        }
        return true;
    },

    craft(recipeId) {
        const recipe = RECIPES[recipeId];
        if (!recipe) return;

        if (!this.canAffordRecipe(recipe.ingredients)) {
            Notifications.show('Not enough materials!', 'red');
            return;
        }

        // Check smelter boost for ingot recipes
        let quantity = recipe.result.quantity;
        if (recipe.result.item.includes('ingot') && this.hasPlaceable('smelting_boost')) {
            quantity *= 2;
        }
        // Workshop upgrade: extra ingot from smelting
        if (recipe.result.item.includes('ingot') && this.getUpgradeEffect('workshop') === 'smelt_bonus') {
            quantity += 1;
        }

        // Forge upgrade: chance for double output
        const forgeEffect = this.getUpgradeEffect('forge');
        if (forgeEffect === 'double_craft_10' && Math.random() < 0.10) {
            quantity *= 2;
            Notifications.show('Double craft! Lucky forge!', 'gold');
        } else if (forgeEffect === 'double_craft_20' && Math.random() < 0.20) {
            quantity *= 2;
            Notifications.show('Double craft! Master forge!', 'gold');
        }

        // Deduct ingredients
        for (const [res, qty] of Object.entries(recipe.ingredients)) {
            GameState.removeFromInventory(res, qty);
        }

        // Add result
        GameState.addToInventory(recipe.result.item, quantity);

        const resultItem = ITEMS[recipe.result.item];
        Narrative.addLoot(`Crafted: ${resultItem ? resultItem.icon : ''} ${resultItem ? resultItem.name : recipe.result.item} x${quantity}`);
        Notifications.show(`Crafted ${resultItem ? resultItem.name : recipe.result.item}!`, 'gold');

        GameState.trackStat('itemsCrafted');
        if (typeof Audio !== 'undefined') Audio.playCraft();

        HUD.update();
        GameState.save();

        // Refresh panel
        this.showCraftPanel();
    },

    // ---- PLACEABLES ----
    hasPlaceable(providesType) {
        if (!GameState.base || !GameState.base.placeables) return false;
        return GameState.base.placeables.some(p => {
            const item = ITEMS[p.itemKey];
            return item && item.provides === providesType;
        });
    },

    placePlaceable(itemKey) {
        const item = ITEMS[itemKey];
        if (!item || item.type !== 'placeable') return;

        if (!GameState.base) GameState.base = { buildings: {}, crops: [], placeables: [] };
        if (!GameState.base.placeables) GameState.base.placeables = [];

        // Remove from inventory
        GameState.removeFromInventory(itemKey);

        // Add to placeables list
        GameState.base.placeables.push({ itemKey, placedAt: GameState.turnCount });

        // Apply functional effects
        if (item.provides === 'extra_storage_10') {
            GameState.MAX_INVENTORY_SIZE += 10;
        }

        Narrative.addAction(`You place the ${item.name} in your camp.`);
        Notifications.show(`${item.name} placed!`, 'gold');

        HUD.update();
        GameState.save();
    },

    showPlaceablesPanel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        if (!GameState.base) GameState.base = { buildings: {}, crops: [], placeables: [] };
        if (!GameState.base.placeables) GameState.base.placeables = [];

        let html = '<h3>Placeables</h3>';

        // Show placed items
        if (GameState.base.placeables.length > 0) {
            html += '<h4 style="color:var(--accent-gold-dim);margin-bottom:0.5rem;font-size:0.8rem">PLACED ITEMS</h4>';
            GameState.base.placeables.forEach((p, idx) => {
                const item = ITEMS[p.itemKey];
                if (!item) return;
                html += `<div class="build-item built">`;
                html += `<div class="build-header">`;
                html += `<span class="build-icon">${item.icon}</span>`;
                html += `<div class="build-info">`;
                html += `<div class="build-name">${item.name}</div>`;
                html += `<div class="build-desc">${item.description}</div>`;
                html += `</div></div>`;
                html += `<button class="action-btn" onclick="Base.removePlaceable(${idx})">Pick Up</button>`;
                html += '</div>';
            });
        }

        // Show placeable items in inventory
        const placeableItems = GameState.player ? GameState.player.inventory.filter(inv => {
            const item = ITEMS[inv.key];
            return item && item.type === 'placeable';
        }) : [];

        if (placeableItems.length > 0) {
            html += '<h4 style="color:var(--accent-gold-dim);margin-top:1rem;margin-bottom:0.5rem;font-size:0.8rem">AVAILABLE TO PLACE</h4>';
            placeableItems.forEach(inv => {
                const item = ITEMS[inv.key];
                if (!item) return;
                html += `<div class="build-item">`;
                html += `<div class="build-header">`;
                html += `<span class="build-icon">${item.icon}</span>`;
                html += `<div class="build-info">`;
                html += `<div class="build-name">${item.name} ${inv.quantity > 1 ? 'x' + inv.quantity : ''}</div>`;
                html += `<div class="build-desc">${item.description}</div>`;
                html += `</div></div>`;
                html += `<button class="action-btn primary" onclick="Base.placePlaceable('${inv.key}')">Place</button>`;
                html += '</div>';
            });
        } else if (GameState.base.placeables.length === 0) {
            html += '<p style="color:var(--text-secondary)">No placeable items in your inventory. Craft some at a workshop or forge.</p>';
        }

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    removePlaceable(idx) {
        if (!GameState.base || !GameState.base.placeables) return;
        const p = GameState.base.placeables[idx];
        if (!p) return;

        const item = ITEMS[p.itemKey];

        // Remove functional effect
        if (item && item.provides === 'extra_storage_10') {
            GameState.MAX_INVENTORY_SIZE = Math.max(40, GameState.MAX_INVENTORY_SIZE - 10);
        }

        // Return to inventory
        GameState.addToInventory(p.itemKey);
        GameState.base.placeables.splice(idx, 1);

        if (item) Notifications.show(`Picked up ${item.name}`, 'gold');
        HUD.update();
        GameState.save();
        this.showPlaceablesPanel();
    },

    // ---- TECH TREE PANEL ----
    showTechPanel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        let html = '<h3>Tech Tree</h3>';

        if (typeof TechTree === 'undefined') {
            html += '<p style="color:var(--text-secondary)">Tech tree not available.</p>';
        } else {
            const tiers = TechTree.getTierInfo();
            tiers.forEach(tier => {
                html += `<div class="build-item ${tier.unlocked ? 'built' : 'locked'}">`;
                html += `<div class="build-header">`;
                html += `<span class="build-icon">${tier.icon}</span>`;
                html += `<div class="build-info">`;
                html += `<div class="build-name">Tier ${tier.level}: ${tier.name} ${tier.unlocked ? '(Unlocked)' : '(Locked)'}</div>`;
                html += `<div class="build-desc">${tier.description}</div>`;
                html += `</div></div>`;

                // Show requirements for locked tiers
                if (!tier.unlocked && tier.requirements) {
                    html += '<div class="build-cost">';
                    if (tier.requirements.bosses) {
                        tier.requirements.bosses.forEach(b => {
                            const defeated = GameState.bossesDefeated && GameState.bossesDefeated.includes(b);
                            const name = b.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            html += `<span class="cost-item ${defeated ? 'have' : 'need'}">💀 ${name}</span>`;
                        });
                    }
                    if (tier.requirements.buildings) {
                        tier.requirements.buildings.forEach(b => {
                            const built = GameState.base && GameState.base.buildings && GameState.base.buildings[b];
                            const bld = BUILDINGS[b];
                            html += `<span class="cost-item ${built ? 'have' : 'need'}">${bld ? bld.icon : ''} ${bld ? bld.name : b}</span>`;
                        });
                    }
                    if (tier.requirements.minBuildings) {
                        const count = GameState.base && GameState.base.buildings
                            ? Object.values(GameState.base.buildings).filter(Boolean).length : 0;
                        html += `<span class="cost-item ${count >= tier.requirements.minBuildings ? 'have' : 'need'}">🏗️ ${count}/${tier.requirements.minBuildings} buildings</span>`;
                    }
                    html += '</div>';
                }

                // Show what this tier unlocks
                if (tier.unlocked && tier.unlocks) {
                    let unlockText = [];
                    if (tier.unlocks.buildings) unlockText.push(`${tier.unlocks.buildings.length} buildings`);
                    if (tier.unlocks.recipes) unlockText.push(`${tier.unlocks.recipes.length} recipes`);
                    html += `<p style="color:var(--accent-green-bright);font-size:0.75rem;margin-top:0.3rem">Unlocks: ${unlockText.join(', ')}</p>`;
                }

                html += '</div>';
            });
        }

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    // ---- FARMING ----
    // The farming system lives in the Homestead engine (Living Soil).
    // These shims keep legacy call sites working.
    showFarmPanel() {
        if (typeof Homestead !== 'undefined') Homestead.showFarmPanel();
    },

    tickFarming() {
        if (typeof Homestead !== 'undefined') Homestead.tickGrowth(1);
    },

    // ---- TRAINING ----
    train() {
        if (!GameState.player) return;
        const xpGain = 5 + GameState.player.level * 2;
        const leveled = GameState.gainXp(xpGain);
        Narrative.addAction(`You practice at the training grounds. (+${xpGain} XP)`);
        if (leveled) {
            Narrative.addSystem(`Level up! You are now level ${GameState.player.level}!`);
            if (typeof Effects !== 'undefined') Effects.levelUp(GameState.player.level);
        }
        GameState.turnCount += 2;
        for (let i = 0; i < 2; i++) this.tickFarming();
        HUD.update();
        GameState.save();
    },

    // ---- BUILDING UPGRADES ----
    getBuildingLevel(buildingId) {
        if (!GameState.base || !GameState.base.buildingLevels) return GameState.base && GameState.base.buildings[buildingId] ? 1 : 0;
        return GameState.base.buildingLevels[buildingId] || (GameState.base.buildings[buildingId] ? 1 : 0);
    },

    // ── Adjacency Bonus System ──
    getActiveAdjacencyBonuses() {
        const bonuses = [];
        if (!GameState.base || !GameState.base.buildings || !GameState.base.placedBuildings) return bonuses;

        const placed = GameState.base.placedBuildings;
        const builtSet = new Set(placed.map(p => p.id));

        for (const pb of placed) {
            const bld = BUILDINGS[pb.id];
            if (!bld || !bld.adjacency) continue;

            for (const [neighborId, adjBonus] of Object.entries(bld.adjacency)) {
                if (!builtSet.has(neighborId)) continue;

                // Check actual proximity (within 6 tiles)
                const neighbor = placed.find(p => p.id === neighborId);
                if (neighbor) {
                    const dist = Math.abs(pb.x - neighbor.x) + Math.abs(pb.y - neighbor.y);
                    if (dist <= 8) {
                        bonuses.push({
                            source: bld.name,
                            neighbor: BUILDINGS[neighborId].name,
                            bonus: adjBonus.bonus,
                            desc: adjBonus.desc,
                            amount: adjBonus.amount
                        });
                    }
                }
            }
        }
        return bonuses;
    },

    // Get total camp prestige (affects morale, NPC attraction, events)
    getCampPrestige() {
        if (!GameState.base || !GameState.base.buildings) return 0;
        let prestige = 0;
        const b = GameState.base.buildings;
        for (const key of Object.keys(b)) {
            if (b[key]) {
                prestige += 5;
                prestige += (this.getBuildingLevel(key) - 1) * 3;
            }
        }
        // Adjacency bonuses add prestige
        prestige += this.getActiveAdjacencyBonuses().length * 2;
        return prestige;
    },

    upgradeBuilding(buildingId) {
        if (typeof BUILDING_UPGRADES === 'undefined') return;
        const upgradeDef = BUILDING_UPGRADES[buildingId];
        if (!upgradeDef) { Notifications.show('No upgrades available.', 'red'); return; }

        if (!GameState.base.buildingLevels) GameState.base.buildingLevels = {};
        const currentLevel = this.getBuildingLevel(buildingId);
        const nextLevel = currentLevel + 1;

        if (nextLevel > upgradeDef.maxLevel) {
            Notifications.show('Already at max level!', 'red');
            return;
        }

        const levelData = upgradeDef.levels[nextLevel];
        if (!levelData) return;

        if (!this.canAfford(levelData.cost)) {
            Notifications.show('Not enough resources!', 'red');
            return;
        }

        // Deduct resources
        for (const [res, qty] of Object.entries(levelData.cost)) {
            GameState.removeFromInventory(res, qty);
        }

        GameState.base.buildingLevels[buildingId] = nextLevel;

        // Apply upgrade effects
        this.applyUpgradeEffect(buildingId, levelData.effect);

        Narrative.addSeparator();
        Narrative.addStory(`Upgraded to ${levelData.name}! ${levelData.description}`);
        Notifications.show(`${levelData.name} complete!`, 'gold');

        HUD.update();
        GameState.save();
        this.showBuildPanel();
    },

    applyUpgradeEffect(buildingId, effect) {
        switch (effect) {
            case 'extra_storage_15':
                GameState.MAX_INVENTORY_SIZE += 15;
                break;
            case 'extra_storage_20':
                GameState.MAX_INVENTORY_SIZE += 20;
                break;
            case 'garden_upgrade':
            case 'greenhouse':
            case 'farm_expand':
                // Crop slot bonuses are checked dynamically in showFarmPanel
                break;
            // Other effects are checked at usage time (rest, crafting, etc.)
        }
    },

    getUpgradeEffect(buildingId) {
        if (typeof BUILDING_UPGRADES === 'undefined') return null;
        const upgradeDef = BUILDING_UPGRADES[buildingId];
        if (!upgradeDef) return null;
        const level = this.getBuildingLevel(buildingId);
        if (level <= 1) return null;
        return upgradeDef.levels[level] ? upgradeDef.levels[level].effect : null;
    },

    // ---- ENCHANTING ----
    showEnchantPanel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        if (!this.hasPlaceable('enchanting')) {
            panel.innerHTML = '<h3>Enchanting</h3><p style="color:var(--text-secondary)">Place an Enchanting Table to unlock enchanting.</p>' +
                '<button class="action-btn" onclick="document.getElementById(\'side-panel\').classList.add(\'hidden\')" style="margin-top:1rem">Close</button>';
            return;
        }

        const p = GameState.player;
        if (!p) return;

        // Enchantment definitions: gem → stat bonus
        const enchantments = {
            gem_ruby: { name: 'Ruby Enchant', stat: 'attack', amount: 3, color: '#cc3333' },
            gem_sapphire: { name: 'Sapphire Enchant', stat: 'magicAttack', amount: 3, color: '#3366cc' },
            gem_emerald: { name: 'Emerald Enchant', stat: 'defense', amount: 3, color: '#33aa44' },
            gem_amethyst: { name: 'Amethyst Enchant', stat: 'magicDefense', amount: 3, color: '#9944cc' }
        };

        // Enchantable slots
        const enchantableSlots = ['weapon', 'armor', 'helmet', 'boots', 'offhand', 'accessory'];

        let html = '<h3>Enchanting Table</h3>';
        html += '<p style="color:var(--text-secondary);margin-bottom:0.8rem;font-size:0.85rem">Socket gems into equipment for permanent stat bonuses.</p>';

        // Show equipped items that can be enchanted
        html += '<h4 style="color:var(--accent-gold-dim);margin-bottom:0.5rem;font-size:0.8rem">EQUIPMENT</h4>';
        let hasEquipment = false;

        for (const slot of enchantableSlots) {
            const itemKey = p.equipment[slot];
            if (!itemKey || !ITEMS[itemKey]) continue;
            hasEquipment = true;
            const item = ITEMS[itemKey];

            // Check current enchantment
            if (!p.enchantments) p.enchantments = {};
            const currentEnchant = p.enchantments[slot];

            html += '<div class="craft-item">';
            html += '<div class="craft-header">';
            html += `<span class="craft-icon">${item.icon}</span>`;
            html += '<div class="craft-info">';
            html += `<div class="craft-name">${item.name} <span style="color:var(--text-dim)">[${slot}]</span></div>`;
            if (currentEnchant) {
                const enchDef = enchantments[currentEnchant.gem];
                html += `<div class="craft-desc" style="color:${enchDef ? enchDef.color : 'var(--accent-gold)'}">✨ ${enchDef ? enchDef.name : 'Enchanted'}: +${currentEnchant.amount} ${currentEnchant.stat}</div>`;
            } else {
                html += '<div class="craft-desc">No enchantment</div>';
            }
            html += '</div></div>';

            // Show gem options if not enchanted
            if (!currentEnchant) {
                html += '<div class="craft-cost" style="flex-wrap:wrap;gap:0.3rem">';
                for (const [gemKey, enchDef] of Object.entries(enchantments)) {
                    const have = GameState.getInventoryCount(gemKey);
                    const gemItem = ITEMS[gemKey];
                    if (have > 0) {
                        html += `<button class="action-btn primary" style="font-size:0.75rem;padding:0.3rem 0.5rem;margin:0.15rem" onclick="Base.enchantItem('${slot}','${gemKey}')">${gemItem ? gemItem.icon : ''} ${enchDef.name} (+${enchDef.amount} ${enchDef.stat})</button>`;
                    } else {
                        html += `<span class="cost-item need" style="font-size:0.75rem">${gemItem ? gemItem.icon : ''} ${gemKey.replace('gem_','')} (0)</span>`;
                    }
                }
                html += '</div>';
            }
            html += '</div>';
        }

        if (!hasEquipment) {
            html += '<p style="color:var(--text-secondary)">No equipment to enchant. Equip items first.</p>';
        }

        // Show available gems
        html += '<h4 style="color:var(--accent-gold-dim);margin-top:1rem;margin-bottom:0.5rem;font-size:0.8rem">YOUR GEMS</h4>';
        let hasGems = false;
        for (const gemKey of Object.keys(enchantments)) {
            const count = GameState.getInventoryCount(gemKey);
            if (count > 0) {
                hasGems = true;
                const gemItem = ITEMS[gemKey];
                const enchDef = enchantments[gemKey];
                html += `<div style="padding:0.3rem 0;color:${enchDef.color};font-size:0.85rem">${gemItem ? gemItem.icon : ''} ${gemItem ? gemItem.name : gemKey} x${count} — +${enchDef.amount} ${enchDef.stat}</div>`;
            }
        }
        if (!hasGems) {
            html += '<p style="color:var(--text-secondary);font-size:0.85rem">No gems in inventory. Find gems while exploring or mining.</p>';
        }

        html += '<button class="action-btn" onclick="document.getElementById(\'side-panel\').classList.add(\'hidden\')" style="margin-top:1rem">Close</button>';
        panel.innerHTML = html;
    },

    enchantItem(slot, gemKey) {
        const p = GameState.player;
        if (!p) return;

        const enchantments = {
            gem_ruby: { name: 'Ruby Enchant', stat: 'attack', amount: 3 },
            gem_sapphire: { name: 'Sapphire Enchant', stat: 'magicAttack', amount: 3 },
            gem_emerald: { name: 'Emerald Enchant', stat: 'defense', amount: 3 },
            gem_amethyst: { name: 'Amethyst Enchant', stat: 'magicDefense', amount: 3 }
        };

        const enchDef = enchantments[gemKey];
        if (!enchDef) return;

        if (GameState.getInventoryCount(gemKey) < 1) {
            Notifications.show('Not enough gems!', 'red');
            return;
        }

        const itemKey = p.equipment[slot];
        if (!itemKey) return;

        // Consume gem
        GameState.removeFromInventory(gemKey, 1);

        // Apply enchantment
        if (!p.enchantments) p.enchantments = {};
        p.enchantments[slot] = { gem: gemKey, stat: enchDef.stat, amount: enchDef.amount };

        // Apply stat bonus
        if (p[enchDef.stat] !== undefined) {
            p[enchDef.stat] += enchDef.amount;
        }

        const item = ITEMS[itemKey];
        Narrative.addLoot(`Enchanted ${item ? item.name : 'item'} with ${enchDef.name}! (+${enchDef.amount} ${enchDef.stat})`);
        Notifications.show(`${enchDef.name} applied!`, 'gold');

        HUD.update();
        GameState.save();
        this.showEnchantPanel();
    },

    // ════════════════════════════════════════════
    // NPC CAMP ROLES — Recruit and Assign Workers
    // ════════════════════════════════════════════

    // Available roles and what they produce
    NPC_ROLES: {
        gatherer:  { name: 'Gatherer',  icon: '🪓', desc: 'Gathers wood and stone passively', produces: ['wood', 'stone'], rate: 0.3 },
        hunter:    { name: 'Hunter',    icon: '🏹', desc: 'Hunts for hides and meat', produces: ['hide', 'grilled_meat'], rate: 0.2 },
        farmer:    { name: 'Farmer',    icon: '🌾', desc: 'Tends crops, boosting growth', produces: [], rate: 0, farmBoost: 0.25 },
        guard:     { name: 'Guard',     icon: '⚔️', desc: 'Defends camp, reduces raid threat', produces: [], rate: 0, threatReduction: 10 },
        herbalist: { name: 'Herbalist', icon: '🧪', desc: 'Brews basic potions passively', produces: ['health_vial'], rate: 0.15 },
        researcher:{ name: 'Researcher',icon: '📖', desc: 'Discovers recipes over time', produces: [], rate: 0, discoveryChance: 0.05 }
    },

    // Possible recruitable NPCs (unlocked as game progresses)
    RECRUITABLE_NPCS: [
        { id: 'refugee_1',   name: 'Ashen Refugee',     icon: '👤', requirePrestige: 10 },
        { id: 'refugee_2',   name: 'Displaced Farmer',  icon: '👩', requirePrestige: 15 },
        { id: 'refugee_3',   name: 'Wandering Scout',   icon: '🏃', requirePrestige: 25, requireBoss: 'the_ashen_king' },
        { id: 'refugee_4',   name: 'Fen Survivor',      icon: '🧝', requirePrestige: 30, requireBoss: 'the_ashen_king' },
        { id: 'refugee_5',   name: 'Freed Prisoner',    icon: '👥', requirePrestige: 40, requireBoss: 'mother_of_the_fen' },
        { id: 'refugee_6',   name: 'Void Defector',     icon: '💀', requirePrestige: 50, requireBoss: 'mother_of_the_fen' }
    ],

    showCampNPCPanel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        if (!GameState.campNPCs) GameState.campNPCs = [];
        const prestige = this.getCampPrestige();

        let html = '<h3>Settlement</h3>';
        html += `<p style="color:var(--text-secondary);font-size:0.8rem;margin-bottom:0.5rem">Camp Prestige: ${prestige} — Manage your settlers and assign roles.</p>`;

        // Current NPCs
        if (GameState.campNPCs.length > 0) {
            html += '<h4 style="color:var(--accent-gold-dim);font-size:0.85rem;margin-bottom:0.3rem">Your Settlers</h4>';
            for (let i = 0; i < GameState.campNPCs.length; i++) {
                const npc = GameState.campNPCs[i];
                const role = this.NPC_ROLES[npc.role];
                html += `<div class="build-item built">`;
                html += `<div class="build-header">`;
                html += `<span class="build-icon">${npc.icon}</span>`;
                html += `<div class="build-info">`;
                html += `<div class="build-name">${npc.name}</div>`;
                html += `<div class="build-desc">${role ? role.icon + ' ' + role.name + ' — ' + role.desc : 'Idle'}</div>`;
                html += `</div></div>`;
                // Role assignment buttons
                html += '<div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.3rem">';
                for (const [roleKey, roleDef] of Object.entries(this.NPC_ROLES)) {
                    const active = npc.role === roleKey;
                    html += `<button class="action-btn ${active ? 'primary' : ''}" style="font-size:0.65rem;padding:0.2rem 0.4rem" onclick="Base.assignRole(${i}, '${roleKey}')">${roleDef.icon} ${roleDef.name}</button>`;
                }
                html += '</div></div>';
            }
        }

        // Recruitable NPCs
        const available = this.RECRUITABLE_NPCS.filter(r => {
            if (GameState.campNPCs.some(n => n.id === r.id)) return false;
            if (prestige < r.requirePrestige) return false;
            if (r.requireBoss && !GameState.bossesDefeated.includes(r.requireBoss)) return false;
            return true;
        });

        if (available.length > 0) {
            html += '<h4 style="color:var(--accent-gold-dim);font-size:0.85rem;margin-top:0.8rem;margin-bottom:0.3rem">Available Recruits</h4>';
            for (const recruit of available) {
                html += `<div class="build-item">`;
                html += `<div class="build-header">`;
                html += `<span class="build-icon">${recruit.icon}</span>`;
                html += `<div class="build-info">`;
                html += `<div class="build-name">${recruit.name}</div>`;
                html += `<div class="build-desc">Seeks refuge. Prestige ${recruit.requirePrestige} needed.</div>`;
                html += `</div></div>`;
                html += `<button class="action-btn primary" onclick="Base.recruitNPC('${recruit.id}')">Recruit</button>`;
                html += '</div>';
            }
        }

        // Locked recruits (show what's needed)
        const locked = this.RECRUITABLE_NPCS.filter(r => {
            if (GameState.campNPCs.some(n => n.id === r.id)) return false;
            return prestige < r.requirePrestige || (r.requireBoss && !GameState.bossesDefeated.includes(r.requireBoss));
        });
        if (locked.length > 0) {
            html += '<h4 style="color:var(--text-secondary);font-size:0.8rem;margin-top:0.8rem;margin-bottom:0.3rem">Locked</h4>';
            for (const recruit of locked.slice(0, 2)) {
                let req = `Prestige ${recruit.requirePrestige}`;
                if (recruit.requireBoss) req += ', Boss defeated';
                html += `<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.2rem">${recruit.icon} ${recruit.name} — needs ${req}</div>`;
            }
        }

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    recruitNPC(recruitId) {
        const recruit = this.RECRUITABLE_NPCS.find(r => r.id === recruitId);
        if (!recruit) return;
        if (GameState.campNPCs.some(n => n.id === recruitId)) return;

        GameState.campNPCs.push({
            id: recruit.id,
            name: recruit.name,
            icon: recruit.icon,
            role: 'gatherer',  // Default role
            productivity: 1.0,
            morale: 60
        });

        Narrative.addStory(`${recruit.name} has joined your settlement!`);
        Notifications.show(`${recruit.name} recruited!`, 'gold');
        if (GameState.survival) GameState.survival.morale = Math.min(100, GameState.survival.morale + 5);
        GameState.save();
        this.showCampNPCPanel();
    },

    assignRole(npcIndex, roleKey) {
        if (!GameState.campNPCs || !GameState.campNPCs[npcIndex]) return;
        GameState.campNPCs[npcIndex].role = roleKey;
        GameState.save();
        this.showCampNPCPanel();
    },

    // Process NPC production each exploration turn
    processNPCProduction() {
        if (!GameState.campNPCs || GameState.campNPCs.length === 0) return;

        for (const npc of GameState.campNPCs) {
            const role = this.NPC_ROLES[npc.role];
            if (!role) continue;

            // Resource production
            if (role.produces.length > 0 && role.rate > 0) {
                if (Math.random() < role.rate) {
                    const item = role.produces[Math.floor(Math.random() * role.produces.length)];
                    if (GameState.addToInventory(item, 1)) {
                        // Silent production — no notification spam
                    }
                }
            }

            // Guard threat reduction
            if (role.threatReduction) {
                GameState.threatLevel = Math.max(0, GameState.threatLevel - role.threatReduction * 0.1);
            }

            // Researcher recipe discovery
            if (role.discoveryChance && typeof RECIPES !== 'undefined') {
                if (Math.random() < role.discoveryChance) {
                    const allRecipes = Object.keys(RECIPES);
                    const undiscovered = allRecipes.filter(k => !GameState.isRecipeDiscovered(k));
                    if (undiscovered.length > 0) {
                        const found = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                        GameState.discoverRecipe(found);
                    }
                }
            }
        }
    }
};
