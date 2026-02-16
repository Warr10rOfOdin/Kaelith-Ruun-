extends Node
## BuildingSystem - Sanctum modular base building system
##
## This system handles placement and management of Sanctum modules.
## Each module affects heat, corruption, craft efficiency, etc.
##
## Module Types:
##   - Forge Wing: Crafting efficiency, heat output
##   - Crop Terrace: Farming bonuses
##   - Ritual Chamber: Veil binding efficiency
##   - Watchtower: Enemy detection
##   - Storage Vault: Inventory expansion
##   - Ember Reactor: Heat generation
##   - Ward Pillars: Corruption resistance
##
## Usage:
##   BuildingSystem.place_module("forge_wing", position)
##   BuildingSystem.remove_module(module_id)

class_name BuildingSystem

## Sanctum core (fixed position, immovable)
var sanctum_core_position: Vector2 = Vector2(0, 0)
var sanctum_core_exists: bool = false

## Placed modules (instance_id -> module_data)
var placed_modules: Dictionary = {}
var next_module_id: int = 0

## Build mode state
var build_mode_active: bool = false
var selected_module_type: String = ""
var ghost_module_position: Vector2 = Vector2.ZERO

## Module placement constraints
const MAX_MODULES = 20
const MIN_MODULE_SPACING = 50.0
const MAX_DISTANCE_FROM_CORE = 500.0

## System references
var inventory_system: InventorySystem = null
var heat_corruption_system: HeatCorruptionSystem = null


func _ready() -> void:
	print("[BuildingSystem] Initializing building system...")

	# Get system references
	inventory_system = get_node_or_null("/root/InventorySystem")
	heat_corruption_system = get_node_or_null("/root/HeatCorruptionSystem")

	# Subscribe to events
	EventBus.subscribe("collect_save_data", _on_collect_save_data)
	EventBus.subscribe(EventBus.EVENT_BUILD_MODE_TOGGLED, _on_build_mode_toggled)

	print("[BuildingSystem] System ready")


# ============================================================================
# Sanctum Core
# ============================================================================

## Place the Sanctum core (once per save)
func place_sanctum_core(position: Vector2) -> bool:
	if sanctum_core_exists:
		push_warning("[BuildingSystem] Sanctum core already exists")
		return false

	sanctum_core_position = position
	sanctum_core_exists = true

	EventBus.emit_event("sanctum_core_placed", {
		"position": position
	})

	print("[BuildingSystem] Sanctum core placed at %s" % position)

	return true


# ============================================================================
# Module Placement
# ============================================================================

## Place a module
func place_module(module_type: String, position: Vector2) -> int:
	# Validate placement
	if not can_place_module(module_type, position):
		push_warning("[BuildingSystem] Cannot place module at %s" % position)
		return -1

	# Get module data
	var module_data = DataManager.get_building(module_type)
	if module_data.is_empty():
		push_error("[BuildingSystem] Unknown module type: %s" % module_type)
		return -1

	# Check cost
	if not _has_build_cost(module_data):
		push_warning("[BuildingSystem] Insufficient resources to build %s" % module_type)
		return -1

	# Check permissions (multiplayer)
	if NetworkManager.network_state != NetworkManager.NetworkState.OFFLINE:
		var peer_id = NetworkManager.get_local_peer_id()
		if not NetworkManager.has_permission(peer_id, NetworkManager.Permission.BUILDER):
			push_warning("[BuildingSystem] No builder permission")
			return -1

	# Consume resources
	if not _consume_build_cost(module_data):
		return -1

	# Create module instance
	var instance_id = next_module_id
	next_module_id += 1

	var module_instance = {
		"instance_id": instance_id,
		"module_type": module_type,
		"position": position,
		"level": 1,
		"health": module_data.get("max_health", 100.0),
		"built_time": Time.get_ticks_msec(),
		"data": module_data
	}

	placed_modules[instance_id] = module_instance

	# Apply module effects
	_apply_module_effects(module_instance)

	# Emit event
	EventBus.emit_event(EventBus.EVENT_MODULE_BUILT, {
		"instance_id": instance_id,
		"module_type": module_type,
		"module_id": module_type,
		"position": position
	})

	AudioManager.play_sfx("build_module")

	print("[BuildingSystem] Built %s at %s (ID: %d)" % [module_type, position, instance_id])

	return instance_id


