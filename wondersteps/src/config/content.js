const fallback = {
    brand: {
        gameTitle: "Adi's WonderSteps",
        displayTitle: "ADI'S WONDERSTEPS",
        tagline: 'Every step becomes an adventure. Every adventure becomes a memory.',
        themeLine: 'EXPLORE  •  DISCOVER  •  GROW  •  REMEMBER',
        versionLabel: 'v0.4.9',
        logoAsset: 'assets/art/v045/adis-wondersteps-logo.png',
        scoreCredit: 'Original Wonderwood score — “A Kindness Remembers”'
    },
    characters: {
        player: { id: 'adi', name: 'Adi' }, companion: { id: 'dev', name: 'Dev' }, baker: { id: 'miri', name: 'Baker Miri' }
    },
    activeWorldId: 'wonderwood',
    worlds: [{
            id: 'wonderwood', name: 'Wonderwood', episodeTitle: "The Fountain's Song",
            description: 'A magical first adventure where kindness wakes old memories.',
            locations: { village: 'Sunpetal Village', forest: 'Whispering Forest', moonpond: 'Moonpond Lake', melodyHills: 'Melody Hills', starlightRuins: 'Starlight Ruins' }
        }]
};
export function loadGameContent(scene) {
    const loaded = scene.cache.json.get('game-content');
    const content = loaded ?? fallback;
    scene.registry.set('game-content', content);
    if (typeof document !== 'undefined') {
        document.title = content.brand.gameTitle;
        const gameContainer = document.getElementById('game-container');
        if (gameContainer)
            gameContainer.setAttribute('aria-label', `${content.brand.gameTitle} game`);
        const description = document.querySelector('meta[name=\"description\"]');
        if (description)
            description.setAttribute('content', `${content.brand.gameTitle} — ${content.brand.tagline}`);
    }
    return content;
}
export function getGameContent(scene) {
    return scene.registry.get('game-content') ?? fallback;
}
export function getActiveWorld(scene) {
    const content = getGameContent(scene);
    return content.worlds.find(world => world.id === content.activeWorldId) ?? content.worlds[0] ?? fallback.worlds[0];
}
export function locationName(scene, key, fallbackName) {
    return getActiveWorld(scene).locations?.[key] ?? fallbackName;
}
//# sourceMappingURL=content.js.map