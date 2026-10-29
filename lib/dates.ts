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
import { regionOf } from './names';

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
  /** lúc về: nơi chia tay sau buổi ở chỗ riêng, câu tạm biệt chỉ người ấy mới có, và dòng ảnh */
  bye: { where: string; t: string; line: string };
};

export const FLAVOR: Record<LoveId, Flavor> = {
  khoi: {
    spot: () => 'Về ngõ cũ, thả lại con diều',
    spotBg: { place: 'ngo', time: 'dusk' },
    bring: 'một gói ô mai như hồi bé',
    keep: 'chiếc móc khóa hình con diều',
    oops: (x) => `Bà cụ hàng xóm năm nào nhận ra hai đứa, đứng giữa ngõ kể lại chuyện ${x.me} hồi bé khóc nhè vì đứt dây diều.`,
    fix: 'Cười, kể tiếp đoạn sau của câu chuyện',
    bye: { where: 'cây bàng đầu ngõ cũ', t: 'Ngoắc ngón út: "Mai thả diều tiếp nhé"', line: 'Người ấy ngoắc lại, y như năm sáu tuổi.' },
  },
  long: {
    spot: (y) => (y < 2000 ? 'Đạp xe lên đê ngắm thành phố lên đèn' : 'Phóng xe lên cầu ngắm thành phố đêm'),
    spotBg: { place: 'pho', time: 'night' },
    bring: 'một chiếc mũ bảo hiểm mới',
    keep: 'chiếc chìa khóa xe cũ',
    oops: () => 'Chú công an giao thông vẫy xe lại vì ống pô kêu to quá.',
    fix: 'Xuống xe xin lỗi, hứa mai thay ống pô',
    bye: { where: 'bên chiếc xe còn nóng máy', t: 'Tháo mũ bảo hiểm, vuốt lại tóc cho người ấy', line: 'Người ấy đứng im, tai đỏ ửng.' },
  },
  minh: {
    spot: () => 'Thư viện, ngồi chung một bàn đến lúc đóng cửa',
    spotBg: { place: 'lop', time: 'day' },
    bring: 'cuốn sách người ấy nhắc tuần trước',
    keep: 'tờ giấy nháp có tên mình viết lẫn trong công thức',
    oops: () => 'Gặp thầy giáo cũ. Thầy nhìn hai đứa, hỏi luôn: "Bao giờ mời thầy ăn cỗ?"',
    fix: 'Nắm tay người ấy, mời thầy thật',
    bye: { where: 'trước cổng thư viện đã tắt đèn', t: 'Đưa tờ giấy: "Giải hộ bài này", trong là số điện thoại', line: 'Người ấy đọc xong, đẩy gọng kính, cười không giấu được.' },
  },
  phong: {
    spot: () => 'Đón ca trực đêm, ăn cháo vỉa hè lúc hai giờ sáng',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'hộp cơm tự nấu',
    keep: 'chiếc bút bi in tên bệnh viện',
    oops: (x) => `Điện thoại của ${x.L('phong')} reo: bệnh viện có ca cấp cứu, cần về ngay.`,
    fix: 'Chở người ấy về viện, ngồi đợi đến sáng',
    bye: { where: 'trước cổng bệnh viện, ca trực sắp bắt đầu', t: 'Dặn: "Nhớ ăn trước khi trực"', line: 'Người ấy gật đầu. Lâu lắm rồi mới có người dặn câu ấy.' },
  },
  hai: {
    spot: () => 'Ngồi hàng đầu nghe người ấy hát ở quán quen',
    spotBg: { place: 'quan', time: 'night' },
    bring: 'một bộ dây đàn mới',
    keep: 'bản nhạc viết tay chưa có tên',
    oops: (x) => `Chủ quán quỵt tiền hát của ${x.L('hai')}, còn bảo "hát dở thì về".`,
    fix: 'Đứng lên vỗ tay thật to giữa quán',
    bye: { where: 'dưới mái hiên quán hát', t: 'Xin người ấy hát nốt đoạn điệp khúc', line: 'Giữa phố đêm, người ấy hát nhỏ, vừa đủ cho hai người nghe.' },
  },
  tuananh: {
    spot: (y) => (y < 2005 ? 'Nhà hàng sang nhất phố, bàn cạnh cửa sổ' : 'Nhà hàng tầng thượng, đặt riêng cả sân'),
    spotBg: { place: 'quan', time: 'night' },
    bring: 'một cái bánh tự nướng, hơi cháy',
    keep: 'chiếc khuy măng-sét bạc',
    oops: (x) => `Đối tác lớn gọi cho ${x.L('tuananh')} giữa bữa. Màn hình hiện: "Hợp đồng 50 tỷ".`,
    fix: '"Nghe đi, mình đợi"',
    bye: { where: 'dưới sảnh tòa văn phòng', t: 'Tắt điện thoại của người ấy: "Hết giờ làm rồi"', line: 'Người ấy ngẩn ra, rồi cười như vừa được nghỉ phép.' },
  },
  kai: {
    spot: () => 'Đi chợ đêm, dạy người ấy mặc cả bằng tiếng Việt',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'một cuốn từ điển bỏ túi',
    keep: 'tấm bưu thiếp từ quê nhà người ấy',
    oops: (x) => `${x.L('kai')} gọi to "bánh bèo" khi muốn mua bánh bao. Cả dãy hàng cười nghiêng ngả.`,
    fix: 'Cười cùng, dạy thêm ba từ mới',
    bye: { where: 'trước cửa khu trọ của người ấy', t: 'Dạy thêm một chữ: "Thương"', line: 'Người ấy nhắc lại sai dấu ba lần. Lần thứ tư thì đúng.' },
  },
  quan: {
    spot: () => 'Xem phim suất nửa đêm, rạp chỉ có hai người',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'khẩu trang và mũ lưỡi trai',
    keep: 'tấm vé xem phim có chữ ký',
    oops: () => 'Một fan nhận ra, giơ máy lên quay. Đèn flash lóe lên.',
    fix: 'Kéo người ấy chạy qua cửa sau',
    bye: { where: 'dưới hầm gửi xe, nơi không có ống kính', t: 'Kéo khẩu trang người ấy xuống một chút', line: 'Chỉ vài giây thôi, nhưng là gương mặt thật, không phải trên màn ảnh.' },
  },
  bao: {
    spot: () => 'Đi hát karaoke, người ấy hát sai lời cả bài',
    spotBg: { place: 'quan', time: 'night' },
    bring: 'một túi đồ ăn vặt',
    keep: 'chiếc móc khóa con vịt',
    oops: () => 'Cả phòng ban đi liên hoan, mở nhầm cửa phòng hát. Mười cặp mắt nhìn hai người.',
    fix: '"Mời mọi người vào hát chung!"',
    bye: { where: 'trước cổng công ty, bác bảo vệ đang ngủ gật', t: 'Kể một câu chuyện cười dở tệ', line: 'Người ấy cười to đến mức bác bảo vệ giật mình tỉnh dậy.' },
  },
  duy: {
    spot: () => 'Lên một chuyến tàu bất kỳ, xuống ở một ga lạ',
    spotBg: { place: 'pho', time: 'dusk' },
    bring: 'chiếc máy ảnh phim',
    keep: 'tấm vé tàu cũ',
    oops: () => 'Tàu dừng ba tiếng ở một ga vắng, không ai biết vì sao.',
    fix: 'Trải áo khoác xuống sân ga, ngồi đếm sao',
    bye: { where: 'trên sân ga, tàu sắp chạy', t: 'Ghi số điện thoại lên mặt sau tấm vé', line: 'Người ấy cất vé vào túi áo ngực, chỗ gần tim.' },
  },
  hung: {
    spot: () => 'Đội mũ kín mặt, đi ăn ốc vỉa hè',
    spotBg: { place: 'pho', time: 'night' },
    bring: 'một bó cỏ tươi cho bé capybara Bơ',
    keep: 'tấm ảnh chụp vội ở hậu trường',
    oops: () => 'Một tay săn ảnh nấp sau cột điện, ống kính dài như cái chày.',
    fix: 'Đứng chắn trước người ấy, đi chậm rãi',
    bye: { where: 'ở cửa sau, xe quản lý đang đợi', t: 'Dúi bó cỏ cho bé Bơ vào tay người ấy', line: '"Bơ sẽ thích lắm." Rồi người ấy quay lại ôm vội một cái.' },
  },
  tai: {
    spot: (y) => (y < 2015 ? 'Về miền Tây, ngồi xuồng hái trái cây' : 'Về miền Tây, ngồi xuồng livestream cho vui'),
    spotBg: { place: 'vuon', time: 'dusk' },
    bring: 'cây đàn cũ đã lên dây lại',
    keep: 'chiếc nón lá có chữ ký',
    oops: (x) => `Một nhóm anti-fan để lại bình luận ác ý ngay dưới tấm ảnh hai người vừa đăng. ${x.L('tai')} cười mà tay hơi run.`,
    fix: 'Cất điện thoại, nắm tay người ấy',
    bye: { where: 'trên bến sông, xuồng vừa cập', t: 'Hát một câu vọng cổ, lạc nhịp', line: 'Người ấy hát nối câu sau, đúng nhịp, giọng ấm như nắng chiều.' },
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
    // cách gỡ rối không phải lúc nào cũng nằm đầu
    const fixAt = (x: Ctx) => Math.floor(roll(x, age * 23 + n) * 3);
    return {
      ...base,
      id: `d2@${key}`,
      bg: (x) => (x.has(`dspot_${key}`) ? F.spotBg : { place: 'quan', time: 'dusk' }),
      title: 'Làm gì đây?',
      text: (x) => [oops(x) ? (roll(x, age * 3 + n) < 0.5 ? F.oops(x) : common(x).t(x, id)) : `Đến nơi rồi. ${Up(x.L(id))} nhìn ${x.me}, chờ xem hôm nay làm gì.`],
      choices: [0, 1, 2].map(
        (k): Choice => ({
          t: (x) => (oops(x) && k === fixAt(x) ? (roll(x, age * 3 + n) < 0.5 ? F.fix : common(x).good) : pick3(x)[k].t),
          do: (fx: Fx, x: Ctx) => {
            if (oops(x) && k === fixAt(x)) return void (fx.love(id, 10), fx.say('Gỡ rối khéo. Người ấy nhìn mình khác hẳn.'));
            const a = pick3(x)[k];
            if (a.k === like) (fx.love(id, 12), fx.say(`${x.L(id)} vui ra mặt. Đúng kiểu ${x.ay} thích.`));
            else fx.love(id, 4);
            fx.stat(a.k as 'tinh', 2);
          },
        }),
      ),
      // không có chuyện bất ngờ lúc làm gì thì thỉnh thoảng có ở giữa buổi
      next: (x) => (!oops(x) && roll(x, age * 19 + n) < 0.3 ? `d3@${key}` : `d4@${key}`),
    };
  }
  if (step === 3) {
    const own = (x: Ctx) => roll(x, age * 29 + n) < 0.5;
    const goodAt = (x: Ctx) => (roll(x, age * 31 + n) < 0.5 ? 0 : 1);
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
      choices: [0, 1].map(
        (k): Choice => ({
          t: (x) => (k === goodAt(x) ? (own(x) ? F.fix : common(x).good) : own(x) ? 'Lúng túng, không biết làm gì' : common(x).bad),
          do: (fx, x) => {
            if (k !== goodAt(x)) return void fx.love(id, -5);
            fx.love(id, 8);
            fx.say(`${Up(x.L(id))} nhìn ${x.me}, như vừa thấy thêm một điều đáng quý.`);
          },
        }),
      ),
      next: `d4@${key}`,
    };
  }
  /** nơi chia tay: sau chỗ riêng của người ấy thì ở chỗ ấy, không thì ở đầu ngõ (miền Nam: đầu hẻm, quê: cổng nhà) */
  const where = (x: Ctx) => (x.has(`dspot_${key}`) ? F.bye.where : `${regionOf(x.f.province) === 'nam' ? 'đầu hẻm' : x.f.urban ? 'đầu ngõ' : 'cổng'} nhà ${x.me}`);
  const opts: Choice[] = [
    {
      t: 'Nắm tay người ấy',
      do: (fx, x) => {
        const ok = x.s.love[id] >= 45;
        fx.love(id, ok ? 8 : -3);
        if (!ok) fx.say(`${x.L(id)} rụt tay lại, cười ngượng. Hơi sớm.`);
        snap(fx, x, id, key, ok ? `Hai bàn tay nắm lấy nhau ở ${where(x)}.` : 'Một cái nắm tay hơi vội.');
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
    {
      // câu tạm biệt chỉ người ấy mới có: phải hiểu người ấy một chút mới nghĩ ra
      t: () => F.bye.t,
      do: (fx, x) => {
        const ok = x.s.love[id] >= 40;
        fx.love(id, ok ? 12 : 5);
        if (ok) fx.flag(`bye_${id}`);
        snap(fx, x, id, key, ok ? F.bye.line : 'Hơi vội, nhưng người ấy vẫn nhớ.');
      },
    },
  ];
  // thứ tự đổi theo từng buổi hẹn, để không có "đáp án đúng" luôn ở một chỗ
  const r = (age * 7 + n * 3 + Object.keys(FLAVOR).indexOf(id)) % opts.length;
  const order = opts.map((_, i) => opts[(i + r) % opts.length]);
  return {
    ...base,
    id: `d4@${key}`,
    bg: () => ({ place: 'pho', time: 'night' }),
    title: 'Lúc về',
    timer: 10,
    // hết giờ thì coi như im lặng
    timeout: order.indexOf(opts[2]),
    text: (x) => [`Đến ${where(x)}. ${x.L(id)} dừng lại, chưa muốn về.`],
    choices: order,
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
    // chỗ riêng chỉ thật sự có nghĩa khi đã đủ thân
    if (x.s.love[id] >= 40) (fx.love(id, 12), fx.say(`Chỗ ${x.L(id)} thích nhất. ${Up(x.ay)} cười suốt buổi.`));
    else (fx.love(id, 5), fx.say(`${x.L(id)} hơi bất ngờ: "Sao biết chỗ này?" Vui, nhưng còn ngại.`));
    if (x.s.partner && x.s.partner !== id) fx.flag(`len_${age}_${n}`);
  },
});

/** Tên người ấy thích gì (để Hệ Thống nhắc) */
export const likesOf = (id: LoveId) => LOVES[id].likesName;
