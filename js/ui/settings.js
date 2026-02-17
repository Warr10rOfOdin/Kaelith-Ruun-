// ============================================
// SETTINGS & KEYBINDING SYSTEM
// ============================================

const Settings = {
    // Default keybindings
    defaults: {
        moveUp:    ['ArrowUp', 'w', 'W'],
        moveDown:  ['ArrowDown', 's', 'S'],
        moveLeft:  ['ArrowLeft', 'a', 'A'],
        moveRight: ['ArrowRight', 'd', 'D'],
        interact:  [' ', 'e', 'E', 'Enter'],
        sprint:    ['Shift'],
        map:       ['m', 'M'],
        inventory: ['i', 'I'],
        character: ['c', 'C']
    },

    // Current keybindings (loaded from localStorage or defaults)
    bindings: {},

    // Settings values
    values: {
        musicVolume: 50,
        sfxVolume: 70,
        screenShake: true,
        showFPS: false,
        particleDensity: 'high'  // 'low', 'medium', 'high'
    },

    // Currently rebinding
    _rebinding: null,

    init() {
        this.load();
    },

    load() {
        // Load keybindings
        try {
            const saved = localStorage.getItem('kaelith_keybindings');
            if (saved) {
                this.bindings = JSON.parse(saved);
            } else {
                this.bindings = JSON.parse(JSON.stringify(this.defaults));
            }
        } catch (e) {
            this.bindings = JSON.parse(JSON.stringify(this.defaults));
        }

        // Load settings
        try {
            const savedSettings = localStorage.getItem('kaelith_settings');
            if (savedSettings) {
                Object.assign(this.values, JSON.parse(savedSettings));
            }
        } catch (e) { /* use defaults */ }
    },

    save() {
        try {
            localStorage.setItem('kaelith_keybindings', JSON.stringify(this.bindings));
            localStorage.setItem('kaelith_settings', JSON.stringify(this.values));
        } catch (e) { /* silently fail */ }
    },

    resetBindings() {
        this.bindings = JSON.parse(JSON.stringify(this.defaults));
        this.save();
    },

    // Check if a key matches an action
    isAction(key, action) {
        const keys = this.bindings[action] || this.defaults[action] || [];
        return keys.includes(key);
    },

    // Get display name for a key
    keyName(key) {
        const names = {
            'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right',
            ' ': 'Space', 'Shift': 'Shift', 'Enter': 'Enter', 'Escape': 'Esc',
            'Control': 'Ctrl', 'Alt': 'Alt'
        };
        return names[key] || key.toUpperCase();
    },

    // Get display string for action's keys
    actionKeys(action) {
        const keys = this.bindings[action] || [];
        if (keys.length === 0) return 'None';
        return keys.map(k => this.keyName(k)).join(' / ');
    },

    // Render settings panel
    render() {
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;

        const actionLabels = {
            moveUp: 'Move Up',
            moveDown: 'Move Down',
            moveLeft: 'Move Left',
            moveRight: 'Move Right',
            interact: 'Interact',
            sprint: 'Sprint',
            map: 'Open Map',
            inventory: 'Open Inventory',
            character: 'Open Character'
        };

        let html = '<h3 style="color:var(--accent-gold);margin:0 0 1rem 0">Settings</h3>';

        // Game settings
        html += '<div style="margin-bottom:1.5rem">';
        html += '<p style="color:var(--accent-gold-dim);margin-bottom:0.5rem;font-size:0.9rem">Game Options</p>';

        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0">
            <span style="font-size:0.85rem">Screen Shake</span>
            <button onclick="Settings.toggle('screenShake')" class="action-btn" style="padding:0.2rem 0.6rem;font-size:0.8rem">${this.values.screenShake ? 'ON' : 'OFF'}</button>
        </div>`;

        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0">
            <span style="font-size:0.85rem">Show FPS</span>
            <button onclick="Settings.toggle('showFPS')" class="action-btn" style="padding:0.2rem 0.6rem;font-size:0.8rem">${this.values.showFPS ? 'ON' : 'OFF'}</button>
        </div>`;

        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0">
            <span style="font-size:0.85rem">Particles</span>
            <button onclick="Settings.cycleParticles()" class="action-btn" style="padding:0.2rem 0.6rem;font-size:0.8rem">${this.values.particleDensity.toUpperCase()}</button>
        </div>`;

        html += '</div>';

        // Keybindings
        html += '<p style="color:var(--accent-gold-dim);margin-bottom:0.5rem;font-size:0.9rem">Keybindings</p>';
        html += '<div style="display:flex;flex-direction:column;gap:0.3rem">';

        for (const [action, label] of Object.entries(actionLabels)) {
            const isRebinding = this._rebinding === action;
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.5rem;background:rgba(255,255,255,0.03);border-radius:4px">
                <span style="font-size:0.85rem">${label}</span>
                <button onclick="Settings.startRebind('${action}')" id="rebind-${action}" class="action-btn" style="padding:0.2rem 0.6rem;font-size:0.75rem;min-width:80px;text-align:center;${isRebinding ? 'color:#ffaa33;border-color:#ffaa33' : ''}">
                    ${isRebinding ? 'Press a key...' : this.actionKeys(action)}
                </button>
            </div>`;
        }

        html += '</div>';

        // Reset button
        html += `<div style="margin-top:1rem;display:flex;gap:0.5rem">
            <button onclick="Settings.resetBindings();Settings.render()" class="action-btn" style="padding:0.5rem 1rem;font-size:0.85rem">Reset to Defaults</button>
        </div>`;

        // Delete save button
        html += `<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1)">
            <button onclick="if(confirm('Delete all save data?')){GameState.deleteSave();location.reload()}" class="action-btn" style="padding:0.5rem 1rem;font-size:0.85rem;color:#aa4444;border-color:#aa4444">Delete Save Data</button>
        </div>`;

        panel.innerHTML = html;
    },

    toggle(key) {
        this.values[key] = !this.values[key];
        this.save();
        this.render();
    },

    cycleParticles() {
        const order = ['low', 'medium', 'high'];
        const idx = order.indexOf(this.values.particleDensity);
        this.values.particleDensity = order[(idx + 1) % order.length];
        this.save();
        this.render();
    },

    startRebind(action) {
        this._rebinding = action;
        this.render();

        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.removeEventListener('keydown', handler, true);

            if (e.key === 'Escape') {
                this._rebinding = null;
                this.render();
                return;
            }

            // Set the new binding (keep it as a single key for simplicity)
            this.bindings[action] = [e.key];
            this._rebinding = null;
            this.save();
            this.render();
        };

        document.addEventListener('keydown', handler, true);
    }
};

// Auto-init on load
Settings.init();
