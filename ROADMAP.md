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

## In Progress

### Immersive Combat — Phase 2: Real Immersion
- [ ] Per-skill VFX — unique visual effects for each ability (fire burst, ice shards, shadow tendrils, blood drain)
- [ ] Camera shake intensity scaling by damage amount
- [ ] Particle systems — persistent ember/fog/void particles during combat
- [ ] Sound design integration — hit sounds, spell SFX, ambient combat audio
- [ ] Enemy attack animations — visible wind-up before strike lands
- [ ] Status effect visuals — poison drip, blind overlay, slow frost

---

## Planned

### Immersive Combat — Phase 3: Gameplay Depth
- [ ] Enemy behavior differentiation — each enemy type has distinct attack patterns and tells
- [ ] Timing/reaction window — brief window to counter or dodge telegraphed attacks
- [ ] Combo system expansion — chain abilities for bonus damage/effects
- [ ] Elemental resistances and weaknesses
- [ ] Boss-specific mechanics — unique per-boss phases with environmental effects
- [ ] Combat stance system — aggressive/defensive stances that modify stats

### World & Content Expansion
- [ ] New region: The Shattered Spire (endgame zone)
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
- [ ] Screen transition animations

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
