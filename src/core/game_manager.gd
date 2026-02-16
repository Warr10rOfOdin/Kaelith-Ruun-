extends Node
## GameManager - Central game state management and lifecycle control
##
## This autoload manages the overall game state, coordinates system initialization,
## and handles high-level game flow (pause, game over, day/night cycle, etc.).
##
## Usage:
##   GameManager.pause_game()
##   GameManager.start_new_game()
##   var current_day = GameManager.current_day

## Game state enum
enum GameState {
	MAIN_MENU,
	LOADING,
	PLAYING,
	PAUSED,
	BUILD_MODE,
	GAME_OVER,
	IN_MULTIPLAYER_LOBBY
}

## Current game state
var current_state: GameState = GameState.MAIN_MENU

## Game session data
var current_day: int = 1
var current_time: float = 0.0  # 0.0 = dawn, 0.5 = noon, 1.0 = midnight
var is_night: bool = false
var world_seed: int = 0

## Day/night cycle settings
var day_length_seconds: float = 600.0  # 10 minutes per full day/night cycle
var night_start_time: float = 0.75  # Night starts at 75% through day
var day_start_time: float = 0.25    # Day resumes at 25%

## Time scale (can be modified for fast-forward, etc.)
var time_scale: float = 1.0

## Player reference
var player: Node = null

## World reference
var world: Node = null

## Current biome
var current_biome: String = "ember_fields"

## Performance settings
var quality_preset: int = 1  # 0=Low, 1=Medium, 2=High

## Debug settings
var debug_mode: bool = false
var show_debug_overlay: bool = false

## Statistics
var session_start_time: int = 0
var total_play_time: int = 0  # in seconds
var enemies_killed: int = 0
var items_crafted: int = 0
var crops_harvested: int = 0


func _ready() -> void:
	print("[GameManager] Initializing game manager...")
	_initialize_game_systems()
	print("[GameManager] Game manager ready")


func _process(delta: float) -> void:
	if current_state == GameState.PLAYING:
		_update_time_cycle(delta)


## Initialize all game systems
func _initialize_game_systems() -> void:
	# Set random seed for reproducibility in debugging
	if debug_mode:
		seed(12345)

	# Apply quality settings
	_apply_quality_preset(quality_preset)

	# Subscribe to key events
	EventBus.subscribe(EventBus.EVENT_PLAYER_DIED, _on_player_died)
	EventBus.subscribe(EventBus.EVENT_ENEMY_KILLED, _on_enemy_killed)
	EventBus.subscribe(EventBus.EVENT_ITEM_CRAFTED, _on_item_crafted)
	EventBus.subscribe(EventBus.EVENT_CROP_HARVESTED, _on_crop_harvested)


## Start a new game
func start_new_game(seed_value: int = -1) -> void:
	print("[GameManager] Starting new game...")

	# Generate or use provided seed
	if seed_value == -1:
		world_seed = randi()
	else:
		world_seed = seed_value

	seed(world_seed)

	# Reset game state
	current_day = 1
	current_time = 0.25  # Start at dawn
	is_night = false
	session_start_time = Time.get_ticks_msec()

	# Reset statistics
	enemies_killed = 0
	items_crafted = 0
	crops_harvested = 0

	# Change state
	change_state(GameState.PLAYING)

	# Notify systems
	EventBus.emit_event("game_started", {
		"seed": world_seed,
		"day": current_day
	})

	print("[GameManager] New game started (seed: %d)" % world_seed)


## Load an existing game
func load_game(save_data: Dictionary) -> void:
	print("[GameManager] Loading game...")

	# Restore game state from save data
	current_day = save_data.get("current_day", 1)
	current_time = save_data.get("current_time", 0.25)
	world_seed = save_data.get("world_seed", 0)
	total_play_time = save_data.get("total_play_time", 0)

	# Restore statistics
	enemies_killed = save_data.get("enemies_killed", 0)
	items_crafted = save_data.get("items_crafted", 0)
	crops_harvested = save_data.get("crops_harvested", 0)

	seed(world_seed)
	session_start_time = Time.get_ticks_msec()

	change_state(GameState.PLAYING)

	EventBus.emit_event(EventBus.EVENT_GAME_LOADED, save_data)

	print("[GameManager] Game loaded (Day %d)" % current_day)


## Get save data dictionary
func get_save_data() -> Dictionary:
	return {
		"current_day": current_day,
		"current_time": current_time,
		"world_seed": world_seed,
		"total_play_time": total_play_time + _get_current_session_time(),
		"enemies_killed": enemies_killed,
		"items_crafted": items_crafted,
		"crops_harvested": crops_harvested,
		"timestamp": Time.get_unix_time_from_system()
	}


## Change game state
func change_state(new_state: GameState) -> void:
	var old_state = current_state
	current_state = new_state

	print("[GameManager] State changed: %s -> %s" % [
		GameState.keys()[old_state],
		GameState.keys()[new_state]
	])

	# Handle state transitions
	match new_state:
		GameState.PAUSED:
			get_tree().paused = true
			EventBus.emit_event(EventBus.EVENT_GAME_PAUSED, {})

		GameState.PLAYING:
			get_tree().paused = false
			EventBus.emit_event(EventBus.EVENT_GAME_RESUMED, {})

		GameState.GAME_OVER:
			_handle_game_over()

	EventBus.emit_event("game_state_changed", {
		"old_state": old_state,
		"new_state": new_state
	})


## Pause the game
func pause_game() -> void:
	if current_state == GameState.PLAYING:
		change_state(GameState.PAUSED)


