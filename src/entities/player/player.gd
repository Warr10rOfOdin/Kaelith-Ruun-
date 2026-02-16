extends CharacterBody2D
## Player - Main player character with movement, stats, and combat
##
## This is the player's character entity that handles movement, health,
## corruption, sustenance, and combat actions.

class_name Player

## Movement settings
@export var move_speed: float = 200.0
@export var dash_speed: float = 400.0
@export var dash_duration: float = 0.2
@export var dash_cooldown: float = 1.0

## Player stats - Vital Flame (Health)
var max_vital_flame: float = 100.0
var vital_flame: float = 100.0
var vital_flame_regen: float = 1.0  # Per second
var vital_flame_regen_multiplier: float = 1.0  # Multiplier near heat sources

## Player stats - Sustenance (Food)
var max_sustenance: float = 100.0
var sustenance: float = 100.0
var sustenance_drain: float = 0.5  # Per second

## Player stats - Veil Corruption
var veil_corruption: float = 0.0
var max_corruption: float = 100.0
var corruption_drain_rate: float = 0.2  # Passive drain per second

## Corruption effects
var corruption_damage_bonus: float = 0.0
var corruption_loot_bonus: float = 0.0
var corruption_aggro_multiplier: float = 1.0

## Combat stats
var base_damage: float = 10.0
var attack_cooldown: float = 0.5
var attack_timer: float = 0.0

## Movement state
var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var dash_direction: Vector2 = Vector2.ZERO

## Near heat source
var is_near_heat: bool = false
var current_heat_level: float = 0.0

## In corrupted zone
var is_in_corrupted_zone: bool = false
var current_corruption_level: float = 0.0

## Player inventory (reference)
var inventory = null

## Death state
var is_dead: bool = false

## Nodes
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer if has_node("AnimationPlayer") else null
@onready var collision_shape: CollisionShape2D = $CollisionShape2D


func _ready() -> void:
	# Set up collision layer
	set_collision_layer_value(1, true)  # Player layer
	set_collision_mask_value(2, true)   # Enemies
	set_collision_mask_value(3, true)   # Environment

	# Register as player
	GameManager.player = self

	# Subscribe to events
	EventBus.subscribe("heat_zone_entered", _on_heat_zone_entered)
	EventBus.subscribe("heat_zone_exited", _on_heat_zone_exited)
	EventBus.subscribe("corruption_zone_entered", _on_corruption_zone_entered)
	EventBus.subscribe("corruption_zone_exited", _on_corruption_zone_exited)

	# Emit spawn event
	EventBus.emit_event(EventBus.EVENT_PLAYER_SPAWNED, {
		"position": global_position
	})

	print("[Player] Player spawned at %s" % global_position)


func _process(delta: float) -> void:
	if is_dead:
		return

	# Update stats
	_update_vital_flame(delta)
	_update_sustenance(delta)
	_update_corruption(delta)

	# Update timers
	if attack_timer > 0:
		attack_timer -= delta

	if dash_cooldown_timer > 0:
		dash_cooldown_timer -= delta


func _physics_process(delta: float) -> void:
	if is_dead:
		return

	if is_dashing:
		_process_dash(delta)
	else:
		_process_movement()

	# Combat input
	if Input.is_action_just_pressed("attack_light"):
		_perform_light_attack()
	elif Input.is_action_just_pressed("attack_heavy"):
		_perform_heavy_attack()

	# Dash input
	if Input.is_action_just_pressed("dash") and not is_dashing and dash_cooldown_timer <= 0:
		_perform_dash()

	# Move character
	move_and_slide()


# ============================================================================
# Movement
# ============================================================================

func _process_movement() -> void:
	var input_vector = Vector2.ZERO

	input_vector.x = Input.get_action_strength("move_right") - Input.get_action_strength("move_left")
	input_vector.y = Input.get_action_strength("move_down") - Input.get_action_strength("move_up")

	input_vector = input_vector.normalized()

	velocity = input_vector * move_speed

	# Update sprite direction
	if input_vector.x != 0:
		sprite.flip_h = input_vector.x < 0


func _perform_dash() -> void:
	var dash_dir = velocity.normalized()
	if dash_dir == Vector2.ZERO:
		dash_dir = Vector2.RIGHT
		if sprite.flip_h:
			dash_dir = Vector2.LEFT

	is_dashing = true
	dash_direction = dash_dir
	dash_timer = dash_duration
	dash_cooldown_timer = dash_cooldown

	# Play dash effect
	EventBus.emit_event("player_dashed", {
		"position": global_position,
		"direction": dash_direction
	})

	AudioManager.play_sfx("dash")


