# Kaelith Ruun — Native Mobile App Build Guide

## Overview

Kaelith Ruun is a native mobile game built with Capacitor. The game logic is HTML/CSS/JS running inside a native iOS/Android shell with real native features (haptics, status bar, splash screen, hardware back button, native keyboard).

The project is already configured — Capacitor, native plugins, and config are all set up.

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- **Android**: Android Studio + Android SDK
- **iOS**: macOS with Xcode 15+ + CocoaPods (`sudo gem install cocoapods`)

### Install Dependencies

```bash
npm install
```

### Build for Android

```bash
npx cap add android        # First time only — creates android/ folder
npm run cap:sync           # Builds web assets to www/ + syncs to native
npx cap open android       # Opens in Android Studio
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Select a device or emulator
3. Click **Run** (green play button)
4. For a release build: Build > Generate Signed Bundle / APK

### Build for iOS

```bash
npx cap add ios             # First time only — creates ios/ folder
npm run cap:sync            # Builds web assets to www/ + syncs to native
npx cap open ios            # Opens in Xcode
```

In Xcode:
1. Select your development team in Signing & Capabilities
2. Set Bundle Identifier: `com.kaelithruun.app`
3. Select a simulator or connected device
4. Click **Run** (play button)
5. For release: Product > Archive > Distribute App

### After Making Code Changes

```bash
npm run cap:sync            # Re-builds www/ and syncs to native projects
```

---

## Native Features Included

| Feature | Plugin | What It Does |
|---------|--------|-------------|
| **Haptic Feedback** | @capacitor/haptics | Real vibration on attacks, damage, victory, defeat |
| **Status Bar** | @capacitor/status-bar | Dark status bar matching game theme |
| **Splash Screen** | @capacitor/splash-screen | Native splash with game branding |
| **Keyboard** | @capacitor/keyboard | Native keyboard resize handling |
| **Back Button** | @capacitor/app | Android hardware back: closes panels, minimizes app |
| **App Lifecycle** | @capacitor/app | Handles pause/resume, auto-save |
| **Local Storage** | @capacitor/preferences | Native key-value storage (future upgrade path) |

---

## Generating App Icons & Splash Screens

Source assets are in `resources/`:
- `resources/icon.svg` — App icon source
- `resources/splash.svg` — Splash screen source

To generate all required native icon sizes:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

This generates all icon sizes for iOS (20pt through 1024pt) and Android (mdpi through xxxhdpi) plus splash screens.

---

## Google Play Store Deployment

### Prerequisites
- Google Play Developer account ($25 one-time)
- Android Studio

### Steps

1. **Build a signed AAB** in Android Studio:
   - Build > Generate Signed Bundle / APK
   - Choose Android App Bundle (.aab)
   - Create a keystore (save this — you need it for every update)
   - Build the release

2. **Upload to Play Console**:
   - Go to https://play.google.com/console
   - Create new app: "Kaelith Ruun"
   - Upload the `.aab` file
   - Fill in store listing (see Store Listing section)
   - Set Content Rating: ESRB Teen (Fantasy Violence)
   - Set pricing (see Pricing section)
   - Submit for review

---

## Apple App Store Deployment

### Prerequisites
- Apple Developer account ($99/year)
- macOS with Xcode 15+

### Steps

1. **Configure in Xcode**:
   - Set Bundle Identifier: `com.kaelithruun.app`
   - Set Display Name: "Kaelith Ruun"
   - Set Deployment Target: iOS 15.0+
   - Enable "Supports Full Screen"
   - Set Status Bar Style: "Light Content"

2. **Build and Archive**:
   - Product > Archive
   - Upload to App Store Connect via Xcode Organizer

3. **Submit for Review**:
   - App Store Connect > My Apps > New App
   - Fill metadata, screenshots, descriptions
   - Submit for review (typically 24-48 hours)

---

## Web Fallback (Optional)

The game also works in any browser. For web deployment:

- **GitHub Pages**: Enable in repo Settings > Pages (free, simplest)
- **Netlify/Vercel**: Connect repo, auto-deploys on push

The service worker (`sw.js`) enables offline play in browsers. The PWA install prompt only shows in browser mode — it's hidden in the native app.

---

## Store Listing Content

### App Name
**Kaelith Ruun: Shattered Realms**

### Short Description (80 chars)
Dark fantasy text RPG. Forge your hero. Battle the void. Save what remains.

### Full Description
```
A world shattered by an entity called Ruun. A dying sun. Magic that kills as it saves. Welcome to Kaelith Ruun.

