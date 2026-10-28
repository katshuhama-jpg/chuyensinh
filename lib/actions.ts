/**
 * "Năm nay tập trung cho gì" (kiểu 1in8b, giữ khối nút như Bảng tình duyên cũ):
 * Học hành, Tình yêu, Kiếm tiền, Du lịch, Gia đình, Bạn bè, Bản thân.
 * Mỗi năm chọn một mảng, rồi chọn một việc cụ thể trong mảng đó. Việc đổi theo tuổi và theo thời kỳ
 * (đúng nhân khẩu học và sự kiện Việt Nam). Mỗi việc để lại cờ cánh bướm; mảng nào chọn nhiều nhất
 * quyết định "cả đời dành cho điều gì" ở cuối đời, và kéo theo người mình dễ gặp.
 */

import { choose, ctxOf, type Choice, type Ctx, type Feedback, type LoveId, type Resolve, type Scene, type Story } from './story';
import type { Character, Family } from './character';

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
    { t: 'Đi hợp tác lao động Đông Âu', min: 18, max: 35, y0: 1980, y1: 1990, do: (fx) => (fx.stat('tien', 15), fx.rel('bome', -6), fx.flag('ac_dongau')), note: '🦋 Mang về chiếc Babetta và cả một vùng trời khác.' },
    { t: 'Đi lao động ở Đài Loan', min: 18, max: 38, y0: 1999, when: (x) => x.s.stats.tien < 45, do: (fx) => (fx.stat('tien', 14), fx.rel('bome', -5), fx.flag('ac_xkld')), note: '🦋 Ba năm xa nhà, nhiều thứ ở nhà sẽ khác.' },
    { t: 'Đi thực tập sinh ở Nhật', min: 18, max: 30, y0: 2010, when: (x) => x.s.stats.tien < 50, do: (fx) => (fx.stat('tien', 14), fx.rel('bome', -5), fx.flag('ac_xkld')), note: '🦋 Ba năm xa nhà, nhiều thứ ở nhà sẽ khác.' },
    { t: 'Vào khu công nghiệp làm công nhân', min: 18, max: 40, y0: 1995, when: (x) => !x.has('dodaihoc'), do: (fx) => (fx.stat('tien', 8), fx.stat('khoe', -2)) },
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
