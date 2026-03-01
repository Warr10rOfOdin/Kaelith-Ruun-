// ============================================
// MAP DATA — Tile maps for all game zones
// ============================================
// Tile Legend:
//   .  = grass (walkable)
//   p  = dirt path (walkable)
//   #  = wall / boundary
//   T  = tree (chop → wood)
//   R  = rock (mine → stone)
//   I  = iron vein (mine → iron_ore)
//   ~  = water
//   E  = ember root (gather)
//   V  = veil crystal (gather, rare)
//   S  = shadow silk source (gather)
//   H  = herb / bog fiber (gather)
//   B  = building spot (camp only)
//   F  = campfire
//   f  = fence
//   D  = door (enter building)
//   C  = chest (loot)
//   G  = tilled garden soil

const TILE_TYPES = {
    '.': { name: 'Grass', passable: true, color: '#2d4a2d', emoji: '' },
    'p': { name: 'Path', passable: true, color: '#5a4a3a', emoji: '' },
    '#': { name: 'Wall', passable: false, color: '#3a3a3a', emoji: '' },
    'T': { name: 'Tree', passable: false, color: '#1a3a1a', emoji: '🌲', resource: 'wood', gatherText: 'You chop down the tree and collect wood.' },
    'R': { name: 'Rock', passable: false, color: '#4a4a4a', emoji: '🪨', resource: 'stone', gatherText: 'You break apart the rock and collect stone.' },
    'I': { name: 'Iron Vein', passable: false, color: '#5a4a3a', emoji: '⛏️', resource: 'iron_ore', gatherText: 'You mine the iron vein and extract ore.' },
    '~': { name: 'Water', passable: false, color: '#1a2a4a', emoji: '🌊' },
    'E': { name: 'Ember Root', passable: false, color: '#4a2a1a', emoji: '🌱', resource: 'ember_root', gatherText: 'You carefully harvest the glowing ember root.' },
    'V': { name: 'Veil Crystal', passable: false, color: '#3a2a5a', emoji: '💎', resource: 'veil_crystal', gatherText: 'You pry the humming veil crystal free.' },
    'S': { name: 'Shadow Silk', passable: false, color: '#2a2a3a', emoji: '🕸️', resource: 'shadow_silk', gatherText: 'You carefully collect the shimmering shadow silk.' },
    'H': { name: 'Herb', passable: false, color: '#2a4a2a', emoji: '🌿', resource: 'bog_fiber', gatherText: 'You gather tough fibrous herbs.' },
    'B': { name: 'Building Spot', passable: true, color: '#3a3a2a', emoji: '🔲' },
    'F': { name: 'Campfire', passable: false, color: '#4a3a1a', emoji: '🔥' },
    'f': { name: 'Fence', passable: false, color: '#4a3a2a', emoji: '🪵' },
    'D': { name: 'Door', passable: true, color: '#5a4a3a', emoji: '🚪' },
    'C': { name: 'Chest', passable: false, color: '#5a4a1a', emoji: '📦' },
    'G': { name: 'Garden Soil', passable: true, color: '#3a2a1a', emoji: '' },
    'W': { name: 'Wheat', passable: false, color: '#5a5a1a', emoji: '🌾' },
    'M': { name: 'Mushroom', passable: false, color: '#3a2a3a', emoji: '🍄' },
    'b': { name: 'Bridge', passable: true, color: '#5a4a2a', emoji: '' },
    'X': { name: 'Bones', passable: true, color: '#4a4a3a', emoji: '💀' },
    'L': { name: 'Lantern', passable: false, color: '#5a5a2a', emoji: '🏮' },
    'P': { name: 'Pine Tree', passable: false, color: '#1a4a1a', emoji: '🌲', resource: 'wood', gatherText: 'You fell the pine tree and collect wood.' },
    'K': { name: 'Dead Tree', passable: false, color: '#4a3a2a', emoji: '🪵', resource: 'wood', gatherText: 'You chop the dead wood.' },
    'h': { name: 'Hill', passable: true, color: '#5a7a3a', emoji: '' },
    'g': { name: 'Tall Grass', passable: true, color: '#3a7a2a', emoji: '' },
    'O': { name: 'Pond', passable: false, color: '#2a5a8a', emoji: '💧' },
    'c': { name: 'Cave Entrance', passable: false, color: '#2a2a2a', emoji: '🕳️' },
    'w': { name: 'Wildflower', passable: true, color: '#aa66aa', emoji: '🌸' }
};

// Map definitions — procedurally generated at load time via WorldGen
// Each zone is now 90-100 tiles wide, giving a real open-world feel.

