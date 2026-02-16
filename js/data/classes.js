// ============================================
// CLASSES DATA
// ============================================

const CLASSES = {
    voidblade: {
        name: 'Voidblade',
        icon: '⚔️',
        description: 'Warriors who channel the emptiness between worlds into their strikes. Each blow tears at the fabric of reality itself.',
        lore: 'The Voidblade order was founded by Kael the Unmaker, who discovered that the spaces between stars held power greater than any steel.',
        primaryStat: 'str',
        secondaryStat: 'dex',
        stats: { str: 3, dex: 2, int: 0, wis: 0, con: 2, cha: 0 },
        hpPerLevel: 12,
        mpPerLevel: 4,
        startingAbilities: [
            { name: 'Void Strike', mpCost: 0, damage: [8, 14], type: 'physical', desc: 'A basic strike infused with void energy.' },
            { name: 'Rift Cleave', mpCost: 8, damage: [15, 25], type: 'physical', desc: 'Tear through space to strike with devastating force.' },
            { name: 'Null Guard', mpCost: 5, damage: [0, 0], type: 'buff', desc: 'Envelop yourself in void energy, reducing damage taken by 40% for 2 turns.' }
        ],
        startingEquipment: ['rusted_void_sword', 'tattered_cloak', 'health_vial']
    },
    runecaster: {
        name: 'Runecaster',
        icon: '🔮',
        description: 'Scholars of the ancient rune-language that predates mortal speech. Their words reshape reality, but each incantation exacts a toll.',
        lore: 'The runes were not invented — they were discovered, carved into the bones of the world by whatever force created it. Runecasters merely read aloud what was always written.',
        primaryStat: 'int',
        secondaryStat: 'wis',
        stats: { str: 0, dex: 1, int: 4, wis: 2, con: 0, cha: 0 },
        hpPerLevel: 6,
        mpPerLevel: 14,
        startingAbilities: [
            { name: 'Arcane Bolt', mpCost: 3, damage: [10, 16], type: 'magical', desc: 'Launch a bolt of pure arcane energy.' },
            { name: 'Runefire', mpCost: 10, damage: [20, 35], type: 'magical', element: 'fire', desc: 'Invoke the rune of fire to immolate your enemy.' },
            { name: 'Mana Shield', mpCost: 8, damage: [0, 0], type: 'buff', desc: 'Absorb damage using your mana pool for 3 turns.' }
        ],
        startingEquipment: ['apprentice_staff', 'frayed_robes', 'mana_vial']
    },
    duskwalker: {
        name: 'Duskwalker',
        icon: '🗡️',
        description: 'Assassins who move through shadow as easily as breathing. They strike from the boundary between light and dark.',
        lore: 'Duskwalkers learn their art in the Twilight Monastery, where the sun never fully rises and never fully sets. They say a true Duskwalker casts no shadow — because they ARE the shadow.',
        primaryStat: 'dex',
        secondaryStat: 'cha',
        stats: { str: 1, dex: 4, int: 0, wis: 1, con: 0, cha: 1 },
        hpPerLevel: 8,
        mpPerLevel: 8,
        startingAbilities: [
            { name: 'Shadow Strike', mpCost: 0, damage: [6, 12], type: 'physical', desc: 'A swift strike from the shadows.' },
            { name: 'Umbral Step', mpCost: 6, damage: [12, 22], type: 'physical', desc: 'Teleport behind the enemy and strike a vital point.' },
            { name: 'Venom Blade', mpCost: 5, damage: [5, 8], type: 'physical', desc: 'Coat your blade in shadow venom. Deals poison damage over 3 turns.' }
        ],
        startingEquipment: ['chipped_daggers', 'shadow_cowl', 'smoke_bomb']
    },
    soulwarden: {
        name: 'Soulwarden',
        icon: '🛡️',
        description: 'Guardians who bind lost souls to their armor, creating an unbreakable shield of spectral energy. Part warrior, part medium.',
        lore: 'Where others fear the dead, Soulwardens embrace them. Each spirit bound to their shield chose to stay — a volunteer army of the departed who refuse to let the living fall.',
        primaryStat: 'con',
        secondaryStat: 'wis',
        stats: { str: 2, dex: 0, int: 0, wis: 2, con: 4, cha: -1 },
        hpPerLevel: 14,
        mpPerLevel: 6,
        startingAbilities: [
            { name: 'Shield Bash', mpCost: 0, damage: [6, 10], type: 'physical', desc: 'Slam your spectral shield into the enemy.' },
            { name: 'Soul Barrier', mpCost: 8, damage: [0, 0], type: 'buff', desc: 'Summon a barrier of souls, absorbing the next 25 damage.' },
            { name: 'Reaping Strike', mpCost: 6, damage: [10, 18], type: 'physical', desc: 'Strike with the energy of bound souls. Heals for 30% of damage dealt.' }
        ],
        startingEquipment: ['wardens_mace', 'soul_shield', 'health_vial']
    },
    bloodweaver: {
        name: 'Bloodweaver',
        icon: '🩸',
        description: 'Forbidden practitioners who wield their own vitality as a weapon. Every spell costs blood, but the power drawn from sacrifice is unmatched.',
        lore: 'The Church of the Dying Sun branded Bloodweavers as heretics, but in the darkest hours of the Sundering, it was blood magic that held the final gate. History forgets what doctrine cannot forgive.',
        primaryStat: 'int',
        secondaryStat: 'con',
        stats: { str: 0, dex: 1, int: 3, wis: 1, con: 2, cha: 0 },
        hpPerLevel: 10,
        mpPerLevel: 10,
        startingAbilities: [
            { name: 'Blood Bolt', mpCost: 0, damage: [8, 14], type: 'magical', desc: 'Hurl a bolt of crystallized blood. Costs 5 HP instead of MP.' },
            { name: 'Crimson Drain', mpCost: 8, damage: [14, 22], type: 'magical', desc: 'Drain the enemy\'s life force. Heals for 50% of damage dealt.' },
            { name: 'Blood Pact', mpCost: 0, damage: [0, 0], type: 'buff', desc: 'Sacrifice 20% HP to gain +50% damage for 3 turns.' }
        ],
        startingEquipment: ['bleeding_focus', 'crimson_wraps', 'blood_flask']
    }
};
