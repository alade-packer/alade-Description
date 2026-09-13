/* ==========================================
   阿拉德战记 · 背景音乐（bgm.js · 修复版）
   ————————————————————————————————————————
   修复：
   · 首次触摸唤醒 AudioContext（手机浏览器限制）
   · 启动音量从 SETTINGS 读取，不再固定 0.5
   ========================================== */

var MUSIC_LIST = [
    { id: 'town', name: '城镇 · 天际夜空', file: 'music/town.mp3' }
];

var BGM = {
    ctx: null,
    masterGain: null,
    isPlaying: false,
    loopTimer: null,
    melody: [261.63, 329.63, 392.00, 493.88, 440.00, 392.00, 329.63, 293.66],
    bass:   [130.81, 130.81, 164.81, 164.81, 196.00, 196.00, 146.83, 146.83],
    noteIndex: 0,

    audio: null,
    currentMusicId: null,
    mode: 'synth',

    init: function () {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            /* ★ 修复：启动音量从 SETTINGS 读，不再固定 0.5 */
            var initVol = 50;
            if (typeof SETTINGS !== 'undefined' && SETTINGS.volume) {
                initVol = SETTINGS.volume;
            }
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = initVol / 100;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    /* ★ 修复：首次触摸唤醒（手机浏览器要求） */
    unlock: function () {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        /* 如果是文件模式且有暂停的 audio，尝试恢复 */
        if (this.audio && this.audio.paused && this.mode === 'file') {
            this.audio.play().catch(function () {});
        }
    },

    playNote: function (freq, type, duration, volume) {
        if (!this.ctx) return;
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        var now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    },

    startSynth: function () {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.noteIndex = 0;
        var self = this;
        var step = function () {
            if (!self.isPlaying) return;
            var i = self.noteIndex % self.melody.length;
            self.playNote(self.melody[i], 'square', 0.4, 0.06);
            if (i % 2 === 0) {
                var j = Math.floor(i / 2) % self.bass.length;
                self.playNote(self.bass[j], 'triangle', 0.8, 0.08);
            }
            self.noteIndex++;
        };
        step();
        this.loopTimer = setInterval(step, 400);
        this.mode = 'synth';
        this.currentMusicId = null;
    },

    stopSynth: function () {
        this.isPlaying = false;
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
    },

    playFile: function (musicId) {
        var track = null;
        for (var i = 0; i < MUSIC_LIST.length; i++) {
            if (MUSIC_LIST[i].id === musicId) { track = MUSIC_LIST[i]; break; }
        }
        if (!track) return false;

        if (this.mode === 'file' && this.currentMusicId === musicId && this.audio && !this.audio.paused) {
            return true;
        }

        this.stopSynth();
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        /* ★ 修复：文件模式音量也从 SETTINGS 读 */
        var initVol = 50;
        if (typeof SETTINGS !== 'undefined' && SETTINGS.volume) {
            initVol = SETTINGS.volume;
        }

        this.audio = new Audio(track.file);
        this.audio.loop = true;
        this.audio.volume = initVol / 100;
        this.audio.play().catch(function (e) {
            console.warn('音乐播放失败:', e);
        });

        this.mode = 'file';
        this.currentMusicId = musicId;
        return true;
    },

    start: function (musicId) {
        if (musicId) return this.playFile(musicId);
        this.startSynth();
    },

    stop: function () {
        this.stopSynth();
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
    },

    setVolume: function (v) {
        var vol = v / 100;
        if (this.masterGain) this.masterGain.gain.value = vol;
        if (this.audio) this.audio.volume = vol;
    }
};

/* ★ 修复：全局首次触摸唤醒 BGM */
window.addEventListener('touchstart', function () {
    BGM.unlock();
}, { once: true });

window.addEventListener('click', function () {
    BGM.unlock();
}, { once: true });