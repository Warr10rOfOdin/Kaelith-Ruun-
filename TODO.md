# TODO

Active development tasks for Kaelith Ruun — Shattered Realms.

---

## Current Priority: Combat Phase 3 — Gameplay Depth

### Enemy Behavior Patterns
- [ ] Aggro types: rush attacks, close-range focus
- [ ] Defensive types: buff/shield-heavy, punish overcommit
- [ ] Support types: heal/debuff-focused enemies
- [ ] Boss-specific environmental mechanics

### Reaction/Counter Window
- [ ] Brief window to tap "Counter" when enemy telegraphs
- [ ] Successful counter reduces damage or reflects partial

### Combo Chain Bonuses
- [ ] Ability combos: using specific abilities in sequence grants bonus
- [ ] Combo UI indicator showing chain progress

### Elemental Resistances
- [ ] Enemies have elemental weaknesses/resistances
- [ ] Damage multipliers shown on hit (Weak! / Resist!)
- [ ] UI tooltip showing enemy weaknesses after first encounter

### Sound Integration
- [ ] Map Web Audio API sounds to combat actions
- [ ] Hit impact sounds (light, heavy, critical)
- [ ] Spell cast sounds per element
- [ ] Enemy telegraph warning sound
- [ ] Victory/defeat stingers

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