## Remove/destroy a module
func remove_module(instance_id: int) -> bool:
	if not placed_modules.has(instance_id):
		push_warning("[BuildingSystem] Module not found: %d" % instance_id)
		return false

	var module = placed_modules[instance_id]

	# Remove effects
	_remove_module_effects(module)

	# Remove from list
	placed_modules.erase(instance_id)

	# Emit event
	EventBus.emit_event(EventBus.EVENT_MODULE_DESTROYED, {
		"instance_id": instance_id,
		"module_type": module.module_type,
		"position": module.position
	})

	AudioManager.play_sfx("destroy_module")

	print("[BuildingSystem] Removed module %d" % instance_id)

	return true


## Check if a module can be placed at position
func can_place_module(module_type: String, position: Vector2) -> bool:
	# Check if sanctum core exists
	if not sanctum_core_exists:
		return false

	# Check module limit
	if placed_modules.size() >= MAX_MODULES:
		return false

	# Check distance from core
	var distance_from_core = position.distance_to(sanctum_core_position)
	if distance_from_core > MAX_DISTANCE_FROM_CORE:
		return false

	# Check spacing from other modules
	for module in placed_modules.values():
		var distance = position.distance_to(module.position)
		if distance < MIN_MODULE_SPACING:
			return false

	return true


# ============================================================================
# Module Effects
# ============================================================================

func _apply_module_effects(module: Dictionary) -> void:
	var module_data = module.data

	# Heat output
	var heat_output = module_data.get("heat_output", 0.0)
	if heat_output > 0 and heat_corruption_system:
		var heat_radius = module_data.get("heat_radius", 100.0)
		var heat_source_id = heat_corruption_system.add_heat_source(module.position, heat_radius, heat_output)
		module["heat_source_id"] = heat_source_id

	# Corruption resistance
	var corruption_resistance = module_data.get("corruption_resistance", 0.0)
	if corruption_resistance > 0:
		# This would reduce corruption in an area
		pass

	# Sanctum heat change
	var sanctum_heat_delta = module_data.get("sanctum_heat_delta", 0.0)
	if sanctum_heat_delta != 0:
		EventBus.emit_event(EventBus.EVENT_SANCTUM_HEAT_CHANGED, {
			"delta": sanctum_heat_delta
		})


func _remove_module_effects(module: Dictionary) -> void:
	# Remove heat source
	if module.has("heat_source_id") and heat_corruption_system:
		heat_corruption_system.remove_heat_source(module.heat_source_id)


# ============================================================================
# Module Upgrades
# ============================================================================

## Upgrade a module to next level
func upgrade_module(instance_id: int) -> bool:
	if not placed_modules.has(instance_id):
		return false

	var module = placed_modules[instance_id]
	var current_level = module.level
	var max_level = module.data.get("max_level", 3)

	if current_level >= max_level:
		push_warning("[BuildingSystem] Module already at max level")
		return false

	# Check upgrade cost
	var upgrade_cost = module.data.get("upgrade_cost", {})
	# ... cost checking logic ...

	# Upgrade
	module.level += 1

	EventBus.emit_event(EventBus.EVENT_MODULE_UPGRADED, {
		"instance_id": instance_id,
		"new_level": module.level
	})

	AudioManager.play_sfx("upgrade_module")

	print("[BuildingSystem] Upgraded module %d to level %d" % [instance_id, module.level])

	return true


# ============================================================================
# Build Cost Management
# ============================================================================

func _has_build_cost(module_data: Dictionary) -> bool:
	if not inventory_system:
		return false

	var cost = module_data.get("cost", [])

	for cost_item in cost:
		var item_id = cost_item.get("item_id", "")
		var quantity = cost_item.get("quantity", 1)

		if not inventory_system.has_item(item_id, quantity):
			return false

	return true