const MAP_DEFS = {
    // =============================
    // ASHEN WASTES
    // =============================
    ruined_outpost: {
        width: 100, height: 70, seed: 1001, biome: 'ashen_wastes',
        playerStart: { x: 50, y: 35 },
        structures: [
            { x: 40, y: 28, w: 8, h: 6, type: 'ruin' },
            { x: 60, y: 42, w: 6, h: 5, type: 'ruin' },
            { x: 20, y: 15, w: 7, h: 5, type: 'ruin' },
            { x: 75, y: 20, w: 8, h: 6, type: 'ruin' },
        ],
        paths: [
            { from: { x: 50, y: 69 }, to: { x: 50, y: 35 } },
            { from: { x: 50, y: 35 }, to: { x: 44, y: 30 } },
            { from: { x: 22, y: 17 }, to: { x: 50, y: 35 } },
            { from: { x: 50, y: 35 }, to: { x: 78, y: 22 } },
        ],
        exits: {
            south: { to: 'scorched_village', entryX: 50, entryY: 5 }
        },
        entities: [
            { x: 42, y: 30, type: 'npc', id: 'spirit_of_aldric' },
            { x: 70, y: 18, type: 'enemy_spawn', enemies: ['void_rat', 'ashen_wraith'] },
            { x: 20, y: 50, type: 'enemy_spawn', enemies: ['void_rat'] },
            { x: 80, y: 55, type: 'enemy_spawn', enemies: ['void_rat', 'scorched_bandit'] },
            { x: 30, y: 20, type: 'enemy_spawn', enemies: ['void_rat'] },
            { x: 85, y: 35, type: 'enemy_spawn', enemies: ['scorched_bandit'] },
            { x: 15, y: 12, type: 'enemy_spawn', enemies: ['void_rat', 'void_rat'] },
            { x: 65, y: 58, type: 'enemy_spawn', enemies: ['ashen_wraith'] },
            { x: 63, y: 30, type: 'chest', loot: ['health_vial', 'health_vial'] },
            { x: 82, y: 12, type: 'chest', loot: ['iron_ore', 'iron_ore', 'stone'] },
            { x: 44, y: 30, type: 'campfire' },
            { x: 78, y: 45, type: 'campfire' }
        ]
    },

    scorched_village: {
        width: 100, height: 70, seed: 1002, biome: 'ashen_wastes',
        playerStart: { x: 50, y: 5 },
        structures: [
            { x: 20, y: 15, w: 8, h: 6, type: 'ruin' },
            { x: 42, y: 15, w: 8, h: 6, type: 'ruin' },
            { x: 20, y: 30, w: 8, h: 6, type: 'ruin' },
            { x: 42, y: 30, w: 8, h: 6, type: 'ruin' },
            { x: 10, y: 42, w: 6, h: 5, type: 'ruin' },
            { x: 55, y: 10, w: 7, h: 5, type: 'ruin' },
        ],
        paths: [
            { from: { x: 50, y: 0 }, to: { x: 50, y: 69 } },
            { from: { x: 50, y: 33 }, to: { x: 99, y: 33 } },
            { from: { x: 24, y: 25 }, to: { x: 70, y: 25 } },
            { from: { x: 24, y: 50 }, to: { x: 70, y: 50 } },
            { from: { x: 10, y: 60 }, to: { x: 50, y: 60 } },
        ],
        exits: {
            north: { to: 'ruined_outpost', entryX: 50, entryY: 67 },
            south: { to: 'emberhold', entryX: 35, entryY: 3 },
            east: { to: 'player_camp', entryX: 3, entryY: 33 }
        },
        entities: [
            { x: 50, y: 25, type: 'npc', id: 'wandering_merchant' },
            { x: 35, y: 35, type: 'enemy_spawn', enemies: ['scorched_bandit', 'ember_hound'] },
            { x: 70, y: 50, type: 'enemy_spawn', enemies: ['ashen_wraith', 'scorched_bandit'] },
            { x: 20, y: 55, type: 'enemy_spawn', enemies: ['void_rat', 'ember_hound'] },
            { x: 85, y: 20, type: 'enemy_spawn', enemies: ['scorched_bandit', 'scorched_bandit'] },
            { x: 12, y: 15, type: 'enemy_spawn', enemies: ['void_rat', 'ember_hound'] },
            { x: 80, y: 60, type: 'enemy_spawn', enemies: ['ashen_wraith'] },
            { x: 30, y: 22, type: 'chest', loot: ['health_vial', 'mana_vial'] },
            { x: 80, y: 15, type: 'chest', loot: ['ember_root', 'ember_root'] },
            { x: 50, y: 50, type: 'campfire' },
            { x: 15, y: 60, type: 'campfire' }
        ]
    },

    emberhold: {
        width: 60, height: 40, seed: 1003, biome: 'village',
        playerStart: { x: 30, y: 3 },
        structures: [
            { x: 15, y: 10, w: 10, h: 8, type: 'building' },
            { x: 35, y: 10, w: 10, h: 8, type: 'building' },
            { x: 15, y: 24, w: 10, h: 8, type: 'building' },
            { x: 35, y: 24, w: 10, h: 8, type: 'building' },
        ],
        paths: [
            { from: { x: 30, y: 0 }, to: { x: 30, y: 39 } },
            { from: { x: 10, y: 20 }, to: { x: 50, y: 20 } },
        ],
        exits: {
            north: { to: 'scorched_village', entryX: 35, entryY: 47 },
            south: { to: 'ashen_throne', entryX: 30, entryY: 3 }
        },
        entities: [
            { x: 20, y: 13, type: 'npc', id: 'emberhold_blacksmith' },
            { x: 40, y: 13, type: 'npc', id: 'emberhold_herbalist' },
            { x: 20, y: 27, type: 'npc', id: 'emberhold_innkeeper' },
            { x: 40, y: 27, type: 'npc', id: 'wandering_merchant' },
            { x: 30, y: 20, type: 'campfire' }
        ]
    },

    player_camp: {
        width: 90, height: 65, seed: 1004, biome: 'camp',
        playerStart: { x: 45, y: 33 },
        structures: [
            { x: 3, y: 3, w: 84, h: 59, type: 'camp_fence' },
        ],
        paths: [
            { from: { x: 0, y: 33 }, to: { x: 45, y: 33 } },
            { from: { x: 45, y: 6 }, to: { x: 45, y: 58 } },
            { from: { x: 6, y: 33 }, to: { x: 84, y: 33 } },
        ],
        exits: {
            west: { to: 'scorched_village', entryX: 97, entryY: 33 }
        },
        entities: [
            { x: 45, y: 24, type: 'campfire' }
        ],
        isCamp: true,
        buildingSpots: [
            { x: 18, y: 12, id: 'shelter', label: 'Shelter' },
            { x: 45, y: 12, id: 'forge', label: 'Forge' },
            { x: 72, y: 12, id: 'workshop', label: 'Workshop' },
            { x: 18, y: 24, id: 'storage', label: 'Storage' },
            { x: 72, y: 24, id: 'ward_stones', label: 'Ward Stones' },
            { x: 18, y: 42, id: 'garden', label: 'Garden' },
            { x: 45, y: 42, id: 'farm', label: 'Farm Plot' },
            { x: 72, y: 42, id: 'herbalist_bench', label: 'Herb Bench' },
            { x: 18, y: 54, id: 'house', label: 'House' },
            { x: 45, y: 54, id: 'training_dummy', label: 'Training Grounds' },
            { x: 72, y: 54, id: 'lookout', label: 'Lookout Tower' }
        ]
    },

    ashen_throne: {
        width: 50, height: 40, seed: 1005, biome: 'boss_arena',
        playerStart: { x: 25, y: 3 },
        structures: [
            { x: 14, y: 10, w: 22, h: 18, type: 'ruin' },
        ],
        paths: [
            { from: { x: 25, y: 0 }, to: { x: 25, y: 12 } },
            { from: { x: 16, y: 19 }, to: { x: 34, y: 19 } },
        ],
        exits: {
            north: { to: 'emberhold', entryX: 30, entryY: 37 }
        },
        entities: [
            { x: 25, y: 19, type: 'boss', id: 'the_ashen_king' },
            { x: 16, y: 8, type: 'enemy_spawn', enemies: ['ashen_wraith'] },
            { x: 34, y: 8, type: 'enemy_spawn', enemies: ['ashen_wraith'] },
            { x: 16, y: 32, type: 'enemy_spawn', enemies: ['ember_hound'] },
            { x: 34, y: 32, type: 'enemy_spawn', enemies: ['ember_hound'] }
        ],
        bossArea: true,
        regionUnlock: { boss: 'the_ashen_king', unlocks: 'hollowfen' }
    },

    // =============================
    // HOLLOWFEN
    // =============================
    sunken_chapel: {
        width: 100, height: 70, seed: 2001, biome: 'hollowfen',
        playerStart: { x: 50, y: 35 },
        structures: [
            { x: 40, y: 30, w: 8, h: 8, type: 'ruin' },
            { x: 15, y: 12, w: 7, h: 5, type: 'ruin' },
            { x: 72, y: 52, w: 6, h: 5, type: 'ruin' },
            { x: 75, y: 15, w: 7, h: 6, type: 'ruin' },
        ],
        paths: [
            { from: { x: 50, y: 69 }, to: { x: 50, y: 35 } },
            { from: { x: 50, y: 35 }, to: { x: 18, y: 14 } },
            { from: { x: 50, y: 35 }, to: { x: 74, y: 54 } },
            { from: { x: 50, y: 35 }, to: { x: 78, y: 17 } },
        ],
        exits: {
            south: { to: 'stilthaven', entryX: 30, entryY: 3 }
        },
        entities: [
            { x: 46, y: 36, type: 'campfire' },
            { x: 74, y: 54, type: 'campfire' },
            { x: 25, y: 18, type: 'enemy_spawn', enemies: ['bog_crawler'] },
            { x: 72, y: 25, type: 'enemy_spawn', enemies: ['bog_crawler', 'fen_witch'] },
            { x: 35, y: 52, type: 'enemy_spawn', enemies: ['bog_crawler'] },
            { x: 85, y: 14, type: 'enemy_spawn', enemies: ['fen_witch'] },
            { x: 12, y: 55, type: 'enemy_spawn', enemies: ['bog_crawler', 'bog_crawler'] },
            { x: 60, y: 12, type: 'enemy_spawn', enemies: ['fen_witch'] },
            { x: 20, y: 45, type: 'enemy_spawn', enemies: ['bog_crawler'] },
            { x: 55, y: 48, type: 'chest', loot: ['health_vial', 'antidote', 'mana_vial'] },
            { x: 18, y: 14, type: 'chest', loot: ['shadow_silk', 'bog_fiber'] }
        ]
    },

    stilthaven: {
        width: 60, height: 40, seed: 2002, biome: 'village',
        playerStart: { x: 30, y: 3 },
        structures: [
            { x: 15, y: 10, w: 10, h: 8, type: 'building' },
            { x: 35, y: 10, w: 10, h: 8, type: 'building' },
            { x: 15, y: 24, w: 10, h: 8, type: 'building' },
        ],
        paths: [
            { from: { x: 30, y: 0 }, to: { x: 30, y: 39 } },
            { from: { x: 10, y: 20 }, to: { x: 50, y: 20 } },
        ],
        exits: {
            north: { to: 'sunken_chapel', entryX: 35, entryY: 47 },
            south: { to: 'witchs_hut', entryX: 35, entryY: 3 }
        },
        entities: [
            { x: 20, y: 13, type: 'npc', id: 'stilthaven_blacksmith' },
            { x: 40, y: 13, type: 'npc', id: 'stilthaven_herbalist' },
            { x: 20, y: 27, type: 'npc', id: 'stilthaven_innkeeper' },
            { x: 30, y: 20, type: 'campfire' }
        ]
    },

    witchs_hut: {
        width: 100, height: 70, seed: 2003, biome: 'fen_wilderness',
        playerStart: { x: 50, y: 5 },
        structures: [
            { x: 45, y: 30, w: 7, h: 7, type: 'building' },
        ],
        paths: [
            { from: { x: 50, y: 0 }, to: { x: 48, y: 32 } },
            { from: { x: 48, y: 36 }, to: { x: 50, y: 69 } },
        ],
        exits: {
            north: { to: 'stilthaven', entryX: 30, entryY: 37 },
            south: { to: 'heart_of_the_fen', entryX: 45, entryY: 5 }
        },
        entities: [
            { x: 48, y: 33, type: 'npc', id: 'granny_moss' },
            { x: 25, y: 20, type: 'enemy_spawn', enemies: ['fen_witch'] },
            { x: 70, y: 48, type: 'enemy_spawn', enemies: ['bog_crawler', 'drowned_knight'] },
            { x: 28, y: 55, type: 'enemy_spawn', enemies: ['fen_witch'] },
            { x: 80, y: 15, type: 'enemy_spawn', enemies: ['bog_crawler'] },
            { x: 15, y: 40, type: 'enemy_spawn', enemies: ['drowned_knight'] }
        ]
    },

    heart_of_the_fen: {
        width: 90, height: 65, seed: 2004, biome: 'fen_wilderness',
        playerStart: { x: 45, y: 5 },
        paths: [
            { from: { x: 45, y: 0 }, to: { x: 45, y: 33 } },
        ],
        exits: {
            north: { to: 'witchs_hut', entryX: 50, entryY: 67 }
        },
        entities: [
            { x: 45, y: 33, type: 'boss', id: 'mother_of_the_fen' },
            { x: 22, y: 18, type: 'enemy_spawn', enemies: ['drowned_knight'] },
            { x: 65, y: 25, type: 'enemy_spawn', enemies: ['fen_witch', 'drowned_knight'] },
            { x: 30, y: 50, type: 'enemy_spawn', enemies: ['bog_crawler', 'bog_crawler'] },
            { x: 70, y: 45, type: 'enemy_spawn', enemies: ['fen_witch'] },
            { x: 15, y: 40, type: 'enemy_spawn', enemies: ['bog_crawler'] }
        ],
        bossArea: true,
        regionUnlock: { boss: 'mother_of_the_fen', unlocks: 'void_sanctum' }
    },

    // =============================
    // VOID SANCTUM
    // =============================
    outer_gate: {
        width: 100, height: 70, seed: 3001, biome: 'void_sanctum',
        playerStart: { x: 50, y: 35 },
        structures: [
            { x: 35, y: 17, w: 10, h: 8, type: 'ruin' },
            { x: 50, y: 42, w: 10, h: 8, type: 'ruin' },
            { x: 12, y: 50, w: 7, h: 6, type: 'ruin' },
            { x: 78, y: 17, w: 8, h: 6, type: 'ruin' },
        ],
        paths: [
            { from: { x: 50, y: 35 }, to: { x: 50, y: 69 } },
            { from: { x: 42, y: 22 }, to: { x: 55, y: 47 } },
            { from: { x: 15, y: 52 }, to: { x: 50, y: 35 } },
            { from: { x: 80, y: 20 }, to: { x: 50, y: 35 } },
        ],
        exits: {
            south: { to: 'last_vigil', entryX: 30, entryY: 3 }
        },
        entities: [
            { x: 25, y: 20, type: 'enemy_spawn', enemies: ['void_acolyte'] },
            { x: 70, y: 48, type: 'enemy_spawn', enemies: ['reality_shard', 'void_acolyte'] },
            { x: 85, y: 20, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 15, y: 52, type: 'enemy_spawn', enemies: ['void_acolyte', 'void_acolyte'] },
            { x: 50, y: 14, type: 'enemy_spawn', enemies: ['reality_shard'] },
            { x: 20, y: 40, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 80, y: 55, type: 'enemy_spawn', enemies: ['void_acolyte'] },
            { x: 42, y: 20, type: 'chest', loot: ['greater_health_potion', 'elixir_of_power'] },
            { x: 15, y: 55, type: 'chest', loot: ['shadow_silk', 'veil_crystal'] },
            { x: 50, y: 35, type: 'campfire' },
            { x: 80, y: 45, type: 'campfire' }
        ]
    },

    last_vigil: {
        width: 60, height: 40, seed: 3002, biome: 'village',
        playerStart: { x: 30, y: 3 },
        structures: [
            { x: 15, y: 10, w: 10, h: 8, type: 'building' },
            { x: 35, y: 10, w: 10, h: 8, type: 'building' },
            { x: 15, y: 24, w: 10, h: 8, type: 'building' },
        ],
        paths: [
            { from: { x: 30, y: 0 }, to: { x: 30, y: 39 } },
            { from: { x: 10, y: 20 }, to: { x: 50, y: 20 } },
        ],
        exits: {
            north: { to: 'outer_gate', entryX: 35, entryY: 47 },
            south: { to: 'hall_of_echoes', entryX: 30, entryY: 3 }
        },
        entities: [
            { x: 20, y: 13, type: 'npc', id: 'vigil_blacksmith' },
            { x: 40, y: 13, type: 'npc', id: 'vigil_herbalist' },
            { x: 20, y: 27, type: 'npc', id: 'vigil_innkeeper' },
            { x: 30, y: 20, type: 'campfire' }
        ]
    },

    hall_of_echoes: {
        width: 100, height: 70, seed: 3003, biome: 'void_wilderness',
        playerStart: { x: 50, y: 5 },
        structures: [
            { x: 35, y: 22, w: 10, h: 8, type: 'ruin' },
            { x: 50, y: 42, w: 10, h: 8, type: 'ruin' },
            { x: 75, y: 15, w: 8, h: 6, type: 'ruin' },
        ],
        paths: [
            { from: { x: 50, y: 0 }, to: { x: 50, y: 69 } },
            { from: { x: 42, y: 28 }, to: { x: 55, y: 47 } },
            { from: { x: 50, y: 35 }, to: { x: 78, y: 18 } },
        ],
        exits: {
            north: { to: 'last_vigil', entryX: 30, entryY: 37 },
            south: { to: 'throne_of_unmaking', entryX: 25, entryY: 3 }
        },
        entities: [
            { x: 20, y: 20, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 70, y: 42, type: 'enemy_spawn', enemies: ['reality_shard', 'void_acolyte'] },
            { x: 50, y: 14, type: 'enemy_spawn', enemies: ['shadow_sentinel', 'void_acolyte'] },
            { x: 80, y: 18, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 30, y: 55, type: 'enemy_spawn', enemies: ['void_acolyte', 'void_acolyte'] },
            { x: 85, y: 50, type: 'enemy_spawn', enemies: ['reality_shard'] },
            { x: 40, y: 25, type: 'chest', loot: ['greater_health_potion', 'veil_crystal'] },
            { x: 50, y: 35, type: 'campfire' }
        ]
    },

    throne_of_unmaking: {
        width: 50, height: 40, seed: 3004, biome: 'boss_arena',
        playerStart: { x: 25, y: 3 },
        structures: [
            { x: 14, y: 10, w: 22, h: 18, type: 'ruin' },
        ],
        paths: [
            { from: { x: 25, y: 0 }, to: { x: 25, y: 12 } },
            { from: { x: 16, y: 19 }, to: { x: 34, y: 19 } },
        ],
        exits: {
            north: { to: 'hall_of_echoes', entryX: 35, entryY: 47 }
        },
        entities: [
            { x: 25, y: 19, type: 'boss', id: 'ruun_the_unraveler' },
            { x: 16, y: 8, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 34, y: 8, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 16, y: 32, type: 'enemy_spawn', enemies: ['void_acolyte'] },
            { x: 34, y: 32, type: 'enemy_spawn', enemies: ['void_acolyte'] }
        ],
        bossArea: true
    }
};

