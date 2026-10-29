/**
 * "Năm nay tập trung cho gì" (kiểu 1in8b, giữ khối nút như Bảng tình duyên cũ):
 * Học hành, Tình yêu, Kiếm tiền, Du lịch, Gia đình, Bạn bè, Bản thân.
 * Mỗi năm chọn một mảng, rồi chọn một việc cụ thể trong mảng đó. Việc đổi theo tuổi và theo thời kỳ
 * (đúng nhân khẩu học và sự kiện Việt Nam). Mỗi việc để lại cờ cánh bướm; mảng nào chọn nhiều nhất
 * quyết định "cả đời dành cho điều gì" ở cuối đời, và kéo theo người mình dễ gặp.
 */

import { choose, ctxOf, type Choice, type Ctx, type Feedback, type LoveId, type Resolve, type Scene, type Story } from './story';
import type { Character, Family } from './character';
import { cashOf, fmtVND, pointsOf, priceAt } from './money';
import type { Place } from '@/components/Backdrop';

export type AreaKey = 'hoc' | 'yeu' | 'tien' | 'dulich' | 'nha' | 'ban' | 'minh';
export const AREAS: { k: AreaKey; t: string; icon: string; d: string }[] = [
  { k: 'hoc', t: 'Học hành', icon: '✎', d: 'Hiểu biết ↑' },
  { k: 'yeu', t: 'Tình yêu', icon: '♥', d: 'Tình duyên ↑' },
  { k: 'tien', t: 'Kiếm tiền', icon: '$', d: 'Tài chính ↑' },
  { k: 'dulich', t: 'Du lịch', icon: '✈', d: 'Vui vẻ ↑ gặp người lạ' },
  { k: 'nha', t: 'Gia đình', icon: '⌂', d: 'Gắn kết ↑' },
  { k: 'ban', t: 'Bạn bè', icon: '☺', d: 'Bạn thân ↑' },
  { k: 'minh', t: 'Bản thân', icon: '✦', d: 'Sức khỏe, Nhan sắc ↑' },
];

/** đang đi lao động nước ngoài (ba năm kể từ năm đi) */
export const away = (x: Ctx) => x.s.flags.some((f) => f.startsWith('xk_') && x.age - Number(f.slice(3)) >= 0 && x.age - Number(f.slice(3)) <= 2);

type Opt = Choice & { y0?: number; y1?: number; min?: number; max?: number; when?: (x: Ctx) => boolean };

const partner = (x: Ctx): LoveId | null => (x.s.partner && x.s.partner !== 'xemmat' ? x.s.partner : null);
const pool = (x: Ctx) => (Object.keys(x.s.love) as LoveId[]).filter((id) => x.has(`pool_${id}`) && !x.has(`${id}_out`));
const closest = (x: Ctx) => partner(x) ?? pool(x).sort((a, b) => x.s.love[b] - x.s.love[a])[0] ?? null;
const covid = (x: Ctx) => x.year === 2020 || x.year === 2021;

