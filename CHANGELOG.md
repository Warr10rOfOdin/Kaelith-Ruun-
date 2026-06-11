# Changelog

All notable changes to Kaelith Ruun — Shattered Realms.

---

## [v2.0.0] — 2026-06-11 — THE SHATTERED WILDS

**Kaelith Ruun is now a true open-world survival RPG.** No separate combat screens, no arena mode, no menu hub — one continuous world where you walk, fight, gather, build, farm, and survive.

### Added — Live world combat (`js/engine/wildcombat.js`)
- **Enemies roam the open world** and hunt you in real time — packs spawn off-screen on wild maps, elites prowl on a timer, and **nights are dangerous** (faster spawns, bigger packs)
- **Your weapons fight for you**: the 6-weapon system (arc slashes, seeking bolts, dagger fans, sweeping soul orbs, lifestealing lashes, ember novas) now fires in-world, auto-aiming at the nearest threat while you steer, dodge, and position
- **Kills feed the RPG directly**: XP floats off corpses into your real character level; **level-ups draft permanent weapon and boon ranks** (up to 4 weapons + 4 boons, 5 ranks each, then raw attributes)
- **Loot drops on the ground**: gold, region materials (wood/stone/ore/essence per realm), and creature loot, all magnetized to you
- **Bosses are fought live in the world** — walk up to the Ashen King and fight him where he stands; victory unlocks regions and offers Echo attunements as before
- Enemy nests (`enemy_spawn` entities) now pour live enemies into the world when disturbed; camp raids and event ambushes spawn real attackers
- Damage numbers, knockback, hit-flash, death pops, mini HP bars, terrain-aware enemy pathing — full game-feel inside the existing pixel-art world renderer

### Added — Survival
- **Hunger**: a new survival meter that drains with time and sprinting (HUD bar included). Food is auto-eaten when you're hungry; with an empty larder you **starve** — and starvation kills
- **Real-time days**: the day/night cycle now drives the world — each dawn advances the camp day (crops grow, plots dry, golems mine, sprites harvest, seasons turn), and crops also grow continuously while you wander
- **Death is survival, not game over**: you wake at camp at half HP, missing 10% of your gold

### Changed
- The fade-to-black turn-based combat screen is gone from the flow entirely
- Title screen: one button — **RISE**. New survivors pick a class (starting weapon + perk) and wake at their camp with nothing but a fire
- The camp is in the world again: walk it, build on its tiles, terraform it, plant fields, descend the mineshaft — everything from the Homestead update, now under one sky

---

## [v1.1.0] — 2026-06-11 — ONE WORLD

**The two halves are now one game.** Breach combat and the survival camp share a single save, a single economy, and a single loop:

> Fight in the Breach → haul home materials → mine, craft, farm, and build at camp → every structure and meal makes the next run stronger → each run costs a day, and the camp lives on without you.

### Added
- **The Camp hub** (`js/engine/hub.js`) — the new home screen between runs: day/season strip, resource readout, facility cards (The Depths, Forge & Craft, The Fields, Build, Industry, Storehouse) with live badges (crops ready, stockpile waiting), and your active run bonuses at a glance
- **Materials drop in the Breach**: every realm drops its own resources (Ashen: wood/stone/iron/coal · Hollowfen: bog fiber/veil crystal/mithril · Void: essence/shadow silk/void ore · Spire: crystal/arcane dust) — elites guarantee drops with rare-material bias; the haul banks into your camp inventory at run's end
- **Buildings ARE the meta-progression** (replaces the abstract gold shop): Shelter +15 HP/level, Forge +6% damage/level, Workshop +5% attack speed/level, Training Grounds +8% move speed, House +10% XP, Lookout +10% gold, Ward Stones −1 damage taken/level **and a once-per-run revive**
- **Rations**: food grown in your fields and cooked at your benches is auto-eaten when your run HP drops below 35% (up to 3 per run, shown in the HUD) — farming literally keeps you alive
- **The day cycle binds it together**: every run advances one camp day — plots dry, saplings mature, golems mine the Depths, harvest sprites reap, seasons turn
- Buildings can now be raised directly from the hub (no tile placement needed)
- Title screen reduced to a single **RISE** button — one game, one flow

### Removed
- Sanctum gold shop (folded into buildings); separate Story/Breach mode split

