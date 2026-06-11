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

    // ── Survival System ──
    survival: {
        temperature: 50,     // 0=freezing, 50=comfortable, 100=scorching
        fatigue: 0,          // 0=rested, 100=exhausted
        morale: 70,          // 0=despairing, 100=inspired
        season: 'summer',    // spring/summer/autumn/winter
        seasonDay: 0,        // days within current season (0-29)
        dayCount: 0          // total days survived
    },

    // ── Active Buffs (from food, potions, shelter) ──
    activeBuffs: [],   // { id, name, icon, stat, amount, duration, maxDuration }

    // ── Recipe Discovery ──
    discoveredRecipes: null,  // Set of recipe keys; null = discover all basic

    // ── Camp NPC Roles ──
    campNPCs: [],  // { id, name, icon, role, productivity, morale }

    // ── Base Threat Tracking ──
    threatLevel: 0,       // 0-100, increases with base progress
    lastRaidDay: -10,     // day count of last raid
    raidWarning: false,

    // Statistics and achievements
    stats: {
        enemiesKilled: 0,
        bossesKilled: 0,
        totalDamageDealt: 0,
        totalDamageReceived: 0,
        goldEarned: 0,
        goldSpent: 0,
        itemsCrafted: 0,
        fishCaught: 0,
        resourcesGathered: 0,
        deathCount: 0,
        maxCombo: 0,
        criticalHits: 0,
        regionsDiscovered: 0,
        questsCompleted: 0,
        buildingsBuilt: 0,
        highestLevel: 1,
        playTime: 0,
        _lastTick: 0
    },
    achievements: {},
    _achievementDefs: {
        first_blood:      { name: 'First Blood',        desc: 'Defeat your first enemy',           check: s => s.enemiesKilled >= 1 },
        slayer_10:        { name: 'Slayer',              desc: 'Defeat 10 enemies',                 check: s => s.enemiesKilled >= 10 },
        slayer_50:        { name: 'Veteran Slayer',      desc: 'Defeat 50 enemies',                 check: s => s.enemiesKilled >= 50 },
        slayer_100:       { name: 'Legendary Slayer',    desc: 'Defeat 100 enemies',                check: s => s.enemiesKilled >= 100 },
        boss_1:           { name: 'Kingslayer',          desc: 'Defeat the Ashen King',             check: (s,g) => g.bossesDefeated.includes('the_ashen_king') },
        boss_2:           { name: 'Mother\'s Bane',      desc: 'Defeat the Mother of the Fen',      check: (s,g) => g.bossesDefeated.includes('mother_of_the_fen') },
        boss_3:           { name: 'Unraveled',           desc: 'Defeat Ruun, the Unraveler',        check: (s,g) => g.bossesDefeated.includes('ruun_the_unraveler') },
        all_bosses:       { name: 'Champion of Kaelith', desc: 'Defeat all three bosses',           check: (s,g) => g.bossesDefeated.length >= 3 },
        level_5:          { name: 'Seasoned',            desc: 'Reach level 5',                     check: s => s.highestLevel >= 5 },
        level_10:         { name: 'Master',              desc: 'Reach level 10',                    check: s => s.highestLevel >= 10 },
        gold_100:         { name: 'Coin Collector',      desc: 'Earn 100 gold total',               check: s => s.goldEarned >= 100 },
        gold_1000:        { name: 'Wealthy',             desc: 'Earn 1000 gold total',              check: s => s.goldEarned >= 1000 },
        combo_5:          { name: 'Combo Master',        desc: 'Achieve a 5x combo',                check: s => s.maxCombo >= 5 },
        combo_10:         { name: 'Relentless',          desc: 'Achieve a 10x combo',               check: s => s.maxCombo >= 10 },
        fish_10:          { name: 'Angler',              desc: 'Catch 10 fish',                     check: s => s.fishCaught >= 10 },
        crafter:          { name: 'Artisan',             desc: 'Craft 5 items',                     check: s => s.itemsCrafted >= 5 },
        builder:          { name: 'Architect',           desc: 'Build 3 structures',                check: s => s.buildingsBuilt >= 3 },
        explorer:         { name: 'Wanderer',            desc: 'Discover all 3 regions',            check: s => s.regionsDiscovered >= 3 },
        survivor:         { name: 'Survivor',            desc: 'Die and return 3 times',            check: s => s.deathCount >= 3 },
        crit_50:          { name: 'Precision',           desc: 'Land 50 critical hits',             check: s => s.criticalHits >= 50 },
        echo_first:       { name: 'Resonant',            desc: 'Attune your first Echo of Ruun',    check: (s,g) => !!(g.player && g.player.echoes && g.player.echoes.length >= 1) },
        echo_5:           { name: 'Shard Bearer',        desc: 'Attune 5 Echoes of Ruun',           check: (s,g) => !!(g.player && g.player.echoes && g.player.echoes.length >= 5) },
    },

    // ── Survival Methods ──

    updateSurvival() {
        if (!this.player) return;
        const s = this.survival;

        // Temperature based on region, time of day, season, shelter
        const regionTemp = { ashen_wastes: 65, hollowfen: 40, void_sanctum: 30 };
        let baseTemp = regionTemp[this.currentRegion] || 50;

        // Season modifier
        const seasonMod = { spring: -5, summer: 10, autumn: -10, winter: -25 };
        baseTemp += seasonMod[s.season] || 0;

        // Time of day (night is colder)
        if (typeof WorldMap !== 'undefined') {
            const tod = WorldMap.timeOfDay;
            if (tod < 0.2 || tod > 0.8) baseTemp -= 15;  // Night
            else if (tod > 0.4 && tod < 0.6) baseTemp += 5;  // Midday
        }

        // Shelter warmth
        if (this.currentLocation === 'player_camp' && this.base && this.base.buildings.shelter) {
            baseTemp = Math.max(baseTemp, 45);  // Shelter keeps you warm
        }

        // Smooth temperature transition
        s.temperature += (Math.max(0, Math.min(100, baseTemp)) - s.temperature) * 0.15;

        // Fatigue increases with exploration, combat, harsh conditions
        if (s.temperature < 25 || s.temperature > 80) {
            s.fatigue = Math.min(100, s.fatigue + 0.5);  // Harsh weather is tiring
        }

        // Morale decay toward baseline
        const baseMorale = 50;
        if (s.morale > baseMorale) s.morale -= 0.2;
        if (s.morale < baseMorale) s.morale += 0.1;

        // At camp with house: morale boost
        if (this.currentLocation === 'player_camp' && this.base && this.base.buildings.house) {
            s.morale = Math.min(100, s.morale + 0.5);
        }

        s.temperature = Math.max(0, Math.min(100, s.temperature));
        s.fatigue = Math.max(0, Math.min(100, s.fatigue));
        s.morale = Math.max(0, Math.min(100, s.morale));
    },

    advanceDay() {
        const s = this.survival;
        s.dayCount++;
        s.seasonDay++;
        if (s.seasonDay >= 30) {
            s.seasonDay = 0;
            const seasons = ['spring', 'summer', 'autumn', 'winter'];
            const idx = seasons.indexOf(s.season);
            s.season = seasons[(idx + 1) % 4];
            if (typeof Notifications !== 'undefined') {
                Notifications.show(`Season changed: ${s.season.charAt(0).toUpperCase() + s.season.slice(1)}`, 'gold');
            }
        }

        // Homestead daily tick: plots dry, saplings grow, golems mine, sprites harvest
        if (typeof Homestead !== 'undefined') Homestead.processDay();
    },

    // Get survival stat modifiers for combat/exploration
    getSurvivalModifiers() {
        const s = this.survival;
        const mods = { attack: 0, defense: 0, speed: 0, xpBonus: 0 };

        // Fatigue penalties
        if (s.fatigue > 70) { mods.attack -= 3; mods.defense -= 2; mods.speed -= 2; }
        else if (s.fatigue > 40) { mods.attack -= 1; mods.speed -= 1; }

        // Temperature penalties
        if (s.temperature < 20) { mods.speed -= 3; mods.defense -= 1; }  // Freezing
        else if (s.temperature > 85) { mods.speed -= 2; mods.attack -= 1; }  // Scorching

        // Morale bonuses
        if (s.morale > 80) { mods.attack += 2; mods.xpBonus += 0.1; }  // Inspired
        else if (s.morale < 20) { mods.attack -= 2; mods.xpBonus -= 0.1; }  // Despairing

        return mods;
    },

    // ── Active Buff System ──

    addBuff(buff) {
        if (!this.activeBuffs) this.activeBuffs = [];
        // Remove existing buff of same id
        this.activeBuffs = this.activeBuffs.filter(b => b.id !== buff.id);
        this.activeBuffs.push(Object.assign({}, buff, { maxDuration: buff.duration }));
        this.recalculateStats();
        if (typeof Notifications !== 'undefined') {
            Notifications.show(`${buff.icon || '+'} ${buff.name}`, 'green');
        }
    },

    tickBuffs() {
        if (!this.activeBuffs || this.activeBuffs.length === 0) return;
        this.activeBuffs = this.activeBuffs.filter(b => {
            b.duration--;
            return b.duration > 0;
        });
        this.recalculateStats();
    },

    getBuffTotal(stat) {
        if (!this.activeBuffs) return 0;
        return this.activeBuffs
            .filter(b => b.stat === stat)
            .reduce((sum, b) => sum + (b.amount || 0), 0);
    },

    // ── Recipe Discovery ──

    isRecipeDiscovered(recipeKey) {
        // If discovery system not initialized, all tier 0 recipes are known
        if (!this.discoveredRecipes) return true;
        return this.discoveredRecipes.includes(recipeKey);
    },

    discoverRecipe(recipeKey) {
        if (!this.discoveredRecipes) this.discoveredRecipes = [];
        if (this.discoveredRecipes.includes(recipeKey)) return false;
        this.discoveredRecipes.push(recipeKey);
        const recipe = typeof RECIPES !== 'undefined' ? RECIPES[recipeKey] : null;
        if (recipe && typeof Notifications !== 'undefined') {
            Notifications.show(`Recipe discovered: ${recipe.name}!`, 'gold');
        }
        return true;
    },

    // ── Base Threat System ──

    updateThreatLevel() {
        if (!this.base) return;
        let threat = 0;
        const b = this.base.buildings;
        // More buildings = more visible = more threat
        threat += Object.keys(b).filter(k => b[k]).length * 8;
        // Forge smoke attracts raiders
        if (b.forge) threat += 10;
        // Bright lights attract attention
        if (b.lookout) threat += 5;
        // Ward stones reduce threat
        if (b.ward_stones) threat -= 15;
        // More bosses defeated = more aggression from remaining forces
        threat += (this.bossesDefeated.length || 0) * 10;
        this.threatLevel = Math.max(0, Math.min(100, threat));
    },

    shouldTriggerRaid() {
        const s = this.survival;
        const daysSinceRaid = s.dayCount - (this.lastRaidDay || 0);
        if (daysSinceRaid < 5) return false;  // Cooldown
        if (this.threatLevel < 20) return false;  // Too low
        // Probability scales with threat level
        const chance = (this.threatLevel / 100) * 0.15;
        return Math.random() < chance;
    },

    trackStat(key, amount) {
        if (!this.stats) this.stats = {};
        this.stats[key] = (this.stats[key] || 0) + (amount || 1);
        this.checkAchievements();
    },

    checkAchievements() {
        if (!this.achievements) this.achievements = {};
        for (const [id, def] of Object.entries(this._achievementDefs)) {
            if (this.achievements[id]) continue;
            if (def.check(this.stats, this)) {
                this.achievements[id] = { unlocked: true, time: Date.now() };
                if (typeof Notifications !== 'undefined') {
                    Notifications.show(`Achievement: ${def.name}!`, 'gold');
                }
                if (typeof Audio !== 'undefined') Audio.playLevelUp();
            }
        }
    },

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
            statusEffects: [],
            echoes: []
        };

        if (cls.startingEquipment[2]) {
            this.addToInventory(cls.startingEquipment[2], 3);
        }

        this.recalculateStats();

        this.questProgress = { main: { stage: 0, objectives: {} }, side: {} };
        this.base = {
            buildings: {}, crops: [], placeables: [], placedBuildings: [],
            plots: [], terraform: {},
            mine: { maxDepth: 0, totalMined: 0, runs: 0 },
            automation: { golems: 0, stockpile: {} }
        };
        this.currentRegion = 'ashen_wastes';
        this.currentLocation = 'ruined_outpost';
        this.playerMapPos = null;

        // Initialize survival
        this.survival = {
            temperature: 50, fatigue: 0, morale: 70,
            season: 'summer', seasonDay: 0, dayCount: 0
        };
        this.activeBuffs = [];
        this.discoveredRecipes = null;  // null = all tier 0 known
        this.campNPCs = [];
        this.threatLevel = 0;
        this.lastRaidDay = -10;
        this.raidWarning = false;

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

        // Apply enchantment bonuses
        if (p.enchantments) {
            for (const slot of Object.keys(p.enchantments)) {
                const ench = p.enchantments[slot];
                if (ench && ench.stat && typeof p[ench.stat] === 'number') {
                    p[ench.stat] += ench.amount;
                }
            }
        }

        // Apply active buff bonuses (food, potions, etc.)
        if (this.activeBuffs && this.activeBuffs.length > 0) {
            for (const buff of this.activeBuffs) {
                if (buff.stat && typeof p[buff.stat] === 'number') {
                    p[buff.stat] += buff.amount;
                }
                if (buff.stat === 'maxHp') p.maxHp += buff.amount;
                if (buff.stat === 'maxMp') p.maxMp += buff.amount;
            }
        }

        // Apply survival modifiers
        const survMods = this.getSurvivalModifiers();
        p.attack += survMods.attack;
        p.defense += survMods.defense;
        p.speed += survMods.speed;

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

            // Track highest level
            if (this.player.level > (this.stats.highestLevel || 1)) {
                this.stats.highestLevel = this.player.level;
            }

            // Check for skill tree unlocks
            this.checkSkillTreeUnlocks();
        }
        return leveled;
    },

    // Skill tree: track chosen abilities and pending choices
    pendingSkillChoice: null,

    checkSkillTreeUnlocks() {
        if (!this.player) return;
        const cls = CLASSES[this.player.class];
        if (!cls || !cls.skillTree) return;

        // Initialize skill choices tracking if needed
        if (!this.player.skillChoices) this.player.skillChoices = {};

        for (const tier of cls.skillTree) {
            if (this.player.level >= tier.level && !this.player.skillChoices[tier.level]) {
                // New tier unlocked — queue the choice
                this.pendingSkillChoice = tier;
                break;
            }
        }
    },

    selectSkillChoice(tierLevel, choiceIndex) {
        if (!this.player) return;
        const cls = CLASSES[this.player.class];
        if (!cls || !cls.skillTree) return;

        const tier = cls.skillTree.find(t => t.level === tierLevel);
        if (!tier || !tier.choices || !tier.choices[choiceIndex]) return;

        if (!this.player.skillChoices) this.player.skillChoices = {};
        if (this.player.skillChoices[tierLevel]) return; // already chosen

        const ability = tier.choices[choiceIndex];
        this.player.abilities.push(ability);
        this.player.skillChoices[tierLevel] = choiceIndex;
        this.pendingSkillChoice = null;

        // Check if there are more pending unlocks
        this.checkSkillTreeUnlocks();
        this.save();
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
        if (WORLD.regions[regionKey]) {
            WORLD.regions[regionKey].unlocked = true;
            this.trackStat('regionsDiscovered');
        }
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
        // Check if completing this objective finishes a quest/stage
        if (typeof Progression !== 'undefined') Progression.checkQuestCompletion();
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
                version: 4,
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
                worldMap: typeof WorldMap !== 'undefined' ? WorldMap.getSaveData() : null,
                stats: this.stats,
                achievements: this.achievements,
                // v4 additions
                survival: this.survival,
                activeBuffs: this.activeBuffs,
                discoveredRecipes: this.discoveredRecipes,
                campNPCs: this.campNPCs,
                threatLevel: this.threatLevel,
                lastRaidDay: this.lastRaidDay
            };
            localStorage.setItem('kaelith_ruun_save', JSON.stringify(saveData));
            if (typeof Game !== 'undefined' && Game.showAutoSaveIndicator) Game.showAutoSaveIndicator();
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
            if (!this.player.echoes) this.player.echoes = [];
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
            this.base = s.base || { buildings: {}, crops: [], placeables: [], placedBuildings: [] };
            if (!this.base.buildings) this.base.buildings = {};
            if (!this.base.crops) this.base.crops = [];
            if (!this.base.placeables) this.base.placeables = [];
            if (!this.base.placedBuildings) this.base.placedBuildings = [];
            if (!this.base.buildingLevels) this.base.buildingLevels = {};
            // Homestead (v5): plots, terraform, mine, automation
            if (!this.base.plots) this.base.plots = [];
            if (!this.base.terraform) this.base.terraform = {};
            if (!this.base.mine) this.base.mine = { maxDepth: 0, totalMined: 0, runs: 0 };
            if (!this.base.automation) this.base.automation = { golems: 0, stockpile: {} };
            if (!this.base.automation.stockpile) this.base.automation.stockpile = {};
            // Migrate legacy crop list into the plot system
            if (this.base.crops && this.base.crops.length > 0) {
                this.base.crops.forEach(c => {
                    this.base.plots.push({
                        soil: 1, watered: false, fertilized: false,
                        crop: c.type, growth: c.growth || 0,
                        harvests: 0, wateredTurns: 0, totalTurns: 0
                    });
                });
                this.base.crops = [];
            }
            if (!this.player.enchantments) this.player.enchantments = {};
            this.MAX_INVENTORY_SIZE = s.maxInventorySize || 40;

            // Load stats and achievements
            if (s.stats) {
                this.stats = Object.assign({}, this.stats, s.stats);
            }
            if (s.achievements) {
                this.achievements = s.achievements;
            }

            // Load survival systems (v4)
            if (s.survival) {
                this.survival = Object.assign({
                    temperature: 50, fatigue: 0, morale: 70,
                    season: 'summer', seasonDay: 0, dayCount: 0
                }, s.survival);
            }
            this.activeBuffs = s.activeBuffs || [];
            this.discoveredRecipes = s.discoveredRecipes || null;
            this.campNPCs = s.campNPCs || [];
            this.threatLevel = s.threatLevel || 0;
            this.lastRaidDay = s.lastRaidDay || -10;

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