const OPTS: Record<AreaKey, Opt[]> = {
  hoc: [
    { t: 'Đi học thêm buổi tối', max: 17, do: (fx) => (fx.stat('hoc', 6), fx.stat('tam', -2)) },
    { t: 'Ôn thi vào trường chuyên', min: 13, max: 15, do: (fx) => (fx.stat('hoc', 8), fx.stat('khoe', -2), fx.flag('ac_chuyen')), note: '🦋 Thi chuyên năm ấy sẽ còn được nhắc lại.' },
    { t: (x) => (x.year < 2002 ? 'Lên thành phố ở trọ luyện thi' : 'Đi lò luyện thi đại học'), min: 16, max: 18, do: (fx) => (fx.stat('hoc', 8), fx.stat('tien', -4), fx.flag('ac_luyenthi')) },
    { t: 'Đọc hết tủ sách ở thư viện', max: 25, do: (fx) => (fx.stat('hoc', 5), fx.stat('tinh', 2)) },
    { t: (x) => (x.year < 2005 ? 'Học tiếng Anh ở trung tâm' : 'Luyện thi IELTS'), min: 16, y0: 1993, do: (fx) => (fx.stat('hoc', 6), fx.flag('ac_tienganh')), note: '🦋 Tiếng Anh sẽ mở ra một cánh cửa.' },
    { t: 'Học văn bằng hai buổi tối', min: 22, max: 40, do: (fx) => (fx.stat('hoc', 6), fx.stat('tam', -3)) },
    { t: (x) => (x.year < 2010 ? 'Thi học bổng du học' : 'Xin học bổng thạc sĩ nước ngoài'), min: 21, max: 32, y0: 1995, when: (x) => x.s.stats.hoc >= 50, do: (fx) => (fx.stat('hoc', 8), fx.flag('ac_duhoc')), note: '🦋 Học bổng này có thể đưa mình đi rất xa.' },
    { t: 'Học khóa online buổi đêm', min: 18, y0: 2014, do: (fx) => (fx.stat('hoc', 5), fx.stat('khoe', -1)) },
    { t: 'Học lái ô tô', min: 25, y0: 2005, when: (x) => x.s.stats.tien >= 40, do: (fx) => (fx.stat('hoc', 2), fx.stat('tien', -4), fx.flag('ac_oto')) },
    { t: 'Đi học lớp cho người cao tuổi', min: 60, do: (fx) => (fx.stat('hoc', 4), fx.stat('tam', 4)) },
  ],
  yeu: [
    { t: (x) => `Viết thư tay cho ${x.L(closest(x)!)}`, min: 13, y1: 2008, when: (x) => !!closest(x), do: (fx, x) => fx.love(closest(x)!, 8) },
    { t: (x) => `Nhắn tin chúc ngủ ngon ${x.L(closest(x)!)} mỗi tối`, min: 14, y0: 2004, when: (x) => !!closest(x), do: (fx, x) => fx.love(closest(x)!, 8) },
    { t: (x) => `Dành cả mùa hè đi chơi với ${x.L(closest(x)!)}`, min: 16, when: (x) => !!closest(x), do: (fx, x) => (fx.love(closest(x)!, 10), fx.stat('hoc', -3)) },
    { t: 'Nhờ cô dì mai mối', min: 24, max: 45, when: (x) => !partner(x) && !x.s.married, do: (fx) => (fx.stat('dao', 6), fx.rel('bome', 4), fx.flag('ac_maimoi')) },
    { t: (x) => (x.year < 2015 ? 'Lên diễn đàn kết bạn' : 'Mở app hẹn hò'), min: 18, max: 45, y0: 2003, when: (x) => !partner(x) && !x.s.married, do: (fx) => (fx.stat('dao', 8), fx.flag('ac_app')), note: '🦋 Năm sau sẽ có thêm người mới để chọn.' },
    { t: 'Đi học nhảy, câu lạc bộ hát', min: 18, max: 40, do: (fx) => (fx.stat('duyen', 5), fx.stat('dao', 4)) },
    { t: (x) => `Kỷ niệm ngày cưới với ${x.L(partner(x)!)}`, min: 25, when: (x) => x.s.married && !!partner(x), do: (fx, x) => (fx.love(partner(x)!, 10), fx.stat('tien', -3)) },
    { t: (x) => `Cùng ${x.L(partner(x)!)} đi tư vấn hôn nhân`, min: 28, y0: 2010, when: (x) => x.s.married && !!partner(x) && x.s.love[partner(x)!] < 50, do: (fx, x) => (fx.love(partner(x)!, 12), fx.stat('tam', 4)) },
  ],
  tien: [
    { t: 'Nuôi heo đất, nhịn quà vặt', max: 15, do: (fx) => (fx.stat('tien', 5), fx.stat('tam', -1)) },
    { t: 'Bán hàng phụ mẹ ngoài chợ', max: 17, when: (x) => x.f.wealth === 'Tiểu thương' || !x.f.urban, do: (fx) => (fx.stat('tien', 4), fx.rel('bome', 3)) },
    { t: 'Làm gia sư', min: 18, max: 24, do: (fx) => (fx.stat('tien', 6), fx.stat('hoc', 2)) },
    { t: 'Đi tu nghiệp sinh ở Hàn Quốc', min: 18, max: 35, y0: 1993, y1: 2003, when: (x) => x.s.stats.tien < 45 && !away(x), do: (fx, x) => (fx.stat('tien', 14), fx.rel('bome', -6), fx.flag('ac_xkld'), fx.flag(`xk_${x.age}`)), note: '🦋 Ba năm xa nhà. Người ở nhà chỉ còn nghe giọng qua điện thoại.' },
    { t: (x) => (x.year < 2004 ? 'Đi lao động ở Đài Loan' : 'Đi lao động ở Đài Loan, Hàn Quốc'), min: 18, max: 38, y0: 1999, when: (x) => x.s.stats.tien < 45 && !away(x), do: (fx, x) => (fx.stat('tien', 14), fx.rel('bome', -5), fx.flag('ac_xkld'), fx.flag(`xk_${x.age}`)), note: '🦋 Ba năm xa nhà, nhiều thứ ở nhà sẽ khác.' },
    { t: 'Đi thực tập sinh ở Nhật', min: 18, max: 30, y0: 2010, when: (x) => x.s.stats.tien < 50 && !away(x), do: (fx, x) => (fx.stat('tien', 14), fx.rel('bome', -5), fx.flag('ac_xkld'), fx.flag(`xk_${x.age}`)), note: '🦋 Ba năm xa nhà, nhiều thứ ở nhà sẽ khác.' },
    { t: 'Vào khu công nghiệp làm công nhân', min: 18, max: 40, y0: 1995, when: (x) => !x.has('daihoc'), do: (fx) => (fx.stat('tien', 8), fx.stat('khoe', -2)) },
    { t: 'Tăng ca, làm thêm cuối tuần', min: 22, max: 59, do: (fx) => (fx.stat('tien', 8), fx.stat('khoe', -3), fx.stat('tam', -2)) },
    { t: (x) => (x.year < 2015 ? 'Mở sạp bán quần áo' : 'Bán hàng online'), min: 18, max: 50, do: (fx, x) => (fx.stat('tien', x.s.stats.duyen >= 45 ? 10 : 3), fx.flag('ac_buonban')) },
    { t: 'Chạy xe công nghệ buổi tối', min: 18, max: 55, y0: 2016, do: (fx) => (fx.stat('tien', 6), fx.stat('khoe', -2)) },
    { t: 'Chơi chứng khoán', min: 25, y0: 2006, when: (x) => x.s.stats.tien >= 40, do: (fx, x) => (x.year === 2007 || (x.year >= 2020 && x.year <= 2021) ? fx.stat('tien', 15) : x.year === 2008 || x.year === 2022 ? (fx.stat('tien', -18), fx.say('Thị trường sập. Mất gần nửa vốn.')) : fx.stat('tien', 4)) },
    { t: 'Mua vàng để dành', min: 25, do: (fx, x) => fx.stat('tien', x.year >= 2008 && x.year <= 2011 ? 10 : x.year >= 2019 ? 12 : 4) },
    { t: 'Vay tiền mở quán cà phê', min: 25, max: 55, y0: 1995, do: (fx, x) => (x.s.stats.tien >= 50 ? fx.stat('tien', 12) : (fx.stat('tien', -10), fx.say('Quán vắng, một năm sau sang nhượng lại.')), fx.flag('ac_quan')) },
  ],
  dulich: [
    { t: 'Về quê ngoại cả mùa hè', max: 15, do: (fx) => (fx.stat('tinh', 4), fx.stat('tam', 3)) },
    { t: 'Đi cắm trại với lớp', min: 12, max: 22, do: (fx) => (fx.rel('banthan', 4), fx.stat('tam', 4)) },
    { t: 'Đi Đà Lạt bằng xe khách đêm', min: 16, y0: 1990, when: (x) => !covid(x), do: (fx) => (fx.stat('tam', 6), fx.stat('dao', 3), fx.flag('ac_dalat')) },
    { t: 'Phượt Hà Giang, Mộc Châu', min: 18, max: 50, y0: 2010, when: (x) => !covid(x), do: (fx) => (fx.stat('noi', 5), fx.stat('tam', 6), fx.flag('ac_phuot')), note: '🦋 Trên đường phượt hay gặp người lạ.' },
    { t: 'Đi tàu xuyên Việt', min: 18, when: (x) => !covid(x), do: (fx) => (fx.stat('dao', 6), fx.stat('tam', 4), fx.flag('ac_tau')), note: '🦋 Ai đó ngồi ghế bên cạnh sẽ nhớ mình.' },
    { t: 'Du lịch Thái Lan theo tour', min: 20, y0: 2008, when: (x) => !covid(x) && x.s.stats.tien >= 45, do: (fx) => (fx.stat('tam', 6), fx.stat('tien', -6)) },
    { t: 'Đi Nhật, Hàn ngắm hoa', min: 22, y0: 2014, when: (x) => !covid(x) && x.s.stats.tien >= 60, do: (fx) => (fx.stat('tam', 8), fx.stat('tien', -10), fx.flag('ac_nuocngoai')) },
    { t: 'Du lịch qua màn hình, đợi hết giãn cách', min: 6, when: covid, do: (fx) => (fx.stat('tam', 2), fx.stat('hoc', 2)) },
    { t: 'Đi chùa đầu năm khắp các tỉnh', min: 40, do: (fx) => (fx.stat('dao', 4), fx.stat('tam', 4)) },
  ],
  nha: [
    { t: (x) => `Phụ ${x.mom} nấu cơm, rửa bát`, max: 17, do: (fx) => (fx.rel('bome', 6), fx.stat('tinh', 2)) },
    { t: 'Trông em cho bố mẹ đi làm', max: 15, when: (x) => x.f.siblings.some((s) => !s.older), do: (fx) => (fx.rel('bome', 5), fx.stat('tinh', 3)) },
    { t: 'Gửi tiền về quê mỗi tháng', min: 18, when: (x) => x.bm !== 'ông bà' || x.age < 50, do: (fx) => (fx.rel('bome', 8), fx.stat('tien', -4)) },
    { t: 'Về quê ăn Tết, ở lâu hơn mọi năm', min: 18, do: (fx) => (fx.rel('bome', 8), fx.stat('tam', 3)) },
    { t: (x) => `Đưa ${x.bm} đi khám sức khỏe`, min: 28, max: 60, do: (fx) => (fx.rel('bome', 8), fx.stat('tien', -3)) },
    { t: 'Dành cuối tuần cho con', min: 25, when: (x) => x.s.kids > 0, do: (fx) => (fx.rel('con', 10), fx.stat('tien', -2)) },
    { t: 'Đón bố mẹ lên ở cùng', min: 30, max: 60, when: (x) => x.bm !== 'ông bà', do: (fx) => (fx.rel('bome', 12), fx.stat('tam', -3), fx.flag('ac_oChung')) },
    { t: 'Trông cháu cho con đi làm', min: 55, when: (x) => x.s.kids > 0, do: (fx) => (fx.rel('con', 10), fx.stat('khoe', -2)) },
  ],
  ban: [
    { t: (x) => `Rủ ${x.s.bestie} đi chơi cả ngày`, do: (fx) => (fx.rel('banthan', 8), fx.stat('tam', 3)) },
    { t: 'Tham gia đội văn nghệ của trường', min: 8, max: 22, do: (fx) => (fx.stat('duyen', 4), fx.rel('banthan', 3)) },
    { t: 'Đi tình nguyện Mùa hè xanh', min: 18, max: 24, y0: 1993, do: (fx) => (fx.stat('tinh', 5), fx.stat('dao', 3), fx.flag('ac_tinhnguyen')) },
    { t: 'Đi đá bóng, cầu lông với hội bạn', min: 10, max: 55, do: (fx) => (fx.rel('banthan', 5), fx.stat('khoe', 3)) },
    { t: 'Tổ chức họp lớp', min: 25, do: (fx) => (fx.rel('banthan', 6), fx.stat('dao', 3), fx.flag('ac_hoplop')), note: '🦋 Họp lớp hay làm người cũ nhớ ra nhau.' },
    { t: 'Đi tập dưỡng sinh với hội bạn già', min: 55, do: (fx) => (fx.rel('banthan', 6), fx.stat('khoe', 4)) },
  ],
  minh: [
    { t: 'Chạy bộ mỗi sáng', min: 12, do: (fx) => (fx.stat('khoe', 6), fx.stat('tam', 2)) },
    { t: 'Học nấu ăn cho ngon', min: 15, do: (fx) => (fx.stat('tinh', 3), fx.stat('duyen', 2)) },
    { t: 'Đổi kiểu tóc, sắm đồ mới', min: 14, max: 45, do: (fx) => (fx.stat('duyen', 6), fx.stat('tien', -3)) },
    { t: 'Ngủ đủ giấc, bỏ thức khuya', min: 12, do: (fx) => (fx.stat('khoe', 5), fx.stat('tam', 3)) },
    { t: 'Đi tập gym', min: 18, max: 55, y0: 2005, do: (fx) => (fx.stat('khoe', 5), fx.stat('duyen', 3)) },
    { t: 'Học thiền, tập yoga', min: 25, y0: 2008, do: (fx) => (fx.stat('tam', 6), fx.stat('khoe', 2)) },
    { t: 'Đi khám sức khỏe định kỳ', min: 40, do: (fx) => fx.stat('khoe', 6) },
    { t: 'Trồng rau, nuôi chim ngoài ban công', min: 50, do: (fx) => (fx.stat('tam', 5), fx.stat('khoe', 2)) },
  ],
};

