// ============================================
// PROGRESSION ENGINE
// ============================================

const Progression = {
    getMainQuestStage() {
        const quest = QUESTS.main_quest;
        const progress = GameState.questProgress.main;

        // Determine current stage
        for (let i = quest.stages.length - 1; i >= 0; i--) {
            const stage = quest.stages[i];
            const allComplete = stage.objectives.every(obj =>
                GameState.isObjectiveComplete('main', null, obj.id)
            );
            if (allComplete && i < quest.stages.length - 1) {
                return i + 1;
            }
        }

        // Check stage 0
        return progress.stage || 0;
    },

    renderJournal() {
        const panel = document.getElementById('side-panel-content');
        const quest = QUESTS.main_quest;
        const currentStage = this.getMainQuestStage();

        let html = '<div class="journal-header"><h3>Journal</h3></div>';

        // Main quest
        html += '<div class="journal-entry active">';
        html += `<h4><span class="quest-badge main">Main</span> ${quest.name}</h4>`;
        html += `<p>${quest.description}</p>`;
        html += '</div>';

        // Current stage with objectives
        if (quest.stages[currentStage]) {
            const stage = quest.stages[currentStage];
            const totalObj = stage.objectives.length;
            const completeObj = stage.objectives.filter(obj => GameState.isObjectiveComplete('main', null, obj.id)).length;
            const progressPct = totalObj > 0 ? (completeObj / totalObj) * 100 : 0;

            html += '<div class="journal-entry active">';
            html += `<h4>${stage.name}</h4>`;
            html += `<p>${stage.description}</p>`;

            html += '<div class="quest-progress">';
            stage.objectives.forEach(obj => {
                const complete = GameState.isObjectiveComplete('main', null, obj.id);
                html += `<div class="objective ${complete ? 'complete' : 'incomplete'}">`;
                html += `<span class="obj-check">${complete ? '&#10003;' : ''}</span>`;
                html += `<span class="obj-text">${obj.text}</span>`;
                html += '</div>';
            });
            html += '</div>';

            html += `<div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${progressPct}%"></div></div>`;
            html += '</div>';
        }

        // Side quests
        html += '<div class="journal-section-label">Side Quests</div>';

        let hasSideQuests = false;
        for (const [questId, sideQuest] of Object.entries(QUESTS.side_quests)) {
            const hasProgress = GameState.questProgress.side[questId];
            if (hasProgress || questId === 'codex_collector') {
                hasSideQuests = true;
                const totalObj = sideQuest.objectives.length;
                const completeObj = sideQuest.objectives.filter(obj => GameState.isObjectiveComplete('side', questId, obj.id)).length;
                const allDone = completeObj === totalObj;
                const progressPct = totalObj > 0 ? (completeObj / totalObj) * 100 : 0;

                html += `<div class="journal-entry ${allDone ? 'completed' : ''}">`;
                html += `<h4><span class="quest-badge side">Side</span> ${sideQuest.name}</h4>`;
                html += `<p>${sideQuest.description}</p>`;

                html += '<div class="quest-progress">';
                sideQuest.objectives.forEach(obj => {
                    const complete = GameState.isObjectiveComplete('side', questId, obj.id);
                    html += `<div class="objective ${complete ? 'complete' : 'incomplete'}">`;
                    html += `<span class="obj-check">${complete ? '&#10003;' : ''}</span>`;
                    html += `<span class="obj-text">${obj.text}</span>`;
                    html += '</div>';
                });
                html += '</div>';

                html += `<div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${progressPct}%"></div></div>`;
                html += '</div>';
            }
        }

        if (!hasSideQuests) {
            html += '<div style="color:var(--text-dim);font-size:0.8rem;font-style:italic;padding:0.5rem 0">No side quests discovered yet.</div>';
        }

        panel.innerHTML = html;
    },

    renderCharacterSheet() {
        const panel = document.getElementById('side-panel-content');
        const p = GameState.player;
        const race = RACES[p.race];
        const cls = CLASSES[p.class];

        let html = '<div class="char-sheet">';

        // Header
        html += '<div class="char-sheet-header">';
        html += `<h3>${p.name}</h3>`;
        html += `<div class="char-subtitle">${race.icon || ''} ${race.name} ${cls.name} — Level ${p.level}</div>`;
        html += '</div>';

        // Vitals with visual bars
        html += '<div class="stat-group"><h4><span class="group-icon">&#9829;</span> Vitals</h4>';
        const hpPct = p.maxHp > 0 ? Math.min(100, (p.hp / p.maxHp) * 100) : 0;
        const mpPct = p.maxMp > 0 ? Math.min(100, (p.mp / p.maxMp) * 100) : 0;
        const xpPct = p.xpToNext > 0 ? Math.min(100, (p.xp / p.xpToNext) * 100) : 0;
        html += `<div class="stat-bar-row"><div class="stat-bar-label"><span class="bar-name"><span class="stat-icon">&#10084;</span> HP</span><span class="bar-value">${p.hp} / ${p.maxHp}</span></div><div class="stat-bar-track"><div class="stat-bar-fill hp" style="width:${hpPct}%"></div></div></div>`;
        html += `<div class="stat-bar-row"><div class="stat-bar-label"><span class="bar-name"><span class="stat-icon">&#9670;</span> MP</span><span class="bar-value">${p.mp} / ${p.maxMp}</span></div><div class="stat-bar-track"><div class="stat-bar-fill mp" style="width:${mpPct}%"></div></div></div>`;
        html += `<div class="stat-bar-row"><div class="stat-bar-label"><span class="bar-name"><span class="stat-icon">&#9733;</span> XP</span><span class="bar-value">${p.xp} / ${p.xpToNext}</span></div><div class="stat-bar-track"><div class="stat-bar-fill xp" style="width:${xpPct}%"></div></div></div>`;
        html += `<div class="stat-row"><span class="stat-name"><span class="stat-icon">&#9679;</span> Gold</span><span class="stat-value" style="color:var(--accent-gold)">${p.gold}</span></div>`;
        html += '</div>';

        // Attributes with icons
        html += '<div class="stat-group"><h4><span class="group-icon">&#9876;</span> Attributes</h4>';
        const statConfig = [
            ['str', 'Strength', '&#9876;'],
            ['dex', 'Dexterity', '&#10148;'],
            ['int', 'Intelligence', '&#9733;'],
            ['wis', 'Wisdom', '&#9775;'],
            ['con', 'Constitution', '&#9829;'],
            ['cha', 'Charisma', '&#9830;']
        ];
        for (const [key, name, icon] of statConfig) {
            html += `<div class="stat-row"><span class="stat-name"><span class="stat-icon">${icon}</span> ${name}</span><span class="stat-value">${p.stats[key]}</span></div>`;
        }
        html += '</div>';

        // Combat stats with icons
        html += '<div class="stat-group"><h4><span class="group-icon">&#9876;</span> Combat</h4>';
        const combatStats = [
            ['Attack', p.attack, '&#9876;'],
            ['Defense', p.defense, '&#9917;'],
            ['Magic ATK', p.magicAttack, '&#10040;'],
            ['Magic DEF', p.magicDefense, '&#10041;'],
            ['Speed', p.speed, '&#10148;'],
            ['Crit Chance', p.critChance + '%', '&#10038;']
        ];
        for (const [name, val, icon] of combatStats) {
            html += `<div class="stat-row"><span class="stat-name"><span class="stat-icon">${icon}</span> ${name}</span><span class="stat-value">${val}</span></div>`;
        }
        html += '</div>';

        // Abilities as styled cards
        html += '<div class="stat-group"><h4><span class="group-icon">&#9889;</span> Abilities</h4>';
        p.abilities.forEach(a => {
            html += '<div class="ability-card">';
            html += '<div class="ability-header">';
            html += `<span class="ability-name">${a.name}</span>`;
            html += `<span class="ability-cost">${a.mpCost} MP</span>`;
            html += '</div>';
            html += `<div class="ability-desc">${a.desc}</div>`;
            if (a.damage && a.damage[1] > 0) {
                html += `<div class="ability-damage">${a.damage[0]}-${a.damage[1]} damage</div>`;
            }
            html += '</div>';
        });
        html += '</div>';

        // Racial traits
        html += '<div class="stat-group"><h4><span class="group-icon">&#9874;</span> Racial Traits</h4>';
        race.abilities.forEach(a => {
            html += `<div class="ability-card"><div class="ability-desc">${a}</div></div>`;
        });
        html += '</div>';

        // Skill Tree
        if (cls.skillTree && cls.skillTree.length > 0) {
            html += '<div class="stat-group"><h4><span class="group-icon">&#9878;</span> Skill Tree</h4>';
            const choices = p.skillChoices || {};
            for (const tier of cls.skillTree) {
                const unlocked = p.level >= tier.level;
                const chosen = choices[tier.level] !== undefined;
                const chosenIdx = choices[tier.level];

                html += `<div class="skill-tier ${unlocked ? '' : 'locked'}">`;
                html += `<div class="tier-label">Level ${tier.level}</div>`;

                if (chosen) {
                    const ability = tier.choices[chosenIdx];
                    html += '<div class="tier-chosen">';
                    html += `<span class="check-mark">&#10003;</span>`;
                    html += `<span class="ability-name" style="color:var(--accent-gold);font-size:0.85rem">${ability.name}</span>`;
                    html += '</div>';
                    html += `<div style="color:var(--text-secondary);font-size:0.78rem;margin-top:0.1rem">${ability.desc}</div>`;
                } else if (unlocked) {
                    html += `<div style="color:var(--accent-gold);font-size:0.8rem;margin-bottom:0.2rem">Choose an ability:</div>`;
                    tier.choices.forEach((ability, idx) => {
                        html += `<button class="skill-choice-btn" onclick="GameState.selectSkillChoice(${tier.level},${idx});Progression.renderCharacterSheet()">`;
                        html += `<div style="color:var(--accent-gold);font-size:0.85rem">${ability.name} <span style="color:var(--accent-blue-bright);font-size:0.7rem">${ability.mpCost}MP${ability.damage && ability.damage[1] > 0 ? ' &middot; ' + ability.damage[0] + '-' + ability.damage[1] : ''}</span></div>`;
                        html += `<div style="color:var(--text-secondary);font-size:0.78rem">${ability.desc}</div>`;
                        html += '</button>';
                    });
                } else {
                    html += `<div style="color:var(--text-dim);font-size:0.78rem;font-style:italic">Reach level ${tier.level} to unlock</div>`;
                }
                html += '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        panel.innerHTML = html;
    },

    renderAchievements() {
        const panel = document.getElementById('side-panel-content');
        if (!panel) return;
        const s = GameState.stats || {};
        const a = GameState.achievements || {};
        const defs = GameState._achievementDefs || {};

        const total = Object.keys(defs).length;
        const unlockedCount = Object.keys(a).length;
        const progressPct = total > 0 ? (unlockedCount / total) * 100 : 0;

        let html = '<div class="achievements-header">';
        html += '<h3>Achievements</h3>';
        html += `<div class="achievements-counter">${unlockedCount} / ${total} <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${progressPct}%"></div></div></div>`;
        html += '</div>';

        // Unlocked first, then locked
        const entries = Object.entries(defs);
        const unlockedEntries = entries.filter(([id]) => a[id]);
        const lockedEntries = entries.filter(([id]) => !a[id]);

        for (const [id, def] of [...unlockedEntries, ...lockedEntries]) {
            const isUnlocked = a[id];
            html += `<div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">`;
            html += `<div class="ach-badge">${isUnlocked ? '&#9733;' : '&#9734;'}</div>`;
            html += '<div class="ach-info">';
            html += `<div class="ach-name">${def.name}</div>`;
            html += `<div class="ach-desc">${def.desc}</div>`;
            html += '</div></div>';
        }

        // Statistics section
        html += '<div class="stats-section-label">Statistics</div>';
        html += '<div class="char-sheet"><div class="stat-group">';

        const statDisplay = [
            ['enemiesKilled', 'Enemies Defeated', '&#9876;'],
            ['bossesKilled', 'Bosses Defeated', '&#9760;'],
            ['totalDamageDealt', 'Total Damage Dealt', '&#10038;'],
            ['totalDamageReceived', 'Damage Received', '&#10006;'],
            ['criticalHits', 'Critical Hits', '&#10040;'],
            ['maxCombo', 'Best Combo', '&#10039;'],
            ['deathCount', 'Deaths', '&#9760;'],
            ['goldEarned', 'Gold Earned', '&#9679;'],
            ['goldSpent', 'Gold Spent', '&#9679;'],
            ['fishCaught', 'Fish Caught', '&#9831;'],
            ['resourcesGathered', 'Resources Gathered', '&#9830;'],
            ['itemsCrafted', 'Items Crafted', '&#9874;'],
            ['buildingsBuilt', 'Buildings Built', '&#9962;'],
            ['questsCompleted', 'Quests Completed', '&#10003;'],
            ['regionsDiscovered', 'Regions Discovered', '&#9775;'],
            ['highestLevel', 'Highest Level', '&#9733;'],
        ];

        statDisplay.forEach(([key, label, icon]) => {
            const val = s[key] || 0;
            html += `<div class="stat-row"><span class="stat-name"><span class="stat-icon">${icon}</span> ${label}</span><span class="stat-value">${val}</span></div>`;
        });

        // Play time
        const mins = Math.floor((s.playTime || 0) / 60);
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        html += `<div class="stat-row"><span class="stat-name"><span class="stat-icon">&#9201;</span> Play Time</span><span class="stat-value">${hrs > 0 ? hrs + 'h ' : ''}${remMins}m</span></div>`;

        html += '</div></div>';
        panel.innerHTML = html;
    },

    // Check and grant quest rewards when all objectives in a stage/quest complete
    checkQuestCompletion() {
        if (!GameState.questProgress) return;

        // Check main quest stages
        const mainQuest = QUESTS.main_quest;
        const mainProgress = GameState.questProgress.main;
        if (!mainProgress._stagesRewarded) mainProgress._stagesRewarded = {};

        for (let i = 0; i < mainQuest.stages.length; i++) {
            const stage = mainQuest.stages[i];
            if (mainProgress._stagesRewarded[i]) continue;

            const allComplete = stage.objectives.every(obj =>
                GameState.isObjectiveComplete('main', null, obj.id)
            );
            if (allComplete) {
                mainProgress._stagesRewarded[i] = true;
                if (stage.xpReward) {
                    GameState.gainXp(stage.xpReward);
                    Notifications.show(`Quest stage complete! +${stage.xpReward} XP`, 'gold');
                }
                if (stage.onComplete && typeof Narrative !== 'undefined') {
                    Narrative.addSeparator();
                    Narrative.addStory(stage.onComplete);
                }
                GameState.trackStat('questsCompleted');
                // Advance stage
                if (i + 1 < mainQuest.stages.length) {
                    mainProgress.stage = i + 1;
                }
            }
        }

        // Check side quests
        for (const [questId, quest] of Object.entries(QUESTS.side_quests)) {
            const progress = GameState.questProgress.side[questId];
            if (!progress || progress._rewarded) continue;

            const allComplete = quest.objectives.every(obj =>
                GameState.isObjectiveComplete('side', questId, obj.id)
            );
            if (allComplete) {
                progress._rewarded = true;
                if (quest.xpReward) {
                    GameState.gainXp(quest.xpReward);
                    Notifications.show(`${quest.name} complete! +${quest.xpReward} XP`, 'gold');
                }
                if (quest.itemReward) {
                    GameState.addToInventory(quest.itemReward);
                    const item = ITEMS[quest.itemReward];
                    if (item) Notifications.show(`Received: ${item.icon} ${item.name}`, 'gold');
                }
                if (quest.onComplete && typeof Narrative !== 'undefined') {
                    Narrative.addSeparator();
                    Narrative.addStory(quest.onComplete);
                }
                GameState.trackStat('questsCompleted');
            }
        }

        GameState.save();
    }
};
