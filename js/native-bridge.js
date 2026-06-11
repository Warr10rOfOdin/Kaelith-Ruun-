// ============================================
// NATIVE BRIDGE — Capacitor Native APIs
// Provides real native mobile features when
// running as a native app, falls back to web
// APIs when running in a browser.
// ============================================

const NativeBridge = {
    isNative: false,
    plugins: {},

    async init() {
        // Detect if running inside Capacitor native shell
        this.isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

        if (!this.isNative) {
            console.log('[NativeBridge] Running in browser mode');
            return;
        }

        console.log('[NativeBridge] Running as native app on:', Capacitor.getPlatform());

        try {
            // Import native plugins
            const { Haptics } = await import('https://esm.sh/@capacitor/haptics');
            const { StatusBar, Style } = await import('https://esm.sh/@capacitor/status-bar');
            const { SplashScreen } = await import('https://esm.sh/@capacitor/splash-screen');
            const { Keyboard } = await import('https://esm.sh/@capacitor/keyboard');
            const { App } = await import('https://esm.sh/@capacitor/app');

            this.plugins = { Haptics, StatusBar, Style, SplashScreen, Keyboard, App };

            await this.configureStatusBar();
            await this.configureBackButton();
            await this.configureKeyboard();
        } catch (e) {
            console.warn('[NativeBridge] Plugin init error:', e);
            // Still native, just some plugins failed
        }
    },

    // =========================================
    // STATUS BAR — dark style to match game theme
    // =========================================
    async configureStatusBar() {
        const { StatusBar, Style } = this.plugins;
        if (!StatusBar) return;

        try {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#0a0a0f' });

            // On Android, make status bar overlay content for immersive feel
            if (Capacitor.getPlatform() === 'android') {
                await StatusBar.setOverlaysWebView({ overlay: true });
            }
        } catch (e) {
            console.warn('[NativeBridge] StatusBar error:', e);
        }
    },

    // =========================================
    // BACK BUTTON — Android hardware back
    // =========================================
    async configureBackButton() {
        const { App } = this.plugins;
        if (!App) return;

        App.addListener('backButton', ({ canGoBack }) => {
            // If a side panel is open, close it
            const sidePanel = document.getElementById('side-panel');
            if (sidePanel && !sidePanel.classList.contains('hidden')) {
                if (typeof Game !== 'undefined' && Game.closePanel) Game.closePanel();
                return;
            }

            // If dialogue is open, close it
            const dialogueOverlay = document.getElementById('dialogue-overlay');
            if (dialogueOverlay && !dialogueOverlay.classList.contains('hidden')) {
                Dialogue.close();
                return;
            }

            // If in combat, don't allow back
            if (Combat.active) {
                return;
            }

            // If on game screen, go to title? Or minimize app
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen && gameScreen.classList.contains('active')) {
                // Minimize app instead of closing
                App.minimizeApp();
                return;
            }

            // If on other screens, go back to title
            const titleScreen = document.getElementById('title-screen');
            if (titleScreen && !titleScreen.classList.contains('active')) {
                ScreenManager.showScreen('title');
                return;
            }

            // On title screen, exit
            App.exitApp();
        });
    },

    // =========================================
    // KEYBOARD — native keyboard handling
    // =========================================
    async configureKeyboard() {
        const { Keyboard } = this.plugins;
        if (!Keyboard) return;

        Keyboard.addListener('keyboardWillShow', (info) => {
            document.documentElement.style.setProperty(
                '--keyboard-height', `${info.keyboardHeight}px`
            );
        });

        Keyboard.addListener('keyboardWillHide', () => {
            document.documentElement.style.setProperty('--keyboard-height', '0px');
        });
    },

    // =========================================
    // HAPTICS — real native vibration feedback
    // =========================================
    async hapticLight() {
        if (!this.isNative || !this.plugins.Haptics) {
            // Fallback to web vibration
            if (navigator.vibrate) navigator.vibrate(10);
            return;
        }
        try {
            await this.plugins.Haptics.impact({ style: 'light' });
        } catch (e) { /* silent */ }
    },

    async hapticMedium() {
        if (!this.isNative || !this.plugins.Haptics) {
            if (navigator.vibrate) navigator.vibrate(25);
            return;
        }
        try {
            await this.plugins.Haptics.impact({ style: 'medium' });
        } catch (e) { /* silent */ }
    },

    async hapticHeavy() {
        if (!this.isNative || !this.plugins.Haptics) {
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }
        try {
            await this.plugins.Haptics.impact({ style: 'heavy' });
        } catch (e) { /* silent */ }
    },

    async hapticNotification(type = 'success') {
        if (!this.isNative || !this.plugins.Haptics) {
            if (navigator.vibrate) navigator.vibrate(type === 'error' ? [50, 30, 50] : 30);
            return;
        }
        try {
            await this.plugins.Haptics.notification({ type });
        } catch (e) { /* silent */ }
    },

    // =========================================
    // SPLASH SCREEN — hide when game is ready
    // =========================================
    async hideSplash() {
        if (!this.isNative || !this.plugins.SplashScreen) return;
        try {
            await this.plugins.SplashScreen.hide({ fadeOutDuration: 500 });
        } catch (e) { /* silent */ }
    },

    // =========================================
    // PLATFORM INFO
    // =========================================
    getPlatform() {
        if (this.isNative) return Capacitor.getPlatform();
        return 'web';
    }
};
