// ============================================
// ITEMS DATA
// ============================================

const ITEMS = {
    // ---- WEAPONS ----
    rusted_void_sword: {
        name: 'Rusted Void Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A corroded blade that still hums with residual void energy.',
        stats: { attack: 5, speed: 0 }, value: 10
    },
    apprentice_staff: {
        name: 'Apprentice Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A gnarled wooden staff inscribed with novice runes.',
        stats: { attack: 3, magicAttack: 6 }, value: 10
    },
    chipped_daggers: {
        name: 'Chipped Daggers', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A pair of worn daggers, fast but fragile.',
        stats: { attack: 4, speed: 3, critChance: 5 }, value: 10
    },
    wardens_mace: {
        name: "Warden's Mace", icon: '🔨', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A heavy mace etched with protective sigils.',
        stats: { attack: 6, defense: 2 }, value: 10
    },
    bleeding_focus: {
        name: 'Bleeding Focus', icon: '🔴', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A crystal orb that resonates with spilled blood.',
        stats: { attack: 2, magicAttack: 5, lifesteal: 5 }, value: 10
    },
    iron_longsword: {
        name: 'Iron Longsword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A well-forged iron blade. Reliable if unexceptional.',
        stats: { attack: 8 }, value: 35
    },
    voidtouched_blade: {
        name: 'Voidtouched Blade', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'This blade flickers at the edges, as if not entirely present in this reality.',
        stats: { attack: 12, magicAttack: 4 }, value: 80
    },
    emberforged_axe: {
        name: 'Emberforged Axe', icon: '🪓', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'Forged in the eternal flames of the Ashborn ruins. Burns with each strike.',
        stats: { attack: 18, fireDamage: 8 }, value: 200
    },
    whisper_of_ruun: {
        name: 'Whisper of Ruun', icon: '🌀', type: 'weapon', slot: 'weapon',
        rarity: 'legendary', description: 'A blade forged from crystallized void-whispers. It speaks to those who listen.',
        stats: { attack: 28, magicAttack: 15, speed: 5, critChance: 10 }, value: 1000
    },

    // ---- CRAFTED WEAPONS ----
    iron_sword: {
        name: 'Iron Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A sturdy blade forged from smelted iron. Dependable.',
        stats: { attack: 10 }, value: 50
    },
    flame_blade: {
        name: 'Flame Blade', icon: '🔥', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'An iron sword infused with flame essence. Burns on contact.',
        stats: { attack: 15, fireDamage: 6 }, value: 120
    },
    veil_blade: {
        name: 'Veil Blade', icon: '🌀', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A blade that phases between realities. Strikes from impossible angles.',
        stats: { attack: 22, magicAttack: 10, critChance: 8 }, value: 350
    },
    fen_staff: {
        name: 'Fen Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'A staff cut from Hollowfen heartwood. Pulses with swamp magic.',
        stats: { attack: 5, magicAttack: 14, magicDefense: 4 }, value: 130
    },
    shadow_daggers: {
        name: 'Shadow Daggers', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'Twin blades forged in darkness. Almost invisible when held.',
        stats: { attack: 10, speed: 5, critChance: 12 }, value: 140
    },

    // ---- CRAFTED ARMOR ----
    warden_plate: {
        name: "Warden's Plate", icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Heavy plate armor inscribed with warding sigils.',
        stats: { defense: 12, magicDefense: 4 }, value: 150
    },
    bog_leather: {
        name: 'Bog Leather Armor', icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Armor tanned from swamp creature hides. Surprisingly resilient.',
        stats: { defense: 8, speed: 2, magicDefense: 3 }, value: 100
    },

    // ---- ARMOR ----
    tattered_cloak: {
        name: 'Tattered Cloak', icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'A worn traveler\'s cloak. Barely holds together.',
        stats: { defense: 2 }, value: 5
    },
    frayed_robes: {
        name: 'Frayed Robes', icon: '👘', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'Moth-eaten robes still faintly charged with arcane energy.',
        stats: { defense: 1, magicDefense: 3 }, value: 5
    },
    shadow_cowl: {
        name: 'Shadow Cowl', icon: '🧣', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'A dark cowl that blends with the shadows.',
        stats: { defense: 2, speed: 2 }, value: 5
    },
    soul_shield: {
        name: 'Soul Shield', icon: '🛡️', type: 'armor', slot: 'offhand',
        rarity: 'common', description: 'A shield housing a single protective spirit.',
        stats: { defense: 5 }, value: 15
    },
    crimson_wraps: {
        name: 'Crimson Wraps', icon: '🩹', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'Bandages soaked in alchemical blood. Uncomfortable but empowering.',
        stats: { defense: 2, magicAttack: 2 }, value: 5
    },
    chainmail_vest: {
        name: 'Chainmail Vest', icon: '🦺', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'Standard-issue chainmail. Dependable protection.',
        stats: { defense: 6 }, value: 40
    },
    runebound_plate: {
        name: 'Runebound Plate', icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'rare', description: 'Heavy armor inscribed with protective runes that glow when struck.',
        stats: { defense: 14, magicDefense: 6 }, value: 250
    },
    mantle_of_the_hollow: {
        name: 'Mantle of the Hollow', icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'epic', description: 'Woven from the shadows of the dead. Grants spectral resilience.',
        stats: { defense: 10, magicDefense: 12, speed: 3 }, value: 500
    },

    // ---- CONSUMABLES ----
    health_vial: {
        name: 'Health Vial', icon: '❤️', type: 'consumable', stackable: true,
        description: 'A small vial of crimson liquid. Restores 30 HP.',
        effect: { type: 'heal', stat: 'hp', amount: 30 }, value: 15
    },
    mana_vial: {
        name: 'Mana Vial', icon: '💙', type: 'consumable', stackable: true,
        description: 'A luminous blue potion. Restores 25 MP.',
        effect: { type: 'heal', stat: 'mp', amount: 25 }, value: 15
    },
    blood_flask: {
        name: 'Blood Flask', icon: '🩸', type: 'consumable', stackable: true,
        description: 'A flask of preserved blood. Restores 20 HP and 15 MP.',
        effect: { type: 'heal', stat: 'both', hpAmount: 20, mpAmount: 15 }, value: 20
    },
    smoke_bomb: {
        name: 'Smoke Bomb', icon: '💨', type: 'consumable', stackable: true,
        description: 'Guarantees escape from non-boss combat.',
        effect: { type: 'flee' }, value: 25
    },
    greater_health_potion: {
        name: 'Greater Health Potion', icon: '❤️', type: 'consumable', stackable: true,
        description: 'A large flask of concentrated healing elixir. Restores 80 HP.',
        effect: { type: 'heal', stat: 'hp', amount: 80 }, value: 50
    },
    antidote: {
        name: 'Antidote', icon: '💚', type: 'consumable', stackable: true,
        description: 'Cures poison and other toxins.',
        effect: { type: 'cure', status: 'poison' }, value: 20
    },
    elixir_of_power: {
        name: 'Elixir of Power', icon: '💪', type: 'consumable', stackable: true,
        description: 'Temporarily increases attack by 25% for the next combat.',
        effect: { type: 'buff', stat: 'attack', percent: 25, duration: 1 }, value: 60
    },

    // ---- RESOURCES ----
    wood: {
        name: 'Wood', icon: '🪵', type: 'resource', stackable: true,
        description: 'Salvaged lumber. Essential for building and repairs.',
        value: 3
    },
    iron_ore: {
        name: 'Iron Ore', icon: '🪨', type: 'resource', stackable: true,
        description: 'Raw iron ore. Can be smelted at a forge.',
        value: 5
    },
    iron_ingot: {
        name: 'Iron Ingot', icon: '🔩', type: 'resource', stackable: true,
        description: 'Smelted iron, ready for crafting.',
        value: 12
    },
    ember_root: {
        name: 'Ember Root', icon: '🌱', type: 'resource', stackable: true,
        description: 'A heat-loving root that glows faintly. Used in alchemy and gardening.',
        value: 8
    },
    flame_essence: {
        name: 'Flame Essence', icon: '🔥', type: 'resource', stackable: true,
        description: 'Captured fire from the eternal flames. Burns without consuming.',
        value: 25
    },
    veil_crystal: {
        name: 'Veil Crystal', icon: '💎', type: 'resource', stackable: true,
        description: 'A crystal formed where reality is thin. Hums with dimensional energy.',
        value: 40
    },
    bog_fiber: {
        name: 'Bog Fiber', icon: '🧵', type: 'resource', stackable: true,
        description: 'Tough fibrous material from swamp plants. Surprisingly strong.',
        value: 6
    },
    shadow_silk: {
        name: 'Shadow Silk', icon: '🕸️', type: 'resource', stackable: true,
        description: 'Silk spun by creatures between dimensions. Nearly invisible.',
        value: 30
    },
    stone: {
        name: 'Stone', icon: '🧱', type: 'resource', stackable: true,
        description: 'Solid stone blocks. Good for building.',
        value: 2
    },
    hide: {
        name: 'Hide', icon: '🦴', type: 'resource', stackable: true,
        description: 'Animal hide. Can be tanned into leather.',
        value: 7
    },

    // ---- FOOD / GARDEN PRODUCE ----
    ember_root_crop: {
        name: 'Ember Root Harvest', icon: '🥕', type: 'consumable', stackable: true,
        description: 'A warm, glowing root vegetable. Restores 20 HP.',
        effect: { type: 'heal', stat: 'hp', amount: 20 }, value: 10
    },
    veil_mushroom: {
        name: 'Veil Mushroom', icon: '🍄', type: 'consumable', stackable: true,
        description: 'A phosphorescent mushroom. Restores 15 MP.',
        effect: { type: 'heal', stat: 'mp', amount: 15 }, value: 12
    },
    blood_blossom: {
        name: 'Blood Blossom', icon: '🌺', type: 'consumable', stackable: true,
        description: 'A crimson flower. Restores 15 HP and 10 MP.',
        effect: { type: 'heal', stat: 'both', hpAmount: 15, mpAmount: 10 }, value: 14
    },
    hearth_stew: {
        name: 'Hearth Stew', icon: '🍲', type: 'consumable', stackable: true,
        description: 'A warm bowl of stew. Restores 50 HP. Tastes like hope.',
        effect: { type: 'heal', stat: 'hp', amount: 50 }, value: 30
    },

    // ---- QUEST / KEY ITEMS ----
    ancient_key_fragment: {
        name: 'Ancient Key Fragment', icon: '🗝️', type: 'quest', stackable: true,
        description: 'A shard of an ancient key. Three fragments are needed to reform it.',
        value: 0
    },
    void_crystal_quest: {
        name: 'Void Crystal Shard', icon: '💎', type: 'quest',
        description: 'A pulsing crystal of pure void energy. It hums with an unsettling frequency.',
        value: 0
    },
    ruun_codex_page: {
        name: 'Ruun Codex Page', icon: '📜', type: 'quest', stackable: true,
        description: 'A page from the legendary Ruun Codex, containing fragments of creation-language.',
        value: 0
    }
};

