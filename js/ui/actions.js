// ============================================
// ACTION BAR MANAGER
// ============================================

const Actions = {
    setButtons(buttons) {
        const container = document.getElementById('action-buttons');
        container.innerHTML = '';

        buttons.forEach(btn => {
            const el = document.createElement('button');
            el.className = `action-btn ${btn.class || ''}`;
            el.textContent = btn.text;
            el.setAttribute('onclick', btn.action);
            if (btn.disabled) el.disabled = true;
            container.appendChild(el);
        });
    },

    clearButtons() {
        document.getElementById('action-buttons').innerHTML = '';
    }
};
