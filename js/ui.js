// UI System
const UI = {
    activePanel: 'stats',
    chatMessages: [],
    maxChatMessages: 50,

    init() {
        this.setupPanelTabs();
        this.setupChatInput();
        this.updateSkills();
        this.updateInventory();
        this.updateQuests();
        this.updateLeaderboard();
        this.addChatMessage('Welcome to SolarWinds Quest!', 'system');
        this.addChatMessage('Click on the ground to move. Click NPCs to interact.', 'system');
        this.addChatMessage('Talk to SysAdmin Steve to begin your adventure!', 'quest');
    },

    setupPanelTabs() {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const panelName = tab.dataset.panel;
                document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
                document.getElementById(panelName + '-panel').style.display = 'block';
                this.activePanel = panelName;

                if (panelName === 'map') this.drawMinimap();
                if (panelName === 'leaderboard') this.updateLeaderboard();
            });
        });
    },

    setupChatInput() {
        const input = document.getElementById('chat-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                const msg = input.value.trim();
                this.addChatMessage(`${Player.name}: ${msg}`, 'player');

                // Easter eggs / commands
                if (msg.toLowerCase() === '::observability') {
                    Player.addXP('observability', 5);
                    this.addChatMessage('A surge of insight flows through you!', 'quest');
                } else if (msg.toLowerCase() === '::solarwinds') {
                    this.addChatMessage('Full-stack observability is the way!', 'system');
                    Player.addXP('monitoring', 5);
                }

                input.value = '';
            }
        });
    },

    addChatMessage(text, type = 'system') {
        this.chatMessages.push({ text, type });
        if (this.chatMessages.length > this.maxChatMessages) {
            this.chatMessages.shift();
        }

        const container = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = 'chat-msg ' + type;
        msg.textContent = text;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;

        // Trim DOM
        while (container.children.length > this.maxChatMessages) {
            container.removeChild(container.firstChild);
        }
    },

    updateSkills() {
        const list = document.getElementById('skills-list');
        list.innerHTML = '';

        for (const [name, skill] of Object.entries(Player.skills)) {
            const row = document.createElement('div');
            row.className = 'skill-row';

            const nextXP = Player.xpForLevel(skill.level + 1);
            const currentXP = Player.xpForLevel(skill.level);
            const progress = skill.level >= 99 ? 100 : Math.min(100,
                ((skill.xp - currentXP) / (nextXP - currentXP)) * 100
            );

            row.innerHTML = `
                <span class="skill-name">${name.charAt(0).toUpperCase() + name.slice(1)}</span>
                <span class="skill-level">${skill.level}</span>
            `;

            const bar = document.createElement('div');
            bar.className = 'skill-bar';
            bar.innerHTML = `<div class="skill-bar-fill" style="width:${progress}%"></div>`;

            const wrapper = document.createElement('div');
            wrapper.appendChild(row);
            wrapper.appendChild(bar);
            wrapper.title = `${skill.xp} / ${nextXP} XP`;
            list.appendChild(wrapper);
        }
    },

    updateInventory() {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';

        for (let i = 0; i < Player.maxInventory; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';

            if (i < Player.inventory.length) {
                const item = Player.inventory[i];
                const iconCanvas = Assets.sprites['item_' + item.id];
                if (iconCanvas) {
                    const img = document.createElement('img');
                    img.src = iconCanvas.toDataURL();
                    img.width = 28;
                    img.height = 28;
                    img.style.imageRendering = 'pixelated';
                    slot.appendChild(img);
                } else {
                    slot.textContent = item.name.charAt(0);
                    slot.style.color = '#ff0';
                    slot.style.fontSize = '14px';
                }
                const nameDiv = document.createElement('div');
                nameDiv.className = 'item-name';
                nameDiv.textContent = item.name;
                slot.appendChild(nameDiv);
                slot.title = item.name;

                // Click to use/examine
                slot.addEventListener('click', () => {
                    this.addChatMessage(`${item.name}`, 'system');
                });
            }

            grid.appendChild(slot);
        }
    },

    updateQuests() {
        const list = document.getElementById('quest-list');
        list.innerHTML = '';

        Quest.getQuestDisplay().forEach(q => {
            const entry = document.createElement('div');
            entry.className = `quest-entry quest-${q.status === 'complete' ? 'complete' : q.status === 'in_progress' ? 'in-progress' : 'not-started'}`;
            entry.innerHTML = `
                <div style="font-weight:bold;">${q.name} (${q.questPoints} QP)</div>
                <div style="font-size:9px;margin-top:2px;">${q.stageText}</div>
            `;
            list.appendChild(entry);
        });
    },

    updateLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';

        // Generate fake leaderboard with the player mixed in
        const fakeNames = [
            'NetWizard42', 'SysOp_Sara', 'PingMaster', 'FirewallFred',
            'PacketPrincess', 'SQLSam', 'CloudKing99', 'MonitorMaven',
            'LatencyLord', 'DebugDave', 'ObservOracle', 'TraceQueen',
        ];

        const entries = fakeNames.map(name => ({
            name,
            score: Math.floor(Math.random() * 500) + 100,
            isPlayer: false,
        }));

        // Add the actual player
        entries.push({
            name: Player.name,
            score: Player.totalXP + (Player.questPoints * 50),
            isPlayer: true,
        });

        // Sort by score descending
        entries.sort((a, b) => b.score - a.score);

        entries.slice(0, 15).forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'lb-entry' + (entry.isPlayer ? ' lb-self' : '');
            row.innerHTML = `
                <span class="lb-rank">${i + 1}.</span>
                <span class="lb-name">${entry.name}</span>
                <span class="lb-score">${entry.score}</span>
            `;
            list.appendChild(row);
        });
    },

    drawMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        const ctx = canvas.getContext('2d');
        const scale = canvas.width / World.MAP_W;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw tiles
        for (let y = 0; y < World.MAP_H; y++) {
            for (let x = 0; x < World.MAP_W; x++) {
                const tile = World.getTile(x, y);
                const colors = ['#2d5a1e', '#7a6030', '#c4a854', '#1a3a6a', '#666', '#8a7a5a', '#6a4a2a', '#cc3300', '#2a4a1a'];
                ctx.fillStyle = colors[tile] || '#000';
                ctx.fillRect(x * scale, y * scale, scale + 0.5, scale + 0.5);
            }
        }

        // Draw buildings
        World.objects.filter(o => o.isBuilding).forEach(b => {
            ctx.fillStyle = b.type === 'noc' ? '#ff6600' : '#aa9070';
            ctx.fillRect(b.x * scale, b.y * scale, (b.w || 3) * scale, (b.h || 3) * scale);
        });

        // Draw NPCs
        NPC.list.forEach(npc => {
            ctx.fillStyle = npc.hostile ? '#f00' : '#ff0';
            ctx.fillRect(npc.x * scale - 1, npc.y * scale - 1, 3, 3);
        });

        // Draw player
        ctx.fillStyle = '#fff';
        ctx.fillRect(Player.x * scale - 2, Player.y * scale - 2, 4, 4);
        ctx.strokeStyle = '#0f0';
        ctx.strokeRect(Player.x * scale - 2, Player.y * scale - 2, 4, 4);
    },

    showLevelUp(skillName, level) {
        const text = document.createElement('div');
        text.className = 'level-up-text';
        text.textContent = `${skillName} Level ${level}!`;
        text.style.left = '256px';
        text.style.top = '192px';
        document.getElementById('game-screen').appendChild(text);
        setTimeout(() => text.remove(), 1500);
    },

    // Update region display
    updateRegion() {
        const region = World.getRegionAt(Player.x, Player.y);
        document.getElementById('world-label').textContent = region;
    },
};