---

## [v1.0.0] — 2026-06-11 — THE BREACH

**The game has been rebuilt around a brand-new core.** Kaelith Ruun is now a real-time action roguelite, designed mobile-first for one thumb. The original turn-based RPG lives on as Story Mode.

### Added — The Breach (new core game mode, `js/engine/breach.js`)
- **Real-time survivors-style runs**: swarms of enemies pour in from all sides, your weapons fire themselves, you steer with one thumb (drag anywhere = virtual joystick; WASD on desktop)
- **6 auto-firing weapons**, 5 ranks each, all with distinct geometry:
  - Voidblade (auto-aiming arc slashes with heavy knockback — full 360° at max rank)
  - Runebolt (seeking missiles) · Dusk Fan (piercing dagger spread)
  - Soul Ward (orbs that sweep the whole disc around you) · Blood Lash (two-sided strikes with lifesteal) · Ember Nova (eruption ring)
- **8 stacking boons** (Might, Alacrity, Vitality, Swiftness, Magnet, Warding, Insight, Greed)
- **Level-up drafts**: XP gems → pick 1 of 3 cards every level; build a loadout of 4 weapons + 4 boons per run
- **5 classes** from the original game, each a different starting weapon + perk
- **4 realms** (Ashen Wastes → Hollowfen → Void Sanctum → Shattered Spire) using the existing enemy roster and procedural sprites; enemy tiers unlock as the clock climbs; **elites** every 50s with gem/gold bursts
- **Region bosses at 5:00** — kill the Ashen King, Mother of the Fen, Ruun, and the Architect to unlock the next realm
- **Sanctum meta-progression**: gold banked from every run buys permanent upgrades (Vigor, Power, Haste, Fleet, Fortune, and a once-per-run Resolve revive)
- **Game-feel layer**: damage numbers, hit-flash, knockback, screen shake, kill pops, magnetized pickups, low-HP hurt vignette, boss banners and HP bar, pause/abandon, results screen with run stats
- New HUD design language (Rajdhani display numerals, chunky glowing bars), draft cards, class/realm select, results and Sanctum screens
- Title screen rebuilt around the new mode: **Enter the Breach** / **Sanctum** / **Story Mode**

### Balance (tuned via headless simulation of full 5-minute runs)
- Enemies match player speed — positioning beats fleeing; spawns bias toward your heading
- All weapons auto-aim at the nearest threat; movement is purely for dodging
- All 5 classes verified to survive 3:45–5:42 under a deliberately dumb pilot, with the boss reachable and killable

### Kept
- The entire Story Mode (turn-based RPG with Echoes, Homestead, region events) remains playable from the title screen

---

## [v0.13.0] — 2026-06-11 — The Homestead

A ground-up overhaul of mining, farming, base building, and the land itself — plus automation through development. New engine: `js/engine/homestead.js`.

### Added
- **THE DEPTHS — expedition mining**: build a **Mineshaft** at camp and descend a real mine:
  - Push-your-luck runs: a wall of 12 cells per depth level, a limited lantern-oil strike budget, and a shaft cell to crack open before you can go deeper
  - Cell types: stone, ore veins (locked by pickaxe tier), crystal clusters, gem pockets, support beams (+oil), relics, and hidden rubble that may conceal gems — or gas pockets that explode for depth-scaled damage
  - Depth bands: Lv 1–7 stone/iron/coal · Lv 8–15 granite/mithril/gems · Lv 16+ obsidian/void ore/relics (Ruun shards at Lv 20+)
  - Persistent deepest-reach progression; Mineshaft upgrades (Timbered Shaft, Deep Winch) add oil and let you start at depth 5/15
  - Rich strikes (crit mining) scaling with pickaxe tier; mining costs time and fatigue; overflow goes to the camp stockpile
- **LIVING SOIL — plot-based farming**: every plot is now real:
  - Soil quality (★–★★★) that improves with repeated cultivation
  - Daily watering (rain counts!), fertilizer (+30% growth, better quality), seasonal preferences per crop, pond and greenhouse bonuses
  - Harvest quality rolls — Silver (+1 yield) and Gold (×2 yield) based on soil, watering consistency, and fertilizer
  - **Crossbreeding**: crops planted side by side can hybridize at harvest — discover **Cinderfruit** (ember root × voidberry) and **Glimmercap** (starfruit × veil mushroom), both plantable and potent
  - Fertilizer recipe at the herb bench
