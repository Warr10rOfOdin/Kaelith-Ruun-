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
        }
    }
};
