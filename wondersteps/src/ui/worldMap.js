import Phaser from 'phaser';
import { getActiveWorld } from '../config/content.js';
const VIRTUAL_W = 1200;
const VIRTUAL_H = 760;
export function mapPosition(position) {
    if (position.location === 'forest') {
        return new Phaser.Math.Vector2(Phaser.Math.Clamp(930 + (position.x - .55) * 250, 790, 1060), Phaser.Math.Clamp(245 + (position.y - .62) * 170, 145, 340));
    }
    return new Phaser.Math.Vector2(Phaser.Math.Clamp(595 + (position.x - .5) * 310, 430, 760), Phaser.Math.Clamp(405 + (position.y - .68) * 190, 320, 510));
}
function p(localX, localY, width, height) {
    return new Phaser.Math.Vector2(-width / 2 + (localX / VIRTUAL_W) * width, -height / 2 + (localY / VIRTUAL_H) * height);
}
function addLabel(scene, x, y, text, size, color) {
    return scene.add.text(x, y, text, {
        fontFamily: 'Georgia, serif',
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color,
        align: 'center',
        stroke: '#f5e2b5',
        strokeThickness: Math.max(0, Math.round(size * 0.10))
    }).setOrigin(.5);
}
function addPin(scene, x, y, fill, stroke, kind) {
    const items = [];
    items.push(scene.add.circle(0, 0, 15, fill, 1).setStrokeStyle(3, stroke, 1));
    if (kind === 'house') {
        const roof = scene.add.triangle(0, -2, -8, 4, 0, -6, 8, 4, fill, .96).setStrokeStyle(2, stroke, 1);
        const body = scene.add.rectangle(0, 8, 12, 10, 0xf8efcf, .96).setStrokeStyle(2, stroke, 1);
        items.push(roof, body);
    }
    else if (kind === 'lake') {
        items.push(scene.add.circle(0, 0, 6, 0xd8f5ff, .95));
        items.push(scene.add.arc(0, 1, 9, 210, 330, false, 0x58abc0, 0).setStrokeStyle(2, stroke, 1));
    }
    else {
        items.push(scene.add.triangle(0, 0, 0, -8, 8, 8, -8, 8, 0xffec8c, .98).setStrokeStyle(2, stroke, 1));
    }
    return scene.add.container(x, y, items);
}
export function createWonderwoodMap(scene, x, y, width, height, showLabels = true) {
    const root = scene.add.container(x, y);
    const world = getActiveWorld(scene);
    const locations = world.locations ?? {};
    const path = scene.add.graphics();
    const pathPts = [
        p(115, 580, width, height), p(250, 480, width, height), p(375, 430, width, height), p(455, 360, width, height),
        p(610, 285, width, height), p(790, 325, width, height), p(915, 390, width, height), p(1095, 230, width, height)
    ];
    path.lineStyle(Math.max(4, width * 0.018), 0xb79762, .92).strokePoints(pathPts, false);
    path.lineStyle(Math.max(1, width * 0.0032), 0x765a3e, .48).strokePoints(pathPts, false);
    root.add(path);
    const regions = [
        { x: 595, y: 405, rx: 205, ry: 120, fill: 0x93c87d, stroke: 0x507a50, label: locations.village ?? 'Sunpetal Village', labelY: 522, kind: 'house' },
        { x: 930, y: 235, rx: 185, ry: 125, fill: 0x4f7b5f, stroke: 0x315340, label: locations.forest ?? 'Whispering Forest', labelY: 388, kind: 'rune' },
        { x: 330, y: 555, rx: 175, ry: 105, fill: 0xb2ca6b, stroke: 0x718347, label: locations.melodyHills ?? 'Melody Hills', labelY: 688, kind: 'house' },
        { x: 820, y: 565, rx: 170, ry: 95, fill: 0xb693cb, stroke: 0x745e82, label: locations.starlightRuins ?? 'Starlight Ruins', labelY: 696, kind: 'house' },
        { x: 565, y: 170, rx: 185, ry: 90, fill: 0x8cc5cf, stroke: 0x4d7982, label: locations.moonpond ?? 'Moonpond Lake', labelY: 88, kind: 'lake' }
    ];
    for (const region of regions) {
        const center = p(region.x, region.y, width, height);
        const ellipse = scene.add.ellipse(center.x, center.y, region.rx * 2 * (width / VIRTUAL_W), region.ry * 2 * (height / VIRTUAL_H), region.fill, .98)
            .setStrokeStyle(Math.max(2, width * 0.0045), region.stroke, 1);
        root.add(ellipse);
        const icon = addPin(scene, center.x, center.y, 0xf0d170, region.stroke, region.kind);
        root.add(icon);
        if (showLabels) {
            const pos = p(region.x, region.labelY, width, height);
            const label = addLabel(scene, pos.x, pos.y, region.label, Math.max(12, Math.round(width * 0.028)), '#4d3922');
            root.add(label);
        }
    }
    const halo = scene.add.circle(0, 0, Math.max(7, width * 0.022), 0xffdf74, .22);
    const arrow = scene.add.text(0, -1, '▲', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(12, Math.round(width * 0.04))}px`,
        fontStyle: 'bold',
        color: '#ffd64c',
        stroke: '#4c3923',
        strokeThickness: Math.max(2, Math.round(width * 0.006))
    }).setOrigin(.5);
    const marker = scene.add.container(0, 0, [halo, arrow]);
    scene.tweens.add({ targets: halo, alpha: { from: .10, to: .44 }, scale: { from: .84, to: 1.22 }, duration: 760, yoyo: true, repeat: -1 });
    root.add(marker);
    return { root, marker };
}
export function placeMapMarker(marker, position, _x, _y, width, height) {
    const pos = mapPosition(position);
    marker.setPosition(-width / 2 + (pos.x / VIRTUAL_W) * width, -height / 2 + (pos.y / VIRTUAL_H) * height);
}
//# sourceMappingURL=worldMap.js.map