// Build the runtime MAPS object by generating terrain from MAP_DEFS
const MAPS = {};
(function buildMaps() {
    for (const [key, def] of Object.entries(MAP_DEFS)) {
        // Generate terrain procedurally
        const terrain = WorldGen.generate(def);

        // Open exits in the border — use exit-specific coords or path endpoints
        let terrainArr = terrain;
        if (def.exits) {
            for (const [dir, exit] of Object.entries(def.exits)) {
                // Find matching path endpoint for this exit direction to determine exact position
                let openX, openY;
                switch (dir) {
                    case 'north': openX = exit.entryX !== undefined ? exit.entryX : def.playerStart.x; openY = 0; break;
                    case 'south': openX = exit.entryX !== undefined ? exit.entryX : def.playerStart.x; openY = def.height - 1; break;
                    case 'west': openX = 0; openY = exit.entryY !== undefined ? exit.entryY : def.playerStart.y; break;
                    case 'east': openX = def.width - 1; openY = exit.entryY !== undefined ? exit.entryY : def.playerStart.y; break;
                }
                terrainArr = WorldGen.openExit(terrainArr, { entryX: openX, entryY: openY }, dir, def.width, def.height);
            }
        }

        MAPS[key] = {
            width: def.width,
            height: def.height,
            terrain: terrainArr,
            playerStart: def.playerStart,
            exits: def.exits || {},
            entities: def.entities || [],
            isCamp: def.isCamp || false,
            buildingSpots: def.buildingSpots || null,
            bossArea: def.bossArea || false,
            regionUnlock: def.regionUnlock || null
        };
    }
})();

// Which region each map belongs to (for enemy scaling, resources, etc.)
const MAP_REGIONS = {
    ruined_outpost: 'ashen_wastes',
    scorched_village: 'ashen_wastes',
    emberhold: 'ashen_wastes',
    player_camp: 'ashen_wastes',
    ashen_throne: 'ashen_wastes',
    sunken_chapel: 'hollowfen',
    stilthaven: 'hollowfen',
    witchs_hut: 'hollowfen',
    heart_of_the_fen: 'hollowfen',
    outer_gate: 'void_sanctum',
    last_vigil: 'void_sanctum',
    hall_of_echoes: 'void_sanctum',
    throne_of_unmaking: 'void_sanctum'
};

// Region entry points (first map in each region)
const REGION_ENTRIES = {
    ashen_wastes: 'ruined_outpost',
    hollowfen: 'sunken_chapel',
    void_sanctum: 'outer_gate'
};

