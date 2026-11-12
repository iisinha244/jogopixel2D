// =========================================================
// 1. SINTETIZADOR RETRO MEDIEVAL / DRAGÕES (WEB AUDIO API)
// =========================================================
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.bgmInterval = null;
    this.step = 0;
    this.isBossMusic = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, vol = 0.15, slideFreq = null) {
    if (!this.sfxEnabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, vol = 0.22, startFreq = 700) {
    if (!this.sfxEnabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  fireball() {
    this.playNoise(0.14, 0.14, 1200);
    this.playTone(420, 'sawtooth', 0.12, 0.1, 160);
  }

  mapStep() { this.playTone(523.25, 'triangle', 0.09, 0.12, 659.25); }
  enemyShoot() { this.playTone(260, 'square', 0.14, 0.08, 110); }
  hit() { this.playTone(170, 'triangle', 0.09, 0.16, 65); }
  explosion() { this.playNoise(0.28, 0.25, 650); }
  bossRoar() {
    this.playNoise(0.85, 0.35, 450);
    this.playTone(110, 'sawtooth', 0.7, 0.25, 45);
  }
  powerup() {
    this.playTone(392, 'triangle', 0.08, 0.14);
    setTimeout(() => this.playTone(523.25, 'triangle', 0.08, 0.14), 70);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.16, 0.16), 140);
  }
  playerHurt() {
    this.playNoise(0.35, 0.28, 500);
    this.playTone(140, 'sawtooth', 0.3, 0.2, 42);
  }

  startBGM(boss = false) {
    this.isBossMusic = boss;
    this.stopBGM();
    if (!this.bgmEnabled) return;

    const adventureNotes = [146.83, 174.61, 220.00, 196.00, 174.61, 164.81, 146.83, 130.81];
    const bossNotes = [110.00, 116.54, 110.00, 146.83, 110.00, 116.54, 164.81, 155.56];
    const tempo = boss ? 135 : 195;

    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx || this.ctx.state !== 'running') return;
      const seq = this.isBossMusic ? bossNotes : adventureNotes;
      const freq = seq[this.step % seq.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = this.isBossMusic ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.065, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
      this.step++;
    }, tempo);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const audio = new RetroAudio();

// =========================================================
// 2. SPRITES DE DRAGÕES EM PIXEL ART
// =========================================================
const PALETTE = {
  '.': null,
  'W': '#ffffff',
  'C': '#00e5ff',
  'B': '#1565c0',
  'R': '#d50000',
  'M': '#ff5252',
  'O': '#ff6d00',
  'Y': '#ffd600',
  'G': '#2e7d32',
  'L': '#76ff03',
  'P': '#6a1b9a',
  'D': '#4e342e',
  'S': '#8d6e63'
};

const SPRITE_MAPS = {
  dragon_a: [
    ".....C.....",
    "....CYC....",
    "....CCC....",
    ".CC.BCB.CC.",
    "CCCBBCBBCCC",
    "CC.BBBB.CC.",
    "....BBB....",
    "....B.B....",
    ".....B....."
  ],
  dragon_b: [
    ".....C.....",
    "....CYC....",
    "....CCC....",
    "...CBCBC...",
    "..CCBBBCC..",
    ".CC.BBB.CC.",
    "....BBB....",
    "....B.B....",
    ".....B....."
  ],
  bat_a: [
    "P.........P",
    "PP..PPP..PP",
    "PPPPPYPPPPP",
    ".PPPPPPPPP.",
    "..PP...PP..",
    "..........."
  ],
  bat_b: [
    "...........",
    "...PPPPP...",
    ".PPPPYPPPP.",
    "PP.PPPPP.PP",
    "P...P.P...P",