extends Node
## APIClient - Backend API integration for auth, purchases, and cloud saves
##
## This handles all communication with the backend server for:
## - User authentication
## - Purchase verification
## - Cloud save sync
## - Veil Shard balance
##
## Usage:
##   APIClient.login(email, password)
##   APIClient.verify_purchase(purchase_token)
##   APIClient.sync_save(save_data)

class_name APIClient

## API Configuration (would be loaded from config in production)
var api_base_url: String = "https://api.kaelithruun.com/v1"
var api_key: String = ""  # Set during initialization

## Authentication
var is_authenticated: bool = false
var auth_token: String = ""
var user_id: String = ""
var username: String = ""

## User data
var veil_shard_balance: int = 0
var supporter_pack_owned: bool = false
var last_ad_timestamp: int = 0

## HTTP client
var http_client: HTTPRequest = null

## Request queue
var pending_requests: Array = []


func _ready() -> void:
	print("[APIClient] Initializing API client...")

	# Create HTTP client
	http_client = HTTPRequest.new()
	add_child(http_client)
	http_client.request_completed.connect(_on_request_completed)

	# Load API configuration
	_load_api_config()

	# Try to restore session
	_restore_session()

	print("[APIClient] API client ready")


# ============================================================================
# Configuration
# ============================================================================

func _load_api_config() -> void:
	# In production, load from secure config file
	# For now, use placeholders
	api_base_url = "https://api.kaelithruun.com/v1"
	api_key = "demo_api_key"


# ============================================================================
# Authentication
# ============================================================================

## Login with email and password
func login(email: String, password: String) -> void:
	print("[APIClient] Logging in as %s..." % email)

	var endpoint = "/auth/login"
	var body = {
		"email": email,
		"password": password,
		"device_id": OS.get_unique_id()
	}

	_make_request(endpoint, HTTPClient.METHOD_POST, body, "login")


## Register new account
func register(email: String, password: String, username: String) -> void:
	print("[APIClient] Registering new account...")

	var endpoint = "/auth/register"
	var body = {
		"email": email,
		"password": password,
		"username": username,
		"device_id": OS.get_unique_id()
	}

	_make_request(endpoint, HTTPClient.METHOD_POST, body, "register")


## Logout
func logout() -> void:
	print("[APIClient] Logging out...")

	is_authenticated = false
	auth_token = ""
	user_id = ""
	username = ""
	veil_shard_balance = 0

	# Clear saved session
	_clear_session()

	EventBus.emit_event("user_logged_out", {})


## Restore session from saved credentials
func _restore_session() -> void:
	# Check for saved auth token
	var saved_token = _load_saved_token()
	if saved_token != "":
		auth_token = saved_token
		verify_session()


## Verify current session
func verify_session() -> void:
	var endpoint = "/auth/verify"
	_make_request(endpoint, HTTPClient.METHOD_GET, {}, "verify_session")


# ============================================================================
# Purchases
# ============================================================================

## Verify a purchase
func verify_purchase(purchase_token: String, product_id: String) -> void:
	print("[APIClient] Verifying purchase: %s" % product_id)

	var endpoint = "/purchases/verify"
	var body = {
		"purchase_token": purchase_token,
		"product_id": product_id,
		"platform": OS.get_name()
	}

	_make_request(endpoint, HTTPClient.METHOD_POST, body, "verify_purchase")


## Get Veil Shard balance
func get_shard_balance() -> void:
	var endpoint = "/economy/balance"
	_make_request(endpoint, HTTPClient.METHOD_GET, {}, "get_balance")


## Purchase item with Veil Shards
func purchase_with_shards(item_id: String, cost: int) -> void:
	print("[APIClient] Purchasing %s for %d shards..." % [item_id, cost])

	var endpoint = "/economy/purchase"
	var body = {
		"item_id": item_id,
		"cost": cost
	}

	_make_request(endpoint, HTTPClient.METHOD_POST, body, "purchase_item")


# ============================================================================
# Cloud Saves
# ============================================================================

## Upload save to cloud
func upload_save(save_data: Dictionary) -> void:
	print("[APIClient] Uploading save to cloud...")

	var endpoint = "/saves/upload"
	var body = {
		"save_data": save_data,
		"timestamp": Time.get_unix_time_from_system()
	}

	_make_request(endpoint, HTTPClient.METHOD_POST, body, "upload_save")


## Download save from cloud
func download_save() -> void:
	print("[APIClient] Downloading save from cloud...")

	var endpoint = "/saves/download"
	_make_request(endpoint, HTTPClient.METHOD_GET, {}, "download_save")


## List all cloud saves
func list_saves() -> void:
	var endpoint = "/saves/list"
	_make_request(endpoint, HTTPClient.METHOD_GET, {}, "list_saves")


# ============================================================================
# Ad Tracking
# ============================================================================

## Log ad impression (for analytics)
func log_ad_impression(ad_type: String, rewarded: bool) -> void:
	var endpoint = "/analytics/ad_impression"
	var body = {
		"ad_type": ad_type,
		"rewarded": rewarded,
		"timestamp": Time.get_unix_time_from_system()
	}

	# Non-blocking analytics request
	_make_request(endpoint, HTTPClient.METHOD_POST, body, "log_ad", false)


## Check if forced ad is required
func should_show_forced_ad() -> bool:
	var current_time = Time.get_unix_time_from_system()
	var time_since_last_ad = current_time - last_ad_timestamp

	# Minimum 15 minutes between forced ads
	return time_since_last_ad >= 900


