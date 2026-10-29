/**
 * Drama tình ái: những chuyện yêu đương, hôn nhân hay gây bão trên mạng và ngoài đời,
 * gom từ báo chí và nghiên cứu xã hội (hóa đơn buổi hẹn, người cũ thả tim, thách cưới,
 * mẹ chồng nàng dâu, quỹ đen, tin nhắn lúc nửa đêm, đánh ghen, ly hôn...). Nhân vật đều hư cấu.
 *
 * Ba nhóm theo hoàn cảnh: đang yêu (chưa cưới), đã cưới, đang một mình.
 * Mỗi chuyện chỉ xảy ra một lần trong đời, đúng thời kỳ; thứ tự xáo theo từng đời để mỗi lần chơi một khác.
 * Có chuyện cài cờ, nhiều năm sau mới "nổ" lại (hiệu ứng cánh bướm).
 */

import type { Bg } from '@/components/Backdrop';
import { FLAVOR } from './dates';
import { xemmatName } from './names';
import { fmtVND, unitOf } from './money';
import type { Choice, Ctx, Fx, LoveId, Scene } from './story';

type Pool = 'yeu' | 'cuoi' | 'don' | 'any';
type Drama = {
  id: string;
  pool: Pool;
  from?: number;
  to?: number;
  minAge?: number;
  maxAge?: number;
  if?: (x: Ctx) => boolean;
  /** chuyện "nổ lại" từ cờ cũ: ưu tiên ra trước */
  callback?: boolean;
  title: string | ((x: Ctx) => string);
  bg: (x: Ctx) => Bg;
  who?: Scene['who'];
  text: (x: Ctx) => string[];
  choices: Choice[];
  kind?: Scene['kind'];
  msgs?: Scene['msgs'];
  timer?: number;
  timeout?: number;
  post?: Scene['post'];
  call?: Scene['call'];
};

/* ---------- tiện ích ---------- */
const pid = (x: Ctx): LoveId | null => (x.s.partner && x.s.partner !== 'xemmat' ? x.s.partner : null);
const sp = (x: Ctx) => (pid(x) ? x.L(pid(x)!) : x.s.partner === 'xemmat' ? xemmatName(x) : x.lg === 'm' ? 'Chồng' : 'Vợ');
const spw = (x: Ctx) => (x.lg === 'm' ? 'chồng' : 'vợ');
const who = (x: Ctx) => (x.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>;
/** thay đổi độ thân với người yêu / vợ chồng (người xem mắt thì tính vào Tâm lý) */
const lv = (fx: Fx, x: Ctx, d: number) => {
  const p = pid(x);
  if (p) fx.love(p, d);
  else fx.stat('tam', Math.round(d / 2));
};
const low = (x: Ctx, n = 45) => (pid(x) ? x.s.love[pid(x)!] < n : x.s.stats.tam < n);
/** chia tay người yêu (chưa cưới) */
const breakup = (fx: Fx, x: Ctx) => {
  const p = pid(x);
  if (p) fx.drop(p);
  else fx.partner(null);
};
const inLaw = (x: Ctx) => (x.c.gender === 'f' ? 'mẹ chồng' : 'mẹ vợ');
const InLaw = (x: Ctx) => (x.c.gender === 'f' ? 'Mẹ chồng' : 'Mẹ vợ');
const chat = (y: number) => (y < 2004 ? 'thư' : y < 2012 ? 'tin nhắn' : 'tin nhắn Chat');
const money = (y: number, n: number) => {
  // giá tiền theo thời kỳ: n là "đơn vị" thời nay (triệu đồng)
  const k = y < 1995 ? 0.05 : y < 2005 ? 0.2 : y < 2015 ? 0.5 : 1;
  const v = Math.max(1, Math.round(n * k));
  return `${v} triệu`;
};
const shop = (y: number) => (y < 1995 ? 'quán phở' : y < 2010 ? 'nhà hàng lẩu' : y < 2020 ? 'nhà hàng buffet nướng' : 'nhà hàng omakase');

/* =========================================================
   ĐANG YÊU
   ========================================================= */
const YEU: Drama[] = [
  {
    id: 'hoadon',
    pool: 'yeu',
    title: 'Hóa đơn cuối buổi',
    bg: () => ({ place: 'quan', time: 'night' }),
    who,
    text: (x) => [
      `${sp(x)} rủ ${x.me} đi ăn ${shop(x.year)}, ra đến nơi thì có thêm năm người bạn của ${x.ay}.`,
      `Ăn xong, nhân viên đặt hóa đơn ${money(x.year, 3)} xuống bàn. Cả bàn im lặng, nhìn ${x.me}.`,
    ],
    choices: [
      { t: 'Cười, rút ví trả hết', do: (fx, x) => (fx.stat('tien', -10), lv(fx, x, 6), fx.flag('dr_tralan')), note: (x) => `Bạn của ${sp(x)} gọi ${x.me} là "người nhà" từ hôm đó.` },
      { t: '"Mình chia đều nhé mọi người"', do: (fx, x) => (fx.stat('tam', 4), lv(fx, x, x.year >= 2012 ? 2 : -4)), note: () => 'Một người bạn cười gượng. Người còn lại khen thẳng tính.' },
      { t: 'Đứng dậy đi vệ sinh, rồi về thẳng', do: (fx, x) => (lv(fx, x, -18), fx.stat('noi', 6)), note: (x) => `${sp(x)} gọi mười cuộc. ${x.me} không bắt máy.` },
    ],
  },
  {
    id: 'upmay',
    pool: 'yeu',
    from: 2008,
    title: 'Chiếc điện thoại úp mặt xuống bàn',
    bg: () => ({ place: 'quan', time: 'dusk' }),
    who,
    text: (x) => [`Dạo này ${sp(x)} hay úp điện thoại xuống bàn, đi tắm cũng mang theo. Mật khẩu vừa đổi.`],
    choices: [
      {
        t: 'Đợi ngủ say, lén mở xem',
        do: (fx, x) => {
          fx.flag('dr_lenxem');
          if (low(x, 50)) (lv(fx, x, -15), fx.say(`Toàn tin nhắn với một số lạ lưu tên "Ship hàng". Tim ${x.me} đập thình thịch.`), fx.flag('dr_shiphang'));
          else (lv(fx, x, -6), fx.say(`Chỉ có một nhóm chat tên "Kế hoạch cầu hôn". ${x.me} lặng lẽ đặt máy về chỗ cũ, thấy mình có lỗi.`), fx.flag('dr_kehoach'));
        },
      },
      { t: 'Hỏi thẳng: "Có gì giấu mình à?"', do: (fx, x) => (lv(fx, x, x.s.stats.tinh >= 50 ? 6 : -3), fx.stat('tinh', 3)), note: (x) => `${sp(x)} đỏ mặt: "Đợi thêm ít hôm nữa đi."` },
      { t: 'Tin nhau thì không cần xem', do: (fx, x) => (fx.stat('tam', 6), lv(fx, x, 3), fx.flag('dr_tinnhau')), note: () => '🦋 Sự tin tưởng này sẽ còn quay lại.' },
    ],
  },
  {
    id: 'thatim',
    pool: 'yeu',
    from: 2010,
    title: 'Người cũ thả tim',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: `Người cũ của ${sp(x)} vừa thả tim 12 tấm ảnh liền một lúc.` },
      { me: false, t: 'Bình luận: "Vẫn cười đẹp như ngày nào 🙂"' },
    ],
    timer: 15,
    timeout: 2,
    text: (x) => [`Nửa đêm, ${x.me} lướt Tường của ${sp(x)}.`],
    choices: [
      { t: 'Trả lời bình luận: "Cảm ơn, người yêu mình chụp đó"', do: (fx, x) => (fx.stat('noi', 6), lv(fx, x, 4)), note: () => 'Người cũ xóa bình luận sau năm phút.' },
      { t: (x) => `Bảo ${sp(x)} chặn người cũ`, do: (fx, x) => (low(x, 55) ? lv(fx, x, -8) : lv(fx, x, 5), fx.flag('dr_bochan')), note: (x) => (low(x, 55) ? `${sp(x)} bảo ${x.me} trẻ con.` : `${sp(x)} chặn ngay, còn gửi ảnh chụp màn hình.`) },
      { t: 'Lờ đi, đi ngủ', do: (fx) => fx.stat('tam', -4) },
    ],
  },
  {
    id: 'vaytien',
    pool: 'yeu',
    title: 'Cho mình vay tạm nhé',
    bg: () => ({ place: 'congvien', time: 'dusk' }),
    who,
    text: (x) => [`${sp(x)} ngập ngừng: nhà ${x.ay} có việc gấp, cần ${money(x.year, 30)}. "Ba tháng nữa ${x.xung} trả."`],
    choices: [
      { t: 'Rút hết tiền tiết kiệm cho vay', do: (fx, x) => (fx.stat('tien', -18), lv(fx, x, 10), fx.flag('dr_chovay')), note: () => '🦋 Khoản tiền này sẽ còn được nhắc lại.' },
      { t: 'Cho luôn, không cần trả', do: (fx, x) => (fx.stat('tien', -18), lv(fx, x, 6), fx.stat('tinh', 6)) },
      { t: 'Từ chối: tiền bạc phân minh', do: (fx, x) => (fx.stat('tien', 4), lv(fx, x, -10)), note: (x) => `${sp(x)} bảo hiểu, nhưng tối đó không nhắn tin chúc ngủ ngon.` },
    ],
  },
  {
    id: 'xemtuoi',
    pool: 'yeu',
    minAge: 22,
    title: 'Thầy bảo hai đứa khắc tuổi',
    bg: () => ({ place: 'nha', time: 'day' }),
    who: () => 'mom',
    text: (x) => [`${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} đi xem bói về, mặt nặng như chì: "Tuổi hai đứa xung khắc, lấy nhau là khổ."`, `Nhà ${sp(x)} cũng bảo nhà mình không môn đăng hộ đối.`],
    choices: [
      { t: 'Kiên trì thuyết phục từng người', do: (fx, x) => (fx.stat('tinh', 5), fx.rel('bome', -4), lv(fx, x, 8)), note: (x) => `${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} chưa gật, nhưng đã thôi nhắc.` },
      { t: '"Con lấy ai là việc của con"', do: (fx, x) => (fx.stat('noi', 8), fx.rel('bome', -15), lv(fx, x, 10)) },
      { t: (x) => `Nghe lời ${x.bm}, chia tay`, do: (fx, x) => (fx.rel('bome', 10), breakup(fx, x), fx.mid('camcan')) },
    ],
  },
  {
    id: 'chiaoi',
    pool: 'yeu',
    title: (x) => (x.c.gender === 'f' ? `"Chị ơi, em là người yêu của ${x.lg === 'm' ? 'anh ấy' : 'chị ấy'}"` : `"Anh ơi, em là người yêu của ${x.lg === 'm' ? 'anh ấy' : 'chị ấy'}"`),
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: x.c.gender === 'f' ? 'Chị ơi, em xin lỗi phải nhắn thế này.' : 'Anh ơi, em xin lỗi phải nhắn thế này.' },
      { me: false, t: `Em yêu ${sp(x)} được một năm rồi. Em mới biết có ${x.c.gender === 'f' ? 'chị' : 'anh'}.` },
    ],
    timer: 15,
    timeout: 2,
    text: (x) => [`Một ${chat(x.year)} lạ, ảnh đại diện để trống.`],
    choices: [
      {
        t: 'Hẹn gặp cả ba người để nói cho rõ',
        do: (fx, x) => {
          if (low(x, 50)) (breakup(fx, x), fx.stat('tam', -8), fx.say(`Chuyện là thật. ${x.me} đứng dậy về trước, không khóc.`));
          else (lv(fx, x, 6), fx.say(`Hóa ra là người cũ của ${sp(x)} dựng chuyện. ${sp(x)} nắm tay ${x.me} suốt buổi.`));
        },
      },
      { t: (x) => `Đưa tin nhắn cho ${sp(x)} xem`, do: (fx, x) => (low(x, 50) ? (lv(fx, x, -12), fx.stat('tinh', 4)) : lv(fx, x, 8)), note: (x) => (low(x, 50) ? `${sp(x)} lắp bắp, không giải thích được.` : `${sp(x)} gọi ngay cho người kia trước mặt ${x.me}.`) },
      { t: 'Chặn số, coi như chưa đọc', do: (fx) => (fx.stat('tam', -6), fx.flag('dr_nghingo')), note: () => '🦋 Nỗi nghi ngờ này chưa đi đâu cả.' },
    ],
  },
  {
    id: 'yeuxa',
    pool: 'yeu',
    if: (x) => !x.s.flags.some((g) => g.startsWith('route_')),
    title: (x) => (x.year >= 2010 ? 'Đơn hàng đi Nhật' : 'Đi làm xa'),
    bg: () => ({ place: 'pho', time: 'dusk' }),
    who,
    text: (x) => [
      x.year >= 2010
        ? `${sp(x)} đỗ đơn hàng đi làm ở Nhật ba năm. "Về ${x.xung} có tiền cưới ${x.goi}."`
        : `${sp(x)} được nhận vào làm ở một công trình trong Nam, mỗi năm về một lần.`,
    ],
    choices: [
      { t: 'Chờ, ngày nào cũng gọi', do: (fx, x) => (lv(fx, x, 6), fx.stat('tinh', 4), fx.flag('dr_yeuxa')), note: () => '🦋 Ba năm là dài. Rồi sẽ biết.' },
      { t: 'Bỏ việc, đi cùng', do: (fx, x) => (lv(fx, x, 12), fx.stat('noi', 8), fx.stat('tien', -6), fx.rel('bome', -8)) },
      { t: 'Chia tay cho nhẹ lòng cả hai', do: (fx, x) => (breakup(fx, x), fx.mid('xa')) },
    ],
  },
  {
    id: 'songthu',
    pool: 'yeu',
    from: 2005,
    if: (x) => x.f.urban || x.age >= 22,
    title: 'Dọn về ở chung?',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    text: (x) => [`Hợp đồng phòng trọ của ${sp(x)} sắp hết. ${x.ay[0].toUpperCase() + x.ay.slice(1)} hỏi nhỏ: "Hay mình thuê chung một phòng?"`],
    choices: [
      { t: (x) => `Dọn về, giấu ${x.bm}`, do: (fx, x) => (lv(fx, x, 10), fx.stat('tien', 6), fx.flag('dr_songthu')), note: () => '🦋 Bí mật kiểu này thường không giữ được lâu.' },
      { t: 'Cưới rồi mới ở chung', do: (fx, x) => (fx.rel('bome', 6), lv(fx, x, x.s.stats.tinh >= 50 ? 4 : -3)) },
      { t: 'Thuê hai phòng cạnh nhau', do: (fx, x) => (lv(fx, x, 5), fx.stat('tien', -4)) },
    ],
  },
  {
    id: 'bobat',
    pool: 'yeu',
    if: (x) => x.has('dr_songthu'),
    callback: true,
    title: 'Mẹ lên thăm bất ngờ',
    bg: () => ({ place: 'phong', time: 'day' }),
    who: () => 'mom',
    text: (x) => [`Chủ nhật, ${x.mom} xách túi cam lên thăm, không báo trước. Đôi dép của ${sp(x)} nằm ngay cửa.`],
    choices: [
      { t: 'Nói thật hết', do: (fx, x) => (fx.rel('bome', -8), fx.stat('tinh', 6), lv(fx, x, 6)), note: (x) => `${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} im lặng rất lâu, rồi hỏi: "Bao giờ cưới?"` },
      { t: '"Dép của bạn cùng phòng ạ"', do: (fx) => (fx.stat('duyen', 4), fx.rel('bome', -3)), note: () => 'Không ai tin, nhưng cũng không ai hỏi thêm.' },
    ],
  },
  {
    id: 'dinhvi',
    pool: 'yeu',
    from: 2015,
    title: 'Chia sẻ vị trí đi',
    bg: () => ({ place: 'pho', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: `${x.goi[0].toUpperCase() + x.goi.slice(1)} đang ở đâu đấy?` },
      { me: false, t: 'Bật chia sẻ vị trí cho ' + x.xung + ' đi, để ' + x.xung + ' yên tâm.' },
      { me: false, t: 'Sao 5 phút rồi chưa trả lời?' },
    ],
    timer: 12,
    timeout: 1,
    text: (x) => [`Ba tháng đầu, ${sp(x)} ngọt như mía lùi: hoa mỗi ngày, quà mỗi tuần. Giờ thì khác.`],
    choices: [
      { t: 'Bật chia sẻ vị trí cho xong', do: (fx, x) => (lv(fx, x, 4), fx.stat('noi', -6), fx.stat('tam', -6), fx.flag('dr_kiemsoat')), note: () => '🦋 Một lần nhượng bộ, rồi sẽ có lần thứ hai.' },
      { t: '"Yêu là tin, không phải theo dõi"', do: (fx, x) => (lv(fx, x, -6), fx.stat('tam', 6), fx.stat('noi', 4)) },
      { t: 'Chia tay. Thấy dấu hiệu là đi', do: (fx, x) => (breakup(fx, x), fx.stat('tam', 10)), sys: 'Đinh! Ký chủ nhận ra cờ đỏ. Vui vẻ +10.' },
    ],
  },
  {
    id: 'ghenbanthan',
    pool: 'yeu',
    title: 'Ghen với bạn thân',
    bg: () => ({ place: 'quan', time: 'night' }),
    who,
    text: (x) => [`${sp(x)} xem ảnh ${x.me} đi ăn với ${x.s.bestie}, mặt sầm lại: "Hai người thân quá nhỉ?"`],
    choices: [
      { t: (x) => `Hẹn ba người đi ăn chung với ${x.s.bestie}`, do: (fx, x) => (lv(fx, x, 6), fx.rel('banthan', 4)), note: (x) => `Cuối buổi ${sp(x)} và ${x.s.bestie} đã kết bạn với nhau.` },
      { t: (x) => `Bớt gặp ${x.s.bestie} cho êm`, do: (fx, x) => (lv(fx, x, 4), fx.rel('banthan', -12)) },
      { t: '"Bạn thân có trước, người yêu có sau"', do: (fx, x) => (lv(fx, x, -10), fx.rel('banthan', 8), fx.stat('noi', 4)) },
    ],
  },
  {
    id: 'confession',
    pool: 'yeu',
    from: 2013,
    title: 'Lên trang confession',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    post: (x) => ({
      author: 'Confession phố mình',
      time: '2 giờ',
      text: `#cfs4821 Hôm qua thấy một cặp đôi cãi nhau ở quán trà sữa đầu phố, bạn ${x.c.gender === 'f' ? 'nữ' : 'nam'} khóc mà bạn kia vẫn cắm mặt vào điện thoại. Có ai biết là ai không?`,
      likes: 3200,
      comments: [
        { who: 'Ẩn danh', t: 'Biết đấy, tag luôn nhé?' },
        { who: 'Ẩn danh', t: 'Đàn ông/đàn bà bây giờ là thế...' },
      ],
    }),
    kind: 'chat',
    msgs: (x) => [{ me: false, t: `Bạn bè gửi link bài này cho ${x.me}, kèm ba cái icon cười.` }],
    text: (x) => [`Bài nói về hai người, dù không ai ghi tên.`],
    choices: [
      { t: 'Vào bình luận kể lại cho đúng', do: (fx, x) => (fx.stat('noi', 6), lv(fx, x, -6)), note: () => 'Bài lên 10 nghìn bình luận. Chuyện nhỏ thành chuyện lớn.' },
      { t: (x) => `Cùng ${sp(x)} ngồi đọc rồi cười`, do: (fx, x) => (lv(fx, x, 8), fx.stat('tam', 4)) },
      { t: 'Nhờ admin gỡ bài', do: (fx) => fx.stat('tam', 2) },
    ],
  },
  {
    id: 'aiviet',
    pool: 'yeu',
    from: 2023,
    title: 'Tin nhắn ngọt do AI viết',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    text: (x) => [`${x.me} vô tình thấy màn hình máy ${sp(x)}: "Viết giúp tin nhắn chúc ngủ ngon thật lãng mạn, 3 phiên bản."`, `Những tin nhắn làm ${x.me} mất ngủ cả tháng nay.`],
    choices: [
      { t: 'Bật cười, chụp màn hình gửi lại', do: (fx, x) => (lv(fx, x, 6), fx.stat('duyen', 4)), note: (x) => `${sp(x)} xấu hổ, hứa từ nay tự viết, dù sai chính tả.` },
      { t: 'Giận thật: thế là không thật lòng', do: (fx, x) => (lv(fx, x, -8), fx.stat('tinh', 4)) },
      { t: 'Từ nay mình cũng nhờ AI trả lời', do: (fx, x) => (lv(fx, x, -4), fx.stat('hoc', 4)), note: () => 'Hai trợ lý AI nói chuyện với nhau ngọt hơn hẳn hai người.' },
    ],
  },
  {
    id: 'seen3ngay',
    pool: 'yeu',
    title: 'Ba ngày "Đã xem"',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [
      { me: true, t: 'Hôm nay ' + x.goi + ' sao thế?' },
      { me: true, t: 'Mình có làm gì sai không?' },
      { me: false, t: '(Đã xem)' },
    ],
    timer: 15,
    timeout: 1,
    text: (x) => [`Sau một trận cãi nhỏ, ${sp(x)} im lặng ba ngày.`],
    choices: [
      { t: 'Đến tận nhà, đứng dưới cổng', do: (fx, x) => (lv(fx, x, 8), fx.stat('noi', 4)), note: (x) => `${sp(x)} chạy xuống, mắt đỏ hoe: "Đợi ${x.goi} đến lâu lắm rồi."` },
      { t: 'Cũng im luôn, xem ai lì hơn', do: (fx, x) => (lv(fx, x, -10), fx.stat('tam', -4)) },
      { t: 'Gửi một bài hát, không nói gì', do: (fx, x) => (lv(fx, x, x.s.stats.duyen >= 45 ? 7 : 2)) },
    ],
  },
  {
    id: 'kiniem',
    pool: 'yeu',
    title: 'Quên ngày kỷ niệm',
    bg: () => ({ place: 'quan', time: 'night' }),
    who,
    text: (x) => [`${sp(x)} đặt bàn ở ${x.year < 2005 ? 'quán kem' : 'quán quen'}, mang theo hộp quà buộc nơ. ${x.me} ngơ ngác: hôm nay là ngày gì?`],
    choices: [
      { t: 'Thú thật là quên, xin lỗi', do: (fx, x) => (lv(fx, x, -3), fx.stat('tinh', 4)) },
      { t: '"Biết chứ, quà của mình đang ship"', do: (fx, x) => (fx.stat('duyen', 4), fx.stat('tien', -6), lv(fx, x, 2)), note: () => 'Tối đó chạy khắp phố tìm quà.' },
      { t: 'Đưa tay ra: "Quà là mình đây"', do: (fx, x) => lv(fx, x, x.s.stats.duyen >= 55 ? 6 : -8) },
    ],
  },
  {
    id: 'shiphang',
    pool: 'yeu',
    if: (x) => x.has('dr_shiphang'),
    callback: true,
    title: '"Ship hàng" là ai?',
    bg: () => ({ place: 'pho', time: 'night' }),
    who,
    text: (x) => [`Người lưu tên "Ship hàng" trong máy ${sp(x)} hôm nay đứng đợi ở đầu ngõ, tay cầm bó hoa.`],
    choices: [
      { t: 'Đi thẳng tới hỏi', do: (fx, x) => (low(x, 55) ? (breakup(fx, x), fx.stat('noi', 6), fx.say('Bó hoa không phải cho ' + x.me + '.')) : (lv(fx, x, 6), fx.say(`Là em họ của ${sp(x)}, đến nhờ chở đi phỏng vấn. ${x.me} đỏ mặt đến tận tai.`))) },
      { t: 'Quay xe, về nhà khóc', do: (fx, x) => (fx.stat('tam', -8), lv(fx, x, -6)) },
    ],
  },
];

