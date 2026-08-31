import Phaser from 'phaser';
import { gameState } from '../systems/GameState.js';
import { loadGameContent } from '../config/content.js';
export class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        this.load.once('filecomplete-json-game-content', () => {
            const config = this.cache.json.get('game-content');
            if (config?.brand?.logoAsset)
                this.load.image('brand-logo', config.brand.logoAsset);
        });
        this.load.json('game-content', 'config/game-content.json');
        this.load.image('miri', 'assets/art/v03/miri-3d-cutout.png');
        this.load.svg('moonberry', 'assets/art/moonberry.svg');
        // v0.4.1 painted village plate plus layered forest fallback.
        this.load.image('village-painted', 'assets/art/v042/village-painted.jpg');
        this.load.svg('village-far', 'assets/art/v04-village-far.svg');
        this.load.svg('village-mid', 'assets/art/v04-village-mid.svg');
        this.load.svg('village-front', 'assets/art/v04-village-front.svg');
        this.load.image('forest-painted-v043', 'assets/art/v043/forest-painted.jpg');
        this.load.image('forest-foreground-left-v043', 'assets/art/v043/forest-foreground-left.png');
        this.load.image('forest-foreground-right-v043', 'assets/art/v043/forest-foreground-right.png');
        this.load.svg('forest-entry-sign-v043', 'assets/art/v043/forest-entry-sign.svg');
        this.load.svg('wonderwood-map', 'assets/art/wonderwood-map.svg');
        this.load.image('wonderwood-map-illustrated-v049', 'assets/art/v049/wonderwood-map-illustrated.jpg');
        this.load.svg('fountain-dormant', 'assets/art/fountain-dormant.svg');
        this.load.svg('fountain-restored', 'assets/art/fountain-restored.svg');
        this.load.svg('signpost', 'assets/art/signpost.svg');
        for (const key of ['idle', 'walk', 'interact', 'inspect', 'celebrate']) {
            this.load.image(`adi-${key}`, `assets/art/v03/adi-${key}.png`);
        }
        this.load.image('adi-side', 'assets/art/v044/adi-side.png');
        for (const key of ['curious', 'happy', 'hint', 'wonder', 'surprised']) {
            this.load.image(`dev-${key}`, `assets/art/v03/dev-${key}.png`);
        }
        this.load.image('dev-side', 'assets/art/v044/dev-side.png');
        this.load.image('memory-fountain', 'assets/art/v03/memory-fountain.png');
    }
    create() {
        const content = loadGameContent(this);
        gameState.load();
        gameState.configureNames(content.characters.player.name, content.characters.companion.name, content.characters.baker.name);
        this.scene.start('Title');
    }
}
//# sourceMappingURL=BootScene.js.map