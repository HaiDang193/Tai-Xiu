// ================== HÀM TIỆN ÍCH ==================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const r6 = () => 1 + Math.floor(Math.random() * 6);
const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + '$';
const isWin = (side, total) => side === 'tai' ? total > 10 : total <= 10;

// ================== TRẠNG THÁI GAME ==================
let money = 0;        // số dư thật
let shownMoney = 0;   // số đang hiển thị (để chạy hiệu ứng đếm số)
let side = null;      // 'tai' | 'xiu'
let rolling = false;  // đang lắc thì khoá giao diện
const history = [];   // lịch sử các ván: { total, side, dice }
