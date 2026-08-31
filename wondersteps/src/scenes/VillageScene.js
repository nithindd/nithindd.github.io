import Phaser from 'phaser';
import { colors } from '../config/theme.js';
import { createAdi, createDev, createMiri, playAdiAction, pulseDev, setAdiMotion, setDevEmotion, setDevMotion } from '../ui/characters.js';
import { gameState } from '../systems/GameState.js';
import { audioDirector } from '../systems/AudioDirector.js';
import { applyPerspective, configureCinematicCamera, transitionScene, updateCinematicZoom, WalkableWorld } from '../systems/World2D5.js';
import { getGameContent, locationName } from '../config/content.js';
export class VillageScene extends Phaser.Scene {
    adi;
    dev;
    miri;
    cursors;
    keys;
    world;
    moveTarget = null;
    miriHint;
    signHint;
    fountainHint;
    fountainShade;
    nearMiri = false;
    nearSign = false;
    nearFountain = false;
    restoredEffectsPlayed = false;
    restorationPending = false;
    // Coordinates tuned to the painted v0.4.2 village plate.
    fountainGround = new Phaser.Math.Vector2(1335, 590);
    miriPos = new Phaser.Math.Vector2(1045, 742);
    signPos = new Phaser.Math.Vector2(1390, 735);
    constructor() { super('Village'); }
    create() {
        gameState.setLocation('village');
        const { width, height } = this.scale;
        const restored = gameState.snapshot().questStage === 'restored';
        void audioDirector.switchMusic(restored ? 'restored' : 'village', restored ? .24 : .20, 700);
        // One coherent painted scenery plate. No baked player, companion, NPC or HUD.
        const backdrop = this.add.image(width / 2, height / 2, 'village-painted')
            .setDisplaySize(width, height)
            .setDepth(0);
        this.tweens.add({ targets: backdrop, scaleX: 1.006, scaleY: 1.006, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        // A restrained cinematic vignette hides compositing edges while keeping the playfield bright.
        this.add.rectangle(width / 2, 865, width, 110, 0x12241b, .12).setDepth(3);
        this.add.rectangle(width / 2, 12, width, 24, 0x102019, .09).setDepth(3);
        // The painted fountain already exists in the environment. Before restoration we dim it,
        // then remove the shade and add magical particles rather than drawing a second fountain.
        this.fountainShade = this.add.ellipse(this.fountainGround.x, 470, 390, 330, 0x102922, restored ? 0 : .26)
            .setDepth(12);
        this.world = new WalkableWorld([
            65, 870,
            90, 720,
            245, 610,
            470, 525,
            700, 480,
            940, 485,
            1160, 520,
            1370, 610,
            1535, 735,
            1565, 875
        ], [
            { x: this.fountainGround.x, y: this.fountainGround.y, radius: 128 }
        ]);
        this.adi = createAdi(this, 665, 765);
        this.dev = createDev(this, 535, 665, restored ? 'wonder' : 'curious');
        this.miri = createMiri(this, this.miriPos.x, this.miriPos.y);
        applyPerspective(this.adi, 470, 870, .54, .76);
        applyPerspective(this.dev, 450, 825, .46, .64);
        applyPerspective(this.miri, 500, 850, .56, .76);
        configureCinematicCamera(this, this.adi, 1.055);
        const miriZone = this.add.zone(this.miriPos.x, this.miriPos.y - 105, 190, 220).setInteractive({ useHandCursor: true });
        miriZone.on('pointerdown', () => this.interactWithMiri());
        const fountainZone = this.add.zone(this.fountainGround.x, 485, 290, 250).setInteractive({ useHandCursor: true });
        fountainZone.on('pointerdown', () => this.inspectFountain());
        const forestZone = this.add.zone(this.signPos.x, this.signPos.y - 80, 220, 230).setInteractive({ useHandCursor: true });
        forestZone.on('pointerdown', () => this.enterForest());
        const sign = this.add.image(this.signPos.x, this.signPos.y - 85, 'signpost').setDisplaySize(185, 210).setDepth(720).setAlpha(.96);
        sign.setRotation(-0.015);
        this.miriHint = this.createInteractionBubble(this.miriPos.x, this.miriPos.y - 188, `Talk to ${getGameContent(this).characters.baker.name}`, 'miri').setVisible(false);
        this.signHint = this.createInteractionBubble(this.signPos.x, this.signPos.y - 205, `Enter ${locationName(this, 'forest', 'Whispering Forest')}`, 'world').setVisible(false);
        this.fountainHint = this.createInteractionBubble(this.fountainGround.x, this.fountainGround.y + 10, 'Inspect fountain', 'world').setVisible(false);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
        this.keys.E.on('down', () => this.handleInteract());
        this.input.on('pointerdown', (pointer, over) => {
            audioDirector.unlock();
            if (over.length > 0 || pointer.y < 105)
                return;
            if (this.world.contains(pointer.worldX, pointer.worldY)) {
                this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
            }
        });
        gameState.events.on('changed', this.onStateChanged, this);
        this.events.once('shutdown', () => gameState.events.off('changed', this.onStateChanged, this));
        this.addAmbientMagic(restored);
        if (restored)
            this.setupRestoration(false);
        this.cameras.main.fadeIn(420, 18, 31, 24);
    }
    update(time, delta) {
        const speed = 278 * delta / 1000;
        let dx = 0;
        let dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown)
            dx -= speed;
        if (this.cursors.right.isDown || this.keys.D.isDown)
            dx += speed;
        if (this.cursors.up.isDown || this.keys.W.isDown)
            dy -= speed;
        if (this.cursors.down.isDown || this.keys.S.isDown)
            dy += speed;
        if (dx || dy)
            this.moveTarget = null;
        if (!dx && !dy && this.moveTarget) {
            const distance = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.moveTarget.x, this.moveTarget.y);
            if (distance < 7)
                this.moveTarget = null;
            else {
                const angle = Phaser.Math.Angle.Between(this.adi.x, this.adi.y, this.moveTarget.x, this.moveTarget.y);
                dx = Math.cos(angle) * speed;
                dy = Math.sin(angle) * speed;
            }
        }
        const moving = Boolean(dx || dy);
        if (moving)
            this.world.move(this.adi, dx, dy);
        setAdiMotion(this.adi, moving, dx, dy, time);
        updateCinematicZoom(this, moving);
        applyPerspective(this.adi, 470, 870, .54, .76);
        const followX = this.adi.x - 104 * this.adi.scaleX;
        const followY = this.adi.y - 130 * this.adi.scaleY;
        this.dev.x += (followX - this.dev.x) * .075;
        this.dev.y += (followY - this.dev.y) * .075;
        applyPerspective(this.dev, 450, 825, .46, .64);
        setDevMotion(this.dev, moving, dx, dy, time);
        this.dev.setDepth(this.adi.depth + 3);
        this.miri.setDepth(Math.floor(40 + this.miri.y));
        this.nearMiri = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.miriPos.x, this.miriPos.y) < 180;
        this.nearSign = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.signPos.x, this.signPos.y) < 180;
        this.nearFountain = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.fountainGround.x, this.fountainGround.y) < 185;
        this.miriHint.setVisible(this.nearMiri);
        this.signHint.setVisible(this.nearSign && !this.nearMiri);
        this.fountainHint.setVisible(this.nearFountain && !this.nearMiri && !this.nearSign);
        const playerPosition = { location: 'village', x: this.adi.x / 1600, y: this.adi.y / 900 };
        this.registry.set('player-position', playerPosition);
        this.registry.events.emit('player-position', playerPosition);
    }
    handleInteract() {
        audioDirector.unlock();
        if (this.nearMiri)
            this.interactWithMiri();
        else if (this.nearSign)
            this.enterForest();
        else if (this.nearFountain)
            this.inspectFountain();
    }
    enterForest() {
        if (gameState.snapshot().questStage === 'meet-miri') {
            const names = getGameContent(this).characters;
            this.registry.events.emit('dialogue', names.companion.name, `${names.baker.name} is waiting by the fountain. Let’s find out why she looks worried first.`);
            this.registry.events.emit('dev-emotion', 'curious');
            pulseDev(this, this.dev, 'curious');
            return;
        }
        audioDirector.playSfx('transition');
        transitionScene(this, 'Forest', locationName(this, 'forest', 'Whispering Forest'));
    }
    inspectFountain() {
        playAdiAction(this, this.adi, 'inspect', 900);
        audioDirector.playSfx('interact');
        const restored = gameState.snapshot().questStage === 'restored';
        const names = getGameContent(this).characters;
        this.registry.events.emit('dialogue', names.companion.name, restored
            ? `Listen, ${names.player.name}—the fountain is singing again. Warm light ripples through the water.`
            : 'The fountain feels strangely quiet. I think its old song is still hiding somewhere inside.');
        this.registry.events.emit('dev-emotion', restored ? 'wonder' : 'surprised');
        setDevEmotion(this, this.dev, restored ? 'wonder' : 'surprised');
    }
    interactWithMiri() {
        audioDirector.playSfx('interact');
        playAdiAction(this, this.adi, 'interact', 900);
        const state = gameState.snapshot();
        const names = getGameContent(this).characters;
        if (state.questStage === 'meet-miri') {
            gameState.meetMiri();
            this.registry.events.emit('dialogue', names.baker.name, `The fountain has gone silent, ${names.player.name}. Three Moonberries may wake its old magic. ${names.companion.name} knows the path into ${locationName(this, 'forest', 'Whispering Forest')}.`);
            pulseDev(this, this.dev, 'hint');
            this.registry.events.emit('dev-emotion', 'hint');
            return;
        }
        if (state.questStage === 'collect-moonberries') {
            this.registry.events.emit('dialogue', names.baker.name, `You have ${state.moonberries} of 3 Moonberries. They glow beneath the oldest trees.`);
            return;
        }
        if (state.questStage === 'return-to-miri') {
            if (this.restorationPending)
                return;
            this.restorationPending = true;
            this.registry.events.emit('dialogue', names.baker.name, 'You brought them back! Listen closely...');
            playAdiAction(this, this.adi, 'celebrate', 1450);
            pulseDev(this, this.dev, 'happy');
            void audioDirector.playFountainRestorationSequence(() => {
                gameState.restoreFountain();
                this.restorationPending = false;
                this.registry.events.emit('dialogue', names.baker.name, 'The water remembers its song! The whole village feels brighter.');
                this.registry.events.emit('reward', 'The Fountain Sings!', 'Sunpetal Village feels warm and joyful again.');
            });
            return;
        }
        this.registry.events.emit('dialogue', names.baker.name, `The plaza feels alive again. Thank you, ${names.player.name}—and you too, ${names.companion.name}.`);
        setDevEmotion(this, this.dev, 'happy');
    }
    onStateChanged() {
        if (gameState.snapshot().questStage === 'restored' && !this.restoredEffectsPlayed)
            this.setupRestoration(true);
    }
    setupRestoration(celebrate) {
        this.restoredEffectsPlayed = true;
        setDevEmotion(this, this.dev, 'wonder');
        this.tweens.add({ targets: this.fountainShade, alpha: 0, duration: celebrate ? 1050 : 1 });
        for (let i = 0; i < 30; i++) {
            const x = this.fountainGround.x + Phaser.Math.Between(-155, 155);
            const y = 465 + Phaser.Math.Between(-110, 125);
            const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), Phaser.Utils.Array.GetRandom([colors.glow, 0xffe69b, 0xcff8ee]), Phaser.Math.FloatBetween(.35, .82)).setDepth(870);
            this.tweens.add({
                targets: particle,
                x: x + Phaser.Math.Between(-35, 35),
                y: y - Phaser.Math.Between(65, 155),
                alpha: 0,
                duration: Phaser.Math.Between(1500, 2900),
                delay: Phaser.Math.Between(0, 1000),
                repeat: -1,
                ease: 'Sine.Out'
            });
        }
        for (let i = 0; i < 8; i++) {
            const symbol = this.add.text(this.miriPos.x + Phaser.Math.Between(-70, 70), this.miriPos.y - 170, i % 2 ? '♥' : '✦', {
                fontFamily: 'Georgia, serif', fontSize: `${Phaser.Math.Between(17, 27)}px`, color: i % 2 ? '#f2a7a7' : '#ffe7a0'
            }).setOrigin(.5).setDepth(900).setAlpha(celebrate ? 0 : .24);
            this.tweens.add({ targets: symbol, y: symbol.y - Phaser.Math.Between(55, 105), alpha: 0, duration: Phaser.Math.Between(1200, 1900), repeat: celebrate ? 2 : -1, delay: Phaser.Math.Between(0, 450) });
        }
        if (celebrate) {
            this.cameras.main.flash(650, 238, 224, 157, false);
            this.registry.events.emit('reward', 'Restoration Star', 'Memory unlocked: The Day the Fountain Sang Again');
            this.time.delayedCall(1450, () => this.registry.events.emit('memory-unlocked'));
        }
    }
    addAmbientMagic(restored) {
        const count = restored ? 24 : 10;
        for (let i = 0; i < count; i++) {
            const dot = this.add.circle(Phaser.Math.Between(55, 1540), Phaser.Math.Between(250, 845), Phaser.Math.Between(2, 4), Phaser.Utils.Array.GetRandom([0xffefac, 0xbdebd8, 0xffffff]), Phaser.Math.FloatBetween(.10, .36)).setDepth(18);
            this.tweens.add({ targets: dot, y: dot.y - Phaser.Math.Between(30, 85), alpha: .02, duration: Phaser.Math.Between(1900, 3600), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1300) });
        }
    }
    createInteractionBubble(x, y, text, style = 'world') {
        const bg = this.add.graphics();
        const items = [bg];
        if (style === 'miri') {
            bg.fillStyle(0x000000, .18).fillRoundedRect(-2, 2, 198, 42, 14);
            bg.fillStyle(0xf3ead1, .98).fillRoundedRect(-6, -2, 198, 42, 14);
            bg.lineStyle(2, 0xc79a58, .94).strokeRoundedRect(-6, -2, 198, 42, 14);
            bg.fillStyle(0xf3ead1, .98).fillTriangle(18, 39, 34, 39, 24, 53);
            bg.lineStyle(2, 0xc79a58, .94).strokeTriangle(18, 39, 34, 39, 24, 53);
            const iconBg = this.add.circle(17, 19, 12, 0x8e6a3a, 1).setStrokeStyle(2, 0xe8d7ad, 1);
            const icon = this.add.text(17, 18, '⋯', { fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', fontStyle: 'bold', color: '#fff8e6' }).setOrigin(.5);
            const label = this.add.text(36, 18, text, {
                fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', fontStyle: 'bold', color: '#4e3a23'
            }).setOrigin(0, .5);
            items.push(iconBg, icon, label);
        }
        else {
            bg.fillStyle(0x13261d, .94).fillRoundedRect(-118, -22, 236, 44, 13);
            bg.lineStyle(2, 0xd1a459, .92).strokeRoundedRect(-118, -22, 236, 44, 13);
            const key = this.add.text(-88, 0, 'E', {
                fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', fontStyle: 'bold', color: '#ffe5a5'
            }).setOrigin(.5);
            const label = this.add.text(18, 0, text, {
                fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', fontStyle: 'bold', color: '#fff0c5'
            }).setOrigin(.5);
            items.push(key, label);
        }
        const bubble = this.add.container(x, y, items).setDepth(980);
        this.tweens.add({ targets: bubble, y: y - 5, duration: 780, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        return bubble;
    }
}
//# sourceMappingURL=VillageScene.js.map