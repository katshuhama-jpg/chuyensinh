/**
 * Kịch bản một đời: tuổi thơ, tuổi teen, tuổi trẻ, lập gia đình, tuổi già.
 * Cờ cắm từ bé bung ra nhiều năm sau. Bối cảnh đổi theo năm (đến hết 2026 là thật, sau đó giả định).
 */

import { defaultCharacter, type Gender, type Look } from './character';
import { CAST } from './cast';
import type { Bg } from '@/components/Backdrop';
import { activeOf, ctxOf, isOut, LOVE_IDS, LOVES, MAX_ACTIVE, MAX_LIFE, type Choice, type Ctx, type Fx, type LoveId, type Post, type Resolve, type Scene, type Story, type SwipeCard } from './story';
import { jobOf } from './profiles';
import { dramaAt } from './drama';
import { dateStep, spotChoice } from './dates';
import { newsOfLoves } from './lives';
import { lyScene } from './life';
import { xemmatName } from './names';
import { regionOf } from './names';
import { AREA_PEOPLE, away, tallyOf, type AreaKey } from './actions';
import { STARS, starNight, starScene } from './stars';
import type { Character, Family } from './character';
import { eraScene } from './eras';
import { routeScene } from './routes';
import { GIFT_CAT, GIFT_PREF, shelfOf } from './gifts';

const CH = { tho: 'Tuổi thơ', teen: 'Tuổi teen', tre: 'Tuổi trẻ', nha: 'Lập gia đình', gia: 'Tuổi già' };

/* ---------- bối cảnh theo năm ---------- */
const msgOf = (y: number) => (y < 2004 ? 'thư tay' : y < 2012 ? 'tin nhắn điện thoại' : y <= 2026 ? 'tin nhắn trên Chat' : 'tin nhắn qua trợ lý AI');
const playOf = (y: number) => (y < 2000 ? 'quán điện tử băng' : y < 2012 ? 'quán net' : y <= 2026 ? 'quán game' : 'phòng game thực tế ảo');
const spotOf = (y: number) => (y < 1995 ? 'bờ hồ, ăn kem que' : y < 2010 ? 'quán cà phê cóc' : y <= 2026 ? 'quán trà sữa' : 'quán cà phê robot pha');
const drinkOf = (y: number) => (y < 2008 ? 'chè' : 'trà sữa');
const tvOf = (y: number) => (y < 1995 ? 'phim hoạt hình trên chiếc tivi đen trắng cả xóm xem chung' : y <= 2026 ? 'phim hoạt hình' : 'phim hoạt hình chiếu nổi giữa phòng');
const wall = (y: number) => (y < 2011 ? 'kể cho cả xóm' : y <= 2026 ? 'đăng lên Tường' : 'phát lên mạng thực tế ảo');
/** điểm Học vấn cần để đỗ đại học theo thời: 1990s rất khó (vài % vào được), 2002-2014 thi ba chung, từ 2015 dễ hơn */
const passMark = (y: number) => (y < 2000 ? 64 : y < 2015 ? 55 : 50);
const xemJob = (y: number) => (y < 2000 ? 'kế toán hợp tác xã' : y < 2015 ? 'nhân viên ngân hàng' : y <= 2026 ? 'kỹ sư phần mềm' : 'người huấn luyện AI');

