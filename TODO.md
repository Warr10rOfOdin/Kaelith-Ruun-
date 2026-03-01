# TODO

Active development tasks for Kaelith Ruun — Shattered Realms.

---

## Current Priority: Audio & Sound Design

### Sound Integration
- [ ] Map Web Audio API sounds to combat actions
- [ ] Hit impact sounds (light, heavy, critical)
- [ ] Spell cast sounds per element
- [ ] Enemy telegraph warning sound
- [ ] Counter success/fail sounds
- [ ] Victory/defeat stingers

### Combat Refinement
- [ ] Boss-specific environmental mechanics
- [ ] Combat stance system (aggressive/defensive)

---

## Backlog

### World Content
- [ ] Fourth region: The Shattered Spire
- [ ] Dynamic random encounters
- [ ] Deeper NPC dialogue and schedules
- [ ] Environmental puzzles

### Polish
- [ ] Screen transition animations
- [ ] Accessibility options (font size, colorblind)
- [ ] Performance optimization pass
- [ ] Update ARCHITECTURE.md and DEVELOPMENT.md to reflect current HTML5/JS codebase

---

## Recently Completed

- [x] Character Sheet visual overhaul (stat bars, icons, ability cards, skill tree) — `progression.js` + `style.css`
- [x] Journal visual overhaul (quest badges, checkboxes, progress bars) — `progression.js` + `style.css`
- [x] Achievements visual overhaul (badges, progress bar, sorted display) — `progression.js` + `style.css`
- [x] Inventory visual overhaul (equipment grid, rarity glow, item detail) — `inventory.js` + `style.css`
- [x] Enemy behavior AI (aggro/defensive/support weighted selection) — `combat.js` + `enemies.js`
- [x] Elemental resistance/weakness system with Weak!/Resist! labels — `combat.js` + `enemies.js` + `combat.css`
- [x] Weakness discovery tooltip (persists across encounters) — `combat.js` + `combat.css`
- [x] Counter/reaction window during enemy telegraph — `combat.js` + `combat.css`
- [x] Combo chain bonus system (same-element + element-switch) — `combat.js` + `combat.css`
- [x] Per-skill VFX system (fire/ice/lightning/blood/void/heal/buff/multi) — `combat.js` + `combat.css`
- [x] Enemy wind-up animations (physical/magical/heavy) — `combat.css` + `combat.js`
- [x] Status effect overlays (poison/blind/slow/weaken) — `combat.css` + `combat.js`
- [x] Persistent ambient particles per region — `combat.js` + `combat.css`
- [x] Damage-scaled camera shake — `combat.js`
- [x] Procedural battlefield backgrounds (3 regions) — `sprites.js`
- [x] Enemy telegraph/intent system — `combat.js`
- [x] Enemy hit recoil + death animations — `combat.css` + `combat.js`
- [x] Player combat presence in stage — `combat.js` + `combat.css`
- [x] HP bar drain effect + low-HP pulse — `combat.css` + `combat.js`
- [x] Action button grouping with type accents — `combat.js` + `combat.css`
- [x] Combat HTML restructured — `index.html`
- [x] Dark fantasy environment props (altar, banner, ritual circle) — `sprites.js`
- [x] Full UI overhaul (style.css, map.css, combat.css)
- [x] 5 NPC archetype sprites — `sprites.js`
- [x] Player sprite restyled as Kaelith Ruun — `sprites.js`
- [x] Muted dark fantasy palette — `sprites.js`
- [x] Enhanced zone lighting — `sprites.js`
