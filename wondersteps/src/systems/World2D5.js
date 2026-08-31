import Phaser from 'phaser';
export class WalkableWorld {
    circles;
    rects;
    polygon;
    constructor(points, circles = [], rects = []) {
        this.circles = circles;
        this.rects = rects;
        this.polygon = new Phaser.Geom.Polygon(points);
    }
    contains(x, y) {
        if (!Phaser.Geom.Polygon.Contains(this.polygon, x, y))
            return false;
        if (this.circles.some(o => Phaser.Math.Distance.Between(x, y, o.x, o.y) < o.radius))
            return false;
        if (this.rects.some(r => Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(r.x, r.y, r.width, r.height), x, y)))
            return false;
        return true;
    }
    move(actor, dx, dy) {
        const nx = actor.x + dx;
        const ny = actor.y + dy;
        if (this.contains(nx, actor.y))
            actor.x = nx;
        if (this.contains(actor.x, ny))
            actor.y = ny;
    }
}
export function applyPerspective(actor, minY, maxY, minScale = .70, maxScale = 1.08) {
    const t = Phaser.Math.Clamp((actor.y - minY) / Math.max(1, maxY - minY), 0, 1);
    const scale = Phaser.Math.Linear(minScale, maxScale, t);
    actor.setScale(scale);
    actor.setDepth(Math.floor(40 + actor.y));
}
export function configureCinematicCamera(scene, target, zoom = 1.055) {
    const camera = scene.cameras.main;
    camera.setBounds(0, 0, 1600, 900);
    camera.setZoom(zoom);
    camera.startFollow(target, true, .075, .075);
    camera.setDeadzone(300, 180);
    camera.setRoundPixels(false);
}
export function updateCinematicZoom(scene, moving) {
    const camera = scene.cameras.main;
    const target = moving ? 1.035 : 1.060;
    camera.zoom = Phaser.Math.Linear(camera.zoom, target, .04);
}
export function transitionScene(scene, target, _label) {
    const camera = scene.cameras.main;
    camera.fadeOut(300, 14, 28, 22);
    scene.time.delayedCall(330, () => scene.scene.start(target));
}
//# sourceMappingURL=World2D5.js.map