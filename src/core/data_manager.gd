extends Node
## DataManager - Loads and manages all game data from JSON configuration files
##
## This autoload handles loading of all game content data from JSON files,
## providing a centralized data access point. This makes the game data-driven
## and easy to update without code changes.
##
## Usage:
##   var crop_data = DataManager.get_crop("ember_root")
##   var biome_data = DataManager.get_biome("ember_fields")
##   var recipe = DataManager.get_recipe("iron_sword")

## Data storage dictionaries
var items: Dictionary = {}
var crops: Dictionary = {}
var biomes: Dictionary = {}
var recipes: Dictionary = {}
var enemies: Dictionary = {}
var buildings: Dictionary = {}
var balancing: Dictionary = {}

## Loading state
var is_loaded: bool = false
var load_errors: Array = []

## Data file paths
const DATA_PATH = "res://data/"
const ITEMS_PATH = DATA_PATH + "items/"
const CROPS_PATH = DATA_PATH + "crops/"
const BIOMES_PATH = DATA_PATH + "biomes/"
const RECIPES_PATH = DATA_PATH + "recipes/"
const ENEMIES_PATH = DATA_PATH + "enemies/"
const BUILDINGS_PATH = DATA_PATH + "buildings/"
const BALANCING_PATH = DATA_PATH + "balancing.json"


func _ready() -> void:
	print("[DataManager] Initializing data manager...")
	load_all_data()


## Load all game data from JSON files
func load_all_data() -> void:
	print("[DataManager] Loading game data...")
	load_errors.clear()

	# Load in dependency order
	_load_balancing()
	_load_items()
	_load_crops()
	_load_biomes()
	_load_recipes()
	_load_enemies()
	_load_buildings()

	is_loaded = true

	if load_errors.is_empty():
		print("[DataManager] All data loaded successfully!")
		print("  - Items: %d" % items.size())
		print("  - Crops: %d" % crops.size())
		print("  - Biomes: %d" % biomes.size())
		print("  - Recipes: %d" % recipes.size())
		print("  - Enemies: %d" % enemies.size())
		print("  - Buildings: %d" % buildings.size())
	else:
		push_warning("[DataManager] Data loaded with %d errors:" % load_errors.size())
		for error in load_errors:
			push_warning("  - %s" % error)

	EventBus.emit_event(EventBus.EVENT_GAME_LOADED, {"data_manager": true})


## Reload all data (useful for hot-reloading during development)
func reload_all_data() -> void:
	print("[DataManager] Reloading all data...")
	items.clear()
	crops.clear()
	biomes.clear()
	recipes.clear()
	enemies.clear()
	buildings.clear()
	balancing.clear()

	load_all_data()


# ============================================================================
# Data Access Methods
# ============================================================================

## Get item data by ID
func get_item(item_id: String) -> Dictionary:
	if items.has(item_id):
		return items[item_id]
	push_warning("[DataManager] Item not found: %s" % item_id)
	return {}


## Get crop data by ID
func get_crop(crop_id: String) -> Dictionary:
	if crops.has(crop_id):
		return crops[crop_id]
	push_warning("[DataManager] Crop not found: %s" % crop_id)
	return {}


## Get biome data by ID
func get_biome(biome_id: String) -> Dictionary:
	if biomes.has(biome_id):
		return biomes[biome_id]
	push_warning("[DataManager] Biome not found: %s" % biome_id)
	return {}


## Get recipe data by ID
func get_recipe(recipe_id: String) -> Dictionary:
	if recipes.has(recipe_id):
		return recipes[recipe_id]
	push_warning("[DataManager] Recipe not found: %s" % recipe_id)
	return {}


## Get enemy data by ID
func get_enemy(enemy_id: String) -> Dictionary:
	if enemies.has(enemy_id):
		return enemies[enemy_id]
	push_warning("[DataManager] Enemy not found: %s" % enemy_id)
	return {}


## Get building data by ID
func get_building(building_id: String) -> Dictionary:
	if buildings.has(building_id):
		return buildings[building_id]
	push_warning("[DataManager] Building not found: %s" % building_id)
	return {}


## Get balancing value by key
func get_balancing(key: String, default_value = null):
	if balancing.has(key):
		return balancing[key]
	if default_value != null:
		return default_value
	push_warning("[DataManager] Balancing key not found: %s" % key)
	return null


## Get all items of a specific type
func get_items_by_type(item_type: String) -> Array:
	var result = []
	for item_id in items.keys():
		if items[item_id].get("type", "") == item_type:
			result.append(items[item_id])
	return result


## Get all recipes for a specific tier
func get_recipes_by_tier(tier: int) -> Array:
	var result = []
	for recipe_id in recipes.keys():
		if recipes[recipe_id].get("tier", 1) == tier:
			result.append(recipes[recipe_id])
	return result


## Get all enemies for a specific biome
func get_enemies_by_biome(biome_id: String) -> Array:
	var result = []
	for enemy_id in enemies.keys():
		var enemy_biomes = enemies[enemy_id].get("biomes", [])
		if biome_id in enemy_biomes:
			result.append(enemies[enemy_id])
	return result


# ============================================================================
# Data Loading Methods (Internal)
# ============================================================================

## Load balancing configuration
func _load_balancing() -> void:
	var data = _load_json_file(BALANCING_PATH)
	if data:
		balancing = data
		print("[DataManager] Loaded balancing configuration")


