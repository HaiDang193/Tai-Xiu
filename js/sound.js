// ================== ÂM THANH ==================
// Toàn bộ hiệu ứng + nhạc nền được tạo bằng Web Audio, không cần file.
// Muốn dùng nhạc nền riêng: bỏ file vào assets/music.mp3 là tự phát thay nhạc mặc định.
const MUSIC_FILE = 'assets/music.mp3';

const audio = { ctx: null, master: null, sfxBus: null, musicBus: null, noise: null, sfxOn: true, musicOn: true, volume: 0.7 };

// Nhớ lựa chọn bật/tắt + âm lượng của người chơi
try {
  const saved = JSON.parse(localStorage.getItem('tx-audio')) || {};
  ['sfxOn', 'musicOn', 'volume'].forEach(k => { if (k in saved) audio[k] = saved[k]; });
} catch (e) {}
function saveAudio() {
  try { localStorage.setItem('tx-audio', JSON.stringify({ sfxOn: audio.sfxOn, musicOn: audio.musicOn, volume: audio.volume })); } catch (e) {}
}

// Trình duyệt chỉ cho phát âm thanh sau khi người dùng bấm lần đầu
function ensureAudio() {
  if (!audio.ctx) {
    const ctx = audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.master = ctx.createGain();
    audio.master.gain.value = audio.volume;
    audio.master.connect(ctx.destination);
    audio.sfxBus = ctx.createGain();
    audio.sfxBus.gain.value = audio.sfxOn ? 1 : 0;
    audio.sfxBus.connect(audio.master);
    audio.musicBus = ctx.createGain();
    audio.musicBus.gain.value = 0;
    audio.musicBus.connect(audio.master);
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    audio.noise = buf;
  }
  if (audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

// ----- 2 "nhạc cụ" cơ bản -----
// Một nốt: sóng âm + đường bao âm lượng, có thể trượt cao độ
function voice({ freq, dur = .15, type = 'sine', vol = .1, when = 0, at, bus, attack = .005, slideTo }) {
  const ctx = audio.ctx;
  if (!ctx) return;
  const t = at ?? ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus || audio.sfxBus);
  o.start(t); o.stop(t + dur + .02);
}

// Tiếng nhiễu đã lọc: xúc xắc va, hi-hat, tiếng "vút"
function noise({ dur = .05, vol = .1, when = 0, at, bus, freq = 2000, q = 1, filter = 'bandpass', sweepTo, attack = .002 }) {
  const ctx = audio.ctx;
  if (!ctx) return;
  const t = at ?? ctx.currentTime + when;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = audio.noise;
  f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus || audio.sfxBus);
  src.start(t, Math.random() * .5); src.stop(t + dur + .02);
}

// ----- Hiệu ứng âm thanh -----
const rand = (a, b) => a + Math.random() * (b - a);
const sfx = {
  hover:  () => voice({ freq: 2200, dur: .04, vol: .02 }),
  click:  () => { voice({ freq: 520, dur: .07, type: 'triangle', vol: .12 }); noise({ dur: .02, vol: .05, freq: 4000, filter: 'highpass' }); },
  select: () => { voice({ freq: 440, dur: .14, type: 'triangle', vol: .1 }); voice({ freq: 660, dur: .2, type: 'triangle', vol: .09, when: .07 }); },
  chip:   () => {
    const p = rand(.95, 1.1);
    voice({ freq: 2500 * p, dur: .09, vol: .07 });
    voice({ freq: 3300 * p, dur: .14, vol: .05, when: .012 });
    noise({ dur: .025, vol: .07, freq: 6000, filter: 'highpass' });
  },
  coins:  (n = 10) => {
    for (let i = 0; i < n; i++) {
      const p = rand(.85, 1.25), w = i * .055 + rand(0, .03);
      voice({ freq: 2600 * p, dur: .1, vol: .05, when: w });
      voice({ freq: 3500 * p, dur: .16, vol: .035, when: w + .01 });
    }
  },
  allIn:  () => {
    voice({ freq: 110, slideTo: 50, dur: .7, vol: .25 });
    noise({ dur: .7, vol: .1, freq: 300, sweepTo: 5000, attack: .5 });
    [523, 659, 784, 1046].forEach((f, i) => voice({ freq: f, dur: .25, type: 'square', vol: .03, when: .55 + i * .05 }));
  },
  whoosh: () => noise({ dur: .45, vol: .16, freq: 400, sweepTo: 3000, q: 1.5, attack: .2 }),
  lidUp:  () => noise({ dur: .35, vol: .12, freq: 2500, sweepTo: 500, q: 1.2, attack: .05 }),
  rattle: (secs = 1.4) => {
    for (let t = 0; t < secs; t += rand(.04, .09)) noise({ dur: .03, vol: rand(.08, .18), when: t, freq: rand(1500, 3500), q: 6 });
  },
  land:   () => { noise({ dur: .06, vol: .3, freq: 1100, q: 2 }); voice({ freq: 160, slideTo: 90, dur: .12, vol: .2 }); },
  notify: () => { voice({ freq: 880, dur: .1, vol: .06 }); voice({ freq: 1320, dur: .14, vol: .05, when: .06 }); },
  error:  () => { voice({ freq: 200, dur: .09, type: 'square', vol: .05 }); voice({ freq: 160, dur: .14, type: 'square', vol: .05, when: .1 }); },
  win:    () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) => voice({ freq: f, dur: .35, type: 'triangle', vol: .12, when: i * .08 }));
    voice({ freq: 1046, dur: 1, vol: .07, when: .45 });
    sfx.coins(16);
  },
  lose:   () => { voice({ freq: 330, slideTo: 110, dur: .7, type: 'sawtooth', vol: .05 }); voice({ freq: 70, dur: .4, vol: .2 }); },
  gameOver: () => [392, 370, 349, 330].forEach((f, i) =>
    voice({ freq: f, slideTo: i === 3 ? 250 : undefined, dur: i === 3 ? 1 : .32, type: 'triangle', vol: .1, when: i * .35 }))
};

