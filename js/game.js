// ================== SỰ KIỆN ==================
$$('.side').forEach(b => b.onclick = () => {
  if (rolling) return;
  side = b.dataset.side;
  sfx.chip();
  updateStake();
});

$$('.chip').forEach(c => c.onclick = () => {
  sfx.chip();
  if (c.dataset.v === 'all') { setBet(money); toast('🔥 ALL IN?!'); }
  else setBet(getBet() + Number(c.dataset.v));
});

$('#btnClear').onclick = () => setBet(0);
$('#betInput').oninput = updateStake;
$('#btnRoll').onclick = play;

$('#btnSound').onclick = () => {
  soundOn = !soundOn;
  $('#btnSound').textContent = soundOn ? '🔊' : '🔇';
};

// Phím tắt: T = Tài, X = Xỉu, Enter = Lắc
addEventListener('keydown', e => {
  if (rolling || document.querySelector('.modal.open')) return;
  if (e.key === 't' || e.key === 'T') { side = 'tai'; updateStake(); }
  if (e.key === 'x' || e.key === 'X') { side = 'xiu'; updateStake(); }
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
  if (v <= 0) { toast('Nhập số tiền cần nạp đã bạn ơi'); return; }
  money = round2(money + v);
  renderMoney(); floatNum(v);
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
  if (!side) { toast('Vui lòng chọn Tài hoặc Xỉu'); return; }
  if (bet <= 0) { toast('Nhập số tiền cược đi đã'); return; }
  if (bet > money) { toast('Tiền cược phải ≤ số dư'); return; }

  lockUI(true);
  const allIn = bet === money;
  const rigged = allIn && $('#rig').checked;

  // Trừ tiền cược trước (giống code Python)
  money = round2(money - bet);
  renderMoney(); floatNum(-bet);
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
  const plate = $('#plate');
  plate.classList.add('covered');
  await sleep(450);
  plate.classList.add('shaking');
  sfx.rattle();
  roll.forEach((v, i) => setDie(i, v, false));
  await sleep(1400);
  plate.classList.remove('shaking');
  if (rigged) { toast('thế thua em nhé 😏'); log('thế thua em nhé', 'warn'); }
  await sleep(300);

  // Mở bát, lật từng viên
  plate.classList.remove('covered');
  $('#resultText').textContent = 'Kết quả…';
  await sleep(500);

  let total = 0;
  for (let i = 0; i < 3; i++) {
    const slot = dice[i].parentElement;
    slot.classList.remove('hop'); void slot.offsetWidth; slot.classList.add('hop');
    setDie(i, roll[i], true);
    await sleep(850);
    sfx.land();
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
    sfx.win(); confetti();
  } else {
    const msg = rigged ? 'Bạn đã bị nhà cái bịp 🤡' : 'Thua nhà cái';
    $('#resultText').innerHTML = `<b style="color:#ff7a8f">${msg} −${fmt(bet)}</b>`;
    log(`${rigged ? 'Bạn đã bị nhà cái bịp' : 'Bạn đã thua nhà cái'}: −${fmt(bet)} → còn ${fmt(money)}`, 'lose');
    sfx.lose(); loseEffect();
  }

  setBet(Math.min(getBet(), money));
  lockUI(false);

  // Hết tiền
  if (money === 0) {
    await sleep(1600);
    $('#overModal').classList.add('open');
  }
}
