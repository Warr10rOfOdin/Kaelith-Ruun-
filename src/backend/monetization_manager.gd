extends Node
## MonetizationManager - Handles ads and in-app purchases (IAP)
##
## This manages ethical monetization including:
## - Event-based forced ads
## - Optional rewarded ads
## - Veil Shard purchases
## - Supporter Pack
##
## Usage:
##   MonetizationManager.show_forced_ad("death")
##   MonetizationManager.show_rewarded_ad("harvest_boost")
##   MonetizationManager.purchase_veil_shards(100)

class_name MonetizationManager

## Ad types
enum AdType {
	FORCED,    # Event-triggered (death, dungeon complete, etc.)
	REWARDED   # Optional player-initiated
}

## Ad providers (would integrate with actual SDKs)
var ad_provider: String = "demo"  # In production: "admob", "unity_ads", etc.

## Ad timing
var last_forced_ad_time: int = 0
const MIN_AD_SPACING_SECONDS = 900  # 15 minutes

## Rewarded ad limits
var rewarded_ads_today: int = 0
const MAX_REWARDED_ADS_PER_DAY = 10

## IAP products
var iap_products: Dictionary = {
	"veil_shards_small": {
		"id": "com.kaelithruun.shards.100",
		"name": "100 Veil Shards",
		"price": "$0.99",
		"shards": 100
	},
	"veil_shards_medium": {
		"id": "com.kaelithruun.shards.500",
		"name": "500 Veil Shards",
		"price": "$4.99",
		"shards": 500
	},
	"veil_shards_large": {
		"id": "com.kaelithruun.shards.1200",
		"name": "1200 Veil Shards",
		"price": "$9.99",
		"shards": 1200
	},
	"supporter_pack": {
		"id": "com.kaelithruun.supporter",
		"name": "Supporter Pack",
		"price": "$4.99",
		"type": "one_time",
		"benefits": ["removes_forced_ads", "cosmetic_badge", "unique_flame_color"]
	}
}

## Purchase state
var supporter_pack_owned: bool = false
var pending_purchases: Array = []

## API client reference
var api_client: APIClient = null


func _ready() -> void:
	print("[MonetizationManager] Initializing monetization...")

	# Get API client
	api_client = get_node_or_null("/root/APIClient")

	# Subscribe to ad trigger events
	EventBus.subscribe("ad_trigger_death", _on_ad_trigger_death)
	EventBus.subscribe("ad_trigger_sleep", _on_ad_trigger_sleep)
	EventBus.subscribe("ad_trigger_dungeon_complete", _on_ad_trigger_dungeon)
	EventBus.subscribe("ad_trigger_fast_travel", _on_ad_trigger_fast_travel)

	# Initialize ad SDK (mock for now)
	_init_ad_sdk()

	# Initialize IAP SDK (mock for now)
	_init_iap_sdk()

	print("[MonetizationManager] Monetization ready")


# ============================================================================
# Ad SDK Integration (Mock)
# ============================================================================

func _init_ad_sdk() -> void:
	# In production, initialize actual ad SDK:
	# - Google AdMob
	# - Unity Ads
	# - AppLovin, etc.

	print("[MonetizationManager] Ad SDK initialized (mock)")


func _init_iap_sdk() -> void:
	# In production, initialize store SDK:
	# - Google Play Billing
	# - Apple StoreKit
	# - Godot IAP plugin

	print("[MonetizationManager] IAP SDK initialized (mock)")


# ============================================================================
# Forced Ads (Event-Based)
# ============================================================================

## Show forced ad (respects supporter pack and timing)
func show_forced_ad(trigger_type: String) -> void:
	# Check if supporter pack removes ads
	if supporter_pack_owned:
		print("[MonetizationManager] Forced ad skipped (Supporter Pack)")
		return

	# Check timing constraint
	if not _can_show_forced_ad():
		print("[MonetizationManager] Forced ad skipped (too soon)")
		return

	print("[MonetizationManager] Showing forced ad (trigger: %s)" % trigger_type)

	# Show ad (mock)
	_display_ad(AdType.FORCED, trigger_type)

	# Update timestamp
	last_forced_ad_time = Time.get_unix_time_from_system()

	# Log to analytics
	if api_client:
		api_client.log_ad_impression(trigger_type, false)


