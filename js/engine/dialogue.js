// ============================================
// DIALOGUE ENGINE
// ============================================

const Dialogue = {
    currentNpc: null,
    currentNpcKey: null,
    currentNode: null,
    _choiceHandlers: [],
    _typewriterTimer: null,
    _typewriterDone: false,
    _fullText: '',

    start(npcKey) {
        const npc = NPCS[npcKey];
        if (!npc) return;

        this.currentNpc = npc;
        this.currentNpcKey = npcKey;
        if (npc.dialogues && npc.dialogues.initial) {
            this.show(npc.dialogues.initial);
        } else {
            this.close();
        }
    },

    _renderPortrait(portrait) {
        if (!portrait || !this.currentNpc) return;

        // Try to render pixel art NPC sprite
        if (typeof Sprites !== 'undefined' && Sprites.drawNPC && this.currentNpcKey) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                const spriteCanvas = Sprites.drawNPC(this.currentNpcKey);
                if (spriteCanvas) {
                    ctx.drawImage(spriteCanvas, 0, 0, 64, 64);
                    portrait.textContent = '';
                    portrait.appendChild(canvas);
                    return;
                }
            } catch(e) { /* fallback to icon */ }
        }

        // Fallback to emoji icon
        portrait.textContent = this.currentNpc.icon;
    },

    _startTypewriter(textEl, text, onDone) {
        if (this._typewriterTimer) {
            clearInterval(this._typewriterTimer);
            this._typewriterTimer = null;
        }

        this._fullText = text;
        this._typewriterDone = false;
        let charIndex = 0;
        textEl.textContent = '';

        // Add cursor
        const cursor = document.createElement('span');
        cursor.className = 'dialogue-text-cursor';

        const speed = 18; // ms per char

        this._typewriterTimer = setInterval(() => {
            if (charIndex < text.length) {
                textEl.textContent = text.substring(0, charIndex + 1);
                textEl.appendChild(cursor);
                charIndex++;
            } else {
                clearInterval(this._typewriterTimer);
                this._typewriterTimer = null;
                this._typewriterDone = true;
                textEl.textContent = text;
                if (onDone) onDone();
            }
        }, speed);

        // Allow tap to skip typewriter
        const skipHandler = () => {
            if (!this._typewriterDone && this._typewriterTimer) {
                clearInterval(this._typewriterTimer);
                this._typewriterTimer = null;
                this._typewriterDone = true;
                textEl.textContent = text;
                if (onDone) onDone();
            }
            textEl.removeEventListener('click', skipHandler);
        };
        textEl.addEventListener('click', skipHandler);
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

        this._renderPortrait(portrait);

        if (speaker && this.currentNpc) {
            speaker.textContent = this.currentNpc.name;
            // Add title separator
            let titleSep = speaker.parentElement.querySelector('.dialogue-title-separator');
            if (!titleSep) {
                titleSep = document.createElement('p');
                titleSep.className = 'dialogue-title-separator';
                speaker.parentElement.insertBefore(titleSep, textEl);
            }
            titleSep.textContent = this.currentNpc.title;
        }

        // Use typewriter effect for dialogue text
        if (textEl) {
            this._startTypewriter(textEl, node.text);
        }

        const choicesDiv = document.getElementById('dialogue-choices');
        if (!choicesDiv) return;

        this._cleanupHandlers();
        choicesDiv.innerHTML = '';

        // If this is a shop node, show the shop UI
        if (node.isShop && node.shopType) {
            this.showShopItems(choicesDiv, node.shopType);
            return;
        }

        // Handle inn rest
        if (node.restAtInn) {
            if (GameState.player) {
                GameState.player.hp = GameState.player.maxHp;
                GameState.player.mp = GameState.player.maxMp;
                Narrative.addHeal('You rest at the inn. Fully restored!');
                HUD.update();
            }
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.textContent = '[Continue]';
            const handler = () => this.close();
            btn.addEventListener('click', handler);
            this._choiceHandlers.push({ el: btn, handler });
            choicesDiv.appendChild(btn);
            return;
        }

        if (node.choices && node.choices.length > 0) {
            node.choices.forEach((choice) => {
                const btn = document.createElement('button');
                btn.className = 'dialogue-choice';
                btn.textContent = choice.text;

                // Check if player can afford (for inn rest etc.)
                if (choice.cost && !choice.item && choice.next === 'rest') {
                    if (GameState.player.gold < choice.cost) {
                        btn.textContent += ' (Not enough gold)';
                        btn.disabled = true;
                        btn.style.opacity = '0.4';
                    }
                } else if (choice.cost && choice.item) {
                    if (GameState.player.gold < choice.cost) {
                        btn.textContent += ' (Not enough gold)';
                        btn.disabled = true;
                        btn.style.opacity = '0.4';
                    }
                }

                const handler = () => this.selectChoice(choice);
                btn.addEventListener('click', handler);
                this._choiceHandlers.push({ el: btn, handler });
                choicesDiv.appendChild(btn);
            });
        } else {
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.textContent = '[Continue]';
            const handler = () => this.close();
            btn.addEventListener('click', handler);
            this._choiceHandlers.push({ el: btn, handler });
            choicesDiv.appendChild(btn);
        }

        if (node.giveHint) {
            GameState.flags[`hint_${node.giveHint}`] = true;
        }
    },

    showShopItems(choicesDiv, shopType) {
        // Find the village location data for shop items
        const locKey = GameState.currentLocation;
        const loc = WORLD.locations[locKey];

        if (!loc || !loc.shops || !loc.shops[shopType]) {
            // Fallback: close dialogue
            const btn = document.createElement('button');
            btn.className = 'dialogue-choice';
            btn.textContent = '[Leave]';
            const handler = () => this.close();
            btn.addEventListener('click', handler);
            this._choiceHandlers.push({ el: btn, handler });
            choicesDiv.appendChild(btn);
            return;
        }

        const shop = loc.shops[shopType];

        shop.items.forEach(shopItem => {
            const item = ITEMS[shopItem.item];
            if (!item) return;

            const btn = document.createElement('button');
            btn.className = 'dialogue-choice shop-choice';

            const canAfford = GameState.player.gold >= shopItem.cost;
            btn.innerHTML = `<span class="shop-item-name">${item.icon} ${item.name}</span><span class="shop-item-cost">${shopItem.cost}g</span>`;

            if (!canAfford) {
                btn.disabled = true;
                btn.style.opacity = '0.4';
            }

            const handler = () => {
                if (GameState.player.gold >= shopItem.cost) {
                    GameState.player.gold -= shopItem.cost;
                    GameState.trackStat('goldSpent', shopItem.cost);
                    GameState.addToInventory(shopItem.item);
                    Notifications.show(`Purchased ${item.name}!`, 'gold');
                    HUD.update();
                    GameState.save();
                    // Refresh shop
                    this._cleanupHandlers();
                    choicesDiv.innerHTML = '';
                    this.showShopItems(choicesDiv, shopType);
                } else {
                    Notifications.show('Not enough gold!', 'red');
                }
            };

            btn.addEventListener('click', handler);
            this._choiceHandlers.push({ el: btn, handler });
            choicesDiv.appendChild(btn);
        });

        // Sell items button
        const sellBtn = document.createElement('button');
        sellBtn.className = 'dialogue-choice';
        sellBtn.textContent = '[Sell Items]';
        const sellHandler = () => this.showSellPanel(choicesDiv, shopType);
        sellBtn.addEventListener('click', sellHandler);
        this._choiceHandlers.push({ el: sellBtn, handler: sellHandler });
        choicesDiv.appendChild(sellBtn);

        // Leave button
        const leaveBtn = document.createElement('button');
        leaveBtn.className = 'dialogue-choice';
        leaveBtn.textContent = '[Leave]';
        const leaveHandler = () => this.close();
        leaveBtn.addEventListener('click', leaveHandler);
        this._choiceHandlers.push({ el: leaveBtn, handler: leaveHandler });
        choicesDiv.appendChild(leaveBtn);
    },

    showSellPanel(choicesDiv, shopType) {
        this._cleanupHandlers();
        choicesDiv.innerHTML = '';

        const sellableItems = GameState.player.inventory.filter(inv => {
            const item = ITEMS[inv.key];
            return item && item.value > 0 && item.type !== 'quest';
        });

        if (sellableItems.length === 0) {
            const p = document.createElement('p');
            p.style.color = 'var(--text-secondary)';
            p.style.padding = '0.5rem';
            p.textContent = 'Nothing to sell.';
            choicesDiv.appendChild(p);
        } else {
            sellableItems.forEach(inv => {
                const item = ITEMS[inv.key];
                if (!item) return;
                const sellPrice = Math.floor(item.value * 0.6);

                const btn = document.createElement('button');
                btn.className = 'dialogue-choice shop-choice';
                btn.innerHTML = `<span class="shop-item-name">${item.icon} ${item.name} x${inv.quantity}</span><span class="shop-item-cost sell">+${sellPrice}g</span>`;

                const handler = () => {
                    GameState.removeFromInventory(inv.key, 1);
                    GameState.player.gold += sellPrice;
                    Notifications.show(`Sold ${item.name} for ${sellPrice}g`, 'gold');
                    HUD.update();
                    GameState.save();
                    // Refresh sell panel
                    this.showSellPanel(choicesDiv, shopType);
                };

                btn.addEventListener('click', handler);
                this._choiceHandlers.push({ el: btn, handler });
                choicesDiv.appendChild(btn);
            });
        }

        // Back to shop
        const backBtn = document.createElement('button');
        backBtn.className = 'dialogue-choice';
        backBtn.textContent = '[Back to Shop]';
        const backHandler = () => {
            this._cleanupHandlers();
            choicesDiv.innerHTML = '';
            this.showShopItems(choicesDiv, shopType);
        };
        backBtn.addEventListener('click', backHandler);
        this._choiceHandlers.push({ el: backBtn, handler: backHandler });
        choicesDiv.appendChild(backBtn);
    },

    _cleanupHandlers() {
        this._choiceHandlers.forEach(({ el, handler }) => {
            el.removeEventListener('click', handler);
        });
        this._choiceHandlers = [];
    },

    selectChoice(choice) {
        // Handle inn cost
        if (choice.cost && choice.next === 'rest') {
            if (GameState.player.gold >= choice.cost) {
                GameState.player.gold -= choice.cost;
                GameState.trackStat('goldSpent', choice.cost);
                HUD.update();
            } else {
                Notifications.show('Not enough gold!', 'red');
                return;
            }
        }

        // Handle regular purchases
        if (choice.cost && choice.item) {
            if (GameState.player.gold >= choice.cost) {
                GameState.player.gold -= choice.cost;
                GameState.trackStat('goldSpent', choice.cost);
                GameState.addToInventory(choice.item);
                const item = ITEMS[choice.item];
                if (item) Notifications.show(`Purchased ${item.name}!`, 'gold');
                HUD.update();
            } else {
                Notifications.show('Not enough gold!', 'red');
                return;
            }
        }

        // Open shop if choice leads to shop
        if (choice.shopType && choice.next === 'shop' && this.currentNpc) {
            const shopNode = this.currentNpc.dialogues.shop;
            if (shopNode) {
                this.show(shopNode);
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
        if (this._typewriterTimer) {
            clearInterval(this._typewriterTimer);
            this._typewriterTimer = null;
        }
        this._typewriterDone = false;
        const overlay = document.getElementById('dialogue-overlay');
        if (overlay) overlay.classList.add('hidden');
        // Remove title separator
        const titleSep = document.querySelector('.dialogue-title-separator');
        if (titleSep) titleSep.remove();
        this.currentNpc = null;
        this.currentNpcKey = null;
        this.currentNode = null;
        GameState.save();
    }
};
