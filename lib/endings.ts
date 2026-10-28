/**
 * Kết cục: kết cục giữa chừng (mối tình đứt ngang), kết cục tình yêu, kết cục cuối đời,
 * thẻ "Bạn yêu kiểu gì" và lời thầy bói có ứng nghiệm không.
 */

import type { Character, Family } from './character';
import { PROPHECIES } from './fate';
import { ctxOf, LOVE_IDS, LOVES, type LoveId, type Story } from './story';
import { jobOf } from './profiles';
import { spouseName } from './scenes';

export const MIDS: Record<string, { name: string; desc: string }> = {
  luotqua: { name: 'Lướt Qua Nhau', desc: 'Người bạn nhà bên trở về, nhưng không ai nhận ra ai.' },
  seen: { name: 'Để "Đã Xem"', desc: 'Một tin nhắn không hồi âm, và người ấy thôi không nhắn nữa.' },
  quet: { name: 'Quẹt Mỏi Tay', desc: 'Một tháng trên app hẹn hò, chỉ gặp ảnh ảo và người hỏi vay tiền.' },
  leocay: { name: 'Leo Cây Buổi Hẹn Đầu', desc: 'Đến muộn một tiếng, và không có buổi hẹn thứ hai.' },
  xa: { name: 'Xa Mặt Cách Lòng', desc: 'Người đi lao động xa, người ở lại buông tay.' },
  camcan: { name: 'Bố Mẹ Cấm Cản', desc: 'Một câu "không được" của bố, và hai người thôi gặp nhau.' },
  cuoivoi: { name: 'Cưới Vội', desc: 'Nhận lời khi còn chưa hiểu nhau.' },
  traxanh: { name: 'Trà Xanh Thắng Thế', desc: 'Bạn thân và người yêu, mất cả hai trong một tối.' },
  bocphot: { name: 'Bóc Phốt', desc: 'Kể hết cho thiên hạ, và người ấy không quay lại nữa.' },
  nguoicu: { name: 'Người Cũ Quay Lại', desc: 'Một ly cà phê với người cũ làm rạn cả một gia đình.' },
  thachcuoi: { name: 'Đám Cưới Đổ Vì Sính Lễ', desc: 'Hai nhà mặc cả mâm quả, và đám cưới không bao giờ diễn ra.' },
  danhghen: { name: 'Đánh Ghen Lên Mạng', desc: 'Một clip đánh ghen triệu view, và không ai thắng cả.' },
  lyhon: { name: 'Đường Ai Nấy Đi', desc: 'Ký đơn ly hôn ở tòa, mỗi người một ngả.' },
  luadao: { name: 'Người Yêu Qua Mạng', desc: 'Yêu một tài khoản chưa từng gặp, và mất trắng tiền tiết kiệm.' },
  cacahaitay: { name: 'Bắt Cá Hai Tay', desc: 'Bị phát hiện trong nhóm chat ba người, mất cả hai.' },
};

