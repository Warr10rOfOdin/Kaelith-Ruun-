# Kaelith Ruun — Shattered Realms

A dark fantasy text RPG built mobile-first as a PWA. Installable on phones, playable on any browser. No frameworks, no dependencies.

## Play

- **Mobile**: Open in your phone's browser and tap "Add to Home Screen" to install as an app
- **Desktop**: Open `index.html` in any modern browser
- **Offline**: Works fully offline once loaded (service worker caches all assets)

## Features

- **Mobile-First Design** — Built for phones with touch-friendly UI, safe area support for notched devices, and a native-feeling tab bar
- **PWA / Installable** — Add to home screen on iOS and Android for a full-screen app experience with offline play
- **Character Creation** — 6 unique races (Human, Aelvar, Durgan, Revathi, Ashborn, Hollow) and 5 classes (Voidblade, Runecaster, Duskwalker, Soulwarden, Bloodweaver)
- **Turn-Based Combat** — Tactical combat with abilities, items, buffs, debuffs, and multi-phase boss fights
- **Three Regions** — The Ashen Wastes, The Hollowfen, and The Void Sanctum, each with unique enemies and a boss
- **NPC Dialogue** — Branching conversations with merchants, witches, and ghosts
- **Inventory & Equipment** — Loot, equip, and trade gear with rarity tiers
- **Quest System** — Main storyline with tracked objectives plus side quests
- **Deep Lore** — A fully realized dark fantasy world with interconnected history
- **Save System** — Progress saved to localStorage automatically

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