- **TERRAFORMING**: permanently reshape your camp, tile by tile:
  - Lay stone paths (12% faster walking), till soil (each tile = +1 farm plot, max +8), dig ponds (crop growth bonus + camp fishing), plant saplings that grow into harvestable trees in 3 days (renewable forestry), and clear/restore land
  - Select a tool, face a tile, press action — edits persist in the save forever
- **INDUSTRY — automation through development**:
  - **Irrigation Network** (Tier 2): plots never dry out
  - **Golem Foundry** (Tier 3): forge up to 3 **Cinder Golems** that mine the depths daily at your deepest reach (cap Lv 12), depositing ore and gems into the stockpile
  - **Sprite Totem** (Tier 4): harvest sprites reap every mature crop daily and replant the same seed when supplies allow
  - Camp **Stockpile** with collect-all; passive output and overflow accumulate while you adventure
- 4 new buildings, Mineshaft upgrade track, sapling tile, fertilizer + 2 hybrid food items

### Fixed
- Placed camp buildings now restore when walking back into camp (previously only on session load)
- Buildings can now actually be used by interacting with them (the `building` entity type had no interaction handler)
- Resource respawns respect terraformed tiles

### Changed
- Old abstract crop list migrated automatically into the new plot system on load
- Camp menu reorganized: The Depths, Living Soil, Terraform, and Industry panels

---

## [v0.12.0] — 2026-06-11 — Echoes of Ruun

A full design, gameplay, UI, and UX overhaul.

### Added
- **Echoes of Ruun — permanent boon system** (`js/engine/echoes.js`):
  - 16 attunable Echoes across three facets — War (offense), Ward (defense), Wisdom (utility) — with common/rare/legendary rarities
  - Defeating any region boss releases a fragment: choose 1 of 3 Echoes
  - **Resonant Shrines** — rare exploration event offering a choice of 2 Echoes
  - Effects hook deep into combat: damage dealt/taken, crit chance, elemental attunements (+25% per element), MP costs and per-round regen, improved Defend (70% block) and Counter (40% reflect), on-kill healing, XP/gold gains, revealed enemy weaknesses, and **Second Wind** (once per battle, survive a lethal blow at 1 HP)
  - Echoes display in the character sheet with facet and rarity styling; persist in saves
  - 2 new achievements: Resonant (first Echo), Shard Bearer (5 Echoes)
- **Region events** — choice-driven encounters unique to each region:
  - Ashen Wastes: Smoldering Cache, The Ashen Pilgrim
  - Hollowfen: Drowned Reliquary, Witchlight Wisps
  - Void Sanctum: Whispering Rift, The Unraveled Soldier
  - Shattered Spire: Resonant Crystal
  - Each presents a styled event card with 2 risk/reward choices (gold, items, buffs, karma, XP, ambushes); 6-turn cooldown between events
- **Accessibility options** in Settings: Text Size (normal/large) and Reduced Motion (also honors the system `prefers-reduced-motion` preference)

### Changed
- **Navigation overhaul** — bottom nav consolidated from 8 cramped tabs to 5 focused ones (Explore, Items, Hero, Map, Menu) with crisp inline SVG iconography replacing emoji
  - New **Menu hub** panel: Journal & Quests, Camp & Crafting, Achievements, Echoes, World Lore, Settings
  - Tapping the active tab closes its panel; sub-panels keep the Menu tab lit
- **Bottom sheet panels** — the full-screen side panel is now a draggable bottom sheet with grip handle, dimmed backdrop, and swipe-down-to-dismiss; the world stays visible above it. Desktop keeps the right sidebar
- **Design system v2** — rebuilt design tokens: deeper void-violet background palette, brighter accent contrast, translucent surface layers, radius/elevation scales, and refined typography
- **Notifications** redesigned as left-accented glass toasts
- Combat action buttons and bars aligned to the new radius/elevation language
- Basic enemy attacks (no-ability enemies) now correctly respect Defend, stance, and damage-reduction modifiers
- Android back button, swipe-back, and legacy Close buttons all route through the unified panel close path

---

## [v0.11.0] — 2026-03-02 — The Shattered Spire

