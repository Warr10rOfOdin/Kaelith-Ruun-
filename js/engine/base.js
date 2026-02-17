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

        if (!GameState.base) GameState.base = { buildings: {}, crops: [] };

        let html = '<h3>Build at Camp</h3>';
        html += '<p style="color:var(--text-secondary);margin-bottom:0.8rem;font-size:0.85rem">Walk to a building spot (🔲) and interact, or choose below:</p>';

        for (const [id, bld] of Object.entries(BUILDINGS)) {
            const built = GameState.base.buildings[id];
            const canAfford = !built && this.canAfford(bld.cost);

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
            }
            html += '</div>';
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
        const bld = BUILDINGS[buildingId];
        if (!bld) return;

        if (!GameState.base) GameState.base = { buildings: {}, crops: [] };

        if (GameState.base.buildings[buildingId]) {
            Notifications.show('Already built!', 'red');
            return;
        }

        if (!this.canAfford(bld.cost)) {
            Notifications.show('Not enough resources!', 'red');
            return;
        }

        // Deduct resources
        for (const [res, qty] of Object.entries(bld.cost)) {
            GameState.removeFromInventory(res, qty);
        }

        GameState.base.buildings[buildingId] = true;

        // Apply building effects
        if (buildingId === 'storage') {
            GameState.MAX_INVENTORY_SIZE += 20;
        }

        Narrative.addSeparator();
        Narrative.addStory(`You build a ${bld.name}! ${bld.description}`);
        Notifications.show(`${bld.name} built!`, 'gold');

        // Update camp map visuals
        this.updateCampTiles();

        HUD.update();
        GameState.save();

        // Refresh the panel
        this.showBuildPanel();

        // Update actions
        WorldMap.updateActions();
    },

    updateCampTiles() {
        if (WorldMap.currentMap !== 'player_camp') return;
        const campMap = MAPS.player_camp;
        if (!campMap || !campMap.buildingSpots) return;

        campMap.buildingSpots.forEach(spot => {
            if (GameState.base && GameState.base.buildings[spot.id]) {
                const bld = BUILDINGS[spot.id];
                if (bld) {
                    // Add building entity to the entity map
                    const key = `${spot.x},${spot.y}`;
                    WorldMap.entityMap[key] = {
                        x: spot.x, y: spot.y,
                        type: 'building',
                        id: spot.id,
                        emoji: bld.icon
                    };
                    // Make the spot non-passable
                    if (WorldMap.terrain[spot.y]) {
                        WorldMap.terrain[spot.y][spot.x] = '.';
                    }
                }
            }
        });
        WorldMap.render();
    },

    showBuildMenu(x, y) {
        // Find which building spot this is
        const campMap = MAPS.player_camp;
        if (!campMap || !campMap.buildingSpots) return;

        const spot = campMap.buildingSpots.find(s => s.x === x && s.y === y);
        if (!spot) {
            Narrative.addSystem('Nothing to build here.');
            return;
        }

        if (GameState.base && GameState.base.buildings[spot.id]) {
            const bld = BUILDINGS[spot.id];
            Narrative.addSystem(`${bld.name} is already built here.`);
            // Open the building's function
            this.useBuilding(spot.id);
            return;
        }

        const bld = BUILDINGS[spot.id];
        if (!bld) return;

        Narrative.addSystem(`Building spot: ${spot.label}`);

        if (this.canAfford(bld.cost)) {
            // Show cost and build option
            let costText = Object.entries(bld.cost)
                .map(([res, qty]) => `${ITEMS[res] ? ITEMS[res].icon : ''} ${qty} ${ITEMS[res] ? ITEMS[res].name : res}`)
                .join(', ');
            Narrative.addSystem(`Cost: ${costText}`);
            Narrative.addSystem(`Use the Build panel to construct the ${bld.name}.`);
        } else {
            let costText = Object.entries(bld.cost)
                .map(([res, qty]) => {
                    const have = GameState.getInventoryCount(res);
                    return `${ITEMS[res] ? ITEMS[res].icon : ''} ${have}/${qty} ${ITEMS[res] ? ITEMS[res].name : res}`;
                })
                .join(', ');
            Narrative.addSystem(`Need: ${costText}`);
        }
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
                // Could show world map
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
        GameState.turnCount += 5;

        // Tick farming
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

        if (!GameState.base) GameState.base = { buildings: {}, crops: [] };

        // Determine available stations
        const availableStations = [];
        if (GameState.base.buildings.forge) availableStations.push('forge');
        if (GameState.base.buildings.workshop) availableStations.push('workshop');
        if (GameState.base.buildings.herbalist_bench) availableStations.push('herbalist_bench');
        if (GameState.base.buildings.shelter || GameState.base.buildings.house) availableStations.push('shelter');

        let html = '<h3>Crafting</h3>';

        if (availableStations.length === 0) {
            html += '<p style="color:var(--text-secondary)">Build a Forge, Workshop, or Herb Bench to unlock crafting.</p>';
        } else {
            for (const [recipeId, recipe] of Object.entries(RECIPES)) {
                // Filter by available station
                if (!availableStations.includes(recipe.station)) continue;
                if (stationFilter && recipe.station !== stationFilter) continue;

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

        // Deduct ingredients
        for (const [res, qty] of Object.entries(recipe.ingredients)) {
            GameState.removeFromInventory(res, qty);
        }

        // Add result
        GameState.addToInventory(recipe.result.item, recipe.result.quantity);

        const resultItem = ITEMS[recipe.result.item];
        Narrative.addLoot(`Crafted: ${resultItem ? resultItem.icon : ''} ${resultItem ? resultItem.name : recipe.result.item} x${recipe.result.quantity}`);
        Notifications.show(`Crafted ${resultItem ? resultItem.name : recipe.result.item}!`, 'gold');

        HUD.update();
        GameState.save();

        // Refresh panel
        this.showCraftPanel();
    },

    // ---- FARMING ----
    showFarmPanel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        if (!GameState.base) GameState.base = { buildings: {}, crops: [] };
        if (!GameState.base.crops) GameState.base.crops = [];

        const hasGarden = GameState.base.buildings.garden;
        const hasFarm = GameState.base.buildings.farm;
        const maxCrops = (hasGarden ? 3 : 0) + (hasFarm ? 5 : 0);

        let html = '<h3>Farming</h3>';

        if (!hasGarden && !hasFarm) {
            html += '<p style="color:var(--text-secondary)">Build a Garden or Farm Plot to start growing crops.</p>';
        } else {
            html += `<p style="color:var(--text-secondary);margin-bottom:0.8rem;font-size:0.85rem">Plots: ${GameState.base.crops.length}/${maxCrops} | Crops grow each turn as you explore.</p>`;

            // Current crops
            if (GameState.base.crops.length > 0) {
                html += '<div class="farm-plots">';
                GameState.base.crops.forEach((crop, idx) => {
                    const cropDef = CROPS[crop.type];
                    if (!cropDef) return;

                    const progress = Math.min(crop.growth / cropDef.growthTurns, 1);
                    const stageIdx = Math.floor(progress * (cropDef.stages.length - 1));
                    const stageEmoji = cropDef.stages[stageIdx];
                    const isReady = crop.growth >= cropDef.growthTurns;

                    html += `<div class="farm-plot ${isReady ? 'ready' : ''}">`;
                    html += `<span class="plot-emoji">${stageEmoji}</span>`;
                    html += `<span class="plot-name">${cropDef.name}</span>`;
                    if (isReady) {
                        html += `<button class="action-btn primary" onclick="Base.harvestCrop(${idx})">Harvest</button>`;
                    } else {
                        html += `<span class="plot-progress">${Math.floor(progress * 100)}%</span>`;
                    }
                    html += '</div>';
                });
                html += '</div>';
            }

            // Plant new crops
            if (GameState.base.crops.length < maxCrops) {
                html += '<h4 style="color:var(--accent-gold-dim);margin-top:1rem;margin-bottom:0.5rem;font-size:0.8rem">PLANT CROPS</h4>';
                for (const [cropId, cropDef] of Object.entries(CROPS)) {
                    const canPlant = this.canAffordRecipe(cropDef.seedCost);
                    html += `<div class="craft-item ${canPlant ? '' : 'locked'}">`;
                    html += `<div class="craft-header">`;
                    html += `<span class="craft-icon">${cropDef.icon}</span>`;
                    html += `<div class="craft-info">`;
                    html += `<div class="craft-name">${cropDef.name}</div>`;
                    html += `<div class="craft-desc">Grows in ~${cropDef.growthTurns} turns. Yields ${cropDef.harvestQty}x harvest.</div>`;
                    html += `</div></div>`;

                    html += '<div class="craft-cost">';
                    for (const [res, qty] of Object.entries(cropDef.seedCost)) {
                        const have = GameState.getInventoryCount(res);
                        const item = ITEMS[res];
                        const enough = have >= qty;
                        html += `<span class="cost-item ${enough ? 'have' : 'need'}">${item ? item.icon : ''} ${have}/${qty}</span>`;
                    }
                    html += '</div>';

                    if (canPlant) {
                        html += `<button class="action-btn primary" onclick="Base.plantCrop('${cropId}')">Plant</button>`;
                    }
                    html += '</div>';
                }
            }
        }

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    plantCrop(cropId) {
        const cropDef = CROPS[cropId];
        if (!cropDef) return;

        if (!this.canAffordRecipe(cropDef.seedCost)) {
            Notifications.show('Not enough resources to plant!', 'red');
            return;
        }

        const hasGarden = GameState.base.buildings.garden;
        const hasFarm = GameState.base.buildings.farm;
        const maxCrops = (hasGarden ? 3 : 0) + (hasFarm ? 5 : 0);

        if (GameState.base.crops.length >= maxCrops) {
            Notifications.show('All farm plots are full!', 'red');
            return;
        }

        // Deduct seed cost
        for (const [res, qty] of Object.entries(cropDef.seedCost)) {
            GameState.removeFromInventory(res, qty);
        }

        GameState.base.crops.push({ type: cropId, growth: 0 });

        Narrative.addAction(`You plant ${cropDef.name} in your garden.`);
        Notifications.show(`Planted ${cropDef.name}!`, 'green');

        HUD.update();
        GameState.save();
        this.showFarmPanel();
    },

    harvestCrop(idx) {
        if (!GameState.base || !GameState.base.crops) return;
        const crop = GameState.base.crops[idx];
        if (!crop) return;

        const cropDef = CROPS[crop.type];
        if (!cropDef) return;

        if (crop.growth < cropDef.growthTurns) {
            Notifications.show('Not ready yet!', 'red');
            return;
        }

        GameState.addToInventory(cropDef.harvestItem, cropDef.harvestQty);
        GameState.base.crops.splice(idx, 1);

        const item = ITEMS[cropDef.harvestItem];
        Narrative.addLoot(`Harvested ${cropDef.harvestQty}x ${item ? item.name : cropDef.harvestItem}!`);
        Notifications.show(`Harvested ${cropDef.name}!`, 'green');

        HUD.update();
        GameState.save();
        this.showFarmPanel();
    },

    tickFarming() {
        if (!GameState.base || !GameState.base.crops) return;
        GameState.base.crops.forEach(crop => {
            crop.growth++;
        });
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
    }
};