/* =========================================================
   ĐÃ CƯỚI
   ========================================================= */
const CUOI: Drama[] = [
  {
    id: 'oriengs',
    pool: 'cuoi',
    maxAge: 36,
    if: (x) => !x.has('ev_orieng'),
    title: 'Ở riêng hay ở chung?',
    bg: () => ({ place: 'nha', time: 'dusk' }),
    who,
    text: (x) => [`Cưới xong, ${inLaw(x)} muốn hai vợ chồng ở chung cho "có trên có dưới". ${sp(x)} nhìn ${x.me}, chờ.`],
    choices: [
      { t: 'Ở chung cho tiết kiệm', do: (fx, x) => (fx.stat('tien', 10), fx.stat('tam', -6), fx.flag('dr_oChung')), note: () => '🦋 Ở chung thì chuyện gì cũng thành chuyện chung.' },
      { t: 'Thuê nhà ra ở riêng', do: (fx, x) => (fx.stat('tien', -10), lv(fx, x, 6), fx.rel('bome', -4)) },
      { t: 'Ở gần, cách nhà mẹ một con phố', do: (fx, x) => (fx.stat('tien', -4), lv(fx, x, 4), fx.rel('bome', 4)) },
    ],
  },
  {
    id: 'giuluong',
    pool: 'cuoi',
    title: 'Ai giữ lương?',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [`Tháng lương đầu tiên sau cưới. ${sp(x)} đặt hai cái phong bì lên bàn: "Mình tính sao đây?"`],
    choices: [
      { t: (x) => `Đưa hết cho ${sp(x)} giữ`, do: (fx, x) => (lv(fx, x, 8), fx.stat('tien', -4), fx.flag('dr_nopluong')) },
      { t: 'Mỗi người một quỹ, góp chung tiền nhà', do: (fx, x) => (fx.stat('tien', 6), lv(fx, x, 2)) },
      { t: 'Gửi hết, nhưng giữ lại một "quỹ đen" nhỏ', do: (fx, x) => (lv(fx, x, 6), fx.stat('tien', 4), fx.flag('dr_quyden')), note: () => '🦋 Quỹ đen nào rồi cũng có ngày bị phát hiện.' },
    ],
  },
  {
    id: 'lotquyden',
    pool: 'cuoi',
    if: (x) => x.has('dr_quyden'),
    callback: true,
    title: 'Lộ quỹ đen',
    bg: () => ({ place: 'nha', time: 'day' }),
    who,
    text: (x) => [`Dọn nhà đón Tết, ${sp(x)} lôi ra một phong bì kẹp trong cuốn sách cũ: ${money(x.year, 8)}, ghi chữ "Đừng động vào".`],
    choices: [
      { t: '"Đó là tiền mua quà kỷ niệm cho mình mà!"', do: (fx, x) => (fx.stat('duyen', 4), fx.stat('tien', -8), lv(fx, x, x.s.stats.duyen >= 50 ? 6 : -4)), note: () => 'Tuần sau phải mua quà thật.' },
      { t: 'Nhận lỗi, nộp hết', do: (fx, x) => (fx.stat('tien', -8), lv(fx, x, 4)) },
      { t: 'Chối: "Tiền của ai để quên đấy"', do: (fx, x) => (lv(fx, x, -10)), note: (x) => `${sp(x)} không nói gì, chỉ lấy phong bì cất vào túi mình.` },
    ],
  },
  {
    id: 'nuoicon',
    pool: 'cuoi',
    if: (x) => x.s.kids > 0,
    title: (x) => `${InLaw(x)} lên trông cháu`,
    bg: () => ({ place: 'nha', time: 'day' }),
    who: () => 'mom',
    text: (x) => [
      `${InLaw(x)} lên trông cháu. Cháu sốt thì xông lá, cháu khóc thì bế rong, ăn thì phải "ăn cho chắc bụng".`,
      `${x.me} thì đọc sách nuôi con kiểu ${x.year < 2010 ? 'bác sĩ dặn' : 'trên mạng'}. Hai thế hệ, hai cách nuôi.`,
    ],
    choices: [
      { t: (x) => `Theo cách ${inLaw(x)}, êm cửa êm nhà`, do: (fx, x) => (fx.rel('bome', 6), fx.stat('tam', -6), lv(fx, x, 4)) },
      { t: 'Ngồi xuống nói chuyện, chọn cái hay của cả hai', do: (fx, x) => (x.s.stats.duyen + x.s.stats.tinh >= 100 ? (fx.rel('bome', 8), lv(fx, x, 6), fx.say(`${InLaw(x)} gật gù: "Ừ, thời mỗi khác."`)) : (fx.rel('bome', -4), fx.say('Nói chưa khéo, bà giận về quê ba hôm.'))) },
      { t: (x) => `Nhờ ${sp(x)} nói với mẹ`, do: (fx, x) => (lv(fx, x, low(x, 55) ? -6 : 4)), note: (x) => (low(x, 55) ? `${sp(x)} bảo: "Mẹ nuôi anh em mình lớn đấy thôi."` : `${sp(x)} đứng về phía ${x.me}.`) },
    ],
  },
  {
    id: 'nuadem',
    pool: 'cuoi',
    from: 2008,
    title: 'Tin nhắn lúc nửa đêm',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [{ me: false, t: x.year < 2012 ? 'Ngủ chưa? Nhớ quá.' : 'Ngủ chưa? Hôm nay vui ghê 🙈' }],
    timer: 12,
    timeout: 2,
    text: (x) => [`Một giờ sáng, điện thoại ${sp(x)} sáng lên trên tủ đầu giường. Số lưu tên "Đồng nghiệp".`],
    choices: [
      {
        t: 'Lay dậy hỏi thẳng',
        do: (fx, x) => {
          if (low(x, 45)) (lv(fx, x, -15), fx.flag('dr_ngoaitinh'), fx.say(`${sp(x)} ấp úng. Đêm đó không ai ngủ.`));
          else (lv(fx, x, 2), fx.say(`Là nhóm chat cơ quan, ai đó nhắn nhầm. ${sp(x)} rời nhóm ngay trước mặt ${x.me}.`));
        },
      },
      {
        t: 'Rủ bạn bè đi đánh ghen, quay clip',
        do: (fx, x) => (fx.stat('noi', 12), fx.stat('tam', -12), fx.rel('con', -10), lv(fx, x, -20), fx.mid('danhghen')),
        note: () => 'Clip lên mạng một triệu lượt xem. Con đi học bị bạn chỉ trỏ.',
      },
      { t: 'Giả vờ không thấy, theo dõi thêm', do: (fx, x) => (fx.stat('tam', -8), fx.flag('dr_theodoi')), note: () => '🦋 Chuyện này rồi sẽ phải nói ra.' },
    ],
  },
  {
    id: 'theodoi',
    pool: 'cuoi',
    if: (x) => x.has('dr_theodoi') || x.has('dr_ngoaitinh'),
    callback: true,
    title: 'Ngồi hai đầu ghế',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [`Mấy tháng nay, hai vợ chồng ngồi hai đầu ghế, mỗi người một cái điện thoại. Bữa cơm chỉ còn tiếng thìa đũa.`],
    choices: [
      { t: 'Đi tư vấn hôn nhân cùng nhau', if: (x) => x.year >= 2010, do: (fx, x) => (lv(fx, x, 12), fx.stat('tam', 8), fx.stat('tien', -6)), note: () => 'Buổi đầu ai cũng khóc. Buổi thứ năm thì cười được.' },
      { t: 'Đặt điện thoại xuống, nói hết', do: (fx, x) => (x.s.stats.tinh >= 50 ? (lv(fx, x, 10), fx.say('Nói đến gần sáng. Hóa ra cả hai đều sợ mất nhau.')) : (lv(fx, x, -6), fx.say('Nói được nửa câu thì cãi nhau.'))) },
      { t: 'Ly hôn', do: (fx, x) => (fx.loveEnd(pid(x) ? `lyhon_${pid(x)}` : 'lyhon'), fx.divorce(), fx.mid('lyhon'), fx.stat('tam', -6), x.s.kids > 0 ? fx.rel('con', -8) : undefined), note: () => 'Tòa xử nhanh. Chia tài sản thì lâu hơn.' },
      { t: 'Sống tiếp vì con', if: (x) => x.s.kids > 0, do: (fx, x) => (fx.rel('con', 8), fx.stat('tam', -10), lv(fx, x, -2)) },
    ],
  },
  {
    id: 'vieccnha',
    pool: 'cuoi',
    title: 'Việc nhà của ai?',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [`Chín giờ tối. Bát chưa rửa, quần áo chưa phơi, con chưa tắm. ${sp(x)} đang nằm xem ${x.year < 2010 ? 'thời sự' : 'điện thoại'}.`],
    choices: [
      { t: 'Lập bảng phân công dán tủ lạnh', do: (fx, x) => (fx.stat('hoc', 4), lv(fx, x, 4)), note: () => 'Tuần đầu đúng bảng. Tuần sau bảng rơi sau tủ.' },
      { t: 'Thuê người giúp việc theo giờ', if: (x) => x.s.stats.tien >= 40, do: (fx, x) => (fx.stat('tien', -10), lv(fx, x, 6), fx.stat('tam', 6)) },
      { t: 'Cãi một trận cho ra lẽ', do: (fx, x) => (lv(fx, x, -8), fx.stat('noi', 6)) },
      { t: 'Tự làm hết, rồi lặng lẽ khóc', do: (fx, x) => (fx.stat('tam', -10), lv(fx, x, -2)) },
    ],
  },
  {
    id: 'muanha',
    pool: 'cuoi',
    from: 2000,
    title: 'Vay tiền mua nhà',
    bg: () => ({ place: 'pho', time: 'day' }),
    who,
    text: (x) => [
      x.year < 2010
        ? `Một mảnh đất ở rìa thành phố, rao ${money(x.year, 600)}. Hai vợ chồng đứng nhìn bãi cỏ dại rất lâu.`
        : `Căn hộ hai phòng ngủ, ${money(x.year, 3000)}, vay ngân hàng 20 năm. ${sp(x)} cầm tờ giấy tính lãi, tay hơi run.`,
    ],
    choices: [
      { t: 'Vay, cắn răng trả góp', do: (fx, x) => (fx.stat('tien', -15), lv(fx, x, 6), fx.flag('dr_conhanha')), note: () => '🦋 Hai mươi năm là một quãng dài.' },
      { t: 'Ở thuê tiếp, để tiền đi chơi', do: (fx, x) => (fx.stat('tam', 8), fx.stat('tien', 4), fx.rel('bome', -4)) },
      { t: 'Về quê xây nhà', do: (fx, x) => (fx.stat('tinh', 6), fx.stat('tien', -6), fx.rel('bome', 8)) },
    ],
  },
  {
    id: 'luongcao',
    pool: 'cuoi',
    title: (x) => (x.c.gender === 'f' ? 'Vợ lương cao hơn chồng' : 'Lương vợ gấp đôi mình'),
    bg: () => ({ place: 'vanphong', time: 'dusk' }),
    who,
    text: (x) =>
      x.c.gender === 'f'
        ? [`${x.me} được thăng chức, lương gấp đôi ${sp(x)}. Họp lớp, bạn ${x.ay} trêu: "Giờ ở nhà ai làm chủ?"`, `Về nhà, ${sp(x)} im lặng cả tối.`]
        : [`${sp(x)} được thăng chức, lương gấp đôi ${x.me}. Họ hàng ngày Tết bảo: "Cưới được vợ giỏi, sướng nhé!"`, `Câu khen nghe hơi giống câu chê.`],
    choices: [
      { t: 'Mở chai nước ngọt, ăn mừng chung', do: (fx, x) => (lv(fx, x, 8), fx.stat('tam', 4)) },
      { t: 'Nói thật: mình thấy chạnh lòng', if: (x) => x.c.gender === 'm', do: (fx, x) => (fx.stat('tinh', 6), lv(fx, x, 6)), note: (x) => `${sp(x)} ôm ${x.me}: "Tiền của nhà mình mà."` },
      { t: (x) => `Hỏi ${sp(x)} đang nghĩ gì`, if: (x) => x.c.gender === 'f', do: (fx, x) => (fx.stat('tinh', 6), lv(fx, x, low(x, 50) ? -2 : 8)) },
      { t: 'Gác chuyện tiền sang một bên, không nhắc', do: (fx, x) => (lv(fx, x, -4), fx.flag('dr_canhcan')) },
    ],
  },
  {
    id: 'contrai',
    pool: 'cuoi',
    if: (x) => x.s.kids > 0 && x.s.kids < 3,
    title: 'Phải có thằng cu',
    bg: () => ({ place: 'nha', time: 'day', tet: true }),
    who: () => 'mom',
    text: (x) => [`Mâm cơm giỗ, các bác trong họ nhắc lại chuyện cũ: "Nhà này phải có cháu đích tôn mới được."`, `${x.c.gender === 'f' ? 'Mẹ chồng' : 'Mẹ'} gắp thức ăn cho ${x.me}, không nói gì, nhưng ai cũng hiểu.`],
    choices: [
      { t: 'Sinh thêm một đứa nữa', do: (fx, x) => (fx.kids(x.s.kids + 1), fx.stat('tien', -10), fx.rel('bome', 8), fx.rel('con', 5)) },
      { t: '"Con gái hay con trai cũng là cháu cả"', do: (fx, x) => (fx.stat('noi', 6), fx.rel('bome', -6), lv(fx, x, 4)), sys: 'Đinh! Lựa chọn đúng.' },
      { t: (x) => `Để ${sp(x)} trả lời họ hàng`, do: (fx, x) => lv(fx, x, low(x, 50) ? -6 : 6) },
    ],
  },
  {
    id: 'hocthem',
    pool: 'cuoi',
    minAge: 36,
    if: (x) => x.s.kids > 0,
    title: 'Năm lớp học thêm',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [`Con vào lớp ${x.year < 2005 ? 'chọn' : 'chuyên'}, ${sp(x)} đăng ký thêm năm lớp: Toán, Văn, Anh, Piano, Bơi. Mười giờ đêm con vẫn ngồi học.`],
    choices: [
      { t: 'Cho con nghỉ bớt, chơi nhiều hơn', do: (fx, x) => (fx.rel('con', 12), lv(fx, x, -4)) },
      { t: (x) => `Theo ${x.lg === 'm' ? 'chồng' : 'vợ'}, con người ta cũng thế cả`, do: (fx, x) => (fx.rel('con', -6), lv(fx, x, 4), fx.stat('tien', -8)) },
      { t: 'Hỏi con muốn gì', do: (fx, x) => (fx.rel('con', 15), fx.stat('tinh', 4)), note: () => 'Con bảo chỉ muốn được đi đá bóng với bố mẹ một buổi.' },
    ],
  },
  {
    id: 'muoinam',
    pool: 'cuoi',
    if: (x) => x.s.marriedAge !== null && x.age - x.s.marriedAge >= 8,
    title: (x) => (ym(x) === 10 ? 'Mười năm ngày cưới' : `${ym(x)} năm ngày cưới`),
    bg: () => ({ place: 'quan', time: 'night' }),
    who,
    text: (x) => [`${ym(x) === 10 ? 'Mười' : ym(x)} năm ngày cưới. ${sp(x)} hỏi: "Còn nhớ chỗ mình hẹn hò lần đầu không?"`],
    choices: [
      { t: (x) => (x.s.kids ? 'Gửi con cho ông bà, đi lại đúng chỗ cũ' : 'Đi lại đúng chỗ cũ'), do: (fx, x) => (lv(fx, x, 12), fx.stat('tam', 6)), note: () => 'Quán cũ đã đổi chủ, nhưng góc bàn vẫn còn.' },
      { t: 'Làm tiệc to, mời cả họ', do: (fx, x) => (fx.stat('tien', -10), fx.rel('bome', 6), lv(fx, x, 4)) },
      { t: '"Ừ... chỗ nào nhỉ?"', do: (fx, x) => lv(fx, x, -10), note: (x) => `${sp(x)} cười, mà mắt buồn.` },
    ],
  },
  {
    id: 'hoichiem',
    pool: 'cuoi',
    from: 2015,
    title: 'Bài đăng trong hội',
    bg: () => ({ place: 'phong', time: 'night' }),
    who: () => 'mom',
    post: (x) => ({
      author: 'Ẩn danh',
      time: '1 giờ',
      text: `Các ${x.c.gender === 'f' ? 'chị' : 'anh'} ơi, ${x.c.gender === 'f' ? 'chồng' : 'vợ'} em hứa đi ăn kỷ niệm rồi lại đi nhậu với bạn, về muộn còn bảo em làm quá. Em nên làm gì?`,
      likes: 840,
      comments: [
        { who: 'Thành viên mới', t: 'Bỏ đi em, đời còn dài!' },
        { who: 'Admin', t: 'Mọi người bình tĩnh, nghe cả hai phía nhé.' },
      ],
    }),
    kind: 'chat',
    msgs: (x) => [{ me: false, t: `${InLaw(x)}: Con ơi, con gỡ bài xuống giùm mẹ nhé. Có gì vợ chồng nói với nhau.` }],
    text: (x) => [`Tối qua giận ${sp(x)}, ${x.me} lỡ đăng bài vào hội nhóm. Sáng nay ${inLaw(x)} nhắn riêng.`],
    choices: [
      { t: 'Gỡ bài, cảm ơn mẹ', do: (fx, x) => (fx.rel('bome', 8), lv(fx, x, 4)), note: (x) => `${InLaw(x)} gửi thêm một cái sticker ôm.` },
      { t: 'Để nguyên, cho cả họ biết', do: (fx, x) => (fx.stat('noi', 8), lv(fx, x, -12), fx.rel('bome', -8)) },
      { t: (x) => `Gỡ bài, rồi nói chuyện thẳng với ${sp(x)}`, do: (fx, x) => (lv(fx, x, 8), fx.stat('tinh', 4)) },
    ],
  },
  {
    id: 'lixi',
    pool: 'cuoi',
    title: 'Tiền biếu Tết hai bên',
    bg: () => ({ place: 'nha', time: 'day', tet: true }),
    who,
    text: (x) => [`Ba mươi Tết, hai vợ chồng ngồi chia phong bì: bao nhiêu cho nhà nội, bao nhiêu cho nhà ngoại, bao nhiêu lì xì cháu.`],
    choices: [
      { t: 'Chia đều tuyệt đối, đến từng tờ', do: (fx, x) => (lv(fx, x, 4), fx.stat('hoc', 2)) },
      { t: 'Nhà nào khó hơn thì biếu nhiều hơn', do: (fx, x) => (fx.stat('tinh', 6), lv(fx, x, x.s.stats.tinh >= 50 ? 6 : -4)) },
      { t: 'Bên mình nhiều hơn một chút, không nói', do: (fx, x) => (fx.rel('bome', 6), fx.flag('dr_lixi')), note: () => '🦋 Hai nhà rồi cũng sẽ so phong bì.' },
    ],
  },
  {
    id: 'lixilo',
    pool: 'cuoi',
    if: (x) => x.has('dr_lixi'),
    callback: true,
    title: 'Hai phong bì',
    bg: () => ({ place: 'nha', time: 'day', tet: true }),
    who,
    text: (x) => [`Mùng hai, hai bà thông gia ngồi uống trà, kể chuyện con cái biếu Tết. Hai con số không giống nhau.`],
    choices: [
      { t: 'Xin lỗi, bù vào năm sau', do: (fx, x) => (fx.stat('tien', -6), lv(fx, x, 4)) },
      { t: 'Đổ cho chiếc phong bì bị rách', do: (fx, x) => (fx.stat('duyen', 4), lv(fx, x, -6)), note: () => 'Không ai tin. Nhưng ai cũng cười.' },
    ],
  },
  {
    id: 'laman',
    pool: 'cuoi',
    title: (x) => (x.year >= 2016 ? 'Nghỉ việc bán hàng online' : 'Nghỉ việc mở quán'),
    bg: () => ({ place: 'pho', time: 'day' }),
    who,
    text: (x) => [`${sp(x)} muốn nghỉ việc ổn định để ${x.year >= 2016 ? 'livestream bán hàng' : x.year >= 2005 ? 'mở quán cà phê' : 'buôn hàng Trung Quốc về bán'}, cần lấy tiền tiết kiệm của cả nhà.`],
    choices: [
      {
        t: 'Ủng hộ hết mình',
        do: (fx, x) => {
          lv(fx, x, 10);
          const live = x.year >= 2016;
          if (x.s.stats.tien >= 50) (fx.stat('tien', 15), fx.say(live ? 'Một năm sau, phiên live nào cũng chốt hết đơn.' : 'Một năm sau, quán đông kín khách.'));
          else (fx.stat('tien', -15), fx.say(live ? 'Một năm sau, kho hàng tồn chất đến trần nhà. Nhưng hai người vẫn nắm tay nhau.' : 'Một năm sau, quán đóng cửa. Nhưng hai người vẫn nắm tay nhau.'));
        },
      },
      { t: (x) => (x.s.kids ? 'Can: con còn nhỏ, nhà còn nợ' : 'Can: nhà còn đang trả góp'), do: (fx, x) => (lv(fx, x, -6), fx.stat('tien', 4), fx.flag('dr_canhcan')) },
      { t: 'Cho thử sáu tháng, có kế hoạch rõ ràng', do: (fx, x) => (lv(fx, x, 6), fx.stat('hoc', 4)) },
    ],
  },
  {
    id: 'canhcan',
    pool: 'cuoi',
    if: (x) => x.has('dr_canhcan'),
    callback: true,
    title: 'Câu nói năm ấy',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [`Một trận cãi nhỏ về tiền điện. Bỗng ${sp(x)} nói: "Năm ấy ${x.goi} cũng bảo ${x.xung} không làm được gì."`, `Hóa ra chuyện cũ vẫn còn đó.`],
    choices: [
      { t: 'Xin lỗi cho chuyện năm ấy', do: (fx, x) => (lv(fx, x, 10), fx.stat('tinh', 6)) },
      { t: '"Thì bây giờ vẫn thế"', do: (fx, x) => (lv(fx, x, -14), fx.flag('dr_theodoi')) },
    ],
  },
  {
    id: 'domam',
    pool: 'cuoi',
    title: (x) => `${x.bm === 'ông bà' ? 'Bà' : 'Bố'} ốm nặng`,
    bg: () => ({ place: 'nha', time: 'dusk' }),
    who,
    text: (x) => [`${x.bm === 'ông bà' ? 'Bà' : 'Bố'} nhập viện. Anh em bàn nhau ai chăm, ai lo tiền. Ai cũng bận.`],
    choices: [
      { t: 'Xin nghỉ phép vào viện chăm', do: (fx, x) => (fx.rel('bome', 15), fx.stat('tien', -8), lv(fx, x, x.s.stats.tinh >= 45 ? 4 : -4)) },
      { t: 'Góp tiền thuê người chăm', do: (fx, x) => (fx.stat('tien', -12), fx.rel('bome', 4)) },
      { t: (x) => `Nhờ ${sp(x)} thay mình vào viện`, do: (fx, x) => (lv(fx, x, low(x, 50) ? -8 : 8), fx.rel('bome', 6)), note: (x) => (low(x, 50) ? `${sp(x)} đi, nhưng mặt nặng mày nhẹ.` : `${sp(x)} ngủ ghế xếp ở viện cả tuần, không một lời than.`) },
    ],
  },
  {
    id: 'dixa',
    pool: 'cuoi',
    title: 'Một người đi xa',
    bg: () => ({ place: 'pho', time: 'night' }),
    who,
    text: (x) => [`${sp(x)} được cử đi ${x.year >= 2010 ? 'dự án ở nước ngoài' : 'công trình trên núi'} một năm, lương gấp ba.${x.s.kids ? ' Nhà còn con nhỏ.' : ''}`],
    choices: [
      { t: 'Đi đi, ở nhà có mình lo', do: (fx, x) => (fx.stat('tien', 12), fx.stat('tam', -6), lv(fx, x, 4), fx.flag('dr_xanha')), note: () => '🦋 Một năm xa nhà, nhiều chuyện có thể xảy ra.' },
      { t: 'Không đi, tiền nào cũng không bằng ở cạnh nhau', do: (fx, x) => (lv(fx, x, 8), fx.stat('tien', -4)) },
    ],
  },
  {
    id: 'venha',
    pool: 'cuoi',
    if: (x) => x.has('dr_xanha'),
    callback: true,
    title: 'Ngày về',
    bg: () => ({ place: 'nha', time: 'dusk' }),
    who,
    text: (x) => [
      x.s.kids
        ? `${sp(x)} về sau một năm. Con nấp sau lưng ${x.me}, không chịu gọi. ${sp(x)} ngồi xuống đất, cười mà mắt đỏ.`
        : `${sp(x)} về sau một năm, gầy đi, đen đi. Đứng ở cửa mãi mới dám bước vào, như khách.`,
    ],
    choices: [
      { t: (x) => `Kể cho con nghe ${x.lg === 'm' ? 'bố' : 'mẹ'} đi xa vì ai`, if: (x) => x.s.kids > 0, do: (fx, x) => (fx.rel('con', 10), lv(fx, x, 8)) },
      { t: 'Để con tự làm quen lại', if: (x) => x.s.kids > 0, do: (fx, x) => (fx.rel('con', 3), lv(fx, x, 2)) },
      { t: 'Ôm thật lâu, không hỏi gì', if: (x) => !x.s.kids, do: (fx, x) => lv(fx, x, 8) },
      { t: 'Hỏi: "Bên ấy có ai không?"', if: (x) => !x.s.kids, do: (fx, x) => (lv(fx, x, -6), fx.stat('noi', 3)) },
    ],
  },
  {
    id: 'trungnien',
    pool: 'cuoi',
    minAge: 40,
    title: 'Khủng hoảng tuổi bốn mươi',
    bg: () => ({ place: 'pho', time: 'day' }),
    who,
    text: (x) => [
      `${sp(x)} bỗng đổi khác: ${x.year >= 2018 ? 'tập nhảy theo trào lưu, đăng clip mỗi ngày' : x.year >= 2005 ? 'mua xe phân khối lớn, đi phượt với hội' : 'mua cây đàn ghi-ta, học hát tình ca'}. "Không làm bây giờ thì bao giờ?"`,
    ],
    choices: [
      { t: 'Làm cùng luôn', do: (fx, x) => (lv(fx, x, 12), fx.stat('noi', 8), fx.stat('tam', 6)), note: (x) => `${x.s.kids ? 'Con cái xấu hổ' : 'Bạn bè trêu suốt'}. Hai vợ chồng thì vui như hồi mới yêu.` },
      { t: 'Kệ, miễn vui là được', do: (fx, x) => (lv(fx, x, 4), fx.stat('tam', 4)) },
      { t: 'Cằn nhằn: già rồi còn bày trò', do: (fx, x) => lv(fx, x, -10) },
    ],
  },
  {
    id: 'traino',
    pool: 'cuoi',
    if: (x) => x.has('dr_chovay'),
    callback: true,
    title: 'Khoản tiền năm ấy',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [`Tối đó ${sp(x)} đặt lên bàn một phong bì cũ, chữ viết tay: "Trả ${x.goi}, cả lãi." Là khoản tiền ${x.me} cho vay từ hồi mới yêu.`],
    choices: [
      { t: '"Tiền của mình cả mà"', do: (fx, x) => (lv(fx, x, 10), fx.stat('tinh', 4)) },
      { t: 'Nhận, rồi đem đi du lịch hai người', do: (fx, x) => (lv(fx, x, 8), fx.stat('tam', 8)) },
    ],
  },
  {
    id: 'tinnhau',
    pool: 'cuoi',
    if: (x) => x.has('dr_tinnhau') || x.has('dr_kehoach'),
    callback: true,
    title: 'Mật khẩu điện thoại',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    text: (x) => [`${sp(x)} đưa điện thoại cho ${x.me} nhờ xem bản đồ. Màn hình khóa hiện ra. Mật khẩu là ngày hai người gặp nhau.`, `"Từ hồi ấy đến giờ chưa đổi."`],
    choices: [{ t: 'Không nói gì, chỉ ôm thật chặt', do: (fx, x) => (lv(fx, x, 10), fx.stat('tam', 6)) }],
  },
  {
    id: 'kyvat',
    pool: 'cuoi',
    minAge: 33,
    if: (x) => !!pid(x) && x.has(`kv_${pid(x)}`),
    callback: true,
    title: 'Món kỷ vật năm ấy',
    bg: () => ({ place: 'nha', time: 'dusk' }),
    who,
    text: (x) => [`Dọn tủ, ${x.me} tìm thấy ${FLAVOR[pid(x)!].keep} - món ${sp(x)} tặng từ hồi mới hẹn hò.`, `${sp(x)} đứng sau lưng từ lúc nào: "Vẫn giữ à?"`],
    choices: [
      { t: '"Giữ cả đời chứ"', do: (fx, x) => (lv(fx, x, 12), fx.stat('tinh', 6)), note: () => 'Tối đó hai người ngồi lật lại album đến khuya.' },
      { t: 'Đưa cho con giữ, kể chuyện ngày xưa', if: (x) => x.s.kids > 0, do: (fx, x) => (fx.rel('con', 10), lv(fx, x, 6)) },
    ],
  },
  {
    id: 'kyvatcu',
    pool: 'cuoi',
    minAge: 35,
    if: (x) => (['khoi', 'long', 'minh', 'phong', 'hai', 'tuananh', 'kai', 'quan', 'bao', 'duy', 'hung', 'tai'] as LoveId[]).some((id) => id !== pid(x) && x.has(`kv_${id}`)),
    callback: true,
    title: 'Món đồ của người cũ',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => {
      const ex = (['khoi', 'long', 'minh', 'phong', 'hai', 'tuananh', 'kai', 'quan', 'bao', 'duy', 'hung', 'tai'] as LoveId[]).find((id) => id !== pid(x) && x.has(`kv_${id}`))!;
      return [`${sp(x)} tìm thấy ${FLAVOR[ex].keep} trong ngăn kéo. Không phải quà của ${sp(x)}.`, `"Của ai đây?"`];
    },
    choices: [
      { t: 'Kể thật, rồi bỏ đi', do: (fx, x) => (lv(fx, x, 6), fx.stat('tinh', 4)) },
      { t: '"Đồ cũ thôi, mình quên mất"', do: (fx, x) => lv(fx, x, -6), note: () => 'Món đồ vẫn nằm trong ngăn kéo. Câu hỏi vẫn nằm trong lòng người kia.' },
      { t: 'Giấu lại chỗ khác', do: (fx, x) => (lv(fx, x, -10), fx.flag('dr_theodoi')) },
    ],
  },
  {
    id: 'concuoi',
    pool: 'cuoi',
    minAge: 50,
    if: (x) => x.s.kids > 0,
    title: 'Con dẫn người yêu về',
    bg: () => ({ place: 'nha', time: 'day' }),
    who,
    text: (x) => [`Con dẫn người yêu về ra mắt. Đứa nhỏ ${x.year >= 2030 ? 'làm nghề huấn luyện AI' : 'làm nghề tự do'}, tóc nhuộm ba màu. ${sp(x)} liếc ${x.me}: đến lượt mình làm bố mẹ khó tính rồi đấy.`],
    choices: [
      { t: 'Nhớ lại năm xưa, gật đầu luôn', do: (fx, x) => (fx.rel('con', 15), lv(fx, x, 6)), note: () => 'Năm xưa mình cũng từng bị nhìn như thế.' },
      { t: 'Hỏi chuyện sính lễ trước', do: (fx, x) => (fx.rel('con', -10), fx.stat('tien', 6)) },
      { t: 'Bảo con: "Con thấy hạnh phúc là được"', do: (fx, x) => (fx.rel('con', 12), fx.stat('tinh', 4)) },
    ],
  },
  {
    id: 'cuoibac',
    pool: 'cuoi',
    minAge: 50,
    if: (x) => x.s.marriedAge !== null && x.age - x.s.marriedAge >= 22,
    title: 'Đám cưới bạc',
    bg: () => ({ place: 'vuon', time: 'dusk' }),
    who,
    text: (x) => [`Hai mươi lăm năm. ${x.s.kids ? 'Con cái làm' : 'Bạn bè làm'} một bữa tiệc nhỏ ngoài vườn, chiếu lại ảnh cưới ngày xưa. ${sp(x)} hồi đó gầy nhom, ${x.me} thì để kiểu tóc không ai dám nhắc.`],
    choices: [
      { t: 'Đứng lên nói vài lời', do: (fx, x) => (lv(fx, x, 10), fx.rel('con', 6)), note: (x) => `${sp(x)} khóc trước cả lúc ${x.me} nói xong.` },
      { t: 'Kéo nhau ra nhảy một bài', do: (fx, x) => (lv(fx, x, 8), fx.stat('tam', 6)) },
    ],
  },
];

