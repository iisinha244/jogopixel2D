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
    "..........."
  ],
  wyvern_a: [
    "G....G....G",
    "GG..GYG..GG",
    "GGGGGGGGGGG",
    ".GG.GGG.GG.",
    "....GGG....",
    "...G...G..."
  ],
  wyvern_b: [
    ".....G.....",
    "...GGYGG...",
    ".GGGGGGGGG.",
    "GG..GGG..GG",
    "....GGG....",
    "...G...G..."
  ],
  magma_rock: [
    "..DDDDD..",
    ".DSSODSD.",
    "DSODDDOSD",
    "DDDDODDDD",
    ".DSDDDSD.",
    "..DDDDD.."
  ],
  heart: [
    ".RR.RR.",
    "RRRRRRR",
    "RRRRRRR",
    ".RRRRR.",
    "..RRR..",
    "...R..."
  ],
  fire_orb: [
    "..OOO..",
    ".OYYYO.",
    "OYWWWOY",
    "OYWWWOY",
    ".OYYYO.",
    "..OOO.."
  ],
  boss_dragon_a: [
    "Y........RR........Y",
    ".Y......RYYR......Y.",
    "RR.....RRRRRR.....RR",
    "RRR...RRMMMMRR...RRR",
    "RRRRRRRRMMMMRRRRRRRR",
    "RRRRR.RRRRRRRR.RRRRR",
    "RRR...RRRRRRRR...RRR",
    "R......RR..RR......R",
    ".......O....O......."
  ],
  boss_dragon_b: [
    "Y........RR........Y",
    ".Y......RYYR......Y.",
    "........RRRR........",
    "......RRMMMMRR......",
    "...RRRRRMMMMRRRRR...",
    ".RRRR.RRRRRRRR.RRRR.",
    "RRR...RRRRRRRR...RRR",
    "R......RR..RR......R",
    ".......O....O......."
  ]
};

const spriteCache = {};
function getSprite(name, scale = 3) {
  const key = `${name}_${scale}`;
  if (spriteCache[key]) return spriteCache[key];

  const map = SPRITE_MAPS[name];
  const h = map.length;
  const w = map[0].length;
  const off = document.createElement('canvas');
  off.width = w * scale;
  off.height = h * scale;
  const octx = off.getContext('2d');

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = map[y][x];
      if (PALETTE[ch]) {
        octx.fillStyle = PALETTE[ch];
        octx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
  spriteCache[key] = off;
  return off;
}

// =========================================================
// 3. MOTOR DO JOGO, FASES E DRAGÃO CHEFÃO
// =========================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'KeyP' && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
    gameState = gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING';
  }
  if ((e.code === 'Enter' || e.code === 'Space') && ['TITLE', 'GAMEOVER', 'VICTORY'].includes(gameState)) {
    startGame();
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function bindTouch(id, code) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); audio.init(); keys[code] = true; });
  el.addEventListener('touchend', e => { e.preventDefault(); keys[code] = false; });
}
bindTouch('t-left', 'ArrowLeft');
bindTouch('t-right', 'ArrowRight');
bindTouch('t-fire', 'Space');

canvas.addEventListener('click', () => {
  audio.init();
  if (['TITLE', 'GAMEOVER', 'VICTORY'].includes(gameState)) startGame();
});

document.getElementById('btn-sfx').addEventListener('click', function () {
  audio.init();
  audio.sfxEnabled = !audio.sfxEnabled;
  this.textContent = `SFX: ${audio.sfxEnabled ? 'ON' : 'OFF'}`;
  this.classList.toggle('off', !audio.sfxEnabled);
});

document.getElementById('btn-bgm').addEventListener('click', function () {
  audio.init();
  audio.bgmEnabled = !audio.bgmEnabled;
  this.textContent = `MUSICA: ${audio.bgmEnabled ? 'ON' : 'OFF'}`;
  this.classList.toggle('off', !audio.bgmEnabled);
  if (audio.bgmEnabled && gameState === 'PLAYING') audio.startBGM(!!boss);
  else audio.stopBGM();
});

document.getElementById('btn-crt').addEventListener('click', function () {
  const wrapper = document.getElementById('game-wrapper');
  const active = wrapper.classList.toggle('scanlines');
  this.textContent = `CRT: ${active ? 'ON' : 'OFF'}`;
  this.classList.toggle('off', !active);
});

let gameState = 'TITLE';
let score = 0;
let hiScore = Number(localStorage.getItem('dpq_hiscore') || 0);
let stage = 1;
let stageTimer = 0;
let animFrame = 0;

let player = {};
let fireballs = [];
let enemyFires = [];
let enemies = [];
let particles = [];
let powerups = [];
let boss = null;