func _process_dash(delta: float) -> void:
	dash_timer -= delta

	if dash_timer <= 0:
		is_dashing = false
		velocity = Vector2.ZERO
	else:
		velocity = dash_direction * dash_speed


# ============================================================================
# Combat
# ============================================================================

func _perform_light_attack() -> void:
	if attack_timer > 0:
		return

	attack_timer = attack_cooldown

	var damage = base_damage + corruption_damage_bonus
	var attack_direction = (get_global_mouse_position() - global_position).normalized()

	EventBus.emit_event("player_attack_light", {
		"position": global_position,
		"direction": attack_direction,
		"damage": damage
	})

	AudioManager.play_sfx("sword_slash")

	print("[Player] Light attack: %.1f damage" % damage)


func _perform_heavy_attack() -> void:
	if attack_timer > 0:
		return

	# Heavy attack requires and consumes corruption
	if veil_corruption < 10.0:
		print("[Player] Not enough corruption for heavy attack")
		return

	attack_timer = attack_cooldown * 1.5
	veil_corruption -= 10.0

	var damage = (base_damage * 2.0) + (corruption_damage_bonus * 1.5)
	var attack_direction = (get_global_mouse_position() - global_position).normalized()

	EventBus.emit_event("player_attack_heavy", {
		"position": global_position,
		"direction": attack_direction,
		"damage": damage
	})

	AudioManager.play_sfx("heavy_slash")

	print("[Player] Heavy attack: %.1f damage (consumed 10 corruption)" % damage)


# ============================================================================
# Stats Management
# ============================================================================

func _update_vital_flame(delta: float) -> void:
	var old_health = vital_flame

	# Regenerate health near heat sources
	if is_near_heat:
		vital_flame += vital_flame_regen * vital_flame_regen_multiplier * delta

	# Reduce regen in corrupted zones
	if is_in_corrupted_zone:
		vital_flame += vital_flame_regen * 0.5 * delta
	elif not is_near_heat:
		vital_flame += vital_flame_regen * 0.25 * delta

	vital_flame = clamp(vital_flame, 0.0, max_vital_flame)

	# Notify if changed significantly
	if abs(vital_flame - old_health) > 0.1:
		EventBus.emit_event(EventBus.EVENT_PLAYER_HEALTH_CHANGED, {
			"current": vital_flame,
			"max": max_vital_flame,
			"percentage": vital_flame / max_vital_flame
		})

	# Check for death
	if vital_flame <= 0 and not is_dead:
		_die()


func _update_sustenance(delta: float) -> void:
	var old_sustenance = sustenance

	sustenance -= sustenance_drain * delta
	sustenance = clamp(sustenance, 0.0, max_sustenance)

	# Notify if changed significantly
	if abs(sustenance - old_sustenance) > 0.1:
		EventBus.emit_event(EventBus.EVENT_PLAYER_SUSTENANCE_CHANGED, {
			"current": sustenance,
			"max": max_sustenance,
			"percentage": sustenance / max_sustenance
		})

	# Low sustenance effects (could add penalties)
	if sustenance < 20.0:
		# Reduce movement speed when very hungry
		pass


func _update_corruption(delta: float) -> void:
	var old_corruption = veil_corruption

	# Passive corruption drain
	if not is_in_corrupted_zone:
		veil_corruption -= corruption_drain_rate * delta

	veil_corruption = clamp(veil_corruption, 0.0, max_corruption)

	# Update corruption bonuses
	corruption_damage_bonus = veil_corruption * 0.2  # +0.2 damage per corruption point
	corruption_loot_bonus = veil_corruption * 0.01   # +1% loot chance per corruption point
	corruption_aggro_multiplier = 1.0 + (veil_corruption * 0.02)  # +2% aggro per corruption point

	# Notify if changed significantly
	if abs(veil_corruption - old_corruption) > 0.1:
		EventBus.emit_event(EventBus.EVENT_PLAYER_CORRUPTION_CHANGED, {
			"current": veil_corruption,
			"max": max_corruption,
			"percentage": veil_corruption / max_corruption,
			"damage_bonus": corruption_damage_bonus,
			"loot_bonus": corruption_loot_bonus
		})