/* =========================================================
   ĐANG MỘT MÌNH
   ========================================================= */
const DON: Drama[] = [
  {
    id: 'maimoi',
    pool: 'don',
    minAge: 22,
    maxAge: 45,
    title: '"Bao giờ cưới?"',
    bg: () => ({ place: 'nha', time: 'day', tet: true }),
    who: () => 'mom',
    text: (x) => [`Mùng hai Tết. Cô dì chú bác thay nhau hỏi: "Bao giờ cưới?", "Có ai chưa?", "Để cô giới thiệu cho đứa này, ngoan lắm."`],
    choices: [
      { t: '"Bao giờ cô cho cháu lì xì to thì cháu cưới"', do: (fx) => (fx.stat('duyen', 6), fx.rel('bome', -2)) },
      { t: 'Nhận số điện thoại người được giới thiệu', do: (fx) => (fx.stat('dao', 6), fx.rel('bome', 6)) },
      { t: 'Ra ngoài ngõ đứng cho đỡ mệt', do: (fx) => fx.stat('tam', -4) },
    ],
  },
  {
    id: 'damcuoi',
    pool: 'don',
    minAge: 22,
    maxAge: 40,
    title: (x) => `Đám cưới ${x.s.bestie}`,
    bg: () => ({ place: 'quan', time: 'night' }),
    who: () => 'bestie',
    text: (x) => [`${x.s.bestie} cưới. Lúc tung hoa, bó hoa bay thẳng vào tay ${x.me}. Cả hội trường hò reo.`],
    choices: [
      { t: 'Giơ bó hoa lên, cười thật to', do: (fx) => (fx.stat('dao', 8), fx.rel('banthan', 6)) },
      { t: 'Đưa bó hoa cho người đứng cạnh', do: (fx) => (fx.stat('tam', 2), fx.stat('dao', 3)) },
      { t: 'Về sớm, ngồi một mình ở quán quen', do: (fx) => (fx.stat('tam', -6), fx.stat('tinh', 4)) },
    ],
  },
  {
    id: 'ghosted',
    pool: 'don',
    from: 2015,
    maxAge: 40,
    title: 'Biến mất không một lời',
    bg: () => ({ place: 'phong', time: 'night' }),
    kind: 'chat',
    msgs: () => [
      { me: false, t: 'Hôm nay vui ghê, cuối tuần mình đi tiếp nhé!' },
      { me: true, t: 'Ok, thứ bảy nhé?' },
      { me: true, t: 'Ê, còn đó không?' },
    ],
    timer: 12,
    timeout: 1,
    text: (x) => [`Ba buổi hẹn rất vui với một người quen qua app. Rồi người ấy biến mất, như chưa từng tồn tại.`],
    choices: [
      { t: 'Nhắn thêm một tin cuối, rồi xóa', do: (fx) => (fx.stat('tam', 4), fx.stat('tinh', 2)) },
      { t: 'Gửi một tràng chửi cho hả giận', do: (fx) => (fx.stat('noi', 6), fx.stat('tam', -4)) },
      { t: 'Xóa app, đi ngủ', do: (fx) => fx.stat('tam', 6), sys: 'Đinh! Không phải lỗi của ký chủ.' },
    ],
  },
  {
    id: 'luadao',
    pool: 'don',
    from: 2012,
    title: 'Người yêu qua mạng',
    bg: () => ({ place: 'phong', time: 'night' }),
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: `${x.lg === 'm' ? 'Anh' : 'Em'} đang ở nước ngoài, có gói quà gửi về cho ${x.lg === 'm' ? 'em' : 'anh'} nè.` },
      { me: false, t: `Hải quan giữ lại, chuyển giúp ${x.lg === 'm' ? 'anh' : 'em'} phí 15 triệu nha. Về trả gấp đôi.` },
    ],
    timer: 12,
    timeout: 1,
    text: (x) => [`Ba tháng nhắn tin với một người đẹp như tài tử, chưa bao giờ chịu gọi video.`],
    choices: [
      { t: 'Chuyển tiền, vì tin', do: (fx) => (fx.stat('tien', -20), fx.stat('tam', -10), fx.mid('luadao')), note: () => 'Tài khoản kia xóa nick ngay sau khi nhận tiền.' },
      { t: 'Đòi gọi video trước', do: (fx) => (fx.stat('hoc', 4), fx.stat('tam', 4)), note: () => 'Bên kia bảo "camera hỏng", rồi im luôn.' },
      { t: 'Chặn và báo cáo tài khoản', do: (fx) => fx.stat('tam', 6), sys: 'Đinh! Ký chủ tỉnh táo. Vui vẻ +6.' },
    ],
  },
  {
    id: 'crushcope',
    pool: 'don',
    from: 2010,
    maxAge: 35,
    title: 'Crush đăng ảnh đôi',
    bg: () => ({ place: 'phong', time: 'night' }),
    text: (x) => [`Người ${x.me} thầm thích cả năm vừa đổi ảnh đại diện: hai bàn tay đan vào nhau, kèm dòng "Đã có chủ".`],
    choices: [
      { t: 'Thả tim, chúc mừng thật lòng', do: (fx) => (fx.stat('tinh', 6), fx.stat('tam', -2)) },
      { t: 'Bỏ theo dõi ngay trong đêm', do: (fx) => (fx.stat('tam', 2), fx.stat('noi', 2)) },
      { t: 'Đi cắt tóc, bắt đầu lại', do: (fx) => (fx.stat('duyen', 6), fx.stat('dao', 4)) },
    ],
  },
  {
    id: 'sinhnhat',
    pool: 'don',
    minAge: 25,
    title: 'Sinh nhật một mình',
    bg: () => ({ place: 'phong', time: 'night' }),
    text: (x) => [`Sinh nhật ${x.age} tuổi. ${x.year < 2010 ? 'Không ai gọi.' : 'Mạng xã hội gửi lời chúc tự động.'} ${x.me} tự mua một cái bánh nhỏ, cắm một cây nến.`],
    choices: [
      { t: (x) => `Gọi cho ${x.s.bestie}`, do: (fx, x) => (fx.rel('banthan', 8), fx.stat('tam', 4)), note: (x) => `Nửa tiếng sau, ${x.s.bestie} đứng ngoài cửa với hai lon bia.` },
      { t: 'Thổi nến, ước một điều thật to', do: (fx) => (fx.stat('dao', 6), fx.stat('tam', 4)) },
      { t: (x) => `Về nhà ăn cơm với ${x.bm}`, do: (fx) => (fx.rel('bome', 10), fx.stat('tam', 4)) },
    ],
  },
];


