// ============================================
// WORLD DATA
// ============================================

const WORLD = {
    regions: {
        ashen_wastes: {
            name: 'The Ashen Wastes',
            icon: '🏚️',
            description: 'A desolate expanse of scorched earth and crumbling ruins — the remains of a kingdom consumed by the Sundering.',
            levelRange: [1, 4],
            enemies: ['void_rat', 'ashen_wraith', 'scorched_bandit', 'ember_hound'],
            boss: 'the_ashen_king',
            locations: ['ruined_outpost', 'scorched_village', 'ashen_throne'],
            unlocked: true,
            explored: false,
            ambientText: [
                'Ash drifts like grey snow across the cracked earth.',
                'The wind carries the faint smell of something long-burned.',
                'A distant structure crumbles, sending up a plume of dust.',
                'You hear what might be weeping, but it could be the wind.',
                'Faint embers still glow in cracks in the ground, even after all these years.'
            ]
        },
        hollowfen: {
            name: 'The Hollowfen',
            icon: '🌿',
            description: 'A vast swamp of black water and twisted trees. Things move beneath the surface. Things with too many eyes.',
            levelRange: [3, 6],
            enemies: ['bog_crawler', 'fen_witch', 'drowned_knight'],
            boss: 'mother_of_the_fen',
            locations: ['sunken_chapel', 'witchs_hut', 'heart_of_the_fen'],
            unlocked: false,
            unlockCondition: 'Defeat the Ashen King',
            explored: false,
            ambientText: [
                'Bubbles rise from the dark water, releasing a sulfurous stench.',
                'Something large shifts beneath the surface of the bog.',
                'Bioluminescent fungi cast an eerie green glow on twisted roots.',
                'A chorus of frogs falls silent as you approach. Then resumes behind you.',
                'The mist here is so thick you can barely see your own hands.'
            ]
        },
        void_sanctum: {
            name: 'The Void Sanctum',
            icon: '🌀',
            description: 'A fortress that exists between realities. Its halls shift and change, and the walls whisper in a language that predates creation.',
            levelRange: [5, 10],
            enemies: ['void_acolyte', 'reality_shard', 'shadow_sentinel'],
            boss: 'ruun_the_unraveler',
            locations: ['outer_gate', 'hall_of_echoes', 'throne_of_unmaking'],
            unlocked: false,
            unlockCondition: 'Defeat the Mother of the Fen',
            explored: false,
            ambientText: [
                'The walls ripple like water when you look away.',
                'You hear your own footsteps from a direction you have not yet walked.',
                'Gravity shifts momentarily, and you grip the wall for balance.',
                'A door you passed through moments ago now leads somewhere different.',
                'The whispers grow louder. You almost understand them. Almost.'
            ]
        }
    },

    locations: {
        // ASHEN WASTES
        ruined_outpost: {
            name: 'Ruined Outpost',
            icon: '🏚️',
            region: 'ashen_wastes',
            description: 'A military outpost shattered by the Sundering. Scavengers and void-touched creatures now call it home.',
            type: 'exploration',
            events: ['combat_random', 'find_supplies', 'rest_spot', 'merchant_wandering'],
            narrative: {
                enter: 'You step through the broken gates of what was once a proud military outpost. The walls still bear the banner of a kingdom that no longer exists — three golden suns on a field of blue, now faded to grey.',
                explore: [
                    'You search through the rubble and find a supply cache, partially intact.',
                    'A rat the size of a dog watches you from a collapsed doorway. Its eyes glow faintly violet.',
                    'Among the debris, you find a soldier\'s journal. The last entry reads: "The sky opened. The sky opened and it LOOKED AT US."'
                ]
            }
        },
        scorched_village: {
            name: 'Scorched Village',
            icon: '🔥',
            region: 'ashen_wastes',
            description: 'The charred remains of a farming village. The fire that consumed it was no ordinary flame.',
            type: 'exploration',
            events: ['combat_random', 'npc_encounter', 'find_supplies'],
            narrative: {
                enter: 'Blackened foundations mark where homes once stood. The ground here is glassy in places — heated beyond what any normal fire could achieve. A few survivors have built shelters from the wreckage.',
                explore: [
                    'A scorched wooden sign reads: "Welcome to Elderhollow — Pop. 342." The number has been crossed out and replaced with "7."',
                    'You find a child\'s toy, half-melted. The sight fills you with a cold anger.',
                    'An elderly survivor beckons you closer. "You look strong," she whispers. "Strong enough to face what lives in the throne room?"'
                ]
            }
        },
        ashen_throne: {
            name: 'The Ashen Throne',
            icon: '👑',
            region: 'ashen_wastes',
            description: 'The ruined palace where the Ashen King holds court over the dead. The final destination in the wastes.',
            type: 'boss',
            events: ['boss_fight'],
            narrative: {
                enter: 'The palace rises from the wasteland like a broken crown. Fire still flickers in its windows after all these centuries — a flame that refuses to die, much like its occupant. The doors hang open, an invitation and a challenge.',
                preBoss: 'You ascend the crumbling stairs to the throne room. There, seated upon a throne of melted gold and charred bone, sits the Ashen King. His crown still burns. His eyes still see. "Another challenger," he rasps, voice like crackling embers. "How... tiresome."'
            }
        },

        // HOLLOWFEN
        sunken_chapel: {
            name: 'Sunken Chapel',
            icon: '⛪',
            region: 'hollowfen',
            description: 'A chapel of the old faith, half-submerged in the black waters of the fen. Something still prays inside.',
            type: 'exploration',
            events: ['combat_random', 'find_supplies', 'rest_spot', 'lore_discovery'],
            narrative: {
                enter: 'The chapel lists to one side, its foundation slowly surrendering to the swamp. Through shattered stained glass, you see the flicker of candlelight. Someone — or something — still tends this place.',
                explore: [
                    'The pews are waterlogged and rotten, but the altar remains pristine. Unnaturally so.',
                    'A drowned knight kneels in prayer before the altar, unmoving. As you approach, its head turns slowly toward you.',
                    'Hidden beneath a loose floor stone, you find a cache sealed with wax. Inside: supplies and a note reading "For whoever comes after us."'
                ]
            }
        },
        witchs_hut: {
            name: "Witch's Hut",
            icon: '🏠',
            region: 'hollowfen',
            description: 'A crooked hut balanced on stilts above the mire. The witch within may help you — for a price.',
            type: 'npc',
            events: ['npc_dialogue', 'trade', 'quest'],
            npc: 'granny_moss',
            narrative: {
                enter: 'The hut seems to watch you approach, its windows like suspicious eyes. Smoke rises from a chimney shaped like a serpent. Before you can knock, the door creaks open. "I\'ve been expecting you," cackles a voice from within. "The frogs told me you were coming."'
            }
        },
        heart_of_the_fen: {
            name: 'Heart of the Fen',
            icon: '🐍',
            region: 'hollowfen',
            description: 'The deepest point of the Hollowfen, where the Mother dwells in a nest of bones and roots.',
            type: 'boss',
            events: ['boss_fight'],
            narrative: {
                enter: 'The trees here grow in spirals, their roots forming a natural amphitheater around a pool of black water. The air is thick with the stench of decay and the buzz of insects the size of your fist. Something vast moves beneath the water.',
                preBoss: 'The water erupts. A serpentine form, easily thirty meters long, rises from the depths. Its scales are the color of swamp water, its eyes ancient and knowing. "Little morsel," it hisses, "you have wandered far from the dry lands."'
            }
        },

        // VOID SANCTUM
        outer_gate: {
            name: 'The Outer Gate',
            icon: '🚪',
            region: 'void_sanctum',
            description: 'The entrance to the Void Sanctum. Reality begins to fray at its threshold.',
            type: 'exploration',
            events: ['combat_random', 'puzzle', 'lore_discovery'],
            narrative: {
                enter: 'The gate is not a physical thing — it is an absence. A place where the world simply stops, and something else begins. The air tastes like static. Your shadow behaves strangely here, moving a half-second behind you.',
                explore: [
                    'An acolyte\'s journal lies open: "Day 47. I can see through the walls now. I wish I couldn\'t."',
                    'The floor beneath you shows a different room than the one you\'re standing in.',
                    'You find runes carved into the threshold. Reading them makes your nose bleed, but you understand: "WHAT ENTERS MAY NOT LEAVE UNCHANGED."'
                ]
            }
        },
        hall_of_echoes: {
            name: 'Hall of Echoes',
            icon: '🔊',
            region: 'void_sanctum',
            description: 'A corridor that echoes with the voices of every soul that has walked it. Some of those voices are your own.',
            type: 'exploration',
            events: ['combat_random', 'lore_discovery', 'find_supplies'],
            narrative: {
                enter: 'The hall stretches impossibly long. Your footsteps echo, but the echoes say different words than your feet. You hear your own voice from the future, warning you — but the words are garbled, distorted by layers of reality.',
                explore: [
                    'You hear a future version of yourself scream. Then silence. You try not to think about it.',
                    'A mirror shows you — but older, scarred, wearing armor you don\'t own. The reflection mouths: "Remember."',
                    'Among the echoes, one voice stands out: Ruun itself, murmuring the equations that hold reality together.'
                ]
            }
        },
        throne_of_unmaking: {
            name: 'Throne of Unmaking',
            icon: '🌀',
            region: 'void_sanctum',
            description: 'The heart of the Void Sanctum. Here sits Ruun — the entity that shattered the world. The final confrontation.',
            type: 'boss',
            events: ['boss_fight'],
            narrative: {
                enter: 'The throne room exists in all realities and none. The walls show infinite versions of you approaching infinite thrones. At the center, a being of pure void sits upon a throne made of unraveled reality itself.',
                preBoss: 'Ruun does not have a face, but you feel it smile. "You\'ve come so far," it says, its voice the absence of sound. "Through ash and fen and shadow. And now you stand before the end of everything." It rises. "Let us see if you are worth the world I unmade."'
            }
        }
    }
};
