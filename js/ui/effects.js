// ============================================
// VISUAL EFFECTS + DIEGETIC FEEDBACK
// ============================================

const Effects = {
    levelUp() {
        if (!GameState.player) return;

        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';

        const text = document.createElement('div');
        text.className = 'level-up-text';
        text.textContent = `LEVEL ${GameState.player.level}`;

        overlay.appendChild(text);
        document.body.appendChild(overlay);

        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 1500);
    },

    screenFlash(color = 'rgba(255,255,255,0.1)') {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:${color};pointer-events:none;z-index:999;
            animation:flashOut 0.3s ease forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => {
            if (flash.parentNode) flash.remove();
        }, 300);
    }
};

// ============================================
// DIEGETIC OVERLAY SYSTEM
// ============================================

const DiegeticFX = {
    overlay: null,
    _lastHpRatio: 1,
    _lastRegion: null,

    init() {
        this.overlay = document.getElementById('diegetic-overlay');
    },

    // Called each frame from the game loop
    update() {
        if (!this.overlay) this.init();
        if (!this.overlay) return;
        if (!GameState.player) return;

        const p = GameState.player;
        const hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
        const region = GameState.currentRegion;

        // Only update DOM if something changed
        if (Math.abs(hpRatio - this._lastHpRatio) > 0.02 || region !== this._lastRegion) {
            this._lastHpRatio = hpRatio;
            this._lastRegion = region;
            this.applyEffects(hpRatio, region);
        }
    },

    applyEffects(hpRatio, region) {
        const effects = [];

        // Low HP — red vignette danger overlay
        if (hpRatio < 0.35) {
            const intensity = (0.35 - hpRatio) / 0.35;
            const alpha = (intensity * 0.3).toFixed(2);
            effects.push(`radial-gradient(ellipse at center, transparent 40%, rgba(139,46,46,${alpha}) 100%)`);
        }

        // Region-specific atmospheric effects
        if (region === 'ashen_wastes') {
            effects.push('radial-gradient(ellipse at center, transparent 50%, rgba(60,30,10,0.12) 100%)');
        } else if (region === 'hollowfen') {
            effects.push('radial-gradient(ellipse at center, transparent 40%, rgba(15,35,50,0.18) 100%)');
            effects.push('linear-gradient(to top, rgba(20,40,50,0.15) 0%, transparent 25%)');
        } else if (region === 'void_sanctum') {
            effects.push('radial-gradient(ellipse at center, transparent 35%, rgba(50,15,60,0.22) 100%)');
            effects.push('linear-gradient(135deg, rgba(80,20,100,0.08) 0%, transparent 15%, transparent 85%, rgba(80,20,100,0.08) 100%)');
        }

        if (effects.length > 0) {
            this.overlay.style.background = effects.join(', ');
        } else {
            this.overlay.style.background = 'none';
        }
    }
};

// ============================================
// NOTIFICATIONS
// ============================================

const Notifications = {
    show(text, type = '') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = text;
        container.appendChild(notif);

        setTimeout(() => {
            if (notif.parentNode) notif.remove();
        }, 3000);
    }
};
