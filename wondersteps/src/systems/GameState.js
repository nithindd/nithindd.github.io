import Phaser from 'phaser';
const SAVE_KEY = 'wonderwood-save-v2';
const LEGACY_KEY = 'wonderwood-save-v1';
const initialSave = () => ({
    version: 2,
    playerName: 'Adi',
    companionName: 'Dev',
    bakerName: 'Baker Miri',
    location: 'village',
    questStage: 'meet-miri',
    moonberries: 0,
    friendshipHearts: 1,
    restorationStars: 0,
    memoryPages: 0,
    memoryIds: [],
    dev: { curiosity: 2, kindness: 2, humor: 1, helpfulness: 2 }
});
class GameStateStore {
    events = new Phaser.Events.EventEmitter();
    data = initialSave();
    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.version === 2)
                    this.data = { ...initialSave(), ...parsed, bakerName: parsed.bakerName ?? initialSave().bakerName };
                return this.snapshot();
            }
            const legacyRaw = localStorage.getItem(LEGACY_KEY);
            if (legacyRaw) {
                const legacy = JSON.parse(legacyRaw);
                const oldPip = (legacy.pip ?? {});
                this.data = {
                    ...initialSave(),
                    location: legacy.location === 'forest' ? 'forest' : 'village',
                    questStage: legacy.questStage ?? 'meet-miri',
                    moonberries: Number(legacy.moonberries ?? 0),
                    friendshipHearts: Number(legacy.friendshipHearts ?? 1),
                    restorationStars: Number(legacy.restorationStars ?? 0),
                    memoryPages: Number(legacy.memoryPages ?? 0),
                    memoryIds: Number(legacy.memoryPages ?? 0) > 0 ? ['fountain-song'] : [],
                    dev: {
                        curiosity: Number(oldPip.curiosity ?? 2),
                        kindness: Number(oldPip.kindness ?? 2),
                        humor: Number(oldPip.humor ?? 1),
                        helpfulness: Number(oldPip.helpfulness ?? 2)
                    }
                };
                this.persist();
            }
        }
        catch {
            this.data = initialSave();
        }
        return this.snapshot();
    }
    snapshot() { return structuredClone(this.data); }
    configureNames(playerName, companionName, bakerName) {
        this.data.playerName = playerName;
        this.data.companionName = companionName;
        this.data.bakerName = bakerName;
        this.persist();
    }
    reset() { this.data = initialSave(); this.persist(); this.events.emit('changed', this.snapshot()); }
    setLocation(location) { if (this.data.location === location)
        return; this.data.location = location; this.commit(); }
    meetMiri() { if (this.data.questStage !== 'meet-miri')
        return; this.data.questStage = 'collect-moonberries'; this.data.dev.kindness += 1; this.commit(); }
    collectMoonberry() { if (this.data.questStage !== 'collect-moonberries')
        return; this.data.moonberries = Math.min(3, this.data.moonberries + 1); this.data.dev.curiosity += 1; if (this.data.moonberries === 3)
        this.data.questStage = 'return-to-miri'; this.commit(); }
    restoreFountain() {
        if (this.data.questStage !== 'return-to-miri')
            return;
        this.data.questStage = 'restored';
        this.data.friendshipHearts = Math.max(2, this.data.friendshipHearts);
        this.data.restorationStars = Math.max(1, this.data.restorationStars);
        this.data.memoryPages = Math.max(1, this.data.memoryPages);
        if (!this.data.memoryIds.includes('fountain-song'))
            this.data.memoryIds.push('fountain-song');
        this.data.dev.helpfulness += 2;
        this.commit();
    }
    commit() { this.persist(); this.events.emit('changed', this.snapshot()); }
    persist() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); }
}
export const gameState = new GameStateStore();
//# sourceMappingURL=GameState.js.map