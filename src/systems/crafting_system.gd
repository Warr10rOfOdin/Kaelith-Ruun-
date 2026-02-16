extends Node
## CraftingSystem - 3-tier crafting system (Physical, Infusion, Veil Binding)
##
## This system handles all crafting mechanics including recipe validation,
## resource consumption, and risk-based veil binding crafts.
##
## Tiers:
##   1 - Physical Craft: Basic tools, armor, structures
##   2 - Infusion Craft: Elemental upgrades (requires heat)
##   3 - Veil Binding: High corruption crafting (risk of cursed items)
##
## Usage:
##   CraftingSystem.craft_item("iron_sword")
##   CraftingSystem.can_craft("iron_sword")

class_name CraftingSystem

## Crafting tiers
enum CraftTier {
	PHYSICAL = 1,
	INFUSION = 2,
	VEIL_BINDING = 3
}

## Unlocked recipes (recipe_id -> bool)
var unlocked_recipes: Dictionary = {}

## Currently crafting (for UI feedback)
var is_crafting: bool = false
var current_craft: Dictionary = {}

## Inventory system reference
var inventory_system: InventorySystem = null

## Heat/Corruption system reference
var heat_corruption_system: HeatCorruptionSystem = null


func _ready() -> void:
	print("[CraftingSystem] Initializing crafting system...")

	# Get system references
	inventory_system = get_node_or_null("/root/InventorySystem")
	heat_corruption_system = get_node_or_null("/root/HeatCorruptionSystem")

	# Subscribe to events
	EventBus.subscribe("collect_save_data", _on_collect_save_data)

	# Unlock starter recipes
	_unlock_starter_recipes()

	print("[CraftingSystem] System ready")


## Unlock starter recipes
func _unlock_starter_recipes() -> void:
	# In a real game, these would be loaded from data
	var starter_recipes = [
		"wooden_tool",
		"stone_tool",
		"basic_structure"
	]

	for recipe_id in starter_recipes:
		unlock_recipe(recipe_id)


# ============================================================================
# Recipe Management
# ============================================================================

## Unlock a recipe
func unlock_recipe(recipe_id: String) -> void:
	if unlocked_recipes.has(recipe_id):
		return

	unlocked_recipes[recipe_id] = true

	EventBus.emit_event(EventBus.EVENT_RECIPE_UNLOCKED, {
		"recipe_id": recipe_id
	})

	print("[CraftingSystem] Unlocked recipe: %s" % recipe_id)


## Check if recipe is unlocked
func is_recipe_unlocked(recipe_id: String) -> bool:
	return unlocked_recipes.get(recipe_id, false)


## Get all unlocked recipes
func get_unlocked_recipes() -> Array:
	return unlocked_recipes.keys()


## Get unlocked recipes by tier
func get_recipes_by_tier(tier: CraftTier) -> Array:
	var result = []

	for recipe_id in unlocked_recipes.keys():
		var recipe_data = DataManager.get_recipe(recipe_id)
		if recipe_data.get("tier", 1) == tier:
			result.append(recipe_data)

	return result


# ============================================================================
# Crafting
# ============================================================================

## Craft an item
func craft_item(recipe_id: String) -> bool:
	# Check if recipe is unlocked
	if not is_recipe_unlocked(recipe_id):
		push_warning("[CraftingSystem] Recipe not unlocked: %s" % recipe_id)
		return false

	# Get recipe data
	var recipe_data = DataManager.get_recipe(recipe_id)
	if recipe_data.is_empty():
		push_error("[CraftingSystem] Recipe not found: %s" % recipe_id)
		return false

	# Check if can craft
	if not can_craft(recipe_id):
		push_warning("[CraftingSystem] Cannot craft: %s" % recipe_id)
		return false

	# Get craft tier
	var tier = recipe_data.get("tier", 1)

	# Tier-specific crafting logic
	match tier:
		CraftTier.PHYSICAL:
			return _craft_physical(recipe_data)
		CraftTier.INFUSION:
			return _craft_infusion(recipe_data)
		CraftTier.VEIL_BINDING:
			return _craft_veil_binding(recipe_data)
		_:
			push_error("[CraftingSystem] Invalid craft tier: %d" % tier)
			return false


