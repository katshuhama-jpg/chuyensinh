/**
 * Kịch bản một đời: tuổi thơ, tuổi teen, tuổi trẻ, lập gia đình, tuổi già.
 * Cờ cắm từ bé bung ra nhiều năm sau. Bối cảnh đổi theo năm (đến hết 2026 là thật, sau đó giả định).
 */

import { LOVE_IDS, LOVES, type Choice, type Ctx, type Fx, type LoveId, type Scene } from './story';

const CH = { tho: 'Tuổi thơ', teen: 'Tuổi teen', tre: 'Tuổi trẻ', nha: 'Lập gia đình', gia: 'Tuổi già' };

/* ---------- bối cảnh theo năm ---------- */
const msgOf = (y: number) => (y < 2000 ? 'thư tay' : y < 2010 ? 'tin nhắn điện thoại' : y <= 2026 ? 'tin nhắn trên Chat' : 'tin nhắn qua trợ lý AI');
const playOf = (y: number) => (y < 1997 ? 'quán điện tử băng' : y < 2012 ? 'quán net' : y <= 2026 ? 'quán game' : 'phòng game thực tế ảo');
const spotOf = (y: number) => (y < 1995 ? 'bờ hồ, ăn kem que' : y < 2010 ? 'quán cà phê cóc' : y <= 2026 ? 'quán trà sữa' : 'quán cà phê robot pha');
const drinkOf = (y: number) => (y < 2008 ? 'chè' : 'trà sữa');
const tvOf = (y: number) => (y < 1995 ? 'phim hoạt hình trên chiếc tivi đen trắng cả xóm xem chung' : y <= 2026 ? 'phim hoạt hình' : 'phim hoạt hình chiếu nổi giữa phòng');
const wall = (y: number) => (y < 2010 ? 'kể cho cả xóm' : y <= 2026 ? 'đăng lên Tường' : 'phát lên mạng thực tế ảo');
const jobOf = (y: number) => (y < 2000 ? 'kế toán hợp tác xã' : y < 2015 ? 'nhân viên ngân hàng' : y <= 2026 ? 'kỹ sư phần mềm' : 'người huấn luyện AI');

/** "cậu bé" / "cô bé" theo giới người yêu */
const be = (x: Ctx) => (x.lg === 'm' ? 'cậu bé' : 'cô bé');
const co = (x: Ctx) => (x.lg === 'm' ? 'cậu' : 'cô');
/** vợ / chồng của nhân vật chính */
export const spouseWord = (x: Ctx) => (x.lg === 'm' ? 'chồng' : 'vợ');
export const spouseName = (x: Ctx) => {
  const p = x.s.partner;
  if (p && p !== 'xemmat') return x.L(p);
  return spouseWord(x);
};
const out = (x: Ctx, id: LoveId) => x.has(`${id}_out`);
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
function propose(fx: Fx, x: Ctx) {
  const p = P(x);
  const lie = x.has('noidoi') ? 15 : 0;
  const a = x.s.love[p] - lie >= 70;
  const b = x.s.stats[LOVES[p].likes] >= 55;
  if (lie) fx.say(`${x.L(p)} vẫn nhớ lời nói dối năm 23 tuổi.`);
  if (a && b) {
    fx.marry();
    fx.loveEnd(`hanhphuc_${p}`);
    fx.say(`${x.L(p)} ôm chặt ${x.me}. Đám cưới vào mùa thu năm ấy.`);
  } else if (a) {
    fx.marry();
    fx.loveEnd(`dodang_${p}`);
    fx.say(`Hai người cưới nhau. Nhưng ${x.L(p)} vốn thích ${LOVES[p].likesName}, và về sau sẽ có lúc lệch nhịp.`);
  } else if (b) {
    fx.partner(null);
    fx.flag(`${p}_out`);
    fx.loveEnd(`chilaban_${p}`);
    fx.say(`${x.L(p)} lùi lại: "Có lẽ mình hợp làm bạn thân hơn." Câu ấy đúng, và đau.`);
  } else {
    fx.partner(null);
    fx.flag(`${p}_out`);
    fx.loveEnd(`lohen_${p}`);
    fx.say(`${x.L(p)} cười buồn, cất nhẫn đi. Hai người lỡ nhau một nhịp.`);
  }
}

