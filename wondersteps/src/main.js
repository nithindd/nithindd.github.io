import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { VillageScene } from './scenes/VillageScene.js';
import { ForestScene } from './scenes/ForestScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { MemoryBookScene } from './scenes/MemoryBookScene.js';
import { MapScene } from './scenes/MapScene.js';
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1600,
    height: 900,
    backgroundColor: '#1f4233',
    scene: [BootScene, TitleScene, VillageScene, ForestScene, HUDScene, MemoryBookScene, MapScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1600, height: 900 },
    input: { activePointers: 2 },
    render: { antialias: true, pixelArt: false, roundPixels: false }
};
new Phaser.Game(config);
//# sourceMappingURL=main.js.map