extends Node
## AudioManager - Centralized audio playback and music management
##
## This autoload handles all game audio including music, sound effects,
## and environmental audio with volume controls and spatial audio support.
##
## Usage:
##   AudioManager.play_sfx("sword_slash")
##   AudioManager.play_music("night_theme")
##   AudioManager.set_master_volume(0.8)

## Audio bus names
const BUS_MASTER = "Master"
const BUS_MUSIC = "Music"
const BUS_SFX = "SFX"
const BUS_AMBIENT = "Ambient"

## Audio paths
const MUSIC_PATH = "res://assets/audio/music/"
const SFX_PATH = "res://assets/audio/sfx/"
const AMBIENT_PATH = "res://assets/audio/ambient/"

## Volume settings (0.0 to 1.0)
var master_volume: float = 0.8
var music_volume: float = 0.7
var sfx_volume: float = 0.9
var ambient_volume: float = 0.5

## Current music track
var current_music: String = ""
var music_player: AudioStreamPlayer = null
var next_music: String = ""
var music_crossfade_time: float = 2.0

## SFX player pool
var sfx_players: Array[AudioStreamPlayer] = []
const SFX_POOL_SIZE = 16
var sfx_player_index: int = 0

## Ambient player
var ambient_player: AudioStreamPlayer = null

## Audio cache
var loaded_music: Dictionary = {}
var loaded_sfx: Dictionary = {}
var loaded_ambient: Dictionary = {}

## Music state
var music_paused: bool = false


func _ready() -> void:
	print("[AudioManager] Initializing audio manager...")

	_setup_audio_buses()
	_create_audio_players()
	_apply_volume_settings()

	# Subscribe to game events
	EventBus.subscribe(EventBus.EVENT_GAME_PAUSED, _on_game_paused)
	EventBus.subscribe(EventBus.EVENT_GAME_RESUMED, _on_game_resumed)
	EventBus.subscribe(EventBus.EVENT_NIGHT_STARTED, _on_night_started)
	EventBus.subscribe(EventBus.EVENT_DAY_STARTED, _on_day_started)
	EventBus.subscribe(EventBus.EVENT_BIOME_ENTERED, _on_biome_entered)

	print("[AudioManager] Audio manager ready")


# ============================================================================
# Setup
# ============================================================================

func _setup_audio_buses() -> void:
	# Get bus indices
	var master_idx = AudioServer.get_bus_index(BUS_MASTER)

	# Note: In production, set up buses in Project Settings > Audio
	# This is just for reference
	pass


func _create_audio_players() -> void:
	# Create music player
	music_player = AudioStreamPlayer.new()
	music_player.bus = BUS_MUSIC
	add_child(music_player)

	# Create SFX player pool
	for i in range(SFX_POOL_SIZE):
		var player = AudioStreamPlayer.new()
		player.bus = BUS_SFX
		add_child(player)
		sfx_players.append(player)

	# Create ambient player
	ambient_player = AudioStreamPlayer.new()
	ambient_player.bus = BUS_AMBIENT
	add_child(ambient_player)

	print("[AudioManager] Created %d audio players" % (2 + SFX_POOL_SIZE))


# ============================================================================
# Music Control
# ============================================================================

## Play a music track
func play_music(track_name: String, fade_in: bool = true) -> void:
	if current_music == track_name and music_player.playing:
		return

	print("[AudioManager] Playing music: %s" % track_name)

	var stream = _load_music(track_name)
	if not stream:
		push_warning("[AudioManager] Music track not found: %s" % track_name)
		return

	if fade_in and music_player.playing:
		# Crossfade
		next_music = track_name
		_crossfade_music(stream)
	else:
		# Direct play
		music_player.stream = stream
		music_player.play()
		current_music = track_name


## Stop music
func stop_music(fade_out: bool = true) -> void:
	if not music_player.playing:
		return

	if fade_out:
		var tween = create_tween()
		tween.tween_property(music_player, "volume_db", -80, music_crossfade_time)
		tween.tween_callback(music_player.stop)
		tween.tween_callback(func(): music_player.volume_db = 0)
	else:
		music_player.stop()

	current_music = ""


## Pause music
func pause_music() -> void:
	music_player.stream_paused = true
	music_paused = true


## Resume music
func resume_music() -> void:
	music_player.stream_paused = false
	music_paused = false


## Crossfade between music tracks
func _crossfade_music(new_stream: AudioStream) -> void:
	var tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(music_player, "volume_db", -80, music_crossfade_time)

	tween.chain()
	tween.tween_callback(func():
		music_player.stream = new_stream
		music_player.play()
		current_music = next_music
	)
	tween.tween_property(music_player, "volume_db", 0, music_crossfade_time)


# ============================================================================
# Sound Effects
# ============================================================================

## Play a sound effect
func play_sfx(sfx_name: String, volume_db: float = 0.0, pitch_scale: float = 1.0) -> void:
	var stream = _load_sfx(sfx_name)
	if not stream:
		push_warning("[AudioManager] SFX not found: %s" % sfx_name)
		return

	# Get next available player from pool
	var player = sfx_players[sfx_player_index]
	sfx_player_index = (sfx_player_index + 1) % SFX_POOL_SIZE

	# Stop if currently playing (reuse)
	if player.playing:
		player.stop()

	player.stream = stream
	player.volume_db = volume_db
	player.pitch_scale = pitch_scale
	player.play()


## Play a randomized sound effect (for variation)
func play_sfx_random(sfx_names: Array, volume_db: float = 0.0) -> void:
	if sfx_names.is_empty():
		return

	var random_sfx = sfx_names[randi() % sfx_names.size()]
	var random_pitch = randf_range(0.9, 1.1)
	play_sfx(random_sfx, volume_db, random_pitch)


