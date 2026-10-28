/**
 * Mỗi năm một chuyện (kiểu 1 in 8 Billion): từ 3 đến 19 tuổi, năm nào cũng có một tình huống nhỏ,
 * rút từ kho chuyện đời thường kiểu Việt theo tuổi, thời kỳ, quê, gia cảnh.
 * Tuổi thơ là trò chơi, Tết, Trung thu, cổng trường; tuổi teen là cảm nắng: ngồi cùng bàn, thư tay,
 * hạc giấy, Valentine, tin nhắn nửa đêm, trú mưa chung mái hiên, lưu bút.
 * Mỗi chuyện chỉ gặp một lần, thứ tự xáo theo từng đời nên mỗi lần chơi mở đầu một khác.
 */

import type { Bg } from '@/components/Backdrop';
import type { Choice, Ctx, Fx, LoveId, Scene } from './story';
import { regionOf } from './names';

type Life = {
  id: string;
  min: number;
  max: number;
  from?: number;
  to?: number;
  if?: (x: Ctx) => boolean;
  title: string | ((x: Ctx) => string);
  bg: (x: Ctx) => Bg;
  who?: Scene['who'];
  text: (x: Ctx) => string[];
  choices: Choice[];
  kind?: Scene['kind'];
  msgs?: Scene['msgs'];
  post?: Scene['post'];
  timer?: number;
  timeout?: number;
};

