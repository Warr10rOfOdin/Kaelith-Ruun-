extends Node
## SaveManager - Handles local and cloud save/load operations
##
## This autoload manages game persistence, supporting both local saves
## and cloud synchronization for cross-platform play.
##
## Usage:
##   SaveManager.save_game("slot_1")
##   var save_data = SaveManager.load_game("slot_1")
##   SaveManager.sync_to_cloud()

## Save file settings
const SAVE_DIR = "user://saves/"
const SAVE_EXTENSION = ".save"
const MAX_SAVE_SLOTS = 3
const AUTO_SAVE_INTERVAL = 300.0  # 5 minutes

## Cloud sync settings
var cloud_sync_enabled: bool = false
var cloud_sync_url: String = ""  # Set by backend configuration

## Auto-save timer
var auto_save_timer: float = 0.0
var auto_save_enabled: bool = true

## Current save slot
var current_save_slot: String = ""

## Save state
var is_saving: bool = false
var is_loading: bool = false
var last_save_time: int = 0

## Save metadata cache (for quick access to save info without loading full data)
var save_metadata: Dictionary = {}


func _ready() -> void:
	print("[SaveManager] Initializing save manager...")
	_ensure_save_directory()
	_load_save_metadata()
	print("[SaveManager] Save manager ready")


func _process(delta: float) -> void:
	if auto_save_enabled and GameManager.current_state == GameManager.GameState.PLAYING:
		auto_save_timer += delta
		if auto_save_timer >= AUTO_SAVE_INTERVAL:
			auto_save()
			auto_save_timer = 0.0


## Ensure save directory exists
func _ensure_save_directory() -> void:
	if not DirAccess.dir_exists_absolute(SAVE_DIR):
		DirAccess.make_dir_absolute(SAVE_DIR)
		print("[SaveManager] Created save directory: %s" % SAVE_DIR)


## Save the current game state
func save_game(slot_name: String = "") -> bool:
	if is_saving:
		push_warning("[SaveManager] Save already in progress")
		return false

	if slot_name == "":
		slot_name = current_save_slot if current_save_slot != "" else "slot_1"

	print("[SaveManager] Saving game to slot: %s" % slot_name)
	is_saving = true

	var save_data = _collect_save_data()
	var success = _write_save_file(slot_name, save_data)

	if success:
		current_save_slot = slot_name
		last_save_time = Time.get_ticks_msec()
		_update_save_metadata(slot_name, save_data)

		EventBus.emit_event(EventBus.EVENT_GAME_SAVED, {
			"slot": slot_name,
			"timestamp": last_save_time
		})

		print("[SaveManager] Game saved successfully to %s" % slot_name)

		# Trigger cloud sync if enabled
		if cloud_sync_enabled:
			sync_to_cloud(slot_name)
	else:
		push_error("[SaveManager] Failed to save game to %s" % slot_name)

	is_saving = false
	return success


## Load a saved game
func load_game(slot_name: String) -> Dictionary:
	if is_loading:
		push_warning("[SaveManager] Load already in progress")
		return {}

	print("[SaveManager] Loading game from slot: %s" % slot_name)
	is_loading = true

	var save_data = _read_save_file(slot_name)

	if not save_data.is_empty():
		current_save_slot = slot_name

		EventBus.emit_event(EventBus.EVENT_GAME_LOADED, {
			"slot": slot_name,
			"data": save_data
		})

		print("[SaveManager] Game loaded successfully from %s" % slot_name)
	else:
		push_error("[SaveManager] Failed to load game from %s" % slot_name)

	is_loading = false
	return save_data


## Auto-save the game
func auto_save() -> void:
	if current_save_slot == "":
		print("[SaveManager] No save slot selected, skipping auto-save")
		return

	print("[SaveManager] Auto-saving...")
	save_game(current_save_slot)


## Delete a save slot
func delete_save(slot_name: String) -> bool:
	var file_path = _get_save_file_path(slot_name)

	if FileAccess.file_exists(file_path):
		DirAccess.remove_absolute(file_path)
		save_metadata.erase(slot_name)
		_save_metadata_cache()

		print("[SaveManager] Deleted save slot: %s" % slot_name)
		EventBus.emit_event("save_deleted", {"slot": slot_name})
		return true
	else:
		push_warning("[SaveManager] Save slot does not exist: %s" % slot_name)
		return false


## Get list of available save slots
func get_save_slots() -> Array:
	var slots = []

	for slot_name in save_metadata.keys():
		slots.append({
			"slot_name": slot_name,
			"metadata": save_metadata[slot_name]
		})

	# Sort by last modified time (most recent first)
	slots.sort_custom(func(a, b): return a.metadata.timestamp > b.metadata.timestamp)

	return slots


## Check if a save slot exists
func save_slot_exists(slot_name: String) -> bool:
	return FileAccess.file_exists(_get_save_file_path(slot_name))


## Get save metadata for a slot
func get_save_metadata(slot_name: String) -> Dictionary:
	if save_metadata.has(slot_name):
		return save_metadata[slot_name]
	return {}


# ============================================================================
# Save Data Collection
# ============================================================================

