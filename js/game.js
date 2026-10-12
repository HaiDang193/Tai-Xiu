// ================== ÂM THANH CHUNG CHO MỌI NÚT ==================
// Lần bấm đầu tiên sẽ mở khoá âm thanh + bật nhạc nền
document.addEventListener('pointerdown', e => {
  audioInit();
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  ripple(b, e);
  // Các nút có tiếng riêng thì bỏ qua tiếng click chung
  if (!b.matches('.chip, .side, .presets button, #btnRoll, #btnMusic, #btnSfx')) sfx.click();
});
document.addEventListener('keydown', audioInit);

// Tiếng "tích" nhẹ khi rê chuột qua nút (chỉ trên máy tính)
document.addEventListener('pointerover', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled || e.pointerType !== 'mouse' || b.contains(e.relatedTarget)) return;
  sfx.hover();
});

$('#btnMusic').onclick = toggleMusic;
$('#btnSfx').onclick = toggleSfx;
$('#volume').oninput = e => setVolume(e.target.value / 100);
updateAudioUI();

// ================== CHỌN CỬA + CƯỢC ==================
function chooseSide(s) {
  if (rolling || side === s) return;
  side = s;
  sfx.select();
  updateStake();
}

$$('.side').forEach(b => b.onclick = () => chooseSide(b.dataset.side));

$$('.chip').forEach(c => c.onclick = () => {
  if (c.dataset.v === 'all') {
    setBet(money);
    sfx.allIn(); vibrate([30, 40, 30, 40, 120]);
    toast('🔥 ALL IN?!', 'silent');
  } else {
    sfx.chip(); vibrate(10);
    setBet(getBet() + Number(c.dataset.v));
  }
});

$('#btnClear').onclick = () => setBet(0);
$('#betInput').oninput = updateStake;
$('#btnRoll').onclick = play;

// Phím tắt: T = Tài, X = Xỉu, Enter = Lắc
addEventListener('keydown', e => {
  if (rolling || document.querySelector('.modal.open')) return;
  if (e.key === 't' || e.key === 'T') chooseSide('tai');
  if (e.key === 'x' || e.key === 'X') chooseSide('xiu');
  if (e.key === 'Enter') play();
});

// ================== NẠP TIỀN ==================
function openDeposit() {
  $('#depositModal').classList.add('open');
  setTimeout(() => $('#depositInput').focus(), 100);
}

$('#btnDeposit').onclick = openDeposit;
$$('.presets button').forEach(b => b.onclick = () => { $('#depositInput').value = b.dataset.v; sfx.chip(); });
$('#depositInput').onkeydown = e => { if (e.key === 'Enter') $('#btnConfirmDeposit').click(); };

$('#btnConfirmDeposit').onclick = () => {
  const v = round2(parseFloat($('#depositInput').value) || 0);
  if (v <= 0) { toast('Nhập số tiền cần nạp đã bạn ơi', 'error'); return; }
  money = round2(money + v);
  renderMoney(); floatNum(v);
  sfx.coins(12); vibrate(40);
  log(`Đã nạp ${fmt(v)}`, 'warn');
  $('#depositInput').value = '';
  $('#depositModal').classList.remove('open');
  $('#overModal').classList.remove('open');
};

$('#btnReDeposit').onclick = () => { $('#overModal').classList.remove('open'); openDeposit(); };

// ================== MỘT VÁN CHƠI ==================
async function play() {
  if (rolling) return;
  const bet = getBet();
  if (!side) { toast('Vui lòng chọn Tài hoặc Xỉu', 'error'); return; }
  if (bet <= 0) { toast('Nhập số tiền cược đi đã', 'error'); return; }
  if (bet > money) { toast('Tiền cược phải ≤ số dư', 'error'); return; }

  lockUI(true);
  const allIn = bet === money;
  const rigged = allIn && $('#rig').checked;

  // Trừ tiền cược trước (giống code Python)
  money = round2(money - bet);
  renderMoney(); floatNum(-bet);
  sfx.chip();
  log(`Cược ${fmt(bet)} vào ${side === 'tai' ? 'TÀI' : 'XỈU'}`);
  $('#sum').className = 'sum';
  $('#sum').textContent = '?';
  $('#resultText').textContent = 'Đang lắc…';
  $$('.side').forEach(s => s.classList.remove('winner'));

  // Gieo xúc xắc. All-in + bật "bịp" thì gieo lại đến khi người chơi thua
  let roll = [r6(), r6(), r6()];
  if (rigged) {
    while (isWin(side, roll[0] + roll[1] + roll[2])) roll = [r6(), r6(), r6()];
    toast('vcl thằng này all in ạ 😳');
    log('vcl thằng này all in ạ', 'warn');
  }

  // Úp bát + lắc
  duckMusic(true);
  sfx.whoosh();
  const plate = $('#plate');
  plate.classList.add('covered');
  await sleep(450);
  plate.classList.add('shaking');
  sfx.rattle(1.4); vibrate([20, 60, 20, 60, 20, 60, 20]);
  roll.forEach((v, i) => setDie(i, v, false));
  await sleep(1400);
  plate.classList.remove('shaking');
  if (rigged) { toast('thế thua em nhé 😏'); log('thế thua em nhé', 'warn'); }
  await sleep(300);

  // Mở bát, lật từng viên
  plate.classList.remove('covered');
  sfx.lidUp();
  $('#resultText').textContent = 'Kết quả…';
  await sleep(500);

  let total = 0;
  for (let i = 0; i < 3; i++) {
    const slot = dice[i].parentElement;
    slot.classList.remove('hop'); void slot.offsetWidth; slot.classList.add('hop');
    setDie(i, roll[i], true);
    await sleep(850);
    sfx.land(); vibrate(15);
    total += roll[i];
    popSum(total);
    log(`Xúc xắc thứ ${['nhất', 'hai', 'ba'][i]}: ${roll[i]}`);
    await sleep(250);
  }

  // Kết quả
  const resSide = total > 10 ? 'tai' : 'xiu';
  $('#sum').classList.add(resSide);
  $(`.side.${resSide}`).classList.add('winner');
  history.push({ total, side: resSide, dice: roll });
  renderHistory();

  if (isWin(side, total)) {
    const prize = round2(bet * 198 / 100);
    money = round2(money + prize);
    renderMoney(); floatNum(prize);
    $('#resultText').innerHTML = `<b style="color:#5dffa0">🎉 THẮNG +${fmt(prize)}</b>`;
    log(`Bạn đã chiến thắng: +${fmt(prize)} → còn ${fmt(money)}`, 'win');
    sfx.win(); confetti(); vibrate([40, 30, 40, 30, 90]);
  } else {
    const msg = rigged ? 'Bạn đã bị nhà cái bịp 🤡' : 'Thua nhà cái';
    $('#resultText').innerHTML = `<b style="color:#ff7a8f">${msg} −${fmt(bet)}</b>`;
    log(`${rigged ? 'Bạn đã bị nhà cái bịp' : 'Bạn đã thua nhà cái'}: −${fmt(bet)} → còn ${fmt(money)}`, 'lose');
    sfx.lose(); loseEffect(); vibrate(250);
  }

  setTimeout(() => duckMusic(false), 1200);
  setBet(Math.min(getBet(), money));
  lockUI(false);

  // Hết tiền
  if (money === 0) {
    await sleep(1600);
    $('#overModal').classList.add('open');
    sfx.gameOver();
  }
}