/* ---------- tiện ích ---------- */
const SOUTH = ['TP. Hồ Chí Minh', 'Cần Thơ', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang'];
const south = (x: Ctx) => SOUTH.includes(x.f.province);
const Mom = (x: Ctx) => (x.mom === 'mẹ' ? 'Mẹ' : 'Bà');
const Bm = (x: Ctx) => (x.bm === 'ông bà' ? 'Ông bà' : 'Bố mẹ');
const isF = (x: Ctx) => x.c.gender === 'f';
/** người đang cảm nắng: thân nhất trong đám bạn học (Khôi, Long, Minh) */
const crush = (x: Ctx): LoveId => {
  const ids = (['khoi', 'long', 'minh'] as LoveId[]).filter((id) => !x.has(`${id}_out`));
  const met = ids.filter((id) => x.s.met.includes(id));
  const pool = met.length ? met : ids;
  return pool.sort((a, b) => x.s.love[b] - x.s.love[a])[0] ?? 'khoi';
};
const C = (x: Ctx) => x.L(crush(x));
const cw = () => (x: Ctx) => crush(x);
const snack = (y: number) => (y < 1995 ? 'kẹo kéo, bánh đa kê' : y < 2008 ? 'bò bía, kem mút, ô mai' : y < 2020 ? 'xiên bẩn, trà chanh' : 'bánh tráng trộn, trà sữa');
const cartoon = (y: number) => (y < 1995 ? 'phim hoạt hình Liên Xô trên tivi đen trắng' : y < 2008 ? 'Tom và Jerry' : y < 2018 ? 'Doraemon' : y <= 2026 ? 'phim hoạt hình trên YouTube' : 'phim hoạt hình chiếu nổi');
const ride = (y: number) => (y < 1993 ? 'xe đạp Phượng Hoàng' : y < 2003 ? 'xe Cub' : y < 2012 ? 'xe Wave' : y <= 2026 ? 'xe ga' : 'xe điện');
const play = (y: number) => (y < 2005 ? 'ô ăn quan, nhảy dây, bắn bi' : y < 2015 ? 'đá bóng, chơi game trên máy tính' : 'game trên điện thoại');
const msg = (y: number) => (y < 2004 ? 'mảnh giấy gấp tư' : y < 2012 ? 'tin nhắn điện thoại' : 'tin nhắn Chat');
const bg = (place: Bg['place'], time: Bg['time'] = 'day', tet?: boolean) => () => ({ place, time, tet }) as Bg;
/** bạn cùng lớp không phải người yêu, tên đổi theo từng đời (để không phải lúc nào cũng là Minh, Long) */
const KIDS = { f: ['Hoa', 'Lan', 'Trang', 'Ngân', 'Hằng', 'Yến', 'Thủy', 'Nhung', 'Quỳnh', 'Mai'], m: ['Tùng', 'Dũng', 'Hùng', 'Nam', 'Tuấn', 'Đạt', 'Quang', 'Sơn', 'Hiếu', 'Bình'] };
const kid = (x: Ctx, salt: string) => {
  const h = hash(`${x.s.seed ?? 0}|${salt}`);
  const list = h % 2 ? KIDS.f : KIDS.m;
  return list[(h >>> 3) % list.length];
};

/* =========================================================
   3-5 TUỔI: những ký ức đầu tiên (mở đầu mỗi đời một khác)
   ========================================================= */
const SMALL: Life[] = [
  {
    id: 'thoinoi',
    min: 1,
    max: 1,
    title: 'Thôi nôi: bốc đồ đoán nghề',
    bg: bg('nha', 'day'),
    who: () => 'mom',
    text: (x) => [`Tròn một tuổi. Cả họ bày một mâm đồ trước mặt ${x.me}: cây bút, xấp tiền, cái gương, ${x.year < 2000 ? 'cái đài' : 'cái micro'}, cuốn sách. Bốc được gì, lớn lên làm nghề nấy.`],
    choices: [
      { t: 'Bốc cây bút', do: (fx) => fx.stat('hoc', 6), note: () => 'Bà nội bảo: "Sau này làm thầy giáo."' },
      { t: 'Bốc xấp tiền', do: (fx) => fx.stat('tien', 6), note: () => 'Cả họ cười: "Sau này giàu to."' },
      { t: 'Bốc cái gương', do: (fx) => fx.stat('duyen', 6), note: () => '"Sau này đẹp nhất xóm."' },
      { t: (x) => `Bốc ${x.year < 2000 ? 'cái đài' : 'cái micro'}`, do: (fx) => (fx.stat('duyen', 3), fx.stat('noi', 3)), note: () => '"Sau này làm ca sĩ!"' },
      { t: 'Ôm cả mâm vào lòng', do: (fx) => fx.stat('dao', 6), note: () => '"Đứa này tham, sau này cái gì cũng muốn."' },
    ],
  },
  {
    id: 'maugiao',
    min: 3,
    max: 4,
    title: 'Ngày đầu đi mẫu giáo',
    bg: bg('cong'),
    who: () => 'mom',
    text: (x) => [`${Mom(x)} dắt ${x.me} đến cổng trường mẫu giáo. Cô giáo chìa tay ra đón. Bên trong, một đứa đang khóc to nhất lớp.`],
    choices: [
      { t: 'Bám chặt cổng, khóc to hơn', do: (fx) => (fx.stat('tinh', 4), fx.rel('bome', 4)), note: (x) => `${Mom(x)} đứng ngoài cổng đến trưa mới về.` },
      { t: 'Chạy vào dỗ đứa đang khóc', do: (fx) => (fx.stat('tinh', 6), fx.stat('duyen', 3)), note: () => 'Hai đứa thành bạn ngay hôm ấy.' },
      { t: 'Đi thẳng vào, không ngoái lại', do: (fx) => fx.stat('noi', 6) },
    ],
  },
  {
    id: 'lixi',
    min: 3,
    max: 6,
    title: 'Tết đầu tiên còn nhớ',
    bg: bg('nha', 'day', true),
    text: (x) => [`Sáng mùng một, ${x.me} được mừng tuổi ${x.year < 1995 ? 'mấy tờ tiền mới cứng' : x.year < 2015 ? 'mấy phong bao đỏ' : 'cả phong bao lẫn tiền chuyển khoản vào tài khoản của mẹ'}.`, `${Mom(x)} xòe tay: "Đưa mẹ giữ cho."`],
    choices: [
      { t: (x) => `Đưa hết cho ${x.mom}`, do: (fx) => (fx.rel('bome', 6), fx.stat('tien', -2)), note: (x) => `Hai mươi năm sau vẫn chưa thấy ${x.mom} trả.` },
      { t: 'Giấu một bao dưới gối', do: (fx) => (fx.stat('tien', 4), fx.stat('noi', 3)) },
      { t: 'Chạy ra ngõ mua bóng bay', do: (fx) => (fx.stat('tam', 5), fx.stat('dao', 2)) },
    ],
  },
  {
    id: 'cotich',
    min: 3,
    max: 5,
    title: 'Chuyện cổ tích trước giờ ngủ',
    bg: bg('phong', 'night'),
    who: () => 'mom',
    text: (x) => [`${x.bm === 'ông bà' ? 'Bà' : x.year > 2026 ? 'Trợ lý AI' : 'Bà nội'} kể chuyện cổ tích. ${x.me} nằm nghe, mắt díp lại mà vẫn đòi nghe thêm.`],
    choices: [
      { t: '"Kể chuyện Tấm Cám đi bà"', do: (fx) => (fx.stat('tinh', 5), fx.stat('noi', 2)) },
      { t: '"Kể chuyện Sọ Dừa lấy vợ đi"', do: (fx) => (fx.stat('dao', 5), fx.stat('duyen', 2)), note: () => 'Từ bé đã tin xấu xí bên ngoài cũng có thể là người tốt.' },
      { t: '"Kể chuyện Thánh Gióng đánh giặc"', do: (fx) => fx.stat('noi', 5) },
    ],
  },
  {
    id: 'dicho',
    min: 3,
    max: 5,
    title: 'Lạc giữa chợ',
    bg: bg('pho'),
    text: (x) => [`Đi chợ với ${x.mom}, ${x.me} mải nhìn hàng bóng bay rồi quay lại thì không thấy ai. Chợ đông như kiến.`],
    choices: [
      { t: (x) => `Đứng im một chỗ như ${x.mom} dặn`, do: (fx) => (fx.stat('hoc', 4), fx.stat('tam', 3)), note: (x) => `Năm phút sau ${x.mom} chạy đến, ôm chặt.` },
      { t: 'Khóc to cho cả chợ nghe', do: (fx) => fx.stat('duyen', 3), note: () => 'Cô bán rau dắt về tận nhà, còn cho thêm mớ hành.' },
      { t: 'Tự tìm đường về', do: (fx) => (fx.stat('noi', 6), fx.rel('bome', -3)), note: () => 'Về đến ngõ thì cả nhà đang đi tìm khắp nơi.' },
    ],
  },
  {
    id: 'hoathinh',
    min: 3,
    max: 6,
    title: 'Giờ phim hoạt hình',
    bg: bg('nha', 'dusk'),
    text: (x) => [`Sáu giờ chiều là giờ ${cartoon(x.year)}. ${x.year < 1995 ? 'Cả xóm kéo sang nhà có tivi.' : 'Cả nhà muốn xem thời sự.'}`],
    choices: [
      { t: 'Ăn vạ đòi xem hết phim', do: (fx) => (fx.stat('noi', 4), fx.rel('bome', -2)) },
      { t: (x) => `Ngồi ngoan chờ ${x.bm === 'ông bà' ? 'ông' : 'bố'} xem xong`, do: (fx) => (fx.stat('tinh', 3), fx.rel('bome', 4)) },
      { t: 'Ra ngõ chơi với trẻ con nhà bên', do: (fx) => (fx.love('khoi', 6), fx.stat('duyen', 2)), note: (x) => `Đứa trẻ nhà bên tên là ${x.L('khoi')}.` },
    ],
  },
  {
    id: 'dohang',
    min: 4,
    max: 6,
    title: 'Chơi đồ hàng',
    bg: bg('ngo'),
    who: () => 'khoi',
    text: (x) => [`Lũ trẻ trong ngõ chơi đồ hàng: lá bàng làm tiền, hoa dâm bụt làm cỗ. ${x.L('khoi')} nhà bên được phân làm "${x.lg === 'm' ? 'bố' : 'mẹ'}", ${x.me} làm "${isF(x) ? 'mẹ' : 'bố'}".`],
    choices: [
      { t: 'Nấu cỗ lá bàng thật ngon', do: (fx) => (fx.love('khoi', 8), fx.stat('tinh', 3)), note: (x) => `${x.L('khoi')} ăn thử thật, khóc vì đắng.` },
      { t: '"Không chơi, tớ làm bác sĩ cơ"', do: (fx) => (fx.stat('hoc', 4), fx.love('khoi', 2)) },
      { t: 'Đổi vai: làm người bán hàng', do: (fx) => (fx.stat('tien', 4), fx.stat('duyen', 2)) },
    ],
  },
  {
    id: 'ngoisauxe',
    min: 3,
    max: 5,
    title: 'Ngồi trước xe bố đi chơi phố',
    bg: bg('pho', 'dusk'),
    text: (x) => [`Tối thứ bảy, bố chở cả nhà bằng ${ride(x.year)} đi một vòng phố. ${x.me} ngồi phía trước, gió thổi tóc bay.`],
    choices: [
      { t: 'Đòi mua kem que', do: (fx) => (fx.stat('tam', 5), fx.rel('bome', 3)) },
      { t: 'Đếm đèn đường đến lúc ngủ gật', do: (fx) => (fx.stat('hoc', 3), fx.stat('tam', 3)) },
      { t: 'Hát to suốt đường', do: (fx) => (fx.stat('duyen', 5), fx.stat('noi', 2)) },
    ],
  },
  {
    id: 'bunbat',
    min: 4,
    max: 7,
    if: (x) => !x.f.urban,
    title: 'Trưa hè trốn ngủ',
    bg: bg('vuon'),
    text: (x) => [`Trưa hè, cả nhà ngủ. ${x.me} rón rén trèo qua cửa sổ, ra bờ ao bắt chuồn chuồn${south(x) ? ', hái trộm mấy trái mận' : ', bắt ve sầu'}.`],
    choices: [
      { t: 'Bắt được cả lọ, khoe khắp xóm', do: (fx) => (fx.stat('noi', 5), fx.love('khoi', 4)) },
      { t: 'Thả hết đi cho chúng bay', do: (fx) => (fx.stat('tinh', 5), fx.stat('dao', 3)) },
      { t: 'Bị bắt quả tang, ăn mấy roi', do: (fx) => (fx.stat('tam', -3), fx.rel('bome', -2)), note: () => 'Mai lại trốn tiếp.' },
    ],
  },
  {
    id: 'embe',
    min: 3,
    max: 8,
    if: (x) => x.f.siblings.some((s) => !s.older),
    title: 'Mẹ sinh em bé',
    bg: bg('nha'),
    who: () => 'mom',
    text: (x) => [`${x.me} được dắt vào xem em bé đỏ hỏn. Cả nhà xúm vào em, không ai để ý ${x.me} nữa.`],
    choices: [
      { t: 'Nhường em đồ chơi đẹp nhất', do: (fx) => (fx.stat('tinh', 6), fx.rel('bome', 5)) },
      { t: 'Giận dỗi, trốn sau tủ', do: (fx) => (fx.stat('tam', -4), fx.stat('noi', 3)), note: () => 'Tối đến bố tìm thấy, bế lên kể chuyện hồi bố cũng có em.' },
      { t: 'Đòi được bế em', do: (fx) => (fx.stat('tinh', 4), fx.stat('duyen', 3)) },
    ],
  },
  {
    id: 'cuoicau',
    min: 4,
    max: 6,
    title: 'Đi bê tráp đám cưới',
    bg: bg('nha', 'day'),
    text: (x) => [`Đám cưới cô út, ${x.me} được mặc ${isF(x) ? 'váy hồng' : 'áo sơ mi, thắt nơ'} đi bê tráp. Cả họ khen như búp bê.`],
    choices: [
      { t: 'Bê thật cẩn thận, không làm rơi', do: (fx) => (fx.stat('tinh', 4), fx.rel('bome', 4)) },
      { t: 'Ăn vụng kẹo trong tráp', do: (fx) => (fx.stat('noi', 4), fx.stat('duyen', 2)), note: () => 'Ảnh cưới có một đứa trẻ miệng dính đầy kẹo.' },
      { t: '"Lớn lên con cũng cưới thế này"', do: (fx) => fx.stat('dao', 5), note: () => 'Cả họ cười ồ. Bà ngoại bảo: "Phải tìm được người thương con đã."' },
    ],
  },
  {
    id: 'meo',
    min: 3,
    max: 7,
    title: 'Con mèo nhà bên',
    bg: bg('ngo', 'dusk'),
    who: () => 'khoi',
    text: (x) => [`Con mèo mướp nhà bên đẻ một ổ bốn con. ${x.L('khoi')} ôm một con sang cho ${x.me} xem: "Cho cậu một con đấy."`],
    choices: [
      { t: 'Nhận, đặt tên thật kêu', do: (fx) => (fx.love('khoi', 8), fx.stat('tinh', 4), fx.flag('meo')), note: () => '🦋 Con mèo này sẽ sống rất lâu.' },
      { t: (x) => `Hỏi ${x.bm} trước đã`, do: (fx) => (fx.love('khoi', 4), fx.rel('bome', 3)) },
      { t: 'Sợ mèo, chạy mất', do: (fx) => fx.stat('tam', -2) },
    ],
  },
  {
    id: 'trungthu3',
    min: 3,
    max: 5,
    title: 'Rằm Trung thu',
    bg: bg('ngo', 'night'),
    text: (x) => [`Đêm rằm, ${x.year < 2000 ? 'bố vót tre làm cho chiếc đèn ông sao dán giấy bóng kính' : x.year < 2015 ? 'mẹ mua cho chiếc đèn lồng nhựa chạy pin, hát được cả bài' : 'mẹ mua chiếc đèn lồng có hình siêu nhân'}. Lũ trẻ đi rước đèn quanh ngõ.`],
    choices: [
      { t: 'Đi đầu đoàn rước, hát to nhất', do: (fx) => (fx.stat('duyen', 5), fx.stat('noi', 2)) },
      { t: 'Ngồi phá cỗ, ăn hết bánh nướng', do: (fx) => fx.stat('tam', 5) },
      { t: 'Cho bạn nhà bên mượn đèn', do: (fx) => (fx.love('khoi', 7), fx.stat('tinh', 4)) },
    ],
  },
];

/* =========================================================
   6-11 TUỔI: cấp một
   ========================================================= */
const KID: Life[] = [
  {
    id: 'vachban',
    min: 6,
    max: 9,
    title: 'Vạch kẻ giữa bàn',
    bg: bg('lop'),
    who: () => 'long',
    text: (x) => [`${x.L('long')} ngồi cùng bàn, lấy bút chì kẻ một đường giữa bàn: "Lấn sang là bị cốc đầu nhé."`],
    choices: [
      { t: 'Kẻ thêm một đường nữa, to hơn', do: (fx) => (fx.love('long', 8), fx.stat('noi', 5)), note: (x) => `${x.L('long')} cười toe, xóa luôn cả hai đường.` },
      { t: 'Cho mượn tẩy dù bị lấn', do: (fx) => (fx.love('long', 6), fx.stat('tinh', 4)) },
      { t: 'Xin cô đổi chỗ', do: (fx) => (fx.stat('hoc', 3), fx.love('long', -3), fx.love('minh', 4)) },
    ],
  },
  {
    id: 'vochu',
    min: 6,
    max: 8,
    title: 'Vở ô li, chữ mực tím',
    bg: bg('lop'),
    text: (x) => [`Cô giáo chấm vở luyện chữ. ${x.year < 2005 ? 'Ngón tay ai cũng tím mực.' : 'Cả lớp phải viết bút máy cho đẹp chữ.'} Vở ${x.me} có một vết mực loang to tướng.`],
    choices: [
      { t: 'Viết lại cả trang cho đẹp', do: (fx) => (fx.stat('hoc', 6), fx.stat('tam', -2)) },
      { t: 'Vẽ vết mực thành con mèo', do: (fx) => (fx.stat('duyen', 5), fx.stat('noi', 3)), note: () => 'Cô không cho điểm, nhưng cười.' },
      { t: 'Đổ tại bạn bàn sau xô', do: (fx) => (fx.stat('noi', 3), fx.love('long', -4)) },
    ],
  },
  {
    id: 'khando',
    min: 8,
    max: 10,
    title: 'Ngày được quàng khăn đỏ',
    bg: bg('cong'),
    text: (x) => [`Lễ kết nạp Đội. Anh chị lớp trên thắt khăn đỏ cho từng đứa. ${kid(x, 'khan')} được đọc lời hứa trước toàn trường, run cầm cập.`],
    choices: [
      { t: 'Về khoe cả xóm', do: (fx) => (fx.rel('bome', 5), fx.stat('duyen', 2)) },
      { t: 'Học thuộc lời hứa đến từng chữ', do: (fx) => fx.stat('hoc', 5) },
      { t: 'Thắt khăn đỏ lên đầu làm siêu nhân', do: (fx) => (fx.stat('noi', 5), fx.love('long', 4)) },
    ],
  },
  {
    id: '2011',
    min: 7,
    max: 11,
    title: 'Ngày 20 tháng 11',
    bg: bg('lop'),
    text: (x) => [`Ngày Nhà giáo. Cả lớp góp tiền mua quà cho cô. ${x.year < 2000 ? 'Có đứa mang bó hoa hái ở vườn nhà.' : 'Có đứa mang cả hộp quà to bằng cái cặp.'}`],
    choices: [
      { t: 'Tự viết một tấm thiệp', do: (fx) => (fx.stat('tinh', 6), fx.stat('hoc', 2)), note: () => 'Cô giữ tấm thiệp ấy nhiều năm.' },
      { t: 'Hái trộm hoa nhà hàng xóm', do: (fx) => (fx.stat('noi', 5), fx.rel('bome', -2)) },
      { t: 'Hát tặng cô một bài', do: (fx) => fx.stat('duyen', 6) },
    ],
  },
  {
    id: '83',
    min: 8,
    max: 11,
    title: 'Mùng 8 tháng 3',
    bg: bg('lop'),
    who: cw(),
    text: (x) =>
      isF(x)
        ? [`Ngày 8/3, bọn con trai góp tiền mua hoa tặng cả lớp. ${C(x)} đỏ mặt đưa cho ${x.me} bông hoa hồng nhựa.`]
        : [`Ngày 8/3, bọn con trai góp tiền mua quà cho các bạn nữ. ${x.me} được giao đưa quà cho ${C(x)}.`],
    choices: [
      { t: 'Cảm ơn rất to trước cả lớp', do: (fx, x) => (fx.love(crush(x), 6), fx.stat('duyen', 3)), note: () => 'Cả lớp ồ lên. Hai đứa không dám nhìn nhau cả tuần.' },
      { t: 'Lí nhí cảm ơn rồi chạy mất', do: (fx, x) => fx.love(crush(x), 8) },
      { t: 'Chê quà xấu', do: (fx, x) => (fx.love(crush(x), -5), fx.stat('noi', 4)) },
    ],
  },
  {
    id: 'trochoi',
    min: 6,
    max: 10,
    title: 'Giờ ra chơi',
    bg: bg('cong'),
    text: (x) => [`Giờ ra chơi, sân trường chia phe: bên ${play(x.year)}, bên ngồi gốc phượng buôn chuyện.`],
    choices: [
      { t: (x) => `Chơi cùng ${x.L('long')} và đám con trai`, do: (fx) => (fx.love('long', 6), fx.stat('noi', 4)) },
      { t: (x) => `Ngồi đọc truyện với ${x.L('minh')}`, do: (fx) => (fx.love('minh', 6), fx.stat('hoc', 3)) },
      { t: (x) => `Chơi với ${x.s.bestie}`, do: (fx) => (fx.rel('banthan', 8), fx.stat('tam', 3)) },
    ],
  },
  {
    id: 'quavat',
    min: 6,
    max: 11,
    title: 'Hàng quà cổng trường',
    bg: bg('cong', 'dusk'),
    text: (x) => [`Tan học, cổng trường có ${snack(x.year)}. Trong túi ${x.me} còn đúng tiền một gói.`],
    choices: [
      { t: (x) => `Mua một gói chia đôi với ${x.L('khoi')}`, do: (fx) => (fx.love('khoi', 6), fx.stat('tinh', 3)) },
      { t: 'Ăn một mình, về nhà không dám ăn cơm', do: (fx) => (fx.stat('tam', 3), fx.rel('bome', -2)) },
      { t: 'Bỏ ống heo', do: (fx) => (fx.stat('tien', 5), fx.stat('hoc', 2)) },
    ],
  },
  {
    id: 'truyentranh',
    min: 8,
    max: 12,
    from: 1994,
    to: 2014,
    title: 'Hàng thuê truyện',
    bg: bg('pho'),
    text: (x) => [`Hàng thuê truyện đầu ngõ vừa về tập mới ${x.year < 2003 ? 'Doraemon' : 'Thám tử lừng danh Conan'}. Một nghìn một quyển. Cả lớp xếp hàng.`],
    choices: [
      { t: 'Thuê về, đọc trộm trong giờ học', do: (fx) => (fx.stat('noi', 4), fx.stat('hoc', -2)) },
      { t: (x) => `Đọc chung với ${x.L('minh')}`, do: (fx) => (fx.love('minh', 7), fx.stat('hoc', 2)), note: (x) => `${x.L('minh')} đoán ra hung thủ trước cả Conan.` },
      { t: 'Để dành tiền mua sách tham khảo', do: (fx) => (fx.stat('hoc', 5), fx.rel('bome', 3)) },
    ],
  },
  {
    id: 'bien',
    min: 6,
    max: 12,
    title: 'Lần đầu đi biển',
    bg: bg('congvien'),
    text: (x) => [`Hè này cả nhà đi ${south(x) ? 'Vũng Tàu' : x.f.province === 'Nghệ An' || x.f.province === 'Hà Tĩnh' ? 'Cửa Lò' : 'Sầm Sơn'} bằng ${x.year < 2005 ? 'xe khách chật như nêm' : 'xe khách giường nằm'}. ${x.me} lần đầu thấy biển.`],
    choices: [
      { t: 'Lao xuống nước, bị sóng đánh ngã', do: (fx) => (fx.stat('noi', 5), fx.stat('tam', 3)) },
      { t: 'Nhặt vỏ ốc về tặng bạn nhà bên', do: (fx) => (fx.love('khoi', 8), fx.stat('tinh', 3)), note: (x) => `${x.L('khoi')} xâu vỏ ốc thành vòng đeo mãi.` },
      { t: 'Xây lâu đài cát cả buổi', do: (fx) => (fx.stat('hoc', 3), fx.stat('tam', 4)) },
    ],
  },
  {
    id: 'mattdien',
    min: 6,
    max: 11,
    to: 2012,
    title: 'Mất điện tối hè',
    bg: bg('ngo', 'night'),
    text: (x) => [`Mất điện. Cả xóm mang chiếu ra ngõ ngồi hóng mát, phe phẩy quạt nan. Người lớn kể chuyện ma.`],
    choices: [
      { t: 'Kể chuyện ma, dọa cả bọn', do: (fx) => (fx.stat('duyen', 4), fx.stat('noi', 3)) },
      { t: (x) => `Ngồi cạnh ${x.L('khoi')} đếm sao`, do: (fx) => (fx.love('khoi', 7), fx.stat('dao', 3)) },
      { t: 'Bắt đom đóm bỏ vào lọ', do: (fx) => fx.stat('tam', 5) },
    ],
  },
  {
    id: 'hsg',
    min: 9,
    max: 11,
    title: 'Thi học sinh giỏi',
    bg: bg('lop'),
    who: () => 'minh',
    text: (x) => [`Trường chọn hai đứa đi thi học sinh giỏi huyện: ${x.me} và ${x.L('minh')}. Tối nào cô cũng giữ lại ôn bài.`],
    choices: [
      { t: 'Ôn thật chăm, quyết thắng', do: (fx) => (fx.stat('hoc', 8), fx.love('minh', 5)) },
      { t: (x) => `Giảng bài lại cho ${x.L('minh')} câu khó`, do: (fx) => (fx.stat('hoc', 4), fx.love('minh', 9)), note: (x) => `${x.L('minh')} lần đầu tiên nói: "Cảm ơn."` },
      { t: 'Xin rút, nhường bạn khác', do: (fx) => (fx.stat('tam', 4), fx.stat('hoc', -2)) },
    ],
  },
  {
    id: 'bomecai',
    min: 7,
    max: 12,
    if: (x) => x.f.parents === 'Bố mẹ hay cãi nhau' || x.f.parents === 'Gia trưởng' || x.f.parents === 'Bố mẹ ly thân',
    title: 'Tiếng cãi nhau sau cánh cửa',
    bg: bg('phong', 'night'),
    text: (x) => [`Đêm, ${x.me} nằm nghe ${x.f.parents === 'Bố mẹ ly thân' ? 'bố gọi điện đến, mẹ nói to' : 'bố mẹ cãi nhau'} ở phòng bên. Chuyện tiền, chuyện nhà nội.`],
    choices: [
      { t: 'Lấy gối bịt tai, cố ngủ', do: (fx) => fx.stat('tam', -4) },
      { t: (x) => `Chạy ra ôm ${x.mom}`, do: (fx) => (fx.rel('bome', 8), fx.stat('tinh', 4)) },
      { t: (x) => `Sang nhà ${x.s.bestie} ngủ nhờ`, do: (fx) => (fx.rel('banthan', 8), fx.stat('tam', 2)) },
    ],
  },
  {
    id: 'lop_truong',
    min: 7,
    max: 11,
    title: 'Bầu lớp trưởng',
    bg: bg('lop'),
    text: (x) => [`Cô cho cả lớp bầu lớp trưởng. Tên ${x.me} và ${kid(x, 'lt')} được viết lên bảng, số phiếu ngang nhau.`],
    choices: [
      { t: 'Bỏ phiếu cho chính mình', do: (fx) => (fx.stat('noi', 5), fx.stat('duyen', 2)) },
      { t: (x) => `Nhường cho ${kid(x, 'lt')}`, do: (fx) => (fx.stat('tinh', 5), fx.rel('banthan', 3)) },
      { t: 'Đề nghị làm cả hai', do: (fx) => fx.stat('duyen', 5) },
    ],
  },
  {
    id: 'vannghe',
    min: 8,
    max: 12,
    title: 'Văn nghệ cuối năm',
    bg: bg('lop', 'dusk'),
    who: cw(),
    text: (x) => [`Lớp tập múa đôi cho buổi văn nghệ. Cô xếp ${x.me} đứng cặp với ${C(x)}.`],
    choices: [
      { t: 'Tập thật chăm, không giẫm chân ai', do: (fx, x) => (fx.love(crush(x), 7), fx.stat('duyen', 4)) },
      { t: 'Giẫm chân bạn liên tục', do: (fx, x) => (fx.love(crush(x), 3), fx.stat('noi', 2)), note: (x) => `${C(x)} nhăn mặt, rồi phì cười.` },
      { t: 'Xin đổi bạn cặp', do: (fx, x) => fx.love(crush(x), -4) },
    ],
  },
  {
    id: 'heodat',
    min: 6,
    max: 10,
    title: 'Con heo đất',
    bg: bg('phong', 'day'),
    text: (x) => [`${Bm(x)} mua cho con heo đất. Mỗi lần được cho tiền ăn sáng, ${x.me} lại đứng trước nó phân vân.`],
    choices: [
      { t: 'Nhịn ăn sáng, bỏ hết vào heo', do: (fx) => (fx.stat('tien', 8), fx.stat('tam', -2)) },
      { t: 'Bỏ một nửa', do: (fx) => (fx.stat('tien', 4), fx.stat('hoc', 2)) },
      { t: 'Đập heo mua quà sinh nhật cho bạn', do: (fx) => (fx.rel('banthan', 8), fx.stat('tinh', 4)) },
    ],
  },
  {
    id: 'phao',
    min: 6,
    max: 11,
    to: 1994,
    title: 'Pháo Tết',
    bg: bg('ngo', 'night', true),
    text: () => ['Giao thừa, cả phố đốt pháo đì đùng. Sáng mùng một, xác pháo đỏ cả ngõ, lũ trẻ đi nhặt pháo xịt.'],
    choices: [
      { t: 'Nhặt pháo xịt đốt lại', do: (fx) => (fx.stat('noi', 6), fx.rel('bome', -3)), note: () => 'Bố mắng một trận, nhưng giấu cười.' },
      { t: 'Bịt tai đứng xa xem', do: (fx) => fx.stat('tam', 3) },
    ],
  },
  {
    id: 'tetcon',
    min: 7,
    max: 11,
    from: 1995,
    title: 'Ba mươi Tết',
    bg: bg('nha', 'night', true),
    text: (x) => [`Chiều ba mươi, cả nhà gói bánh chưng, ${x.year < 2010 ? 'luộc nồi bánh to giữa sân' : 'xem Táo Quân'}. ${x.me} được giao gói một chiếc bánh nhỏ của riêng mình.`],
    choices: [
      { t: 'Gói chiếc bánh vuông nhất có thể', do: (fx) => (fx.stat('hoc', 3), fx.rel('bome', 5)) },
      { t: 'Gói một chiếc méo xệch, đánh dấu bằng sợi chỉ đỏ', do: (fx) => (fx.stat('duyen', 3), fx.stat('tam', 4)) },
      { t: (x) => `Mang chiếc bánh nhỏ sang cho ${x.L('khoi')}`, do: (fx) => (fx.love('khoi', 7), fx.stat('tinh', 3)) },
    ],
  },
  {
    id: 'thuthu',
    min: 10,
    max: 12,
    title: 'Mảnh giấy trong ngăn bàn',
    bg: bg('lop'),
    who: cw(),
    text: (x) => [`Sáng đến lớp, ${x.me} thấy một mảnh giấy gấp hình con hạc trong ngăn bàn: "Mình chơi thân nhé. Không ký tên." Nét chữ trông giống của ${C(x)}.`],
    choices: [
      { t: 'Viết lại một mảnh giấy, nhét vào ngăn bàn kia', do: (fx, x) => (fx.love(crush(x), 9), fx.stat('dao', 3)) },
      { t: 'Cất vào hộp bút, giữ mãi', do: (fx, x) => (fx.love(crush(x), 6), fx.stat('tinh', 4), fx.flag('giaygap')), note: () => '🦋 Mảnh giấy này sẽ còn quay lại.' },
      { t: 'Đưa cả lớp xem, hỏi ai viết', do: (fx, x) => (fx.love(crush(x), -6), fx.stat('noi', 4)) },
    ],
  },
  {
    id: 'dihocthem_tieng_anh',
    min: 9,
    max: 12,
    from: 2000,
    title: 'Lớp tiếng Anh buổi tối',
    bg: bg('lop', 'night'),
    text: (x) => [`${Bm(x)} cho ${x.me} đi học tiếng Anh ở trung tâm. Thầy cho cả lớp đặt tên tiếng Anh.`],
    choices: [
      { t: 'Chọn một cái tên thật kêu', do: (fx) => (fx.stat('duyen', 4), fx.stat('hoc', 3)) },
      { t: 'Học chăm, mơ đi du học', do: (fx) => fx.stat('hoc', 6) },
      { t: 'Ngồi bàn cuối vẽ bậy', do: (fx) => fx.stat('noi', 4) },
    ],
  },
  {
    id: 'lut',
    min: 6,
    max: 12,
    if: (x) => ['Huế', 'Quảng Trị', 'Quảng Ngãi', 'Hà Tĩnh', 'Nghệ An', 'An Giang', 'Đồng Tháp', 'Cần Thơ', 'Cà Mau'].includes(x.f.province),
    title: (x) => (south(x) ? 'Mùa nước nổi' : 'Mùa lũ'),
    bg: bg('vuon', 'dusk'),
    text: (x) => [south(x) ? 'Nước lên trắng đồng. Lũ trẻ chèo xuồng đi học, bắt cá linh ngay trước hiên nhà.' : 'Lũ về, nước ngập đến nửa cửa sổ. Cả nhà kê đồ lên gác, ăn mì tôm ba ngày.'],
    choices: [
      { t: (x) => `Giúp ${x.bm} kê đồ`, do: (fx) => (fx.rel('bome', 6), fx.stat('tinh', 3)) },
      { t: 'Chèo thuyền đi xem nhà bạn', do: (fx) => (fx.stat('noi', 5), fx.love('khoi', 4)) },
    ],
  },
];

/* =========================================================
   12-17 TUỔI: cấp hai, cấp ba, cảm nắng
   ========================================================= */
const TEEN: Life[] = [
  {
    id: 'dongphuc',
    min: 11,
    max: 12,
    title: 'Ngày đầu vào cấp hai',
    bg: bg('cong'),
    text: (x) => [`Ngày đầu vào lớp sáu. ${isF(x) ? 'Tóc buộc đuôi gà, áo trắng mới tinh' : `Áo trắng rộng thùng thình, ${x.mom} bảo "để năm sau còn mặc"`}. Lớp mới, bạn mới.`],
    choices: [
      { t: 'Ngồi bàn đầu cho cô nhớ mặt', do: (fx) => fx.stat('hoc', 5) },
      { t: 'Ngồi bàn cuối gần cửa sổ', do: (fx) => (fx.stat('noi', 4), fx.stat('dao', 2)) },
      { t: (x) => `Ngồi cạnh ${x.s.bestie} cho chắc`, do: (fx) => fx.rel('banthan', 8) },
    ],
  },
  {
    id: 'cungban',
    min: 12,
    max: 16,
    title: 'Xếp chỗ ngồi mới',
    bg: bg('lop'),
    who: cw(),
    text: (x) => [`Cô chủ nhiệm xếp lại chỗ ngồi. ${x.me} được xếp ngồi cạnh ${C(x)}. Cả lớp huýt sáo.`],
    choices: [
      { t: 'Giả vờ bình thường, tim đập thình thịch', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('tam', 2)) },
      { t: 'Cho chép bài kiểm tra', do: (fx, x) => (fx.love(crush(x), 7), fx.stat('hoc', -2)), note: (x) => `${C(x)} bị cô bắt, nhưng không khai ai cho chép.` },
      { t: 'Kẻ vạch giữa bàn như hồi bé', do: (fx, x) => (fx.love(crush(x), 4), fx.stat('noi', 3)) },
    ],
  },
  {
    id: 'hacgiay',
    min: 12,
    max: 17,
    from: 1998,
    to: 2016,
    title: 'Một nghìn con hạc giấy',
    bg: bg('phong', 'night'),
    who: cw(),
    text: (x) => [`Nghe nói gấp đủ một nghìn con hạc giấy thì điều ước thành thật. ${x.me} mua cả xấp giấy màu, gấp đến khuya, nghĩ về ${C(x)}.`],
    choices: [
      { t: 'Gấp đủ một nghìn con, đem tặng', do: (fx, x) => (fx.love(crush(x), 12), fx.stat('tinh', 4), fx.stat('hoc', -3)), note: (x) => `${C(x)} treo cả chuỗi hạc lên cửa sổ.` },
      { t: 'Gấp được ba trăm con thì ngủ gật', do: (fx) => (fx.stat('tam', 3), fx.stat('dao', 2)) },
      { t: 'Đổi sang gấp lọ sao giấy cho nhanh', do: (fx, x) => (fx.love(crush(x), 7), fx.stat('duyen', 3)) },
    ],
  },
  {
    id: 'valentine',
    min: 13,
    max: 17,
    from: 1998,
    title: 'Ngày 14 tháng 2',
    bg: bg('cong', 'dusk'),
    who: cw(),
    text: (x) => [`Valentine. Cổng trường bán đầy ${x.year < 2010 ? 'sôcôla và hoa hồng giấy' : 'sôcôla, gấu bông, hoa sáp'}. ${C(x)} đi ngang qua, nhìn ${x.me} một cái.`],
    choices: [
      { t: 'Lén bỏ thanh sôcôla vào cặp người ấy', do: (fx, x) => (fx.love(crush(x), 9), fx.stat('dao', 3)), note: () => 'Không ký tên. Nhưng người ấy biết.' },
      { t: 'Đưa tận tay, mặt đỏ như gấc', do: (fx, x) => (fx.love(crush(x), x.s.stats.duyen >= 40 ? 12 : 5), fx.stat('noi', 4)) },
      { t: 'Ăn hết sôcôla một mình', do: (fx) => fx.stat('tam', 4) },
    ],
  },
  {
    id: 'thutay',
    min: 13,
    max: 17,
    to: 2008,
    title: 'Lá thư viết ba đêm',
    bg: bg('phong', 'night'),
    who: cw(),
    text: (x) => [`${x.me} viết thư cho ${C(x)} trên giấy pơ-luya thơm, chép thêm hai câu thơ, ép một cánh phượng. Viết đi viết lại ba đêm.`],
    choices: [
      { t: (x) => `Nhờ ${x.s.bestie} chuyển hộ`, do: (fx, x) => (fx.love(crush(x), 7), fx.rel('banthan', 4)), note: (x) => `${x.s.bestie} hứa giữ bí mật, rồi kể cho nửa lớp.` },
      { t: 'Tự kẹp vào sách của người ấy', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('noi', 3)) },
      { t: 'Cất vào ngăn kéo, không bao giờ gửi', do: (fx) => (fx.stat('tinh', 5), fx.flag('thukhonggui')), note: () => '🦋 Lá thư không gửi ấy vẫn nằm đó.' },
    ],
  },
  {
    id: 'bibatthu',
    min: 13,
    max: 17,
    to: 2010,
    title: 'Bị cô giáo bắt được thư',
    bg: bg('lop'),
    who: cw(),
    text: (x) => [`Giờ Văn, mảnh giấy ${x.me} chuyền cho ${C(x)} rơi đúng chân cô giáo. Cô nhặt lên, mở ra, cả lớp nín thở.`],
    choices: [
      { t: 'Đứng dậy nhận là của mình', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('noi', 5), fx.rel('bome', -3)), note: () => 'Bị mời phụ huynh. Nhưng người ấy nhìn mình khác hẳn.' },
      { t: 'Ngồi im, để cô đọc to', do: (fx, x) => (fx.love(crush(x), -2), fx.stat('tam', -4)) },
      { t: 'Xin cô đọc giúp cả bài thơ cho hay', do: (fx) => (fx.stat('duyen', 6), fx.stat('noi', 3)), note: () => 'Cả lớp vỗ tay. Cô cũng không nhịn được cười.' },
    ],
  },
  {
    id: 'nokia',
    min: 14,
    max: 17,
    from: 2004,
    to: 2013,
    title: 'Tin nhắn nửa đêm',
    bg: bg('phong', 'night'),
    who: cw(),
    kind: 'chat',
    msgs: (x) => [
      { me: false, t: 'ngu chua? :)' },
      { me: true, t: 'chua. dang hoc bai' },
      { me: false, t: 'mai di hoc som k? to doi o cong' },
    ],
    timer: 12,
    timeout: 2,
    text: (x) => [`Mười một giờ đêm, ${x.year < 2009 ? 'chiếc Nokia' : 'điện thoại'} rung dưới gối. Tài khoản còn đúng ${x.year < 2009 ? '300 đồng' : '1.000 đồng'}, nhắn được hai tin.`],
    choices: [
      { t: '"Ừ, đợi nhé :)"', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('hoc', -2)) },
      { t: '"Thôi ngủ đi, mai gặp"', do: (fx, x) => (fx.love(crush(x), 5), fx.stat('tam', 2)) },
      { t: '(Hết tiền, không trả lời được)', do: (fx, x) => fx.love(crush(x), -3), note: () => 'Sáng hôm sau ra cổng vẫn thấy người ấy đứng đợi.' },
    ],
  },
  {
    id: 'yahoo',
    min: 13,
    max: 17,
    from: 2003,
    to: 2011,
    title: 'Dòng trạng thái Yahoo',
    bg: bg('net', 'night'),
    who: cw(),
    text: (x) => [`Ở quán net, ${x.me} sửa dòng trạng thái Yahoo cả buổi: một câu hát buồn, để ai đó đọc. ${C(x)} vừa sáng đèn xanh.`],
    choices: [
      { t: 'Gửi một cái BUZZ!', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('noi', 3)) },
      { t: 'Đổi sang chế độ ẩn, rình xem', do: (fx) => fx.stat('dao', 4) },
      { t: 'Gửi một bài hát kèm lời chúc', do: (fx, x) => (fx.love(crush(x), 7), fx.stat('duyen', 4)) },
    ],
  },
  {
    id: 'tagphoto',
    min: 14,
    max: 17,
    from: 2011,
    title: 'Bị tag vào ảnh',
    bg: bg('phong', 'night'),
    who: cw(),
    post: (x) => ({
      author: x.s.bestie,
      time: '5 phút',
      text: `Hội lớp đi chơi 🤭 nhìn hai bạn kia kìa`,
      likes: 87,
      comments: [
        { who: 'Lớp trưởng', t: 'Ơ, có gì đó sai sai' },
        { who: x.s.bestie, t: 'Mình chỉ chụp thôi nhé 😆' },
      ],
      photo: [crush(x)],
    }),
    text: (x) => [`${x.s.bestie} đăng ảnh cả lớp, chụp đúng lúc ${x.me} đang nhìn ${C(x)}.`],
    choices: [
      { t: 'Thả tim, coi như không có gì', do: (fx, x) => (fx.love(crush(x), 6), fx.stat('duyen', 2)) },
      { t: 'Nhắn bạn xóa ảnh ngay', do: (fx) => (fx.rel('banthan', -4), fx.stat('tam', 2)) },
      { t: 'Đặt luôn làm ảnh đại diện', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('noi', 5)), note: () => 'Cả trường biết trong một buổi tối.' },
    ],
  },
  {
    id: 'trumua',
    min: 12,
    max: 17,
    title: 'Trú mưa',
    bg: bg('pho', 'dusk'),
    who: cw(),
    text: (x) => [`Tan học, trời đổ mưa. ${x.me} và ${C(x)} đứng chung dưới mái hiên một hiệu sách. Chỉ có một chiếc áo mưa.`],
    choices: [
      { t: 'Đưa áo mưa cho người ấy, mình chạy về', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('tinh', 4)), note: () => 'Về đến nhà ướt như chuột, sốt hai ngày. Đáng.' },
      { t: 'Đứng chờ tạnh mưa, nói chuyện cả tiếng', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('duyen', 3)) },
      { t: 'Che chung một áo mưa, đạp xe về', do: (fx, x) => (fx.love(crush(x), 12), fx.stat('noi', 3)) },
    ],
  },
  {
    id: 'xedap',
    min: 13,
    max: 17,
    title: 'Đạp xe chở nhau về',
    bg: bg('pho', 'dusk'),
    who: cw(),
    text: (x) => [`Xe của ${C(x)} hỏng xích. ${x.me} bảo: "Lên đây, chở về." Con đường về nhà hôm ấy dài hơn mọi ngày.`],
    choices: [
      { t: 'Đạp chậm thật chậm', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('dao', 2)) },
      { t: 'Đạp thật nhanh cho đỡ ngại', do: (fx, x) => (fx.love(crush(x), 5), fx.stat('tam', 3)) },
      { t: 'Dắt bộ cả hai xe, vừa đi vừa nói chuyện', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('tinh', 3)) },
    ],
  },
  {
    id: 'hocthem',
    min: 13,
    max: 17,
    title: 'Học thêm nhà thầy',
    bg: bg('nha', 'night'),
    who: cw(),
    text: (x) => [`Lớp học thêm Toán nhà thầy chật kín ba mươi đứa. ${C(x)} ngồi ngay bàn trên, tóc thơm mùi ${x.year < 2005 ? 'bồ kết' : 'dầu gội'}.`],
    choices: [
      { t: 'Hỏi bài để được nói chuyện', do: (fx, x) => (fx.love(crush(x), 7), fx.stat('hoc', 2)) },
      { t: 'Tập trung học, đạt điểm 10', do: (fx) => fx.stat('hoc', 8), note: (x) => `${C(x)} quay xuống: "Giỏi thế, chỉ tớ với."` },
      { t: `Rủ nhau trốn học đi ăn chè`, do: (fx, x) => (fx.love(crush(x), 9), fx.stat('noi', 5), fx.rel('bome', -4)) },
    ],
  },
  {
    id: 'nhatky',
    min: 12,
    max: 16,
    title: 'Cuốn nhật ký có khóa',
    bg: bg('phong'),
    who: () => 'mom',
    text: (x) => [`Đi học về, ${x.me} thấy cuốn nhật ký có khóa nằm lệch chỗ. Trong đó có cả trang viết về ${C(x)}.`],
    choices: [
      { t: (x) => `Hỏi thẳng ${x.mom} có đọc không`, do: (fx) => (fx.stat('noi', 5), fx.rel('bome', -3)), note: (x) => `${Mom(x)} chối, rồi tối đó nấu món ${x.me} thích nhất.` },
      { t: 'Đổi sang viết bằng mật mã', do: (fx) => (fx.stat('hoc', 4), fx.stat('dao', 2)) },
      { t: (x) => `Kể luôn với ${x.mom} về người ấy`, do: (fx) => (fx.rel('bome', 8), fx.stat('tinh', 4)), note: (x) => `${Mom(x)} cười: "Hồi ${x.mom} bằng tuổi con cũng thế."` },
    ],
  },
  {
    id: 'phimhan',
    min: 12,
    max: 17,
    from: 2000,
    title: (x) => (x.year < 2006 ? 'Trái tim mùa thu' : x.year < 2015 ? 'Cơn sốt phim Hàn' : 'Thức đêm cày phim'),
    bg: bg('nha', 'night'),
    text: (x) => [x.year < 2006 ? 'Cả nhà khóc theo phim Hàn chiếu trên tivi lúc tám giờ tối. Cả lớp mơ được như Eun-suh.' : `${x.me} thức đến hai giờ sáng cày phim Hàn, mơ có một người như nam chính.`],
    choices: [
      { t: 'Tin vào tình yêu định mệnh', do: (fx) => (fx.stat('dao', 6), fx.stat('tinh', 3)) },
      { t: 'Học tiếng Hàn qua phim', do: (fx) => fx.stat('hoc', 5) },
      { t: 'Chê phim sến, đi ngủ', do: (fx) => fx.stat('tam', 4) },
    ],
  },
  {
    id: 'ngontinh',
    min: 14,
    max: 17,
    from: 2008,
    to: 2018,
    title: 'Truyện ngôn tình',
    bg: bg('phong', 'night'),
    text: (x) => [`${x.s.bestie} cho mượn một cuốn ngôn tình dày cộp: tổng tài lạnh lùng, cô gái nghèo. ${x.me} đọc trong chăn bằng đèn pin.`],
    choices: [
      { t: 'Đọc hết trong một đêm', do: (fx) => (fx.stat('dao', 5), fx.stat('hoc', -3)) },
      { t: 'Thấy vô lý, viết truyện của riêng mình', do: (fx) => (fx.stat('hoc', 4), fx.stat('duyen', 3)) },
    ],
  },
  {
    id: 'dibao',
    min: 12,
    max: 19,
    if: (x) => [2008, 2018].includes(x.year),
    title: 'Đi bão!',
    bg: bg('pho', 'night'),
    who: cw(),
    text: (x) => [x.year === 2008 ? 'Việt Nam vô địch AFF Cup! Cả thành phố đổ ra đường, cờ đỏ sao vàng rợp trời.' : 'U23 Việt Nam làm nên kỳ tích. Cả nước đổ ra đường đi bão.', `Giữa biển người, ${C(x)} bất ngờ nắm tay ${x.me} cho khỏi lạc.`],
    choices: [
      { t: 'Nắm chặt, không buông đến tận khuya', do: (fx, x) => (fx.love(crush(x), 14), fx.stat('noi', 4)), note: () => 'Năm ấy cả nước vui, mình vui gấp đôi.' },
      { t: 'Buông tay, hét to cùng đám đông', do: (fx, x) => (fx.love(crush(x), 4), fx.stat('tam', 5)) },
    ],
  },
  {
    id: 'trai',
    min: 13,
    max: 17,
    title: 'Hội trại 26 tháng 3',
    bg: bg('congvien', 'night'),
    who: cw(),
    text: (x) => [`Hội trại 26/3. Cả lớp dựng trại, thi kéo co, đêm đốt lửa trại. ${C(x)} ngồi đối diện qua đống lửa.`],
    choices: [
      { t: 'Rủ người ấy đi dạo quanh trại', do: (fx, x) => (fx.love(crush(x), 9), fx.stat('noi', 3)) },
      { t: 'Hát một bài bên lửa trại', do: (fx, x) => (fx.love(crush(x), x.s.stats.duyen >= 40 ? 10 : 3), fx.stat('duyen', 4)) },
      { t: 'Thức trắng canh trại', do: (fx) => (fx.rel('banthan', 6), fx.stat('tinh', 3)) },
    ],
  },
  {
    id: 'sinhnhatcrush',
    min: 13,
    max: 17,
    title: 'Sinh nhật người ấy',
    bg: bg('quan', 'dusk'),
    who: cw(),
    text: (x) => [`Sinh nhật ${C(x)}. Cả lớp được mời. ${x.me} đứng trước quầy quà cả tiếng, trong túi có ${x.year < 2000 ? 'hai chục nghìn' : x.year < 2015 ? 'năm chục nghìn' : 'hai trăm nghìn'}.`],
    choices: [
      { t: 'Mua con gấu bông to nhất có thể', do: (fx, x) => (fx.love(crush(x), 6), fx.stat('tien', -4)) },
      { t: 'Tự làm một cuốn sổ ảnh', do: (fx, x) => (fx.love(crush(x), 11), fx.stat('tinh', 4)), note: () => 'Người ấy giữ cuốn sổ đến tận khi lớn.' },
      { t: 'Góp tiền với cả nhóm cho đỡ ngại', do: (fx, x) => (fx.love(crush(x), 2), fx.rel('banthan', 4)) },
    ],
  },
  {
    id: 'crushcony',
    min: 14,
    max: 17,
    title: 'Người ấy có người yêu',
    bg: bg('cong', 'dusk'),
    who: cw(),
    text: (x) => [`Tin lan khắp trường: ${C(x)} đang "cặp" với một bạn lớp bên. ${x.me} thấy hai người đi chung xe về.`],
    choices: [
      { t: 'Khóc một trận, rồi thôi', do: (fx) => (fx.stat('tam', -4), fx.stat('tinh', 4)) },
      { t: 'Hỏi thẳng người ấy', do: (fx, x) => (fx.stat('noi', 5), fx.love(crush(x), 4)), note: (x) => `${C(x)} cười: "Em họ tớ đấy, ngốc."` },
      { t: 'Học thật giỏi cho người ấy phải nhìn', do: (fx) => fx.stat('hoc', 8) },
    ],
  },
  {
    id: 'banthancung',
    min: 13,
    max: 17,
    title: 'Bạn thân cũng thích người ấy',
    bg: bg('phong', 'night'),
    text: (x) => [`${x.s.bestie} thú thật: "Tao cũng thích ${C(x)}. Mày có thích không? Nói thật đi."`],
    choices: [
      { t: '"Không, mày cứ tự nhiên"', do: (fx, x) => (fx.rel('banthan', 8), fx.love(crush(x), -4), fx.stat('tam', -3)) },
      { t: '"Có. Mình cạnh tranh công bằng nhé"', do: (fx) => (fx.stat('noi', 5), fx.rel('banthan', -2)) },
      { t: '"Thôi, cả hai đứa mình cùng không thích nữa"', do: (fx) => (fx.rel('banthan', 6), fx.stat('duyen', 3)) },
    ],
  },
  {
    id: 'thilop10',
    min: 14,
    max: 15,
    title: 'Thi vào lớp 10',
    bg: bg('lop'),
    text: (x) => [`Kỳ thi vào lớp 10 sắp đến. ${Bm(x)} muốn ${x.me} thi trường chuyên. ${C(x)} thì đăng ký trường gần nhà.`],
    choices: [
      { t: 'Thi chuyên, học ngày học đêm', do: (fx) => (fx.stat('hoc', 10), fx.stat('tam', -4), fx.rel('bome', 4)) },
      { t: 'Đăng ký trường người ấy học', do: (fx, x) => (fx.love(crush(x), 9), fx.rel('bome', -4)) },
      { t: 'Chọn trường mình thích nhất', do: (fx) => (fx.stat('noi', 4), fx.stat('tam', 4)) },
    ],
  },
  {
    id: 'kpop',
    min: 13,
    max: 17,
    from: 2009,
    title: 'Đu thần tượng',
    bg: bg('phong', 'night'),
    text: (x) => [`${x.me} mê một nhóm nhạc ${x.year < 2016 ? 'Hàn Quốc' : 'idol'}: dán poster kín tường, thuộc từng điệu nhảy. ${Mom(x)} lắc đầu.`],
    choices: [
      { t: 'Để dành tiền mua album', do: (fx) => (fx.stat('tien', -4), fx.stat('tam', 5)) },
      { t: 'Lập fanpage, có ngàn người theo dõi', do: (fx) => (fx.stat('duyen', 5), fx.stat('hoc', -3)) },
      { t: 'Học nhảy, tập cùng hội bạn', do: (fx) => (fx.stat('noi', 4), fx.rel('banthan', 5)) },
    ],
  },
  {
    id: 'tiktok',
    min: 13,
    max: 17,
    from: 2019,
    title: 'Clip trend',
    bg: bg('phong', 'day'),
    who: cw(),
    text: (x) => [`${x.s.bestie} rủ quay clip theo trend đang hot. Quay xong mới thấy ${C(x)} lọt vào khung hình phía sau.`],
    choices: [
      { t: 'Đăng luôn, ai xem thì xem', do: (fx, x) => (fx.stat('duyen', 5), fx.love(crush(x), 5)), note: () => 'Clip có mười nghìn lượt xem. Bình luận đầu tiên: "Người phía sau là ai vậy?"' },
      { t: 'Cắt đoạn đó đi', do: (fx) => fx.stat('tam', 2) },
      { t: 'Gửi riêng cho người ấy', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('dao', 3)) },
    ],
  },
  {
    id: 'confesstruong',
    min: 14,
    max: 17,
    from: 2013,
    title: 'Trang confession của trường',
    bg: bg('phong', 'night'),
    who: cw(),
    text: (x) => [`Trang confession của trường đăng bài: "Gửi bạn ${isF(x) ? 'nữ' : 'nam'} hay ngồi bàn ba dãy giữa lớp 11..." Đó chính là chỗ ${x.me} ngồi.`],
    choices: [
      { t: 'Bình luận: "Ai đó?"', do: (fx) => (fx.stat('noi', 4), fx.stat('dao', 4)) },
      { t: 'Đoán là người ấy, nhắn hỏi', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('noi', 3)), note: (x) => `${C(x)} trả lời đúng một chữ: "Ừ."` },
      { t: 'Giả vờ không đọc', do: (fx) => fx.stat('tam', 3) },
    ],
  },
  {
    id: 'kyyeu',
    min: 16,
    max: 17,
    from: 2008,
    title: 'Chụp ảnh kỷ yếu',
    bg: bg('cong'),
    who: cw(),
    text: (x) => [`Cả lớp chụp kỷ yếu: áo dài, áo đồng phục ký kín tên. ${C(x)} cầm bút đến: "Cho tớ ký vào áo nhé?"`],
    choices: [
      { t: 'Đưa lưng ra, xin ký to vào', do: (fx, x) => (fx.love(crush(x), 9), fx.stat('duyen', 3)), note: () => '🦋 Chiếc áo có chữ ký ấy sẽ được giữ rất lâu.' },
      { t: 'Ký lại vào áo người ấy, viết thêm một câu', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('tinh', 3)) },
      { t: 'Chụp chung một tấm riêng', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('noi', 3)) },
    ],
  },
  {
    id: 'luubut',
    min: 14,
    max: 17,
    to: 2015,
    title: 'Cuốn lưu bút',
    bg: bg('lop', 'dusk'),
    who: cw(),
    text: (x) => [`Cuối năm, cuốn lưu bút chuyền tay khắp lớp. Đến lượt ${C(x)} viết vào trang của ${x.me}.`],
    choices: [
      { t: 'Hồi hộp chờ, không dám đọc trước mặt', do: (fx, x) => (fx.love(crush(x), 6), fx.stat('tinh', 3)) },
      { t: 'Viết lại một trang thật dài vào lưu bút người ấy', do: (fx, x) => (fx.love(crush(x), 9), fx.stat('duyen', 2)) },
      { t: 'Kẹp cánh phượng vào trang ấy', do: (fx, x) => (fx.love(crush(x), 7), fx.stat('dao', 3)) },
    ],
  },
  {
    id: 'phuong',
    min: 14,
    max: 17,
    title: 'Mùa phượng cuối cấp',
    bg: bg('cong', 'dusk'),
    who: cw(),
    text: (x) => [`Buổi học cuối. Hoa phượng rụng đỏ sân trường. ${C(x)} đứng ở cổng như đang đợi ai.`],
    choices: [
      { t: 'Đến nói lời tạm biệt thật', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('tinh', 3)) },
      { t: 'Tỏ tình luôn, không còn gì để mất', do: (fx, x) => (fx.love(crush(x), x.s.love[crush(x)] >= 30 ? 14 : -4), fx.stat('noi', 6)), note: (x) => (x.s.love[crush(x)] >= 30 ? `${C(x)} cười: "Sao giờ mới nói?"` : `${C(x)} ngượng: "Mình... là bạn thôi nhé."`) },
      { t: 'Đi đường khác về', do: (fx) => fx.stat('tam', -3), note: () => 'Mười năm sau vẫn còn tự hỏi nếu hôm ấy...' },
    ],
  },
  {
    id: 'kinhcan',
    min: 11,
    max: 15,
    title: 'Cặp kính cận đầu tiên',
    bg: bg('pho'),
    text: (x) => [`Ngồi bàn cuối không nhìn rõ bảng. ${Mom(x)} dẫn đi cắt kính. Đeo vào, cả thế giới bỗng nét căng.`],
    choices: [
      { t: 'Chọn gọng tròn to cho "ngầu"', do: (fx) => (fx.stat('duyen', 3), fx.stat('noi', 3)) },
      { t: 'Không chịu đeo, sợ bị trêu', do: (fx) => (fx.stat('hoc', -3), fx.stat('tam', -2)) },
      { t: 'Đeo vào, học lên hẳn', do: (fx) => fx.stat('hoc', 6) },
    ],
  },
  {
    id: 'mangdien',
    min: 13,
    max: 17,
    from: 2010,
    title: 'Chiếc điện thoại đầu tiên',
    bg: bg('nha'),
    text: (x) => [`${Bm(x)} mua cho ${x.me} chiếc điện thoại ${x.year < 2015 ? 'cảm ứng đầu tiên' : 'riêng'}: "Để gọi khi cần. Không được chơi game."`],
    choices: [
      { t: 'Cài ngay mạng xã hội, kết bạn cả lớp', do: (fx) => (fx.stat('duyen', 4), fx.stat('hoc', -2)) },
      { t: (x) => `Lưu số ${C(x)} đầu tiên`, do: (fx, x) => (fx.love(crush(x), 6), fx.stat('dao', 3)) },
      { t: 'Dùng đúng để gọi, như đã hứa', do: (fx) => (fx.rel('bome', 6), fx.stat('hoc', 3)) },
    ],
  },
  {
    id: 'noel',
    min: 13,
    max: 17,
    from: 1995,
    if: (x) => x.f.urban,
    title: 'Đêm Noel',
    bg: bg('pho', 'night'),
    who: cw(),
    text: (x) => [`Đêm Giáng sinh, cả phố chen nhau ra ${x.f.province === 'TP. Hồ Chí Minh' ? 'nhà thờ Đức Bà' : 'nhà thờ Lớn'}. ${C(x)} rủ ${x.me} đi cùng nhóm bạn.`],
    choices: [
      { t: (x) => `Đi, xin ${x.bm} về trước mười giờ`, do: (fx, x) => (fx.love(crush(x), 8), fx.rel('bome', 2)) },
      { t: 'Trốn đi, về lúc nửa đêm', do: (fx, x) => (fx.love(crush(x), 10), fx.stat('noi', 5), fx.rel('bome', -6)) },
      { t: 'Ở nhà, gửi một tấm thiệp', do: (fx, x) => (fx.love(crush(x), 4), fx.stat('tinh', 3)) },
    ],
  },
];