// Building definitions for the player camp
const BUILDINGS = {
    shelter: {
        name: 'Shelter', icon: '🏠', description: 'A sturdy shelter. Rest here to fully recover.',
        cost: { wood: 8, stone: 5 },
        size: { w: 3, h: 3 },
        provides: 'rest'
    },
    forge: {
        name: 'Forge', icon: '🔨', description: 'A blacksmith forge. Craft weapons and armor.',
        cost: { iron_ore: 10, stone: 8, wood: 5 },
        size: { w: 3, h: 3 },
        provides: 'crafting_weapons'
    },
    workshop: {
        name: 'Workshop', icon: '🔧', description: 'A crafting workshop. Smelt ore and craft tools.',
        cost: { wood: 10, stone: 5, iron_ore: 3 },
        size: { w: 3, h: 3 },
        provides: 'crafting_tools'
    },
    garden: {
        name: 'Garden', icon: '🌱', description: 'A garden plot. Plant and grow food crops.',
        cost: { wood: 6, ember_root: 4, stone: 2 },
        size: { w: 3, h: 3 },
        provides: 'farming'
    },
    storage: {
        name: 'Storage', icon: '📦', description: 'A storage vault. Increases inventory by 20 slots.',
        cost: { wood: 12, stone: 8, iron_ore: 4 },
        size: { w: 3, h: 3 },
        provides: 'extra_storage'
    },
    ward_stones: {
        name: 'Ward Stones', icon: '🪨', description: 'Protective ward stones. Passive HP regen at camp.',
        cost: { stone: 10, veil_crystal: 3, flame_essence: 2 },
        size: { w: 3, h: 3 },
        provides: 'ward_regen'
    },
    farm: {
        name: 'Farm Plot', icon: '🌾', description: 'A larger farm. Grow more crops at once.',
        cost: { wood: 8, stone: 4, ember_root: 6, bog_fiber: 4 },
        size: { w: 3, h: 3 },
        provides: 'farming_large'
    },
    herbalist_bench: {
        name: 'Herb Bench', icon: '🧪', description: 'An alchemy bench. Brew potions from ingredients.',
        cost: { wood: 6, ember_root: 5, bog_fiber: 3 },
        size: { w: 3, h: 3 },
        provides: 'brewing'
    },
    house: {
        name: 'House', icon: '🏡', description: 'Your home. A proper dwelling with a warm hearth.',
        cost: { wood: 20, stone: 15, iron_ingot: 5 },
        size: { w: 3, h: 3 },
        provides: 'home'
    },
    training_dummy: {
        name: 'Training Grounds', icon: '🎯', description: 'Practice combat. Gain XP without danger.',
        cost: { wood: 10, hide: 5, iron_ore: 3 },
        size: { w: 3, h: 3 },
        provides: 'training'
    },
    lookout: {
        name: 'Lookout Tower', icon: '🗼', description: 'A watchtower. See the world map from above.',
        cost: { wood: 15, stone: 10, iron_ingot: 3 },
        size: { w: 3, h: 3 },
        provides: 'map_reveal'
    }
};

const BUILDING_UPGRADES = {
    shelter: {
        maxLevel: 3,
        levels: {
            2: {
                name: 'Reinforced Shelter',
                description: 'Thicker walls. Resting also removes debuffs.',
                cost: { wood: 15, stone: 10, iron_ingot: 3 },
                effect: 'rest_cleanse'
            },
            3: {
                name: 'Fortified Lodge',
                description: 'A strong lodge. Resting grants a temporary HP shield.',
                cost: { hardwood: 10, granite: 8, iron_ingot: 5 },
                effect: 'rest_shield'
            }
        }
    },
    forge: {
        maxLevel: 3,
        levels: {
            2: {
                name: 'Advanced Forge',
                description: 'Better forge. 10% chance to craft double output.',
                cost: { iron_ingot: 8, stone: 12, flame_essence: 3 },
                effect: 'double_craft_10'
            },
            3: {
                name: 'Master Forge',
                description: 'Master-tier forge. 20% chance to craft double output.',
                cost: { mithril_ingot: 5, granite: 10, flame_essence: 5 },
                effect: 'double_craft_20'
            }
        }
    },
    workshop: {
        maxLevel: 3,
        levels: {
            2: {
                name: 'Advanced Workshop',
                description: 'Better tools. Smelting yields +1 extra ingot.',
                cost: { iron_ingot: 6, wood: 15, stone: 8 },
                effect: 'smelt_bonus'
            },
            3: {
                name: 'Master Workshop',
                description: 'Top-tier workshop. All tool crafting costs 1 less of each material.',
                cost: { mithril_ingot: 3, hardwood: 10, iron_ingot: 5 },
                effect: 'reduced_tool_cost'
            }
        }
    },
    garden: {
        maxLevel: 3,
        levels: {
            2: {
                name: 'Irrigated Garden',
                description: 'Irrigation channels. +1 crop slot, crops grow 25% faster.',
                cost: { wood: 10, stone: 8, iron_ingot: 2 },
                effect: 'garden_upgrade'
            },
            3: {
                name: 'Greenhouse',
                description: 'Glass greenhouse. +2 crop slots, crops grow 50% faster.',
                cost: { hardwood: 8, granite: 6, veil_crystal: 2 },
                effect: 'greenhouse'
            }
        }
    },
    storage: {
        maxLevel: 3,
        levels: {
            2: {
                name: 'Large Storage',
                description: 'Expanded storage. +15 more inventory slots.',
                cost: { wood: 15, iron_ingot: 4, stone: 10 },
                effect: 'extra_storage_15'
            },
            3: {
                name: 'Vault',
                description: 'A massive vault. +20 more inventory slots.',
                cost: { hardwood: 12, mithril_ingot: 3, granite: 8 },
                effect: 'extra_storage_20'
            }
        }
    },
    herbalist_bench: {
        maxLevel: 3,
        levels: {
            2: {
                name: 'Alchemist\'s Bench',
                description: 'Improved bench. Potions restore 15% more.',
                cost: { wood: 8, ember_root: 8, veil_crystal: 2 },
                effect: 'potion_boost_15'
            },
            3: {
                name: 'Master Apothecary',
                description: 'Master-grade bench. Potions restore 30% more.',
                cost: { hardwood: 6, shadow_silk: 4, veil_crystal: 4 },
                effect: 'potion_boost_30'
            }
        }
    },
    farm: {
        maxLevel: 2,
        levels: {
            2: {
                name: 'Expanded Farm',
                description: 'Bigger farm. +3 crop slots.',
                cost: { wood: 12, stone: 8, ember_root: 6, iron_ingot: 3 },
                effect: 'farm_expand'
            }
        }
    }
};