/** Nhà bạn thơ ấu chuyển đi đâu: miền Bắc lên Hà Nội, miền Trung và miền Nam thì vào Sài Gòn */
const movedTo = (x: Ctx) => {
  const p = x.f.province;
  if (p === 'Hà Nội') return 'vào Sài Gòn';
  if (p === 'TP. Hồ Chí Minh') return 'ra Hà Nội';
  const south = ['Cần Thơ', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang', 'Đà Nẵng', 'Huế', 'Quảng Trị', 'Quảng Ngãi', 'Khánh Hòa', 'Gia Lai', 'Đắk Lắk', 'Lâm Đồng'];
  return south.includes(p) ? 'vào Sài Gòn' : 'lên Hà Nội';
};

/** "cậu bé" / "cô bé" theo giới người yêu */
const be = (x: Ctx) => (x.lg === 'm' ? 'cậu bé' : 'cô bé');
const co = (x: Ctx) => (x.lg === 'm' ? 'cậu' : 'cô');
/** vợ / chồng của nhân vật chính */
export const spouseWord = (x: Ctx) => (x.lg === 'm' ? 'chồng' : 'vợ');
export const spouseName = (x: Ctx) => {
  const p = x.s.partner;
  if (p && p !== 'xemmat') return x.L(p);
  if (p === 'xemmat') return xemmatName(x);
  return spouseWord(x);
};
const out = (x: Ctx, id: LoveId) => x.has(`${id}_out`);
/** bạn thân mới sau khi bạn thân cũ phản bội */
const nextBestie = (x: Ctx) => {
  const l = x.c.gender === 'f' ? ['Ngân', 'Nhung', 'Quyên', 'Diệu'] : ['Khánh', 'Lực', 'Nam', 'Toàn'];
  return l.filter((n) => n !== x.s.bestie)[(x.s.seed ?? 0) % 3];
};
/** nơi hẹn hò đầu tiên thật sự với người ấy (theo album), không có thì một quán quen */
const firstDateOf = (x: Ctx, id: LoveId) => {
  const ph = x.s.album.find((a) => a.who === id && a.place !== 'Buổi hẹn cuối tuần' && a.place !== 'Ảnh cưới');
  return ph ? `đúng chỗ năm nào: ${ph.place.charAt(0).toLowerCase() + ph.place.slice(1)}` : `${spotOf(x.year)} quen thuộc của hai người`;
};
/** xem mắt mà gặp lại người quen cũ (khoảng 4 phần 10 số đời, chỉ khi có người cũ chưa ghét mình) */
const twistOf = (x: Ctx): LoveId | null => {
  if ((x.s.seed ?? 0) % 10 >= 4) return null;
  const ids = x.s.met.filter((id) => id !== x.s.partner && x.s.love[id] >= 15 && !x.has('caught_' + id));
  return ids.sort((a, b) => x.s.love[b] - x.s.love[a])[0] ?? null;
};
const swapBestie = (fx: Fx, x: Ctx) => {
  const n = nextBestie(x);
  fx.newBestie(n);
  fx.say(`Từ hôm ấy, bạn thân của ${x.me} là ${n}, người lặng lẽ ngồi nghe ${x.me} khóc đến sáng.`);
};
/** người đang thầm thương lúc 16 tuổi (Khôi đã chuyển nhà) */
const crush = (x: Ctx): LoveId => (x.s.love.long >= x.s.love.minh ? 'long' : 'minh');
/** người cũ: thân nhất ngoài người yêu hiện tại */
const exOf = (x: Ctx): LoveId | null => {
  const ids = LOVE_IDS.filter((id) => id !== x.s.partner && !out(x, id)).sort((a, b) => x.s.love[b] - x.s.love[a]);
  return ids[0] && x.s.love[ids[0]] >= 35 ? ids[0] : null;
};
const P = (x: Ctx) => x.s.partner as LoveId;
const hasPartner = (x: Ctx) => !!x.s.partner && x.s.partner !== 'xemmat';

/** Đánh giá lời cầu hôn: hai ngưỡng như Love Too Easily 2 */


/* ---------- đám cưới: đỉnh của một đời, có tên, có ảnh ---------- */
const exAtWedding = (x: Ctx): LoveId | null => {
  const ids = LOVE_IDS.filter((id) => id !== x.s.partner && x.s.met.includes(id) && x.s.love[id] >= 45);
  return ids.sort((a, b) => x.s.love[b] - x.s.love[a])[0] ?? null;
};
const venue = (x: Ctx) =>
  x.year < 1990 ? 'sân hợp tác xã, tiệc trà, kẹo lạc, thuốc lá' : x.year < 2005 ? 'rạp dựng giữa ngõ, cỗ ba mươi mâm' : x.year < 2020 ? 'nhà hàng tiệc cưới, cổng hoa, MC đọc lời chúc' : 'nhà hàng, quét mã QR mừng cưới ngay cổng';
function weddingScene(age: number, next: string): Scene {
  return {
    id: `wd@${age}`,
    age,
    chapter: CH.tre,
    bg: (x) => (x.year < 2005 ? { place: 'ngo', time: 'day' } : { place: 'quan', time: 'night' }),
    who: (x) => (x.s.partner ?? null) as LoveId | 'xemmat' | null,
    skip: (x) => !x.s.married || x.has('cuoi_done'),
    title: (x) => `Đám cưới ${x.me} và ${spouseName(x)}`,
    text: (x) => {
      const r = regionOf(x.f.province);
      const open =
        x.year === 2020 || x.year === 2021
          ? 'Đám cưới thời giãn cách: hai mươi khách đeo khẩu trang, còn lại cả họ xem livestream, thả tim chi chít'
          : r === 'nam'
            ? `Nhà trai mang mâm quả sang rước dâu, ông cậu đi đầu cầm hộp trầu cau, ${x.year < 2000 ? 'cả xóm ra đầu hẻm đứng xem' : 'dàn bưng quả mặc áo dài đỏ đi một hàng'}`
            : r === 'trung'
              ? `${x.year % 3 === 0 ? 'Đúng mùa mưa, nước lên lưng chừng ngõ, nhà trai lội bì bõm mang tráp sang' : 'Nhà trai mang tráp sang từ sáng sớm, mâm cau xếp cao như tháp'}`
              : x.year < 2000
                ? 'Sáng sớm, nhà trai mang tráp sang, dàn bê tráp đi một hàng dài qua ngõ'
                : 'Đoàn rước dâu đến đúng giờ đẹp, xe hoa kết đầy hồng trắng';
      const look = [
        x.lg === 'm' ? 'trong bộ vest hơi rộng vai' : 'trong tà áo dài đỏ',
        x.lg === 'm' ? 'thắt cà vạt lệch, mồ hôi rịn trên trán' : 'tóc vấn cao, cầm bó hoa run run',
        x.lg === 'm' ? 'cười suốt từ cổng vào, ai trêu cũng gật' : 'mắt hơi đỏ vì vừa khóc lúc lạy bàn thờ',
      ][((x.s.seed ?? 0) + x.age) % 3];
      const lines = [
        `${open}. Tiệc cưới ở ${x.year > 2030 ? `${venue(x)}, MC là một giọng AI đọc lời chúc bằng ba thứ tiếng` : venue(x)}.`,
        `${spouseName(x)} ${look}, cứ quay sang nhìn ${x.me} rồi cười ngượng.`,
      ];
      const ex = exAtWedding(x);
      if (ex) lines.push(`Cuối hội trường, ${x.L(ex)} đứng lặng một lúc, gửi phong bì cho ${x.s.bestie} rồi lặng lẽ về trước.`);
      if (x.s.partner === 'khoi' && x.has('dieu')) lines.push('Trên bàn quà cưới có một con diều giấy cũ, buộc nơ đỏ.');
      return lines;
    },
    choices: [
      {
        t: 'Cầm micro, nói vài lời trước hai họ',
        do: (fx, x) => {
          fx.flag('cuoi_done');
          if (x.s.partner && x.s.partner !== 'xemmat') fx.love(x.s.partner, 10);
          fx.rel('bome', 6);
          if (x.s.partner && x.s.partner !== 'xemmat') fx.photo({ who: x.s.partner, place: 'Ảnh cưới', bg: { place: 'quan', time: 'night' }, line: `"Cảm ơn ${spouseName(x)} đã chọn ${x.me}." Cả hội trường vỗ tay.` });
        },
        note: () => '▣ Ảnh cưới đã vào album.',
        sys: 'Đinh! Nhiệm vụ lớn nhất đời: HOÀN THÀNH. Bản Hệ Thống khóc ướt cả bàn phím.',
      },
      {
        t: 'Nắm tay nhau đi chào từng bàn',
        do: (fx, x) => {
          fx.flag('cuoi_done');
          if (x.s.partner && x.s.partner !== 'xemmat') fx.love(x.s.partner, 6);
          fx.rel('banthan', 6);
          if (x.s.partner && x.s.partner !== 'xemmat') fx.photo({ who: x.s.partner, place: 'Ảnh cưới', bg: { place: 'quan', time: 'night' }, line: 'Hai bàn tay nắm chặt, đi hết ba mươi bàn tiệc.' });
        },
        note: () => '▣ Ảnh cưới đã vào album.',
      },
      {
        t: (x) => (exAtWedding(x) ? `Chạy ra cổng, nói lời cảm ơn ${x.L(exAtWedding(x)!)}` : 'Lén trốn ra sau nhà, thở một hơi thật dài'),
        do: (fx, x) => {
          fx.flag('cuoi_done');
          const ex = exAtWedding(x);
          if (ex) (fx.love(ex, 6), fx.flag(`cuoi_ex_${ex}`), fx.stat('tinh', 5));
          else fx.stat('tam', 4);
        },
        note: (x) => (exAtWedding(x) ? `🦋 ${x.L(exAtWedding(x)!)} sẽ nhớ buổi tối này.` : ''),
      },
    ],
    next,
  };
}

/** người ấy đi đâu khi mình xin thêm thời gian mà chưa đủ thân để được chờ */
const LEAVE: Record<LoveId, string> = {
  khoi: 'nhận việc ở công trường trên núi',
  long: 'mở xưởng độ xe ở thành phố khác',
  minh: 'nhận học bổng đi nước ngoài',
  phong: 'xin lên tuyến huyện vùng cao',
  hai: 'theo đoàn đi lưu diễn cả năm',
  tuananh: 'nhận chức ở chi nhánh nước ngoài',
  kai: 'về nước',
  quan: 'sang nước ngoài đóng phim',
  bao: 'chuyển đi thành phố khác diễn hài',
  duy: 'lên một chuyến tàu dài không hẹn ngày về',
  hung: 'sang nước ngoài làm dự án mới',
  tai: 'đi tour hát khắp các tỉnh',
};
/** nhận lời cầu hôn của người ấy: cưới, hợp gu thì hạnh phúc, lệch gu thì dở dang */
function accept(fx: Fx, x: Ctx) {
  const p = P(x);
  const b = x.s.stats[LOVES[p].likes] >= 55;
  fx.marry();
  fx.flag('dinhhon');
  if (b) (fx.loveEnd(`hanhphuc_${p}`), fx.say(`${x.L(p)} ôm chặt ${x.me}. Đám cưới vào mùa thu năm ấy.`));
  else (fx.loveEnd(`dodang_${p}`), fx.say(`Hai người cưới nhau. Nhưng ${x.L(p)} vốn thích ${LOVES[p].likesName}, và về sau sẽ có lúc lệch nhịp.`));
}

/** người ấy cầu hôn mình */
const proposeChoices: Choice[] = [
  { t: 'Gật đầu', do: accept },
  {
    t: 'Xin thêm thời gian',
    do: (fx, x) => {
      const p = P(x);
      if (x.s.love[p] >= 75 && !x.has('cho_them')) {
        fx.flag('cho_them');
        fx.love(p, -3);
        fx.say(`${x.L(p)} cất nhẫn vào túi: "Một năm nữa ${x.xung} hỏi lại. Lúc ấy đừng bắt ${x.xung} đợi nữa nhé."`);
        return;
      }
      fx.partner(null);
      fx.flag(`${p}_out`);
      fx.loveEnd(`lohen_${p}`);
      fx.say(`${x.L(p)} đợi thêm một năm, rồi ${LEAVE[p]}. Lần này ${x.ay} đi một mình.`);
    },
  },
  {
    t: 'Từ chối',
    do: (fx, x) => {
      const p = P(x);
      fx.love(p, -30);
      fx.partner(null);
      fx.flag(`${p}_out`);
    },
    sys: 'Đinh! Ký chủ vừa từ chối một lời cầu hôn. Bản Hệ Thống bắt đầu lo rồi đấy.',
  },
];

/** mình tự cầu hôn: đủ thân thì thành, chưa đủ thì người ấy xin thêm thời gian */
function myPropose(fx: Fx, x: Ctx) {
  const p = P(x);
  const lie = x.has('noidoi') ? 15 : 0;
  if (lie) fx.say(`${x.L(p)} vẫn nhớ lời nói dối năm 23 tuổi.`);
  if (x.s.love[p] - lie >= 70) return accept(fx, x);
  if (x.s.stats[LOVES[p].likes] >= 55) {
    fx.love(p, -10);
    fx.say(`${x.L(p)} lùi lại: "Cho ${x.xung} nghĩ thêm. Đừng giận ${x.xung} nhé." Câu ấy nhẹ, mà đau.`);
  } else {
    fx.love(p, -6);
    fx.say(`${x.L(p)} cười bối rối: "Sớm quá. Mình còn chưa hiểu nhau hết mà."`);
  }
  fx.flag('cauhon_hut');
}

/* ---------- drama theo thời kỳ, lúc 22 tuổi ---------- */
/** nền của cảnh drama theo năm */
function dramaBg(x: Ctx): Bg {
  const y = x.year;
  if (y < 1990) return { place: 'pho', time: 'day' };
  if (y < 2000) return { place: 'phong', time: 'night' };
  if (y < 2010) return { place: 'pho', time: 'night' };
  if (y < 2020) return y === 2018 ? { place: 'pho', time: 'day' } : { place: 'phong', time: 'night' };
  if (y <= 2021) return { place: 'phong', time: 'day' };
  if (y <= 2026) return y === 2025 ? { place: 'pho', time: 'day' } : { place: 'pho', time: 'night' };
  return { place: 'phong', time: 'night' };
}

function eraDrama(x: Ctx): { title: string; text: string[]; choices: Choice[]; post?: Post; bg?: Bg } {
  const y = x.year;
  const p = () => P(x);
  const n = hasPartner(x) ? x.L(P(x)) : 'người ấy';
  if (y < 1990)
    return {
      title: 'Thư từ Đông Âu',
      text: [`${n} được cử đi lao động ở Đông Âu ba năm. Thư đi thư về mất cả nửa năm.`],
      choices: [
        { t: 'Hứa đợi, tuần nào cũng viết thư', do: (fx) => (fx.love(p(), 15), fx.stat('tinh', 8)), note: `${n} sẽ giữ từng lá thư.` },
        { t: 'Xin đi theo, làm cùng xưởng', do: (fx) => (fx.love(p(), 10), fx.stat('tien', 10), fx.stat('noi', 5)) },
        { t: 'Chia tay cho nhẹ lòng', do: (fx) => (fx.partner(null), fx.flag(`${p()}_out`), fx.mid('xa')) },
      ],
    };
  if (y < 2000)
    return {
      title: 'Bài hát trên đài',
      text: [`Đài phát thanh có chương trình nhắn gửi yêu cầu bài hát. ${n} rủ ${x.me} gửi một bài tặng nhau.`],
      choices: [
        { t: 'Gửi bài, ký tên thật', do: (fx) => (fx.love(p(), 12), fx.stat('duyen', 6)), note: `Cả xóm nghe thấy tên hai người trên đài.` },
        { t: 'Gửi nhưng ký tên giả', do: (fx) => fx.love(p(), 5) },
        { t: 'Ngại lắm, thôi', do: (fx) => fx.love(p(), -6) },
      ],
    };
  if (y < 2010) {
    const aff = y === 2008;
    return {
      title: aff ? 'Đêm đi bão AFF Cup 2008' : 'Đêm Giáng sinh',
      text: aff
        ? [`Việt Nam vô địch AFF Cup. Cả thành phố đổ ra đường đi bão. ${n} gọi: "Lên xe!"`]
        : [`Đêm Giáng sinh, phố đông nghẹt người đi chơi. ${n} rủ đi, hội bạn cũng rủ đi.`],
      choices: [
        { t: `Đi cùng ${n}`, do: (fx) => (fx.love(p(), 12), fx.stat('noi', 4)), note: aff ? `${n} sẽ nhớ đêm cầm cờ ấy.` : undefined },
        { t: 'Đi với hội bạn', do: (fx) => (fx.rel('banthan', 10), fx.love(p(), -5)) },
        { t: 'Ở nhà ôn thi', do: (fx) => (fx.stat('hoc', 6), fx.love(p(), -4)) },
      ],
    };
  }
  if (y < 2020) {
    const u23 = y === 2018;
    return {
      title: u23 ? 'Đón U23 về nước' : 'Ảnh cũ trên Tường',
      text: u23
        ? [`Đội U23 Việt Nam về nước sau giải châu Á. Cả phố đi đón, kẹt xe từ sân bay vào trung tâm.`, `${n} đứng ngay cạnh, tay cầm lá cờ nhỏ.`]
        : [`Một tấm ảnh cũ của ${n} với người yêu cũ bỗng nổi lên trên Tường, kèm hàng trăm bình luận.`],
      post: u23
        ? undefined
        : {
            author: n,
            time: 'Kỷ niệm 3 năm trước',
            text: `Ngày này năm ${y - 3}: đi Đà Lạt với người ấy ♥ Mãi bên nhau nhé!`,
            likes: 213,
            comments: [
              { who: x.s.bestie, t: 'Ơ ai đào ảnh này lên đây vậy' },
              { who: 'Thu Trang', t: 'Đẹp đôi thế mà...' },
              { who: n, t: '(bình luận đã bị xóa)' },
            ],
            photo: [P(x)],
          },
      choices: u23
        ? [
            { t: `Nắm tay ${n} giữa đám đông`, do: (fx) => fx.love(p(), 12), note: `${n} sẽ nhớ cái nắm tay ấy.` },
            { t: 'Chen lên chụp ảnh cầu thủ', do: (fx) => (fx.stat('noi', 5), fx.love(p(), -3)) },
            { t: 'Về sớm vì đông quá', do: (fx) => fx.love(p(), -5) },
          ]
        : [
            { t: 'Hỏi thẳng cho rõ', do: (fx) => (fx.love(p(), 6), fx.stat('tinh', 4)) },
            { t: 'Thả "haha" vào ảnh', do: (fx) => (fx.love(p(), -10), fx.stat('noi', 5)) },
            { t: 'Coi như không thấy', do: (fx) => fx.stat('tam', -6) },
          ],
    };
  }
  if (y <= 2021)
    return {
      title: 'Mùa giãn cách',
      text: [`Thành phố giãn cách. ${x.me} và ${n} kẹt ở hai quận, chỉ gặp nhau qua gọi video.`],
      choices: [
        { t: 'Gọi video mỗi tối', do: (fx) => fx.love(p(), 10) },
        { t: `Đi chợ hộ cả khu, gửi đồ ăn sang cho ${n}`, do: (fx) => (fx.love(p(), 15), fx.stat('tinh', 6)), note: `${n} sẽ nhớ túi rau hôm ấy.` },
        { t: 'Bận quá, nhắn lúc nào hay lúc ấy', do: (fx) => fx.love(p(), -10) },
      ],
    };
  if (y <= 2026) {
    const parade = y === 2025;
    return {
      title: parade ? 'Lạc nhau ngày 2/9' : 'Vé concert',
      text: parade
        ? [`Sáng 2/9/2025, hai người đi xem diễu binh mừng Quốc khánh, rồi lạc nhau giữa biển người. Điện thoại mất sóng.`]
        : [`Có concert lớn ở sân Mỹ Đình. ${n} săn được hai vé, hội bạn cũng rủ đi cùng.`],
      choices: parade
        ? [
            { t: `Đứng yên một chỗ, tin ${n} sẽ tìm thấy`, do: (fx) => (fx.love(p(), 14), fx.stat('tinh', 5)), note: `${n} tìm thấy ${x.me} sau hai tiếng.` },
            { t: 'Đi khắp nơi tìm', do: (fx) => fx.love(p(), 6) },
            { t: 'Thôi, về trước', do: (fx) => fx.love(p(), -10) },
          ]
        : [
            { t: `Đi cùng ${n}`, do: (fx) => fx.love(p(), 12) },
            { t: 'Nhường vé, đi với hội bạn', do: (fx) => (fx.rel('banthan', 10), fx.love(p(), -6)) },
            { t: 'Ở nhà xem livestream', do: (fx) => fx.love(p(), -4) },
          ],
    };
  }
  return {
    title: 'Tin nhắn do AI viết',
    text: [`${x.me} phát hiện mấy tin nhắn ngọt ngào nhất của ${n} đều do trợ lý AI viết hộ.`],
    choices: [
      { t: 'Cười, bảo lần sau tự viết', do: (fx) => fx.love(p(), 10) },
      { t: 'Giận ba ngày', do: (fx) => fx.love(p(), -8) },
      { t: 'Cũng nhờ AI viết lại một bức dài hơn', do: (fx) => (fx.love(p(), -3), fx.stat('noi', 5)) },
    ],
  };
}

/* ---------- thẻ hồ sơ cho màn quẹt ---------- */
const look = (g: Gender, p: Partial<Look>): Look => ({ ...defaultCharacter(g).look, ...p });
function deckOf(x: Ctx): SwipeCard[] {
  const g = x.lg;
  const y = x.year;
  const paper = y < 2010;
  const where = (km: number) => (paper ? `Hộp thư báo, ${x.f.province}` : `Cách ${km} km`);
  const he = g === 'm' ? 'anh ấy' : 'cô ấy';
  const fakes = {
    anhao: {
      name: g === 'm' ? 'Hoàng' : 'Linh',
      age: x.age + 2,
      gender: g,
      look: look(g, { hair: g === 'm' ? 'curtains_long' : 'long_straight', hairColor: '#d9b26a', style: 'thanhlich', color: '#e8e1d0' }),
      where: where(3),
      bio: 'Thích du lịch, cà phê sáng, sống chân thành. Không tìm người chơi bời.',
      tags: ['Du lịch', 'Cà phê', 'Chân thành'],
      bg: '#f3c6d6',
      box: 214,
      result: paper ? 'Thư hồi âm kèm một tấm ảnh chụp studio. Gặp ngoài đời thì không nhận ra.' : `Gặp ngoài đời: ${he} khác ảnh mười tuổi. Ảnh đã qua ba lớp chỉnh.`,
    },
    cogd: {
      name: g === 'm' ? 'Tuấn' : 'Hằng',
      age: x.age + 8,
      gender: g,
      look: look(g, { hair: g === 'm' ? 'buzzcut' : 'half_up', style: 'nhenhang', color: '#7fb3d9' }),
      where: where(5),
      bio: 'Đang tìm một người thật sự hiểu mình.',
      tags: ['Trưởng thành', 'Hiểu chuyện'],
      bg: '#c9d9f0',
      box: 87,
      result: `Nhắn được ba câu thì ${g === 'm' ? 'vợ' : 'chồng'} người ta nhắn vào.`,
    },
    vay: {
      name: g === 'm' ? 'Đạt' : 'Ngân',
      age: x.age + 4,
      gender: g,
      look: look(g, { hair: g === 'm' ? 'unkempt' : 'loose', style: 'thanhlich', color: '#30343f', extra: 'earrings' }),
      where: where(1),
      bio: `Doanh nhân trẻ, đầu tư ${y < 2008 ? 'vàng' : y < 2018 ? 'chứng khoán' : y <= 2026 ? 'tiền ảo' : 'cổ phiếu AI'}. Thu nhập thụ động.`,
      tags: ['Doanh nhân', 'Tự do tài chính'],
      bg: '#e0d39a',
      box: 302,
      result: 'Câu thứ hai: "Cho mình vay 5 triệu, mai trả nhé."',
    },
    la: {
      name: g === 'm' ? 'Phúc' : 'Yến',
      age: x.age + 1,
      gender: g,
      look: look(g, { hair: g === 'm' ? 'unkempt' : 'ponytail', style: 'nangdong', color: '#7fd1b9' }),
      where: where(40),
      bio: 'Làm y tá ca đêm. Nuôi hai con mèo. Thích người hay cười.',
      tags: ['Mèo', 'Ca đêm'],
      bg: '#cfe8df',
      box: 45,
      result: `Nói chuyện vui cả tuần, rồi ${he} chuyển công tác vào Nam. Thôi đành.`,
    },
    tongtai: {
      name: g === 'm' ? 'Kiên' : 'Diệp',
      age: x.age + 10,
      gender: g,
      look: look(g, { hair: g === 'm' ? 'buzzcut' : 'bangs_bun', style: 'thanhlich', color: '#30343f', eyes: 'gray' }),
      where: where(2),
      bio: 'CEO, cao 1m80, có biệt thự ven sông. Tìm người thật lòng.',
      tags: ['CEO', 'Biệt thự'],
      bg: '#d9c4ef',
      box: 9,
      result: 'Là tài khoản lừa đảo, bị khóa sau hai ngày.',
    },
  } satisfies Record<string, SwipeCard>;
  const bio: Record<LoveId, string> = {
    khoi: x.has('dieu') ? 'Hay thả diều. Đang tìm người từng giữ hộ mình một thứ.' : 'Thích những buổi chiều trong ngõ nhỏ.',
    long: x.has('danh_long') ? 'Hồi lớp ba từng bị một đứa đánh cho một trận. Nhớ mãi.' : 'Bán xe độ rồi. Đi xe buýt. Hỏi gì cũng trả lời thật.',
    minh: 'Không giỏi nói chuyện. Giỏi giải đề. Đang học cách nói chuyện.',
    phong: x.age < 24 ? 'Sinh viên Y, học như chưa từng được học. Tìm người nhắc mình ăn đúng giờ.' : 'Làm ở bệnh viện, ca đêm nhiều. Tìm người nhắc mình ăn đúng giờ.',
    hai: 'Viết nhạc, hát quán. Nghèo nhưng nhiều bài hát.',
    tuananh: 'Bận. Thẳng tính. Không thích vòng vo.',
    kai: 'Đang học tiếng Việt. Thích phở và những chuyến đi xa.',
    quan: 'Đây là tài khoản thật. Không tin thì thôi.',
    bao: 'Kể chuyện cười dở nhất công ty. Nhưng ai cũng cười.',
    duy: 'Tin vào duyên. Hay đi tàu.',
    hung: x.lg === 'm' ? 'Tài khoản phụ. Lên sân khấu thì cháy, về nhà chỉ muốn ôm capybara chơi game. Giữ bí mật giúp nhé.' : 'Tài khoản phụ. Báo chí bảo tôi lạnh lùng. Thật ra tôi nói nhiều lắm, chỉ là chưa gặp đúng người.',
    tai: x.lg === 'm' ? 'Ca sĩ nhạc miền Tây. Hát bolero, vọng cổ, sáng ra vườn hái chôm chôm. Không phải người trong clip đâu. Mà thôi, đúng là tôi.' : 'Ca sĩ bolero miền Tây. Người ta bảo giọng tôi "ngọt như nước dừa Bến Tre". Tôi vẫn đang tập vọng cổ mỗi ngày.',
  };
  // người thật trên app: những ai chưa gặp; ngôi sao chỉ hiện khi Vận đào hoa cao
  const reals: SwipeCard[] = LOVE_IDS.filter((id) => !x.s.met.includes(id) && !out(x, id) && (!['quan', 'hung', 'tai'].includes(id) || (x.s.stats.dao >= 55 && !paper)) && (id !== 'tai' || x.year >= taiYear(x)))
    .sort((p, q) => ((LOVE_IDS.indexOf(p) * 7 + x.age) % 10) - ((LOVE_IDS.indexOf(q) * 7 + x.age) % 10))
    .slice(0, 3)
    .map((id, k) => ({
      name: x.L(id),
      age: x.age + (id === 'tuananh' ? 5 : id === 'kai' ? 1 : 0),
      gender: g,
      look: CAST[id][g],
      where: where(2 + k),
      bio: bio[id],
      tags: [jobOf(id, g, x.age, x.year)],
      bg: ['#f6d5a8', '#f3b7b7', '#bfe0d0'][k % 3],
      box: 51 + k,
      loveId: id,
      score: 60 + ((LOVE_IDS.indexOf(id) * 13 + x.age) % 39),
      match: paper ? `Thư hồi âm ký tên ${x.L(id)}. Nét chữ rất đẹp.` : `${x.L(id)} cũng vừa thích ${x.me}!`,
    }));
  const deck: SwipeCard[] = [fakes.anhao, fakes.cogd];
  if (reals[0]) deck.push(reals[0]);
  deck.push(fakes.vay);
  if (reals[1]) deck.push(reals[1]);
  deck.push(fakes.la);
  if (reals[2]) deck.push(reals[2]);
  deck.push(fakes.tongtai);
  return deck;
}

/* ---------- các cảnh ---------- */
const list: Scene[] = [
  // ===== Tuổi thơ =====
  {
    id: 'c6_dieu',
    age: 6,
    chapter: CH.tho,
    bg: () => ({ place: 'ngo', time: 'dusk' }),
    who: () => 'khoi',
    title: 'Con diều mắc cây',
    text: (x) => [
      `${x.L('khoi')} nhà bên khóc dưới gốc bàng: con diều mắc tít trên cành cao.`,
      `Ngoài ngõ, lũ trẻ gọi ${x.me} ra xem ${tvOf(x.year)}.`,
    ],
    choices: [
      { t: 'Trèo lên gỡ diều giúp', do: (fx) => (fx.flag('dieu'), fx.love('khoi', 15), fx.stat('noi', 5)), note: (x) => `${x.L('khoi')} sẽ nhớ chuyện này.` },
      { t: 'Chạy đi gọi người lớn', do: (fx) => (fx.love('khoi', 8), fx.stat('tinh', 5)) },
      { t: 'Mặc kệ, chạy ra xem phim', do: (fx) => fx.stat('tam', 5) },
    ],
    next: 'ly@6',
  },
  {
    id: 'c8_lop',
    age: 8,
    chapter: CH.tho,
    bg: () => ({ place: 'lop', time: 'day' }),
    who: () => 'long',
    title: 'Đứa nghịch nhất lớp',
    text: (x) => [
      `${x.L('long')} bàn sau lại ${x.lg === 'm' ? 'giật tóc' : 'giấu dép'} ${x.me}, còn vẽ bậy lên vở mới.`,
      `${x.L('minh')}, ${x.lg === 'm' ? 'cậu' : 'cô'} bạn học giỏi nhất lớp, ngồi bàn đầu nhìn xuống lạnh tanh.`,
    ],
    choices: [
      { t: 'Quay xuống đánh lại', do: (fx) => (fx.flag('danh_long'), fx.stat('noi', 10), fx.love('long', 12)), note: (x) => `${x.L('long')} bắt đầu để ý ${x.me}.` },
      { t: 'Mách cô giáo', do: (fx) => (fx.flag('mach_co'), fx.stat('hoc', 5), fx.love('minh', 10), fx.love('long', -5)), note: (x) => `${x.L('minh')} ghi nhận.` },
      { t: 'Nhịn, về nhà khóc', do: (fx) => (fx.stat('tam', -5), fx.stat('tinh', 5)) },
    ],
    next: 'ly@8',
  },
  {
    id: 'c10_he',
    age: 10,
    chapter: CH.tho,
    bg: () => ({ place: 'ngo', time: 'day' }),
    title: 'Mùa hè năm lớp năm',
    text: (x) => [`Hè này ${x.bm} cho ${x.me} tự chọn đi đâu.`, `Lũ bạn trong xóm thì rủ ra ${playOf(x.year)} đầu ngõ.`],
    choices: [
      { t: 'Đi học thêm cho chắc', do: (fx) => (fx.stat('hoc', 10), fx.love('minh', 8)), note: (x) => `Ngồi cùng bàn học thêm với ${x.L('minh')}.` },
      { t: (x) => `Trốn ra ${playOf(x.year)}`, do: (fx) => (fx.stat('noi', 10), fx.love('long', 8), fx.rel('bome', -5)), note: (x) => `${x.L('long')} cũng là khách quen ở đây.` },
      { t: 'Về quê với ông bà', do: (fx) => (fx.stat('tinh', 8), fx.stat('tam', 5), fx.love('khoi', 8)), note: (x) => `Nhà ${x.L('khoi')} cũng về quê cùng xóm. Hai đứa đi bắt chuồn chuồn cả hè.` },
    ],
    next: 'ly@10',
  },
  {
    id: 'c12_chuyennha',
    age: 12,
    chapter: CH.tho,
    bg: () => ({ place: 'ngo', time: 'day' }),
    who: () => 'khoi',
    title: 'Ngày chuyển nhà',
    text: (x) => [
      `Nhà ${x.L('khoi')} chuyển ${movedTo(x)}. Xe tải đỗ đầu ngõ từ sáng sớm.`,
      x.has('dieu')
        ? `${x.L('khoi')} dúi vào tay ${x.me} con diều giấy năm nào: "Giữ hộ tớ. Lớn lên tớ về lấy."`
        : `${x.L('khoi')} vẫy tay, ngập ngừng như muốn nói gì đó rồi lại thôi.`,
    ],
    choices: [
      { t: 'Hứa sẽ đợi cậu ấy về', do: (fx) => (fx.flag('hua'), fx.love('khoi', 12)), note: (x) => `${x.L('khoi')} sẽ nhớ lời hứa này.` },
      { t: 'Tặng lại một món kỷ vật', do: (fx) => (fx.flag('kyvat'), fx.love('khoi', 8), fx.stat('tinh', 5)), note: (x) => `${x.L('khoi')} cất món quà vào ngăn kéo.` },
      { t: 'Cười cho qua, chạy đi chơi', do: (fx) => fx.love('khoi', -5) },
    ],
    next: 'ly@12',
  },

  // ===== Tuổi teen =====
  {
    id: 't15',
    age: 15,
    chapter: CH.teen,
    bg: () => ({ place: 'cong', time: 'day' }),
    title: 'Năm lớp mười',
    text: (x) => [
      `Vào cấp ba, mỗi người chọn một kiểu sống.`,
      `${x.L('minh')} đỗ thủ khoa đầu vào. ${x.L('long')} giờ đi xe độ, chiều nào cũng tụ tập ở cổng trường.`,
    ],
    choices: [
      { t: 'Cắm đầu học', do: (fx) => (fx.stat('hoc', 15), fx.love('minh', 10), fx.stat('tam', -5)) },
      { t: 'Đi chơi cho biết đời', do: (fx) => (fx.stat('noi', 15), fx.love('long', 10), fx.rel('bome', -8), fx.stat('hoc', -5)) },
      { t: 'Theo đuổi âm nhạc, đi diễn văn nghệ', do: (fx) => (fx.stat('duyen', 15), fx.stat('tinh', 5), fx.love('hai', 10), fx.love('long', 3), fx.love('minh', 3)), note: (x) => `Ở đội văn nghệ có ${x.L('hai')}, ôm đàn ghi-ta cả buổi.` },
    ],
    next: 'ly@15',
  },
  {
    id: 't16_hethong',
    age: 16,
    chapter: CH.teen,
    bg: () => ({ place: 'phong', time: 'night' }),
    who: () => 'he_thong',
    title: 'Đinh!',
    text: (x) => [
      `Sinh nhật mười sáu, một giọng nói vang lên trong đầu ${x.me}:`,
      `"Đinh! Hệ Thống kích hoạt. Nhiệm vụ: trước 28 tuổi có người yêu thật lòng. Thua thì đi xem mắt do ${x.mom} chọn."`,
      `"Quà tân thủ: nhìn thấu lòng người một lần. Dùng không?"`,
    ],
    choices: [
      {
        t: 'Dùng ngay',
        do: (fx, x) => {
          const best = (['khoi', 'long', 'minh'] as LoveId[]).sort((a, b) => x.s.love[b] - x.s.love[a])[0];
          fx.say(`${x.L(best)} đang có cảm tình với ${x.me} nhất (${statusOf(x.s, best).toLowerCase()}).`);
          fx.stat('dao', 5);
        },
      },
      { t: 'Để dành', do: (fx) => fx.stat('dao', 10), sys: 'Đinh! Ký chủ có vẻ cẩn thận. Bản Hệ Thống ghi nhận.' },
      { t: '"Ai cần yêu đương!"', do: (fx) => (fx.flag('cung'), fx.stat('noi', 5)), sys: 'Đinh! Bản Hệ Thống bắt đầu lo rồi đấy.' },
    ],
    next: 't16_chat',
  },
  {
    id: 't16_chat',
    age: 16,
    chapter: CH.teen,
    bg: () => ({ place: 'phong', time: 'night' }),
    kind: 'chat',
    who: (x) => crush(x),
    timer: 12,
    timeout: 2,
    title: (x) => `${x.year < 2004 ? 'Lá thư trong ngăn bàn' : 'Tin nhắn lúc nửa đêm'}`,
    text: (x) => [x.year < 2004 ? `Có lá thư gấp hình máy bay nhét trong ngăn bàn từ chiều, giờ ${x.me} mới dám mở.` : `Đã 11 giờ đêm. Điện thoại rung.`],
    msgs: (x) =>
      crush(x) === 'long'
        ? [
            { me: false, t: 'Ngủ chưa?' },
            { me: false, t: 'Mai trốn tiết thể dục, tớ chở đi ăn chè không?' },
          ]
        : [
            { me: false, t: 'Mai kiểm tra Toán.' },
            { me: false, t: 'Tớ có làm đề cương. Cậu cần không?' },
          ],
    choices: [
      {
        t: (x) => (crush(x) === 'long' ? '"Đi luôn!"' : '"Cần lắm, cảm ơn cậu"'),
        do: (fx, x) => {
          const c = crush(x);
          fx.love(c, 12);
          if (c === 'long') (fx.flag('tron_tiet'), fx.stat('noi', 5), fx.stat('hoc', -5));
          else fx.stat('hoc', 5);
        },
      },
      { t: '"Ừ, để mai tính"', do: (fx, x) => fx.love(crush(x), 3) },
      {
        t: (x) => (x.year < 2004 ? '(Cất thư đi, không hồi âm)' : x.year < 2012 ? '(Đọc xong, không nhắn lại)' : '(Để "Đã xem", không trả lời)'),
        do: (fx, x) => {
          const c = crush(x);
          fx.love(c, -10);
          fx.flag(`seen_${c}`);
          if (x.s.love[c] < 15) fx.mid('seen');
        },
        note: (x) =>
          x.year < 2004 ? `${x.L(crush(x))} đợi thư hồi âm cả tuần.` : x.year < 2012 ? `${x.L(crush(x))} cầm điện thoại đợi tin nhắn cả đêm.` : `${x.L(crush(x))} nhìn dòng "Đã xem" cả đêm.`,
      },
    ],
    next: 'ly@16',
  },
  {
    id: 't17_thi',
    age: 18,
    chapter: CH.teen,
    bg: () => ({ place: 'cong', time: 'day' }),
    title: 'Thi đại học',
    text: (x) => {
      const pass = x.s.stats.hoc >= passMark(x.year);
      const lines = [pass ? `Có kết quả: ${x.me} đỗ đại học!` : `Có kết quả: ${x.me} trượt, thiếu hai điểm.`];
      if (!pass && x.s.love.long >= 25) lines.push(`Chiều hôm ấy, ${x.L('long')} ngồi ngoài cổng trường, chìa cho ${x.me} một cốc ${drinkOf(x.year)}.`);
      if (!pass && x.s.love.minh >= 25) lines.push(`${x.L('minh')} gửi ${msgOf(x.year)}: "Năm sau thi lại, tớ kèm."`);
      return lines;
    },
    choices: [
      {
        t: (x) => (x.f.urban && (x.f.province === 'Hà Nội' || x.f.province === 'TP. Hồ Chí Minh') ? 'Vào đại học, ngày ngày đạp xe đến giảng đường' : 'Lên thành phố học, ở ký túc xá'),
        if: (x) => x.s.stats.hoc >= passMark(x.year),
        do: (fx, x) => {
          fx.flag('daihoc');
          fx.stat('hoc', 5);
          if (x.s.love.minh >= 20) (fx.love('minh', 8), fx.say(`${x.L('minh')} học cùng trường.`));
        },
      },
      { t: 'Ôn thi lại một năm', if: (x) => x.s.stats.hoc < 55, do: (fx) => (fx.flag('daihoc'), fx.stat('hoc', 10), fx.love('minh', 8)) },
      {
        t: (x) => `Nhận cốc ${drinkOf(x.year)}, ngồi cạnh ${x.L('long')} đến tối`,
        if: (x) => x.s.stats.hoc < 55 && x.s.love.long >= 25,
        do: (fx) => (fx.love('long', 12), fx.stat('tinh', 5)),
        note: (x) => `${x.L('long')} chưa từng đợi ai lâu như thế.`,
      },
      { t: 'Đi làm luôn, kiếm tiền sớm', do: (fx) => (fx.flag('dilam'), fx.stat('tien', 15), fx.stat('noi', 5), fx.love('long', 5)) },
    ],
    next: 'ly@18',
  },

  // ===== Tuổi trẻ =====
  {
    id: 'y19_veve',
    age: 19,
    chapter: CH.tre,
    bg: () => ({ place: 'ngo', time: 'day', tet: true }),
    who: () => 'khoi',
    title: 'Người trong ngõ cũ',
    text: (x) => {
      const back = x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20;
      if (!back) return [`Tết năm ấy, có người khách lạ đi ngang ngõ cũ, dừng lại nhìn ngôi nhà bên cạnh rất lâu.`, `${x.me} thấy quen quen, rồi người ấy đi mất.`];
      return [
        `Tết năm ấy, ${x.L('khoi')} trở về ngõ cũ.`,
        x.has('dieu') ? `${x.lg === 'm' ? 'Anh' : 'Cô'} đứng trước cửa, chỉ vào con diều treo trên tường: "Tớ về lấy rồi đây."` : `${x.ay.charAt(0).toUpperCase() + x.ay.slice(1)} nhìn ${x.me} một lúc lâu mới dám chào.`,
      ];
    },
    choices: [
      { t: 'Ôm chầm lấy', if: (x) => x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20, do: (fx) => (fx.love('khoi', 15), fx.stat('tinh', 5)) },
      { t: 'Ngại ngùng chào một câu', if: (x) => x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20, do: (fx) => fx.love('khoi', 5) },
      {
        t: 'Bảo đã có người trong lòng rồi',
        if: (x) => (x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20) && (x.s.love.long >= 35 || x.s.love.minh >= 35),
        do: (fx) => fx.love('khoi', -15),
      },
      { t: 'Chạy theo hỏi', if: (x) => !(x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20), do: (fx, x) => (fx.love('khoi', 15), fx.say(`Là ${x.L('khoi')}. Suýt nữa thì lướt qua nhau.`)) },
      {
        t: 'Thôi, chắc nhầm người',
        if: (x) => !(x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20),
        do: (fx) => (fx.flag('khoi_out'), fx.mid('luotqua')),
        note: 'Có những người chỉ đi ngang qua đời mình một lần.',
      },
    ],
    next: 'ly@19',
  },
  {
    id: 'y20_chon',
    age: 20,
    chapter: CH.tre,
    bg: () => ({ place: 'phong', time: 'night' }),
    who: () => 'he_thong',
    title: 'Mở khóa Mùa yêu',
    // gộp vào cảnh chọn 3 người ngay sau đó
    skip: () => true,
    text: (x) => [
      `"Đinh! 20 tuổi, mở khóa Bảng tình duyên."`,
      `"Luật: cùng lúc tối đa 5 người, cả đời 10 người, mỗi năm 2 lượt. Bắt cá hai tay mà bị lộ thì tự chịu."`,
    ],
    choices: [{ t: '▶ Mở Bảng tình duyên', sys: 'Đinh! Mùa yêu bắt đầu.' }],
    next: 'fo@20',
  },
  {
    id: 'y22_drama',
    age: 22,
    chapter: CH.tre,
    who: (x) => P(x),
    skip: (x) => !hasPartner(x),
    title: (x) => eraDrama(x).title,
    text: (x) => eraDrama(x).text,
    // lựa chọn thay theo năm: dựng ở getScene
    choices: [],
    next: 'fo@22',
  },
  {
    id: 'y23_noidoi',
    age: 23,
    chapter: CH.tre,
    bg: () => ({ place: 'quan', time: 'day' }),
    who: (x) => P(x),
    skip: (x) => !hasPartner(x),
    title: 'Tối qua đi đâu?',
    text: (x) => {
      const ex = exOf(x);
      return [
        `Tối qua ${x.me} đi ăn với ${x.s.bestie}${ex ? ` và tình cờ ngồi cùng bàn với ${x.L(ex)}` : ''} tới khuya.`,
        `Sáng nay ${x.L(P(x))} hỏi: "Tối qua ${x.goi} đi đâu đấy?"`,
      ];
    },
    choices: [
      { t: 'Kể thật hết', do: (fx, x) => (fx.love(P(x), 5), fx.stat('tinh', 5), fx.flag('thattha')) },
      { t: '"Ở nhà ngủ sớm."', do: (fx) => fx.flag('noidoi'), note: (x) => `${x.L(P(x))} sẽ nhớ chuyện này.` },
      { t: '"Sao lại tra hỏi thế?"', do: (fx, x) => (fx.love(P(x), -8), fx.stat('noi', 5)) },
    ],
    next: 'fo@23',
  },
  {
    id: 'y24_ramat',
    age: 24,
    chapter: CH.tre,
    bg: () => ({ place: 'nha', time: 'day' }),
    who: () => 'mom',
    skip: (x) => !hasPartner(x) || x.s.married,
    title: (x) => `Ra mắt ${x.bm}`,
    text: (x) => {
      const p = P(x);
      const lines: string[] = [];
      if (x.f.parents === 'Gia trưởng' && p === 'long') lines.push(`Bố ${x.me} nhìn ${x.L(p)} từ đầu đến chân rồi đập bàn: "Cái ${x.lg === 'm' ? 'thằng' : 'đứa'} đi xe độ ấy à? Không được!"`);
      else if (x.f.parents === 'Hòa thuận, cởi mở') lines.push(`${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} nấu cả mâm cơm, gắp cho ${x.L(p)} miếng ngon nhất.`);
      else lines.push(`Bữa cơm ra mắt im lặng hơn ${x.me} tưởng.`);
      if (x.s.love[p] < 45) lines.push(`${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} ${x.me} nói luôn: "Hai đứa cưới luôn cho xong, tháng sau có ngày đẹp!" Cả hai cùng sặc nước.`);
      return lines;
    },
    choices: [
      { t: 'Bảo vệ người yêu đến cùng', if: (x) => x.f.parents === 'Gia trưởng' && P(x) === 'long', do: (fx, x) => (fx.love(P(x), 15), fx.rel('bome', -15), fx.stat('noi', 5)), note: (x) => `${x.L(P(x))} sẽ không quên hôm nay.` },
      {
        t: 'Nghe lời bố',
        if: (x) => x.f.parents === 'Gia trưởng' && P(x) === 'long',
        do: (fx, x) => (fx.love(P(x), -20), fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('camcan')),
      },
      {
        t: 'Khéo léo xin bố cho thêm thời gian',
        if: (x) => x.f.parents === 'Gia trưởng' && P(x) === 'long',
        do: (fx, x) => {
          if (x.s.stats.duyen >= 45) (fx.love(P(x), 5), fx.rel('bome', 5), fx.say('Bố im lặng, rồi gật đầu: "Cho một năm."'));
          else (fx.love(P(x), -5), fx.rel('bome', -5), fx.say('Nói chưa khéo, bố càng giận.'));
        },
      },
      { t: (x) => `Phụ ${x.mom} nấu cơm, ngồi lại nói chuyện lâu`, if: (x) => !(x.f.parents === 'Gia trưởng' && P(x) === 'long'), do: (fx, x) => (fx.rel('bome', 10), fx.love(P(x), 5)) },
      { t: 'Ra mắt cho có rồi đi chơi', if: (x) => !(x.f.parents === 'Gia trưởng' && P(x) === 'long'), do: (fx) => fx.rel('bome', -5) },
      {
        t: 'Nhận lời cưới luôn',
        if: (x) => x.s.love[P(x)] < 45,
        do: (fx) => (fx.marry(), fx.loveEnd('cuoivoi'), fx.mid('cuoivoi')),
        sys: 'Đinh! Cảnh báo: hai người chưa đủ thân. Ký chủ chắc chưa?',
      },
    ],
    next: 'fo@24',
  },
  {
    id: 'y25_traxanh',
    age: 25,
    chapter: CH.tre,
    bg: () => ({ place: 'phong', time: 'night' }),
    kind: 'chat',
    who: () => 'bestie',
    timer: 12,
    timeout: 2,
    skip: (x) => !hasPartner(x) || x.s.married,
    title: (x) => `Tin nhắn của ${x.s.bestie}`,
    text: (x) => [
      x.year < 2004
        ? `${x.me} dọn bàn giúp ${x.L(P(x))} thì thấy một lá thư của ${x.s.bestie}, bạn thân của mình.`
        : `${x.me} cầm nhầm điện thoại của ${x.L(P(x))} và thấy tin nhắn của ${x.s.bestie}, bạn thân của mình.`,
    ],
    msgs: (x) => [
      { me: false, t: `Hôm nay ${x.xung} mặc áo xanh đẹp lắm.` },
      { me: false, t: `Đừng kể với ${x.me} nhé.` },
    ],
    choices: [
      {
        t: 'Hỏi thẳng cả hai, bình tĩnh',
        do: (fx, x) => {
          swapBestie(fx, x);
          fx.rel('banthan', -15);
          if (x.s.love[P(x)] >= 45) (fx.love(P(x), 10), fx.say(`${x.L(P(x))} chặn ${x.s.bestie} ngay trước mặt ${x.me}.`));
          else (fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('traxanh'));
        },
      },
      { t: (x) => `${x.year < 2012 ? 'Kể cho cả xóm biết' : 'Đăng lên Tường bóc phốt'}`, do: (fx, x) => (swapBestie(fx, x), fx.rel('banthan', -30), fx.stat('noi', 10), fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('bocphot')) },
      {
        t: '(Giả vờ như không thấy)',
        do: (fx, x) => {
          fx.stat('tam', -10);
          fx.love(P(x), -10);
          fx.flag('traxanh_im');
          if (x.s.love[P(x)] < 45) (fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('traxanh'));
        },
      },
    ],
    next: 'fo@25',
  },
  {
    id: 'y27_cauhon',
    age: 27,
    chapter: CH.tre,
    bg: (x) => x.year < 1995 ? { place: 'congvien', time: 'night' } : { place: 'quan', time: 'night' },
    who: (x) => P(x),
    skip: (x) => !hasPartner(x) || x.s.married,
    title: 'Lời cầu hôn',
    text: (x) => {
      const p = P(x);
      if (x.s.love[p] < 60) return [`27 tuổi. Yêu ${x.L(p)} đã lâu, nhưng chưa ai nhắc đến chuyện cưới.`, `${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} hỏi: "Hai đứa định thế nào?"`];
      const lines = [`${x.L(p)} hẹn ${x.me} ra ${firstDateOf(x, p)}.`];
      if (p === 'khoi' && x.has('dieu')) lines.push(`${x.ay[0].toUpperCase() + x.ay.slice(1)} mang theo con diều giấy năm nào, giờ buộc thêm một chiếc nhẫn.`);
      if (p === 'long') lines.push(`Chiếc xe độ đã bán. ${x.L(p)} đi xe buýt tới, cười ngượng.`);
      if (p === 'minh') lines.push(`${x.L(p)} rút ra bài phát biểu đã soạn sẵn ba trang, đọc được nửa trang thì quên.`);
      if (x.has('yeuxa')) lines.push(`Hợp đồng ở xa chưa hết, nhưng ${x.ay} xin nghỉ phép về sớm, chỉ để hỏi một câu.`);
      if (x.has('noidoi')) lines.push(`Trước khi quỳ xuống, ${x.ay} hỏi nhỏ: "Năm ấy ${x.goi} nói dối ${x.xung}, đúng không?"`);
      lines.push(`"Lấy ${x.xung} nhé?"`);
      return lines;
    },
    choices: [
      ...proposeChoices.map((c) => ({ ...c, if: (x: Ctx) => x.s.love[P(x)] >= 60 })),
      { t: (x) => `Tự mua nhẫn, cầu hôn ${x.L(P(x))}`, if: (x) => x.s.love[P(x)] < 60, do: myPropose },
      { t: 'Cứ để mọi chuyện tự nhiên', if: (x) => x.s.love[P(x)] < 60, do: (fx, x) => fx.love(P(x), -4) },
    ],
    next: 'rv@27',
  },
  {
    id: 'y28_hethong',
    age: 28,
    chapter: CH.tre,
    bg: () => ({ place: 'phong', time: 'night' }),
    who: () => 'he_thong',
    // còn người yêu thì chưa tính là thất bại: sang năm 29 hỏi lại
    skip: (x) => x.s.married || hasPartner(x),
    title: 'Hết hạn nhiệm vụ',
    text: (x) => [`"Đinh! Ký chủ đã 28 tuổi mà chưa yên bề. Nhiệm vụ thất bại."`, `${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} đã hẹn sẵn một buổi xem mắt vào chủ nhật.`],
    choices: [
      { t: (x) => `Đi xem mắt cho ${x.mom} vui`, to: 'y28_xemmat' },
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `Nhắn cho ${x.L(id)}: "Dạo này thế nào?"`,
          if: (x) => !out(x, id) && x.s.love[id] >= 40,
          do: (fx) => (fx.partner(id), fx.love(id, 10)),
          to: 'y29_quaylai',
          note: (x) => `${x.L(id)} trả lời ngay trong một phút.`,
        }),
      ),
      { t: 'Ở một mình cũng vui', do: (fx) => (fx.loveEnd('docthan'), fx.stat('tam', 5)), sys: 'Đinh! Bản Hệ Thống... thôi, chúc ký chủ vui.' },
    ],
    next: (x) => (hasPartner(x) && !x.s.married ? 'y29_quaylai' : 'ev@30'),
  },
  {
    id: 'y28_xemmat',
    age: 28,
    chapter: CH.tre,
    bg: () => ({ place: 'quan', time: 'day' }),
    who: (x) => twistOf(x) ?? 'xemmat',
    title: 'Buổi xem mắt',
    text: (x) => {
      const t = twistOf(x);
      if (t)
        return [
          `${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} dặn: "Con bạn ${x.mom}, hiền lắm, làm ${jobOf(t, x.lg, x.age, x.year)}." ${x.me} đến quán, cúi mặt khuấy cốc nước.`,
          `Người ngồi xuống đối diện cũng cúi mặt. Rồi cả hai cùng ngẩng lên. Là ${x.L(t)}.`,
          `"Hóa ra là ${x.goi}," ${x.ay} bật cười. "Mấy năm rồi nhỉ?"`,
        ];
      return [
        `Người xem mắt tên ${xemmatName(x)}, con bạn ${x.mom}, làm ${xemJob(x.year)}, nói chuyện lịch sự và hơi nhạt.`,
        `Cuối buổi, ${x.lg === 'm' ? 'anh ta' : 'cô ta'} hỏi: "Mình thử tìm hiểu nhé?"`,
      ];
    },
    choices: [
      {
        t: (x) => `Lần này không để lỡ ${x.L(twistOf(x)!)} nữa`,
        if: (x) => !!twistOf(x),
        do: (fx, x) => {
          const t = twistOf(x)!;
          fx.unflag(`${t}_out`);
          fx.partner(t);
          fx.love(t, 15);
          fx.marry();
          fx.loveEnd(`duyenno_${t}`);
          fx.rel('bome', 10);
        },
        note: () => '🦋 Có những người đi một vòng thật xa rồi mới quay về.',
        sys: 'Đinh! Bản Hệ Thống thề là không sắp đặt vụ này.',
      },
      { t: 'Chào nhau như người quen cũ, rồi thôi', if: (x) => !!twistOf(x), do: (fx, x) => (fx.loveEnd('docthan'), fx.love(twistOf(x)!, 4)) },
      { t: (x) => `Đồng ý, nửa năm sau cưới ${xemmatName(x)}`, if: (x) => !twistOf(x), do: (fx) => (fx.partner('xemmat'), fx.marry(), fx.loveEnd('bimeep'), fx.rel('bome', 10)) },
      { t: 'Từ chối khéo', if: (x) => !twistOf(x), do: (fx) => (fx.loveEnd('docthan'), fx.rel('bome', -5)) },
    ],
    next: 'wd@28',
  },
  {
    id: 'y29_quaylai',
    age: 29,
    chapter: CH.tre,
    bg: () => ({ place: 'quan', time: 'dusk' }),
    who: (x) => P(x),
    skip: (x) => !hasPartner(x) || x.s.married,
    title: (x) => (x.has('cho_them') ? 'Hỏi lại lần nữa' : x.s.path.some((h) => h.scene === 'y28_hethong') ? 'Gặp lại' : 'Năm 29 tuổi'),
    text: (x) =>
      x.has('cho_them')
        ? [`Đúng một năm sau, ${x.L(P(x))} lại rút chiếc nhẫn ấy ra.`, `"${x.xung === 'anh' ? 'Anh' : 'Em'} hỏi lại đây. Lấy ${x.xung} nhé?"`]
        : x.s.path.some((h) => h.scene === 'y28_hethong')
          ? [`${x.L(P(x))} đến đúng hẹn, vẫn ngồi chỗ cũ, vẫn gọi đúng món ${x.me} thích.`, `Ngồi được một lúc, ${x.ay} hỏi: "Mình thử lại lần nữa, rồi cưới luôn nhé?"`]
          : [`29 tuổi. ${x.L(P(x))} vẫn ở bên, bạn bè thì đã con bế con bồng.`, `Tối ấy ${x.ay} hỏi nhỏ: "Mình cưới nhé?"`],
    choices: [
      { t: 'Gật đầu', do: accept },
      {
        t: 'Thôi, mình dừng ở đây',
        do: (fx, x) => {
          const p = P(x);
          fx.love(p, -20);
          fx.partner(null);
          fx.flag(`${p}_out`);
          fx.loveEnd(`lohen_${p}`);
          fx.say(`${x.L(p)} gật đầu, không khóc. Chỉ có ${x.me} khóc.`);
        },
      },
    ],
    next: 'wd@29',
  },

  // ===== Lập gia đình =====
  {
    id: 'm32_tet',
    age: 32,
    chapter: CH.nha,
    bg: () => ({ place: 'nha', time: 'day', tet: true }),
    who: () => 'mom',
    skip: (x) => !x.s.married,
    title: 'Tết này về bên nào?',
    text: (x) => {
      const lines = [`Nhà nội muốn về quê nội. Nhà ngoại gọi điện giục từ rằm tháng Chạp.`];
      if (x.c.gender === 'f') lines.push(`Mẹ chồng còn nhắc khéo: "Năm nay có tin vui chưa con? Nhà mình cần cháu trai nối dõi."`);
      return lines;
    },
    choices: [
      { t: 'Chia đôi: mùng một bên nội, mùng ba bên ngoại', do: (fx, x) => (fx.rel('bome', 5), fx.stat('duyen', 5), hasPartner(x) && fx.love(P(x), 5)) },
      { t: 'Nói thẳng: con trai hay con gái đều quý như nhau', if: (x) => x.c.gender === 'f', do: (fx, x) => (fx.stat('tinh', 5), hasPartner(x) && fx.love(P(x), 5)), sys: 'Đinh! Lựa chọn đúng.' },
      { t: (x) => `Đón ${x.bm} vợ lên ăn Tết cùng`, if: (x) => x.c.gender === 'm', do: (fx, x) => (fx.stat('tien', -10), hasPartner(x) && fx.love(P(x), 10)) },
      { t: 'Ở nhà riêng, ăn Tết hai vợ chồng', do: (fx, x) => (fx.rel('bome', -10), hasPartner(x) && fx.love(P(x), 8)) },
    ],
    next: 'm33_con',
  },
  {
    id: 'm33_con',
    age: 33,
    chapter: CH.nha,
    bg: () => ({ place: 'nha', time: 'dusk' }),
    skip: (x) => !x.s.married,
    title: 'Chuyện con cái',
    text: (x) => [`Bạn bè cùng lứa đã có con đi mẫu giáo. ${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} hỏi bóng gió mỗi lần gọi điện.`],
    choices: [
      { t: 'Sinh con ngay năm nay', do: (fx, x) => (fx.kids(1), fx.rel('con', 55), fx.stat('tien', -10), hasPartner(x) && fx.love(P(x), 5)), sys: 'Đinh! Mở khóa danh hiệu "Phụ huynh mất ngủ". Bản Hệ Thống xin phép làm bảo mẫu ảo.' },
      { t: 'Đợi mua được nhà rồi mới sinh', do: (fx) => (fx.kids(1), fx.rel('con', 45), fx.stat('tien', 10)) },
      { t: 'Sinh hai đứa cho vui nhà', do: (fx) => (fx.kids(2), fx.rel('con', 55), fx.stat('tien', -20), fx.stat('tam', -5)) },
      { t: 'Chưa muốn có con', do: (fx, x) => (fx.kids(0), fx.stat('tam', 5), hasPartner(x) && fx.love(P(x), -5)) },
    ],
    next: 'dr@34',
  },
  {
    id: 'm40_nguoicu',
    age: 40,
    chapter: CH.nha,
    bg: () => ({ place: 'pho', time: 'night' }),
    kind: 'chat',
    who: (x) => exOf(x),
    timer: 12,
    timeout: 2,
    skip: (x) => !exOf(x),
    title: 'Người cũ nhắn tin',
    text: (x) => [`Bốn mươi tuổi. Một ${msgOf(x.year)} từ ${x.L(exOf(x)!)} hiện lên.`],
    msgs: (x) => [
      { me: false, t: 'Lâu rồi không gặp.' },
      { me: false, t: `Tháng sau ${x.xung} về ${x.f.province}. Đi cà phê một bữa nhé?` },
    ],
    choices: [
      {
        t: (x) => (x.s.married ? `Đi gặp, giấu ${spouseName(x)}` : 'Đi gặp, lần này nói thật lòng'),
        do: (fx, x) => {
          const ex = exOf(x)!;
          if (x.s.married) {
            if (hasPartner(x)) fx.love(P(x), -25);
            fx.flag('ngoaitinh');
            const weak = !hasPartner(x) || x.s.love[P(x)] < 45;
            if (weak) (fx.loveEnd('nguoicu'), fx.mid('nguoicu'));
            else fx.say(`Cà phê xong, ${x.me} về nhà mà không dám nhìn ${spouseName(x)}.`);
          } else if (x.s.love[ex] >= 50) {
            fx.partner(ex);
            fx.marry();
            fx.loveEnd(`muon_${ex}`);
            fx.say(`Hai người cưới nhau năm ${x.year + 1}, không mời ai, chỉ hai đứa và một bó hoa.`);
          } else fx.say('Cà phê xong, mỗi người một ngả. Nhẹ lòng.');
        },
        note: (x) => (x.s.married ? `${spouseName(x)} sẽ biết chuyện này.` : ''),
      },
      {
        t: (x) => (x.s.married ? `Kể cho ${spouseName(x)}, rủ cả nhà đi gặp` : 'Chỉ hỏi thăm vài câu'),
        do: (fx, x) => (x.s.married && hasPartner(x) ? fx.love(P(x), 10) : undefined, fx.stat('tinh', 5)),
      },
      { t: '(Để "Đã xem", rồi xóa tin nhắn)', do: (fx, x) => (x.s.married && hasPartner(x) ? fx.love(P(x), 3) : undefined, fx.stat('tam', -3)) },
    ],
    next: 'dr@41',
  },
  {
    id: 'm45_viec',
    age: 45,
    chapter: CH.nha,
    bg: () => ({ place: 'vanphong', time: 'day' }),
    title: 'Gia đình hay sự nghiệp',
    text: (x) => [`Công ty đề nghị ${x.me} lên trưởng phòng, đổi lại phải đi công tác xa nửa năm.`, `${x.bm === 'ông bà' ? 'Ông bà' : 'Bố mẹ'} đã yếu, gọi điện hay quên.`],
    choices: [
      { t: 'Nhận, lo tương lai trước', do: (fx, x) => (fx.stat('tien', 20), fx.rel('con', -15), x.s.married && hasPartner(x) ? fx.love(P(x), -5) : undefined) },
      { t: 'Từ chối, ở gần gia đình', do: (fx, x) => (fx.rel('con', 15), fx.stat('tam', 5), x.s.married && hasPartner(x) ? fx.love(P(x), 8) : undefined) },
      { t: (x) => `Đón ${x.bm} lên ở cùng`, do: (fx) => (fx.rel('bome', 20), fx.stat('tien', -10), fx.stat('tinh', 5)) },
      { t: 'Dành tiền đi du lịch khắp nơi', if: (x) => !x.s.married, do: (fx) => (fx.stat('tam', 15), fx.rel('banthan', 10)) },
    ],
    next: 'dr@47',
  },

  // ===== Tuổi già =====
  {
    id: 'o60',
    age: 60,
    chapter: CH.gia,
    bg: () => ({ place: 'vuon', time: 'dusk' }),
    who: (x) => (x.s.married ? (x.s.partner as LoveId | 'xemmat') : 'bestie'),
    title: 'Sáu mươi tuổi',
    text: (x) => {
      const lines = [
        `${x.bm === 'ông bà' ? 'Ông bà' : 'Bố mẹ'} đã lần lượt đi xa. ${x.s.rel.bome >= 60 ? `Những năm cuối, tuần nào ${x.me} cũng về thăm.` : `Có những cái Tết ${x.me} đã không về, giờ nghĩ lại vẫn tiếc.`}`,
      ];
      if (x.s.married) lines.push(`${spouseName(x)} tóc đã bạc, sáng nào cũng pha trà chờ ${x.me} dậy.`);
      else lines.push(`${x.s.bestie} vẫn rủ ${x.me} đi tập dưỡng sinh mỗi sáng.`);
      if (x.s.kids) lines.push(x.s.kids > 1 ? 'Hai đứa con đã lớn, đứa đầu sắp cưới.' : 'Đứa con đã lớn, vừa dẫn người yêu về ra mắt.');
      return lines;
    },
    choices: [
      { t: (x) => `Đi một chuyến thật xa với ${x.s.married ? spouseName(x) : x.s.bestie}`, do: (fx, x) => (x.s.married && hasPartner(x) ? fx.love(P(x), 10) : fx.rel('banthan', 12), fx.stat('tam', 8)) },
      { t: 'Trông cháu giúp con', if: (x) => x.s.kids > 0, do: (fx) => fx.rel('con', 15) },
      { t: 'Về quê sửa lại ngôi nhà cũ', do: (fx) => (fx.stat('tinh', 10), fx.stat('tam', 5)) },
      { t: 'Viết hồi ký', do: (fx) => (fx.stat('hoc', 5), fx.stat('tam', 5)) },
    ],
    next: 'ev@65',
  },
  {
    id: 'o75',
    age: 75,
    chapter: CH.gia,
    bg: () => ({ place: 'vuon', time: 'dusk' }),
    who: () => 'he_thong',
    title: 'Cuốn album cuối cùng',
    text: (x) => [
      `Bảy mươi lăm tuổi, giọng nói quen thuộc vang lên rất khẽ:`,
      `"Đinh. Bản Hệ Thống sắp đi rồi. Bí mật cuối: bản Hệ Thống từng lỡ mất một tình yêu, nên mới ép người khác phải yêu. Cảm ơn ký chủ đã sống hết mình."`,
    ],
    choices: [{ t: 'Lật album lần cuối' }],
    next: 'end',
  },
];