const LOVE_END: Record<string, (n: string) => { name: string; desc: string }> = {
  hanhphuc_khoi: (n) => ({ name: 'Thanh Mai Trúc Mã', desc: `Cưới ${n}, người bạn nhà bên từ thuở bé. Con diều năm nào giờ treo trong phòng khách.` }),
  hanhphuc_long: (n) => ({ name: 'Lãng Tử Quay Đầu', desc: `Cưới ${n} sau khi ${n} bỏ hẳn những đêm đua xe.` }),
  hanhphuc_minh: (n) => ({ name: 'Học Bá Tan Chảy', desc: `Cưới ${n}, người lạnh lùng nhất lớp, hóa ra lại là người dịu dàng nhất nhà.` }),
  dodang: (n) => ({ name: 'Cưới Rồi Mới Biết', desc: `Cưới ${n}, yêu nhiều nhưng không hợp nhau ở những điều quan trọng.` }),
  chilaban: (n) => ({ name: 'Mãi Là Bạn', desc: `${n} quý mình thật lòng, nhưng chỉ như một người bạn.` }),
  lohen: (n) => ({ name: 'Lỡ Một Nhịp', desc: `Yêu ${n}, nhưng không đến được với nhau.` }),
  muon: (n) => ({ name: 'Tình Muộn', desc: `Ngoài bốn mươi mới về chung một nhà với ${n}.` }),
  cuoivoi: () => ({ name: 'Cưới Vội', desc: 'Cưới khi còn chưa hiểu nhau, rồi cả đời tập hiểu.' }),
  bimeep: () => ({ name: 'Bị Mẹ Ép Cưới', desc: 'Cưới người xem mắt. Không ồn ào, không cổ tích.' }),
  docthan: () => ({ name: 'Độc Thân Vui Vẻ', desc: 'Không cưới ai, và sống vui theo cách của mình.' }),
  lyhon: (n) => ({ name: 'Đường Ai Nấy Đi', desc: n ? `Từng cưới ${n}, rồi ly hôn. Nửa sau cuộc đời mỗi người một ngả.` : 'Từng cưới, rồi ly hôn. Nửa sau cuộc đời tự đi một mình.' }),
  nguoicu: () => ({ name: 'Người Cũ Quay Lại', desc: 'Gia đình rạn vỡ sau một lần gặp lại người cũ.' }),
};

/** Các kết cục của một người (cho Bản đồ tình duyên) */
export const ROUTE_ENDS = ['hanhphuc', 'dodang', 'chilaban', 'lohen', 'muon', 'lyhon'] as const;
/** Kết cục chung không gắn với ai */
export const SOLO_ENDS = ['bimeep', 'cuoivoi', 'docthan', 'nguoicu'] as const;

/** Tên và mô tả một kết cục theo mã, lg là giới người yêu */
export function endingInfo(id: string, lg: 'm' | 'f') {
  const [kind, who] = id.split('_') as [string, LoveId | undefined];
  const n = who && LOVES[who] ? LOVES[who][lg] : '';
  if (kind === 'hanhphuc' && who && !LOVE_END[id]) return { name: LOVES[who].happy, desc: `Cưới ${n} và hạnh phúc đến tận già.` };
  const f = LOVE_END[id] ?? LOVE_END[kind];
  return f ? f(n) : MIDS[id] ?? { name: id, desc: '' };
}

export function loveEndOf(c: Character, s: Story) {
  const lg = c.gender === 'f' ? 'm' : 'f';
  const id = s.loveEnd ?? (s.married ? 'bimeep' : 'docthan');
  const [kind, who] = id.split('_') as [string, LoveId | undefined];
  const n = who ? LOVES[who][lg] : '';
  if (kind === 'hanhphuc' && who && !LOVE_END[id]) return { id, name: LOVES[who].happy, desc: `Cưới ${n}, ${jobOf(who, lg, 40, 2040)}, và hạnh phúc đến tận già.` };
  const f = LOVE_END[id] ?? LOVE_END[kind];
  return { id, ...f(n) };
}

/** Danh hiệu cả đời */
export function titlesOf(s: Story) {
  const out: { name: string; desc: string }[] = [];
  if ((s.peak ?? 0) >= 3 && !s.flags.includes('caught')) out.push({ name: 'Cao Thủ Thả Thính', desc: 'Từng giữ 3 người thân cùng lúc mà chưa một lần bị phát hiện.' });
  if (s.met.length >= 10) out.push({ name: 'Đào Hoa Cả Đời', desc: 'Gặp đủ 10 người trong một đời.' });
  if (s.met.length <= 2 && s.married) out.push({ name: 'Một Đời Một Người', desc: 'Chỉ quen rất ít người, và cưới một trong số đó.' });
  return out;
}

