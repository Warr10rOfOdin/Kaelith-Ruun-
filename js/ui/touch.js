// ============================================
// TOUCH & MOBILE SUPPORT
// ============================================

const Touch = {
    deferredPrompt: null,
    _initialized: false,

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this.preventBounce();
        // Only show PWA install prompt in browser mode, not in native app
        if (!NativeBridge.isNative) {
            this.setupInstallPrompt();
        }
        this.handleKeyboard();
        this.setupSwipeBack();
        this.setupSheetDrag();
    },

    preventBounce() {
        document.body.addEventListener('touchmove', (e) => {
            const target = e.target;
            let scrollable = false;
            let el = target;
            while (el && el !== document.body) {
                const style = window.getComputedStyle(el);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    if (el.scrollHeight > el.clientHeight) {
                        scrollable = true;
                        break;
                    }
                }
                el = el.parentElement;
            }
            if (!scrollable) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            const promptEl = document.getElementById('install-prompt');
            if (promptEl) {
                promptEl.classList.remove('hidden');
                promptEl.onclick = () => this.installApp();
            }
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            const promptEl = document.getElementById('install-prompt');
            if (promptEl) promptEl.classList.add('hidden');
        });
    },

    async installApp() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;

        const promptEl = document.getElementById('install-prompt');
        if (promptEl) promptEl.classList.add('hidden');
    },

    handleKeyboard() {
        // Native keyboard handling is done by NativeBridge
        if (NativeBridge.isNative) return;

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                document.documentElement.style.setProperty(
                    '--keyboard-height',
                    `${window.innerHeight - window.visualViewport.height}px`
                );
            });
        }
    },

    setupSwipeBack() {
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const sidePanel = document.getElementById('side-panel');
            if (!sidePanel || sidePanel.classList.contains('hidden')) return;

            if (e.changedTouches && e.changedTouches.length > 0) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = endX - startX;
                const diffY = Math.abs(endY - startY);

                if (diffX > 80 && diffY < 50) {
                    if (typeof Game !== 'undefined' && Game.closePanel) Game.closePanel();
                }
            }
        }, { passive: true });
    },

    // Drag the sheet grip downward to dismiss the bottom sheet
    setupSheetDrag() {
        const grip = document.getElementById('sheet-grip');
        const panel = document.getElementById('side-panel');
        if (!grip || !panel) return;

        let dragStartY = null;

        grip.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                dragStartY = e.touches[0].clientY;
                panel.style.transition = 'none';
            }
        }, { passive: true });

        grip.addEventListener('touchmove', (e) => {
            if (dragStartY === null || !e.touches || e.touches.length === 0) return;
            const dy = Math.max(0, e.touches[0].clientY - dragStartY);
            panel.style.transform = `translateY(${dy}px)`;
        }, { passive: true });

        grip.addEventListener('touchend', (e) => {
            if (dragStartY === null) return;
            const endY = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].clientY : dragStartY;
            const dy = endY - dragStartY;
            dragStartY = null;
            panel.style.transition = '';
            panel.style.transform = '';
            if (dy > 90) {
                if (typeof Game !== 'undefined' && Game.closePanel) Game.closePanel();
            }
        }, { passive: true });
    },

    // Haptic feedback — uses native haptics when available
    vibrate(ms = 10) {
        NativeBridge.hapticLight();
    }
};
