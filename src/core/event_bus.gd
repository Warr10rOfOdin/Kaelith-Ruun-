extends Node
## EventBus - Global event system for decoupled communication
##
## This autoload provides a central event dispatching system that allows
## any part of the game to emit or listen to events without tight coupling.
##
## Usage:
##   EventBus.emit_event("player_died", {"cause": "corruption"})
##   EventBus.subscribe("player_died", _on_player_died)
##   EventBus.unsubscribe("player_died", _on_player_died)

## Dictionary storing event_name -> Array of Callables
var _listeners: Dictionary = {}

## Debug flag for logging events
var debug_mode: bool = true

## Event categories for filtering debug output
enum EventCategory {
	PLAYER,
	COMBAT,
	FARMING,
	CRAFTING,
	BUILDING,
	WORLD,
	CORRUPTION,
	HEAT,
	MULTIPLAYER,
	UI,
	SYSTEM
}

## Event history for debugging (limited to last 100 events)
var _event_history: Array = []
const MAX_HISTORY_SIZE = 100

## Statistics tracking
var _event_stats: Dictionary = {}


func _ready() -> void:
	print("[EventBus] Initialized - Event system ready")


## Subscribe a callable to an event
## @param event_name: The name of the event to listen for
## @param callable: The function to call when event is emitted
func subscribe(event_name: String, callable: Callable) -> void:
	if not _listeners.has(event_name):
		_listeners[event_name] = []

	if callable in _listeners[event_name]:
		push_warning("[EventBus] Callable already subscribed to '%s'" % event_name)
		return

	_listeners[event_name].append(callable)

	if debug_mode:
		print("[EventBus] Subscribed to '%s' (%d listeners)" % [event_name, _listeners[event_name].size()])


## Unsubscribe a callable from an event
## @param event_name: The event to stop listening to
## @param callable: The function to remove
func unsubscribe(event_name: String, callable: Callable) -> void:
	if not _listeners.has(event_name):
		push_warning("[EventBus] No listeners for '%s'" % event_name)
		return

	var idx = _listeners[event_name].find(callable)
	if idx == -1:
		push_warning("[EventBus] Callable not found in '%s' listeners" % event_name)
		return

	_listeners[event_name].remove_at(idx)

	if debug_mode:
		print("[EventBus] Unsubscribed from '%s' (%d listeners remaining)" % [event_name, _listeners[event_name].size()])

	# Clean up empty listener arrays
	if _listeners[event_name].is_empty():
		_listeners.erase(event_name)


## Emit an event with optional data
## @param event_name: The name of the event
## @param data: Optional dictionary of event data
func emit_event(event_name: String, data: Dictionary = {}) -> void:
	# Track statistics
	if not _event_stats.has(event_name):
		_event_stats[event_name] = 0
	_event_stats[event_name] += 1

	# Add to history
	_add_to_history(event_name, data)

	if debug_mode:
		print("[EventBus] Event '%s' | Data: %s" % [event_name, data])

	if not _listeners.has(event_name):
		if debug_mode:
			print("[EventBus] No listeners for '%s'" % event_name)
		return

	# Call all listeners
	var listener_count = 0
	for callable in _listeners[event_name]:
		if callable.is_valid():
			callable.call(data)
			listener_count += 1
		else:
			push_warning("[EventBus] Invalid callable found for '%s'" % event_name)

	if debug_mode:
		print("[EventBus] Notified %d listeners for '%s'" % [listener_count, event_name])


## Clear all listeners for an event (use with caution)
## @param event_name: The event to clear
func clear_event_listeners(event_name: String) -> void:
	if _listeners.has(event_name):
		var count = _listeners[event_name].size()
		_listeners.erase(event_name)
		print("[EventBus] Cleared %d listeners for '%s'" % [count, event_name])


## Clear all listeners (use only when resetting game state)
func clear_all_listeners() -> void:
	var total_listeners = 0
	for event_listeners in _listeners.values():
		total_listeners += event_listeners.size()

	_listeners.clear()
	print("[EventBus] Cleared all listeners (%d total)" % total_listeners)


## Get all registered events
func get_registered_events() -> Array:
	return _listeners.keys()


## Get listener count for an event
func get_listener_count(event_name: String) -> int:
	if _listeners.has(event_name):
		return _listeners[event_name].size()
	return 0