// Crafting recipes
const RECIPES = {
    // ═══════════════════════════════════════
    // TIER 0 — Basic Survival
    // ═══════════════════════════════════════

    // --- Smelting ---
    iron_ingot: {
        name: 'Smelt Iron Ingot', icon: '🔩', station: 'workshop',
        ingredients: { iron_ore: 2 },
        result: { item: 'iron_ingot', quantity: 1 },
        description: 'Smelt raw iron ore into a usable ingot.'
    },

    // --- Materials Processing ---
    woven_cloth_craft: {
        name: 'Weave Cloth', icon: '🧶', station: 'workshop',
        ingredients: { fiber: 3 },
        result: { item: 'woven_cloth', quantity: 1 },
        description: 'Weave plant fibers into cloth.'
    },
    leather_craft: {
        name: 'Tan Leather', icon: '🟫', station: 'workshop',
        ingredients: { hide: 2 },
        result: { item: 'leather', quantity: 1 },
        description: 'Tan hides into usable leather.'
    },

    // --- Potions (Tier 0) ---
    health_vial_craft: {
        name: 'Brew Health Vial', icon: '❤️', station: 'herbalist_bench',
        ingredients: { ember_root: 2 },
        result: { item: 'health_vial', quantity: 2 },
        description: 'Brew healing vials from ember root.'
    },
    mana_vial_craft: {
        name: 'Brew Mana Vial', icon: '💙', station: 'herbalist_bench',
        ingredients: { bog_fiber: 2, ember_root: 1 },
        result: { item: 'mana_vial', quantity: 2 },
        description: 'Brew mana vials from swamp herbs.'
    },
    antidote_craft: {
        name: 'Brew Antidote', icon: '💚', station: 'herbalist_bench',
        ingredients: { bog_fiber: 3 },
        result: { item: 'antidote', quantity: 2 },
        description: 'Brew antidotes from cleansing herbs.'
    },

    // --- Stone Tools (Tier 0) ---
    stone_axe_craft: {
        name: 'Craft Stone Axe', icon: '🪓', station: 'workshop',
        ingredients: { stone: 3, wood: 2 },
        result: { item: 'stone_axe', quantity: 1 },
        description: 'Craft a basic stone axe for chopping trees.'
    },
    stone_pickaxe_craft: {
        name: 'Craft Stone Pickaxe', icon: '⛏️', station: 'workshop',
        ingredients: { stone: 3, wood: 2 },
        result: { item: 'stone_pickaxe', quantity: 1 },
        description: 'Craft a basic stone pickaxe for mining.'
    },
    stone_sickle_craft: {
        name: 'Craft Stone Sickle', icon: '🌾', station: 'workshop',
        ingredients: { stone: 2, wood: 2 },
        result: { item: 'stone_sickle', quantity: 1 },
        description: 'Craft a basic stone sickle for gathering herbs.'
    },
    stone_hammer_craft: {
        name: 'Craft Stone Hammer', icon: '🔨', station: 'workshop',
        ingredients: { stone: 4, wood: 2 },
        result: { item: 'stone_hammer', quantity: 1 },
        description: 'Craft a basic stone hammer for building.'
    },
    fishing_rod_craft: {
        name: 'Craft Fishing Rod', icon: '🎣', station: 'workshop',
        ingredients: { wood: 3, fiber: 2 },
        result: { item: 'fishing_rod', quantity: 1 },
        description: 'Craft a simple fishing rod.'
    },

    // --- Stone Weapons & Armor (Tier 0) ---
    bone_sword_craft: {
        name: 'Craft Bone Sword', icon: '⚔️', station: 'workshop',
        ingredients: { bone: 4, wood: 1 },
        result: { item: 'bone_sword', quantity: 1 },
        description: 'Fashion a crude blade from sharpened bones.'
    },
    bone_dagger_craft: {
        name: 'Craft Bone Dagger', icon: '🗡️', station: 'workshop',
        ingredients: { bone: 2, fiber: 1 },
        result: { item: 'bone_dagger', quantity: 1 },
        description: 'Sharpen a bone into a quick knife.'
    },
    leather_vest_craft: {
        name: 'Craft Leather Vest', icon: '🦺', station: 'workshop',
        ingredients: { leather: 3 },
        result: { item: 'leather_vest', quantity: 1 },
        description: 'Sew leather into a basic vest.'
    },
    leather_cap_craft: {
        name: 'Craft Leather Cap', icon: '🧢', station: 'workshop',
        ingredients: { leather: 2 },
        result: { item: 'leather_cap', quantity: 1 },
        description: 'Shape leather into a simple cap.'
    },
    leather_boots_craft: {
        name: 'Craft Leather Boots', icon: '👢', station: 'workshop',
        ingredients: { leather: 2 },
        result: { item: 'leather_boots', quantity: 1 },
        description: 'Sew leather into basic boots.'
    },
    wooden_shield_craft: {
        name: 'Craft Wooden Shield', icon: '🛡️', station: 'workshop',
        ingredients: { wood: 4, leather: 1 },
        result: { item: 'wooden_shield', quantity: 1 },
        description: 'Build a simple wooden shield.'
    },

    // ═══════════════════════════════════════
    // TIER 1 — Iron Age
    // ═══════════════════════════════════════

    // --- Iron Tools ---
    iron_axe_craft: {
        name: 'Forge Iron Axe', icon: '🪓', station: 'forge',
        ingredients: { iron_ingot: 2, wood: 1 },
        result: { item: 'iron_axe', quantity: 1 },
        description: 'Forge an iron axe for efficient tree chopping.'
    },
    iron_pickaxe_craft: {
        name: 'Forge Iron Pickaxe', icon: '⛏️', station: 'forge',
        ingredients: { iron_ingot: 2, wood: 1 },
        result: { item: 'iron_pickaxe', quantity: 1 },
        description: 'Forge an iron pickaxe for better mining.'
    },
    iron_sickle_craft: {
        name: 'Forge Iron Sickle', icon: '🌾', station: 'forge',
        ingredients: { iron_ingot: 2, wood: 1 },
        result: { item: 'iron_sickle', quantity: 1 },
        description: 'Forge an iron sickle for herb harvesting.'
    },
    iron_hammer_craft: {
        name: 'Forge Iron Hammer', icon: '🔨', station: 'forge',
        ingredients: { iron_ingot: 3, wood: 1 },
        result: { item: 'iron_hammer', quantity: 1 },
        description: 'Forge an iron hammer for building.'
    },
    iron_fishing_rod_craft: {
        name: 'Forge Iron Fishing Rod', icon: '🎣', station: 'forge',
        ingredients: { iron_ingot: 2, fiber: 2 },
        result: { item: 'iron_fishing_rod', quantity: 1 },
        description: 'Forge a sturdy iron fishing rod.'
    },

    // --- Iron Weapons ---
    iron_sword: {
        name: 'Forge Iron Sword', icon: '⚔️', station: 'forge',
        ingredients: { iron_ingot: 3, wood: 1 },
        result: { item: 'iron_sword', quantity: 1 },
        description: 'Forge a sturdy iron sword.'
    },
    iron_dagger_craft: {
        name: 'Forge Iron Dagger', icon: '🗡️', station: 'forge',
        ingredients: { iron_ingot: 2, leather: 1 },
        result: { item: 'iron_dagger', quantity: 1 },
        description: 'Forge a sharp iron dagger.'
    },
    iron_mace_craft: {
        name: 'Forge Iron Mace', icon: '🔨', station: 'forge',
        ingredients: { iron_ingot: 3, wood: 1 },
        result: { item: 'iron_mace', quantity: 1 },
        description: 'Forge a heavy iron mace.'
    },

    // --- Iron Armor ---
    chainmail_vest_craft: {
        name: 'Forge Chainmail Vest', icon: '🦺', station: 'forge',
        ingredients: { iron_ingot: 4 },
        result: { item: 'chainmail_vest', quantity: 1 },
        description: 'Link iron rings into a protective vest.'
    },
    iron_helm_craft: {
        name: 'Forge Iron Helm', icon: '🪖', station: 'forge',
        ingredients: { iron_ingot: 2 },
        result: { item: 'iron_helm', quantity: 1 },
        description: 'Forge a sturdy iron helmet.'
    },
    iron_boots_craft: {
        name: 'Forge Iron Boots', icon: '👢', station: 'forge',
        ingredients: { iron_ingot: 2 },
        result: { item: 'iron_boots', quantity: 1 },
        description: 'Forge iron-shod boots.'
    },
    iron_shield_craft: {
        name: 'Forge Iron Shield', icon: '🛡️', station: 'forge',
        ingredients: { iron_ingot: 3, wood: 1 },
        result: { item: 'iron_shield', quantity: 1 },
        description: 'Forge a solid iron shield.'
    },
    iron_plate_craft: {
        name: 'Forge Iron Plate Armor', icon: '🛡️', station: 'forge',
        ingredients: { iron_ingot: 5, leather: 2 },
        result: { item: 'iron_plate', quantity: 1 },
        description: 'Forge heavy iron plate armor.'
    },
    hardened_leather_craft: {
        name: 'Craft Hardened Leather', icon: '🟫', station: 'workshop',
        ingredients: { leather: 2, iron_ingot: 1 },
        result: { item: 'hardened_leather', quantity: 1 },
        description: 'Boil and treat leather for extra toughness.'
    },

    // --- Potions (Tier 1) ---
    greater_health_craft: {
        name: 'Brew Greater Health Potion', icon: '❤️', station: 'herbalist_bench',
        ingredients: { ember_root: 3, flame_essence: 1 },
        result: { item: 'greater_health_potion', quantity: 1 },
        description: 'Brew a potent healing potion.'
    },

    // --- Food (Tier 1) ---
    hearth_stew: {
        name: 'Cook Hearth Stew', icon: '🍲', station: 'shelter',
        ingredients: { ember_root: 2, hide: 1 },
        result: { item: 'hearth_stew', quantity: 2 },
        description: 'Cook a hearty stew over your campfire.'
    },
    grilled_meat_craft: {
        name: 'Grill Meat', icon: '🍖', station: 'shelter',
        ingredients: { hide: 2 },
        result: { item: 'grilled_meat', quantity: 1 },
        description: 'Grill meat over the fire.'
    },

    // --- Placeables (Tier 1) ---
    placeable_torch_craft: {
        name: 'Craft Torch Stand', icon: '🏮', station: 'workshop',
        ingredients: { wood: 3, iron_ingot: 1 },
        result: { item: 'placeable_torch_stand', quantity: 1 },
        description: 'Build an ornate torch stand for your camp.'
    },
    placeable_storage_chest_craft: {
        name: 'Build Storage Chest', icon: '📦', station: 'workshop',
        ingredients: { wood: 5, iron_ingot: 2 },
        result: { item: 'placeable_storage_chest', quantity: 1 },
        description: 'Build a storage chest. +10 inventory slots.'
    },
    placeable_scarecrow_craft: {
        name: 'Build Scarecrow', icon: '🧸', station: 'workshop',
        ingredients: { wood: 3, woven_cloth: 1, fiber: 2 },
        result: { item: 'placeable_scarecrow', quantity: 1 },
        description: 'Build a scarecrow to protect crops.'
    },
    placeable_flower_pot_craft: {
        name: 'Craft Flower Pot', icon: '🪴', station: 'workshop',
        ingredients: { clay: 3 },
        result: { item: 'placeable_flower_pot', quantity: 1 },
        description: 'Mold a decorative flower pot.'
    },

    // ═══════════════════════════════════════
    // TIER 2 — Ashen Conqueror
    // ═══════════════════════════════════════

    // --- Advanced Weapons ---
    flame_blade: {
        name: 'Forge Flame Blade', icon: '🔥', station: 'forge',
        ingredients: { iron_ingot: 3, flame_essence: 2 },
        result: { item: 'flame_blade', quantity: 1 },
        description: 'Infuse an iron blade with captured flame.'
    },
    shadow_daggers: {
        name: 'Forge Shadow Daggers', icon: '🗡️', station: 'forge',
        ingredients: { iron_ingot: 2, shadow_silk: 2 },
        result: { item: 'shadow_daggers', quantity: 1 },
        description: 'Forge daggers from shadow-infused iron.'
    },
    fen_staff: {
        name: 'Craft Fen Staff', icon: '🪄', station: 'forge',
        ingredients: { wood: 3, bog_fiber: 2, veil_crystal: 1 },
        result: { item: 'fen_staff', quantity: 1 },
        description: 'Craft a staff imbued with swamp magic.'
    },
    steel_sword_craft: {
        name: 'Forge Steel Sword', icon: '⚔️', station: 'forge',
        ingredients: { iron_ingot: 4, coal: 2 },
        result: { item: 'steel_sword', quantity: 1 },
        description: 'Forge a refined steel blade.'
    },
    war_hammer_craft: {
        name: 'Forge War Hammer', icon: '🔨', station: 'forge',
        ingredients: { iron_ingot: 5, wood: 2, leather: 1 },
        result: { item: 'war_hammer', quantity: 1 },
        description: 'Forge a devastating war hammer.'
    },
    crystal_staff_craft: {
        name: 'Craft Crystal Staff', icon: '🪄', station: 'forge',
        ingredients: { wood: 2, veil_crystal: 3, iron_ingot: 1 },
        result: { item: 'crystal_staff', quantity: 1 },
        description: 'Top a staff with a veil crystal.'
    },
    composite_bow_craft: {
        name: 'Craft Composite Bow', icon: '🏹', station: 'workshop',
        ingredients: { hardwood: 2, leather: 2, silk_thread: 1 },
        result: { item: 'composite_bow', quantity: 1 },
        description: 'Laminate wood and horn into a powerful bow.'
    },

    // --- Advanced Armor ---
    bog_leather: {
        name: 'Tan Bog Leather Armor', icon: '🧥', station: 'workshop',
        ingredients: { hide: 4, bog_fiber: 3 },
        result: { item: 'bog_leather', quantity: 1 },
        description: 'Tan swamp hides into resilient armor.'
    },
    warden_plate: {
        name: 'Forge Warden Plate', icon: '🛡️', station: 'forge',
        ingredients: { iron_ingot: 5, hide: 3, stone: 2 },
        result: { item: 'warden_plate', quantity: 1 },
        description: 'Forge heavy plate with protective wards.'
    },
    chainmail_coif_craft: {
        name: 'Forge Chainmail Coif', icon: '🪖', station: 'forge',
        ingredients: { iron_ingot: 3 },
        result: { item: 'chainmail_coif', quantity: 1 },
        description: 'Link iron rings into a protective hood.'
    },
    swift_boots_craft: {
        name: 'Craft Swift Boots', icon: '👢', station: 'workshop',
        ingredients: { leather: 3, silk_thread: 2, veil_crystal: 1 },
        result: { item: 'swift_boots', quantity: 1 },
        description: 'Enchant boots for extra speed.'
    },
    silk_thread_craft: {
        name: 'Spin Silk Thread', icon: '🪡', station: 'workshop',
        ingredients: { fiber: 3, bog_fiber: 2 },
        result: { item: 'silk_thread', quantity: 1 },
        description: 'Spin fine fibers into silk thread.'
    },

    // --- Workclothes ---
    farmers_garb_craft: {
        name: 'Sew Farmer\'s Garb', icon: '👕', station: 'workshop',
        ingredients: { woven_cloth: 3, fiber: 2 },
        result: { item: 'farmers_garb', quantity: 1 },
        description: 'Sew practical farming clothes.'
    },
    miners_gear_craft: {
        name: 'Craft Miner\'s Gear', icon: '🦺', station: 'workshop',
        ingredients: { leather: 3, iron_ingot: 2 },
        result: { item: 'miners_gear', quantity: 1 },
        description: 'Reinforce clothing for mining.'
    },
    foresters_cloak_craft: {
        name: 'Sew Forester\'s Cloak', icon: '🧥', station: 'workshop',
        ingredients: { woven_cloth: 2, leather: 2 },
        result: { item: 'foresters_cloak', quantity: 1 },
        description: 'Fashion a woodsman\'s cloak.'
    },
    herbalists_robes_craft: {
        name: 'Sew Herbalist\'s Robes', icon: '👘', station: 'herbalist_bench',
        ingredients: { woven_cloth: 3, ember_root: 2, bog_fiber: 1 },
        result: { item: 'herbalists_robes', quantity: 1 },
        description: 'Enchant robes for potion-making.'
    },
    anglers_hat_craft: {
        name: 'Craft Angler\'s Hat', icon: '🎩', station: 'workshop',
        ingredients: { woven_cloth: 2, fiber: 2 },
        result: { item: 'anglers_hat', quantity: 1 },
        description: 'Craft a lucky fishing hat.'
    },

    // --- Accessories (Tier 2) ---
    ring_of_vigor_craft: {
        name: 'Craft Ring of Vigor', icon: '💍', station: 'forge',
        ingredients: { iron_ingot: 2, gem_ruby: 1 },
        result: { item: 'ring_of_vigor', quantity: 1 },
        description: 'Set a ruby in iron to boost vitality.'
    },
    ring_of_wisdom_craft: {
        name: 'Craft Ring of Wisdom', icon: '💍', station: 'forge',
        ingredients: { iron_ingot: 2, gem_sapphire: 1 },
        result: { item: 'ring_of_wisdom', quantity: 1 },
        description: 'Set a sapphire in iron to boost wisdom.'
    },
    amulet_of_strength_craft: {
        name: 'Craft Amulet of Strength', icon: '📿', station: 'forge',
        ingredients: { iron_ingot: 3, gem_ruby: 1, leather: 1 },
        result: { item: 'amulet_of_strength', quantity: 1 },
        description: 'Forge an amulet of physical power.'
    },
    amulet_of_warding_craft: {
        name: 'Craft Amulet of Warding', icon: '📿', station: 'forge',
        ingredients: { iron_ingot: 3, gem_sapphire: 1, leather: 1 },
        result: { item: 'amulet_of_warding', quantity: 1 },
        description: 'Forge a protective amulet.'
    },
    ember_pendant_craft: {
        name: 'Craft Ember Pendant', icon: '🔶', station: 'forge',
        ingredients: { iron_ingot: 1, flame_essence: 2, leather: 1 },
        result: { item: 'ember_pendant', quantity: 1 },
        description: 'Capture flame essence in a pendant.'
    },

    // --- Placeables (Tier 2) ---
    placeable_smelter_craft: {
        name: 'Build Smelter', icon: '🏭', station: 'forge',
        ingredients: { stone: 8, iron_ingot: 4, coal: 3 },
        result: { item: 'placeable_smelter', quantity: 1 },
        description: 'Build a dedicated smelting furnace.'
    },
    placeable_anvil_craft: {
        name: 'Build Anvil', icon: '⚒️', station: 'forge',
        ingredients: { iron_ingot: 6, stone: 3 },
        result: { item: 'placeable_anvil', quantity: 1 },
        description: 'Forge a heavy iron anvil.'
    },
    placeable_tanning_rack_craft: {
        name: 'Build Tanning Rack', icon: '🪤', station: 'workshop',
        ingredients: { wood: 5, leather: 2, iron_ingot: 1 },
        result: { item: 'placeable_tanning_rack', quantity: 1 },
        description: 'Build a rack for tanning hides.'
    },
    placeable_loom_craft: {
        name: 'Build Loom', icon: '🧶', station: 'workshop',
        ingredients: { wood: 6, fiber: 4, iron_ingot: 1 },
        result: { item: 'placeable_loom', quantity: 1 },
        description: 'Build a weaving loom.'
    },
    placeable_cooking_pot_craft: {
        name: 'Build Cooking Pot', icon: '🍲', station: 'forge',
        ingredients: { iron_ingot: 3, wood: 2 },
        result: { item: 'placeable_cooking_pot', quantity: 1 },
        description: 'Build a large cooking pot.'
    },
    placeable_bed_craft: {
        name: 'Build Bed', icon: '🛏️', station: 'workshop',
        ingredients: { wood: 5, woven_cloth: 3, fiber: 2 },
        result: { item: 'placeable_bed', quantity: 1 },
        description: 'Build a proper bed for better rest.'
    },
    placeable_well_craft: {
        name: 'Build Well', icon: '🪣', station: 'workshop',
        ingredients: { stone: 8, wood: 3, iron_ingot: 1 },
        result: { item: 'placeable_well', quantity: 1 },
        description: 'Dig a well for crop irrigation.'
    },
    placeable_banner_ashen_craft: {
        name: 'Craft Ashen Banner', icon: '🚩', station: 'workshop',
        ingredients: { woven_cloth: 2, wood: 1, flame_essence: 1 },
        result: { item: 'placeable_banner_ashen', quantity: 1 },
        description: 'Craft an Ashen Wastes banner.'
    },
    placeable_bookshelf_craft: {
        name: 'Build Bookshelf', icon: '📚', station: 'workshop',
        ingredients: { wood: 6, iron_ingot: 1 },
        result: { item: 'placeable_bookshelf', quantity: 1 },
        description: 'Build a shelf for books and lore.'
    },

    // --- Food (Tier 2) ---
    mushroom_soup_craft: {
        name: 'Cook Mushroom Soup', icon: '🍲', station: 'shelter',
        ingredients: { veil_mushroom: 2, ember_root: 1 },
        result: { item: 'mushroom_soup', quantity: 1 },
        description: 'Cook a restorative mushroom soup.'
    },
    cooked_fish_craft: {
        name: 'Cook Fish', icon: '🐟', station: 'shelter',
        ingredients: { raw_fish: 1, wood: 1 },
        result: { item: 'cooked_fish', quantity: 1 },
        description: 'Grill a fresh fish over the fire.'
    },
    fish_stew_craft: {
        name: 'Cook Fish Stew', icon: '🍲', station: 'shelter',
        ingredients: { large_fish: 2, ember_root: 1 },
        result: { item: 'fish_stew', quantity: 1 },
        description: 'Cook a hearty fish stew.'
    },
    grilled_golden_fish_craft: {
        name: 'Grill Golden Fish', icon: '🍽️', station: 'shelter',
        ingredients: { golden_fish: 1, ember_root: 1 },
        result: { item: 'grilled_golden_fish', quantity: 1 },
        description: 'Grill a golden fish to perfection.'
    },
    spicy_fish_skewer_craft: {
        name: 'Cook Spicy Fish Skewer', icon: '🍢', station: 'shelter',
        ingredients: { small_fish: 2, shadow_pepper: 1 },
        result: { item: 'spicy_fish_skewer', quantity: 2 },
        description: 'Spicy grilled fish on a stick.'
    },

    // ═══════════════════════════════════════
    // TIER 3 — Fen Master (Mithril)
    // ═══════════════════════════════════════

    // --- Smelting ---
    mithril_ingot_craft: {
        name: 'Smelt Mithril Ingot', icon: '🔷', station: 'workshop',
        ingredients: { mithril_ore: 2, coal: 2 },
        result: { item: 'mithril_ingot', quantity: 1 },
        description: 'Smelt rare mithril ore into ingots.'
    },

    // --- Materials ---
    shadow_leather_craft: {
        name: 'Tan Shadow Leather', icon: '🖤', station: 'workshop',
        ingredients: { shadow_hide: 2, ectoplasm: 1 },
        result: { item: 'shadow_leather', quantity: 1 },
        description: 'Tan shadow hides into void-touched leather.'
    },
    starweave_cloth_craft: {
        name: 'Weave Starweave Cloth', icon: '🌟', station: 'workshop',
        ingredients: { spectral_thread: 2, silk_thread: 1 },
        result: { item: 'starweave_cloth', quantity: 1 },
        description: 'Weave spectral threads into shimmering cloth.'
    },

    // --- Mithril Tools ---
    mithril_axe_craft: {
        name: 'Forge Mithril Axe', icon: '🪓', station: 'forge',
        ingredients: { mithril_ingot: 2, hardwood: 1 },
        result: { item: 'mithril_axe', quantity: 1 },
        description: 'Forge a featherlight mithril axe.'
    },
    mithril_pickaxe_craft: {
        name: 'Forge Mithril Pickaxe', icon: '⛏️', station: 'forge',
        ingredients: { mithril_ingot: 2, hardwood: 1 },
        result: { item: 'mithril_pickaxe', quantity: 1 },
        description: 'Forge a mithril pickaxe for mining.'
    },
    mithril_sickle_craft: {
        name: 'Forge Mithril Sickle', icon: '🌾', station: 'forge',
        ingredients: { mithril_ingot: 2, hardwood: 1 },
        result: { item: 'mithril_sickle', quantity: 1 },
        description: 'Forge a mithril sickle for rare herb gathering.'
    },
    mithril_hammer_craft: {
        name: 'Forge Mithril Hammer', icon: '🔨', station: 'forge',
        ingredients: { mithril_ingot: 3, hardwood: 1 },
        result: { item: 'mithril_hammer', quantity: 1 },
        description: 'Forge a mithril hammer for building.'
    },

    // --- Mithril Weapons ---
    mithril_sword_craft: {
        name: 'Forge Mithril Sword', icon: '⚔️', station: 'forge',
        ingredients: { mithril_ingot: 4, hardwood: 1 },
        result: { item: 'mithril_sword', quantity: 1 },
        description: 'Forge a gleaming mithril blade.'
    },
    mithril_daggers_craft: {
        name: 'Forge Mithril Daggers', icon: '🗡️', station: 'forge',
        ingredients: { mithril_ingot: 3, shadow_silk: 1 },
        result: { item: 'mithril_daggers', quantity: 1 },
        description: 'Forge twin mithril daggers.'
    },
    mithril_maul_craft: {
        name: 'Forge Mithril Maul', icon: '🔨', station: 'forge',
        ingredients: { mithril_ingot: 5, hardwood: 2 },
        result: { item: 'mithril_maul', quantity: 1 },
        description: 'Forge an impossibly light mithril maul.'
    },
    mithril_staff_craft: {
        name: 'Forge Mithril Staff', icon: '🪄', station: 'forge',
        ingredients: { mithril_ingot: 3, veil_crystal: 2, hardwood: 1 },
        result: { item: 'mithril_staff', quantity: 1 },
        description: 'Forge the perfect magical conduit.'
    },
    mithril_bow_craft: {
        name: 'Craft Mithril Bow', icon: '🏹', station: 'workshop',
        ingredients: { mithril_ingot: 2, hardwood: 2, silk_thread: 2 },
        result: { item: 'mithril_bow', quantity: 1 },
        description: 'Craft a mithril-stringed bow.'
    },

    // --- Mithril Armor ---
    mithril_plate_craft: {
        name: 'Forge Mithril Plate', icon: '🛡️', station: 'forge',
        ingredients: { mithril_ingot: 6, hardened_leather: 2 },
        result: { item: 'mithril_plate', quantity: 1 },
        description: 'Forge full mithril plate armor.'
    },
    runebound_plate_craft: {
        name: 'Forge Runebound Plate', icon: '🛡️', station: 'forge',
        ingredients: { iron_ingot: 5, veil_crystal: 2, flame_essence: 2 },
        result: { item: 'runebound_plate', quantity: 1 },
        description: 'Inscribe runes of protection on heavy plate.'
    },
    mithril_helm_craft: {
        name: 'Forge Mithril Helm', icon: '🪖', station: 'forge',
        ingredients: { mithril_ingot: 3 },
        result: { item: 'mithril_helm', quantity: 1 },
        description: 'Forge a gleaming mithril helm.'
    },
    mithril_boots_craft: {
        name: 'Forge Mithril Boots', icon: '👢', station: 'forge',
        ingredients: { mithril_ingot: 2, hardened_leather: 1 },
        result: { item: 'mithril_boots', quantity: 1 },
        description: 'Forge mithril-plated boots.'
    },
    mithril_shield_craft: {
        name: 'Forge Mithril Shield', icon: '🛡️', station: 'forge',
        ingredients: { mithril_ingot: 4 },
        result: { item: 'mithril_shield', quantity: 1 },
        description: 'Forge a mithril shield.'
    },
    mantle_of_the_hollow_craft: {
        name: 'Weave Mantle of the Hollow', icon: '🧥', station: 'workshop',
        ingredients: { shadow_leather: 2, shadow_silk: 3, ectoplasm: 2 },
        result: { item: 'mantle_of_the_hollow', quantity: 1 },
        description: 'Weave shadows of the dead into armor.'
    },

    // --- Accessories (Tier 3) ---
    cloak_of_shadows_craft: {
        name: 'Weave Cloak of Shadows', icon: '🧣', station: 'workshop',
        ingredients: { shadow_silk: 3, shadow_leather: 1, ectoplasm: 1 },
        result: { item: 'cloak_of_shadows', quantity: 1 },
        description: 'Weave a cloak from pure darkness.'
    },
    veil_ring_craft: {
        name: 'Craft Veil Ring', icon: '💍', station: 'forge',
        ingredients: { mithril_ingot: 1, veil_crystal: 2 },
        result: { item: 'veil_ring', quantity: 1 },
        description: 'Set veil crystals in a mithril ring.'
    },
    tome_of_flames_craft: {
        name: 'Bind Tome of Flames', icon: '📕', station: 'herbalist_bench',
        ingredients: { leather: 2, flame_essence: 3, gem_ruby: 1 },
        result: { item: 'tome_of_flames', quantity: 1 },
        description: 'Bind fire magic into an ancient tome.'
    },
    crystal_focus_craft: {
        name: 'Craft Crystal Focus', icon: '🔮', station: 'forge',
        ingredients: { veil_crystal: 3, mithril_ingot: 1, gem_amethyst: 1 },
        result: { item: 'crystal_focus', quantity: 1 },
        description: 'Shape crystals into a magical focus.'
    },

    // --- Placeables (Tier 3) ---
    placeable_alchemy_table_craft: {
        name: 'Build Alchemy Table', icon: '🧪', station: 'herbalist_bench',
        ingredients: { hardwood: 4, veil_crystal: 2, glass: 3, iron_ingot: 2 },
        result: { item: 'placeable_alchemy_table', quantity: 1 },
        description: 'Build an advanced alchemy station.'
    },
    placeable_rug_craft: {
        name: 'Weave Rug', icon: '🟫', station: 'workshop',
        ingredients: { woven_cloth: 3, silk_thread: 2 },
        result: { item: 'placeable_rug', quantity: 1 },
        description: 'Weave a decorative rug.'
    },
    placeable_weapon_rack_craft: {
        name: 'Build Weapon Rack', icon: '⚔️', station: 'workshop',
        ingredients: { hardwood: 4, iron_ingot: 2 },
        result: { item: 'placeable_weapon_rack', quantity: 1 },
        description: 'Build a weapon display rack.'
    },
    placeable_banner_fen_craft: {
        name: 'Craft Fen Banner', icon: '🚩', station: 'workshop',
        ingredients: { woven_cloth: 2, wood: 1, ectoplasm: 1 },
        result: { item: 'placeable_banner_fen', quantity: 1 },
        description: 'Craft a Hollowfen banner.'
    },

    // --- Potions (Tier 3) ---
    supreme_health_craft: {
        name: 'Brew Supreme Health Potion', icon: '❤️', station: 'herbalist_bench',
        ingredients: { ember_root: 4, flame_essence: 2, veil_crystal: 1 },
        result: { item: 'supreme_health_potion', quantity: 1 },
        description: 'Brew the ultimate healing draught.'
    },
    elixir_of_power_craft: {
        name: 'Brew Elixir of Power', icon: '💪', station: 'herbalist_bench',
        ingredients: { flame_essence: 2, gem_ruby: 1 },
        result: { item: 'elixir_of_power', quantity: 1 },
        description: 'Brew a combat-boosting elixir.'
    },
    elixir_of_iron_craft: {
        name: 'Brew Elixir of Iron', icon: '🛡️', station: 'herbalist_bench',
        ingredients: { iron_ingot: 1, ember_root: 2, gem_sapphire: 1 },
        result: { item: 'elixir_of_iron', quantity: 1 },
        description: 'Brew a defensive elixir.'
    },
    elixir_of_haste_craft: {
        name: 'Brew Elixir of Haste', icon: '⚡', station: 'herbalist_bench',
        ingredients: { bog_fiber: 3, veil_crystal: 1 },
        result: { item: 'elixir_of_haste', quantity: 1 },
        description: 'Brew a speed-boosting elixir.'
    },

    // --- Food (Tier 3) ---
    void_steak_craft: {
        name: 'Cook Void Steak', icon: '🥩', station: 'shelter',
        ingredients: { shadow_hide: 1, ember_root: 1, flame_essence: 1 },
        result: { item: 'void_steak', quantity: 1 },
        description: 'Sear void creature meat in flame.'
    },
    feast_platter_craft: {
        name: 'Prepare Feast Platter', icon: '🍽️', station: 'shelter',
        ingredients: { grilled_meat: 2, mushroom_soup: 1, ember_root: 2 },
        result: { item: 'feast_platter', quantity: 1 },
        description: 'Prepare a grand feast.'
    },

    // ═══════════════════════════════════════
    // TIER 4 — Void Walker
    // ═══════════════════════════════════════

    // --- Smelting ---
    void_ingot_craft: {
        name: 'Smelt Void Ingot', icon: '🟣', station: 'workshop',
        ingredients: { void_ore: 2, coal: 3, flame_essence: 1 },
        result: { item: 'void_ingot', quantity: 1 },
        description: 'Smelt reality-bending void ore.'
    },

    // --- Void Tools ---
    void_axe_craft: {
        name: 'Forge Void Axe', icon: '🪓', station: 'forge',
        ingredients: { void_ingot: 3, ironwood: 1 },
        result: { item: 'void_axe', quantity: 1 },
        description: 'Forge an axe that cuts through anything.'
    },
    void_pickaxe_craft: {
        name: 'Forge Void Pickaxe', icon: '⛏️', station: 'forge',
        ingredients: { void_ingot: 3, ironwood: 1 },
        result: { item: 'void_pickaxe', quantity: 1 },
        description: 'Forge a pickaxe that phases through rock.'
    },

    // --- Void Weapons ---
    void_blade_craft: {
        name: 'Forge Void Blade', icon: '🌀', station: 'forge',
        ingredients: { void_ingot: 5, ruun_shard: 1 },
        result: { item: 'void_blade', quantity: 1 },
        description: 'Forge a blade that splits reality.'
    },
    void_stiletto_craft: {
        name: 'Forge Void Stiletto', icon: '🗡️', station: 'forge',
        ingredients: { void_ingot: 3, spectral_thread: 2 },
        result: { item: 'void_stiletto', quantity: 1 },
        description: 'Forge a needle-thin void blade.'
    },
    void_crusher_craft: {
        name: 'Forge Void Crusher', icon: '🔨', station: 'forge',
        ingredients: { void_ingot: 6, ironwood: 2 },
        result: { item: 'void_crusher', quantity: 1 },
        description: 'Forge a hammer that compresses space.'
    },
    void_scepter_craft: {
        name: 'Forge Void Scepter', icon: '🪄', station: 'forge',
        ingredients: { void_ingot: 4, ruun_shard: 1, veil_crystal: 3 },
        result: { item: 'void_scepter', quantity: 1 },
        description: 'Forge a scepter that commands reality.'
    },
    whisper_of_ruun_craft: {
        name: 'Forge Whisper of Ruun', icon: '🌀', station: 'forge',
        ingredients: { void_ingot: 3, ruun_shard: 2, spectral_thread: 2 },
        result: { item: 'whisper_of_ruun', quantity: 1 },
        description: 'Crystallize void-whispers into a legendary blade.'
    },

    // --- Void Armor ---
    void_plate_craft: {
        name: 'Forge Void Plate', icon: '🛡️', station: 'forge',
        ingredients: { void_ingot: 6, shadow_leather: 2, ruun_shard: 1 },
        result: { item: 'void_plate', quantity: 1 },
        description: 'Forge armor from void ingots.'
    },
    void_crown_craft: {
        name: 'Forge Void Crown', icon: '👑', station: 'forge',
        ingredients: { void_ingot: 3, gem_amethyst: 2, ruun_shard: 1 },
        result: { item: 'void_crown', quantity: 1 },
        description: 'Forge a crown that bends reality.'
    },
    void_striders_craft: {
        name: 'Forge Void Striders', icon: '👢', station: 'forge',
        ingredients: { void_ingot: 3, shadow_leather: 1, spectral_thread: 1 },
        result: { item: 'void_striders', quantity: 1 },
        description: 'Forge boots that step between dimensions.'
    },
    void_ward_craft: {
        name: 'Forge Void Ward', icon: '🛡️', station: 'forge',
        ingredients: { void_ingot: 4, veil_crystal: 2 },
        result: { item: 'void_ward', quantity: 1 },
        description: 'Forge a shield that negates magic.'
    },

    // --- Void Accessories ---
    amulet_of_the_void_craft: {
        name: 'Forge Amulet of the Void', icon: '📿', station: 'forge',
        ingredients: { void_ingot: 3, gem_amethyst: 1, gem_ruby: 1, gem_sapphire: 1 },
        result: { item: 'amulet_of_the_void', quantity: 1 },
        description: 'Set three gems in void metal.'
    },
    ruun_sigil_craft: {
        name: 'Forge Sigil of Ruun', icon: '⭐', station: 'forge',
        ingredients: { void_ingot: 2, ruun_shard: 3, gem_amethyst: 2 },
        result: { item: 'ruun_sigil', quantity: 1 },
        description: 'Forge a sigil of ultimate power.'
    },

    // --- Void Placeables ---
    placeable_enchanting_table_craft: {
        name: 'Build Enchanting Table', icon: '✨', station: 'forge',
        ingredients: { void_ingot: 3, veil_crystal: 4, hardwood: 3, gem_amethyst: 1 },
        result: { item: 'placeable_enchanting_table', quantity: 1 },
        description: 'Build a mystical enchanting table.'
    },
    placeable_trophy_mount_craft: {
        name: 'Build Trophy Mount', icon: '🏆', station: 'workshop',
        ingredients: { hardwood: 4, iron_ingot: 2, gold_nugget: 1 },
        result: { item: 'placeable_trophy_mount', quantity: 1 },
        description: 'Build a mount for boss trophies.'
    },
    placeable_banner_void_craft: {
        name: 'Craft Void Banner', icon: '🚩', station: 'workshop',
        ingredients: { starweave_cloth: 1, wood: 1, void_essence: 1 },
        result: { item: 'placeable_banner_void', quantity: 1 },
        description: 'Craft a Void Sanctum banner.'
    },

    // --- Void Potions ---
    void_tonic_craft: {
        name: 'Brew Void Tonic', icon: '🟣', station: 'herbalist_bench',
        ingredients: { void_essence: 2, flame_essence: 1, ember_root: 2 },
        result: { item: 'void_tonic', quantity: 1 },
        description: 'Brew a dangerous all-stat elixir.'
    },
    elixir_of_restoration_craft: {
        name: 'Brew Elixir of Restoration', icon: '💜', station: 'herbalist_bench',
        ingredients: { void_essence: 1, ruun_shard: 1, ember_root: 3 },
        result: { item: 'elixir_of_restoration', quantity: 1 },
        description: 'Brew a full-restore elixir.'
    }
};

