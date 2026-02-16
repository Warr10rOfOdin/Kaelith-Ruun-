extends Node
## InventorySystem - Manages player and storage inventories
##
## This system handles item storage, stacking, and organization.
## Supports player inventory, storage containers, and shared storage.
##
## Usage:
##   InventorySystem.add_item("iron_ore", 5)
##   InventorySystem.remove_item("iron_ore", 2)
##   InventorySystem.has_item("iron_ore", 3)

class_name InventorySystem

## Inventory types
enum InventoryType {
	PLAYER,
	STORAGE_PUBLIC,
	STORAGE_GUILD,
	STORAGE_HOST
}

## Player inventory
var player_inventory: Dictionary = {}  # item_id -> quantity
var player_inventory_slots: int = 40

## Storage inventories (for Sanctum)
var storage_public: Dictionary = {}
var storage_guild: Dictionary = {}
var storage_host: Dictionary = {}

## Hotbar (quick access slots)
var hotbar: Array = []  # Array of item_ids (size 8)
const HOTBAR_SIZE = 8

## Item stacking
var max_stack_size: int = 99


func _ready() -> void:
	print("[InventorySystem] Initializing inventory system...")

	# Initialize hotbar
	hotbar.resize(HOTBAR_SIZE)
	for i in range(HOTBAR_SIZE):
		hotbar[i] = ""

	# Subscribe to events
	EventBus.subscribe("collect_save_data", _on_collect_save_data)
	EventBus.subscribe(EventBus.EVENT_CROP_HARVESTED, _on_crop_harvested)
	EventBus.subscribe(EventBus.EVENT_ITEM_CRAFTED, _on_item_crafted)

	print("[InventorySystem] System ready")


# ============================================================================
# Add/Remove Items
# ============================================================================

## Add item to player inventory
func add_item(item_id: String, quantity: int = 1, inventory_type: InventoryType = InventoryType.PLAYER) -> bool:
	var inventory = _get_inventory(inventory_type)

	if inventory == null:
		push_warning("[InventorySystem] Invalid inventory type")
		return false

	# Get item data
	var item_data = DataManager.get_item(item_id)
	if item_data.is_empty():
		push_warning("[InventorySystem] Unknown item: %s" % item_id)
		return false

	# Check if item is stackable
	var stack_size = item_data.get("stack_size", max_stack_size)

	# Add to existing stack or create new
	if inventory.has(item_id):
		inventory[item_id] += quantity
	else:
		inventory[item_id] = quantity

	# Emit event
	EventBus.emit_event("item_added", {
		"item_id": item_id,
		"quantity": quantity,
		"inventory_type": inventory_type
	})

	print("[InventorySystem] Added %d x %s" % [quantity, item_id])

	return true


## Remove item from inventory
func remove_item(item_id: String, quantity: int = 1, inventory_type: InventoryType = InventoryType.PLAYER) -> bool:
	var inventory = _get_inventory(inventory_type)

	if inventory == null:
		return false

	if not inventory.has(item_id):
		push_warning("[InventorySystem] Item not in inventory: %s" % item_id)
		return false

	if inventory[item_id] < quantity:
		push_warning("[InventorySystem] Not enough items: %s (have %d, need %d)" % [item_id, inventory[item_id], quantity])
		return false

	inventory[item_id] -= quantity

	# Remove entry if quantity is 0
	if inventory[item_id] <= 0:
		inventory.erase(item_id)

	# Emit event
	EventBus.emit_event("item_removed", {
		"item_id": item_id,
		"quantity": quantity,
		"inventory_type": inventory_type
	})

	print("[InventorySystem] Removed %d x %s" % [quantity, item_id])

	return true


## Transfer item between inventories
func transfer_item(item_id: String, quantity: int, from_inventory: InventoryType, to_inventory: InventoryType) -> bool:
	if not has_item(item_id, quantity, from_inventory):
		return false

	if remove_item(item_id, quantity, from_inventory):
		return add_item(item_id, quantity, to_inventory)

	return false


# ============================================================================
# Queries
# ============================================================================

## Check if inventory has item
func has_item(item_id: String, quantity: int = 1, inventory_type: InventoryType = InventoryType.PLAYER) -> bool:
	var inventory = _get_inventory(inventory_type)

	if inventory == null:
		return false

	return inventory.has(item_id) and inventory[item_id] >= quantity


## Get item count
func get_item_count(item_id: String, inventory_type: InventoryType = InventoryType.PLAYER) -> int:
	var inventory = _get_inventory(inventory_type)

	if inventory == null:
		return 0

	return inventory.get(item_id, 0)


## Get all items in inventory
func get_all_items(inventory_type: InventoryType = InventoryType.PLAYER) -> Dictionary:
	var inventory = _get_inventory(inventory_type)

	if inventory == null:
		return {}

	return inventory.duplicate()


## Get inventory size (unique items)
func get_inventory_size(inventory_type: InventoryType = InventoryType.PLAYER) -> int:
	var inventory = _get_inventory(inventory_type)

	if inventory == null:
		return 0

	return inventory.size()


## Check if inventory has space
func has_space(inventory_type: InventoryType = InventoryType.PLAYER) -> bool:
	# For now, inventories are unlimited (Dictionary-based)
	# Could add slot limits later
	return true