## Get event statistics
func get_event_stats() -> Dictionary:
	return _event_stats.duplicate()


## Get event history
func get_event_history() -> Array:
	return _event_history.duplicate()


## Clear event history
func clear_history() -> void:
	_event_history.clear()
	print("[EventBus] Event history cleared")


## Clear event statistics
func clear_stats() -> void:
	_event_stats.clear()
	print("[EventBus] Event statistics cleared")


## Add event to history (internal)
func _add_to_history(event_name: String, data: Dictionary) -> void:
	_event_history.append({
		"event": event_name,
		"data": data,
		"timestamp": Time.get_ticks_msec()
	})

	# Trim history if too large
	if _event_history.size() > MAX_HISTORY_SIZE:
		_event_history.pop_front()


## Print debug information
func print_debug_info() -> void:
	print("\n===== EventBus Debug Info =====")
	print("Total registered events: %d" % _listeners.size())
	print("\nEvent Listeners:")
	for event_name in _listeners.keys():
		print("  - %s: %d listeners" % [event_name, _listeners[event_name].size()])

	print("\nEvent Statistics:")
	var sorted_stats = _event_stats.keys()
	sorted_stats.sort()
	for event_name in sorted_stats:
		print("  - %s: %d times" % [event_name, _event_stats[event_name]])

	print("\nRecent Events (last 10):")
	var recent_count = min(10, _event_history.size())
	for i in range(_event_history.size() - recent_count, _event_history.size()):
		var entry = _event_history[i]
		print("  - %s (t=%d): %s" % [entry.event, entry.timestamp, entry.data])

	print("================================\n")


# ============================================================================
# Common Event Definitions (for reference and type safety)
# ============================================================================

## Player Events
const EVENT_PLAYER_SPAWNED = "player_spawned"
const EVENT_PLAYER_DIED = "player_died"
const EVENT_PLAYER_RESPAWNED = "player_respawned"
const EVENT_PLAYER_HEALTH_CHANGED = "player_health_changed"
const EVENT_PLAYER_CORRUPTION_CHANGED = "player_corruption_changed"
const EVENT_PLAYER_SUSTENANCE_CHANGED = "player_sustenance_changed"

## Combat Events
const EVENT_DAMAGE_DEALT = "damage_dealt"
const EVENT_DAMAGE_RECEIVED = "damage_received"
const EVENT_ENEMY_KILLED = "enemy_killed"
const EVENT_ENEMY_SPAWNED = "enemy_spawned"

## Farming Events
const EVENT_CROP_PLANTED = "crop_planted"
const EVENT_CROP_HARVESTED = "crop_harvested"
const EVENT_CROP_WILTED = "crop_wilted"
const EVENT_CROP_PHASE_CHANGED = "crop_phase_changed"

## Crafting Events
const EVENT_ITEM_CRAFTED = "item_crafted"
const EVENT_RECIPE_UNLOCKED = "recipe_unlocked"
const EVENT_CRAFT_FAILED = "craft_failed"

## Building Events
const EVENT_MODULE_BUILT = "module_built"
const EVENT_MODULE_DESTROYED = "module_destroyed"
const EVENT_MODULE_UPGRADED = "module_upgraded"
const EVENT_SANCTUM_HEAT_CHANGED = "sanctum_heat_changed"

## World Events
const EVENT_BIOME_ENTERED = "biome_entered"
const EVENT_BIOME_EXITED = "biome_exited"
const EVENT_DAY_STARTED = "day_started"
const EVENT_NIGHT_STARTED = "night_started"
const EVENT_CORRUPTION_STORM = "corruption_storm"

## Multiplayer Events
const EVENT_PLAYER_JOINED = "player_joined"
const EVENT_PLAYER_LEFT = "player_left"
const EVENT_HOST_CHANGED = "host_changed"
const EVENT_SYNC_REQUEST = "sync_request"

## System Events
const EVENT_GAME_PAUSED = "game_paused"
const EVENT_GAME_RESUMED = "game_resumed"
const EVENT_GAME_SAVED = "game_saved"
const EVENT_GAME_LOADED = "game_loaded"

## UI Events
const EVENT_INVENTORY_OPENED = "inventory_opened"
const EVENT_INVENTORY_CLOSED = "inventory_closed"
const EVENT_BUILD_MODE_TOGGLED = "build_mode_toggled"
const EVENT_MAP_OPENED = "map_opened"
