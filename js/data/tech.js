// ============================================
// TECH TREE — Progression & Unlocks
// ============================================
// Tech tiers unlock new recipes, buildings, and abilities.
// Each tier requires certain buildings built + bosses defeated.

const TECH_TREE = {
    // ── TIER 0: Starting Knowledge ──
    // Available from game start
    tier_0: {
        name: 'Survivor',
        icon: '🔰',
        description: 'Basic survival knowledge. You know how to build shelter and craft simple tools.',
        requirements: {},
        unlocks: {
            buildings: ['shelter', 'garden', 'storage'],
            recipes: [
                'iron_ingot', 'health_vial_craft', 'mana_vial_craft', 'antidote_craft',
                'stone_axe_craft', 'stone_pickaxe_craft', 'stone_sickle_craft', 'stone_hammer_craft',
                'bone_sword_craft', 'bone_dagger_craft', 'leather_vest_craft', 'leather_cap_craft',
                'leather_boots_craft', 'wooden_shield_craft', 'fishing_rod_craft',
                'woven_cloth_craft', 'leather_craft'
            ]
        }
    },

    // ── TIER 1: Established Camp ──
    // Requires: shelter + workshop or forge built
    tier_1: {
        name: 'Settler',
        icon: '🏠',
        description: 'With a shelter and workshop, you can forge iron equipment and expand your camp.',
        requirements: {
            buildings: ['shelter'],
            buildingsAny: ['workshop', 'forge'],
            minBuildings: 2
        },
        unlocks: {
            buildings: ['forge', 'workshop', 'farm', 'herbalist_bench', 'training_dummy'],
            recipes: [
                'iron_sword', 'iron_axe_craft', 'iron_pickaxe_craft', 'iron_sickle_craft',
                'iron_hammer_craft', 'iron_fishing_rod_craft', 'iron_dagger_craft',
                'iron_mace_craft', 'chainmail_vest_craft', 'iron_helm_craft', 'iron_boots_craft',
                'iron_shield_craft', 'iron_plate_craft',
                'greater_health_craft', 'hearth_stew', 'grilled_meat_craft',
                'placeable_torch_craft', 'placeable_storage_chest_craft',
                'placeable_scarecrow_craft', 'placeable_flower_pot_craft',
                'hardened_leather_craft',
                'fish_stew_craft', 'spicy_fish_skewer_craft'
            ]
        }
    },

    // ── TIER 2: Ashen Conqueror ──
    // Requires: Ashen King defeated + forge + workshop
    tier_2: {
        name: 'Ashen Conqueror',
        icon: '🔥',
        description: 'Having defeated the Ashen King, you harness flame essence for advanced crafting.',
        requirements: {
            bosses: ['the_ashen_king'],
            buildings: ['forge', 'workshop'],
            minBuildings: 4
        },
        unlocks: {
            buildings: ['ward_stones', 'house', 'lookout'],
            recipes: [
                'flame_blade', 'shadow_daggers', 'fen_staff', 'war_hammer_craft',
                'bog_leather', 'warden_plate', 'composite_bow_craft',
                'steel_sword_craft', 'crystal_staff_craft', 'swift_boots_craft',
                'iron_plate_craft', 'chainmail_coif_craft',
                'miners_gear_craft', 'foresters_cloak_craft', 'farmers_garb_craft',
                'herbalists_robes_craft', 'anglers_hat_craft',
                'ring_of_vigor_craft', 'ring_of_wisdom_craft',
                'amulet_of_strength_craft', 'amulet_of_warding_craft', 'ember_pendant_craft',
                'placeable_smelter_craft', 'placeable_anvil_craft', 'placeable_tanning_rack_craft',
                'placeable_loom_craft', 'placeable_cooking_pot_craft',
                'placeable_bed_craft', 'placeable_well_craft',
                'placeable_banner_ashen_craft', 'placeable_bookshelf_craft',
                'mushroom_soup_craft', 'cooked_fish_craft',
                'silk_thread_craft',
                'grilled_golden_fish_craft'
            ]
        }
    },

    // ── TIER 3: Fen Master ──
    // Requires: Mother of the Fen defeated + herbalist bench
    tier_3: {
        name: 'Fen Master',
        icon: '🌿',
        description: 'The Hollowfen yields its secrets. Shadow silk and ectoplasm fuel powerful creations.',
        requirements: {
            bosses: ['the_ashen_king', 'mother_of_the_fen'],
            buildings: ['forge', 'herbalist_bench'],
            minBuildings: 6
        },
        unlocks: {
            recipes: [
                'mithril_ingot_craft', 'mithril_sword_craft', 'mithril_daggers_craft',
                'mithril_maul_craft', 'mithril_staff_craft', 'mithril_bow_craft',
                'mithril_axe_craft', 'mithril_pickaxe_craft', 'mithril_sickle_craft',
                'mithril_hammer_craft',
                'mithril_plate_craft', 'mithril_helm_craft', 'mithril_boots_craft',
                'mithril_shield_craft', 'runebound_plate_craft',
                'cloak_of_shadows_craft', 'veil_ring_craft',
                'tome_of_flames_craft', 'crystal_focus_craft',
                'placeable_alchemy_table_craft', 'placeable_rug_craft',
                'placeable_weapon_rack_craft', 'placeable_banner_fen_craft',
                'shadow_leather_craft', 'starweave_cloth_craft',
                'supreme_health_craft', 'elixir_of_power_craft', 'elixir_of_iron_craft',
                'elixir_of_haste_craft',
                'void_steak_craft', 'feast_platter_craft',
                'mantle_of_the_hollow_craft'
            ]
        }
    },

    // ── TIER 4: Void Walker ──
    // Requires: All bosses defeated
    tier_4: {
        name: 'Void Walker',
        icon: '🌀',
        description: 'You have conquered all realms. Void materials yield ultimate equipment.',
        requirements: {
            bosses: ['the_ashen_king', 'mother_of_the_fen', 'ruun_the_unraveler'],
            buildings: ['forge', 'workshop', 'herbalist_bench'],
            minBuildings: 8
        },
        unlocks: {
            recipes: [
                'void_ingot_craft',
                'void_blade_craft', 'void_stiletto_craft', 'void_crusher_craft',
                'void_scepter_craft', 'whisper_of_ruun_craft',
                'void_axe_craft', 'void_pickaxe_craft',
                'void_plate_craft', 'void_crown_craft', 'void_striders_craft',
                'void_ward_craft',
                'amulet_of_the_void_craft', 'ruun_sigil_craft',
                'placeable_enchanting_table_craft', 'placeable_trophy_mount_craft',
                'placeable_banner_void_craft',
                'void_tonic_craft', 'elixir_of_restoration_craft'
            ]
        }
    }
};

