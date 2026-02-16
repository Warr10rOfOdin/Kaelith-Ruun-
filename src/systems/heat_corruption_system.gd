extends Node
## HeatCorruptionSystem - Manages heat and corruption environmental mechanics
##
## This system tracks heat and corruption levels globally and locally,
## managing their effects on gameplay (crop growth, enemy behavior, player stats).
##
## Usage:
##   HeatCorruptionSystem.get_heat_at(position)
##   HeatCorruptionSystem.add_corruption_source(position, radius, intensity)

class_name HeatCorruptionSystem

## Heat sources (position -> {radius, intensity})
var heat_sources: Array = []

## Corruption sources (position -> {radius, intensity})
var corruption_sources: Array = []

## Global heat level (ambient)
var global_heat: float = 50.0  # 0-100

## Global corruption level
var global_corruption: float = 0.0  # 0-100

## Heat/corruption zones (for optimization)
var heat_zones: Array = []
var corruption_zones: Array = []

## Update rate
var update_interval: float = 0.5  # Update every 0.5 seconds
var update_timer: float = 0.0

## Corruption storm settings
var corruption_storm_active: bool = false
var corruption_storm_intensity: float = 0.0
var corruption_storm_duration: float = 0.0
var corruption_storm_timer: float = 0.0


func _ready() -> void:
	print("[HeatCorruptionSystem] Initializing heat & corruption system...")

	# Subscribe to events
	EventBus.subscribe(EventBus.EVENT_MODULE_BUILT, _on_module_built)
	EventBus.subscribe(EventBus.EVENT_MODULE_DESTROYED, _on_module_destroyed)
	EventBus.subscribe(EventBus.EVENT_NIGHT_STARTED, _on_night_started)

	print("[HeatCorruptionSystem] System ready")


func _process(delta: float) -> void:
	update_timer += delta

	if update_timer >= update_interval:
		_update_system()
		update_timer = 0.0

	# Handle corruption storms
	if corruption_storm_active:
		_update_corruption_storm(delta)


## Update system (periodic)
func _update_system() -> void:
	# Update global corruption based on night/day
	if GameManager.is_night:
		global_corruption += 0.1
	else:
		global_corruption -= 0.05

	global_corruption = clamp(global_corruption, 0.0, 100.0)

	# Check player position for environmental effects
	if GameManager.player:
		var player_pos = GameManager.player.global_position
		var heat_at_player = get_heat_at(player_pos)
		var corruption_at_player = get_corruption_at(player_pos)

		# Update player's environmental context
		_check_player_zones(player_pos, heat_at_player, corruption_at_player)


# ============================================================================
# Heat Management
# ============================================================================

## Add a heat source
func add_heat_source(position: Vector2, radius: float, intensity: float) -> int:
	var source = {
		"id": heat_sources.size(),
		"position": position,
		"radius": radius,
		"intensity": intensity  # 0-100
	}

	heat_sources.append(source)

	print("[HeatCorruptionSystem] Added heat source at %s (r=%.1f, i=%.1f)" % [position, radius, intensity])

	EventBus.emit_event("heat_source_added", source)

	return source.id


## Remove a heat source
func remove_heat_source(source_id: int) -> void:
	for i in range(heat_sources.size()):
		if heat_sources[i].id == source_id:
			heat_sources.remove_at(i)
			EventBus.emit_event("heat_source_removed", {"id": source_id})
			return


## Get heat level at a position
func get_heat_at(position: Vector2) -> float:
	var total_heat = global_heat

	# Add heat from nearby sources
	for source in heat_sources:
		var distance = position.distance_to(source.position)
		if distance < source.radius:
			var falloff = 1.0 - (distance / source.radius)
			total_heat += source.intensity * falloff

	return clamp(total_heat, 0.0, 100.0)


## Check if position is in heat range
func is_in_heat_zone(position: Vector2, threshold: float = 60.0) -> bool:
	return get_heat_at(position) >= threshold


# ============================================================================
# Corruption Management
# ============================================================================

## Add a corruption source
func add_corruption_source(position: Vector2, radius: float, intensity: float) -> int:
	var source = {
		"id": corruption_sources.size(),
		"position": position,
		"radius": radius,
		"intensity": intensity  # 0-100
	}

	corruption_sources.append(source)

	print("[HeatCorruptionSystem] Added corruption source at %s (r=%.1f, i=%.1f)" % [position, radius, intensity])

	EventBus.emit_event("corruption_source_added", source)

	return source.id


## Remove a corruption source
func remove_corruption_source(source_id: int) -> void:
	for i in range(corruption_sources.size()):
		if corruption_sources[i].id == source_id:
			corruption_sources.remove_at(i)
			EventBus.emit_event("corruption_source_removed", {"id": source_id})
			return


## Get corruption level at a position
func get_corruption_at(position: Vector2) -> float:
	var total_corruption = global_corruption

	# Add corruption from nearby sources
	for source in corruption_sources:
		var distance = position.distance_to(source.position)
		if distance < source.radius:
			var falloff = 1.0 - (distance / source.radius)
			total_corruption += source.intensity * falloff

	# Add corruption storm intensity
	if corruption_storm_active:
		total_corruption += corruption_storm_intensity

	return clamp(total_corruption, 0.0, 100.0)


## Check if position is in corrupted zone
func is_in_corrupted_zone(position: Vector2, threshold: float = 30.0) -> bool:
	return get_corruption_at(position) >= threshold


# ============================================================================
# Corruption Storms (Random Events)
# ============================================================================