const embers = Array.from({ length: 55 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  speed: 0.5 + Math.random() * 1.9,
  size: Math.random() > 0.7 ? 3 : 2,
  color: Math.random() > 0.5 ? '#ff6d00' : '#ffd600'
}));

function resetPlayer() {
  player = {
    x: W / 2 - 16,
    y: H - 54,
    w: 33,
    h: 27,
    speed: 3.7,
    lives: 3,
    cooldown: 0,
    invuln: 0,
    fireLevel: 1
  };
}

function startGame() {
  audio.init();
  score = 0;
  stage = 1;
  fireballs = [];
  enemyFires = [];
  enemies = [];
  particles = [];
  powerups = [];
  boss = null;
  resetPlayer();
  loadStage(1);
}

function loadStage(num) {
  stage = num;
  fireballs = [];
  enemyFires = [];
  enemies = [];
  powerups = [];
  boss = null;
  gameState = 'STAGE_INTRO';
  stageTimer = 110;
  audio.startBGM(num === 3);

  if (num === 1) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        enemies.push({
          x: 40 + col * 48,
          y: 65 + row * 36,
          w: 33,
          h: 18,
          hp: 1,
          type: row === 0 ? 'wyvern' : 'bat',
          vx: 1.15,
          points: row === 0 ? 150 : 100
        });
      }
    }
  } else if (num === 2) {
    for (let i = 0; i < 6; i++) {
      enemies.push({
        x: 30 + i * 54,
        y: 55 + (i % 2) * 35,
        w: 33,
        h: 18,
        hp: 2,
        type: 'wyvern',
        vx: 1.75,
        points: 200
      });
    }
    for (let i = 0; i < 7; i++) {
      enemies.push({
        x: 25 + Math.random() * (W - 60),
        y: -40 - i * 65,
        w: 27,
        h: 18,
        hp: 2,
        type: 'magma_rock',
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.6 + Math.random() * 0.8,
        points: 120
      });
    }
  } else if (num === 3) {
    audio.bossRoar();
    boss = {
      x: W / 2 - 50,
      y: -80,
      targetY: 56,
      w: 100,
      h: 45,
      hp: 70,
      maxHp: 70,
      vx: 1.7,
      attackTimer: 0,
      flash: 0
    };
  }
}

function spawnFireParticles(x, y, color = '#ff6d00', count = 14) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3.2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 22 + Math.random() * 14,
      color: i % 2 === 0 ? color : '#ffd600',
      size: Math.random() > 0.5 ? 3 : 2
    });
  }
}

function addScore(pts) {
  score += pts;
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('dpq_hiscore', hiScore);
  }
}

function damagePlayer() {
  if (player.invuln > 0) return;
  player.lives--;
  player.fireLevel = 1;
  player.invuln = 110;
  audio.playerHurt();
  spawnFireParticles(player.x + player.w / 2, player.y + player.h / 2, '#00e5ff', 20);
  if (player.lives <= 0) {
    gameState = 'GAMEOVER';
    audio.stopBGM();
  }
}

