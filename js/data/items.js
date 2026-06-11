// ============================================
// ITEMS DATA — Complete Catalog
// ============================================

const ITEMS = {
    // ═══════════════════════════════════════════
    // RESOURCES — RAW MATERIALS
    // ═══════════════════════════════════════════

    // --- Wood (3 tiers) ---
    wood: {
        name: 'Wood', icon: '🪵', type: 'resource', stackable: true,
        description: 'Salvaged lumber. The foundation of all construction.', value: 3, tier: 1
    },
    hardwood: {
        name: 'Hardwood', icon: '🪵', type: 'resource', stackable: true,
        description: 'Dense, aged wood from ancient trees. Stronger and more durable.', value: 10, tier: 2
    },
    ironwood: {
        name: 'Ironwood', icon: '🪵', type: 'resource', stackable: true,
        description: 'Petrified wood infused with mineral deposits. Hard as iron.', value: 25, tier: 3
    },

    // --- Stone (3 tiers) ---
    stone: {
        name: 'Stone', icon: '🧱', type: 'resource', stackable: true,
        description: 'Solid stone blocks. Good for building.', value: 2, tier: 1
    },
    granite: {
        name: 'Granite', icon: '🧱', type: 'resource', stackable: true,
        description: 'Dense speckled stone. Superior building material.', value: 8, tier: 2
    },
    obsidian: {
        name: 'Obsidian', icon: '🖤', type: 'resource', stackable: true,
        description: 'Volcanic glass, razor-sharp when knapped. Gleams darkly.', value: 30, tier: 3
    },

    // --- Ore & Ingots ---
    iron_ore: {
        name: 'Iron Ore', icon: '🪨', type: 'resource', stackable: true,
        description: 'Raw iron ore. Can be smelted into ingots.', value: 5, tier: 1
    },
    iron_ingot: {
        name: 'Iron Ingot', icon: '🔩', type: 'resource', stackable: true,
        description: 'Smelted iron, ready for crafting.', value: 12, tier: 1
    },
    mithril_ore: {
        name: 'Mithril Ore', icon: '🔷', type: 'resource', stackable: true,
        description: 'A pale blue ore that shimmers with inner light. Incredibly rare.', value: 35, tier: 2
    },
    mithril_ingot: {
        name: 'Mithril Ingot', icon: '🔷', type: 'resource', stackable: true,
        description: 'Smelted mithril. Light as air, strong as steel.', value: 80, tier: 2
    },
    void_ore: {
        name: 'Void Ore', icon: '🟣', type: 'resource', stackable: true,
        description: 'An ore that shifts between existing and not. Found only in the Void Sanctum.', value: 60, tier: 3
    },
    void_ingot: {
        name: 'Void Ingot', icon: '🟣', type: 'resource', stackable: true,
        description: 'Smelted void ore. Bends light around its edges.', value: 150, tier: 3
    },
    coal: {
        name: 'Coal', icon: '⬛', type: 'resource', stackable: true,
        description: 'Combustible fuel. Required for smelting operations.', value: 3, tier: 1
    },

    // --- Fiber & Cloth ---
    fiber: {
        name: 'Plant Fiber', icon: '🧵', type: 'resource', stackable: true,
        description: 'Raw plant fiber. Can be woven into rope or cloth.', value: 2, tier: 1
    },
    bog_fiber: {
        name: 'Bog Fiber', icon: '🧵', type: 'resource', stackable: true,
        description: 'Tough fibrous material from swamp plants. Surprisingly strong.', value: 6, tier: 1
    },
    silk_thread: {
        name: 'Silk Thread', icon: '🪡', type: 'resource', stackable: true,
        description: 'Fine silk thread, smooth and resilient.', value: 15, tier: 2
    },
    shadow_silk: {
        name: 'Shadow Silk', icon: '🕸️', type: 'resource', stackable: true,
        description: 'Silk spun by creatures between dimensions. Nearly invisible.', value: 30, tier: 2
    },
    spectral_thread: {
        name: 'Spectral Thread', icon: '✨', type: 'resource', stackable: true,
        description: 'Thread woven from crystallized void energy. Ethereal and shimmering.', value: 60, tier: 3
    },
    woven_cloth: {
        name: 'Woven Cloth', icon: '🧶', type: 'resource', stackable: true,
        description: 'Simple woven fabric made from plant fibers.', value: 8, tier: 1
    },
    starweave_cloth: {
        name: 'Starweave Cloth', icon: '🌟', type: 'resource', stackable: true,
        description: 'Fabric woven from spectral thread. Glimmers like captured starlight.', value: 120, tier: 3
    },

    // --- Hides & Leather ---
    hide: {
        name: 'Hide', icon: '🦴', type: 'resource', stackable: true,
        description: 'Animal hide. Can be tanned into leather.', value: 7, tier: 1
    },
    thick_hide: {
        name: 'Thick Hide', icon: '🦴', type: 'resource', stackable: true,
        description: 'Hide from a larger beast. Tough and durable.', value: 15, tier: 2
    },
    shadow_hide: {
        name: 'Shadow Hide', icon: '🖤', type: 'resource', stackable: true,
        description: 'Hide from a void-touched creature. Absorbs light.', value: 35, tier: 3
    },
    leather: {
        name: 'Leather', icon: '🟫', type: 'resource', stackable: true,
        description: 'Tanned hide. Flexible and strong. Used in armor and bags.', value: 14, tier: 1
    },
    hardened_leather: {
        name: 'Hardened Leather', icon: '🟫', type: 'resource', stackable: true,
        description: 'Boiled and treated leather. Nearly as tough as metal.', value: 30, tier: 2
    },
    shadow_leather: {
        name: 'Shadow Leather', icon: '🖤', type: 'resource', stackable: true,
        description: 'Leather from shadow hides. Bends light around the wearer.', value: 70, tier: 3
    },

    // --- Magical Resources ---
    ember_root: {
        name: 'Ember Root', icon: '🌱', type: 'resource', stackable: true,
        description: 'A heat-loving root that glows faintly. Used in alchemy and gardening.', value: 8, tier: 1
    },
    flame_essence: {
        name: 'Flame Essence', icon: '🔥', type: 'resource', stackable: true,
        description: 'Captured fire from eternal flames. Burns without consuming.', value: 25, tier: 2
    },
    veil_crystal: {
        name: 'Veil Crystal', icon: '💎', type: 'resource', stackable: true,
        description: 'A crystal where reality is thin. Hums with dimensional energy.', value: 40, tier: 2
    },
    void_essence: {
        name: 'Void Essence', icon: '🌌', type: 'resource', stackable: true,
        description: 'Concentrated nothingness given form. Warps space around it.', value: 80, tier: 3
    },
    ruun_shard: {
        name: 'Ruun Shard', icon: '⭐', type: 'resource', stackable: true,
        description: 'A fragment of pure creation-energy. Radiates overwhelming power.', value: 200, tier: 3
    },
    fertilizer: {
        name: 'Fertilizer', icon: '🧪', type: 'resource', stackable: true,
        description: 'Rich compost mix. Fertilized plots grow 30% faster and yield finer harvests.', value: 6, tier: 1
    },
    cinderfruit: {
        name: 'Cinderfruit', icon: '🍑', type: 'consumable', stackable: true,
        description: 'A crossbreed of ember root and voidberry — warm flesh, cold seeds. Restores 40 HP and stokes the blood.', value: 35,
        effect: { type: 'heal', stat: 'hp', amount: 40 },
        buff: { id: 'cinder_blood', name: 'Cinder Blood', icon: '🍑', stat: 'attack', amount: 4, duration: 12 },
        survivalEffect: { temperature: 10, morale: 5 }
    },
    glimmercap: {
        name: 'Glimmercap', icon: '🍄', type: 'consumable', stackable: true,
        description: 'A starfruit-veiled mushroom hybrid that glows faintly. Restores 30 MP and sharpens the mind.', value: 35,
        effect: { type: 'heal', stat: 'mp', amount: 30 },
        buff: { id: 'glimmer_mind', name: 'Glimmer Mind', icon: '🍄', stat: 'magicAttack', amount: 4, duration: 12 },
        survivalEffect: { morale: 5 }
    },

    // --- Creature Drops ---
    bone: {
        name: 'Bone', icon: '🦴', type: 'resource', stackable: true,
        description: 'Bleached bone from a fallen creature. Used in tools and weapons.', value: 4, tier: 1
    },
    fang: {
        name: 'Fang', icon: '🦷', type: 'resource', stackable: true,
        description: 'A sharp fang from a predator. Makes an effective blade tip.', value: 8, tier: 1
    },
    claw: {
        name: 'Claw', icon: '🔪', type: 'resource', stackable: true,
        description: 'A razor-sharp claw. Can be fashioned into weaponry.', value: 6, tier: 1
    },
    ectoplasm: {
        name: 'Ectoplasm', icon: '🟢', type: 'resource', stackable: true,
        description: 'Residue from spectral entities. Cold and viscous.', value: 18, tier: 2
    },
    boss_trophy_ashen: {
        name: 'Ashen Crown', icon: '👑', type: 'resource', stackable: false,
        description: 'The crown of the fallen Ashen King. Radiates dying heat.', value: 500, tier: 3
    },
    boss_trophy_fen: {
        name: 'Heart of the Fen', icon: '💚', type: 'resource', stackable: false,
        description: 'The pulsing heart of the Mother of the Fen. Still beating.', value: 500, tier: 3
    },
    boss_trophy_void: {
        name: 'Eye of Ruun', icon: '👁️', type: 'resource', stackable: false,
        description: 'The all-seeing eye of Ruun the Unraveler. It still watches.', value: 1000, tier: 3
    },
    boss_trophy_spire: {
        name: 'Architect\'s Blueprint', icon: '📜', type: 'resource', stackable: false,
        description: 'The master blueprint of the Shattered Spire. Reality-warping designs are etched into its surface.', value: 1200, tier: 3
    },

    // --- Shattered Spire Resources ---
    crystal_shard: {
        name: 'Crystal Shard', icon: '💎', type: 'resource', stackable: true,
        description: 'A fragment of the spire\'s crystalline structure. Hums with residual energy.', value: 35, tier: 3
    },
    arcane_dust: {
        name: 'Arcane Dust', icon: '✨', type: 'resource', stackable: true,
        description: 'Powdered rune-crystal. Used in advanced enchantments.', value: 45, tier: 3
    },
    spire_keystone: {
        name: 'Spire Keystone', icon: '🔑', type: 'quest', stackable: false,
        description: 'The keystone that once held the Shattered Spire together. Proof of the Architect\'s defeat.', value: 0
    },

    // --- Shattered Spire Equipment ---
    architects_compass: {
        name: 'Architect\'s Compass', icon: '🧭', type: 'weapon', slot: 'weapon',
        rarity: 'legendary', description: 'The Architect\'s personal instrument. Bends space to strike from impossible angles.',
        stats: { attack: 32, magicAttack: 18, speed: 6, critChance: 12 }, value: 1200
    },
    crystal_edge: {
        name: 'Crystal Edge', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A blade hewn from living spire crystal. Refracts light into cutting force.',
        stats: { attack: 24, magicAttack: 8, speed: 3 }, value: 400
    },
    runeward_staff: {
        name: 'Runeward Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A staff carved from the spire\'s rune pillars. Each rune is a sealed spell.',
        stats: { attack: 8, magicAttack: 22, magicDefense: 8 }, value: 420
    },
    spire_plate: {
        name: 'Spire Plate', icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'rare', description: 'Armor forged from crystallized spire stone. Nearly unbreakable.',
        stats: { defense: 18, magicDefense: 8 }, value: 380
    },
    seraph_wings: {
        name: 'Seraph Wings', icon: '🪽', type: 'armor', slot: 'armor',
        rarity: 'epic', description: 'Light-woven armor from a fallen Spire Seraph. Grants ethereal agility.',
        stats: { defense: 10, magicDefense: 14, speed: 6 }, value: 550
    },
    architects_crown: {
        name: 'Architect\'s Crown', icon: '👑', type: 'armor', slot: 'helmet',
        rarity: 'legendary', description: 'The Architect\'s diadem. Whispers blueprints of reality into the wearer\'s mind.',
        stats: { magicAttack: 12, magicDefense: 10, defense: 5 }, value: 900
    },

    // --- Misc Resources ---
    clay: {
        name: 'Clay', icon: '🫙', type: 'resource', stackable: true,
        description: 'Wet clay. Useful for pottery and bricks.', value: 3, tier: 1
    },
    glass: {
        name: 'Glass', icon: '🪟', type: 'resource', stackable: true,
        description: 'Formed from sand and intense heat. Fragile but versatile.', value: 10, tier: 1
    },
    gold_nugget: {
        name: 'Gold Nugget', icon: '🥇', type: 'resource', stackable: true,
        description: 'Raw gold. Can be sold or used in jewelry crafting.', value: 50, tier: 2
    },

    // --- Gems (for enchanting) ---
    gem_ruby: {
        name: 'Ruby', icon: '🔴', type: 'resource', stackable: true,
        description: 'A fiery red gemstone. Channels offensive magic.', value: 80, tier: 2
    },
    gem_sapphire: {
        name: 'Sapphire', icon: '🔵', type: 'resource', stackable: true,
        description: 'A deep blue gemstone. Channels defensive magic.', value: 80, tier: 2
    },
    gem_emerald: {
        name: 'Emerald', icon: '🟢', type: 'resource', stackable: true,
        description: 'A verdant green gemstone. Channels restorative magic.', value: 80, tier: 2
    },
    gem_amethyst: {
        name: 'Amethyst', icon: '🟣', type: 'resource', stackable: true,
        description: 'A deep purple gemstone. Channels arcane magic.', value: 80, tier: 2
    },

    // ═══════════════════════════════════════════
    // TOOLS — Gathering & Building
    // ═══════════════════════════════════════════

    // --- Axes (chop trees, +wood yield) ---
    stone_axe: {
        name: 'Stone Axe', icon: '🪓', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A crude axe. Gets the job done. +1 wood per gather.',
        stats: { attack: 3 }, toolType: 'axe', toolTier: 1, gatherBonus: 1, value: 8
    },
    iron_axe: {
        name: 'Iron Axe', icon: '🪓', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A sharp iron axe. Chops efficiently. +2 wood per gather.',
        stats: { attack: 6 }, toolType: 'axe', toolTier: 2, gatherBonus: 2, value: 30
    },
    mithril_axe: {
        name: 'Mithril Axe', icon: '🪓', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'uncommon', description: 'Featherlight mithril axe. +3 wood, can harvest hardwood.',
        stats: { attack: 10 }, toolType: 'axe', toolTier: 3, gatherBonus: 3, value: 120
    },
    void_axe: {
        name: 'Void Axe', icon: '🪓', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'rare', description: 'Cuts through trees like they were mist. +4 wood, harvests ironwood.',
        stats: { attack: 16 }, toolType: 'axe', toolTier: 4, gatherBonus: 4, value: 350
    },

    // --- Pickaxes (mine ore, +ore yield) ---
    stone_pickaxe: {
        name: 'Stone Pickaxe', icon: '⛏️', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A crude pickaxe. +1 ore per gather.',
        stats: { attack: 3 }, toolType: 'pickaxe', toolTier: 1, gatherBonus: 1, value: 8
    },
    iron_pickaxe: {
        name: 'Iron Pickaxe', icon: '⛏️', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A solid iron pickaxe. +2 ore, can mine granite.',
        stats: { attack: 5 }, toolType: 'pickaxe', toolTier: 2, gatherBonus: 2, value: 30
    },
    mithril_pickaxe: {
        name: 'Mithril Pickaxe', icon: '⛏️', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'uncommon', description: 'A mithril pickaxe. +3 ore, can mine mithril veins.',
        stats: { attack: 8 }, toolType: 'pickaxe', toolTier: 3, gatherBonus: 3, value: 120
    },
    void_pickaxe: {
        name: 'Void Pickaxe', icon: '⛏️', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'rare', description: 'Phases through rock to extract pure ore. +4 ore, mines void ore.',
        stats: { attack: 14 }, toolType: 'pickaxe', toolTier: 4, gatherBonus: 4, value: 350
    },

    // --- Sickles (harvest herbs, +herb yield) ---
    stone_sickle: {
        name: 'Stone Sickle', icon: '🌾', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A crude sickle. +1 herbs per gather.',
        stats: { attack: 2 }, toolType: 'sickle', toolTier: 1, gatherBonus: 1, value: 8
    },
    iron_sickle: {
        name: 'Iron Sickle', icon: '🌾', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A sharp iron sickle. +2 herbs per gather.',
        stats: { attack: 4 }, toolType: 'sickle', toolTier: 2, gatherBonus: 2, value: 30
    },
    mithril_sickle: {
        name: 'Mithril Sickle', icon: '🌾', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'uncommon', description: 'Mithril sickle. +3 herbs, harvests rare plants.',
        stats: { attack: 6 }, toolType: 'sickle', toolTier: 3, gatherBonus: 3, value: 120
    },

    // --- Hammers (building speed) ---
    stone_hammer: {
        name: 'Stone Hammer', icon: '🔨', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A basic hammer for building. Reduces build costs by 10%.',
        stats: { attack: 4 }, toolType: 'hammer', toolTier: 1, value: 8
    },
    iron_hammer: {
        name: 'Iron Hammer', icon: '🔨', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A solid iron hammer. Reduces build costs by 15%.',
        stats: { attack: 7 }, toolType: 'hammer', toolTier: 2, value: 30
    },
    mithril_hammer: {
        name: 'Mithril Hammer', icon: '🔨', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'uncommon', description: 'A mithril hammer. Reduces build costs by 20%.',
        stats: { attack: 12 }, toolType: 'hammer', toolTier: 3, value: 120
    },

    // --- Fishing Rod ---
    fishing_rod: {
        name: 'Fishing Rod', icon: '🎣', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'A simple fishing rod. Can fish at water tiles.',
        stats: { attack: 1 }, toolType: 'fishing', toolTier: 1, value: 12
    },
    iron_fishing_rod: {
        name: 'Iron Fishing Rod', icon: '🎣', type: 'tool', slot: 'weapon', stackable: false,
        rarity: 'common', description: 'Sturdy iron rod. Better catches.',
        stats: { attack: 2 }, toolType: 'fishing', toolTier: 2, value: 40
    },

    // ═══════════════════════════════════════════
    // WEAPONS
    // ═══════════════════════════════════════════

    // --- Starter Weapons ---
    rusted_void_sword: {
        name: 'Rusted Void Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A corroded blade that still hums with residual void energy.',
        stats: { attack: 5 }, value: 10
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

    // --- Swords ---
    bone_sword: {
        name: 'Bone Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A blade fashioned from sharpened bones. Crude but effective.',
        stats: { attack: 7 }, value: 18
    },
    iron_longsword: {
        name: 'Iron Longsword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A well-forged iron blade. Reliable if unexceptional.',
        stats: { attack: 8 }, value: 35
    },
    iron_sword: {
        name: 'Iron Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A sturdy blade forged from smelted iron. Dependable.',
        stats: { attack: 10 }, value: 50
    },
    steel_sword: {
        name: 'Steel Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'A refined steel blade. Well-balanced and keen.',
        stats: { attack: 14, speed: 1 }, value: 85
    },
    voidtouched_blade: {
        name: 'Voidtouched Blade', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'This blade flickers, as if not entirely in this reality.',
        stats: { attack: 12, magicAttack: 4 }, value: 80
    },
    flame_blade: {
        name: 'Flame Blade', icon: '🔥', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'An iron sword infused with flame essence. Burns on contact.',
        stats: { attack: 15, fireDamage: 6 }, value: 120
    },
    mithril_sword: {
        name: 'Mithril Sword', icon: '⚔️', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A gleaming mithril blade. Light as a feather, sharp as starlight.',
        stats: { attack: 22, speed: 3 }, value: 280
    },
    veil_blade: {
        name: 'Veil Blade', icon: '🌀', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A blade that phases between realities. Strikes from impossible angles.',
        stats: { attack: 22, magicAttack: 10, critChance: 8 }, value: 350
    },
    emberforged_axe: {
        name: 'Emberforged Axe', icon: '🪓', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'Forged in eternal flames. Burns with each strike.',
        stats: { attack: 18, fireDamage: 8 }, value: 200
    },
    void_blade: {
        name: 'Void Blade', icon: '🌀', type: 'weapon', slot: 'weapon',
        rarity: 'epic', description: 'A sword forged from void ingots. Reality splits where it cuts.',
        stats: { attack: 30, magicAttack: 12, speed: 4 }, value: 600
    },
    whisper_of_ruun: {
        name: 'Whisper of Ruun', icon: '🌀', type: 'weapon', slot: 'weapon',
        rarity: 'legendary', description: 'A blade from crystallized void-whispers. It speaks to those who listen.',
        stats: { attack: 28, magicAttack: 15, speed: 5, critChance: 10 }, value: 1000
    },

    // --- Daggers ---
    bone_dagger: {
        name: 'Bone Dagger', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A sharpened bone knife. Quick and quiet.',
        stats: { attack: 5, speed: 4, critChance: 8 }, value: 15
    },
    iron_dagger: {
        name: 'Iron Dagger', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A well-honed iron dagger.',
        stats: { attack: 7, speed: 5, critChance: 10 }, value: 35
    },
    shadow_daggers: {
        name: 'Shadow Daggers', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'Twin blades forged in darkness. Almost invisible.',
        stats: { attack: 10, speed: 5, critChance: 12 }, value: 140
    },
    mithril_daggers: {
        name: 'Mithril Daggers', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'Mithril twin blades. Cut through armor like cloth.',
        stats: { attack: 16, speed: 7, critChance: 15 }, value: 300
    },
    void_stiletto: {
        name: 'Void Stiletto', icon: '🗡️', type: 'weapon', slot: 'weapon',
        rarity: 'epic', description: 'A needle-thin blade of void ingot. Bypasses all defenses.',
        stats: { attack: 24, speed: 8, critChance: 20 }, value: 550
    },

    // --- Maces & Hammers ---
    wooden_club: {
        name: 'Wooden Club', icon: '🏏', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A heavy branch. Simple but brutal.',
        stats: { attack: 6 }, value: 5
    },
    iron_mace: {
        name: 'Iron Mace', icon: '🔨', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A flanged iron mace. Crushes armor effectively.',
        stats: { attack: 12, defense: 2 }, value: 45
    },
    war_hammer: {
        name: 'War Hammer', icon: '🔨', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'A two-handed war hammer. Devastating on impact.',
        stats: { attack: 18, defense: 3 }, value: 100
    },
    mithril_maul: {
        name: 'Mithril Maul', icon: '🔨', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A massive mithril hammer. Impossibly light for its size.',
        stats: { attack: 26, defense: 5, speed: 2 }, value: 320
    },
    void_crusher: {
        name: 'Void Crusher', icon: '🔨', type: 'weapon', slot: 'weapon',
        rarity: 'epic', description: 'A hammer that compresses space on impact. Nothing survives the blow.',
        stats: { attack: 35, defense: 6 }, value: 650
    },

    // --- Staves ---
    wooden_staff: {
        name: 'Wooden Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A basic wooden staff. Channels magic crudely.',
        stats: { attack: 2, magicAttack: 6 }, value: 8
    },
    fen_staff: {
        name: 'Fen Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'A staff from Hollowfen heartwood. Pulses with swamp magic.',
        stats: { attack: 5, magicAttack: 14, magicDefense: 4 }, value: 130
    },
    crystal_staff: {
        name: 'Crystal Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'Topped with a veil crystal. Amplifies arcane power.',
        stats: { attack: 4, magicAttack: 18, magicDefense: 5 }, value: 160
    },
    mithril_staff: {
        name: 'Mithril Staff', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A mithril-shod staff. The perfect magical conduit.',
        stats: { attack: 8, magicAttack: 24, magicDefense: 8 }, value: 340
    },
    void_scepter: {
        name: 'Void Scepter', icon: '🪄', type: 'weapon', slot: 'weapon',
        rarity: 'epic', description: 'A scepter of crystallized void. Commands reality itself.',
        stats: { attack: 10, magicAttack: 34, magicDefense: 10, speed: 3 }, value: 700
    },

    // --- Bows ---
    short_bow: {
        name: 'Short Bow', icon: '🏹', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A simple short bow. Quick to draw.',
        stats: { attack: 6, speed: 3, critChance: 5 }, value: 15
    },
    hunting_bow: {
        name: 'Hunting Bow', icon: '🏹', type: 'weapon', slot: 'weapon',
        rarity: 'common', description: 'A proper hunting bow. Accurate at distance.',
        stats: { attack: 10, speed: 2, critChance: 8 }, value: 40
    },
    composite_bow: {
        name: 'Composite Bow', icon: '🏹', type: 'weapon', slot: 'weapon',
        rarity: 'uncommon', description: 'Laminated wood and horn. Powerful draw.',
        stats: { attack: 16, speed: 3, critChance: 10 }, value: 110
    },
    mithril_bow: {
        name: 'Mithril Bow', icon: '🏹', type: 'weapon', slot: 'weapon',
        rarity: 'rare', description: 'A mithril-stringed bow. Fires arrows that sing.',
        stats: { attack: 22, speed: 5, critChance: 12 }, value: 300
    },

    // ═══════════════════════════════════════════
    // ARMOR — Helmets, Chest, Boots, Offhand
    // ═══════════════════════════════════════════

    // --- Helmets ---
    leather_cap: {
        name: 'Leather Cap', icon: '🧢', type: 'armor', slot: 'helmet',
        rarity: 'common', description: 'A basic leather cap. Protects from the rain at least.',
        stats: { defense: 2 }, value: 12
    },
    iron_helm: {
        name: 'Iron Helm', icon: '🪖', type: 'armor', slot: 'helmet',
        rarity: 'common', description: 'A sturdy iron helmet. Solid protection.',
        stats: { defense: 5 }, value: 35
    },
    chainmail_coif: {
        name: 'Chainmail Coif', icon: '🪖', type: 'armor', slot: 'helmet',
        rarity: 'uncommon', description: 'A chainmail hood. Flexible yet protective.',
        stats: { defense: 7, magicDefense: 2 }, value: 65
    },
    mithril_helm: {
        name: 'Mithril Helm', icon: '🪖', type: 'armor', slot: 'helmet',
        rarity: 'rare', description: 'A gleaming mithril helm. Light and near-impenetrable.',
        stats: { defense: 10, magicDefense: 5, speed: 1 }, value: 200
    },
    void_crown: {
        name: 'Void Crown', icon: '👑', type: 'armor', slot: 'helmet',
        rarity: 'epic', description: 'A crown of void metal. Bends attacks around the wearer.',
        stats: { defense: 14, magicDefense: 10, magicAttack: 5 }, value: 450
    },

    // --- Chest Armor ---
    tattered_cloak: {
        name: 'Tattered Cloak', icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'common', description: "A worn traveler's cloak. Barely holds together.",
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
    crimson_wraps: {
        name: 'Crimson Wraps', icon: '🩹', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'Bandages soaked in alchemical blood.',
        stats: { defense: 2, magicAttack: 2 }, value: 5
    },
    leather_vest: {
        name: 'Leather Vest', icon: '🦺', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'A basic leather chest piece.',
        stats: { defense: 4 }, value: 20
    },
    chainmail_vest: {
        name: 'Chainmail Vest', icon: '🦺', type: 'armor', slot: 'armor',
        rarity: 'common', description: 'Standard-issue chainmail. Dependable protection.',
        stats: { defense: 6 }, value: 40
    },
    iron_plate: {
        name: 'Iron Plate Armor', icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Solid iron plate. Heavy but very protective.',
        stats: { defense: 10, speed: -1 }, value: 90
    },
    bog_leather: {
        name: 'Bog Leather Armor', icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Armor from swamp hides. Surprisingly resilient.',
        stats: { defense: 8, speed: 2, magicDefense: 3 }, value: 100
    },
    warden_plate: {
        name: "Warden's Plate", icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Heavy plate inscribed with warding sigils.',
        stats: { defense: 12, magicDefense: 4 }, value: 150
    },
    runebound_plate: {
        name: 'Runebound Plate', icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'rare', description: 'Heavy armor with runes that glow when struck.',
        stats: { defense: 14, magicDefense: 6 }, value: 250
    },
    mithril_plate: {
        name: 'Mithril Plate', icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'rare', description: 'Full mithril plate. Incredible protection, nearly weightless.',
        stats: { defense: 18, magicDefense: 8, speed: 2 }, value: 400
    },
    mantle_of_the_hollow: {
        name: 'Mantle of the Hollow', icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'epic', description: 'Woven from shadows of the dead. Spectral resilience.',
        stats: { defense: 10, magicDefense: 12, speed: 3 }, value: 500
    },
    void_plate: {
        name: 'Void Plate', icon: '🛡️', type: 'armor', slot: 'armor',
        rarity: 'epic', description: 'Forged from void ingots. Attacks phase through the wearer.',
        stats: { defense: 24, magicDefense: 14, speed: 1 }, value: 750
    },

    // --- Boots ---
    leather_boots: {
        name: 'Leather Boots', icon: '👢', type: 'armor', slot: 'boots',
        rarity: 'common', description: 'Simple leather boots. Better than barefoot.',
        stats: { defense: 1, speed: 2 }, value: 12
    },
    iron_boots: {
        name: 'Iron Boots', icon: '👢', type: 'armor', slot: 'boots',
        rarity: 'common', description: 'Heavy iron-shod boots. Sturdy footwear.',
        stats: { defense: 3, speed: 1 }, value: 35
    },
    swift_boots: {
        name: 'Swift Boots', icon: '👢', type: 'armor', slot: 'boots',
        rarity: 'uncommon', description: 'Enchanted boots that quicken the step.',
        stats: { defense: 2, speed: 5 }, value: 80
    },
    mithril_boots: {
        name: 'Mithril Boots', icon: '👢', type: 'armor', slot: 'boots',
        rarity: 'rare', description: 'Mithril-plated boots. Protective and agile.',
        stats: { defense: 6, speed: 4 }, value: 200
    },
    void_striders: {
        name: 'Void Striders', icon: '👢', type: 'armor', slot: 'boots',
        rarity: 'epic', description: 'Boots that step between dimensions. Barely touch the ground.',
        stats: { defense: 8, speed: 7, critChance: 5 }, value: 450
    },

    // --- Offhand ---
    soul_shield: {
        name: 'Soul Shield', icon: '🛡️', type: 'armor', slot: 'offhand',
        rarity: 'common', description: 'A shield housing a single protective spirit.',
        stats: { defense: 5 }, value: 15
    },
    wooden_shield: {
        name: 'Wooden Shield', icon: '🛡️', type: 'armor', slot: 'offhand',
        rarity: 'common', description: 'A simple wooden shield. Blocks basic attacks.',
        stats: { defense: 4 }, value: 10
    },
    iron_shield: {
        name: 'Iron Shield', icon: '🛡️', type: 'armor', slot: 'offhand',
        rarity: 'common', description: 'A solid iron shield. Reliable defense.',
        stats: { defense: 8 }, value: 45
    },
    mithril_shield: {
        name: 'Mithril Shield', icon: '🛡️', type: 'armor', slot: 'offhand',
        rarity: 'rare', description: 'A polished mithril shield. Deflects both blade and spell.',
        stats: { defense: 12, magicDefense: 6 }, value: 250
    },
    tome_of_flames: {
        name: 'Tome of Flames', icon: '📕', type: 'armor', slot: 'offhand',
        rarity: 'uncommon', description: 'An ancient spellbook. Boosts fire magic while held.',
        stats: { magicAttack: 8, fireDamage: 4 }, value: 100
    },
    void_ward: {
        name: 'Void Ward', icon: '🛡️', type: 'armor', slot: 'offhand',
        rarity: 'epic', description: 'A shield of solidified void. Negates magic on contact.',
        stats: { defense: 10, magicDefense: 14 }, value: 400
    },
    crystal_focus: {
        name: 'Crystal Focus', icon: '🔮', type: 'armor', slot: 'offhand',
        rarity: 'uncommon', description: 'A crystalline orb. Amplifies magical power.',
        stats: { magicAttack: 10, magicDefense: 3 }, value: 120
    },

    // ═══════════════════════════════════════════
    // WORKCLOTHES — Gathering & Profession Bonuses
    // ═══════════════════════════════════════════

    farmers_garb: {
        name: "Farmer's Garb", icon: '👕', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Practical farming clothes. Crops grow 20% faster.',
        stats: { defense: 3, speed: 1 }, workBonus: { type: 'farming', speedMult: 1.2 }, value: 60
    },
    miners_gear: {
        name: "Miner's Gear", icon: '🦺', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Reinforced mining outfit. +1 ore per gather.',
        stats: { defense: 5 }, workBonus: { type: 'mining', gatherBonus: 1 }, value: 60
    },
    foresters_cloak: {
        name: "Forester's Cloak", icon: '🧥', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'A woodsman\'s cloak. +1 wood per gather.',
        stats: { defense: 3, speed: 2 }, workBonus: { type: 'woodcutting', gatherBonus: 1 }, value: 60
    },
    herbalists_robes: {
        name: "Herbalist's Robes", icon: '👘', type: 'armor', slot: 'armor',
        rarity: 'uncommon', description: 'Enchanted robes. Potions heal 25% more when crafted.',
        stats: { defense: 2, magicDefense: 4 }, workBonus: { type: 'alchemy', potionMult: 1.25 }, value: 60
    },
    anglers_hat: {
        name: "Angler's Hat", icon: '🎩', type: 'armor', slot: 'helmet',
        rarity: 'uncommon', description: 'A lucky fishing hat. Improves catch quality.',
        stats: { defense: 1, speed: 1 }, workBonus: { type: 'fishing', qualityMult: 1.5 }, value: 40
    },

    // ═══════════════════════════════════════════
    // ACCESSORIES — Rings, Amulets, Cloaks
    // ═══════════════════════════════════════════

    ring_of_vigor: {
        name: 'Ring of Vigor', icon: '💍', type: 'armor', slot: 'accessory',
        rarity: 'uncommon', description: 'Pulses with vitality. Increases max HP.',
        stats: { defense: 0 }, bonusHp: 20, value: 80
    },
    ring_of_wisdom: {
        name: 'Ring of Wisdom', icon: '💍', type: 'armor', slot: 'accessory',
        rarity: 'uncommon', description: 'Hums with arcane resonance. Increases max MP.',
        stats: { magicDefense: 2 }, bonusMp: 15, value: 80
    },
    amulet_of_strength: {
        name: 'Amulet of Strength', icon: '📿', type: 'armor', slot: 'accessory',
        rarity: 'uncommon', description: 'A heavy stone amulet. Boosts physical power.',
        stats: { attack: 6 }, value: 90
    },
    amulet_of_warding: {
        name: 'Amulet of Warding', icon: '📿', type: 'armor', slot: 'accessory',
        rarity: 'uncommon', description: 'Glows with protective runes. Boosts all defense.',
        stats: { defense: 4, magicDefense: 4 }, value: 90
    },
    cloak_of_shadows: {
        name: 'Cloak of Shadows', icon: '🧣', type: 'armor', slot: 'accessory',
        rarity: 'rare', description: 'A cloak woven from darkness. Greatly increases crit chance.',
        stats: { speed: 3, critChance: 12 }, value: 180
    },
    ember_pendant: {
        name: 'Ember Pendant', icon: '🔶', type: 'armor', slot: 'accessory',
        rarity: 'uncommon', description: 'A warm pendant. Grants fire resistance.',
        stats: { defense: 2, fireDamage: 3 }, value: 70
    },
    veil_ring: {
        name: 'Veil Ring', icon: '💍', type: 'armor', slot: 'accessory',
        rarity: 'rare', description: 'A ring from a veil crystal. Powerful magical defense.',
        stats: { magicDefense: 8, magicAttack: 4 }, value: 200
    },
    amulet_of_the_void: {
        name: 'Amulet of the Void', icon: '📿', type: 'armor', slot: 'accessory',
        rarity: 'epic', description: 'An amulet of void ingot. Boosts all stats.',
        stats: { attack: 5, defense: 5, magicAttack: 5, magicDefense: 5, speed: 3 }, value: 500
    },
    ruun_sigil: {
        name: 'Sigil of Ruun', icon: '⭐', type: 'armor', slot: 'accessory',
        rarity: 'legendary', description: 'A sigil containing a fragment of creation-energy. Ultimate power.',
        stats: { attack: 10, defense: 8, magicAttack: 10, magicDefense: 8, speed: 5, critChance: 10 }, value: 2000
    },

    // ═══════════════════════════════════════════
    // PLACEABLES — Functional Camp Items
    // ═══════════════════════════════════════════

    placeable_smelter: {
        name: 'Smelter', icon: '🏭', type: 'placeable', stackable: false,
        description: 'A dedicated smelting furnace. Doubles ingot output from smelting recipes.',
        placeableType: 'functional', provides: 'smelting_boost', value: 100
    },
    placeable_anvil: {
        name: 'Anvil', icon: '⚒️', type: 'placeable', stackable: false,
        description: 'A heavy iron anvil. Unlocks advanced weapon and armor recipes.',
        placeableType: 'functional', provides: 'advanced_forging', value: 120
    },
    placeable_loom: {
        name: 'Loom', icon: '🧶', type: 'placeable', stackable: false,
        description: 'A weaving loom. Craft cloth and fabric from fibers.',
        placeableType: 'functional', provides: 'weaving', value: 60
    },
    placeable_tanning_rack: {
        name: 'Tanning Rack', icon: '🪤', type: 'placeable', stackable: false,
        description: 'A rack for tanning hides into leather.',
        placeableType: 'functional', provides: 'tanning', value: 50
    },
    placeable_alchemy_table: {
        name: 'Alchemy Table', icon: '🧪', type: 'placeable', stackable: false,
        description: 'An advanced alchemy station. Unlocks powerful potion recipes.',
        placeableType: 'functional', provides: 'advanced_alchemy', value: 150
    },
    placeable_enchanting_table: {
        name: 'Enchanting Table', icon: '✨', type: 'placeable', stackable: false,
        description: 'A mystical table. Socket gems into equipment for bonuses.',
        placeableType: 'functional', provides: 'enchanting', value: 250
    },
    placeable_storage_chest: {
        name: 'Storage Chest', icon: '📦', type: 'placeable', stackable: true,
        description: 'Extra storage. +10 inventory slots per chest.',
        placeableType: 'functional', provides: 'extra_storage_10', value: 40
    },
    placeable_cooking_pot: {
        name: 'Cooking Pot', icon: '🍲', type: 'placeable', stackable: false,
        description: 'A large cooking pot. Unlocks advanced food recipes.',
        placeableType: 'functional', provides: 'cooking', value: 45
    },
    placeable_bed: {
        name: 'Bed', icon: '🛏️', type: 'placeable', stackable: false,
        description: 'A proper bed. Resting fully heals and grants a temporary stat buff.',
        placeableType: 'functional', provides: 'better_rest', value: 60
    },
    placeable_well: {
        name: 'Well', icon: '🪣', type: 'placeable', stackable: false,
        description: 'A water well. Crops grow 25% faster.',
        placeableType: 'functional', provides: 'irrigation', value: 70
    },
    placeable_scarecrow: {
        name: 'Scarecrow', icon: '🧸', type: 'placeable', stackable: false,
        description: 'Protects crops from pests. Prevents crop loss events.',
        placeableType: 'functional', provides: 'crop_protection', value: 30
    },

    // ═══════════════════════════════════════════
    // PLACEABLES — Decorative Camp Items
    // ═══════════════════════════════════════════

    placeable_banner_ashen: {
        name: 'Ashen Banner', icon: '🚩', type: 'placeable', stackable: false,
        description: 'A banner bearing the sigil of the Ashen Wastes.',
        placeableType: 'decorative', value: 20
    },
    placeable_banner_fen: {
        name: 'Fen Banner', icon: '🚩', type: 'placeable', stackable: false,
        description: 'A banner bearing the sigil of the Hollowfen.',
        placeableType: 'decorative', value: 20
    },
    placeable_banner_void: {
        name: 'Void Banner', icon: '🚩', type: 'placeable', stackable: false,
        description: 'A banner bearing the sigil of the Void Sanctum.',
        placeableType: 'decorative', value: 20
    },
    placeable_torch_stand: {
        name: 'Torch Stand', icon: '🏮', type: 'placeable', stackable: true,
        description: 'An ornate torch. Lights up your camp.',
        placeableType: 'decorative', value: 10
    },
    placeable_flower_pot: {
        name: 'Flower Pot', icon: '🪴', type: 'placeable', stackable: true,
        description: 'A potted plant. Makes any space feel more like home.',
        placeableType: 'decorative', value: 8
    },
    placeable_rug: {
        name: 'Woven Rug', icon: '🟫', type: 'placeable', stackable: true,
        description: 'A hand-woven rug. Adds warmth and comfort.',
        placeableType: 'decorative', value: 15
    },
    placeable_bookshelf: {
        name: 'Bookshelf', icon: '📚', type: 'placeable', stackable: false,
        description: 'A shelf for collected tomes and lore pages.',
        placeableType: 'decorative', value: 25
    },
    placeable_weapon_rack: {
        name: 'Weapon Rack', icon: '⚔️', type: 'placeable', stackable: false,
        description: 'Display your finest weapons on this rack.',
        placeableType: 'decorative', value: 25
    },
    placeable_trophy_mount: {
        name: 'Trophy Mount', icon: '🏆', type: 'placeable', stackable: false,
        description: 'Display boss trophies. Each mounted trophy grants a passive bonus.',
        placeableType: 'functional', provides: 'trophy_display', value: 40
    },

    // ═══════════════════════════════════════════
    // CONSUMABLES
    // ═══════════════════════════════════════════

    health_vial: {
        name: 'Health Vial', icon: '❤️', type: 'consumable', stackable: true,
        description: 'A small vial of crimson liquid. Restores 30 HP.', value: 15,
        effect: { type: 'heal', stat: 'hp', amount: 30 }
    },
    mana_vial: {
        name: 'Mana Vial', icon: '💙', type: 'consumable', stackable: true,
        description: 'A luminous blue potion. Restores 25 MP.', value: 15,
        effect: { type: 'heal', stat: 'mp', amount: 25 }
    },
    blood_flask: {
        name: 'Blood Flask', icon: '🩸', type: 'consumable', stackable: true,
        description: 'Preserved blood. Restores 20 HP and 15 MP.', value: 20,
        effect: { type: 'heal', stat: 'both', hpAmount: 20, mpAmount: 15 }
    },
    smoke_bomb: {
        name: 'Smoke Bomb', icon: '💨', type: 'consumable', stackable: true,
        description: 'Guarantees escape from non-boss combat.', value: 25,
        effect: { type: 'flee' }
    },
    greater_health_potion: {
        name: 'Greater Health Potion', icon: '❤️', type: 'consumable', stackable: true,
        description: 'Concentrated healing elixir. Restores 80 HP.', value: 50,
        effect: { type: 'heal', stat: 'hp', amount: 80 }
    },
    greater_mana_potion: {
        name: 'Greater Mana Potion', icon: '💙', type: 'consumable', stackable: true,
        description: 'Concentrated mana elixir. Restores 60 MP.', value: 50,
        effect: { type: 'heal', stat: 'mp', amount: 60 }
    },
    supreme_health_potion: {
        name: 'Supreme Health Potion', icon: '❤️', type: 'consumable', stackable: true,
        description: 'The ultimate healing draught. Restores 150 HP.', value: 120,
        effect: { type: 'heal', stat: 'hp', amount: 150 }
    },
    elixir_of_restoration: {
        name: 'Elixir of Restoration', icon: '💜', type: 'consumable', stackable: true,
        description: 'Fully restores HP and MP.', value: 200,
        effect: { type: 'heal', stat: 'both', hpAmount: 999, mpAmount: 999 }
    },
    antidote: {
        name: 'Antidote', icon: '💚', type: 'consumable', stackable: true,
        description: 'Cures poison and other toxins.', value: 20,
        effect: { type: 'cure', status: 'poison' }
    },
    elixir_of_power: {
        name: 'Elixir of Power', icon: '💪', type: 'consumable', stackable: true,
        description: 'Increases attack by 25% for next combat.', value: 60,
        effect: { type: 'buff', stat: 'attack', percent: 25, duration: 1 }
    },
    elixir_of_iron: {
        name: 'Elixir of Iron', icon: '🛡️', type: 'consumable', stackable: true,
        description: 'Increases defense by 25% for next combat.', value: 60,
        effect: { type: 'buff', stat: 'defense', percent: 25, duration: 1 }
    },
    elixir_of_haste: {
        name: 'Elixir of Haste', icon: '⚡', type: 'consumable', stackable: true,
        description: 'Increases speed by 50% for next combat.', value: 60,
        effect: { type: 'buff', stat: 'speed', percent: 50, duration: 1 }
    },
    void_tonic: {
        name: 'Void Tonic', icon: '🟣', type: 'consumable', stackable: true,
        description: 'A dangerous brew. Boosts all stats by 15% for next combat.',
        value: 150,
        effect: { type: 'buff', stat: 'all', percent: 15, duration: 1 }
    },

    // --- Food ---
    ember_root_crop: {
        name: 'Ember Root Harvest', icon: '🥕', type: 'consumable', stackable: true,
        description: 'A warm, glowing root vegetable. Restores 20 HP.', value: 10,
        effect: { type: 'heal', stat: 'hp', amount: 20 }
    },
    veil_mushroom: {
        name: 'Veil Mushroom', icon: '🍄', type: 'consumable', stackable: true,
        description: 'A phosphorescent mushroom. Restores 15 MP.', value: 12,
        effect: { type: 'heal', stat: 'mp', amount: 15 }
    },
    blood_blossom: {
        name: 'Blood Blossom', icon: '🌺', type: 'consumable', stackable: true,
        description: 'A crimson flower. Restores 15 HP and 10 MP.', value: 14,
        effect: { type: 'heal', stat: 'both', hpAmount: 15, mpAmount: 10 }
    },
    shadow_pepper: {
        name: 'Shadow Pepper', icon: '🌶️', type: 'consumable', stackable: true,
        description: 'A dark, fiery pepper. Temporarily boosts attack.',
        effect: { buff: { stat: 'attack', amount: 3, duration: 10 } }, value: 12
    },
    starfruit: {
        name: 'Starfruit', icon: '⭐', type: 'consumable', stackable: true,
        description: 'A luminous fruit. Restores MP.',
        effect: { mana: 20 }, value: 15
    },
    ironroot_tuber: {
        name: 'Ironroot Tuber', icon: '🥔', type: 'consumable', stackable: true,
        description: 'A dense, metallic-flavored root. Temporarily boosts defense.',
        effect: { buff: { stat: 'defense', amount: 3, duration: 10 } }, value: 12
    },
    voidberry: {
        name: 'Voidberry', icon: '🫐', type: 'consumable', stackable: true,
        description: 'A berry that phases between realities. Restores HP and MP.',
        effect: { heal: 15, mana: 15 }, value: 20
    },
    hearth_stew: {
        name: 'Hearth Stew', icon: '🍲', type: 'consumable', stackable: true,
        description: 'A warm bowl of stew. Restores 50 HP. Grants Warmth (+15 temp) and reduces fatigue.', value: 30,
        effect: { type: 'heal', stat: 'hp', amount: 50 },
        buff: { id: 'warmth', name: 'Well Fed', icon: '🍲', stat: 'defense', amount: 2, duration: 10 },
        survivalEffect: { temperature: 15, fatigue: -15, morale: 5 }
    },
    grilled_meat: {
        name: 'Grilled Meat', icon: '🍖', type: 'consumable', stackable: true,
        description: 'Charred but filling. Restores 35 HP. Grants Vigor (+2 attack).', value: 18,
        effect: { type: 'heal', stat: 'hp', amount: 35 },
        buff: { id: 'vigor', name: 'Vigor', icon: '🍖', stat: 'attack', amount: 2, duration: 8 },
        survivalEffect: { fatigue: -10, morale: 3 }
    },
    mushroom_soup: {
        name: 'Mushroom Soup', icon: '🍲', type: 'consumable', stackable: true,
        description: 'A magical soup. Restores 30 HP and 20 MP. Grants Clarity (+3 magic attack).', value: 35,
        effect: { type: 'heal', stat: 'both', hpAmount: 30, mpAmount: 20 },
        buff: { id: 'clarity', name: 'Clarity', icon: '🍲', stat: 'magicAttack', amount: 3, duration: 10 },
        survivalEffect: { fatigue: -8, morale: 5 }
    },
    void_steak: {
        name: 'Void Steak', icon: '🥩', type: 'consumable', stackable: true,
        description: 'Meat from a void creature. Restores 80 HP. Grants Void Resilience (+4 magic defense).',
        value: 60,
        effect: { type: 'heal', stat: 'hp', amount: 80 },
        buff: { id: 'void_resilience', name: 'Void Resilience', icon: '🥩', stat: 'magicDefense', amount: 4, duration: 12 },
        survivalEffect: { fatigue: -20, morale: 8 }
    },
    feast_platter: {
        name: 'Feast Platter', icon: '🍽️', type: 'consumable', stackable: true,
        description: 'A complete meal. Restores 100 HP and 50 MP. Grants Inspired (+3 all combat stats).', value: 100,
        effect: { type: 'heal', stat: 'both', hpAmount: 100, mpAmount: 50 },
        buff: { id: 'feast', name: 'Feast Inspired', icon: '🍽️', stat: 'attack', amount: 3, duration: 15 },
        survivalEffect: { fatigue: -30, morale: 15 }
    },
    raw_fish: {
        name: 'Raw Fish', icon: '🐟', type: 'consumable', stackable: true,
        description: 'A freshly caught fish. Better when cooked. Restores 10 HP.',
        value: 5,
        effect: { type: 'heal', stat: 'hp', amount: 10 }
    },
    cooked_fish: {
        name: 'Cooked Fish', icon: '🐟', type: 'consumable', stackable: true,
        description: 'Grilled fish. Simple but nourishing. Restores 40 HP.',
        value: 20,
        effect: { type: 'heal', stat: 'hp', amount: 40 }
    },

    // --- Fish (catches from fishing) ---
    small_fish: {
        name: 'Small Fish', icon: '🐟', type: 'consumable', stackable: true,
        description: 'A small catch. Restores a bit of HP when eaten.',
        effect: { heal: 8 }, value: 4
    },
    large_fish: {
        name: 'Large Fish', icon: '🐠', type: 'consumable', stackable: true,
        description: 'A decent-sized fish. Good eating.',
        effect: { heal: 15 }, value: 8
    },
    golden_fish: {
        name: 'Golden Fish', icon: '✨', type: 'consumable', stackable: true,
        description: 'A shimmering golden fish. Very valuable.',
        effect: { heal: 30, mana: 15 }, value: 50
    },
    void_fish: {
        name: 'Void Fish', icon: '🐙', type: 'consumable', stackable: true,
        description: 'A strange creature from between realities. Heals and grants a temporary buff.',
        effect: { heal: 25, mana: 20 }, value: 80
    },
    old_boot: {
        name: 'Old Boot', icon: '👢', type: 'resource', stackable: true,
        description: 'A waterlogged boot. Useless... or is it?',
        value: 1
    },
    treasure_chest_fish: {
        name: 'Sunken Treasure', icon: '💰', type: 'resource', stackable: true,
        description: 'A small chest dredged from the water. Contains gold.',
        value: 30
    },

    // --- Cooked Fish Recipes ---
    fish_stew: {
        name: 'Fish Stew', icon: '🍲', type: 'consumable', stackable: true,
        description: 'Hearty fish stew. Restores HP and MP. Grants Warmth.',
        effect: { heal: 35, mana: 15 }, value: 25,
        buff: { id: 'warmth', name: 'Warm Belly', icon: '🍲', stat: 'defense', amount: 2, duration: 8 },
        survivalEffect: { temperature: 10, fatigue: -12, morale: 4 }
    },
    grilled_golden_fish: {
        name: 'Grilled Golden Fish', icon: '🍽️', type: 'consumable', stackable: true,
        description: 'A perfectly grilled golden fish. Full restoration. Grants Fortune.',
        effect: { heal: 60, mana: 30 }, value: 65,
        buff: { id: 'fortune', name: 'Fortune', icon: '🍽️', stat: 'critChance', amount: 5, duration: 12 },
        survivalEffect: { fatigue: -25, morale: 12 }
    },
    spicy_fish_skewer: {
        name: 'Spicy Fish Skewer', icon: '🍢', type: 'consumable', stackable: true,
        description: 'Fish with shadow peppers. Heals and boosts attack. Grants Warmth.',
        effect: { heal: 20, buff: { stat: 'attack', amount: 4, duration: 8 } }, value: 30,
        buff: { id: 'spicy', name: 'Fiery Blood', icon: '🍢', stat: 'attack', amount: 3, duration: 10 },
        survivalEffect: { temperature: 20, fatigue: -8, morale: 3 }
    },

    // ═══════════════════════════════════════════
    // QUEST / KEY ITEMS
    // ═══════════════════════════════════════════

    ancient_key_fragment: {
        name: 'Ancient Key Fragment', icon: '🗝️', type: 'quest', stackable: true,
        description: 'A shard of an ancient key. Three fragments needed to reform it.', value: 0
    },
    void_crystal_quest: {
        name: 'Void Crystal Shard', icon: '💎', type: 'quest',
        description: 'A pulsing crystal of pure void energy.', value: 0
    },
    ruun_codex_page: {
        name: 'Ruun Codex Page', icon: '📜', type: 'quest', stackable: true,
        description: 'A page from the legendary Ruun Codex.', value: 0
    }
};

// Resource drop tables per region
const RESOURCE_TABLES = {
    ashen_wastes: {
        common: ['wood', 'stone', 'iron_ore', 'fiber'],
        uncommon: ['hide', 'ember_root', 'coal', 'clay', 'bone'],
        rare: ['flame_essence', 'iron_ingot', 'fang', 'gold_nugget']
    },
    hollowfen: {
        common: ['wood', 'bog_fiber', 'hide', 'clay', 'fiber'],
        uncommon: ['iron_ore', 'ember_root', 'thick_hide', 'ectoplasm', 'hardwood'],
        rare: ['shadow_silk', 'veil_crystal', 'gem_emerald', 'gem_sapphire']
    },
    void_sanctum: {
        common: ['stone', 'iron_ore', 'shadow_silk', 'hardwood', 'granite'],
        uncommon: ['veil_crystal', 'flame_essence', 'mithril_ore', 'obsidian', 'shadow_hide'],
        rare: ['void_ore', 'void_essence', 'spectral_thread', 'gem_ruby', 'gem_amethyst', 'ruun_shard']
    }
};

// Loot tables by area difficulty
const LOOT_TABLES = {
    common: {
        consumables: ['health_vial', 'mana_vial'],
        equipment: ['iron_longsword', 'chainmail_vest', 'leather_cap', 'leather_boots', 'wooden_shield'],
        goldRange: [5, 20]
    },
    uncommon: {
        consumables: ['health_vial', 'mana_vial', 'greater_health_potion', 'antidote'],
        equipment: ['voidtouched_blade', 'iron_plate', 'iron_helm', 'iron_boots', 'iron_shield', 'hunting_bow'],
        goldRange: [15, 50]
    },
    rare: {
        consumables: ['greater_health_potion', 'elixir_of_power', 'antidote'],
        equipment: ['emberforged_axe', 'runebound_plate', 'mithril_helm', 'mithril_boots', 'composite_bow', 'cloak_of_shadows'],
        goldRange: [40, 120]
    },
    epic: {
        consumables: ['greater_health_potion', 'elixir_of_power', 'void_tonic'],
        equipment: ['mantle_of_the_hollow', 'void_crown', 'void_striders', 'amulet_of_the_void'],
        goldRange: [80, 250]
    }
};
