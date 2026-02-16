# Kaelith Ruun — App Store Launch Guide

## Overview

Kaelith Ruun is a PWA (Progressive Web App) built with vanilla HTML/CSS/JS. It can be deployed to both the Google Play Store and Apple App Store by wrapping it in a native shell using TWA (Trusted Web Activity) for Android and WKWebView/Capacitor for iOS.

---

## Option A: Google Play Store (Android)

### Method 1: TWA (Trusted Web Activity) — Recommended

TWA lets you publish your PWA on Play Store with no native code. Google treats it as a first-class app.

#### Prerequisites
- Your PWA hosted on HTTPS (e.g., via GitHub Pages, Netlify, Vercel, or Firebase Hosting)
- A Google Play Developer account ($25 one-time fee)
- Android Studio installed
- Java JDK 11+

#### Steps

1. **Host the PWA**
   ```bash
   # Deploy to GitHub Pages (simplest)
   # Push the repo, enable Pages in Settings > Pages > Source: main branch
   # Your app will be at: https://<username>.github.io/Kaelith-Ruun-/
   ```

2. **Verify Digital Asset Links**
   Create `/.well-known/assetlinks.json` on your hosted domain:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.kaelithruun.app",
       "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
     }
   }]
   ```

3. **Use Bubblewrap CLI (easiest)**
   ```bash
   npm install -g @nicolo-ribaudo/bubblewrap
   bubblewrap init --manifest https://yourdomain.com/manifest.json
   # Follow prompts: set package name, colors, icons
   bubblewrap build
   ```
   This generates a signed APK/AAB ready for upload.

4. **Upload to Play Console**
   - Go to https://play.google.com/console
   - Create new app > "Kaelith Ruun"
   - Upload the `.aab` file from Bubblewrap
   - Fill in store listing (see Store Listing section below)
   - Set Content Rating (PEGI/ESRB — likely "Fantasy Violence")
   - Set pricing: Free (or your price)
   - Submit for review

### Method 2: Capacitor Wrapper

If you need native features (push notifications, in-app purchases):

```bash
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "Kaelith Ruun" com.kaelithruun.app --web-dir .
npx cap add android
npx cap sync
npx cap open android  # Opens Android Studio
```

Build and sign the APK in Android Studio, then upload to Play Console.

---

## Option B: Apple App Store (iOS)

### Prerequisites
- Apple Developer account ($99/year)
- macOS with Xcode installed
- Capacitor or a WebView wrapper

### Steps

1. **Set up Capacitor for iOS**
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli
   npx cap init "Kaelith Ruun" com.kaelithruun.app --web-dir .
   npx cap add ios
   npx cap sync
   npx cap open ios  # Opens Xcode
   ```

2. **Configure in Xcode**
   - Set Bundle Identifier: `com.kaelithruun.app`
   - Set Display Name: "Kaelith Ruun"
   - Configure App Icons (use the SVG icon to generate all required sizes)
   - Set Deployment Target: iOS 14.0+
   - Enable "Supports Full Screen" in General > Deployment Info
   - Set Status Bar Style: "Light Content"

3. **App Icon Generation**
   Generate all required icon sizes from the SVG:
   - 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt, 1024pt
   - Use a tool like https://appicon.co or `npx pwa-asset-generator`

4. **Configure WKWebView Settings**
   In your Capacitor config (`capacitor.config.json`):
   ```json
   {
     "appId": "com.kaelithruun.app",
     "appName": "Kaelith Ruun",
     "webDir": ".",
     "ios": {
       "contentInset": "always",
       "allowsLinkPreview": false,
       "scrollEnabled": false
     },
     "server": {
       "iosScheme": "capacitor"
     }
   }
   ```

5. **Build and Archive**
   - In Xcode: Product > Archive
   - Upload to App Store Connect via Xcode Organizer
   - Fill in App Store listing (see below)

6. **Submit for Review**
   - App Store Connect > My Apps > New App
   - Fill metadata, screenshots, descriptions
   - Submit for review (typically 24-48 hours)

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

Recommended: 5-8 screenshots per device, showing:
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

- [ ] PWA hosted on HTTPS domain
- [ ] Service worker caching all assets for offline play
- [ ] manifest.json validated (use Chrome DevTools > Application)
- [ ] All icon sizes generated (192px, 512px minimum)
- [ ] Tested on iPhone SE (smallest common screen)
- [ ] Tested on iPhone 14 Pro (notch/dynamic island)
- [ ] Tested on Android device (Chrome)
- [ ] Tested on iPad / Android tablet
- [ ] localStorage save/load verified
- [ ] Privacy policy page created (required for both stores)
- [ ] App screenshots captured at required resolutions
- [ ] Digital Asset Links verified (Android TWA)
- [ ] Capacitor build runs without errors (iOS)
- [ ] App icons meet store requirements

---

## Post-Launch

1. **Monitor crash reports** via Play Console / App Store Connect
2. **Respond to reviews** within 24-48 hours
3. **Submit updates** regularly (content updates, bug fixes)
4. **Track installs** and retention via store analytics
5. **Consider adding**:
   - Push notifications for daily rewards
   - Cloud save sync
   - Achievement system
   - Additional regions / story content
