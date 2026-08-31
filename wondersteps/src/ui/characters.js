import Phaser from 'phaser';
import { colors } from '../config/theme.js';
const adiSizes = {
    idle: { w: 164, h: 310, y: -145 },
    walk: { w: 178, h: 314, y: -146 },
    interact: { w: 168, h: 310, y: -145 },
    inspect: { w: 168, h: 310, y: -145 },
    celebrate: { w: 214, h: 310, y: -145 }
};
const devSizes = {
    curious: { w: 146, h: 174 }, happy: { w: 146, h: 174 }, hint: { w: 152, h: 174 }, wonder: { w: 136, h: 174 }, surprised: { w: 138, h: 174 }
};
const devMoveSize = { w: 156, h: 184 };
function shadow(scene, width, y, alpha = .23) {
    return scene.add.ellipse(0, y, width, Math.max(14, width * .23), colors.shadow, alpha).setName('shadow');
}
export function createAdi(scene, x, y) {
    const s = shadow(scene, 92, 4, .24);
    const art = scene.add.image(0, adiSizes.idle.y, 'adi-idle').setDisplaySize(adiSizes.idle.w, adiSizes.idle.h).setName('art');
    return scene.add.container(x, y, [s, art]).setSize(180, 315).setData({ facing: 1, state: 'idle', stateLockedUntil: 0, moving: false });
}
export function setAdiState(actor, state, duration = 0) {
    const art = actor.getByName('art');
    if (!art)
        return;
    actor.setData('state', state);
    const size = adiSizes[state];
    art.setTexture(`adi-${state}`).setDisplaySize(size.w, size.h).setPosition(0, size.y).setFlipX(actor.getData('facing') === -1);
    if (duration > 0)
        actor.setData('stateLockedUntil', performance.now() + duration);
}
export function setAdiMotion(actor, moving, dx, dy, time) {
    const art = actor.getByName('art');
    const shadowObj = actor.getByName('shadow');
    if (!art)
        return;
    if (dx < -.01)
        actor.setData('facing', -1);
    if (dx > .01)
        actor.setData('facing', 1);
    if (performance.now() < Number(actor.getData('stateLockedUntil') ?? 0)) {
        art.setFlipX(actor.getData('facing') === -1);
        return;
    }
    actor.setData('moving', moving);
    if (moving) {
        if (actor.getData('state') !== 'walk')
            actor.setData('state', 'walk');
        const sideMove = Math.abs(dx) >= Math.abs(dy) * .35;
        const texture = sideMove ? 'adi-side' : 'adi-walk';
        art.setTexture(texture)
            .setDisplaySize(sideMove ? 198 : adiSizes.walk.w, sideMove ? 315 : adiSizes.walk.h)
            .setPosition(0, sideMove ? -148 : adiSizes.walk.y)
            .setFlipX(actor.getData('facing') === -1);
        const bounce = Math.abs(Math.sin(time / 88));
        art.y = (sideMove ? -148 : adiSizes.walk.y) - bounce * 5;
        art.rotation = Phaser.Math.Clamp(dx * .0035, -.045, .045);
        shadowObj?.setScale(1 - bounce * .07, 1);
    }
    else {
        if (actor.getData('state') !== 'idle')
            setAdiState(actor, 'idle');
        art.y += (adiSizes.idle.y - art.y) * .2;
        art.rotation *= .72;
        shadowObj?.setScale(1, 1);
    }
    art.setFlipX(actor.getData('facing') === -1);
}
export function playAdiAction(scene, actor, state, duration = 900) {
    setAdiState(actor, state, duration);
    if (state === 'celebrate')
        scene.tweens.add({ targets: actor, y: actor.y - 26, duration: 240, yoyo: true, repeat: 1, ease: 'Sine.Out' });
    else
        scene.tweens.add({ targets: actor, scaleX: actor.scaleX * 1.03, scaleY: actor.scaleY * 1.03, duration: 130, yoyo: true, ease: 'Sine.Out' });
}
export function createDev(scene, x, y, emotion = 'curious') {
    const glow = scene.add.circle(0, 1, 62, colors.glow, .14).setName('glow');
    const size = devSizes[emotion];
    const art = scene.add.image(0, 0, `dev-${emotion}`).setDisplaySize(size.w, size.h).setName('art');
    const dev = scene.add.container(x, y, [glow, art]).setSize(135, 155).setData({ emotion, moving: false, facing: 1, baseY: y });
    scene.tweens.add({ targets: dev, y: y - 10, duration: 1450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: glow, alpha: { from: .08, to: .26 }, scale: { from: .88, to: 1.13 }, duration: 1100, yoyo: true, repeat: -1 });
    return dev;
}
export function setDevEmotion(scene, dev, emotion) {
    const art = dev.getByName('art');
    if (!art)
        return;
    dev.setData('emotion', emotion);
    if (dev.getData('moving'))
        return;
    const size = devSizes[emotion];
    art.setTexture(`dev-${emotion}`).setDisplaySize(size.w, size.h).setAlpha(0).setScale(.88).setRotation(0);
    scene.tweens.add({ targets: art, alpha: 1, scale: 1, duration: 160, ease: 'Back.Out' });
}
export function setDevMotion(dev, moving, dx, dy, time) {
    const art = dev.getByName('art');
    const glow = dev.getByName('glow');
    if (!art)
        return;
    dev.setData('moving', moving);
    if (dx < -.01)
        dev.setData('facing', -1);
    if (dx > .01)
        dev.setData('facing', 1);
    if (moving) {
        art.setTexture('dev-side').setDisplaySize(devMoveSize.w, devMoveSize.h).setFlipX(dev.getData('facing') === -1);
        const bob = Math.sin(time / 135) * 5;
        art.y = bob * .45;
        art.rotation = Phaser.Math.Clamp(dx * .004, -.08, .08);
        glow?.setScale(1.06, 1.0);
    }
    else {
        const emotion = dev.getData('emotion');
        const size = devSizes[emotion];
        art.setTexture(`dev-${emotion}`).setDisplaySize(size.w, size.h).setFlipX(false);
        art.rotation *= .75;
        art.y *= .55;
        glow?.setScale(1, 1);
    }
}
export function pulseDev(scene, dev, emotion) {
    if (emotion)
        setDevEmotion(scene, dev, emotion);
    scene.tweens.add({ targets: dev, scale: dev.scale * 1.1, duration: 160, yoyo: true, ease: 'Back.Out' });
}
export function createMiri(scene, x, y) {
    const s = shadow(scene, 105, 3, .22);
    const art = scene.add.image(0, -118, 'miri').setDisplaySize(176, 252).setName('art');
    return scene.add.container(x, y, [s, art]).setSize(180, 258);
}
//# sourceMappingURL=characters.js.map