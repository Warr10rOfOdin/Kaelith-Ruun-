// ============================================
// GAME STATE MANAGER
// ============================================

const GameState = {
    player: null,
    currentScreen: 'title',
    currentRegion: null,
    currentLocation: null,
    combatState: null,
    questProgress: null,
    flags: {},
    turnCount: 0,
    discoveredLore: [],
    bossesDefeated: [],
    visitedLocations: [],
    dialogueHistory: [],

    MAX_INVENTORY_SIZE: 40,

    initialize(name, raceKey, classKey) {
        const race = RACES[raceKey];
        const cls = CLASSES[classKey];
        if (!race || !cls) return;

        const baseStats = {
            str: 5 + race.stats.str + cls.stats.str,
            dex: 5 + race.stats.dex + cls.stats.dex,
            int: 5 + race.stats.int + cls.stats.int,
            wis: 5 + race.stats.wis + cls.stats.wis,
            con: 5 + race.stats.con + cls.stats.con,
            cha: 5 + race.stats.cha + cls.stats.cha
        };

        const maxHp = 50 + (baseStats.con * 3) + race.hpBonus;
        const maxMp = 30 + (baseStats.int * 2) + (baseStats.wis) + race.mpBonus;

        this.player = {
            name,
            race: raceKey,
            class: classKey,
            level: 1,
            xp: 0,
            xpToNext: 100,
            gold: 25,
            karma: 0,

            stats: baseStats,
            maxHp,
            hp: maxHp,
            maxMp,
            mp: maxMp,

            attack: baseStats.str + (cls.stats.str * 2),
            defense: Math.floor(baseStats.con * 0.8),
            magicAttack: baseStats.int + (cls.stats.int * 2),
            magicDefense: Math.floor(baseStats.wis * 0.8),
            speed: baseStats.dex,
            critChance: 5 + Math.floor(baseStats.dex * 0.5),

            abilities: [...cls.startingAbilities],
            equipment: {
                weapon: cls.startingEquipment[0] || null,
                armor: cls.startingEquipment[1] || null,
                offhand: null,
                accessory: null
            },
            inventory: [],
            buffs: [],
            debuffs: [],
            statusEffects: []
        };

        // Add starting consumable to inventory
        if (cls.startingEquipment[2]) {
            this.addToInventory(cls.startingEquipment[2], 3);
        }

        // Apply equipment stats
        this.recalculateStats();

        // Initialize quest progress
        this.questProgress = {
            main: { stage: 0, objectives: {} },
            side: {}
        };

        // Start in the Ashen Wastes
        this.currentRegion = 'ashen_wastes';
        this.currentLocation = 'ruined_outpost';

        this.save();
    },

    recalculateStats() {
        if (!this.player) return;
        const p = this.player;
        const cls = CLASSES[p.class];
        if (!cls) return;

        let bonusAttack = 0, bonusDefense = 0, bonusMagicAttack = 0;
        let bonusMagicDefense = 0, bonusSpeed = 0, bonusCritChance = 0;

        // Equipment bonuses
        for (const slot of Object.keys(p.equipment)) {
            const itemKey = p.equipment[slot];
            if (itemKey && ITEMS[itemKey]) {
                const item = ITEMS[itemKey];
                if (item.stats) {
                    bonusAttack += item.stats.attack || 0;
                    bonusDefense += item.stats.defense || 0;
                    bonusMagicAttack += item.stats.magicAttack || 0;
                    bonusMagicDefense += item.stats.magicDefense || 0;
                    bonusSpeed += item.stats.speed || 0;
                    bonusCritChance += item.stats.critChance || 0;
                }
            }
        }

        p.attack = p.stats.str + (cls.stats.str * 2) + bonusAttack;
        p.defense = Math.floor(p.stats.con * 0.8) + bonusDefense;
        p.magicAttack = p.stats.int + (cls.stats.int * 2) + bonusMagicAttack;
        p.magicDefense = Math.floor(p.stats.wis * 0.8) + bonusMagicDefense;
        p.speed = p.stats.dex + bonusSpeed;
        p.critChance = 5 + Math.floor(p.stats.dex * 0.5) + bonusCritChance;
    },

    addToInventory(itemKey, quantity = 1) {
        if (!this.player) return false;
        const item = ITEMS[itemKey];
        if (!item) return false;

        if (item.stackable) {
            const existing = this.player.inventory.find(i => i.key === itemKey);
            if (existing) {
                existing.quantity += quantity;
                return true;
            }
            if (this.player.inventory.length >= this.MAX_INVENTORY_SIZE) {
                if (typeof Notifications !== 'undefined') {
                    Notifications.show('Inventory is full!', 'red');
                }
                return false;
            }
            this.player.inventory.push({ key: itemKey, quantity });
        } else {
            for (let i = 0; i < quantity; i++) {
                if (this.player.inventory.length >= this.MAX_INVENTORY_SIZE) {
                    if (typeof Notifications !== 'undefined') {
                        Notifications.show('Inventory is full!', 'red');
                    }
                    return i > 0;
                }
                this.player.inventory.push({ key: itemKey, quantity: 1 });
            }
        }
        return true;
    },

    removeFromInventory(itemKey, quantity = 1) {
        if (!this.player) return false;
        const idx = this.player.inventory.findIndex(i => i.key === itemKey);
        if (idx === -1) return false;

        const entry = this.player.inventory[idx];
        entry.quantity -= quantity;
        if (entry.quantity <= 0) {
            this.player.inventory.splice(idx, 1);
        }
        return true;
    },

    getInventoryCount(itemKey) {
        if (!this.player) return 0;
        const entry = this.player.inventory.find(i => i.key === itemKey);
        return entry ? entry.quantity : 0;
    },

    equipItem(itemKey) {
        const item = ITEMS[itemKey];
        if (!item || !item.slot || !this.player) return false;

        const currentEquipped = this.player.equipment[item.slot];
        if (currentEquipped) {
            this.addToInventory(currentEquipped);
        }

        this.removeFromInventory(itemKey);
        this.player.equipment[item.slot] = itemKey;
        this.recalculateStats();
        return true;
    },

    gainXp(amount) {
        if (!this.player) return false;
        this.player.xp += amount;
        let leveled = false;

        while (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level++;
            this.player.xpToNext = Math.floor(100 * Math.pow(1.5, this.player.level - 1));

            const cls = CLASSES[this.player.class];
            if (!cls) break;

            this.player.maxHp += cls.hpPerLevel + Math.floor(this.player.stats.con * 0.5);
            this.player.maxMp += cls.mpPerLevel + Math.floor(this.player.stats.int * 0.3);
            this.player.hp = this.player.maxHp;
            this.player.mp = this.player.maxMp;

            // Stat growth — validate stat keys exist
            if (cls.primaryStat && this.player.stats[cls.primaryStat] !== undefined) {
                this.player.stats[cls.primaryStat] += 1;
            }
            if (cls.secondaryStat && this.player.stats[cls.secondaryStat] !== undefined) {
                if (Math.random() < 0.5) {
                    this.player.stats[cls.secondaryStat] += 1;
                }
            }

            this.recalculateStats();
            leveled = true;
        }

        return leveled;
    },

    healPlayer(hp, mp = 0) {
        if (!this.player) return;
        if (hp > 0) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + hp);
        }
        if (mp > 0) {
            this.player.mp = Math.min(this.player.maxMp, this.player.mp + mp);
        }
    },

    damagePlayer(amount) {
        if (!this.player) return 0;
        const actualDamage = Math.max(1, amount - this.player.defense);
        this.player.hp = Math.max(0, this.player.hp - actualDamage);
        return actualDamage;
    },

    isPlayerDead() {
        return this.player && this.player.hp <= 0;
    },

    unlockRegion(regionKey) {
        if (WORLD.regions[regionKey]) {
            WORLD.regions[regionKey].unlocked = true;
        }
    },

    completeObjective(questType, questId, objectiveId) {
        if (!this.questProgress) return;

        if (questType === 'main') {
            if (!this.questProgress.main) {
                this.questProgress.main = { stage: 0, objectives: {} };
            }
            if (!this.questProgress.main.objectives) {
                this.questProgress.main.objectives = {};
            }
            this.questProgress.main.objectives[objectiveId] = true;
        } else {
            if (!this.questProgress.side) {
                this.questProgress.side = {};
            }
            if (!this.questProgress.side[questId]) {
                this.questProgress.side[questId] = {};
            }
            this.questProgress.side[questId][objectiveId] = true;
        }
    },

    isObjectiveComplete(questType, questId, objectiveId) {
        if (!this.questProgress) return false;

        if (questType === 'main') {
            return !!(this.questProgress.main &&
                      this.questProgress.main.objectives &&
                      this.questProgress.main.objectives[objectiveId]);
        }
        return !!(this.questProgress.side &&
                  this.questProgress.side[questId] &&
                  this.questProgress.side[questId][objectiveId]);
    },

    save() {
        try {
            if (!this.player) return;
            const saveData = {
                version: 2,
                player: this.player,
                currentRegion: this.currentRegion,
                currentLocation: this.currentLocation,
                questProgress: this.questProgress,
                flags: this.flags,
                turnCount: this.turnCount,
                discoveredLore: this.discoveredLore,
                bossesDefeated: this.bossesDefeated,
                visitedLocations: this.visitedLocations,
                unlockedRegions: Object.keys(WORLD.regions).filter(k => WORLD.regions[k].unlocked)
            };
            localStorage.setItem('kaelith_ruun_save', JSON.stringify(saveData));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    },

    load() {
        try {
            const data = localStorage.getItem('kaelith_ruun_save');
            if (!data) return false;

            const saveData = JSON.parse(data);

            // Validate save has required fields
            if (!saveData.player || !saveData.player.name || !saveData.player.race || !saveData.player.class) {
                console.warn('Invalid save data — missing player data');
                return false;
            }

            this.player = saveData.player;

            // Ensure all required player fields exist (handle old saves)
            if (!this.player.buffs) this.player.buffs = [];
            if (!this.player.debuffs) this.player.debuffs = [];
            if (!this.player.statusEffects) this.player.statusEffects = [];
            if (!this.player.inventory) this.player.inventory = [];
            if (!this.player.abilities) this.player.abilities = [];
            if (!this.player.equipment) {
                this.player.equipment = { weapon: null, armor: null, offhand: null, accessory: null };
            }
            if (!this.player.stats) {
                this.player.stats = { str: 5, dex: 5, int: 5, wis: 5, con: 5, cha: 5 };
            }
            if (typeof this.player.gold !== 'number') this.player.gold = 0;
            if (typeof this.player.xp !== 'number') this.player.xp = 0;
            if (typeof this.player.xpToNext !== 'number') this.player.xpToNext = 100;
            if (typeof this.player.maxHp !== 'number' || this.player.maxHp <= 0) this.player.maxHp = 50;
            if (typeof this.player.maxMp !== 'number' || this.player.maxMp <= 0) this.player.maxMp = 30;

            // Clamp HP/MP to valid range
            this.player.hp = Math.max(1, Math.min(this.player.hp || 1, this.player.maxHp));
            this.player.mp = Math.max(0, Math.min(this.player.mp || 0, this.player.maxMp));

            this.currentRegion = saveData.currentRegion || 'ashen_wastes';
            this.currentLocation = saveData.currentLocation || 'ruined_outpost';

            // Validate quest progress structure
            this.questProgress = saveData.questProgress || { main: { stage: 0, objectives: {} }, side: {} };
            if (!this.questProgress.main) this.questProgress.main = { stage: 0, objectives: {} };
            if (!this.questProgress.main.objectives) this.questProgress.main.objectives = {};
            if (!this.questProgress.side) this.questProgress.side = {};

            this.flags = saveData.flags || {};
            this.turnCount = saveData.turnCount || 0;
            this.discoveredLore = saveData.discoveredLore || [];
            this.bossesDefeated = saveData.bossesDefeated || [];
            this.visitedLocations = saveData.visitedLocations || [];

            if (saveData.unlockedRegions) {
                saveData.unlockedRegions.forEach(k => {
                    if (WORLD.regions[k]) WORLD.regions[k].unlocked = true;
                });
            }

            this.recalculateStats();
            return true;
        } catch (e) {
            console.warn('Failed to load:', e);
            return false;
        }
    },

    hasSave() {
        return !!localStorage.getItem('kaelith_ruun_save');
    },

    deleteSave() {
        localStorage.removeItem('kaelith_ruun_save');
    }
};
