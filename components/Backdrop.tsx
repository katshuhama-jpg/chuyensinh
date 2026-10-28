/**
 * Nền pixel cho từng cảnh: nơi chốn (ngõ, lớp học, phòng ngủ, quán net, cổng trường, phố, quán,
 * nhà, công viên, văn phòng, vườn), giờ trong ngày (ngày, chiều, đêm), thời kỳ và dịp Tết.
 * Vẽ bằng các ô vuông trên lưới 160x90, rồi đổi sang lưới 200x100 có dải mặt đất rộng ở dưới.
 */

export type Place = 'ngo' | 'lop' | 'phong' | 'net' | 'cong' | 'pho' | 'quan' | 'nha' | 'congvien' | 'vanphong' | 'vuon';
export type Time = 'day' | 'dusk' | 'night';
export interface Bg {
  place: Place;
  time: Time;
  tet?: boolean;
}
type Era = 'old' | 'mid' | 'new' | 'future';
export const eraOf = (y: number): Era => (y < 1997 ? 'old' : y < 2012 ? 'mid' : y <= 2026 ? 'new' : 'future');

type R = [number, number, number, number, string];

const SKY: Record<Time, string[]> = {
  day: ['#8ec9ec', '#a3d4f0', '#b8def3', '#cde8f6', '#e2f2f9'],
  dusk: ['#7a5aa8', '#c46a86', '#e8889a', '#f3a98c', '#f6c79a'],
  night: ['#141026', '#1a1430', '#211a3a', '#2a2046', '#352a54'],
};

function sky(t: Time, h = 78): R[] {
  const b = SKY[t];
  const step = Math.ceil(h / b.length);
  const out: R[] = b.map((c, i) => [0, i * step, 160, step, c]);
  if (t === 'night') {
    for (const [x, y] of [
      [12, 6], [30, 14], [52, 4], [76, 11], [98, 5], [121, 15], [146, 8], [64, 22], [138, 26], [20, 28],
    ])
      out.push([x, y, 1, 1, '#fbeff2']);
    out.push([128, 6, 8, 8, '#fdf1c4'], [126, 8, 2, 4, '#fdf1c4'], [130, 7, 3, 3, '#e8dca8']);
  } else if (t === 'day') {
    out.push([18, 8, 10, 10, '#fff4b8'], [16, 10, 14, 6, '#fff4b8'], [60, 12, 18, 3, '#ffffff'], [64, 9, 10, 3, '#ffffff'], [110, 18, 22, 3, '#ffffff'], [114, 15, 12, 3, '#ffffff']);
  } else {
    out.push([20, 46, 16, 8, '#ffd28a'], [18, 48, 20, 4, '#ffd28a']);
  }
  return out;
}

const lit = (t: Time) => (t === 'night' ? '#ffd86a' : t === 'dusk' ? '#f6c77a' : '#9fc4e0');

/* ---------- từng nơi ---------- */

function ngo(t: Time, e: Era, tet?: boolean): R[] {
  const out = sky(t);
  out.push([0, 17, 160, 1, '#2a2030']); // dây điện
  const walls = ['#e8d3a8', '#d9a7a0', '#b9c7a8', '#e0c08a'];
  const tops = [26, 20, 30, 24];
  for (let i = 0; i < 4; i++) {
    const x = i * 40;
    const y = tops[i];
    out.push([x, y, 38, 78 - y, walls[i]]);
    // mái theo thời: ngói đỏ, sân thượng có téc nước, kính, viền neon
    if (e === 'old') out.push([x - 1, y - 3, 40, 3, '#a33a28']);
    else if (e === 'mid') out.push([x + 26, y - 6, 8, 6, '#c9d2dc'], [x, y - 1, 38, 1, '#7a6a58']);
    else if (e === 'new') out.push([x, y - 1, 38, 2, '#5a6a7a']);
    else out.push([x, y - 1, 38, 1, '#7fd1b9'], [x, y + 10, 38, 1, '#e8789f']);
    for (let f = 0; f < 3; f++) {
      const wy = y + 6 + f * 14;
      if (wy > 64) break;
      out.push([x + 6, wy, 9, 8, lit(t)], [x + 23, wy, 9, 8, f % 2 ? lit(t) : '#6a7a8a']);
      out.push([x + 5, wy + 8, 11, 1, '#5a4a3a'], [x + 22, wy + 8, 11, 1, '#5a4a3a']);
    }
    out.push([x + 14, 66, 10, 12, '#6a4a3a']); // cửa
  }
  // cây bàng
  out.push([116, 44, 5, 34, '#5a3a24'], [100, 30, 36, 8, '#3f7a3a'], [104, 24, 28, 8, '#4f9a46'], [108, 18, 20, 7, '#5fae52'], [98, 37, 40, 5, '#346a30']);
  if (tet) {
    for (const x of [10, 50, 90, 130]) out.push([x, 18, 6, 7, '#d93a3a'], [x + 2, 25, 2, 3, '#ffd24a'], [x + 1, 19, 4, 1, '#ffd24a']);
    out.push([70, 40, 20, 4, '#d93a3a']);
  }
  out.push([0, 78, 160, 12, '#6a6470']);
  return out;
}

