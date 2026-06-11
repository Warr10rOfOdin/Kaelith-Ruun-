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

            // Keep the sheet backdrop in sync with the panel, even when
            // legacy close buttons toggle the panel's class directly.
            const sp = document.getElementById('side-panel');
            const bd = document.getElementById('side-panel-backdrop');
            if (sp && bd && typeof MutationObserver !== 'undefined') {
                new MutationObserver(() => {
                    bd.classList.toggle('hidden', sp.classList.contains('hidden'));
                }).observe(sp, { attributes: true, attributeFilter: ['class'] });
            }

            // Check for existing save
            if (GameState.hasSave()) {
                const continueBtn = document.getElementById('btn-continue');
                if (continueBtn) continueBtn.disabled = false;
                this.showSaveInfo();
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

    showSaveInfo() {
        try {
            const data = JSON.parse(localStorage.getItem('kaelith_ruun_save'));
            if (!data || !data.player) return;
            const p = data.player;
            const race = RACES[p.race];
            const cls = CLASSES[p.class];
            const region = data.currentRegion ? data.currentRegion.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
            const mins = Math.floor((data.stats && data.stats.playTime || 0) / 60);
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            const el = document.getElementById('save-info');
            if (el) {
                el.innerHTML = `<span>${race ? race.icon : ''} ${p.name} — Lv.${p.level} ${cls ? cls.name : ''}</span><span>${region} · ${hrs > 0 ? hrs + 'h ' : ''}${remMins}m</span>`;
                el.classList.remove('hidden');
            }
        } catch (e) { /* ignore */ }
    },

    // Play time tracking
    _playTimeInterval: null,
    startPlayTimeTracking() {
        if (this._playTimeInterval) clearInterval(this._playTimeInterval);
        GameState.stats._lastTick = Date.now();
        this._playTimeInterval = setInterval(() => {
            if (!GameState.player || GameState.currentScreen === 'title') return;
            const now = Date.now();
            const elapsed = Math.floor((now - (GameState.stats._lastTick || now)) / 1000);
            GameState.stats._lastTick = now;
            if (elapsed > 0 && elapsed < 30) GameState.stats.playTime += elapsed;
        }, 10000);
    },

    // Auto-save visual indicator
    showAutoSaveIndicator() {
        const el = document.getElementById('autosave-indicator');
        if (!el) return;
        el.classList.remove('hidden');
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.classList.add('hidden'), 500);
        }, 1200);
    },

    // =========================================
    // TITLE SCREEN
    // =========================================
    setupTitleScreen() {
        const newGameBtn = document.getElementById('btn-new-game');
        const continueBtn = document.getElementById('btn-continue');
        const loreBtn = document.getElementById('btn-lore');
        const breachBtn = document.getElementById('btn-breach');
        const sanctumBtn = document.getElementById('btn-sanctum');
        const storyBtn = document.getElementById('btn-story');

        if (breachBtn) {
            breachBtn.onclick = () => {
                if (typeof Audio !== 'undefined') Audio.ensure();
                Breach.openSetup();
            };
        }

        if (sanctumBtn) {
            sanctumBtn.onclick = () => this.showSanctum();
        }

        if (storyBtn) {
            storyBtn.onclick = () => {
                const menu = document.getElementById('story-menu');
                if (menu) menu.classList.toggle('hidden');
            };
        }

        this.updateTitleMeta();

        if (newGameBtn) {
            newGameBtn.onclick = () => {
                if (typeof Audio !== 'undefined') Audio.ensure();
                ScreenManager.showScreen('creation');
                this.startCreation();
            };
        }

        if (continueBtn) {
            continueBtn.onclick = () => {
                if (typeof Audio !== 'undefined') Audio.ensure();
                if (GameState.load()) {
                    ScreenManager.showScreen('game');
                    HUD.update();
                    Narrative.addSystem('Your journey continues...');
                    this.startWorldMap();
                    this.startPlayTimeTracking();
                    if (typeof Audio !== 'undefined') Audio.startAmbient(GameState.currentRegion);
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
    // THE BREACH — title meta + Sanctum shop
    // =========================================
    updateTitleMeta() {
        const el = document.getElementById('title-meta');
        if (!el || typeof BreachMeta === 'undefined') return;
        const meta = BreachMeta.load();
        const cleared = Object.keys(meta.cleared || {}).length;
        if (meta.stats.runs === 0) {
            el.innerHTML = 'The Breach awaits its first challenger.';
            return;
        }
        el.innerHTML = `<strong>🪙 ${meta.gold}</strong> &nbsp;·&nbsp; ${meta.stats.runs} runs &nbsp;·&nbsp; ${meta.stats.kills} slain &nbsp;·&nbsp; ${cleared}/4 realms cleared`;
    },

    showSanctum() {
        const el = document.getElementById('sanctum-overlay');
        if (!el || typeof BreachMeta === 'undefined') return;
        const meta = BreachMeta.load();

        let html = `<div class="sanctum-panel">`;
        html += `<div class="bsetup-title">Sanctum</div>`;
        html += `<div class="bsetup-sub">Permanent power, bought in gold</div>`;
        html += `<div class="sanctum-gold">🪙 ${meta.gold}</div>`;
        html += `<div class="sanctum-grid">`;

        for (const [key, def] of Object.entries(SANCTUM_UPGRADES)) {
            const lvl = BreachMeta.upgradeLevel(key);
            const maxed = lvl >= def.max;
            const cost = BreachMeta.upgradeCost(key);
            let pips = '';
            for (let i = 0; i < def.max; i++) {
                pips += `<span class="s-pip ${i < lvl ? 'on' : ''}"></span>`;
            }
            html += `<div class="sanctum-card">
                <div class="s-head">${def.icon} ${def.name}</div>
                <div class="s-pips">${pips}</div>
                <div class="s-desc">${def.desc}</div>
                <button class="sanctum-buy ${maxed ? 'maxed' : ''}" ${maxed || meta.gold < cost ? 'disabled' : ''}
                    onclick="Game.buySanctum('${key}')">${maxed ? 'MASTERED' : `🪙 ${cost}`}</button>
            </div>`;
        }

        html += `</div>`;
        html += `<button class="bstart-btn" style="margin-top:1rem" onclick="Breach.openSetup();document.getElementById('sanctum-overlay').classList.add('hidden')">⚔ ENTER THE BREACH</button>`;
        html += `<button class="bsetup-close" onclick="document.getElementById('sanctum-overlay').classList.add('hidden');Game.updateTitleMeta()">✕</button>`;
        html += `</div>`;

        el.innerHTML = html;
        el.classList.remove('hidden');
    },

    buySanctum(key) {
        if (typeof BreachMeta === 'undefined') return;
        if (BreachMeta.buyUpgrade(key)) {
            if (typeof Audio !== 'undefined') { try { Audio.playCraft(); } catch (e) {} }
            if (typeof NativeBridge !== 'undefined') NativeBridge.hapticLight();
        } else {
            Notifications.show('Not enough gold.', 'red');
        }
        this.showSanctum();
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

        // Update progress indicator
        this.updateProgressIndicator();

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

    updateProgressIndicator() {
        const container = document.getElementById('creation-progress');
        if (!container) return;

        const dots = container.querySelectorAll('.progress-dot');
        const lines = container.querySelectorAll('.progress-line');

        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'completed');
            if (i === this.creationStep) {
                dot.classList.add('active');
            } else if (i < this.creationStep) {
                dot.classList.add('completed');
            }
        });

        lines.forEach((line, i) => {
            line.classList.remove('completed');
            if (i < this.creationStep) {
                line.classList.add('completed');
            }
        });
    },

    renderRaceOptions() {
        const container = document.getElementById('race-options');
        if (!container) return;
        container.innerHTML = '';

        for (const [key, race] of Object.entries(RACES)) {
            const card = document.createElement('div');
            card.className = `option-card ${this.selectedRace === key ? 'selected' : ''}`;

            // Build stat preview chips
            let statsHtml = '<div class="card-stats">';
            for (const [stat, val] of Object.entries(race.stats)) {
                if (val !== 0) {
                    const cls = val > 0 ? 'positive' : 'negative';
                    const sign = val > 0 ? '+' : '';
                    statsHtml += `<span class="card-stat ${cls}">${stat.toUpperCase()} ${sign}${val}</span>`;
                }
            }
            statsHtml += '</div>';

            card.innerHTML = `<span class="card-icon">${race.icon}</span><span class="card-name">${race.name}</span>${statsHtml}`;
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

            // Build stat preview chips
            let statsHtml = '<div class="card-stats">';
            for (const [stat, val] of Object.entries(cls.stats)) {
                if (val !== 0) {
                    const clsName = val > 0 ? 'positive' : 'negative';
                    const sign = val > 0 ? '+' : '';
                    statsHtml += `<span class="card-stat ${clsName}">${stat.toUpperCase()} ${sign}${val}</span>`;
                }
            }
            statsHtml += '</div>';

            card.innerHTML = `<span class="card-icon">${cls.icon}</span><span class="card-name">${cls.name}</span>${statsHtml}`;
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
        const maxStatVal = Math.max(...Object.values(stats), 15);

        const statIcons = { str: '&#9876;', dex: '&#9884;', int: '&#9733;', wis: '&#9775;', con: '&#9829;', cha: '&#9830;' };
        const statNames = { str: 'Strength', dex: 'Dexterity', int: 'Intelligence', wis: 'Wisdom', con: 'Constitution', cha: 'Charisma' };

        const preview = document.getElementById('char-preview');
        if (!preview) return;

        // Build stat lines with visual bars
        let statRows = '';
        for (const [stat, val] of Object.entries(stats)) {
            const pct = Math.round((val / maxStatVal) * 100);
            statRows += `
                <div class="stat-line">
                    <span class="stat-label"><span class="stat-icon">${statIcons[stat]}</span>${statNames[stat]}</span>
                    <span>${val}</span>
                </div>
            `;
        }

        // Build abilities list
        let abilitiesHtml = '';
        cls.startingAbilities.forEach(a => {
            abilitiesHtml += `
                <div class="preview-ability">
                    <div class="ability-name">${a.name}</div>
                    <div class="ability-desc">${a.desc}</div>
                </div>
            `;
        });

        preview.innerHTML = `
            <div class="char-preview-header">
                <div class="preview-name">${name}</div>
                <div class="preview-subtitle">${race.icon} ${race.name} ${cls.name} ${cls.icon}</div>
            </div>
            <div class="char-preview-sprite"><canvas id="preview-sprite-canvas" width="64" height="64"></canvas></div>
            <div class="preview-vitals">
                <div class="stat-line">
                    <span class="stat-label"><span class="stat-icon" style="color:var(--hp-color-bright)">&#9829;</span>HP</span>
                    <span>${maxHp}</span>
                </div>
                <div class="preview-bar"><div class="preview-bar-fill hp" style="width:100%"></div></div>
                <div class="stat-line" style="margin-top:0.3rem">
                    <span class="stat-label"><span class="stat-icon" style="color:var(--mp-color-bright)">&#9670;</span>MP</span>
                    <span>${maxMp}</span>
                </div>
                <div class="preview-bar"><div class="preview-bar-fill mp" style="width:100%"></div></div>
            </div>
            ${statRows}
            <div class="preview-abilities-label">Starting Abilities</div>
            ${abilitiesHtml}
        `;

        // Render player sprite on the preview canvas if available
        if (typeof Sprites !== 'undefined' && Sprites.getPlayer) {
            try {
                const canvas = document.getElementById('preview-sprite-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const spriteCanvas = Sprites.getPlayer();
                    if (spriteCanvas) {
                        ctx.clearRect(0, 0, 64, 64);
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(spriteCanvas, 0, 0, 64, 64);
                    }
                }
            } catch(e) { /* sprite not ready */ }
        }
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
            this.startPlayTimeTracking();
            if (typeof Audio !== 'undefined') Audio.startAmbient(GameState.currentRegion);
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
    // BOTTOM NAV + PANEL SHEET
    // =========================================
    setupBottomNav() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.onclick = () => {
                const tabName = tab.dataset.tab;
                const sidePanel = document.getElementById('side-panel');
                const panelOpen = sidePanel && !sidePanel.classList.contains('hidden');

                // Tapping the active tab while its panel is open closes it
                if (tab.classList.contains('active') && panelOpen && tabName !== 'explore') {
                    this.closePanel();
                    return;
                }

                this.setActiveTab(tabName);
                this.handleTabChange(tabName);
            };
        });

        const backdrop = document.getElementById('side-panel-backdrop');
        if (backdrop) backdrop.onclick = () => this.closePanel();
    },

    setActiveTab(tabName) {
        // Sub-panels opened from the menu hub keep the Menu tab lit
        const hubPanels = ['journal', 'achievements', 'base', 'settings'];
        const target = hubPanels.includes(tabName) ? 'menu' : tabName;
        document.querySelectorAll('.nav-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === target);
        });
    },

    openPanel() {
        const sidePanel = document.getElementById('side-panel');
        const backdrop = document.getElementById('side-panel-backdrop');
        if (sidePanel) sidePanel.classList.remove('hidden');
        if (backdrop) backdrop.classList.remove('hidden');
    },

    closePanel() {
        const sidePanel = document.getElementById('side-panel');
        const backdrop = document.getElementById('side-panel-backdrop');
        if (sidePanel) sidePanel.classList.add('hidden');
        if (backdrop) backdrop.classList.add('hidden');
        this.setActiveTab('explore');
        if (typeof Exploration !== 'undefined') Exploration.updateActions();
        if (typeof NativeBridge !== 'undefined') NativeBridge.hapticLight();
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

        const mine = GameState.base && GameState.base.mine ? GameState.base.mine : null;
        const plots = GameState.base && GameState.base.plots ? GameState.base.plots : [];
        const stockCount = GameState.base && GameState.base.automation && GameState.base.automation.stockpile
            ? Object.values(GameState.base.automation.stockpile).reduce((s, q) => s + q, 0) : 0;

        html += '<div class="hub-menu">';
        html += '<button class="hub-btn" onclick="Base.showBuildPanel()"><span class="hub-btn-icon">🏗️</span><span class="hub-btn-label">Build Structures</span></button>';
        html += `<button class="hub-btn" onclick="Homestead.showMinePanel()"><span class="hub-btn-icon">⛏️</span><span class="hub-btn-label">The Depths</span>${mine && mine.maxDepth > 0 ? `<span class="hub-btn-meta">Lv ${mine.maxDepth}</span>` : ''}</button>`;
        html += `<button class="hub-btn" onclick="Base.showFarmPanel()"><span class="hub-btn-icon">🌾</span><span class="hub-btn-label">Living Soil</span>${plots.length > 0 ? `<span class="hub-btn-meta">${plots.length} plots</span>` : ''}</button>`;
        html += '<button class="hub-btn" onclick="Homestead.showTerraformPanel()"><span class="hub-btn-icon">🏞️</span><span class="hub-btn-label">Terraform</span></button>';
        html += `<button class="hub-btn" onclick="Homestead.showIndustryPanel()"><span class="hub-btn-icon">⚙️</span><span class="hub-btn-label">Industry</span>${stockCount > 0 ? `<span class="hub-btn-meta">📦 ${stockCount}</span>` : ''}</button>`;
        html += '<button class="hub-btn" onclick="Base.showCraftPanel()"><span class="hub-btn-icon">⚒️</span><span class="hub-btn-label">Crafting</span></button>';
        html += '<button class="hub-btn" onclick="Base.showCampNPCPanel()"><span class="hub-btn-icon">👥</span><span class="hub-btn-label">Settlement</span></button>';
        html += '<button class="hub-btn" onclick="Base.showPlaceablesPanel()"><span class="hub-btn-icon">🏠</span><span class="hub-btn-label">Placeables</span></button>';
        html += '<button class="hub-btn" onclick="Base.showTechPanel()"><span class="hub-btn-icon">🔬</span><span class="hub-btn-label">Tech Tree</span></button>';
        html += '</div>';

        html += `<button class="action-btn" onclick="Game.handleTabChange('menu')" style="margin-top:1rem">Back to Menu</button>`;
        panel.innerHTML = html;
    },

    showMenuHub() {
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;

        const p = GameState.player;
        const echoCount = p && p.echoes ? p.echoes.length : 0;
        const achCount = Object.keys(GameState.achievements || {}).length;
        const achTotal = Object.keys(GameState._achievementDefs || {}).length;

        let html = '<h3>Menu</h3>';
        html += '<div class="hub-menu">';
        html += '<button class="hub-btn" onclick="Game.handleTabChange(\'journal\')"><span class="hub-btn-icon">📜</span><span class="hub-btn-label">Journal &amp; Quests</span></button>';
        html += '<button class="hub-btn" onclick="Game.handleTabChange(\'base\')"><span class="hub-btn-icon">🏕️</span><span class="hub-btn-label">Camp &amp; Crafting</span></button>';
        html += `<button class="hub-btn" onclick="Game.handleTabChange('achievements')"><span class="hub-btn-icon">⭐</span><span class="hub-btn-label">Achievements</span><span class="hub-btn-meta">${achCount}/${achTotal}</span></button>`;
        html += `<button class="hub-btn" onclick="Game.handleTabChange('character')"><span class="hub-btn-icon">✴️</span><span class="hub-btn-label">Echoes of Ruun</span><span class="hub-btn-meta">${echoCount} attuned</span></button>`;
        html += '<button class="hub-btn" onclick="ScreenManager.showScreen(\'lore\')"><span class="hub-btn-icon">📖</span><span class="hub-btn-label">World Lore</span></button>';
        html += '<button class="hub-btn" onclick="Game.handleTabChange(\'settings\')"><span class="hub-btn-icon">⚙️</span><span class="hub-btn-label">Settings</span></button>';
        html += '</div>';
        panel.innerHTML = html;
    },

    handleTabChange(tabName) {
        const sidePanel = document.getElementById('side-panel');
        if (!sidePanel) return;

        if (tabName === 'explore') {
            this.closePanel();
            WorldMap.updateActions();
            return;
        }

        this.setActiveTab(tabName);
        this.openPanel();

        switch (tabName) {
            case 'inventory':
                Inventory.render();
                break;
            case 'character':
                Progression.renderCharacterSheet();
                break;
            case 'map':
                MapUI.render();
                break;
            case 'journal':
                Progression.renderJournal();
                break;
            case 'achievements':
                Progression.renderAchievements();
                break;
            case 'base':
                this.showBaseMenu();
                break;
            case 'settings':
                Settings.render();
                break;
            case 'menu':
                this.showMenuHub();
                break;
        }

        // Scroll panel content back to top when switching views
        sidePanel.scrollTop = 0;
    }
};

// =========================================
// BOOT
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