export const SCENES: Record<string, Scene> = Object.fromEntries(list.map((s) => [s.id, s]));
export const FIRST_SCENE = 'ly@0';



/* =========================================================
   MÙA YÊU (20 đến 26 tuổi): Bảng tình duyên, tin nhắn, hẹn hò, quẹt, đi chỗ mới,
   buông ai khi đủ 5 người, bị phát hiện bắt cá hai tay. Các cảnh này dựng theo trạng thái.
   ========================================================= */

/** Sau mỗi năm Mùa yêu thì đi tới đâu */
const AFTER_YEAR: Record<number, string> = {
  20: 'ev@21',
  21: 'y22_drama',
  22: 'y23_noidoi',
  23: 'y24_ramat',
  24: 'y25_traxanh',
  25: 'ev@26',
  26: 'y27_cauhon',
};

/** Sau mỗi drama tình ái thì đi tới đâu (Mùa yêu 20-26 và những năm sau cưới) */
const DR_NEXT: Record<number, string> = {
  ...AFTER_YEAR,
  24: 'rf@25',
  31: 'm32_tet',
  34: 'ev@35',
  36: 'dr@38',
  38: 'm40_nguoicu',
  41: 'ev@42',
  43: 'm45_viec',
  47: 'dr@50',
  50: 'dr@53',
  53: 'dr@56',
  56: 'o60',
};

