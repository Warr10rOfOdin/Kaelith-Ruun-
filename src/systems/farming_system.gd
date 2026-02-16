extends Node
## FarmingSystem - Manages crop planting, growth, and harvesting
##
## This system handles all farming mechanics including heat/corruption-based
## growth, crop phases, and environmental requirements.
##
## Usage:
##   FarmingSystem.plant_crop("ember_root", position)
##   FarmingSystem.harvest_crop(crop_instance)

class_name FarmingSystem

## Crop instances (position -> crop_data)
var active_crops: Dictionary = {}

## Crop ID counter
var next_crop_id: int = 0

## Update settings
var update_interval: float = 1.0  # Update crops every second
var update_timer: float = 0.0

## Heat/Corruption system reference
var heat_corruption_system: HeatCorruptionSystem = null


func _ready() -> void:
	print("[FarmingSystem] Initializing farming system...")

	# Get heat/corruption system reference
	heat_corruption_system = get_node_or_null("/root/HeatCorruptionSystem")

	# Subscribe to events
	EventBus.subscribe("collect_save_data", _on_collect_save_data)

	print("[FarmingSystem] System ready")


func _process(delta: float) -> void:
	update_timer += delta

	if update_timer >= update_interval:
		_update_all_crops()
		update_timer = 0.0


# ============================================================================
# Crop Planting
# ============================================================================

## Plant a crop at a position
func plant_crop(crop_id: String, position: Vector2) -> int:
	var crop_data = DataManager.get_crop(crop_id)
	if crop_data.is_empty():
		push_warning("[FarmingSystem] Unknown crop: %s" % crop_id)
		return -1

	# Check if position is already occupied
	if is_position_occupied(position):
		push_warning("[FarmingSystem] Position already occupied: %s" % position)
		return -1

	# Create crop instance
	var instance_id = next_crop_id
	next_crop_id += 1

	var crop_instance = {
		"instance_id": instance_id,
		"crop_id": crop_id,
		"position": position,
		"growth_progress": 0.0,  # 0.0 to 1.0
		"current_phase": 0,
		"planted_time": Time.get_ticks_msec(),
		"wilted": false,
		"data": crop_data
	}

	active_crops[instance_id] = crop_instance

	EventBus.emit_event(EventBus.EVENT_CROP_PLANTED, {
		"instance_id": instance_id,
		"crop_id": crop_id,
		"position": position
	})

	AudioManager.play_sfx("plant_crop")

	print("[FarmingSystem] Planted %s at %s (ID: %d)" % [crop_id, position, instance_id])

	return instance_id


## Check if position is occupied by a crop
func is_position_occupied(position: Vector2, tolerance: float = 10.0) -> bool:
	for crop in active_crops.values():
		if crop.position.distance_to(position) < tolerance:
			return true
	return false


## Remove a crop (without harvesting)
func remove_crop(instance_id: int) -> void:
	if not active_crops.has(instance_id):
		return

	var crop = active_crops[instance_id]
	active_crops.erase(instance_id)

	EventBus.emit_event("crop_removed", {
		"instance_id": instance_id,
		"crop_id": crop.crop_id,
		"position": crop.position
	})


# ============================================================================
# Crop Growth
# ============================================================================

## Update all crops
func _update_all_crops() -> void:
	for instance_id in active_crops.keys():
		_update_crop_growth(instance_id)


## Update individual crop growth
func _update_crop_growth(instance_id: int) -> void:
	var crop = active_crops[instance_id]
	if crop.wilted:
		return

	# Get environmental conditions
	var position = crop.position
	var heat = 50.0
	var corruption = 0.0

	if heat_corruption_system:
		heat = heat_corruption_system.get_heat_at(position)
		corruption = heat_corruption_system.get_corruption_at(position)

	# Check if conditions are suitable
	var crop_data = crop.data
	var required_heat = crop_data.get("required_heat", 50.0)
	var corruption_tolerance = crop_data.get("corruption_tolerance", 20.0)

	# Calculate growth multiplier
	var growth_multiplier = 1.0

	if heat_corruption_system:
		growth_multiplier = heat_corruption_system.get_crop_growth_multiplier(position, crop_data)

	# Check for wilting conditions
	var heat_diff = abs(heat - required_heat)
	if heat_diff > 40.0 or corruption > (corruption_tolerance + 30.0):
		# Crop wilts in extreme conditions
		_wilt_crop(instance_id)
		return

	# Update growth
	var growth_rate = crop_data.get("growth_rate", 0.01)  # Base growth per second
	crop.growth_progress += growth_rate * growth_multiplier * update_interval

	# Check for phase changes
	var total_phases = crop_data.get("growth_phases", 3)
	var new_phase = int(crop.growth_progress * total_phases)
	new_phase = clamp(new_phase, 0, total_phases)

	if new_phase != crop.current_phase:
		crop.current_phase = new_phase

		EventBus.emit_event(EventBus.EVENT_CROP_PHASE_CHANGED, {
			"instance_id": instance_id,
			"crop_id": crop.crop_id,
			"phase": new_phase,
			"total_phases": total_phases
		})

	# Check if fully grown
	if crop.growth_progress >= 1.0:
		crop.growth_progress = 1.0
		EventBus.emit_event("crop_ready_harvest", {
			"instance_id": instance_id,
			"crop_id": crop.crop_id,
			"position": crop.position
		})