func _can_show_forced_ad() -> bool:
	var current_time = Time.get_unix_time_from_system()
	var time_since_last = current_time - last_forced_ad_time

	return time_since_last >= MIN_AD_SPACING_SECONDS


# ============================================================================
# Rewarded Ads (Optional)
# ============================================================================

## Show rewarded ad with specific reward
func show_rewarded_ad(reward_type: String) -> void:
	# Check daily limit
	if rewarded_ads_today >= MAX_REWARDED_ADS_PER_DAY:
		print("[MonetizationManager] Daily rewarded ad limit reached")
		EventBus.emit_event("rewarded_ad_limit_reached", {})
		return

	print("[MonetizationManager] Showing rewarded ad (reward: %s)" % reward_type)

	# Show ad (mock)
	_display_ad(AdType.REWARDED, reward_type)

	rewarded_ads_today += 1

	# Log to analytics
	if api_client:
		api_client.log_ad_impression(reward_type, true)


## Check if rewarded ad is available
func can_show_rewarded_ad() -> bool:
	return rewarded_ads_today < MAX_REWARDED_ADS_PER_DAY


## Get remaining rewarded ads for today
func get_remaining_rewarded_ads() -> int:
	return MAX_REWARDED_ADS_PER_DAY - rewarded_ads_today


# ============================================================================
# Ad Display (Mock)
# ============================================================================

func _display_ad(ad_type: AdType, context: String) -> void:
	# In production, this would call the actual ad SDK
	# For now, simulate ad display with a delay

	print("[MonetizationManager] [MOCK AD] Type: %s, Context: %s" % [
		"Forced" if ad_type == AdType.FORCED else "Rewarded",
		context
	])

	# Simulate ad duration
	await get_tree().create_timer(2.0).timeout

	if ad_type == AdType.REWARDED:
		_grant_rewarded_ad_bonus(context)

	EventBus.emit_event("ad_completed", {
		"type": ad_type,
		"context": context
	})

	print("[MonetizationManager] Ad completed")


func _grant_rewarded_ad_bonus(reward_type: String) -> void:
	match reward_type:
		"harvest_boost":
			# Grant 10-minute harvest boost
			EventBus.emit_event("buff_applied", {
				"type": "harvest_boost",
				"duration": 600.0,
				"multiplier": 1.5
			})
			print("[MonetizationManager] Granted: Harvest Boost (10 min)")

		"corruption_shield":
			# Grant temporary corruption shield
			if GameManager.player:
				EventBus.emit_event("buff_applied", {
					"type": "corruption_shield",
					"duration": 300.0
				})
			print("[MonetizationManager] Granted: Corruption Shield (5 min)")

		"instant_grow":
			# Instant crop growth for one plot
			EventBus.emit_event("buff_applied", {
				"type": "instant_grow",
				"uses": 1
			})
			print("[MonetizationManager] Granted: Instant Grow (1 use)")

		"double_loot":
			# Double next boss loot
			EventBus.emit_event("buff_applied", {
				"type": "double_boss_loot",
				"uses": 1
			})
			print("[MonetizationManager] Granted: Double Boss Loot (1 use)")


# ============================================================================
# In-App Purchases
# ============================================================================

## Purchase Veil Shards
func purchase_veil_shards(product_key: String) -> void:
	if not iap_products.has(product_key):
		push_error("[MonetizationManager] Unknown product: %s" % product_key)
		return

	var product = iap_products[product_key]

	print("[MonetizationManager] Initiating purchase: %s" % product.name)

	# In production, this would call the store SDK
	# For now, simulate purchase
	_simulate_purchase(product_key, product)


## Purchase Supporter Pack
func purchase_supporter_pack() -> void:
	if supporter_pack_owned:
		print("[MonetizationManager] Supporter Pack already owned")
		return

	purchase_veil_shards("supporter_pack")