/** Số giả ngẫu nhiên cố định theo trạng thái, để quay lại ngã rẽ vẫn ra cùng kết quả */
function roll(s: Story, salt: number) {
  const n = Math.sin(s.path.length * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

const quetLabel = (y: number) => (y > 2026 ? 'Mở app ghép đôi AI' : y >= 2015 ? 'Mở app Quẹt' : y >= 2005 ? 'Lên diễn đàn kết bạn' : 'Đọc mục Tìm bạn bốn phương');
/** Độ thân ẩn số, chỉ hiện trạng thái */
export const statusOf = (s: Story, id: LoveId) =>
  s.partner === id ? (s.married ? 'Bạn đời' : 'Người yêu') : s.love[id] >= 60 ? 'Say nắng' : s.love[id] >= 40 ? 'Mập mờ' : s.love[id] >= 20 ? 'Bạn bè' : 'Mới quen';
/** người đang thân (độ thân từ 40) */
const close = (s: Story) => activeOf(s).filter((id) => s.love[id] >= 40);

/** Mỗi năm: 1 lượt tự do ở Bảng tình duyên, rồi tới ngã rẽ của tuyến tình */
function afterTurn(age: number, n: number) {
  // năm chọn trọng tâm "Yêu" thì có hai lượt ở Bảng tình duyên
  void n;
  return () => `route@${age}`;
}

/** Câu hỏi ở các mốc tuổi: dừng lại, tự viết vài dòng; cuối đời đọc lại */
const ASK: Record<number, { q: string; next: string }> = {
  15: { q: 'Người đầu tiên khiến mình đỏ mặt là ai? Vì sao?', next: 'ly@15' },
  25: { q: 'Nếu được nói một câu với người cũ, mình sẽ nói gì?', next: 'y25_traxanh' },
  50: { q: 'Có ai mình vẫn còn tiếc không?', next: 'dr@50' },
  70: { q: 'Nếu gặp lại chính mình năm hai mươi tuổi, mình sẽ dặn điều gì?', next: 'o75' },
};
function reflectScene(age: number): Scene {
  const a = ASK[age];
  return {
    id: `rf@${age}`,
    age,
    chapter: age <= 17 ? CH.teen : age < 30 ? CH.tre : age < 60 ? CH.nha : CH.gia,
    kind: 'reflect',
    bg: () => ({ place: 'phong', time: 'night' }),
    title: `${age} tuổi, dừng lại một chút`,
    text: () => ['Thời gian ngừng trôi. Một câu hỏi hiện ra, chỉ mình biết câu trả lời:', `"${a.q}"`],
    ask: () => a.q,
    choices: [{ t: 'Ghi lại', do: (fx) => fx.stat('tam', 3) }, { t: 'Để sau' }],
    next: a.next,
  };
}


/* =========================================================
   VÒNG YÊU MỚI (20-26 tuổi): chọn 3 người muốn tìm hiểu, năm tháng tua những chuyện nhỏ,
   rồi hỏi đi chơi với ai, đi đâu, làm gì, lúc về. Thỉnh thoảng có một ngã rẽ lớn của tuyến tình.
   ========================================================= */
const inPool = (x: Ctx) => (x.s.married ? (hasPartner(x) ? [P(x)] : []) : LOVE_IDS.filter((id) => x.has(`pool_${id}`) && !out(x, id)));
/** những người có thể chọn để tìm hiểu ở năm này */
export function candidatesOf(x: Ctx): LoveId[] {
  const ok = (id: LoveId) =>
    !out(x, id) &&
    (id !== 'tuananh' || x.age >= 22) &&
    (id !== 'bao' || x.age >= 21) &&
    (id !== 'tai' || x.year >= taiYear(x)) &&
    (id !== 'phong' || x.age >= 20);
  const met = LOVE_IDS.filter((id) => x.s.met.includes(id) && ok(id)).sort((a, b) => x.s.love[b] - x.s.love[a]);
  // cánh bướm: mảng hay chọn trong đời kéo đến những người hợp mảng ấy
  const t = tallyOf(x.s);
  const boost = (id: LoveId) =>
    (Object.keys(t) as AreaKey[]).reduce((n, k) => n + (AREA_PEOPLE[k].includes(id) ? t[k] * 3 : 0), 0) +
    (x.has('ac_tau') && id === 'duy' ? 8 : 0) +
    ((x.has('ac_tienganh') || x.has('ac_duhoc')) && id === 'kai' ? 6 : 0) +
    (x.has('ac_phuot') && (id === 'duy' || id === 'kai') ? 4 : 0);
  const rnd = (id: LoveId) => (LOVE_IDS.indexOf(id) * 7 + x.age + (x.s.seed ?? 0)) % 11;
  const fresh = LOVE_IDS.filter((id) => !x.s.met.includes(id) && ok(id)).sort((a, b) => boost(b) - boost(a) || rnd(a) - rnd(b));
  const list = [...met, ...fresh].slice(0, 10 - Math.max(0, x.s.met.length - met.length)).slice(0, 10);
  // luôn có ít nhất một ngôi sao trong danh sách (nếu còn ngôi sao nào hợp thời)
  if (!list.some((id) => STARS.includes(id))) {
    const st = STARS.find((id) => ok(id) && !out(x, id));
    if (st) list.splice(Math.min(list.length, 9), 1, st);
  }
  return list;
}
const needPick = (x: Ctx, age: number) =>
  !x.s.married && (age === 20 || !inPool(x).length || ((age === 23 || age === 26) && !hasPartner(x)) || ((x.has(`ac_${age - 1}_yeu`) && (x.has('ac_app') || x.has('ac_maimoi'))) && !hasPartner(x)));

function pickScene(age: number): Scene {
  return {
    id: `fo@${age}`,
    age,
    chapter: CH.tre,
    kind: 'pick',
    bg: () => ({ place: 'pho', time: 'dusk' }),
    who: () => 'he_thong',
    skip: (x) => !needPick(x, age) || !candidatesOf(x).length,
    title: age === 20 ? 'Mở khóa Mùa yêu: chọn 3 người' : 'Chọn lại những người muốn tìm hiểu',
    text: (x) => [age === 20 ? '"Đinh! 20 tuổi, Mùa yêu bắt đầu. Ký chủ chọn tối đa 3 người để tìm hiểu. Bắt cá hai tay mà bị lộ thì tự chịu."' : `"Đinh! ${x.age} tuổi rồi. Chọn lại tối đa 3 người ký chủ muốn dành thời gian."`],
    cands: (x) => candidatesOf(x),
    choices: [
      {
        t: 'Chọn xong',
        do: (fx, x) => {
          const sel = LOVE_IDS.filter((id) => x.has(`pksel_${id}`));
          // không tự chọn thì lấy hai người thân nhất và một ngôi sao (nếu có trong danh sách)
          const cs = candidatesOf(x);
          const st = cs.find((id) => STARS.includes(id));
          const auto = st && !cs.slice(0, 3).includes(st) ? [...cs.filter((id) => id !== st).slice(0, 2), st] : cs.slice(0, 3);
          const picked = (sel.length ? sel : auto).slice(0, 3);
          for (const id of LOVE_IDS) {
            fx.unflag(`pksel_${id}`);
            if (x.has(`pool_${id}`) && !picked.includes(id) && x.s.partner !== id) fx.unflag(`pool_${id}`);
          }
          for (const id of picked) (fx.flag(`pool_${id}`), fx.love(id, x.s.met.includes(id) ? 3 : 10));
          fx.say(`Năm nay ${x.me} để ý: ${picked.map((id) => x.L(id)).join(', ')}.`);
        },
      },
    ],
    next: `ht@${age}`,
  };
}

/* ---------- Hệ Thống ra nhiệm vụ mỗi năm Mùa yêu: làm được thì có thưởng, không làm thì bị phạt ---------- */
type Mission = { k: string; t: (x: Ctx, id: LoveId) => string; can: (x: Ctx, id: LoveId | undefined) => boolean; done: (x: Ctx, a: number, id: LoveId) => boolean };
const MISSIONS: Mission[] = [
  { k: 'hen', t: (x, id) => `Hẹn ${x.L(id)} đi chơi ít nhất một lần`, can: (x, id) => !!id && !x.s.married, done: (x, a, id) => x.s.path.some((p) => p.age === a && (p.scene === `date@${a}#1:${id}` || p.scene === `st1@${a}:${id}`)) },
  { k: 'say', t: (x, id) => `Làm ${x.L(id)} "say nắng" mình`, can: (x, id) => !!id && x.s.love[id] < 55 && !x.s.married, done: (x, _a, id) => x.s.love[id] >= 60 },
  { k: 'yeu', t: () => 'Có người yêu trước cuối năm', can: (x) => !hasPartner(x) && x.age >= 21, done: (x) => hasPartner(x) },
  { k: 'nha', t: () => 'Dành một năm cho gia đình (ô Gia đình)', can: () => true, done: (x, a) => x.has(`ac_${a}_nha`) },
  { k: 'dulich', t: () => 'Đi một chuyến du lịch (ô Du lịch)', can: (x) => x.s.stats.tien >= 25, done: (x, a) => x.has(`ac_${a}_dulich`) },
  { k: 'cuoi', t: (x, id) => `Cầu hôn ${x.L(id)} trong năm nay`, can: (x) => hasPartner(x) && !x.s.married && x.age >= 23 && x.age <= 26 && x.s.love[P(x)] >= 55, done: (x) => x.s.married || x.has('cauhon_hut') },
];
const missionOf = (x: Ctx, a: number) => {
  const f = x.s.flags.find((g) => g.startsWith(`htm_${a}_`));
  if (!f) return null;
  const [, , k, id] = f.split('_');
  return { m: MISSIONS.find((m) => m.k === k)!, id: id as LoveId };
};
/** nhiệm vụ năm nay (để hiện trên bảng), kèm đã xong chưa */
export const activeMission = (x: Ctx) => {
  const m = missionOf(x, x.age);
  return m ? { t: m.m.t(x, m.id), done: m.m.done(x, x.age, m.id) } : null;
};
const SNARK_OK = ['Bản Hệ Thống rơi nước mắt tự hào.', 'Ký chủ hôm nay tỏa sáng như đèn led.', 'Bản Hệ Thống ghi vào sổ vàng.'];
const SNARK_NO = ['Bản Hệ Thống thất vọng, nhưng vẫn thương ký chủ.', 'Ký chủ làm Bản Hệ Thống bạc cả mã nguồn.', 'Lần sau cố lên. Bản Hệ Thống tin ký chủ, khoảng sáu mươi phần trăm.'];

function missionScene(age: number): Scene {
  const pick = (x: Ctx) => {
    const top = inPool(x).sort((a, b) => x.s.love[b] - x.s.love[a])[0];
    const who = hasPartner(x) ? P(x) : top;
    const prev = x.s.flags.find((g) => g.startsWith(`htg_${age - 1}_`))?.split('_')[2];
    const all = MISSIONS.filter((m) => m.can(x, who) && (age >= 23 || m.k !== 'cuoi'));
    const ok = all.length > 1 ? all.filter((m) => m.k !== prev) : all;
    if (!ok.length) return null;
    // đủ thân mà chưa cưới thì Hệ Thống giục cầu hôn
    const m = ok.find((m) => m.k === 'cuoi') ?? ok[((x.s.seed ?? 0) + age * 3) % ok.length];
    return { m, id: (m.k === 'cuoi' ? P(x) : who) as LoveId };
  };
  const last = (x: Ctx) => missionOf(x, age - 1);
  /** người được "đọc tâm" khi nhận thưởng */
  const rid = (x: Ctx): LoveId | null => {
    const c = [pick(x)?.id, last(x)?.id, ...inPool(x)].find((id) => !!id && !!LOVES[id as LoveId]);
    return (c as LoveId) ?? null;
  };
  const lastOk = (x: Ctx) => {
    const l = last(x);
    return !!l && l.m.done(x, age - 1, l.id);
  };
  return {
    id: `ht@${age}`,
    age,
    chapter: CH.tre,
    who: () => 'he_thong',
    bg: () => ({ place: 'phong', time: 'night' }),
    skip: (x) => !last(x) && (x.s.married || !pick(x)),
    title: (x) => (last(x) && (x.s.married || !pick(x)) ? 'Hệ Thống chấm điểm' : 'Hệ Thống giao nhiệm vụ'),
    text: (x) => {
      const lines: string[] = [];
      const l = last(x);
      if (l) {
        const ok = lastOk(x);
        const sn = (ok ? SNARK_OK : SNARK_NO)[age % 3];
        lines.push(ok ? `"Đinh! Nhiệm vụ năm ngoái: ${l.m.t(x, l.id)}. HOÀN THÀNH. ${sn}"` : `"Đinh! Nhiệm vụ năm ngoái: ${l.m.t(x, l.id)}. THẤT BẠI. Trừ 5 điểm Vận đào hoa. ${sn}"`);
      }
      const p = pick(x);
      if (p && !x.s.married) lines.push(`"Nhiệm vụ năm ${x.age} tuổi: ${p.m.t(x, p.id)}."`);
      return lines;
    },
    choices: [
      {
        t: (x) => (lastOk(x) ? (rid(x) ? `Nhận thưởng: đọc được lòng ${x.L(rid(x)!)}` : 'Nhận thưởng: +5 Nhan sắc') : pick(x) && !x.s.married ? 'Nhận nhiệm vụ' : 'Biết rồi'),
        do: (fx, x) => {
          const np = pick(x);
          if (np && !x.s.married) (fx.flag(`htm_${age}_${np.m.k}_${np.id ?? ''}`), fx.flag(`htg_${age}_${np.m.k}`));
          const l = last(x);
          if (l) {
            if (lastOk(x)) {
              const id = rid(x);
              fx.flag(`htok_${age - 1}`);
              if (!id) return void fx.stat('duyen', 5);
              fx.love(id, 4);
              fx.say(`Đinh! Đọc tâm: ${x.L(id)} thích ${LOVES[id].likesName}. Trên đầu ${x.ay} hiện dòng chữ nhỏ: "${statusOf(x.s, id)}".`);
            } else (fx.stat('dao', -5), fx.stat('tam', -2));
          }
        },
      },
      {
        t: '"Không nhận đâu, ký chủ tự lo"',
        if: (x) => !!pick(x) && !x.s.married,
        do: (fx, x) => {
          const np = pick(x);
          if (np) fx.flag(`htg_${age}_${np.m.k}`);
          if (last(x) && !lastOk(x)) (fx.stat('dao', -5), fx.stat('tam', -2));
          if (last(x) && lastOk(x)) fx.flag(`htok_${age - 1}`);
        },
        sys: (x) => (pick(x)?.m.k === 'cuoi' ? 'Đinh! Được thôi. Chuyện cả đời thì để trái tim ký chủ tự quyết.' : 'Đinh! Bản Hệ Thống dỗi. Năm nay ký chủ tự lo nhé.'),
      },
    ],
    next: `yl@${age}`,
  };
}

/** chuyện nhỏ trong năm với những người đang tìm hiểu (tự trôi, không hỏi) */
function smallOf(x: Ctx, id: LoveId, k: number): string {
  const v = x.s.love[id];
  const m = x.year < 2004 ? 'thư' : x.year < 2012 ? 'tin nhắn' : 'tin nhắn';
  const n = x.L(id);
  const low = [
    `${n} ${x.year < 2010 ? 'gửi lời hỏi thăm qua bạn chung' : 'thả tim ảnh của mình'}.`,
    `Tình cờ gặp ${n} ở quán quen, chào nhau một câu.`,
    `${n} mượn ${x.me} cuốn sách, hẹn tuần sau trả.`,
    `Đi ngang chỗ ${n} làm, thấy ${n} đang cười với ai đó. Hơi tò mò.`,
    `${n} hỏi mượn ${x.me} cái sạc ${x.year < 2005 ? 'đèn pin' : 'điện thoại'}, rồi quên trả.`,
    `Bạn chung kể: "${n} hỏi về ${x.me} đấy."`,
  ];
  const mid = [
    `${n} gửi một ${m} lúc nửa đêm: "Ngủ chưa?"`,
    `${n} nhớ đúng món ${x.me} thích, mua mang đến tận nơi.`,
    `Đi sinh nhật bạn chung, ${n} ngồi cạnh ${x.me} cả buổi.`,
    `${x.me} ốm hai ngày. ${n} để một túi cam trước cửa, không gõ.`,
    `${n} lưu tên ${x.me} trong máy bằng một biệt danh bí mật. Hỏi mãi không chịu nói.`,
    `Đi siêu thị gặp ${n}, hai người đẩy chung một xe hàng mà không ai rủ.`,
  ];
  const high = [
    `${n} gọi điện chỉ để kể chuyện con mèo ngoài ngõ.`,
    `Trời mưa, ${n} đứng đợi ${x.me} ở cổng với chiếc áo mưa.`,
    `${n} khoe ${x.me} với bạn bè: "Đây là người tớ hay kể."`,
    `${n} đưa ${x.me} xem ảnh hồi bé của mình, cái ảnh không cho ai xem.`,
    `Hai đứa cãi nhau vì một bộ phim, rồi làm hòa bằng một bát ${x.year < 2015 ? 'chè' : 'mì cay'}.`,
    `${n} bắt đầu nói "chúng mình" thay vì "tớ với cậu".`,
  ];
  const pool = v < 25 ? low : v < 50 ? mid : high;
  return pool[(x.age * 5 + k * 2 + LOVE_IDS.indexOf(id) + (x.s.seed ?? 0)) % pool.length];
}
function yearFeed(age: number): Scene {
  return {
    id: `yl@${age}`,
    age,
    chapter: CH.tre,
    kind: 'feed',
    bg: () => ({ place: 'pho', time: 'day' }),
    title: 'Những chuyện nhỏ trong năm',
    text: () => [],
    skip: (x) => !inPool(x).length,
    feed: (x) => {
      const lines = inPool(x).map((id, k) => ({ age, year: x.year, t: smallOf(x, id, k) }));
      const news = newsOfLoves(x);
      if (news) lines.push({ age, year: x.year, t: news });
      return lines;
    },
    choices: [{ t: '▶ Sống tiếp', do: (fx, x) => inPool(x).forEach((id) => fx.love(id, 2)) }],
    next: `go@${age}`,
  };
}

/** cuối tuần đi chơi với ai */
function goScene(age: number): Scene {
  return {
    id: `go@${age}`,
    age,
    chapter: CH.tre,
    bg: () => ({ place: 'phong', time: 'day' }),
    title: (x) => (away(x) ? 'Ở xứ người, gọi về cho ai?' : 'Cuối tuần này đi chơi với ai?'),
    text: (x) =>
      away(x)
        ? [`Ca làm kết thúc lúc nửa đêm. ${x.year < 2005 ? 'Thẻ điện thoại quốc tế còn đúng mười phút.' : 'Wifi khu trọ chập chờn.'} Gọi cho ai bây giờ?`]
        : x.s.married
          ? [`Cuối tuần hiếm hoi cả hai cùng được nghỉ. ${spouseName(x)} hỏi: "Hôm nay mình làm gì?"`]
          : [inPool(x).length ? `Điện thoại có ${inPool(x).length} cuộc hẹn đang chờ trả lời.` : 'Chưa có ai để hẹn.'],
    choices: [
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `Gọi cho ${x.L(id)}`,
          loveId: id,
          if: (x) => away(x) && inPool(x).includes(id),
          do: (fx, x) => {
            fx.love(id, 5);
            fx.say(`${x.L(id)} nghe máy ngay, giọng ngái ngủ: "Bên ấy lạnh không? Ăn uống đủ chưa?"`);
          },
        }),
      ),
      { t: 'Tăng ca thêm, gửi tiền về nhà', if: (x) => away(x), do: (fx) => (fx.stat('tien', 6), fx.rel('bome', 4), fx.stat('khoe', -2)) },
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `${x.L(id)} · ${statusOf(x.s, id)} ${'♥'.repeat(Math.min(5, Math.max(1, Math.ceil(x.s.love[id] / 20))))}`,
          loveId: id,
          if: (x) => !away(x) && inPool(x).includes(id),
          do: (fx, x) => {
            // người được hẹn nhiều và đủ thân thì thành tuyến tình chính
            if (!x.s.flags.some((g) => g.startsWith('route_')) && x.s.love[id] >= 30 && !x.has(`rdone_${id}`)) fx.flag(`route_${id}`);
            if (x.s.partner && x.s.partner !== id) fx.flag(`len_${age}_1`);
          },
          // ngôi sao đủ thân: một đêm hẹn kiểu thần tượng thay cho buổi hẹn thường
          to: (x) => (starNight(x, id) ? `st1@${age}:${id}` : `date@${age}#1:${id}`),
        }),
      ),
      { t: (x) => `Đi chơi với hội bạn của ${x.s.bestie}`, if: (x) => !away(x), do: (fx) => (fx.rel('banthan', 8), fx.stat('tam', 4)) },
      { t: 'Ở nhà, ngủ một giấc thật dài', if: (x) => !away(x), do: (fx) => (fx.stat('tam', 5), fx.stat('khoe', 2)) },
    ],
    next: `route@${age}`,
  };
}

