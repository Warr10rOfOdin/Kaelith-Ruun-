# Changelog

All notable changes to Kaelith Ruun — Shattered Realms.

---

## [v0.9.0] — 2026-03-01 — Panel Visual Overhaul

### Changed
- **Character Sheet** completely redesigned:
  - Visual HP/MP/XP bars with colored gradient fills replacing plain number display
  - Stat icons on all attributes (Strength, Dexterity, etc.) and combat stats
  - Card-based ability display with header (name + cost), description, and damage range
  - Styled skill tree with bordered tier cards and locked/unlocked visual states
  - All stat groups wrapped in bordered card containers with fade-in animation
- **Journal/Quests** completely redesigned:
  - Quest type badges: gold "MAIN" and blue "SIDE" pill labels on each quest
  - Styled objective checkboxes with green border/fill on completion
  - Per-quest progress bars showing completion percentage
  - Section dividers with horizontal rule accents
  - Empty state placeholder for undiscovered side quests
- **Achievements** completely redesigned:
  - Badge-style layout with circular icons (gold starred for unlocked, dim for locked)
  - Overall achievement progress bar in header
  - Unlocked achievements sorted to top of list
  - Statistics section with per-stat icons (sword, skull, star, etc.)
- **Inventory** completely redesigned:
  - 3-column equipment grid with labeled slots (Weapon, Helmet, Armor, etc.)
  - Rarity glow borders on equipment slots: green (uncommon) through gold (legendary)
  - Legendary equipment gets pulsing gold animation
  - Rarity-tinted borders on inventory grid slots
  - Item detail panel redesigned with large icon, rarity tag, and stat comparison
  - Empty inventory slots visually dimmed

---

## [v0.8.3] — 2026-03-01 — Combat Phase 3: Gameplay Depth

### Added
- **Enemy behavior system** — each enemy has an AI behavior pattern (aggro/defensive/support) that drives ability selection
  - Aggro: strongly prefers high-damage abilities (3x weight), rare buff use
  - Defensive: prefers shields/buffs (3x weight), moderate damage output
  - Support: prefers debuffs (3x weight) and heals, mixed damage
  - All 13 enemies + 3 bosses assigned thematic behavior patterns
- **Elemental resistance/weakness system** — enemies have per-element resistance values
  - Damage modified by `(1 - resistance)`: negative = weakness (amplified), positive = resistance (reduced)
  - Floating "WEAK!" label (orange) on exploiting weakness, "RESIST" label (gray) on resisted elements
  - Discovered weaknesses persist and display as tooltip icons under enemy name
  - `getAbilityElement()` auto-detects element from ability name/properties
- **Counter/reaction window** — tappable counter button appears during enemy telegraph phase
  - Shrinking timer bar shows remaining window (~600ms)
  - Successful counter: 40% damage reduction + 20% damage reflected back
  - Visual feedback: gold pulse on active, green flash on success
- **Combo chain bonus system** — elemental ability chains grant bonus damage
  - Same-element chain: +10% per consecutive use (max +30%)
  - Element-switch combos: fire↔ice (15%), fire↔lightning (20%), ice↔lightning (15%), shadow↔fire/lightning (10-15%)
  - Floating "CHAIN +X%" label shows bonus on hit
- **Resistance data for all enemies** — thematic 4-element resistance maps
  - e.g., Ember Hound: fire +50%, ice -50%; Drowned Knight: fire -30%, lightning -40%, ice +40%
  - Bosses have signature resistances (Ruun: shadow +75%)

---

## [v0.8.2] — 2026-03-01 — Combat Phase 2: Real Immersion

### Added
- **Per-skill VFX system** — abilities now have unique visual effects mapped by name, element, and type
  - New spell overlays: lightning (electric arc flash), blood (crimson pulse), heal (green glow), void (purple rip), buff (gold shimmer)
  - New slash effects: lightning strike, blood splash, void burst, heal ring, multi-strike (3 overlapping arcs)
  - `getAbilityVFX()` maps all 55+ player abilities to correct visual style
- **Enemy attack wind-up animations** — visible charge/lean before enemy strikes land
  - Physical: lean forward + lunge (0.5s)
  - Magical: glow + saturate (0.5s)
  - Heavy/boss: large wind-up with screen-edge glow (0.7s)
- **Status effect overlays** on the battlefield during combat
  - Poison: green drip gradient pulsing at bottom of stage
  - Blind: dark vignette closing inward, pulsing
  - Slow: frost border with ice glow shimmer
  - Weaken: dim red-tinted ground overlay
  - Auto-update each turn as debuffs tick and expire
- **Persistent ambient combat particles** per region
  - Ashen Wastes: 12 floating ember particles (orange-red, drift upward)
  - Hollowfen: 8 floating spore particles (green, slow drift)
  - Void Sanctum: 10 void mote particles (purple, ethereal float)
  - Auto-spawn on combat start, respawn periodically, cleanup on exit
- **Damage-scaled camera shake** — heavy shake (12px + rotation) for damage >= 30, standard for lighter hits

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
