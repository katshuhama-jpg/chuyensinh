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
import type { Choice, Ctx, Fx, LoveId, Scene } from './story';

type Pool = 'yeu' | 'cuoi' | 'don';
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
};

/* ---------- tiện ích ---------- */
const pid = (x: Ctx): LoveId | null => (x.s.partner && x.s.partner !== 'xemmat' ? x.s.partner : null);
const sp = (x: Ctx) => (pid(x) ? x.L(pid(x)!) : x.lg === 'm' ? 'chồng' : 'vợ');
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
    title: '"Chị ơi, em là người yêu của anh ấy"',
    bg: () => ({ place: 'phong', time: 'night' }),
    who,
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: x.lg === 'm' ? 'Chị ơi, em xin lỗi phải nhắn thế này.' : 'Anh ơi, em xin lỗi phải nhắn thế này.' },
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
      { t: 'Dọn về, giấu bố mẹ', do: (fx, x) => (lv(fx, x, 10), fx.stat('tien', 6), fx.flag('dr_songthu')), note: () => '🦋 Bí mật kiểu này thường không giữ được lâu.' },
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
      { t: 'Chia tay. Thấy dấu hiệu là đi', do: (fx, x) => (breakup(fx, x), fx.stat('tam', 10)), sys: 'Đinh! Ký chủ nhận ra cờ đỏ. Tâm lý +10.' },
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
    id: 'thachcuoi',
    pool: 'yeu',
    minAge: 24,
    if: (x) => !!pid(x) && x.s.love[pid(x)!] >= 55,
    title: 'Mâm quả bao nhiêu?',
    bg: () => ({ place: 'nha', time: 'day' }),
    who,
    text: (x) => [
      `Hai nhà gặp nhau bàn chuyện cưới. ${x.c.gender === 'f' ? 'Nhà mình' : `Nhà ${sp(x)}`} đưa ra yêu cầu: ${x.year < 2000 ? 'mười mâm quả, một đôi bông tai vàng' : x.year < 2015 ? 'hai mươi mâm quả, một cây vàng' : 'sính lễ trăm triệu, vàng cưới đủ bộ'}.`,
      `Không khí đặc quánh như cơm cháy.`,
    ],
    choices: [
      { t: 'Hai đứa tự góp tiền cho đủ', do: (fx, x) => (fx.stat('tien', -16), lv(fx, x, 10), fx.rel('bome', 4)), note: () => 'Đám hỏi đẹp như phim. Tháng sau thì hết sạch tiền.' },
      { t: 'Đứng ra xin bớt cho hai bên', do: (fx, x) => (x.s.stats.duyen >= 50 ? (lv(fx, x, 8), fx.say('Cả hai nhà cùng cười, chốt một nửa.')) : (lv(fx, x, -6), fx.rel('bome', -6), fx.say('Nói vụng, bên kia phật ý.'))) },
      { t: 'Thôi, không cưới nữa', do: (fx, x) => (breakup(fx, x), fx.mid('thachcuoi')) },
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
      { t: 'Theo vợ/chồng, con người ta cũng thế cả', do: (fx, x) => (fx.rel('con', -6), lv(fx, x, 4), fx.stat('tien', -8)) },
      { t: 'Hỏi con muốn gì', do: (fx, x) => (fx.rel('con', 15), fx.stat('tinh', 4)), note: () => 'Con bảo chỉ muốn được đi đá bóng với bố mẹ một buổi.' },
    ],
  },
  {
    id: 'muoinam',
    pool: 'cuoi',
    if: (x) => x.s.marriedAge !== null && x.age - x.s.marriedAge >= 8,
    title: 'Mười năm ngày cưới',
    bg: () => ({ place: 'quan', time: 'night' }),
    who,
    text: (x) => [`Mười năm ngày cưới. ${sp(x)} hỏi: "Còn nhớ chỗ mình hẹn hò lần đầu không?"`],
    choices: [
      { t: 'Gửi con cho ông bà, đi lại đúng chỗ cũ', do: (fx, x) => (lv(fx, x, 12), fx.stat('tam', 6)), note: () => 'Quán cũ đã đổi chủ, nhưng góc bàn vẫn còn.' },
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
          if (x.s.stats.tien >= 50) (fx.stat('tien', 15), fx.say('Một năm sau, quán đông kín khách.'));
          else (fx.stat('tien', -15), fx.say('Một năm sau, quán đóng cửa. Nhưng hai người vẫn nắm tay nhau.'));
        },
      },
      { t: 'Can: con còn nhỏ, nhà còn nợ', do: (fx, x) => (lv(fx, x, -6), fx.stat('tien', 4), fx.flag('dr_canhcan')) },
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
    text: (x) => [`${sp(x)} được cử đi ${x.year >= 2010 ? 'dự án ở nước ngoài' : 'công trình trên núi'} một năm, lương gấp ba. Nhà còn con nhỏ.`],
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
    text: (x) => [`${sp(x)} về sau một năm. Con nấp sau lưng ${x.me}, không chịu gọi. ${sp(x)} ngồi xuống đất, cười mà mắt đỏ.`],
    choices: [
      { t: 'Kể cho con nghe bố/mẹ đi xa vì ai', do: (fx, x) => (fx.rel('con', 10), lv(fx, x, 8)) },
      { t: 'Để con tự làm quen lại', do: (fx, x) => (fx.rel('con', 3), lv(fx, x, 2)) },
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
      { t: 'Làm cùng luôn', do: (fx, x) => (lv(fx, x, 12), fx.stat('noi', 8), fx.stat('tam', 6)), note: () => 'Con cái xấu hổ. Hai vợ chồng thì vui như hồi mới yêu.' },
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
    text: (x) => [`Hai mươi lăm năm. Con cái làm một bữa tiệc nhỏ ngoài vườn, chiếu lại ảnh cưới ngày xưa. ${sp(x)} hồi đó gầy nhom, ${x.me} thì để kiểu tóc không ai dám nhắc.`],
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
    msgs: () => [
      { me: false, t: 'Anh/em đang ở nước ngoài, có gói quà gửi về cho mình nè.' },
      { me: false, t: 'Hải quan giữ lại, mình chuyển giúp phí 15 triệu nha. Về anh/em trả gấp đôi.' },
    ],
    timer: 12,
    timeout: 1,
    text: (x) => [`Ba tháng nhắn tin với một người đẹp như tài tử, chưa bao giờ chịu gọi video.`],
    choices: [
      { t: 'Chuyển tiền, vì tin', do: (fx) => (fx.stat('tien', -20), fx.stat('tam', -10), fx.mid('luadao')), note: () => 'Tài khoản kia xóa nick ngay sau khi nhận tiền.' },
      { t: 'Đòi gọi video trước', do: (fx) => (fx.stat('hoc', 4), fx.stat('tam', 4)), note: () => 'Bên kia bảo "camera hỏng", rồi im luôn.' },
      { t: 'Chặn và báo cáo tài khoản', do: (fx) => fx.stat('tam', 6), sys: 'Đinh! Ký chủ tỉnh táo. Tâm lý +6.' },
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

const ALL: Drama[] = [...YEU, ...CUOI, ...DON];
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
const fits = (d: Drama, x: Ctx) =>
  d.pool === poolOf(x) &&
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
    choices: d.choices.map((c) => ({ ...c, do: (fx, cx) => (fx.flag(`dr_${d.id}`), c.do?.(fx, cx)) })),
    next,
  };
}