export function oldEndOf(s: Story) {
  const sp = s.married && s.partner && s.partner !== 'xemmat' ? s.love[s.partner] : s.married ? 55 : 0;
  if (s.married && sp >= 60 && s.kids > 0 && s.rel.con >= 50) return { id: 'o_tudai', name: 'Tứ Đại Đồng Đường', desc: 'Con cháu đầy nhà, bạn đời ở bên đến phút cuối.' };
  if (s.married && sp >= 50 && s.loveEnd !== 'nguoicu') return { id: 'o_bangia', name: 'Bạn Già', desc: 'Hai người già nắm tay nhau đi bộ mỗi chiều.' };
  if (s.kids > 0 && s.rel.con >= 45) return { id: 'o_conchau', name: 'Con Cháu Quây Quần', desc: 'Những ngày cuối, các con thay nhau về chăm.' };
  if (s.rel.banthan >= 45) return { id: 'o_hoibangia', name: 'Hội Bạn Già', desc: 'Không có ai bên gối, nhưng có cả hội bạn già đến tận cuối.' };
  return { id: 'o_langle', name: 'Lặng Lẽ Ra Đi', desc: 'Một buổi chiều yên tĩnh, ít người hay tin.' };
}

/** Thẻ "Bạn yêu kiểu gì", rút từ chỉ số cả đời */
export function loveTypeOf(s: Story) {
  const k = (['noi', 'tinh', 'hoc', 'duyen'] as ('noi' | 'tinh' | 'hoc' | 'duyen')[]).sort((a, b) => s.stats[b] - s.stats[a])[0];
  return {
    noi: { name: 'Trái Tim Nổi Loạn', desc: 'Yêu là phải liều. Thà sai còn hơn chưa từng thử.' },
    tinh: { name: 'Người Yêu Siêu Lì', desc: 'Đã thương ai là thương rất lâu, nhớ từng chuyện nhỏ.' },
    hoc: { name: 'Lý Trí Hơn Con Tim', desc: 'Nghĩ kỹ rồi mới yêu, và yêu thì rất chắc.' },
    duyen: { name: 'Cao Thủ Thả Thính', desc: 'Đi đâu cũng có người để ý. Giữ ai lại là chuyện khác.' },
  }[k];
}

/** Ai đến tiễn ở đám tang */
export function funeralOf(c: Character, f: Family, s: Story) {
  const x = ctxOf(c, f, s, 80);
  const list: string[] = [];
  if (s.married && !(s.flags.includes('ngoaitinh') && s.loveEnd === 'nguoicu')) {
    const sp = spouseName(x);
    list.push(`${sp.charAt(0).toUpperCase() + sp.slice(1)}, người nắm tay đến phút cuối`);
  }
  if (s.kids) list.push(s.kids > 1 ? 'Hai đứa con và các cháu' : 'Đứa con và các cháu');
  if (s.rel.banthan >= 40) list.push(`${s.bestie}, bạn thân từ thuở nhỏ`);
  for (const id of LOVE_IDS) if (id !== s.partner && s.love[id] >= 45) list.push(`${x.L(id)}, đứng lặng ở cuối hàng`);
  if (f.siblings.length) list.push('Anh chị em trong nhà');
  list.push('Hàng xóm trong ngõ cũ');
  return list;
}

export function fateResultOf(s: Story) {
  const p = PROPHECIES.find((x) => x.id === s.fate)!;
  return { text: p.text, came: p.check(s) };
}

/** Tuổi thọ: theo tuổi thọ trung bình Việt Nam 2025 (nam 72,3, nữ 77,3), cộng trừ theo tâm trạng và người thân */
export function lifespanOf(c: Character, s: Story) {
  const base = c.gender === 'f' ? 77 : 72;
  const d = (s.stats.tam - 50) / 5 + (s.married ? 2 : 0) + (s.rel.banthan - 40) / 10;
  return Math.max(76, Math.min(95, Math.round(base + d)));
}