const proposeChoices: Choice[] = [
  { t: 'Gật đầu', do: propose },
  {
    t: 'Xin thêm thời gian',
    do: (fx, x) => {
      const p = P(x);
      fx.partner(null);
      fx.flag(`${p}_out`);
      fx.loveEnd(`lohen_${p}`);
      fx.say(`${x.L(p)} đợi thêm một năm, rồi nhận học bổng đi nước ngoài.`);
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

/* ---------- drama theo thời kỳ, lúc 22 tuổi ---------- */
function eraDrama(x: Ctx): { title: string; text: string[]; choices: Choice[] } {
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
    title: 'Tin nhắn do AI viết (giả định)',
    text: [`${x.me} phát hiện mấy tin nhắn ngọt ngào nhất của ${n} đều do trợ lý AI viết hộ.`],
    choices: [
      { t: 'Cười, bảo lần sau tự viết', do: (fx) => fx.love(p(), 10) },
      { t: 'Giận ba ngày', do: (fx) => fx.love(p(), -8) },
      { t: 'Cũng nhờ AI viết lại một bức dài hơn', do: (fx) => (fx.love(p(), -3), fx.stat('noi', 5)) },
    ],
  };
}

/* ---------- các cảnh ---------- */
const list: Scene[] = [
  // ===== Tuổi thơ =====
  {
    id: 'c6_dieu',
    age: 6,
    chapter: CH.tho,
    who: () => 'khoi',
    title: 'Con diều mắc cây',
    text: (x) => [
      `Chiều hè, ${x.L('khoi')} - ${be(x)} nhà bên cạnh - đứng khóc dưới gốc bàng. Con diều giấy ${co(x)} tự dán mắc tít trên cành cao.`,
      `Ngoài ngõ, lũ trẻ đang gọi ${x.me} ra xem ${tvOf(x.year)}.`,
    ],
    choices: [
      { t: 'Trèo lên gỡ diều giúp', do: (fx) => (fx.flag('dieu'), fx.love('khoi', 15), fx.stat('noi', 5)), note: (x) => `${x.L('khoi')} sẽ nhớ chuyện này.` },
      { t: 'Chạy đi gọi người lớn', do: (fx) => (fx.love('khoi', 8), fx.stat('tinh', 5)) },
      { t: 'Mặc kệ, chạy ra xem phim', do: (fx) => fx.stat('tam', 5) },
    ],
    next: 'c8_lop',
  },
  {
    id: 'c8_lop',
    age: 8,
    chapter: CH.tho,
    who: () => 'long',
    title: 'Đứa nghịch nhất lớp',
    text: (x) => [
      `Năm lớp ba, ${x.L('long')} ngồi bàn sau, ngày nào cũng ${x.lg === 'm' ? 'giật tóc' : 'giấu dép'} ${x.me}. Hôm nay ${x.lg === 'm' ? 'cậu ta' : 'cô ta'} còn vẽ bậy lên quyển vở mới.`,
      `${x.L('minh')}, ${x.lg === 'm' ? 'lớp trưởng' : 'lớp phó học tập'} mặt lạnh như tiền, đang cầm sổ ghi tên.`,
    ],
    choices: [
      { t: 'Quay xuống đánh lại', do: (fx) => (fx.flag('danh_long'), fx.stat('noi', 10), fx.love('long', 12)), note: (x) => `${x.L('long')} bắt đầu để ý ${x.me}.` },
      { t: 'Mách cô giáo', do: (fx) => (fx.flag('mach_co'), fx.stat('hoc', 5), fx.love('minh', 10), fx.love('long', -5)), note: (x) => `${x.L('minh')} ghi nhận.` },
      { t: 'Nhịn, về nhà khóc', do: (fx) => (fx.stat('tam', -5), fx.stat('tinh', 5)) },
    ],
    next: 'c10_he',
  },
  {
    id: 'c10_he',
    age: 10,
    chapter: CH.tho,
    title: 'Mùa hè năm lớp năm',
    text: (x) => [`Hè này ${x.bm} cho ${x.me} tự chọn đi đâu.`, `Lũ bạn trong xóm thì rủ ra ${playOf(x.year)} đầu ngõ.`],
    choices: [
      { t: 'Đi học thêm cho chắc', do: (fx) => (fx.stat('hoc', 10), fx.love('minh', 8)), note: (x) => `Ngồi cùng bàn học thêm với ${x.L('minh')}.` },
      { t: (x) => `Trốn ra ${playOf(x.year)}`, do: (fx) => (fx.stat('noi', 10), fx.love('long', 8), fx.rel('bome', -5)), note: (x) => `${x.L('long')} cũng là khách quen ở đây.` },
      { t: 'Về quê với ông bà', do: (fx) => (fx.stat('tinh', 8), fx.stat('tam', 5), fx.love('khoi', 8)), note: (x) => `Nhà ${x.L('khoi')} cũng về quê cùng xóm. Hai đứa đi bắt chuồn chuồn cả hè.` },
    ],
    next: 'c12_chuyennha',
  },
  {
    id: 'c12_chuyennha',
    age: 12,
    chapter: CH.tho,
    who: () => 'khoi',
    title: 'Ngày chuyển nhà',
    text: (x) => [
      `Nhà ${x.L('khoi')} chuyển vào ${x.f.province === 'TP. Hồ Chí Minh' ? 'Hà Nội' : x.f.province === 'Hà Nội' ? 'Sài Gòn' : 'Hà Nội'}. Xe tải đỗ đầu ngõ từ sáng sớm.`,
      x.has('dieu')
        ? `${x.L('khoi')} dúi vào tay ${x.me} con diều giấy năm nào: "Giữ hộ tớ. Lớn lên tớ về lấy."`
        : `${x.L('khoi')} vẫy tay, ngập ngừng như muốn nói gì đó rồi lại thôi.`,
    ],
    choices: [
      { t: 'Hứa sẽ đợi cậu ấy về', do: (fx) => (fx.flag('hua'), fx.love('khoi', 12)), note: (x) => `${x.L('khoi')} sẽ nhớ lời hứa này.` },
      { t: 'Tặng lại một món kỷ vật', do: (fx) => (fx.flag('kyvat'), fx.love('khoi', 8), fx.stat('tinh', 5)), note: (x) => `${x.L('khoi')} cất món quà vào ngăn kéo.` },
      { t: 'Cười cho qua, chạy đi chơi', do: (fx) => fx.love('khoi', -5) },
    ],
    next: 't15',
  },

  // ===== Tuổi teen =====
  {
    id: 't15',
    age: 15,
    chapter: CH.teen,
    title: 'Năm lớp mười',
    text: (x) => [
      `Vào cấp ba, mỗi người chọn một kiểu sống.`,
      `${x.L('minh')} đỗ thủ khoa đầu vào. ${x.L('long')} giờ đi xe độ, chiều nào cũng tụ tập ở cổng trường.`,
    ],
    choices: [
      { t: 'Cắm đầu học', do: (fx) => (fx.stat('hoc', 15), fx.love('minh', 10), fx.stat('tam', -5)) },
      { t: 'Đi chơi cho biết đời', do: (fx) => (fx.stat('noi', 15), fx.love('long', 10), fx.rel('bome', -8), fx.stat('hoc', -5)) },
      { t: 'Theo đuổi âm nhạc, đi diễn văn nghệ', do: (fx) => (fx.stat('duyen', 15), fx.stat('tinh', 5), fx.love('long', 3), fx.love('minh', 3)) },
    ],
    next: 't16_hethong',
  },
  {
    id: 't16_hethong',
    age: 16,
    chapter: CH.teen,
    who: () => 'he_thong',
    title: 'Đinh!',
    text: (x) => [
      `Sinh nhật mười sáu, đang thổi nến thì ${x.me} nghe một giọng nói vang lên trong đầu:`,
      `"Đinh! Hệ Thống Bắt Tôi Yêu đã kích hoạt. Ký chủ ${x.c.name}, nhiệm vụ chính: trước 28 tuổi phải có một người yêu thật lòng. Thất bại sẽ bị phạt: đi xem mắt do ${x.mom} sắp xếp."`,
      `"Quà tân thủ: một lần nhìn thấu lòng người. Dùng ngay không?"`,
    ],
    choices: [
      {
        t: 'Dùng ngay',
        do: (fx, x) => {
          const best = (['khoi', 'long', 'minh'] as LoveId[]).sort((a, b) => x.s.love[b] - x.s.love[a])[0];
          fx.say(`${x.L(best)} đang có cảm tình với ${x.me} nhất (độ thân ${x.s.love[best]}).`);
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
    kind: 'chat',
    who: (x) => crush(x),
    timer: 12,
    timeout: 2,
    title: (x) => `${x.year < 2000 ? 'Lá thư trong ngăn bàn' : 'Tin nhắn lúc nửa đêm'}`,
    text: (x) => [x.year < 2000 ? `Có lá thư gấp hình máy bay nhét trong ngăn bàn từ chiều, giờ ${x.me} mới dám mở.` : `Đã 11 giờ đêm. Điện thoại rung.`],
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
        t: (x) => (x.year < 2000 ? '(Cất thư đi, không hồi âm)' : '(Để "Đã xem", không trả lời)'),
        do: (fx, x) => {
          const c = crush(x);
          fx.love(c, -10);
          fx.flag(`seen_${c}`);
          if (x.s.love[c] < 15) fx.mid('seen');
        },
        note: (x) => (x.year < 2000 ? `${x.L(crush(x))} đợi thư hồi âm cả tuần.` : `${x.L(crush(x))} nhìn dòng "Đã xem" cả đêm.`),
      },
    ],
    next: 't17_thi',
  },
  {
    id: 't17_thi',
    age: 17,
    chapter: CH.teen,
    title: 'Thi đại học',
    text: (x) => {
      const pass = x.s.stats.hoc >= 55;
      const lines = [pass ? `Có kết quả: ${x.me} đỗ đại học!` : `Có kết quả: ${x.me} trượt, thiếu hai điểm.`];
      if (!pass && x.s.love.long >= 25) lines.push(`Chiều hôm ấy, ${x.L('long')} ngồi ngoài cổng trường, chìa cho ${x.me} một cốc ${drinkOf(x.year)}.`);
      if (!pass && x.s.love.minh >= 25) lines.push(`${x.L('minh')} gửi ${msgOf(x.year)}: "Năm sau thi lại, tớ kèm."`);
      return lines;
    },
    choices: [
      {
        t: 'Lên thành phố học, ở ký túc xá',
        if: (x) => x.s.stats.hoc >= 55,
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
    next: 'y19_veve',
  },

  // ===== Tuổi trẻ =====
  {
    id: 'y19_veve',
    age: 19,
    chapter: CH.tre,
    who: () => 'khoi',
    title: 'Người trong ngõ cũ',
    text: (x) => {
      const back = x.has('hua') || x.has('kyvat') || x.s.love.khoi >= 20;
      if (!back) return [`Tết năm ấy, có người khách lạ đi ngang ngõ cũ, dừng lại nhìn ngôi nhà bên cạnh rất lâu.`, `${x.me} thấy quen quen, rồi người ấy đi mất.`];
      return [
        `Tết năm ấy, ${x.L('khoi')} trở về ngõ cũ.`,
        x.has('dieu') ? `${x.lg === 'm' ? 'Anh' : 'Cô'} đứng trước cửa, chỉ vào con diều treo trên tường: "Tớ về lấy rồi đây."` : `${x.ay} nhìn ${x.me} một lúc lâu mới dám chào.`,
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
    next: 'y20_chon',
  },
  {
    id: 'y20_chon',
    age: 20,
    chapter: CH.tre,
    who: () => 'he_thong',
    title: 'Hai mươi tuổi, chọn ai?',
    text: (x) => {
      const lines = [`"Đinh! Ký chủ còn 8 năm để hoàn thành nhiệm vụ."`];
      for (const id of LOVE_IDS) if (!out(x, id) && x.s.love[id] >= 15) lines.push(`${x.L(id)} - ${LOVES[id].kind.toLowerCase()} - độ thân ${x.s.love[id]}.`);
      if (lines.length === 1) lines.push('Bảng danh sách trống trơn.');
      return lines;
    },
    choices: [
      ...LOVE_IDS.map(
        (id): Choice => ({
          t: (x) => `Tiến tới với ${x.L(id)}`,
          if: (x) => !out(x, id) && x.s.love[id] >= 15,
          do: (fx) => (fx.partner(id), fx.love(id, 10), fx.flag(`date_${id}`)),
          note: (x) => `${x.L(id)} và ${x.me} chính thức hẹn hò.`,
        }),
      ),
      {
        t: (x) => (x.year >= 2014 ? 'Thử app hẹn hò Quẹt' : `Nhờ ${x.s.bestie} giới thiệu người mới`),
        do: (fx, x) => {
          fx.stat('dao', 8);
          if (x.year >= 2014) (fx.say('Quẹt cả tháng toàn gặp ảnh ảo, người đã có gia đình, và một người mở lời là vay tiền.'), fx.mid('quet'));
          else fx.say('Buổi gặp mặt chán tới mức cả hai cùng nhìn đồng hồ.');
        },
      },
      { t: 'Chưa yêu ai, lo sự nghiệp trước', do: (fx) => (fx.stat('tien', 10), fx.stat('hoc', 5)), sys: 'Đinh! Bản Hệ Thống thở dài.' },
    ],
    next: 'y21_hen',
  },
  {
    id: 'y21_hen',
    age: 21,
    chapter: CH.tre,
    who: (x) => P(x),
    skip: (x) => !hasPartner(x),
    title: 'Buổi hẹn đầu tiên',
    text: (x) => [`Hẹn ${x.L(P(x))} ở ${spotOf(x.year)}.`, `${x.me} nên làm gì để ${x.ay} vui?`],
    choices: [
      {
        t: 'Kể lại chuyện hồi bé',
        do: (fx, x) => {
          const p = P(x);
          if (p === 'khoi') (fx.love(p, 15), fx.say(x.has('dieu') ? `${x.L(p)} kể lại chuyện con diều, cười mãi không thôi.` : `${x.L(p)} nhớ hết từng mùa hè.`));
          else if (p === 'long' && x.has('danh_long')) (fx.love(p, 10), fx.say(`Hóa ra ${x.L(p)} vẫn nhớ trận đánh nhau năm lớp ba.`));
          else if (p === 'minh' && x.has('mach_co')) (fx.love(p, 8), fx.say(`${x.L(p)} nhớ ${x.me} từng mách cô, bật cười.`));
          else (fx.love(p, 2), fx.say(`${x.L(p)} nghe lịch sự, nhưng không nhớ gì.`));
        },
      },
      { t: 'Rủ đi phượt đêm một chuyến', do: (fx, x) => (fx.love(P(x), P(x) === 'long' ? 15 : P(x) === 'minh' ? -5 : 3), fx.stat('noi', 5)) },
      { t: 'Mang sách đến học cùng rồi mới đi ăn', do: (fx, x) => (fx.love(P(x), P(x) === 'minh' ? 15 : P(x) === 'long' ? -8 : 3), fx.stat('hoc', 5)) },
      {
        t: 'Đến muộn một tiếng vì mải chơi game',
        do: (fx, x) => {
          const p = P(x);
          fx.love(p, -15);
          if (x.s.love[p] < 30) (fx.partner(null), fx.flag(`${p}_out`), fx.mid('leocay'));
          else fx.say(`${x.L(p)} giận cả tuần mới thôi.`);
        },
      },
    ],
    next: 'y22_drama',
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
    next: 'y23_noidoi',
  },
  {
    id: 'y23_noidoi',
    age: 23,
    chapter: CH.tre,
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
    next: 'y24_ramat',
  },
  {
    id: 'y24_ramat',
    age: 24,
    chapter: CH.tre,
    who: () => 'mom',
    skip: (x) => !hasPartner(x),
    title: (x) => `Ra mắt ${x.bm}`,
    text: (x) => {
      const p = P(x);
      const lines: string[] = [];
      if (x.f.parents === 'Gia trưởng' && p === 'long') lines.push(`Bố ${x.me} nhìn ${x.L(p)} từ đầu đến chân rồi đập bàn: "Cái ${x.lg === 'm' ? 'thằng' : 'đứa'} đi xe độ ấy à? Không được!"`);
      else if (x.f.parents === 'Hòa thuận, cởi mở') lines.push(`${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} nấu cả mâm cơm, gắp cho ${x.L(p)} miếng ngon nhất.`);
      else lines.push(`Bữa cơm ra mắt im lặng hơn ${x.me} tưởng.`);
      if (x.s.love[p] < 45) lines.push(`Mẹ ${x.L(p)} nói luôn: "Hai đứa cưới luôn cho xong, tháng sau có ngày đẹp!"`);
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
        sys: 'Đinh! Cảnh báo: độ thân chưa đủ. Ký chủ chắc chưa?',
      },
    ],
    next: 'y25_traxanh',
  },
  {
    id: 'y25_traxanh',
    age: 25,
    chapter: CH.tre,
    kind: 'chat',
    who: () => 'bestie',
    timer: 12,
    timeout: 2,
    skip: (x) => !hasPartner(x) || x.s.married,
    title: (x) => `Tin nhắn của ${x.s.bestie}`,
    text: (x) => [
      x.year < 2000
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
          fx.rel('banthan', -15);
          if (x.s.love[P(x)] >= 45) (fx.love(P(x), 10), fx.say(`${x.L(P(x))} chặn ${x.s.bestie} ngay trước mặt ${x.me}.`));
          else (fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('traxanh'));
        },
      },
      { t: (x) => `${x.year < 2010 ? 'Kể cho cả xóm biết' : 'Đăng lên Tường bóc phốt'}`, do: (fx, x) => (fx.rel('banthan', -30), fx.stat('noi', 10), fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('bocphot')) },
      {
        t: '(Giả vờ như không thấy)',
        do: (fx, x) => {
          fx.stat('tam', -10);
          fx.love(P(x), -10);
          if (x.s.love[P(x)] < 45) (fx.flag(`${P(x)}_out`), fx.partner(null), fx.mid('traxanh'));
        },
      },
    ],
    next: 'y27_cauhon',
  },
  {
    id: 'y27_cauhon',
    age: 27,
    chapter: CH.tre,
    who: (x) => P(x),
    skip: (x) => !hasPartner(x) || x.s.married,
    title: 'Lời cầu hôn',
    text: (x) => {
      const p = P(x);
      const lines = [`${x.L(p)} hẹn ${x.me} ra ${spotOf(x.year)}, nơi hai người hẹn hò lần đầu.`];
      if (p === 'khoi' && x.has('dieu')) lines.push(`${x.ay[0].toUpperCase() + x.ay.slice(1)} mang theo con diều giấy năm nào, giờ buộc thêm một chiếc nhẫn.`);
      if (p === 'long') lines.push(`Chiếc xe độ đã bán. ${x.L(p)} đi xe buýt tới, cười ngượng.`);
      if (p === 'minh') lines.push(`${x.L(p)} rút ra bài phát biểu đã soạn sẵn ba trang, đọc được nửa trang thì quên.`);
      if (x.has('noidoi')) lines.push(`Trước khi quỳ xuống, ${x.ay} hỏi nhỏ: "Năm ấy ${x.goi} nói dối ${x.xung}, đúng không?"`);
      lines.push(`"Lấy ${x.xung} nhé?"`);
      return lines;
    },
    choices: proposeChoices,
    next: 'y28_hethong',
  },
  {
    id: 'y28_hethong',
    age: 28,
    chapter: CH.tre,
    who: () => 'he_thong',
    skip: (x) => x.s.married,
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
    next: 'm32_tet',
  },
  {
    id: 'y28_xemmat',
    age: 28,
    chapter: CH.tre,
    who: () => 'xemmat',
    title: 'Buổi xem mắt',
    text: (x) => [
      `Người xem mắt là con bạn ${x.mom}, làm ${jobOf(x.year)}, nói chuyện lịch sự và hơi nhạt.`,
      `Cuối buổi, ${x.lg === 'm' ? 'anh ta' : 'cô ta'} hỏi: "Mình thử tìm hiểu nhé?"`,
    ],
    choices: [
      { t: 'Đồng ý, nửa năm sau cưới', do: (fx) => (fx.partner('xemmat'), fx.marry(), fx.loveEnd('bimeep'), fx.rel('bome', 10)) },
      { t: 'Từ chối khéo', do: (fx) => (fx.loveEnd('docthan'), fx.rel('bome', -5)) },
    ],
    next: 'm32_tet',
  },
  {
    id: 'y29_quaylai',
    age: 29,
    chapter: CH.tre,
    who: (x) => P(x),
    skip: (x) => !hasPartner(x) || x.s.married,
    title: 'Gặp lại',
    text: (x) => [`${x.L(P(x))} đến đúng hẹn, vẫn ngồi chỗ cũ, vẫn gọi đúng món ${x.me} thích.`, `Ngồi được một lúc, ${x.ay} hỏi: "Mình thử lại lần nữa, rồi cưới luôn nhé?"`],
    choices: proposeChoices,
    next: 'm32_tet',
  },

  // ===== Lập gia đình =====
  {
    id: 'm32_tet',
    age: 32,
    chapter: CH.nha,
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
    skip: (x) => !x.s.married,
    title: 'Chuyện con cái',
    text: (x) => [`Bạn bè cùng lứa đã có con đi mẫu giáo. ${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} hỏi bóng gió mỗi lần gọi điện.`],
    choices: [
      { t: 'Sinh con ngay năm nay', do: (fx, x) => (fx.kids(1), fx.rel('con', 55), fx.stat('tien', -10), hasPartner(x) && fx.love(P(x), 5)) },
      { t: 'Đợi mua được nhà rồi mới sinh', do: (fx) => (fx.kids(1), fx.rel('con', 45), fx.stat('tien', 10)) },
      { t: 'Sinh hai đứa cho vui nhà', do: (fx) => (fx.kids(2), fx.rel('con', 55), fx.stat('tien', -20), fx.stat('tam', -5)) },
      { t: 'Chưa muốn có con', do: (fx, x) => (fx.kids(0), fx.stat('tam', 5), hasPartner(x) && fx.love(P(x), -5)) },
    ],
    next: 'm40_nguoicu',
  },
  {
    id: 'm40_nguoicu',
    age: 40,
    chapter: CH.nha,
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
    next: 'm45_viec',
  },
  {
    id: 'm45_viec',
    age: 45,
    chapter: CH.nha,
    title: 'Gia đình hay sự nghiệp',
    text: (x) => [`Công ty đề nghị ${x.me} lên trưởng phòng, đổi lại phải đi công tác xa nửa năm.`, `${x.bm === 'ông bà' ? 'Ông bà' : 'Bố mẹ'} đã yếu, gọi điện hay quên.`],
    choices: [
      { t: 'Nhận, lo tương lai trước', do: (fx, x) => (fx.stat('tien', 20), fx.rel('con', -15), x.s.married && hasPartner(x) ? fx.love(P(x), -5) : undefined) },
      { t: 'Từ chối, ở gần gia đình', do: (fx, x) => (fx.rel('con', 15), fx.stat('tam', 5), x.s.married && hasPartner(x) ? fx.love(P(x), 8) : undefined) },
      { t: (x) => `Đón ${x.bm} lên ở cùng`, do: (fx) => (fx.rel('bome', 20), fx.stat('tien', -10), fx.stat('tinh', 5)) },
      { t: 'Dành tiền đi du lịch khắp nơi', if: (x) => !x.s.married, do: (fx) => (fx.stat('tam', 15), fx.rel('banthan', 10)) },
    ],
    next: 'o60',
  },

  // ===== Tuổi già =====
  {
    id: 'o60',
    age: 60,
    chapter: CH.gia,
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
    next: 'o75',
  },
  {
    id: 'o75',
    age: 75,
    chapter: CH.gia,
    who: () => 'he_thong',
    title: 'Cuốn album cuối cùng',
    text: (x) => [
      `Bảy mươi lăm tuổi. Một buổi chiều, giọng nói quen thuộc lại vang lên, lần này rất khẽ:`,
      `"Đinh. Ký chủ ${x.c.name}, bản Hệ Thống sắp phải đi rồi. Trước khi đi, bản Hệ Thống muốn kể một bí mật: bản Hệ Thống từng là một người đã lỡ mất tình yêu, nên mới đi ép người khác phải yêu."`,
      `"Cảm ơn ký chủ đã sống hết mình."`,
    ],
    choices: [{ t: 'Lật album lần cuối' }],
    next: 'end',
  },
];

export const SCENES: Record<string, Scene> = Object.fromEntries(list.map((s) => [s.id, s]));
export const FIRST_SCENE = 'c6_dieu';

/** Cảnh với lựa chọn đã dựng theo năm (cảnh drama đổi theo thời kỳ) */
export function getScene(id: string, x: Ctx): Scene {
  const s = SCENES[id];
  if (id === 'y22_drama') return { ...s, choices: eraDrama(x).choices };
  return s;
}

/** Bản đồ cảnh dùng cho engine: cảnh drama cần lựa chọn theo năm nên engine gọi getScene qua proxy */
export function sceneTable(x: Ctx): Record<string, Scene> {
  return { ...SCENES, y22_drama: getScene('y22_drama', x) };
}