/** đủ thân mà chưa ai nói: hỏi có tỏ tình không */
function msScene(age: number): Scene {
  const top = (x: Ctx) => inPool(x).sort((a, b) => x.s.love[b] - x.s.love[a])[0];
  return {
    id: `ms@${age}`,
    age,
    chapter: CH.tre,
    bg: () => ({ place: 'congvien', time: 'night' }),
    who: (x) => top(x) ?? null,
    skip: (x) => x.s.married || hasPartner(x) || !top(x) || x.s.love[top(x)!] < 55,
    title: (x) => (x.has(`teen_yeu_${top(x)}`) ? 'Mối tình học trò, giờ đã lớn' : 'Đã đến lúc nói ra chưa?'),
    text: (x) =>
      x.has(`teen_yeu_${top(x)}`)
        ? [`Hồi cấp ba hai đứa từng "yêu" nhau bằng những mảnh giấy gấp. Rồi thi cử, mỗi người một ngả.`, `Giờ ${x.L(top(x)!)} đứng trước mặt ${x.me}, lớn hẳn, hỏi nhỏ: "Mình bắt đầu lại, nghiêm túc lần này nhé?"`]
        : [`Đi bộ về cùng ${x.L(top(x)!)}. Gió hơi lạnh. ${x.ay[0].toUpperCase() + x.ay.slice(1)} dừng lại, như chờ ${x.me} nói gì đó.`],
    choices: [
      { t: (x) => (x.has(`teen_yeu_${top(x)}`) ? 'Gật đầu, lần này là thật' : `Tỏ tình với ${x.L(top(x)!)}`), do: (fx, x) => confess(fx, x, top(x)!) },
      { t: 'Chờ thêm một chút', do: (fx, x) => fx.love(top(x)!, 2) },
    ],
    next: `ch@${age}`,
  };
}