/* =========================================================
   SAU CƯỚI KHÔNG HẠNH PHÚC: chồng/vợ sa vào cờ bạc, rượu chè, trai gái.
   Ba chặng cách nhau vài năm: dấu hiệu - trượt dài - ngã ba đường. Chặng trước quyết định chặng sau.
   ========================================================= */
export type Vice = 'cobac' | 'ruou' | 'traigai';
/** tật xấu hợp với từng người (hai khả năng, đời nào ra cái nào là do số) */
const VICE_OF: Record<LoveId, [Vice, Vice]> = {
  khoi: ['cobac', 'ruou'],
  long: ['ruou', 'cobac'],
  minh: ['traigai', 'ruou'],
  phong: ['ruou', 'traigai'],
  hai: ['ruou', 'cobac'],
  tuananh: ['traigai', 'cobac'],
  kai: ['ruou', 'traigai'],
  quan: ['traigai', 'ruou'],
  bao: ['cobac', 'ruou'],
  duy: ['ruou', 'traigai'],
  hung: ['traigai', 'cobac'],
  tai: ['ruou', 'traigai'],
};
/** chồng/vợ đời này có sa vào tật xấu không: cưới vội, cưới lệch gu, xem mắt thì dễ hơn; cưới đúng người hợp gu thì ít */
export const viceOf = (x: Ctx): Vice | null => {
  if (!x.s.married || x.has('vice_het')) return null;
  const end = x.s.loveEnd ?? '';
  const p = end.startsWith('hanhphuc') || end.startsWith('duyenno') ? 20 : end.startsWith('dodang') || end === 'cuoivoi' ? 50 : x.s.partner === 'xemmat' ? 45 : 32;
  const h = hash(`${x.s.seed ?? 0}|vice|${x.s.partner}`);
  if (h % 100 >= p) return null;
  const id = pid(x);
  const pair: [Vice, Vice] = id ? VICE_OF[id] : (['cobac', 'ruou', 'traigai'] as Vice[]).slice(h % 3).concat(['cobac', 'ruou', 'traigai'] as Vice[]).slice(0, 2) as [Vice, Vice];
  return pair[(h >> 3) % 2];
};
const vk = (x: Ctx, k: Vice) => viceOf(x) === k;
const ym2 = (x: Ctx) => (x.s.marriedAge == null ? 0 : x.age - x.s.marriedAge);
/** cờ bạc theo thời */
const bac = (y: number) => (y < 2000 ? 'ghi số đề, tối nào cũng ngồi xóc đĩa ở nhà ông Tư đầu xóm' : y < 2016 ? 'cá độ bóng đá, mùa giải nào cũng "đánh" mấy trận' : 'cá độ qua ứng dụng trên điện thoại, đêm nào cũng lướt đến ba giờ sáng');
const vay = (y: number) => (y < 2000 ? 'vay lãi ngày của bà chủ hụi' : y < 2016 ? 'vay nóng chỗ tiệm cầm đồ' : 'vay qua ứng dụng tín dụng đen');
const nhau = (y: number) => (y < 2000 ? 'rượu quê can nhựa' : y < 2010 ? 'bia hơi vỉa hè' : 'quán nhậu "không say không về"');
const lo = (y: number) => (y < 2004 ? 'Giặt áo thì thấy một lá thư lạ trong túi' : y < 2014 ? 'Cầm nhầm điện thoại thì thấy một tin nhắn lạ' : 'Mượn máy gọi nhờ thì thấy một tài khoản Chat phụ, ảnh đại diện là bông hoa');
const sys = (t: string) => `Đinh! ${t}`;

