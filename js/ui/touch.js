// ============================================
// TOUCH & MOBILE SUPPORT
// ============================================

const Touch = {
    deferredPrompt: null,

    init() {
        this.preventBounce();
        this.setupInstallPrompt();
        this.handleKeyboard();
        this.setupSwipeBack();
    },

    // Prevent iOS rubber-banding on non-scrollable areas
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

    // PWA install prompt
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

        // Detect if already installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            const promptEl = document.getElementById('install-prompt');
            if (promptEl) promptEl.classList.add('hidden');
        });
    },

    async installApp() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const result = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;

        const promptEl = document.getElementById('install-prompt');
        if (promptEl) promptEl.classList.add('hidden');
    },

    // Handle keyboard appearing on mobile (resize viewport)
    handleKeyboard() {
        const viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) return;

        // On iOS, the virtual keyboard triggers resize
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                document.documentElement.style.setProperty(
                    '--keyboard-height',
                    `${window.innerHeight - window.visualViewport.height}px`
                );
            });
        }
    },

    // Swipe right on side panel to close it
    setupSwipeBack() {
        let startX = 0;
        let startY = 0;
        const sidePanel = document.getElementById('side-panel');

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!sidePanel || sidePanel.classList.contains('hidden')) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = Math.abs(endY - startY);

            // Swipe right to close (must be mostly horizontal)
            if (diffX > 80 && diffY < 50) {
                sidePanel.classList.add('hidden');
                // Reset explore tab
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                const exploreTab = document.querySelector('.nav-tab[data-tab="explore"]');
                if (exploreTab) exploreTab.classList.add('active');
                Exploration.updateActions();
            }
        }, { passive: true });
    },

    // Haptic feedback (if available)
    vibrate(ms = 10) {
        if (navigator.vibrate) {
            navigator.vibrate(ms);
        }
    }
};
