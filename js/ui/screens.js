// ============================================
// SCREEN MANAGER
// ============================================

const ScreenManager = {
    screens: {},

    init() {
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id.replace('-screen', '').replace('game-', 'game')] = screen;
        });
    },

    showScreen(name) {
        const screenId = name === 'game' ? 'game-screen' : `${name}-screen`;

        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
        });

        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            GameState.currentScreen = name;
        }
    }
};