const VICE: Drama[] = [
  /* ----- chặng 1: dấu hiệu ----- */
  {
    id: 'v1_cobac',
    pool: 'cuoi',
    callback: true,
    if: (x) => vk(x, 'cobac') && ym2(x) >= 2,
    title: 'Tiền chợ hụt dần',
    bg: () => ({ place: 'nha', time: 'night' }),
    who,
    text: (x) => [
      `Mấy tháng nay tiền chợ cứ hụt dần. ${sp(x)} hay về muộn, điện thoại úp xuống bàn, giật mình mỗi khi có tin nhắn.`,
      `Tối nay có người lạ đứng trước cổng hỏi: "${sp(x)} có nhà không? Bảo là anh Hòa tìm."`,
      `Hóa ra ${sp(x)} đang ${bac(x.year)}.`,
    ],
    choices: [
      { t: 'Ngồi xuống nói chuyện thẳng thắn, bắt hứa dừng lại', do: (fx, x) => (fx.flag('vh_noi'), lv(fx, x, -4), fx.stat('tinh', 4)), note: (x) => `${sp(x)} cúi đầu: "Lần cuối thôi." Ai cũng từng nói câu ấy.` },
      { t: 'Lặng lẽ giữ hết tiền nhà, mở sổ tiết kiệm riêng', do: (fx) => (fx.flag('vh_giu'), fx.stat('tien', 6), fx.stat('tam', -4)), note: () => '🦋 Sổ tiết kiệm này sau sẽ cứu cả nhà.' },
      { t: 'Cho qua, chắc chỉ chơi cho vui', do: (fx) => (fx.flag('vh_bo'), fx.stat('tam', 2)), note: () => '🦋 Có những chuyện "chơi cho vui" lớn dần lên.' },
    ],
  },
  {
    id: 'v1_ruou',
    pool: 'cuoi',
    callback: true,
    if: (x) => vk(x, 'ruou') && ym2(x) >= 2,
    title: 'Mười một giờ đêm',
    bg: () => ({ place: 'ngo', time: 'night' }),
    who,
    text: (x) => [
      `Tuần này là lần thứ năm ${sp(x)} đi ${nhau(x.year)} với hội bạn, về nhà lúc nửa đêm, nói to, đập cửa, rồi gục luôn ở ghế.`,
      `Sáng ra lại xin lỗi, lại hứa. ${x.s.kids ? 'Con hỏi: "Sao nhà mình to tiếng thế?"' : 'Hàng xóm nhìn sang, lắc đầu.'}`,
    ],
    choices: [
      { t: 'Đợi lúc tỉnh, nói rõ: rượu hoặc gia đình', do: (fx, x) => (fx.flag('vh_noi'), lv(fx, x, -2), fx.stat('tinh', 4)) },
      { t: 'Gọi điện cho hội bạn nhậu, nói thẳng một câu', do: (fx, x) => (fx.flag('vh_giu'), fx.stat('noi', 6), lv(fx, x, -6)), note: () => 'Hội bạn thôi rủ một thời gian. Chỉ một thời gian.' },
      { t: 'Thôi, đi làm ai chẳng phải tiếp khách', do: (fx) => (fx.flag('vh_bo'), fx.stat('tam', -3)), note: () => '🦋 Chén rượu hôm nay sẽ còn quay lại.' },
    ],
  },
  {
    id: 'v1_traigai',
    pool: 'cuoi',
    callback: true,
    if: (x) => vk(x, 'traigai') && ym2(x) >= 2,
    title: 'Mùi nước hoa lạ',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    text: (x) => [
      `${sp(x)} dạo này chăm chải chuốt hẳn, hay "đi công tác", hay cười một mình. ${lo(x.year)}.`,
      `Dòng cuối: "${x.lg === 'm' ? 'Em' : 'Anh'} nhớ ${x.lg === 'm' ? 'anh' : 'em'} lắm, cuối tuần gặp nhé."`,
    ],
    choices: [
      { t: 'Đặt nó lên bàn, hỏi thẳng', do: (fx, x) => (fx.flag('vh_noi'), lv(fx, x, -8), fx.stat('noi', 4)), note: (x) => `${sp(x)} chối, rồi im lặng, rồi nhận. Đêm ấy không ai ngủ.` },
      { t: 'Im lặng, âm thầm theo dõi thêm', do: (fx) => (fx.flag('vh_giu'), fx.stat('hoc', 4), fx.stat('tam', -6)), note: () => '🦋 Mọi bằng chứng đều được chụp lại.' },
      { t: 'Coi như không thấy, giữ nhà là chính', do: (fx) => (fx.flag('vh_bo'), fx.stat('tam', -8)), note: () => '🦋 Lần này không thấy. Lần sau thì khó.' },
    ],
  },

  /* ----- chặng 2: trượt dài ----- */
  {
    id: 'v2_cobac',
    pool: 'cuoi',
    callback: true,
    if: (x) => vk(x, 'cobac') && x.has('dr_v1_cobac'),
    title: 'Chủ nợ đến nhà',
    bg: () => ({ place: 'nha', time: 'day' }),
    who,
    kind: 'chat',
    msgs: (x) =>
      x.year >= 2016
        ? [
            { me: false, t: `Số lạ: ${x.lg === 'm' ? 'Chồng' : 'Vợ'} ${x.c.gender === 'f' ? 'chị' : 'anh'} nợ ${money(x.year, 300)}, ba ngày không trả thì đừng trách.` },
            { me: false, t: 'Số lạ: (gửi ảnh mặt người nhà ghép vào cáo phó)' },
          ]
        : [{ me: false, t: `Giấy dán trước cổng: "${sp(x)} nợ ${money(x.year, 300)}. Trả tiền đi."` }],
    timer: 15,
    timeout: 2,
    text: (x) => [
      `${sp(x)} thua nặng, ${vay(x.year)} để gỡ, càng gỡ càng thua. Giờ nợ ${money(x.year, 300)}.`,
      x.has('vh_noi') ? `Lời hứa năm ấy không giữ được.` : x.has('vh_bo') ? `🦋 "Chơi cho vui" năm nào giờ thành thế này.` : `Sổ tiết kiệm riêng vẫn còn nguyên trong ngăn tủ.`,
    ],
    choices: [
      { t: 'Bán vàng cưới trả nợ một lần, bắt viết cam kết', do: (fx, x) => (fx.flag('vh_tra'), fx.stat('tien', -20), lv(fx, x, 6)), note: () => 'Tờ cam kết có chữ ký, có cả dấu vân tay.' },
      { t: 'Gọi họp hai bên gia đình, đưa đi cai', do: (fx, x) => (fx.flag('vh_cai'), fx.rel('bome', 6), lv(fx, x, -4)), sys: () => sys('Ký chủ vừa mở hội đồng gia tộc. Bản Hệ Thống đứng nép vào góc.') },
      { t: 'Báo công an chuyện đòi nợ, đưa con về nhà ngoại ở tạm', if: (x) => x.year >= 1995, do: (fx, x) => (fx.flag('vh_tach'), lv(fx, x, -14), fx.stat('noi', 6)) },
      { t: 'Gánh hết, không nói với ai', do: (fx, x) => (fx.flag('vh_ganh'), fx.stat('tien', x.has('vh_giu') ? -8 : -25), fx.stat('tam', -10), fx.stat('khoe', -6)), note: (x) => (x.has('vh_giu') ? '🦋 Sổ tiết kiệm riêng năm ấy đỡ được một nửa.' : 'Tóc bắt đầu bạc từ năm ấy.') },
    ],
  },
  {
    id: 'v2_ruou',
    pool: 'cuoi',
    callback: true,
    if: (x) => vk(x, 'ruou') && x.has('dr_v1_ruou'),
    title: (x) => (x.year >= 2020 ? 'Giữ xe vì nồng độ cồn' : 'Ngã xe giữa đêm'),
    bg: () => ({ place: 'pho', time: 'night' }),
    who,
    kind: 'call',
    text: (x) => [
      x.year >= 2020
        ? `Hai giờ sáng, điện thoại reo. ${sp(x)} bị thổi nồng độ cồn, giữ xe, phạt ${money(x.year, 35)}, tước bằng. Đứng ở chốt mà vẫn cãi.`
        : `Hai giờ sáng, có người gọi: ${sp(x)} say, ngã xe ở dốc cầu, rách trán, đang ở trạm xá.`,
      x.has('vh_bo') ? '🦋 Câu "ai chẳng nhậu" năm ấy giờ nghe khác hẳn.' : `${sp(x)} từng hứa. Hứa nhiều lần rồi.`,
    ],
    call: (x) => ({ dir: 'in', name: x.year >= 2020 ? 'Số lạ' : 'Trạm xá', sub: 'Hai giờ sáng', lines: [`"${x.c.gender === 'f' ? 'Chị' : 'Anh'} là người nhà của ${sp(x)} phải không?"`] }),
    choices: [
      { t: 'Đến đón, rồi đưa đi khám, nói chuyện với bác sĩ', do: (fx, x) => (fx.flag('vh_cai'), lv(fx, x, 6), fx.stat('khoe', -2)), note: () => 'Bác sĩ nói thẳng: gan đã có vấn đề. Lần đầu tiên người ấy sợ.' },
      { t: 'Để người ấy tự lo một đêm cho tỉnh', do: (fx, x) => (fx.flag('vh_tach'), lv(fx, x, -10), fx.stat('noi', 4)) },
      { t: 'Lại đến đón, lại lau mặt, lại cho qua', do: (fx, x) => (fx.flag('vh_ganh'), lv(fx, x, 2), fx.stat('tam', -10), fx.stat('khoe', -4)) },
    ],
  },
  {
    id: 'v2_traigai',
    pool: 'cuoi',
    callback: true,
    if: (x) => vk(x, 'traigai') && x.has('dr_v1_traigai'),
    title: 'Người thứ ba nhắn tin',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: `Người lạ: Chào ${x.c.gender === 'f' ? 'chị' : 'anh'}. Em nghĩ ${x.c.gender === 'f' ? 'chị' : 'anh'} nên biết sự thật.` },
      { me: false, t: `Người lạ: Bọn em yêu nhau hai năm rồi. ${sp(x)} bảo sắp ly hôn.` },
    ],
    timer: 15,
    timeout: 1,
    text: (x) => [
      x.has('vh_noi') ? `Lần trước ${sp(x)} thề đã cắt đứt. Hóa ra chưa.` : x.has('vh_giu') ? '🦋 Bằng chứng chụp lại năm ấy giờ đủ dày một tập.' : `Lần trước ${x.me} đã coi như không thấy.`,
    ],
    choices: [
      { t: 'Hẹn gặp cả hai, nói chuyện ba người', do: (fx, x) => (fx.flag('vh_cai'), fx.stat('noi', 6), lv(fx, x, -6)), note: (x) => `Người kia là ${x.c.gender === 'f' ? 'một cô nhân viên mới' : 'một anh đồng nghiệp cũ'}. ${sp(x)} ngồi giữa, không dám ngẩng mặt.` },
      { t: (x) => (x.year >= 2012 ? 'Đăng hết lên mạng, cho thiên hạ phán xử' : 'Kéo đến tận nơi làm, nói cho cả cơ quan biết'), do: (fx, x) => (fx.flag('vh_tach'), fx.stat('noi', 10), fx.stat('tam', -6), lv(fx, x, -18), x.s.kids > 0 ? fx.rel('con', -6) : undefined), sys: () => sys('Bài đăng lên xu hướng. Bản Hệ Thống khuyên ký chủ tắt điện thoại đi ngủ.') },
      { t: 'Không trả lời. Chặn. Đêm ấy khóc một mình', do: (fx, x) => (fx.flag('vh_ganh'), fx.stat('tam', -12), lv(fx, x, -4)) },
    ],
  },

  /* ----- chặng 3: ngã ba đường ----- */
  ...(['cobac', 'ruou', 'traigai'] as Vice[]).map(
    (k): Drama => ({
      id: `v3_${k}`,
      pool: 'cuoi',
      callback: true,
      if: (x) => vk(x, k) && x.has(`dr_v2_${k}`),
      title: 'Ngã ba đường',
      bg: () => ({ place: 'nha', time: 'dusk' }),
      who,
      text: (x) => {
        // người ấy có thay đổi thật không: được đưa đi cai, còn thương nhau, và không bị bỏ mặc từ đầu
        const doi = changed(x);
        const what = k === 'cobac' ? 'cờ bạc' : k === 'ruou' ? 'rượu' : 'người kia';
        return [
          doi
            ? `Đã hai năm ${sp(x)} ${k === 'traigai' ? 'không liên lạc với' : 'không đụng đến'} ${what}. Tối nào cũng về ăn cơm đúng bảy giờ${x.s.kids ? ', kèm con học bài' : ''}. Nhưng ${x.me} vẫn giật mình mỗi khi điện thoại ${sp(x)} sáng lên.`
            : `Lại thêm một lần nữa. ${k === 'cobac' ? `Lần này là sổ đỏ ${x.year < 2005 ? 'mảnh đất của ' + x.bm : 'căn nhà'} đem đi cắm.` : k === 'ruou' ? 'Lần này là trận cãi nhau to nhất, đồ đạc vỡ tung tóe.' : 'Lần này người kia có bầu.'}`,
          `${x.year < 2000 ? 'Cả họ' : x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} bảo: "Đàn ${x.lg === 'm' ? 'ông' : 'bà'} ai chẳng có lúc sai, nhịn đi con." Bạn thân thì bảo: "Đi đi, đời còn dài."`,
        ];
      },
      choices: [
        {
          t: (x) => (changed(x) ? 'Tin thêm một lần, bắt đầu lại từ đầu' : 'Cho một cơ hội cuối cùng'),
          do: (fx, x) => {
            if (changed(x)) {
              fx.flag('vice_het');
              lv(fx, x, 14);
              fx.loveEnd(pid(x) ? `quaydau_${pid(x)}` : 'quaydau');
              fx.say(`${sp(x)} khóc như đứa trẻ. Từ năm ấy, nhà mình yên thật.`);
            } else {
              fx.stat('tien', -15);
              fx.stat('tam', -10);
              fx.loveEnd(pid(x) ? `chiudung_${pid(x)}` : 'chiudung');
              fx.say('Cơ hội cuối cùng thành cơ hội thứ mười. Rồi thôi không đếm nữa.');
            }
          },
        },
        {
          t: 'Ly hôn, tự mình đứng dậy',
          do: (fx, x) => {
            fx.loveEnd(pid(x) ? `lyhon_${pid(x)}` : 'lyhon');
            fx.divorce();
            fx.mid(k);
            fx.stat('noi', 8);
            fx.stat('tam', 4);
            fx.stat('tien', -8);
            if (x.s.kids) fx.rel('con', 6);
            fx.say(`Ký đơn xong, ${x.me} ra quán ${x.year < 2005 ? 'chè' : 'cà phê'} đầu phố, gọi một cốc, ngồi một mình. Lần đầu sau nhiều năm thấy nhẹ người.`);
          },
          sys: () => sys('Bản Hệ Thống không chấm điểm câu này. Chỉ muốn nói: ký chủ giỏi lắm.'),
        },
        {
          t: (x) => (x.s.kids ? 'Sống tiếp vì con, mỗi người một phòng' : 'Sống tiếp cho êm cửa êm nhà'),
          do: (fx, x) => {
            fx.flag('vice_het');
            fx.loveEnd(pid(x) ? `chiudung_${pid(x)}` : 'chiudung');
            fx.stat('tam', -14);
            fx.stat('khoe', -6);
            if (x.s.kids) fx.rel('con', 4);
            fx.say('Ngoài kia ai cũng khen nhà mình êm. Chỉ mình biết cái êm ấy giá bao nhiêu.');
          },
        },
      ],
    }),
  ),
];
/** sau chặng 2, người ấy có thay đổi thật không */
const changed = (x: Ctx) => x.has('vh_cai') || (x.has('vh_tra') && !x.has('vh_bo')) || (x.has('vh_noi') && !x.has('vh_ganh') && (!pid(x) || x.s.love[pid(x)!] >= 40));

