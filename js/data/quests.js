// ============================================
// QUESTS DATA
// ============================================

const QUESTS = {
    main_quest: {
        name: 'The Unraveling',
        type: 'main',
        description: 'Stop Ruun from unraveling what remains of reality.',
        stages: [
            {
                id: 'awaken',
                name: 'Awakening',
                description: 'You have awoken in the Ashen Wastes with no memory of how you arrived. Find shelter and learn where you are.',
                objectives: [
                    { id: 'explore_outpost', text: 'Explore the Ruined Outpost', completed: false },
                    { id: 'first_combat', text: 'Survive your first encounter', completed: false }
                ],
                xpReward: 50,
                onComplete: 'The wastes are more dangerous than you thought. You need to grow stronger before venturing further.'
            },
            {
                id: 'ashen_throne',
                name: 'The Ashen Throne',
                description: 'The Ashen King rules the wastes from his burning throne. Defeat him to claim the first Key Fragment.',
                objectives: [
                    { id: 'reach_level_3', text: 'Reach level 3', completed: false },
                    { id: 'find_throne', text: 'Reach the Ashen Throne', completed: false },
                    { id: 'defeat_ashen_king', text: 'Defeat the Ashen King', completed: false }
                ],
                xpReward: 150,
                onComplete: 'The Ashen King falls, and with him, the curse that bound the wastes. A path opens to the south — toward the dark swamps of the Hollowfen.'
            },
            {
                id: 'hollowfen_depths',
                name: 'Into the Deep',
                description: 'The Hollowfen hides the second Key Fragment within the lair of the Mother of the Fen.',
                objectives: [
                    { id: 'enter_hollowfen', text: 'Enter the Hollowfen', completed: false },
                    { id: 'find_witch', text: 'Find the Witch of the Fen', completed: false },
                    { id: 'defeat_mother', text: 'Defeat the Mother of the Fen', completed: false }
                ],
                xpReward: 250,
                onComplete: 'The Mother falls, and the fen begins to clear. In the silence, you hear it — a whisper from beyond reality. The Void Sanctum calls.'
            },
            {
                id: 'final_confrontation',
                name: 'The Unraveling',
                description: 'Enter the Void Sanctum and confront Ruun, the entity that shattered the world.',
                objectives: [
                    { id: 'enter_sanctum', text: 'Enter the Void Sanctum', completed: false },
                    { id: 'traverse_hall', text: 'Traverse the Hall of Echoes', completed: false },
                    { id: 'defeat_ruun', text: 'Defeat Ruun, the Unraveler', completed: false }
                ],
                xpReward: 500,
                onComplete: 'Ruun falls. Reality shudders, then holds. The world is still broken — but it will no longer unravel. For the first time in a thousand years, there is hope. What comes next is up to you.'
            },
            {
                id: 'shattered_spire',
                name: 'The Architect\'s Design',
                description: 'Beyond the Void Sanctum lies the Shattered Spire — the place where reality was first broken. The Architect awaits, ready to reshape what remains.',
                objectives: [
                    { id: 'reach_spire', text: 'Reach the Shattered Spire', completed: false },
                    { id: 'explore_archive', text: 'Explore the Crystalline Archive', completed: false },
                    { id: 'ally_outpost', text: 'Gain allies at Skybridge Outpost', completed: false },
                    { id: 'defeat_architect', text: 'Defeat the Architect', completed: false }
                ],
                xpReward: 750,
                onComplete: 'The Architect falls, and the Spire shudders but holds. The fractures in reality begin to mend, crystal by crystal. You have not just saved the world — you have begun to rebuild it.'
            }
        ]
    },

    side_quests: {
        codex_collector: {
            name: 'The Ruun Codex',
            type: 'side',
            description: 'Collect scattered pages of the legendary Ruun Codex.',
            objectives: [
                { id: 'page_1', text: 'Find Codex Page 1 (Ashen Wastes)', completed: false },
                { id: 'page_2', text: 'Find Codex Page 2 (Hollowfen)', completed: false },
                { id: 'page_3', text: 'Find Codex Page 3 (Void Sanctum)', completed: false }
            ],
            xpReward: 200,
            itemReward: 'elixir_of_power',
            onComplete: 'You have assembled the Ruun Codex. Its words pulse with power — the language that created (and can unmake) reality itself. You feel its knowledge seep into your mind.'
        },
        mercy_or_wrath: {
            name: 'Mercy or Wrath',
            type: 'side',
            description: 'A group of bandits in the Scorched Village are terrorizing survivors. Deal with them — your way.',
            objectives: [
                { id: 'find_bandits', text: 'Find the bandit camp', completed: false },
                { id: 'resolve', text: 'Resolve the situation', completed: false }
            ],
            choices: {
                mercy: { text: 'Negotiate peace between the bandits and villagers.', xpReward: 100, karmaChange: 1 },
                wrath: { text: 'Eliminate the bandits by force.', xpReward: 120, karmaChange: -1 }
            },
            onComplete: 'The situation in the Scorched Village has been resolved.'
        },
        lost_patrol: {
            name: 'The Lost Patrol',
            type: 'side',
            description: 'A merchant at the Ruined Outpost begs you to find his missing guards in the Ashen Wastes.',
            objectives: [
                { id: 'find_merchant', text: 'Speak to Merchant Aldric', completed: false },
                { id: 'search_plains', text: 'Search the Scorched Plains', completed: false },
                { id: 'resolve_patrol', text: 'Defeat the ambushers or negotiate', completed: false }
            ],
            xpReward: 120,
            itemReward: 'chainmail_vest',
            onComplete: 'The patrol has been found and the situation resolved. Merchant Aldric is grateful for your aid.'
        },
        haunted_shrine: {
            name: 'The Haunted Shrine',
            type: 'side',
            description: 'Strange lights have been seen near an ancient shrine in the Hollowfen. Investigate the disturbance.',
            objectives: [
                { id: 'find_shrine', text: 'Find the Ancient Shrine', completed: false },
                { id: 'purify_shrine', text: 'Purify the shrine or harness its power', completed: false },
                { id: 'report_shrine', text: 'Return to the herbalist', completed: false }
            ],
            xpReward: 180,
            itemReward: 'greater_health_potion',
            choices: {
                purify: { text: 'Cleanse the dark energy.', xpReward: 150, karmaChange: 1 },
                harness: { text: 'Absorb the shrine\'s power for yourself.', xpReward: 180, karmaChange: -1 }
            },
            onComplete: 'The shrine has been dealt with. The herbalist nods solemnly at your report.'
        },
        dragon_egg: {
            name: 'The Last Ember',
            type: 'side',
            description: 'Deep in the wastes lies a dragon egg, the last of its kind. Some would pay a fortune for it. Others say it should be protected.',
            objectives: [
                { id: 'find_egg', text: 'Find the dragon egg', completed: false },
                { id: 'egg_fate', text: 'Decide the egg\'s fate', completed: false }
            ],
            xpReward: 200,
            choices: {
                protect: { text: 'Hide the egg in a safe place and guard it.', xpReward: 200, karmaChange: 2 },
                sell: { text: 'Sell it to the highest bidder.', xpReward: 150, karmaChange: -2, goldReward: 200 }
            },
            onComplete: 'The fate of the last dragon egg has been decided. History will remember your choice.'
        },
        void_researcher: {
            name: 'Echoes of the Void',
            type: 'side',
            description: 'A mad researcher in the Void Sanctum claims to have found a way to reverse the Sundering — but needs void crystals to prove it.',
            objectives: [
                { id: 'find_researcher', text: 'Find the Void Researcher', completed: false },
                { id: 'collect_crystals', text: 'Collect 3 void crystals', completed: false },
                { id: 'deliver_crystals', text: 'Deliver the crystals', completed: false }
            ],
            xpReward: 250,
            itemReward: 'elixir_of_power',
            onComplete: 'The researcher cackles with glee as the crystals hum with power. Whether this leads to salvation or ruin remains to be seen.'
        },
        bounty_board: {
            name: 'Bounty: The Crimson Fang',
            type: 'side',
            description: 'A bounty has been posted for a notorious bandit leader terrorizing trade routes between the regions.',
            objectives: [
                { id: 'read_bounty', text: 'Read the bounty notice', completed: false },
                { id: 'track_fang', text: 'Track the Crimson Fang', completed: false },
                { id: 'defeat_fang', text: 'Defeat the Crimson Fang', completed: false }
            ],
            xpReward: 220,
            itemReward: 'voidtouched_blade',
            onComplete: 'The Crimson Fang has been brought to justice. The trade routes are safe once more.'
        },
        spire_expedition: {
            name: 'The Shattered Archive',
            type: 'side',
            description: 'The Crystalline Archive holds ancient knowledge, but its guardians have gone mad. Retrieve the Architect\'s blueprints before they are lost forever.',
            objectives: [
                { id: 'enter_archive', text: 'Enter the Crystalline Archive', completed: false },
                { id: 'defeat_guardians', text: 'Defeat 3 Crystal Revenants', completed: false },
                { id: 'find_blueprints', text: 'Find the Architect\'s Blueprints', completed: false },
                { id: 'return_blueprints', text: 'Return to Vael the Runesmith', completed: false }
            ],
            xpReward: 350,
            itemReward: 'resonance_shield',
            onComplete: 'Vael studies the blueprints with trembling hands. "With these, I can restore the Arcane Forge to its full glory. You\'ve given this spire a second chance."'
        },
        crystal_corruption: {
            name: 'The Crystal Corruption',
            type: 'side',
            description: 'Thessaly has discovered that the Spire\'s crystals are slowly being corrupted by a void tendril that survived Ruun\'s defeat. Find and destroy the source.',
            objectives: [
                { id: 'speak_thessaly', text: 'Speak to Thessaly about the corruption', completed: false },
                { id: 'collect_samples', text: 'Collect 5 corrupted crystal samples', completed: false },
                { id: 'find_tendril', text: 'Locate the Void Tendril', completed: false },
                { id: 'destroy_tendril', text: 'Destroy or purify the Void Tendril', completed: false }
            ],
            xpReward: 400,
            choices: {
                destroy: { text: 'Destroy the tendril utterly, eliminating the corruption.', xpReward: 400, karmaChange: 1, itemReward: 'crystallized_mana' },
                purify: { text: 'Purify and harness the tendril\'s energy for the Spire.', xpReward: 350, karmaChange: -1, itemReward: 'amulet_of_the_architect' }
            },
            onComplete: 'The crystal corruption has been dealt with. Thessaly records your actions in her research journal, noting the implications for the Spire\'s future.'
        },
        skybridge_defense: {
            name: 'Skybridge Under Siege',
            type: 'side',
            description: 'Fractured Golems are marching on Skybridge Outpost. Help the residents fortify their defenses and repel the assault.',
            objectives: [
                { id: 'fortify_bridge', text: 'Help fortify the Skybridge', completed: false },
                { id: 'set_traps', text: 'Set crystal resonance traps', completed: false },
                { id: 'repel_wave1', text: 'Repel the first wave of golems', completed: false },
                { id: 'defeat_commander', text: 'Defeat the Golem Commander', completed: false }
            ],
            xpReward: 380,
            itemReward: 'spire_wardens_plate',
            onComplete: 'The Skybridge holds. The residents cheer as the last golem crumbles. Vael presents you with a suit of ancient Warden\'s armor, restored from the Spire\'s vaults.'
        }
    }
};
