// ============================================
// NARRATIVE ENGINE — Hidden Log + Floating Messages
// ============================================

const Narrative = {
    log: null,
    floatingContainer: null,
    maxFloating: 5,

    init() {
        this.log = document.getElementById('narrative-log');
        this.floatingContainer = document.getElementById('floating-narrative');
    },

    // Add to both hidden log and floating display
    addEntry(text, type = 'normal', delay = 0) {
        if (!this.log) this.init();

        // Add to hidden log (for journal)
        const entry = document.createElement('div');
        entry.className = `narrative-entry ${type}`;

        if (delay > 0) {
            entry.style.opacity = '0';
            setTimeout(() => {
                entry.textContent = text;
                entry.style.opacity = '';
                if (this.log) {
                    this.log.appendChild(entry);
                    this.scrollToBottom();
                }
                this.showFloatingMessage(text, type);
            }, delay);
        } else {
            entry.textContent = text;
            if (this.log) {
                this.log.appendChild(entry);
                this.scrollToBottom();
            }
            this.showFloatingMessage(text, type);
        }
    },

    // Show a floating message over the game world
    showFloatingMessage(text, type) {
        if (!this.floatingContainer) this.init();
        if (!this.floatingContainer) return;

        // Limit visible messages
        while (this.floatingContainer.children.length >= this.maxFloating) {
            this.floatingContainer.removeChild(this.floatingContainer.firstChild);
        }

        const msg = document.createElement('div');
        msg.className = `float-msg ${type}`;
        msg.textContent = text;
        this.floatingContainer.appendChild(msg);

        // Auto-remove after animation
        const duration = type === 'story' ? 6000 : 4500;
        setTimeout(() => {
            if (msg.parentNode) msg.remove();
        }, duration);
    },

    addStory(text) {
        this.addEntry(text, 'story');
    },

    addFlavor(text) {
        this.addEntry(text, 'flavor');
    },

    addAction(text) {
        this.addEntry(text, 'action');
    },

    addSystem(text) {
        this.addEntry(text, 'system');
    },

    addLoot(text) {
        this.addEntry(text, 'loot');
    },

    addDamage(text) {
        this.addEntry(text, 'damage');
    },

    addHeal(text) {
        this.addEntry(text, 'heal');
    },

    addSeparator() {
        // Only add to log, not floating
        if (!this.log) this.init();
        if (this.log) {
            const entry = document.createElement('div');
            entry.className = 'narrative-entry separator';
            entry.textContent = '— — —';
            this.log.appendChild(entry);
        }
    },

    addTypedEntry(text, type = 'story', speed = 30) {
        if (!this.log) this.init();

        const entry = document.createElement('div');
        entry.className = `narrative-entry ${type}`;
        if (this.log) this.log.appendChild(entry);

        let i = 0;
        const typeChar = () => {
            if (i < text.length) {
                entry.textContent += text[i];
                i++;
                this.scrollToBottom();
                setTimeout(typeChar, speed);
            }
        };
        typeChar();

        // Also show as floating
        this.showFloatingMessage(text, type);
    },

    clear() {
        if (!this.log) this.init();
        if (this.log) this.log.innerHTML = '';
        if (this.floatingContainer) this.floatingContainer.innerHTML = '';
    },

    scrollToBottom() {
        if (this.log) {
            this.log.scrollTop = this.log.scrollHeight;
        }
    },

    // Generate ambient text for current location
    getAmbientText() {
        const region = WORLD.regions[GameState.currentRegion];
        if (region && region.ambientText) {
            return region.ambientText[Math.floor(Math.random() * region.ambientText.length)];
        }
        return 'The world around you is quiet. Too quiet.';
    },

    // Show location entry narrative
    showLocationEntry(locationKey) {
        const location = WORLD.locations[locationKey];
        if (!location) return;

        this.addSeparator();
        this.addAction(`— ${location.name} —`);
        if (location.narrative && location.narrative.enter) {
            this.addStory(location.narrative.enter);
        }
    },

    // Show exploration narrative
    showExploration(locationKey) {
        const location = WORLD.locations[locationKey];
        if (!location || !location.narrative || !location.narrative.explore) return;

        const texts = location.narrative.explore;
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.addFlavor(text);
    },

    // Show boss pre-fight narrative
    showBossIntro(locationKey) {
        const location = WORLD.locations[locationKey];
        if (!location || !location.narrative || !location.narrative.preBoss) return;

        this.addSeparator();
        this.addStory(location.narrative.preBoss);
    }
};