/* =========================================================
   THỜI CUỘC: sự kiện có thật chạm vào chuyện tình. Mỗi sự kiện đổi theo hoàn cảnh (một mình, đang yêu, đã cưới),
   để lại cờ, và nhiều năm sau còn quay lại (đám cưới, kỷ niệm, cuối đời).
   ========================================================= */
/** người đang thương nhất: vợ chồng, người yêu, không thì người thân nhất chưa rời đi */
const near = (x: Ctx): LoveId | null => {
  if (pid(x)) return pid(x);
  const ids = x.s.met.filter((id) => !x.has(`${id}_out`)).sort((a, b) => x.s.love[b] - x.s.love[a]);
  return ids[0] && x.s.love[ids[0]] >= 25 ? ids[0] : null;
};
const nm = (x: Ctx) => (x.s.married ? sp(x) : near(x) ? x.L(near(x)!) : '');
const regionOfX = (x: Ctx) => {
  const S = ['TP. Hồ Chí Minh', 'Cần Thơ', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang', 'Lâm Đồng'];
  const C = ['Đà Nẵng', 'Huế', 'Quảng Trị', 'Quảng Ngãi', 'Khánh Hòa', 'Gia Lai', 'Đắk Lắk', 'Nghệ An', 'Hà Tĩnh', 'Thanh Hóa'];
  return S.includes(x.f.province) ? 'nam' : C.includes(x.f.province) ? 'trung' : 'bac';
};
const loveNear = (fx: Fx, x: Ctx, d: number) => (x.s.married ? lv(fx, x, d) : near(x) ? fx.love(near(x)!, d) : fx.stat('tam', Math.round(d / 2)));
const mark = (fx: Fx, x: Ctx, k: string) => {
  fx.flag(`h_${k}`);
  const n = x.s.married ? pid(x) ?? 'vc' : near(x);
  if (n) fx.flag(`h_${k}_${n}`);
};

export const HIST: Drama[] = [
  {
    id: 'h_2000',
    pool: 'any',
    callback: true,
    from: 1999,
    to: 2000,
    minAge: 16,
    maxAge: 40,
    title: 'Giao thừa thiên niên kỷ',
    bg: () => ({ place: 'pho', time: 'night', tet: true }),
    who: (x) => near(x),
    text: (x) => [
      'Đêm 31 tháng 12 năm 1999. Báo đài nói mãi về "sự cố Y2K", máy tính cả thế giới có thể loạn. Cả phố vẫn đổ ra đường đếm ngược sang năm 2000.',
      nm(x) ? `${nm(x)} đứng cạnh ${x.me} giữa đám đông, tay lạnh cóng.` : `${x.me} đứng một mình giữa đám đông, ai cũng có đôi.`,
    ],
    choices: [
      { t: 'Đếm ngược xong thì nắm tay người bên cạnh', if: (x) => !!nm(x), do: (fx, x) => (loveNear(fx, x, 12), mark(fx, x, '2000')), note: () => '🦋 Năm 2000 bắt đầu bằng một cái nắm tay. Cái nắm tay này sẽ còn được nhắc lại.' },
      { t: 'Ước một điều thật to khi pháo hoa nổ', do: (fx) => (fx.stat('dao', 6), fx.stat('tam', 4)) },
      { t: 'Hỏi người lạ đứng cạnh: "Bạn ước gì?"', if: (x) => !nm(x), do: (fx) => (fx.meet('duy'), fx.flag('pool_duy'), fx.love('duy', 12), fx.flag('h_2000_duy')), note: () => 'Người lạ ấy cười: "Ước gặp lại bạn năm sau." Rồi lẫn vào đám đông.' },
    ],
  },
  {
    id: 'h_sars',
    pool: 'any',
    callback: true,
    from: 2003,
    to: 2003,
    minAge: 18,
    maxAge: 60,
    title: 'Mùa SARS',
    bg: () => ({ place: 'pho', time: 'day' }),
    who: (x) => (x.s.met.includes('phong') ? 'phong' : near(x)),
    text: (x) =>
      x.s.met.includes('phong') && !x.has('phong_out')
        ? [`Dịch SARS bùng ở Hà Nội. Bệnh viện nơi ${x.L('phong')} làm bị phong tỏa, nhân viên ở lại trong viện không về.`, `${x.L('phong')} gọi ra từ phòng trực: "Đừng lo. Chỉ là... nhớ thôi."`]
        : ['Dịch SARS bùng ở Hà Nội. Cả nước đeo khẩu trang, ai ho một tiếng là cả xe buýt quay lại nhìn.', nm(x) ? `${nm(x)} mua cho ${x.me} một hộp khẩu trang, dặn đi dặn lại.` : 'Đường vắng hẳn.'],
    choices: [
      { t: 'Ngày nào cũng gửi cơm vào viện, viết giấy dán trên nắp hộp', if: (x) => x.s.met.includes('phong') && !x.has('phong_out'), do: (fx) => (fx.love('phong', 16), fx.flag('h_sars_phong')), note: () => '🦋 Những mảnh giấy dán nắp hộp cơm, người ấy giữ hết.' },
      { t: 'Ở yên trong nhà, gọi điện mỗi tối', do: (fx, x) => (loveNear(fx, x, 6), fx.stat('khoe', 3)) },
      { t: 'Đi tình nguyện phát khẩu trang ở bến xe', do: (fx) => (fx.stat('tinh', 6), fx.stat('dao', 3)) },
    ],
  },
  {
    id: 'h_2008',
    pool: 'any',
    callback: true,
    from: 2008,
    to: 2009,
    minAge: 21,
    maxAge: 58,
    title: 'Khủng hoảng 2008',
    bg: () => ({ place: 'pho', time: 'day' }),
    who: (x) => near(x),
    text: (x) => [
      'Lạm phát hơn hai mươi phần trăm, chứng khoán rơi từ đỉnh xuống đáy. Công ty cắt giảm một nửa nhân sự.',
      `Sáng thứ hai, ${x.me} nhận phong bì: nghỉ việc từ cuối tháng.${nm(x) ? ` Tối ấy về, ${nm(x)} không hỏi gì, chỉ nấu một nồi canh chua.` : ''}`,
    ],
    choices: [
      { t: (x) => (nm(x) ? `Kể hết với ${nm(x)}, cùng nhau tính` : 'Tự xoay xở, không kể ai'), do: (fx, x) => (fx.stat('tien', -10), nm(x) ? (loveNear(fx, x, 12), mark(fx, x, '2008')) : fx.stat('noi', 4)), note: (x) => (nm(x) ? '🦋 Năm khó nhất, hai người ăn mì tôm cả tháng mà vẫn cười. Sau này hay kể lại.' : '') },
      { t: 'Ra chợ bán hàng, làm lại từ đầu', do: (fx) => (fx.stat('tien', -4), fx.stat('noi', 6), fx.flag('h_2008_lam')), note: () => '🦋 Sạp hàng nhỏ ấy về sau thành một cửa hàng.' },
      { t: 'Giấu nhà, sáng vẫn đi như đi làm', do: (fx, x) => (fx.stat('tien', -12), fx.stat('tam', -8), loveNear(fx, x, -6)), note: () => 'Ba tháng ngồi quán trà đá cả ngày. Rồi cũng bị phát hiện.' },
    ],
  },
  {
    id: 'h_bao',
    pool: 'any',
    callback: true,
    from: 2008,
    to: 2018,
    minAge: 15,
    maxAge: 50,
    if: (x) => (x.year === 2008 || x.year === 2018) && !x.has('ev_dibao') && !x.has('ly_dibao'),
    title: (x) => `Đêm đi bão AFF Cup ${x.year}`,
    bg: () => ({ place: 'pho', time: 'night' }),
    who: (x) => near(x),
    text: (x) => [
      x.year === 2008 ? 'Công Vinh đánh đầu ở phút cuối. Việt Nam vô địch AFF Cup sau 12 năm chờ đợi.' : 'Anh Đức ghi bàn. Việt Nam vô địch AFF Cup sau mười năm.',
      `Cả nước đổ ra đường, cờ đỏ sao vàng kín phố, tiếng còi xe đến ba giờ sáng.${nm(x) ? ` ${nm(x)} đội mũ, cầm cờ, đứng đợi ở cổng.` : ''}`,
    ],
    choices: [
      { t: (x) => (nm(x) ? `Ngồi sau xe ${nm(x)}, hò hét đến khản giọng` : 'Lao ra đường, đi bão một mình'), do: (fx, x) => (loveNear(fx, x, 12), mark(fx, x, 'bao'), fx.stat('noi', 4)), note: (x) => (nm(x) ? '🦋 Lá cờ hôm ấy được cất vào tủ. Nhiều năm sau còn lôi ra.' : '') },
      { t: 'Đứng ở ban công nhìn xuống, mỉm cười', do: (fx) => fx.stat('tam', 5) },
      { t: (x) => `Kẹt giữa dòng người, quen một người đi cùng hướng`, if: (x) => !x.s.married, do: (fx) => (fx.meet('bao'), fx.flag('pool_bao'), fx.love('bao', 12), fx.flag('h_bao_bao')), note: () => 'Người ấy hét vào tai: "Số mấy? Mai đi cà phê ăn mừng!"' },
    ],
  },
  {
    id: 'h_dat',
    pool: 'any',
    callback: true,
    from: 2017,
    to: 2021,
    minAge: 25,
    maxAge: 60,
    if: (x) => x.year === 2018 || x.year === 2021,
    title: 'Cơn sốt đất nền',
    bg: () => ({ place: 'pho', time: 'day' }),
    who: (x) => near(x),
    text: (x) => [
      `Cả xóm bàn chuyện đất nền. Mảnh đất ruộng ngoại thành sáng mua chiều bán đã lãi cả trăm triệu. Môi giới gọi điện cho ${x.me} ngày ba lần.`,
      nm(x) ? `${nm(x)} hỏi: "Hay mình vay thêm, mua một lô?"` : 'Bạn thân rủ góp chung.',
    ],
    choices: [
      { t: (x) => `Vay ngân hàng, xuống tiền một lô (${fmtVND(unitOf(x.year, x.age) * 15)})`, do: (fx, x) => (fx.flag('h_dat_mua'), fx.cash(-unitOf(x.year, x.age) * 15), loveNear(fx, x, 4)), note: () => '🦋 Lô đất này còn quay lại.' },
      { t: 'Thôi, tiền ít thì gửi tiết kiệm', do: (fx) => (fx.stat('tien', 3), fx.stat('hoc', 3)) },
      { t: 'Cãi nhau một trận vì chuyện đất', if: (x) => !!nm(x), do: (fx, x) => (loveNear(fx, x, -8), fx.stat('noi', 3)) },
    ],
  },
  {
    id: 'h_datbang',
    pool: 'any',
    callback: true,
    from: 2022,
    to: 2025,
    if: (x) => x.has('h_dat_mua'),
    title: 'Đất đóng băng',
    bg: () => ({ place: 'nha', time: 'night' }),
    who: (x) => near(x),
    text: (x) => [`Thị trường đóng băng, lô đất mua năm ấy không ai hỏi. Lãi ngân hàng thì tháng nào cũng đến. ${nm(x) ? `${nm(x)} ngồi tính sổ đến khuya.` : ''}`],
    choices: [
      { t: 'Bán cắt lỗ, trả hết nợ, nhẹ người', do: (fx, x) => (fx.cash(unitOf(x.year, x.age) * 9), fx.stat('tam', 6), loveNear(fx, x, 6)), note: () => 'Bán được hơn nửa giá mua. Mất một khoản, nhưng ngủ được.' },
      { t: 'Gồng thêm, tin là đất sẽ lên', do: (fx, x) => (x.year >= 2024 ? (fx.cash(unitOf(x.year, x.age) * 22), fx.say('Hai năm sau giá hồi lại, bán lãi gấp rưỡi. Gồng được thì thắng.')) : (fx.cash(-unitOf(x.year, x.age) * 4), fx.stat('tam', -8), fx.say('Lãi ngân hàng cứ chạy, đất vẫn nằm im.'))) },
      { t: 'Đổ lỗi cho nhau', if: (x) => !!nm(x), do: (fx, x) => (loveNear(fx, x, -14), fx.stat('tam', -6)) },
    ],
  },
  {
    id: 'h_covid',
    pool: 'any',
    callback: true,
    from: 2020,
    to: 2021,
    minAge: 16,
    maxAge: 75,
    title: (x) => (x.year === 2021 && regionOfX(x) === 'nam' ? 'Sài Gòn giãn cách' : 'Mùa COVID'),
    bg: () => ({ place: 'phong', time: 'day' }),
    who: (x) => (x.s.met.includes('kai') && !x.has('kai_out') && !x.s.married ? 'kai' : near(x)),
    text: (x) => {
      const lines = [x.year === 2021 && regionOfX(x) === 'nam' ? 'Thành phố giãn cách theo Chỉ thị 16. Đường không một bóng người, chỉ nghe còi xe cứu thương.' : 'Cả nước giãn cách xã hội. "Ai ở đâu ở yên đó."'];
      if (x.s.married) lines.push(`Ba tháng liền ${x.me} và ${sp(x)} ở chung hai mươi bốn tiếng một ngày${x.s.kids ? ', con học online, nhà lúc nào cũng ồn' : ''}.`);
      else if (x.s.met.includes('kai') && !x.has('kai_out')) lines.push(`Chuyến bay về nước của ${x.L('kai')} bị hủy. ${x.ay.charAt(0).toUpperCase() + x.ay.slice(1)} kẹt lại Việt Nam, không biết đến bao giờ.`);
      else if (nm(x)) lines.push(`${x.me} và ${nm(x)} kẹt ở hai quận, chỉ gặp nhau qua màn hình.`);
      else lines.push(`${x.me} ở một mình trong căn phòng trọ, ngày nào cũng nghe bản tin lúc sáu giờ.`);
      return lines;
    },
    choices: [
      { t: (x) => `Đón ${x.L('kai')} về ở tạm, nấu cho ăn món Việt mỗi ngày`, if: (x) => !x.s.married && x.s.met.includes('kai') && !x.has('kai_out'), do: (fx, x) => (fx.love('kai', 18), fx.flag('h_covid_kai'), fx.stat('tien', -4)), note: (x) => `🦋 ${x.L('kai')} bảo: "Không về được nước, nhưng tìm được nhà."` },
      { t: 'Ba tháng ở chung: học nấu ăn cùng nhau, tối nào cũng xem phim', if: (x) => x.s.married, do: (fx, x) => (lv(fx, x, x.s.stats.tam >= 45 ? 12 : -10), mark(fx, x, 'covid')), note: (x) => (x.s.stats.tam >= 45 ? '🦋 Hai người thân nhau hơn cả mười năm trước.' : 'Ở chung quá lâu, chuyện nhỏ thành chuyện to.') },
      { t: (x) => `Đêm nào cũng gọi video với ${nm(x)} đến lúc ngủ quên`, if: (x) => !x.s.married && !!nm(x), do: (fx, x) => (loveNear(fx, x, 10), mark(fx, x, 'covid')), note: () => '🦋 Hết giãn cách, lần đầu gặp lại, hai người ôm nhau giữa đường.' },
      { t: 'Đăng ký đi tình nguyện ở khu cách ly', do: (fx, x) => (fx.stat('tinh', 8), fx.stat('khoe', -4), x.s.met.includes('phong') || x.s.married ? undefined : (fx.meet('phong'), fx.flag('pool_phong'), fx.love('phong', 12))), note: (x) => (x.s.married || x.s.met.includes('phong') ? 'Bộ đồ bảo hộ nóng như lò, mà lòng thì nhẹ.' : `Trong khu cách ly có một bác sĩ trẻ, mắt thâm quầng, cứ cảm ơn ${x.me} mãi.`) },
      { t: 'Ở nhà, trồng rau ban công, tự cắt tóc', do: (fx) => (fx.stat('tam', 4), fx.stat('khoe', 2)) },
    ],
  },
  {
    id: 'h_lu',
    pool: 'any',
    callback: true,
    from: 2020,
    to: 2024,
    minAge: 16,
    maxAge: 75,
    if: (x) => (x.year === 2020 && regionOfX(x) === 'trung') || (x.year === 2024 && regionOfX(x) === 'bac'),
    title: (x) => (x.year === 2020 ? 'Lũ lịch sử miền Trung' : 'Bão Yagi'),
    bg: () => ({ place: 'nha', time: 'night' }),
    who: (x) => near(x),
    text: (x) => [
      x.year === 2020 ? 'Tháng mười, lũ chồng lũ. Nước lên đến mái nhà, cả xóm trèo lên nóc chờ ca nô.' : 'Bão Yagi quật đổ cây cả thành phố, mất điện ba ngày, nước sông dâng tràn bãi.',
      nm(x) ? `Điện thoại còn hai phần trăm pin. Tin nhắn cuối cùng của ${nm(x)}: "Đợi đấy, đang tới."` : 'Điện thoại còn hai phần trăm pin.',
    ],
    choices: [
      { t: (x) => (nm(x) ? `Đợi ${nm(x)}` : 'Đợi đội cứu hộ'), do: (fx, x) => (nm(x) ? (loveNear(fx, x, 14), mark(fx, x, 'lu')) : fx.stat('tam', -2)), note: (x) => (nm(x) ? `🦋 Gần sáng, ${nm(x)} chèo một chiếc thuyền thúng đến, người ướt sũng, cười toe.` : '') },
      { t: 'Lội ra giúp nhà hàng xóm chuyển đồ lên cao', do: (fx) => (fx.stat('tinh', 6), fx.stat('khoe', -3)) },
      { t: 'Sau lũ, đi cùng đoàn cứu trợ vào vùng sâu', do: (fx, x) => (fx.stat('tinh', 8), x.s.married ? undefined : (fx.meet('duy'), fx.flag('pool_duy'), fx.love('duy', 10))), note: (x) => (x.s.married ? '' : 'Trong đoàn có một người cầm máy ảnh phim, chụp toàn những khoảnh khắc người ta cười.') },
    ],
  },
];

/** Thời cuộc ở tuổi này (nếu có): dựng thành một cảnh chen trước cảnh `next` */
export function histAt(age: number, x: Ctx, next: string): Scene | null {
  const d = HIST.find((h) => fits(h, x));
  if (!d) return null;
  return {
    id: `hs@${age}`,
    age,
    chapter: age < 20 ? 'Tuổi teen' : age < 30 ? 'Tuổi trẻ' : age < 60 ? 'Lập gia đình' : 'Tuổi già',
    title: d.title,
    bg: d.bg,
    who: d.who,
    text: d.text,
    choices: d.choices.map((c) => ({ ...c, do: (fx, cx) => (fx.flag(`dr_${d.id}`), c.do?.(fx, cx)) })),
    next,
  };
}

/** Những dấu thời cuộc đã chạm vào đời này (cho trang cuối đời) */
export function historyOf(s: { flags: string[] }): string[] {
  const has = (f: string) => s.flags.includes(f);
  const out: string[] = [];
  if (has('h_2000')) out.push('Giao thừa năm 2000, nắm tay một người giữa đám đông.');
  if (has('h_sars_phong')) out.push('Mùa SARS 2003, những hộp cơm gửi vào bệnh viện bị phong tỏa.');
  if (has('dr_h_2008')) out.push(has('h_2008') ? 'Khủng hoảng 2008, mất việc, nhưng có người ở bên.' : 'Khủng hoảng 2008, mất việc và tự đứng dậy.');
  if (has('h_bao')) out.push('Đêm đi bão AFF Cup, cờ đỏ kín phố.');
  if (has('h_dat_mua')) out.push('Cơn sốt đất nền, một lô đất và một khoản nợ.');
  if (has('dr_h_covid')) out.push(has('h_covid_kai') ? 'Mùa COVID, một người kẹt lại Việt Nam và tìm được nhà.' : 'Mùa COVID, những ngày giãn cách.');
  if (has('h_lu')) out.push('Mùa bão lũ, một người chèo thuyền đến trong đêm.');
  return out;
}

/* =========================================================
   TIỀN BẠC: tài sản có thể mất, nợ có thể chồng chất, đến mức phá sản.
   ========================================================= */
const U = (x: Ctx) => unitOf(x.year, x.age);
/** số ngẫu nhiên cố định theo đời và lượt chơi (quay lại vẫn ra cùng kết quả) */
const roll = (x: Ctx, salt: number) => (hash(`${x.s.seed ?? 0}|${x.s.path.length}|${salt}`) % 1000) / 1000;
const cashNow = (x: Ctx) => x.s.cash ?? 0;
const tien = (v: number) => fmtVND(Math.abs(v));
const MONEY: Drama[] = [
  {
    id: 'm_hui',
    pool: 'any',
    minAge: 24,
    maxAge: 70,
    to: 2015,
    if: (x) => cashNow(x) > U(x) * 5 && !x.has('ev_vohui'),
    title: 'Vỡ hụi',
    bg: () => ({ place: 'ngo', time: 'dusk' }),
    who: () => 'mom',
    text: (x) => [`Chơi hụi với bà Năm đầu ngõ đã ba năm, tháng nào cũng góp đều. Sáng nay cả xóm kéo đến: bà Năm ôm tiền bỏ trốn trong đêm. Phần của ${x.me} là ${tien(cashNow(x) * 0.4)}.`],
    choices: [
      { t: 'Cùng cả xóm làm đơn lên phường', do: (fx, x) => (fx.lose(0.3), fx.stat('noi', 4), fx.say(`Một năm sau đòi lại được chút ít. Phần lớn coi như mất.`)) },
      { t: 'Thôi, của đi thay người', do: (fx) => (fx.lose(0.4), fx.stat('tam', -4), fx.stat('tinh', 3)) },
      { t: 'Tự đi tìm bà Năm', do: (fx, x) => (roll(x, 3) < 0.35 ? (fx.lose(0.1), fx.say('Tìm được bà ở nhà người em dưới quê. Đòi về được gần hết.')) : (fx.lose(0.4), fx.stat('khoe', -3), fx.say('Đi ba tỉnh, không thấy bóng.'))) },
    ],
  },
  {
    id: 'm_dacap',
    pool: 'any',
    minAge: 24,
    maxAge: 65,
    from: 2006,
    if: (x) => cashNow(x) > U(x) * 6,
    title: (x) => (x.year < 2017 ? 'Hội thảo đa cấp' : 'Dự án đầu tư lãi 5% mỗi tháng'),
    bg: () => ({ place: 'quan', time: 'night' }),
    who: (x) => near(x),
    text: (x) => [
      x.year < 2017
        ? `Người bạn cũ rủ đi "hội thảo cơ hội kinh doanh". Diễn giả mặc vest, lên xe sang, hứa ba năm có nhà.`
        : `Nhóm Chat "Cộng đồng tự do tài chính" khoe ảnh lãi mỗi ngày. Người quen nhắn: "Bỏ ${tien(cashNow(x) * 0.6)} vào, tháng sau lãi đủ đi du lịch."`,
    ],
    choices: [
      { t: 'Bỏ tiền vào, một lần cho đổi đời', do: (fx, x) => { const v = cashNow(x) * 0.6; fx.lose(0.6); fx.flag('m_luadao'); loveNear(fx, x, -6); fx.say(`Ba tháng đầu lãi đều. Tháng thứ tư, ${x.year < 2017 ? 'công ty đóng cửa, diễn giả biến mất' : 'sàn đóng, nhóm Chat giải tán'}. Mất ${tien(v)}.`); }, sys: () => 'Đinh! Bản Hệ Thống đã cố nháy mắt cảnh báo. Ký chủ không nhìn.' },
      { t: 'Hỏi thêm người hiểu biết rồi từ chối', do: (fx) => (fx.stat('hoc', 4), fx.stat('tam', 2)), note: () => 'Một năm sau, báo đưa tin cả đường dây bị bắt.' },
      { t: 'Bỏ một ít cho biết', do: (fx) => (fx.lose(0.15), fx.stat('hoc', 2)) },
    ],
  },
  {
    id: 'm_baolanh',
    pool: 'any',
    minAge: 25,
    maxAge: 65,
    title: 'Ký bảo lãnh',
    bg: () => ({ place: 'nha', time: 'night' }),
    who: (x) => near(x),
    text: (x) => [`${x.s.bestie} đến nhà lúc nửa đêm, mắt đỏ hoe: cần vay ngân hàng ${tien(U(x) * 25)} để cứu cửa hàng, chỉ cần ${x.me} ký bảo lãnh. "Tháng nào tớ cũng trả đều, cậu không phải lo."`],
    choices: [
      { t: 'Ký, bạn thân thì phải giúp', do: (fx, x) => (fx.rel('banthan', 10), roll(x, 7) < 0.5 ? (fx.cash(-U(x) * 25), fx.rel('banthan', -40), fx.say(`Nửa năm sau ${x.s.bestie} cắt liên lạc. Ngân hàng gửi giấy đòi nợ về nhà ${x.me}.`)) : fx.say(`${x.s.bestie} trả đủ từng tháng. Tết năm sau mang sang một giỏ quà to.`)) },
      { t: 'Cho vay một ít tiền mặt thay vì ký', do: (fx, x) => (fx.cash(-U(x) * 4), fx.rel('banthan', 4)) },
      { t: 'Từ chối, dù mất lòng', do: (fx) => (fx.rel('banthan', -12), fx.stat('noi', 3)) },
    ],
  },
  {
    id: 'm_benh',
    pool: 'any',
    minAge: 28,
    maxAge: 75,
    title: 'Viện phí',
    bg: () => ({ place: 'pho', time: 'night' }),
    who: (x) => (x.s.married ? who(x) : 'mom'),
    text: (x) => [
      `${x.s.married ? sp(x) : x.bm === 'ông bà' ? 'Bà' : 'Bố'} nhập viện cấp cứu, phải mổ gấp. ${x.year >= 2010 ? 'Bảo hiểm chỉ chi một phần.' : 'Hồi ấy chưa ai có bảo hiểm.'} Viện phí và thuốc men khoảng ${tien(U(x) * 18)}.`,
      cashNow(x) < U(x) * 18 ? `Trong tài khoản không đủ.` : 'Tiền tiết kiệm bao năm, giờ dồn hết vào đây.',
    ],
    choices: [
      { t: 'Lo bằng mọi giá, vay thêm nếu thiếu', do: (fx, x) => (fx.cash(-U(x) * 18), x.s.married ? lv(fx, x, 14) : fx.rel('bome', 14), fx.stat('khoe', -3)), note: () => 'Ca mổ thành công. Sổ tiết kiệm thì trống trơn.' },
      { t: (x) => (x.year >= 2015 ? 'Kêu gọi quyên góp trên mạng' : 'Đi vay khắp họ hàng'), do: (fx, x) => (fx.cash(-U(x) * 9), fx.stat('tam', -4)) },
      { t: 'Chuyển về viện tuyến dưới cho đỡ tốn', do: (fx, x) => (fx.cash(-U(x) * 6), x.s.married ? lv(fx, x, -8) : fx.rel('bome', -6)) },
    ],
  },
  {
    id: 'm_thua',
    pool: 'any',
    minAge: 27,
    maxAge: 62,
    if: (x) => x.has('ac_quan') || x.has('h_2008_lam') || x.s.stats.tien >= 55,
    title: 'Làm ăn thua lỗ',
    bg: () => ({ place: 'quan', time: 'day' }),
    who: (x) => near(x),
    text: (x) => [`${x.has('ac_quan') ? 'Quán' : 'Cửa hàng'} của ${x.me} ế ba tháng liền. ${x.year >= 2020 ? 'Tiền mặt bằng tăng gấp rưỡi, khách thì chuyển hết sang đặt hàng online.' : 'Phố bên mở thêm năm hàng giống hệt.'} Mỗi tháng lỗ ${tien(U(x) * 2)}.`],
    choices: [
      { t: 'Vay thêm, gồng tiếp một năm', do: (fx, x) => (roll(x, 11) < 0.4 ? (fx.cash(U(x) * 10), fx.say('Năm sau khách quay lại. Gồng được thì thắng.')) : (fx.cash(-U(x) * 24), fx.stat('tam', -8), fx.say('Gồng thêm một năm, lỗ gấp đôi.'))) },
      { t: 'Cắt lỗ, sang nhượng ngay', do: (fx, x) => (fx.cash(-U(x) * 6), fx.stat('hoc', 3)) },
      { t: 'Đổi cách làm: bán online, livestream', if: (x) => x.year >= 2016, do: (fx, x) => (fx.cash(x.s.stats.duyen >= 50 ? U(x) * 8 : -U(x) * 4), fx.stat('noi', 4)) },
    ],
  },
  {
    id: 'm_trom',
    pool: 'any',
    minAge: 23,
    maxAge: 80,
    if: (x) => cashNow(x) > U(x) * 3,
    title: (x) => (x.year < 2010 ? 'Trộm vào nhà' : 'Cuộc gọi giả công an'),
    bg: () => ({ place: 'nha', time: 'night' }),
    who: () => null,
    text: (x) => [
      x.year < 2010
        ? `Đêm mưa, trộm cạy cửa sổ, lấy sạch tiền và vàng cất trong tủ. Sáng ra chỉ còn cái khóa bị bẻ.`
        : `Một số lạ tự xưng công an, đọc đúng tên, số căn cước: "Tài khoản của ${x.c.gender === 'f' ? 'chị' : 'anh'} liên quan đường dây rửa tiền, chuyển hết sang tài khoản tạm giữ để xác minh."`,
    ],
    choices: [
      { t: (x) => (x.year < 2010 ? 'Báo công an, lắp thêm khóa' : 'Làm theo vì sợ'), do: (fx, x) => (x.year < 2010 ? fx.lose(0.25) : fx.lose(0.7), fx.stat('tam', -6)) },
      { t: (x) => (x.year < 2010 ? 'Từ nay gửi tiền ngân hàng' : 'Cúp máy, gọi lên đúng số tổng đài công an'), do: (fx, x) => (x.year < 2010 ? (fx.lose(0.25), fx.stat('hoc', 3)) : (fx.stat('hoc', 4), fx.say('Là lừa đảo. Giữ được hết tiền.'))) },
    ],
  },
];

/** Phá sản: nợ quá sức (chừng hơn 8 năm để dành) thì đời rẽ một ngã khác */
export function bankruptAt(age: number, x: Ctx, next: string): Scene | null {
  const debt = -(x.s.cash ?? 0);
  if (age < 22 || debt < U(x) * 60 || x.has(`ps_${Math.floor(age / 10)}`)) return null;
  const parents = x.f.parents !== 'Không còn bố mẹ' && age < 55;
  return {
    id: `ps@${age}`,
    age,
    chapter: age < 30 ? 'Tuổi trẻ' : age < 60 ? 'Lập gia đình' : 'Tuổi già',
    title: 'Trắng tay',
    bg: () => ({ place: 'nha', time: 'night' }),
    who: (cx) => (cx.s.married ? who(cx) : null),
    text: (cx) => [
      `Nợ đã lên ${tien(debt)}. Lãi mẹ đẻ lãi con, ${cx.year >= 2016 ? 'điện thoại réo cả ngày, có số còn nhắn cho cả bạn bè trong danh bạ' : 'chủ nợ đến tận cổng mỗi tối'}.`,
      cx.s.married ? `${sp(cx)} ngồi đối diện, không nói gì, tay xoay mãi chiếc nhẫn cưới.` : 'Căn phòng trọ tối om, chỉ còn tiếng quạt.',
    ],
    choices: [
      {
        t: 'Bán hết, trả nợ, thuê trọ làm lại từ đầu',
        do: (fx, cx) => {
          fx.flag(`ps_${Math.floor(age / 10)}`);
          fx.flag('phasan');
          fx.clearDebt();
          fx.stat('tien', -30);
          fx.stat('tam', -10);
          fx.stat('noi', 6);
          if (cx.s.married) lv(fx, cx, low(cx, 50) ? -12 : 10);
          fx.say(cx.s.married && !low(cx, 50) ? `${sp(cx)} bảo: "Mất nhà thì thuê nhà. Còn hai đứa mình là còn tất cả."` : 'Ngày dọn ra khỏi nhà, hàng xóm đứng xem. Ngẩng mặt mà đi.');
        },
        sys: () => 'Đinh! Tài sản về 0. Nhưng Bản Hệ Thống thấy ký chủ vẫn còn nguyên khí phách.',
      },
      {
        t: (cx) => `Về nhờ ${cx.bm}, bán mảnh đất hương hỏa`,
        if: () => parents,
        do: (fx) => (fx.flag(`ps_${Math.floor(age / 10)}`), fx.flag('phasan'), fx.clearDebt(), fx.rel('bome', -10), fx.stat('tinh', 6), fx.stat('tam', -6)),
        note: (cx) => `${cx.bm === 'ông bà' ? 'Bà' : 'Bố'} chỉ nói một câu: "Còn người là còn của." Câu ấy nhớ cả đời.`,
      },
      {
        t: 'Bỏ trốn đi tỉnh khác, cắt hết liên lạc',
        do: (fx, cx) => {
          fx.flag(`ps_${Math.floor(age / 10)}`);
          fx.flag('trono');
          fx.clearDebt();
          fx.stat('tien', -40);
          fx.stat('tam', -14);
          fx.rel('banthan', -20);
          fx.rel('bome', -15);
          if (cx.s.married) (fx.loveEnd(pid(cx) ? `lyhon_${pid(cx)}` : 'lyhon'), fx.divorce());
          fx.mid('phasan');
          fx.say('Một chiếc xe khách đêm, một cái tên mới, một cuộc đời làm lại ở nơi không ai quen.');
        },
      },
    ],
    next,
  };
}

const ALL: Drama[] = [...YEU, ...CUOI, ...VICE, ...HIST, ...MONEY, ...DON];
export const DRAMA_IDS = ALL.map((d) => d.id);

function hash(s: string) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b1);
  // trộn đều các bit để thứ tự xáo thật sự khác nhau giữa các đời
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

