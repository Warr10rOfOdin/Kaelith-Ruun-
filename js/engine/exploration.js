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

        // Active terraform tool gets a cancel chip up front
        if (typeof Homestead !== 'undefined' && Homestead.activeTool && Homestead.TOOLS[Homestead.activeTool]) {
            buttons.push({ text: `✋ Stop ${Homestead.TOOLS[Homestead.activeTool].name}`, class: 'danger', action: 'Homestead.cancelTool()' });
        }

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

        // Tick survival and buffs each exploration turn
        if (GameState.survival) {
            GameState.survival.fatigue = Math.min(100, GameState.survival.fatigue + 3);
            GameState.updateSurvival();
        }
        GameState.tickBuffs();

        // Advance day every 10 exploration actions
        if (GameState.turnCount % 10 === 0) {
            GameState.advanceDay();
        }

        // Advance crops
        this.advanceCrops();

        // NPC production
        if (typeof Base !== 'undefined') Base.processNPCProduction();

        // Update threat level
        GameState.updateThreatLevel();

        const location = WORLD.locations[GameState.currentLocation];
        if (!location) return;

        // Check for base raid
        if (GameState.shouldTriggerRaid()) {
            this.triggerRaid();
            return;
        }

        // Random event selection
        const roll = Math.random();

        if (roll < 0.32) {
            // Combat encounter
            Narrative.addFlavor(Narrative.getAmbientText());
            this.triggerRandomCombat();
        } else if (roll < 0.50) {
            // Find supplies
            this.findSupplies();
        } else if (roll < 0.62) {
            // Region-specific event (falls back to ambient text)
            if (!this.maybeTriggerEvent()) {
                Narrative.showExploration(GameState.currentLocation);
            }
        } else if (roll < 0.66) {
            // Resonant Shrine — rare chance to attune an Echo of Ruun
            if (typeof Echoes !== 'undefined' && Echoes.available().length > 0 && Math.random() < 0.35) {
                this.triggerResonantShrine();
            } else {
                Narrative.showExploration(GameState.currentLocation);
            }
        } else if (roll < 0.78) {
            // Ambient/lore text
            Narrative.showExploration(GameState.currentLocation);
        } else if (roll < 0.86) {
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

        // Chance to discover a recipe from exploration (ruins, caches)
        if (Math.random() < 0.08 && typeof RECIPES !== 'undefined') {
            const allRecipes = Object.keys(RECIPES);
            const undiscovered = allRecipes.filter(k => !GameState.isRecipeDiscovered(k));
            if (undiscovered.length > 0) {
                const recipeKey = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                GameState.discoverRecipe(recipeKey);
                Narrative.addLoot('You find weathered blueprints among the debris!');
            }
        }

        HUD.update();
    },

    rest() {
        const healAmount = Math.floor(GameState.player.maxHp * 0.3);
        const mpHeal = Math.floor(GameState.player.maxMp * 0.2);
        GameState.healPlayer(healAmount, mpHeal);

        Narrative.addSeparator();

        // Survival effects of resting
        if (GameState.survival) {
            const s = GameState.survival;
            const atCamp = GameState.currentLocation === 'player_camp';
            const hasShelter = GameState.base && GameState.base.buildings && GameState.base.buildings.shelter;

            if (atCamp && hasShelter) {
                s.fatigue = Math.max(0, s.fatigue - 40);
                s.morale = Math.min(100, s.morale + 10);
                Narrative.addFlavor('You rest in your shelter. Warm walls keep the darkness at bay. You feel renewed.');
            } else {
                s.fatigue = Math.max(0, s.fatigue - 20);
                s.morale = Math.min(100, s.morale + 3);
                Narrative.addFlavor('You find a sheltered spot and rest for a while. The world is still dangerous, but for this moment, you are safe.');
            }
            GameState.updateSurvival();
        } else {
            Narrative.addFlavor('You find a sheltered spot and rest for a while. The world is still dangerous, but for this moment, you are safe.');
        }

        Narrative.addHeal(`Restored ${healAmount} HP and ${mpHeal} MP.`);

        // Small chance of ambush (lower at camp)
        const ambushChance = GameState.currentLocation === 'player_camp' ? 0.05 : 0.15;
        if (Math.random() < ambushChance) {
            Narrative.addFlavor('Your rest is interrupted by the sound of approaching footsteps...');
            setTimeout(() => this.triggerRandomCombat(), 1000);
        }

        GameState.turnCount++;
        GameState.tickBuffs();
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
        html += `<button class="action-btn" onclick="Game.closePanel()" style="margin-top:1rem">Close</button>`;

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

        // Travel is tiring
        if (GameState.survival) {
            GameState.survival.fatigue = Math.min(100, GameState.survival.fatigue + 8);
        }

        if (typeof Audio !== 'undefined') Audio.startAmbient(regionKey);
        this.showCurrentLocation();
        HUD.update();
        GameState.save();
    },

    // ── Region Events ──
    _lastEventTurn: -10,

    REGION_EVENTS: {
        ashen_wastes: [
            {
                id: 'smoldering_cache', icon: '🔥', title: 'Smoldering Cache',
                text: 'A half-buried strongbox juts from the ash, its iron bands still glowing faintly with heat. Something rattles inside when the wind shifts.',
                choices: [
                    {
                        label: 'Pry it open', hint: 'Risk burns for treasure',
                        resolve() {
                            if (Math.random() < 0.6) {
                                const gold = 25 + Math.floor(Math.random() * 40);
                                GameState.player.gold += gold;
                                GameState.trackStat('goldEarned', gold);
                                Narrative.addLoot(`The lock crumbles. Inside: ${gold} gold, warm to the touch.`);
                                if (Math.random() < 0.4) {
                                    GameState.addToInventory('health_vial');
                                    Narrative.addLoot('A Health Vial survived the heat as well.');
                                }
                            } else {
                                const burn = Math.max(3, Math.floor(GameState.player.maxHp * 0.1));
                                GameState.player.hp = Math.max(1, GameState.player.hp - burn);
                                const gold = 5 + Math.floor(Math.random() * 10);
                                GameState.player.gold += gold;
                                Narrative.addStory(`The metal sears your hands — ${burn} damage. You salvage only ${gold} gold from the slag.`);
                            }
                        }
                    },
                    {
                        label: 'Leave it', hint: 'Some embers are better left buried',
                        resolve() { Narrative.addFlavor('You step around the cache. The wind buries it again behind you.'); }
                    }
                ]
            },
            {
                id: 'ashen_pilgrim', icon: '🧎', title: 'The Ashen Pilgrim',
                text: 'A pilgrim kneels in the ash, lips cracked, eyes white with cinder-blindness. "Water... or anything," they rasp. "I can still bless what I cannot see."',
                choices: [
                    {
                        label: 'Give a Health Vial', hint: 'Requires 1 Health Vial',
                        resolve() {
                            if (GameState.getInventoryCount('health_vial') > 0) {
                                GameState.removeFromInventory('health_vial');
                                GameState.player.karma = (GameState.player.karma || 0) + 1;
                                if (GameState.survival) GameState.survival.morale = Math.min(100, GameState.survival.morale + 10);
                                GameState.addBuff({ id: 'pilgrims_blessing', name: "Pilgrim's Blessing", icon: '🙏', stat: 'attack', amount: 3, duration: 20 });
                                Narrative.addStory('The pilgrim drinks, then presses a thumb of ash to your brow. Warmth spreads through your sword arm.');
                            } else {
                                Narrative.addSystem('You have no Health Vial to give. The pilgrim nods, understanding.');
                            }
                        }
                    },
                    {
                        label: 'Walk on', hint: 'The wastes take whom they take',
                        resolve() {
                            if (GameState.survival) GameState.survival.morale = Math.max(0, GameState.survival.morale - 5);
                            Narrative.addFlavor('You walk on. The praying shape dwindles behind you, swallowed by grey.');
                        }
                    }
                ]
            }
        ],
        hollowfen: [
            {
                id: 'drowned_reliquary', icon: '🌊', title: 'Drowned Reliquary',
                text: 'Beneath the black water, a stone shrine glimmers — votive offerings undisturbed for a century. The surface is still. Too still.',
                choices: [
                    {
                        label: 'Dive for the offerings', hint: 'The fen guards its dead',
                        resolve() {
                            const r = Math.random();
                            if (r < 0.5) {
                                const gold = 30 + Math.floor(Math.random() * 50);
                                GameState.player.gold += gold;
                                GameState.trackStat('goldEarned', gold);
                                Narrative.addLoot(`You surface gasping, fists full of votive silver — ${gold} gold.`);
                            } else if (r < 0.8) {
                                Narrative.addFlavor('Silt blooms around your hands. Whatever was here has long since dissolved.');
                                if (GameState.survival) GameState.survival.fatigue = Math.min(100, GameState.survival.fatigue + 8);
                            } else {
                                Narrative.addStory('Cold fingers close around your ankle. Something rises with you!');
                                setTimeout(() => Exploration.triggerRandomCombat(), 900);
                            }
                        }
                    },
                    {
                        label: 'Leave the dead their due', hint: 'Respect the fen',
                        resolve() {
                            GameState.player.karma = (GameState.player.karma || 0) + 1;
                            Narrative.addFlavor('You bow your head and move on. The water seems to sigh.');
                        }
                    }
                ]
            },
            {
                id: 'witchlight_wisps', icon: '✨', title: 'Witchlight Wisps',
                text: 'Pale lights bob between the trees, keeping pace with you. They drift toward a darker part of the fen, pausing — waiting.',
                choices: [
                    {
                        label: 'Follow the lights', hint: 'Wisps lie. Sometimes.',
                        resolve() {
                            if (Math.random() < 0.5) {
                                GameState.addToInventory(Math.random() < 0.5 ? 'mana_vial' : 'health_vial');
                                const gold = 15 + Math.floor(Math.random() * 20);
                                GameState.player.gold += gold;
                                Narrative.addLoot(`The wisps circle a hollow stump — a hidden cache! ${gold} gold and a vial inside.`);
                            } else {
                                if (GameState.survival) GameState.survival.fatigue = Math.min(100, GameState.survival.fatigue + 15);
                                Narrative.addStory('Hours later the lights scatter, laughing without sound. You are deeper in the fen and wearier for it.');
                            }
                        }
                    },
                    {
                        label: 'Ignore them', hint: 'Keep to your path',
                        resolve() { Narrative.addFlavor('You fix your eyes on the path. One by one, the lights wink out.'); }
                    }
                ]
            }
        ],
        void_sanctum: [
            {
                id: 'whispering_rift', icon: '🌀', title: 'Whispering Rift',
                text: 'A hairline crack in the air leaks whispers in a language that predates language. Listening hurts. Understanding would hurt more — and teach more.',
                choices: [
                    {
                        label: 'Listen', hint: 'Knowledge has a price',
                        resolve() {
                            const dmg = Math.max(5, Math.floor(GameState.player.maxHp * 0.12));
                            GameState.player.hp = Math.max(1, GameState.player.hp - dmg);
                            const xp = 30 + GameState.player.level * 8;
                            GameState.gainXp(xp);
                            Narrative.addStory(`The whispers carve themselves into your mind — ${dmg} damage, but +${xp} XP of terrible insight.`);
                            HUD.update();
                        }
                    },
                    {
                        label: 'Press your palm to the crack', hint: 'Seal it shut',
                        resolve() {
                            const xp = 10 + GameState.player.level * 3;
                            GameState.gainXp(xp);
                            if (GameState.survival) GameState.survival.morale = Math.min(100, GameState.survival.morale + 8);
                            Narrative.addStory(`The rift closes under your hand like a wound knitting. The silence afterward feels like gratitude. +${xp} XP.`);
                        }
                    }
                ]
            },
            {
                id: 'unraveled_soldier', icon: '⚔️', title: 'The Unraveled Soldier',
                text: 'A soldier stands mid-stride, frozen between seconds — half-erased by the Shattering. His sword arm is still whole. His eyes follow you.',
                choices: [
                    {
                        label: 'Take the essence from his armor', hint: 'He cannot stop you. Probably.',
                        resolve() {
                            GameState.addToInventory('void_essence');
                            Narrative.addLoot('You pry a sliver of crystallized void from the breastplate. The eyes never stop watching.');
                            if (Math.random() < 0.35) {
                                Narrative.addStory('The frozen second SNAPS. The soldier moves!');
                                setTimeout(() => Exploration.triggerRandomCombat(), 900);
                            }
                        }
                    },
                    {
                        label: 'Grant him mercy', hint: 'End the long moment',
                        resolve() {
                            GameState.player.karma = (GameState.player.karma || 0) + 2;
                            const heal = Math.floor(GameState.player.maxHp * 0.2);
                            GameState.healPlayer(heal);
                            Narrative.addStory(`You speak the old words of release. As he dissolves, something warm passes through you — ${heal} HP restored.`);
                            HUD.update();
                        }
                    }
                ]
            }
        ],
        shattered_spire: [
            {
                id: 'resonant_crystal', icon: '💎', title: 'Resonant Crystal',
                text: 'A man-high crystal hums at the frequency of your own heartbeat. Arcane power cycles through it like breath, looking for somewhere to go.',
                choices: [
                    {
                        label: 'Touch the facet', hint: 'Channel the charge',
                        resolve() {
                            if (Math.random() < 0.7) {
                                GameState.player.mp = GameState.player.maxMp;
                                GameState.addBuff({ id: 'crystal_resonance', name: 'Crystal Resonance', icon: '💎', stat: 'magicAttack', amount: 4, duration: 15 });
                                Narrative.addStory('Power floods through you — MP fully restored, and the resonance lingers in your casting hand.');
                            } else {
                                const dmg = Math.max(4, Math.floor(GameState.player.maxHp * 0.08));
                                GameState.player.hp = Math.max(1, GameState.player.hp - dmg);
                                Narrative.addStory(`The charge arcs wild — ${dmg} damage. The crystal dims, almost apologetically.`);
                            }
                            HUD.update();
                        }
                    },
                    {
                        label: 'Chip off a shard', hint: 'Crafting material',
                        resolve() {
                            GameState.addToInventory('crystal_shard');
                            Narrative.addLoot('You work a singing shard free. Useful — and the crystal does not seem to mind.');
                        }
                    }
                ]
            }
        ]
    },

    maybeTriggerEvent() {
        // Cooldown: at least 6 turns between events
        if (GameState.turnCount - this._lastEventTurn < 6) return false;
        const pool = this.REGION_EVENTS[GameState.currentRegion];
        if (!pool || pool.length === 0) return false;
        const event = pool[Math.floor(Math.random() * pool.length)];
        this._lastEventTurn = GameState.turnCount;
        this.showEventOverlay(event);
        return true;
    },

    showEventOverlay(event) {
        const container = document.getElementById('game-container') || document.body;
        const overlay = document.createElement('div');
        overlay.className = 'skill-choice-overlay event-overlay';
        overlay.innerHTML = `
            <div class="skill-choice-panel event-panel">
                <div class="event-icon">${event.icon}</div>
                <div class="skill-choice-header event-title">${event.title}</div>
                <div class="event-text">${event.text}</div>
                <div class="skill-choice-options event-choices">
                    ${event.choices.map((c, i) => `
                        <button class="skill-choice-btn event-choice-btn" data-idx="${i}">
                            <div class="skill-choice-name">${c.label}</div>
                            <div class="skill-choice-desc">${c.hint || ''}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(overlay);

        overlay.querySelectorAll('.event-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const choice = event.choices[parseInt(btn.dataset.idx)];
                overlay.remove();
                Narrative.addSeparator();
                Narrative.addAction(event.title);
                if (choice && choice.resolve) choice.resolve();
                HUD.update();
                GameState.save();
            });
        });
    },

    triggerResonantShrine() {
        Narrative.addSeparator();
        Narrative.addStory('You find a Resonant Shrine — a standing shard of the old world, humming with trapped echoes of the Shattering.');
        setTimeout(() => {
            Echoes.showOffering(2,
                'A Resonant Shrine',
                'The shard offers a fragment of itself — attune one Echo',
                null);
        }, 800);
    },

    // ── Crop Advancement ──
    // Growth lives in the Homestead engine (seasons, watering, soil)
    advanceCrops() {
        if (typeof Homestead !== 'undefined') Homestead.tickGrowth(1);
    },

    // ── Base Threat: Raids ──
    triggerRaid() {
        GameState.lastRaidDay = GameState.survival ? GameState.survival.dayCount : 0;

        const region = WORLD.regions[GameState.currentRegion];
        if (!region || !region.enemies || !region.enemies.length) return;

        // Determine raid difficulty based on threat level
        const threatScale = Math.min(2.0, 1 + GameState.threatLevel / 100);

        Narrative.addSeparator();
        Narrative.addStory('A commotion breaks the silence — your camp is under attack!');

        // Raid flavor based on region
        const raidText = {
            ashen_wastes: 'Scorched bandits have tracked the smoke from your forge!',
            hollowfen: 'Bog creatures crawl from the murk, drawn by your presence!',
            void_sanctum: 'Void acolytes phase through reality, drawn by your growing power!'
        };
        Narrative.addFlavor(raidText[GameState.currentRegion] || 'Raiders attack your camp!');

        // Pick a raider from the region
        const raidEnemy = region.enemies[Math.floor(Math.random() * region.enemies.length)];

        setTimeout(() => {
            if (typeof Combat !== 'undefined') {
                Combat.start(raidEnemy, (result) => {
                    if (result === 'victory') {
                        Narrative.addStory('You drive off the attackers! Your camp is safe... for now.');
                        if (GameState.survival) GameState.survival.morale = Math.min(100, GameState.survival.morale + 8);
                        // Bonus loot from raids
                        const gold = 10 + Math.floor(Math.random() * 30);
                        GameState.player.gold += gold;
                        Narrative.addLoot(`You recover ${gold} gold from the raiders.`);
                    } else {
                        Narrative.addSystem('The raiders ransack your supplies before retreating.');
                        if (GameState.survival) GameState.survival.morale = Math.max(0, GameState.survival.morale - 15);
                    }
                    GameState.updateThreatLevel();
                    HUD.update();
                });
            }
        }, 1200);
    }
};
