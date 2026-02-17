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
    'L': { name: 'Lantern', passable: false, color: '#5a5a2a', emoji: '🏮' }
};

// Each map: 20 wide x 15 tall
const MAPS = {
    // =============================
    // ASHEN WASTES
    // =============================
    ruined_outpost: {
        width: 20, height: 15,
        terrain: [
            '####################',
            '#T..R..T....R..T..p#',
            '#....T......T.....p#',
            '#.T....R.........pp#',
            '#......##..##.....p#',
            '#..T...#....#..T.pp#',
            '#......#.F..#....p.#',
            '#..R...#....#......#',
            '#......##D.##..R..p#',
            '#.T..............pp#',
            '#....R....T.......p#',
            '#..T.....R...T..T.p#',
            '#.....T........R..p#',
            '#T..R......T......p#',
            '####pppppppppppppp##'
        ],
        playerStart: { x: 9, y: 7 },
        exits: {
            south: { to: 'scorched_village', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 4, y: 3, type: 'npc', id: 'spirit_of_aldric' },
            { x: 14, y: 2, type: 'enemy_spawn', enemies: ['void_rat', 'ashen_wraith'] },
            { x: 3, y: 10, type: 'enemy_spawn', enemies: ['void_rat'] },
            { x: 16, y: 11, type: 'enemy_spawn', enemies: ['void_rat', 'scorched_bandit'] },
            { x: 12, y: 5, type: 'chest', loot: ['health_vial', 'health_vial'] }
        ]
    },

    scorched_village: {
        width: 20, height: 15,
        terrain: [
            '####pppppppppppppp##',
            '#...p..........R..p#',
            '#.T.p..##..##.....p#',
            '#...p..#....#..T..p#',
            '#...p..#.X..#.....p#',
            '#.R.p..##..##..R.pp#',
            '#...p.............p#',
            '#...pppppppppp....p#',
            '#.T.p........p.T..p#',
            '#...p..##..##p....p#',
            '#R..p..#.X..#p..R.p#',
            '#...p..#....#p....p#',
            '#.T.p..##..##p.T..p#',
            '#...p........p....p#',
            '##pppppppppppppppp##'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'ruined_outpost', entryX: 10, entryY: 13 },
            south: { to: 'emberhold', entryX: 10, entryY: 1 },
            east: { to: 'player_camp', entryX: 1, entryY: 7 }
        },
        entities: [
            { x: 13, y: 3, type: 'npc', id: 'wandering_merchant' },
            { x: 7, y: 8, type: 'enemy_spawn', enemies: ['scorched_bandit', 'ember_hound'] },
            { x: 15, y: 10, type: 'enemy_spawn', enemies: ['ashen_wraith', 'scorched_bandit'] }
        ]
    },

    emberhold: {
        width: 20, height: 15,
        terrain: [
            '##pppppppppppppppp##',
            '#.p....L......L..p.#',
            '#.p..##D####D##..p.#',
            '#.p..#......#..#.p.#',
            '#.p..#......#..#.p.#',
            '#.p..########..#.p.#',
            '#.ppppppppppppppp..#',
            '#.p..L...F...L..p..#',
            '#.ppppppppppppppp..#',
            '#.p..##D####D##..p.#',
            '#.p..#......#..#.p.#',
            '#.p..#......#..#.p.#',
            '#.p..########..#.p.#',
            '#.p....L......L..p.#',
            '##pppppppppppppppp##'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'scorched_village', entryX: 10, entryY: 13 },
            south: { to: 'ashen_throne', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 5, y: 3, type: 'npc', id: 'emberhold_blacksmith' },
            { x: 14, y: 3, type: 'npc', id: 'emberhold_herbalist' },
            { x: 5, y: 10, type: 'npc', id: 'emberhold_innkeeper' },
            { x: 14, y: 10, type: 'npc', id: 'wandering_merchant' },
            { x: 10, y: 7, type: 'campfire' }
        ]
    },

    player_camp: {
        width: 20, height: 15,
        terrain: [
            'fffffffffffffffffff#',
            'f..................f',
            'f..B.....B.....B..f',
            'f..................f',
            'f..................f',
            'f..B.....F.....B..f',
            'f..................f',
            'p..................f',
            'f..................f',
            'f..B.....B.....B..f',
            'f..................f',
            'f..................f',
            'f..B.....B.....B..f',
            'f..................f',
            'ffffffffffffffffffff'
        ],
        playerStart: { x: 10, y: 7 },
        exits: {
            west: { to: 'scorched_village', entryX: 18, entryY: 7 }
        },
        entities: [
            { x: 10, y: 5, type: 'campfire' }
        ],
        isCamp: true,
        buildingSpots: [
            { x: 3, y: 2, id: 'shelter', label: 'Shelter' },
            { x: 10, y: 2, id: 'forge', label: 'Forge' },
            { x: 17, y: 2, id: 'workshop', label: 'Workshop' },
            { x: 3, y: 5, id: 'storage', label: 'Storage' },
            { x: 17, y: 5, id: 'ward_stones', label: 'Ward Stones' },
            { x: 3, y: 9, id: 'garden', label: 'Garden' },
            { x: 10, y: 9, id: 'farm', label: 'Farm Plot' },
            { x: 17, y: 9, id: 'herbalist_bench', label: 'Herb Bench' },
            { x: 3, y: 12, id: 'house', label: 'House' },
            { x: 10, y: 12, id: 'training_dummy', label: 'Training Grounds' },
            { x: 17, y: 12, id: 'lookout', label: 'Lookout Tower' }
        ]
    },

    ashen_throne: {
        width: 20, height: 15,
        terrain: [
            '##pppppppppppppppp##',
            '#..p..X........X.p.#',
            '#..p..####..####.p.#',
            '#..p..#........#.p.#',
            '#..p..#........#.p.#',
            '#..p..#...F....#.p.#',
            '#..ppp#........#pp.#',
            '#.....D........D...#',
            '#..ppp#........#pp.#',
            '#..p..#........#.p.#',
            '#..p..#........#.p.#',
            '#..p..####..####.p.#',
            '#..p..X........X.p.#',
            '#..p...............#',
            '####################'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'emberhold', entryX: 10, entryY: 13 }
        },
        entities: [
            { x: 10, y: 5, type: 'boss', id: 'the_ashen_king' },
            { x: 4, y: 2, type: 'enemy_spawn', enemies: ['ashen_wraith'] },
            { x: 15, y: 2, type: 'enemy_spawn', enemies: ['ashen_wraith'] },
            { x: 4, y: 12, type: 'enemy_spawn', enemies: ['ember_hound'] },
            { x: 15, y: 12, type: 'enemy_spawn', enemies: ['ember_hound'] }
        ],
        bossArea: true,
        regionUnlock: { boss: 'the_ashen_king', unlocks: 'hollowfen' }
    },

    // =============================
    // HOLLOWFEN
    // =============================
    sunken_chapel: {
        width: 20, height: 15,
        terrain: [
            '~~~~~~~~~~~~~~~~~~~~',
            '~~..H...~...H..T.~~',
            '~..T..H..~..T....~#',
            '~....~~..T....H...~',
            '~.T.~~~..........T~',
            '~...~~.....H......~',
            '~......T.....T..H.~',
            '~..H....##D##..T..~',
            '~...T...#...#.....~',
            '~.......#.F.#..H..~',
            '~..H....#...#..T..~',
            '~.T.....#####.....~',
            '~....H......T...H.~',
            '~..T......H....T..~',
            '~~~~pppppppppppp~~~~'
        ],
        playerStart: { x: 10, y: 7 },
        exits: {
            south: { to: 'stilthaven', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 10, y: 9, type: 'campfire' },
            { x: 4, y: 3, type: 'enemy_spawn', enemies: ['bog_crawler'] },
            { x: 15, y: 5, type: 'enemy_spawn', enemies: ['bog_crawler', 'fen_witch'] },
            { x: 7, y: 11, type: 'chest', loot: ['health_vial', 'antidote', 'mana_vial'] }
        ]
    },

    stilthaven: {
        width: 20, height: 15,
        terrain: [
            '~~~~pppppppppppp~~~~',
            '~~bbp..L......L.bb~~',
            '~.bbp.##D####D#.bb.~',
            '~..bp.#......#.#.b.~',
            '~..bp.#......#.#.b.~',
            '~..bp.########.#.b.~',
            '~..bpppppppppppppb.~',
            '~..bp..L..F..L..pb.~',
            '~..bpppppppppppppb.~',
            '~..bp.##D####D#.pb.~',
            '~..bp.#......#.#pb.~',
            '~..bp.#......#.#pb.~',
            '~..bp.########.#pb.~',
            '~~bbp..L......Lpbb~~',
            '~~~~pppppppppppp~~~~'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'sunken_chapel', entryX: 10, entryY: 13 },
            south: { to: 'witchs_hut', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 4, y: 3, type: 'npc', id: 'stilthaven_blacksmith' },
            { x: 14, y: 3, type: 'npc', id: 'stilthaven_herbalist' },
            { x: 4, y: 10, type: 'npc', id: 'stilthaven_innkeeper' },
            { x: 10, y: 7, type: 'campfire' }
        ]
    },

    witchs_hut: {
        width: 20, height: 15,
        terrain: [
            '~~~~pppppppppppp~~~~',
            '~~..H..M..H..T..M~~',
            '~..T..H...~..H.T..~',
            '~.H..~~...M...H...~',
            '~...~~~..T.....M..~',
            '~.M.~~.....H......~',
            '~.......##D##..T..~',
            '~..H....#...#.M...~',
            '~..M....#.F.#.....~',
            '~...T...#...#..H..~',
            '~.......#####..M..~',
            '~..H......T...H...~',
            '~.M..H......M...T.~',
            '~..T......H....M..~',
            '~~~~pppppppppppp~~~~'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'stilthaven', entryX: 10, entryY: 13 },
            south: { to: 'heart_of_the_fen', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 9, y: 8, type: 'npc', id: 'granny_moss' },
            { x: 5, y: 4, type: 'enemy_spawn', enemies: ['fen_witch'] },
            { x: 15, y: 10, type: 'enemy_spawn', enemies: ['bog_crawler', 'drowned_knight'] }
        ]
    },

    heart_of_the_fen: {
        width: 20, height: 15,
        terrain: [
            '~~~~pppppppppppp~~~~',
            '~~..H..~...H..T..~~',
            '~..T..H..~..T....~#',
            '~....~~..T....H...~',
            '~.T.~~~..........T~',
            '~...~~.~~...H..~..~',
            '~......~.~~~.~..H.~',
            '~..H...~~...~~.T..~',
            '~...T..~..X..~....~',
            '~.......~~..~~..H.~',
            '~..H....~.~~~.....~',
            '~.T.....~~...~..T.~',
            '~....H......T...H.~',
            '~..T......H....T..~',
            '~~~~~~~~~~~~~~~~~~~~'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'witchs_hut', entryX: 10, entryY: 13 }
        },
        entities: [
            { x: 10, y: 8, type: 'boss', id: 'mother_of_the_fen' },
            { x: 5, y: 4, type: 'enemy_spawn', enemies: ['drowned_knight'] },
            { x: 15, y: 6, type: 'enemy_spawn', enemies: ['fen_witch', 'drowned_knight'] },
            { x: 7, y: 11, type: 'enemy_spawn', enemies: ['bog_crawler', 'bog_crawler'] }
        ],
        bossArea: true,
        regionUnlock: { boss: 'mother_of_the_fen', unlocks: 'void_sanctum' }
    },

    // =============================
    // VOID SANCTUM
    // =============================
    outer_gate: {
        width: 20, height: 15,
        terrain: [
            '####################',
            '#...R..V......R..V.#',
            '#.V.....##..##.....#',
            '#.....R.#....#..V..#',
            '#..V....#.X..#.....#',
            '#.R.....##..##..R..#',
            '#......pppppp......#',
            '#...V..p....p..V...#',
            '#......pppppp......#',
            '#..R...##..##...R..#',
            '#.V....#.X..#..V...#',
            '#......#....#......#',
            '#...R..##..##..R...#',
            '#.V..........V..R..#',
            '######pppppp########'
        ],
        playerStart: { x: 10, y: 7 },
        exits: {
            south: { to: 'last_vigil', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 5, y: 4, type: 'enemy_spawn', enemies: ['void_acolyte'] },
            { x: 14, y: 10, type: 'enemy_spawn', enemies: ['reality_shard', 'void_acolyte'] },
            { x: 10, y: 3, type: 'chest', loot: ['greater_health_potion', 'elixir_of_power'] }
        ]
    },

    last_vigil: {
        width: 20, height: 15,
        terrain: [
            '######pppppp########',
            '#..p..L......L..p..#',
            '#..p..##D####D##p..#',
            '#..p..#......#.#p..#',
            '#..p..#......#.#p..#',
            '#..p..########.#p..#',
            '#..ppppppppppppppp.#',
            '#..p..L..F...L..p..#',
            '#..ppppppppppppppp.#',
            '#..p..##D####D##p..#',
            '#..p..#......#.#p..#',
            '#..p..#......#.#p..#',
            '#..p..########.#p..#',
            '#..p..L......L..p..#',
            '######pppppp########'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'outer_gate', entryX: 10, entryY: 13 },
            south: { to: 'hall_of_echoes', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 5, y: 3, type: 'npc', id: 'vigil_blacksmith' },
            { x: 14, y: 3, type: 'npc', id: 'vigil_herbalist' },
            { x: 5, y: 10, type: 'npc', id: 'vigil_innkeeper' },
            { x: 10, y: 7, type: 'campfire' }
        ]
    },

    hall_of_echoes: {
        width: 20, height: 15,
        terrain: [
            '######pppppp########',
            '#..V.p........V.p..#',
            '#....p.##..##..p...#',
            '#.V..p.#.S..#.pV..#',
            '#....p.#....#.p...#',
            '#..V.p.##..##.p.V.#',
            '#....p.........p...#',
            '#.V..ppppppppppp.V.#',
            '#....p.........p...#',
            '#..V.p.##..##.p.V.#',
            '#....p.#.S..#.p...#',
            '#.V..p.#....#.pV..#',
            '#....p.##..##..p...#',
            '#..V.p........V.p..#',
            '######pppppp########'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'last_vigil', entryX: 10, entryY: 13 },
            south: { to: 'throne_of_unmaking', entryX: 10, entryY: 1 }
        },
        entities: [
            { x: 4, y: 4, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 15, y: 9, type: 'enemy_spawn', enemies: ['reality_shard', 'void_acolyte'] },
            { x: 10, y: 3, type: 'enemy_spawn', enemies: ['shadow_sentinel', 'void_acolyte'] }
        ]
    },

    throne_of_unmaking: {
        width: 20, height: 15,
        terrain: [
            '######pppppp########',
            '#..V..p......V..p..#',
            '#.....p.####.p....#',
            '#..V..p.#..#..p.V.#',
            '#.....p.#..#..p...#',
            '#..V..p.#..#..p.V.#',
            '#.....pppppppp.....#',
            '#..V.......X.....V#',
            '#.....pppppppp.....#',
            '#..V..p.#..#..p.V.#',
            '#.....p.#..#..p...#',
            '#..V..p.#..#..p.V.#',
            '#.....p.####.p....#',
            '#..V..p......V..p..#',
            '####################'
        ],
        playerStart: { x: 10, y: 1 },
        exits: {
            north: { to: 'hall_of_echoes', entryX: 10, entryY: 13 }
        },
        entities: [
            { x: 10, y: 7, type: 'boss', id: 'ruun_the_unraveler' },
            { x: 4, y: 3, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 15, y: 3, type: 'enemy_spawn', enemies: ['shadow_sentinel'] },
            { x: 4, y: 11, type: 'enemy_spawn', enemies: ['void_acolyte'] },
            { x: 15, y: 11, type: 'enemy_spawn', enemies: ['void_acolyte'] }
        ],
        bossArea: true
    }
};

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