function lop(t: Time, e: Era): R[] {
  const out: R[] = [[0, 0, 160, 76, '#efe4c8'], [0, 60, 160, 16, '#d9c9a0']];
  const future = e === 'future';
  out.push([26, 8, 108, 40, '#7a5a3a'], [28, 10, 104, 36, future ? '#1a2a40' : '#2f5a3c']);
  // chữ phấn hoặc chữ màn hình
  const ink = future ? '#7fd1b9' : '#e8e1d0';
  out.push([34, 16, 30, 2, ink], [34, 22, 46, 2, ink], [34, 28, 22, 2, ink], [90, 16, 30, 12, future ? '#2a4a6a' : '#3f6a4c'], [96, 20, 18, 1, ink], [96, 24, 12, 1, ink]);
  out.push([140, 10, 16, 26, '#a8d0ec'], [147, 10, 2, 26, '#efe4c8'], [140, 22, 16, 2, '#efe4c8']);
  out.push([4, 10, 16, 26, '#a8d0ec'], [11, 10, 2, 26, '#efe4c8'], [4, 22, 16, 2, '#efe4c8']);
  if (t === 'night') out.push([140, 10, 16, 26, '#2a2046'], [4, 10, 16, 26, '#2a2046']);
  out.push([78, 0, 4, 4, '#5a4a3a'], [68, 4, 24, 2, '#8a7a6a']); // quạt trần
  for (const x of [8, 48, 88, 128]) out.push([x, 62, 26, 4, '#a8763e'], [x + 2, 66, 2, 10, '#6a4a2a'], [x + 22, 66, 2, 10, '#6a4a2a']);
  out.push([0, 76, 160, 14, '#a87650'], [0, 76, 160, 1, '#c99a6a']);
  return out;
}

function phong(t: Time, e: Era): R[] {
  const night = t === 'night';
  const out: R[] = [[0, 0, 160, 76, night ? '#3f3260' : '#e8d9ef']];
  // cửa sổ nhìn ra trời
  out.push([96, 10, 44, 34, '#5a4a3a']);
  const s = sky(t, 30).map(([x, y, w, h, c]): R => [98 + (x * 40) / 160, 12 + (y * 30) / 78, Math.max(1, (w * 40) / 160), Math.max(1, (h * 30) / 78), c]);
  out.push(...s, [117, 12, 2, 30, '#5a4a3a'], [98, 26, 40, 2, '#5a4a3a']);
  // giường, bàn, đèn
  out.push([4, 56, 60, 14, '#e8789f'], [4, 50, 16, 8, '#fbeff2'], [4, 70, 60, 6, '#7a4a3a']);
  out.push([100, 54, 50, 4, '#a8763e'], [104, 58, 3, 18, '#6a4a2a'], [143, 58, 3, 18, '#6a4a2a']);
  out.push([136, 44, 8, 3, '#e0b54a'], [139, 47, 2, 7, '#5a4a3a']);
  if (night) out.push([128, 46, 24, 8, 'rgba(255,216,106,0.25)']);
  // đồ trên bàn theo thời: máy cassette, điện thoại cục gạch, laptop, kính thực tế ảo
  if (e === 'old') out.push([110, 48, 14, 6, '#30343f'], [112, 50, 4, 2, '#8a8a8a'], [118, 50, 4, 2, '#8a8a8a']);
  else if (e === 'mid') out.push([112, 46, 10, 8, '#30343f'], [114, 47, 6, 3, '#9bbc0f']);
  else if (e === 'new') out.push([108, 46, 18, 8, '#c9d2dc'], [110, 47, 14, 5, '#4a7ab8']);
  else out.push([110, 49, 14, 4, '#7fd1b9'], [112, 50, 4, 2, '#211833'], [118, 50, 4, 2, '#211833']);
  out.push([30, 16, 20, 26, '#f6c79a'], [33, 19, 14, 12, '#b48ad9'], [33, 34, 14, 2, '#e8789f']); // tranh dán tường
  out.push([0, 76, 160, 14, night ? '#2a2046' : '#b9a8c8'], [0, 76, 160, 1, night ? '#4f3d6b' : '#d6c8e0']);
  return out;
}

