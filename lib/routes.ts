/**
 * Tuyến tình (kiểu Road to Empress + hiệu ứng cánh bướm).
 * Mỗi năm Mùa yêu, sau lượt tự do là một "ngã rẽ": chưa theo ai thì chọn hướng đi;
 * đang theo ai thì sang chặng tiếp của tuyến người ấy. Mỗi tuyến 7 chặng:
 * hẹn đầu - bí mật - người thứ ba - biến cố - ra mắt nhà người ấy - chuyến đi đầu tiên - ngã rẽ cuối. Lựa chọn ở chặng trước
 * (và cả chuyện từ hồi bé) đổi tình huống, đổi lựa chọn ở chặng sau; khi vậy game ghi "🦋".
 */

import type { Bg } from '@/components/Backdrop';
import { activeOf, LOVES, type Choice, type Ctx, type Fx, type LoveId, type Scene } from './story';
import { jobOf } from './profiles';
import { isSouth } from './names';
import { away } from './actions';

type Person = {
  /** chỗ hẹn đúng gu / an toàn / lệch gu */
  dates: [string, string, string];
  /** bí mật người ấy kể ở chặng 2 */
  secret: string;
  /** người thứ ba / trở ngại ở chặng 3 */
  rival: string;
  /** biến cố chặng 4 khi bí mật KHÔNG bị lộ */
  crisis: string;
  /** cơ hội đi xa ở chặng cuối */
  dream: string;
  /** chuyện hồi bé (cờ) làm thay đổi buổi hẹn đầu */
  past?: { flag: string; t: string; note: string };
};

