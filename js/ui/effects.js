// ============================================
// VISUAL EFFECTS
// ============================================

const Effects = {
    levelUp() {
        const overlay = document.createElement('div');
        overlay.className = 'level-up-overlay';

        const text = document.createElement('div');
        text.className = 'level-up-text';
        text.textContent = `LEVEL ${GameState.player.level}`;

        overlay.appendChild(text);
        document.body.appendChild(overlay);

        setTimeout(() => overlay.remove(), 1500);
    },

    screenFlash(color = 'rgba(255,255,255,0.1)') {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:${color};pointer-events:none;z-index:999;
            animation:flashOut 0.3s ease forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    }
};

// ============================================
// NOTIFICATIONS
// ============================================

const Notifications = {
    show(text, type = '') {
        const container = document.getElementById('notifications');
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = text;
        container.appendChild(notif);

        setTimeout(() => notif.remove(), 3000);
    }
};