/* =========================================================
   18-19 TUỔI: rời nhà
   ========================================================= */
const YOUNG: Life[] = [
  {
    id: 'nhaphoc',
    min: 18,
    max: 19,
    if: (x) => x.has('daihoc') && !x.has('dilam'),
    title: 'Ngày nhập học',
    bg: bg('cong'),
    text: (x) =>
      bigCity(x)
        ? [`${x.me} đạp xe đến trường nhập học, ngay trong thành phố. ${x.year < 2005 ? 'Giảng đường quạt trần kêu cọt kẹt, ba trăm người một lớp.' : 'Nhóm lớp lập ngay hôm đầu, ba trăm tin nhắn một tối.'}`]
        : [`${x.me} xách va li lên thành phố nhập học. ${x.year < 2005 ? 'Ký túc xá tám người một phòng, giường tầng sắt kêu cót két.' : 'Phòng trọ mười hai mét vuông, chung chủ với ba đứa khác.'}`],
    choices: [
      { t: 'Làm quen cả dãy phòng trong một tối', do: (fx) => (fx.stat('duyen', 6), fx.rel('banthan', 3)) },
      { t: 'Gọi điện về nhà khóc', do: (fx) => (fx.rel('bome', 6), fx.stat('tinh', 3)) },
      { t: 'Đi làm thêm ngay tuần đầu', do: (fx) => (fx.stat('tien', 8), fx.flag('dilam')) },
    ],
  },
  {
    id: 'muahexanh',
    min: 18,
    max: 19,
    title: 'Mùa hè xanh',
    bg: bg('vuon', 'day'),
    text: (x) => [`Đi tình nguyện Mùa hè xanh ở một xã vùng sâu. Ban ngày làm đường, tối dạy chữ cho trẻ con. Có một người cùng đội hay ngồi cạnh ${x.me} lúc ăn cơm.`],
    choices: [
      { t: 'Ngồi lại cùng ăn, kể chuyện', do: (fx) => (fx.stat('dao', 6), fx.stat('tinh', 3)) },
      { t: 'Tập trung làm việc', do: (fx) => (fx.stat('tam', 5), fx.stat('hoc', 2)) },
    ],
  },
  {
    id: 'sinhnhat18',
    min: 18,
    max: 18,
    title: 'Sinh nhật mười tám',
    bg: bg('quan', 'night'),
    who: cw(),
    text: (x) => [`Sinh nhật mười tám tuổi. ${x.s.bestie} tổ chức bất ngờ ở quán quen. ${C(x)} cũng đến, mang theo một món quà nhỏ.`],
    choices: [
      { t: 'Mở quà ngay trước mọi người', do: (fx, x) => (fx.love(crush(x), 6), fx.stat('duyen', 3)) },
      { t: 'Để về nhà mới mở', do: (fx, x) => (fx.love(crush(x), 8), fx.stat('tinh', 3)), note: () => 'Bên trong có một mảnh giấy, viết đúng một câu.' },
      { t: 'Ước điều ước thật to', do: (fx) => fx.stat('dao', 6) },
    ],
  },
  {
    id: 'lamthem',
    min: 18,
    max: 19,
    title: 'Việc làm thêm đầu tiên',
    bg: bg('quan', 'day'),
    text: (x) => [`${x.me} xin được việc ${x.year < 2005 ? 'dạy gia sư' : x.year < 2018 ? 'phục vụ quán cà phê' : 'bán hàng online'}. Tháng lương đầu tiên ${x.year < 2005 ? 'ba trăm nghìn' : 'hai triệu'}.`],
    choices: [
      { t: (x) => `Gửi về biếu ${x.bm}`, do: (fx) => (fx.rel('bome', 10), fx.stat('tinh', 3)) },
      { t: 'Mua một bộ quần áo mới', do: (fx) => (fx.stat('duyen', 5), fx.stat('tien', 2)) },
      { t: 'Gửi tiết kiệm', do: (fx) => fx.stat('tien', 8) },
    ],
  },
  {
    id: 'xekhach',
    min: 18,
    max: 19,
    if: (x) => !x.f.urban,
    title: 'Chuyến xe khách lên thành phố',
    bg: bg('pho', 'dusk'),
    text: (x) => [`Bến xe đông nghịt. ${Mom(x)} dúi vào túi ${x.me} gói xôi, chai nước mắm và một xấp tiền gấp nhỏ. "Lên đó nhớ ăn uống đầy đủ."`],
    choices: [
      { t: (x) => `Ôm ${x.mom} thật lâu`, do: (fx) => (fx.rel('bome', 8), fx.stat('tinh', 4)) },
      { t: 'Hứa năm nào cũng về Tết', do: (fx) => (fx.rel('bome', 5), fx.flag('huave')) },
      { t: 'Bước lên xe, không ngoái lại', do: (fx) => (fx.stat('noi', 5), fx.stat('tam', -2)) },
    ],
  },
];

