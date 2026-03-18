// Quest System
const Quest = {
    quests: {},

    init() {
        this.quests = {
            main_quest: {
                name: "The Shattered Gem",
                description: "The Observability Gem has been shattered by the DDoS Dragon. Recover all four fragments to restore full-stack visibility.",
                state: 'not_started',
                stages: {
                    not_started: "Talk to SysAdmin Steve in Luminara to begin.",
                    started: "Head to the NOC HQ north of Luminara and speak with Commander Chen.",
                    briefed: "Recover the four gem fragments from across the land.",
                    fragment1: "Packet Rune recovered! Find the remaining 3 fragments.",
                    fragment2: "Server Crystal found! 2 fragments remaining.",
                    fragment3: "Firewall Shield obtained! 1 fragment left - seek the Latency Oracle.",
                    fragment4: "All fragments collected! Return to Commander Chen at NOC HQ.",
                    complete: "Quest complete! Full observability restored.",
                },
                rewards: {
                    xp: { observability: 100, networking: 50, security: 50, monitoring: 50 },
                    items: ['orion_amulet'],
                    questPoints: 5,
                },
            },
            side_logging: {
                name: "Log Collection",
                description: "Collect logs from Darkwood Forest to build firewall defenses.",
                state: 'not_started',
                stages: {
                    not_started: "Talk to Logger Larry in Darkwood Forest.",
                    started: "Collect 3 logs from the forest.",
                    complete: "Logs delivered to Larry.",
                },
                rewards: {
                    xp: { automation: 40, debugging: 20 },
                    items: [],
                    questPoints: 1,
                },
            },
            side_mining: {
                name: "Data Mining",
                description: "Mine data-ores in the Firewall Mountains.",
                state: 'not_started',
                stages: {
                    not_started: "Talk to Miner Mike in Firewall Mountains.",
                    started: "Mine 3 data-ores.",
                    complete: "Ores delivered.",
                },
                rewards: {
                    xp: { database: 40, cloudcraft: 20 },
                    items: [],
                    questPoints: 1,
                },
            },
        };
    },

    getState(questId) {
        return this.quests[questId]?.state || 'not_started';
    },

    startQuest(questId) {
        const quest = this.quests[questId];
        if (!quest || quest.state !== 'not_started') return;
        quest.state = 'started';
        UI.addChatMessage(`Quest started: ${quest.name}`, 'quest');
        UI.updateQuests();
    },

    advanceQuest(questId, newState) {
        const quest = this.quests[questId];
        if (!quest) return;
        quest.state = newState;

        if (newState === 'complete') {
            this.completeQuest(questId);
        }

        UI.updateQuests();
    },

    completeQuest(questId) {
        const quest = this.quests[questId];
        if (!quest) return;

        // Award rewards
        if (quest.rewards.xp) {
            for (const [skill, amount] of Object.entries(quest.rewards.xp)) {
                Player.addXP(skill, amount);
            }
        }

        if (quest.rewards.items) {
            quest.rewards.items.forEach(itemId => {
                const names = {
                    orion_amulet: 'Orion Amulet of Observability',
                };
                Player.addItem(itemId, names[itemId] || itemId);
            });
        }

        if (quest.rewards.questPoints) {
            Player.questPoints += quest.rewards.questPoints;
            document.getElementById('quest-points-display').textContent = `Quest Points: ${Player.questPoints}`;
        }

        UI.addChatMessage(`Quest complete: ${quest.name}! +${quest.rewards.questPoints} Quest Points`, 'quest');
        UI.updateLeaderboard();
    },

    // Check if player can complete main quest
    checkMainQuestCompletion() {
        const quest = this.quests.main_quest;
        if (quest.state === 'fragment4') {
            // Player has all fragments and talks to Commander Chen
            if (Player.hasItem('packet_rune') && Player.hasItem('server_crystal') &&
                Player.hasItem('firewall_shield') && Player.hasItem('observability_gem')) {
                return true;
            }
        }
        return false;
    },

    getQuestDisplay() {
        const display = [];
        for (const [id, quest] of Object.entries(this.quests)) {
            const stageText = quest.stages[quest.state] || '';
            let status = 'not_started';
            if (quest.state === 'complete') status = 'complete';
            else if (quest.state !== 'not_started') status = 'in_progress';

            display.push({
                id,
                name: quest.name,
                description: quest.description,
                status,
                stageText,
                questPoints: quest.rewards.questPoints,
            });
        }
        return display;
    },
};