/** cầu hôn bất kỳ năm nào từ 23 đến 26, khi đã là người yêu và đủ thân */
function proposeScene(age: number): Scene {
  return {
    id: `ch@${age}`,
    age,
    chapter: CH.tre,
    bg: (x) => (x.year < 1995 ? { place: 'congvien', time: 'night' } : { place: 'quan', time: 'night' }),
    who: (x) => P(x),
    skip: (x) => age < 23 || x.s.married || !hasPartner(x) || x.s.love[P(x)] < 62 || x.has(`ch_${age - 1}`),
    title: 'Chiếc nhẫn trong túi áo',
    text: (x) => [
      `${x.age} tuổi. Yêu ${x.L(P(x))} đủ lâu để biết ${x.ay} uống cà phê mấy thìa đường, sợ gì nhất, hay nói mớ câu gì.`,
      `Tối nay hai người ngồi ở ${spotOf(x.year)}. Trong túi áo ${x.me} có ${x.year < 2000 ? 'một chiếc nhẫn vàng ta mua ở tiệm đầu chợ' : 'một chiếc nhẫn đã chọn ba tuần'}.`,
    ],
    choices: [
      { t: (x) => `Cầu hôn ${x.L(P(x))} ngay tối nay`, do: (fx, x) => (fx.flag(`ch_${age}`), myPropose(fx, x)) },
      { t: 'Chưa vội, cứ yêu thêm đã', do: (fx, x) => (fx.flag(`ch_${age}`), fx.love(P(x), 2)) },
    ],
    next: (x) => (x.s.married && !x.has('cuoi_done') ? `tq@${age}` : `end@${age}`),
  };
}

/** trước đám cưới: hai nhà bàn sính lễ (thách cưới) */
function bridePriceScene(age: number): Scene {
  return {
    id: `tq@${age}`,
    age,
    chapter: CH.tre,
    bg: () => ({ place: 'nha', time: 'day' }),
    who: (x) => P(x),
    skip: (x) => !x.s.married || !hasPartner(x) || x.has('tq_done') || ((x.s.seed ?? 0) + age) % 3 === 0,
    title: 'Mâm quả bao nhiêu?',
    text: (x) => [
      `Hai nhà gặp nhau bàn chuyện cưới. ${x.c.gender === 'f' ? 'Nhà mình' : `Nhà ${x.L(P(x))}`} đưa ra yêu cầu: ${x.year < 2000 ? 'mười mâm quả, một đôi bông tai vàng' : x.year < 2015 ? 'hai mươi mâm quả, một cây vàng' : 'sính lễ trăm triệu, vàng cưới đủ bộ'}.`,
      'Không khí đặc quánh như cơm cháy.',
    ],
    choices: [
      { t: 'Hai đứa tự góp tiền cho đủ', do: (fx, x) => (fx.flag('tq_done'), fx.stat('tien', -16), fx.love(P(x), 8), fx.rel('bome', 4)), note: () => 'Đám hỏi đẹp như phim. Tháng sau thì hết sạch tiền.' },
      {
        t: 'Đứng ra xin bớt cho hai bên',
        do: (fx, x) => (fx.flag('tq_done'), x.s.stats.duyen >= 50 ? (fx.love(P(x), 6), fx.say('Cả hai nhà cùng cười, chốt một nửa.')) : (fx.love(P(x), -6), fx.rel('bome', -6), fx.say('Nói vụng, bên kia phật ý. Nhưng cưới thì vẫn cưới.'))),
      },
      { t: 'Thôi, không cưới nữa', do: (fx, x) => {
          const p = P(x);
          fx.flag('tq_done');
          fx.say(`${x.L(p)} lặng người. Chiếc nhẫn trả lại trong một chiếc hộp nhỏ.`);
          fx.cancelWedding();
          fx.mid('thachcuoi');
        },
      },
    ],
    next: `rv@${age}`,
  };
}

/** đêm trước đám cưới: người cũ còn thương tìm đến, và lựa chọn đổi cả người đứng cạnh mình */
function rivalScene(age: number): Scene {
  return {
    id: `rv@${age}`,
    age,
    chapter: CH.tre,
    bg: () => ({ place: 'ngo', time: 'night' }),
    who: (x) => exAtWedding(x),
    skip: (x) => !x.s.married || x.has('cuoi_done') || !exAtWedding(x) || x.s.love[exAtWedding(x)!] < 50 || ((x.s.seed ?? 0) + age) % 2 === 1,
    title: 'Đêm trước đám cưới',
    text: (x) => {
      const e = exAtWedding(x)!;
      return [
        `${x.year < 2005 ? 'Mười một giờ đêm, rạp cưới dựng xong giữa ngõ' : 'Mười một giờ đêm, váy áo cưới đã treo sẵn trên móc'}. Có người đứng ở ${regionOf(x.f.province) === 'nam' ? 'đầu hẻm' : 'đầu ngõ'}, không vào. Là ${x.L(e)}.`,
        `"${x.xung === 'anh' ? 'Anh' : 'Em'} biết là muộn rồi. Chỉ muốn hỏi một câu: nếu ${x.goi} chưa nhận lời, có khi nào là ${x.xung} không?"`,
      ];
    },
    choices: [
      {
        t: (x) => `"Mình đã chọn ${spouseName(x)} rồi. Xin lỗi."`,
        do: (fx, x) => {
          const e = exAtWedding(x)!;
          fx.say(`${x.L(e)} gật đầu, quay đi. Lần này là thật.`);
          fx.love(e, -6);
          fx.stat('tinh', 5);
        },
      },
      { t: 'Ôm một cái, chào nhau lần cuối', do: (fx, x) => { const e = exAtWedding(x)!; fx.love(e, 6); fx.flag(`omcuoi_${e}`); }, note: () => '🦋 Có những cái ôm cả đời không kể với ai.' },
      {
        t: (x) => `Bỏ lại tất cả, đi theo ${x.L(exAtWedding(x)!)}`,
        do: (fx, x) => {
          const e = exAtWedding(x)!;
          fx.cancelWedding();
          fx.partner(e);
          fx.love(e, 15);
          fx.marry();
          fx.loveEnd(x.s.stats[LOVES[e].likes] >= 55 ? `hanhphuc_${e}` : `dodang_${e}`);
          fx.rel('bome', -15);
          fx.say(`Sáng hôm sau cả họ nhốn nháo. Ba tháng sau, ${x.me} cưới ${x.L(e)}, đám cưới nhỏ, ít khách, nhưng ai cũng thấy hai người cười.`);
        },
        sys: 'Đinh! Bản Hệ Thống... bản Hệ Thống cần ngồi xuống một chút.',
      },
    ],
    next: `wd@${age}`,
  };
}

/** Trọng tâm của năm (kiểu 1 in 8 Billion): Yêu thì thêm lượt hẹn hò, chọn khác thì người yêu thấy bị bỏ bê */
const FOCUS: { k: string; t: string; d: string; do: (fx: Fx, x: Ctx) => void }[] = [
  { k: 'yeu', t: '♥ Yêu', d: 'Thêm một lượt hẹn hò, tâm sự, tặng quà', do: (fx) => fx.stat('dao', 3) },
  { k: 'hoc', t: '✎ Học thêm', d: 'Hiểu biết tăng', do: (fx) => (fx.stat('hoc', 8), fx.stat('tam', -2)) },
  { k: 'lam', t: '$ Lo sự nghiệp', d: 'Tài chính tăng', do: (fx) => (fx.stat('tien', 10), fx.flag('dilam')) },
  { k: 'nha', t: '⌂ Gia đình', d: 'Gần bố mẹ hơn', do: (fx) => (fx.rel('bome', 12), fx.stat('tinh', 3)) },
  { k: 'minh', t: '✦ Chăm bản thân', d: 'Nhan sắc, Vui vẻ tăng', do: (fx) => (fx.stat('tam', 6), fx.stat('duyen', 5)) },
];

function focusScene(age: number): Scene {
  return {
    id: `fo@${age}`,
    age,
    chapter: CH.tre,
    bg: () => ({ place: 'phong', time: 'day' }),
    who: () => 'he_thong',
    title: `Năm ${age} tuổi: dồn sức cho điều gì?`,
    text: (x) => {
      const lines = [`Năm ${x.year}. Mỗi năm chỉ có một trọng tâm.`];
      if (hasPartner(x) && !x.has(`fy_${age - 1}_yeu`) && age > 20) lines.push(`Năm ngoái ${x.L(P(x))} hay nhắn: "Dạo này bận lắm à?"`);
      const news = newsOfLoves(x);
      if (news) lines.push(news);
      return lines;
    },
    choices: FOCUS.map((f) => ({
      t: `${f.t} - ${f.d}`,
      do: (fx: Fx, x: Ctx) => {
        fx.flag(`fy_${age}_${f.k}`);
        f.do(fx, x);
        // hai năm liền không dành cho tình yêu thì người yêu buồn
        if (f.k !== 'yeu' && hasPartner(x) && !x.has(`fy_${age - 1}_yeu`) && age > 20) {
          fx.love(P(x), -8);
          fx.say(`${x.L(P(x))} bảo: "Hai năm rồi, ${x.goi} toàn bận." 🦋`);
        }
      },
    })),
    next: `hub@${age}#1`,
  };
}

/** Tỏ tình: từ 60 là thành, 50-59 thì nhờ Duyên dáng */
function confess(fx: Fx, x: Ctx, id: LoveId) {
  const v = x.s.love[id];
  const ok = v >= 60 || (v >= 50 && (x.s.stats.duyen >= 50 || x.has(`teen_yeu_${id}`)));
  if (!ok) {
    fx.love(id, -8);
    fx.say(`${x.L(id)} cười ngượng: "Cho ${x.xung} thêm thời gian nhé." Hai người chưa đủ thân.`);
    return;
  }
  const old = x.s.partner && x.s.partner !== 'xemmat' ? (x.s.partner as LoveId) : null;
  fx.partner(id);
  fx.love(id, 10);
  fx.flag(`yeu_${id}`);
  fx.say(`${x.L(id)} gật đầu. Hai người chính thức là người yêu!`);
  if (old && !isOut(x.s, old)) fx.say(`Nhưng ${x.L(old)} vẫn chưa biết chuyện này...`);
}