const poolOf = (x: Ctx): Pool => (x.s.married ? 'cuoi' : x.s.partner ? 'yeu' : 'don');
/** chuyện gắn với một giai đoạn hôn nhân: số năm sau cưới, có con hay chưa */
const ym = (x: Ctx) => (x.s.marriedAge == null ? 0 : x.age - x.s.marriedAge);
const STAGE: Record<string, (x: Ctx) => boolean> = {
  giuluong: (x) => ym(x) <= 3,
  oriengs: (x) => ym(x) <= 4,
  nuoicon: (x) => x.s.kids > 0 && x.age <= 45,
  muanha: (x) => !x.has('ev_chungcu') && x.age <= 45,
  muoinam: (x) => ym(x) >= 9 && ym(x) <= 12,
  dixa: (x) => x.age <= 50,
};
const fits = (d: Drama, x: Ctx) =>
  (d.pool === poolOf(x) || d.pool === 'any') &&
  (!STAGE[d.id] || STAGE[d.id](x)) &&
  // chuyện tiền bạc: khoảng một nửa số đời gặp, mỗi đời nhiều nhất hai lần
  (!d.id.startsWith('m_') || (((x.s.seed ?? 0) >> 4) % 2 === 0 && x.s.flags.filter((g) => g.startsWith('dr_m_')).length < 2)) &&
  !x.has(`dr_${d.id}`) &&
  x.year >= (d.from ?? 0) &&
  x.year <= (d.to ?? 9999) &&
  x.age >= (d.minAge ?? 0) &&
  x.age <= (d.maxAge ?? 200) &&
  (!d.if || d.if(x));

