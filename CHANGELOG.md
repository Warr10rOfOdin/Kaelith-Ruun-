# Changelog

All notable changes to Kaelith Ruun — Shattered Realms.

---

## [v0.8.1] — 2026-03-01 — Immersive Combat Overhaul

### Added
- **Procedural battlefield backgrounds** per region (Ashen Wastes, Hollowfen, Void Sanctum) rendered on fullscreen canvas behind combat UI
- **Player combat presence** — player sprite positioned at bottom-center of combat stage, facing enemy
- **Enemy telegraph system** — intent indicators appear before enemy attacks with color-coded type (attack/special/buff/debuff) and pulse animation
- **Enemy hit recoil animation** — brightness flash, translate, scale squash on hit
- **Enemy death animation** — scale down, rotate, desaturate, fade out
- **HP bar drain effect** — fast transition with bright glow on damage
- **Low-HP bar pulse** — continuous red glow when enemy health drops below 25%
- **Critical hit arena shake** — entire combat arena shakes on critical hits
- **Action button MP cost display** — ability costs shown as a separate line under button names
- **Button type accents** — colored left-border accents by action type (attack=red, magic=blue, defend=green, item=purple, flee=gray)
- **Dark fantasy environment props** — demonic altar with skull/horns/fire braziers, tattered crimson banner with gold sigil, pentagram ritual circle with purple rune glow
- **Heavy iron-banded dark wood door** with bronze handle and warm light leak

### Changed
- Combat HTML restructured: canvas backdrop, stage area, VFX layer, intent div, status bar
- Combat CSS fully rewritten for dark fantasy immersion
- Enemy sprites enlarged (180px mobile, 220px tablet, 250px desktop) with idle breathing animation
- Player attack lunge enhanced — goes 30px toward enemy
- Action buttons now use grid layout with press ripple effect
- Combat log compacted to 60px with gradient background
- All combat overlays (boss intro, game over, skill choice, loot) updated to dark fantasy panel style

---

## [v0.8.0] — 2026-03-01 — Dark Fantasy Visual Identity

### Added
- **Dark fantasy color palette** — muted, desaturated tones replacing candy-bright colors across all terrain, entities, and UI
- **5 NPC archetype sprites** replacing generic colored NPCs:
  - Dark Cultist — hooded robes, torch, glowing red eyes in shadow
  - Demon Warrior — heavy plate armor, pauldron spikes, red skin, horns
  - Village Elder — earth-tone robes, white beard, lantern, walking staff
  - Huntress — fitted leather armor, bracers, ponytail, bow with quiver
  - Merchant — green tunic, traveling cap, belt pouches, trade apron
- **Player sprite restyled as Kaelith Ruun** — red-skinned demon with horns, dark armor, amber eyes, ember-orange blade
- **Shared `_outlineSprite()` utility** — 1px dark outline for all character sprites
- **Enhanced zone lighting** — base darkness increased (0.25→0.32), region-specific darkness (scorched_village=0.35, void_sanctum=0.48, hollowfen=0.38), warmer fire glow, deeper indigo night tints, noon desaturation

### Changed
- Building icon darkened — dark stone walls, damaged slate roof, fire-lit window glow
- Door updated — heavy dark wood, iron bands, bronze handle
- UI overhauled across all CSS files:
  - `style.css` — menu buttons, nav tabs, action buttons, inventory slots, resource bars, dialogue box, title screen
  - `map.css` — HUD, bottom nav, action bar, D-pad, float messages, side panel, minimap
  - `combat.css` — combat buttons, combat bars (further overhauled in v0.8.1)

---

## [v0.7.1] — Scorched Village Visual Overhaul

### Added
- Dramatic scorched village scene design with focal landmark
- Dense building clusters and ruin arrangements
- Charred terrain textures and scorchmark details

---

## [v0.7.0] — Deep Enrichment

### Added
- Survival system — hunger, food buffs, cooking
- Settlement system with NPC settlements and base building threats
- Food gathering and preparation mechanics

---

## [v0.6.0] — World Rendering

### Added
- Y-sorted depth rendering for entities
- Map transitions between zones
- Ruin interior exploration
- Path blending between terrain types
- Curved paths and forest clusters
- Minimap polish with biome particles
- Forest edge rendering, water shore details
- Biome atmosphere effects and terrain animations
- Camera zoom and visual composition improvements

---

## [v0.5.0] — Systems Expansion

### Added
- Achievements system with stat tracking
- Quest rewards and auto-save indicator
- Sound system with ambient/combat music
- Fishing mini-game
- Combat animations and equipment comparison UI
- Game over screen with stats
- Enhanced boss combat sprites
- Skill tree system with level-up choices
- Boss intro cinematics
- Side quest content
- Combat backgrounds per region

---

## [v0.4.0] — Visual Overhaul

### Added
- Procedural combat sprites for all 13 enemies
- Day/night cycle with time-of-day lighting
- Weather system (rain, fog, storms)
- Dense world maps with detailed pixel art sprites
- Visual world map for region navigation
- Sprint system and settings menu

---

## [v0.3.0] — Open World

### Added
- Procedural world generation for large open zones
- Canvas pixel art rendering replacing emoji grid
- Smooth camera movement
- Complete item catalog and tech tree
- Expanded crafting and equipment system
- Open world tile map with base building and farming

---

## [v0.2.0] — Mobile PWA

### Added
- Mobile-first responsive design
- PWA with service worker for offline play
- Capacitor native app support (iOS/Android)
- Safe area insets for notched devices
- Touch-optimized UI with 44-48px tap targets

---

## [v0.1.0] — Foundation

### Added
- Core game engine — turn-based combat, exploration, inventory
- 6 races, 5 classes, character creation
- 3 world regions with unique enemies and bosses
- NPC dialogue with branching conversations
- Quest system with main storyline
- Save system via localStorage
- Dark fantasy lore and world-building