/* ---------- tin nhắn của từng người ---------- */
type Talk = { msgs: (x: Ctx) => string[]; good: string; ok: string };
const TALKS: Record<LoveId, Talk[]> = {
  khoi: [
    { msgs: () => ['Hôm nay đi ngang ngõ cũ.', 'Cây bàng vẫn còn đấy.'], good: '"Nhớ hồi mình trèo lên đấy không?"', ok: '"Ừ, lâu rồi nhỉ."' },
    { msgs: (x) => ['Cuối tuần về quê không?', `Mẹ ${x.lg === 'm' ? 'anh' : 'em'} hỏi thăm ${x.me} đấy.`], good: '"Về chứ, cho gửi lời thăm bác."', ok: '"Chắc không về được rồi."' },
  ],
  long: [
    { msgs: () => ['Đang ở xưởng sửa xe.', 'Tối nay đi hóng gió không?'], good: '"Đi! Chạy ra cầu nhé."', ok: '"Tối nay hơi bận."' },
    { msgs: () => ['Có đứa bảo tôi không ra gì.', 'Cậu nghĩ sao?'], good: '"Kệ họ. Tớ biết cậu thế nào."', ok: '"Thì cố gắng hơn đi."' },
  ],
  minh: [
    { msgs: () => ['Đề hôm nay khó.', 'Mà tôi làm được hết.'], good: '"Giỏi thế! Chỉ tớ câu cuối với."', ok: '"Ừ, chúc mừng."' },
    { msgs: () => ['Tôi không giỏi nói chuyện lắm.', 'Nhưng muốn nói chuyện với cậu.'], good: '"Thì cứ nói, tớ nghe."', ok: '"Ơ, sao thế?"' },
  ],
  phong: [
    { msgs: () => ['Vừa xong ca trực đêm.', 'Hôm nay ăn uống đủ chưa đấy?'], good: '"Ăn rồi, còn tập thể dục nữa cơ."', ok: '"Chưa, bận quá."' },
    { msgs: () => ['Bệnh nhân hôm nay khỏi bệnh rồi.', 'Vui ghê.'], good: '"Bác sĩ giỏi quá! Mai mời đi ăn mừng."', ok: '"Tốt quá."' },
  ],
  hai: [
    { msgs: () => ['Vừa viết xong một bài hát.', 'Muốn nghe thử không?'], good: '"Hát cho nghe đi, hát luôn bây giờ!"', ok: '"Mai nghe nhé."' },
    { msgs: () => ['Tối nay diễn ở quán quen.', 'Chừa cho một chỗ ngồi.'], good: '"Nhất định tới, ngồi bàn đầu."', ok: '"Để xem đã."' },
  ],
  tuananh: [
    { msgs: () => ['Báo cáo hôm nay làm tốt.', 'Tối nay có rảnh không?'], good: '"Rảnh. Lần này để em mời."', ok: '"Dạ, em cảm ơn sếp."' },
    { msgs: () => ['Công ty sắp mở chi nhánh mới.', 'Muốn đi cùng không?'], good: '"Muốn chứ, em tự lo được mà."', ok: '"Em chưa chắc."' },
  ],
  kai: [
    { msgs: (x) => [`Xin chào! Hôm nay tôi học được từ "${x.year >= 2016 ? 'thả thính' : 'cưa cẩm'}".`, 'Nghĩa là gì vậy?'], good: '"Là như cậu đang làm đấy!"', ok: '"Là... thôi, khó giải thích."' },
    { msgs: () => ['Cuối tuần đi Hà Giang không?', 'Tôi muốn xem ruộng bậc thang.'], good: '"Đi! Tớ làm hướng dẫn viên."', ok: '"Xa quá à."' },
  ],
  quan: [
    { msgs: () => ['Vừa quay xong.', 'Mệt nhưng muốn nhắn cho ai đó không phải người hâm mộ.'], good: '"Thì nhắn cho tớ, tớ không xin chữ ký đâu."', ok: '"Ôi, thật hả? Cho xin tấm ảnh!"' },
    { msgs: () => ['Báo vừa đăng ảnh hai đứa.', 'Có sao không?'], good: '"Kệ báo. Mình đâu làm gì sai."', ok: '"Hơi lo đấy."' },
  ],
  bao: [
    { msgs: () => ['Sếp vừa họp ba tiếng.', 'Tôi ngủ gật hai lần.'], good: '"Haha, lần sau tớ huých cho."', ok: '"Cẩn thận bị nhắc đấy."' },
    { msgs: () => ['Trưa nay ăn gì?', 'Tôi bao, hôm nay vui.'], good: '"Bún chả! Kể xem vui chuyện gì."', ok: '"Thôi, tớ mang cơm rồi."' },
  ],
  hung: [
    { msgs: () => ['Vừa diễn xong, ba vạn người hát theo.', 'Mà về khách sạn lại thấy trống trải lạ.'], good: '"Thì kể tớ nghe hôm nay thế nào. Không phải chuyện sân khấu."', ok: '"Ghê thế! Cho tớ xin vé lần sau nhé."' },
    { msgs: () => ['Mai được nghỉ một ngày.', 'Đi ăn bún ốc vỉa hè không? Tôi đội mũ, đeo khẩu trang.'], good: '"Đi! Tớ chọn quán vắng."', ok: '"Lỡ bị nhận ra thì sao?"' },
  ],
  tai: [
    { msgs: () => ['Hôm nay lại bị lên mạng chửi.', 'Bảo tôi hát quê, nói chuyện quê.'], good: '"Thì quê. Quê mà hay thì sao?"', ok: '"Kệ đi, đừng đọc bình luận nữa."' },
    { msgs: () => ['Tuần sau về quê thăm má.', 'Đi cùng không? Có vườn, có sông.'], good: '"Đi! Tớ muốn nghe cậu hát trên xuồng."', ok: '"Để tớ xem lịch đã."' },
  ],
  duy: [
    { msgs: () => ['Tôi vẫn giữ tấm vé tàu hôm ấy.', 'Lạ nhỉ.'], good: '"Tớ cũng giữ. Chắc là duyên."', ok: '"Giữ làm gì vậy?"' },
    { msgs: () => ['Hôm nay lại đi ngang ga cũ.', 'Nghĩ đến cậu.'], good: '"Lần sau gọi tớ đi cùng."', ok: '"Ừ."' },
  ],
};

function chatScene(age: number, n: number, id: LoveId): Scene {
  return {
    id: `chat@${age}#${n}:${id}`,
    age,
    chapter: CH.tre,
    kind: 'chat',
    who: () => id,
    timer: 12,
    timeout: 2,
    // 2004-2011: lượt chẵn chat ở quán net (Chat Vàng), lượt lẻ nhắn tin điện thoại
    device: (x) => (x.year >= 2004 && x.year < 2012 && n % 2 === 1 ? 'pc' : x.year < 2004 ? 'letter' : x.year < 2012 ? 'nokia' : x.year <= 2026 ? 'smart' : 'ai'),
    bg: (x) => (x.year >= 2004 && x.year < 2012 && n % 2 === 1 ? { place: 'net', time: 'night' } : { place: 'phong', time: 'night' }),
    title: (x) => (x.year >= 2004 && x.year < 2012 && n % 2 === 1 ? `Chat với ${x.L(id)} ở quán net` : `Nhắn tin với ${x.L(id)}`),
    text: (x) => [x.year < 2004 ? `Có thư của ${x.L(id)}.` : x.year < 2012 && n % 2 === 1 ? `Nick của ${x.L(id)} vừa sáng đèn.` : `${x.L(id)} vừa nhắn.`],
    msgs: (x) => TALKS[id][(age + n) % 2].msgs(x).map((t) => ({ me: false, t })),
    choices: [
      {
        t: () => TALKS[id][(age + n) % 2].good,
        do: (fx, x) => {
          fx.love(id, 12);
          fx.stat(LOVES[id].likes, 3);
          if (x.s.partner && x.s.partner !== id) fx.flag(`len_${age}_${n}`);
        },
        note: (x) => `${x.L(id)} trả lời ngay bằng một trái tim.`,
      },
      { t: () => TALKS[id][(age + n) % 2].ok, do: (fx) => fx.love(id, 4) },
      {
        t: (x) => (x.year < 2012 ? '(Không trả lời)' : '(Để "Đã xem")'),
        do: (fx) => fx.love(id, -8),
        note: (x) => `${x.L(id)} đợi mãi không thấy trả lời.`,
      },
    ],
    next: afterTurn(age, n),
  };
}

/* ---------- hẹn hò: chọn đi đâu, đúng kiểu người ấy thích thì tăng mạnh ---------- */
const DATES: Record<StatKeyLite, { t: (y: number) => string; bg: Bg }> = {
  tinh: { t: () => 'Về thăm lại chốn cũ, kể chuyện ngày xưa', bg: { place: 'ngo', time: 'dusk' } },
  noi: { t: (y) => (y < 2000 ? 'Đạp xe ra ngoại thành ngắm bình minh' : 'Chạy xe ra ngoại thành ngắm bình minh'), bg: { place: 'pho', time: 'night' } },
  hoc: { t: () => 'Đi hội sách rồi ngồi quán bàn chuyện', bg: { place: 'quan', time: 'day' } },
  tam: { t: () => 'Chạy bộ ở công viên rồi đi ăn sáng', bg: { place: 'congvien', time: 'day' } },
  duyen: { t: () => 'Đi nghe nhạc acoustic, hát tặng một bài', bg: { place: 'quan', time: 'night' } },
  tien: { t: () => 'Tự đặt bàn nhà hàng đẹp, tự trả tiền', bg: { place: 'quan', time: 'night' } },
  dao: { t: () => 'Lên chùa xin quẻ duyên', bg: { place: 'congvien', time: 'dusk' } },
};
type StatKeyLite = 'tinh' | 'noi' | 'hoc' | 'tam' | 'duyen' | 'tien' | 'dao';
const DATE_KEYS = Object.keys(DATES) as StatKeyLite[];

function dateScene(age: number, n: number, id: LoveId): Scene {
  const like = LOVES[id].likes as StatKeyLite;
  // ba lựa chọn: một cái đúng ý người ấy, hai cái khác, thứ tự đổi theo năm
  const others = DATE_KEYS.filter((k) => k !== like);
  const pick = [like, others[(age * 3 + n) % others.length], others[(age * 5 + n + 2) % others.length]];
  const uniq = Array.from(new Set(pick));
  while (uniq.length < 3) uniq.push(others.find((k) => !uniq.includes(k))!);
  const order = [0, 1, 2].map((i) => uniq[(i + age + n) % 3]);
  return {
    id: `date@${age}#${n}:${id}`,
    age,
    chapter: CH.tre,
    who: () => id,
    bg: (x) => (x.year < 2012 ? { place: 'quan', time: 'dusk' } : { place: 'quan', time: 'dusk' }),
    title: (x) => `Hẹn hò với ${x.L(id)}`,
    text: (x) => [`Cuối tuần, hẹn ${x.L(id)} (${jobOf(id, x.lg, x.age, x.year)}).`, `Đi đâu bây giờ? (★ là chỗ riêng của ${x.ay})`],
    choices: order.map(
      (k): Choice => ({
        t: (x) => DATES[k].t(x.year),
        do: (fx, x) => {
          fx.stat(k, 3);
          if (k === like) (fx.love(id, 16), fx.say(`Đúng ý ${x.L(id)}! ${x.ay[0].toUpperCase() + x.ay.slice(1)} vốn thích ${LOVES[id].likesName}.`));
          else (fx.love(id, 3), fx.say(`${x.L(id)} vui, nhưng có vẻ chưa đúng gu lắm.`));
          if (x.s.partner && x.s.partner !== id) fx.flag(`len_${age}_${n}`);
        },
      }),
    ).concat([spotChoice(age, n, id)]),
    next: `d2@${age}#${n}:${id}`,
  };
}

/* ---------- đi chỗ mới: gặp ai do lựa chọn trước đó và Vận đào hoa ---------- */
/** clip hát mộc lan truyền từ 2012; livestream phổ biến từ 2016 */
const taiYear = (x: Ctx) => (x.lg === 'm' ? 2012 : 2016);

const PLACES_MEET: { id: LoveId; ok: (x: Ctx) => boolean; title: string; bg: Bg; text: (x: Ctx) => string }[] = [
  { id: 'duy', ok: (x) => x.s.stats.dao >= 55, title: 'Chuyến tàu Tết', bg: { place: 'pho', time: 'night' }, text: (x) => `Chuyến tàu về quê ăn Tết chật cứng. Người ngồi ghế bên cạnh - ${x.L('duy')} - chia cho ${x.me} nửa gói bánh, rồi hai người nói chuyện suốt đêm.` },
  { id: 'hung', ok: (x) => x.s.stats.duyen >= 45, title: 'Hậu trường concert', bg: { place: 'pho', time: 'night' }, text: (x) =>
      x.lg === 'm'
        ? `Làm tình nguyện viên ở một concert lớn. Đi nhầm vào hậu trường, ${x.me} gặp ${x.L('hung')} - ${jobOf('hung', 'm', x.age, x.year)}, vừa bùng nổ trên sân khấu - đang ngồi một mình ăn hộp cơm nguội, điện thoại để hình nền một con capybara đội quả quýt trên đầu.`
        : `Làm tình nguyện viên ở buổi ra mắt một ${x.year < 2012 ? 'bộ phim truyền hình' : x.year < 2017 ? 'phim điện ảnh ăn khách' : 'phim trăm tỷ'}. Đi nhầm vào hậu trường, ${x.me} gặp ${x.L('hung')} - nữ diễn viên báo chí vẫn gọi là "lạnh lùng" - đang ngồi bệt dưới đất kể chuyện cười cho cả đoàn nghe.` },
  { id: 'tai', ok: (x) => x.year >= taiYear(x), title: 'Clip triệu view', bg: { place: 'vuon', time: 'dusk' }, text: (x) =>
      x.lg === 'm'
        ? `Về miền Tây chơi. Ở bến sông, ${x.me} quay lại cảnh ${x.L('tai')} - anh ca sĩ nhạc miền Tây - ngồi trên xuồng ôm cây đàn ca một bài bolero, lâu lâu vô một câu vọng cổ. Sáng hôm sau, clip ấy có một triệu lượt xem, và ${x.L('tai')} nhắn hỏi: "Bạn là người quay clip hả?"`
        : `Lướt mạng thấy ${x.L('tai')} - cô ca sĩ bolero miền Tây - livestream hát trên bến sông lúc hai giờ sáng, giọng khàn mà không chịu nghỉ. ${x.me} để lại một bình luận động viên, và ${x.L('tai')} nhắn lại thật.` },
  { id: 'phong', ok: () => true, title: 'Buổi hiến máu', bg: { place: 'vanphong', time: 'day' }, text: (x) => `Đi hiến máu ở hội trường. Người lấy máu là ${x.L('phong')}, ${x.age < 24 ? `${x.lg === 'm' ? 'anh' : 'cô'} sinh viên Y đi tình nguyện` : `${x.lg === 'm' ? 'anh bác sĩ' : 'cô bác sĩ'} trẻ`}, cười hiền: "Đừng sợ, không đau đâu."` },
  { id: 'hai', ok: () => true, title: 'Quán acoustic', bg: { place: 'quan', time: 'night' }, text: (x) => `Quán acoustic cuối phố. ${x.L('hai')} đang hát, nhìn xuống đúng chỗ ${x.me} ngồi.` },
  { id: 'kai', ok: () => true, title: 'Chuyến du lịch', bg: { place: 'congvien', time: 'day' }, text: (x) => `Đi du lịch một mình. Một người nước ngoài - ${x.L('kai')} - cầm bản đồ ngược, hỏi đường bằng tiếng Việt lơ lớ.` },
  { id: 'quan', ok: (x) => x.s.stats.duyen >= 40, title: 'Fan meeting', bg: { place: 'pho', time: 'night' }, text: (x) => `Đi fan meeting cùng ${x.s.bestie}. Cuối buổi, ngôi sao ${x.L('quan')} bất ngờ gọi đúng tên ${x.me} lên sân khấu.` },
  { id: 'tuananh', ok: (x) => x.has('dilam') || x.age >= 22, title: 'Ngày đầu ở công ty mới', bg: { place: 'vanphong', time: 'day' }, text: (x) => `Ngày đầu ở công ty mới. ${x.lg === 'm' ? 'Sếp' : 'Nữ sếp'} ${x.L('tuananh')} liếc bản báo cáo: "Làm lại. Nhưng ý tưởng tốt."` },
  { id: 'bao', ok: (x) => x.has('dilam') || x.age >= 22, title: 'Bàn làm việc bên cạnh', bg: { place: 'vanphong', time: 'day' }, text: (x) => `${x.L('bao')} ngồi bàn bên, kể chuyện cười suốt giờ nghỉ trưa đến mức cả phòng phải bịt miệng.` },
  { id: 'khoi', ok: () => true, title: 'Gặp lại người cũ', bg: { place: 'ngo', time: 'dusk' }, text: (x) => `Về ngõ cũ, gặp lại ${x.L('khoi')} - đứa trẻ nhà bên ngày nào.` },
  { id: 'long', ok: () => true, title: 'Tiệm sửa xe', bg: { place: 'pho', time: 'day' }, text: (x) => `Xe hỏng giữa đường. Thợ sửa xe là ${x.L('long')}, đứa nghịch nhất lớp năm nào.` },
  { id: 'minh', ok: () => true, title: 'Họp lớp', bg: { place: 'quan', time: 'night' }, text: (x) => `Họp lớp cấp một. ${x.L('minh')} giờ đã khác, ít lạnh lùng hơn hẳn.` },
];

/** Những nơi có thể gặp người mới: mỗi nơi ứng với một người chưa gặp */
function placesFor(x: Ctx) {
  return PLACES_MEET.filter((p) => !x.s.met.includes(p.id) && !isOut(x.s, p.id) && p.ok(x)).slice(0, 4);
}

/** Chọn đi đâu: mỗi nơi có thể gặp một người */
function exploreScene(age: number, n: number): Scene {
  return {
    id: `explore@${age}#${n}`,
    age,
    chapter: CH.tre,
    bg: () => ({ place: 'pho', time: 'day' }),
    title: 'Hôm nay đi đâu?',
    text: (x) => (placesFor(x).length ? [`${x.me} muốn ra ngoài một chút. Biết đâu lại gặp ai đó.`] : [`Đi khắp nơi rồi, chẳng còn chỗ nào lạ. Nhưng trời đẹp, lòng nhẹ.`]),
    choices: [
      ...PLACES_MEET.map(
        (p): Choice => ({
          t: () => `Đến ${p.title.toLowerCase()}`,
          if: (x) => placesFor(x).some((q) => q.id === p.id),
          do: (fx) => (fx.meet(p.id), fx.love(p.id, 8)),
          to: `meet@${age}#${n}:${p.id}`,
        }),
      ),
      { t: 'Thôi, ở nhà nghỉ ngơi', do: (fx) => fx.stat('tam', 5) },
    ],
    next: afterTurn(age, n),
  };
}

