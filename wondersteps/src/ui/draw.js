import { colors } from '../config/theme.js';
export function roundedPanel(scene, x, y, width, height, alpha = 0.94) {
    const panel = scene.add.graphics();
    panel.fillStyle(colors.shadow, 0.13).fillRoundedRect(x + 4, y + 6, width, height, 20);
    panel.fillStyle(colors.parchment, alpha).fillRoundedRect(x, y, width, height, 20);
    panel.lineStyle(3, colors.parchmentDark, 1).strokeRoundedRect(x, y, width, height, 20);
    panel.lineStyle(1, 0xffffff, 0.36).strokeRoundedRect(x + 5, y + 5, width - 10, height - 10, 16);
    return panel;
}
export function makeText(scene, x, y, text, size = 24, color = '#332b22') {
    return scene.add.text(x, y, text, {
        fontFamily: 'Trebuchet MS, Arial, sans-serif',
        fontSize: `${size}px`,
        color,
        wordWrap: { width: 520 },
        lineSpacing: 4
    });
}
export function createButton(scene, x, y, label, onClick, width = 190) {
    const shadow = scene.add.graphics();
    const bg = scene.add.graphics();
    const leafLeft = scene.add.text(-width / 2 + 18, 0, '❧', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#6a854e' }).setOrigin(0.5);
    const leafRight = scene.add.text(width / 2 - 18, 0, '❧', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#6a854e' }).setOrigin(0.5).setScale(-1, 1);
    const text = scene.add.text(0, 0, label, { fontFamily: 'Trebuchet MS, Arial', fontSize: '21px', fontStyle: 'bold', color: '#332b22' }).setOrigin(0.5);
    const draw = (hover) => {
        shadow.clear();
        shadow.fillStyle(colors.shadow, 0.18).fillRoundedRect(-width / 2 + 3, -24, width, 56, 16);
        bg.clear();
        bg.fillStyle(hover ? 0xf9e5a6 : colors.parchment, 0.99).fillRoundedRect(-width / 2, -29, width, 56, 16);
        bg.lineStyle(3, hover ? colors.gold : colors.parchmentDark, 1).strokeRoundedRect(-width / 2, -29, width, 56, 16);
    };
    draw(false);
    const container = scene.add.container(x, y, [shadow, bg, leafLeft, leafRight, text]).setSize(width, 58).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => { draw(true); scene.tweens.add({ targets: container, scale: 1.025, duration: 90 }); });
    container.on('pointerout', () => { draw(false); scene.tweens.add({ targets: container, scale: 1, duration: 90 }); });
    container.on('pointerdown', () => { scene.tweens.add({ targets: container, scale: 0.97, duration: 70, yoyo: true }); onClick(); });
    return container;
}
//# sourceMappingURL=draw.js.map