## Load all items
func _load_items() -> void:
	var item_files = _get_json_files(ITEMS_PATH)
	for file_path in item_files:
		var item_data = _load_json_file(file_path)
		if item_data and item_data.has("id"):
			items[item_data.id] = item_data
		else:
			load_errors.append("Invalid item data in: %s" % file_path)


## Load all crops
func _load_crops() -> void:
	var crop_files = _get_json_files(CROPS_PATH)
	for file_path in crop_files:
		var crop_data = _load_json_file(file_path)
		if crop_data and crop_data.has("id"):
			crops[crop_data.id] = crop_data
		else:
			load_errors.append("Invalid crop data in: %s" % file_path)


## Load all biomes
func _load_biomes() -> void:
	var biome_files = _get_json_files(BIOMES_PATH)
	for file_path in biome_files:
		var biome_data = _load_json_file(file_path)
		if biome_data and biome_data.has("id"):
			biomes[biome_data.id] = biome_data
		else:
			load_errors.append("Invalid biome data in: %s" % file_path)


## Load all recipes
func _load_recipes() -> void:
	var recipe_files = _get_json_files(RECIPES_PATH)
	for file_path in recipe_files:
		var recipe_data = _load_json_file(file_path)
		if recipe_data and recipe_data.has("id"):
			recipes[recipe_data.id] = recipe_data
		else:
			load_errors.append("Invalid recipe data in: %s" % file_path)


## Load all enemies
func _load_enemies() -> void:
	var enemy_files = _get_json_files(ENEMIES_PATH)
	for file_path in enemy_files:
		var enemy_data = _load_json_file(file_path)
		if enemy_data and enemy_data.has("id"):
			enemies[enemy_data.id] = enemy_data
		else:
			load_errors.append("Invalid enemy data in: %s" % file_path)


## Load all buildings
func _load_buildings() -> void:
	var building_files = _get_json_files(BUILDINGS_PATH)
	for file_path in building_files:
		var building_data = _load_json_file(file_path)
		if building_data and building_data.has("id"):
			buildings[building_data.id] = building_data
		else:
			load_errors.append("Invalid building data in: %s" % file_path)


# ============================================================================
# File Loading Utilities
# ============================================================================

## Load and parse a JSON file
func _load_json_file(file_path: String) -> Variant:
	if not FileAccess.file_exists(file_path):
		# Not an error if file doesn't exist (may be optional)
		return null

	var file = FileAccess.open(file_path, FileAccess.READ)
	if not file:
		load_errors.append("Failed to open file: %s" % file_path)
		return null

	var content = file.get_as_text()
	file.close()

	var json = JSON.new()
	var error = json.parse(content)

	if error != OK:
		load_errors.append("JSON parse error in %s at line %d: %s" % [file_path, json.get_error_line(), json.get_error_message()])
		return null

	return json.get_data()


## Get all JSON files in a directory
func _get_json_files(dir_path: String) -> Array:
	var files = []

	if not DirAccess.dir_exists_absolute(dir_path):
		# Directory doesn't exist yet (may be in initial setup)
		return files

	var dir = DirAccess.open(dir_path)
	if not dir:
		load_errors.append("Failed to open directory: %s" % dir_path)
		return files

	dir.list_dir_begin()
	var file_name = dir.get_next()

	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			files.append(dir_path + file_name)
		file_name = dir.get_next()

	dir.list_dir_end()
	return files


# ============================================================================
# Validation
# ============================================================================

## Validate all loaded data (checks for broken references, etc.)
func validate_data() -> Array:
	var validation_errors = []

	# Validate recipes reference valid items
	for recipe_id in recipes.keys():
		var recipe = recipes[recipe_id]

		# Check inputs
		if recipe.has("inputs"):
			for input in recipe.inputs:
				if not items.has(input.item_id):
					validation_errors.append("Recipe %s references unknown item: %s" % [recipe_id, input.item_id])

		# Check output
		if recipe.has("output"):
			if not items.has(recipe.output.item_id):
				validation_errors.append("Recipe %s outputs unknown item: %s" % [recipe_id, recipe.output.item_id])

	# Validate enemies reference valid items (for drops)
	for enemy_id in enemies.keys():
		var enemy = enemies[enemy_id]
		if enemy.has("drops"):
			for drop in enemy.drops:
				if not items.has(drop.item_id):
					validation_errors.append("Enemy %s drops unknown item: %s" % [enemy_id, drop.item_id])

	# Validate buildings reference valid items (for costs)
	for building_id in buildings.keys():
		var building = buildings[building_id]
		if building.has("cost"):
			for cost in building.cost:
				if not items.has(cost.item_id):
					validation_errors.append("Building %s costs unknown item: %s" % [building_id, cost.item_id])

	if validation_errors.is_empty():
		print("[DataManager] Data validation passed!")
	else:
		push_warning("[DataManager] Data validation found %d errors:" % validation_errors.size())
		for error in validation_errors:
			push_warning("  - %s" % error)

	return validation_errors


## Print debug information
func print_debug_info() -> void:
	print("\n===== DataManager Debug Info =====")
	print("Loaded: %s" % is_loaded)
	print("Load Errors: %d" % load_errors.size())
	print("\nData Counts:")
	print("  - Items: %d" % items.size())
	print("  - Crops: %d" % crops.size())
	print("  - Biomes: %d" % biomes.size())
	print("  - Recipes: %d" % recipes.size())
	print("  - Enemies: %d" % enemies.size())
	print("  - Buildings: %d" % buildings.size())
	print("===================================\n")
