extends Node
## NetworkManager - Manages multiplayer sessions and host-authoritative networking
##
## This autoload handles 4-player co-op with host-authoritative game state.
## Supports cross-platform play (web <-> mobile).
##
## Usage:
##   NetworkManager.create_host()
##   NetworkManager.join_session("session_code")
##   NetworkManager.send_to_all("player_moved", data)

## Network state enum
enum NetworkState {
	OFFLINE,
	HOSTING,
	CLIENT,
	CONNECTING,
	ERROR
}

## Current network state
var network_state: NetworkState = NetworkState.OFFLINE

## Network configuration
const MAX_PLAYERS = 4
const DEFAULT_PORT = 7777
const SERVER_PORT = 7777

## Session data
var session_code: String = ""
var is_host: bool = false
var connected_players: Dictionary = {}  # peer_id -> player_data

## Host data
var host_peer_id: int = 1

## Network peer
var peer: ENetMultiplayerPeer = null

## Permissions system
var player_permissions: Dictionary = {}  # peer_id -> permissions

## Permission flags
enum Permission {
	BUILDER = 1,
	CRAFTER = 2,
	FARMER = 4,
	STORAGE_ACCESS = 8,
	ADMIN = 16
}

## Sync settings
var sync_rate: float = 0.05  # 20 times per second
var sync_timer: float = 0.0

## Statistics
var packets_sent: int = 0
var packets_received: int = 0
var bytes_sent: int = 0
var bytes_received: int = 0


func _ready() -> void:
	print("[NetworkManager] Initializing network manager...")
	multiplayer.peer_connected.connect(_on_peer_connected)
	multiplayer.peer_disconnected.connect(_on_peer_disconnected)
	multiplayer.connected_to_server.connect(_on_connected_to_server)
	multiplayer.connection_failed.connect(_on_connection_failed)
	multiplayer.server_disconnected.connect(_on_server_disconnected)
	print("[NetworkManager] Network manager ready")


func _process(delta: float) -> void:
	if network_state == NetworkState.HOSTING or network_state == NetworkState.CLIENT:
		sync_timer += delta
		if sync_timer >= sync_rate:
			_sync_game_state()
			sync_timer = 0.0


# ============================================================================
# Host Functions
# ============================================================================

## Create a new host session
func create_host() -> bool:
	print("[NetworkManager] Creating host session...")

	peer = ENetMultiplayerPeer.new()
	var error = peer.create_server(SERVER_PORT, MAX_PLAYERS - 1)

	if error != OK:
		push_error("[NetworkManager] Failed to create server: %d" % error)
		network_state = NetworkState.ERROR
		return false

	multiplayer.multiplayer_peer = peer

	is_host = true
	network_state = NetworkState.HOSTING
	session_code = _generate_session_code()

	# Add host as first player
	connected_players[1] = {
		"peer_id": 1,
		"name": "Host",
		"is_host": true
	}

	# Grant host all permissions
	player_permissions[1] = Permission.BUILDER | Permission.CRAFTER | Permission.FARMER | Permission.STORAGE_ACCESS | Permission.ADMIN

	EventBus.emit_event(EventBus.EVENT_PLAYER_JOINED, {
		"peer_id": 1,
		"is_host": true,
		"session_code": session_code
	})

	print("[NetworkManager] Host created successfully (Code: %s)" % session_code)
	return true


## Close host session
func close_host() -> void:
	if not is_host:
		return

	print("[NetworkManager] Closing host session...")

	# Notify all clients
	rpc("_on_host_closed")

	_disconnect()


# ============================================================================
# Client Functions
# ============================================================================

## Join a session as client
func join_session(code: String, player_name: String = "Player") -> bool:
	print("[NetworkManager] Joining session: %s" % code)

	# In production, this would query the backend for session IP/port
	# For now, we'll use localhost for testing
	var server_ip = "127.0.0.1"

	peer = ENetMultiplayerPeer.new()
	var error = peer.create_client(server_ip, SERVER_PORT)

	if error != OK:
		push_error("[NetworkManager] Failed to connect to server: %d" % error)
		network_state = NetworkState.ERROR
		return false

	multiplayer.multiplayer_peer = peer

	network_state = NetworkState.CONNECTING
	session_code = code

	print("[NetworkManager] Connecting to session...")
	return true


## Leave the current session
func leave_session() -> void:
	print("[NetworkManager] Leaving session...")
	_disconnect()


# ============================================================================
# Permissions
# ============================================================================

## Check if a player has a specific permission
func has_permission(peer_id: int, permission: Permission) -> bool:
	if not player_permissions.has(peer_id):
		return false
	return (player_permissions[peer_id] & permission) != 0


## Grant permission to a player
func grant_permission(peer_id: int, permission: Permission) -> void:
	if not is_host:
		push_warning("[NetworkManager] Only host can grant permissions")
		return

	if not player_permissions.has(peer_id):
		player_permissions[peer_id] = 0

	player_permissions[peer_id] |= permission

	rpc("_sync_permissions", peer_id, player_permissions[peer_id])

	print("[NetworkManager] Granted permission %d to peer %d" % [permission, peer_id])


## Revoke permission from a player
func revoke_permission(peer_id: int, permission: Permission) -> void:
	if not is_host:
		push_warning("[NetworkManager] Only host can revoke permissions")
		return

	if not player_permissions.has(peer_id):
		return

	player_permissions[peer_id] &= ~permission

	rpc("_sync_permissions", peer_id, player_permissions[peer_id])

	print("[NetworkManager] Revoked permission %d from peer %d" % [permission, peer_id])


# ============================================================================
# Data Synchronization
# ============================================================================