## Mark ad as shown
func mark_ad_shown() -> void:
	last_ad_timestamp = Time.get_unix_time_from_system()


# ============================================================================
# HTTP Request Handling
# ============================================================================

func _make_request(endpoint: String, method: int, body: Dictionary, request_type: String, wait_for_response: bool = true) -> void:
	var url = api_base_url + endpoint

	var headers = [
		"Content-Type: application/json",
		"X-API-Key: " + api_key
	]

	if auth_token != "":
		headers.append("Authorization: Bearer " + auth_token)

	var body_json = JSON.stringify(body) if not body.is_empty() else ""

	# Store request context
	pending_requests.append({
		"type": request_type,
		"timestamp": Time.get_ticks_msec()
	})

	var error = http_client.request(url, headers, method, body_json)

	if error != OK:
		push_error("[APIClient] HTTP request failed: %d" % error)
		_handle_request_error(request_type, error)


func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	if pending_requests.is_empty():
		return

	var request_info = pending_requests.pop_front()
	var request_type = request_info.type

	print("[APIClient] Request completed: %s (code: %d)" % [request_type, response_code])

	if response_code != 200:
		push_warning("[APIClient] Request failed with code: %d" % response_code)
		_handle_request_error(request_type, response_code)
		return

	# Parse response
	var response_text = body.get_string_from_utf8()
	var json = JSON.new()
	var error = json.parse(response_text)

	if error != OK:
		push_error("[APIClient] JSON parse error: %s" % json.get_error_message())
		return

	var response_data = json.get_data()

	# Handle response based on type
	_handle_response(request_type, response_data)


func _handle_response(request_type: String, data: Dictionary) -> void:
	match request_type:
		"login", "register":
			_handle_auth_response(data)

		"verify_session":
			_handle_verify_response(data)

		"verify_purchase":
			_handle_purchase_response(data)

		"get_balance":
			_handle_balance_response(data)

		"upload_save":
			_handle_upload_save_response(data)

		"download_save":
			_handle_download_save_response(data)

		_:
			print("[APIClient] Unhandled response type: %s" % request_type)


func _handle_request_error(request_type: String, error_code: int) -> void:
	EventBus.emit_event("api_request_failed", {
		"type": request_type,
		"error": error_code
	})


# ============================================================================
# Response Handlers
# ============================================================================

func _handle_auth_response(data: Dictionary) -> void:
	if data.get("success", false):
		is_authenticated = true
		auth_token = data.get("token", "")
		user_id = data.get("user_id", "")
		username = data.get("username", "")
		veil_shard_balance = data.get("veil_shards", 0)
		supporter_pack_owned = data.get("supporter_pack", false)

		_save_session()

		EventBus.emit_event("user_logged_in", {
			"username": username,
			"user_id": user_id
		})

		print("[APIClient] Logged in successfully as %s" % username)
	else:
		var error_message = data.get("message", "Unknown error")
		push_warning("[APIClient] Login failed: %s" % error_message)

		EventBus.emit_event("login_failed", {
			"message": error_message
		})


func _handle_verify_response(data: Dictionary) -> void:
	if data.get("valid", false):
		is_authenticated = true
		print("[APIClient] Session verified")
	else:
		logout()


func _handle_purchase_response(data: Dictionary) -> void:
	if data.get("verified", false):
		veil_shard_balance = data.get("new_balance", veil_shard_balance)

		EventBus.emit_event("purchase_verified", {
			"product_id": data.get("product_id", ""),
			"new_balance": veil_shard_balance
		})

		print("[APIClient] Purchase verified! New balance: %d shards" % veil_shard_balance)


func _handle_balance_response(data: Dictionary) -> void:
	veil_shard_balance = data.get("balance", 0)

	EventBus.emit_event("shard_balance_updated", {
		"balance": veil_shard_balance
	})


func _handle_upload_save_response(data: Dictionary) -> void:
	if data.get("success", false):
		print("[APIClient] Save uploaded successfully")
		EventBus.emit_event("cloud_save_uploaded", {})


func _handle_download_save_response(data: Dictionary) -> void:
	if data.has("save_data"):
		EventBus.emit_event("cloud_save_downloaded", {
			"save_data": data.save_data
		})

		print("[APIClient] Save downloaded from cloud")


# ============================================================================
# Session Persistence
# ============================================================================

func _save_session() -> void:
	var session_data = {
		"auth_token": auth_token,
		"user_id": user_id,
		"username": username
	}

	var file = FileAccess.open("user://session.dat", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(session_data))
		file.close()


func _load_saved_token() -> String:
	if not FileAccess.file_exists("user://session.dat"):
		return ""

	var file = FileAccess.open("user://session.dat", FileAccess.READ)
	if not file:
		return ""

	var content = file.get_as_text()
	file.close()

	var json = JSON.new()
	if json.parse(content) != OK:
		return ""

	var session_data = json.get_data()
	return session_data.get("auth_token", "")


func _clear_session() -> void:
	if FileAccess.file_exists("user://session.dat"):
		DirAccess.remove_absolute("user://session.dat")


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== APIClient Debug Info =====")
	print("Authenticated: %s" % is_authenticated)
	print("Username: %s" % username)
	print("User ID: %s" % user_id)
	print("Veil Shards: %d" % veil_shard_balance)
	print("Supporter Pack: %s" % supporter_pack_owned)
	print("Pending Requests: %d" % pending_requests.size())
	print("=================================\n")
