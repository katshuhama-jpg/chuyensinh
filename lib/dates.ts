/**
 * Buổi hẹn nhiều bước, như một cảnh phim:
 * 1. Đi đâu (cảnh date@ ở scenes.ts, có thêm chỗ riêng của từng người)
 * 2. Mang theo gì
 * 3. Chuyện bất ngờ giữa buổi (riêng từng người, hoặc chuyện chung theo thời kỳ)
 * 4. Lúc về: có đồng hồ, im lặng cũng là một lựa chọn
 * Mỗi buổi để lại một tấm ảnh trong album. Thân đủ thì người ấy tặng một món kỷ vật, nhiều năm sau sẽ quay lại.
 */

import type { Bg } from '@/components/Backdrop';
import { LOVES, type Choice, type Ctx, type Fx, type LoveId, type Scene } from './story';

type Flavor = {
  /** chỗ hẹn riêng của người ấy */
  spot: (y: number) => string;
  spotBg: Bg;
  /** món người ấy thích */
  bring: string;
  /** kỷ vật người ấy tặng lại */
  keep: string;
  /** chuyện bất ngờ chỉ người ấy mới có */
  oops: (x: Ctx) => string;
  /** cách gỡ hay nhất cho chuyện bất ngờ ấy */
  fix: string;
};