const P: Record<LoveId, Person> = {
  khoi: {
    dates: ['Về ngõ cũ thả diều', 'Đi ăn kem ở bờ hồ', 'Vào trung tâm thương mại đông nghẹt'],
    secret: 'nhà sắp phải bán căn nhà trong ngõ để trả nợ',
    rival: '{co} bạn đồng nghiệp ngày nào cũng mang cơm trưa cho',
    crisis: 'hai bên gia đình vốn xích mích chuyện ranh giới đất, giờ cấm hai đứa qua lại',
    dream: 'được cử đi làm ở công trường trên núi hai năm',
    past: { flag: 'dieu', t: 'Mang theo con diều năm nào ra bãi', note: 'Năm 6 tuổi bạn trèo cây gỡ diều. Con diều ấy vẫn còn.' },
  },
  long: {
    dates: ['Phóng xe ra ngoại thành ngắm bình minh', 'Ngồi trà đá vỉa hè', 'Đi xem triển lãm tranh'],
    secret: 'từng bỏ học vì phải nuôi em, chưa kể với ai',
    rival: 'đám bạn cũ rủ quay lại những cuộc đua đêm',
    crisis: 'gây gổ ở quán vì bênh bạn, bị đưa về phường',
    dream: 'có người rủ {xa} mở xưởng độ xe riêng',
    past: { flag: 'danh_long', t: 'Nhắc lại trận đánh nhau năm lớp ba', note: 'Năm 8 tuổi bạn quay xuống đánh lại. Người ấy nhớ mãi.' },
  },
  minh: {
    dates: ['Đi hội sách rồi ngồi quán bàn chuyện', 'Đi xem phim', 'Đi quẩy ở quán bar'],
    secret: 'áp lực làm "con nhà người ta" đến mức mất ngủ cả năm',
    rival: 'một bạn cùng lớp cao học, giỏi ngang ngửa, hay rủ làm chung đề tài',
    crisis: 'trượt học bổng lần đầu tiên trong đời, tự nhốt mình trong phòng',
    dream: 'nhận học bổng thạc sĩ ở nước ngoài',
    past: { flag: 'mach_co', t: 'Trêu chuyện hồi bé mách cô giáo', note: 'Năm 8 tuổi bạn mách cô. Người ấy ghi nhận từ đó.' },
  },
  phong: {
    dates: ['Đi bộ quanh hồ lúc sáng sớm', 'Ăn tối ở quán quen', 'Thức khuya xem phim kinh dị'],
    secret: 'từng mất một bệnh nhân và vẫn mơ thấy mỗi đêm',
    rival: 'bạn học y cũ, giờ là đồng nghiệp cùng ca trực',
    crisis: 'bị người nhà bệnh nhân đăng bài tố sai trên mạng',
    dream: 'được mời sang tuyến huyện vùng cao làm hai năm',
  },
  hai: {
    dates: ['Nghe nhạc acoustic, hát tặng một bài', 'Đi ăn ốc', 'Đi xem bóng đá'],
    secret: 'nợ tiền thuê phòng ba tháng vì dồn hết vào thu âm',
    rival: 'một nhà sản xuất hứa nâng đỡ nếu chịu đổi phong cách',
    crisis: 'bài hát tâm huyết bị người khác nhận là của mình',
    dream: 'được mời đi lưu diễn cả năm',
  },
  tuananh: {
    dates: ['Tự đặt bàn nhà hàng đẹp, tự trả tiền', 'Đi cà phê sách', 'Để người ấy bao hết'],
    secret: 'công ty đang khó, có thể phá sản trong năm nay',
    rival: 'đối tác giàu có được gia đình gán ghép',
    crisis: 'tin đồn công ty phá sản, cả phòng nghi ngờ người ấy',
    dream: 'được điều sang quản lý chi nhánh nước ngoài',
  },
  kai: {
    dates: ['Đi phượt Hà Giang hai ngày', 'Ăn phở rồi dạo phố', 'Ở nhà xem phim'],
    secret: 'visa sắp hết, gia đình bên kia muốn về hẳn',
    rival: 'một bạn đồng hương cùng du học',
    crisis: 'bị bố mẹ hai bên phản đối chuyện yêu người khác nước',
    dream: 'phải về nước, rủ đi cùng',
  },
  quan: {
    dates: ['Đi dạo đêm, đội mũ kín mặt', 'Ăn khuya quán vỉa hè', 'Đi sự kiện đông người'],
    secret: 'muốn bỏ nghề nhưng hợp đồng còn năm năm',
    rival: 'bạn diễn được công ty "đẩy thuyền"',
    crisis: 'bị paparazzi chụp ảnh hai người, cả mạng soi',
    dream: 'được mời đóng phim ở nước ngoài một năm',
  },
  bao: {
    dates: ['Đi trò chơi điện tử rồi ăn vặt', 'Ăn trưa gần công ty', 'Đi tiệc sang trọng'],
    secret: 'hay cười vì sợ người khác thấy mình buồn',
    rival: 'sếp mới cứ giao việc riêng cho người ấy',
    crisis: 'công ty cắt giảm, một trong hai người phải nghỉ',
    dream: 'có lời mời làm diễn viên hài ở thành phố khác',
  },
  duy: {
    dates: ['Đi tàu đêm đến một ga lạ', 'Ngồi quán cà phê gần ga', 'Đi trung tâm thương mại'],
    secret: 'đi tàu khắp nơi để tìm người mẹ đã bỏ đi',
    rival: '{co} bạn thanh mai trúc mã ở quê chờ cưới',
    crisis: 'tìm được tin về mẹ, nhưng ở rất xa',
    dream: 'muốn đi một chuyến dài xuyên Việt, không biết bao giờ về',
  },
  hung: {
    dates: ['Nấu cơm ở nhà, chơi với mèo', 'Ăn bún ốc vỉa hè, đội mũ kín', 'Đi thảm đỏ cùng nhau'],
    secret: 'chưa bao giờ được sống một ngày bình thường từ năm mười bảy tuổi',
    rival: 'người quản lý muốn người ấy giữ hình ảnh độc thân',
    crisis: 'buổi họp báo ra sản phẩm biến thành buổi bị hỏi chuyện yêu đương',
    dream: 'được mời làm dự án lớn ở nước ngoài một năm',
  },
  tai: {
    dates: ['Về quê, ngồi xuồng nghe hát', 'Đi ăn lẩu mắm', 'Đi tiệc của giới showbiz'],
    secret: 'mỗi đêm đọc hết bình luận chê bai rồi khóc',
    rival: 'một người mẫu được công ty ghép cặp để "câu view"',
    crisis: 'một clip cắt ghép làm cả mạng quay ra chửi',
    dream: 'được mời đi tour hát khắp các tỉnh nửa năm',
  },
};

/** Đang theo tuyến của ai, và đã qua bao nhiêu chặng */
export function routeOf(x: Ctx): { id: LoveId; step: number } | null {
  // người ấy đã rời khỏi đời mình thì coi như tuyến đã đứt
  const f = x.s.flags.find((g) => g.startsWith('route_') && !x.has(`${g.slice(6)}_out`));
  if (!f) return null;
  const id = f.slice(6) as LoveId;
  const step = [1, 2, 3, 4, 5, 6, 7].filter((k) => x.has(`rb_${id}_${k}`)).length;
  return { id, step };
}

