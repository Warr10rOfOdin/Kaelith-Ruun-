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

    start(enemyKey, onEnd) {
        const template = ENEMIES[enemyKey];
        if (!template) return;

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
            magicDefense: template.magicDefense,
            abilities: [...template.abilities],
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

        // Show combat screen
        ScreenManager.showScreen('combat');
        this.renderCombatUI();
        this.logCombat(`A ${this.enemy.name} appears!`, 'info');

        if (this.enemy.isBoss && this.enemy.phases.length > 0) {
            this.logCombat(this.enemy.phases[0].message, 'info');
        }

        this.enableActions();
    },

    renderCombatUI() {
        // Enemy display
        const enemyDisplay = document.getElementById('enemy-display');
        enemyDisplay.innerHTML = `
            <div class="enemy-art">${this.enemy.icon}</div>
            <div class="enemy-name">${this.enemy.name}</div>
            <div class="enemy-level">Level ${this.enemy.level}</div>
        `;

        // Enemy bars
        const enemyBars = document.getElementById('enemy-bars');
        enemyBars.innerHTML = `
            <div class="combat-bar-container">
                <div id="enemy-hp-bar" class="combat-bar enemy-hp" style="width: 100%"></div>
                <span class="combat-bar-text" id="enemy-hp-text">${this.enemy.hp} / ${this.enemy.maxHp}</span>
            </div>
        `;

        // Player bars
        const playerBars = document.getElementById('player-combat-bars');
        playerBars.innerHTML = `
            <div class="combat-bar-container">
                <div id="player-combat-hp" class="combat-bar player-hp" style="width: ${(GameState.player.hp / GameState.player.maxHp) * 100}%"></div>
                <span class="combat-bar-text">${GameState.player.hp} / ${GameState.player.maxHp} HP</span>
            </div>
            <div class="combat-bar-container">
                <div id="player-combat-mp" class="combat-bar player-mp" style="width: ${(GameState.player.mp / GameState.player.maxMp) * 100}%"></div>
                <span class="combat-bar-text">${GameState.player.mp} / ${GameState.player.maxMp} MP</span>
            </div>
        `;

        // Combat actions
        this.renderActions();

        // Clear combat log
        this.log = document.getElementById('combat-log');
        this.log.innerHTML = '';
    },

    renderActions() {
        const actionsDiv = document.getElementById('combat-actions');
        const p = GameState.player;

        let html = '';

        // Basic attack
        html += `<button class="combat-btn attack" onclick="Combat.playerAction('attack')">Attack</button>`;

        // Abilities
        p.abilities.forEach((ability, idx) => {
            const canUse = ability.mpCost <= p.mp;
            html += `<button class="combat-btn magic" ${!canUse ? 'disabled' : ''} onclick="Combat.playerAction('ability', ${idx})">${ability.name} (${ability.mpCost} MP)</button>`;
        });

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
        const consumables = GameState.player.inventory.filter(i => ITEMS[i.key] && ITEMS[i.key].type === 'consumable');

        let html = '';
        consumables.forEach(invItem => {
            const item = ITEMS[invItem.key];
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
                GameState.healPlayer(item.effect.hpAmount, item.effect.mpAmount);
                this.logCombat(`You drink the ${item.name}. Restored ${item.effect.hpAmount} HP and ${item.effect.mpAmount} MP!`, 'heal');
            }
        } else if (item.effect.type === 'flee') {
            this.logCombat('You hurl a smoke bomb and vanish!', 'info');
            setTimeout(() => this.endCombat('flee'), 800);
            return;
        } else if (item.effect.type === 'buff') {
            this.playerBuffs.push({ stat: item.effect.stat, percent: item.effect.percent, duration: item.effect.duration });
            this.logCombat(`You drink the ${item.name}. ${item.effect.stat} increased by ${item.effect.percent}%!`, 'buff');
        }

        this.updateBars();
        this.enemyTurn();
    },

    playerAction(action, abilityIdx) {
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
        setTimeout(() => {
            this.enemyTurn();
        }, 600);
    },

    performAttack() {
        const p = GameState.player;
        let damage = this.calculateDamage(p.attack, this.enemy.defense);
        const isCrit = Math.random() * 100 < p.critChance;

        if (isCrit) {
            damage = Math.floor(damage * 1.8);
            this.logCombat(`CRITICAL HIT! You strike the ${this.enemy.name} for ${damage} damage!`, 'critical');
        } else {
            this.logCombat(`You attack the ${this.enemy.name} for ${damage} damage.`, 'player-attack');
        }

        this.applyDamageToEnemy(damage);
        this.shakeElement('enemy-display');
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
            } else {
                this.logCombat(`${ability.name} hits the ${this.enemy.name} for ${damage}!`, 'player-attack');
            }

            this.applyDamageToEnemy(damage);
            this.shakeElement('enemy-display');

            // Lifesteal abilities
            if (ability.name === 'Crimson Drain' || ability.name === 'Reaping Strike') {
                const healAmount = Math.floor(damage * 0.3);
                GameState.healPlayer(healAmount);
                this.logCombat(`You drain ${healAmount} HP from your foe!`, 'heal');
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
    },

    performFlee() {
        const fleeChance = 40 + (GameState.player.speed - this.enemy.speed) * 5;
        if (Math.random() * 100 < fleeChance) {
            this.logCombat('You manage to escape!', 'info');
            setTimeout(() => this.endCombat('flee'), 800);
        } else {
            this.logCombat('You fail to escape!', 'miss');
            setTimeout(() => this.enemyTurn(), 600);
        }
    },

    enemyTurn() {
        if (!this.active || this.enemy.hp <= 0) return;

        // Process enemy debuffs (poison etc.)
        this.enemyBuffs = this.enemyBuffs.filter(b => {
            if (b.type === 'poison' && b.duration > 0) {
                this.enemy.hp = Math.max(0, this.enemy.hp - b.damage);
                this.logCombat(`${this.enemy.name} takes ${b.damage} poison damage!`, 'player-attack');
                b.duration--;
                if (this.enemy.hp <= 0) {
                    this.handleVictory();
                    return false;
                }
            }
            return b.duration > 0;
        });

        if (this.enemy.hp <= 0) return;

        // Check boss phases
        if (this.enemy.isBoss) {
            this.checkBossPhase();
        }

        // Enemy heal ability
        const healAbility = this.enemy.abilities.find(a => a.type === 'heal');
        if (healAbility && this.enemy.hp < this.enemy.maxHp * 0.5 && Math.random() < 0.3) {
            const healAmount = healAbility.amount || 20;
            this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + healAmount);
            this.logCombat(`${this.enemy.name} regenerates ${healAmount} HP!`, 'heal');
            this.updateBars();
            this.finishEnemyTurn();
            return;
        }

        // Choose enemy ability
        const validAbilities = this.enemy.abilities.filter(a => {
            if (a.threshold && (this.enemy.hp / this.enemy.maxHp) > a.threshold) return false;
            if (a.type === 'buff' || a.type === 'debuff') return Math.random() < 0.3;
            return true;
        });

        const ability = validAbilities[Math.floor(Math.random() * validAbilities.length)] || this.enemy.abilities[0];

        if (ability.type === 'buff') {
            this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'info');
        } else if (ability.type === 'debuff') {
            this.logCombat(`${this.enemy.name} uses ${ability.name}!`, 'enemy-attack');
            if (ability.debuff === 'weaken') {
                this.playerBuffs.push({ type: 'weaken', duration: 2 });
            }
        } else {
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

            GameState.player.hp = Math.max(0, GameState.player.hp - damage);

            const miss = Math.random() < 0.1;
            if (miss) {
                this.logCombat(`${this.enemy.name} uses ${ability.name} but misses!`, 'miss');
            } else {
                this.logCombat(`${this.enemy.name} uses ${ability.name} for ${damage} damage!`, 'enemy-attack');
            }

            // Lifesteal
            if (ability.lifesteal && !miss) {
                const steal = Math.floor(damage * (ability.lifesteal / 100));
                this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + steal);
                this.logCombat(`${this.enemy.name} drains ${steal} HP!`, 'heal');
            }

            // Debuffs
            if (ability.debuff && !miss) {
                if (ability.debuff === 'poison') {
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
        // Tick down player buffs
        this.playerBuffs = this.playerBuffs.filter(b => {
            b.duration--;
            return b.duration > 0;
        });

        // Tick player status effects
        GameState.player.statusEffects = GameState.player.statusEffects.filter(se => {
            if (se.type === 'poison') {
                GameState.player.hp = Math.max(1, GameState.player.hp - se.damage);
                this.logCombat(`Poison deals ${se.damage} damage!`, 'enemy-attack');
            }
            se.duration--;
            return se.duration > 0;
        });

        this.updateBars();

        if (GameState.player.hp <= 0) {
            this.handleDefeat();
            return;
        }

        this.renderActions();
        this.enableActions();
    },

    checkBossPhase() {
        const hpPercent = this.enemy.hp / this.enemy.maxHp;
        const phases = this.enemy.phases;

        for (let i = phases.length - 1; i > this.enemy.currentPhase; i--) {
            if (hpPercent <= phases[i].hpPercent) {
                this.enemy.currentPhase = i;
                this.logCombat(phases[i].message, 'info');

                if (phases[i].buff) {
                    for (const [stat, val] of Object.entries(phases[i].buff)) {
                        this.enemy[stat] = (this.enemy[stat] || 0) + val;
                    }
                    this.logCombat(`${this.enemy.name} grows stronger!`, 'info');
                }
                break;
            }
        }
    },

    calculateDamage(attackPower, defense) {
        const base = Math.max(1, attackPower - Math.floor(defense * 0.5));
        const variance = Math.floor(base * 0.2);
        return base + Math.floor(Math.random() * variance) - Math.floor(variance / 2);
    },

    applyDamageToEnemy(damage) {
        this.enemy.hp = Math.max(0, this.enemy.hp - damage);
        this.updateBars();
    },

    updateBars() {
        const enemyHpBar = document.getElementById('enemy-hp-bar');
        const enemyHpText = document.getElementById('enemy-hp-text');
        if (enemyHpBar) {
            enemyHpBar.style.width = `${Math.max(0, (this.enemy.hp / this.enemy.maxHp) * 100)}%`;
        }
        if (enemyHpText) {
            enemyHpText.textContent = `${Math.max(0, this.enemy.hp)} / ${this.enemy.maxHp}`;
        }

        const playerHpBar = document.getElementById('player-combat-hp');
        const playerMpBar = document.getElementById('player-combat-mp');
        if (playerHpBar) {
            playerHpBar.style.width = `${(GameState.player.hp / GameState.player.maxHp) * 100}%`;
            playerHpBar.parentElement.querySelector('.combat-bar-text').textContent = `${GameState.player.hp} / ${GameState.player.maxHp} HP`;
        }
        if (playerMpBar) {
            playerMpBar.style.width = `${(GameState.player.mp / GameState.player.maxMp) * 100}%`;
            playerMpBar.parentElement.querySelector('.combat-bar-text').textContent = `${GameState.player.mp} / ${GameState.player.maxMp} MP`;
        }

        HUD.update();
    },

    logCombat(text, type = 'info') {
        if (!this.log) this.log = document.getElementById('combat-log');

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
            setTimeout(() => el.classList.remove('shake'), 300);
        }
    },

    handleVictory() {
        this.active = false;
        const enemy = this.enemy;
        const template = ENEMIES[enemy.key];

        this.logCombat(`The ${enemy.name} has been defeated!`, 'victory');

        // XP
        let xp = enemy.xpReward;
        if (RACES[GameState.player.race].name === 'Human') {
            xp = Math.floor(xp * 1.1);
        }
        const leveled = GameState.gainXp(xp);
        this.logCombat(`Gained ${xp} XP!`, 'info');

        if (leveled) {
            this.logCombat(`LEVEL UP! You are now level ${GameState.player.level}!`, 'victory');
            setTimeout(() => Effects.levelUp(), 500);
        }

        // Gold
        const goldMin = enemy.goldReward[0];
        const goldMax = enemy.goldReward[1];
        const gold = goldMin + Math.floor(Math.random() * (goldMax - goldMin + 1));
        GameState.player.gold += gold;
        this.logCombat(`Found ${gold} gold!`, 'info');

        // Loot
        if (template.lootTable) {
            for (const [itemKey, chance] of Object.entries(template.lootTable)) {
                if (Math.random() < chance) {
                    GameState.addToInventory(itemKey);
                    const item = ITEMS[itemKey];
                    if (item) {
                        this.logCombat(`Obtained: ${item.icon} ${item.name}!`, 'info');
                    }
                }
            }
        }

        // Track boss defeats
        if (enemy.isBoss) {
            GameState.bossesDefeated.push(enemy.key);

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

        GameState.save();

        // Return to game after a delay
        setTimeout(() => {
            this.returnToGame();
        }, 2500);
    },

    handleDefeat() {
        this.active = false;
        this.logCombat('You have fallen...', 'defeat');
        this.logCombat('Darkness takes you, but something pulls you back...', 'info');

        setTimeout(() => {
            // Revive at half health in the current region's first location
            GameState.player.hp = Math.floor(GameState.player.maxHp * 0.5);
            GameState.player.mp = Math.floor(GameState.player.maxMp * 0.5);

            const region = WORLD.regions[GameState.currentRegion];
            if (region) {
                GameState.currentLocation = region.locations[0];
            }

            GameState.save();
            this.returnToGame();
            Narrative.addSystem('You awaken, gasping. Death was close — but not today.');
        }, 3000);
    },

    returnToGame() {
        ScreenManager.showScreen('game');
        Exploration.showCurrentLocation();
        HUD.update();

        if (this.onCombatEnd) {
            this.onCombatEnd(this.enemy.hp <= 0 ? 'victory' : 'defeat');
            this.onCombatEnd = null;
        }
    },

    endCombat(reason) {
        this.active = false;
        ScreenManager.showScreen('game');
        HUD.update();

        if (reason === 'flee') {
            Narrative.addSystem('You escaped from combat.');
        }

        if (this.onCombatEnd) {
            this.onCombatEnd(reason);
            this.onCombatEnd = null;
        }
    }
};