export const FLAVOR: Record<LoveId, Flavor> = {
  khoi: {
    spot: () => 'Về ngõ cũ, thả lại con diều',
    spotBg: { place: 'ngo', time: 'dusk' },
    bring: 'một gói ô mai như hồi bé',
    keep: 'chiếc móc khóa hình con diều',
    oops: (x) => `Bà cụ hàng xóm năm nào nhận ra hai đứa, đứng giữa ngõ kể lại chuyện ${x.me} hồi bé khóc nhè vì đứt dây diều.`,
    fix: 'Cười, kể tiếp đoạn sau của câu chuyện',
  },
  long: {
    spot: (y) => (y < 2000 ? 'Đạp xe lên đê ngắm thành phố lên đèn' : 'Phóng xe lên cầu ngắm thành phố đêm'),
    spotBg: { place: 'pho', time: 'night' },
    bring: 'một chiếc mũ bảo hiểm mới',
    keep: 'chiếc chìa khóa xe cũ',
    oops: () => 'Chú công an giao thông vẫy xe lại vì ống pô kêu to quá.',
    fix: 'Xuống xe xin lỗi, hứa mai thay ống pô',
  },
  minh: {
    spot: () => 'Thư viện, ngồi chung một bàn đến lúc đóng cửa',
    spotBg: { place: 'lop', time: 'day' },
    bring: 'cuốn sách người ấy nhắc tuần trước',
    keep: 'tờ giấy nháp có tên mình viết lẫn trong công thức',
    oops: () => 'Gặp thầy giáo cũ. Thầy nhìn hai đứa, hỏi luôn: "Bao giờ mời thầy ăn cỗ?"',
    fix: 'Nắm tay người ấy, mời thầy thật',
  },
  phong: {
    spot: () => 'Đón ca trực đêm, ăn cháo vỉa hè lúc hai giờ sáng',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'hộp cơm tự nấu',
    keep: 'chiếc bút bi in tên bệnh viện',
    oops: (x) => `Điện thoại của ${x.L('phong')} reo: bệnh viện có ca cấp cứu, cần về ngay.`,
    fix: 'Chở người ấy về viện, ngồi đợi đến sáng',
  },
  hai: {
    spot: () => 'Ngồi hàng đầu nghe người ấy hát ở quán quen',
    spotBg: { place: 'quan', time: 'night' },
    bring: 'một bộ dây đàn mới',
    keep: 'bản nhạc viết tay chưa có tên',
    oops: (x) => `Chủ quán quỵt tiền hát của ${x.L('hai')}, còn bảo "hát dở thì về".`,
    fix: 'Đứng lên vỗ tay thật to giữa quán',
  },
  tuananh: {
    spot: (y) => (y < 2005 ? 'Nhà hàng sang nhất phố, bàn cạnh cửa sổ' : 'Nhà hàng tầng thượng, đặt riêng cả sân'),
    spotBg: { place: 'quan', time: 'night' },
    bring: 'một cái bánh tự nướng, hơi cháy',
    keep: 'chiếc khuy măng-sét bạc',
    oops: (x) => `Đối tác lớn gọi cho ${x.L('tuananh')} giữa bữa. Màn hình hiện: "Hợp đồng 50 tỷ".`,
    fix: '"Nghe đi, mình đợi"',
  },
  kai: {
    spot: () => 'Đi chợ đêm, dạy người ấy mặc cả bằng tiếng Việt',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'một cuốn từ điển bỏ túi',
    keep: 'tấm bưu thiếp từ quê nhà người ấy',
    oops: (x) => `${x.L('kai')} gọi to "bánh bèo" khi muốn mua bánh bao. Cả dãy hàng cười nghiêng ngả.`,
    fix: 'Cười cùng, dạy thêm ba từ mới',
  },
  quan: {
    spot: () => 'Xem phim suất nửa đêm, rạp chỉ có hai người',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'khẩu trang và mũ lưỡi trai',
    keep: 'tấm vé xem phim có chữ ký',
    oops: () => 'Một fan nhận ra, giơ máy lên quay. Đèn flash lóe lên.',
    fix: 'Kéo người ấy chạy qua cửa sau',
  },
  bao: {
    spot: () => 'Đi hát karaoke, người ấy hát sai lời cả bài',
    spotBg: { place: 'quan', time: 'night' },
    bring: 'một túi đồ ăn vặt',
    keep: 'chiếc móc khóa con vịt',
    oops: () => 'Cả phòng ban đi liên hoan, mở nhầm cửa phòng hát. Mười cặp mắt nhìn hai người.',
    fix: '"Mời mọi người vào hát chung!"',
  },
  duy: {
    spot: () => 'Lên một chuyến tàu bất kỳ, xuống ở một ga lạ',
    spotBg: { place: 'pho', time: 'dusk' },
    bring: 'chiếc máy ảnh phim',
    keep: 'tấm vé tàu cũ',
    oops: () => 'Tàu dừng ba tiếng ở một ga vắng, không ai biết vì sao.',
    fix: 'Trải áo khoác xuống sân ga, ngồi đếm sao',
  },
  hung: {
    spot: () => 'Đội mũ kín mặt, đi ăn ốc vỉa hè',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'một món đồ chơi cho con mèo',
    keep: 'tấm ảnh chụp vội ở hậu trường',
    oops: () => 'Một tay săn ảnh nấp sau cột điện, ống kính dài như cái chày.',
    fix: 'Đứng chắn trước người ấy, đi chậm rãi',
  },
  tai: {
    spot: (y) => (y < 2015 ? 'Về miền Tây, ngồi xuồng hái trái cây' : 'Về miền Tây, ngồi xuồng livestream cho vui'),
    spotBg: { place: 'vuon', time: 'dusk' },
    bring: 'cây đàn cũ đã lên dây lại',
    keep: 'chiếc nón lá có chữ ký',
    oops: (x) => `Một nhóm anti-fan để lại bình luận ác ý ngay dưới tấm ảnh hai người vừa đăng. ${x.L('tai')} cười mà tay hơi run.`,
    fix: 'Cất điện thoại, nắm tay người ấy',
  },
};

/** chuyện bất ngờ chung, theo thời kỳ và hoàn cảnh */
const COMMON: { if: (x: Ctx) => boolean; t: (x: Ctx, id: LoveId) => string; good: string; bad: string }[] = [
  { if: () => true, t: () => 'Trời đổ mưa như trút.', good: 'Đứng chung dưới một mái hiên', bad: 'Đội mưa chạy về' },
  { if: (x) => x.year >= 1995, t: () => 'Xe hết xăng giữa đường, trạm xăng còn cách hai cây số.', good: 'Dắt bộ cùng nhau, vừa đi vừa kể chuyện', bad: 'Gọi người khác đến cứu' },
  { if: (x) => x.age <= 24, t: (x) => `${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} của ${x.me} đi chợ ngang qua, đứng sững lại.`, good: 'Kéo người ấy ra chào thật lễ phép', bad: 'Giả vờ không quen nhau' },
  { if: (x) => x.year >= 2000, t: () => 'Quán đóng cửa sớm vì mất điện cả khu phố.', good: 'Mua hai cốc nước, ngồi vỉa hè dưới trăng', bad: 'Thôi, về sớm' },
  { if: (x) => x.s.met.length >= 2, t: (x, id) => `Người cũ của ${x.L(id)} bước vào, ngồi bàn bên cạnh.`, good: 'Nói chuyện vui vẻ, như không có gì', bad: 'Đòi đổi quán ngay' },
];

