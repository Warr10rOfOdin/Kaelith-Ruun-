// ============================================
// KAELITH RUUN — MAIN ENTRY POINT
// ============================================

// Global error handler — prevent crashes from breaking the game
window.onerror = function(msg, url, line, col, error) {
    console.error(`[Kaelith Ruun] Error: ${msg} at ${url}:${line}:${col}`, error);
    return false;
};

window.addEventListener('unhandledrejection', function(e) {
    console.error('[Kaelith Ruun] Unhandled promise rejection:', e.reason);
});

const Game = {
    async init() {
        try {
            // Initialize native bridge first (detects native vs web)
            await NativeBridge.init();

            ScreenManager.init();
            Narrative.init();
            Touch.init();

            this.setupTitleScreen();
            this.setupCreationScreen();
            this.setupLoreScreen();
            this.setupBottomNav();

            // Check for existing save
            if (GameState.hasSave()) {
                const continueBtn = document.getElementById('btn-continue');
                if (continueBtn) continueBtn.disabled = false;
            }

            // Title ASCII art
            this.renderTitleArt();

            // Hide native splash screen once game is ready
            await NativeBridge.hideSplash();
        } catch (e) {
            console.error('[Kaelith Ruun] Init error:', e);
        }
    },

    renderTitleArt() {
        const art = `
        ╔═══════════════════════════════════════╗
        ║  ▄█▀─── ─── ─── ─── ─── ─── ───▀█▄  ║
        ║  █▌  ✦ The world is shattered ✦  ▐█  ║
        ║  █▌    Yet embers still burn...    ▐█  ║
        ║  ▀█▄─── ─── ─── ─── ─── ─── ───▄█▀  ║
        ╚═══════════════════════════════════════╝`;
        const el = document.getElementById('title-ascii');
        if (el) el.textContent = art;
    },

    // =========================================
    // TITLE SCREEN
    // =========================================
    setupTitleScreen() {
        const newGameBtn = document.getElementById('btn-new-game');
        const continueBtn = document.getElementById('btn-continue');
        const loreBtn = document.getElementById('btn-lore');

        if (newGameBtn) {
            newGameBtn.onclick = () => {
                ScreenManager.showScreen('creation');
                this.startCreation();
            };
        }

        if (continueBtn) {
            continueBtn.onclick = () => {
                if (GameState.load()) {
                    ScreenManager.showScreen('game');
                    HUD.update();
                    Narrative.addSystem('Your journey continues...');
                    this.startWorldMap();
                }
            };
        }

        if (loreBtn) {
            loreBtn.onclick = () => {
                ScreenManager.showScreen('lore');
            };
        }
    },

    // =========================================
    // WORLD MAP INITIALIZATION
    // =========================================
    startWorldMap() {
        // Initialize the world map engine
        WorldMap.init();

        // If map state was loaded from save, it's already loaded
        // Otherwise, load the current location
        if (!WorldMap.currentMap && GameState.currentLocation) {
            const pos = GameState.playerMapPos;
            if (MAPS[GameState.currentLocation]) {
                WorldMap.loadMap(
                    GameState.currentLocation,
                    pos ? pos.x : undefined,
                    pos ? pos.y : undefined
                );
            }
        }

        // Restore built buildings on camp
        if (GameState.currentLocation === 'player_camp' && typeof Base !== 'undefined') {
            Base.updateCampTiles();
        }
    },

    // =========================================
    // CHARACTER CREATION
    // =========================================
    creationStep: 0,
    selectedRace: null,
    selectedClass: null,

    startCreation() {
        this.creationStep = 0;
        this.selectedRace = null;
        this.selectedClass = null;
        this.updateCreationStep();
    },

    setupCreationScreen() {
        const nameInput = document.getElementById('char-name');
        if (nameInput) {
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && nameInput.value.trim().length > 0) {
                    this.nextCreationStep();
                }
            });
        }

        const nextBtn = document.getElementById('btn-creation-next');
        const backBtn = document.getElementById('btn-creation-back');
        if (nextBtn) nextBtn.onclick = () => this.nextCreationStep();
        if (backBtn) backBtn.onclick = () => this.prevCreationStep();
    },

    updateCreationStep() {
        const steps = ['step-name', 'step-race', 'step-class', 'step-confirm'];
        steps.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (i === this.creationStep) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // Back button visibility
        const backBtn = document.getElementById('btn-creation-back');
        if (backBtn) {
            if (this.creationStep > 0) {
                backBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
            }
        }

        // Next button text
        const nextBtn = document.getElementById('btn-creation-next');
        if (nextBtn) {
            nextBtn.textContent = this.creationStep === 3 ? 'Begin Journey' : 'Next';
        }

        // Populate race options
        if (this.creationStep === 1) {
            this.renderRaceOptions();
        }

        // Populate class options
        if (this.creationStep === 2) {
            this.renderClassOptions();
        }

        // Character preview
        if (this.creationStep === 3) {
            this.renderCharPreview();
        }
    },

    renderRaceOptions() {
        const container = document.getElementById('race-options');
        if (!container) return;
        container.innerHTML = '';

        for (const [key, race] of Object.entries(RACES)) {
            const card = document.createElement('div');
            card.className = `option-card ${this.selectedRace === key ? 'selected' : ''}`;
            card.innerHTML = `<span class="card-icon">${race.icon}</span><span class="card-name">${race.name}</span>`;
            card.onclick = () => {
                this.selectedRace = key;
                this.renderRaceOptions();
                const desc = document.getElementById('race-description');
                if (desc) {
                    desc.innerHTML = `
                        <strong>${race.name}</strong><br>
                        ${race.description}<br><br>
                        <em>${race.abilities.join(' | ')}</em>
                    `;
                }
            };
            container.appendChild(card);
        }
    },

    renderClassOptions() {
        const container = document.getElementById('class-options');
        if (!container) return;
        container.innerHTML = '';

        for (const [key, cls] of Object.entries(CLASSES)) {
            const card = document.createElement('div');
            card.className = `option-card ${this.selectedClass === key ? 'selected' : ''}`;
            card.innerHTML = `<span class="card-icon">${cls.icon}</span><span class="card-name">${cls.name}</span>`;
            card.onclick = () => {
                this.selectedClass = key;
                this.renderClassOptions();
                const desc = document.getElementById('class-description');
                if (desc) {
                    desc.innerHTML = `
                        <strong>${cls.name}</strong><br>
                        ${cls.description}<br><br>
                        <em>Primary: ${cls.primaryStat.toUpperCase()} | HP/level: ${cls.hpPerLevel} | MP/level: ${cls.mpPerLevel}</em>
                    `;
                }
            };
            container.appendChild(card);
        }
    },

    renderCharPreview() {
        const nameInput = document.getElementById('char-name');
        const name = nameInput ? nameInput.value.trim() : '';
        const race = RACES[this.selectedRace];
        const cls = CLASSES[this.selectedClass];

        if (!race || !cls) return;

        const stats = {
            str: 5 + race.stats.str + cls.stats.str,
            dex: 5 + race.stats.dex + cls.stats.dex,
            int: 5 + race.stats.int + cls.stats.int,
            wis: 5 + race.stats.wis + cls.stats.wis,
            con: 5 + race.stats.con + cls.stats.con,
            cha: 5 + race.stats.cha + cls.stats.cha
        };

        const maxHp = 50 + (stats.con * 3) + race.hpBonus;
        const maxMp = 30 + (stats.int * 2) + stats.wis + race.mpBonus;

        const preview = document.getElementById('char-preview');
        if (!preview) return;

        preview.innerHTML = `
            <h3>${race.icon} ${name} — ${race.name} ${cls.name} ${cls.icon}</h3>
            <div class="stat-line"><span>HP</span><span>${maxHp}</span></div>
            <div class="stat-line"><span>MP</span><span>${maxMp}</span></div>
            <div class="stat-line"><span>Strength</span><span>${stats.str}</span></div>
            <div class="stat-line"><span>Dexterity</span><span>${stats.dex}</span></div>
            <div class="stat-line"><span>Intelligence</span><span>${stats.int}</span></div>
            <div class="stat-line"><span>Wisdom</span><span>${stats.wis}</span></div>
            <div class="stat-line"><span>Constitution</span><span>${stats.con}</span></div>
            <div class="stat-line"><span>Charisma</span><span>${stats.cha}</span></div>
            <div style="margin-top:1rem;color:var(--text-secondary)">
                <p><strong>Starting Abilities:</strong></p>
                ${cls.startingAbilities.map(a => `<p style="padding:0.2rem 0">${a.name} — ${a.desc}</p>`).join('')}
            </div>
        `;
    },

    nextCreationStep() {
        // Validate current step
        if (this.creationStep === 0) {
            const nameInput = document.getElementById('char-name');
            const name = nameInput ? nameInput.value.trim() : '';
            if (name.length < 1) {
                Notifications.show('Enter a name to continue.', 'red');
                return;
            }
        } else if (this.creationStep === 1) {
            if (!this.selectedRace) {
                Notifications.show('Select a race to continue.', 'red');
                return;
            }
        } else if (this.creationStep === 2) {
            if (!this.selectedClass) {
                Notifications.show('Select a class to continue.', 'red');
                return;
            }
        } else if (this.creationStep === 3) {
            // Finalize character
            this.finalizeCharacter();
            return;
        }

        this.creationStep++;
        this.updateCreationStep();
    },

    prevCreationStep() {
        if (this.creationStep > 0) {
            this.creationStep--;
            this.updateCreationStep();
        }
    },

    finalizeCharacter() {
        const nameInput = document.getElementById('char-name');
        const name = nameInput ? nameInput.value.trim() : 'Wanderer';
        GameState.initialize(name, this.selectedRace, this.selectedClass);

        ScreenManager.showScreen('game');
        HUD.update();

        // Opening narrative
        Narrative.clear();
        Narrative.addSystem('— A New Journey Begins —');
        Narrative.addStory('You awaken face-down in ash. Your mouth tastes of cinder and copper. Memory is a shattered mirror — fragments of who you were, none fitting together.');
        Narrative.addStory('The sky above is the color of a bruise, perpetual twilight seeping through cracks in reality itself. This is the Ashen Wastes — or so the crumbling road sign claims.');

        setTimeout(() => {
            Narrative.addFlavor('Ahead, the broken walls of a military outpost offer shelter from the wind that carries whispers of things best left unheard.');
            Narrative.addSystem('Use the D-Pad or WASD to move. Press the action button or E/Space to interact.');

            // Initialize the world map
            this.startWorldMap();
        }, 1500);
    },

    // =========================================
    // LORE SCREEN
    // =========================================
    setupLoreScreen() {
        const content = document.getElementById('lore-content');
        if (!content) return;

        let html = '';

        if (typeof LORE !== 'undefined' && LORE.sections) {
            LORE.sections.forEach(section => {
                html += `<div class="lore-section">`;
                html += `<h3>${section.title}</h3>`;
                section.text.split('\n\n').forEach(paragraph => {
                    html += `<p>${paragraph.trim()}</p>`;
                });
                html += '</div>';
            });
        }

        content.innerHTML = html;

        const backBtn = document.getElementById('btn-lore-back');
        if (backBtn) {
            backBtn.onclick = () => {
                if (GameState.player) {
                    ScreenManager.showScreen('game');
                } else {
                    ScreenManager.showScreen('title');
                }
            };
        }
    },

    // =========================================
    // BOTTOM NAV
    // =========================================
    setupBottomNav() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabName = tab.dataset.tab;
                this.handleTabChange(tabName);
            };
        });
    },

    showBaseMenu() {
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;

        const tier = typeof TechTree !== 'undefined' ? TechTree.getUnlockedTier() : 0;
        const tierData = typeof TECH_TREE !== 'undefined' ? TECH_TREE[`tier_${tier}`] : null;

        let html = '<h3>Camp Management</h3>';
        if (tierData) {
            html += `<p style="color:var(--accent-gold-dim);margin-bottom:1rem;font-size:0.85rem">${tierData.icon} Tech Tier ${tier}: ${tierData.name}</p>`;
        }

        html += '<div style="display:flex;flex-direction:column;gap:0.5rem">';
        html += '<button class="action-btn primary" onclick="Base.showBuildPanel()" style="padding:0.8rem;font-size:0.95rem">🏗️ Build Structures</button>';
        html += '<button class="action-btn primary" onclick="Base.showCraftPanel()" style="padding:0.8rem;font-size:0.95rem">⚒️ Crafting</button>';
        html += '<button class="action-btn primary" onclick="Base.showFarmPanel()" style="padding:0.8rem;font-size:0.95rem">🌾 Farming</button>';
        html += '<button class="action-btn primary" onclick="Base.showPlaceablesPanel()" style="padding:0.8rem;font-size:0.95rem">🏠 Placeables</button>';
        html += '<button class="action-btn primary" onclick="Base.showTechPanel()" style="padding:0.8rem;font-size:0.95rem">🔬 Tech Tree</button>';
        html += '</div>';

        html += `<button class="action-btn" onclick="document.getElementById('side-panel').classList.add('hidden')" style="margin-top:1rem">Close</button>`;
        panel.innerHTML = html;
    },

    handleTabChange(tabName) {
        const sidePanel = document.getElementById('side-panel');
        if (!sidePanel) return;

        switch (tabName) {
            case 'explore':
                sidePanel.classList.add('hidden');
                WorldMap.updateActions();
                break;

            case 'inventory':
                sidePanel.classList.remove('hidden');
                Inventory.render();
                break;

            case 'character':
                sidePanel.classList.remove('hidden');
                Progression.renderCharacterSheet();
                break;

            case 'map':
                sidePanel.classList.remove('hidden');
                MapUI.render();
                break;

            case 'journal':
                sidePanel.classList.remove('hidden');
                Progression.renderJournal();
                break;

            case 'base':
                sidePanel.classList.remove('hidden');
                this.showBaseMenu();
                break;

            case 'settings':
                sidePanel.classList.remove('hidden');
                Settings.render();
                break;
        }
    }
};

// =========================================
// BOOT
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
