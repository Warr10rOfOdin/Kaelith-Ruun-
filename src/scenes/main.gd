extends Node2D
## Main - Main game scene that initializes and connects all systems
##
## This is the entry point for the game. It initializes all systems,
## loads the world, and manages the main game loop.

## System instances
var heat_corruption_system: HeatCorruptionSystem
var farming_system: FarmingSystem
var inventory_system: InventorySystem
var crafting_system: CraftingSystem
var building_system: BuildingSystem
var api_client: APIClient
var monetization_manager: MonetizationManager

## Player instance
var player: Player

## World/Camera
@onready var camera: Camera2D = $Camera2D


func _ready() -> void:
	print("\n========================================")
	print("  KAELITH RUUN: VEIL SANCTUM")
	print("  Loading...")
	print("========================================\n")

	# Initialize systems
	_initialize_systems()

	# Setup world
	_setup_world()

	# Create player
	_spawn_player()

	# Setup camera
	_setup_camera()

	# Start game
	_start_game()

	print("\n========================================")
	print("  Game Ready!")
	print("========================================\n")


## Initialize all game systems
func _initialize_systems() -> void:
	print("[Main] Initializing systems...")

	# Create system instances
	heat_corruption_system = HeatCorruptionSystem.new()
	heat_corruption_system.name = "HeatCorruptionSystem"
	add_child(heat_corruption_system)

	farming_system = FarmingSystem.new()
	farming_system.name = "FarmingSystem"
	add_child(farming_system)

	inventory_system = InventorySystem.new()
	inventory_system.name = "InventorySystem"
	add_child(inventory_system)

	crafting_system = CraftingSystem.new()
	crafting_system.name = "CraftingSystem"
	add_child(crafting_system)

	building_system = BuildingSystem.new()
	building_system.name = "BuildingSystem"
	add_child(building_system)

	api_client = APIClient.new()
	api_client.name = "APIClient"
	add_child(api_client)

	monetization_manager = MonetizationManager.new()
	monetization_manager.name = "MonetizationManager"
	add_child(monetization_manager)

	print("[Main] Systems initialized")


## Setup the game world
func _setup_world() -> void:
	print("[Main] Setting up world...")

	# Place Sanctum core
	building_system.place_sanctum_core(Vector2(0, 0))

	# Add initial heat source (starter ember reactor)
	heat_corruption_system.add_heat_source(Vector2(0, 0), 200.0, 50.0)

	print("[Main] World setup complete")


## Spawn the player
func _spawn_player() -> void:
	print("[Main] Spawning player...")

	# Load player scene (or create instance)
	var player_scene = load("res://src/entities/player/player.tscn")
	if player_scene:
		player = player_scene.instantiate()
	else:
		# Create player manually if scene doesn't exist yet
		player = Player.new()

		# Add sprite placeholder
		var sprite = Sprite2D.new()
		sprite.name = "Sprite2D"
		player.add_child(sprite)

		# Add collision shape
		var collision = CollisionShape2D.new()
		collision.name = "CollisionShape2D"
		var shape = CircleShape2D.new()
		shape.radius = 16.0
		collision.shape = shape
		player.add_child(collision)

	player.global_position = Vector2(0, 100)  # Spawn near sanctum core
	add_child(player)

	print("[Main] Player spawned")


## Setup camera to follow player
func _setup_camera() -> void:
	if not camera:
		camera = Camera2D.new()
		camera.name = "Camera2D"
		add_child(camera)

	camera.enabled = true
	camera.zoom = Vector2(1.5, 1.5)

	# Make camera follow player
	if player:
		camera.reparent(player)
		camera.position = Vector2.ZERO

	print("[Main] Camera setup complete")


## Start the game
func _start_game() -> void:
	print("[Main] Starting game...")

	# Start a new game or load save
	if _has_existing_save():
		_load_game()
	else:
		_new_game()

	# Give player starting items (debug)
	if GameManager.debug_mode:
		inventory_system.debug_give_items()

	print("[Main] Game started!")


## Check if there's an existing save
func _has_existing_save() -> bool:
	return SaveManager.save_slot_exists("slot_1")


## Load existing game
func _load_game() -> void:
	print("[Main] Loading saved game...")

	var save_data = SaveManager.load_game("slot_1")

	if not save_data.is_empty():
		GameManager.load_game(save_data.game)

		if save_data.has("player") and player:
			player.load_save_data(save_data.player)

		if save_data.has("farming"):
			farming_system.load_save_data(save_data.farming)

		if save_data.has("inventory"):
			inventory_system.load_save_data(save_data.inventory)

		if save_data.has("crafting"):
			crafting_system.load_save_data(save_data.crafting)

		if save_data.has("building"):
			building_system.load_save_data(save_data.building)

		print("[Main] Game loaded!")


## Start new game
func _new_game() -> void:
	print("[Main] Starting new game...")

	GameManager.start_new_game()

	# Give player starting resources
	inventory_system.add_item("wood", 50)
	inventory_system.add_item("ember_root", 10)

	# Set starting hotbar
	inventory_system.set_hotbar_slot(0, "iron_sword")
	inventory_system.set_hotbar_slot(1, "health_potion")

	print("[Main] New game started!")


func _process(delta: float) -> void:
	# Debug input
	if Input.is_action_just_pressed("ui_cancel"):
		GameManager.toggle_pause()

	# Debug commands
	if GameManager.debug_mode:
		_handle_debug_input()


func _handle_debug_input() -> void:
	# F1 - Print debug info
	if Input.is_action_just_pressed("ui_home"):
		print_all_debug_info()

	# F2 - Toggle debug overlay
	if Input.is_key_pressed(KEY_F2):
		GameManager.toggle_debug_overlay()

	# F3 - Give items
	if Input.is_key_pressed(KEY_F3):
		inventory_system.debug_give_items()

	# F4 - Instant grow crops
	if Input.is_key_pressed(KEY_F4):
		for crop in farming_system.get_all_crops():
			farming_system.debug_grow_crop(crop.instance_id)

	# F5 - Quick save
	if Input.is_key_pressed(KEY_F5):
		SaveManager.save_game("slot_1")

	# F6 - Quick load
	if Input.is_key_pressed(KEY_F6):
		_load_game()


## Print debug info from all systems
func print_all_debug_info() -> void:
	print("\n" + "="*60)
	print("  DEBUG INFO - ALL SYSTEMS")
	print("="*60 + "\n")

	GameManager.print_debug_info()
	EventBus.print_debug_info()
	DataManager.print_debug_info()
	SaveManager.print_debug_info()
	NetworkManager.print_debug_info()
	AudioManager.print_debug_info()

	if heat_corruption_system:
		heat_corruption_system.print_debug_info()

	if farming_system:
		farming_system.print_debug_info()

	if inventory_system:
		inventory_system.print_debug_info()

	if crafting_system:
		crafting_system.print_debug_info()

	if building_system:
		building_system.print_debug_info()

	if api_client:
		api_client.print_debug_info()

	if monetization_manager:
		monetization_manager.print_debug_info()

	print("="*60 + "\n")
