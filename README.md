# Kaelith Ruun — Shattered Realms

An **open-world survival RPG** in a dark fantasy pixel-art world, built mobile-first as a PWA. Walk the shattered realms, fight what hunts you in real time, gather, mine, craft, farm, terraform, and build a camp that keeps you alive. No frameworks, no dependencies.

## Play

- **Mobile**: Open in your phone's browser and tap "Add to Home Screen" — D-pad to move
- **Desktop**: Open `index.html` in any modern browser (WASD to move, E to interact)
- **Offline**: Works fully offline once loaded

## ONE WORLD

- **Live combat in the open world** — enemies spawn and hunt you across the maps; your weapons auto-fire at the nearest threat while you position. 6 weapons × 5 ranks, 6 boons, drafted permanently on every level-up. Nights are dangerous.
- **Survival** — hunger drains as you travel; eat what you farm, cook, and loot or starve. Death sends you home to camp, lighter of gold. Each dawn the world ticks: crops grow, golems dig, seasons turn.
- **Gather & mine** — chop trees, break rocks, harvest veins in the world; build the Mineshaft and descend the push-your-luck expedition mine (depth tiers, gems, gas pockets, pickaxe gating).
- **Craft & build** — smelt ore at the forge, craft tools/gear/potions, raise 15+ structures, upgrade them, terraform your camp's terrain tile by tile (paths, soil, ponds, tree groves).
- **Farm** — real plots with soil quality, watering, seasonal preferences, harvest quality, and crossbreeding hybrids; automate with irrigation, golems, and harvest sprites.
- **4 realms, 4 bosses** — fought live where they stand; victories unlock regions and Echo attunements (16 permanent boons).

## World &amp; Systems

- **Mobile-First Design** — Built for phones with touch-friendly UI, safe area support for notched devices, and a native-feeling tab bar
- **PWA / Installable** — Add to home screen on iOS and Android for a full-screen app experience with offline play
- **Character Creation** — 6 unique races (Human, Aelvar, Durgan, Revathi, Ashborn, Hollow) and 5 classes (Voidblade, Runecaster, Duskwalker, Soulwarden, Bloodweaver)
- **Turn-Based Combat** — Tactical combat with abilities, stances, combos, counters, items, buffs, debuffs, and multi-phase boss fights
- **Echoes of Ruun** — Permanent boon system: attune fragments of the Shattering from boss kills and Resonant Shrines across three facets (War, Ward, Wisdom)
- **Four Regions** — The Ashen Wastes, The Hollowfen, The Void Sanctum, and The Shattered Spire, each with unique enemies, region events, and a boss
- **Region Events** — Choice-driven encounters with real risk/reward decisions unique to each region
- **The Depths** — Expedition mining: descend a push-your-luck mine with depth tiers, gems, gas pockets, and pickaxe progression
- **Living Soil** — Plot-based farming with soil quality, watering, seasons, harvest quality, and crop crossbreeding
- **Terraforming** — Permanently reshape your camp: paths, tilled soil, ponds, and renewable tree groves
- **Industry** — Automate through development: irrigation, mining golems, and harvest sprites
- **NPC Dialogue** — Branching conversations with merchants, witches, and ghosts
- **Inventory & Equipment** — Loot, equip, and trade gear with rarity tiers
- **Quest System** — Main storyline with tracked objectives plus side quests
- **Deep Lore** — A fully realized dark fantasy world with interconnected history
- **Save System** — Progress saved to localStorage automatically
- **Accessibility** — Large text mode and reduced-motion support

## App Store Deployment

See [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md) for step-by-step instructions to publish on:
- **Google Play Store** (via TWA or Capacitor)
- **Apple App Store** (via Capacitor + Xcode)

Includes store listing copy, screenshot specs, pricing strategy, and pre-launch checklist.

## World

A thousand years ago, an entity called Ruun shattered reality. The survivors call their broken world *Kaelith Ruun* — "the ruin that remains." The sun is dying. Magic is killing the world. And something in the Void Sanctum is still unraveling what's left.

## Tech

- Pure HTML5 / CSS3 / ES6 JavaScript — zero dependencies
- Mobile-first CSS with `min-width` breakpoints for tablet/desktop
- PWA with service worker for offline play
- Safe area insets for iPhone notch / dynamic island
- Touch optimized: 44-48px tap targets, swipe gestures, no hover dependencies
- `100dvh` dynamic viewport height for mobile browsers
- Responsive from 320px phones to widescreen desktop
