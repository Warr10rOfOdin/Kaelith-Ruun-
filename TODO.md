# TODO

Active development tasks for Kaelith Ruun — Shattered Realms.

---

## Current Priority: Combat Phase 2 — Real Immersion

### Per-Skill VFX
- [ ] Fire abilities: expanding flame burst with ember particles
- [ ] Ice abilities: crystalline shard spray with frost overlay
- [ ] Shadow abilities: dark tendrils with purple void glow
- [ ] Blood abilities: crimson drain effect with lifesteal visual
- [ ] Physical abilities: enhanced slash arcs with directional trails

### Enemy Attack Animations
- [ ] Visible wind-up animation before enemy strikes (scale up, lean forward)
- [ ] Different wind-up styles per enemy type (lunge, cast, roar)
- [ ] Impact timing — delay damage number until animation peak

### Status Effect Visuals
- [ ] Poison: green drip overlay on affected character
- [ ] Blind: dark vignette pulsing on player screen
- [ ] Slow: frost crystal border on player sprite
- [ ] Weaken: cracked/dim overlay on player
- [ ] Reflect: shimmering barrier around enemy

### Particle Systems
- [ ] Ashen Wastes combat: drifting ember particles (animated)
- [ ] Hollowfen combat: fog wisps and floating spores
- [ ] Void Sanctum combat: purple void energy motes
- [ ] Boss fights: intensified particles during phase transitions

### Sound Integration
- [ ] Map Web Audio API sounds to combat actions
- [ ] Hit impact sounds (light, heavy, critical)
- [ ] Spell cast sounds per element
- [ ] Enemy telegraph warning sound
- [ ] Victory/defeat stingers

---

## Backlog

### Combat Phase 3 — Gameplay Depth
- [ ] Enemy behavior patterns (aggro types, defensive types, support types)
- [ ] Reaction/counter window on telegraphed attacks
- [ ] Combo chain bonuses
- [ ] Elemental weakness/resistance system
- [ ] Boss-specific environmental mechanics

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
