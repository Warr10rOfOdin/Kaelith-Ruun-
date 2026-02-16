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

    // ---- QUEST / KEY ITEMS ----
    ancient_key_fragment: {
        name: 'Ancient Key Fragment', icon: '🗝️', type: 'quest', stackable: true,
        description: 'A shard of an ancient key. Three fragments are needed to reform it.',
        value: 0
    },
    void_crystal: {
        name: 'Void Crystal', icon: '💎', type: 'quest',
        description: 'A pulsing crystal of pure void energy. It hums with an unsettling frequency.',
        value: 0
    },
    ruun_codex_page: {
        name: 'Ruun Codex Page', icon: '📜', type: 'quest', stackable: true,
        description: 'A page from the legendary Ruun Codex, containing fragments of creation-language.',
        value: 0
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