function net(t: Time, e: Era): R[] {
  const out: R[] = [[0, 0, 160, 76, '#151320'], [0, 0, 160, 6, '#211833']];
  out.push([20, 2, 120, 3, e === 'future' ? '#7fd1b9' : '#e8789f']);
  if (e === 'old') {
    // máy điện tử băng
    for (const x of [8, 48, 88, 128]) out.push([x, 24, 26, 52, '#3a2a5a'], [x + 3, 28, 20, 16, '#4a7ab8'], [x + 6, 32, 6, 4, '#ffd24a'], [x + 3, 50, 20, 6, '#211833'], [x + 6, 52, 3, 2, '#d93a3a'], [x + 14, 52, 3, 2, '#7fd1b9']);
  } else {
    const glow = e === 'future' ? '#b48ad9' : e === 'new' ? '#4a7ab8' : '#7fd1b9';
    for (const row of [0, 1])
      for (const x of [6, 42, 78, 114]) {
        const y = 24 + row * 24;
        out.push([x, y, 30, 18, '#2a2a38'], [x + 2, y + 2, 26, 13, glow], [x + 12, y + 18, 6, 3, '#2a2a38']);
        if (e === 'future') out.push([x + 4, y + 4, 10, 2, '#fbeff2']);
      }
  }
  out.push([0, 72, 160, 4, '#3a3448'], [0, 76, 160, 14, '#242030']);
  return out;
}

function cong(t: Time): R[] {
  const out = sky(t);
  out.push([0, 46, 160, 32, '#d9c9a0'], [0, 46, 160, 2, '#a87650']);
  out.push([22, 24, 10, 54, '#c9a878'], [128, 24, 10, 54, '#c9a878'], [32, 26, 96, 10, '#2f5a8c'], [36, 29, 88, 4, '#ffd24a']);
  out.push([32, 52, 96, 2, '#5a5a6a'], [32, 64, 96, 2, '#5a5a6a']);
  for (let x = 34; x < 128; x += 8) out.push([x, 50, 2, 28, '#5a5a6a']);
  for (const x of [2, 144]) out.push([x + 4, 40, 4, 38, '#5a3a24'], [x - 4, 26, 20, 16, '#4f9a46'], [x - 2, 20, 16, 8, '#5fae52']);
  out.push([0, 78, 160, 12, '#8a8490']);
  out.push([8, 83, 14, 4, '#c4573a'], [10, 87, 3, 2, '#211833'], [18, 87, 3, 2, '#211833']); // xe máy
  return out;
}