### Added
- **New endgame region: The Shattered Spire** (level 8-12) — a fractured arcane tower floating above the clouds:
  - 4 explorable locations: Spire Approach, Crystalline Archive, Skybridge Outpost (village), Architect's Sanctum (boss arena)
  - 4 new enemies: Crystal Revenant (defensive), Rune Wraith (support), Fractured Golem (aggro), Spire Seraph (support)
  - **The Architect** boss fight — 400 HP, 4 phases with environmental mechanics (Crystal Rain, Gravity Flux, Arcane Collapse)
  - 2 new NPCs: Vael the Runesmith (blacksmith) and Thessaly (alchemist/herbalist) at Skybridge Outpost
  - 6 new items: Crystal Edge (rare sword), Runeward Staff (rare), Spire Plate (rare armor), Seraph Wings (epic armor), Architect's Compass (legendary weapon), Architect's Crown (legendary helmet)
  - Crystal Shard, Arcane Dust, Spire Keystone resource/quest items
  - Full map data with procedural terrain, structures, paths, NPC entities, and boss entity placement
  - Region unlocks after defeating Ruun, the Unraveler
- **Shattered Spire visual atmosphere**:
  - Purple-blue crystalline region tint overlay
  - Enhanced ambient darkness (0.35 base) with deep blue-violet background
  - Crystal mote ambient particles — gentle upward drift in blue, purple, and cyan
  - Procedural battlefield background with shattered tower silhouettes, floating crystal shards, crystal veins, and runic floor markings
- **Shattered Spire weather** — 45% clear, 25% fog, 15% crystal snow, 15% rain
- **Shattered Spire ambient music** — ethereal triangle-wave tones (E4-B4 range, 850ms tempo)

---

## [v0.10.0] — 2026-03-01 — Combat Refinement

### Added
- **Combat stance system** — 3 toggleable stances that modify combat stats in real-time:
  - **Aggressive**: +25% damage dealt, +15% crit chance, but +20% damage taken
  - **Balanced**: No modifiers — steady and reliable (default)
  - **Defensive**: -30% damage taken, -20% damage dealt, -15% MP cost on abilities
  - Stance selector strip above action buttons with icon and label for each stance
  - Stance modifiers apply to basic attacks, abilities, crits, incoming enemy damage, and MP costs
  - Can switch stances freely each turn without spending an action
- **Boss environmental mechanics** — boss-specific hazards that activate at phase transitions:
  - **The Ashen King**: Fire Rain (5 dmg/turn at 50% HP), Ash Storm (20% blind chance at 20% HP)
  - **Mother of the Fen**: Poison Fog (3 dmg/turn at 60% HP), Quagmire (persistent slow at 25% HP)
  - **Ruun, the Unraveler**: Void Fissures (4 dmg/turn at 70% HP), Reality Warp (5 MP drain/turn at 40% HP), Oblivion Field (8 dmg/turn at 15% HP)
  - Environmental damage is reduced by Defensive stance
  - Dramatic environmental label appears on battlefield with colored screen flash
  - Hazards persist for the remainder of the fight

---

## [v0.9.1] — 2026-03-01 — Creation & Dialogue Polish

### Changed
- **Character Creation** overhauled:
  - Step progress indicator with dots showing current/completed steps
  - Animated step transitions with horizontal slide-in effect
  - Race/class selection cards now show stat modifier chips (+STR, -CON, etc.)
  - Enhanced description box with styled headings and italic abilities
  - Character preview redesigned: centered header, sprite canvas preview, visual HP/MP bars, stat icons, ability cards
  - "Next" button given gold accent styling to stand out
  - Name input centered with glow-on-focus effect
- **Dialogue system** overhauled:
  - NPC portrait now renders pixel art canvas sprite via `Sprites.drawNPC()` with emoji fallback
  - Typewriter text effect (18ms/char) with blinking cursor, tap-to-skip support
  - Speaker name and title split into two styled lines
  - Dialogue box redesigned: gold top border accent, rounded top corners, deeper shadow
  - Choice buttons now have arrow indicators and active-state animations
  - Shop items get dedicated name/cost layout with colored price tags
- **Screen transitions** added:
  - Scale-based enter/exit animations (scale 0.98→1 in, 1→1.02 out)
  - Smooth 250ms exit animation before new screen appears
  - Prevents double-transitions via state lock

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