## Resume the game
func resume_game() -> void:
	if current_state == GameState.PAUSED:
		change_state(GameState.PLAYING)


## Toggle pause
func toggle_pause() -> void:
	if current_state == GameState.PLAYING:
		pause_game()
	elif current_state == GameState.PAUSED:
		resume_game()


## Update day/night cycle
func _update_time_cycle(delta: float) -> void:
	var time_increment = (delta * time_scale) / day_length_seconds
	current_time += time_increment

	# Advance to next day
	if current_time >= 1.0:
		current_time = 0.0
		current_day += 1
		EventBus.emit_event(EventBus.EVENT_DAY_STARTED, {"day": current_day})
		print("[GameManager] Day %d started" % current_day)

	# Check for night/day transitions
	var was_night = is_night
	is_night = current_time >= night_start_time or current_time < day_start_time

	if is_night and not was_night:
		EventBus.emit_event(EventBus.EVENT_NIGHT_STARTED, {"day": current_day, "time": current_time})
		print("[GameManager] Night has fallen (Day %d)" % current_day)
	elif not is_night and was_night:
		EventBus.emit_event(EventBus.EVENT_DAY_STARTED, {"day": current_day, "time": current_time})


## Skip to next day (requires majority vote in multiplayer)
func skip_to_day() -> void:
	print("[GameManager] Skipping to next day...")

	# Advance time to dawn
	current_time = day_start_time
	current_day += 1
	is_night = false

	EventBus.emit_event(EventBus.EVENT_DAY_STARTED, {"day": current_day, "skipped": true})

	# This is an ad trigger point (as per design doc)
	EventBus.emit_event("ad_trigger_sleep", {})


## Get current time of day as string
func get_time_of_day_string() -> String:
	if current_time < 0.25:
		return "Night"
	elif current_time < 0.5:
		return "Morning"
	elif current_time < 0.75:
		return "Afternoon"
	else:
		return "Evening"


## Get time percentage (0.0 to 1.0)
func get_time_percentage() -> float:
	return current_time


## Set time scale (for debugging or special events)
func set_time_scale(scale: float) -> void:
	time_scale = clamp(scale, 0.0, 10.0)
	print("[GameManager] Time scale set to %.2fx" % time_scale)


## Apply quality preset
func _apply_quality_preset(preset: int) -> void:
	quality_preset = clamp(preset, 0, 2)

	match quality_preset:
		0:  # Low
			print("[GameManager] Applying LOW quality preset")
			# Reduce visual effects, particle counts, etc.

		1:  # Medium
			print("[GameManager] Applying MEDIUM quality preset")

		2:  # High
			print("[GameManager] Applying HIGH quality preset")

	# Notify systems of quality change
	EventBus.emit_event("quality_preset_changed", {"preset": quality_preset})


## Set quality preset
func set_quality_preset(preset: int) -> void:
	_apply_quality_preset(preset)


## Handle game over
func _handle_game_over() -> void:
	print("[GameManager] Game Over!")

	# This is an ad trigger point (death ad)
	EventBus.emit_event("ad_trigger_death", {})

	# Calculate session stats
	var session_time = _get_current_session_time()

	EventBus.emit_event("game_over", {
		"day": current_day,
		"session_time": session_time,
		"enemies_killed": enemies_killed,
		"items_crafted": items_crafted,
		"crops_harvested": crops_harvested
	})


## Respawn player
func respawn_player() -> void:
	print("[GameManager] Respawning player...")

	# Return to sanctum
	current_time = day_start_time  # Reset to morning
	is_night = false

	change_state(GameState.PLAYING)

	EventBus.emit_event(EventBus.EVENT_PLAYER_RESPAWNED, {})


## Get current session play time in seconds
func _get_current_session_time() -> int:
	return (Time.get_ticks_msec() - session_start_time) / 1000


## Get total play time (including previous sessions)
func get_total_play_time() -> int:
	return total_play_time + _get_current_session_time()


# ============================================================================
# Event Handlers
# ============================================================================

func _on_player_died(data: Dictionary) -> void:
	print("[GameManager] Player died: %s" % data)
	change_state(GameState.GAME_OVER)


func _on_enemy_killed(data: Dictionary) -> void:
	enemies_killed += 1


func _on_item_crafted(data: Dictionary) -> void:
	items_crafted += 1


func _on_crop_harvested(data: Dictionary) -> void:
	crops_harvested += 1


# ============================================================================
# Debug Functions
# ============================================================================

## Print game state debug info
func print_debug_info() -> void:
	print("\n===== GameManager Debug Info =====")
	print("State: %s" % GameState.keys()[current_state])
	print("Day: %d" % current_day)
	print("Time: %.2f (%s)" % [current_time, get_time_of_day_string()])
	print("Is Night: %s" % is_night)
	print("World Seed: %d" % world_seed)
	print("Time Scale: %.2fx" % time_scale)
	print("\nStatistics:")
	print("  Session Time: %d seconds" % _get_current_session_time())
	print("  Total Time: %d seconds" % get_total_play_time())
	print("  Enemies Killed: %d" % enemies_killed)
	print("  Items Crafted: %d" % items_crafted)
	print("  Crops Harvested: %d" % crops_harvested)
	print("===================================\n")


## Toggle debug overlay
func toggle_debug_overlay() -> void:
	show_debug_overlay = not show_debug_overlay
	EventBus.emit_event("debug_overlay_toggled", {"enabled": show_debug_overlay})