/** những mảng có ít nhất một việc hợp tuổi, hợp năm */
export function optionsOf(k: AreaKey, x: Ctx): Opt[] {
  return OPTS[k].filter((o) => x.age >= (o.min ?? 0) && x.age <= (o.max ?? 200) && x.year >= (o.y0 ?? 0) && x.year <= (o.y1 ?? 9999) && (!o.when || o.when(x)));
}
export function areasOf(x: Ctx) {
  // trẻ con chưa có chuyện kiếm tiền, tình yêu cho đến tuổi cảm nắng
  return AREAS.filter((a) => (a.k !== 'yeu' || x.age >= 13) && optionsOf(a.k, x).length > 0);
}
/** mỗi năm chỉ chọn một lần */
export const doneThisYear = (x: Ctx) => x.s.flags.some((g) => g.startsWith(`ac_${x.age}_`));
/** số lần đã chọn từng mảng trong đời */
export function tallyOf(s: Story): Record<AreaKey, number> {
  const t = Object.fromEntries(AREAS.map((a) => [a.k, 0])) as Record<AreaKey, number>;
  for (const g of s.flags) {
    const m = /^ac_\d+_(\w+)$/.exec(g);
    if (m && m[1] in t) t[m[1] as AreaKey]++;
  }
  return t;
}

