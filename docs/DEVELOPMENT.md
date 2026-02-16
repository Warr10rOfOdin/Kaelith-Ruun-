# Development Guide

## Getting Started

### Prerequisites
- Godot 4.3 or later
- Git
- Text editor (VS Code recommended with Godot Tools extension)

### Initial Setup
1. Clone the repository
2. Open `project.godot` in Godot 4.3
3. Press F5 to run the game

---

## Project Structure

```
/src
  /core          - Core systems (autoloads)
  /systems       - Game systems (farming, crafting, etc.)
  /entities      - Game entities (player, enemies)
  /scenes        - Godot scenes
  /ui            - UI components
  /multiplayer   - Networking code
  /backend       - API client, monetization
  /utils         - Helper scripts

/data            - JSON game data (easy to edit!)
  /items         - Item definitions
  /crops         - Crop definitions
  /biomes        - Biome definitions
  /recipes       - Crafting recipes
  /enemies       - Enemy definitions
  /buildings     - Building modules

/assets
  /sprites       - Pixel art sprites
  /audio         - Music and SFX
  /fonts         - UI fonts

/docs            - Documentation
/tests           - Unit and integration tests
```

---

## Development Workflow

### 1. Adding New Content (No Code!)

#### Adding a New Item
1. Create `data/items/my_item.json`:
```json
{
  "id": "my_item",
  "name": "My Cool Item",
  "type": "resource",
  "stack_size": 99,
  "rarity": "uncommon",
  "value": 50
}
```

2. Restart game - item automatically loads!

#### Adding a New Crop
1. Create `data/crops/my_crop.json`:
```json
{
  "id": "my_crop",
  "required_heat": 70.0,
  "corruption_tolerance": 15.0,
  "growth_rate": 0.004,
  "base_yield": 2
}
```

#### Adding a New Recipe
1. Create `data/recipes/my_recipe.json`:
```json
{
  "id": "my_recipe",
  "tier": 1,
  "inputs": [
    {"item_id": "iron_ingot", "quantity": 2}
  ],
  "output": {
    "item_id": "my_item",
    "quantity": 1
  }
}
```

### 2. Adding New Systems

1. Create system script in `/src/systems/`:
```gdscript
extends Node
class_name MyNewSystem

func _ready() -> void:
    EventBus.subscribe("some_event", _on_some_event)

func _on_some_event(data: Dictionary) -> void:
    # Handle event
    pass
```

2. Add to `main.gd` or make it an autoload.

### 3. Testing Changes

#### Quick Testing
- Press F5 to run
- Use debug commands:
  - F1: Print debug info
  - F3: Give test items
  - F4: Instant grow crops

#### Testing Specific Systems
```gdscript
# In console or debug script
FarmingSystem.print_debug_info()
InventorySystem.print_debug_info()
CraftingSystem.print_debug_info()
```

---

## Common Tasks

### Balancing Gameplay
All balance values are in `data/balancing.json`:
```json
{
  "player": {
    "starting_health": 100.0,
    "base_move_speed": 200.0
  },
  "farming": {
    "crop_growth_base_rate": 0.01
  }
}
```

Just edit the JSON and restart!

### Debugging Systems

Each system has a `print_debug_info()` method:
```gdscript
GameManager.print_debug_info()
EventBus.print_debug_info()
FarmingSystem.print_debug_info()
```

Use it liberally for understanding state.

### Event Bus Usage

**Emitting Events:**
```gdscript
EventBus.emit_event("crop_harvested", {
    "crop_id": "ember_root",
    "yield": 3
})
```

**Listening for Events:**
```gdscript
func _ready():
    EventBus.subscribe("crop_harvested", _on_crop_harvested)

func _on_crop_harvested(data: Dictionary):
    print("Harvested: ", data.crop_id)
```

### Adding New UI

1. Create UI scene in `/src/ui/`
2. Connect to EventBus for updates:
```gdscript
EventBus.subscribe("player_health_changed", _update_health_bar)
```

3. Emit user actions:
```gdscript
EventBus.emit_event("inventory_opened", {})
```

---

## Code Style

### Naming Conventions
- **Files**: `snake_case.gd`
- **Classes**: `PascalCase`
- **Functions**: `snake_case()`
- **Variables**: `snake_case`
- **Constants**: `SCREAMING_SNAKE_CASE`

### Comments
- Use `##` for documentation comments
- Document all public functions
- Explain WHY, not WHAT

### Example:
```gdscript
## Calculate crop growth multiplier based on heat and corruption.
## Returns a value between 0.5 and 1.5.
func get_crop_growth_multiplier(position: Vector2, crop_data: Dictionary) -> float:
    var heat = get_heat_at(position)
    # Heat matching affects growth rate
    var heat_diff = abs(heat - crop_data.required_heat)
    return 1.0 if heat_diff < 10.0 else 0.5
```

---

## Debugging Tips

### Common Issues

**System not working?**
1. Check if it's initialized in `main.gd`
2. Check EventBus subscriptions
3. Print debug info

**Data not loading?**
1. Check JSON syntax (use a validator)
2. Check file path
3. Look at console for errors

**Multiplayer desync?**
1. Ensure host is authoritative
2. Check network events
3. Verify sync rate

### Debug Tools

**Event History:**
```gdscript
var history = EventBus.get_event_history()
for entry in history:
    print(entry)
```

**Check Data Loaded:**
```gdscript
DataManager.print_debug_info()
# Shows counts of loaded items, crops, etc.
```

---

## Performance Profiling

### Built-in Profiler
1. Run game
2. Go to Debugger > Profiler
3. Check frame time, memory usage

### Custom Profiling
```gdscript
var start_time = Time.get_ticks_usec()
# ... code to profile ...
var elapsed = Time.get_ticks_usec() - start_time
print("Took %d microseconds" % elapsed)
```

---

## Git Workflow

### Branching
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "Add my feature"

# Push
git push origin feature/my-feature
```

### Commit Messages
Format: `[Type] Brief description`

Types:
- `[Feature]` - New feature
- `[Fix]` - Bug fix
- `[Balance]` - Game balance changes
- `[Refactor]` - Code restructuring
- `[Docs]` - Documentation
- `[Content]` - New game content (items, crops, etc.)

Examples:
- `[Feature] Add veil binding crafting system`
- `[Balance] Reduce ember root growth time`
- `[Fix] Correct corruption storm duration`
- `[Content] Add 5 new crops for ashwood biome`

---

## Testing Before Commit

Checklist:
- [ ] Game runs without errors
- [ ] No console warnings
- [ ] Test affected systems with F1 debug
- [ ] Check save/load works (F5/F6)
- [ ] Verify JSON data is valid

---

## Building for Platforms

### Web (HTML5)
```
Project > Export > HTML5
```

### Android
```
Project > Export > Android
```
(Requires Android SDK setup)

### iOS
```
Project > Export > iOS
```
(Requires macOS and Xcode)

---

## Resources

- [Godot Documentation](https://docs.godotengine.org/)
- [GDScript Style Guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html)
- Project Wiki (internal)
- Team Discord

---

## Need Help?

1. Check documentation (`/docs`)
2. Read system debug output (F1)
3. Ask in team chat
4. Create GitHub issue

**Happy coding! 🔥**
