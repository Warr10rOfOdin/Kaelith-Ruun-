// ============================================
// ECHOES OF RUUN — PERMANENT BOON SYSTEM
// Fragments of the Shattering that attune to the
// player. Earned from boss kills and Resonant
// Shrines. Stored on GameState.player.echoes.
// ============================================

const ECHOES = {
    // ── Facet of War ──
    emberbrand: {
        name: 'Emberbrand', icon: '🔥', facet: 'war', rarity: 'rare',
        desc: 'All damage you deal is increased by 10%.',
        mods: { damageDealt: 1.10 }
    },
    executioner: {
        name: "Executioner's Echo", icon: '⚔️', facet: 'war', rarity: 'common',
        desc: '+10% critical hit chance.',
        mods: { critBonus: 10 }
    },
    bloodthirst: {
        name: 'Bloodthirst', icon: '🩸', facet: 'war', rarity: 'rare',
        desc: 'Slaying a foe restores 15% of your maximum HP.',
        mods: { onKillHealPct: 0.15 }
    },
    pyre_heart: {
        name: 'Pyre Heart', icon: '🜂', facet: 'war', rarity: 'common',
        desc: 'Fire abilities deal 25% more damage.',
        mods: { elementBonus: { fire: 0.25 } }
    },
    storm_sigil: {
        name: 'Storm Sigil', icon: '🜁', facet: 'war', rarity: 'common',
        desc: 'Lightning abilities deal 25% more damage.',
        mods: { elementBonus: { lightning: 0.25 } }
    },
    frost_sigil: {
        name: 'Frost Sigil', icon: '🜄', facet: 'war', rarity: 'common',
        desc: 'Ice abilities deal 25% more damage.',
        mods: { elementBonus: { ice: 0.25 } }
    },
    night_sigil: {
        name: 'Night Sigil', icon: '🜃', facet: 'war', rarity: 'common',
        desc: 'Shadow abilities deal 25% more damage.',
        mods: { elementBonus: { shadow: 0.25 } }
    },

    // ── Facet of Ward ──
    stoneskin: {
        name: 'Stoneskin Echo', icon: '🛡️', facet: 'ward', rarity: 'rare',
        desc: 'You take 10% less damage from all sources.',
        mods: { damageTaken: 0.90 }
    },
    bulwark: {
        name: 'Bulwark of Ash', icon: '🏰', facet: 'ward', rarity: 'common',
        desc: 'Defending blocks 70% of damage instead of 50%.',
        mods: { defendMult: 0.30 }
    },
    mirror_soul: {
        name: 'Mirror Soul', icon: '🪞', facet: 'ward', rarity: 'common',
        desc: 'Successful counters reflect 40% damage instead of 20%.',
        mods: { counterReflect: 0.40 }
    },
    second_wind: {
        name: 'Second Wind', icon: '🕯️', facet: 'ward', rarity: 'legendary',
        desc: 'Once per battle, a lethal blow leaves you at 1 HP instead.',
        mods: { deathWard: true }
    },

    // ── Facet of Wisdom ──
    clear_mind: {
        name: 'Clear Mind', icon: '💠', facet: 'wisdom', rarity: 'rare',
        desc: 'Abilities cost 15% less MP.',
        mods: { mpCostMult: 0.85 }
    },
    mana_spring: {
        name: 'Mana Spring', icon: '🌊', facet: 'wisdom', rarity: 'common',
        desc: 'Recover 4 MP at the end of every combat round.',
        mods: { mpRegen: 4 }
    },
    scholars_eye: {
        name: "Scholar's Eye", icon: '📖', facet: 'wisdom', rarity: 'common',
        desc: 'Gain 15% more experience from battle.',
        mods: { xpMult: 1.15 }
    },
    gilded_tongue: {
        name: 'Gilded Tongue', icon: '🪙', facet: 'wisdom', rarity: 'common',
        desc: 'Gain 25% more gold from battle.',
        mods: { goldMult: 1.25 }
    },
    echo_sight: {
        name: 'Echo Sight', icon: '👁️', facet: 'wisdom', rarity: 'legendary',
        desc: 'Enemy weaknesses and resistances are revealed when battle begins.',
        mods: { revealWeaknesses: true }
    }
};

