// ============================================
// NPC DATA
// ============================================

const NPCS = {
    granny_moss: {
        name: 'Granny Moss',
        icon: '🧙',
        title: 'Witch of the Hollowfen',
        location: 'witchs_hut',
        description: 'An ancient woman whose eyes are entirely black. She speaks to the swamp, and the swamp answers.',
        dialogues: {
            initial: {
                text: "Well, well. Another lost soul stumbles into my parlor. The frogs said you'd come — said you smelled of purpose. Or perhaps that was just the ash. Sit, sit. Tea?",
                choices: [
                    { text: "I'm looking for a way deeper into the Fen.", next: 'fen_path' },
                    { text: "What are you?", next: 'about_self' },
                    { text: "Do you have anything to trade?", next: 'trade' },
                    { text: "No thanks. I'll be going.", next: 'farewell' }
                ]
            },
            fen_path: {
                text: "Deeper? Ha! Most folk want OUT of the fen, not further in. But I see the fire in you. The Mother's nest lies at the heart — follow the bioluminescent fungi. They grow toward her. Everything here grows toward her. Even me.",
                choices: [
                    { text: "How do I defeat the Mother?", next: 'mother_advice' },
                    { text: "Thank you for the information.", next: 'farewell_kind' }
                ]
            },
            mother_advice: {
                text: "Defeat her? Child, she IS the fen. You can't kill a swamp. But... you can drain it. She's weakest when she surfaces. Keep her above water. Strike the gills behind her jaw — she can't breathe air forever. And for void's sake, don't let her submerge, or she'll heal everything you've done.",
                choices: [
                    { text: "I'll remember that.", next: 'farewell_kind' }
                ],
                giveHint: 'mother_of_the_fen'
            },
            about_self: {
                text: "What am I? I'm old. Old enough to remember the Silverwood before it drowned. I was a druid once, you know. Tended the great oaks. Now I tend mushrooms and leeches. Adaptation, dear. That's the only magic that truly matters.",
                choices: [
                    { text: "How have you survived here so long?", next: 'survival' },
                    { text: "I have other questions.", next: 'initial' }
                ]
            },
            survival: {
                text: "The Mother lets me live because I'm useful. I treat the sick creatures of the fen, and in return, she doesn't eat me. It's a simple arrangement. I recommend you make your own arrangement with the powerful things in this world. Or become powerful enough that you don't need to.",
                choices: [
                    { text: "Wise words.", next: 'farewell_kind' }
                ]
            },
            trade: {
                text: "I've a few things that might interest a wanderer like yourself. Potions, mostly. The fen provides interesting ingredients.",
                choices: [
                    { text: "[Buy] Health Potion (30g)", next: 'buy_health', cost: 30, item: 'greater_health_potion' },
                    { text: "[Buy] Antidote (15g)", next: 'buy_antidote', cost: 15, item: 'antidote' },
                    { text: "[Buy] Elixir of Power (50g)", next: 'buy_elixir', cost: 50, item: 'elixir_of_power' },
                    { text: "Never mind.", next: 'farewell' }
                ]
            },
            buy_health: { text: "Drink it when the darkness closes in. There's always more darkness.", choices: [{ text: "Thanks.", next: 'trade' }] },
            buy_antidote: { text: "Smart. The fen's creatures love their venom.", choices: [{ text: "Thanks.", next: 'trade' }] },
            buy_elixir: { text: "Power in a bottle. If only everything were so simple.", choices: [{ text: "Thanks.", next: 'trade' }] },
            farewell: {
                text: "Off you go then. Try not to die. Dead visitors are terrible conversationalists.",
                choices: []
            },
            farewell_kind: {
                text: "You've got a good head on your shoulders. Keep it there. The fen has a habit of removing them.",
                choices: []
            }
        }
    },

    wandering_merchant: {
        name: 'Drifter Kael',
        icon: '🎒',
        title: 'Wandering Merchant',
        location: null,
        description: 'A mysterious trader who appears in the most unlikely places, always with exactly what you need.',
        dialogues: {
            initial: {
                text: "Ah, a customer! You'd be amazed how rare those are in a dying world. Browse my wares — everything's priced to move, because I certainly am.",
                choices: [
                    { text: "What do you have?", next: 'trade' },
                    { text: "How do you survive out here?", next: 'about_self' },
                    { text: "I'm not interested.", next: 'farewell' }
                ]
            },
            trade: {
                text: "I've scavenged the finest goods from ruins across the shattered lands. Take a look!",
                choices: [
                    { text: "[Buy] Health Vial (12g)", next: 'buy_hv', cost: 12, item: 'health_vial' },
                    { text: "[Buy] Mana Vial (12g)", next: 'buy_mv', cost: 12, item: 'mana_vial' },
                    { text: "[Buy] Smoke Bomb (20g)", next: 'buy_sb', cost: 20, item: 'smoke_bomb' },
                    { text: "That's all for now.", next: 'farewell' }
                ]
            },
            buy_hv: { text: "A wise purchase. Health is wealth, especially when you're bleeding.", choices: [{ text: "More shopping.", next: 'trade' }] },
            buy_mv: { text: "For the magically inclined. Or the magically desperate.", choices: [{ text: "More shopping.", next: 'trade' }] },
            buy_sb: { text: "The coward's best friend. No shame in living to fight another day.", choices: [{ text: "More shopping.", next: 'trade' }] },
            about_self: {
                text: "Survive? Ha! I don't survive — I THRIVE. The secret is simple: never be anywhere long enough for things to kill you. Also, I'm faster than I look.",
                choices: [
                    { text: "Fair enough.", next: 'initial' }
                ]
            },
            farewell: {
                text: "Safe travels, friend. If such a thing exists anymore.",
                choices: []
            }
        }
    },

    spirit_of_aldric: {
        name: 'Spirit of Aldric',
        icon: '👻',
        title: 'The True King',
        location: 'ashen_throne',
        description: 'The lingering consciousness of King Aldric IV, separate from the mad specter that now wears his crown.',
        dialogues: {
            initial: {
                text: "You... you can see me? Most cannot. The Ashen King — that THING on my throne — it wears my face but it is not me. I am what remains of the real Aldric. A whisper. A memory. Please... free my people from the mockery of my rule.",
                choices: [
                    { text: "How can I defeat the Ashen King?", next: 'advice' },
                    { text: "What happened to you?", next: 'story' },
                    { text: "I'll avenge you.", next: 'farewell_kind' }
                ]
            },
            advice: {
                text: "The creature feeds on the ash — the remains of my kingdom sustain it. When it conjures its Crown of Flames, that is when it draws power from the ruins. Strike then, while its focus is split. And whatever you do, don't let it reach its desperate state. At low health, it draws on the void itself.",
                choices: [
                    { text: "I understand.", next: 'farewell_kind' }
                ],
                giveHint: 'the_ashen_king'
            },
            story: {
                text: "When the fire came, I refused to leave. A king does not abandon his people, I thought. Noble. Foolish. The fire consumed me, but my will... my will would not break. So the void gave me a terrible gift: existence without peace. The thing on the throne is my rage, given form. I am merely the sorrow left behind.",
                choices: [
                    { text: "I'm sorry.", next: 'farewell_kind' }
                ]
            },
            farewell_kind: {
                text: "Go with what blessing a dead king can give. End this. Let my people rest. Let ME rest.",
                choices: []
            }
        }
    }
};