func _simulate_purchase(product_key: String, product: Dictionary) -> void:
	# Simulate purchase flow
	print("[MonetizationManager] [MOCK PURCHASE] %s - %s" % [product.name, product.price])

	# Simulate processing delay
	await get_tree().create_timer(1.0).timeout

	# Simulate success
	var purchase_token = "mock_token_%d" % Time.get_ticks_msec()

	_verify_purchase(purchase_token, product_key)


func _verify_purchase(purchase_token: String, product_key: String) -> void:
	print("[MonetizationManager] Verifying purchase...")

	if api_client:
		api_client.verify_purchase(purchase_token, product_key)

		# Wait for verification (in production, handled by callback)
		await get_tree().create_timer(1.0).timeout

		_finalize_purchase(product_key)
	else:
		# Offline mode - grant directly (risky in production)
		_finalize_purchase(product_key)


func _finalize_purchase(product_key: String) -> void:
	var product = iap_products[product_key]

	if product.has("shards"):
		# Grant Veil Shards
		var shard_amount = product.shards

		EventBus.emit_event("veil_shards_purchased", {
			"amount": shard_amount,
			"product": product.name
		})

		print("[MonetizationManager] Purchase complete! +%d Veil Shards" % shard_amount)

	elif product_key == "supporter_pack":
		# Grant Supporter Pack
		supporter_pack_owned = true

		EventBus.emit_event("supporter_pack_purchased", {
			"benefits": product.benefits
		})

		print("[MonetizationManager] Supporter Pack activated! Thank you for your support!")

	# Show confirmation to player
	EventBus.emit_event("purchase_completed", {
		"product": product.name
	})


# ============================================================================
# Veil Shard Economy
# ============================================================================

## Check if player can afford an item
func can_afford(cost: int) -> bool:
	if api_client:
		return api_client.veil_shard_balance >= cost
	return false


## Spend Veil Shards
func spend_shards(cost: int, item_description: String) -> bool:
	if not can_afford(cost):
		print("[MonetizationManager] Insufficient Veil Shards: %d needed" % cost)
		EventBus.emit_event("insufficient_shards", {"cost": cost})
		return false

	# Deduct shards via API
	if api_client:
		api_client.purchase_with_shards(item_description, cost)

	EventBus.emit_event("shards_spent", {
		"cost": cost,
		"item": item_description
	})

	print("[MonetizationManager] Spent %d Veil Shards on %s" % [cost, item_description])

	return true


## Get current shard balance
func get_shard_balance() -> int:
	if api_client:
		return api_client.veil_shard_balance
	return 0


# ============================================================================
# Event Handlers
# ============================================================================

func _on_ad_trigger_death(data: Dictionary) -> void:
	show_forced_ad("death")


func _on_ad_trigger_sleep(data: Dictionary) -> void:
	show_forced_ad("sleep")


func _on_ad_trigger_dungeon(data: Dictionary) -> void:
	show_forced_ad("dungeon_complete")


func _on_ad_trigger_fast_travel(data: Dictionary) -> void:
	show_forced_ad("fast_travel")


# ============================================================================
# Daily Reset
# ============================================================================

func reset_daily_limits() -> void:
	rewarded_ads_today = 0
	print("[MonetizationManager] Daily limits reset")


# ============================================================================
# Debug
# ============================================================================

func print_debug_info() -> void:
	print("\n===== MonetizationManager Debug Info =====")
	print("Supporter Pack Owned: %s" % supporter_pack_owned)
	print("Last Forced Ad: %d seconds ago" % (Time.get_unix_time_from_system() - last_forced_ad_time))
	print("Can Show Forced Ad: %s" % _can_show_forced_ad())
	print("Rewarded Ads Today: %d / %d" % [rewarded_ads_today, MAX_REWARDED_ADS_PER_DAY])
	print("Veil Shard Balance: %d" % get_shard_balance())
	print("==========================================\n")


## Grant supporter pack (debug)
func debug_grant_supporter_pack() -> void:
	supporter_pack_owned = true
	print("[MonetizationManager] DEBUG: Supporter Pack granted")


## Grant shards (debug)
func debug_grant_shards(amount: int) -> void:
	if api_client:
		api_client.veil_shard_balance += amount
	print("[MonetizationManager] DEBUG: Granted %d Veil Shards" % amount)
