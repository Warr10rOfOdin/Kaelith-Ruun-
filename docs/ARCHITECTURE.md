# Kaelith Ruun: Veil Sanctum - Architecture Documentation

## Overview

Kaelith Ruun is built with a modular, data-driven architecture designed for easy debugging, updates, and cross-platform deployment.

---

## Core Principles

### 1. **Modularity**
Each system is self-contained with clear interfaces. Systems communicate via EventBus, not direct references.

### 2. **Data-Driven Design**
All game content (items, crops, biomes, recipes, enemies) is defined in JSON files, not hardcoded. This enables:
- Easy balance updates without code changes
- Designer-friendly workflow
- Hot-reloading during development

### 3. **Event-Driven Communication**
The EventBus provides decoupled communication between systems:
```gdscript
# Emit event
EventBus.emit_event("player_died", {"cause": "corruption"})

# Subscribe to event
EventBus.subscribe("player_died", _on_player_died)
```

### 4. **Host-Authoritative Multiplayer**
The game uses a host-authoritative model where the host's game state is the source of truth. Clients sync state from host.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Game Manager                       │
│         (Central state & lifecycle control)          │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   EventBus    │  │ DataManager │  │ SaveManager │
│ (Communication)│  │ (JSON Data) │  │(Persistence)│
└───────────────┘  └─────────────┘  └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  Game Systems │  │   Entities  │  │     UI      │
└───────────────┘  └─────────────┘  └─────────────┘
```

---

## Autoload Singletons

These are globally accessible via their names:

### GameManager
- Game state management
- Day/night cycle
- Pause/resume
- Session tracking

### EventBus
- Global event system
- Event history tracking
- Debug logging

### DataManager
- Loads all JSON game data
- Provides centralized data access
- Validates data integrity

### SaveManager
- Local save/load
- Cloud sync integration
- Auto-save functionality

### NetworkManager
- Host-authoritative multiplayer
- 4-player co-op
- Permissions system
- Sync state

### AudioManager
- Music playback
- Sound effects
- Ambient audio
- Volume control

---

## Game Systems

### HeatCorruptionSystem
Manages environmental heat and corruption:
- Heat sources (buildings, environment)
- Corruption zones
- Corruption storms
- Effects on crops, enemies, player

**Key Methods:**
```gdscript
get_heat_at(position: Vector2) -> float
get_corruption_at(position: Vector2) -> float
add_heat_source(position, radius, intensity) -> int
start_corruption_storm(duration, intensity)
```

### FarmingSystem
Handles crop planting and growth:
- Heat/corruption-based growth
- Crop phases
- Wilting conditions
- Harvesting

**Key Methods:**
```gdscript
plant_crop(crop_id: String, position: Vector2) -> int
harvest_crop(instance_id: int) -> Dictionary
is_crop_ready(instance_id: int) -> bool
```

### InventorySystem
Manages item storage:
- Player inventory
- Storage containers (Public, Guild, Host)
- Hotbar
- Item stacking

**Key Methods:**
```gdscript
add_item(item_id: String, quantity: int) -> bool
remove_item(item_id: String, quantity: int) -> bool
has_item(item_id: String, quantity: int) -> bool
```

### CraftingSystem
3-tier crafting system:
1. **Physical Craft** - Basic items
2. **Infusion Craft** - Elemental upgrades (requires heat)
3. **Veil Binding** - High-risk corruption crafting

**Key Methods:**
```gdscript
craft_item(recipe_id: String) -> bool
can_craft(recipe_id: String) -> bool
unlock_recipe(recipe_id: String)
```

### BuildingSystem
Sanctum modular construction:
- Sanctum core placement
- Module placement with constraints
- Module effects (heat, corruption resistance, etc.)
- Upgrades

**Key Methods:**
```gdscript
place_module(module_type: String, position: Vector2) -> int
remove_module(instance_id: int) -> bool
upgrade_module(instance_id: int) -> bool
```

---

## Entities

### Player
Main player character:
- Movement (WASD, touch)
- Stats (Vital Flame, Sustenance, Veil Corruption)
- Combat (light attack, heavy attack, dash, veil blink)
- Environmental interactions

**Key Stats:**
- **Vital Flame** - Health (regenerates near heat)
- **Sustenance** - Food meter (steady drain)
- **Veil Corruption** - Power vs danger mechanic

### Enemies
AI-controlled threats:
- Tier-based difficulty
- Corruption affinity
- Biome-specific spawning
- Loot drops

---

## Data Structure

### Items (`data/items/*.json`)
```json
{
  "id": "iron_sword",
  "name": "Iron Sword",
  "type": "weapon",
  "stack_size": 1,
  "rarity": "common",
  "value": 100
}
```

### Crops (`data/crops/*.json`)
```json
{
  "id": "ember_root_seed",
  "required_heat": 60.0,
  "corruption_tolerance": 20.0,
  "growth_rate": 0.0033,
  "base_yield": 3
}
```

### Recipes (`data/recipes/*.json`)
```json
{
  "id": "iron_sword",
  "tier": 1,
  "inputs": [
    {"item_id": "iron_ingot", "quantity": 3}
  ],
  "output": {
    "item_id": "iron_sword",
    "quantity": 1
  }
}
```

### Biomes (`data/biomes/*.json`)
```json
{
  "id": "ember_fields",
  "base_heat": 55.0,
  "base_corruption": 5.0,
  "enemy_spawn_rate": 0.3,
  "enemies": [...]
}
```

---

## Monetization Architecture

### Ethical Design
- **NO** pay-to-win
- **NO** stamina timers
- **NO** artificial delays
- **NO** intrusive ads

### Ad System
**Forced Ads** (event-based only):
- Death
- Dungeon completion
- Night skip
- Fast travel
- Minimum 15-minute spacing

**Rewarded Ads** (optional):
- Harvest boost
- Corruption shield
- Instant crop growth
- Double boss loot
- Max 10 per day

### IAP System
**Veil Shards** (premium currency):
- Earnable in-game
- Used for cosmetics, skill respec, time reduction
- Never for power increases

**Supporter Pack** (one-time):
- Removes forced ads
- Cosmetic badge
- Unique flame color

---

## Multiplayer Architecture

### Host-Authoritative Model
```
┌─────────┐          ┌─────────┐
│  Host   │ ◄──────► │ Client1 │
│ (State) │          └─────────┘
│         │
│         │          ┌─────────┐
│         │ ◄──────► │ Client2 │
└─────────┘          └─────────┘
```

Host manages:
- World state
- Enemy AI
- Crop growth
- Day/night cycle

Clients sync:
- Player positions
- Actions
- UI updates

### Permissions System
Host controls who can:
- Build modules
- Craft items
- Farm crops
- Access storage

---

## Save System

### Local Saves
- Stored in `user://saves/`
- JSON format
- Auto-save every 5 minutes

### Cloud Saves
- Uploaded to backend
- Cross-platform sync
- Conflict resolution

### Save Data Structure
```json
{
  "game": { ... },
  "player": { ... },
  "farming": { ... },
  "inventory": { ... },
  "building": { ... },
  "_metadata": {
    "version": "1.0.0",
    "timestamp": 1234567890
  }
}
```

---

## Performance Considerations

### Optimization Strategies
1. **Chunk-based world loading** (only load visible areas)
2. **Object pooling** for entities (enemies, projectiles)
3. **Texture atlases** for sprites
4. **Quality presets** (Low/Medium/High)
5. **Reduced tick rates** for offscreen entities

### Target Performance
- **Mobile**: 30 FPS minimum, 60 FPS target
- **Web**: 60 FPS on mid-range laptops
- **Desktop**: 60+ FPS

---

## Debug Systems

### Debug Commands
- **F1** - Print all system debug info
- **F2** - Toggle debug overlay
- **F3** - Give test items
- **F4** - Instant grow crops
- **F5** - Quick save
- **F6** - Quick load

### Debug Overlay
Shows real-time:
- FPS
- Player stats
- Heat/corruption levels
- Active systems
- Event log

---

## Extensibility

### Adding New Systems
1. Create new script in `/src/systems/`
2. Define as autoload in `project.godot` OR instantiate in `main.gd`
3. Subscribe to relevant events via EventBus
4. Implement `get_save_data()` and `load_save_data()` for persistence

### Adding New Content
1. Create JSON file in appropriate `/data/` folder
2. Follow existing schema
3. DataManager automatically loads on startup
4. No code changes needed!

---

## Testing

### Unit Testing
- Each system has testable methods
- Mock dependencies via dependency injection
- Use Godot's GUT framework

### Integration Testing
- Test system interactions via EventBus
- Verify save/load cycles
- Test multiplayer sync

---

## Next Steps

See:
- **[API.md](API.md)** - Detailed API documentation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
