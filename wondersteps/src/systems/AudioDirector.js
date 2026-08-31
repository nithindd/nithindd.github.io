const TRACKS = {
    village: 'assets/audio/a-kindness-remembers.ogg',
    forest: 'assets/audio/v048/whispering-forest-loop.ogg',
    restored: 'assets/audio/v048/village-restored-loop.ogg'
};
class AudioDirector {
    ctx = null;
    muted = false;
    music = null;
    cue = null;
    musicStarted = false;
    targetMusicVolume = .22;
    fadeTimer = null;
    currentTrack = 'village';
    requestedTrack = 'village';
    restorationSequenceRunning = false;
    userActivated = false;
    get isMuted() { return this.muted; }
    get activeTrack() { return this.currentTrack; }
    unlock() {
        this.userActivated = true;
        if (this.ctx) {
            if (this.ctx.state === 'suspended')
                void this.ctx.resume();
        }
        else {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx)
                this.ctx = new AudioCtx();
        }
        this.ensureMusic(this.requestedTrack);
        if (!this.muted && !this.musicStarted && !this.restorationSequenceRunning)
            void this.startMusic();
    }
    ensureMusic(track = this.requestedTrack) {
        if (!this.music) {
            const music = new Audio();
            music.loop = true;
            music.preload = 'auto';
            music.volume = 0;
            music.muted = this.muted;
            music.crossOrigin = 'anonymous';
            music.addEventListener('playing', () => { this.musicStarted = true; });
            music.addEventListener('pause', () => { if (!this.restorationSequenceRunning)
                this.musicStarted = false; });
            this.music = music;
        }
        if (this.currentTrack === track && this.music.src.includes(TRACKS[track]))
            return;
        this.music.pause();
        this.music.src = TRACKS[track];
        this.music.load();
        this.currentTrack = track;
        this.musicStarted = false;
    }
    async startMusic() {
        this.ensureMusic(this.requestedTrack);
        if (!this.music || this.muted || this.restorationSequenceRunning || !this.userActivated)
            return;
        try {
            await this.music.play();
            this.musicStarted = true;
            this.fadeMusicTo(this.targetMusicVolume, 950);
        }
        catch {
            this.musicStarted = false;
        }
    }
    async switchMusic(track, volume, fadeMs = 900) {
        this.requestedTrack = track;
        if (typeof volume === 'number')
            this.targetMusicVolume = Math.max(0, Math.min(1, volume));
        if (this.restorationSequenceRunning)
            return;
        if (!this.music)
            this.ensureMusic(track);
        if (this.currentTrack === track) {
            if (this.userActivated && !this.muted && !this.musicStarted)
                await this.startMusic();
            else if (!this.muted && this.musicStarted)
                this.fadeMusicTo(this.targetMusicVolume, Math.min(450, fadeMs));
            return;
        }
        const old = this.music;
        if (old && this.musicStarted) {
            await this.fadeElement(old, 0, Math.max(180, fadeMs));
            old.pause();
        }
        this.ensureMusic(track);
        if (this.userActivated && !this.muted)
            await this.startMusic();
    }
    fadeMusicTo(target, durationMs) {
        if (!this.music)
            return;
        if (this.fadeTimer !== null)
            window.clearInterval(this.fadeTimer);
        const element = this.music;
        const start = element.volume;
        const startTime = performance.now();
        this.fadeTimer = window.setInterval(() => {
            if (this.music !== element) {
                if (this.fadeTimer !== null)
                    window.clearInterval(this.fadeTimer);
                this.fadeTimer = null;
                return;
            }
            const t = Math.min(1, (performance.now() - startTime) / durationMs);
            element.volume = start + (target - start) * t;
            if (t >= 1 && this.fadeTimer !== null) {
                window.clearInterval(this.fadeTimer);
                this.fadeTimer = null;
            }
        }, 40);
    }
    fadeElement(element, target, durationMs) {
        return new Promise(resolve => {
            const start = element.volume;
            const startTime = performance.now();
            const timer = window.setInterval(() => {
                const t = Math.min(1, (performance.now() - startTime) / durationMs);
                element.volume = start + (target - start) * t;
                if (t >= 1) {
                    window.clearInterval(timer);
                    resolve();
                }
            }, 35);
        });
    }
    async playFountainRestorationSequence(onCelebration) {
        this.unlock();
        if (this.restorationSequenceRunning)
            return;
        this.restorationSequenceRunning = true;
        this.requestedTrack = 'restored';
        if (this.music && this.musicStarted) {
            await this.fadeElement(this.music, 0, 650);
            this.music.pause();
            this.musicStarted = false;
        }
        if (this.muted) {
            this.restorationSequenceRunning = false;
            this.ensureMusic('restored');
            return;
        }
        const cue = new Audio('assets/audio/v048/fountain-awakens-cue.ogg');
        cue.preload = 'auto';
        cue.volume = .38;
        cue.crossOrigin = 'anonymous';
        cue.muted = this.muted;
        this.cue = cue;
        try {
            await cue.play();
            window.setTimeout(() => onCelebration?.(), 900);
            await new Promise(resolve => {
                const fallback = window.setTimeout(resolve, 22400);
                cue.addEventListener('ended', () => { window.clearTimeout(fallback); resolve(); }, { once: true });
            });
        }
        catch {
            onCelebration?.();
        }
        finally {
            cue.pause();
            this.cue = null;
            this.restorationSequenceRunning = false;
            this.ensureMusic('restored');
            if (!this.muted)
                await this.startMusic();
        }
    }
    toggle() {
        this.muted = !this.muted;
        if (this.music)
            this.music.muted = this.muted;
        if (this.cue)
            this.cue.muted = this.muted;
        if (!this.muted && !this.musicStarted && !this.restorationSequenceRunning)
            void this.startMusic();
        else if (!this.muted && this.music)
            this.fadeMusicTo(this.targetMusicVolume, 450);
        return this.muted;
    }
    setMusicVolume(value) {
        this.targetMusicVolume = Math.max(0, Math.min(1, value));
        if (this.music && this.musicStarted && !this.muted)
            this.fadeMusicTo(this.targetMusicVolume, 450);
    }
    playSfx(name) {
        if (this.muted)
            return;
        this.unlock();
        if (!this.ctx)
            return;
        const patterns = {
            collect: [[660, 0, .07], [880, .06, .09]],
            interact: [[420, 0, .08]],
            restore: [[440, 0, .12], [660, .10, .14], [880, .22, .22]],
            page: [[520, 0, .08], [620, .08, .08]],
            transition: [[310, 0, .08], [390, .07, .08]]
        };
        const now = this.ctx.currentTime;
        for (const [freq, delay, duration] of patterns[name]) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = name === 'restore' ? 'sine' : 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(.0001, now + delay);
            gain.gain.exponentialRampToValueAtTime(name === 'restore' ? .055 : .035, now + delay + .012);
            gain.gain.exponentialRampToValueAtTime(.0001, now + delay + duration);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + duration + .03);
        }
    }
}
export const audioDirector = new AudioDirector();
//# sourceMappingURL=AudioDirector.js.map