// Crop definitions for farming
const CROPS = {
    ember_root_seed: {
        name: 'Ember Root', icon: '🌱',
        growthTurns: 8,
        harvestItem: 'ember_root_crop',
        harvestQty: 3,
        seedCost: { ember_root: 1 },
        stages: ['🟫', '🌱', '🌿', '🥕']
    },
    veil_mushroom_seed: {
        name: 'Veil Mushroom', icon: '🍄',
        growthTurns: 6,
        harvestItem: 'veil_mushroom',
        harvestQty: 2,
        seedCost: { bog_fiber: 2 },
        stages: ['🟫', '🟤', '🍄', '🍄']
    },
    blood_blossom_seed: {
        name: 'Blood Blossom', icon: '🌺',
        growthTurns: 10,
        harvestItem: 'blood_blossom',
        harvestQty: 2,
        seedCost: { ember_root: 1, bog_fiber: 1 },
        stages: ['🟫', '🌱', '🌿', '🌺']
    },
    shadow_pepper_seed: {
        name: 'Shadow Pepper', icon: '🌶️',
        growthTurns: 7,
        harvestItem: 'shadow_pepper',
        harvestQty: 2,
        seedCost: { ember_root: 1, flame_essence: 1 },
        stages: ['🟫', '🌱', '🌿', '🌶️']
    },
    starfruit_seed: {
        name: 'Starfruit', icon: '⭐',
        growthTurns: 12,
        harvestItem: 'starfruit',
        harvestQty: 2,
        seedCost: { veil_crystal: 1, bog_fiber: 2 },
        stages: ['🟫', '🌱', '🌿', '⭐']
    },
    ironroot_seed: {
        name: 'Ironroot', icon: '🥔',
        growthTurns: 9,
        harvestItem: 'ironroot_tuber',
        harvestQty: 3,
        seedCost: { iron_ore: 1, ember_root: 1 },
        stages: ['🟫', '🌱', '🥔', '🥔']
    },
    voidberry_seed: {
        name: 'Voidberry', icon: '🫐',
        growthTurns: 15,
        harvestItem: 'voidberry',
        harvestQty: 2,
        seedCost: { void_essence: 1, bog_fiber: 2 },
        stages: ['🟫', '🌱', '🌿', '🫐']
    }
};