// Resource drop tables per region
const RESOURCE_TABLES = {
    ashen_wastes: {
        common: ['wood', 'stone', 'iron_ore'],
        uncommon: ['hide', 'ember_root'],
        rare: ['flame_essence', 'iron_ingot']
    },
    hollowfen: {
        common: ['wood', 'bog_fiber', 'hide'],
        uncommon: ['iron_ore', 'ember_root'],
        rare: ['shadow_silk', 'veil_crystal']
    },
    void_sanctum: {
        common: ['stone', 'iron_ore', 'shadow_silk'],
        uncommon: ['veil_crystal', 'flame_essence'],
        rare: ['veil_crystal', 'shadow_silk']
    }
};

// Loot tables by area difficulty
const LOOT_TABLES = {
    common: {
        consumables: ['health_vial', 'mana_vial'],
        equipment: ['iron_longsword', 'chainmail_vest'],
        goldRange: [5, 20]
    },
    uncommon: {
        consumables: ['health_vial', 'mana_vial', 'greater_health_potion', 'antidote'],
        equipment: ['voidtouched_blade', 'chainmail_vest'],
        goldRange: [15, 50]
    },
    rare: {
        consumables: ['greater_health_potion', 'elixir_of_power', 'antidote'],
        equipment: ['emberforged_axe', 'runebound_plate'],
        goldRange: [40, 120]
    },
    epic: {
        consumables: ['greater_health_potion', 'elixir_of_power'],
        equipment: ['mantle_of_the_hollow'],
        goldRange: [80, 250]
    }
};