/** Drama của năm `age`: chuyện "nổ lại" ưu tiên trước, còn lại xáo theo từng đời. Không có thì bỏ qua */
export function dramaAt(age: number, x: Ctx, next: string): Scene {
  const chapter = age < 30 ? 'Tuổi trẻ' : age < 60 ? 'Lập gia đình' : 'Tuổi già';
  const seed = `${x.s.seed ?? 0}|${x.c.name}|${x.c.birthYear}|${x.f.province}`;
  const cands = ALL.filter((d) => fits(d, x)).sort((a, b) => Number(!!b.callback) - Number(!!a.callback) || hash(seed + a.id) - hash(seed + b.id));
  const d = cands[0];
  if (!d) return { id: `dr@${age}`, age, chapter, title: '', text: () => [], choices: [], next, skip: () => true };
  return {
    id: `dr@${age}`,
    age,
    chapter,
    title: d.title,
    bg: d.bg,
    who: d.who,
    text: d.text,
    kind: d.kind,
    msgs: d.msgs,
    timer: d.timer,
    timeout: d.timeout,
    post: d.post,
    call: d.call,
    choices: d.choices.map((c) => ({ ...c, do: (fx, cx) => (fx.flag(`dr_${d.id}`), c.do?.(fx, cx)) })),
    next,
  };
}
