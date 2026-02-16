// ============================================
// DIALOGUE ENGINE
// ============================================

const Dialogue = {
    currentNpc: null,
    currentNode: null,

    start(npcKey) {
        const npc = NPCS[npcKey];
        if (!npc) return;

        this.currentNpc = npc;
        this.show(npc.dialogues.initial);
    },

    show(node) {
        if (!node) {
            this.close();
            return;
        }

        this.currentNode = node;
        const overlay = document.getElementById('dialogue-overlay');
        overlay.classList.remove('hidden');

        document.getElementById('dialogue-portrait').textContent = this.currentNpc.icon;
        document.getElementById('dialogue-speaker').textContent = `${this.currentNpc.name} — ${this.currentNpc.title}`;
        document.getElementById('dialogue-text').textContent = node.text;

        const choicesDiv = document.getElementById('dialogue-choices');
        choicesDiv.innerHTML = '';

        if (node.choices && node.choices.length > 0) {
            node.choices.forEach((choice, idx) => {
                const btn = document.createElement('button');
                btn.className = 'dialogue-choice';
                btn.textContent = choice.text;

                // Check if player can afford shop items
                if (choice.cost && GameState.player.gold < choice.cost) {
                    btn.textContent += ' (Not enough gold)';
                    btn.disabled = true;
                    btn.style.opacity = '0.4';
                }

                btn.onclick = () => this.selectChoice(choice);
                choicesDiv.appendChild(btn);
            });
        } else {
            // No choices — add a close button
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.textContent = '[Continue]';
            btn.onclick = () => this.close();
            choicesDiv.appendChild(btn);
        }

        // Give hint if applicable
        if (node.giveHint) {
            GameState.flags[`hint_${node.giveHint}`] = true;
        }
    },

    selectChoice(choice) {
        // Handle purchases
        if (choice.cost && choice.item) {
            if (GameState.player.gold >= choice.cost) {
                GameState.player.gold -= choice.cost;
                GameState.addToInventory(choice.item);
                const item = ITEMS[choice.item];
                Notifications.show(`Purchased ${item.name}!`, 'gold');
                HUD.update();
            } else {
                Notifications.show('Not enough gold!', 'red');
                return;
            }
        }

        // Navigate to next dialogue node
        if (choice.next) {
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
        const overlay = document.getElementById('dialogue-overlay');
        overlay.classList.add('hidden');
        this.currentNpc = null;
        this.currentNode = null;

        // Log that dialogue happened
        GameState.save();
    }
};
