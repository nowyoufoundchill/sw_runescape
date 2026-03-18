// NPC System
const NPC = {
    list: [],
    activeDialogue: null,

    init() {
        this.list = [];

        // === LUMINARA (Starting Town) NPCs ===

        this.add({
            id: 'guide',
            name: 'SysAdmin Steve',
            x: 34, y: 32,
            type: 'human',
            color: '#2244cc',       // spec: shirt blue
            legsColor: '#222244',   // spec: dark navy legs
            hat: '#2244cc',
            dialogue: 'guide_intro',
            region: 'Luminara',
            wander: false,
        });

        this.add({
            id: 'shopkeeper',
            name: 'Vendor Victoria',
            x: 28, y: 28,
            type: 'human',
            color: '#996633',
            hat: '#663300',
            dialogue: 'shop_intro',
            region: 'Luminara',
            wander: false,
        });

        this.add({
            id: 'banker',
            name: 'Banker Bob',
            x: 38, y: 28,
            type: 'human',
            color: '#ccaa22',       // spec: gold shirt
            legsColor: '#443300',   // spec: dark brown legs
            dialogue: 'bank_intro',
            region: 'Luminara',
            wander: false,
        });

        this.add({
            id: 'chef',
            name: 'Chef Charlie',
            x: 38, y: 38,
            type: 'human',
            color: '#ffffff',       // spec: white shirt
            legsColor: '#888888',   // spec: grey legs
            hat: '#ffffff',
            dialogue: 'chef_intro',
            region: 'Luminara',
            wander: false,
        });

        // === NOC HEADQUARTERS NPCs ===

        this.add({
            id: 'noc_commander',
            name: 'Commander Chen',
            x: 33, y: 16,
            type: 'human',
            color: '#ff6600',
            hat: '#ff6600',
            dialogue: 'noc_intro',
            region: 'NOC HQ',
            wander: false,
        });

        this.add({
            id: 'noc_analyst',
            name: 'Analyst Ada',
            x: 35, y: 17,
            type: 'human',
            color: '#cc5500',
            dialogue: 'analyst_intro',
            region: 'NOC HQ',
            wander: false,
        });

        // === DARKWOOD FOREST NPCs ===

        this.add({
            id: 'woodcutter',
            name: 'Logger Larry',
            x: 15, y: 26,
            type: 'human',
            color: '#006600',
            dialogue: 'woodcutter_intro',
            region: 'Darkwood Forest',
            wander: true,
            wanderRadius: 3,
        });

        this.add({
            id: 'forest_hermit',
            name: 'The Packet Wizard',
            x: 10, y: 28,
            type: 'human',
            color: '#9933cc',
            hat: '#6600aa',
            dialogue: 'hermit_intro',
            region: 'Darkwood Forest',
            wander: false,
        });

        // Goblin enemies in forest
        this.add({
            id: 'goblin1',
            name: 'Malware Goblin',
            x: 18, y: 24,
            type: 'goblin',
            npcType: 'goblin',
            dialogue: 'goblin_encounter',
            region: 'Darkwood Forest',
            wander: true,
            wanderRadius: 4,
            hostile: true,
        });

        this.add({
            id: 'goblin2',
            name: 'Phishing Goblin',
            x: 14, y: 30,
            type: 'goblin',
            npcType: 'goblin',
            dialogue: 'goblin_encounter',
            region: 'Darkwood Forest',
            wander: true,
            wanderRadius: 3,
            hostile: true,
        });

        // === PACKET DESERT NPCs ===

        this.add({
            id: 'desert_trader',
            name: 'Nomad Nadia',
            x: 48, y: 14,
            type: 'human',
            color: '#cc9933',
            dialogue: 'desert_trader_intro',
            region: 'Packet Desert',
            wander: false,
        });

        // === FIREWALL MOUNTAINS NPCs ===

        this.add({
            id: 'mountain_guard',
            name: 'Firewall Guardian',
            x: 44, y: 44,
            type: 'guard',
            npcType: 'guard',
            dialogue: 'guardian_intro',
            region: 'Firewall Mountains',
            wander: false,
        });

        this.add({
            id: 'dwarf_miner',
            name: 'Miner Mike',
            x: 46, y: 43,
            type: 'human',
            color: '#884400',
            dialogue: 'miner_intro',
            region: 'Firewall Mountains',
            wander: true,
            wanderRadius: 2,
        });

        // === LATENCY SWAMP NPCs ===

        this.add({
            id: 'swamp_witch',
            name: 'The Latency Oracle',
            x: 14, y: 48,
            type: 'human',
            color: '#003300',
            hat: '#001a00',
            dialogue: 'oracle_intro',
            region: 'Latency Swamp',
            wander: false,
        });

        // Sprites already generated in add() per Phase 1 spec
    },

    add(config) {
        const npc = {
            ...config,
            homeX: config.x,
            homeY: config.y,
            wanderTimer: 0,
            wanderDelay: 2000 + Math.random() * 3000,
            dir: 'south',
            talkCooldown: 0,
        };
        // Generate sprite with spec colors (Phase 1)
        npc.sprite = Assets.generateCharacterSprite({
            color:      config.color || '#888888',
            legsColor:  config.legsColor || null,
            hat:        config.hat || null,
            npcType:    config.type || 'human',
            isNPC:      true,
            walkFrame:  0,
        });
        npc.spriteWalk = Assets.generateCharacterSprite({
            color:      config.color || '#888888',
            legsColor:  config.legsColor || null,
            hat:        config.hat || null,
            npcType:    config.type || 'human',
            isNPC:      true,
            walkFrame:  1,
        });
        this.list.push(npc);
    },

    update(dt) {
        this.list.forEach(npc => {
            // Wander AI
            if (npc.wander) {
                npc.wanderTimer += dt;
                if (npc.wanderTimer >= npc.wanderDelay) {
                    npc.wanderTimer = 0;
                    npc.wanderDelay = 2000 + Math.random() * 3000;

                    const r = npc.wanderRadius || 3;
                    const nx = npc.homeX + Math.floor(Math.random() * (r * 2 + 1)) - r;
                    const ny = npc.homeY + Math.floor(Math.random() * (r * 2 + 1)) - r;

                    if (World.isWalkable(nx, ny)) {
                        // Update direction
                        if (nx > npc.x) npc.dir = 'east';
                        else if (nx < npc.x) npc.dir = 'west';
                        else if (ny > npc.y) npc.dir = 'south';
                        else npc.dir = 'north';

                        npc.x = nx;
                        npc.y = ny;
                    }
                }
            }

            if (npc.talkCooldown > 0) {
                npc.talkCooldown -= dt;
            }
        });
    },

    getNPCAt(x, y) {
        return this.list.find(npc =>
            Math.abs(npc.x - x) <= 1 && Math.abs(npc.y - y) <= 1
        );
    },

    interact(npc) {
        if (npc.talkCooldown > 0) return;
        npc.talkCooldown = 1000;

        // Face the player
        if (Player.x > npc.x) npc.dir = 'east';
        else if (Player.x < npc.x) npc.dir = 'west';
        else if (Player.y > npc.y) npc.dir = 'south';
        else npc.dir = 'north';

        this.startDialogue(npc);
    },

    checkProximity(px, py) {
        this.list.forEach(npc => {
            if (npc.hostile && Math.abs(npc.x - px) <= 1 && Math.abs(npc.y - py) <= 1) {
                if (npc.talkCooldown <= 0) {
                    this.startCombatEncounter(npc);
                }
            }
        });
    },

    startCombatEncounter(npc) {
        npc.talkCooldown = 5000;
        // Simple auto-combat
        UI.addChatMessage(`${npc.name} attacks you!`, 'error');

        setTimeout(() => {
            const playerWins = Math.random() < 0.7 + (Player.skills.security.level * 0.02);
            if (playerWins) {
                UI.addChatMessage(`You defeated the ${npc.name}!`, 'quest');
                Player.addXP('security', 15 + Math.floor(Math.random() * 10));

                // Chance to drop items
                if (Math.random() < 0.4) {
                    Player.addItem('coins', 'Coins (5gp)');
                    UI.addChatMessage('The goblin dropped some coins.', 'system');
                }
            } else {
                UI.addChatMessage(`The ${npc.name} hit you! You retreat.`, 'error');
                // Push player back
                const dx = Player.x - npc.x;
                const dy = Player.y - npc.y;
                const pushX = Player.x + Math.sign(dx);
                const pushY = Player.y + Math.sign(dy);
                if (World.isWalkable(pushX, pushY)) {
                    Player.x = pushX;
                    Player.y = pushY;
                }
            }
        }, 800);
    },

    startDialogue(npc) {
        const dialogueTree = Dialogues[npc.dialogue];
        if (!dialogueTree) {
            UI.addChatMessage(`${npc.name}: Hello, adventurer.`, 'npc');
            return;
        }

        this.activeDialogue = { npc, tree: dialogueTree };
        this.showDialogueNode('start');
    },

    showDialogueNode(nodeId) {
        if (!this.activeDialogue) return;
        const node = this.activeDialogue.tree[nodeId];
        if (!node) {
            this.closeDialogue();
            return;
        }

        const overlay = document.getElementById('dialogue-overlay');
        const speaker = document.getElementById('dialogue-speaker');
        const text = document.getElementById('dialogue-text');
        const options = document.getElementById('dialogue-options');

        overlay.style.display = 'flex';
        speaker.textContent = this.activeDialogue.npc.name;

        // Process text with variable substitution
        let displayText = node.text.replace('{player}', Player.name);
        text.textContent = displayText;

        options.innerHTML = '';

        if (node.options) {
            node.options.forEach(opt => {
                // Check conditions
                if (opt.condition && !opt.condition()) return;

                const btn = document.createElement('button');
                btn.className = 'dialogue-option';
                btn.textContent = opt.label;
                btn.onclick = () => {
                    if (opt.action) opt.action();
                    if (opt.next) {
                        this.showDialogueNode(opt.next);
                    } else {
                        this.closeDialogue();
                    }
                };
                options.appendChild(btn);
            });
        } else {
            // Auto-close after reading
            const btn = document.createElement('button');
            btn.className = 'dialogue-option';
            btn.textContent = 'Continue';
            btn.onclick = () => {
                if (node.action) node.action();
                if (node.next) {
                    this.showDialogueNode(node.next);
                } else {
                    this.closeDialogue();
                }
            };
            options.appendChild(btn);
        }
    },

    closeDialogue() {
        this.activeDialogue = null;
        document.getElementById('dialogue-overlay').style.display = 'none';
    },
};

