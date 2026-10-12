// ================== HIỂN THỊ ==================

// Số dư chạy số từ giá trị cũ sang giá trị mới
function renderMoney() {
  const from = shownMoney, to = money, t0 = performance.now();
  const step = (now) => {
    const k = Math.min((now - t0) / 700, 1), e = 1 - Math.pow(1 - k, 3);
    shownMoney = from + (to - from) * e;
    $('#balance').textContent = fmt(round2(shownMoney));
    if (k < 1) requestAnimationFrame(step); else shownMoney = to;
  };
  requestAnimationFrame(step);
}

// Chữ +/- bay lên cạnh số dư
function floatNum(amount) {
  const el = document.createElement('span');
  el.className = 'float-num ' + (amount >= 0 ? 'plus' : 'minus');
  el.textContent = (amount >= 0 ? '+' : '−') + fmt(Math.abs(amount));
  $('#wallet').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function log(msg, cls = '') {
  const li = document.createElement('li');
  li.textContent = msg;
  li.className = cls;
  $('#log').prepend(li);
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  $('#toast').appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

// ----- Tiền cược -----
function getBet() { return round2(parseFloat($('#betInput').value) || 0); }

function setBet(v) {
  $('#betInput').value = round2(Math.max(0, Math.min(v, money)));
  updateStake();
}

function updateStake() {
  $$('.side').forEach(b => b.classList.toggle('selected', b.dataset.side === side));
  $('#stake-tai').textContent = side === 'tai' ? '🪙 ' + fmt(getBet()) : '';
  $('#stake-xiu').textContent = side === 'xiu' ? '🪙 ' + fmt(getBet()) : '';
}

function lockUI(lock) {
  rolling = lock;
  $$('.side, .chip, #btnRoll, #btnClear, #btnDeposit, #betInput').forEach(el => el.disabled = lock);
}

// ----- Hiệu ứng -----
function confetti() {
  const colors = ['#ffcf5a', '#ff3b5c', '#38b6ff', '#5dffa0', '#ffffff', '#c084fc'];
  for (let i = 0; i < 110; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--x', (Math.random() * 2 - 1) * 50 + 'vw');
    p.style.setProperty('--up', -(20 + Math.random() * 30) + 'vh');
    p.style.setProperty('--r', (Math.random() * 2 - 1) * 900 + 'deg');
    p.style.animationDelay = Math.random() * .2 + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2700);
  }
}

function loseEffect() {
  document.body.classList.add('shake', 'flash');
  setTimeout(() => document.body.classList.remove('shake', 'flash'), 800);
}

function popSum(text) {
  const el = $('#sum');
  el.textContent = text;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

// ----- Soi cầu -----
function renderHistory() {
  $('#beads').innerHTML = '';
  history.slice(-24).forEach(h => {
    const b = document.createElement('div');
    b.className = 'bead ' + h.side;
    b.textContent = h.total;
    b.title = h.dice.join(' · ');
    $('#beads').appendChild(b);
  });
  const t = history.filter(h => h.side === 'tai').length;
  $('#stats').textContent = history.length ? `Tài ${t} · Xỉu ${history.length - t}` : '';
}