## Play positional sound effect (for 2D spatial audio)
func play_sfx_2d(sfx_name: String, position: Vector2, volume_db: float = 0.0) -> void:
	# This would create a temporary AudioStreamPlayer2D at the position
	# For now, just play regular SFX
	play_sfx(sfx_name, volume_db)


# ============================================================================
# Ambient Audio
# ============================================================================

## Play ambient audio loop
func play_ambient(ambient_name: String, fade_in: bool = true) -> void:
	var stream = _load_ambient(ambient_name)
	if not stream:
		push_warning("[AudioManager] Ambient audio not found: %s" % ambient_name)
		return

	ambient_player.stream = stream

	if fade_in:
		ambient_player.volume_db = -80
		ambient_player.play()
		var tween = create_tween()
		tween.tween_property(ambient_player, "volume_db", 0, 2.0)
	else:
		ambient_player.volume_db = 0
		ambient_player.play()


## Stop ambient audio
func stop_ambient(fade_out: bool = true) -> void:
	if not ambient_player.playing:
		return

	if fade_out:
		var tween = create_tween()
		tween.tween_property(ambient_player, "volume_db", -80, 2.0)
		tween.tween_callback(ambient_player.stop)
		tween.tween_callback(func(): ambient_player.volume_db = 0)
	else:
		ambient_player.stop()


# ============================================================================
# Volume Control
# ============================================================================

## Set master volume
func set_master_volume(volume: float) -> void:
	master_volume = clamp(volume, 0.0, 1.0)
	_apply_bus_volume(BUS_MASTER, master_volume)


## Set music volume
func set_music_volume(volume: float) -> void:
	music_volume = clamp(volume, 0.0, 1.0)
	_apply_bus_volume(BUS_MUSIC, music_volume)


## Set SFX volume
func set_sfx_volume(volume: float) -> void:
	sfx_volume = clamp(volume, 0.0, 1.0)
	_apply_bus_volume(BUS_SFX, sfx_volume)


## Set ambient volume
func set_ambient_volume(volume: float) -> void:
	ambient_volume = clamp(volume, 0.0, 1.0)
	_apply_bus_volume(BUS_AMBIENT, ambient_volume)


## Apply volume settings to audio buses
func _apply_volume_settings() -> void:
	_apply_bus_volume(BUS_MASTER, master_volume)
	_apply_bus_volume(BUS_MUSIC, music_volume)
	_apply_bus_volume(BUS_SFX, sfx_volume)
	_apply_bus_volume(BUS_AMBIENT, ambient_volume)


## Apply volume to a specific bus
func _apply_bus_volume(bus_name: String, volume: float) -> void:
	var bus_idx = AudioServer.get_bus_index(bus_name)
	if bus_idx == -1:
		return

	# Convert 0-1 volume to decibels
	if volume == 0.0:
		AudioServer.set_bus_mute(bus_idx, true)
	else:
		AudioServer.set_bus_mute(bus_idx, false)
		var db = linear_to_db(volume)
		AudioServer.set_bus_volume_db(bus_idx, db)


# ============================================================================
# Audio Loading
# ============================================================================

## Load a music track
func _load_music(track_name: String) -> AudioStream:
	if loaded_music.has(track_name):
		return loaded_music[track_name]

	var path = MUSIC_PATH + track_name + ".ogg"
	if not ResourceLoader.exists(path):
		return null

	var stream = load(path)
	loaded_music[track_name] = stream
	return stream


## Load a sound effect
func _load_sfx(sfx_name: String) -> AudioStream:
	if loaded_sfx.has(sfx_name):
		return loaded_sfx[sfx_name]

	var path = SFX_PATH + sfx_name + ".ogg"
	if not ResourceLoader.exists(path):
		return null

	var stream = load(path)
	loaded_sfx[sfx_name] = stream
	return stream


## Load ambient audio
func _load_ambient(ambient_name: String) -> AudioStream:
	if loaded_ambient.has(ambient_name):
		return loaded_ambient[ambient_name]

	var path = AMBIENT_PATH + ambient_name + ".ogg"
	if not ResourceLoader.exists(path):
		return null

	var stream = load(path)
	loaded_ambient[ambient_name] = stream
	return stream


# ============================================================================
# Event Handlers
# ============================================================================

func _on_game_paused(data: Dictionary) -> void:
	pause_music()


func _on_game_resumed(data: Dictionary) -> void:
	resume_music()


func _on_night_started(data: Dictionary) -> void:
	# Switch to night music
	play_music("night_ambient")


func _on_day_started(data: Dictionary) -> void:
	# Switch to day music
	play_music("day_ambient")


func _on_biome_entered(data: Dictionary) -> void:
	var biome_id = data.get("biome_id", "")

	# Play biome-specific music
	match biome_id:
		"ember_fields":
			play_music("ember_fields_theme")
		"ashwood_forest":
			play_music("ashwood_theme")
		"veil_caverns":
			play_music("caverns_theme")
		"molten_ridge":
			play_music("molten_ridge_theme")


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== AudioManager Debug Info =====")
	print("Current Music: %s" % current_music)
	print("Music Playing: %s" % music_player.playing)
	print("Music Paused: %s" % music_paused)
	print("\nVolumes:")
	print("  Master: %.2f" % master_volume)
	print("  Music: %.2f" % music_volume)
	print("  SFX: %.2f" % sfx_volume)
	print("  Ambient: %.2f" % ambient_volume)
	print("\nCached Audio:")
	print("  Music Tracks: %d" % loaded_music.size())
	print("  SFX: %d" % loaded_sfx.size())
	print("  Ambient: %d" % loaded_ambient.size())
	print("=====================================\n")