## Check if player can craft a recipe
func can_craft(recipe_id: String) -> bool:
	if not is_recipe_unlocked(recipe_id):
		return false

	var recipe_data = DataManager.get_recipe(recipe_id)
	if recipe_data.is_empty():
		return false

	# Check if player has required items
	if not _has_required_items(recipe_data):
		return false

	# Tier-specific requirements
	var tier = recipe_data.get("tier", 1)

	match tier:
		CraftTier.INFUSION:
			# Requires minimum heat
			var required_heat = recipe_data.get("required_heat", 60.0)
			if heat_corruption_system:
				var player_heat = heat_corruption_system.get_heat_at(GameManager.player.global_position) if GameManager.player else 0.0
				if player_heat < required_heat:
					return false
			else:
				return false

		CraftTier.VEIL_BINDING:
			# Requires minimum corruption
			var required_corruption = recipe_data.get("required_corruption", 50.0)
			if GameManager.player and GameManager.player.veil_corruption < required_corruption:
				return false

	return true


## Check if player has required items
func _has_required_items(recipe_data: Dictionary) -> bool:
	if not inventory_system:
		return false

	var inputs = recipe_data.get("inputs", [])

	for input in inputs:
		var item_id = input.get("item_id", "")
		var quantity = input.get("quantity", 1)

		if not inventory_system.has_item(item_id, quantity):
			return false

	return true


# ============================================================================
# Tier 1: Physical Craft
# ============================================================================

func _craft_physical(recipe_data: Dictionary) -> bool:
	print("[CraftingSystem] Crafting physical item: %s" % recipe_data.id)

	# Consume inputs
	if not _consume_recipe_inputs(recipe_data):
		return false

	# Produce output
	_produce_recipe_output(recipe_data)

	# Success
	AudioManager.play_sfx("craft_physical")

	EventBus.emit_event(EventBus.EVENT_ITEM_CRAFTED, {
		"recipe_id": recipe_data.id,
		"item_id": recipe_data.output.item_id,
		"quantity": recipe_data.output.quantity,
		"tier": CraftTier.PHYSICAL
	})

	return true


# ============================================================================
# Tier 2: Infusion Craft
# ============================================================================

func _craft_infusion(recipe_data: Dictionary) -> bool:
	print("[CraftingSystem] Crafting infusion item: %s" % recipe_data.id)

	# Check heat requirement
	var required_heat = recipe_data.get("required_heat", 60.0)
	var player_heat = 0.0

	if heat_corruption_system and GameManager.player:
		player_heat = heat_corruption_system.get_heat_at(GameManager.player.global_position)

	if player_heat < required_heat:
		push_warning("[CraftingSystem] Insufficient heat: %.1f / %.1f" % [player_heat, required_heat])
		return false

	# Consume inputs
	if not _consume_recipe_inputs(recipe_data):
		return false

	# Heat stability check (optional mini-game could go here)
	var heat_stable = true
	var stability_threshold = recipe_data.get("stability_threshold", 0.8)

	if randf() > stability_threshold:
		heat_stable = false

	if not heat_stable:
		# Failed craft - lose some materials
		AudioManager.play_sfx("craft_fail")

		EventBus.emit_event(EventBus.EVENT_CRAFT_FAILED, {
			"recipe_id": recipe_data.id,
			"reason": "heat_unstable",
			"tier": CraftTier.INFUSION
		})

		print("[CraftingSystem] Infusion craft failed - heat unstable!")
		return false

	# Produce output
	_produce_recipe_output(recipe_data)

	# Success
	AudioManager.play_sfx("craft_infusion")

	EventBus.emit_event(EventBus.EVENT_ITEM_CRAFTED, {
		"recipe_id": recipe_data.id,
		"item_id": recipe_data.output.item_id,
		"quantity": recipe_data.output.quantity,
		"tier": CraftTier.INFUSION
	})

	return true


# ============================================================================
# Tier 3: Veil Binding
# ============================================================================