const roll = (x: Ctx, salt: number) => {
  const n = Math.sin((x.s.path.length + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
};
const Up = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Cảnh hẹn hò bước 2-4. `after`: đi đâu sau buổi hẹn */
export function dateStep(step: 2 | 3 | 4, age: number, n: number, id: LoveId, after: string | ((x: Ctx) => string)): Scene {
  const F = FLAVOR[id];
  const base = { age, chapter: 'Tuổi trẻ', who: () => id as LoveId };
  const key = `${age}#${n}:${id}`;
  if (step === 2) {
    // làm gì: thỉnh thoảng có chuyện bất ngờ chen vào; đúng gu người ấy thì thân hơn hẳn
    const oops = (x: Ctx) => roll(x, age * 11 + n) < 0.35;
    const common = (x: Ctx) => {
      const ok = COMMON.filter((c) => c.if(x));
      return ok[Math.floor(roll(x, age * 17 + n) * ok.length)];
    };
    const like = LOVES[id].likes;
    const ACTS: { t: string; k: string }[] = [
      { t: 'Ngồi tâm sự chuyện nhà, chuyện cũ', k: 'tinh' },
      { t: 'Trêu nhau, chụp thật nhiều ảnh', k: 'duyen' },
      { t: 'Rủ nhau làm một trò liều', k: 'noi' },
      { t: 'Kể về ước mơ, kế hoạch sau này', k: 'hoc' },
      { t: 'Đi dạo thật chậm, không nói gì nhiều', k: 'tam' },
    ];
    const pick3 = (x: Ctx) => {
      const start = Math.floor(roll(x, age * 5 + n) * ACTS.length);
      const xs = [0, 1, 2].map((k) => ACTS[(start + k) % ACTS.length]);
      return xs.some((a) => a.k === like) ? xs : [...xs.slice(0, 2), ACTS.find((a) => a.k === like) ?? xs[2]];
    };
    return {
      ...base,
      id: `d2@${key}`,
      bg: (x) => (x.has(`dspot_${key}`) ? F.spotBg : { place: 'quan', time: 'dusk' }),
      title: 'Làm gì đây?',
      text: (x) => [oops(x) ? (roll(x, age * 3 + n) < 0.5 ? F.oops(x) : common(x).t(x, id)) : `Đến nơi rồi. ${Up(x.L(id))} nhìn ${x.me}, chờ xem hôm nay làm gì.`],
      choices: [0, 1, 2].map(
        (k): Choice => ({
          t: (x) => (oops(x) && k === 0 ? (roll(x, age * 3 + n) < 0.5 ? F.fix : common(x).good) : pick3(x)[k].t),
          do: (fx: Fx, x: Ctx) => {
            if (oops(x) && k === 0) return void (fx.love(id, 10), fx.say('Gỡ rối khéo. Người ấy nhìn mình khác hẳn.'));
            const a = pick3(x)[k];
            if (a.k === like) (fx.love(id, 12), fx.say(`Đúng gu ${x.L(id)}: ${x.ay} vốn thích ${LOVES[id].likesName}.`));
            else fx.love(id, 4);
            fx.stat(a.k as 'tinh', 2);
          },
        }),
      ),
      next: `d4@${key}`,
    };
  }
  if (step === 3) {
    const own = (x: Ctx) => roll(x, age * 11 + n) < 0.5;
    const common = (x: Ctx) => {
      const ok = COMMON.filter((c) => c.if(x));
      return ok[Math.floor(roll(x, age * 17 + n) * ok.length)];
    };
    return {
      ...base,
      id: `d3@${key}`,
      bg: (x) => (x.has(`dspot_${key}`) ? F.spotBg : { place: 'quan', time: 'dusk' }),
      title: 'Giữa buổi hẹn',
      text: (x) => [own(x) ? F.oops(x) : common(x).t(x, id)],
      choices: [
        {
          t: (x) => (own(x) ? F.fix : common(x).good),
          do: (fx, x) => {
            const rainy = !own(x) && common(x) === COMMON[0];
            fx.love(id, rainy && x.has(`do_${key}`) ? 12 : 8);
            if (rainy && x.has(`do_${key}`)) fx.say('May mà mang ô. Hai người đi chung một chiếc, vai ướt một bên.');
          },
        },
        { t: (x) => (own(x) ? 'Lúng túng, không biết làm gì' : common(x).bad), do: (fx) => fx.love(id, -5) },
      ],
      next: `d4@${key}`,
    };
  }
  return {
    ...base,
    id: `d4@${key}`,
    bg: () => ({ place: 'pho', time: 'night' }),
    title: 'Lúc về',
    timer: 10,
    timeout: 2,
    text: (x) => [`Đến đầu ngõ nhà ${x.me}. ${x.L(id)} dừng lại, chưa muốn về.`],
    choices: [
      {
        t: 'Nắm tay người ấy',
        do: (fx, x) => {
          const ok = x.s.love[id] >= 45;
          fx.love(id, ok ? 8 : -3);
          if (!ok) fx.say(`${x.L(id)} rụt tay lại, cười ngượng. Hơi sớm.`);
          snap(fx, x, id, key, ok ? 'Hai bàn tay nắm lấy nhau ở đầu ngõ.' : 'Một cái nắm tay hơi vội.');
        },
      },
      {
        t: 'Nói thật lòng một điều',
        do: (fx, x) => {
          const ok = x.s.stats.tinh >= 45 || x.s.love[id] >= 55;
          fx.love(id, ok ? 10 : 2);
          fx.stat('tinh', 3);
          snap(fx, x, id, key, ok ? `"Hôm nay vui nhất năm." - ${x.me}` : 'Câu nói ngập ngừng, nhưng thật.');
        },
      },
      {
        t: '(Im lặng, nhìn nhau)',
        do: (fx, x) => {
          fx.love(id, 4);
          snap(fx, x, id, key, 'Không ai nói gì. Không cần nói gì.');
        },
      },
    ],
    next: after,
  };
}

/** chụp ảnh buổi hẹn; thân đủ thì nhận kỷ vật (chỉ một lần mỗi người) */
function snap(fx: Fx, x: Ctx, id: LoveId, key: string, line: string) {
  const F = FLAVOR[id];
  const place = x.has(`dspot_${key}`) ? F.spot(x.year) : 'Buổi hẹn cuối tuần';
  fx.photo({ who: id, place, bg: x.has(`dspot_${key}`) ? F.spotBg : { place: 'quan', time: 'dusk' }, line });
  fx.say('▣ Một tấm ảnh vừa vào album kỷ niệm.');
  if (x.s.love[id] >= 55 && !x.has(`kv_${id}`)) {
    fx.flag(`kv_${id}`);
    fx.say(`${x.L(id)} dúi vào tay ${x.me} ${F.keep}. 🦋 Món này sẽ còn quay lại.`);
  }
}

/** Chỗ hẹn riêng của người ấy, thêm vào bước 1 */
export const spotChoice = (age: number, n: number, id: LoveId): Choice => ({
  // phải quen một chút mới biết chỗ người ấy thích
  if: (x) => x.s.love[id] >= 25,
  t: (x) => `${FLAVOR[id].spot(x.year)} ★`,
  do: (fx, x) => {
    fx.flag(`dspot_${age}#${n}:${id}`);
    fx.love(id, 12);
    fx.say(`Chỗ ${x.L(id)} thích nhất. ${Up(x.ay)} cười suốt buổi.`);
    if (x.s.partner && x.s.partner !== id) fx.flag(`len_${age}_${n}`);
  },
});

/** Tên người ấy thích gì (để Hệ Thống nhắc) */
export const likesOf = (id: LoveId) => LOVES[id].likesName;