const ALL: Life[] = [...SMALL, ...KID, ...TEEN, ...YOUNG];

/* =========================================================
   NĂM THÁNG TRÔI QUA: chuyện tự xảy ra, không cần chọn (kiểu 1 in 8 Billion)
   ========================================================= */
type Auto = { id: string; min: number; max: number; from?: number; to?: number; if?: (x: Ctx) => boolean; t: (x: Ctx) => string; do?: (fx: Fx, x: Ctx) => void };

/** sống ở nội thành Hà Nội / TP. Hồ Chí Minh: học đại học không phải xa nhà */
const bigCity = (x: Ctx) => x.f.urban && (x.f.province === 'Hà Nội' || x.f.province === 'TP. Hồ Chí Minh');
const kg = (x: Ctx) => (2.6 + (hash(`${x.s.seed ?? 0}kg`) % 11) / 10).toFixed(1).replace('.', ',');
const AUTO: Auto[] = [
  // 0-2 tuổi
  { id: 'sinh', min: 0, max: 0, t: (x) => `${x.c.name} chào đời ở ${x.f.urban ? (['Hà Nội', 'TP. Hồ Chí Minh'].includes(x.f.province) ? 'bệnh viện phụ sản' : 'bệnh viện tỉnh') : 'trạm xá xã'}${x.f.province ? `, ${x.f.province}` : ''}, nặng ${kg(x)} cân. ${x.f.siblings.some((s) => s.older) ? 'Anh chị ghé đầu vào nôi nhìn mãi.' : 'Cả nhà thay nhau bế.'}` },
  { id: 'daythang', min: 0, max: 0, t: (x) => `Đầy tháng, ${x.bm === 'ông bà' ? 'bà' : 'bà nội'} đặt tên ở nhà là "${['Bống', 'Cún', 'Mít', 'Su', 'Bin', 'Tôm', 'Bơ', 'Na'][hash(`${x.s.seed ?? 0}ten`) % 8]}".` },
  { id: 'noi', min: 2, max: 2, t: (x) => `Nói được câu đầu tiên: "${['Bà ơi', 'Mẹ', 'Bố', 'Ăn', 'Không'][hash(`${x.s.seed ?? 0}noi`) % 5]}!". Cả nhà vỗ tay như đón Tết.`, do: (fx) => fx.stat('duyen', 2) },
  { id: 'di', min: 2, max: 2, t: () => 'Biết đi, ngã u đầu ba lần trong một buổi sáng.', do: (fx) => fx.stat('noi', 2) },
  { id: 'phatban', min: 2, max: 4, t: (x) => `Sốt phát ban một tuần. ${Mom(x)} thức trắng, sáng nào cũng nấu cháo hành.`, do: (fx) => (fx.rel('bome', 3), fx.stat('khoe', -3)) },
  // 3-5 tuổi
  { id: 'deptong', min: 3, max: 5, to: 2010, t: (x) => `Được ${x.mom} mua cho đôi dép tổ ong mới, đi ngủ cũng không chịu cởi.` },
  { id: 'toctrai', min: 3, max: 5, t: () => 'Cắt tóc kiểu trái dừa ở hiệu đầu ngõ, khóc cả buổi chiều.', do: (fx) => fx.stat('duyen', -1) },
  { id: 'baihat', min: 3, max: 5, t: (x) => `Thuộc bài "${x.year < 2010 ? 'Bà ơi bà' : 'Con cò bé bé'}", hát cho cả họ nghe ngày giỗ.`, do: (fx) => fx.stat('duyen', 3) },
  { id: 'ongdot', min: 3, max: 6, if: (x) => !x.f.urban, t: () => 'Bị ong đốt sưng một bên mắt vì chọc tổ ong ở bụi chuối.', do: (fx) => fx.stat('noi', 2) },
  { id: 'chua', min: 3, max: 6, t: (x) => `Theo ${x.bm === 'ông bà' ? 'bà' : 'bà nội'} đi chùa ngày rằm, được cho một nắm xôi.`, do: (fx) => fx.stat('dao', 2) },
  { id: 'anhviện', min: 3, max: 6, to: 2008, t: () => 'Được chụp một tấm ảnh ở hiệu ảnh: tô son đỏ chót, chấm một chấm giữa trán.' },
  { id: 'suaongtho', min: 3, max: 6, to: 2000, t: () => 'Ăn vụng nửa hộp sữa đặc Ông Thọ, bị phát hiện vì dính đầy mép.' },
  { id: 'xemxiec', min: 4, max: 8, t: (x) => `Bố cho đi xem ${x.year < 2005 ? 'xiếc' : 'xiếc và thú'} lần đầu. Về nhà đòi làm diễn viên xiếc.` },
  // 6-11 tuổi
  { id: 'xedap', min: 6, max: 9, t: () => 'Tự học đi xe đạp, ngã trầy cả hai đầu gối, nhưng đi được.', do: (fx) => (fx.stat('noi', 3), fx.stat('khoe', 2)) },
  { id: 'rangsua', min: 6, max: 8, t: () => 'Rụng chiếc răng sữa đầu tiên, ném lên mái nhà, ước mọc răng thật đẹp.' },
  { id: 'giaykhen', min: 6, max: 11, t: (x) => `Được giấy khen học sinh ${x.s.stats.hoc >= 40 ? 'giỏi' : 'tiên tiến'}. ${Bm(x)} lồng khung treo lên tường.`, do: (fx) => (fx.stat('hoc', 3), fx.rel('bome', 2)) },
  { id: 'tienansang', min: 6, max: 10, t: () => 'Đánh rơi tiền ăn sáng, nhịn đói cả buổi, không dám kể với ai.', do: (fx) => fx.stat('tam', -2) },
  { id: 'phimrap', min: 7, max: 11, from: 2005, if: (x) => x.f.urban, t: () => 'Lần đầu đi xem phim ở rạp, sợ đến mức nhắm mắt nửa phim.' },
  { id: 'cavang', min: 6, max: 11, t: () => 'Nuôi hai con cá vàng trong lọ thủy tinh, đặt tên theo tên hai đứa bạn.' },
  { id: 'hocboi', min: 7, max: 11, t: (x) => (x.f.urban ? 'Học bơi ở bể bơi thành phố, uống không biết bao nhiêu nước.' : 'Học bơi ở sông với lũ trẻ trong làng, bố đứng trên bờ canh.'), do: (fx) => (fx.stat('tam', 2), fx.stat('khoe', 4)) },
  { id: 'gaytay', min: 7, max: 11, t: () => 'Trèo cây ổi nhà hàng xóm, ngã gãy tay, bó bột cả tháng. Cả lớp ký tên lên bột.', do: (fx) => (fx.stat('noi', 3), fx.stat('khoe', -4)) },
  { id: 'tivimau', min: 3, max: 11, from: 1985, to: 1997, t: () => 'Nhà mua chiếc tivi màu đầu tiên. Cả xóm sang xem nhờ.', do: (fx) => fx.stat('tam', 2) },
  { id: 'dienthoaiban', min: 6, max: 12, from: 1995, to: 2006, t: () => 'Nhà lắp điện thoại bàn. Mỗi lần chuông reo cả nhà tranh nhau nghe.' },
  { id: 'internet', min: 8, max: 14, from: 2005, to: 2013, t: () => 'Nhà nối mạng internet. Tiếng modem rè rè mỗi tối.', do: (fx) => fx.stat('hoc', 2) },
  { id: 'xemoi', min: 6, max: 12, t: (x) => `Bố mua chiếc ${ride(x.year)} mới. Cả nhà đứng ngắm cả buổi.`, do: (fx) => fx.stat('tien', 2) },
  { id: 'ongmat', min: 7, max: 14, if: (x) => x.bm !== 'ông bà', t: () => 'Ông nội mất. Lần đầu tiên thấy bố khóc.', do: (fx) => (fx.stat('tinh', 4), fx.rel('bome', 2)) },
  { id: 'vequengoai', min: 6, max: 12, t: () => 'Hè về quê ngoại, được bà cho ăn kẹo lạc, đi tắm sông cả tháng.', do: (fx) => fx.stat('tinh', 2) },
  { id: 'banmoi', min: 6, max: 11, t: (x) => `Lớp có bạn mới chuyển đến, tên ${kid(x, 'moi')}. Hai đứa thành bạn cùng bàn.`, do: (fx) => fx.rel('banthan', 2) },
  { id: 'trucnhat', min: 7, max: 15, t: () => 'Bị phạt trực nhật cả tuần vì nói chuyện trong giờ.', do: (fx) => fx.stat('noi', 2) },
  { id: 'diemkem', min: 7, max: 15, t: (x) => `Bị điểm kém môn ${['Toán', 'Văn', 'Tiếng Anh', 'Lịch sử'][hash(`${x.s.seed ?? 0}${x.age}dk`) % 4]}, giấu bài kiểm tra dưới gầm giường.`, do: (fx) => fx.stat('tam', -2) },
  { id: 'gamebai', min: 8, max: 13, from: 2000, t: (x) => `Mê ${x.year < 2010 ? 'chơi Mario trên máy điện tử bốn nút' : x.year < 2018 ? 'game trên máy tính' : 'game trên điện thoại'}, bị ${x.mom} giấu dây sạc.` },
  // 12-17 tuổi
  { id: 'mun', min: 12, max: 15, t: () => 'Nổi mụn trứng cá đầu tiên. Soi gương cả buổi sáng.', do: (fx) => fx.stat('duyen', -1) },
  { id: 'cao', min: 12, max: 15, t: (x) => `Cao vọt lên mười phân trong một năm. Quần đồng phục ngắn cũn cỡn, ${x.mom} phải nối thêm gấu.` },
  { id: 'nhinTrom', min: 12, max: 17, t: (x) => `Bắt gặp ${C(x)} nhìn trộm mình trong giờ Văn. Cả hai cùng quay đi.`, do: (fx, x) => fx.love(crush(x), 4) },
  { id: 'cangtin', min: 12, max: 17, t: (x) => `${C(x)} mua hộ ${x.me} cốc ${x.year < 2008 ? 'nước mía' : 'trà sữa'} ở căng tin, không lấy tiền.`, do: (fx, x) => fx.love(crush(x), 4) },
  { id: 'tenvo', min: 12, max: 16, t: (x) => `Viết tên ${C(x)} vào góc vở, rồi tô đen kín lại cho không ai đọc được.`, do: (fx, x) => fx.love(crush(x), 2) },
  { id: 'dichoixa', min: 12, max: 17, t: (x) => `Lần đầu đi chơi xa với lớp: ${(regionOf(x.f.province) === 'nam' ? ['Vũng Tàu', 'Đà Lạt', 'Mũi Né', 'Cần Giờ'] : regionOf(x.f.province) === 'trung' ? ['Hội An', 'Bà Nà', 'Cửa Lò', 'Nha Trang'] : ['Tam Đảo', 'Đồ Sơn', 'Hạ Long', 'Sa Pa'])[hash(`${x.s.seed ?? 0}xa`) % 4]}. Thức trắng đêm buôn chuyện.`, do: (fx) => fx.rel('banthan', 3) },
  { id: 'bongda', min: 12, max: 17, t: (x) => `Mê ${x.year < 2006 ? 'xem bóng đá Ngoại hạng Anh cùng bố' : 'bóng đá, thức đêm xem Champions League'}.` },
  { id: 'thuemay', min: 13, max: 17, from: 2004, t: (x) => `Bị ${x.bm} thu điện thoại vì nhắn tin đến một giờ sáng.`, do: (fx) => fx.rel('bome', -2) },
  { id: 'xebus', min: 12, max: 16, from: 2002, if: (x) => x.f.urban, t: () => 'Lần đầu tự đi xe buýt một mình. Đi nhầm tuyến, về muộn hai tiếng.' },
  { id: 'giaivannghe', min: 12, max: 17, t: () => 'Lớp đạt giải ba văn nghệ chào mừng 20/11. Cả lớp đi ăn kem mừng.', do: (fx) => fx.stat('duyen', 2) },
  { id: 'hocgioi', min: 12, max: 17, if: (x) => x.s.stats.hoc >= 45, t: () => 'Được chọn vào đội tuyển học sinh giỏi của trường.', do: (fx) => fx.stat('hoc', 3) },
  { id: 'xemay16', min: 16, max: 17, from: 1995, t: (x) => `Lén lấy xe của bố tập đi, đâm vào bụi ${x.f.urban ? 'cây trước cửa' : 'tre đầu làng'}.`, do: (fx) => fx.stat('noi', 3) },
  { id: 'trom_ve', min: 13, max: 17, t: (x) => `Nghe nói ${C(x)} cũng ${x.lg === 'm' ? 'hỏi thăm' : 'hay nhắc'} về mình với bạn. Mất ngủ cả đêm.`, do: (fx, x) => fx.love(crush(x), 3) },
  { id: 'nhacbuon', min: 13, max: 17, t: (x) => `Nghe đi nghe lại một bài nhạc buồn trên ${x.year < 2003 ? 'đài cassette' : x.year < 2012 ? 'máy MP3' : 'điện thoại'}.` },
  { id: 'aodai', min: 15, max: 17, if: (x) => isF(x), t: () => 'May bộ áo dài trắng đầu tiên cho cấp ba. Đạp xe vướng tà, ngã một lần.' },
  { id: 'veoxe', min: 15, max: 17, if: (x) => !isF(x), t: () => 'Vỡ giọng, giọng ồm ồm như vịt đực. Không dám phát biểu cả tháng.' },
  { id: 'thithu', min: 16, max: 17, t: () => 'Thi thử đại học lần thứ ba, điểm lên xuống như chứng khoán.', do: (fx) => fx.stat('hoc', 2) },
  // 18-19 tuổi
  { id: 'banglai', min: 18, max: 19, from: 1996, t: () => 'Thi bằng lái xe máy, trượt vòng số tám một lần rồi mới đỗ.' },
  { id: 'xanha', min: 18, max: 19, if: (x) => !bigCity(x), t: (x) => `Lần đầu xa nhà. Tối nào cũng gọi về cho ${x.mom}, rồi thưa dần.`, do: (fx) => fx.rel('bome', -2) },
  { id: 'nau', min: 18, max: 19, t: () => 'Tự nấu bữa cơm đầu tiên: cơm khê, trứng cháy, vẫn ăn hết.' },
];