## Wilt a crop (bad environmental conditions)
func _wilt_crop(instance_id: int) -> void:
	var crop = active_crops[instance_id]
	if crop.wilted:
		return

	crop.wilted = true

	EventBus.emit_event(EventBus.EVENT_CROP_WILTED, {
		"instance_id": instance_id,
		"crop_id": crop.crop_id,
		"position": crop.position
	})

	print("[FarmingSystem] Crop wilted: %s (ID: %d)" % [crop.crop_id, instance_id])


# ============================================================================
# Harvesting
# ============================================================================

## Harvest a crop
func harvest_crop(instance_id: int) -> Dictionary:
	if not active_crops.has(instance_id):
		push_warning("[FarmingSystem] Crop not found: %d" % instance_id)
		return {}

	var crop = active_crops[instance_id]

	# Check if ready to harvest
	if crop.growth_progress < 1.0:
		push_warning("[FarmingSystem] Crop not ready to harvest: %d" % instance_id)
		return {}

	if crop.wilted:
		push_warning("[FarmingSystem] Cannot harvest wilted crop: %d" % instance_id)
		return {}

	# Calculate yield
	var crop_data = crop.data
	var base_yield = crop_data.get("base_yield", 1)
	var yield_variation = crop_data.get("yield_variation", 0.2)

	var final_yield = base_yield + randi_range(
		int(-base_yield * yield_variation),
		int(base_yield * yield_variation)
	)
	final_yield = max(1, final_yield)

	# Get harvest items
	var harvest_item_id = crop_data.get("harvest_item_id", crop.crop_id + "_item")
	var harvest_result = {
		"item_id": harvest_item_id,
		"quantity": final_yield
	}

	# Remove crop
	active_crops.erase(instance_id)

	# Emit event
	EventBus.emit_event(EventBus.EVENT_CROP_HARVESTED, {
		"instance_id": instance_id,
		"crop_id": crop.crop_id,
		"position": crop.position,
		"harvest": harvest_result
	})

	AudioManager.play_sfx("harvest_crop")

	print("[FarmingSystem] Harvested %s: %d x %s" % [crop.crop_id, final_yield, harvest_item_id])

	return harvest_result


## Check if crop is ready to harvest
func is_crop_ready(instance_id: int) -> bool:
	if not active_crops.has(instance_id):
		return false

	var crop = active_crops[instance_id]
	return crop.growth_progress >= 1.0 and not crop.wilted


## Get crop at position
func get_crop_at_position(position: Vector2, tolerance: float = 20.0) -> int:
	for instance_id in active_crops.keys():
		var crop = active_crops[instance_id]
		if crop.position.distance_to(position) < tolerance:
			return instance_id
	return -1


## Get crop info
func get_crop_info(instance_id: int) -> Dictionary:
	if active_crops.has(instance_id):
		return active_crops[instance_id]
	return {}


# ============================================================================
# Queries
# ============================================================================

## Get all active crops
func get_all_crops() -> Array:
	return active_crops.values()


## Get crops by type
func get_crops_by_type(crop_id: String) -> Array:
	var result = []
	for crop in active_crops.values():
		if crop.crop_id == crop_id:
			result.append(crop)
	return result


## Get ready crops
func get_ready_crops() -> Array:
	var result = []
	for crop in active_crops.values():
		if crop.growth_progress >= 1.0 and not crop.wilted:
			result.append(crop)
	return result


## Get wilted crops
func get_wilted_crops() -> Array:
	var result = []
	for crop in active_crops.values():
		if crop.wilted:
			result.append(crop)
	return result


# ============================================================================
# Save/Load
# ============================================================================

func _on_collect_save_data(data: Dictionary) -> void:
	data.save_data.farming = get_save_data()


func get_save_data() -> Dictionary:
	return {
		"active_crops": active_crops.duplicate(true),
		"next_crop_id": next_crop_id
	}


func load_save_data(data: Dictionary) -> void:
	active_crops = data.get("active_crops", {})
	next_crop_id = data.get("next_crop_id", 0)

	print("[FarmingSystem] Loaded %d active crops" % active_crops.size())


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== FarmingSystem Debug Info =====")
	print("Active Crops: %d" % active_crops.size())
	print("Next Crop ID: %d" % next_crop_id)
	print("\nCrop Breakdown:")
	var crop_types = {}
	for crop in active_crops.values():
		if not crop_types.has(crop.crop_id):
			crop_types[crop.crop_id] = 0
		crop_types[crop.crop_id] += 1

	for crop_id in crop_types.keys():
		print("  - %s: %d" % [crop_id, crop_types[crop_id]])

	var ready = get_ready_crops().size()
	var wilted = get_wilted_crops().size()
	print("\nReady to Harvest: %d" % ready)
	print("Wilted: %d" % wilted)
	print("=====================================\n")


## Force grow crop (debug)
func debug_grow_crop(instance_id: int) -> void:
	if active_crops.has(instance_id):
		active_crops[instance_id].growth_progress = 1.0
		active_crops[instance_id].current_phase = active_crops[instance_id].data.get("growth_phases", 3)
		print("[FarmingSystem] DEBUG: Instantly grew crop %d" % instance_id)
