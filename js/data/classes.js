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
        startingEquipment: ['rusted_void_sword', 'tattered_cloak', 'health_vial'],
        skillTree: [
            {
                level: 3,
                choices: [
                    { name: 'Dimensional Slash', mpCost: 10, damage: [12, 20], type: 'physical', desc: 'Slash through dimensional barriers, striking all enemies in an arc of void energy.' },
                    { name: 'Void Armor', mpCost: 8, damage: [0, 0], type: 'buff', duration: 3, desc: 'Encase yourself in hardened void matter, increasing defense by 60% for 3 turns.' }
                ]
            },
            {
                level: 5,
                choices: [
                    { name: 'Reality Rend', mpCost: 15, damage: [25, 40], type: 'physical', desc: 'Tear a gash in reality itself, unleashing catastrophic force on a single target.' },
                    { name: 'Phase Step', mpCost: 10, damage: [8, 14], type: 'physical', desc: 'Step between dimensions to guarantee dodging the next attack, then counter-strike.' }
                ]
            },
            {
                level: 7,
                choices: [
                    { name: 'Annihilating Strike', mpCost: 20, damage: [35, 55], type: 'physical', desc: 'Channel the full emptiness of the void into a single, world-shattering blow.' },
                    { name: 'Void Siphon', mpCost: 14, damage: [18, 28], type: 'physical', lifesteal: 0.4, desc: 'Pierce an enemy with void tendrils that drain their essence, healing for 40% of damage dealt.' }
                ]
            },
            {
                level: 9,
                choices: [
                    { name: 'Unmaking', mpCost: 30, damage: [50, 80], type: 'physical', desc: 'Unmake the bonds that hold your enemy together — a devastating strike that erases matter itself.' },
                    { name: 'Rift Walk', mpCost: 25, damage: [12, 20], type: 'physical', hits: 3, desc: 'Open three rifts simultaneously and strike through each one in rapid succession.' }
                ]
            }
        ]
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
        startingEquipment: ['apprentice_staff', 'frayed_robes', 'mana_vial'],
        skillTree: [
            {
                level: 3,
                choices: [
                    { name: 'Frost Rune', mpCost: 8, damage: [14, 22], type: 'magical', element: 'ice', debuff: 'slow', desc: 'Inscribe a rune of bitter cold that damages and slows the enemy.' },
                    { name: 'Rune Ward', mpCost: 6, damage: [0, 0], type: 'buff', absorb: 30, desc: 'Trace a protective ward that absorbs up to 30 points of magical damage.' }
                ]
            },
            {
                level: 5,
                choices: [
                    { name: 'Chain Lightning', mpCost: 14, damage: [18, 30], type: 'magical', element: 'lightning', hits: 2, desc: 'Unleash a bolt of lightning that arcs between targets, striking twice.' },
                    { name: 'Healing Rune', mpCost: 12, damage: [0, 0], type: 'heal', restore: [30, 50], desc: 'Activate a rune of restoration, healing 30 to 50 HP.' }
                ]
            },
            {
                level: 7,
                choices: [
                    { name: 'Meteor Rune', mpCost: 22, damage: [35, 55], type: 'magical', element: 'fire', desc: 'Call down a rune-inscribed meteor from the heavens, dealing devastating fire damage.' },
                    { name: 'Temporal Rune', mpCost: 20, damage: [0, 0], type: 'buff', extraTurn: true, desc: 'Bend time with an ancient rune, granting yourself an additional turn.' }
                ]
            },
            {
                level: 9,
                choices: [
                    { name: 'Runefire Storm', mpCost: 30, damage: [45, 70], type: 'magical', element: 'all', desc: 'Unleash a cataclysmic storm of all elemental runes at once, annihilating everything in its path.' },
                    { name: 'Arcane Mastery', mpCost: 25, damage: [0, 0], type: 'buff', duration: 5, spellCostReduction: 0.5, desc: 'Enter a state of arcane transcendence — all spells cost 50% less MP for 5 turns.' }
                ]
            }
        ]
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
        startingEquipment: ['chipped_daggers', 'shadow_cowl', 'smoke_bomb'],
        skillTree: [
            {
                level: 3,
                choices: [
                    { name: 'Smoke Bomb', mpCost: 6, damage: [0, 0], type: 'buff', duration: 2, dodgeBonus: 0.8, desc: 'Hurl a smoke bomb at your feet, increasing dodge chance by 80% for 2 turns.' },
                    { name: 'Backstab', mpCost: 8, damage: [16, 26], type: 'physical', critBonus: 0.2, desc: 'Drive your blade into a vital point with deadly precision. +20% critical hit chance.' }
                ]
            },
            {
                level: 5,
                choices: [
                    { name: 'Fan of Knives', mpCost: 12, damage: [10, 16], type: 'physical', hits: 3, desc: 'Hurl a spread of poisoned knives, striking the enemy three times in rapid succession.' },
                    { name: 'Shadow Meld', mpCost: 10, damage: [0, 0], type: 'buff', duration: 1, guaranteedCrit: true, desc: 'Meld into the shadows, becoming invisible. Your next attack is a guaranteed critical hit.' }
                ]
            },
            {
                level: 7,
                choices: [
                    { name: 'Death Mark', mpCost: 15, damage: [0, 0], type: 'debuff', duration: 3, damageAmplify: 0.5, desc: 'Mark an enemy for death. The marked target takes 50% increased damage for 3 turns.' },
                    { name: 'Assassinate', mpCost: 18, damage: [30, 50], type: 'physical', executeThreshold: 0.4, desc: 'Execute a lethal finishing blow. Only usable on enemies below 40% HP.' }
                ]
            },
            {
                level: 9,
                choices: [
                    { name: 'Thousand Cuts', mpCost: 25, damage: [8, 14], type: 'physical', hits: 5, desc: 'Become a blur of steel, delivering five devastating strikes in the blink of an eye.' },
                    { name: 'Shadow Clone', mpCost: 22, damage: [12, 18], type: 'summon', duration: 3, desc: 'Split your shadow into a fighting clone that attacks independently for 3 turns.' }
                ]
            }
        ]
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
        startingEquipment: ['wardens_mace', 'soul_shield', 'health_vial'],
        skillTree: [
            {
                level: 3,
                choices: [
                    { name: 'Soul Heal', mpCost: 8, damage: [0, 0], type: 'heal', restore: [20, 35], desc: 'Channel the warmth of bound spirits to mend your wounds, restoring 20-35 HP.' },
                    { name: 'Spectral Strike', mpCost: 7, damage: [12, 20], type: 'magical', piercing: true, desc: 'Strike with pure soul energy that bypasses all physical defenses.' }
                ]
            },
            {
                level: 5,
                choices: [
                    { name: 'Mass Ward', mpCost: 14, damage: [0, 0], type: 'buff', duration: 2, damageReduction: 0.5, desc: 'Raise a massive ward of spectral energy, reducing all incoming damage by 50% for 2 turns.' },
                    { name: 'Spirit Lance', mpCost: 12, damage: [20, 32], type: 'magical', bonusVsUndead: true, desc: 'Hurl a lance of concentrated soul energy. Deals bonus damage against undead enemies.' }
                ]
            },
            {
                level: 7,
                choices: [
                    { name: 'Resurrection', mpCost: 20, damage: [0, 0], type: 'heal', resurrect: true, hpThreshold: 0.2, restorePercent: 0.6, desc: 'Call upon the departed to pull you from death\'s edge. Restores to 60% HP when below 20%.' },
                    { name: 'Soul Storm', mpCost: 18, damage: [28, 42], type: 'magical', lifesteal: 0.2, desc: 'Unleash a maelstrom of anguished spirits that damages enemies and heals you for 20%.' }
                ]
            },
            {
                level: 9,
                choices: [
                    { name: 'Immortal Vigil', mpCost: 28, damage: [0, 0], type: 'buff', duration: 2, invulnerable: true, desc: 'The bound souls form an impenetrable cocoon. You cannot die for 2 turns.' },
                    { name: 'Soul Judgement', mpCost: 25, damage: [40, 65], type: 'magical', lifesteal: 0.3, desc: 'Pass judgement through the eyes of the dead, dealing massive damage and healing for 30%.' }
                ]
            }
        ]
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
        startingEquipment: ['bleeding_focus', 'crimson_wraps', 'blood_flask'],
        skillTree: [
            {
                level: 3,
                choices: [
                    { name: 'Blood Thorns', mpCost: 7, damage: [12, 20], type: 'magical', reflectDamage: true, duration: 2, desc: 'Grow thorns of crystallized blood from your skin. Damages the enemy and reflects damage back to attackers for 2 turns.' },
                    { name: 'Sanguine Burst', mpCost: 0, damage: [15, 25], type: 'magical', hpCost: 10, desc: 'Detonate your own blood in a violent burst. Costs 10 HP instead of MP.' }
                ]
            },
            {
                level: 5,
                choices: [
                    { name: 'Hemorrhage', mpCost: 10, damage: [8, 12], type: 'magical', dot: true, dotDuration: 4, desc: 'Open cursed wounds that refuse to close, dealing 8-12 damage per turn for 4 turns.' },
                    { name: 'Bloodshield', mpCost: 12, damage: [0, 0], type: 'buff', shieldPercent: 0.2, desc: 'Harden your blood into a protective barrier. Gain a shield equal to 20% of your max HP.' }
                ]
            },
            {
                level: 7,
                choices: [
                    { name: 'Exsanguinate', mpCost: 16, damage: [25, 40], type: 'magical', lifesteal: 0.6, desc: 'Rip the blood from your enemy\'s body, dealing heavy damage and healing for 60% of damage dealt.' },
                    { name: 'Blood Frenzy', mpCost: 14, damage: [0, 0], type: 'buff', damageBonus: 0.8, selfDamagePercent: 0.15, desc: 'Enter a maddened frenzy. Gain +80% damage but take 15% of your max HP each turn.' }
                ]
            },
            {
                level: 9,
                choices: [
                    { name: 'Sanguine Nova', mpCost: 25, damage: [45, 70], type: 'magical', lifesteal: 0.4, desc: 'Erupt in a supernova of blood magic, obliterating enemies and healing for 40% of damage dealt.' },
                    { name: 'Crimson Apotheosis', mpCost: 0, damage: [0, 0], type: 'buff', hpCostPercent: 0.3, allStatsBonus: 1.0, duration: 3, desc: 'Sacrifice 30% of your HP to transcend mortal limits. All stats doubled for 3 turns.' }
                ]
            }
        ]
    }
};
