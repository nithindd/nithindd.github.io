import Phaser from 'phaser';
import { gameState } from '../systems/GameState.js';
import { audioDirector } from '../systems/AudioDirector.js';
import { getGameContent, locationName } from '../config/content.js';
export class MemoryBookScene extends Phaser.Scene {
    constructor() { super('MemoryBook'); }
    create() {
        const { width, height } = this.scale;
        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x07130e, .78).setInteractive().setDepth(2000);
        blocker.on('pointerdown', () => undefined);
        const unlocked = gameState.snapshot().memoryIds.includes('fountain-song');
        if (unlocked)
            this.createUnlockedSpread(width, height);
        else
            this.createLockedSpread(width, height);
        this.createTopButton(width - 200, 46, 'Back', () => this.closeBook()).setDepth(2011);
        this.createTopButton(width - 96, 46, 'Home', () => this.goHome()).setDepth(2011);
        const close = this.add.text(width - 34, 46, '×', {
            fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'bold', color: '#fff2c7', backgroundColor: '#4a3424dd', padding: { x: 12, y: 0 }
        }).setOrigin(.5).setDepth(2012).setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => this.closeBook());
        this.input.keyboard?.once('keydown-ESC', () => this.closeBook());
        this.input.keyboard?.once('keydown-B', () => this.closeBook());
        this.input.keyboard?.once('keydown-H', () => this.goHome());
    }
    createTopButton(x, y, label, action) {
        const g = this.add.graphics();
        g.fillStyle(0x4a3424, .88).fillRoundedRect(-42, -20, 84, 40, 14);
        g.lineStyle(2, 0xd3b478, .98).strokeRoundedRect(-42, -20, 84, 40, 14);
        const t = this.add.text(0, 0, label, { fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', fontStyle: 'bold', color: '#fff3d0' }).setOrigin(.5);
        return this.add.container(x, y, [g, t]).setSize(84, 40).setInteractive({ useHandCursor: true }).on('pointerdown', action);
    }
    closeBook() {
        audioDirector.playSfx('page');
        this.scene.stop();
    }
    goHome() {
        audioDirector.playSfx('page');
        for (const sceneKey of ['Village', 'Forest', 'HUD', 'Map', 'MemoryBook']) {
            if (this.scene.isActive(sceneKey) || this.scene.isPaused(sceneKey))
                this.scene.stop(sceneKey);
        }
        this.scene.start('Title');
    }
    createUnlockedSpread(width, height) {
        const book = this.add.container(width / 2, height / 2).setDepth(2001).setAlpha(0).setScale(.96);
        const pageBase = this.add.image(0, 0, 'memory-fountain').setDisplaySize(width - 42, height - 24);
        book.add(pageBase);
        this.createIllustrationOverlay(book);
        this.tweens.add({ targets: book, alpha: 1, scale: 1, duration: 260, ease: 'Back.Out' });
    }
    createIllustrationOverlay(book) {
        const frameX = -340;
        const frameY = 60;
        const frameShadow = this.add.graphics();
        frameShadow.fillStyle(0x000000, .16).fillRoundedRect(frameX - 232, frameY - 204, 466, 406, 20);
        const frame = this.add.graphics();
        frame.fillStyle(0xf0ddbb, .98).fillRoundedRect(frameX - 240, frameY - 212, 466, 406, 20);
        frame.lineStyle(4, 0xb18a58, .95).strokeRoundedRect(frameX - 240, frameY - 212, 466, 406, 20);
        frame.lineStyle(1, 0xfff3de, .55).strokeRoundedRect(frameX - 232, frameY - 204, 450, 390, 16);
        book.add([frameShadow, frame]);
        const scenePlate = this.add.image(frameX - 8, frameY - 18, 'village-painted').setDisplaySize(424, 318);
        const maskShape = this.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(frameX - 212, frameY - 176, 408, 302, 14);
        maskShape.setVisible(false);
        scenePlate.setMask(new Phaser.Display.Masks.GeometryMask(this, maskShape));
        book.add(scenePlate);
        const captionBg = this.add.graphics();
        captionBg.fillStyle(0xd3b16f, .98).fillRoundedRect(frameX - 200, frameY - 170, 170, 32, 10);
        const caption = this.add.text(frameX - 115, frameY - 154, locationName(this, 'village', 'Sunpetal Village'), {
            fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: '#55371f'
        }).setOrigin(.5);
        book.add([captionBg, caption]);
        const adi = this.add.image(frameX - 38, frameY + 136, 'adi-idle').setDisplaySize(118, 220);
        const dev = this.add.image(frameX + 36, frameY + 102, 'dev-happy').setDisplaySize(84, 98);
        const miri = this.add.image(frameX + 120, frameY + 140, 'miri').setDisplaySize(132, 188);
        const fountainGlow = this.add.circle(frameX + 76, frameY + 8, 40, 0x7dd8ff, .18).setBlendMode(Phaser.BlendModes.SCREEN);
        book.add([fountainGlow, adi, dev, miri]);
    }
    createLockedSpread(width, height) {
        const bg = this.add.graphics().setDepth(2001);
        bg.fillStyle(0xffefd0, .99).fillRoundedRect(width / 2 - 390, height / 2 - 220, 780, 440, 30);
        bg.lineStyle(5, 0x9a6f3c, 1).strokeRoundedRect(width / 2 - 390, height / 2 - 220, 780, 440, 30);
        this.add.text(width / 2, height / 2 - 95, 'MEMORY BOOK', { fontFamily: 'Georgia, serif', fontSize: '52px', fontStyle: 'bold', color: '#5a3e27' }).setOrigin(.5).setDepth(2002);
        this.add.text(width / 2, height / 2 + 15, `Your first page is still waiting to be written.\nHelp ${getGameContent(this).characters.baker.name} restore the village fountain.`, { fontFamily: 'Trebuchet MS, Arial', fontSize: '25px', align: 'center', color: '#5e503f', lineSpacing: 10 }).setOrigin(.5).setDepth(2002);
        this.add.text(width / 2, height / 2 + 135, 'Every choice leaves a memory.', { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#7a7650' }).setOrigin(.5).setDepth(2002);
    }
}
//# sourceMappingURL=MemoryBookScene.js.map
