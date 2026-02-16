// ============================================
// NARRATIVE ENGINE
// ============================================

const Narrative = {
    log: null,

    init() {
        this.log = document.getElementById('narrative-log');
    },

    addEntry(text, type = 'normal', delay = 0) {
        if (!this.log) this.init();

        const entry = document.createElement('div');
        entry.className = `narrative-entry ${type}`;

        if (delay > 0) {
            entry.style.opacity = '0';
            setTimeout(() => {
                entry.textContent = text;
                entry.style.opacity = '';
                this.log.appendChild(entry);
                this.scrollToBottom();
            }, delay);
        } else {
            entry.textContent = text;
            this.log.appendChild(entry);
            this.scrollToBottom();
        }
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
        this.addEntry('— — —', 'separator');
    },

    addTypedEntry(text, type = 'story', speed = 30) {
        if (!this.log) this.init();

        const entry = document.createElement('div');
        entry.className = `narrative-entry ${type}`;
        this.log.appendChild(entry);

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
    },

    clear() {
        if (!this.log) this.init();
        this.log.innerHTML = '';
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