# ============================================================================
# Hotbar Management
# ============================================================================

## Set hotbar slot
func set_hotbar_slot(slot: int, item_id: String) -> void:
	if slot < 0 or slot >= HOTBAR_SIZE:
		push_warning("[InventorySystem] Invalid hotbar slot: %d" % slot)
		return

	hotbar[slot] = item_id

	EventBus.emit_event("hotbar_changed", {
		"slot": slot,
		"item_id": item_id
	})


## Get hotbar slot
func get_hotbar_slot(slot: int) -> String:
	if slot < 0 or slot >= HOTBAR_SIZE:
		return ""

	return hotbar[slot]


## Use hotbar item
func use_hotbar_item(slot: int) -> void:
	var item_id = get_hotbar_slot(slot)

	if item_id == "":
		return

	if not has_item(item_id):
		push_warning("[InventorySystem] Hotbar item not in inventory: %s" % item_id)
		set_hotbar_slot(slot, "")  # Clear invalid slot
		return

	# Emit use event (handled by item-specific systems)
	EventBus.emit_event("hotbar_item_used", {
		"slot": slot,
		"item_id": item_id
	})

	print("[InventorySystem] Used hotbar item %d: %s" % [slot, item_id])


# ============================================================================
# Item Consumption
# ============================================================================

## Consume an item (food, potions, etc.)
func consume_item(item_id: String) -> bool:
	var item_data = DataManager.get_item(item_id)
	if item_data.is_empty():
		return false

	var item_type = item_data.get("type", "")
	if item_type != "consumable":
		push_warning("[InventorySystem] Item is not consumable: %s" % item_id)
		return false

	if not has_item(item_id):
		return false

	# Apply consumable effects
	var effects = item_data.get("effects", {})

	if effects.has("heal"):
		if GameManager.player:
			GameManager.player.heal(effects.heal)

	if effects.has("sustenance"):
		if GameManager.player:
			GameManager.player.add_sustenance(effects.sustenance)

	if effects.has("corruption"):
		if GameManager.player:
			GameManager.player.add_corruption(effects.corruption)

	# Remove item
	remove_item(item_id, 1)

	EventBus.emit_event("item_consumed", {
		"item_id": item_id,
		"effects": effects
	})

	AudioManager.play_sfx("consume_item")

	print("[InventorySystem] Consumed %s" % item_id)

	return true


# ============================================================================
# Helper Functions
# ============================================================================

func _get_inventory(inventory_type: InventoryType) -> Dictionary:
	match inventory_type:
		InventoryType.PLAYER:
			return player_inventory
		InventoryType.STORAGE_PUBLIC:
			return storage_public
		InventoryType.STORAGE_GUILD:
			return storage_guild
		InventoryType.STORAGE_HOST:
			return storage_host
		_:
			return {}


# ============================================================================
# Event Handlers
# ============================================================================

func _on_crop_harvested(data: Dictionary) -> void:
	var harvest = data.get("harvest", {})
	if not harvest.is_empty():
		add_item(harvest.item_id, harvest.quantity)


func _on_item_crafted(data: Dictionary) -> void:
	var item_id = data.get("item_id", "")
	var quantity = data.get("quantity", 1)
	if item_id != "":
		add_item(item_id, quantity)


func _on_collect_save_data(data: Dictionary) -> void:
	data.save_data.inventory = get_save_data()


# ============================================================================
# Save/Load
# ============================================================================

func get_save_data() -> Dictionary:
	return {
		"player_inventory": player_inventory.duplicate(),
		"storage_public": storage_public.duplicate(),
		"storage_guild": storage_guild.duplicate(),
		"storage_host": storage_host.duplicate(),
		"hotbar": hotbar.duplicate()
	}


func load_save_data(data: Dictionary) -> void:
	player_inventory = data.get("player_inventory", {})
	storage_public = data.get("storage_public", {})
	storage_guild = data.get("storage_guild", {})
	storage_host = data.get("storage_host", {})
	hotbar = data.get("hotbar", [])

	# Ensure hotbar is correct size
	hotbar.resize(HOTBAR_SIZE)

	print("[InventorySystem] Loaded inventory (%d items)" % player_inventory.size())


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== InventorySystem Debug Info =====")
	print("Player Inventory Size: %d unique items" % player_inventory.size())
	print("\nPlayer Inventory:")
	for item_id in player_inventory.keys():
		print("  - %s x%d" % [item_id, player_inventory[item_id]])

	print("\nHotbar:")
	for i in range(HOTBAR_SIZE):
		var item = hotbar[i]
		if item != "":
			print("  [%d] %s" % [i + 1, item])
		else:
			print("  [%d] (empty)" % (i + 1))

	print("\nStorage:")
	print("  - Public: %d items" % storage_public.size())
	print("  - Guild: %d items" % storage_guild.size())
	print("  - Host: %d items" % storage_host.size())
	print("=======================================\n")


## Give debug items (for testing)
func debug_give_items() -> void:
	add_item("iron_ore", 20)
	add_item("wood", 50)
	add_item("ember_root", 10)
	add_item("health_potion", 5)
	print("[InventorySystem] DEBUG: Added test items")