// Dialogue trees
const Dialogues = {
    // === SysAdmin Steve (Guide) ===
    guide_intro: {
        start: {
            text: "Welcome to Luminara, {player}! I'm SysAdmin Steve. Our network has been under siege by rogue processes and malware goblins. The NOC needs your help!",
            options: [
                {
                    label: "What's going on?",
                    next: 'explain',
                },
                {
                    label: "How can I help?",
                    next: 'help',
                },
                {
                    label: "What is this place?",
                    next: 'about',
                },
            ],
        },
        explain: {
            text: "Our network infrastructure is failing! The Observability Gem has been shattered into fragments scattered across the land. Without it, we can't monitor our systems. Commander Chen at the NOC HQ to the north can tell you more.",
            options: [
                {
                    label: "I'll head to the NOC!",
                    action: () => {
                        Quest.startQuest('main_quest');
                        Player.addXP('networking', 10);
                    },
                },
                {
                    label: "What skills do I need?",
                    next: 'skills',
                },
            ],
        },
        help: {
            text: "Head north to the NOC Headquarters and speak with Commander Chen. She'll brief you on the mission. But first, gear up! The Vendor to the west sells supplies, and watch out for Malware Goblins in the forest!",
            action: () => {
                Quest.startQuest('main_quest');
                Player.addXP('networking', 10);
            },
        },
        about: {
            text: "Luminara is the last bastion of network stability. To the west lies Darkwood Forest, infested with malware. The Packet Desert is to the northeast. South is Latency Swamp, and the Firewall Mountains are to the southeast. Each region holds a fragment of the Observability Gem.",
            next: 'start',
        },
        skills: {
            text: "You'll need Networking to traverse the land, Security to fight malware, Monitoring to track anomalies, and Observability to piece the gem back together. Every action earns XP. Keep training!",
        },
    },

    // === Vendor Victoria ===
    shop_intro: {
        start: {
            text: "Welcome to my shop! I've got everything an IT adventurer needs.",
            options: [
                {
                    label: "Buy Net Monitor (free sample!)",
                    condition: () => !Player.hasItem('net_monitor'),
                    action: () => {
                        Player.addItem('net_monitor', 'Network Monitor');
                        UI.addChatMessage('You received a Network Monitor!', 'quest');
                        Player.addXP('monitoring', 15);
                    },
                },
                {
                    label: "Buy Bread (2gp)",
                    action: () => {
                        Player.addItem('bread', 'Bread');
                        UI.addChatMessage('You bought some bread.', 'system');
                    },
                },
                {
                    label: "Goodbye",
                },
            ],
        },
    },

    // === Banker Bob ===
    bank_intro: {
        start: {
            text: "Welcome to the Bank of Luminara. Your data is safe with us... unlike certain other services!",
            options: [
                {
                    label: "Any tips for my journey?",
                    next: 'tips',
                },
                {
                    label: "Goodbye",
                },
            ],
        },
        tips: {
            text: "Watch your latency in the swamp - things slow down there. The desert drains your packets. And whatever you do, don't cross the Firewall without proper credentials!",
        },
    },

    // === Chef Charlie ===
    chef_intro: {
        start: {
            text: "Ah, a hungry adventurer! My kitchen is almost as hot as a server room during peak load!",
            options: [
                {
                    label: "Can I have some food?",
                    action: () => {
                        Player.addItem('cooked_meat', 'Cooked Meat');
                        UI.addChatMessage('Chef Charlie gives you some cooked meat.', 'quest');
                        Player.addXP('debugging', 5);
                    },
                },
                {
                    label: "Goodbye",
                },
            ],
        },
    },

    // === Commander Chen (NOC) ===
    noc_intro: {
        start: {
            text: "Agent {player}, glad you made it. The situation is critical. Our Observability Gem has been shattered by the DDoS Dragon. We need all four fragments to restore full visibility.",
            options: [
                {
                    label: "Where are the fragments?",
                    next: 'fragments',
                },
                {
                    label: "What's the Observability Gem?",
                    next: 'gem_info',
                },
                {
                    label: "I'm ready for orders!",
                    next: 'mission',
                    condition: () => Quest.getState('main_quest') === 'started',
                },
            ],
        },
        fragments: {
            text: "Fragment 1: Darkwood Forest - guarded by malware goblins, seek the Packet Wizard. Fragment 2: Packet Desert - Nomad Nadia knows its location. Fragment 3: Firewall Mountains - past the Guardian. Fragment 4: Latency Swamp - the Oracle guards it.",
            next: 'mission',
        },
        gem_info: {
            text: "The Observability Gem gives us full-stack visibility into every system, every network flow, every anomaly. It's the heart of SolarWinds monitoring. Without it, we're flying blind. Alerts are going off everywhere!",
            next: 'start',
        },
        mission: {
            text: "Your mission: recover all four gem fragments and bring them back here. Each guardian will test your skills. You'll need Networking, Security, Monitoring, and Observability at level 3+ for each challenge. Good luck, agent!",
            action: () => {
                Quest.advanceQuest('main_quest', 'briefed');
                Player.addXP('networking', 20);
                Player.addXP('monitoring', 20);
                UI.addChatMessage('Quest updated: The Shattered Gem', 'quest');
            },
        },
    },

    // === Analyst Ada ===
    analyst_intro: {
        start: {
            text: "I'm tracking anomalies across all sectors. Each time you defeat malware or complete a task, our alert noise ratio improves. Keep it up!",
            options: [
                {
                    label: "Show me the dashboard",
                    action: () => {
                        Player.addXP('observability', 10);
                        UI.addChatMessage('Ada shows you the NOC dashboard. You learn about observability!', 'system');
                    },
                },
                {
                    label: "Goodbye",
                },
            ],
        },
    },

    // === Logger Larry ===
    woodcutter_intro: {
        start: {
            text: "Careful in these woods, friend. The malware goblins have been multiplying. I've been chopping logs to build firewall barriers.",
            options: [
                {
                    label: "Can I help chop logs?",
                    action: () => {
                        Player.addItem('logs', 'Logs');
                        Player.addXP('automation', 15);
                        UI.addChatMessage('You chopped some logs! Automation XP gained.', 'quest');
                    },
                },
                {
                    label: "Seen anything strange?",
                    next: 'strange',
                },
            ],
        },
        strange: {
            text: "The Packet Wizard deeper in the forest... he knows things. Strange old man, talks about network protocols like they're magic spells. But he knows where the first gem fragment is hidden.",
        },
    },

    // === The Packet Wizard ===
    hermit_intro: {
        start: {
            text: "Ah, I sense strong TCP/IP energy in you, {player}. You seek the first fragment of the Observability Gem, yes? The forest itself guards it.",
            options: [
                {
                    label: "How do I find it?",
                    next: 'find_fragment',
                },
                {
                    label: "Teach me about packets",
                    next: 'teach',
                },
            ],
        },
        find_fragment: {
            text: "The fragment is sealed by malware. Defeat 3 goblins in this forest to purge the corruption, then return to me. Your Security skill must be at least level 3.",
            options: [
                {
                    label: "I've cleared the malware!",
                    condition: () => Player.skills.security.level >= 3,
                    next: 'give_fragment1',
                },
                {
                    label: "I'll come back stronger.",
                },
            ],
        },
        give_fragment1: {
            text: "The forest breathes easier now! Here is the first fragment - the Packet Rune. It represents network visibility. Take it to Commander Chen.",
            action: () => {
                Player.addItem('packet_rune', 'Packet Rune (Fragment 1)');
                Quest.advanceQuest('main_quest', 'fragment1');
                Player.addXP('networking', 30);
                Player.addXP('security', 20);
                UI.addChatMessage('You received the Packet Rune!', 'quest');
            },
        },
        teach: {
            text: "Every message across the network is a packet - a tiny scroll of data. Headers tell it where to go, payload carries the message. Understanding this is the foundation of all network magic!",
            action: () => {
                Player.addXP('networking', 15);
            },
        },
    },

    // === Goblin Encounter ===
    goblin_encounter: {
        start: {
            text: "Grraagh! *unintelligible malware noises*",
            options: [
                {
                    label: "Fight!",
                    action: () => {
                        const npc = NPC.activeDialogue?.npc;
                        if (npc) NPC.startCombatEncounter(npc);
                    },
                },
                {
                    label: "Run away!",
                },
            ],
        },
    },

    // === Nomad Nadia (Desert) ===
    desert_trader_intro: {
        start: {
            text: "Greetings, traveler. The desert holds many secrets, and I know them all. You look like someone on a quest.",
            options: [
                {
                    label: "I seek a gem fragment",
                    next: 'desert_fragment',
                },
                {
                    label: "What do you sell?",
                    action: () => {
                        Player.addItem('bread', 'Bread');
                        UI.addChatMessage('Nadia gives you desert bread.', 'system');
                    },
                },
            ],
        },
        desert_fragment: {
            text: "The Server Crystal lies buried in the sand. To find it, you need a Network Monitor - it reveals hidden signals in the noise. Your Monitoring skill must be at level 3.",
            options: [
                {
                    label: "I have a monitor and the skill!",
                    condition: () => Player.hasItem('net_monitor') && Player.skills.monitoring.level >= 3,
                    next: 'give_fragment2',
                },
                {
                    label: "I need to prepare more.",
                },
            ],
        },
        give_fragment2: {
            text: "Excellent! *Nadia uses your monitor to scan the dunes* There! The Server Crystal - fragment of pure infrastructure visibility!",
            action: () => {
                Player.addItem('server_crystal', 'Server Crystal (Fragment 2)');
                Quest.advanceQuest('main_quest', 'fragment2');
                Player.addXP('monitoring', 30);
                Player.addXP('observability', 20);
                UI.addChatMessage('You received the Server Crystal!', 'quest');
            },
        },
    },

    // === Firewall Guardian ===
    guardian_intro: {
        start: {
            text: "Halt! None may pass the Firewall without proper authorization. State your business.",
            options: [
                {
                    label: "I seek the gem fragment",
                    next: 'guardian_challenge',
                },
                {
                    label: "I have authorization!",
                    condition: () => Quest.getState('main_quest') === 'fragment2' || Quest.getState('main_quest') === 'fragment1',
                    next: 'guardian_challenge',
                },
            ],
        },
        guardian_challenge: {
            text: "The Firewall Shield fragment tests your Security knowledge. You must prove your skills are worthy. Security level 3 is required to pass the authentication challenge.",
            options: [
                {
                    label: "I'm ready for the challenge!",
                    condition: () => Player.skills.security.level >= 3,
                    next: 'give_fragment3',
                },
                {
                    label: "I need more training.",
                },
            ],
        },
        give_fragment3: {
            text: "Your security knowledge is proven! The Firewall Shield is yours. It represents defensive visibility - knowing what to block and what to allow.",
            action: () => {
                Player.addItem('firewall_shield', 'Firewall Shield (Fragment 3)');
                Quest.advanceQuest('main_quest', 'fragment3');
                Player.addXP('security', 30);
                Player.addXP('networking', 20);
                UI.addChatMessage('You received the Firewall Shield!', 'quest');
            },
        },
    },

    // === The Latency Oracle ===
    oracle_intro: {
        start: {
            text: "I foresaw your arrival... about 300ms ago. Latency plagues this swamp, but also grants wisdom. You seek the final fragment.",
            options: [
                {
                    label: "Give me the fragment",
                    next: 'oracle_test',
                },
                {
                    label: "Tell me about latency",
                    next: 'latency_lesson',
                },
            ],
        },
        oracle_test: {
            text: "The Observability Gem fragment responds only to those who truly understand full-stack observability. Your Observability skill must reach level 3. Do you have what it takes?",
            options: [
                {
                    label: "I understand observability!",
                    condition: () => Player.skills.observability.level >= 3,
                    next: 'give_fragment4',
                },
                {
                    label: "I need more wisdom.",
                },
            ],
        },
        give_fragment4: {
            text: "You grasp the three pillars: metrics, traces, and logs! The Observability Gem fragment is yours. Return all four to Commander Chen to restore full visibility!",
            action: () => {
                Player.addItem('observability_gem', 'Observability Gem (Fragment 4)');
                Quest.advanceQuest('main_quest', 'fragment4');
                Player.addXP('observability', 40);
                UI.addChatMessage('You received the Observability Gem fragment!', 'quest');
            },
        },
        latency_lesson: {
            text: "Latency is the hidden enemy. A millisecond here, a millisecond there... soon your users suffer. Observability means seeing the full picture - metrics tell you WHAT, logs tell you WHY, traces tell you WHERE.",
            action: () => {
                Player.addXP('observability', 15);
            },
        },
    },

    // === Miner Mike ===
    miner_intro: {
        start: {
            text: "Mining these mountains for rare data-ores! Each ore can be smelted into monitoring components. Want to try?",
            options: [
                {
                    label: "Let me mine!",
                    action: () => {
                        Player.addXP('database', 15);
                        Player.addXP('automation', 10);
                        UI.addChatMessage('You mine some data-ore! Database and Automation XP gained.', 'quest');
                    },
                },
                {
                    label: "Tell me about these mountains",
                    next: 'mountain_info',
                },
            ],
        },
        mountain_info: {
            text: "The Firewall Mountains are the backbone of our network defense. The lava represents overloaded circuits - stay away from those! The Guardian up ahead protects the Firewall Shield fragment.",
        },
    },
};