const Echoes = {
    FACETS: {
        war: { name: 'War', color: 'var(--accent-red-bright)' },
        ward: { name: 'Ward', color: 'var(--accent-green-bright)' },
        wisdom: { name: 'Wisdom', color: 'var(--accent-blue-bright)' }
    },

    list() {
        if (!GameState.player) return [];
        if (!GameState.player.echoes) GameState.player.echoes = [];
        return GameState.player.echoes;
    },

    has(key) {
        return this.list().includes(key);
    },

    grant(key) {
        if (!ECHOES[key] || this.has(key)) return false;
        this.list().push(key);
        const echo = ECHOES[key];
        if (typeof Notifications !== 'undefined') {
            Notifications.show(`Echo attuned: ${echo.icon} ${echo.name}`, 'gold');
        }
        if (typeof Narrative !== 'undefined') {
            Narrative.addStory(`A fragment of the Shattering settles into your soul. ${echo.name}: ${echo.desc}`);
        }
        if (typeof Audio !== 'undefined') Audio.playLevelUp();
        GameState.checkAchievements();
        GameState.save();
        return true;
    },

    // Echoes the player does not yet have
    available() {
        return Object.keys(ECHOES).filter(k => !this.has(k));
    },

    // Pick n random un-owned echoes
    randomChoices(n) {
        const pool = this.available();
        const picks = [];
        while (picks.length < n && pool.length > 0) {
            const idx = Math.floor(Math.random() * pool.length);
            picks.push(pool.splice(idx, 1)[0]);
        }
        return picks;
    },

    // ── Aggregated modifiers (queried by combat) ──

    _sum(fn, initial) {
        let acc = initial;
        for (const key of this.list()) {
            const echo = ECHOES[key];
            if (echo && echo.mods) acc = fn(acc, echo.mods);
        }
        return acc;
    },

    damageDealtMult() {
        return this._sum((acc, m) => acc * (m.damageDealt || 1), 1);
    },

    damageTakenMult() {
        return this._sum((acc, m) => acc * (m.damageTaken || 1), 1);
    },

    critBonus() {
        return this._sum((acc, m) => acc + (m.critBonus || 0), 0);
    },

    elementBonus(element) {
        if (!element) return 0;
        return this._sum((acc, m) => acc + ((m.elementBonus && m.elementBonus[element]) || 0), 0);
    },

    mpCostMult() {
        return this._sum((acc, m) => acc * (m.mpCostMult || 1), 1);
    },

    mpRegen() {
        return this._sum((acc, m) => acc + (m.mpRegen || 0), 0);
    },

    xpMult() {
        return this._sum((acc, m) => acc * (m.xpMult || 1), 1);
    },

    goldMult() {
        return this._sum((acc, m) => acc * (m.goldMult || 1), 1);
    },

    onKillHealPct() {
        return this._sum((acc, m) => acc + (m.onKillHealPct || 0), 0);
    },

    defendMult() {
        // Lowest (best) defend multiplier; default 0.5
        return this._sum((acc, m) => Math.min(acc, m.defendMult || 0.5), 0.5);
    },

    counterReflect() {
        return this._sum((acc, m) => Math.max(acc, m.counterReflect || 0.2), 0.2);
    },

    hasDeathWard() {
        return this._sum((acc, m) => acc || !!m.deathWard, false);
    },

    hasRevealWeaknesses() {
        return this._sum((acc, m) => acc || !!m.revealWeaknesses, false);
    },

    // ── Offering UI (boss rewards & shrines) ──

    // Show a choice of echoes; onDone called after pick (or skip)
    showOffering(count, title, subtitle, onDone) {
        const choices = this.randomChoices(count);
        if (choices.length === 0) {
            if (onDone) onDone(null);
            return;
        }

        const container = document.getElementById('game-container') || document.body;
        const overlay = document.createElement('div');
        overlay.className = 'skill-choice-overlay echo-offering';
        overlay.innerHTML = `
            <div class="skill-choice-panel">
                <div class="skill-choice-header">${title || 'An Echo Resonates'}</div>
                <div class="skill-choice-subheader">${subtitle || 'Attune one fragment of the Shattering'}</div>
                <div class="skill-choice-options">
                    ${choices.map(key => {
                        const e = ECHOES[key];
                        const facet = this.FACETS[e.facet];
                        return `
                        <button class="skill-choice-btn echo-choice-btn rarity-${e.rarity}" data-echo="${key}">
                            <div class="echo-choice-top">
                                <span class="echo-choice-icon">${e.icon}</span>
                                <span class="echo-facet-tag" style="color:${facet.color}">${facet.name}</span>
                            </div>
                            <div class="skill-choice-name">${e.name}</div>
                            <div class="skill-choice-cost">${e.rarity.toUpperCase()}</div>
                            <div class="skill-choice-desc">${e.desc}</div>
                        </button>`;
                    }).join('')}
                </div>
            </div>
        `;

        container.appendChild(overlay);

        overlay.querySelectorAll('.echo-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.echo;
                btn.style.borderColor = 'var(--accent-gold)';
                btn.style.boxShadow = '0 0 24px rgba(201,168,76,0.4)';
                this.grant(key);
                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                    if (onDone) onDone(key);
                }, 450);
            });
        });
    }
};
