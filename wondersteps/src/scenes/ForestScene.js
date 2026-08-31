import Phaser from 'phaser';
import { colors } from '../config/theme.js';
import { createAdi, createDev, playAdiAction, pulseDev, setAdiMotion, setDevEmotion, setDevMotion } from '../ui/characters.js';
import { gameState } from '../systems/GameState.js';
import { audioDirector } from '../systems/AudioDirector.js';
import { applyPerspective, configureCinematicCamera, transitionScene, updateCinematicZoom, WalkableWorld } from '../systems/World2D5.js';
import { getGameContent, locationName } from '../config/content.js';
export class ForestScene extends Phaser.Scene {
    adi;
    dev;
    cursors;
    keys;
    world;
    moveTarget = null;
    berries = [];
    backHint;
    runeHint;
    nearBack = false;
    nearRune = false;
    nearBerry = null;
    introShown = false;
    // Entry reads as the continuation of the Village's forest path.
    villageExit = new Phaser.Math.Vector2(245, 720);
    runeGround = new Phaser.Math.Vector2(1190, 365);
    constructor() { super('Forest'); }
    create() {
        gameState.setLocation('forest');
        void audioDirector.switchMusic('forest', .17, 950);
        const { width, height } = this.scale;
        // v0.4.3: one coherent painted forest plate, matching the visual density of the Village entry.
        const backdrop = this.add.image(width / 2, height / 2, 'forest-painted-v043')
            .setDisplaySize(width, height)
            .setDepth(0);
        this.tweens.add({ targets: backdrop, scaleX: 1.006, scaleY: 1.006, duration: 9800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        // Walkable corridor follows the winding central trail instead of exposing the whole screen.
        this.world = new WalkableWorld([
            90, 870,
            125, 735,
            210, 610,
            330, 515,
            470, 430,
            610, 350,
            760, 315,
            920, 340,
            1070, 400,
            1210, 490,
            1350, 610,
            1480, 760,
            1525, 870
        ], [
            { x: this.runeGround.x, y: this.runeGround.y + 30, radius: 132 }
        ]);
        this.add.image(this.villageExit.x, this.villageExit.y - 98, 'forest-entry-sign-v043')
            .setDisplaySize(190, 183)
            .setDepth(700)
            .setRotation(-.018);
        // The rune shrine is part of the painted environment; the aura and interaction are live.
        this.addRuneAura();
        this.adi = createAdi(this, 430, 775);
        this.dev = createDev(this, 300, 665, 'curious');
        applyPerspective(this.adi, 390, 870, .84, 1.22);
        applyPerspective(this.dev, 380, 825, .68, 1.00);
        configureCinematicCamera(this, this.adi, 1.055);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,E');
        this.keys.E.on('down', () => this.handleInteract());
        this.input.keyboard?.on('keydown', () => audioDirector.unlock());
        const state = gameState.snapshot();
        const remaining = [
            { x: 590, y: 705 },
            { x: 865, y: 575 },
            { x: 1260, y: 705 }
        ].slice(state.moonberries);
        for (const berry of remaining)
            this.berries.push(this.createBerry(berry.x, berry.y));
        this.backHint = this.createBubble(this.villageExit.x + 65, this.villageExit.y - 210, `E  Return to ${locationName(this, 'village', 'Sunpetal Village')}`).setVisible(false);
        this.runeHint = this.createBubble(this.runeGround.x, this.runeGround.y - 168, 'E  Inspect the ancient rune').setVisible(false);
        // Painterly foreground crops from the same forest plate create real 2.5D occlusion without an art-style mismatch.
        this.add.image(190, 710, 'forest-foreground-left-v043')
            .setDisplaySize(520, 470)
            .setDepth(900)
            .setScrollFactor(1.018)
            .setAlpha(.90);
        this.add.image(width - 190, 710, 'forest-foreground-right-v043')
            .setDisplaySize(520, 470)
            .setDepth(900)
            .setScrollFactor(1.018)
            .setAlpha(.90);
        this.input.on('pointerdown', (pointer, over) => {
            audioDirector.unlock();
            if (over.length > 0 || pointer.y < 105)
                return;
            if (this.world.contains(pointer.worldX, pointer.worldY)) {
                this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
            }
        });
        this.addForestAtmosphere();
        this.addPathLanterns();
        this.showEntryMoment();
        this.cameras.main.fadeIn(440, 10, 24, 20);
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
            const d = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.moveTarget.x, this.moveTarget.y);
            if (d < 7)
                this.moveTarget = null;
            else {
                const a = Phaser.Math.Angle.Between(this.adi.x, this.adi.y, this.moveTarget.x, this.moveTarget.y);
                dx = Math.cos(a) * speed;
                dy = Math.sin(a) * speed;
            }
        }
        const moving = Boolean(dx || dy);
        if (moving)
            this.world.move(this.adi, dx, dy);
        setAdiMotion(this.adi, moving, dx, dy, time);
        updateCinematicZoom(this, moving);
        applyPerspective(this.adi, 390, 870, .84, 1.22);
        const followX = this.adi.x - 102 * this.adi.scaleX;
        const followY = this.adi.y - 128 * this.adi.scaleY;
        this.dev.x += (followX - this.dev.x) * .072;
        this.dev.y += (followY - this.dev.y) * .072;
        applyPerspective(this.dev, 380, 825, .68, 1.00);
        setDevMotion(this.dev, moving, dx, dy, time);
        this.dev.setDepth(this.adi.depth + 3);
        this.nearBack = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.villageExit.x, this.villageExit.y) < 165;
        this.nearRune = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, this.runeGround.x, this.runeGround.y + 15) < 180;
        this.backHint.setVisible(this.nearBack);
        this.runeHint.setVisible(this.nearRune && !this.nearBack);
        const playerPosition = { location: 'forest', x: this.adi.x / 1600, y: this.adi.y / 900 };
        this.registry.set('player-position', playerPosition);
        this.registry.events.emit('player-position', playerPosition);
        this.nearBerry = null;
        let nearestBerryDistance = Number.POSITIVE_INFINITY;
        for (const berry of this.berries) {
            if (berry.collected)
                continue;
            const d = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, berry.x, berry.y);
            berry.label.setVisible(d < 210);
            if (d < nearestBerryDistance) {
                nearestBerryDistance = d;
                this.nearBerry = berry;
            }
            if (d < 135 && gameState.snapshot().questStage === 'collect-moonberries') {
                this.collectBerry(berry);
                if (this.nearBerry === berry)
                    this.nearBerry = null;
            }
        }
        if (nearestBerryDistance > 185)
            this.nearBerry = null;
    }
    handleInteract() {
        audioDirector.unlock();
        if (this.nearBerry && !this.nearBerry.collected && gameState.snapshot().questStage === 'collect-moonberries') {
            this.collectBerry(this.nearBerry);
            this.nearBerry = null;
            return;
        }
        if (this.nearBack) {
            audioDirector.playSfx('transition');
            transitionScene(this, 'Village', locationName(this, 'village', 'Sunpetal Village'));
            return;
        }
        if (this.nearRune) {
            playAdiAction(this, this.adi, 'inspect', 1000);
            setDevEmotion(this, this.dev, 'wonder');
            pulseDev(this, this.dev, 'wonder');
            this.registry.events.emit('dev-emotion', 'wonder');
            const names = getGameContent(this).characters;
            this.registry.events.emit('dialogue', names.companion.name, `The rune is humming, ${names.player.name}. Its light feels like the same magic that sleeps inside the village fountain.`);
            audioDirector.playSfx('interact');
            this.flashRune();
        }
    }
    collectBerry(berry) {
        berry.collected = true;
        gameState.collectMoonberry();
        audioDirector.playSfx('collect');
        playAdiAction(this, this.adi, 'interact', 520);
        const count = gameState.snapshot().moonberries;
        const emotion = count === 3 ? 'happy' : 'surprised';
        setDevEmotion(this, this.dev, emotion);
        pulseDev(this, this.dev, emotion);
        this.registry.events.emit('dev-emotion', emotion);
        this.registry.events.emit('dialogue', getGameContent(this).characters.companion.name, count === 3
            ? 'That’s all three! The path back to Miri feels brighter already.'
            : count === 2
                ? 'Two Moonberries! I can feel one more little pulse somewhere deeper in the grove.'
                : 'A Moonberry! Its glow matches the tiny lights drifting between the trees.');
        const targets = [berry.art, berry.glow, berry.label];
        this.tweens.add({ targets, alpha: 0, scale: 1.55, duration: 280, ease: 'Quad.In', onComplete: () => targets.forEach(target => target.destroy()) });
    }
    createBerry(x, y) {
        const glow = this.add.circle(x, y, 64, colors.berryLight, .13).setDepth(Math.floor(y));
        const ring = this.add.circle(x, y + 5, 42, 0xffe9a4, .04).setStrokeStyle(2, 0xffedac, .25).setDepth(Math.floor(y + 1));
        const art = this.add.image(x, y, 'moonberry').setDisplaySize(98, 98).setDepth(Math.floor(y + 2)).setInteractive({ useHandCursor: true });
        const label = this.createBubble(x, y - 88, 'Moonberry  •  move closer or press E').setVisible(false);
        const node = { x, y, art, glow, label, collected: false };
        art.on('pointerdown', () => {
            audioDirector.unlock();
            const d = Phaser.Math.Distance.Between(this.adi.x, this.adi.y, x, y);
            if (d < 185 && gameState.snapshot().questStage === 'collect-moonberries')
                this.collectBerry(node);
        });
        this.tweens.add({ targets: art, y: y - 8, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        this.tweens.add({ targets: glow, alpha: { from: .08, to: .28 }, scale: { from: .90, to: 1.13 }, duration: 900, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: ring, alpha: { from: .04, to: .24 }, scale: { from: .85, to: 1.30 }, duration: 1250, yoyo: true, repeat: -1 });
        return node;
    }
    createBubble(x, y, text) {
        const bg = this.add.graphics();
        bg.fillStyle(0x152820, .94).fillRoundedRect(-138, -25, 276, 50, 15);
        bg.lineStyle(2, 0xd7b969, .92).strokeRoundedRect(-138, -25, 276, 50, 15);
        const t = this.add.text(0, 0, text, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', fontStyle: 'bold', color: '#fff1c9'
        }).setOrigin(.5);
        const c = this.add.container(x, y, [bg, t]).setDepth(950);
        this.tweens.add({ targets: c, y: y - 5, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        return c;
    }
    addRuneAura() {
        for (let i = 0; i < 9; i++) {
            const angle = (Math.PI * 2 * i) / 9;
            const radius = Phaser.Math.Between(54, 92);
            const p = this.add.circle(this.runeGround.x + Math.cos(angle) * radius, this.runeGround.y - 108 + Math.sin(angle) * radius * .55, Phaser.Math.Between(2, 4), Phaser.Utils.Array.GetRandom([0x8defff, 0xb9f7e6, 0x7fd4ff]), Phaser.Math.FloatBetween(.35, .72)).setDepth(470);
            this.tweens.add({ targets: p, y: p.y - Phaser.Math.Between(18, 46), alpha: 0, duration: Phaser.Math.Between(1000, 1900), repeat: -1, delay: Phaser.Math.Between(0, 900) });
        }
    }
    flashRune() {
        const halo = this.add.circle(this.runeGround.x, this.runeGround.y - 108, 78, 0x83eaff, .20).setDepth(468);
        const core = this.add.circle(this.runeGround.x, this.runeGround.y - 108, 24, 0xc4fbff, .20).setDepth(469);
        this.tweens.add({ targets: halo, scale: 1.8, alpha: 0, duration: 760, onComplete: () => halo.destroy() });
        this.tweens.add({ targets: core, scale: 1.35, alpha: 0, duration: 520, onComplete: () => core.destroy() });
        this.cameras.main.flash(180, 94, 206, 224, false);
    }
    addPathLanterns() {
        const points = [
            { x: 315, y: 610, warm: true },
            { x: 520, y: 472, warm: true },
            { x: 735, y: 385, warm: false },
            { x: 1020, y: 430, warm: false }
        ];
        for (const point of points) {
            const color = point.warm ? 0xffd58a : 0x8ee8d7;
            const light = this.add.circle(point.x, point.y, 7, color, .68).setDepth(18);
            const halo = this.add.circle(point.x, point.y, 28, color, .08).setDepth(17);
            this.tweens.add({ targets: [light, halo], alpha: { from: point.warm ? .45 : .35, to: .82 }, scale: { from: .92, to: 1.12 }, duration: Phaser.Math.Between(1000, 1600), yoyo: true, repeat: -1 });
        }
    }
    showEntryMoment() {
        if (this.introShown)
            return;
        this.introShown = true;
        const title = this.add.text(this.scale.width / 2, 150, locationName(this, 'forest', 'Whispering Forest').toUpperCase(), {
            fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'bold', color: '#fff2c8',
            stroke: '#10281e', strokeThickness: 7
        }).setOrigin(.5).setDepth(1100).setAlpha(0);
        const subtitle = this.add.text(this.scale.width / 2, 193, 'Follow the lights. Listen for what the forest remembers.', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', color: '#dcead7',
            stroke: '#10281e', strokeThickness: 4
        }).setOrigin(.5).setDepth(1100).setAlpha(0);
        this.tweens.add({ targets: [title, subtitle], alpha: 1, y: '-=8', duration: 480, hold: 1300, yoyo: true, onComplete: () => { title.destroy(); subtitle.destroy(); } });
        this.time.delayedCall(720, () => {
            this.registry.events.emit('dev-emotion', 'wonder');
            setDevEmotion(this, this.dev, 'wonder');
        });
    }
    addForestAtmosphere() {
        const { width, height } = this.scale;
        // Fireflies and drifting motes.
        for (let i = 0; i < 42; i++) {
            const x = Phaser.Math.Between(70, width - 70);
            const y = Phaser.Math.Between(180, height - 70);
            const f = this.add.circle(x, y, Phaser.Math.Between(2, 4), Phaser.Utils.Array.GetRandom([0xa9efd4, 0xefe2a2, 0x84d8e8]), Phaser.Math.FloatBetween(.15, .58)).setDepth(16);
            this.tweens.add({
                targets: f,
                x: x + Phaser.Math.Between(-50, 50),
                y: y + Phaser.Math.Between(-55, 30),
                alpha: { from: f.alpha, to: .03 },
                duration: Phaser.Math.Between(1700, 3600),
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 1400),
                ease: 'Sine.InOut'
            });
        }
        // Low fog ribbons add depth without obscuring actors.
        for (let i = 0; i < 5; i++) {
            const fog = this.add.ellipse(Phaser.Math.Between(320, 1280), Phaser.Math.Between(470, 720), Phaser.Math.Between(220, 380), Phaser.Math.Between(35, 60), 0xc7e4d8, Phaser.Math.FloatBetween(.025, .055)).setDepth(8);
            this.tweens.add({ targets: fog, x: fog.x + Phaser.Math.Between(-120, 120), alpha: { from: fog.alpha, to: .01 }, duration: Phaser.Math.Between(6000, 9000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        }
    }
}
//# sourceMappingURL=ForestScene.js.map