function rectsCollide(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// =========================================================
// 4. ATUALIZAÇÃO DO JOGO (UPDATE)
// =========================================================
function update() {
  animFrame++;

  for (const e of embers) {
    e.y += e.speed;
    if (e.y > H) { e.y = 0; e.x = Math.random() * W; }
  }

  if (gameState === 'STAGE_INTRO') {
    stageTimer--;
    if (stageTimer <= 0) gameState = 'PLAYING';
    return;
  }

  if (gameState !== 'PLAYING') return;

  if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed;
  player.x = Math.max(8, Math.min(W - player.w - 8, player.x));

  if (player.invuln > 0) player.invuln--;
  if (player.cooldown > 0) player.cooldown--;

  if ((keys['Space'] || keys['KeyZ'] || keys['ArrowUp'] || keys['KeyW']) && player.cooldown <= 0) {
    audio.fireball();
    player.cooldown = 15;
    if (player.fireLevel === 1) {
      fireballs.push({ x: player.x + player.w / 2 - 3, y: player.y - 8, w: 6, h: 10, vx: 0, vy: -6.8 });
    } else {
      fireballs.push({ x: player.x + 6, y: player.y - 4, w: 6, h: 10, vx: -0.5, vy: -6.8 });
      fireballs.push({ x: player.x + player.w - 12, y: player.y - 4, w: 6, h: 10, vx: 0.5, vy: -6.8 });
    }
  }

  for (let i = fireballs.length - 1; i >= 0; i--) {
    fireballs[i].x += fireballs[i].vx;
    fireballs[i].y += fireballs[i].vy;
    if (fireballs[i].y < -15) fireballs.splice(i, 1);
  }

  for (let i = enemyFires.length - 1; i >= 0; i--) {
    const ef = enemyFires[i];
    ef.x += ef.vx || 0;
    ef.y += ef.vy;
    if (ef.y > H + 15 || ef.x < -15 || ef.x > W + 15) {
      enemyFires.splice(i, 1);
      continue;
    }
    if (rectsCollide(ef, player)) {
      enemyFires.splice(i, 1);
      damagePlayer();
    }
  }

  let hitEdge = false;
  for (const e of enemies) {
    if (e.type === 'magma_rock') {
      e.x += e.vx;
      e.y += e.vy;
      if (e.y > H + 20) {
        e.y = -30;
        e.x = 20 + Math.random() * (W - 50);
      }
    } else {
      e.x += e.vx;
      if (e.x <= 12 || e.x + e.w >= W - 12) hitEdge = true;
      if (Math.random() < 0.0045) {
        audio.enemyShoot();
        enemyFires.push({ x: e.x + e.w / 2 - 3, y: e.y + e.h, w: 5, h: 9, vy: 3.4 });
      }
    }
  }

  if (hitEdge) {
    for (const e of enemies) {
      if (e.type !== 'magma_rock') {
        e.vx *= -1;
        e.y += 12;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (rectsCollide(e, player)) {
      damagePlayer();
    }
    if (e.y + e.h >= player.y && e.type !== 'magma_rock') {
      player.lives = 0;
      damagePlayer();
    }

    for (let j = fireballs.length - 1; j >= 0; j--) {
      if (rectsCollide(fireballs[j], e)) {
        fireballs.splice(j, 1);
        e.hp--;
        if (e.hp <= 0) {
          audio.explosion();
          spawnFireParticles(e.x + e.w / 2, e.y + e.h / 2);
          addScore(e.points);
          if (Math.random() < 0.15) {
            powerups.push({ x: e.x + 6, y: e.y, w: 21, h: 18, vy: 1.8 });
          }
          enemies.splice(i, 1);
        } else {
          audio.hit();
        }
        break;
      }
    }
  }

  if (boss) {
    if (boss.y < boss.targetY) {
      boss.y += 1.2;
    } else {
      boss.x += boss.vx;
      if (boss.x <= 14 || boss.x + boss.w >= W - 14) boss.vx *= -1;
      boss.attackTimer++;

      if (boss.attackTimer % 52 === 0) {
        audio.fireball();
        for (let angle = -0.38; angle <= 0.38; angle += 0.38) {
          enemyFires.push({
            x: boss.x + boss.w / 2 - 4,
            y: boss.y + boss.h,
            w: 8,
            h: 10,
            vx: Math.sin(angle) * 3.3,
            vy: Math.cos(angle) * 3.5
          });
        }
      }
    }

    if (boss.flash > 0) boss.flash--;

    for (let j = fireballs.length - 1; j >= 0; j--) {
      if (rectsCollide(fireballs[j], boss)) {
        fireballs.splice(j, 1);
        boss.hp--;
        boss.flash = 4;
        audio.hit();

        if (boss.hp <= 0) {
          audio.bossRoar();
          for (let k = 0; k < 5; k++) {
            spawnFireParticles(
              boss.x + Math.random() * boss.w,
              boss.y + Math.random() * boss.h,
              '#ff3d00',
              24
            );
          }
          addScore(3000);
          boss = null;
          audio.stopBGM();
          setTimeout(() => { gameState = 'VICTORY'; }, 750);
          break;
        }
      }
    }
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += p.vy;
    if (p.y > H) { powerups.splice(i, 1); continue; }
    if (rectsCollide(p, player)) {
      audio.powerup();
      addScore(250);
      if (player.fireLevel < 2) player.fireLevel = 2;
      else if (player.lives < 5) player.lives++;
      powerups.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.life--;
    if (pt.life <= 0) particles.splice(i, 1);
  }

  if (!boss && enemies.length === 0 && gameState === 'PLAYING') {
    if (stage < 3) {
      loadStage(stage + 1);
    }
  }
}

// =========================================================
// 5. RENDERIZAÇÃO (DRAW)
// =========================================================
function drawTextCentered(text, y, size = 14, color = '#ffffff') {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
}

function drawHUD() {
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffab00';
  ctx.fillText(`OURO:${String(score).padStart(5, '0')}`, 10, 20);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd600';
  ctx.fillText(`RECORDE:${String(hiScore).padStart(5, '0')}`, W - 10, 20);

  const heartSpr = getSprite('heart', 2);
  for (let i = 0; i < player.lives; i++) {
    ctx.drawImage(heartSpr, 10 + i * 18, 28);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#bcaaa4';
  ctx.fillText(`REINO ${stage}/3`, W - 10, 38);

  if (boss) {
    const barW = 210;
    const barX = (W - barW) / 2;
    ctx.fillStyle = '#260e0e';
    ctx.fillRect(barX, 46, barW, 8);
    ctx.fillStyle = '#d50000';
    ctx.fillRect(barX, 46, barW * Math.max(0, boss.hp / boss.maxHp), 8);
    ctx.strokeStyle = '#ffab00';
    ctx.strokeRect(barX, 46, barW, 8);
  }
}

function draw() {
  ctx.fillStyle = '#1a0b0b';
  ctx.fillRect(0, 0, W, H);

  for (const e of embers) {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.size, e.size);
  }

  const wingSuffix = Math.floor(animFrame / 14) % 2 === 0 ? '_a' : '_b';

  if (gameState === 'TITLE') {
    drawTextCentered('DRAGON PIXEL', 125, 21, '#ffab00');
    drawTextCentered('QUEST', 158, 22, '#ff3d00');
    ctx.drawImage(getSprite(`dragon${wingSuffix}`, 4), W / 2 - 22, 195);
    drawTextCentered('SETAS / WASD: VOAR', 285, 9, '#d7ccc8');
    drawTextCentered('ESPACO: CUSPIR FOGO', 305, 9, '#d7ccc8');
    if (Math.floor(animFrame / 25) % 2 === 0) {
      drawTextCentered('CLIQUE OU APERTE ENTER', 370, 11, '#ffd600');
    }
    return;
  }

  if (player.lives > 0 && (player.invuln === 0 || Math.floor(player.invuln / 5) % 2 === 0)) {
    ctx.drawImage(getSprite(`dragon${wingSuffix}`, 3), player.x, player.y);
  }

  for (const b of fireballs) {
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
  }

  for (const ef of enemyFires) {
    ctx.fillStyle = '#ff3d00';
    ctx.fillRect(ef.x, ef.y, ef.w, ef.h);
    ctx.fillStyle = '#ffd600';
    ctx.fillRect(ef.x + 1, ef.y + 2, ef.w - 2, ef.h - 4);
  }

  const enemyWing = Math.floor(animFrame / 18) % 2 === 0 ? '_a' : '_b';
  for (const e of enemies) {
    const sprName = e.type === 'magma_rock' ? 'magma_rock' : `${e.type}${enemyWing}`;
    ctx.drawImage(getSprite(sprName, 3), e.x, e.y);
  }

  if (boss) {
    if (boss.flash > 0) ctx.filter = 'brightness(3)';
    ctx.drawImage(getSprite(`boss_dragon${enemyWing}`, 5), boss.x, boss.y);
    ctx.filter = 'none';
  }

  for (const p of powerups) {
    ctx.drawImage(getSprite('fire_orb', 3), p.x, p.y);
  }

  for (const pt of particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }

  drawHUD();

  if (gameState === 'STAGE_INTRO') {
    ctx.fillStyle = 'rgba(26, 11, 11, 0.8)';
    ctx.fillRect(0, 190, W, 90);
    drawTextCentered(`FASE ${stage}`, 230, 18, '#ffab00');
    const subtitle = stage === 1 ? 'CEUS DO REINO' : stage === 2 ? 'CAVERNA DE MAGMA' : 'O DRAGAO ANCESTRAL!';
    drawTextCentered(subtitle, 258, 11, stage === 3 ? '#ff3d00' : '#ffd600');
  }

  if (gameState === 'PAUSED') {
    ctx.fillStyle = 'rgba(26, 11, 11, 0.78)';
    ctx.fillRect(0, 0, W, H);
    drawTextCentered('JOGO PAUSADO', 235, 16, '#ffd600');
  }

  if (gameState === 'GAMEOVER') {
    ctx.fillStyle = 'rgba(26, 11, 11, 0.85)';
    ctx.fillRect(0, 0, W, H);
    drawTextCentered('FIM DA JORNADA', 200, 18, '#ff3d00');
    drawTextCentered(`OURO COLETADO: ${score}`, 240, 11, '#ffffff');
    drawTextCentered('CLIQUE PARA TENTAR DE NOVO', 290, 9, '#ffab00');
  }

  if (gameState === 'VICTORY') {
    ctx.fillStyle = 'rgba(26, 11, 11, 0.85)';
    ctx.fillRect(0, 0, W, H);
    drawTextCentered('LENDA DOS DRAGOES!', 195, 16, '#ffd600');
    drawTextCentered(`OURO FINAL: ${score}`, 235, 12, '#ffab00');
    drawTextCentered('CLIQUE PARA JOGAR NOVAMENTE', 290, 9, '#ffffff');
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();