## Take damage
func take_damage(amount: float, source: String = "") -> void:
	if is_dead:
		return

	vital_flame -= amount
	vital_flame = clamp(vital_flame, 0.0, max_vital_flame)

	EventBus.emit_event(EventBus.EVENT_DAMAGE_RECEIVED, {
		"amount": amount,
		"source": source,
		"current_health": vital_flame
	})

	AudioManager.play_sfx("player_hurt")

	print("[Player] Took %.1f damage from %s (%.1f / %.1f)" % [amount, source, vital_flame, max_vital_flame])

	if vital_flame <= 0:
		_die()


## Heal player
func heal(amount: float) -> void:
	vital_flame += amount
	vital_flame = clamp(vital_flame, 0.0, max_vital_flame)

	EventBus.emit_event(EventBus.EVENT_PLAYER_HEALTH_CHANGED, {
		"current": vital_flame,
		"max": max_vital_flame,
		"percentage": vital_flame / max_vital_flame
	})


## Add sustenance (eat food)
func add_sustenance(amount: float) -> void:
	sustenance += amount
	sustenance = clamp(sustenance, 0.0, max_sustenance)

	EventBus.emit_event(EventBus.EVENT_PLAYER_SUSTENANCE_CHANGED, {
		"current": sustenance,
		"max": max_sustenance,
		"percentage": sustenance / max_sustenance
	})

	AudioManager.play_sfx("eat_food")


## Add corruption
func add_corruption(amount: float) -> void:
	veil_corruption += amount
	veil_corruption = clamp(veil_corruption, 0.0, max_corruption)

	EventBus.emit_event(EventBus.EVENT_PLAYER_CORRUPTION_CHANGED, {
		"current": veil_corruption,
		"max": max_corruption,
		"percentage": veil_corruption / max_corruption
	})


## Handle death
func _die() -> void:
	if is_dead:
		return

	is_dead = true
	velocity = Vector2.ZERO

	EventBus.emit_event(EventBus.EVENT_PLAYER_DIED, {
		"position": global_position,
		"cause": "vital_flame_depleted"
	})

	AudioManager.play_sfx("player_death")

	print("[Player] Player died")


## Respawn
func respawn(spawn_position: Vector2) -> void:
	global_position = spawn_position
	vital_flame = max_vital_flame
	sustenance = max_sustenance * 0.5
	veil_corruption = 0.0
	is_dead = false

	EventBus.emit_event(EventBus.EVENT_PLAYER_RESPAWNED, {
		"position": global_position
	})

	print("[Player] Player respawned at %s" % global_position)


# ============================================================================
# Environment Interactions
# ============================================================================

func _on_heat_zone_entered(data: Dictionary) -> void:
	is_near_heat = true
	current_heat_level = data.get("heat_level", 50.0)
	vital_flame_regen_multiplier = 1.0 + (current_heat_level / 100.0)

	print("[Player] Entered heat zone (level: %.1f)" % current_heat_level)


func _on_heat_zone_exited(data: Dictionary) -> void:
	is_near_heat = false
	current_heat_level = 0.0
	vital_flame_regen_multiplier = 1.0

	print("[Player] Exited heat zone")


func _on_corruption_zone_entered(data: Dictionary) -> void:
	is_in_corrupted_zone = true
	current_corruption_level = data.get("corruption_level", 50.0)

	print("[Player] Entered corruption zone (level: %.1f)" % current_corruption_level)


func _on_corruption_zone_exited(data: Dictionary) -> void:
	is_in_corrupted_zone = false
	current_corruption_level = 0.0

	print("[Player] Exited corruption zone")


# ============================================================================
# Save/Load
# ============================================================================

func get_save_data() -> Dictionary:
	return {
		"position": {
			"x": global_position.x,
			"y": global_position.y
		},
		"vital_flame": vital_flame,
		"sustenance": sustenance,
		"veil_corruption": veil_corruption,
		"max_vital_flame": max_vital_flame,
		"max_sustenance": max_sustenance
	}


func load_save_data(data: Dictionary) -> void:
	if data.has("position"):
		global_position = Vector2(data.position.x, data.position.y)

	vital_flame = data.get("vital_flame", max_vital_flame)
	sustenance = data.get("sustenance", max_sustenance)
	veil_corruption = data.get("veil_corruption", 0.0)
	max_vital_flame = data.get("max_vital_flame", 100.0)
	max_sustenance = data.get("max_sustenance", 100.0)

	is_dead = false

	print("[Player] Loaded save data")