## Collect all data that needs to be saved
func _collect_save_data() -> Dictionary:
	var save_data = {}

	# Game manager data
	save_data["game"] = GameManager.get_save_data()

	# Player data
	if GameManager.player:
		save_data["player"] = GameManager.player.get_save_data()

	# World data (if implemented)
	if GameManager.world:
		save_data["world"] = GameManager.world.get_save_data()

	# System-specific data
	# These will be filled in by their respective systems via event
	save_data["farming"] = {}
	save_data["building"] = {}
	save_data["inventory"] = {}

	# Request systems to populate their save data
	EventBus.emit_event("collect_save_data", {"save_data": save_data})

	# Add save metadata
	save_data["_metadata"] = {
		"version": "1.0.0",
		"timestamp": Time.get_unix_time_from_system(),
		"slot": current_save_slot
	}

	return save_data


# ============================================================================
# File I/O
# ============================================================================

## Get the file path for a save slot
func _get_save_file_path(slot_name: String) -> String:
	return SAVE_DIR + slot_name + SAVE_EXTENSION


## Write save data to file
func _write_save_file(slot_name: String, data: Dictionary) -> bool:
	var file_path = _get_save_file_path(slot_name)

	var file = FileAccess.open(file_path, FileAccess.WRITE)
	if not file:
		push_error("[SaveManager] Failed to open file for writing: %s" % file_path)
		return false

	# Convert to JSON
	var json_string = JSON.stringify(data, "\t")
	file.store_string(json_string)
	file.close()

	return true


## Read save data from file
func _read_save_file(slot_name: String) -> Dictionary:
	var file_path = _get_save_file_path(slot_name)

	if not FileAccess.file_exists(file_path):
		push_warning("[SaveManager] Save file does not exist: %s" % file_path)
		return {}

	var file = FileAccess.open(file_path, FileAccess.READ)
	if not file:
		push_error("[SaveManager] Failed to open file for reading: %s" % file_path)
		return {}

	var content = file.get_as_text()
	file.close()

	var json = JSON.new()
	var error = json.parse(content)

	if error != OK:
		push_error("[SaveManager] JSON parse error in %s at line %d: %s" % [
			file_path,
			json.get_error_line(),
			json.get_error_message()
		])
		return {}

	return json.get_data()


# ============================================================================
# Metadata Management
# ============================================================================

## Update metadata cache for a save slot
func _update_save_metadata(slot_name: String, save_data: Dictionary) -> void:
	var metadata = {
		"day": save_data.game.current_day,
		"play_time": save_data.game.total_play_time,
		"timestamp": save_data._metadata.timestamp,
		"version": save_data._metadata.version
	}

	save_metadata[slot_name] = metadata
	_save_metadata_cache()


## Load metadata cache
func _load_save_metadata() -> void:
	# Scan save directory and build metadata cache
	var dir = DirAccess.open(SAVE_DIR)
	if not dir:
		return

	dir.list_dir_begin()
	var file_name = dir.get_next()

	while file_name != "":
		if file_name.ends_with(SAVE_EXTENSION):
			var slot_name = file_name.trim_suffix(SAVE_EXTENSION)
			var save_data = _read_save_file(slot_name)

			if not save_data.is_empty() and save_data.has("_metadata"):
				_update_save_metadata(slot_name, save_data)

		file_name = dir.get_next()

	dir.list_dir_end()

	print("[SaveManager] Loaded metadata for %d save slots" % save_metadata.size())


## Save metadata cache
func _save_metadata_cache() -> void:
	# For now, metadata is rebuilt on load
	# Could be optimized by caching to a separate file
	pass


# ============================================================================
# Cloud Sync
# ============================================================================

## Sync save to cloud
func sync_to_cloud(slot_name: String = "") -> void:
	if not cloud_sync_enabled:
		print("[SaveManager] Cloud sync disabled")
		return

	if slot_name == "":
		slot_name = current_save_slot

	print("[SaveManager] Syncing save '%s' to cloud..." % slot_name)

	var save_data = _read_save_file(slot_name)
	if save_data.is_empty():
		push_error("[SaveManager] Cannot sync empty save data")
		return

	# This would integrate with backend API
	# For now, just emit an event that the backend client can handle
	EventBus.emit_event("cloud_sync_request", {
		"slot": slot_name,
		"data": save_data
	})


## Download save from cloud
func download_from_cloud(slot_name: String) -> void:
	if not cloud_sync_enabled:
		print("[SaveManager] Cloud sync disabled")
		return

	print("[SaveManager] Downloading save '%s' from cloud..." % slot_name)

	# This would integrate with backend API
	EventBus.emit_event("cloud_download_request", {
		"slot": slot_name
	})


## Handle cloud save data received
func _on_cloud_save_received(data: Dictionary) -> void:
	var slot_name = data.get("slot", "")
	var save_data = data.get("data", {})

	if slot_name != "" and not save_data.is_empty():
		_write_save_file(slot_name, save_data)
		_update_save_metadata(slot_name, save_data)
		print("[SaveManager] Cloud save downloaded: %s" % slot_name)


# ============================================================================
# Debug
# ============================================================================

## Print debug info
func print_debug_info() -> void:
	print("\n===== SaveManager Debug Info =====")
	print("Current Slot: %s" % current_save_slot)
	print("Auto-save Enabled: %s" % auto_save_enabled)
	print("Auto-save Timer: %.1f / %.1f" % [auto_save_timer, AUTO_SAVE_INTERVAL])
	print("Cloud Sync Enabled: %s" % cloud_sync_enabled)
	print("Last Save: %d ms ago" % (Time.get_ticks_msec() - last_save_time))
	print("\nAvailable Saves:")
	for slot in get_save_slots():
		print("  - %s (Day %d, %d sec played)" % [
			slot.slot_name,
			slot.metadata.day,
			slot.metadata.play_time
		])
	print("===================================\n")