const bgs: Bg[] = [
  { place: 'quan', time: 'dusk' },
  { place: 'phong', time: 'night' },
  { place: 'pho', time: 'night' },
  { place: 'nha', time: 'night' },
  { place: 'congvien', time: 'dusk' },
];

const butterfly = (t: string) => `🦋 ${t}`;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** {co}: người thứ ba cùng giới với nhân vật chính; {xa}: đi xa theo vùng đang sống */
const fill = (t: string, cx: Ctx) => t.replace('{co}', cx.lg === 'm' ? 'cô' : 'anh').replace('{xa}', isSouth(cx.f.province) ? 'ra Hà Nội' : 'vào Sài Gòn');
const go = (fx: Fx, id: LoveId, k: number) => fx.flag(`rb_${id}_${k}`);
const endRoute = (fx: Fx, id: LoveId) => fx.unflag(`route_${id}`);

/** Cảnh ngã rẽ của năm Mùa yêu `age` */
export function routeScene(age: number, x: Ctx, next: string): Scene {
  const r = routeOf(x);
  // đang ở nước ngoài thì tuyến tình tạm dừng
  const base = { id: `route@${age}`, age, chapter: 'Tuổi trẻ', next, skip: (cx: Ctx) => away(cx) || cx.s.married };
  // chưa theo ai: chọn hướng đi
  if (!r) {
    // vòng yêu mới: người theo đuổi được chọn qua những buổi đi chơi, không hỏi riêng nữa
    const act: LoveId[] = [];
    if (!act.length) return { ...base, title: '', text: () => [], choices: [], skip: () => true };
    return {
      ...base,
      title: 'Ngã rẽ',
      bg: () => ({ place: 'pho', time: 'dusk' }),
      text: (cx) => [`${cx.me} ${cx.age} tuổi. Năm nay muốn đi theo hướng nào?`],
      choices: [
        ...act.map(
          (id): Choice => ({
            t: (cx) => `Theo đuổi ${cx.L(id)} (${jobOf(id, cx.lg, cx.age, cx.year)})`,
            loveId: id,
            do: (fx, cx) => {
              for (const g of cx.s.flags) if (g.startsWith('route_')) fx.unflag(g);
              fx.flag(`route_${id}`);
              fx.love(id, 4);
            },
          }),
        ),
        { t: 'Tập trung học, làm, chưa yêu ai', do: (fx) => (fx.stat('tien', 6), fx.stat('hoc', 4)) },
      ],
    };
  }
  const { id } = r;
  // vào tuyến muộn thì bỏ bớt chặng giữa (ra mắt, chuyến đi) để kịp ngã rẽ cuối trước 27 tuổi
  const step = (r.step === 4 || r.step === 5) && 26 - age < 6 - r.step ? 6 : r.step;
  const p = P[id];
  const L = (cx: Ctx) => cx.L(id);
  const scene = (title: string, text: (cx: Ctx) => string[], choices: Choice[]): Scene => ({ ...base, title, who: () => id, bg: () => bgs[step % bgs.length], text, choices });

  if (step === 0)
    return scene(
      'Thêm một buổi, kiểu khác hẳn',
      (cx) => [`Sau buổi hôm ấy, ${L(cx)} rủ đi thêm một buổi nữa, lần này để ${cx.me} chọn kiểu khác hẳn. Đi đâu đây?`],
      [
        ...(p.past
          ? [
              {
                t: p.past.t,
                if: (cx: Ctx) => cx.has(p.past!.flag),
                do: (fx: Fx) => (go(fx, id, 1), fx.flag(`r_${id}_hop`), fx.love(id, 18)),
                note: () => butterfly(p.past!.note),
              },
            ]
          : []),
        { t: p.dates[0], do: (fx) => (go(fx, id, 1), fx.flag(`r_${id}_hop`), fx.love(id, 14)), note: (cx) => `Đúng gu ${L(cx)}. Hai người nói chuyện đến khuya.` },
        { t: p.dates[1], do: (fx) => (go(fx, id, 1), fx.love(id, 6)) },
        { t: p.dates[2], do: (fx) => (go(fx, id, 1), fx.flag(`r_${id}_lech`), fx.love(id, -2)), note: (cx) => `${L(cx)} cố cười, nhưng rõ là không thoải mái.` },
      ],
    );

  if (step === 1)
    return scene(
      'Bí mật',
      (cx) => [
        ...(cx.has(`r_${id}_lech`) ? [butterfly(`Vì buổi hẹn đầu lệch gu, ${L(cx)} ngập ngừng lâu hơn mới chịu nói.`)] : []),
        `${L(cx)} thú thật: ${p.secret}.`,
      ],
      [
        { t: 'Giữ kín, chỉ hai người biết', do: (fx) => (go(fx, id, 2), fx.flag(`r_${id}_tin`), fx.love(id, 12)) },
        { t: 'Khuyên thật lòng, dù khó nghe', do: (fx) => (go(fx, id, 2), fx.love(id, 6), fx.stat('hoc', 3)) },
        { t: 'Kể cho bạn thân để xin lời khuyên', do: (fx) => (go(fx, id, 2), fx.flag(`r_${id}_lo`), fx.rel('banthan', 4)), note: () => 'Bạn thân hứa giữ kín...' },
      ],
    );

  if (step === 2)
    return scene(
      'Người thứ ba',
      (cx) => [`Xuất hiện ${fill(p.rival, cx)}. ${L(cx)} có vẻ khó xử.`],
      [
        { t: 'Tin người ấy, không hỏi gì', do: (fx, cx) => (go(fx, id, 3), fx.love(id, cx.has(`r_${id}_tin`) ? 12 : 6)), note: (cx) => (cx.has(`r_${id}_tin`) ? butterfly(`Vì bạn từng giữ kín bí mật, ${L(cx)} cũng tin bạn tuyệt đối.`) : '') },
        { t: 'Ghen ra mặt', do: (fx) => (go(fx, id, 3), fx.flag(`r_${id}_ghen`), fx.love(id, -6), fx.stat('noi', 5)) },
        { t: 'Lùi lại, để người ấy tự chọn', do: (fx) => (go(fx, id, 3), fx.love(id, 2), fx.stat('tam', -3)) },
      ],
    );

  if (step === 3) {
    const leaked = x.has(`r_${id}_lo`);
    return scene(
      'Biến cố',
      (cx) =>
        leaked
          ? [butterfly(`Bí mật bạn kể cho ${cx.s.bestie} đã lan ra. Giờ ai cũng biết ${L(cx)} ${p.secret}.`), `${L(cx)} nhìn ${cx.me}: "Chỉ có ${cx.goi} biết chuyện này thôi mà."`]
          : [`Biến cố: ${p.crisis}.`, ...(cx.has(`r_${id}_ghen`) ? [butterfly(`Vì lần ghen trước, ${L(cx)} ngại tìm đến ${cx.me} lúc này.`)] : [])],
      [
        { t: 'Đứng ra bảo vệ, mặc kệ thiên hạ', if: (cx) => cx.has(`r_${id}_tin`) || cx.has(`r_${id}_hop`), do: (fx) => (go(fx, id, 4), fx.love(id, 16), fx.stat('noi', 4)), note: () => butterfly('Lựa chọn này chỉ mở vì những gì hai người đã có từ trước.') },
        { t: leaked ? 'Nhận lỗi, xin lỗi thật lòng' : 'Ở bên, không nói gì nhiều', do: (fx) => (go(fx, id, 4), fx.love(id, leaked ? 2 : 8)) },
        { t: leaked ? 'Chối, đổ cho người khác' : 'Tránh mặt cho êm chuyện', do: (fx) => (go(fx, id, 4), fx.love(id, leaked ? -18 : -8)) },
      ],
    );
  }

  if (step === 4)
    return scene(
      'Ra mắt nhà người ấy',
      (cx) => [
        `Lần đầu đến nhà ${L(cx)} ăn cơm. ${cx.lg === 'm' ? 'Bố' : 'Mẹ'} ${L(cx)} gắp cho ${cx.me} miếng to nhất, rồi hỏi: "Cháu làm gì, lương tháng bao nhiêu?"`,
        ...(cx.has(`r_${id}_lo`) ? [butterfly(`Chuyện bí mật bị lộ năm ấy, cả nhà ${L(cx)} đều đã nghe.`)] : []),
      ],
      [
        { t: 'Thật thà kể hết, không tô vẽ', do: (fx, cx) => (go(fx, id, 5), fx.love(id, 6), fx.stat('tinh', 4), cx.s.stats.tien < 35 && fx.flag(`r_${id}_ngheo`)) },
        {
          t: 'Nói khéo, chuyển sang khen món ăn',
          do: (fx, cx) => {
            go(fx, id, 5);
            if (cx.s.stats.duyen >= 50) (fx.love(id, 10), fx.flag(`r_${id}_uong`), fx.say('Cả nhà cười rộn. Bố mẹ người ấy gật gù.'));
            else (fx.love(id, -4), fx.say('Khen nhầm món người ấy nấu hỏng. Bữa cơm hơi lặng.'));
          },
        },
        { t: 'Ăn xong giành rửa bát', do: (fx) => (go(fx, id, 5), fx.love(id, 8), fx.flag(`r_${id}_uong`)), note: () => butterfly('Bố mẹ người ấy sẽ nhớ cái bát rửa sạch bong ấy.') },
      ],
    );

  if (step === 5)
    return scene(
      'Chuyến đi đầu tiên',
      (cx) => [
        `Hai người đi ${cx.year < 2000 ? 'Đà Lạt bằng xe khách' : cx.year < 2015 ? 'Sa Pa bằng tàu đêm' : 'Phú Quốc bằng máy bay giá rẻ'}, lần đầu xa nhà cùng nhau. Đến nơi thì lạc đường, trời tối, điện thoại sắp hết pin.`,
        ...(cx.has(`r_${id}_ngheo`) ? [butterfly(`Nhà ${L(cx)} chê ${cx.me} nghèo, nên chuyến đi này phải giấu.`)] : []),
      ],
      [
        { t: 'Bình tĩnh hỏi đường, cười cho qua', do: (fx) => (go(fx, id, 6), fx.love(id, 10), fx.stat('tam', 4)), note: (cx) => `${L(cx)} bảo: "Đi với ${cx.goi}, lạc cũng vui."` },
        { t: 'Cãi nhau xem lỗi tại ai', do: (fx) => (go(fx, id, 6), fx.love(id, -8), fx.flag(`r_${id}_cai`)) },
        { t: 'Thuê luôn một phòng, mai tính', do: (fx) => (go(fx, id, 6), fx.love(id, 6), fx.stat('noi', 4), fx.stat('tien', -4)) },
      ],
    );

  // chặng cuối: cơ hội đi xa
  return scene(
    'Ngã rẽ cuối',
    (cx) => [
      `${L(cx)} ${fill(p.dream, cx)}. "${cap(cx.goi)} tính sao?"`,
      ...(cx.has(`r_${id}_uong`) ? [butterfly(`Bố mẹ ${L(cx)} gọi riêng cho ${cx.me}: "Hai đứa tính gì thì tính cùng nhau nhé."`)] : []),
      ...(cx.has(`r_${id}_cai`) ? [butterfly('Trận cãi nhau ở chuyến đi năm ấy vẫn chưa ai xin lỗi ai.')] : []),
    ],
    [
      {
        t: 'Đi cùng nhau',
        if: (cx) => cx.s.love[id] >= 45,
        do: (fx, cx) => (go(fx, id, 7), endRoute(fx, id), fx.flag(`rdone_${id}`), fx.partner(id), fx.love(id, 12), fx.stat('noi', 4), fx.say(`${cx.L(id)} siết tay ${cx.me}. Hai người chính thức là người yêu.`)),
      },
      {
        t: 'Níu giữ: "Ở lại được không?"',
        do: (fx, cx) => {
          go(fx, id, 7);
          endRoute(fx, id);
          fx.flag(`rdone_${id}`);
          if (cx.s.love[id] >= 60) (fx.partner(id), fx.love(id, 4), fx.say(`${cx.L(id)} ở lại. Nhưng đôi khi vẫn nhìn ra xa.`));
          else (fx.love(id, -10), fx.drop(id), fx.mid('xa'), fx.say(`${cx.L(id)} vẫn đi. Hai người lỡ nhau.`));
        },
      },
      { t: 'Buông tay, chúc người ấy bay xa', do: (fx, cx) => (go(fx, id, 7), endRoute(fx, id), fx.flag(`rdone_${id}`), fx.drop(id), fx.stat('tinh', 6), fx.say(`${cx.L(id)} đi. Năm năm sau còn gửi một tấm bưu thiếp.`)) },
    ],
  );
}
