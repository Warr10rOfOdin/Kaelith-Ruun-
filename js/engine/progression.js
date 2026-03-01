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

        let html = '<h3>Journal</h3>';

        // Main quest
        html += '<div class="journal-entry active">';
        html += `<h4>${quest.name}</h4>`;
        html += `<p>${quest.description}</p>`;
        html += '</div>';

        // Current stage
        if (quest.stages[currentStage]) {
            const stage = quest.stages[currentStage];
            html += '<div class="journal-entry active" style="margin-top:0.5rem">';
            html += `<h4>${stage.name}</h4>`;
            html += `<p style="margin-bottom:0.5rem">${stage.description}</p>`;

            stage.objectives.forEach(obj => {
                const complete = GameState.isObjectiveComplete('main', null, obj.id);
                html += `<div style="padding:0.2rem 0;color:${complete ? 'var(--accent-green-bright)' : 'var(--text-secondary)'}">`;
                html += `${complete ? '✓' : '○'} ${obj.text}`;
                html += '</div>';
            });

            html += '</div>';
        }

        // Side quests
        html += '<p style="color:var(--text-dim);margin-top:1.5rem;margin-bottom:0.5rem;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em">Side Quests</p>';

        for (const [questId, quest] of Object.entries(QUESTS.side_quests)) {
            const hasProgress = GameState.questProgress.side[questId];
            if (hasProgress || questId === 'codex_collector') {
                html += '<div class="journal-entry">';
                html += `<h4>${quest.name}</h4>`;
                html += `<p>${quest.description}</p>`;
                quest.objectives.forEach(obj => {
                    const complete = GameState.isObjectiveComplete('side', questId, obj.id);
                    html += `<div style="padding:0.2rem 0;color:${complete ? 'var(--accent-green-bright)' : 'var(--text-secondary)'}">`;
                    html += `${complete ? '✓' : '○'} ${obj.text}`;
                    html += '</div>';
                });
                html += '</div>';
            }
        }

        panel.innerHTML = html;
    },

    renderCharacterSheet() {
        const panel = document.getElementById('side-panel-content');
        const p = GameState.player;
        const race = RACES[p.race];
        const cls = CLASSES[p.class];

        let html = '<div class="char-sheet">';
        html += `<h3>${p.name}</h3>`;
        html += `<p style="color:var(--text-secondary);margin-bottom:1rem">${race.name} ${cls.name} — Level ${p.level}</p>`;

        // Vitals
        html += '<div class="stat-group"><h4>Vitals</h4>';
        html += `<div class="stat-row"><span class="stat-name">HP</span><span class="stat-value">${p.hp} / ${p.maxHp}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">MP</span><span class="stat-value">${p.mp} / ${p.maxMp}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">XP</span><span class="stat-value">${p.xp} / ${p.xpToNext}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">Gold</span><span class="stat-value">${p.gold}</span></div>`;
        html += '</div>';

        // Base stats
        html += '<div class="stat-group"><h4>Attributes</h4>';
        const statNames = { str: 'Strength', dex: 'Dexterity', int: 'Intelligence', wis: 'Wisdom', con: 'Constitution', cha: 'Charisma' };
        for (const [key, name] of Object.entries(statNames)) {
            html += `<div class="stat-row"><span class="stat-name">${name}</span><span class="stat-value">${p.stats[key]}</span></div>`;
        }
        html += '</div>';

        // Combat stats
        html += '<div class="stat-group"><h4>Combat</h4>';
        html += `<div class="stat-row"><span class="stat-name">Attack</span><span class="stat-value">${p.attack}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">Defense</span><span class="stat-value">${p.defense}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">Magic ATK</span><span class="stat-value">${p.magicAttack}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">Magic DEF</span><span class="stat-value">${p.magicDefense}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">Speed</span><span class="stat-value">${p.speed}</span></div>`;
        html += `<div class="stat-row"><span class="stat-name">Crit Chance</span><span class="stat-value">${p.critChance}%</span></div>`;
        html += '</div>';

        // Abilities
        html += '<div class="stat-group"><h4>Abilities</h4>';
        p.abilities.forEach(a => {
            html += `<div style="padding:0.3rem 0;border-bottom:1px solid var(--bg-light)">`;
            html += `<div style="color:var(--accent-gold);font-size:0.9rem">${a.name} <span style="color:var(--text-dim)">(${a.mpCost} MP)</span></div>`;
            html += `<div style="color:var(--text-secondary);font-size:0.8rem">${a.desc}</div>`;
            html += '</div>';
        });
        html += '</div>';

        // Racial abilities
        html += '<div class="stat-group"><h4>Racial Traits</h4>';
        race.abilities.forEach(a => {
            html += `<div style="padding:0.2rem 0;color:var(--text-secondary);font-size:0.85rem">${a}</div>`;
        });
        html += '</div>';

        // Skill Tree
        if (cls.skillTree && cls.skillTree.length > 0) {
            html += '<div class="stat-group"><h4>Skill Tree</h4>';
            const choices = p.skillChoices || {};
            for (const tier of cls.skillTree) {
                const unlocked = p.level >= tier.level;
                const chosen = choices[tier.level] !== undefined;
                const chosenIdx = choices[tier.level];

                html += `<div style="padding:0.4rem 0;border-bottom:1px solid var(--bg-light);opacity:${unlocked ? '1' : '0.4'}">`;
                html += `<div style="font-family:var(--font-heading);font-size:0.75rem;color:var(--text-dim);letter-spacing:0.08em;margin-bottom:0.2rem">Level ${tier.level}</div>`;

                if (chosen) {
                    const ability = tier.choices[chosenIdx];
                    html += `<div style="color:var(--accent-gold);font-size:0.9rem">${ability.name} <span style="color:var(--accent-green-bright)">✓</span></div>`;
                    html += `<div style="color:var(--text-secondary);font-size:0.8rem">${ability.desc}</div>`;
                } else if (unlocked) {
                    html += `<div style="color:var(--accent-gold);font-size:0.85rem">⚡ Choice available!</div>`;
                    tier.choices.forEach((ability, idx) => {
                        html += `<button onclick="GameState.selectSkillChoice(${tier.level},${idx});Progression.renderCharacterSheet()" style="display:block;width:100%;text-align:left;padding:0.4rem 0.6rem;margin:0.3rem 0;background:var(--bg-light);border:1px solid var(--border-color);border-radius:4px;color:var(--text-primary);cursor:pointer;font-family:inherit;font-size:inherit">`;
                        html += `<div style="color:var(--accent-gold);font-size:0.85rem">${ability.name} <span style="color:var(--accent-blue-bright);font-size:0.7rem">${ability.mpCost}MP${ability.damage && ability.damage[1] > 0 ? ' · ' + ability.damage[0] + '-' + ability.damage[1] : ''}</span></div>`;
                        html += `<div style="color:var(--text-secondary);font-size:0.78rem">${ability.desc}</div>`;
                        html += '</button>';
                    });
                } else {
                    html += `<div style="color:var(--text-dim);font-size:0.8rem;font-style:italic">Locked — reach level ${tier.level}</div>`;
                }
                html += '</div>';
            }
            html += '</div>';
        }

        html += '</div>';

        panel.innerHTML = html;
    }
};