/** Cảnh gặp người mới ở nơi vừa chọn */
function meetScene(age: number, n: number, id: LoveId): Scene {
  const p = PLACES_MEET.find((q) => q.id === id)!;
  return {
    id: `meet@${age}#${n}:${id}`,
    age,
    chapter: CH.tre,
    who: () => id,
    bg: () => p.bg,
    title: p.title,
    text: (x) => [p.text(x)],
    choices: [
      { t: 'Bắt chuyện, xin cách liên lạc', do: (fx) => fx.love(id, 8), note: (x) => `${x.L(id)} lưu số của ${x.me} với một cái tên rất dễ thương.` },
      {
        t: 'Mỉm cười rồi thôi',
        do: (fx, x) => {
          if (x.s.stats.dao >= 60) (fx.love(id, 4), fx.say('Ba hôm sau lại tình cờ gặp. Vận đào hoa cao thật!'));
          else fx.love(id, -4);
        },
      },
    ],
    next: afterTurn(age, n),
  };
}

/* ---------- tặng quà: đúng gu thì thân hẳn, trúng thứ người ấy ghét thì giảm ---------- */
function giftScene(age: number, n: number, id: LoveId): Scene {
  const shelf = shelfOf(id, age, n);
  const pref = GIFT_PREF[id];
  return {
    id: `gift@${age}#${n}:${id}`,
    age,
    chapter: CH.tre,
    kind: 'gift',
    who: () => id,
    bg: () => ({ place: 'pho', time: 'day' }),
    title: (x) => `Chọn quà cho ${x.L(id)}`,
    text: (x) => [
      `${x.me} đi một vòng phố, ví còn ${x.s.stats.tien >= 60 ? 'rủng rỉnh' : x.s.stats.tien >= 30 ? 'vừa đủ' : 'mỏng dính'}.`,
      x.has(`qua_${id}_${pref.likes[0]}`) || x.has(`qua_${id}_${pref.likes[1]}`)
        ? `${x.L(id)} là người ${pref.why}.`
        : `${x.L(id)} là ${LOVES[id].kind.toLowerCase()}. Không biết ${x.ay} thích gì nhỉ?`,
    ],
    choices: [
      ...shelf.map(
        (cat): Choice => ({
          t: (x) => `${GIFT_CAT[cat].icon} ${GIFT_CAT[cat].name(x.year)}${GIFT_CAT[cat].price ? ` · -${GIFT_CAT[cat].price} Tài chính` : ' · tự tay làm'}`,
          act: 'gift',
          // quà đắt cần đủ tiền; quà tự làm cần đủ khéo và tình cảm
          if: (x) => (cat === 'handmade' ? x.s.stats.tinh >= 35 : x.s.stats.tien >= GIFT_CAT[cat].price * 3),
          do: (fx, x) => {
            if (GIFT_CAT[cat].price) fx.stat('tien', -GIFT_CAT[cat].price);
            const again = x.has(`qua_${id}_${cat}`);
            if (pref.likes.includes(cat)) {
              fx.love(id, again ? 8 : 15);
              fx.flag(`qua_${id}_${cat}`);
              fx.say(again ? `${x.L(id)} vẫn thích, nhưng lần này không còn bất ngờ như lần đầu.` : `${x.L(id)} sáng cả mắt: "Sao biết ${x.xung === 'anh' ? 'anh' : 'em'} thích cái này?" (Đã ghi vào Sổ tay: ${x.L(id)} thích ${GIFT_CAT[cat].label}.)`);
            } else if (pref.hates === cat) {
              fx.love(id, -8);
              fx.flag(`ghet_${id}_${cat}`);
              fx.say(`${x.L(id)} cười gượng, cảm ơn rất lịch sự. Có vẻ trúng đúng thứ ${x.ay} không ưa. (Sổ tay: ${x.L(id)} không thích ${GIFT_CAT[cat].label}.)`);
            } else {
              fx.love(id, 4);
              fx.say(`${x.L(id)} nhận quà, vui vẻ. Nhưng chưa phải món ${x.ay} mong nhất.`);
            }
            if (x.s.partner && x.s.partner !== id) fx.flag(`len_${age}_${n}`);
          },
        }),
      ),
      { t: 'Thôi, để lần sau', act: 'gift', do: (fx) => fx.stat('tien', 1) },
    ],
    next: afterTurn(age, n),
  };
}

function quetScene(age: number, n: number): Scene {
  return {
    id: `quet@${age}#${n}`,
    age,
    chapter: CH.tre,
    kind: 'swipe',
    bg: () => ({ place: 'phong', time: 'night' }),
    title: (x) => (x.year > 2026 ? 'Quẹt AI' : x.year >= 2015 ? 'Quẹt' : x.year >= 2010 ? 'Diễn đàn kết bạn' : 'Tìm bạn bốn phương'),
    text: (x) =>
      x.year < 2005
        ? [`Tờ báo cuối tuần có cả trang "Tìm bạn bốn phương". ${x.me} cầm bút, đọc từng mẩu nhắn.`]
        : x.year < 2015
          ? [`${x.me} lập nick trên diễn đàn kết bạn, lướt từng hồ sơ trong mục "Tìm một nửa".`]
          : [`${x.me} mở app hẹn hò. Quẹt phải là thích, quẹt trái là bỏ qua. Gói Vàng cho xem trước ai đã thích mình.`],
    cards: (x) => deckOf(x),
    choices: [
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `Match với ${x.L(id)}`,
          loveId: id,
          if: (x) => !x.s.met.includes(id) && !isOut(x.s, id),
          do: (fx) => (fx.meet(id), fx.love(id, 14)),
        }),
      ),
      // mua gói Vàng: tốn Tài chính, biết trước ai thích mình nên match chắc hơn
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `Mua gói Vàng, match với ${x.L(id)}`,
          loveId: id,
          act: 'gold',
          if: (x) => !x.s.met.includes(id) && !isOut(x.s, id),
          do: (fx, x) => (fx.stat('tien', -8), fx.meet(id), fx.love(id, 20), fx.say(`Gói Vàng cho biết ${x.L(id)} đã thích ${x.me} từ trước. Câu chào đầu tiên trúng ngay.`)),
        }),
      ),
      { t: 'Không hợp ai', do: (fx) => (fx.mid('quet'), fx.stat('tam', -4)) },
      { t: 'Mua gói Vàng mà vẫn không hợp ai', act: 'gold', do: (fx) => (fx.stat('tien', -8), fx.mid('quet'), fx.stat('tam', -6)) },
    ],
    next: afterTurn(age, n),
  };
}

function hubScene(age: number, n: number): Scene {
  const per = (id: LoveId): Choice[] => [
    { t: (x) => `Nhắn tin với ${x.L(id)}`, loveId: id, act: 'chat', if: (x) => activeOf(x.s).includes(id), to: `chat@${age}#${n}:${id}` },
    { t: (x) => `Hẹn hò với ${x.L(id)}`, loveId: id, act: 'date', if: (x) => activeOf(x.s).includes(id), to: `date@${age}#${n}:${id}` },
    { t: (x) => `Tặng quà cho ${x.L(id)}`, loveId: id, act: 'gift', if: (x) => activeOf(x.s).includes(id), to: `gift@${age}#${n}:${id}` },
    {
      t: (x) => `Tỏ tình với ${x.L(id)}`,
      loveId: id,
      act: 'confess',
      if: (x) => activeOf(x.s).includes(id) && x.s.partner !== id && x.s.love[id] >= 50 && !x.s.married,
      do: (fx, x) => confess(fx, x, id),
      to: afterTurn(age, n),
    },
    {
      t: (x) => `Buông tay ${x.L(id)}`,
      loveId: id,
      act: 'drop',
      if: (x) => activeOf(x.s).includes(id),
      do: (fx, x) => (fx.drop(id), fx.say(`${x.L(id)} rời khỏi đời ${x.me}. Có thể một ngày nào đó sẽ gặp lại.`)),
      to: afterTurn(age, n),
    },
  ];
  return {
    id: `hub@${age}#${n}`,
    age,
    chapter: CH.tre,
    kind: 'hub',
    bg: () => (n === 1 ? { place: 'pho', time: 'dusk' } : { place: 'phong', time: 'night' }),
    title: `Mùa yêu năm ${age} tuổi`,
    text: (x) => [n === 1 ? `Năm ${x.year}, lượt tự do. Hôm nay ${x.me} dành thời gian cho ai?` : `Năm nay dồn sức cho tình yêu: thêm một lượt nữa.`],
    choices: [
      ...LOVE_IDS.flatMap(per),
      { t: (x) => quetLabel(x.year), act: 'quet', if: (x) => x.s.met.length < MAX_LIFE, to: `quet@${age}#${n}` },
      { t: 'Đi chỗ mới, gặp người mới', act: 'explore', if: (x) => x.s.met.length < MAX_LIFE, to: `explore@${age}#${n}` },
      { t: 'Đi chơi với hội bạn', act: 'friends', do: (fx) => (fx.rel('banthan', 10), fx.stat('tam', 5)), to: afterTurn(age, n) },
      {
        t: 'Lo sự nghiệp',
        act: 'work',
        do: (fx, x) => {
          fx.stat('tien', 10);
          fx.stat('hoc', 3);
          fx.flag('dilam');
          // ở công ty thì dễ gặp đồng nghiệp hoặc sếp
          const w = (['bao', 'tuananh'] as LoveId[]).find((id) => !x.s.met.includes(id) && !isOut(x.s, id));
          if (w && roll(x.s, age * 7 + n) < 0.5 && x.s.met.length < MAX_LIFE) (fx.meet(w), fx.love(w, 8));
        },
        to: afterTurn(age, n),
      },
    ],
    next: afterTurn(age, n),
  };
}

/** Bị phát hiện bắt cá hai tay */
function caughtPair(s: Story): [LoveId, LoveId] | null {
  const cs = close(s).sort((a, b) => s.love[b] - s.love[a]);
  if (cs.length < 2) return null;
  const p = s.partner && s.partner !== 'xemmat' && cs.includes(s.partner as LoveId) ? (s.partner as LoveId) : cs[0];
  const other = cs.find((id) => id !== p)!;
  return [p, other];
}

function endYear(age: number): Scene {
  return {
    id: `end@${age}`,
    age,
    chapter: CH.tre,
    title: '',
    text: () => [],
    choices: [],
    skip: () => true,
    next: (x) => {
      const pair = caughtPair(x.s);
      if (!pair || x.s.married) return `dr@${age}`;
      const hasP = !!x.s.partner && x.s.partner !== 'xemmat';
      const lens = x.s.flags.filter((f) => f.startsWith(`len_${age}_`)).length;
      const risk = (hasP ? 0.35 : 0.12) + (close(x.s).length - 2) * 0.12 + lens * 0.12;
      return roll(x.s, age * 13) < risk ? `bat@${age}` : `dr@${age}`;
    },
  };
}

function caughtScene(age: number, s: Story): Scene {
  const pair = caughtPair(s) ?? (['khoi', 'long'] as [LoveId, LoveId]);
  const [a, b] = pair;
  return {
    id: `bat@${age}`,
    age,
    chapter: CH.tre,
    kind: 'chat',
    who: () => b,
    timer: 15,
    timeout: 2,
    bg: () => ({ place: 'phong', time: 'night' }),
    title: 'Bị phát hiện!',
    text: (x) => [`${x.L(a)} và ${x.L(b)} tình cờ biết nhau qua bạn chung, rồi cùng phát hiện ra ${x.me} đang ${x.year < 1998 ? 'viết thư' : 'nhắn tin'} cho cả hai. Một nhóm chat ba người vừa được tạo.`],
    msgs: (x) => [
      { me: false, t: `${x.L(a)}: Giải thích đi.` },
      { me: false, t: `${x.L(b)}: Ừ, giải thích đi.` },
      { me: false, t: `${x.L(a)}: Chọn một người.` },
    ],
    choices: [
      {
        t: (x) => `Chọn ${x.L(a)}`,
        do: (fx, x) => (fx.drop(b), fx.partner(a), fx.love(a, -10), fx.flag('caught'), fx.say(`${x.L(b)} rời nhóm chat. ${x.L(a)} tha thứ, nhưng sẽ nhớ chuyện này.`)),
        sys: 'Đinh! Ký chủ vừa bị bắt cá hai tay. Bản Hệ Thống xin phép đi lấy bỏng ngô.',
      },
      {
        t: (x) => `Chọn ${x.L(b)}`,
        do: (fx, x) => (fx.drop(a), fx.partner(b), fx.love(b, -10), fx.flag('caught'), fx.say(`${x.L(a)} chặn ${x.me} ở mọi nơi.`)),
      },
      {
        t: '"Mọi người hiểu lầm rồi!"',
        do: (fx, x) => {
          fx.flag('caught');
          if (x.s.stats.duyen >= 60) (fx.love(a, -12), fx.love(b, -12), fx.say('Nói khéo đến mức cả hai tạm tin. Thoát hiểm trong gang tấc!'));
          else (fx.drop(a), fx.drop(b), fx.mid('cacahaitay'));
        },
      },
    ],
    next: AFTER_YEAR[age],
  };
}

function dropScene(age: number): Scene {
  return {
    id: `drop@${age}`,
    age,
    chapter: CH.tre,
    who: (x) => x.s.pending,
    bg: () => ({ place: 'phong', time: 'night' }),
    title: 'Ai sẽ rời khỏi đời bạn?',
    text: (x) => [
      `${x.s.pending ? x.L(x.s.pending) : 'Một người mới'} vừa bước vào đời ${x.me}, nhưng tim chỉ đủ chỗ cho ${MAX_ACTIVE} người.`,
      `"Đinh! Bản Hệ Thống nhắc: buông ai là người ấy đi hẳn, nhưng biết đâu sau này còn gặp lại."`,
    ],
    choices: [
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `Buông ${x.L(id)} (${statusOf(x.s, id).toLowerCase()})`,
          if: (x) => activeOf(x.s).includes(id),
          do: (fx) => (fx.drop(id), fx.acceptPending()),
        }),
      ),
      { t: 'Thôi, không quen thêm ai', do: (fx) => fx.rejectPending() },
    ],
    next: (x) => x.s.resume ?? 'y27_cauhon',
  };
}

/** Cảnh drama đổi theo năm */
function dramaScene(x: Ctx): Scene {
  const s = SCENES['y22_drama'];
  const d = eraDrama(x);
  return { ...s, choices: d.choices, post: d.post ? () => d.post! : undefined, bg: () => d.bg ?? dramaBg(x) };
}

export const ageOfScene = (id: string) => {
  const m = /@(\d+)/.exec(id);
  return m ? Number(m[1]) : (SCENES[id]?.age ?? 0);
};

/** Tìm cảnh theo mã cho một nhân vật: cảnh cố định hoặc cảnh động của Mùa yêu */
export function resolverOf(c: Character, f: Family): Resolve {
  return (id, s) => {
    const age = ageOfScene(id);
    if (id === 'y22_drama') return dramaScene(ctxOf(c, f, s, 22));
    const m = /^(\w+)@(\d+)(?:#(\d))?(?::(\w+))?$/.exec(id);
    if (!m) return SCENES[id];
    const [, kind, , nn, who] = m;
    const n = Number(nn ?? 1);
    switch (kind) {
      case 'ev':
        return eraScene(age, ctxOf(c, f, s, age));
      case 'ly':
        return lyScene(age, n, ctxOf(c, f, s, age), (a) => ctxOf(c, f, s, a));
      case 'dr':
        // mùa yêu: drama hai năm một lần cho đỡ dồn dập
        if (age >= 20 && age <= 26 && age % 2 === 0) return { id: `dr@${age}`, age, chapter: CH.tre, title: '', text: () => [], choices: [], next: DR_NEXT[age] ?? 'end', skip: () => true };
        return dramaAt(age, ctxOf(c, f, s, age), DR_NEXT[age] ?? 'end');
      case 'route':
        return routeScene(age, ctxOf(c, f, s, age), `ms@${age}`);
      case 'gift':
        return giftScene(age, n, who as LoveId);
      case 'hub':
        return hubScene(age, n);
      case 'fo':
        return pickScene(age);
      case 'yl':
        return yearFeed(age);
      case 'ht':
        return missionScene(age);
      case 'go':
        return goScene(age);
      case 'ms':
        return msScene(age);
      case 'wd':
        return weddingScene(age, age === 27 ? 'y28_hethong' : age >= 28 ? 'ev@30' : `end@${age}`);
      case 'ch':
        return proposeScene(age);
      case 'tq':
        return bridePriceScene(age);
      case 'rv':
        return rivalScene(age);
      case 'rf':
        return ASK[age] ? reflectScene(age) : undefined;
      case 'chat':
        return chatScene(age, n, who as LoveId);
      case 'date':
        return dateScene(age, n, who as LoveId);
      case 'd2':
      case 'd3':
      case 'd4':
        return dateStep(Number(kind[1]) as 2 | 3 | 4, age, n, who as LoveId, afterTurn(age, n));
      case 'st1':
      case 'st2':
      case 'st3':
      case 'st4':
        return starScene(Number(kind[2]) as 1 | 2 | 3 | 4, age, who as LoveId, `route@${age}`, ctxOf(c, f, s, age));
      case 'quet':
        return quetScene(age, n);
      case 'explore':
        return exploreScene(age, n);
      case 'meet':
        return meetScene(age, n, who as LoveId);
      case 'end':
        return endYear(age);
      case 'bat':
        return caughtScene(age, s);
      case 'drop':
        return dropScene(age);
    }
    return undefined;
  };
}