/** Làm việc `idx` của mảng `k` ở năm hiện tại: áp hiệu ứng, ghi một ngã rẽ (quay lại được), không đổi cảnh */
export function doAction(R: Resolve, c: Character, f: Family, s0: Story, age: number, k: AreaKey, idx: number): { s: Story; fb: Feedback; t: string } {
  const cur = R(s0.scene, s0);
  const x = ctxOf(c, f, s0, age);
  const opts = optionsOf(k, x);
  const o = opts[idx];
  const area = AREAS.find((a) => a.k === k)!;
  const scene: Scene = {
    id: `act@${age}`,
    age,
    chapter: cur?.chapter ?? 'Tuổi trẻ',
    title: `Năm nay tập trung: ${area.t}`,
    text: () => [],
    choices: [{ ...o, do: (fx, cx) => (fx.flag(`ac_${age}_${k}`), o.do?.(fx, cx)) }],
    next: s0.scene,
  };
  const R2: Resolve = (id, st) => (id === scene.id ? scene : R(id, st));
  const r = choose(R2, c, f, { ...s0, scene: scene.id }, 0);
  return { ...r, t: typeof o.t === 'function' ? o.t(x) : o.t };
}


/** Cả đời dành cho điều gì (mảng chọn nhiều nhất), hiện ở cuối đời */
export function lifePathOf(s: Story) {
  const t = tallyOf(s);
  const [k, n] = (Object.entries(t) as [AreaKey, number][]).sort((a, b) => b[1] - a[1])[0];
  const D: Record<AreaKey, { name: string; desc: string }> = {
    hoc: { name: 'Một Đời Đèn Sách', desc: 'Năm nào cũng học thêm một điều. Kiến thức là của để dành.' },
    yeu: { name: 'Sống Để Yêu', desc: 'Dành phần lớn đời mình cho những người mình thương.' },
    tien: { name: 'Tay Trắng Làm Nên', desc: 'Cả đời cày cuốc, tiền có, nhưng cũng có những năm thiếu ngủ.' },
    dulich: { name: 'Xê Dịch Khắp Nơi', desc: 'Đi nhiều hơn ở, mỗi vùng đất để lại một người quen.' },
    nha: { name: 'Vì Gia Đình', desc: 'Ưu tiên bố mẹ, con cái trước bản thân.' },
    ban: { name: 'Bạn Bè Là Tất Cả', desc: 'Đi đâu cũng có hội, già rồi vẫn còn nhau.' },
    minh: { name: 'Sống Cho Mình', desc: 'Chăm sức khỏe, chăm bản thân, sống lâu và sống khỏe.' },
  };
  return n ? { k, n, ...D[k] } : null;
}