const autoLine = (x: Ctx, used: Set<string>) => {
  const seed = `${x.s.seed ?? 0}|${x.c.name}|${x.age}`;
  const ok = AUTO.filter((a) => !used.has(a.id) && !x.has(`la_${a.id}`) && x.age >= a.min && x.age <= a.max && x.year >= (a.from ?? 0) && x.year <= (a.to ?? 9999) && (!a.if || a.if(x)));
  return ok.sort((a, b) => hash(seed + a.id) - hash(seed + b.id))[0];
};

/** Chuỗi năm tháng: mỗi năm một ô; tuổi teen hai ô một năm; xen giữa các cảnh chính */
export const LY_NEXT: Record<string, string> = {
  '0': 'ly@1',
  '1': 'ly@2',
  '2': 'ly@3',
  '3': 'ly@4',
  '4': 'ly@5',
  '5': 'c6_dieu',
  '6': 'ly@7',
  '7': 'c8_lop',
  '8': 'ev@9',
  '9': 'c10_he',
  '10': 'ev@11',
  '11': 'c12_chuyennha',
  '12': 'ly@12#2',
  '12#2': 'ly@13',
  '13': 'ly@13#2',
  '13#2': 'ev@14',
  '14': 'ly@14#2',
  '14#2': 't15',
  '15': 'ly@15#2',
  '15#2': 't16_hethong',
  '16': 'ly@16#2',
  '16#2': 'ev@16',
  '17': 'ly@17#2',
  '17#2': 't17_thi',
  '18': 'y19_veve',
  '19': 'y20_chon',
};

