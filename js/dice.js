// ================== XÚC XẮC 3D ==================
// Vị trí chấm trên lưới 3x3 (ô 1..9)
const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
// Mỗi mặt của khối lập phương: [giá trị, phép xoay để đặt mặt đó]
const FACES = [[1, 'rotateY(0deg)'], [6, 'rotateY(180deg)'], [3, 'rotateY(90deg)'], [4, 'rotateY(-90deg)'], [2, 'rotateX(90deg)'], [5, 'rotateX(-90deg)']];
// Góc [X, Y] cần xoay cả khối để mặt v quay ra phía trước
const SHOW = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };

const dice = [...$$('.die')];
const rot = dice.map(() => ({ x: 0, y: 0, z: 0 }));

// Dựng 6 mặt cho mỗi viên
dice.forEach(die => {
  FACES.forEach(([v, r]) => {
    const f = document.createElement('div');
    f.className = 'face';
    f.dataset.v = v;
    f.style.transform = `${r} translateZ(var(--half))`;
    PIPS[v].forEach(cell => {
      const p = document.createElement('i');
      p.className = 'pip';
      p.style.gridArea = `${Math.ceil(cell / 3)} / ${(cell - 1) % 3 + 1}`;
      f.appendChild(p);
    });
    die.appendChild(f);
  });
});

// Xoay viên thứ i về mặt v. spin = true thì lộn vài vòng trước khi dừng
function setDie(i, v, spin = true) {
  const st = rot[i], [tx, ty] = SHOW[v];
  const up = (a) => Math.ceil(a / 360) * 360;
  st.x = up(st.x) + (spin ? 720 : 0) + tx;
  st.y = up(st.y) + (spin ? 1080 : 0) + ty;
  st.z = up(st.z) + (spin ? 360 : 0);
  dice[i].style.transform = `rotateX(${st.x}deg) rotateY(${st.y}deg) rotateZ(${st.z}deg)`;
}

// Mặt ngẫu nhiên lúc mới vào
[r6(), r6(), r6()].forEach((v, i) => setDie(i, v, false));