/** Ai dễ được gợi ý khi chọn người tìm hiểu, theo mảng mình hay chọn (cánh bướm) */
export const AREA_PEOPLE: Record<AreaKey, LoveId[]> = {
  hoc: ['minh', 'phong'],
  yeu: [],
  tien: ['tuananh', 'bao'],
  dulich: ['duy', 'kai', 'tai'],
  nha: ['khoi'],
  ban: ['hai', 'long', 'bao'],
  minh: ['phong', 'quan', 'hung'],
};

/* ---------------- Mốc đời: thay cho chọn việc mỗi năm ----------------
 * Đến tuổi của một mốc, đồng hồ dừng và hiện câu hỏi; giữa các mốc năm tháng tự trôi.
 * Mỗi lựa chọn tính vào một mảng (để vẫn ra "cả đời dành cho điều gì"), có thể tốn tiền thật (VNĐ theo năm 2020).
 */

export type MOpt = Opt & { k: AreaKey; /** giá theo mặt bằng 2020 */ vnd?: number };
export interface Milestone {
  id: string;
  age: number;
  place: Place;
  title: (x: Ctx) => string;
  sub: (x: Ctx) => string;
  opts: MOpt[];
}

const land = (y: number) => (y >= 2001 && y <= 2007) || (y >= 2015 && y <= 2021);
const landDown = (y: number) => (y >= 2008 && y <= 2012) || y >= 2022;

