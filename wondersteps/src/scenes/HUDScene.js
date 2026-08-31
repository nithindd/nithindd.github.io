import Phaser from 'phaser';
import { gameState } from '../systems/GameState.js';
import { companionDirector } from '../systems/CompanionDirector.js';
import { audioDirector } from '../systems/AudioDirector.js';
import { getGameContent, locationName } from '../config/content.js';
const CREAM = 0xf3ead1;
const EDGE = 0xc79a58;
const DARK = '#513921';
const MUTED = '#6d553b';
export class HUDScene extends Phaser.Scene {
    questPanel;
    questText;
    questProgress;
    questBadge;
    heartValue;
    starValue;
    pageValue;
    companionPanel;
    companionPortrait;
    companionName;
    companionTip;
    currentEmotion = 'curious';
    companionFullText = '';
    dialoguePanel;
    dialogueSpeaker;
    dialogueText;
    dialoguePortrait;
    rewardPanel;
    rewardTitle;
    rewardSubtitle;
    minimapRoot;
    minimapMarker;
    minimapLabelTop;
    minimapLabelBottom;
    minimapView;
    clockText;
    constructor() { super('HUD'); }
    create() {
        const { width, height } = this.scale;
        this.createQuestPanel();
        this.createHomeButton();
        this.createCounters(width);
        this.createCompanionPanel(height);
        this.createActionDock(width, height);
        this.createMinimap(width, height);
        this.dialoguePanel = this.createDialoguePanel(width / 2, height - 145).setVisible(false);
        this.rewardPanel = this.createRewardPanel(width / 2, height * .30).setVisible(false);
        this.registry.events.on('dialogue', this.showDialogue, this);
        this.registry.events.on('reward', this.showReward, this);
        this.registry.events.on('dev-emotion', this.setDevEmotion, this);
        this.registry.events.on('memory-unlocked', this.onMemoryUnlocked, this);
        this.registry.events.on('player-position', this.updateMinimap, this);
        gameState.events.on('changed', this.refresh, this);
        this.events.once('shutdown', () => {
            gameState.events.off('changed', this.refresh, this);
            this.registry.events.off('dialogue', this.showDialogue, this);
            this.registry.events.off('reward', this.showReward, this);
            this.registry.events.off('dev-emotion', this.setDevEmotion, this);
            this.registry.events.off('memory-unlocked', this.onMemoryUnlocked, this);
            this.registry.events.off('player-position', this.updateMinimap, this);
        });
        this.input.keyboard?.on('keydown-M', () => this.openMap());
        this.input.keyboard?.on('keydown-J', () => this.openBook());
        this.input.keyboard?.on('keydown-B', () => this.openBook());
        this.input.keyboard?.on('keydown-I', () => this.openInventory());
        this.input.keyboard?.on('keydown-E', () => this.emitInteractPulse());
        this.input.keyboard?.on('keydown-H', () => this.goHome());
        this.refresh(gameState.snapshot());
        this.updateMinimap(this.registry.get('player-position') ?? {
            location: gameState.snapshot().location,
            x: .50,
            y: .72
        });
        void this.setInitialHint();
        this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickClock() });
        this.tickClock();
    }
    drawParchment(width, height, radius, shadow = true) {
        const g = this.add.graphics();
        if (shadow)
            g.fillStyle(0x000000, .20).fillRoundedRect(4, 5, width, height, radius);
        g.fillStyle(CREAM, .98).fillRoundedRect(0, 0, width, height, radius);
        g.lineStyle(3, EDGE, .95).strokeRoundedRect(0, 0, width, height, radius);
        g.lineStyle(1, 0xfff6df, .65).strokeRoundedRect(5, 5, width - 10, height - 10, Math.max(8, radius - 4));
        return g;
    }
    createQuestPanel() {
        const names = getGameContent(this).characters;
        const bg = this.drawParchment(350, 122, 18);
        const portraitFrame = this.add.circle(44, 38, 28, 0x7b562f, .94).setStrokeStyle(3, 0xe8d7ad, 1);
        const portrait = this.add.image(44, 38, 'adi-idle').setDisplaySize(54, 84);
        const title = this.add.text(84, 16, 'Current Quest', {
            fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: '#4e3a23'
        });
        this.questText = this.add.text(84, 45, '', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '17px', fontStyle: 'bold', color: DARK, wordWrap: { width: 242 }, lineSpacing: 4
        });
        this.questBadge = this.add.text(84, 88, '◆', {
            fontFamily: 'Georgia, serif', fontSize: '18px', color: '#71542f'
        });
        this.questProgress = this.add.text(104, 87, '', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', color: MUTED
        });
        const hint = this.add.text(324, 96, 'Q', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '12px', fontStyle: 'bold', color: '#7a6544'
        }).setOrigin(.5);
        this.questPanel = this.add.container(18, 18, [bg, portraitFrame, portrait, title, this.questText, this.questBadge, this.questProgress, hint]).setDepth(1100);
        this.questPanel.setInteractive(new Phaser.Geom.Rectangle(0, 0, 350, 122), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => {
            this.registry.events.emit('dialogue', names.companion.name, `${names.player.name}'s next step: ${this.questText.text}`);
        });
    }
    createHomeButton() {
        const bg = this.drawParchment(86, 42, 14);
        const icon = this.add.text(22, 21, '⌂', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#7b592f' }).setOrigin(.5);
        const label = this.add.text(51, 21, 'Home', { fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', fontStyle: 'bold', color: DARK }).setOrigin(.5);
        const btn = this.add.container(376, 22, [bg, icon, label]).setDepth(1100).setSize(86, 42).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.goHome());
    }

    createCounters(width) {
        const makeCard = (x, title, key) => {
            const bg = this.drawParchment(146, 74, 14);
            const iconMap = {
                heart: ['♥', '#d96a69'],
                star: ['★', '#d5a53d'],
                page: ['▤', '#8c6d46']
            };
            const [glyph, color] = iconMap[key];
            const icon = this.add.text(20, 23, glyph, { fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color }).setOrigin(.5);
            const titleText = this.add.text(40, 12, title, { fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', fontStyle: 'bold', color: DARK });
            const value = this.add.text(40, 36, '0', { fontFamily: 'Trebuchet MS, Arial', fontSize: '24px', fontStyle: 'bold', color: DARK });
            const suffix = this.add.text(85, 40, key === 'star' ? '/ 20' : key === 'page' ? '/ 30' : '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', color: MUTED });
            this.add.container(x, 18, [bg, icon, titleText, value, suffix]).setDepth(1100);
            if (key === 'heart')
                this.heartValue = value;
            if (key === 'star')
                this.starValue = value;
            if (key === 'page')
                this.pageValue = value;
        };
        makeCard(width - 468, 'Friendship Hearts', 'heart');
        makeCard(width - 314, 'Restoration Stars', 'star');
        makeCard(width - 160, 'Memory Pages', 'page');
    }
    createCompanionPanel(height) {
        const names = getGameContent(this).characters;
        const bg = this.drawParchment(275, 128, 18);
        this.companionPortrait = this.add.image(42, 66, 'dev-curious').setDisplaySize(76, 94);
        const nameBg = this.add.graphics();
        nameBg.fillStyle(0x5e863a, 1).fillRoundedRect(70, 10, 92, 28, 10);
        nameBg.lineStyle(2, 0x9eb76d, .9).strokeRoundedRect(70, 10, 92, 28, 10);
        this.companionName = this.add.text(116, 24, names.companion.name, { fontFamily: 'Georgia, serif', fontSize: '18px', fontStyle: 'bold', color: '#fff6dd' }).setOrigin(.5);
        this.companionTip = this.add.text(84, 50, '', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', color: DARK, wordWrap: { width: 170 }, lineSpacing: 4, maxLines: 4
        });
        const sparkle = this.add.text(246, 110, '✦', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#d2ab58' }).setOrigin(.5);
        this.companionPanel = this.add.container(14, height - 150, [bg, this.companionPortrait, nameBg, this.companionName, this.companionTip, sparkle])
            .setDepth(1100)
            .setSize(275, 128)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => void this.askDev());
    }
    createActionDock(width, height) {
        const dock = this.add.container(width / 2, height - 68).setDepth(1100);
        const buttons = [
            this.createActionButton(-165, 0, '◌◌◌', 'Interact', 'E', () => this.emitInteractPulse()),
            this.createActionButton(-55, 0, '▤', 'Journal', 'J', () => this.openBook()),
            this.createActionButton(55, 0, '🗺', 'Map', 'M', () => this.openMap()),
            this.createActionButton(165, 0, '◔', 'Inventory', 'I', () => this.openInventory())
        ];
        dock.add(buttons);
    }
    createActionButton(x, y, glyph, label, key, action) {
        const bg = this.drawParchment(90, 78, 18);
        const icon = this.add.text(45, 28, glyph, { fontFamily: 'Georgia, serif', fontSize: label === 'Map' ? '22px' : '25px', color: '#7b592f' }).setOrigin(.5);
        const text = this.add.text(45, 50, label, { fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', fontStyle: 'bold', color: DARK }).setOrigin(.5);
        const keyBadge = this.add.text(45, 71, key, { fontFamily: 'Trebuchet MS, Arial', fontSize: '12px', fontStyle: 'bold', color: '#7b6544' }).setOrigin(.5);
        const button = this.add.container(x, y, [bg, icon, text, keyBadge]).setSize(90, 78).setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            audioDirector.unlock();
            this.tweens.add({ targets: button, scale: .93, duration: 70, yoyo: true });
            action();
        });
        return button;
    }
    createMinimap(width, height) {
        const cx = width - 120;
        const cy = height - 126;
        const frame = this.add.graphics().setDepth(1100);
        frame.fillStyle(0x5c4a2d, .30).fillCircle(cx + 4, cy + 4, 103);
        frame.fillStyle(0xe5d2a7, 1).fillCircle(cx, cy, 103);
        frame.lineStyle(5, 0xa8783d, .96).strokeCircle(cx, cy, 103);
        frame.lineStyle(2, 0xf8eed2, .55).strokeCircle(cx, cy, 95);
        const currentLocation = gameState.snapshot().location;
        this.minimapView = this.add.image(cx, cy, currentLocation === 'forest' ? 'forest-painted' : 'village-painted').setDisplaySize(220, 220).setDepth(1101);
        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff).fillCircle(cx, cy, 92);
        this.minimapView.setMask(new Phaser.Display.Masks.GeometryMask(this, maskShape));
        const ring = this.add.graphics().setDepth(1102);
        ring.lineStyle(1, 0xfaf1d8, .35).strokeCircle(cx, cy, 70);
        ring.lineStyle(1, 0xfaf1d8, .2).strokeCircle(cx, cy, 42);
        this.minimapMarker = this.add.circle(cx, cy, 6, 0x4e92ff, 1).setStrokeStyle(2, 0xffffff, 1).setDepth(1103);
        const compass = this.add.text(cx, cy - 84, 'N', { fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: '#7b592f' }).setOrigin(.5).setDepth(1103);
        this.minimapLabelTop = this.add.text(cx + 26, cy + 24, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '13px', fontStyle: 'bold', color: '#f4e7c1', stroke: '#39502e', strokeThickness: 3 }).setOrigin(.5).setDepth(1103);
        this.minimapLabelBottom = this.add.text(cx + 10, cy + 58, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '13px', fontStyle: 'bold', color: '#f4e7c1', stroke: '#39502e', strokeThickness: 3 }).setOrigin(.5).setDepth(1103);
        const zoom = this.add.text(cx + 79, cy + 84, '⌕', { fontFamily: 'Arial', fontSize: '22px', color: '#f7ebcd' }).setOrigin(.5).setDepth(1104);
        this.clockText = this.add.text(cx, cy + 114, '09:42 AM', { fontFamily: 'Trebuchet MS, Arial', fontSize: '14px', color: '#f4e7c1', backgroundColor: '#6b7b2a', padding: { x: 10, y: 4 } }).setOrigin(.5).setDepth(1103);
        this.minimapRoot = this.add.container(0, 0, [frame, this.minimapView, ring, this.minimapMarker, compass, this.minimapLabelTop, this.minimapLabelBottom, zoom, this.clockText])
            .setDepth(1100)
            .setSize(220, 244)
            .setInteractive(new Phaser.Geom.Rectangle(cx - 110, cy - 110, 220, 244), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.openMap());
    }
    updateMinimap(position) {
        const cx = this.scale.width - 120;
        const cy = this.scale.height - 126;
        this.minimapView.setTexture(position.location === 'forest' ? 'forest-painted' : 'village-painted');
        this.minimapMarker.setPosition(cx - 28 + position.x * 60, cy - 8 + position.y * 48);
        if (position.location === 'forest') {
            this.minimapLabelTop.setText(locationName(this, 'forest', 'Whispering Forest'));
            this.minimapLabelBottom.setText('Forest Path');
        }
        else {
            this.minimapLabelTop.setText(locationName(this, 'village', 'Sunpetal Village'));
            this.minimapLabelBottom.setText('Village Plaza');
        }
    }
    tickClock() {
        const now = new Date();
        const hh = now.getHours();
        const mm = now.getMinutes().toString().padStart(2, '0');
        const hour12 = ((hh + 11) % 12) + 1;
        const suffix = hh >= 12 ? 'PM' : 'AM';
        if (this.clockText)
            this.clockText.setText(`${hour12.toString().padStart(2, '0')}:${mm} ${suffix}`);
    }
    createDialoguePanel(x, y) {
        const bg = this.drawParchment(620, 112, 20);
        const portrait = this.add.image(52, 58, 'dev-curious').setDisplaySize(72, 86);
        this.dialoguePortrait = portrait;
        this.dialogueSpeaker = this.add.text(102, 18, '', { fontFamily: 'Georgia, serif', fontSize: '24px', fontStyle: 'bold', color: DARK });
        this.dialogueText = this.add.text(102, 50, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', color: DARK, wordWrap: { width: 410 }, lineSpacing: 5 });
        const close = this.add.text(573, 93, 'tap to close', { fontFamily: 'Trebuchet MS, Arial', fontSize: '12px', color: MUTED }).setOrigin(1, .5);
        return this.add.container(x - 310, y - 56, [bg, portrait, this.dialogueSpeaker, this.dialogueText, close])
            .setDepth(1300)
            .setSize(620, 112)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.dialoguePanel.setVisible(false));
    }
    createRewardPanel(x, y) {
        const bg = this.drawParchment(510, 138, 22);
        const star = this.add.text(70, 69, '★', { fontFamily: 'Georgia, serif', fontSize: '62px', color: '#d9af48' }).setOrigin(.5);
        this.rewardTitle = this.add.text(128, 40, '', { fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold', color: DARK });
        this.rewardSubtitle = this.add.text(128, 78, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', color: MUTED, wordWrap: { width: 320 } });
        return this.add.container(x - 255, y - 69, [bg, star, this.rewardTitle, this.rewardSubtitle]).setDepth(1400);
    }
    showDialogue(speaker, text) {
        this.dialogueSpeaker.setText(speaker);
        this.dialogueText.setText(text);
        if (speaker.toLowerCase().includes('miri')) {
            this.dialoguePortrait.setTexture('miri').setDisplaySize(70, 96);
        }
        else {
            this.dialoguePortrait.setTexture(`dev-${this.currentEmotion}`).setDisplaySize(72, 86);
        }
        this.dialoguePanel.setVisible(true).setAlpha(0).setScale(.96);
        this.tweens.add({ targets: this.dialoguePanel, alpha: 1, scale: 1, duration: 180, ease: 'Back.Out' });
    }
    showReward(title, subtitle) {
        this.rewardTitle.setText(title);
        this.rewardSubtitle.setText(subtitle);
        this.rewardPanel.setVisible(true).setAlpha(0).setScale(.82);
        this.tweens.add({ targets: this.rewardPanel, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out', hold: 1300, yoyo: true, onComplete: () => this.rewardPanel.setVisible(false) });
    }
    setDevEmotion(emotion) {
        this.currentEmotion = emotion;
        if (this.companionPortrait)
            this.companionPortrait.setTexture(`dev-${emotion}`);
    }
    setDevLine(text, emotion) {
        this.companionFullText = text;
        this.setDevEmotion(emotion);
        this.companionTip.setText(this.formatCompanionTip(text));
    }
    formatCompanionTip(text) {
        const clean = text.trim().replace(/\s+/g, ' ');
        return clean.length > 62 ? `${clean.slice(0, 59)}…` : clean;
    }
    async setInitialHint() {
        const line = await companionDirector.getHint(gameState.snapshot());
        this.setDevLine(line.text, line.emotion);
        this.registry.events.emit('dev-emotion', line.emotion);
    }
    async askDev() {
        audioDirector.unlock();
        const line = await companionDirector.getHint(gameState.snapshot());
        this.setDevLine(line.text, line.emotion);
        this.registry.events.emit('dev-emotion', line.emotion);
    }
    openMap() {
        audioDirector.playSfx('page');
        if (!this.scene.isActive('Map'))
            this.scene.launch('Map');
    }
    openBook() {
        audioDirector.playSfx('page');
        if (!this.scene.isActive('MemoryBook'))
            this.scene.launch('MemoryBook');
    }
    openInventory() {
        audioDirector.playSfx('interact');
        this.registry.events.emit('dialogue', getGameContent(this).characters.companion.name, 'Inventory is ready for the next build. For now, your journey items stay with you automatically.');
    }
    emitInteractPulse() {
        audioDirector.unlock();
        this.tweens.add({ targets: this.questPanel, scale: 1.02, duration: 70, yoyo: true });
    }
    goHome() {
        audioDirector.playSfx('page');
        const currentScene = gameState.snapshot().location === 'forest' ? 'Forest' : 'Village';
        if (this.scene.isActive('Map')) this.scene.stop('Map');
        if (this.scene.isActive('MemoryBook')) this.scene.stop('MemoryBook');
        if (this.scene.isActive(currentScene)) this.scene.stop(currentScene);
        this.scene.stop();
        this.scene.start('Title');
    }
    onMemoryUnlocked() {
        this.tweens.add({ targets: this.companionPanel, scale: 1.04, duration: 180, yoyo: true, repeat: 2, ease: 'Back.Out' });
        this.setDevLine('We made a new memory. Let’s keep it safe in the journal!', 'happy');
    }
    refresh(save) {
        const quest = this.getQuestText(save);
        this.questText.setText(quest.title);
        this.questProgress.setText(quest.progress);
        this.heartValue.setText(String(save.friendshipHearts));
        this.starValue.setText(String(save.restorationStars));
        this.pageValue.setText(String(save.memoryPages));
    }
    getQuestText(save) {
        if (save.questStage === 'meet-miri') {
            return { title: `Talk to ${getGameContent(this).characters.baker.name}.`, progress: 'Begin the village story' };
        }
        if (save.questStage === 'collect-moonberries') {
            return { title: 'Gather 3 Moonberries for the baker.', progress: `${save.moonberries} / 3` };
        }
        if (save.questStage === 'return-to-miri') {
            return { title: `Return the Moonberries to ${getGameContent(this).characters.baker.name}.`, progress: 'Ready to restore the fountain' };
        }
        return { title: 'The fountain remembers its song.', progress: 'Village restored' };
    }
}
//# sourceMappingURL=HUDScene.js.map
