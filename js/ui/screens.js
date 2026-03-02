// ============================================
// SCREEN MANAGER
// ============================================

const ScreenManager = {
    screens: {},
    _transitioning: false,

    init() {
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id.replace('-screen', '').replace('game-', 'game')] = screen;
        });
    },

    showScreen(name) {
        const screenId = name === 'game' ? 'game-screen' : `${name}-screen`;
        const target = document.getElementById(screenId);
        if (!target) return;

        // Find current active screen
        const current = document.querySelector('.screen.active');

        if (current && current.id !== screenId && !this._transitioning) {
            this._transitioning = true;

            // Add exit animation to current screen
            current.classList.add('screen-exit');
            current.classList.remove('active');

            // After exit animation, show new screen
            setTimeout(() => {
                current.classList.remove('screen-exit');
                target.classList.add('active');
                GameState.currentScreen = name;
                this._transitioning = false;
            }, 200);
        } else if (!current || current.id === screenId) {
            // No current screen or same screen — just show
            document.querySelectorAll('.screen').forEach(s => {
                s.classList.remove('active');
                s.classList.remove('screen-exit');
            });
            target.classList.add('active');
            GameState.currentScreen = name;
            this._transitioning = false;
        }
    }
};