/** ô này có phải hỏi người chơi không: không phải năm nào cũng có lựa chọn */
const asks = (x: Ctx, key: string) => {
  const [a, n] = key.split('#').map(Number);
  if (a === 0 || a === 2) return false;
  if (a === 1) return true;
  const p = a <= 5 ? 10 : a <= 11 ? 35 : n ? 20 : 60;
  return hash(`${x.s.seed ?? 0}|ask|${key}`) % 100 < p;
};
const keyOf = (id: string) => id.slice(3);

/** Ô năm tháng `age` (#n): có lựa chọn thì là cảnh chọn; không thì gộp các năm liền nhau thành một dòng thời gian */
export function lyScene(age: number, n: number, x: Ctx, at: (a: number) => Ctx): Scene {
  const key = n > 1 ? `${age}#${n}` : `${age}`;
  const next = LY_NEXT[key] ?? 'y20_chon';
  if (asks(x, key)) {
    const sc = lifeAt(age, n, x, next);
    if (!sc.skip) return sc;
  }
  // dòng thời gian: gom các ô liền nhau không có lựa chọn
  const lines: { age: number; year: number; t: string; a: Auto }[] = [];
  const used = new Set<string>();
  let k = key;
  let last = next;
  for (;;) {
    const a = Number(k.split('#')[0]);
    const xa = at(a);
    const picks = a === 0 ? AUTO.filter((q) => q.min === 0) : [autoLine(xa, used)].filter(Boolean);
    for (const p of picks as Auto[]) {
      used.add(p.id);
      lines.push({ age: a, year: xa.year, t: p.t(xa), a: p });
    }
    last = LY_NEXT[k] ?? 'y20_chon';
    if (!last.startsWith('ly@') || asks(x, keyOf(last))) break;
    k = keyOf(last);
  }
  const first = lines[0]?.age ?? age;
  const end = lines[lines.length - 1]?.age ?? age;
  return {
    id: n > 1 ? `ly@${age}#${n}` : `ly@${age}`,
    age,
    chapter: age <= 12 ? 'Tuổi thơ' : age <= 17 ? 'Tuổi teen' : 'Tuổi trẻ',
    kind: 'feed',
    bg: () => ({ place: age < 6 ? 'nha' : age < 12 ? 'ngo' : 'phong', time: 'day' }),
    title: first === 0 ? 'Chào đời' : first === end ? 'Một năm trôi qua' : `Từ ${first} đến ${end} tuổi`,
    text: () => [],
    feed: () => lines.map((l) => ({ age: l.age, year: l.year, t: l.t })),
    choices: [
      {
        t: '▶ Sống tiếp',
        do: (fx) => {
          for (const l of lines) {
            fx.flag(`la_${l.a.id}`);
            l.a.do?.(fx, at(l.age));
          }
        },
      },
    ],
    next: last,
  };
}
export const LIFE_IDS = ALL.map((l) => l.id);

