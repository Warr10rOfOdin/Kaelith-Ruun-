// ============================================
// DIALOGUE ENGINE
// ============================================

const Dialogue = {
    currentNpc: null,
    currentNode: null,
    _choiceHandlers: [],

    start(npcKey) {
        const npc = NPCS[npcKey];
        if (!npc) return;

        this.currentNpc = npc;
        if (npc.dialogues && npc.dialogues.initial) {
            this.show(npc.dialogues.initial);
        } else {
            this.close();
        }
    },

    show(node) {
        if (!node) {
            this.close();
            return;
        }

        this.currentNode = node;
        const overlay = document.getElementById('dialogue-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');

        const portrait = document.getElementById('dialogue-portrait');
        const speaker = document.getElementById('dialogue-speaker');
        const textEl = document.getElementById('dialogue-text');

        if (portrait && this.currentNpc) portrait.textContent = this.currentNpc.icon;
        if (speaker && this.currentNpc) speaker.textContent = `${this.currentNpc.name} — ${this.currentNpc.title}`;
        if (textEl) textEl.textContent = node.text;

        const choicesDiv = document.getElementById('dialogue-choices');
        if (!choicesDiv) return;

        // Clean up old handlers
        this._cleanupHandlers();
        choicesDiv.innerHTML = '';

        if (node.choices && node.choices.length > 0) {
            node.choices.forEach((choice) => {
                const btn = document.createElement('button');
                btn.className = 'dialogue-choice';
                btn.textContent = choice.text;

                // Check if player can afford shop items
                if (choice.cost && GameState.player.gold < choice.cost) {
                    btn.textContent += ' (Not enough gold)';
                    btn.disabled = true;
                    btn.style.opacity = '0.4';
                }

                const handler = () => this.selectChoice(choice);
                btn.addEventListener('click', handler);
                this._choiceHandlers.push({ el: btn, handler });
                choicesDiv.appendChild(btn);
            });
        } else {
            // No choices — add a close button
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.textContent = '[Continue]';
            const handler = () => this.close();
            btn.addEventListener('click', handler);
            this._choiceHandlers.push({ el: btn, handler });
            choicesDiv.appendChild(btn);
        }

        // Give hint if applicable
        if (node.giveHint) {
            GameState.flags[`hint_${node.giveHint}`] = true;
        }
    },

    _cleanupHandlers() {
        this._choiceHandlers.forEach(({ el, handler }) => {
            el.removeEventListener('click', handler);
        });
        this._choiceHandlers = [];
    },

    selectChoice(choice) {
        // Handle purchases
        if (choice.cost && choice.item) {
            if (GameState.player.gold >= choice.cost) {
                GameState.player.gold -= choice.cost;
                GameState.addToInventory(choice.item);
                const item = ITEMS[choice.item];
                if (item) Notifications.show(`Purchased ${item.name}!`, 'gold');
                HUD.update();
            } else {
                Notifications.show('Not enough gold!', 'red');
                return;
            }
        }

        // Navigate to next dialogue node
        if (choice.next && this.currentNpc) {
            const nextNode = this.currentNpc.dialogues[choice.next];
            if (nextNode) {
                this.show(nextNode);
            } else {
                this.close();
            }
        } else {
            this.close();
        }
    },

    close() {
        this._cleanupHandlers();

        const overlay = document.getElementById('dialogue-overlay');
        if (overlay) overlay.classList.add('hidden');

        this.currentNpc = null;
        this.currentNode = null;

        GameState.save();
    }
};
