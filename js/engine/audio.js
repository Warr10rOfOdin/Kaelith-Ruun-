// ============================================
// AUDIO ENGINE — Procedural Sound via Web Audio API
// ============================================
// All sounds are generated procedurally — no external files needed.

const Audio = {
    ctx: null,
    masterGain: null,
    musicGain: null,
    sfxGain: null,
    enabled: true,
    musicEnabled: true,
    sfxVolume: 0.5,
    musicVolume: 0.3,
    _currentAmbient: null,
    _ambientInterval: null,

    init() {
        // Lazy-init on first user gesture (required by browsers)
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 1.0;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            // Load volume from settings
            const savedVol = localStorage.getItem('kr_sfx_volume');
            if (savedVol !== null) this.setSfxVolume(parseFloat(savedVol));
            const savedMusic = localStorage.getItem('kr_music_volume');
            if (savedMusic !== null) this.setMusicVolume(parseFloat(savedMusic));
            const savedEnabled = localStorage.getItem('kr_audio_enabled');
            if (savedEnabled !== null) this.enabled = savedEnabled === 'true';
        } catch (e) {
            this.enabled = false;
        }
    },

    ensure() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    setSfxVolume(v) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
        if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
        localStorage.setItem('kr_sfx_volume', this.sfxVolume);
    },

    setMusicVolume(v) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
        localStorage.setItem('kr_music_volume', this.musicVolume);
    },

    toggleAudio() {
        this.enabled = !this.enabled;
        localStorage.setItem('kr_audio_enabled', this.enabled);
        if (!this.enabled) this.stopAmbient();
    },

    // =========================================
    // HELPER: Create oscillator note
    // =========================================
    _osc(type, freq, startTime, duration, gainVal, dest) {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainVal, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(dest || this.sfxGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
    },

    _noise(startTime, duration, gainVal, dest) {
        if (!this.ctx || !this.enabled) return;
        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainVal, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(dest || this.sfxGain);
        src.start(startTime);
        src.stop(startTime + duration);
    },

    // =========================================
    // COMBAT SOUNDS
    // =========================================
    playAttack() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Metallic slash
        this._noise(t, 0.08, 0.3);
        this._osc('sawtooth', 200, t, 0.06, 0.15);
        this._osc('sawtooth', 150, t + 0.02, 0.08, 0.1);
    },

    playCritical() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._noise(t, 0.12, 0.4);
        this._osc('sawtooth', 300, t, 0.05, 0.2);
        this._osc('square', 400, t + 0.03, 0.08, 0.15);
        this._osc('sawtooth', 200, t + 0.05, 0.1, 0.12);
    },

    playEnemyHit() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc('square', 120, t, 0.08, 0.15);
        this._noise(t, 0.06, 0.2);
    },

    playMiss() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc('sine', 300, t, 0.15, 0.08);
        this._osc('sine', 200, t + 0.08, 0.1, 0.05);
    },

    playDefend() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Shield clang
        this._osc('triangle', 800, t, 0.05, 0.15);
        this._osc('triangle', 600, t + 0.03, 0.08, 0.1);
        this._noise(t, 0.04, 0.15);
    },

    playSpell(element) {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        if (element === 'fire') {
            this._noise(t, 0.3, 0.2);
            this._osc('sawtooth', 100, t, 0.15, 0.12);
            this._osc('sawtooth', 80, t + 0.1, 0.2, 0.1);
        } else if (element === 'ice') {
            this._osc('sine', 1200, t, 0.1, 0.1);
            this._osc('sine', 1500, t + 0.05, 0.15, 0.08);
            this._osc('triangle', 800, t + 0.1, 0.2, 0.06);
        } else {
            // Generic magical
            this._osc('sine', 600, t, 0.08, 0.12);
            this._osc('sine', 900, t + 0.05, 0.1, 0.1);
            this._osc('triangle', 500, t + 0.1, 0.15, 0.08);
        }
    },

    playHeal() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Ascending chime
        this._osc('sine', 523, t, 0.15, 0.12);
        this._osc('sine', 659, t + 0.1, 0.15, 0.1);
        this._osc('sine', 784, t + 0.2, 0.2, 0.08);
    },

    playPoison() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc('sawtooth', 80, t, 0.2, 0.1);
        this._osc('square', 60, t + 0.1, 0.15, 0.08);
    },

    // =========================================
    // UI / PROGRESSION SOUNDS
    // =========================================
    playLevelUp() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Triumphant ascending arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            this._osc('sine', freq, t + i * 0.12, 0.3, 0.12);
            this._osc('triangle', freq * 0.5, t + i * 0.12, 0.25, 0.06);
        });
    },

    playVictory() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Short fanfare
        const melody = [523, 659, 784, 659, 784, 1047];
        melody.forEach((freq, i) => {
            this._osc('triangle', freq, t + i * 0.15, 0.2, 0.1);
        });
    },

    playDefeat() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Descending somber tones
        this._osc('sine', 400, t, 0.4, 0.1);
        this._osc('sine', 300, t + 0.3, 0.4, 0.08);
        this._osc('sine', 200, t + 0.6, 0.6, 0.06);
    },

    playLoot() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Coin / pickup chime
        this._osc('sine', 1200, t, 0.08, 0.1);
        this._osc('sine', 1600, t + 0.06, 0.1, 0.08);
    },

    playLootRare() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Sparkly rare find
        const notes = [800, 1000, 1200, 1600];
        notes.forEach((f, i) => {
            this._osc('sine', f, t + i * 0.08, 0.2, 0.1);
        });
    },

    playNotification() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc('sine', 880, t, 0.08, 0.08);
        this._osc('sine', 1100, t + 0.06, 0.1, 0.06);
    },

    playMenuSelect() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc('sine', 700, t, 0.05, 0.06);
    },

    playMenuBack() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        this._osc('sine', 500, t, 0.05, 0.06);
    },

    playGather() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Chop/mine sound
        this._noise(t, 0.06, 0.15);
        this._osc('triangle', 200, t, 0.08, 0.1);
    },

    playFishCast() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Whoosh + splash
        this._osc('sine', 400, t, 0.1, 0.06);
        this._osc('sine', 200, t + 0.05, 0.1, 0.04);
        this._noise(t + 0.12, 0.08, 0.1);
    },

    playFishBite() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Alert plop
        this._osc('sine', 600, t, 0.06, 0.12);
        this._osc('sine', 800, t + 0.04, 0.06, 0.1);
    },

    playFishCatch() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Splash + success
        this._noise(t, 0.1, 0.15);
        this._osc('sine', 800, t + 0.08, 0.1, 0.1);
        this._osc('sine', 1000, t + 0.15, 0.12, 0.08);
    },

    playCraft() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Anvil strike
        this._osc('triangle', 1000, t, 0.03, 0.15);
        this._osc('triangle', 800, t + 0.05, 0.06, 0.1);
        this._noise(t, 0.04, 0.12);
    },

    playBuild() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Hammer + wood
        this._noise(t, 0.05, 0.15);
        this._osc('square', 150, t, 0.06, 0.1);
        this._noise(t + 0.15, 0.05, 0.12);
        this._osc('square', 180, t + 0.15, 0.06, 0.08);
    },

    playBossPhase() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Dramatic rumble + roar
        this._osc('sawtooth', 60, t, 0.5, 0.15);
        this._osc('sawtooth', 80, t + 0.1, 0.4, 0.12);
        this._noise(t + 0.2, 0.3, 0.1);
        this._osc('square', 120, t + 0.3, 0.3, 0.08);
    },

    playBossIntro() {
        this.ensure();
        if (!this.ctx || !this.enabled) return;
        const t = this.ctx.currentTime;
        // Ominous build-up
        this._osc('sawtooth', 50, t, 0.8, 0.1);
        this._osc('sawtooth', 55, t + 0.2, 0.6, 0.08);
        this._osc('square', 100, t + 0.5, 0.4, 0.12);
        this._osc('triangle', 200, t + 0.7, 0.3, 0.1);
        this._noise(t + 0.8, 0.2, 0.15);
    },

    // =========================================
    // AMBIENT MUSIC (Simple procedural loops)
    // =========================================
    startAmbient(region) {
        if (!this.enabled || !this.musicEnabled) return;
        this.ensure();
        if (!this.ctx) return;

        // Don't restart if same region
        if (this._currentAmbient === region) return;
        this.stopAmbient();
        this._currentAmbient = region;

        const playNote = () => {
            if (!this.ctx || !this.enabled || !this.musicEnabled) return;
            const t = this.ctx.currentTime;

            let notes, tempo, type;
            if (region === 'ashen_wastes') {
                notes = [196, 220, 262, 220, 196, 165];
                tempo = 800;
                type = 'sine';
            } else if (region === 'hollowfen') {
                notes = [165, 196, 185, 165, 147, 165];
                tempo = 1000;
                type = 'triangle';
            } else if (region === 'void_sanctum') {
                notes = [131, 147, 165, 156, 131, 110];
                tempo = 900;
                type = 'sine';
            } else if (region === 'shattered_spire') {
                notes = [330, 392, 440, 494, 392, 330];
                tempo = 850;
                type = 'triangle';
            } else {
                notes = [262, 294, 330, 294, 262, 247];
                tempo = 700;
                type = 'sine';
            }

            const idx = Math.floor(Math.random() * notes.length);
            this._osc(type, notes[idx], t, 1.5, 0.04, this.musicGain);

            // Subtle harmony
            if (Math.random() < 0.3) {
                this._osc(type, notes[idx] * 1.5, t + 0.2, 1.0, 0.02, this.musicGain);
            }
        };

        playNote();
        this._ambientInterval = setInterval(playNote, 2500 + Math.random() * 1500);
    },

    stopAmbient() {
        if (this._ambientInterval) {
            clearInterval(this._ambientInterval);
            this._ambientInterval = null;
        }
        this._currentAmbient = null;
    },

    // Combat ambient — tense undertone
    startCombatAmbient(isBoss) {
        this.stopAmbient();
        if (!this.enabled || !this.musicEnabled) return;
        this.ensure();
        if (!this.ctx) return;

        this._currentAmbient = 'combat';
        const playBeat = () => {
            if (!this.ctx || !this.enabled || !this.musicEnabled) return;
            const t = this.ctx.currentTime;

            if (isBoss) {
                // Heavier bass
                this._osc('sawtooth', 55, t, 0.3, 0.04, this.musicGain);
                this._osc('square', 110, t + 0.4, 0.2, 0.02, this.musicGain);
            } else {
                this._osc('triangle', 80, t, 0.2, 0.03, this.musicGain);
            }

            if (Math.random() < 0.4) {
                const tension = [147, 156, 165, 175][Math.floor(Math.random() * 4)];
                this._osc('sine', tension, t + 0.6, 0.8, 0.02, this.musicGain);
            }
        };

        playBeat();
        this._ambientInterval = setInterval(playBeat, 1800 + Math.random() * 600);
    }
};
