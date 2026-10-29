/**
 * Tài sản bằng tiền thật (VNĐ) theo thời kỳ.
 * Điểm "Tài chính" (0-100) vẫn là gốc; ở đây đổi ra số tiền cho người chơi nhìn thấy,
 * và đổi giá đồ (quà, đi chơi, nhà, xe...) ra điểm để trừ cho khớp.
 */

/** mặt bằng giá so với năm 2020 (1 = giá 2020) */
const SCALE: [number, number][] = [
  [1950, 0.01],
  [1975, 0.015],
  [1986, 0.03],
  [1990, 0.08],
  [1995, 0.18],
  [2000, 0.27],
  [2005, 0.38],
  [2010, 0.6],
  [2015, 0.82],
  [2020, 1],
  [2025, 1.18],
  [2030, 1.35],
  [2050, 2],
  [2100, 3.5],
];
export function priceScale(year: number) {
  if (year <= SCALE[0][0]) return SCALE[0][1];
  for (let i = 1; i < SCALE.length; i++) {
    const [y1, v1] = SCALE[i];
    const [y0, v0] = SCALE[i - 1];
    if (year <= y1) return v0 + ((v1 - v0) * (year - y0)) / (y1 - y0);
  }
  return SCALE[SCALE.length - 1][1];
}

/** trẻ con chỉ có tiền heo đất, lớn dần thì tiền mới thành tài sản */
function ageFactor(age: number) {
  if (age < 6) return 0.004;
  if (age < 10) return 0.01;
  if (age < 15) return 0.03;
  if (age < 18) return 0.08;
  if (age < 22) return 0.25;
  if (age < 26) return 0.6;
  return 1;
}

/** 1 điểm Tài chính bằng bao nhiêu đồng ở năm này, tuổi này (người lớn năm 2020: 3 triệu) */
export function unitOf(year: number, age: number) {
  return 3_000_000 * priceScale(year) * ageFactor(age);
}

/** tài sản đang có (VNĐ) */
export function wealthOf(tien: number, year: number, age: number) {
  return Math.max(0, tien) * unitOf(year, age);
}

/** giá (VNĐ theo năm 2020) đổi ra số tiền đúng năm */
export function priceAt(vnd2020: number, year: number) {
  return vnd2020 * priceScale(year);
}

/** số điểm Tài chính phải trừ khi tiêu một khoản (VNĐ đúng năm) */
export function pointsOf(vnd: number, year: number, age: number) {
  return vnd / unitOf(year, age);
}

const nf = (n: number, d = 0) => n.toLocaleString('vi-VN', { maximumFractionDigits: d });

/** 350 nghìn · 12,5 triệu · 1,2 tỷ */
export function fmtVND(v: number) {
  const a = Math.abs(v);
  if (a < 1_000) return '0 đồng';
  if (a < 1_000_000) return `${nf(Math.round(a / 1000 / 10) * 10 || Math.round(a / 1000))} nghìn`;
  if (a < 1_000_000_000) return `${nf(a / 1e6, a < 1e7 ? 1 : 0)} triệu`;
  return `${nf(a / 1e9, a < 1e10 ? 1 : 0)} tỷ`;
}

/** Tiền để dành được trong một năm (VNĐ): bé thì lì xì bỏ heo đất, lớn thì tiền lương trừ chi tiêu.
 *  Điểm Tài chính là "khả năng kiếm tiền"; con nhỏ thì tốn kém, về già có lương hưu ít ỏi. */
export function savingOf(s: { stats: { tien: number }; kids?: number; kidBorn?: number[]; flags: string[]; marriedAge?: number | null }, year: number, age: number) {
  const u = unitOf(year, age);
  const t = s.stats.tien;
  const work = s.flags.includes('dilam');
  let k: number;
  if (age < 6) k = 8;
  else if (age < 15) k = 10;
  else if (age < 18) k = 10 + (work ? 6 : 0);
  else if (age < 22) k = work ? 8 + t / 12 : 3;
  else if (age < 60) k = t / 7 - 1;
  else k = 1 + t / 30;
  // nuôi con: mỗi đứa tốn chừng hai phần ba khoản để dành của một năm, đến khi con lớn
  // (tính theo tuổi thật của từng đứa: từ lúc chào đời đến năm hai mươi hai tuổi)
  if (s.kids) {
    const born = s.kidBorn?.length ? s.kidBorn.slice(0, s.kids) : Array.from({ length: s.kids }, (_, i) => 33 + i * 3);
    k -= 1.6 * born.filter((b) => age >= b && age - b < 22).length;
  }
  // trả góp nhà: hai mươi năm, mỗi năm một khoản
  const gop = s.flags.find((f) => f.startsWith('nha_gop_'));
  if (gop && age - Number(gop.slice(8)) < 20) k -= 4;
  // nuôi xe ô tô: xăng, gửi xe, bảo dưỡng
  if (s.flags.includes('oto')) k -= 1.2;
  // ở quê làm nông thì để dành được ít hơn ở phố, nhưng tốn ít hơn
  if (s.flags.includes('o_que') && age >= 22) k *= 0.8;
  // nghèo quá thì cũng chỉ hụt chi một chút mỗi năm, không âm mãi
  return Math.max(-0.5, k) * u;
}
/** tài sản đang có; đời cũ chưa có sổ tiền thì ước theo điểm Tài chính */
export function cashOf(s: { cash?: number; stats: { tien: number } }, year: number, age: number) {
  return s.cash ?? wealthOf(s.stats.tien, year, age);
}
/** "12 triệu" hoặc "Nợ 12 triệu" */
export function fmtCash(v: number) {
  return v < 0 ? `Nợ ${fmtVND(-v)}` : fmtVND(v);
}

/** giá một lượng (cây) vàng SJC theo năm, VNĐ đúng năm (số tròn, để kể chuyện) */
const GOLD: [number, number][] = [
  [1975, 300_000], [1985, 1_200_000], [1990, 2_800_000], [1995, 4_500_000], [2000, 5_100_000], [2005, 8_800_000],
  [2008, 18_000_000], [2011, 45_000_000], [2013, 36_000_000], [2016, 35_000_000], [2020, 55_000_000], [2023, 70_000_000],
  [2024, 85_000_000], [2025, 120_000_000], [2026, 150_000_000],
];
/** giá một chỉ vàng năm y (sau 2026 giả định tăng 4% một năm) */
export function goldPrice(y: number) {
  if (y >= 2026) return (GOLD[GOLD.length - 1][1] * Math.pow(1.04, y - 2026)) / 10;
  if (y <= GOLD[0][0]) return GOLD[0][1] / 10;
  const i = GOLD.findIndex(([a]) => a > y);
  const [a0, v0] = GOLD[i - 1];
  const [a1, v1] = GOLD[i];
  return (v0 + ((v1 - v0) * (y - a0)) / (a1 - a0)) / 10;
}
/** "7 chỉ" · "1 cây" · "1 cây 5 chỉ" */
export function fmtGold(chi: number) {
  const c = Math.floor(chi / 10);
  const r = chi % 10;
  return c ? `${c} cây${r ? ` ${r} chỉ` : ''}` : `${r} chỉ`;
}