export const MILESTONES: Milestone[] = [
  {
    id: 'lop1',
    age: 6,
    place: 'cong',
    title: () => 'Vào lớp Một',
    sub: (x) => `Năm ${x.year}, ${x.me} sáu tuổi. Bố mẹ bàn nhau cho con học ở đâu.`,
    opts: [
      { k: 'hoc', t: 'Học trường làng gần nhà', do: (fx) => (fx.stat('hoc', 3), fx.rel('bome', 4)) },
      { k: 'hoc', t: 'Xin vào trường điểm trên phố', vnd: 3_000_000, do: (fx) => (fx.stat('hoc', 7), fx.stat('tam', -2), fx.flag('ms_truongdiem')), note: '🦋 Học trường điểm, bạn bè sẽ khác.' },
      { k: 'minh', t: 'Học thêm lớp vẽ, lớp đàn', vnd: 2_000_000, do: (fx) => (fx.stat('duyen', 4), fx.stat('tam', 4)) },
      { k: 'ban', t: 'Đi học cùng đứa bạn hàng xóm', do: (fx) => (fx.rel('banthan', 7), fx.stat('tam', 2)) },
    ],
  },
  {
    id: 'cap2',
    age: 11,
    place: 'lop',
    title: () => 'Lên cấp Hai',
    sub: (x) => `Hết tiểu học. ${x.me} mười một tuổi, bước vào cấp Hai.`,
    opts: [
      { k: 'hoc', t: 'Thi vào lớp chọn', do: (fx) => (fx.stat('hoc', 7), fx.stat('khoe', -2)) },
      { k: 'hoc', t: (x) => (x.year < 2000 ? 'Học tiếng Anh ở nhà thầy giáo' : 'Học tiếng Anh ở trung tâm'), vnd: 6_000_000, do: (fx) => (fx.stat('hoc', 5), fx.flag('ac_tienganh')), note: '🦋 Tiếng Anh sẽ mở ra một cánh cửa.' },
      { k: 'ban', t: 'Vào đội bóng, đội văn nghệ của trường', do: (fx) => (fx.stat('duyen', 4), fx.stat('khoe', 3), fx.rel('banthan', 4)) },
      { k: 'nha', t: 'Phụ bố mẹ việc nhà, bán hàng', do: (fx) => (fx.stat('tien', 4), fx.rel('bome', 6)) },
    ],
  },
  {
    id: 'cap3',
    age: 14,
    place: 'lop',
    title: () => 'Thi vào cấp Ba',
    sub: (x) => `Năm lớp Chín. ${x.me} phải chọn đường vào cấp Ba.`,
    opts: [
      { k: 'hoc', t: 'Ôn thi trường chuyên', do: (fx) => (fx.stat('hoc', 8), fx.stat('khoe', -2), fx.flag('ac_chuyen')), note: '🦋 Thi chuyên năm ấy sẽ còn được nhắc lại.' },
      { k: 'minh', t: 'Thi trường công gần nhà, học nhẹ nhàng', do: (fx) => (fx.stat('hoc', 3), fx.stat('tam', 4)) },
      { k: 'hoc', t: 'Học trường tư thục', vnd: 30_000_000, do: (fx) => (fx.stat('hoc', 4), fx.stat('duyen', 3)) },
      { k: 'tien', t: 'Vừa học vừa phụ việc kiếm tiền', do: (fx) => (fx.stat('tien', 6), fx.stat('hoc', -2)) },
    ],
  },
  {
    id: 'dilam',
    age: 22,
    place: 'vanphong',
    title: (x) => (x.has('daihoc') ? 'Ra trường, đi làm' : 'Chọn một nghề'),
    sub: (x) => (x.has('daihoc') ? `Cầm tấm bằng trên tay, ${x.me} bắt đầu đi làm.` : `${x.me} hai mươi hai tuổi, cần một công việc lâu dài.`),
    opts: [
      { k: 'tien', t: 'Thi công chức, vào cơ quan nhà nước', do: (fx) => (fx.stat('tien', 5), fx.stat('tam', 3), fx.flag('ms_congchuc')) },
      { k: 'tien', t: (x) => (x.year < 2000 ? 'Xin vào công ty liên doanh' : 'Vào công ty tư nhân, công ty nước ngoài'), do: (fx) => (fx.stat('tien', 9), fx.stat('khoe', -2)) },
      {
        k: 'tien',
        t: 'Khởi nghiệp, mở cửa hàng nhỏ',
        vnd: 80_000_000,
        do: (fx, x) =>
          x.s.stats.duyen >= 50 || x.s.stats.hoc >= 55 ? (fx.stat('tien', 18), fx.say('Cửa hàng đông khách, vốn về sau hai năm.')) : (fx.stat('tien', -4), fx.say('Ế ẩm một năm, phải sang lại cửa hàng.')),
        note: '🦋 Làm chủ thì gặp nhiều người hơn.',
      },
      { k: 'nha', t: 'Về quê lập nghiệp, gần bố mẹ', do: (fx) => (fx.rel('bome', 8), fx.stat('tam', 4), fx.stat('tien', 3)) },
    ],
  },
  {
    id: 'oxe',
    age: 27,
    place: 'pho',
    title: () => 'Chỗ ở và chiếc xe',
    sub: (x) => `Đi làm được vài năm. ${x.me} tính chuyện chỗ ở, đi lại.`,
    opts: [
      { k: 'tien', t: 'Thuê phòng trọ nhỏ, để dành tiền', do: (fx) => (fx.stat('tien', 5), fx.stat('tam', -1)) },
      {
        k: 'minh',
        t: (x) => (x.year < 2010 ? 'Mua xe máy mới' : 'Mua ô tô trả góp'),
        vnd: 0,
        do: (fx) => (fx.stat('duyen', 3), fx.stat('tam', 4), fx.flag('ms_xe')),
      },
      { k: 'nha', t: 'Ở với bố mẹ cho đỡ tốn', do: (fx) => (fx.rel('bome', 6), fx.stat('tien', 3)) },
      {
        k: 'tien',
        t: 'Gom tiền mua một mảnh đất',
        vnd: 500_000_000,
        do: (fx, x) =>
          land(x.year) ? (fx.stat('tien', 25), fx.say('Đất lên giá, mảnh đất đáng gấp đôi.')) : landDown(x.year) ? (fx.stat('tien', -5), fx.say('Đất đóng băng, tiền nằm im một chỗ.')) : fx.stat('tien', 8),
      },
    ],
  },
  {
    id: 'nha',
    age: 35,
    place: 'nha',
    title: () => 'Một căn nhà',
    sub: (x) => `${x.me} ba mươi lăm tuổi. Có nên mua nhà?`,
    opts: [
      { k: 'nha', t: 'Mua căn hộ chung cư, trả góp 20 năm', vnd: 600_000_000, do: (fx) => (fx.stat('tam', 6), fx.rel('con', 4), fx.flag('ms_nha')), note: '🦋 Có nhà rồi, nhưng còn món nợ dài.' },
      { k: 'nha', t: 'Xây nhà trên đất bố mẹ cho', vnd: 400_000_000, do: (fx) => (fx.rel('bome', 6), fx.stat('tam', 4), fx.flag('ms_nha')) },
      { k: 'tien', t: 'Tiếp tục thuê, dồn tiền làm ăn', do: (fx) => (fx.stat('tien', 8), fx.stat('tam', -2)) },
      { k: 'minh', t: 'Dọn về quê, sống chậm lại', do: (fx) => (fx.stat('tam', 6), fx.stat('khoe', 3), fx.stat('tien', -2)) },
    ],
  },
  {
    id: 'u50',
    age: 50,
    place: 'vuon',
    title: () => 'Tuổi năm mươi',
    sub: (x) => `Nửa đời người. ${x.me} nghĩ đến những năm sau.`,
    opts: [
      { k: 'tien', t: 'Gửi tiết kiệm cho tuổi già', do: (fx) => (fx.stat('tien', 6), fx.stat('tam', 3)) },
      { k: 'nha', t: 'Cho con đi du học', vnd: 1_000_000_000, when: (x) => x.s.kids > 0, do: (fx) => (fx.rel('con', 12), fx.stat('tam', 2)) },
      { k: 'dulich', t: (x) => (x.s.married ? 'Đi du lịch nước ngoài cùng vợ chồng' : 'Đi du lịch nước ngoài một chuyến'), vnd: 60_000_000, do: (fx, x) => (fx.stat('tam', 8), x.s.partner && x.s.partner !== 'xemmat' ? fx.love(x.s.partner, 8) : undefined) },
      { k: 'minh', t: 'Khám sức khỏe tổng quát, tập thể dục đều', vnd: 5_000_000, do: (fx) => (fx.stat('khoe', 8), fx.stat('tam', 2)) },
    ],
  },
];

