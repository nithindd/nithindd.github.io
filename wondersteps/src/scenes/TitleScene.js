import Phaser from 'phaser';
import { createButton } from '../ui/draw.js';
import { createAdi, createDev, setDevEmotion } from '../ui/characters.js';
import { gameState } from '../systems/GameState.js';
import { audioDirector } from '../systems/AudioDirector.js';
import { getActiveWorld, getGameContent } from '../config/content.js';
export class TitleScene extends Phaser.Scene {
    constructor() { super('Title'); }
    create() {
        const { width, height } = this.scale;
        const content = getGameContent(this);
        const world = getActiveWorld(this);
        const bg = this.add.image(width / 2, height / 2, 'village-painted').setDisplaySize(width, height);
        this.tweens.add({ targets: bg, scaleX: 1.012, scaleY: 1.012, duration: 11000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        this.add.rectangle(width / 2, height / 2, width, height, 0x11251c, .28).setDepth(4);
        this.add.rectangle(width * .69, height * .49, 790, 610, 0x0b1812, .22).setDepth(5);
        const adi = createAdi(this, width * .27, height * .82).setScale(1.18).setDepth(8).setAlpha(0);
        const dev = createDev(this, width * .39, height * .66, 'happy').setScale(1.04).setDepth(9).setAlpha(0);
        setDevEmotion(this, dev, 'happy');
        this.tweens.add({ targets: adi, alpha: 1, x: width * .30, duration: 720, ease: 'Sine.Out' });
        this.tweens.add({ targets: dev, alpha: 1, delay: 140, duration: 600, ease: 'Sine.Out' });
        if (this.textures.exists('brand-logo')) {
            const logo = this.add.image(width * .69, 160, 'brand-logo').setDisplaySize(720, 260).setDepth(10);
            this.tweens.add({ targets: logo, y: 154, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        }
        else {
            this.add.text(width * .69, 150, content.brand.displayTitle, {
                fontFamily: 'Georgia, serif', fontSize: '62px', fontStyle: 'bold', color: '#fff2c8',
                stroke: '#3d2b1c', strokeThickness: 8,
                shadow: { offsetX: 0, offsetY: 6, color: '#09130e', blur: 7, fill: true }
            }).setOrigin(.5).setDepth(10);
        }
        this.add.text(width * .69, 305, content.brand.tagline, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '21px', color: '#f8efd7', align: 'center',
            wordWrap: { width: 680 }, shadow: { offsetX: 0, offsetY: 2, color: '#17251e', blur: 4, fill: true }
        }).setOrigin(.5).setDepth(10);
        this.add.text(width * .69, 348, content.brand.themeLine, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', fontStyle: 'bold', color: '#dfcb91', letterSpacing: 2
        }).setOrigin(.5).setDepth(10);
        const worldBadge = this.add.container(width * .69, 400).setDepth(10);
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x20392d, .94).fillRoundedRect(-250, -31, 500, 62, 16);
        badgeBg.lineStyle(2, 0xcba75f, .95).strokeRoundedRect(-250, -31, 500, 62, 16);
        const badgeText = this.add.text(0, -8, `WORLD 1  •  ${world.name}`, { fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'bold', color: '#fff0c5' }).setOrigin(.5);
        const episodeText = this.add.text(0, 17, world.episodeTitle, { fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', color: '#d9c89e' }).setOrigin(.5);
        worldBadge.add([badgeBg, badgeText, episodeText]);
        const start = () => {
            audioDirector.unlock();
            void audioDirector.switchMusic('village', .18, 500);
            const save = gameState.snapshot();
            this.cameras.main.fadeOut(280, 17, 31, 24);
            this.time.delayedCall(290, () => {
                this.scene.start(save.location === 'forest' ? 'Forest' : 'Village');
                if (!this.scene.isActive('HUD'))
                    this.scene.launch('HUD');
            });
        };
        createButton(this, width * .69, height * .60, gameState.snapshot().questStage === 'meet-miri' ? 'Begin Adventure' : 'Continue Adventure', start, 275).setDepth(10);
        createButton(this, width * .69, height * .70, 'Start New Journey', () => {
            gameState.reset();
            gameState.configureNames(content.characters.player.name, content.characters.companion.name, content.characters.baker.name);
            start();
        }, 235).setScale(.88).setDepth(10);
        this.add.text(width * .69, height * .79, `♪  ${content.brand.scoreCredit ?? `Original ${world.name} score — “A Kindness Remembers”`}`, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', color: '#ead7a8', backgroundColor: '#12241bc4', padding: { x: 11, y: 6 }
        }).setOrigin(.5).setDepth(10);
        this.add.text(width - 24, height - 22, content.brand.versionLabel, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '13px', color: '#e5d4ae', backgroundColor: '#12241bbb', padding: { x: 8, y: 4 }
        }).setOrigin(1, 1).setDepth(10);
        for (let i = 0; i < 18; i++) {
            const dot = this.add.circle(Phaser.Math.Between(50, width - 50), Phaser.Math.Between(120, height - 70), Phaser.Math.Between(2, 4), Phaser.Utils.Array.GetRandom([0xffefab, 0xbce8d5, 0xffffff]), Phaser.Math.FloatBetween(.12, .42)).setDepth(6);
            this.tweens.add({ targets: dot, y: dot.y - Phaser.Math.Between(28, 80), alpha: .03, duration: Phaser.Math.Between(1900, 3700), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
        }
        this.cameras.main.fadeIn(480, 17, 31, 24);
    }
}
//# sourceMappingURL=TitleScene.js.map