func _consume_build_cost(module_data: Dictionary) -> bool:
	if not inventory_system:
		return false

	var cost = module_data.get("cost", [])

	for cost_item in cost:
		var item_id = cost_item.get("item_id", "")
		var quantity = cost_item.get("quantity", 1)

		if not inventory_system.remove_item(item_id, quantity):
			push_error("[BuildingSystem] Failed to consume build cost")
			return false

	return true


# ============================================================================
# Build Mode
# ============================================================================

func toggle_build_mode() -> void:
	build_mode_active = not build_mode_active

	EventBus.emit_event(EventBus.EVENT_BUILD_MODE_TOGGLED, {
		"active": build_mode_active
	})

	print("[BuildingSystem] Build mode: %s" % ("ON" if build_mode_active else "OFF"))


func _on_build_mode_toggled(data: Dictionary) -> void:
	# Handle build mode UI, etc.
	pass


# ============================================================================
# Queries
# ============================================================================

## Get all placed modules
func get_all_modules() -> Array:
	return placed_modules.values()


## Get modules by type
func get_modules_by_type(module_type: String) -> Array:
	var result = []
	for module in placed_modules.values():
		if module.module_type == module_type:
			result.append(module)
	return result


## Get module at position
func get_module_at_position(position: Vector2, tolerance: float = 30.0) -> int:
	for instance_id in placed_modules.keys():
		var module = placed_modules[instance_id]
		if module.position.distance_to(position) < tolerance:
			return instance_id
	return -1


## Get total Sanctum stats
func get_sanctum_stats() -> Dictionary:
	var stats = {
		"total_heat_output": 0.0,
		"total_corruption_resistance": 0.0,
		"total_defense": 0.0,
		"module_count": placed_modules.size()
	}

	for module in placed_modules.values():
		var data = module.data
		stats.total_heat_output += data.get("heat_output", 0.0)
		stats.total_corruption_resistance += data.get("corruption_resistance", 0.0)
		stats.total_defense += data.get("defense", 0.0)

	return stats


# ============================================================================
# Event Handlers
# ============================================================================

func _on_collect_save_data(data: Dictionary) -> void:
	data.save_data.building = get_save_data()


# ============================================================================
# Save/Load
# ============================================================================

func get_save_data() -> Dictionary:
	return {
		"sanctum_core_position": {
			"x": sanctum_core_position.x,
			"y": sanctum_core_position.y
		},
		"sanctum_core_exists": sanctum_core_exists,
		"placed_modules": placed_modules.duplicate(true),
		"next_module_id": next_module_id
	}


func load_save_data(data: Dictionary) -> void:
	if data.has("sanctum_core_position"):
		var pos = data.sanctum_core_position
		sanctum_core_position = Vector2(pos.x, pos.y)

	sanctum_core_exists = data.get("sanctum_core_exists", false)
	placed_modules = data.get("placed_modules", {})
	next_module_id = data.get("next_module_id", 0)

	# Reapply module effects
	for module in placed_modules.values():
		_apply_module_effects(module)

	print("[BuildingSystem] Loaded %d modules" % placed_modules.size())


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== BuildingSystem Debug Info =====")
	print("Sanctum Core Exists: %s" % sanctum_core_exists)
	print("Sanctum Core Position: %s" % sanctum_core_position)
	print("Placed Modules: %d / %d" % [placed_modules.size(), MAX_MODULES])

	var stats = get_sanctum_stats()
	print("\nSanctum Stats:")
	print("  - Total Heat Output: %.1f" % stats.total_heat_output)
	print("  - Total Corruption Resistance: %.1f" % stats.total_corruption_resistance)
	print("  - Total Defense: %.1f" % stats.total_defense)

	print("\nModules:")
	for module in placed_modules.values():
		print("  - [%d] %s (Level %d) at %s" % [
			module.instance_id,
			module.module_type,
			module.level,
			module.position
		])

	print("======================================\n")
