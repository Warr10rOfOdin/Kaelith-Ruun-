# Roadmap

Development roadmap for Kaelith Ruun — Shattered Realms.

---

## Completed

### Core Foundation (v0.1.0)
- [x] Turn-based combat engine with buffs/debuffs/boss phases
- [x] 6 races, 5 classes, character creation
- [x] 3 world regions (Ashen Wastes, Hollowfen, Void Sanctum)
- [x] 10 regular enemies + 3 region bosses
- [x] NPC dialogue system with branching
- [x] Quest system with main storyline
- [x] Inventory, equipment, and loot rarity tiers
- [x] Save/load via localStorage

### Mobile PWA (v0.2.0)
- [x] Mobile-first responsive CSS
- [x] PWA with service worker (offline play)
- [x] Capacitor native app wrapper
- [x] Safe area insets for notched devices

### Open World Rendering (v0.3.0–v0.4.0)
- [x] Canvas pixel art rendering (replaced emoji grid)
- [x] Procedural world generation
- [x] Day/night cycle with time-of-day lighting
- [x] Weather system
- [x] Procedural combat sprites for all enemies

### Systems Expansion (v0.5.0–v0.6.0)
- [x] Achievements and stat tracking
- [x] Skill tree with level-up choices
- [x] Fishing mini-game
- [x] Sound system
- [x] Y-sorted depth rendering
- [x] Map transitions and ruin interiors
- [x] Minimap with biome particles

### Survival & Enrichment (v0.7.0)
- [x] Hunger/food system with cooking and buffs
- [x] Settlements with NPC interactions
- [x] Base building threats

### Dark Fantasy Visual Identity (v0.8.0)
- [x] Muted dark fantasy color palette
- [x] Player sprite restyled as Kaelith Ruun (red-skinned demon)
- [x] 5 distinct NPC archetype sprites
- [x] Dark fantasy environment props (altar, banner, ritual circle)
- [x] Enhanced zone lighting with region-specific darkness
- [x] Full UI overhaul (menus, HUD, map, dialogue)

### Immersive Combat — Phase 1 (v0.8.1)
- [x] Procedural battlefield backgrounds per region
- [x] Enemy sprites enlarged with idle breathing animation
- [x] Player presence in combat stage
- [x] Enemy hit recoil and death animations
- [x] Enemy telegraph/intent system
- [x] HP bar drain and low-HP pulse effects
- [x] Action buttons with type accents and MP cost display
- [x] Combat CSS and HTML restructured

---

### Immersive Combat — Phase 2: Real Immersion (v0.8.2)
- [x] Per-skill VFX — unique visual effects for each ability (fire, ice, lightning, blood, void, heal, buff, multi-hit)
- [x] Camera shake intensity scaling by damage amount
- [x] Particle systems — persistent ember/fog/void particles during combat
- [x] Enemy attack animations — visible wind-up before strike lands (physical/magical/heavy)
- [x] Status effect visuals — poison drip, blind vignette, slow frost, weaken overlay

### Immersive Combat — Phase 3: Gameplay Depth (v0.8.3)
- [x] Enemy behavior differentiation — aggro/defensive/support AI with weighted ability selection
- [x] Timing/reaction window — counter button during telegraph with timer bar, 40% reduction + 20% reflect
- [x] Combo system expansion — same-element chains (+10% per, max +30%) and element-switch combos (10-20%)
- [x] Elemental resistances and weaknesses — per-enemy 4-element resistance maps with Weak!/Resist! labels
- [x] Weakness discovery tooltip — persists across encounters, shows discovered elements as icons

### Panel Visual Overhaul (v0.9.0)
- [x] Character Sheet: visual stat bars, stat icons, ability cards, skill tree styling
- [x] Journal: quest badges, objective checkboxes, progress bars, section dividers
- [x] Achievements: badge layout, progress bar header, sorted display, stat icons
- [x] Inventory: labeled equipment grid, rarity glow borders, item detail panel overhaul

### Creation & Dialogue Polish (v0.9.1)
- [x] Character Creation: step progress dots, stat modifier chips, sprite preview canvas, animated step transitions
- [x] Dialogue: pixel art NPC portrait rendering, typewriter text effect, choice button arrow indicators
- [x] Screen transitions: scale-based enter/exit animations with transition lock

---

## In Progress

### Audio & Sound Design
- [ ] Sound design integration — hit sounds, spell SFX, ambient combat audio

### Combat Refinement (v0.10.0)
- [x] Combat stance system — aggressive/balanced/defensive with damage, crit, and MP cost modifiers
- [x] Boss environmental mechanics — unique per-boss hazards (fire rain, poison fog, void fissures, etc.)
- [x] Stance selector UI strip integrated into combat actions

### The Shattered Spire (v0.11.0)
- [x] New endgame region: The Shattered Spire (level 8-12) with 4 locations
- [x] 4 new enemies + The Architect boss with phase-based environmental mechanics
- [x] 2 NPCs (Vael, Thessaly) with dialogue trees and shops at Skybridge Outpost
- [x] 6 new items including legendary Architect's Compass and Architect's Crown
- [x] Full map definitions with procedural terrain generation
- [x] Purple-blue crystalline visual atmosphere (tint, lighting, particles, battlefield)
- [x] Region-specific weather and ambient music

### Massive Content & Systems Update (v0.12.0)
- [x] 30+ new Spire-tier items (weapons, armor, accessories, consumables, food, resources)
- [x] Tech Tree Tier 5 — Spire Ascendant with 30+ new crafting recipes
- [x] 6 new buildings: Arcane Forge, Crystal Garden, War Room, Observatory, Enchanting Altar, Trophy Hall
- [x] 3 new side quests + main quest stage 5 for Shattered Spire
- [x] 5 new enemy combat sprites (Crystal Revenant, Rune Wraith, Fractured Golem, Spire Seraph, The Architect)
- [x] Enhanced VFX system: burst particles, loot sparkle, boss entrance, screen shake, combo flash, status popups
- [x] CSS visual overhaul: notification types, equipment rarity glow, tech tree panel, building cards, HUD pulse, tooltips

---

## Planned

### World & Content Expansion
- [ ] Region-specific random events and encounters
- [ ] Dynamic NPC schedules and deeper dialogue trees
- [ ] Crafting specializations tied to class
- [ ] Rare world bosses with unique loot tables
- [ ] Environmental puzzles in ruin interiors

### Audio & Polish
- [ ] Full procedural audio system (Web Audio API)
- [ ] Ambient soundscapes per region
- [ ] Combat music with dynamic intensity
- [ ] UI sound effects
- [x] Screen transition animations

### Progression & Endgame
- [ ] New Game+ mode with scaled enemies
- [ ] Prestige / rebirth system
- [ ] Achievement rewards (cosmetic unlocks)
- [ ] Challenge dungeons with modifiers
- [ ] Leaderboards (optional online feature)

### Technical
- [ ] Performance profiling and optimization pass
- [ ] Accessibility improvements (font scaling, colorblind modes)
- [ ] Localization framework
- [ ] Analytics integration (opt-in)
- [ ] Cloud save sync