function hash(s: string) {
  let h = 11;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x9e3779b1);
  // trộn đều các bit để thứ tự xáo thật sự khác nhau giữa các đời
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

const fits = (l: Life, x: Ctx) => !x.has(`ly_${l.id}`) && x.age >= l.min && x.age <= l.max && x.year >= (l.from ?? 0) && x.year <= (l.to ?? 9999) && (!l.if || l.if(x));

/** Chuyện của năm `age`: ưu tiên chuyện sắp hết tuổi gặp, còn lại xáo theo từng đời */
export function lifeAt(age: number, n: number, x: Ctx, next: string): Scene {
  const id = n > 1 ? `ly@${age}#${n}` : `ly@${age}`;
  const chapter = age <= 12 ? 'Tuổi thơ' : age <= 17 ? 'Tuổi teen' : 'Tuổi trẻ';
  const seed = `${x.s.seed ?? 0}|${x.c.name}|${x.c.birthYear}|${x.f.province}|${age}|${n}`;
  const cands = ALL.filter((l) => fits(l, x));
  // xáo ngẫu nhiên cố định theo đời; chuyện chỉ còn năm nay là hết tuổi thì được ưu tiên một chút
  const score = (l: Life) => (hash(seed + l.id) % 1000) - (l.max === age ? 250 : 0);
  const l = cands.sort((a, b) => score(a) - score(b))[0];
  if (!l) return { id, age, chapter, title: '', text: () => [], choices: [], next, skip: () => true };
  return {
    id,
    age,
    chapter,
    title: l.title,
    bg: l.bg,
    who: l.who,
    text: l.text,
    kind: l.kind,
    msgs: l.msgs,
    post: l.post,
    timer: l.timer,
    timeout: l.timeout,
    choices: l.choices.map((c) => ({ ...c, do: (fx, cx) => (fx.flag(`ly_${l.id}`), c.do?.(fx, cx)) })),
    next,
  };
}
