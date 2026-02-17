// ============================================
// NPC DATA
// ============================================

const NPCS = {
    // ---- VILLAGE NPCs ----
    emberhold_blacksmith: {
        name: 'Tormund',
        icon: '🔨',
        title: 'Blacksmith of Emberhold',
        location: 'emberhold',
        description: 'A burly man with burns up both arms. He forges tools and weapons from scrap metal and sheer stubbornness.',
        dialogues: {
            initial: {
                text: "Steel and fire — the only two things I trust in this world. You look like someone who could use both. My forge is open if you've got coin, or if you need repairs.",
                choices: [
                    { text: "Show me your wares.", next: 'shop', shopType: 'blacksmith' },
                    { text: "What can you tell me about Emberhold?", next: 'about_town' },
                    { text: "I'll be going.", next: 'farewell' }
                ]
            },
            about_town: {
                text: "We built this place from nothing after the Sundering. Sixty-three souls, give or take. The walls keep most things out, but the wastes are getting worse. More creatures every week. If you're the fighting type, we could use someone like you.",
                choices: [
                    { text: "I'll do what I can.", next: 'farewell_kind' },
                    { text: "Let me see your stock.", next: 'shop', shopType: 'blacksmith' }
                ]
            },
            shop: {
                text: "Take a look. Everything's hand-forged right here in Emberhold. Nothing fancy, but it'll keep you alive — and that's what counts.",
                choices: [],
                isShop: true,
                shopType: 'blacksmith'
            },
            farewell: {
                text: "Watch yourself out there. The wastes don't forgive mistakes.",
                choices: []
            },
            farewell_kind: {
                text: "Good. We need more fighters and fewer corpses. Come back alive and I'll have something special on the anvil for you.",
                choices: []
            }
        }
    },
    emberhold_herbalist: {
        name: 'Miriel',
        icon: '🌿',
        title: 'Herbalist of Emberhold',
        location: 'emberhold',
        description: 'A quiet woman who grows medicinal herbs in impossible conditions. Her remedies have saved more lives than any sword.',
        dialogues: {
            initial: {
                text: "The wastes may be dead, but life finds a way. Even here, things grow — if you know where to look. I've got salves, potions, and remedies. What do you need?",
                choices: [
                    { text: "What do you have for sale?", next: 'shop', shopType: 'herbalist' },
                    { text: "How do you grow anything here?", next: 'about_garden' },
                    { text: "Nothing right now, thanks.", next: 'farewell' }
                ]
            },
            about_garden: {
                text: "Ember roots thrive in heat — the hotter, the better. I've got a patch growing right next to the forge exhaust. The trick is knowing what wants to grow, not forcing what doesn't. Same lesson applies to people, I find.",
                choices: [
                    { text: "Could I grow things at my camp?", next: 'garden_advice' },
                    { text: "Let me see your remedies.", next: 'shop', shopType: 'herbalist' }
                ]
            },
            garden_advice: {
                text: "With the right setup? Absolutely. Build a garden plot, keep it sheltered from the ash wind, and start with ember roots — they're nearly impossible to kill. Once you've got a garden going, you'll never run out of remedies.",
                choices: [
                    { text: "Good advice. Thanks.", next: 'farewell_kind' }
                ]
            },
            shop: {
                text: "Here's what I've got. Everything's fresh — well, as fresh as anything gets in the wastes.",
                choices: [],
                isShop: true,
                shopType: 'herbalist'
            },
            farewell: { text: "Stay safe. And eat something — you look half-starved.", choices: [] },
            farewell_kind: { text: "You've got good instincts. Trust them.", choices: [] }
        }
    },
    emberhold_innkeeper: {
        name: 'Old Renna',
        icon: '🍺',
        title: 'Innkeeper of Emberhold',
        location: 'emberhold',
        description: 'A stout woman who runs the only inn in Emberhold. Her stew is legendary, and her patience is not.',
        dialogues: {
            initial: {
                text: "Welcome to the Ember's Rest — only inn in the wastes, so lower your standards accordingly. I've got stew, beds, and stories. What'll it be?",
                choices: [
                    { text: "[Rest] A bed for the night. (20g — Full heal)", next: 'rest', cost: 20 },
                    { text: "[Buy] Bowl of stew. (8g)", next: 'buy_stew', cost: 8, item: 'hearth_stew' },
                    { text: "Any news or rumors?", next: 'rumors' },
                    { text: "Just passing through.", next: 'farewell' }
                ]
            },
            rest: {
                text: "Room's upstairs, second on the left. Don't mind the noises — that's just the building settling. Probably.",
                choices: [],
                restAtInn: true
            },
            buy_stew: {
                text: "Best stew in the wastes. Also the only stew in the wastes. Eat up.",
                choices: [{ text: "Thanks.", next: 'initial' }]
            },
            rumors: {
                text: "Word is the creatures from the throne have been pushing further out. Bolder every night. Some folk say they've seen lights in the old palace — like someone's stoking the fires in there. And there's been talk of a camp on the eastern ridge. Might be bandits, might be survivors. Hard to tell the difference anymore.",
                choices: [
                    { text: "Interesting. Thanks.", next: 'initial' },
                    { text: "I should rest.", next: 'rest', cost: 20 }
                ]
            },
            farewell: {
                text: "Don't be a stranger. Or do. I don't much care either way.",
                choices: []
            }
        }
    },

    // ---- STILTHAVEN NPCs ----
    stilthaven_blacksmith: {
        name: 'Dreg',
        icon: '🔨',
        title: 'Ironworker of Stilthaven',
        location: 'stilthaven',
        description: 'A wiry man with webbed fingers — a mutation from years of swamp exposure. His metalwork is surprisingly delicate.',
        dialogues: {
            initial: {
                text: "Heh. Don't stare at the fingers — they're better for hammering than you'd think. I work iron, bone, and whatever else washes up. Interested?",
                choices: [
                    { text: "Show me what you've got.", next: 'shop', shopType: 'blacksmith' },
                    { text: "What's it like living here?", next: 'about_town' },
                    { text: "Not today.", next: 'farewell' }
                ]
            },
            about_town: {
                text: "Wet. Dark. Dangerous. But the fen provides if you know how to take without taking too much. The Mother's been stirring lately — bad sign. The water level's been rising. If someone doesn't deal with her soon, Stilthaven might sink for good.",
                choices: [
                    { text: "I'll handle it.", next: 'farewell_kind' },
                    { text: "Let me see your wares.", next: 'shop', shopType: 'blacksmith' }
                ]
            },
            shop: {
                text: "Everything's been treated against the damp. Can't have your sword rusting mid-swing, can we?",
                choices: [],
                isShop: true,
                shopType: 'blacksmith'
            },
            farewell: { text: "Mind the boardwalks. Rotten ones'll dump you in the water, and you do NOT want to be in the water.", choices: [] },
            farewell_kind: { text: "Ha! You've got guts. Don't let the fen take them. Literally.", choices: [] }
        }
    },
    stilthaven_herbalist: {
        name: 'Yarrow',
        icon: '🌿',
        title: 'Root Doctor of Stilthaven',
        location: 'stilthaven',
        description: 'A young woman with mushrooms growing from her hat. Whether intentionally or not is unclear.',
        dialogues: {
            initial: {
                text: "Oh! A customer! Or a patient? Both? The fen provides the best ingredients for healing — and the best reasons to need healing. Funny how that works. What can I get you?",
                choices: [
                    { text: "What do you have?", next: 'shop', shopType: 'herbalist' },
                    { text: "Nothing right now.", next: 'farewell' }
                ]
            },
            shop: {
                text: "Fresh from the fen! Some of it's still wriggling, but that just means it's potent!",
                choices: [],
                isShop: true,
                shopType: 'herbalist'
            },
            farewell: { text: "Don't drink the water! Or do! It builds character! And also parasites!", choices: [] }
        }
    },
    stilthaven_innkeeper: {
        name: 'Barnaby',
        icon: '🍺',
        title: 'Keeper of the Soggy Stump',
        location: 'stilthaven',
        description: 'A cheerful man who runs an inn built inside a hollowed-out giant tree stump.',
        dialogues: {
            initial: {
                text: "Welcome to the Soggy Stump! Driest spot in the whole fen, I promise! We've got beds, bog-brew, and a roof that only leaks in three places. What'll it be?",
                choices: [
                    { text: "[Rest] A dry bed, please. (25g — Full heal)", next: 'rest', cost: 25 },
                    { text: "[Buy] Bowl of stew. (8g)", next: 'buy_stew', cost: 8, item: 'hearth_stew' },
                    { text: "Any word from the swamp?", next: 'rumors' },
                    { text: "Just browsing.", next: 'farewell' }
                ]
            },
            rest: {
                text: "Upstairs, mind the third step — it's alive. Sweet dreams!",
                choices: [],
                restAtInn: true
            },
            buy_stew: {
                text: "Mystery stew! I genuinely don't know what's in it! It's delicious though!",
                choices: [{ text: "...Thanks.", next: 'initial' }]
            },
            rumors: {
                text: "The witch has been more talkative than usual. She says the Mother is preparing something — gathering her children closer. And folk who go too deep don't come back anymore. Used to be they'd come back changed. Now they just... don't.",
                choices: [
                    { text: "Noted.", next: 'initial' }
                ]
            },
            farewell: { text: "Come back anytime! The Stump never closes! Mostly because the door's broken!", choices: [] }
        }
    },

    // ---- LAST VIGIL NPCs ----
    vigil_blacksmith: {
        name: 'Commander Syl',
        icon: '🔨',
        title: 'Armorer of the Last Vigil',
        location: 'last_vigil',
        description: 'A stern woman who maintains the weapons and armor of the reality defenders. Every piece she makes is inscribed with wards.',
        dialogues: {
            initial: {
                text: "You've made it to the Vigil. That means you're either strong or lucky, and we don't believe in luck here. I can equip you for what lies ahead — but nothing will fully prepare you for Ruun.",
                choices: [
                    { text: "I need gear.", next: 'shop', shopType: 'blacksmith' },
                    { text: "What is this place?", next: 'about_town' },
                    { text: "I'm ready.", next: 'farewell' }
                ]
            },
            about_town: {
                text: "The Last Vigil is exactly what it sounds like — the last line of defense between reality and the void. We've been holding this position for decades. Every year, we lose more ground. Every year, the void pushes closer. If you're heading to the Throne... you might be our last hope.",
                choices: [
                    { text: "I won't let you down.", next: 'farewell_kind' },
                    { text: "Equip me for the fight.", next: 'shop', shopType: 'blacksmith' }
                ]
            },
            shop: {
                text: "Everything here is warded against void corruption. It's the best we can make — may it be enough.",
                choices: [],
                isShop: true,
                shopType: 'blacksmith'
            },
            farewell: { text: "Stay sharp. Reality is fragile here.", choices: [] },
            farewell_kind: { text: "We'll hold the line as long as we can. Go. End this.", choices: [] }
        }
    },
    vigil_herbalist: {
        name: 'Warden Asha',
        icon: '🌿',
        title: 'Apothecary of the Last Vigil',
        location: 'last_vigil',
        description: 'A healer who specializes in treating void exposure. Her patients include those who have looked into the abyss — and those the abyss looked back at.',
        dialogues: {
            initial: {
                text: "You look relatively sane. That's good. The void eats at the mind as much as the body. I've got remedies for both — within limits.",
                choices: [
                    { text: "What do you have?", next: 'shop', shopType: 'herbalist' },
                    { text: "How do you resist the void?", next: 'void_advice' },
                    { text: "I'm fine.", next: 'farewell' }
                ]
            },
            void_advice: {
                text: "Focus on what's real. The void shows you things — memories, fears, futures that will never be. Don't listen. Don't look. And whatever you do, don't answer when it calls your name. It WILL call your name.",
                choices: [
                    { text: "I'll remember that.", next: 'farewell_kind' }
                ]
            },
            shop: {
                text: "Stock up. Where you're going, there are no second chances.",
                choices: [],
                isShop: true,
                shopType: 'herbalist'
            },
            farewell: { text: "May reality hold firm beneath your feet.", choices: [] },
            farewell_kind: { text: "You've got a strong mind. You'll need it.", choices: [] }
        }
    },
    vigil_innkeeper: {
        name: 'Keeper Dorin',
        icon: '🍺',
        title: 'Quartermaster of the Last Vigil',
        location: 'last_vigil',
        description: 'A grizzled old soldier who manages the Vigil\'s supplies and sleeping quarters.',
        dialogues: {
            initial: {
                text: "We don't have an inn — we have barracks. But a bed's a bed, and sleep is weapon against the void. Rest, eat, and prepare.",
                choices: [
                    { text: "[Rest] I need sleep. (30g — Full heal)", next: 'rest', cost: 30 },
                    { text: "[Buy] Rations. (8g)", next: 'buy_stew', cost: 8, item: 'hearth_stew' },
                    { text: "What's the situation?", next: 'rumors' },
                    { text: "I'm fine.", next: 'farewell' }
                ]
            },
            rest: {
                text: "Third bunk on the right. Wake-up call is whenever reality starts screaming. So... probably soon.",
                choices: [],
                restAtInn: true
            },
            buy_stew: {
                text: "Standard rations. Keeps you alive. Tastes like it knows that's its only job.",
                choices: [{ text: "Good enough.", next: 'initial' }]
            },
            rumors: {
                text: "Ruun's been more active. The walls of reality thin further every day. Last week, three defenders walked into a corridor that didn't exist. We haven't seen them since. If you're going to make a move on the Throne of Unmaking, do it soon. We might not have a Vigil to come back to much longer.",
                choices: [
                    { text: "Understood.", next: 'initial' }
                ]
            },
            farewell: { text: "Don't die before morning. It's bad for morale.", choices: [] }
        }
    },

    // ---- ORIGINAL NPCs ----
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