/** giá xe theo năm: xe máy trước 2010, ô tô từ 2010 (VNĐ năm 2020) */
const carVnd = (y: number) => (y < 2010 ? 30_000_000 : 600_000_000);

/** giá thật (đúng năm) của một lựa chọn trong mốc */
export function mPrice(m: Milestone, o: MOpt, x: Ctx) {
  const v = m.id === 'oxe' && o.vnd === 0 ? carVnd(x.year) : (o.vnd ?? 0);
  return priceAt(v, x.year);
}
/** trẻ con thì bố mẹ chi: tiền nhà có thể bỏ ra cho con học (VNĐ năm 2020) theo gia cảnh */
const FAMILY_BUDGET: Record<string, number> = { 'Nhà nông': 10_000_000, 'Lao động phổ thông': 15_000_000, 'Công chức trung lưu': 40_000_000, 'Tiểu thương': 50_000_000, 'Khá giả': 200_000_000, 'Hào môn': 2_000_000_000 };
export const mByParents = (m: Milestone) => m.age < 18;
/** số tiền dùng được cho mốc này: của bố mẹ (khi còn nhỏ) hoặc tài sản của mình */
export const mWealth = (m: Milestone, x: Ctx) => (mByParents(m) ? priceAt(FAMILY_BUDGET[x.f.wealth] ?? 3_000_000, x.year) : cashOf(x.s, x.year, x.age));
export const mPriceText = (v: number) => fmtVND(v);