## Sync game state (host-authoritative)
func _sync_game_state() -> void:
	if not is_host:
		return

	# Collect world state
	var sync_data = {
		"time": GameManager.current_time,
		"day": GameManager.current_day,
		"is_night": GameManager.is_night
	}

	# Send to all clients
	rpc("_receive_game_state_sync", sync_data)


## Send data to all players
func send_to_all(event: String, data: Dictionary) -> void:
	if network_state == NetworkState.OFFLINE:
		return

	rpc("_receive_network_event", event, data)
	packets_sent += 1


## Send data to specific player
func send_to_player(peer_id: int, event: String, data: Dictionary) -> void:
	if network_state == NetworkState.OFFLINE:
		return

	rpc_id(peer_id, "_receive_network_event", event, data)
	packets_sent += 1


## Send data to host only
func send_to_host(event: String, data: Dictionary) -> void:
	if network_state == NetworkState.OFFLINE or is_host:
		return

	rpc_id(1, "_receive_network_event", event, data)
	packets_sent += 1


# ============================================================================
# RPC Functions
# ============================================================================

## Receive game state sync (clients only)
@rpc("authority", "call_remote", "reliable")
func _receive_game_state_sync(sync_data: Dictionary) -> void:
	if is_host:
		return

	# Apply synced state
	GameManager.current_time = sync_data.time
	GameManager.current_day = sync_data.day
	GameManager.is_night = sync_data.is_night


## Receive network event
@rpc("any_peer", "call_remote", "reliable")
func _receive_network_event(event: String, data: Dictionary) -> void:
	packets_received += 1

	# Emit as local event
	EventBus.emit_event("network_" + event, data)


## Sync permissions to clients
@rpc("authority", "call_remote", "reliable")
func _sync_permissions(peer_id: int, permissions: int) -> void:
	player_permissions[peer_id] = permissions


## Host closed notification
@rpc("authority", "call_remote", "reliable")
func _on_host_closed() -> void:
	print("[NetworkManager] Host closed the session")
	_disconnect()
	EventBus.emit_event("host_closed_session", {})


# ============================================================================
# Connection Callbacks
# ============================================================================

func _on_peer_connected(peer_id: int) -> void:
	print("[NetworkManager] Peer connected: %d" % peer_id)

	if is_host:
		# Host handles new player
		connected_players[peer_id] = {
			"peer_id": peer_id,
			"name": "Player_%d" % peer_id,
			"is_host": false
		}

		# Grant default permissions
		player_permissions[peer_id] = Permission.BUILDER | Permission.CRAFTER | Permission.FARMER

		# Notify all players
		rpc("_sync_player_list", connected_players)

		EventBus.emit_event(EventBus.EVENT_PLAYER_JOINED, {
			"peer_id": peer_id,
			"player_count": connected_players.size()
		})


func _on_peer_disconnected(peer_id: int) -> void:
	print("[NetworkManager] Peer disconnected: %d" % peer_id)

	if is_host and connected_players.has(peer_id):
		var player_name = connected_players[peer_id].name
		connected_players.erase(peer_id)
		player_permissions.erase(peer_id)

		# Notify remaining players
		rpc("_sync_player_list", connected_players)

		EventBus.emit_event(EventBus.EVENT_PLAYER_LEFT, {
			"peer_id": peer_id,
			"name": player_name,
			"player_count": connected_players.size()
		})


func _on_connected_to_server() -> void:
	print("[NetworkManager] Connected to server successfully")
	network_state = NetworkState.CLIENT

	EventBus.emit_event("connected_to_session", {
		"session_code": session_code
	})


func _on_connection_failed() -> void:
	push_error("[NetworkManager] Connection to server failed")
	network_state = NetworkState.ERROR
	_disconnect()

	EventBus.emit_event("connection_failed", {})


func _on_server_disconnected() -> void:
	print("[NetworkManager] Disconnected from server")
	_disconnect()

	EventBus.emit_event("server_disconnected", {})


# ============================================================================
# Helper Functions
# ============================================================================

## Sync player list to clients
@rpc("authority", "call_remote", "reliable")
func _sync_player_list(players: Dictionary) -> void:
	connected_players = players


## Disconnect from network
func _disconnect() -> void:
	if peer:
		peer.close()
		peer = null

	multiplayer.multiplayer_peer = null

	network_state = NetworkState.OFFLINE
	is_host = false
	session_code = ""
	connected_players.clear()
	player_permissions.clear()

	print("[NetworkManager] Disconnected")


## Generate a random session code
func _generate_session_code() -> String:
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	var code = ""
	for i in range(6):
		code += chars[randi() % chars.length()]
	return code


## Get local peer ID
func get_local_peer_id() -> int:
	return multiplayer.get_unique_id()


## Check if we are the host
func is_host_player() -> bool:
	return is_host


## Get player count
func get_player_count() -> int:
	return connected_players.size()


## Get player data
func get_player_data(peer_id: int) -> Dictionary:
	if connected_players.has(peer_id):
		return connected_players[peer_id]
	return {}


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== NetworkManager Debug Info =====")
	print("State: %s" % NetworkState.keys()[network_state])
	print("Is Host: %s" % is_host)
	print("Session Code: %s" % session_code)
	print("Player Count: %d / %d" % [connected_players.size(), MAX_PLAYERS])
	print("\nConnected Players:")
	for peer_id in connected_players.keys():
		var player = connected_players[peer_id]
		var perms = player_permissions.get(peer_id, 0)
		print("  - [%d] %s (Permissions: %d)" % [peer_id, player.name, perms])
	print("\nStatistics:")
	print("  Packets Sent: %d" % packets_sent)
	print("  Packets Received: %d" % packets_received)
	print("=====================================\n")