// Helper to check which tech tiers are unlocked
const TechTree = {
    getUnlockedTier() {
        let highestTier = 0;
        for (let i = 0; i <= 4; i++) {
            const tier = TECH_TREE[`tier_${i}`];
            if (this.meetsRequirements(tier.requirements)) {
                highestTier = i;
            }
        }
        return highestTier;
    },

    meetsRequirements(reqs) {
        if (!reqs || Object.keys(reqs).length === 0) return true;
        if (!GameState.base) return false;

        // Check required bosses
        if (reqs.bosses) {
            for (const boss of reqs.bosses) {
                if (!GameState.bossesDefeated || !GameState.bossesDefeated.includes(boss)) return false;
            }
        }

        // Check required buildings (all must be built)
        if (reqs.buildings) {
            for (const bld of reqs.buildings) {
                if (!GameState.base.buildings || !GameState.base.buildings[bld]) return false;
            }
        }

        // Check any-of buildings (at least one must be built)
        if (reqs.buildingsAny) {
            const hasAny = reqs.buildingsAny.some(bld =>
                GameState.base.buildings && GameState.base.buildings[bld]
            );
            if (!hasAny) return false;
        }

        // Check minimum total buildings
        if (reqs.minBuildings) {
            const builtCount = GameState.base.buildings
                ? Object.values(GameState.base.buildings).filter(Boolean).length
                : 0;
            if (builtCount < reqs.minBuildings) return false;
        }

        return true;
    },

    getUnlockedRecipes() {
        const recipes = new Set();
        for (let i = 0; i <= 4; i++) {
            const tier = TECH_TREE[`tier_${i}`];
            if (this.meetsRequirements(tier.requirements)) {
                if (tier.unlocks.recipes) {
                    tier.unlocks.recipes.forEach(r => recipes.add(r));
                }
            }
        }
        return recipes;
    },

    getUnlockedBuildings() {
        const buildings = new Set();
        for (let i = 0; i <= 4; i++) {
            const tier = TECH_TREE[`tier_${i}`];
            if (this.meetsRequirements(tier.requirements)) {
                if (tier.unlocks.buildings) {
                    tier.unlocks.buildings.forEach(b => buildings.add(b));
                }
            }
        }
        return buildings;
    },

    isRecipeUnlocked(recipeId) {
        return this.getUnlockedRecipes().has(recipeId);
    },

    isBuildingUnlocked(buildingId) {
        return this.getUnlockedBuildings().has(buildingId);
    },

    // Get info for the tech tree UI panel
    getTierInfo() {
        const tiers = [];
        for (let i = 0; i <= 4; i++) {
            const tier = TECH_TREE[`tier_${i}`];
            const unlocked = this.meetsRequirements(tier.requirements);
            tiers.push({
                id: `tier_${i}`,
                level: i,
                ...tier,
                unlocked
            });
        }
        return tiers;
    }
};
