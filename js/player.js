// Player system
const Player = {
    name: '',
    x: 34,
    y: 34,
    targetX: 34,
    targetY: 34,
    path: null,
    pathIndex: 0,
    moveTimer: 0,
    moveSpeed: 150, // ms per tile
    dir: 'south',
    animFrame: 0,
    animTimer: 0,

    // RSC-style skills
    skills: {
        networking:    { level: 1, xp: 0 },
        observability: { level: 1, xp: 0 },
        security:      { level: 1, xp: 0 },
        monitoring:    { level: 1, xp: 0 },
        debugging:     { level: 1, xp: 0 },
        automation:    { level: 1, xp: 0 },
        database:      { level: 1, xp: 0 },
        cloudcraft:    { level: 1, xp: 0 },
    },

    // Inventory (max 28 slots like RSC)
    inventory: [],
    maxInventory: 28,

    // Quest points
    questPoints: 0,

    // Score for leaderboard
    totalXP: 0,

    // Sprite cache
    sprite: null,
    spriteWalking: null,

    init(name) {
        this.name = name;
        this.x = 34;
        this.y = 34;
        this.targetX = 34;
        this.targetY = 34;
        this.path = null;
        this.inventory = [];
        this.questPoints = 0;
        this.totalXP = 0;

        // Reset skills
        for (const skill of Object.values(this.skills)) {
            skill.level = 1;
            skill.xp = 0;
        }

        // Starting items
        this.addItem('bronze_sword', 'Bronze Sword');
        this.addItem('bread', 'Bread');
        this.addItem('bread', 'Bread');
        this.addItem('coins', 'Coins (25gp)');

        // Generate sprite
        this.sprite = Assets.generateCharacterSprite({
            color: '#c00',
            hairColor: '#4a2a0a',
        });
        this.spriteWalking = Assets.generateCharacterSprite({
            color: '#c00',
            hairColor: '#4a2a0a',
            hasWeapon: true,
        });
    },

    addItem(id, name) {
        if (this.inventory.length >= this.maxInventory) {
            UI.addChatMessage('Your inventory is full!', 'error');
            return false;
        }
        this.inventory.push({ id, name });
        UI.updateInventory();
        return true;
    },

    removeItem(id) {
        const idx = this.inventory.findIndex(item => item.id === id);
        if (idx === -1) return false;
        this.inventory.splice(idx, 1);
        UI.updateInventory();
        return true;
    },

    hasItem(id) {
        return this.inventory.some(item => item.id === id);
    },

    // XP table (RSC-style exponential)
    xpForLevel(level) {
        let total = 0;
        for (let i = 1; i < level; i++) {
            total += Math.floor(i + 300 * Math.pow(2, i / 7));
        }
        return Math.floor(total / 4);
    },

    addXP(skillName, amount) {
        const skill = this.skills[skillName];
        if (!skill) return;

        skill.xp += amount;
        this.totalXP += amount;

        // Check for level up
        const newLevel = this.calculateLevel(skill.xp);
        if (newLevel > skill.level) {
            skill.level = newLevel;
            UI.addChatMessage(`Congratulations! Your ${skillName} level is now ${newLevel}!`, 'quest');
            UI.showLevelUp(skillName, newLevel);
        }

        UI.updateSkills();
        UI.updateLeaderboard();
    },

    calculateLevel(xp) {
        for (let lvl = 1; lvl < 99; lvl++) {
            if (xp < this.xpForLevel(lvl + 1)) return lvl;
        }
        return 99;
    },

    // Click to move
    clickTile(tileX, tileY) {
        if (tileX === this.x && tileY === this.y) return;

        const path = World.findPath(this.x, this.y, tileX, tileY);
        if (path && path.length > 0) {
            this.path = path;
            this.pathIndex = 0;
            this.moveTimer = 0;
        } else {
            UI.addChatMessage("I can't reach that.", 'system');
        }
    },

    update(dt) {
        // Follow path
        if (this.path && this.pathIndex < this.path.length) {
            this.moveTimer += dt;
            if (this.moveTimer >= this.moveSpeed) {
                this.moveTimer = 0;
                const next = this.path[this.pathIndex];

                // Update direction
                if (next.x > this.x) this.dir = 'east';
                else if (next.x < this.x) this.dir = 'west';
                else if (next.y > this.y) this.dir = 'south';
                else if (next.y < this.y) this.dir = 'north';

                this.x = next.x;
                this.y = next.y;
                this.pathIndex++;

                // Animation
                this.animFrame = (this.animFrame + 1) % 4;

                // Check NPC proximity
                NPC.checkProximity(this.x, this.y);

                if (this.pathIndex >= this.path.length) {
                    this.path = null;
                }
            }
        }

        // Idle animation
        this.animTimer += dt;
        if (this.animTimer > 500) {
            this.animTimer = 0;
        }
    },

    isMoving() {
        return this.path !== null && this.pathIndex < this.path.length;
    },
};
