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

        // Level up particles
        this.burstParticles(window.innerWidth / 2, window.innerHeight / 2, '#c9a84c', 20);

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
    },

    // Burst particle effect at a screen position
    burstParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const dist = 40 + Math.random() * 80;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const size = 2 + Math.random() * 4;
            p.style.cssText = `
                position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
                background:${color};border-radius:50%;pointer-events:none;z-index:1000;
                box-shadow:0 0 ${size * 2}px ${color};
                transition:all 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
                opacity:1;
            `;
            document.body.appendChild(p);
            requestAnimationFrame(() => {
                p.style.transform = `translate(${dx}px, ${dy}px)`;
                p.style.opacity = '0';
            });
            setTimeout(() => { if (p.parentNode) p.remove(); }, 700);
        }
    },

    // Loot sparkle effect on an element
    lootSparkle(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const s = document.createElement('div');
            const x = rect.left + Math.random() * rect.width;
            const y = rect.top + Math.random() * rect.height;
            s.className = 'loot-sparkle';
            s.style.left = x + 'px';
            s.style.top = y + 'px';
            s.style.animationDelay = (Math.random() * 0.3) + 's';
            document.body.appendChild(s);
            setTimeout(() => { if (s.parentNode) s.remove(); }, 1000);
        }
    },

    // Boss entrance dramatic effect
    bossEntrance(bossName) {
        const overlay = document.createElement('div');
        overlay.className = 'boss-entrance-overlay';
        overlay.innerHTML = `
            <div class="boss-entrance-name">${bossName}</div>
            <div class="boss-entrance-subtitle">has appeared</div>
        `;
        document.body.appendChild(overlay);
        this.screenFlash('rgba(150,30,30,0.2)');
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 2500);
    },

    // Status text popup (e.g., "IMMUNE", "MISS", "RESIST")
    statusPopup(text, color = '#ffffff', x, y) {
        const el = document.createElement('div');
        el.className = 'status-popup';
        el.textContent = text;
        el.style.color = color;
        el.style.textShadow = `0 0 8px ${color}`;
        if (x !== undefined) el.style.left = x + 'px';
        if (y !== undefined) el.style.top = y + 'px';
        const arena = document.getElementById('combat-arena');
        (arena || document.body).appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 1200);
    },

    // Item acquired notification with icon
    itemAcquired(itemName, icon) {
        const notif = document.createElement('div');
        notif.className = 'item-acquired-notif';
        notif.innerHTML = `<span class="item-acquired-icon">${icon || '+'}</span> ${itemName}`;
        const container = document.getElementById('notifications');
        (container || document.body).appendChild(notif);
        setTimeout(() => { if (notif.parentNode) notif.remove(); }, 3000);
    },

    // Screen shake effect
    screenShake(intensity = 5, duration = 300) {
        const app = document.getElementById('app');
        if (!app) return;
        const startTime = Date.now();
        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                app.style.transform = '';
                return;
            }
            const decay = 1 - elapsed / duration;
            const dx = (Math.random() - 0.5) * intensity * 2 * decay;
            const dy = (Math.random() - 0.5) * intensity * 2 * decay;
            app.style.transform = `translate(${dx}px, ${dy}px)`;
            requestAnimationFrame(shake);
        };
        requestAnimationFrame(shake);
    },

    // Combo counter display
    comboFlash(comboCount) {
        if (comboCount < 2) return;
        const el = document.createElement('div');
        el.className = 'combo-flash';
        el.textContent = `${comboCount}x COMBO`;
        if (comboCount >= 5) el.classList.add('mega');
        else if (comboCount >= 3) el.classList.add('big');
        const arena = document.getElementById('combat-arena');
        (arena || document.body).appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 1000);
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
        } else if (region === 'shattered_spire') {
            effects.push('radial-gradient(ellipse at center, transparent 40%, rgba(20,20,60,0.18) 100%)');
            effects.push('linear-gradient(to top, rgba(30,30,80,0.1) 0%, transparent 20%)');
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
