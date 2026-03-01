// ============================================
// EXPLORATION ENGINE
// ============================================

const Exploration = {
    explorationCount: 0,

    showCurrentLocation() {
        const locationKey = GameState.currentLocation;
        const location = WORLD.locations[locationKey];
        if (!location) return;

        if (!GameState.visitedLocations.includes(locationKey)) {
            GameState.visitedLocations.push(locationKey);
            Narrative.showLocationEntry(locationKey);

            // Quest tracking
            if (locationKey === 'ruined_outpost') {
                GameState.completeObjective('main', null, 'explore_outpost');
            } else if (locationKey === 'ashen_throne') {
                GameState.completeObjective('main', null, 'find_throne');
            } else if (locationKey.includes('hollowfen') || location.region === 'hollowfen') {
                GameState.completeObjective('main', null, 'enter_hollowfen');
            } else if (locationKey === 'witchs_hut') {
                GameState.completeObjective('main', null, 'find_witch');
            } else if (locationKey.includes('void_sanctum') || location.region === 'void_sanctum') {
                GameState.completeObjective('main', null, 'enter_sanctum');
            } else if (locationKey === 'hall_of_echoes') {
                GameState.completeObjective('main', null, 'traverse_hall');
            }
        }

        this.explorationCount = 0;
        this.updateActions();
    },

    updateActions() {
        const location = WORLD.locations[GameState.currentLocation];
        if (!location) return;

        const buttons = [];

        if (location.type === 'exploration') {
            buttons.push({ text: 'Explore', class: 'primary', action: 'Exploration.explore()' });
            buttons.push({ text: 'Hunt Enemies', class: 'danger', action: 'Exploration.hunt()' });
            buttons.push({ text: 'Rest', class: '', action: 'Exploration.rest()' });
        } else if (location.type === 'boss') {
            const region = WORLD.regions[location.region];
            const bossKey = region ? region.boss : null;
            if (bossKey && !GameState.bossesDefeated.includes(bossKey)) {
                const boss = ENEMIES[bossKey];
                if (boss) {
                    buttons.push({ text: `Challenge ${boss.name}`, class: 'danger', action: `Exploration.challengeBoss('${bossKey}')` });
                }
            } else {
                buttons.push({ text: 'Explore Ruins', class: 'primary', action: 'Exploration.explore()' });
            }
        } else if (location.type === 'npc') {
            if (location.npc) {
                const npc = NPCS[location.npc];
                if (npc) {
                    buttons.push({ text: `Talk to ${npc.name}`, class: 'primary', action: `Dialogue.start('${location.npc}')` });
                }
            }
        }

        buttons.push({ text: 'Travel', class: '', action: 'Exploration.showTravel()' });

        Actions.setButtons(buttons);
    },

    explore() {
        this.explorationCount++;
        GameState.turnCount++;

        const location = WORLD.locations[GameState.currentLocation];
        if (!location) return;

        // Random event selection
        const roll = Math.random();

        if (roll < 0.35) {
            // Combat encounter
            Narrative.addFlavor(Narrative.getAmbientText());
            this.triggerRandomCombat();
        } else if (roll < 0.55) {
            // Find supplies
            this.findSupplies();
        } else if (roll < 0.7) {
            // Ambient/lore text
            Narrative.showExploration(GameState.currentLocation);
        } else if (roll < 0.8) {
            // Wandering merchant (chance)
            if (Math.random() < 0.3 && NPCS['wandering_merchant']) {
                Narrative.addFlavor('A figure emerges from the gloom, laden with packs and trinkets.');
                Dialogue.start('wandering_merchant');
                return;
            } else {
                Narrative.addFlavor(Narrative.getAmbientText());
            }
        } else {
            // Nothing happens
            Narrative.addFlavor(Narrative.getAmbientText());
            Narrative.addSystem('You search the area but find nothing of note.');
        }

        GameState.save();
    },

    hunt() {
        Narrative.addAction('You steel yourself and search for enemies...');
        setTimeout(() => {
            this.triggerRandomCombat();
        }, 400);
    },

    triggerRandomCombat() {
        const region = WORLD.regions[GameState.currentRegion];
        if (!region || !region.enemies || !region.enemies.length) {
            Narrative.addSystem('The area seems peaceful... for now.');
            return;
        }

        // Weight toward player-appropriate enemies
        const playerLevel = GameState.player.level;
        const validEnemies = region.enemies.filter(key => {
            const e = ENEMIES[key];
            return e && e.level <= playerLevel + 2;
        });

        const enemyPool = validEnemies.length > 0 ? validEnemies : [region.enemies[0]];
        const enemyKey = enemyPool[Math.floor(Math.random() * enemyPool.length)];

        if (!enemyKey || !ENEMIES[enemyKey]) {
            Narrative.addSystem('The area seems peaceful... for now.');
            return;
        }

        Narrative.addFlavor(`A hostile presence makes itself known...`);
        setTimeout(() => {
            Combat.start(enemyKey);
        }, 600);
    },

    findSupplies() {
        const roll = Math.random();
        let found = false;

        if (roll < 0.4) {
            // Gold
            const gold = 5 + Math.floor(Math.random() * 20);
            GameState.player.gold += gold;
            Narrative.addLoot(`You find ${gold} gold coins scattered among the debris.`);
            if (typeof Audio !== 'undefined') Audio.playLoot();
            found = true;
        } else if (roll < 0.7) {
            // Health/mana vial
            const isHealth = Math.random() < 0.5;
            const itemKey = isHealth ? 'health_vial' : 'mana_vial';
            if (ITEMS[itemKey]) {
                GameState.addToInventory(itemKey);
                Narrative.addLoot(`You find a ${ITEMS[itemKey].name}!`);
                found = true;
            }
        } else if (roll < 0.85) {
            // Random consumable
            const consumables = ['health_vial', 'mana_vial', 'antidote', 'blood_flask'];
            const itemKey = consumables[Math.floor(Math.random() * consumables.length)];
            if (ITEMS[itemKey]) {
                GameState.addToInventory(itemKey);
                Narrative.addLoot(`You discover a ${ITEMS[itemKey].name} hidden in a cache!`);
                found = true;
            }
        } else {
            // Rare find - equipment
            const region = WORLD.regions[GameState.currentRegion];
            if (region && region.levelRange) {
                const lootTier = region.levelRange[1] <= 4 ? 'common' : region.levelRange[1] <= 6 ? 'uncommon' : 'rare';
                const table = typeof LOOT_TABLES !== 'undefined' ? LOOT_TABLES[lootTier] : null;
                if (table && table.equipment && table.equipment.length > 0 && Math.random() < 0.3) {
                    const itemKey = table.equipment[Math.floor(Math.random() * table.equipment.length)];
                    if (itemKey && ITEMS[itemKey]) {
                        GameState.addToInventory(itemKey);
                        const item = ITEMS[itemKey];
                        Narrative.addLoot(`Amazing find! You discover: ${item.icon} ${item.name}!`);
                        Notifications.show(`Found ${item.name}!`, 'gold');
                        if (typeof Audio !== 'undefined') Audio.playLootRare();
                        found = true;
                    }
                }
            }
        }

        if (!found) {
            Narrative.addFlavor('You search thoroughly but the area has already been picked clean.');
        }

        HUD.update();
    },

    rest() {
        const healAmount = Math.floor(GameState.player.maxHp * 0.3);
        const mpHeal = Math.floor(GameState.player.maxMp * 0.2);
        GameState.healPlayer(healAmount, mpHeal);

        Narrative.addSeparator();
        Narrative.addFlavor('You find a sheltered spot and rest for a while. The world is still dangerous, but for this moment, you are safe.');
        Narrative.addHeal(`Restored ${healAmount} HP and ${mpHeal} MP.`);

        // Small chance of ambush
        if (Math.random() < 0.15) {
            Narrative.addFlavor('Your rest is interrupted by the sound of approaching footsteps...');
            setTimeout(() => this.triggerRandomCombat(), 1000);
        }

        GameState.turnCount++;
        HUD.update();
        GameState.save();
    },

    challengeBoss(bossKey) {
        const boss = ENEMIES[bossKey];
        if (!boss) return;

        Narrative.showBossIntro(GameState.currentLocation);

        setTimeout(() => {
            Combat.start(bossKey, (result) => {
                if (result === 'victory') {
                    Narrative.addSeparator();
                    Narrative.addStory(`The ${boss.name} is vanquished. A weight lifts from this place.`);

                    // Check for region unlocks
                    if (bossKey === 'the_ashen_king') {
                        Narrative.addStory('With the Ashen King fallen, the southern path clears. The Hollowfen awaits.');
                        Notifications.show('New Region Unlocked: The Hollowfen!', 'gold');
                    } else if (bossKey === 'mother_of_the_fen') {
                        Narrative.addStory('As the Mother falls, the swamp begins to recede. A rift opens in the sky above — the Void Sanctum beckons.');
                        Notifications.show('New Region Unlocked: The Void Sanctum!', 'gold');
                    } else if (bossKey === 'ruun_the_unraveler') {
                        Narrative.addSeparator();
                        Narrative.addStory('Ruun dissolves into nothing. The void screams, then falls silent. Reality shudders... and holds.');
                        Narrative.addStory('The cracks in the sky begin to close. The whispers fade. For the first time in a thousand years, the world feels... whole.');
                        Narrative.addStory('You have done what no one believed possible. The Unraveler is no more. Kaelith Ruun will endure.');
                        Narrative.addSystem('CONGRATULATIONS — You have completed the main story of Kaelith Ruun: Shattered Realms.');
                        Notifications.show('You have saved Kaelith Ruun!', 'gold');
                    }
                }
            });
        }, 1500);
    },

    showTravel() {
        const panel = document.getElementById('side-panel-content');
        const sidePanel = document.getElementById('side-panel');
        if (!panel || !sidePanel) return;
        sidePanel.classList.remove('hidden');

        let html = '<h3>Travel</h3>';
        html += '<div class="world-map">';

        // Show current region's locations
        const currentRegion = WORLD.regions[GameState.currentRegion];
        if (currentRegion) {
            html += `<p style="color:var(--text-secondary);margin-bottom:0.8rem;font-style:italic">${currentRegion.name}</p>`;

            currentRegion.locations.forEach(locKey => {
                const loc = WORLD.locations[locKey];
                if (!loc) return;

                const isCurrent = locKey === GameState.currentLocation;
                html += `<div class="world-location ${isCurrent ? 'current' : ''}" onclick="Exploration.travelTo('${locKey}')">`;
                html += `<span class="loc-icon">${loc.icon}</span>`;
                html += `<div class="loc-info">`;
                html += `<div class="loc-name">${loc.name}</div>`;
                html += `<div class="loc-desc">${isCurrent ? '(Current Location)' : (loc.description || '').substring(0, 60) + '...'}</div>`;
                html += `</div></div>`;
            });
        }

        // Show other unlocked regions
        html += '<p style="color:var(--text-secondary);margin-top:1.5rem;margin-bottom:0.8rem;font-style:italic">Other Regions</p>';

        for (const [regionKey, region] of Object.entries(WORLD.regions)) {
            if (regionKey === GameState.currentRegion) continue;

            const isLocked = !region.unlocked;
            html += `<div class="world-location ${isLocked ? 'locked' : ''}" ${!isLocked ? `onclick="Exploration.travelToRegion('${regionKey}')"` : ''}>`;
            html += `<span class="loc-icon">${region.icon}</span>`;
            html += `<div class="loc-info">`;
            html += `<div class="loc-name">${region.name}</div>`;
            if (isLocked) {
                html += `<div class="loc-desc">${region.unlockCondition || 'Locked'}</div>`;
            } else {
                html += `<div class="loc-desc">Levels ${region.levelRange[0]}-${region.levelRange[1]}</div>`;
            }
            html += `</div></div>`;
        }

        html += '</div>';
        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;

        panel.innerHTML = html;
    },

    travelTo(locationKey) {
        const location = WORLD.locations[locationKey];
        if (!location) return;

        if (locationKey === GameState.currentLocation) return;

        GameState.currentLocation = locationKey;
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) sidePanel.classList.add('hidden');

        Narrative.addSeparator();
        Narrative.addAction(`You travel to ${location.name}...`);

        // Random travel encounter (20% chance)
        if (Math.random() < 0.2) {
            Narrative.addFlavor('Your journey is interrupted...');
            setTimeout(() => this.triggerRandomCombat(), 800);
        } else {
            this.showCurrentLocation();
        }

        HUD.update();
        GameState.save();
    },

    travelToRegion(regionKey) {
        const region = WORLD.regions[regionKey];
        if (!region || !region.unlocked) return;

        GameState.currentRegion = regionKey;
        GameState.currentLocation = region.locations[0];
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) sidePanel.classList.add('hidden');

        Narrative.addSeparator();
        Narrative.addAction(`You journey to ${region.name}...`);
        Narrative.addStory(region.description);

        if (typeof Audio !== 'undefined') Audio.startAmbient(regionKey);
        this.showCurrentLocation();
        HUD.update();
        GameState.save();
    }
};