export function mOptions(m: Milestone, x: Ctx) {
  return m.opts.filter((o) => x.year >= (o.y0 ?? 0) && x.year <= (o.y1 ?? 9999) && (!o.when || o.when(x)));
}
const mDone = (s: Story, m: Milestone) => s.flags.includes(`ms_done_${m.id}`);
/** mốc đang chờ chọn ở tuổi này (mốc gần nhất đã tới mà chưa chọn, chưa sang mốc sau) */
export function milestoneDue(s: Story, age: number): Milestone | null {
  let due: Milestone | null = null;
  MILESTONES.forEach((m, i) => {
    const next = MILESTONES[i + 1];
    if (age >= m.age && (!next || age < next.age) && !mDone(s, m)) due = m;
  });
  return due;
}

/** Chọn lựa chọn `idx` của mốc: trừ tiền, áp hiệu ứng, ghi một ngã rẽ (quay lại được), không đổi cảnh */
export function doMilestone(R: Resolve, c: Character, f: Family, s0: Story, age: number, m: Milestone, idx: number): { s: Story; fb: Feedback; t: string } {
  const cur = R(s0.scene, s0);
  const x = ctxOf(c, f, s0, age);
  const o = mOptions(m, x)[idx];
  const cost = mPrice(m, o, x);
  const scene: Scene = {
    id: `ms@${m.id}`,
    age,
    chapter: cur?.chapter ?? 'Tuổi trẻ',
    title: m.title(x),
    text: () => [],
    choices: [
      {
        ...o,
        do: (fx, cx) => {
          fx.flag(`ms_done_${m.id}`);
          fx.flag(`ac_${age}_${o.k}`);
          if (cost && !mByParents(m)) fx.stat('tien', -pointsOf(cost, cx.year, cx.age));
          o.do?.(fx, cx);
        },
      },
    ],
    next: s0.scene,
  };
  const R2: Resolve = (id, st) => (id === scene.id ? scene : R(id, st));
  const r = choose(R2, c, f, { ...s0, scene: scene.id }, 0);
  return { ...r, t: typeof o.t === 'function' ? o.t(x) : o.t };
}