FORGE YOUR DESTINY
Choose from 6 unique races — Human, Aelvar, Durgan, Revathi, Ashborn, or Hollow — each with deep lore and unique abilities. Walk the path of the Voidblade, Runecaster, Duskwalker, Soulwarden, or Bloodweaver.

EXPLORE A DYING WORLD
Journey through the Ashen Wastes, the Hollowfen, and the Void Sanctum. Each region tells a story of loss, corruption, and resilience.

TACTICAL COMBAT
Turn-based battles with abilities, items, buffs, and devastating boss fights. Face the Ashen King, the Mother of the Fen, and Ruun itself — the entity that broke the world.

RICH NARRATIVE
Every location, enemy, and NPC has a story. Branching dialogues. Moral choices. A world that feels lived-in and dying.

FEATURES
• 6 playable races with unique traits
• 5 character classes with distinct playstyles
• 3 explorable regions with unique enemies
• Epic boss battles with multiple phases
• NPC dialogue with branching conversations
• Equipment and loot system with rarity tiers
• Quest journal with main and side storylines
• Plays offline — no internet required
• No ads. No pay-to-win. Just adventure.

The world is broken. Will you let it die, or fight for what remains?
```

### Keywords
`rpg, text adventure, dark fantasy, turn-based, offline rpg, story game, medieval, void, quest`

### Category
- Primary: Games > Role Playing
- Secondary: Games > Adventure

### Content Rating
- ESRB: Teen (Fantasy Violence, Mild Language)
- PEGI: 12 (Violence)

### Screenshots Needed
Capture at the following sizes:
- **iPhone 6.7"** (1290 x 2796): Title screen, combat, exploration, character creation, inventory
- **iPhone 6.5"** (1242 x 2688): Same scenes
- **iPad 12.9"** (2048 x 2732): Same scenes
- **Android Phone** (1080 x 1920): Same scenes
- **Android Tablet** (1200 x 1920): Same scenes

Recommended 5-8 screenshots per device showing:
1. Title screen with game logo
2. Character creation (race selection)
3. Story narrative moment
4. Combat vs a boss
5. World map / travel
6. Inventory / equipment
7. NPC dialogue
8. Lore screen

### Promotional Text
"Enter the shattered world of Kaelith Ruun — a dark fantasy text RPG where every choice matters and the void is always watching."

---

## Pricing Strategy

### Option 1: Premium (Recommended)
- Price: $2.99 / $3.99
- No ads, no IAP
- Clean experience, builds trust

### Option 2: Free with Tip Jar
- Free download
- Optional IAP "Support the Developer" ($1.99, $4.99, $9.99)

### Option 3: Free with Cosmetic IAP
- Free download
- Sell cosmetic themes / UI color packs
- Never sell power or gameplay advantage

---

## Pre-Launch Checklist

- [ ] `npm install` runs without errors
- [ ] `npm run cap:sync` completes successfully
- [ ] Android: builds and runs on emulator
- [ ] Android: builds and runs on physical device
- [ ] iOS: builds and runs on simulator
- [ ] iOS: builds and runs on physical device
- [ ] Native haptics working (tap attack button, feel vibration)
- [ ] Status bar styled correctly (dark, matches game)
- [ ] Splash screen shows on cold launch
- [ ] Android back button works (closes panels, doesn't crash)
- [ ] All icon sizes generated via `npx capacitor-assets generate`
- [ ] localStorage save/load verified on device
- [ ] Tested on iPhone SE (smallest common screen)
- [ ] Tested on iPhone 15 Pro (dynamic island)
- [ ] Tested on Android device (various sizes)
- [ ] Privacy policy page created (required for both stores)
- [ ] App screenshots captured at required resolutions

---

## Post-Launch

1. **Monitor crash reports** via Play Console / App Store Connect
2. **Respond to reviews** within 24-48 hours
3. **Submit updates** regularly (content updates, bug fixes)
4. **Track installs** and retention via store analytics
5. **Consider adding**:
   - Push notifications for daily rewards
   - Cloud save sync (Firebase/Supabase)
   - Achievement system
   - Additional regions / story content
   - In-app rating prompt
