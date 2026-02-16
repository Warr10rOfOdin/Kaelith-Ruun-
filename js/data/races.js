// ============================================
// RACES DATA
// ============================================

const RACES = {
    human: {
        name: 'Human',
        icon: '👤',
        description: 'Versatile and resilient, humans thrive in every corner of Kaelith Ruun. Their ambition is both their greatest strength and deepest flaw.',
        lore: 'When the Sundering tore the world apart, humans alone refused to retreat into the shadows. They built cities upon the ruins and defied the darkness with fire and iron.',
        stats: { str: 2, dex: 2, int: 2, wis: 2, con: 2, cha: 2 },
        abilities: ['Adaptable: +10% XP gain', 'Resolute: Resist fear effects'],
        hpBonus: 5,
        mpBonus: 5
    },
    aelvar: {
        name: 'Aelvar',
        icon: '🧝',
        description: 'Ancient elven kin touched by the Void. Their silver eyes see truths hidden from mortal sight, but centuries of sorrow weigh upon their souls.',
        lore: 'The Aelvar were the first to hear the Whisper of Ruun. Many fell to madness, but those who survived carry fragments of forbidden knowledge in their blood.',
        stats: { str: 0, dex: 3, int: 4, wis: 3, con: -1, cha: 3 },
        abilities: ['Void Sight: Detect hidden passages', 'Ancient Blood: +15% magic damage'],
        hpBonus: -5,
        mpBonus: 20
    },
    durgan: {
        name: 'Durgan',
        icon: '⛏️',
        description: 'Stoneborn dwarves forged in the deep furnaces of the Undercrag. Their flesh carries traces of living mineral, granting unmatched endurance.',
        lore: 'The Durgan claim their ancestor was a mountain that chose to walk. Whether truth or myth, their connection to stone is undeniable — they can hear the earth groan before it breaks.',
        stats: { str: 4, dex: -1, int: 1, wis: 2, con: 5, cha: 1 },
        abilities: ['Stoneblood: +20% physical resistance', 'Deep Sense: Detect nearby ores and minerals'],
        hpBonus: 20,
        mpBonus: -5
    },
    revathi: {
        name: 'Revathi',
        icon: '🦊',
        description: 'Shapeshifters born from the wild magic of the Thornveil. They walk between beast and mortal, belonging fully to neither world.',
        lore: 'Once guardians of the World-Tree Yggrath, the Revathi scattered when it burned. Now they wander as nomads, seeking a new root to call home.',
        stats: { str: 1, dex: 5, int: 1, wis: 3, con: 1, cha: 1 },
        abilities: ['Wild Shape: Transform in combat for bonus attacks', 'Feral Instinct: Cannot be surprised'],
        hpBonus: 5,
        mpBonus: 10
    },
    ashborn: {
        name: 'Ashborn',
        icon: '🔥',
        description: 'Remnants of a civilization consumed by dragon-fire. Embers still glow beneath their scarred skin, granting power over flame at a terrible cost.',
        lore: 'They were human once, before the Dragon-King Vyreth bathed their city in fire that burned for seven years. Those who survived emerged... changed. Fire does not harm them, but neither does it ever leave them.',
        stats: { str: 3, dex: 2, int: 3, wis: 0, con: 2, cha: 2 },
        abilities: ['Ember Blood: Fire immunity, +25% fire damage', 'Smoldering: Deal passive fire damage to melee attackers'],
        hpBonus: 10,
        mpBonus: 10
    },
    hollow: {
        name: 'Hollow',
        icon: '💀',
        description: 'The death-touched. Souls that clawed their way back from the Abyss, carrying whispers of what lies beyond. Feared and shunned by most.',
        lore: 'No one becomes Hollow by choice. They are mortals who died and returned, but the return is never complete. A part of them remains in the dark, and the dark remembers.',
        stats: { str: 1, dex: 2, int: 5, wis: 1, con: 0, cha: 3 },
        abilities: ['Death\'s Embrace: Drain life with attacks', 'Spectral Step: Phase through thin walls'],
        hpBonus: -10,
        mpBonus: 25
    }
};