func _craft_veil_binding(recipe_data: Dictionary) -> bool:
	print("[CraftingSystem] Crafting veil binding item: %s" % recipe_data.id)

	# Check corruption requirement
	var required_corruption = recipe_data.get("required_corruption", 50.0)

	if not GameManager.player or GameManager.player.veil_corruption < required_corruption:
		push_warning("[CraftingSystem] Insufficient corruption")
		return false

	# Consume inputs
	if not _consume_recipe_inputs(recipe_data):
		return false

	# Consume corruption
	if GameManager.player:
		GameManager.player.veil_corruption -= required_corruption

	# Risk-based outcome
	var success_chance = recipe_data.get("success_chance", 0.7)
	var legendary_chance = recipe_data.get("legendary_chance", 0.1)
	var cursed_chance = recipe_data.get("cursed_chance", 0.2)

	var roll = randf()

	if roll < legendary_chance:
		# Legendary artifact!
		_produce_legendary_output(recipe_data)

		AudioManager.play_sfx("craft_legendary")

		EventBus.emit_event(EventBus.EVENT_ITEM_CRAFTED, {
			"recipe_id": recipe_data.id,
			"item_id": recipe_data.output.item_id + "_legendary",
			"quantity": recipe_data.output.quantity,
			"tier": CraftTier.VEIL_BINDING,
			"quality": "legendary"
		})

		print("[CraftingSystem] Legendary artifact crafted!")
		return true

	elif roll < legendary_chance + cursed_chance:
		# Cursed item
		_produce_cursed_output(recipe_data)

		AudioManager.play_sfx("craft_cursed")

		EventBus.emit_event(EventBus.EVENT_CRAFT_FAILED, {
			"recipe_id": recipe_data.id,
			"reason": "cursed",
			"tier": CraftTier.VEIL_BINDING
		})

		print("[CraftingSystem] Item became cursed!")
		return false

	elif roll < legendary_chance + cursed_chance + success_chance:
		# Normal success
		_produce_recipe_output(recipe_data)

		AudioManager.play_sfx("craft_veil_binding")

		EventBus.emit_event(EventBus.EVENT_ITEM_CRAFTED, {
			"recipe_id": recipe_data.id,
			"item_id": recipe_data.output.item_id,
			"quantity": recipe_data.output.quantity,
			"tier": CraftTier.VEIL_BINDING,
			"quality": "normal"
		})

		print("[CraftingSystem] Veil binding successful!")
		return true

	else:
		# Total failure - lose everything
		AudioManager.play_sfx("craft_fail")

		EventBus.emit_event(EventBus.EVENT_CRAFT_FAILED, {
			"recipe_id": recipe_data.id,
			"reason": "veil_collapse",
			"tier": CraftTier.VEIL_BINDING
		})

		print("[CraftingSystem] Veil binding failed - materials lost!")
		return false


# ============================================================================
# Helper Functions
# ============================================================================

func _consume_recipe_inputs(recipe_data: Dictionary) -> bool:
	if not inventory_system:
		return false

	var inputs = recipe_data.get("inputs", [])

	for input in inputs:
		var item_id = input.get("item_id", "")
		var quantity = input.get("quantity", 1)

		if not inventory_system.remove_item(item_id, quantity):
			push_error("[CraftingSystem] Failed to consume input: %s x%d" % [item_id, quantity])
			return false

	return true


func _produce_recipe_output(recipe_data: Dictionary) -> void:
	if not inventory_system:
		return

	var output = recipe_data.get("output", {})
	var item_id = output.get("item_id", "")
	var quantity = output.get("quantity", 1)

	inventory_system.add_item(item_id, quantity)


func _produce_legendary_output(recipe_data: Dictionary) -> void:
	if not inventory_system:
		return

	var output = recipe_data.get("output", {})
	var item_id = output.get("item_id", "") + "_legendary"
	var quantity = output.get("quantity", 1)

	inventory_system.add_item(item_id, quantity)


func _produce_cursed_output(recipe_data: Dictionary) -> void:
	if not inventory_system:
		return

	# Cursed items could damage player or add negative effects
	var cursed_item_id = "cursed_fragment"
	inventory_system.add_item(cursed_item_id, 1)

	# Damage player
	if GameManager.player:
		GameManager.player.take_damage(20.0, "cursed_craft")


# ============================================================================
# Event Handlers
# ============================================================================

func _on_collect_save_data(data: Dictionary) -> void:
	data.save_data.crafting = get_save_data()


# ============================================================================
# Save/Load
# ============================================================================

func get_save_data() -> Dictionary:
	return {
		"unlocked_recipes": unlocked_recipes.duplicate()
	}


func load_save_data(data: Dictionary) -> void:
	unlocked_recipes = data.get("unlocked_recipes", {})

	print("[CraftingSystem] Loaded %d unlocked recipes" % unlocked_recipes.size())


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== CraftingSystem Debug Info =====")
	print("Unlocked Recipes: %d" % unlocked_recipes.size())

	print("\nBy Tier:")
	print("  - Physical (Tier 1): %d" % get_recipes_by_tier(CraftTier.PHYSICAL).size())
	print("  - Infusion (Tier 2): %d" % get_recipes_by_tier(CraftTier.INFUSION).size())
	print("  - Veil Binding (Tier 3): %d" % get_recipes_by_tier(CraftTier.VEIL_BINDING).size())

	print("\nUnlocked Recipes:")
	for recipe_id in unlocked_recipes.keys():
		print("  - %s" % recipe_id)

	print("======================================\n")


## Unlock all recipes (debug)
func debug_unlock_all_recipes() -> void:
	for recipe_id in DataManager.recipes.keys():
		unlock_recipe(recipe_id)
	print("[CraftingSystem] DEBUG: Unlocked all recipes")