## Start a corruption storm
func start_corruption_storm(duration: float = 120.0, intensity: float = 50.0) -> void:
	corruption_storm_active = true
	corruption_storm_intensity = intensity
	corruption_storm_duration = duration
	corruption_storm_timer = 0.0

	EventBus.emit_event(EventBus.EVENT_CORRUPTION_STORM, {
		"started": true,
		"duration": duration,
		"intensity": intensity
	})

	AudioManager.play_ambient("corruption_storm")

	print("[HeatCorruptionSystem] Corruption storm started (duration=%.1fs, intensity=%.1f)" % [duration, intensity])


## Update corruption storm
func _update_corruption_storm(delta: float) -> void:
	corruption_storm_timer += delta

	if corruption_storm_timer >= corruption_storm_duration:
		_end_corruption_storm()


## End corruption storm
func _end_corruption_storm() -> void:
	corruption_storm_active = false
	corruption_storm_intensity = 0.0

	EventBus.emit_event(EventBus.EVENT_CORRUPTION_STORM, {
		"started": false
	})

	AudioManager.stop_ambient()

	print("[HeatCorruptionSystem] Corruption storm ended")


# ============================================================================
# Player Zone Tracking
# ============================================================================

var player_in_heat_zone: bool = false
var player_in_corruption_zone: bool = false

func _check_player_zones(player_pos: Vector2, heat: float, corruption: float) -> void:
	# Check heat zone
	var in_heat = heat >= 60.0
	if in_heat and not player_in_heat_zone:
		player_in_heat_zone = true
		EventBus.emit_event("heat_zone_entered", {"heat_level": heat})
	elif not in_heat and player_in_heat_zone:
		player_in_heat_zone = false
		EventBus.emit_event("heat_zone_exited", {})

	# Check corruption zone
	var in_corruption = corruption >= 30.0
	if in_corruption and not player_in_corruption_zone:
		player_in_corruption_zone = true
		EventBus.emit_event("corruption_zone_entered", {"corruption_level": corruption})
	elif not in_corruption and player_in_corruption_zone:
		player_in_corruption_zone = false
		EventBus.emit_event("corruption_zone_exited", {})


# ============================================================================
# Effects on Gameplay
# ============================================================================

## Get crop growth multiplier based on heat/corruption
func get_crop_growth_multiplier(position: Vector2, crop_data: Dictionary) -> float:
	var heat = get_heat_at(position)
	var corruption = get_corruption_at(position)

	var required_heat = crop_data.get("required_heat", 50.0)
	var corruption_tolerance = crop_data.get("corruption_tolerance", 20.0)

	var heat_multiplier = 1.0
	var corruption_multiplier = 1.0

	# Heat matching
	var heat_diff = abs(heat - required_heat)
	if heat_diff < 10.0:
		heat_multiplier = 1.5  # Optimal heat
	elif heat_diff < 20.0:
		heat_multiplier = 1.0  # Acceptable
	else:
		heat_multiplier = 0.5  # Poor conditions

	# Corruption tolerance
	if corruption > corruption_tolerance:
		corruption_multiplier = 0.5  # Crop struggles in high corruption
	else:
		corruption_multiplier = 1.0

	return heat_multiplier * corruption_multiplier


## Get enemy spawn multiplier based on corruption
func get_enemy_spawn_multiplier(position: Vector2) -> float:
	var corruption = get_corruption_at(position)

	# More corruption = more enemy spawns
	return 1.0 + (corruption / 100.0)


## Get enemy aggression multiplier
func get_enemy_aggression_multiplier(position: Vector2) -> float:
	var corruption = get_corruption_at(position)

	# Higher corruption = more aggressive enemies
	return 1.0 + (corruption / 50.0)


# ============================================================================
# Event Handlers
# ============================================================================

func _on_module_built(data: Dictionary) -> void:
	var module_id = data.get("module_id", "")

	# Check if module affects heat or corruption
	var module_data = DataManager.get_building(module_id)
	if module_data.is_empty():
		return

	var heat_output = module_data.get("heat_output", 0.0)
	var corruption_resistance = module_data.get("corruption_resistance", 0.0)
	var position = data.get("position", Vector2.ZERO)

	if heat_output > 0:
		var radius = module_data.get("heat_radius", 100.0)
		add_heat_source(position, radius, heat_output)

	if corruption_resistance > 0:
		# Reduce nearby corruption
		pass


func _on_module_destroyed(data: Dictionary) -> void:
	# Handle module removal
	pass


func _on_night_started(data: Dictionary) -> void:
	# Chance of corruption storm during night
	if randf() < 0.3:  # 30% chance
		var duration = randf_range(60.0, 180.0)
		var intensity = randf_range(30.0, 70.0)
		start_corruption_storm(duration, intensity)


# ============================================================================
# Save/Load
# ============================================================================

func get_save_data() -> Dictionary:
	return {
		"global_heat": global_heat,
		"global_corruption": global_corruption,
		"heat_sources": heat_sources.duplicate(),
		"corruption_sources": corruption_sources.duplicate(),
		"corruption_storm_active": corruption_storm_active
	}


func load_save_data(data: Dictionary) -> void:
	global_heat = data.get("global_heat", 50.0)
	global_corruption = data.get("global_corruption", 0.0)
	heat_sources = data.get("heat_sources", [])
	corruption_sources = data.get("corruption_sources", [])

	if data.get("corruption_storm_active", false):
		start_corruption_storm()


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== HeatCorruptionSystem Debug Info =====")
	print("Global Heat: %.1f" % global_heat)
	print("Global Corruption: %.1f" % global_corruption)
	print("Heat Sources: %d" % heat_sources.size())
	print("Corruption Sources: %d" % corruption_sources.size())
	print("Corruption Storm Active: %s" % corruption_storm_active)
	if corruption_storm_active:
		print("  - Intensity: %.1f" % corruption_storm_intensity)
		print("  - Time Remaining: %.1fs" % (corruption_storm_duration - corruption_storm_timer))
	print("===========================================\n")
