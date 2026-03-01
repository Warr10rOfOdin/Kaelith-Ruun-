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
    _counterWindowActive: false,
    _counterSuccess: false,
    _lastAbilityElement: null,
    _comboChain: [],
    _comboChainBonus: 0,
    _discoveredWeaknesses: {},

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
            goldReward: template.goldReward,
            behavior: template.behavior || 'aggro',
            resistances: template.resistances ? { ...template.resistances } : { fire: 0, ice: 0, lightning: 0, shadow: 0 },
            area: template.area || ''
        };

        this.enemyMaxHp = this.enemy.maxHp;
        this.playerDefending = false;
        this.turnCount = 0;
        this.playerBuffs = [];
        this.enemyBuffs = [];
        this.comboCount = 0;
        this.maxCombo = 0;
        this.totalDamageDealt = 0;
        this._counterWindowActive = false;
        this._counterSuccess = false;
        this._lastAbilityElement = null;
        this._comboChain = [];
        this._comboChainBonus = 0;

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

        // Render procedural battlefield background
        this.renderBattlefield();

        // Clear enemy intent
        const intentEl = document.getElementById('enemy-intent');
        if (intentEl) intentEl.innerHTML = '';

        // Boss intro effect
        if (this.enemy.isBoss) {
            this.showBossIntro();
            if (typeof Audio !== 'undefined') Audio.playBossIntro();
        }

        // Start combat ambient music
        if (typeof Audio !== 'undefined') Audio.startCombatAmbient(this.enemy.isBoss);

        this.renderCombatUI();

        // Start persistent ambient particles
        this._setTimeout(() => this.startAmbientParticles(), 300);

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

        // Player combat sprite — now in #combat-stage
        if (typeof Sprites !== 'undefined') {
            const spriteDiv = document.getElementById('player-combat-sprite');
            if (spriteDiv) {
                const playerSprite = Sprites.getPlayer ? Sprites.getPlayer('up', 0) : null;
                if (playerSprite) {
                    spriteDiv.innerHTML = '';
                    const pCanvas = document.createElement('canvas');
                    pCanvas.width = playerSprite.width;
                    pCanvas.height = playerSprite.height;
                    pCanvas.className = 'player-art-canvas';
                    const pCtx = pCanvas.getContext('2d');
                    pCtx.imageSmoothingEnabled = false;
                    pCtx.drawImage(playerSprite, 0, 0);
                    spriteDiv.appendChild(pCanvas);
                }
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

        // Show weakness tooltip if this enemy was encountered before
        this.showWeaknessTooltip();

        // Clear combat log
        this.log = document.getElementById('combat-log');
        if (this.log) this.log.innerHTML = '';
    },

    renderActions() {
        const actionsDiv = document.getElementById('combat-actions');
        if (!actionsDiv) return;
        const p = GameState.player;

        let html = '';

        // Basic attack — always available
        html += `<button class="combat-btn attack" onclick="Combat.playerAction('attack')">
            <span class="btn-label">Attack</span>
        </button>`;

        // Abilities with MP cost display
        if (p.abilities && p.abilities.length > 0) {
            p.abilities.forEach((ability, idx) => {
                if (!ability) return;
                const canUse = ability.mpCost <= p.mp;
                const btnType = ability.type === 'buff' ? 'defend' : 'magic';
                html += `<button class="combat-btn ${btnType}" ${!canUse ? 'disabled' : ''} onclick="Combat.playerAction('ability', ${idx})">
                    <span class="btn-label">${ability.name}</span>
                    <span class="btn-cost">${ability.mpCost} MP</span>
                </button>`;
            });
        }

        // Defend
        html += `<button class="combat-btn defend" onclick="Combat.playerAction('defend')">
            <span class="btn-label">Defend</span>
        </button>`;

        // Use item
        const hasConsumables = p.inventory.some(i => ITEMS[i.key] && ITEMS[i.key].type === 'consumable');
        html += `<button class="combat-btn item" ${!hasConsumables ? 'disabled' : ''} onclick="Combat.showItemMenu()">
            <span class="btn-label">Use Item</span>
        </button>`;

        // Flee
        if (!this.enemy.isBoss) {
            html += `<button class="combat-btn flee" onclick="Combat.playerAction('flee')">
                <span class="btn-label">Flee</span>
            </button>`;
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

        // Slow debuff: enemy attacks first (faster) — reduced player reaction
        const isSlowed = this.playerBuffs.some(b => b.type === 'slow');
        const enemyDelay = isSlowed ? 300 : 600;

        // Show enemy intent telegraph, then execute enemy turn
        this._setTimeout(() => {
            if (!this.active) return;
            this.telegraphEnemyTurn();
        }, enemyDelay);
    },

    // Telegraph the enemy's upcoming action, then execute after brief delay
    telegraphEnemyTurn() {
        if (!this.active || !this.enemy || this.enemy.hp <= 0) return;

        const behavior = this.enemy.behavior || 'aggro';
        const abilities = this.enemy.abilities || [];
        const hpRatio = this.enemy.maxHp > 0 ? this.enemy.hp / this.enemy.maxHp : 1;

        // Filter abilities by threshold
        const available = abilities.filter(a => {
            if (!a) return false;
            if (a.threshold && this.enemy.maxHp > 0 && hpRatio > a.threshold) return false;
            return true;
        });

        // Heal check — all behaviors may heal when low
        const healAbility = available.find(a => a.type === 'heal');
        const healChance = behavior === 'support' ? 0.5 : (behavior === 'defensive' ? 0.4 : 0.25);
        const willHeal = healAbility && hpRatio < 0.5 && Math.random() < healChance;

        let telegraphed = null;

        if (willHeal) {
            telegraphed = healAbility;
        } else {
            // Behavior-driven selection with weighted categories
            const damageAbilities = available.filter(a => a.type === 'physical' || a.type === 'magical');
            const buffAbilities = available.filter(a => a.type === 'buff');
            const debuffAbilities = available.filter(a => a.type === 'debuff');

            // Build weighted pool based on behavior
            let pool = [];
            if (behavior === 'aggro') {
                // Aggro: strongly prefer damage, occasional debuff
                damageAbilities.forEach(a => { pool.push(a, a, a); }); // 3x weight
                debuffAbilities.forEach(a => { pool.push(a); }); // 1x weight
                // Buff only if low HP
                if (hpRatio < 0.3) buffAbilities.forEach(a => { pool.push(a); });
            } else if (behavior === 'defensive') {
                // Defensive: prefer buffs/shields, moderate damage
                buffAbilities.forEach(a => { pool.push(a, a, a); }); // 3x weight
                damageAbilities.forEach(a => { pool.push(a, a); }); // 2x weight
                debuffAbilities.forEach(a => { pool.push(a); }); // 1x weight
            } else if (behavior === 'support') {
                // Support: prefer debuffs and heals, moderate damage
                debuffAbilities.forEach(a => { pool.push(a, a, a); }); // 3x weight
                buffAbilities.forEach(a => { pool.push(a, a); }); // 2x weight
                damageAbilities.forEach(a => { pool.push(a, a); }); // 2x weight
            }

            if (pool.length > 0) {
                telegraphed = pool[Math.floor(Math.random() * pool.length)];
            } else if (available.length > 0) {
                telegraphed = available[Math.floor(Math.random() * available.length)];
            } else if (abilities.length > 0) {
                telegraphed = abilities[0];
            }
        }

        // Store the telegraphed ability so enemyTurn uses the same one
        this._telegraphedAbility = telegraphed;

        // Show the intent indicator and trigger wind-up animation
        if (telegraphed) {
            this.showEnemyIntent(telegraphed);
            this.triggerEnemyWindUp(telegraphed);
        }

        // Show counter window for damage abilities
        const isDamageAbility = telegraphed && (telegraphed.type === 'physical' || telegraphed.type === 'magical');
        if (isDamageAbility) {
            this.showCounterWindow();
        }

        // Execute after telegraph delay (600ms for normal, 900ms for boss specials)
        const telegraphDelay = (this.enemy.isBoss && telegraphed && telegraphed.damage && telegraphed.damage[1] >= 20) ? 900 : 600;
        this._setTimeout(() => {
            this.clearEnemyIntent();
            this.hideCounterWindow();
            if (this.active) this.enemyTurn();
        }, telegraphDelay);
    },

    performAttack() {
        const p = GameState.player;

        // Blind check: 40% miss chance while blinded
        const isBlinded = this.playerBuffs.some(b => b.type === 'blind');
        if (isBlinded && Math.random() < 0.4) {
            this.logCombat('Your attack misses through the blinding haze!', 'miss');
            if (typeof Audio !== 'undefined') Audio.playMiss();
            this.animatePlayerSprite('attacking');
            return;
        }

        let damage = this.calculateDamage(p.attack, this.enemy.defense);

        // Weaken debuff: 30% damage reduction
        const isWeakened = this.playerBuffs.some(b => b.type === 'weaken');
        if (isWeakened) {
            damage = Math.floor(damage * 0.7);
        }

        const isCrit = Math.random() * 100 < p.critChance;

        // Reflect check
        const hasReflect = this.enemyBuffs.some(b => b.type === 'reflect');
        if (hasReflect) {
            const reflected = Math.floor(damage * 0.3);
            GameState.player.hp = Math.max(1, GameState.player.hp - reflected);
            this.logCombat(`Reflected ${reflected} damage back at you!`, 'enemy-attack');
            this.showPlayerDamageNumber(reflected);
        }

        if (isCrit) {
            damage = Math.floor(damage * 1.8);
            this.logCombat(`CRITICAL HIT! You strike the ${this.enemy.name} for ${damage} damage!`, 'critical');
            this.showDamageNumber(damage, 'crit');
            GameState.trackStat('criticalHits');
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
        this.shakeElement('enemy-display', damage);
        this.triggerEnemyHitRecoil();
        this.triggerBarDrain();
        this.flashEnemy(isCrit ? 'rgba(255,200,50,0.7)' : 'rgba(255,255,255,0.5)');
        this.showSlashEffect('physical');
        this.showImpactParticles('enemy-display', isCrit ? '#ffcc44' : '#aabbff', isCrit ? 8 : 5);
        this.animatePlayerSprite('attacking');
        if (isCrit) {
            this.shakeElement('combat-arena', damage);
        }
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

            // Blind miss chance (reduced for magic — 20% vs 40% for physical)
            const isBlinded = this.playerBuffs.some(b => b.type === 'blind');
            const missChance = ability.type === 'physical' ? 0.4 : 0.2;
            if (isBlinded && Math.random() < missChance) {
                this.logCombat(`${ability.name} misses through the blinding haze!`, 'miss');
                if (typeof Audio !== 'undefined') Audio.playMiss();
                this.animatePlayerSprite('attacking');
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

            // Elemental resistance/weakness
            const element = this.getAbilityElement(ability);
            let resistResult = 'normal';
            if (element) {
                const res = this.applyElementalResistance(damage, element);
                damage = res.damage;
                resistResult = res.result;
            }

            // Combo chain bonus
            this._comboChainBonus = 0;
            if (element) {
                this._comboChain.push(element);
                if (this._comboChain.length >= 2) {
                    const last = this._comboChain[this._comboChain.length - 2];
                    if (last === element) {
                        // Same-element chain: +10% per chain length (max +30%)
                        const chainLen = this._getElementChainLength(element);
                        this._comboChainBonus = Math.min(30, chainLen * 10);
                        damage = Math.floor(damage * (1 + this._comboChainBonus / 100));
                    } else {
                        // Element switch combo: specific combos grant bonus
                        const switchBonus = this._getElementSwitchBonus(last, element);
                        if (switchBonus > 0) {
                            this._comboChainBonus = switchBonus;
                            damage = Math.floor(damage * (1 + switchBonus / 100));
                        }
                    }
                }
                this._lastAbilityElement = element;
            } else {
                this._lastAbilityElement = null;
            }
            // Keep chain at reasonable length
            if (this._comboChain.length > 6) this._comboChain = this._comboChain.slice(-4);

            // Weaken debuff
            const isWeakened = this.playerBuffs.some(b => b.type === 'weaken');
            if (isWeakened) {
                damage = Math.floor(damage * 0.7);
            }

            // Apply damage boost buffs
            const damageBoost = this.playerBuffs.find(b => b.type === 'damageBoost');
            if (damageBoost) {
                damage = Math.floor(damage * (1 + damageBoost.percent / 100));
            }

            // Reflect check
            const hasReflect = this.enemyBuffs.some(b => b.type === 'reflect');
            if (hasReflect) {
                const reflected = Math.floor(damage * 0.3);
                GameState.player.hp = Math.max(1, GameState.player.hp - reflected);
                this.logCombat(`Reflected ${reflected} damage back at you!`, 'enemy-attack');
                this.showPlayerDamageNumber(reflected);
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

            // Show elemental result label
            if (resistResult === 'weak') {
                this.showElementalLabel('WEAK!', 'weak');
                this.logCombat(`It's weak to ${element}!`, 'critical');
            } else if (resistResult === 'resist') {
                this.showElementalLabel('RESIST', 'resist');
                this.logCombat(`It resists ${element}...`, 'miss');
            }

            // Show combo chain bonus
            if (this._comboChainBonus > 0) {
                this.showElementalLabel(`CHAIN +${this._comboChainBonus}%`, 'chain');
            }

            this.applyDamageToEnemy(damage);
            this.comboCount++;
            this.totalDamageDealt += damage;
            if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
            this.updateComboDisplay();
            this.shakeElement('enemy-display', damage);
            this.triggerEnemyHitRecoil();
            this.triggerBarDrain();

            // Update weakness tooltip after elemental hit
            if (element && resistResult !== 'normal') {
                this.showWeaknessTooltip();
            }

            // Ability-specific VFX dispatch
            const vfx = this.getAbilityVFX(ability);
            this.showSpellEffect(vfx.spell);
            this.flashEnemy(vfx.flash);
            this.showSlashEffect(vfx.slash);
            this.showImpactParticles('enemy-display', vfx.particleColor, isCrit ? 10 : 6);

            if (typeof Audio !== 'undefined') {
                if (ability.type === 'magical') Audio.playSpell(ability.element || 'generic');
                else Audio.playAttack();
            }
            this.animatePlayerSprite('attacking');
            if (isCrit) {
                this.shakeElement('combat-arena', damage);
            }

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
                if (this.active) this.telegraphEnemyTurn();
            }, 600);
        }
    },

    enemyTurn() {
        if (!this.active || !this.enemy || this.enemy.hp <= 0) return;

        // Process enemy buffs/debuffs (poison, defense, reflect, etc.)
        let enemyDied = false;
        this.enemyBuffs = this.enemyBuffs.filter(b => {
            if (b.type === 'poison' && b.duration > 0) {
                this.enemy.hp = Math.max(0, this.enemy.hp - b.damage);
                this.logCombat(`${this.enemy.name} takes ${b.damage} poison damage!`, 'player-attack');
                if (this.enemy.hp <= 0) {
                    enemyDied = true;
                }
            }
            b.duration--;
            if (b.duration <= 0) {
                // Remove stat buffs on expiry
                if (b.type === 'defense' && b.amount) {
                    this.enemy.defense = Math.max(0, this.enemy.defense - b.amount);
                } else if (b.type === 'magicDefense' && b.amount) {
                    this.enemy.magicDefense = Math.max(0, this.enemy.magicDefense - b.amount);
                } else if (b.type === 'allBuff') {
                    this.enemy.attack = Math.max(0, this.enemy.attack - (b.atkAmount || 0));
                    this.enemy.defense = Math.max(0, this.enemy.defense - (b.defAmount || 0));
                }
                return false;
            }
            return true;
        });

        if (enemyDied) {
            this.handleVictory();
            return;
        }

        // Check boss phases
        if (this.enemy.isBoss) {
            this.checkBossPhase();
        }

        // Choose enemy ability — use telegraphed ability if available
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

        // Use pre-telegraphed ability if it exists, otherwise pick fresh
        let ability = this._telegraphedAbility || null;
        this._telegraphedAbility = null;

        if (!ability) {
            const validAbilities = this.enemy.abilities.filter(a => {
                if (!a) return false;
                if (a.threshold && this.enemy.maxHp > 0 && (this.enemy.hp / this.enemy.maxHp) > a.threshold) return false;
                if (a.type === 'buff' || a.type === 'debuff') return Math.random() < 0.3;
                return true;
            });
            ability = validAbilities.length > 0
                ? validAbilities[Math.floor(Math.random() * validAbilities.length)]
                : this.enemy.abilities[0];
        }

        // If the selected ability is a heal, execute it
        if (ability && ability.type === 'heal') {
            const healAmount = ability.amount || 20;
            this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + healAmount);
            this.logCombat(`${this.enemy.name} uses ${ability.name}! Regenerates ${healAmount} HP!`, 'heal');
            this.showDamageNumber(healAmount, 'heal');
            this.updateBars();
            this.finishEnemyTurn();
            return;
        }

        if (!ability) {
            this.finishEnemyTurn();
            return;
        }

        if (ability.type === 'buff') {
            this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'info');
            if (ability.buff === 'defense') {
                this.enemyBuffs.push({ type: 'defense', amount: 5, duration: 2 });
                this.enemy.defense += 5;
                this.logCombat(`${this.enemy.name}'s defense increases!`, 'info');
            } else if (ability.buff === 'magicDefense') {
                this.enemyBuffs.push({ type: 'magicDefense', amount: 5, duration: 2 });
                this.enemy.magicDefense += 5;
                this.logCombat(`${this.enemy.name}'s magic defense increases!`, 'info');
            } else if (ability.buff === 'reflect') {
                this.enemyBuffs.push({ type: 'reflect', duration: 2 });
                this.logCombat(`${this.enemy.name} is surrounded by a reflective barrier!`, 'info');
            } else if (ability.buff === 'all') {
                this.enemy.attack += 3;
                this.enemy.defense += 2;
                this.enemyBuffs.push({ type: 'allBuff', atkAmount: 3, defAmount: 2, duration: 3 });
                this.logCombat(`${this.enemy.name} grows stronger!`, 'info');
            }
        } else if (ability.type === 'debuff') {
            this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'enemy-attack');
            if (ability.debuff === 'weaken') {
                this.playerBuffs.push({ type: 'weaken', duration: 2 });
                this.logCombat('Your attacks are weakened!', 'enemy-attack');
            } else if (ability.debuff === 'blind') {
                this.playerBuffs.push({ type: 'blind', duration: 2 });
                this.logCombat('You are blinded! Accuracy reduced!', 'enemy-attack');
            } else if (ability.debuff === 'slow') {
                this.playerBuffs.push({ type: 'slow', duration: 2 });
                this.logCombat('You are slowed! Speed reduced!', 'enemy-attack');
            }
        } else if (ability.type === 'heal') {
            // Enemy heal
            const healAmt = ability.amount || 20;
            this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + healAmt);
            this.logCombat(`${this.enemy.name} regenerates ${healAmt} HP!`, 'heal');
            this.showDamageNumber(healAmt, 'heal');
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

            // Counter success: 40% damage reduction + reflect 20% back
            if (this._counterSuccess) {
                const reflected = Math.floor(damage * 0.2);
                damage = Math.floor(damage * 0.6);
                if (reflected > 0) {
                    this.enemy.hp = Math.max(0, this.enemy.hp - reflected);
                    this.logCombat(`Counter reflects ${reflected} damage back!`, 'player-attack');
                    this.showDamageNumber(reflected, 'damage');
                    this.triggerEnemyHitRecoil();
                }
                this._counterSuccess = false;
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

            // Debuffs from damage abilities
            if (ability.debuff) {
                if (ability.debuff === 'poison') {
                    if (!GameState.player.statusEffects) GameState.player.statusEffects = [];
                    GameState.player.statusEffects.push({ type: 'poison', damage: 3, duration: 3 });
                    this.logCombat('You have been poisoned!', 'enemy-attack');
                    if (typeof Audio !== 'undefined') Audio.playPoison();
                } else if (ability.debuff === 'blind') {
                    this.playerBuffs.push({ type: 'blind', duration: 2 });
                    this.logCombat('You are blinded!', 'enemy-attack');
                } else if (ability.debuff === 'slow') {
                    this.playerBuffs.push({ type: 'slow', duration: 2 });
                    this.logCombat('You are slowed!', 'enemy-attack');
                } else if (ability.debuff === 'weaken') {
                    this.playerBuffs.push({ type: 'weaken', duration: 2 });
                    this.logCombat('Your attacks are weakened!', 'enemy-attack');
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
        this.updateStatusOverlays();

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

    // Apply elemental resistance/weakness to damage
    applyElementalResistance(damage, element) {
        if (!element || !this.enemy || !this.enemy.resistances) return { damage, result: 'normal' };
        const resistance = this.enemy.resistances[element] || 0;
        if (resistance === 0) return { damage, result: 'normal' };

        const modified = Math.max(1, Math.floor(damage * (1 - resistance)));

        // Track discovered weaknesses
        if (!this._discoveredWeaknesses[this.enemy.key]) {
            this._discoveredWeaknesses[this.enemy.key] = {};
        }
        if (resistance < 0) {
            this._discoveredWeaknesses[this.enemy.key][element] = 'weak';
        } else if (resistance > 0) {
            this._discoveredWeaknesses[this.enemy.key][element] = 'resist';
        }

        if (resistance < -0.15) return { damage: modified, result: 'weak' };
        if (resistance > 0.15) return { damage: modified, result: 'resist' };
        return { damage: modified, result: 'normal' };
    },

    // Get element from ability name/properties
    getAbilityElement(ability) {
        if (!ability) return null;
        if (ability.element) return ability.element;
        const name = (ability.name || '').toLowerCase();
        if (name.includes('fire') || name.includes('flame') || name.includes('ember') || name.includes('meteor') || name.includes('crown of flame')) return 'fire';
        if (name.includes('frost') || name.includes('ice') || name.includes('cold') || name.includes('blizzard')) return 'ice';
        if (name.includes('lightning') || name.includes('shock') || name.includes('chain') || name.includes('thunder')) return 'lightning';
        if (name.includes('void') || name.includes('shadow') || name.includes('dark') || name.includes('umbral') || name.includes('null') || name.includes('rift') || name.includes('unravel') || name.includes('annihilate')) return 'shadow';
        return null;
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

    shakeElement(id, damage) {
        const el = document.getElementById(id);
        if (!el) return;
        // Scale shake intensity by damage
        if (damage && damage >= 30) {
            el.classList.remove('shake', 'heavy-shake');
            void el.offsetWidth;
            el.classList.add('heavy-shake');
            this._setTimeout(() => el.classList.remove('heavy-shake'), 500);
        } else {
            el.classList.remove('shake', 'heavy-shake');
            void el.offsetWidth;
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
        // Player buffs/debuffs under player bars — container exists in HTML
        const statusContainer = document.getElementById('combat-status-bar');
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
            } else if (buff.type === 'blind') {
                html += `<span class="combat-status-icon player-debuff">🌑 Blinded (${buff.duration})</span>`;
            } else if (buff.type === 'slow') {
                html += `<span class="combat-status-icon player-debuff">🐌 Slowed (${buff.duration})</span>`;
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

        // Enemy buffs/debuffs
        for (const debuff of this.enemyBuffs) {
            if (debuff.type === 'poison') {
                html += `<span class="combat-status-icon enemy-debuff">☠️ Enemy Poison (${debuff.duration})</span>`;
            } else if (debuff.type === 'reflect') {
                html += `<span class="combat-status-icon enemy-debuff">🔄 Reflecting (${debuff.duration})</span>`;
            } else if (debuff.type === 'defense') {
                html += `<span class="combat-status-icon enemy-debuff">🛡️ Defense Up (${debuff.duration})</span>`;
            } else if (debuff.type === 'allBuff') {
                html += `<span class="combat-status-icon enemy-debuff">⬆️ Empowered (${debuff.duration})</span>`;
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
        this.stopAmbientParticles();

        const enemy = this.enemy;
        if (!enemy) return;

        this.logCombat(`The ${enemy.name} has been defeated!`, 'victory');
        this.triggerEnemyDeathAnim();
        NativeBridge.hapticNotification('success');
        if (typeof Audio !== 'undefined') Audio.playVictory();

        // Track stats
        GameState.trackStat('enemiesKilled');
        GameState.trackStat('totalDamageDealt', this.totalDamageDealt);
        if (enemy.isBoss) GameState.trackStat('bossesKilled');
        if (this.maxCombo > (GameState.stats.maxCombo || 0)) {
            GameState.stats.maxCombo = this.maxCombo;
        }

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
        GameState.trackStat('goldEarned', gold);
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
        this.stopAmbientParticles();

        this.logCombat('You have fallen...', 'defeat');
        NativeBridge.hapticNotification('error');
        if (typeof Audio !== 'undefined') Audio.playDefeat();
        this.logCombat('Darkness takes you...', 'info');
        GameState.trackStat('deathCount');

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
        this.stopAmbientParticles();
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
        this.stopAmbientParticles();
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
    },

    // ---- BATTLEFIELD BACKGROUND ----
    renderBattlefield() {
        const canvas = document.getElementById('combat-bg-canvas');
        if (!canvas || typeof Sprites === 'undefined') return;
        // Size canvas to screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const region = GameState.currentRegion || 'ashen_wastes';
        Sprites.drawCombatBattlefield(canvas, region);
    },

    // ---- ENEMY TELEGRAPH / INTENT ----
    showEnemyIntent(ability) {
        const intentEl = document.getElementById('enemy-intent');
        if (!intentEl || !ability) return;

        let intentType = 'attack';
        let intentText = ability.name;
        if (ability.type === 'buff') {
            intentType = 'buff';
        } else if (ability.type === 'debuff') {
            intentType = 'debuff';
        } else if (ability.type === 'heal') {
            intentType = 'buff';
        } else if (ability.damage && ability.damage[1] >= 20) {
            intentType = 'special';
        }

        intentEl.innerHTML = `<span class="intent-indicator ${intentType}-intent">${intentText}</span>`;
        intentEl.classList.add('visible');
    },

    clearEnemyIntent() {
        const intentEl = document.getElementById('enemy-intent');
        if (intentEl) {
            intentEl.classList.remove('visible');
            intentEl.innerHTML = '';
        }
    },

    // ---- ENEMY HIT/DEATH ANIMATIONS ----
    triggerEnemyHitRecoil() {
        const display = document.getElementById('enemy-display');
        if (!display) return;
        const canvas = display.querySelector('.enemy-art-canvas');
        if (canvas) {
            canvas.classList.remove('hit');
            void canvas.offsetWidth;
            canvas.classList.add('hit');
            this._setTimeout(() => canvas.classList.remove('hit'), 400);
        }
    },

    triggerEnemyDeathAnim() {
        const display = document.getElementById('enemy-display');
        if (!display) return;
        const canvas = display.querySelector('.enemy-art-canvas');
        if (canvas) {
            canvas.classList.add('dying');
        }
    },

    // ---- DRAINING BAR EFFECT ----
    triggerBarDrain() {
        const bar = document.getElementById('enemy-hp-bar');
        if (!bar) return;
        bar.classList.add('draining');
        this._setTimeout(() => bar.classList.remove('draining'), 400);

        // Low HP pulse
        if (this.enemy && this.enemy.maxHp > 0 && this.enemy.hp / this.enemy.maxHp < 0.25) {
            bar.classList.add('low-hp');
        } else if (bar) {
            bar.classList.remove('low-hp');
        }
    },

    // ---- ELEMENTAL LABELS (Weak! / Resist! / Chain) ----
    showElementalLabel(text, type) {
        const display = document.getElementById('enemy-display');
        if (!display) return;
        const label = document.createElement('div');
        label.className = `elemental-label ${type}`;
        label.textContent = text;
        display.appendChild(label);
        this._setTimeout(() => { if (label.parentNode) label.remove(); }, 1200);
    },

    // ---- COMBO CHAIN HELPERS ----
    _getElementChainLength(element) {
        let count = 0;
        for (let i = this._comboChain.length - 1; i >= 0; i--) {
            if (this._comboChain[i] === element) count++;
            else break;
        }
        return count;
    },

    _getElementSwitchBonus(prevElement, currentElement) {
        // Specific element combos that grant bonus damage
        const combos = {
            'fire_ice': 15,    // Thermal shock
            'ice_fire': 15,
            'fire_lightning': 20, // Storm of flame
            'lightning_fire': 20,
            'ice_lightning': 15,  // Frozen conductor
            'lightning_ice': 15,
            'shadow_fire': 10,   // Dark flame
            'fire_shadow': 10,
            'shadow_lightning': 15, // Void spark
            'lightning_shadow': 15
        };
        return combos[`${prevElement}_${currentElement}`] || 0;
    },

    // ---- ABILITY-SPECIFIC VFX MAPPING ----
    getAbilityVFX(ability) {
        if (!ability) return { spell: 'physical', flash: 'rgba(255,255,255,0.5)', slash: 'physical', particleColor: '#aabbff' };

        const name = (ability.name || '').toLowerCase();

        // Blood / lifesteal abilities
        if (name.includes('blood') || name.includes('crimson') || name.includes('sanguine') || name.includes('exsanguinate') || name.includes('hemorrhage') || name.includes('drain')) {
            return { spell: 'blood', flash: 'rgba(180,20,20,0.6)', slash: 'blood', particleColor: '#cc2222' };
        }

        // Void / shadow abilities
        if (name.includes('void') || name.includes('shadow') || name.includes('umbral') || name.includes('dark') || name.includes('unmaking') || name.includes('rift') || name.includes('null') || name.includes('reality') || name.includes('phase')) {
            return { spell: 'void', flash: 'rgba(100,30,180,0.6)', slash: 'void', particleColor: '#9944dd' };
        }

        // Fire abilities
        if (ability.element === 'fire' || name.includes('fire') || name.includes('flame') || name.includes('ember') || name.includes('runefire') || name.includes('meteor') || name.includes('crown of flame')) {
            return { spell: 'fire', flash: 'rgba(255,120,30,0.6)', slash: 'fire', particleColor: '#ff6622' };
        }

        // Ice abilities
        if (ability.element === 'ice' || name.includes('frost') || name.includes('ice') || name.includes('cold')) {
            return { spell: 'ice', flash: 'rgba(80,180,255,0.6)', slash: 'ice', particleColor: '#44aaff' };
        }

        // Lightning abilities
        if (ability.element === 'lightning' || name.includes('lightning') || name.includes('chain') || name.includes('shock')) {
            return { spell: 'lightning', flash: 'rgba(180,220,255,0.7)', slash: 'lightning', particleColor: '#aaddff' };
        }

        // Heal / restoration abilities
        if (ability.type === 'heal' || name.includes('heal') || name.includes('restoration') || name.includes('soul heal')) {
            return { spell: 'heal', flash: 'rgba(60,200,80,0.5)', slash: 'heal', particleColor: '#44aa55' };
        }

        // Buff abilities
        if (ability.type === 'buff') {
            return { spell: 'buff', flash: 'rgba(201,168,76,0.4)', slash: 'heal', particleColor: '#c9a84c' };
        }

        // Multi-hit abilities
        if (ability.hits && ability.hits > 1 || name.includes('fan') || name.includes('thousand') || name.includes('rift walk')) {
            return { spell: 'physical', flash: 'rgba(255,255,255,0.6)', slash: 'multi', particleColor: '#ffffff' };
        }

        // Soul / spectral abilities
        if (name.includes('soul') || name.includes('spectral') || name.includes('spirit') || name.includes('reaping')) {
            return { spell: 'shadow', flash: 'rgba(120,140,200,0.5)', slash: 'shadow', particleColor: '#8899cc' };
        }

        // Generic magical
        if (ability.type === 'magical') {
            return { spell: 'shadow', flash: 'rgba(100,150,255,0.5)', slash: 'shadow', particleColor: '#6699cc' };
        }

        // Generic physical
        return { spell: 'physical', flash: 'rgba(255,255,255,0.5)', slash: 'physical', particleColor: '#aabbff' };
    },

    // ---- ENEMY WIND-UP ANIMATION ----
    triggerEnemyWindUp(ability) {
        const display = document.getElementById('enemy-display');
        if (!display) return;
        const canvas = display.querySelector('.enemy-art-canvas');
        if (!canvas) return;

        canvas.classList.remove('wind-up-physical', 'wind-up-magical', 'wind-up-heavy');
        void canvas.offsetWidth;

        let windUpClass = 'wind-up-physical';
        if (ability) {
            if (ability.damage && ability.damage[1] >= 25) {
                windUpClass = 'wind-up-heavy';
            } else if (ability.type === 'magical') {
                windUpClass = 'wind-up-magical';
            }
        }

        canvas.classList.add(windUpClass);
        const duration = windUpClass === 'wind-up-heavy' ? 700 : 500;
        this._setTimeout(() => canvas.classList.remove(windUpClass), duration);
    },

    // ---- STATUS EFFECT VISUAL OVERLAYS ----
    updateStatusOverlays() {
        const stage = document.getElementById('combat-stage');
        if (!stage) return;

        // Remove all existing status overlays
        stage.querySelectorAll('[class^="status-overlay-"]').forEach(el => el.remove());

        // Add overlays for active debuffs on the player
        const activeTypes = new Set();
        for (const buff of this.playerBuffs) {
            if (buff.type === 'poison' || buff.type === 'blind' || buff.type === 'slow' || buff.type === 'weaken') {
                activeTypes.add(buff.type);
            }
        }
        if (GameState.player.statusEffects) {
            for (const se of GameState.player.statusEffects) {
                if (se.type === 'poison') activeTypes.add('poison');
            }
        }

        for (const type of activeTypes) {
            const overlay = document.createElement('div');
            overlay.className = `status-overlay-${type}`;
            stage.appendChild(overlay);
        }
    },

    // ---- PERSISTENT COMBAT AMBIENT PARTICLES ----
    _ambientParticleInterval: null,

    startAmbientParticles() {
        this.stopAmbientParticles();
        const stage = document.getElementById('combat-stage');
        if (!stage) return;

        const region = GameState.currentRegion || 'ashen_wastes';
        let particleClass, count;

        if (region === 'hollowfen') {
            particleClass = 'spore';
            count = 8;
        } else if (region === 'void_sanctum') {
            particleClass = 'void-mote';
            count = 10;
        } else {
            particleClass = 'ember';
            count = 12;
        }

        // Create initial batch
        this._spawnAmbientBatch(stage, particleClass, count);

        // Respawn particles periodically
        this._ambientParticleInterval = setInterval(() => {
            // Clean up old particles (beyond a reasonable count)
            const existing = stage.querySelectorAll('.combat-ambient-particle');
            if (existing.length < count * 2) {
                this._spawnAmbientBatch(stage, particleClass, Math.ceil(count / 2));
            }
        }, 3000);
    },

    _spawnAmbientBatch(stage, particleClass, count) {
        const stageRect = stage.getBoundingClientRect();
        const W = stageRect.width || 300;
        const H = stageRect.height || 400;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = `combat-ambient-particle ${particleClass}`;
            const size = 2 + Math.random() * 4;
            const x = Math.random() * W;
            const y = H * 0.3 + Math.random() * H * 0.6;
            const duration = 3 + Math.random() * 4;
            const delay = Math.random() * 3;
            const dx = (Math.random() - 0.5) * 30;
            const dy = -(20 + Math.random() * 40);
            const dx2 = dx + (Math.random() - 0.5) * 20;
            const dy2 = dy - (20 + Math.random() * 30);
            const alpha = 0.3 + Math.random() * 0.4;

            p.style.cssText = `
                left:${x}px;top:${y}px;
                width:${size}px;height:${size}px;
                --duration:${duration}s;--delay:${delay}s;
                --dx:${dx}px;--dy:${dy}px;
                --dx2:${dx2}px;--dy2:${dy2}px;
                --alpha:${alpha};
            `;
            stage.appendChild(p);

            // Remove after animation cycle
            setTimeout(() => { if (p.parentNode) p.remove(); }, (duration + delay) * 1000);
        }
    },

    stopAmbientParticles() {
        if (this._ambientParticleInterval) {
            clearInterval(this._ambientParticleInterval);
            this._ambientParticleInterval = null;
        }
        const stage = document.getElementById('combat-stage');
        if (stage) {
            stage.querySelectorAll('.combat-ambient-particle').forEach(el => el.remove());
        }
    },

    // ---- COUNTER / REACTION WINDOW ----
    showCounterWindow() {
        this._counterWindowActive = true;
        this._counterSuccess = false;

        const stage = document.getElementById('combat-stage');
        if (!stage) return;

        const counterBtn = document.createElement('button');
        counterBtn.id = 'counter-btn';
        counterBtn.className = 'counter-window-btn';
        counterBtn.innerHTML = '<span class="counter-icon">⚡</span><span class="counter-text">COUNTER</span>';
        counterBtn.addEventListener('click', () => {
            if (this._counterWindowActive) {
                this._counterSuccess = true;
                this._counterWindowActive = false;
                counterBtn.classList.add('counter-success');
                this.logCombat('Counter! You brace at the perfect moment!', 'buff');
                if (typeof Audio !== 'undefined') Audio.playDefend();
                NativeBridge.hapticMedium();
            }
        });

        // Add shrinking timer bar
        const timerBar = document.createElement('div');
        timerBar.className = 'counter-timer-bar';
        counterBtn.appendChild(timerBar);

        stage.appendChild(counterBtn);

        // Force reflow then animate in
        void counterBtn.offsetWidth;
        counterBtn.classList.add('active');
    },

    hideCounterWindow() {
        this._counterWindowActive = false;
        const btn = document.getElementById('counter-btn');
        if (btn) {
            btn.classList.remove('active');
            btn.classList.add('fading');
            setTimeout(() => { if (btn.parentNode) btn.remove(); }, 300);
        }
    },

    // ---- ENEMY WEAKNESS TOOLTIP ----
    showWeaknessTooltip() {
        if (!this.enemy) return;
        const discovered = this._discoveredWeaknesses[this.enemy.key];
        if (!discovered || Object.keys(discovered).length === 0) return;

        const display = document.getElementById('enemy-display');
        if (!display) return;

        // Remove existing tooltip
        const existing = display.querySelector('.weakness-tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'weakness-tooltip';
        let html = '';
        const icons = { fire: '🔥', ice: '❄️', lightning: '⚡', shadow: '🌑' };
        for (const [elem, result] of Object.entries(discovered)) {
            const icon = icons[elem] || elem;
            html += `<span class="weakness-entry ${result}">${icon}</span>`;
        }
        tooltip.innerHTML = html;
        display.appendChild(tooltip);
    }
};
