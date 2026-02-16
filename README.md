# Kaelith Ruun: Veil Sanctum

**Survival • Farming • Crafting • Base Building • 4-Player Co-op**
**Mobile-first • Light Online • Ethical Monetization**

---

## Project Overview

Dark fantasy survival game where players build, defend, and evolve a living Sanctum in a world shaped by heat, corruption, and ancient forces.

### Core Features
- Environmental farming (heat & corruption-based)
- Ritual crafting systems (3 tiers)
- Modular base building
- Skill-based combat
- 4-player co-op progression
- Cross-platform (Web + Mobile)
- Ethical monetization (no pay-to-win)

---

## Technology Stack

- **Engine**: Godot 4.3
- **Language**: GDScript
- **Platforms**: Web (HTML5), Mobile (iOS/Android)
- **Networking**: Host-authoritative multiplayer
- **Backend**: Light online infrastructure (auth, saves, purchases)

---

## Project Structure

```
/src
  /core                 # Core game systems (managers, event bus)
  /systems              # Game systems (farming, crafting, combat, etc.)
  /entities             # Player, enemies, items, buildings
  /world                # Biomes, world generation, environment
  /ui                   # All UI components
  /multiplayer          # Networking and co-op logic
  /data                 # Game data definitions (JSON-based)
  /scenes               # Godot scenes
  /utils                # Helper scripts and utilities

/assets
  /sprites              # Pixel art sprites
  /audio                # Music and SFX
  /fonts                # UI fonts
  /shaders              # Custom shaders

/data                   # JSON configuration files
  /biomes               # Biome definitions
  /items                # Item database
  /recipes              # Crafting recipes
  /enemies              # Enemy stats and behaviors
  /crops                # Crop configurations
  /buildings            # Sanctum module definitions

/docs                   # Documentation
  /design               # Game design documents
  /technical            # Technical specifications
  /api                  # Backend API documentation

/tests                  # Unit and integration tests
```

---

## Architecture Principles

### 1. **Modularity**
- Each system is self-contained
- Clear interfaces between systems
- Easy to add/remove features

### 2. **Data-Driven Design**
- Game content defined in JSON
- No hardcoded values
- Easy balance updates without code changes

### 3. **Event-Driven Communication**
- Systems communicate via EventBus
- Decoupled components
- Easy debugging and testing

### 4. **Debuggability**
- Extensive logging with categories
- Debug UI overlay
- In-game console
- State inspection tools

### 5. **Performance**
- Chunk-based world loading
- Object pooling for entities
- Efficient rendering for mobile
- Quality settings for web

---

## Core Systems

### GameManager (Autoload)
Central game state management, initialization, and lifecycle control.

### EventBus (Autoload)
Global event system for decoupled communication between systems.

### DataManager (Autoload)
Loads and manages all game data from JSON configuration files.

### SaveManager (Autoload)
Handles local and cloud save/load operations.

### NetworkManager (Autoload)
Manages multiplayer sessions, host-authoritative networking.

### AudioManager (Autoload)
Centralized audio playback and music management.

---

## Game Systems

### Heat & Corruption System
Environmental mechanics that drive gameplay tension and progression.

### Farming System
Heat and corruption-based crop growth with environmental requirements.

### Crafting System
3-tier crafting (Physical, Infusion, Veil Binding) with risk/reward.

### Sanctum Building System
Modular base construction that affects game mechanics.

### Combat System
Mobile-friendly skill-based combat with corruption integration.

### Multiplayer System
4-player co-op with permissions, scaling, and cloud sync.

---

## Development Setup

### Prerequisites
- Godot 4.3 or later
- Git

### Getting Started
1. Clone the repository
2. Open project in Godot 4.3
3. Press F5 to run

### Exporting
- **Web**: Project > Export > HTML5
- **Android**: Project > Export > Android
- **iOS**: Project > Export > iOS (requires macOS)

---

## Monetization (Ethical)

### Forced Ads (Event-Based)
- Only on: death, dungeon completion, night skip, fast travel
- Minimum 15-minute spacing
- Never during combat

### Rewarded Ads (Optional)
- Temporary buffs (harvest boost, corruption shield, etc.)
- Daily limits
- No stacking abuse

### Veil Shards (Premium Currency)
- Earnable in-game
- Purchasable (no power advantage)
- Used for: cosmetics, skill respec, craft time reduction
- Never for: damage boosts, exclusive combat gear

### Supporter Pack
- One-time purchase
- Removes forced ads
- Cosmetic badge + unique flame color

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

---

## License

TBD

---

## Design Philosophy

> Survival should feel tense.
> Progression should feel earned.
> Monetization should never corrupt gameplay integrity.

---

*Built with Godot 4 • Cross-Platform • Open Development*
