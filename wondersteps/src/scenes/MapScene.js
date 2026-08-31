import Phaser from 'phaser';
import { gameState } from '../systems/GameState.js';
import { audioDirector } from '../systems/AudioDirector.js';
import { getActiveWorld, getGameContent, locationName } from '../config/content.js';
export class MapScene extends Phaser.Scene {
    marker;
    locationText;
    mapDisplayW = 760;
    mapDisplayH = 618;
    constructor() { super('Map'); }
    create() {
        const { width, height } = this.scale;
        const camera = this.cameras.main;
        camera.stopFollow();
        camera.setScroll(0, 0);
        camera.setZoom(1);
        camera.setRotation(0);
        camera.setViewport(0, 0, width, height);
        camera.setRoundPixels(false);
        const currentScene = gameState.snapshot().location === 'forest' ? 'Forest' : 'Village';
        if (this.scene.isActive(currentScene))
            this.scene.pause(currentScene);
        if (this.scene.isActive('HUD'))
            this.scene.pause('HUD');
        this.add.rectangle(width / 2, height / 2, width, height, 0x07130e, .88)
            .setDepth(0).setScrollFactor(0).setInteractive();
        const panelW = Math.min(1040, width - 120);
        const panelH = Math.min(790, height - 70);
        const panelX = width / 2;
        const panelY = height / 2;
        const shadow = this.add.graphics().setScrollFactor(0);
        shadow.fillStyle(0x000000, .35).fillRoundedRect(panelX - panelW / 2 + 12, panelY - panelH / 2 + 14, panelW, panelH, 34);
        const panel = this.add.graphics().setScrollFactor(0);
        panel.fillStyle(0xead8ad, .99).fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 34);
        panel.lineStyle(6, 0x765334, 1).strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 34);
        panel.lineStyle(2, 0xfff3d0, .72).strokeRoundedRect(panelX - panelW / 2 + 12, panelY - panelH / 2 + 12, panelW - 24, panelH - 24, 26);
        const activeWorld = getActiveWorld(this);
        this.add.text(panelX, panelY - panelH / 2 + 42, `${activeWorld.name.toUpperCase()} MAP`, {
            fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'bold', color: '#4c341f'
        }).setOrigin(.5).setScrollFactor(0);
        this.add.text(panelX, panelY - panelH / 2 + 76, 'Follow the glowing marker • M / Esc closes the map', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', color: '#765f42'
        }).setOrigin(.5).setScrollFactor(0);
        const mapY = panelY + 18;
        this.add.image(panelX, mapY, 'wonderwood-map-illustrated-v049')
            .setDisplaySize(this.mapDisplayW, this.mapDisplayH)
            .setScrollFactor(0).setDepth(2);
        const mapFrame = this.add.graphics().setScrollFactor(0).setDepth(3);
        mapFrame.lineStyle(4, 0x6f4b2d, .95).strokeRoundedRect(panelX - this.mapDisplayW / 2, mapY - this.mapDisplayH / 2, this.mapDisplayW, this.mapDisplayH, 20);
        mapFrame.lineStyle(1, 0xfff0c9, .75).strokeRoundedRect(panelX - this.mapDisplayW / 2 + 7, mapY - this.mapDisplayH / 2 + 7, this.mapDisplayW - 14, this.mapDisplayH - 14, 16);
        const halo = this.add.circle(0, 0, 21, 0xffdc55, .25).setStrokeStyle(2, 0xfff3a2, .72);
        const pin = this.add.text(0, 0, '◆', {
            fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: '#ffd64c', stroke: '#4c3620', strokeThickness: 4
        }).setOrigin(.5);
        const you = this.add.text(0, -30, 'YOU', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '13px', fontStyle: 'bold', color: '#fff4c7', backgroundColor: '#4f3925cc', padding: { x: 5, y: 2 }
        }).setOrigin(.5);
        this.marker = this.add.container(panelX, mapY, [halo, pin, you]).setScrollFactor(0).setDepth(5);
        this.tweens.add({ targets: halo, alpha: { from: .12, to: .48 }, scale: { from: .82, to: 1.3 }, duration: 760, yoyo: true, repeat: -1 });
        const infoY = panelY + panelH / 2 - 36;
        const infoBg = this.add.graphics().setScrollFactor(0).setDepth(5);
        infoBg.fillStyle(0xf8ebc8, .98).fillRoundedRect(panelX - 315, infoY - 22, 630, 44, 14);
        infoBg.lineStyle(2, 0xc79a58, .95).strokeRoundedRect(panelX - 315, infoY - 22, 630, 44, 14);
        this.locationText = this.add.text(panelX, infoY, '', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', fontStyle: 'bold', color: '#4b3926'
        }).setOrigin(.5).setScrollFactor(0).setDepth(6);
        this.createTopButton(panelX + panelW / 2 - 132, panelY - panelH / 2 + 42, 'Home', () => this.goHome());
        this.createTopButton(panelX + panelW / 2 - 42, panelY - panelH / 2 + 42, '×', () => this.closeMap(), 52);
        this.input.keyboard?.on('keydown-ESC', () => this.closeMap());
        this.input.keyboard?.on('keydown-H', () => this.goHome());
        this.time.delayedCall(120, () => this.input.keyboard?.on('keydown-M', () => this.closeMap()));
        this.registry.events.on('player-position', this.updateMarker, this);
        this.events.once('shutdown', () => this.registry.events.off('player-position', this.updateMarker, this));
        const saved = this.registry.get('player-position');
        this.updateMarker(saved ?? { location: gameState.snapshot().location, x: .5, y: .7 });
        camera.fadeIn(160, 10, 18, 13);
    }
    createTopButton(x, y, label, action, buttonW = 80) {
        const g = this.add.graphics();
        g.fillStyle(0x4a3424, .93).fillRoundedRect(-buttonW / 2, -20, buttonW, 40, 14);
        g.lineStyle(2, 0xd3b478, .98).strokeRoundedRect(-buttonW / 2, -20, buttonW, 40, 14);
        const t = this.add.text(0, 0, label, { fontFamily: 'Trebuchet MS, Arial', fontSize: label === '×' ? '28px' : '17px', fontStyle: 'bold', color: '#fff3d0' }).setOrigin(.5);
        return this.add.container(x, y, [g, t]).setScrollFactor(0).setDepth(10).setSize(buttonW, 40).setInteractive({ useHandCursor: true }).on('pointerdown', action);
    }
    updateMarker(position) {
        const point = position.location === 'forest' ? { x: 319, y: 99 } : { x: 217, y: 190 };
        const localX = (point.x / 425 - .5) * this.mapDisplayW;
        const localY = (point.y / 345 - .5) * this.mapDisplayH;
        this.marker.setPosition(this.scale.width / 2 + localX, this.scale.height / 2 + 18 + localY);
        this.locationText.setText(position.location === 'forest'
            ? `You are exploring ${locationName(this, 'forest', 'Whispering Forest')}. Follow the lit trail toward the Moonberries.`
            : `You are in ${locationName(this, 'village', 'Sunpetal Village')}. ${getGameContent(this).characters.baker.name} and the fountain are in the plaza.`);
    }
    closeMap() {
        audioDirector.playSfx('page');
        const currentScene = gameState.snapshot().location === 'forest' ? 'Forest' : 'Village';
        if (this.scene.isPaused(currentScene))
            this.scene.resume(currentScene);
        if (this.scene.isPaused('HUD'))
            this.scene.resume('HUD');
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
}
//# sourceMappingURL=MapScene.js.map
