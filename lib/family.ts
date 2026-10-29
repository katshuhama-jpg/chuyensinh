/**
 * Sổ gia đình sau cưới: con sinh năm nào, vàng cưới còn bao nhiêu, đang ở đâu.
 * Mọi cảnh sau cưới đọc từ đây, để chuyện năm sau nối đúng vào chuyện năm trước.
 */
import type { Ctx } from './story';
import { fmtGold, fmtVND, goldPrice } from './money';
import { regionOf } from './names';

/** tuổi của mình lúc từng đứa con chào đời (đời cũ chưa ghi thì coi như sinh năm 33) */
export function bornOf(s: { kids?: number; kidBorn?: number[] }) {
  const n = s.kids ?? 0;
  const b = (s.kidBorn ?? []).slice(0, n);
  while (b.length < n) b.push(b.length ? b[b.length - 1] + 3 : 33);
  return b;
}
/** tuổi đứa lớn, -1 nếu chưa có con */
export const eldest = (x: Ctx) => {
  const b = bornOf(x.s);
  return b.length ? x.age - b[0] : -1;
};
/** tuổi đứa út, -1 nếu chưa có con */
export const youngest = (x: Ctx) => {
  const b = bornOf(x.s);
  return b.length ? x.age - b[b.length - 1] : -1;
};
/** "con" hay "hai đứa" hay "ba đứa" */
export const kidsWord = (x: Ctx) => ((x.s.kids ?? 0) >= 3 ? 'ba đứa' : (x.s.kids ?? 0) === 2 ? 'hai đứa' : 'con');

/** vàng cưới hai họ trao (chỉ): theo thời, theo miền, theo gia cảnh */
export function weddingGold(x: Ctx) {
  let n = x.year < 1990 ? 2 : x.year < 2000 ? 3 : x.year < 2015 ? 10 : 15;
  if (regionOf(x.f.province) === 'nam') n += 3;
  if (x.f.wealth === 'Khá giả') n += 5;
  if (x.f.wealth === 'Hào môn') n += 20;
  if (x.f.wealth === 'Nhà nông' || x.f.wealth === 'Lao động phổ thông') n -= 1;
  return Math.max(2, n);
}
export const goldOf = (x: Ctx) => x.s.gold ?? 0;
/** vàng còn giữ đáng bao nhiêu tiền năm nay */
export const goldVND = (x: Ctx) => Math.round(goldOf(x) * goldPrice(x.year));
/** "10 chỉ vàng cưới (giờ bán được 150 triệu)" */
export const goldText = (x: Ctx) => `${fmtGold(goldOf(x))} vàng cưới (giờ bán được ${fmtVND(goldVND(x))})`;

/** đang ở đâu: chung với bố mẹ, thuê, nhà trả góp, nhà xây ở quê */
export function homeOf(x: Ctx): 'gop' | 'xay' | 'nha' | 'chung' | 'thue' | null {
  if (x.s.flags.some((f) => f.startsWith('nha_gop_'))) return 'gop';
  if (x.has('nha_xay')) return 'xay';
  if (x.has('ms_nha')) return 'nha';
  if (x.has('o_chung')) return 'chung';
  if (x.s.flags.some((f) => f.startsWith('thue_'))) return 'thue';
  return null;
}
