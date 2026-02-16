// ============================================
// ENEMIES DATA
// ============================================

const ENEMIES = {
    // ---- ASHEN WASTES (Level 1-3) ----
    void_rat: {
        name: 'Void Rat', icon: '🐀', level: 1, area: 'ashen_wastes',
        hp: 20, attack: 4, defense: 1, speed: 6, magicDefense: 0,
        xpReward: 12, goldReward: [2, 6],
        abilities: [
            { name: 'Bite', damage: [3, 6], type: 'physical' }
        ],
        lootTable: { health_vial: 0.2 },
        description: 'A rat warped by void exposure. Its eyes gleam with unnatural hunger.'
    },
    ashen_wraith: {
        name: 'Ashen Wraith', icon: '👻', level: 2, area: 'ashen_wastes',
        hp: 35, attack: 6, defense: 2, speed: 4, magicDefense: 4,
        xpReward: 25, goldReward: [5, 12],
        abilities: [
            { name: 'Spectral Touch', damage: [5, 10], type: 'magical' },
            { name: 'Wail', damage: [3, 5], type: 'magical', aoe: true }
        ],
        lootTable: { mana_vial: 0.25, health_vial: 0.15 },
        description: 'The lingering spirit of a victim of the Sundering. It weeps ash.'
    },
    scorched_bandit: {
        name: 'Scorched Bandit', icon: '🗡️', level: 2, area: 'ashen_wastes',
        hp: 40, attack: 8, defense: 3, speed: 4, magicDefense: 1,
        xpReward: 28, goldReward: [8, 20],
        abilities: [
            { name: 'Slash', damage: [6, 12], type: 'physical' },
            { name: 'Throw Ash', damage: [3, 5], type: 'physical', debuff: 'blind' }
        ],
        lootTable: { health_vial: 0.3, iron_longsword: 0.05 },
        description: 'Desperate survivors turned raider. Their skin is blackened from living in the wastes.'
    },
    ember_hound: {
        name: 'Ember Hound', icon: '🐕', level: 3, area: 'ashen_wastes',
        hp: 50, attack: 10, defense: 3, speed: 7, magicDefense: 2,
        xpReward: 35, goldReward: [6, 15],
        abilities: [
            { name: 'Fire Bite', damage: [8, 14], type: 'physical', element: 'fire' },
            { name: 'Flame Breath', damage: [10, 16], type: 'magical', element: 'fire' }
        ],
        lootTable: { health_vial: 0.2, blood_flask: 0.1 },
        description: 'A hound born from cinder and rage. Fire leaks from between its ribs.'
    },

    // ---- HOLLOWFEN (Level 3-5) ----
    bog_crawler: {
        name: 'Bog Crawler', icon: '🦎', level: 3, area: 'hollowfen',
        hp: 45, attack: 7, defense: 5, speed: 3, magicDefense: 2,
        xpReward: 30, goldReward: [8, 18],
        abilities: [
            { name: 'Claw Swipe', damage: [6, 11], type: 'physical' },
            { name: 'Venomous Spit', damage: [4, 8], type: 'magical', debuff: 'poison' }
        ],
        lootTable: { antidote: 0.3, health_vial: 0.2 },
        description: 'A reptilian creature that lurks beneath the murky waters of the fen.'
    },
    fen_witch: {
        name: 'Fen Witch', icon: '🧙', level: 4, area: 'hollowfen',
        hp: 38, attack: 4, defense: 2, speed: 5, magicDefense: 8,
        xpReward: 45, goldReward: [12, 25],
        abilities: [
            { name: 'Hex Bolt', damage: [10, 18], type: 'magical' },
            { name: 'Life Drain', damage: [8, 12], type: 'magical', lifesteal: 50 },
            { name: 'Curse', damage: [0, 0], type: 'debuff', debuff: 'weaken' }
        ],
        lootTable: { mana_vial: 0.3, antidote: 0.15, voidtouched_blade: 0.03 },
        description: 'A practitioner of forbidden swamp magic. Her laughter echoes across the mire.'
    },
    drowned_knight: {
        name: 'Drowned Knight', icon: '🛡️', level: 5, area: 'hollowfen',
        hp: 70, attack: 12, defense: 8, speed: 2, magicDefense: 3,
        xpReward: 55, goldReward: [15, 35],
        abilities: [
            { name: 'Heavy Swing', damage: [12, 20], type: 'physical' },
            { name: 'Shield Wall', damage: [0, 0], type: 'buff', buff: 'defense' },
            { name: 'Drowning Grasp', damage: [8, 14], type: 'physical', debuff: 'slow' }
        ],
        lootTable: { chainmail_vest: 0.08, health_vial: 0.3, greater_health_potion: 0.05 },
        description: 'A knight who drowned in the fen centuries ago. Waterlogged armor still holds.'
    },

    // ---- VOID SANCTUM (Level 5-7) ----
    void_acolyte: {
        name: 'Void Acolyte', icon: '🧛', level: 5, area: 'void_sanctum',
        hp: 50, attack: 8, defense: 3, speed: 5, magicDefense: 6,
        xpReward: 50, goldReward: [15, 30],
        abilities: [
            { name: 'Void Bolt', damage: [12, 20], type: 'magical' },
            { name: 'Dark Shield', damage: [0, 0], type: 'buff', buff: 'magicDefense' }
        ],
        lootTable: { mana_vial: 0.3, ruun_codex_page: 0.05 },
        description: 'A cultist who has given themselves to the void. Their eyes are empty sockets.'
    },
    reality_shard: {
        name: 'Reality Shard', icon: '💎', level: 6, area: 'void_sanctum',
        hp: 40, attack: 15, defense: 10, speed: 3, magicDefense: 10,
        xpReward: 65, goldReward: [20, 45],
        abilities: [
            { name: 'Fracture', damage: [15, 25], type: 'magical' },
            { name: 'Reflect', damage: [0, 0], type: 'buff', buff: 'reflect' }
        ],
        lootTable: { void_crystal: 0.1, greater_health_potion: 0.15 },
        description: 'A floating shard of broken reality. It distorts light and sound around it.'
    },
    shadow_sentinel: {
        name: 'Shadow Sentinel', icon: '⚫', level: 7, area: 'void_sanctum',
        hp: 85, attack: 14, defense: 7, speed: 6, magicDefense: 7,
        xpReward: 80, goldReward: [25, 55],
        abilities: [
            { name: 'Shadow Cleave', damage: [14, 24], type: 'physical' },
            { name: 'Void Pulse', damage: [10, 18], type: 'magical', aoe: true },
            { name: 'Darkness', damage: [0, 0], type: 'debuff', debuff: 'blind' }
        ],
        lootTable: { mantle_of_the_hollow: 0.02, greater_health_potion: 0.2, elixir_of_power: 0.08 },
        description: 'An ancient guardian of the sanctum. It exists in multiple realities simultaneously.'
    },

    // ---- BOSSES ----
    the_ashen_king: {
        name: 'The Ashen King', icon: '👑', level: 5, area: 'ashen_wastes',
        hp: 150, attack: 14, defense: 6, speed: 4, magicDefense: 4,
        xpReward: 150, goldReward: [50, 100],
        isBoss: true,
        abilities: [
            { name: 'Regal Strike', damage: [12, 20], type: 'physical' },
            { name: 'Crown of Flames', damage: [15, 25], type: 'magical', element: 'fire', aoe: true },
            { name: 'Ashen Command', damage: [0, 0], type: 'buff', buff: 'all' },
            { name: 'Desperation', damage: [20, 35], type: 'physical', threshold: 0.3 }
        ],
        phases: [
            { hpPercent: 1.0, message: '"You trespass in MY domain, insect."' },
            { hpPercent: 0.5, message: '"Enough! I shall burn you to cinders!"', buff: { attack: 5 } },
            { hpPercent: 0.2, message: '"NO! I will NOT fall! Not to the likes of you!"', buff: { speed: 4 } }
        ],
        lootTable: { emberforged_axe: 0.25, ancient_key_fragment: 1.0, greater_health_potion: 0.5 },
        description: 'Once the ruler of a great kingdom, now a mad specter clinging to a throne of ash.'
    },
    mother_of_the_fen: {
        name: 'Mother of the Fen', icon: '🐍', level: 8, area: 'hollowfen',
        hp: 200, attack: 16, defense: 5, speed: 5, magicDefense: 10,
        xpReward: 250, goldReward: [80, 150],
        isBoss: true,
        abilities: [
            { name: 'Constrict', damage: [14, 22], type: 'physical', debuff: 'slow' },
            { name: 'Plague Breath', damage: [12, 20], type: 'magical', debuff: 'poison' },
            { name: 'Regenerate', damage: [0, 0], type: 'heal', amount: 20 },
            { name: 'Swarm', damage: [8, 12], type: 'physical', aoe: true }
        ],
        phases: [
            { hpPercent: 1.0, message: '"The fen feeds... and I am the fen."' },
            { hpPercent: 0.6, message: '"My children! Come to Mother!"', summon: 'bog_crawler' },
            { hpPercent: 0.25, message: '"The swamp will swallow you WHOLE!"', buff: { attack: 8 } }
        ],
        lootTable: { mantle_of_the_hollow: 0.15, ancient_key_fragment: 1.0, elixir_of_power: 0.4 },
        description: 'A colossal serpentine entity that IS the Hollowfen. Every creature in the swamp is her child.'
    },
    ruun_the_unraveler: {
        name: 'Ruun, the Unraveler', icon: '🌀', level: 10, area: 'void_sanctum',
        hp: 350, attack: 22, defense: 8, speed: 7, magicDefense: 12,
        xpReward: 500, goldReward: [200, 400],
        isBoss: true,
        abilities: [
            { name: 'Unravel', damage: [20, 35], type: 'magical' },
            { name: 'Reality Tear', damage: [25, 40], type: 'magical', aoe: true },
            { name: 'Void Consume', damage: [15, 25], type: 'magical', lifesteal: 50 },
            { name: 'Annihilate', damage: [35, 55], type: 'magical', threshold: 0.2 }
        ],
        phases: [
            { hpPercent: 1.0, message: '"You have come to the end of all things. How... predictable."' },
            { hpPercent: 0.7, message: '"I have unraveled worlds older than your species."', buff: { magicDefense: 5 } },
            { hpPercent: 0.4, message: '"Interesting. You resist. Let me show you TRUE oblivion."', buff: { attack: 10 } },
            { hpPercent: 0.15, message: '"IMPOSSIBLE! I am the void itself! I AM RUUN!"', buff: { attack: 8, speed: 5 } }
        ],
        lootTable: { whisper_of_ruun: 0.5, ancient_key_fragment: 1.0 },
        description: 'The entity that shattered the world. Neither god nor mortal — Ruun is the space between, given hunger and will.'
    }
};