// Rung trên điện thoại
function vibrate(pattern) {
  if (audio.sfxOn && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
}

// ================== NHẠC NỀN ==================
// Mặc định: tự chơi một vòng hợp âm lounge (Cmaj7 – Am7 – Dm7 – G7)
const BPM = 88, STEP = 60 / BPM / 2;
const PROG = [
  { bass: 48, chord: [60, 64, 67, 71] },
  { bass: 45, chord: [57, 60, 64, 67] },
  { bass: 50, chord: [62, 65, 69, 72] },
  { bass: 43, chord: [59, 62, 65, 67] }
];
const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
const music = { el: new Audio(MUSIC_FILE), fileReady: false, playing: false, timer: null, step: 0, next: 0, base: .55, ducked: false };
music.el.loop = true;
music.el.preload = 'auto';
music.el.addEventListener('canplaythrough', () => {
  music.fileReady = true;
  // File tải xong khi nhạc tự chơi đang phát -> chuyển sang file
  if (music.playing && music.timer) { clearInterval(music.timer); music.timer = null; music.el.play().catch(() => {}); applyMusicLevel(); }
}, { once: true });

function playStep(step, t) {
  const bus = audio.musicBus, ch = PROG[Math.floor(step / 8) % PROG.length], b = step % 8;
  if (b === 0) ch.chord.forEach(n => voice({ freq: mtof(n), dur: STEP * 7.5, type: 'triangle', vol: .03, at: t, bus, attack: .08 }));
  if (b === 0 || b === 4) {
    voice({ freq: mtof(ch.bass), dur: STEP * 3, vol: .14, at: t, bus, attack: .01 });
    voice({ freq: 120, slideTo: 45, dur: .18, vol: .12, at: t, bus });
  }
  if (b === 6) voice({ freq: mtof(ch.bass + 7), dur: STEP * 1.8, vol: .1, at: t, bus });
  if (b % 2 === 1) noise({ dur: .035, vol: .025, at: t, bus, freq: 8000, filter: 'highpass' });
  if (b === 4) noise({ dur: .12, vol: .035, at: t, bus, freq: 1800, q: .8 });
  if (Math.random() < .3) {
    const n = ch.chord[Math.floor(Math.random() * 4)] + 12;
    voice({ freq: mtof(n), dur: STEP * 1.6, vol: .035, at: t, bus, attack: .01 });
    voice({ freq: mtof(n) * 2, dur: STEP, vol: .01, at: t, bus });
  }
}
function synthTick() {
  while (music.next < audio.ctx.currentTime + .25) { playStep(music.step++, music.next); music.next += STEP; }
}

function applyMusicLevel(time = .6) {
  const level = music.playing ? (music.ducked ? music.base * .3 : music.base) : 0;
  if (audio.ctx) {
    const g = audio.musicBus.gain, now = audio.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(level, now + time);
  }
  music.el.volume = Math.min(1, level * audio.volume);
}

function startMusic() {
  if (music.playing) return;
  ensureAudio();
  music.playing = true;
  if (music.fileReady) music.el.play().catch(() => {});
  else {
    music.step = 0;
    music.next = audio.ctx.currentTime + .1;
    music.timer = setInterval(synthTick, 60);
  }
  applyMusicLevel(1.2);
  updateAudioUI();
}

function stopMusic() {
  music.playing = false;
  applyMusicLevel(.4);
  setTimeout(() => {
    if (music.playing) return;
    clearInterval(music.timer); music.timer = null;
    music.el.pause();
  }, 450);
  updateAudioUI();
}

// Nhỏ nhạc lại khi đang lắc cho nghe rõ tiếng xúc xắc
function duckMusic(on) { music.ducked = on; applyMusicLevel(.4); }

// ================== ĐIỀU KHIỂN ==================
let audioStarted = false;
function audioInit() {
  if (audioStarted) return;
  audioStarted = true;
  ensureAudio();
  if (audio.musicOn) startMusic();
}

function toggleMusic() {
  ensureAudio();
  audio.musicOn = !audio.musicOn;
  audio.musicOn ? startMusic() : stopMusic();
  saveAudio(); updateAudioUI();
}

function toggleSfx() {
  ensureAudio();
  audio.sfxOn = !audio.sfxOn;
  audio.sfxBus.gain.value = audio.sfxOn ? 1 : 0;
  if (audio.sfxOn) sfx.click();
  saveAudio(); updateAudioUI();
}

function setVolume(v) {
  audio.volume = v;
  if (audio.master) audio.master.gain.value = v;
  applyMusicLevel(.1);
  saveAudio();
}

function updateAudioUI() {
  $('#btnMusic').classList.toggle('off', !audio.musicOn);
  $('#btnMusic').classList.toggle('playing', music.playing);
  $('#btnSfx').classList.toggle('off', !audio.sfxOn);
  $('#btnSfx').textContent = audio.sfxOn ? '🔊' : '🔇';
  $('#volume').value = Math.round(audio.volume * 100);
}