// Crafting recipes
const RECIPES = {
    // Workshop recipes (smelting and basic crafting)
    iron_ingot: {
        name: 'Smelt Iron Ingot', icon: '🔩',
        station: 'workshop',
        ingredients: { iron_ore: 2 },
        result: { item: 'iron_ingot', quantity: 1 },
        description: 'Smelt raw iron ore into a usable ingot.'
    },
    health_vial_craft: {
        name: 'Brew Health Vial', icon: '❤️',
        station: 'herbalist_bench',
        ingredients: { ember_root: 2 },
        result: { item: 'health_vial', quantity: 2 },
        description: 'Brew healing vials from ember root.'
    },
    mana_vial_craft: {
        name: 'Brew Mana Vial', icon: '💙',
        station: 'herbalist_bench',
        ingredients: { bog_fiber: 2, ember_root: 1 },
        result: { item: 'mana_vial', quantity: 2 },
        description: 'Brew mana vials from swamp herbs.'
    },
    antidote_craft: {
        name: 'Brew Antidote', icon: '💚',
        station: 'herbalist_bench',
        ingredients: { bog_fiber: 3 },
        result: { item: 'antidote', quantity: 2 },
        description: 'Brew antidotes from cleansing herbs.'
    },
    greater_health_craft: {
        name: 'Brew Greater Health Potion', icon: '❤️',
        station: 'herbalist_bench',
        ingredients: { ember_root: 3, flame_essence: 1 },
        result: { item: 'greater_health_potion', quantity: 1 },
        description: 'Brew a potent healing potion.'
    },

    // Forge recipes (weapons and armor)
    iron_sword: {
        name: 'Forge Iron Sword', icon: '⚔️',
        station: 'forge',
        ingredients: { iron_ingot: 3, wood: 1 },
        result: { item: 'iron_sword', quantity: 1 },
        description: 'Forge a sturdy iron sword.'
    },
    flame_blade: {
        name: 'Forge Flame Blade', icon: '🔥',
        station: 'forge',
        ingredients: { iron_ingot: 3, flame_essence: 2 },
        result: { item: 'flame_blade', quantity: 1 },
        description: 'Infuse an iron blade with captured flame.'
    },
    veil_blade: {
        name: 'Forge Veil Blade', icon: '🌀',
        station: 'forge',
        ingredients: { iron_ingot: 4, veil_crystal: 3, shadow_silk: 1 },
        result: { item: 'veil_blade', quantity: 1 },
        description: 'Forge a reality-phasing blade.'
    },
    shadow_daggers: {
        name: 'Forge Shadow Daggers', icon: '🗡️',
        station: 'forge',
        ingredients: { iron_ingot: 2, shadow_silk: 2 },
        result: { item: 'shadow_daggers', quantity: 1 },
        description: 'Forge daggers from shadow-infused iron.'
    },
    fen_staff: {
        name: 'Craft Fen Staff', icon: '🪄',
        station: 'forge',
        ingredients: { wood: 3, bog_fiber: 2, veil_crystal: 1 },
        result: { item: 'fen_staff', quantity: 1 },
        description: 'Craft a staff imbued with swamp magic.'
    },
    warden_plate: {
        name: 'Forge Warden Plate', icon: '🛡️',
        station: 'forge',
        ingredients: { iron_ingot: 5, hide: 3, stone: 2 },
        result: { item: 'warden_plate', quantity: 1 },
        description: 'Forge heavy plate armor with protective wards.'
    },
    bog_leather: {
        name: 'Tan Bog Leather', icon: '🧥',
        station: 'workshop',
        ingredients: { hide: 4, bog_fiber: 3 },
        result: { item: 'bog_leather', quantity: 1 },
        description: 'Tan swamp hides into resilient armor.'
    },
    chainmail_vest_craft: {
        name: 'Forge Chainmail Vest', icon: '🦺',
        station: 'forge',
        ingredients: { iron_ingot: 4 },
        result: { item: 'chainmail_vest', quantity: 1 },
        description: 'Link iron rings into a protective vest.'
    },

    // Food recipes (from garden produce)
    hearth_stew: {
        name: 'Cook Hearth Stew', icon: '🍲',
        station: 'shelter',
        ingredients: { ember_root: 2, hide: 1 },
        result: { item: 'hearth_stew', quantity: 2 },
        description: 'Cook a hearty stew over your campfire.'
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
    }
};
