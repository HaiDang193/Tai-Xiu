// ================== ÂM THANH (tự tạo bằng Web Audio, không cần file mp3) ==================
let ac = null, soundOn = true;

function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, when = 0) {
  if (!soundOn) return;
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + when;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t); o.stop(t + dur);
}

const sfx = {
  chip:   () => tone(950, .06, 'triangle', .1),
  rattle: () => { for (let i = 0; i < 16; i++) tone(250 + Math.random() * 600, .05, 'square', .035, i * .08); },
  land:   () => tone(180, .1, 'triangle', .2),
  win:    () => [523, 659, 784, 1046].forEach((f, i) => tone(f, .3, 'triangle', .15, i * .1)),
  lose:   () => { tone(220, .4, 'sawtooth', .07); tone(150, .6, 'sawtooth', .07, .18); }
};
