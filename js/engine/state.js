// ============================================
// GAME STATE MANAGER
// ============================================

const GameState = {
    player: null,
    currentScreen: 'title',
    currentRegion: null,
    currentLocation: null,
    playerMapPos: null,
    combatState: null,
    questProgress: null,
    flags: {},
    turnCount: 0,
    discoveredLore: [],
    bossesDefeated: [],
    visitedLocations: [],
    dialogueHistory: [],
    base: null,

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
            maxHp, hp: maxHp,
            maxMp, mp: maxMp,
            attack: baseStats.str + (cls.stats.str * 2),
            defense: Math.floor(baseStats.con * 0.8),
            magicAttack: baseStats.int + (cls.stats.int * 2),
            magicDefense: Math.floor(baseStats.wis * 0.8),
            speed: baseStats.dex,
            critChance: 5 + Math.floor(baseStats.dex * 0.5),
            abilities: [...cls.startingAbilities],
            equipment: {
                weapon: cls.startingEquipment[0] || null,
                helmet: null,
                armor: cls.startingEquipment[1] || null,
                boots: null,
                offhand: null,
                accessory: null
            },
            inventory: [],
            buffs: [],
            debuffs: [],
            statusEffects: []
        };

        if (cls.startingEquipment[2]) {
            this.addToInventory(cls.startingEquipment[2], 3);
        }

        this.recalculateStats();

        this.questProgress = { main: { stage: 0, objectives: {} }, side: {} };
        this.base = { buildings: {}, crops: [], placeables: [] };
        this.currentRegion = 'ashen_wastes';
        this.currentLocation = 'ruined_outpost';
        this.playerMapPos = null;

        this.save();
    },

    recalculateStats() {
        if (!this.player) return;
        const p = this.player;
        const cls = CLASSES[p.class];
        if (!cls) return;

        let bAtk = 0, bDef = 0, bMAtk = 0, bMDef = 0, bSpd = 0, bCrit = 0;
        let bHp = 0, bMp = 0;
        for (const slot of Object.keys(p.equipment)) {
            const itemKey = p.equipment[slot];
            if (itemKey && ITEMS[itemKey]) {
                const item = ITEMS[itemKey];
                if (item.stats) {
                    const s = item.stats;
                    bAtk += s.attack || 0;
                    bDef += s.defense || 0;
                    bMAtk += s.magicAttack || 0;
                    bMDef += s.magicDefense || 0;
                    bSpd += s.speed || 0;
                    bCrit += s.critChance || 0;
                }
                if (item.bonusHp) bHp += item.bonusHp;
                if (item.bonusMp) bMp += item.bonusMp;
            }
        }
        p.attack = p.stats.str + (cls.stats.str * 2) + bAtk;
        p.defense = Math.floor(p.stats.con * 0.8) + bDef;
        p.magicAttack = p.stats.int + (cls.stats.int * 2) + bMAtk;
        p.magicDefense = Math.floor(p.stats.wis * 0.8) + bMDef;
        p.speed = p.stats.dex + bSpd;
        p.critChance = 5 + Math.floor(p.stats.dex * 0.5) + bCrit;

        // Apply bonus HP/MP from equipment (e.g., Ring of Vigor, Ring of Wisdom)
        const race = RACES[p.race];
        const baseMaxHp = 50 + (p.stats.con * 3) + (race ? race.hpBonus : 0) + ((p.level - 1) * (cls.hpPerLevel + Math.floor(p.stats.con * 0.5)));
        const baseMaxMp = 30 + (p.stats.int * 2) + p.stats.wis + (race ? race.mpBonus : 0) + ((p.level - 1) * (cls.mpPerLevel + Math.floor(p.stats.int * 0.3)));
        p.maxHp = baseMaxHp + bHp;
        p.maxMp = baseMaxMp + bMp;
        if (p.hp > p.maxHp) p.hp = p.maxHp;
        if (p.mp > p.maxMp) p.mp = p.maxMp;
    },

    addToInventory(itemKey, quantity = 1) {
        if (!this.player) return false;
        const item = ITEMS[itemKey];
        if (!item) return false;

        if (item.stackable) {
            const existing = this.player.inventory.find(i => i.key === itemKey);
            if (existing) { existing.quantity += quantity; return true; }
            if (this.player.inventory.length >= this.MAX_INVENTORY_SIZE) {
                if (typeof Notifications !== 'undefined') Notifications.show('Inventory is full!', 'red');
                return false;
            }
            this.player.inventory.push({ key: itemKey, quantity });
        } else {
            for (let i = 0; i < quantity; i++) {
                if (this.player.inventory.length >= this.MAX_INVENTORY_SIZE) {
                    if (typeof Notifications !== 'undefined') Notifications.show('Inventory is full!', 'red');
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
        this.player.inventory[idx].quantity -= quantity;
        if (this.player.inventory[idx].quantity <= 0) this.player.inventory.splice(idx, 1);
        return true;
    },

    getInventoryCount(itemKey) {
        if (!this.player) return 0;
        const e = this.player.inventory.find(i => i.key === itemKey);
        return e ? e.quantity : 0;
    },

    equipItem(itemKey) {
        const item = ITEMS[itemKey];
        if (!item || !item.slot || !this.player) return false;
        const cur = this.player.equipment[item.slot];
        if (cur) this.addToInventory(cur);
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
            if (cls.primaryStat && this.player.stats[cls.primaryStat] !== undefined)
                this.player.stats[cls.primaryStat] += 1;
            if (cls.secondaryStat && this.player.stats[cls.secondaryStat] !== undefined && Math.random() < 0.5)
                this.player.stats[cls.secondaryStat] += 1;
            this.recalculateStats();
            leveled = true;
        }
        return leveled;
    },

    healPlayer(hp, mp = 0) {
        if (!this.player) return;
        if (hp > 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + hp);
        if (mp > 0) this.player.mp = Math.min(this.player.maxMp, this.player.mp + mp);
    },

    damagePlayer(amount) {
        if (!this.player) return 0;
        const dmg = Math.max(1, amount - this.player.defense);
        this.player.hp = Math.max(0, this.player.hp - dmg);
        return dmg;
    },

    isPlayerDead() { return this.player && this.player.hp <= 0; },

    unlockRegion(regionKey) {
        if (WORLD.regions[regionKey]) WORLD.regions[regionKey].unlocked = true;
    },

    completeObjective(questType, questId, objectiveId) {
        if (!this.questProgress) return;
        if (questType === 'main') {
            if (!this.questProgress.main) this.questProgress.main = { stage: 0, objectives: {} };
            if (!this.questProgress.main.objectives) this.questProgress.main.objectives = {};
            this.questProgress.main.objectives[objectiveId] = true;
        } else {
            if (!this.questProgress.side) this.questProgress.side = {};
            if (!this.questProgress.side[questId]) this.questProgress.side[questId] = {};
            this.questProgress.side[questId][objectiveId] = true;
        }
    },

    isObjectiveComplete(questType, questId, objectiveId) {
        if (!this.questProgress) return false;
        if (questType === 'main')
            return !!(this.questProgress.main && this.questProgress.main.objectives && this.questProgress.main.objectives[objectiveId]);
        return !!(this.questProgress.side && this.questProgress.side[questId] && this.questProgress.side[questId][objectiveId]);
    },

    save() {
        try {
            if (!this.player) return;
            const saveData = {
                version: 3,
                player: this.player,
                currentRegion: this.currentRegion,
                currentLocation: this.currentLocation,
                playerMapPos: this.playerMapPos,
                questProgress: this.questProgress,
                flags: this.flags,
                turnCount: this.turnCount,
                discoveredLore: this.discoveredLore,
                bossesDefeated: this.bossesDefeated,
                visitedLocations: this.visitedLocations,
                unlockedRegions: Object.keys(WORLD.regions).filter(k => WORLD.regions[k].unlocked),
                base: this.base,
                maxInventorySize: this.MAX_INVENTORY_SIZE,
                worldMap: typeof WorldMap !== 'undefined' ? WorldMap.getSaveData() : null
            };
            localStorage.setItem('kaelith_ruun_save', JSON.stringify(saveData));
        } catch (e) { console.warn('Failed to save:', e); }
    },

    load() {
        try {
            const data = localStorage.getItem('kaelith_ruun_save');
            if (!data) return false;
            const s = JSON.parse(data);
            if (!s.player || !s.player.name || !s.player.race || !s.player.class) return false;

            this.player = s.player;
            if (!this.player.buffs) this.player.buffs = [];
            if (!this.player.debuffs) this.player.debuffs = [];
            if (!this.player.statusEffects) this.player.statusEffects = [];
            if (!this.player.inventory) this.player.inventory = [];
            if (!this.player.abilities) this.player.abilities = [];
            if (!this.player.equipment) this.player.equipment = { weapon: null, helmet: null, armor: null, boots: null, offhand: null, accessory: null };
            if (this.player.equipment.helmet === undefined) this.player.equipment.helmet = null;
            if (this.player.equipment.boots === undefined) this.player.equipment.boots = null;
            if (!this.player.stats) this.player.stats = { str: 5, dex: 5, int: 5, wis: 5, con: 5, cha: 5 };
            if (typeof this.player.gold !== 'number') this.player.gold = 0;
            if (typeof this.player.xp !== 'number') this.player.xp = 0;
            if (typeof this.player.xpToNext !== 'number') this.player.xpToNext = 100;
            if (typeof this.player.maxHp !== 'number' || this.player.maxHp <= 0) this.player.maxHp = 50;
            if (typeof this.player.maxMp !== 'number' || this.player.maxMp <= 0) this.player.maxMp = 30;
            this.player.hp = Math.max(1, Math.min(this.player.hp || 1, this.player.maxHp));
            this.player.mp = Math.max(0, Math.min(this.player.mp || 0, this.player.maxMp));

            this.currentRegion = s.currentRegion || 'ashen_wastes';
            this.currentLocation = s.currentLocation || 'ruined_outpost';
            this.playerMapPos = s.playerMapPos || null;
            this.questProgress = s.questProgress || { main: { stage: 0, objectives: {} }, side: {} };
            if (!this.questProgress.main) this.questProgress.main = { stage: 0, objectives: {} };
            if (!this.questProgress.main.objectives) this.questProgress.main.objectives = {};
            if (!this.questProgress.side) this.questProgress.side = {};
            this.flags = s.flags || {};
            this.turnCount = s.turnCount || 0;
            this.discoveredLore = s.discoveredLore || [];
            this.bossesDefeated = s.bossesDefeated || [];
            this.visitedLocations = s.visitedLocations || [];
            this.base = s.base || { buildings: {}, crops: [], placeables: [] };
            if (!this.base.buildings) this.base.buildings = {};
            if (!this.base.crops) this.base.crops = [];
            if (!this.base.placeables) this.base.placeables = [];
            this.MAX_INVENTORY_SIZE = s.maxInventorySize || 40;

            if (s.unlockedRegions) {
                s.unlockedRegions.forEach(k => { if (WORLD.regions[k]) WORLD.regions[k].unlocked = true; });
            }

            this.recalculateStats();

            // Load world map state
            if (s.worldMap && typeof WorldMap !== 'undefined') {
                WorldMap.loadSaveData(s.worldMap);
            } else if (this.currentLocation && typeof MAPS !== 'undefined' && MAPS[this.currentLocation]) {
                const pos = this.playerMapPos;
                if (typeof WorldMap !== 'undefined') WorldMap.loadMap(this.currentLocation, pos ? pos.x : undefined, pos ? pos.y : undefined);
            }

            return true;
        } catch (e) { console.warn('Failed to load:', e); return false; }
    },

    hasSave() { return !!localStorage.getItem('kaelith_ruun_save'); },
    deleteSave() { localStorage.removeItem('kaelith_ruun_save'); }
};
