// ============================================
// COMBAT ENGINE
// ============================================

const Combat = {
    active: false,
    enemy: null,
    enemyMaxHp: 0,
    turnOrder: [],
    currentTurn: 0,
    playerDefending: false,
    turnCount: 0,
    playerBuffs: [],
    enemyBuffs: [],
    log: null,
    onCombatEnd: null,
    _pendingTimers: [],
    comboCount: 0,
    maxCombo: 0,
    totalDamageDealt: 0,

    start(enemyKey, onEnd) {
        const template = ENEMIES[enemyKey];
        if (!template) return;

        // Clear any pending timers from previous combat
        this._clearTimers();

        this.active = true;
        this.onCombatEnd = onEnd || null;

        // Scale enemy slightly based on level difference
        const levelDiff = Math.max(0, template.level - GameState.player.level);
        const scale = 1 + (levelDiff * 0.1);

        this.enemy = {
            key: enemyKey,
            name: template.name,
            icon: template.icon,
            level: template.level,
            hp: Math.floor(template.hp * scale),
            maxHp: Math.floor(template.hp * scale),
            attack: Math.floor(template.attack * scale),
            defense: template.defense,
            speed: template.speed,
            magicDefense: template.magicDefense || 0,
            abilities: [...(template.abilities || [])],
            isBoss: template.isBoss || false,
            phases: template.phases || [],
            currentPhase: 0,
            lootTable: template.lootTable,
            xpReward: template.xpReward,
            goldReward: template.goldReward
        };

        this.enemyMaxHp = this.enemy.maxHp;
        this.playerDefending = false;
        this.turnCount = 0;
        this.playerBuffs = [];
        this.enemyBuffs = [];
        this.comboCount = 0;
        this.maxCombo = 0;
        this.totalDamageDealt = 0;

        // Ensure player statusEffects array exists
        if (!GameState.player.statusEffects) GameState.player.statusEffects = [];

        // Show combat screen with region-specific background
        ScreenManager.showScreen('combat');
        const combatScreen = document.getElementById('combat-screen');
        if (combatScreen) {
            combatScreen.classList.remove('region-ashen', 'region-hollowfen', 'region-void');
            const region = GameState.currentRegion || 'ashen_wastes';
            if (region === 'ashen_wastes') combatScreen.classList.add('region-ashen');
            else if (region === 'hollowfen') combatScreen.classList.add('region-hollowfen');
            else if (region === 'void_sanctum') combatScreen.classList.add('region-void');
        }

        // Boss intro effect
        if (this.enemy.isBoss) {
            this.showBossIntro();
            if (typeof Audio !== 'undefined') Audio.playBossIntro();
        }

        // Start combat ambient music
        if (typeof Audio !== 'undefined') Audio.startCombatAmbient(this.enemy.isBoss);

        this.renderCombatUI();
        this.logCombat(`A ${this.enemy.name} appears!`, 'info');

        if (this.enemy.isBoss && this.enemy.phases.length > 0) {
            this.logCombat(this.enemy.phases[0].message, 'info');
        }

        this.enableActions();
    },

    _clearTimers() {
        this._pendingTimers.forEach(id => clearTimeout(id));
        this._pendingTimers = [];
    },

    _setTimeout(fn, delay) {
        const id = setTimeout(() => {
            this._pendingTimers = this._pendingTimers.filter(t => t !== id);
            fn();
        }, delay);
        this._pendingTimers.push(id);
        return id;
    },

    renderCombatUI() {
        // Enemy display with pixel art sprite
        const enemyDisplay = document.getElementById('enemy-display');
        if (enemyDisplay) {
            const sprite = typeof Sprites !== 'undefined' ? Sprites.getCombatSprite(this.enemy.key) : null;
            if (sprite) {
                enemyDisplay.innerHTML = `
                    <canvas id="enemy-canvas" class="enemy-art-canvas" width="${sprite.width}" height="${sprite.height}"></canvas>
                    <div class="enemy-name">${this.enemy.name}</div>
                    <div class="enemy-level">Level ${this.enemy.level}</div>
                `;
                const eCanvas = document.getElementById('enemy-canvas');
                if (eCanvas) {
                    const ectx = eCanvas.getContext('2d');
                    ectx.imageSmoothingEnabled = false;
                    ectx.drawImage(sprite, 0, 0);
                }
            } else {
                enemyDisplay.innerHTML = `
                    <div class="enemy-art">${this.enemy.icon}</div>
                    <div class="enemy-name">${this.enemy.name}</div>
                    <div class="enemy-level">Level ${this.enemy.level}</div>
                `;
            }
        }

        // Enemy bars
        const enemyBars = document.getElementById('enemy-bars');
        if (enemyBars) {
            enemyBars.innerHTML = `
                <div class="combat-bar-container">
                    <div id="enemy-hp-bar" class="combat-bar enemy-hp" style="width: 100%"></div>
                    <span class="combat-bar-text" id="enemy-hp-text">${this.enemy.hp} / ${this.enemy.maxHp}</span>
                </div>
            `;
        }

        // Player combat sprite
        const playerSection = document.getElementById('player-combat-section');
        if (playerSection && typeof Sprites !== 'undefined') {
            let spriteDiv = document.getElementById('player-combat-sprite');
            if (!spriteDiv) {
                spriteDiv = document.createElement('div');
                spriteDiv.id = 'player-combat-sprite';
                playerSection.insertBefore(spriteDiv, playerSection.firstChild);
            }
            const playerSprite = Sprites.getPlayerSprite ? Sprites.getPlayerSprite() : null;
            if (playerSprite) {
                spriteDiv.innerHTML = '';
                const pCanvas = document.createElement('canvas');
                pCanvas.width = playerSprite.width;
                pCanvas.height = playerSprite.height;
                const pCtx = pCanvas.getContext('2d');
                pCtx.imageSmoothingEnabled = false;
                pCtx.drawImage(playerSprite, 0, 0);
                spriteDiv.appendChild(pCanvas);
            }
        }

        // Player bars — guard against division by zero
        const playerBars = document.getElementById('player-combat-bars');
        if (playerBars) {
            const hpPct = GameState.player.maxHp > 0 ? Math.min(100, Math.max(0, (GameState.player.hp / GameState.player.maxHp) * 100)) : 0;
            const mpPct = GameState.player.maxMp > 0 ? Math.min(100, Math.max(0, (GameState.player.mp / GameState.player.maxMp) * 100)) : 0;

            playerBars.innerHTML = `
                <div class="combat-bar-container">
                    <div id="player-combat-hp" class="combat-bar player-hp" style="width: ${hpPct}%"></div>
                    <span class="combat-bar-text">${GameState.player.hp} / ${GameState.player.maxHp} HP</span>
                </div>
                <div class="combat-bar-container">
                    <div id="player-combat-mp" class="combat-bar player-mp" style="width: ${mpPct}%"></div>
                    <span class="combat-bar-text">${GameState.player.mp} / ${GameState.player.maxMp} MP</span>
                </div>
            `;
        }

        // Combat actions
        this.renderActions();

        // Clear combat log
        this.log = document.getElementById('combat-log');
        if (this.log) this.log.innerHTML = '';
    },

    renderActions() {
        const actionsDiv = document.getElementById('combat-actions');
        if (!actionsDiv) return;
        const p = GameState.player;

        let html = '';

        // Basic attack
        html += `<button class="combat-btn attack" onclick="Combat.playerAction('attack')">Attack</button>`;

        // Abilities
        if (p.abilities && p.abilities.length > 0) {
            p.abilities.forEach((ability, idx) => {
                if (!ability) return;
                const canUse = ability.mpCost <= p.mp;
                html += `<button class="combat-btn magic" ${!canUse ? 'disabled' : ''} onclick="Combat.playerAction('ability', ${idx})">${ability.name} (${ability.mpCost} MP)</button>`;
            });
        }

        // Use item
        const hasConsumables = p.inventory.some(i => ITEMS[i.key] && ITEMS[i.key].type === 'consumable');
        html += `<button class="combat-btn item" ${!hasConsumables ? 'disabled' : ''} onclick="Combat.showItemMenu()">Use Item</button>`;

        // Defend
        html += `<button class="combat-btn defend" onclick="Combat.playerAction('defend')">Defend</button>`;

        // Flee
        if (!this.enemy.isBoss) {
            html += `<button class="combat-btn flee" onclick="Combat.playerAction('flee')">Flee</button>`;
        }

        actionsDiv.innerHTML = html;
    },

    enableActions() {
        const buttons = document.querySelectorAll('#combat-actions .combat-btn');
        buttons.forEach(btn => {
            if (!btn.dataset.wasDisabled) btn.disabled = false;
        });
    },

    disableActions() {
        const buttons = document.querySelectorAll('#combat-actions .combat-btn');
        buttons.forEach(btn => {
            btn.dataset.wasDisabled = btn.disabled;
            btn.disabled = true;
        });
    },

    showItemMenu() {
        const actionsDiv = document.getElementById('combat-actions');
        if (!actionsDiv) return;
        const consumables = GameState.player.inventory.filter(i => ITEMS[i.key] && ITEMS[i.key].type === 'consumable');

        let html = '';
        consumables.forEach(invItem => {
            const item = ITEMS[invItem.key];
            if (!item) return;
            html += `<button class="combat-btn item" onclick="Combat.useItem('${invItem.key}')">${item.icon} ${item.name} (x${invItem.quantity})</button>`;
        });
        html += `<button class="combat-btn" onclick="Combat.renderActions()">Cancel</button>`;

        actionsDiv.innerHTML = html;
    },

    useItem(itemKey) {
        const item = ITEMS[itemKey];
        if (!item || !item.effect) return;

        GameState.removeFromInventory(itemKey);

        if (item.effect.type === 'heal') {
            if (item.effect.stat === 'hp') {
                GameState.healPlayer(item.effect.amount, 0);
                this.logCombat(`You drink the ${item.name}. Restored ${item.effect.amount} HP!`, 'heal');
            } else if (item.effect.stat === 'mp') {
                GameState.healPlayer(0, item.effect.amount);
                this.logCombat(`You drink the ${item.name}. Restored ${item.effect.amount} MP!`, 'heal');
            } else if (item.effect.stat === 'both') {
                GameState.healPlayer(item.effect.hpAmount || 0, item.effect.mpAmount || 0);
                this.logCombat(`You drink the ${item.name}. Restored ${item.effect.hpAmount || 0} HP and ${item.effect.mpAmount || 0} MP!`, 'heal');
            }
            if (typeof Audio !== 'undefined') Audio.playHeal();
        } else if (item.effect.type === 'flee') {
            this.logCombat('You hurl a smoke bomb and vanish!', 'info');
            this._setTimeout(() => this.endCombat('flee'), 800);
            return;
        } else if (item.effect.type === 'buff') {
            this.playerBuffs.push({ stat: item.effect.stat, percent: item.effect.percent, duration: item.effect.duration });
            this.logCombat(`You drink the ${item.name}. ${item.effect.stat} increased by ${item.effect.percent}%!`, 'buff');
        }

        this.updateBars();
        this.disableActions();
        this._setTimeout(() => this.enemyTurn(), 600);
    },

    playerAction(action, abilityIdx) {
        if (!this.active) return;
        this.disableActions();
        this.playerDefending = false;
        this.turnCount++;

        switch (action) {
            case 'attack':
                this.performAttack();
                break;
            case 'ability':
                this.performAbility(abilityIdx);
                break;
            case 'defend':
                this.performDefend();
                break;
            case 'flee':
                this.performFlee();
                return;
        }

        if (this.enemy.hp <= 0) {
            this.handleVictory();
            return;
        }

        // Enemy turn after a delay
        this._setTimeout(() => {
            if (this.active) this.enemyTurn();
        }, 600);
    },

    performAttack() {
        const p = GameState.player;
        let damage = this.calculateDamage(p.attack, this.enemy.defense);
        const isCrit = Math.random() * 100 < p.critChance;

        if (isCrit) {
            damage = Math.floor(damage * 1.8);
            this.logCombat(`CRITICAL HIT! You strike the ${this.enemy.name} for ${damage} damage!`, 'critical');
            this.showDamageNumber(damage, 'crit');
            if (typeof Audio !== 'undefined') Audio.playCritical();
        } else {
            this.logCombat(`You attack the ${this.enemy.name} for ${damage} damage.`, 'player-attack');
            this.showDamageNumber(damage, 'damage');
            if (typeof Audio !== 'undefined') Audio.playAttack();
        }

        this.applyDamageToEnemy(damage);
        this.comboCount++;
        this.totalDamageDealt += damage;
        if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
        this.updateComboDisplay();
        this.shakeElement('enemy-display');
        this.flashEnemy(isCrit ? 'rgba(255,200,50,0.7)' : 'rgba(255,255,255,0.5)');
        this.showSlashEffect('physical');
        this.showImpactParticles('enemy-display', isCrit ? '#ffcc44' : '#aabbff', isCrit ? 8 : 5);
        this.animatePlayerSprite('attacking');
        NativeBridge.hapticMedium();
    },

    performAbility(idx) {
        const p = GameState.player;
        const ability = p.abilities[idx];
        if (!ability || ability.mpCost > p.mp) return;

        p.mp -= ability.mpCost;

        if (ability.type === 'buff') {
            this.logCombat(`You activate ${ability.name}!`, 'buff');
            if (ability.name === 'Null Guard') {
                this.playerBuffs.push({ type: 'damageReduce', percent: 40, duration: 2 });
            } else if (ability.name === 'Mana Shield') {
                this.playerBuffs.push({ type: 'manaShield', duration: 3 });
            } else if (ability.name === 'Soul Barrier') {
                this.playerBuffs.push({ type: 'absorb', amount: 25, duration: 99 });
            } else if (ability.name === 'Blood Pact') {
                const hpCost = Math.floor(p.maxHp * 0.2);
                p.hp = Math.max(1, p.hp - hpCost);
                this.playerBuffs.push({ type: 'damageBoost', percent: 50, duration: 3 });
                this.logCombat(`You sacrifice ${hpCost} HP for power!`, 'damage');
            }
        } else {
            if (!ability.damage || ability.damage.length < 2) {
                this.logCombat(`${ability.name} fizzles...`, 'miss');
                this.updateBars();
                return;
            }

            const baseDamage = ability.damage[0] + Math.floor(Math.random() * (ability.damage[1] - ability.damage[0] + 1));
            let damage;

            if (ability.type === 'physical') {
                damage = this.calculateDamage(baseDamage + Math.floor(p.attack * 0.5), this.enemy.defense);
            } else {
                damage = this.calculateDamage(baseDamage + Math.floor(p.magicAttack * 0.5), this.enemy.magicDefense);
            }

            // Apply damage boost buffs
            const damageBoost = this.playerBuffs.find(b => b.type === 'damageBoost');
            if (damageBoost) {
                damage = Math.floor(damage * (1 + damageBoost.percent / 100));
            }

            const isCrit = Math.random() * 100 < p.critChance;
            if (isCrit) {
                damage = Math.floor(damage * 1.5);
                this.logCombat(`CRITICAL! ${ability.name} hits for ${damage} damage!`, 'critical');
                this.showDamageNumber(damage, 'crit');
            } else {
                this.logCombat(`${ability.name} hits the ${this.enemy.name} for ${damage}!`, 'player-attack');
                this.showDamageNumber(damage, 'damage');
            }

            this.applyDamageToEnemy(damage);
            this.comboCount++;
            this.totalDamageDealt += damage;
            if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
            this.updateComboDisplay();
            this.shakeElement('enemy-display');
            // Spell visual + sound effect
            const spellType = ability.type === 'magical' ? (ability.element === 'fire' ? 'fire' : 'ice') : 'physical';
            this.showSpellEffect(spellType);
            if (typeof Audio !== 'undefined') {
                if (ability.type === 'magical') Audio.playSpell(ability.element || 'generic');
                else Audio.playAttack();
            }
            this.flashEnemy(ability.type === 'magical' ? 'rgba(100,150,255,0.6)' : 'rgba(255,255,255,0.5)');
            const slashType = ability.type === 'magical' ? (ability.element === 'fire' ? 'fire' : ability.element === 'ice' ? 'ice' : 'shadow') : 'physical';
            this.showSlashEffect(slashType);
            const particleColor = ability.type === 'magical' ? (ability.element === 'fire' ? '#ff6622' : '#44aaff') : '#ffffff';
            this.showImpactParticles('enemy-display', particleColor, isCrit ? 10 : 6);
            this.animatePlayerSprite('attacking');

            // Lifesteal abilities
            if (ability.name === 'Crimson Drain' || ability.name === 'Reaping Strike') {
                const healAmount = Math.floor(damage * 0.3);
                GameState.healPlayer(healAmount);
                this.logCombat(`You drain ${healAmount} HP from your foe!`, 'heal');
                if (typeof Audio !== 'undefined') Audio.playHeal();
            }

            // Blood Bolt costs HP instead
            if (ability.name === 'Blood Bolt') {
                p.hp = Math.max(1, p.hp - 5);
            }

            // Poison
            if (ability.name === 'Venom Blade') {
                this.enemyBuffs.push({ type: 'poison', damage: 5, duration: 3 });
                this.logCombat('Your venom seeps into the wound!', 'buff');
            }
        }

        this.updateBars();
    },

    performDefend() {
        this.playerDefending = true;
        this.logCombat('You brace yourself for the incoming attack.', 'info');
        this.animatePlayerSprite('defending');
        if (typeof Audio !== 'undefined') Audio.playDefend();
    },

    performFlee() {
        const fleeChance = 40 + (GameState.player.speed - this.enemy.speed) * 5;
        if (Math.random() * 100 < fleeChance) {
            this.logCombat('You manage to escape!', 'info');
            this._setTimeout(() => this.endCombat('flee'), 800);
        } else {
            this.logCombat('You fail to escape!', 'miss');
            this._setTimeout(() => {
                if (this.active) this.enemyTurn();
            }, 600);
        }
    },

    enemyTurn() {
        if (!this.active || !this.enemy || this.enemy.hp <= 0) return;

        // Process enemy debuffs (poison etc.)
        let enemyDied = false;
        this.enemyBuffs = this.enemyBuffs.filter(b => {
            if (b.type === 'poison' && b.duration > 0) {
                this.enemy.hp = Math.max(0, this.enemy.hp - b.damage);
                this.logCombat(`${this.enemy.name} takes ${b.damage} poison damage!`, 'player-attack');
                b.duration--;
                if (this.enemy.hp <= 0) {
                    enemyDied = true;
                }
            }
            return b.duration > 0;
        });

        if (enemyDied) {
            this.handleVictory();
            return;
        }

        // Check boss phases
        if (this.enemy.isBoss) {
            this.checkBossPhase();
        }

        // Enemy heal ability
        if (this.enemy.abilities && this.enemy.abilities.length > 0) {
            const healAbility = this.enemy.abilities.find(a => a && a.type === 'heal');
            if (healAbility && this.enemy.hp < this.enemy.maxHp * 0.5 && Math.random() < 0.3) {
                const healAmount = healAbility.amount || 20;
                this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + healAmount);
                this.logCombat(`${this.enemy.name} regenerates ${healAmount} HP!`, 'heal');
                this.updateBars();
                this.finishEnemyTurn();
                return;
            }
        }

        // Choose enemy ability — guard against empty abilities
        if (!this.enemy.abilities || this.enemy.abilities.length === 0) {
            const damage = this.calculateDamage(this.enemy.attack, GameState.player.defense);
            GameState.player.hp = Math.max(0, GameState.player.hp - damage);
            this.logCombat(`${this.enemy.name} attacks for ${damage} damage!`, 'enemy-attack');
            this.updateBars();

            if (GameState.player.hp <= 0) {
                this.handleDefeat();
                return;
            }
            this.finishEnemyTurn();
            return;
        }

        const validAbilities = this.enemy.abilities.filter(a => {
            if (!a) return false;
            if (a.threshold && this.enemy.maxHp > 0 && (this.enemy.hp / this.enemy.maxHp) > a.threshold) return false;
            if (a.type === 'buff' || a.type === 'debuff') return Math.random() < 0.3;
            return true;
        });

        const ability = validAbilities.length > 0
            ? validAbilities[Math.floor(Math.random() * validAbilities.length)]
            : this.enemy.abilities[0];

        if (!ability) {
            this.finishEnemyTurn();
            return;
        }

        if (ability.type === 'buff') {
            this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'info');
        } else if (ability.type === 'debuff') {
            this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'enemy-attack');
            if (ability.debuff === 'weaken') {
                this.playerBuffs.push({ type: 'weaken', duration: 2 });
            }
        } else {
            // Check for miss BEFORE applying damage
            const miss = Math.random() < 0.1;
            if (miss) {
                this.logCombat(`${this.enemy.name} uses ${ability.name} but misses!`, 'miss');
                this.updateBars();
                this.finishEnemyTurn();
                return;
            }

            if (!ability.damage || ability.damage.length < 2) {
                this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'enemy-attack');
                this.finishEnemyTurn();
                return;
            }

            const baseDmg = ability.damage[0] + Math.floor(Math.random() * (ability.damage[1] - ability.damage[0] + 1));
            let damage;

            if (ability.type === 'physical') {
                damage = this.calculateDamage(baseDmg + Math.floor(this.enemy.attack * 0.3), GameState.player.defense);
            } else {
                damage = this.calculateDamage(baseDmg + Math.floor(this.enemy.attack * 0.3), GameState.player.magicDefense);
            }

            if (this.playerDefending) {
                damage = Math.floor(damage * 0.5);
            }

            // Apply damage reduction buffs
            const dmgReduce = this.playerBuffs.find(b => b.type === 'damageReduce');
            if (dmgReduce) {
                damage = Math.floor(damage * (1 - dmgReduce.percent / 100));
            }

            // Absorb shield
            const absorb = this.playerBuffs.find(b => b.type === 'absorb');
            if (absorb && absorb.amount > 0) {
                const absorbed = Math.min(absorb.amount, damage);
                absorb.amount -= absorbed;
                damage -= absorbed;
                this.logCombat(`Soul Barrier absorbs ${absorbed} damage!`, 'buff');
                if (absorb.amount <= 0) {
                    this.playerBuffs = this.playerBuffs.filter(b => b.type !== 'absorb');
                }
            }

            // Mana shield
            const manaShield = this.playerBuffs.find(b => b.type === 'manaShield');
            if (manaShield) {
                const mpCost = Math.floor(damage * 0.5);
                if (GameState.player.mp >= mpCost) {
                    GameState.player.mp -= mpCost;
                    damage = Math.floor(damage * 0.5);
                    this.logCombat(`Mana Shield absorbs some damage! (-${mpCost} MP)`, 'buff');
                }
            }

            // Ensure damage doesn't go below 0
            damage = Math.max(0, damage);

            GameState.player.hp = Math.max(0, GameState.player.hp - damage);
            this.logCombat(`${this.enemy.name} uses ${ability.name} for ${damage} damage!`, 'enemy-attack');
            if (damage > 0) {
                this.showPlayerDamageNumber(damage);
                this.comboCount = 0; // Combo broken
                this.updateComboDisplay();
                this.animatePlayerSprite('hit');
                this.showImpactParticles('player-combat-section', '#ff4444', 4);
                if (typeof Audio !== 'undefined') Audio.playEnemyHit();
            }
            // Enemy spell visual
            if (ability.type === 'magical') {
                this.showSpellEffect(ability.element === 'fire' ? 'fire' : 'shadow');
                if (typeof Audio !== 'undefined') Audio.playSpell(ability.element || 'generic');
            }
            Effects.screenFlash(damage > 15 ? 'rgba(200,30,30,0.15)' : 'rgba(255,100,100,0.08)');
            NativeBridge.hapticHeavy();

            // Lifesteal
            if (ability.lifesteal) {
                const steal = Math.floor(damage * (ability.lifesteal / 100));
                this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + steal);
                this.logCombat(`${this.enemy.name} drains ${steal} HP!`, 'heal');
            }

            // Debuffs
            if (ability.debuff) {
                if (ability.debuff === 'poison') {
                    if (!GameState.player.statusEffects) GameState.player.statusEffects = [];
                    GameState.player.statusEffects.push({ type: 'poison', damage: 3, duration: 3 });
                    this.logCombat('You have been poisoned!', 'enemy-attack');
                }
            }
        }

        this.updateBars();

        if (GameState.player.hp <= 0) {
            this.handleDefeat();
            return;
        }

        this.finishEnemyTurn();
    },

    finishEnemyTurn() {
        if (!this.active) return;

        // Tick down player buffs
        this.playerBuffs = this.playerBuffs.filter(b => {
            b.duration--;
            return b.duration > 0;
        });

        // Tick player status effects
        if (GameState.player.statusEffects) {
            GameState.player.statusEffects = GameState.player.statusEffects.filter(se => {
                if (se.type === 'poison') {
                    GameState.player.hp = Math.max(1, GameState.player.hp - se.damage);
                    this.logCombat(`Poison deals ${se.damage} damage!`, 'enemy-attack');
                }
                se.duration--;
                return se.duration > 0;
            });
        }

        this.updateBars();

        if (GameState.player.hp <= 0) {
            this.handleDefeat();
            return;
        }

        this.renderActions();
        this.enableActions();
    },

    checkBossPhase() {
        if (!this.enemy || !this.enemy.phases || this.enemy.phases.length === 0) return;
        if (this.enemy.maxHp <= 0) return;

        const hpPercent = this.enemy.hp / this.enemy.maxHp;
        const phases = this.enemy.phases;

        for (let i = phases.length - 1; i > this.enemy.currentPhase; i--) {
            if (phases[i] && hpPercent <= phases[i].hpPercent) {
                this.enemy.currentPhase = i;
                this.logCombat(phases[i].message, 'info');

                if (phases[i].buff) {
                    for (const [stat, val] of Object.entries(phases[i].buff)) {
                        this.enemy[stat] = (this.enemy[stat] || 0) + val;
                    }
                    this.logCombat(`${this.enemy.name} grows stronger!`, 'info');
                    if (typeof Audio !== 'undefined') Audio.playBossPhase();
                }
                break;
            }
        }
    },

    calculateDamage(attackPower, defense) {
        const base = Math.max(1, attackPower - Math.floor(defense * 0.5));
        const variance = Math.floor(base * 0.2);
        return Math.max(1, base + Math.floor(Math.random() * (variance + 1)) - Math.floor(variance / 2));
    },

    applyDamageToEnemy(damage) {
        if (!this.enemy) return;
        this.enemy.hp = Math.max(0, this.enemy.hp - damage);
        this.updateBars();
    },

    updateBars() {
        // Enemy HP bar
        const enemyHpBar = document.getElementById('enemy-hp-bar');
        const enemyHpText = document.getElementById('enemy-hp-text');
        if (enemyHpBar && this.enemy) {
            const pct = this.enemy.maxHp > 0 ? Math.min(100, Math.max(0, (this.enemy.hp / this.enemy.maxHp) * 100)) : 0;
            enemyHpBar.style.width = `${pct}%`;
        }
        if (enemyHpText && this.enemy) {
            enemyHpText.textContent = `${Math.max(0, this.enemy.hp)} / ${this.enemy.maxHp}`;
        }

        // Player HP bar
        const playerHpBar = document.getElementById('player-combat-hp');
        if (playerHpBar) {
            const hpPct = GameState.player.maxHp > 0 ? Math.min(100, Math.max(0, (GameState.player.hp / GameState.player.maxHp) * 100)) : 0;
            playerHpBar.style.width = `${hpPct}%`;
            const hpText = playerHpBar.parentElement ? playerHpBar.parentElement.querySelector('.combat-bar-text') : null;
            if (hpText) hpText.textContent = `${GameState.player.hp} / ${GameState.player.maxHp} HP`;
        }

        // Player MP bar
        const playerMpBar = document.getElementById('player-combat-mp');
        if (playerMpBar) {
            const mpPct = GameState.player.maxMp > 0 ? Math.min(100, Math.max(0, (GameState.player.mp / GameState.player.maxMp) * 100)) : 0;
            playerMpBar.style.width = `${mpPct}%`;
            const mpText = playerMpBar.parentElement ? playerMpBar.parentElement.querySelector('.combat-bar-text') : null;
            if (mpText) mpText.textContent = `${GameState.player.mp} / ${GameState.player.maxMp} MP`;
        }

        // Update combat status icons
        this.updateCombatStatus();

        HUD.update();
    },

    logCombat(text, type = 'info') {
        if (!this.log) this.log = document.getElementById('combat-log');
        if (!this.log) return;

        const entry = document.createElement('div');
        entry.className = `combat-entry ${type}`;
        entry.textContent = text;
        this.log.appendChild(entry);
        this.log.scrollTop = this.log.scrollHeight;
    },

    shakeElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('shake');
            this._setTimeout(() => el.classList.remove('shake'), 300);
        }
    },

    // Visual combat effects
    flashEnemy(color = 'rgba(255,255,255,0.6)') {
        const canvas = document.getElementById('enemy-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        // Restore sprite after flash
        this._setTimeout(() => {
            const sprite = typeof Sprites !== 'undefined' ? Sprites.getCombatSprite(this.enemy.key) : null;
            if (sprite && canvas) {
                const rctx = canvas.getContext('2d');
                rctx.clearRect(0, 0, canvas.width, canvas.height);
                rctx.drawImage(sprite, 0, 0);
            }
        }, 150);
    },

    showDamageNumber(amount, type = 'damage') {
        const display = document.getElementById('enemy-display');
        if (!display) return;
        const num = document.createElement('div');
        num.className = `damage-number ${type}`;
        num.textContent = type === 'heal' ? `+${amount}` : `-${amount}`;
        display.appendChild(num);
        this._setTimeout(() => { if (num.parentNode) num.remove(); }, 1000);
    },

    showPlayerDamageNumber(amount) {
        const section = document.getElementById('player-combat-section');
        if (!section) return;
        const num = document.createElement('div');
        num.className = 'damage-number player-damage';
        num.textContent = `-${amount}`;
        section.style.position = 'relative';
        section.appendChild(num);
        this._setTimeout(() => { if (num.parentNode) num.remove(); }, 1000);
    },

    showSpellEffect(type) {
        const arena = document.getElementById('combat-arena');
        if (!arena) return;
        const overlay = document.createElement('div');
        overlay.className = `spell-overlay ${type}`;
        arena.style.position = 'relative';
        arena.appendChild(overlay);
        this._setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 600);
    },

    // Slash animation on enemy
    showSlashEffect(type) {
        const display = document.getElementById('enemy-display');
        if (!display) return;
        display.style.position = 'relative';
        const slash = document.createElement('div');
        slash.className = `slash-effect ${type}-slash`;
        display.appendChild(slash);
        this._setTimeout(() => { if (slash.parentNode) slash.remove(); }, 500);
    },

    // Impact particles burst
    showImpactParticles(targetId, color, count) {
        const target = document.getElementById(targetId);
        if (!target) return;
        target.style.position = 'relative';
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'combat-particle';
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 50;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist;
            p.style.cssText = `
                left:50%;top:40%;width:${3 + Math.random() * 4}px;height:${3 + Math.random() * 4}px;
                background:${color};--px:${px}px;--py:${py}px;
                animation-delay:${Math.random() * 0.1}s;
            `;
            target.appendChild(p);
            this._setTimeout(() => { if (p.parentNode) p.remove(); }, 700);
        }
    },

    // Animate player sprite
    animatePlayerSprite(animClass) {
        const sprite = document.getElementById('player-combat-sprite');
        if (!sprite) return;
        sprite.classList.remove('attacking', 'hit', 'defending');
        // Force reflow to restart animation
        void sprite.offsetWidth;
        sprite.classList.add(animClass);
        this._setTimeout(() => sprite.classList.remove(animClass), 400);
    },

    showBossIntro() {
        const arena = document.getElementById('combat-arena');
        if (!arena) return;

        // Full screen boss overlay
        const intro = document.createElement('div');
        intro.className = 'boss-intro-overlay';
        intro.innerHTML = `
            <div class="boss-intro-text">
                <div class="boss-intro-title">${this.enemy.name}</div>
                <div class="boss-intro-level">Level ${this.enemy.level} Boss</div>
            </div>
        `;
        arena.appendChild(intro);

        // Remove after animation
        this._setTimeout(() => {
            if (intro.parentNode) intro.remove();
        }, 2500);
    },

    showSkillChoiceUI() {
        const tier = GameState.pendingSkillChoice;
        if (!tier || !tier.choices) return;

        const container = document.getElementById('game-container');
        if (!container) return;

        const overlay = document.createElement('div');
        overlay.className = 'skill-choice-overlay';
        overlay.innerHTML = `
            <div class="skill-choice-panel">
                <div class="skill-choice-header">New Ability Unlocked!</div>
                <div class="skill-choice-subheader">Level ${tier.level} — Choose one ability</div>
                <div class="skill-choice-options">
                    ${tier.choices.map((ability, idx) => `
                        <button class="skill-choice-btn" data-tier="${tier.level}" data-idx="${idx}">
                            <div class="skill-choice-name">${ability.name}</div>
                            <div class="skill-choice-cost">${ability.mpCost > 0 ? ability.mpCost + ' MP' : (ability.hpCost ? ability.hpCost + ' HP' : 'Free')}${ability.damage && ability.damage[1] > 0 ? ' · ' + ability.damage[0] + '-' + ability.damage[1] + ' dmg' : ''}</div>
                            <div class="skill-choice-desc">${ability.desc}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        container.appendChild(overlay);

        overlay.querySelectorAll('.skill-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tierLevel = parseInt(btn.dataset.tier);
                const idx = parseInt(btn.dataset.idx);
                GameState.selectSkillChoice(tierLevel, idx);

                btn.style.borderColor = 'var(--accent-gold)';
                btn.style.boxShadow = '0 0 20px rgba(201,168,76,0.4)';

                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                    const ability = tier.choices[idx];
                    if (typeof Notifications !== 'undefined') {
                        Notifications.show(`Learned: ${ability.name}!`, 'gold');
                    }
                    if (GameState.pendingSkillChoice) {
                        setTimeout(() => this.showSkillChoiceUI(), 500);
                    }
                }, 400);
            });
        });
    },

    // ---- COMBO DISPLAY ----
    updateComboDisplay() {
        const arena = document.getElementById('combat-arena');
        if (!arena) return;

        // Remove existing combo counter
        const existing = arena.querySelector('.combo-counter');
        if (existing) existing.remove();

        if (this.comboCount >= 2) {
            const combo = document.createElement('div');
            combo.className = `combo-counter${this.comboCount >= 5 ? ' high' : ''}`;
            combo.textContent = `${this.comboCount}x COMBO`;
            arena.appendChild(combo);
        }
    },

    // ---- STATUS DISPLAY IN COMBAT ----
    updateCombatStatus() {
        // Player buffs/debuffs under player bars
        let statusContainer = document.getElementById('combat-status-bar');
        if (!statusContainer) {
            const playerSection = document.getElementById('player-combat-section');
            if (playerSection) {
                statusContainer = document.createElement('div');
                statusContainer.id = 'combat-status-bar';
                playerSection.insertBefore(statusContainer, playerSection.querySelector('#combat-actions'));
            }
        }
        if (!statusContainer) return;

        let html = '';

        // Player buffs
        for (const buff of this.playerBuffs) {
            if (buff.type === 'damageReduce') {
                html += `<span class="combat-status-icon player-buff">🛡️ -${buff.percent}% dmg (${buff.duration})</span>`;
            } else if (buff.type === 'manaShield') {
                html += `<span class="combat-status-icon player-buff">💠 Mana Shield (${buff.duration})</span>`;
            } else if (buff.type === 'absorb') {
                html += `<span class="combat-status-icon player-buff">🔰 Absorb ${buff.amount} (${buff.duration})</span>`;
            } else if (buff.type === 'damageBoost') {
                html += `<span class="combat-status-icon player-buff">⚔️ +${buff.percent}% dmg (${buff.duration})</span>`;
            } else if (buff.type === 'weaken') {
                html += `<span class="combat-status-icon player-debuff">💔 Weakened (${buff.duration})</span>`;
            } else if (buff.stat) {
                html += `<span class="combat-status-icon player-buff">✨ +${buff.percent}% ${buff.stat} (${buff.duration})</span>`;
            }
        }

        // Player status effects
        if (GameState.player.statusEffects) {
            for (const se of GameState.player.statusEffects) {
                if (se.type === 'poison') {
                    html += `<span class="combat-status-icon player-debuff">☠️ Poison (${se.duration})</span>`;
                }
            }
        }

        // Enemy debuffs
        for (const debuff of this.enemyBuffs) {
            if (debuff.type === 'poison') {
                html += `<span class="combat-status-icon enemy-debuff">☠️ Enemy Poison (${debuff.duration})</span>`;
            }
        }

        statusContainer.innerHTML = html;
    },

    // ---- LOOT RARITY EFFECTS ----
    showLootEffect(itemKey) {
        const item = ITEMS[itemKey];
        if (!item) return;

        const rarity = item.rarity || 'common';
        if (rarity === 'common') return; // No effect for common

        const container = document.getElementById('game-container') || document.body;
        const loot = document.createElement('div');
        loot.className = `loot-notification ${rarity}`;
        loot.innerHTML = `<span class="loot-icon">${item.icon || '📦'}</span><span class="loot-name">${item.name}</span>`;
        container.appendChild(loot);

        setTimeout(() => { if (loot.parentNode) loot.remove(); }, 2000);

        // Screen flash for epic+
        if (rarity === 'epic' || rarity === 'legendary') {
            Effects.screenFlash(rarity === 'legendary'
                ? 'rgba(201,168,76,0.15)'
                : 'rgba(160,68,201,0.1)');
        }
    },

    handleVictory() {
        if (!this.active) return;
        this.active = false;
        this._clearTimers();

        const enemy = this.enemy;
        if (!enemy) return;

        this.logCombat(`The ${enemy.name} has been defeated!`, 'victory');
        NativeBridge.hapticNotification('success');
        if (typeof Audio !== 'undefined') Audio.playVictory();

        // XP
        let xp = enemy.xpReward || 0;
        if (RACES[GameState.player.race] && RACES[GameState.player.race].name === 'Human') {
            xp = Math.floor(xp * 1.1);
        }
        const leveled = GameState.gainXp(xp);
        this.logCombat(`Gained ${xp} XP!`, 'info');

        if (leveled) {
            this.logCombat(`LEVEL UP! You are now level ${GameState.player.level}!`, 'victory');
            this._setTimeout(() => Effects.levelUp(), 500);
            if (typeof Audio !== 'undefined') this._setTimeout(() => Audio.playLevelUp(), 600);

            // Check for pending skill tree choice
            if (GameState.pendingSkillChoice) {
                this._setTimeout(() => this.showSkillChoiceUI(), 2000);
            }
        }

        // Gold
        const goldReward = enemy.goldReward || [0, 0];
        const goldMin = goldReward[0] || 0;
        const goldMax = goldReward[1] || goldMin;
        const gold = goldMin + Math.floor(Math.random() * (goldMax - goldMin + 1));
        GameState.player.gold += gold;
        this.logCombat(`Found ${gold} gold!`, 'info');

        // Loot
        const template = ENEMIES[enemy.key];
        if (template && template.lootTable) {
            for (const [itemKey, chance] of Object.entries(template.lootTable)) {
                if (Math.random() < chance) {
                    GameState.addToInventory(itemKey);
                    const item = ITEMS[itemKey];
                    if (item) {
                        this.logCombat(`Obtained: ${item.icon} ${item.name}!`, 'info');
                        this.showLootEffect(itemKey);
                        if (typeof Audio !== 'undefined') {
                            const rarity = item.rarity || 'common';
                            if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') Audio.playLootRare();
                            else Audio.playLoot();
                        }
                    }
                }
            }
        }

        // Show combat stats
        if (this.maxCombo >= 3) {
            this.logCombat(`Max combo: ${this.maxCombo}x | Total damage: ${this.totalDamageDealt}`, 'info');
        }

        // Track boss defeats
        if (enemy.isBoss) {
            if (!GameState.bossesDefeated.includes(enemy.key)) {
                GameState.bossesDefeated.push(enemy.key);
            }

            if (enemy.key === 'the_ashen_king') {
                GameState.unlockRegion('hollowfen');
                GameState.completeObjective('main', null, 'defeat_ashen_king');
            } else if (enemy.key === 'mother_of_the_fen') {
                GameState.unlockRegion('void_sanctum');
                GameState.completeObjective('main', null, 'defeat_mother');
            } else if (enemy.key === 'ruun_the_unraveler') {
                GameState.completeObjective('main', null, 'defeat_ruun');
            }
        }

        // Quest tracking
        if (!GameState.isObjectiveComplete('main', null, 'first_combat')) {
            GameState.completeObjective('main', null, 'first_combat');
        }

        // Clear player combat debuffs
        GameState.player.statusEffects = [];

        GameState.save();

        // Return to game after a delay
        this._setTimeout(() => {
            this.returnToGame();
        }, 2500);
    },

    handleDefeat() {
        if (!this.active) return;
        this.active = false;
        this._clearTimers();

        this.logCombat('You have fallen...', 'defeat');
        NativeBridge.hapticNotification('error');
        if (typeof Audio !== 'undefined') Audio.playDefeat();
        this.logCombat('Darkness takes you...', 'info');

        // Show game over overlay after a short delay
        this._setTimeout(() => this.showGameOverScreen(), 1500);
    },

    showGameOverScreen() {
        const container = document.getElementById('game-container') || document.body;
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';

        const p = GameState.player;
        const enemyName = this.enemy ? this.enemy.name : 'the darkness';

        // Gold penalty (lose 10%)
        const goldLost = Math.floor(p.gold * 0.1);
        p.gold = Math.max(0, p.gold - goldLost);

        overlay.innerHTML = `
            <div class="go-title">YOU HAVE FALLEN</div>
            <div class="go-subtitle">Defeated by ${enemyName}. The void nearly claimed you, but fate is not yet done with you.</div>
            <div class="go-stats">
                <span>Damage dealt: ${this.totalDamageDealt}</span>
                <span>Max combo: ${this.maxCombo}x</span>
                <span>Turns survived: ${this.turnCount}</span>
                ${goldLost > 0 ? `<span style="color:var(--accent-red-bright)">Gold lost: ${goldLost}g</span>` : ''}
            </div>
            <button class="go-btn" id="go-revive-btn">Rise Again</button>
        `;

        container.appendChild(overlay);

        const reviveBtn = document.getElementById('go-revive-btn');
        if (reviveBtn) {
            reviveBtn.addEventListener('click', () => {
                overlay.remove();

                // Revive at half health
                p.hp = Math.floor(p.maxHp * 0.5);
                p.mp = Math.floor(p.maxMp * 0.5);
                p.statusEffects = [];

                const region = WORLD.regions[GameState.currentRegion];
                if (region && region.locations && region.locations.length > 0) {
                    GameState.currentLocation = region.locations[0];
                }

                GameState.save();
                this.returnToGame();
                Narrative.addSystem('You awaken, gasping. Death was close — but not today.');
            });
        }
    },

    returnToGame() {
        ScreenManager.showScreen('game');
        Exploration.showCurrentLocation();
        HUD.update();
        if (typeof Audio !== 'undefined') Audio.startAmbient(GameState.currentRegion);

        const callback = this.onCombatEnd;
        this.onCombatEnd = null;

        if (callback && this.enemy) {
            callback(this.enemy.hp <= 0 ? 'victory' : 'defeat');
        }
    },

    endCombat(reason) {
        this.active = false;
        this._clearTimers();
        ScreenManager.showScreen('game');
        HUD.update();

        // Clear combat debuffs
        if (GameState.player && GameState.player.statusEffects) {
            GameState.player.statusEffects = [];
        }

        if (reason === 'flee') {
            Narrative.addSystem('You escaped from combat.');
        }

        const callback = this.onCombatEnd;
        this.onCombatEnd = null;

        if (callback) {
            callback(reason);
        }
    }
};