function pho(t: Time, e: Era): R[] {
  const out = sky(t);
  const bodies = t === 'night' ? ['#211a3a', '#2a2046', '#1a1430'] : ['#8a9ab0', '#a0aec0', '#7a8aa0'];
  const blds: [number, number, number][] = [[0, 30, 22], [24, 18, 20], [46, 36, 18], [66, 10, 24], [92, 28, 20], [114, 22, 22], [138, 34, 22]];
  blds.forEach(([x, y, w], i) => {
    out.push([x, y, w, 78 - y, bodies[i % 3]]);
    for (let wy = y + 4; wy < 74; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if ((wx + wy + i) % 3) out.push([wx, wy, 2, 3, t === 'night' ? ((wx + wy) % 4 ? '#ffd86a' : '#4a3d6a') : '#c9d9e8']);
  });
  if (e === 'future') out.push([66, 20, 24, 3, '#7fd1b9'], [24, 26, 20, 2, '#e8789f'], [114, 30, 22, 2, '#b48ad9'], [50, 14, 8, 3, '#7fd1b9'], [100, 8, 10, 3, '#e8789f']);
  else if (t === 'night') out.push([92, 36, 20, 4, '#e8789f'], [24, 30, 12, 3, '#7fd1b9']);
  for (const x of [16, 76, 136]) out.push([x, 50, 2, 28, '#3a3448'], [x - 2, 48, 8, 3, '#3a3448'], [x + 2, 51, 4, 2, t === 'night' ? '#ffd86a' : '#c9c2ba']);
  out.push([0, 78, 160, 12, '#3a3448']);
  return out;
}

function quan(t: Time, e: Era): R[] {
  if (e === 'old' || e === 'mid') {
    // quán cóc vỉa hè dưới gốc cây
    const out = sky(t);
    out.push([0, 40, 160, 36, t === 'night' ? '#3a2e4a' : '#e0c08a'], [0, 40, 160, 2, '#a87650'], [10, 46, 36, 20, lit(t)], [60, 46, 26, 14, '#6a4a3a']);
    out.push([112, 24, 6, 54, '#5a3a24'], [94, 14, 44, 12, '#3f7a3a'], [100, 8, 32, 8, '#4f9a46']);
    if (t === 'night') out.push([100, 30, 4, 4, '#ffd86a'], [124, 32, 4, 4, '#ffd86a']);
    out.push([0, 76, 160, 14, '#8a8490']);
    out.push([40, 76, 24, 3, '#c4573a'], [42, 79, 2, 6, '#c4573a'], [60, 79, 2, 6, '#c4573a'], [30, 81, 8, 4, '#4a7ab8'], [68, 81, 8, 4, '#d93a3a'], [48, 73, 4, 3, '#e8e1d0']);
    return out;
  }
  const night = t === 'night';
  const out: R[] = [[0, 0, 160, 76, night ? '#5a3a63' : '#f3dcc0']];
  out.push([100, 8, 54, 36, '#5a4a3a']);
  const s = sky(t, 34).map(([x, y, w, h, c]): R => [102 + (x * 50) / 160, 10 + (y * 32) / 78, Math.max(1, (w * 50) / 160), Math.max(1, (h * 32) / 78), c]);
  out.push(...s, [126, 10, 2, 32, '#5a4a3a']);
  out.push([8, 8, 40, 28, '#2a2030'], [12, 13, 22, 2, '#fbeff2'], [12, 19, 28, 2, '#fbeff2'], [12, 25, 18, 2, '#fbeff2'], [36, 12, 8, 8, e === 'future' ? '#7fd1b9' : '#e8789f']);
  for (const x of [58, 74, 90]) out.push([x, 0, 1, 10, '#3a3030'], [x - 2, 10, 5, 4, '#ffd86a']);
  out.push([0, 58, 160, 18, '#a8763e'], [0, 56, 160, 3, '#c99a6a']);
  out.push([20, 50, 6, 6, '#fbeff2'], [22, 48, 2, 2, '#e8789f'], [134, 50, 6, 6, '#fbeff2'], [64, 46, 8, 10, '#4f9a46'], [66, 42, 4, 4, '#5fae52']);
  if (e === 'future') out.push([140, 46, 10, 10, '#c9d2dc'], [142, 48, 2, 2, '#7fd1b9'], [146, 48, 2, 2, '#7fd1b9']); // robot pha chế
  out.push([0, 76, 160, 14, '#7a5a3a'], [0, 76, 160, 1, '#9a7a5a']);
  return out;
}

function nha(t: Time, e: Era, tet?: boolean): R[] {
  const out: R[] = [[0, 0, 160, 76, t === 'night' ? '#5a4060' : '#f0e0c8']];
  out.push([110, 10, 40, 30, '#5a4a3a']);
  const s = sky(t, 28).map(([x, y, w, h, c]): R => [112 + (x * 36) / 160, 12 + (y * 26) / 78, Math.max(1, (w * 36) / 160), Math.max(1, (h * 26) / 78), c]);
  out.push(...s);
  // tivi theo thời
  if (e === 'old') out.push([14, 40, 24, 18, '#5a4a3a'], [17, 43, 16, 12, '#8a9a8a']);
  else if (e === 'mid') out.push([12, 40, 28, 20, '#30343f'], [15, 43, 22, 14, '#4a7ab8']);
  else if (e === 'new') out.push([8, 34, 40, 22, '#211833'], [10, 36, 36, 18, '#4a7ab8']);
  else out.push([8, 34, 40, 22, 'rgba(127,209,185,0.5)'], [12, 38, 12, 2, '#fbeff2']);
  out.push([8, 58, 40, 4, '#7a4a3a']);
  // bàn ăn
  out.push([58, 56, 50, 4, '#a8763e'], [62, 60, 3, 16, '#6a4a2a'], [101, 60, 3, 16, '#6a4a2a'], [66, 52, 8, 4, '#fbeff2'], [80, 51, 10, 5, '#e0b54a'], [94, 52, 8, 4, '#fbeff2']);
  if (tet) {
    // câu đối, cành đào, đèn lồng
    out.push([52, 8, 6, 30, '#d93a3a'], [100, 8, 6, 30, '#d93a3a'], [53, 12, 4, 2, '#ffd24a'], [53, 20, 4, 2, '#ffd24a'], [101, 12, 4, 2, '#ffd24a'], [101, 20, 4, 2, '#ffd24a']);
    out.push([132, 50, 8, 26, '#c4573a'], [135, 34, 2, 16, '#5a3a24'], [128, 30, 4, 4, '#f39ac0'], [138, 28, 4, 4, '#f39ac0'], [132, 24, 4, 4, '#f6b8d0'], [142, 34, 4, 4, '#f39ac0'], [126, 38, 4, 4, '#f6b8d0']);
    out.push([74, 0, 1, 6, '#3a3030'], [71, 6, 8, 8, '#d93a3a'], [73, 14, 4, 3, '#ffd24a']);
  }
  out.push([0, 76, 160, 14, '#c9a878'], [0, 76, 160, 1, '#e0c49a']);
  for (let x = 0; x < 160; x += 16) out.push([x, 76, 1, 14, '#b09060']);
  return out;
}

function congvien(t: Time): R[] {
  const out = sky(t, 60);
  out.push([0, 54, 160, 14, t === 'night' ? '#2a3a6a' : '#6aa8d0'], [10, 58, 30, 1, '#c9e4f2'], [90, 62, 40, 1, '#c9e4f2']);
  for (const x of [6, 120]) out.push([x + 10, 34, 5, 34, '#5a3a24'], [x, 22, 26, 14, '#3f7a3a'], [x + 4, 16, 18, 8, '#4f9a46']);
  out.push([0, 68, 160, 22, '#5fae52'], [0, 68, 160, 1, '#7fc46a']);
  out.push([60, 66, 40, 3, '#a8763e'], [62, 69, 2, 6, '#5a3a24'], [96, 69, 2, 6, '#5a3a24'], [60, 60, 40, 2, '#a8763e']);
  out.push([108, 40, 2, 28, '#3a3448'], [106, 38, 6, 3, t === 'night' ? '#ffd86a' : '#c9c2ba']);
  return out;
}

function vanphong(t: Time, e: Era): R[] {
  const out: R[] = [[0, 0, 160, 76, '#d6d9e0']];
  out.push([20, 8, 120, 36, '#5a6a7a']);
  const s = pho(t, e)
    .filter(([, y]) => y < 78)
    .map(([x, y, w, h, c]): R => [22 + (x * 116) / 160, 10 + (y * 32) / 78, Math.max(1, (w * 116) / 160), Math.max(1, (h * 32) / 78), c]);
  out.push(...s, [78, 8, 4, 36, '#5a6a7a']);
  out.push([30, 56, 100, 4, '#e8e1d0'], [34, 60, 3, 16, '#8a8a9a'], [123, 60, 3, 16, '#8a8a9a']);
  out.push([70, 42, 22, 14, '#30343f'], [72, 44, 18, 10, e === 'future' ? '#7fd1b9' : '#4a7ab8'], [79, 56, 4, 2, '#30343f'], [40, 50, 10, 6, '#fbeff2'], [110, 50, 8, 6, '#4f9a46']);
  out.push([0, 76, 160, 14, '#8a8a9a'], [0, 76, 160, 1, '#a8a8b8']);
  return out;
}

function vuon(t: Time): R[] {
  const out = sky(t);
  out.push([0, 30, 50, 48, '#e0c08a'], [-2, 26, 54, 5, '#a33a28'], [8, 44, 12, 12, lit(t)], [30, 50, 12, 28, '#6a4a3a'], [0, 70, 56, 2, '#8a6a4a']);
  for (let x = 60; x < 160; x += 14) out.push([x, 62, 10, 10, '#4f9a46'], [x + 2, 58, 6, 4, '#5fae52'], [x + 4, 56, 2, 2, x % 28 ? '#f39ac0' : '#ffd24a']);
  out.push([0, 76, 160, 14, '#8c6a4a'], [0, 76, 160, 1, '#a88a6a']);
  out.push([68, 66, 14, 3, '#7a4a3a'], [68, 60, 3, 8, '#7a4a3a'], [70, 69, 2, 7, '#5a3a24'], [80, 69, 2, 7, '#5a3a24']); // ghế mây
  return out;
}

const PLACES: Record<Place, (t: Time, e: Era, tet?: boolean) => R[]> = { ngo, lop, phong, net, cong, pho, quan, nha, congvien, vanphong, vuon };

/* ---------- cùng cỡ điểm ảnh với nhân vật LPC ----------
   Nhân vật 64x64 hiện gấp đôi, nên 1 điểm ảnh = 2px. Nền vẽ trên lưới 200x100 rồi hiện đúng 400x200px
   (không co giãn), mỗi khối có viền tối, mặt trên sáng và lớp chấm sần như ô gạch LPC. */
const GW = 200;
const GH = 100;

function hex(c: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(c);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(c: string, k: number) {
  const v = hex(c);
  if (!v) return c;
  const f = (x: number) => Math.max(0, Math.min(255, Math.round(k > 0 ? x + (255 - x) * k : x * (1 + k))));
  return `#${v.map((x) => f(x).toString(16).padStart(2, '0')).join('')}`;
}

/** Đường chân trời (theo lưới cũ 160x90) của từng nơi: dưới đường này là mặt đất / sàn */
const HORIZON: Record<Place, number> = { ngo: 78, lop: 76, phong: 76, net: 76, cong: 78, pho: 78, quan: 76, nha: 76, congvien: 68, vanphong: 76, vuon: 76 };
/** Trên lưới mới, mặt đất bắt đầu từ hàng này: còn 36/100 cho nhân vật đứng, không đứng trên nóc nhà */
const GROUND = 64;

/** Đổi từ lưới cũ 160x90 sang lưới 200x100: phần trên chân trời co lại, mặt đất giãn ra;
 *  làm tròn về ô nguyên, thêm viền và mặt sáng cho khối lớn */
function toPixels(rects: R[], hz: number): R[] {
  const sx = GW / 160;
  const vy = (y: number) => (y <= hz ? (y * GROUND) / hz : GROUND + ((y - hz) * (GH - GROUND)) / (90 - hz));
  const out: R[] = [];
  for (const [x, y, w, h, c] of rects) {
    const X = Math.round(x * sx);
    const Y = Math.round(vy(y));
    const W = Math.max(1, Math.round((x + w) * sx) - X);
    const H = Math.max(1, Math.round(vy(y + h)) - Y);
    out.push([X, Y, W, H, c]);
    // khối đặc (tường, bàn, cây, cửa): viền tối hai bên và đáy, mép trên sáng
    if (W >= 4 && H >= 4 && W < GW && hex(c)) {
      const dark = mix(c, -0.28);
      out.push([X, Y, W, 1, mix(c, 0.22)], [X, Y + H - 1, W, 1, dark], [X, Y, 1, H, dark], [X + W - 1, Y, 1, H, dark]);
    }
  }
  return out;
}

const STREET: Place[] = ['ngo', 'pho', 'cong'];

/** Mặt đất: vỉa hè lát gạch rồi lòng đường (ngoài phố), sàn gạch / ván (trong nhà), cỏ (vườn, công viên) */
function ground(place: Place, base: string, time: Time): R[] {
  const out: R[] = [];
  const seam = mix(base, -0.16);
  const hi = mix(base, 0.12);
  if (STREET.includes(place)) {
    const walk = mix(base, 0.28);
    const kerb = 82;
    out.push([0, GROUND, GW, kerb - GROUND, walk], [0, GROUND, GW, 1, mix(walk, 0.15)]);
    for (let y = GROUND + 6; y < kerb; y += 6) out.push([0, y, GW, 1, mix(walk, -0.14)]);
    for (let y = GROUND, r = 0; y < kerb; y += 6, r++) for (let x = r % 2 ? 6 : 0; x < GW; x += 12) out.push([x, y, 1, 6, mix(walk, -0.14)]);
    out.push([0, kerb, GW, 2, mix(base, -0.3)], [0, kerb + 2, GW, GH - kerb - 2, base]);
    for (let x = 8; x < GW; x += 36) out.push([x, 92, 18, 2, time === 'night' ? '#b9ae96' : '#e8e1d0']);
    return out;
  }
  if (place === 'congvien' || place === 'vuon') {
    for (let i = 0; i < 46; i++) {
      const x = (i * 37) % GW;
      const y = GROUND + 3 + ((i * 13) % (GH - GROUND - 5));
      out.push([x, y, 1, 2, i % 3 ? seam : hi]);
    }
    if (place === 'congvien') out.push([70, GROUND + 14, 60, GH - GROUND - 14, '#c9a878'], [70, GROUND + 14, 60, 1, '#e0c49a']); // lối đi
    return out;
  }
  // trong nhà: sàn ô vuông so le
  for (let y = GROUND + 8; y < GH; y += 8) out.push([0, y, GW, 1, seam]);
  for (let y = GROUND, r = 0; y < GH; y += 8, r++) for (let x = r % 2 ? 12 : 0; x < GW; x += 24) out.push([x, y, 1, 8, seam]);
  out.push([0, GROUND + 1, GW, 1, hi]);
  return out;
}

export default function Backdrop({ bg, year, glitch }: { bg: Bg; year: number; glitch?: boolean }) {
  const raw = PLACES[bg.place](bg.time, eraOf(year), bg.tet);
  const hz = HORIZON[bg.place];
  const floor = raw.find(([x, y, w]) => x === 0 && y === hz && w === 160)?.[4] ?? '#6a6470';
  const pix = toPixels(raw, hz);
  // mặt đất vẽ ngay trên nền đất, dưới đồ vật (bàn, ghế, xe) đặt trên đất
  const at = pix.findIndex(([, y, w]) => y === GROUND && w === GW);
  const rects = at >= 0 ? [...pix.slice(0, at + 1), ...ground(bg.place, floor, bg.time), ...pix.slice(at + 1)] : [...pix, ...ground(bg.place, floor, bg.time)];
  return (
    <svg
      className={`backdrop ${glitch ? 'glitch' : ''}`}
      width={GW * 2}
      height={GH * 2}
      viewBox={`0 0 ${GW} ${GH}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        <pattern id="bd-dither" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1" height="1" fill="rgba(0,0,0,0.07)" />
          <rect x="1" y="1" width="1" height="1" fill="rgba(255,255,255,0.05)" />
        </pattern>
      </defs>
      {rects.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
      <rect x="0" y="0" width={GW} height={GH} fill="url(#bd-dither)" />
    </svg>
  );
}
