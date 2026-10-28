/**
 * 20 tình huống theo thời kỳ, lấy từ research bối cảnh xã hội Việt Nam 1975-2026
 * (Project: research-boi-canh-xa-hoi-vn.md). Mỗi "ô" ở một tuổi chọn tình huống hợp với năm đó;
 * không có tình huống nào hợp thì bỏ qua ô ấy. Từ 2027 trở đi chỉ dùng những tình huống vẫn còn hợp (giả định).
 */

import type { Bg } from '@/components/Backdrop';
import { LOVE_IDS, type Choice, type Ctx, type LoveId, type Scene } from './story';

type Ev = {
  id: string;
  /** năm (theo lịch) tình huống này đúng thực tế */
  from: number;
  to: number;
  if?: (x: Ctx) => boolean;
  title: string | ((x: Ctx) => string);
  bg: (x: Ctx) => Bg;
  who?: Scene['who'];
  text: (x: Ctx) => string[];
  choices: Choice[];
};

const partnerOf = (x: Ctx): LoveId | null => (x.s.partner && x.s.partner !== 'xemmat' ? x.s.partner : null);
const closest = (x: Ctx): LoveId => {
  const ids = LOVE_IDS.filter((id) => !x.has(`${id}_out`)).sort((a, b) => x.s.love[b] - x.s.love[a]);
  return ids[0] ?? 'khoi';
};
const firstLove = (x: Ctx): LoveId => (['khoi', 'long', 'minh'] as LoveId[]).sort((a, b) => x.s.love[b] - x.s.love[a])[0];
const sp = (x: Ctx) => (partnerOf(x) ? x.L(partnerOf(x)!) : x.lg === 'm' ? 'chồng' : 'vợ');

/** ô tình huống: tuổi → các tình huống theo thứ tự ưu tiên */
const SLOTS: Record<number, Ev[]> = {
  /* ---------- tuổi thơ ---------- */
  9: [
    {
      id: 'sogao',
      from: 1977,
      to: 1988,
      title: 'Sổ gạo',
      bg: () => ({ place: 'pho', time: 'day' }),
      who: () => 'khoi',
      text: (x) => [
        `Thời tem phiếu. ${x.bm === 'ông bà' ? 'Bà' : 'Mẹ'} giao cho ${x.me} cầm sổ gạo ra cửa hàng mậu dịch xếp hàng từ sáng sớm.`,
        `Đến lượt thì sổ không còn trong túi. Mất sổ là cả nhà đói cả tháng. ${x.L('khoi')} đứng sau, mặt cũng tái đi.`,
      ],
      choices: [
        { t: 'Rủ cả hai quay lại tìm khắp đường', do: (fx) => (fx.love('khoi', 10), fx.stat('tinh', 5)), note: (x) => `Hai đứa tìm thấy sổ dưới gầm xe đạp. ${x.L('khoi')} nắm tay ${x.me} chạy về.` },
        { t: 'Chạy về nhận lỗi ngay', do: (fx) => (fx.rel('bome', 8), fx.stat('tam', -5)), note: (x) => `${x.bm === 'ông bà' ? 'Bà' : 'Bố mẹ'} mắng một trận, rồi đi xin cấp lại sổ.` },
        { t: 'Sợ quá, giấu luôn chuyện', do: (fx) => (fx.rel('bome', -10), fx.stat('noi', 6)) },
      ],
    },
    {
      id: 'dinhat',
      from: 2014,
      to: 2100,
      title: (x) => (x.year <= 2026 ? 'Mẹ đi Nhật' : 'Mẹ đi làm xa'),
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (x) => [
        x.year <= 2026
          ? `Mẹ sang Nhật làm thực tập sinh ba năm, ${x.me} ở với ông bà. Tối nào cũng gọi video, mẹ hỏi bài, rồi khóc ở đầu bên kia.`
          : `Mẹ ký hợp đồng làm việc ba năm ở một thành phố nổi ngoài khơi (giả định). Tối nào ${x.me} cũng gọi hình ba chiều cho mẹ.`,
        `Hôm nay ${x.me} được mười điểm Toán, nhưng mạng chập chờn mãi không gọi được.`,
      ],
      choices: [
        { t: 'Chụp bài kiểm tra gửi mẹ, đợi mẹ xem', do: (fx) => (fx.rel('bome', 10), fx.stat('hoc', 5)), note: () => 'Gần sáng mẹ mới nhắn lại một trái tim.' },
        { t: 'Giận mẹ, tắt máy đi ngủ', do: (fx) => (fx.rel('bome', -8), fx.stat('tam', -5), fx.stat('noi', 5)) },
        { t: 'Kể cho ông bà nghe trước', do: (fx) => (fx.stat('tinh', 6), fx.stat('tam', 5)) },
      ],
    },
  ],
  11: [
    {
      id: 'dongau',
      from: 1980,
      to: 1990,
      title: 'Bố đi Đông Âu',
      bg: () => ({ place: 'nha', time: 'dusk' }),
      text: (x) => [
        `Bố được đi "hợp tác lao động" ở Tiệp Khắc. Cả nhà mừng như trúng số: về là có xe máy, có quạt, có vốn làm ăn.`,
        `Trước hôm đi, bố hỏi ${x.me} muốn bố mang gì về.`,
      ],
      choices: [
        { t: '"Con chỉ muốn bố về sớm"', do: (fx) => (fx.rel('bome', 10), fx.stat('tinh', 6)) },
        { t: '"Một chiếc xe đạp mini Nhật!"', do: (fx) => (fx.stat('tien', 6), fx.stat('duyen', 4)), note: (x) => `Ba năm sau, ${x.me} là đứa duy nhất trong ngõ có xe đạp mini.` },
        { t: '"Sách tiếng nước ngoài"', do: (fx) => fx.stat('hoc', 8) },
      ],
    },
    {
      id: 'covid_hoc',
      from: 2020,
      to: 2021,
      title: 'Học qua màn hình',
      bg: () => ({ place: 'phong', time: 'day' }),
      who: () => 'khoi',
      text: (x) => [
        `Giãn cách xã hội. Trường đóng cửa, ${x.me} học online qua chiếc điện thoại cũ của mẹ, mạng lúc có lúc không.`,
        `${x.L('khoi')} nhắn: "Bật camera lên đi, cô điểm danh kìa!"`,
      ],
      choices: [
        { t: 'Bật camera, ngồi học nghiêm túc', do: (fx) => (fx.stat('hoc', 8), fx.love('khoi', 4)) },
        { t: 'Tắt camera, chơi game', do: (fx) => (fx.stat('hoc', -6), fx.stat('noi', 6)) },
        { t: 'Làm thiệp tặng bác sĩ chống dịch', do: (fx) => (fx.stat('tinh', 8), fx.stat('duyen', 3)), note: () => 'Cô giáo đăng thiệp lên nhóm lớp.' },
      ],
    },
  ],
  /* ---------- tuổi teen ---------- */
  14: [
    {
      id: 'dienthoaiban',
      from: 1993,
      to: 2003,
      title: 'Cuộc gọi đến nhà',
      bg: () => ({ place: 'nha', time: 'night' }),
      who: (x) => (x.s.love.long >= x.s.love.minh ? 'long' : 'minh'),
      text: (x) => {
        const c = x.s.love.long >= x.s.love.minh ? 'long' : 'minh';
        return [`Nhà ${x.L(c)} vừa lắp điện thoại bàn. ${x.me} lấy hết can đảm quay số, tim đập thình thịch.`, `Đầu dây bên kia, một giọng đàn ông trầm trầm: "Alô, ai đấy?" - bố ${x.L(c)}.`];
      },
      choices: [
        {
          t: '"Dạ cháu là bạn cùng lớp, cháu hỏi bài ạ"',
          do: (fx, x) => {
            const c = x.s.love.long >= x.s.love.minh ? 'long' : 'minh';
            fx.love(c, 8);
            fx.stat('duyen', 4);
          },
          note: (x) => `Bố gọi to: "Có bạn hỏi bài này!" - và ${x.me} nghe tiếng cười khúc khích ở đầu dây.`,
        },
        { t: 'Hoảng quá, cúp máy', do: (fx) => fx.stat('tam', -4) },
        { t: 'Nhờ bạn thân gọi hộ', do: (fx) => (fx.rel('banthan', 6), fx.stat('noi', 3)) },
      ],
    },
    {
      id: 'yahoo',
      from: 2004,
      to: 2011,
      title: 'Dòng trạng thái Yahoo',
      bg: () => ({ place: 'net', time: 'night' }),
      who: (x) => (x.s.love.long >= x.s.love.minh ? 'long' : 'minh'),
      text: (x) => {
        const c = x.s.love.long >= x.s.love.minh ? 'long' : 'minh';
        return [`Ở quán net, ${x.me} vừa đăng nhập Yahoo thì thấy nick ${x.L(c)} sáng đèn. Dòng trạng thái mới: "Có ai hiểu tớ không..."`];
      },
      choices: [
        {
          t: 'Đổi trạng thái thành "Tớ hiểu mà"',
          do: (fx, x) => {
            const c = x.s.love.long >= x.s.love.minh ? 'long' : 'minh';
            fx.love(c, 9);
            fx.stat('duyen', 4);
          },
          note: () => 'Năm phút sau, khung chat nháy cam: "BUZZ!!!"',
        },
        { t: 'Nhắn hỏi thẳng "Cậu sao thế?"', do: (fx, x) => fx.love(x.s.love.long >= x.s.love.minh ? 'long' : 'minh', 6) },
        { t: 'Để chế độ ẩn, chỉ ngồi nhìn', do: (fx) => (fx.stat('tinh', 3), fx.stat('tam', -3)) },
      ],
    },
    {
      id: 'confession',
      from: 2013,
      to: 2100,
      title: 'Trang confession của trường',
      bg: () => ({ place: 'phong', time: 'night' }),
      who: () => 'bestie',
      text: (x) => [
        `Trang confession của trường đăng bài ẩn danh: "Gửi bạn tóc ngắn lớp ${x.year % 2 ? '9A' : '9B'}, tớ thích cậu lâu rồi."`,
        `Cả lớp đoán là ${x.me}. Bình luận nhảy lên vài trăm, có cả những câu chế giễu.`,
      ],
      choices: [
        { t: 'Bình luận vui: "Ai đấy, ra mặt đi!"', do: (fx) => (fx.stat('duyen', 8), fx.stat('noi', 4)) },
        { t: 'Nhờ admin gỡ bài', do: (fx) => (fx.stat('tam', 4), fx.stat('hoc', 2)) },
        { t: 'Lặng lẽ đọc hết bình luận rồi khóc', do: (fx) => (fx.stat('tam', -8), fx.rel('banthan', 6)), note: (x) => `${x.s.bestie} sang nhà, ngồi với ${x.me} đến khuya.` },
      ],
    },
  ],
  16: [
    {
      id: 'dibao',
      from: 2008,
      to: 2018,
      if: (x) => x.year === 2008 || x.year === 2018,
      title: (x) => (x.year === 2008 ? 'Đi bão AFF Cup 2008' : 'Đi bão U23'),
      bg: () => ({ place: 'pho', time: 'night' }),
      who: (x) => (x.s.love.long >= x.s.love.minh ? 'long' : 'minh'),
      text: (x) => {
        const c = x.s.love.long >= x.s.love.minh ? 'long' : 'minh';
        return [
          x.year === 2008 ? 'Việt Nam vô địch AFF Cup. Cả thành phố đổ ra đường, cờ đỏ sao vàng kín phố.' : 'U23 Việt Nam vào chung kết châu Á. Tuyết rơi ở Thường Châu, còn ở nhà thì cả nước đổ ra đường.',
          `Giữa biển người, ${x.L(c)} bị xô sát vào ${x.me}.`,
        ];
      },
      choices: [
        { t: 'Nắm lấy tay để khỏi lạc nhau', do: (fx, x) => (fx.love(x.s.love.long >= x.s.love.minh ? 'long' : 'minh', 12), fx.flag('dibao')), note: () => 'Cả đêm ấy không ai buông tay.' },
        { t: 'Hét "Việt Nam vô địch!" cùng đám đông', do: (fx) => (fx.stat('noi', 6), fx.stat('tam', 8)) },
        { t: 'Về sớm, mai còn đi học', do: (fx) => (fx.stat('hoc', 4), fx.rel('bome', 4)) },
      ],
    },
    {
      id: 'nhaymay',
      from: 2004,
      to: 2012,
      title: 'Hết tiền điện thoại',
      bg: () => ({ place: 'phong', time: 'night' }),
      who: (x) => (x.s.love.long >= x.s.love.minh ? 'long' : 'minh'),
      text: (x) => {
        const c = x.s.love.long >= x.s.love.minh ? 'long' : 'minh';
        return [`Tài khoản còn đúng 300 đồng, không đủ nhắn một tin. Điện thoại "cục gạch" của ${x.L(c)} vẫn chờ câu trả lời.`];
      },
      choices: [
        { t: '"Nháy máy" một hồi rồi tắt', do: (fx, x) => fx.love(x.s.love.long >= x.s.love.minh ? 'long' : 'minh', 6), note: (x) => `${x.L(x.s.love.long >= x.s.love.minh ? 'long' : 'minh')} hiểu ngay, gọi lại.` },
        { t: 'Chạy ra đầu ngõ mua thẻ cào', do: (fx) => (fx.stat('tien', -4), fx.stat('noi', 4)) },
        { t: 'Thôi, mai lên lớp nói', do: (fx) => fx.stat('tinh', 4) },
      ],
    },
    {
      id: 'luyenthi',
      from: 1995,
      to: 2014,
      title: 'Lò luyện thi',
      bg: () => ({ place: 'lop', time: 'day' }),
      who: () => 'minh',
      text: (x) => [
        `Hè lớp mười một, ${x.bm} gửi ${x.me} lên thành phố ở trọ, học "lò luyện thi" đại học. Lớp chật kín, ngồi ghép ba người một bàn.`,
        `Người ngồi cạnh là ${x.L('minh')}, đang chép bài nhanh như máy.`,
      ],
      choices: [
        { t: 'Xin chép ké vở', do: (fx) => (fx.stat('hoc', 6), fx.love('minh', 8)) },
        { t: 'Rủ trốn học đi ăn kem', do: (fx) => (fx.stat('noi', 6), fx.stat('hoc', -4), fx.love('minh', 3)) },
        { t: 'Học một mình đến khuya', do: (fx) => (fx.stat('hoc', 10), fx.stat('tam', -4)) },
      ],
    },
  ],
  /* ---------- tuổi trẻ ---------- */
  21: [
    {
      id: 'luadao',
      from: 2016,
      to: 2100,
      title: 'Người lạ trên app',
      bg: () => ({ place: 'quan', time: 'dusk' }),
      text: (x) => [
        `Một hồ sơ trên app nhắn với ${x.me} suốt hai tuần: ảnh đẹp, nói chuyện ngọt, nhưng chưa bao giờ chịu gọi video.`,
        `Hôm nay người ấy nhắn: "${x.year <= 2026 ? 'Anh đang kẹt tiền ở sân bay, em chuyển giúp anh mười triệu' : 'Em mượn tạm điểm tín dụng AI của anh nhé'}, mai trả liền."`,
      ],
      choices: [
        { t: 'Đòi gọi video trước', do: (fx) => (fx.stat('hoc', 4), fx.stat('dao', 3)), note: () => 'Người ấy chặn liên lạc ngay. Một tài khoản ảo.' },
        { t: 'Chuyển tiền cho người ta', do: (fx) => (fx.stat('tien', -15), fx.stat('tam', -10), fx.mid('quet')) },
        { t: 'Báo cáo tài khoản cho app', do: (fx) => (fx.stat('tinh', 3), fx.stat('dao', 4)) },
      ],
    },
    {
      id: 'veque',
      from: 1995,
      to: 2100,
      title: 'Ở lại hay về quê',
      bg: () => ({ place: 'vuon', time: 'day' }),
      who: (x) => (x.bm === 'ông bà' ? null : 'mom'),
      text: (x) => [
        `Sắp ra trường, ${x.me} có lời mời làm việc ở thành phố, lương đủ thuê phòng trọ mười mét vuông. ${x.mom.charAt(0).toUpperCase() + x.mom.slice(1)} gọi: "Về quê đi con, xin vào ${x.year <= 2026 ? 'ủy ban' : 'hợp tác xã nông nghiệp thông minh'} cho ổn định, gần nhà."`,
      ],
      choices: [
        { t: 'Ở lại thành phố bám trụ', do: (fx) => (fx.stat('tien', 8), fx.stat('noi', 4), fx.rel('bome', -4), fx.stat('dao', 4)) },
        { t: 'Về quê, gần bố mẹ', do: (fx) => (fx.rel('bome', 12), fx.stat('tam', 6), fx.stat('tien', -4)) },
        { t: 'Hứa hai năm nữa sẽ về', do: (fx) => (fx.rel('bome', 4), fx.stat('tinh', 3)) },
      ],
    },
  ],
  26: [
    {
      id: 'nguoiyeudixa',
      from: 2000,
      to: 2100,
      if: (x) => !!partnerOf(x),
      title: (x) => (x.year <= 2026 ? `${x.L(partnerOf(x)!)} đi ${x.year < 2012 ? 'Đài Loan' : 'Nhật'}` : `${x.L(partnerOf(x)!)} đi làm xa`),
      bg: () => ({ place: 'pho', time: 'dusk' }),
      who: (x) => partnerOf(x),
      text: (x) => [
        `${x.L(partnerOf(x)!)} có suất đi làm ở ${x.year <= 2026 ? (x.year < 2012 ? 'Đài Loan' : 'Nhật') : 'nước ngoài'} ba năm, lương gấp năm lần ở nhà. "Ba năm thôi. Về mình cưới."`,
        'Nhiều cặp nói câu ấy. Không phải cặp nào cũng giữ được.',
      ],
      choices: [
        { t: 'Hứa đợi, tối nào cũng gọi', do: (fx, x) => (fx.love(partnerOf(x)!, 12), fx.stat('tinh', 6), fx.flag('yeuxa')), note: (x) => `${x.L(partnerOf(x)!)} dán ảnh ${x.me} lên đầu giường ký túc xá.` },
        { t: 'Xin ở lại, mình cùng làm ở nhà', do: (fx, x) => (fx.love(partnerOf(x)!, 6), fx.stat('tien', -5)) },
        { t: 'Chia tay cho nhẹ lòng', do: (fx, x) => (fx.drop(partnerOf(x)!), fx.mid('xa')) },
      ],
    },
    {
      id: 'tet_hoi',
      from: 1975,
      to: 2100,
      if: (x) => !x.s.married,
      title: '"Bao giờ cưới?"',
      bg: () => ({ place: 'nha', time: 'day', tet: true }),
      who: (x) => (x.bm === 'ông bà' ? null : 'mom'),
      text: (x) => {
        // tuổi bị coi là "muộn" khác theo giới, vùng và thời
        const urban = x.f.urban;
        const late = x.c.gender === 'f' ? (x.year < 2015 && !urban ? 'gái quá lứa' : 'cũng phải tính đi') : x.year < 2010 ? 'trai ế' : 'cũng phải tính đi';
        return [`Mùng hai Tết, cả họ quây quần. Bác cả gắp miếng giò, hỏi to giữa mâm: "Hai mươi sáu rồi đấy, bao giờ cho bác ăn cỗ? Ở tuổi này là ${late} rồi."`, `Mười đôi mắt quay về phía ${x.me}.`];
      },
      choices: [
        { t: '"Dạ, sang năm ạ!" (hứa bừa)', do: (fx) => (fx.rel('bome', 6), fx.flag('hua_cuoi')), note: () => 'Câu hứa ấy sẽ được nhắc lại vào Tết sau.' },
        { t: '"Cháu đang lo sự nghiệp ạ"', do: (fx) => (fx.stat('tien', 4), fx.stat('noi', 4)) },
        { t: 'Cười trừ, rót nước mời bác', do: (fx) => (fx.stat('duyen', 5), fx.stat('tam', -3)) },
      ],
    },
  ],
  /* ---------- lập gia đình ---------- */
  30: [
    {
      id: 'orieng',
      from: 1975,
      to: 2100,
      if: (x) => x.s.married,
      title: (x) => (x.year < 2005 ? 'Về làm dâu' : 'Ở chung hay ra riêng'),
      bg: () => ({ place: 'nha', time: 'dusk' }),
      who: (x) => (x.bm === 'ông bà' ? null : 'mom'),
      text: (x) =>
        x.year < 2005
          ? [`Cưới xong, theo lệ, hai vợ chồng ở chung với nhà ${x.c.gender === 'f' ? 'chồng' : 'mình'}. Bốn thế hệ dưới một mái nhà, mâm cơm nào cũng phải đợi ông bà ngồi trước.`]
          : [`${sp(x)} muốn vay ngân hàng thuê căn hộ nhỏ ra ở riêng. Bên nội thì nói: "Nhà rộng thế này, ra ngoài làm gì cho tốn."`],
      choices:
        [
          { t: (x) => (x.year < 2005 ? 'Chiều lòng ông bà, nhẫn nhịn' : 'Ở chung, đỡ tiền thuê nhà'), do: (fx) => (fx.rel('bome', 10), fx.stat('tien', 4), fx.stat('tam', -6)) },
          { t: (x) => (x.year < 2005 ? 'Xin ra ở riêng (cả họ xì xào)' : 'Ra riêng, cuối tuần về ăn cơm'), do: (fx, x) => (fx.rel('bome', -8), fx.stat('tam', 8), partnerOf(x) ? fx.love(partnerOf(x)!, 6) : undefined) },
          { t: 'Ở gần, sang nhau mỗi ngày', do: (fx) => (fx.rel('bome', 4), fx.stat('tinh', 4)) },
        ],
    },
  ],
  35: [
    {
      id: 'sotdat',
      from: 2007,
      to: 2012,
      if: (x) => x.s.married,
      title: (x) => (x.year <= 2008 ? 'Cơn sốt chứng khoán' : 'Cơn sốt đất'),
      bg: () => ({ place: 'vanphong', time: 'day' }),
      text: (x) => [
        x.year <= 2008 ? 'Cả cơ quan bàn chuyện chứng khoán, ai cũng khoe lãi gấp đôi.' : 'Giá đất vùng ven nhảy từng tuần, đồng nghiệp rủ góp vốn "lướt sóng" một lô đất nền.',
        `${sp(x)} hỏi: "Mình có nên bỏ hết tiền tiết kiệm vào không?"`,
      ],
      choices: [
        { t: 'Dồn hết tiền vào', do: (fx) => (fx.stat('tien', -18), fx.stat('tam', -10)), note: (x) => (x.year <= 2008 ? 'Năm 2008 thị trường sập, mất quá nửa.' : 'Đến 2011-2012, đất đóng băng, bán không ai mua.') },
        { t: 'Gửi tiết kiệm như cũ', do: (fx) => (fx.stat('tien', 6), fx.stat('tinh', 3)) },
        { t: 'Mua một chỉ vàng cho yên tâm', do: (fx) => fx.stat('tien', 8), note: () => 'Năm 2011 vàng lập kỷ lục.' },
      ],
    },
    {
      id: 'vohui',
      from: 1990,
      to: 2006,
      title: 'Vỡ hụi',
      bg: () => ({ place: 'ngo', time: 'dusk' }),
      text: (x) => [`Bà chủ hụi đầu ngõ ôm tiền bỏ trốn trong đêm. Nhà ${x.me} góp mỗi tháng một phần lương, định cuối năm hốt để sửa nhà.`, 'Cả ngõ kéo nhau ra trước cửa nhà bà ấy.'],
      choices: [
        { t: 'Cùng hàng xóm làm đơn lên phường', do: (fx) => (fx.stat('noi', 4), fx.stat('tien', -6)) },
        { t: 'Chấp nhận mất, làm thêm bù lại', do: (fx) => (fx.stat('tien', -10), fx.stat('tinh', 6)) },
        { t: (x) => `Trách ${sp(x)} đã ham hụi`, if: (x) => x.s.married, do: (fx, x) => (fx.stat('tien', -10), partnerOf(x) ? fx.love(partnerOf(x)!, -10) : undefined) },
      ],
    },
    {
      id: 'chungcu',
      from: 2013,
      to: 2100,
      if: (x) => x.s.married,
      title: 'Căn hộ trả góp',
      bg: () => ({ place: 'pho', time: 'day' }),
      text: (x) => [
        `Hai vợ chồng đi xem căn hộ hai phòng ngủ. Giá bằng ${x.year <= 2026 ? 'hai mươi năm' : 'ba mươi năm'} thu nhập, vay ngân hàng thì trả góp đến năm ${x.year + 25}.`,
        `${sp(x)} nhìn ${x.me}: "Có nhà rồi mới yên tâm sinh thêm đứa nữa."`,
      ],
      choices: [
        { t: 'Ký, vay ngân hàng', do: (fx) => (fx.stat('tien', -10), fx.stat('tam', 6), fx.rel('con', 6)) },
        { t: 'Thuê tiếp, để tiền cho con học', do: (fx) => (fx.stat('tien', 6), fx.rel('con', 4)) },
        { t: 'Về quê xây nhà', do: (fx) => (fx.rel('bome', 8), fx.stat('tien', 4), fx.stat('tam', 4)) },
      ],
    },
  ],
  42: [
    {
      id: 'truongdiem',
      from: 2000,
      to: 2100,
      if: (x) => x.s.kids > 0,
      title: 'Con nhà người ta',
      bg: () => ({ place: 'cong', time: 'day' }),
      text: (x) => [
        `Con vào lớp sáu. Cả nhóm phụ huynh lớp rần rần chuyện thi vào trường ${x.year <= 2026 ? 'chuyên' : 'điểm'}, học thêm ba ca một ngày.`,
        `Tối qua, con hỏi ${x.me}: "Sao con lúc nào cũng phải giỏi hơn con nhà người ta?"`,
      ],
      choices: [
        { t: 'Cho con học thêm đủ các lớp', do: (fx) => (fx.stat('tien', -8), fx.rel('con', -6)), note: () => 'Con đỗ trường chuyên, nhưng ít cười hơn.' },
        { t: '"Con chỉ cần giỏi hơn chính con hôm qua"', do: (fx) => (fx.rel('con', 12), fx.stat('tam', 6)) },
        { t: 'Hỏi con muốn học gì', do: (fx) => (fx.rel('con', 8), fx.stat('tinh', 4)) },
      ],
    },
  ],
  /* ---------- tuổi già ---------- */
  65: [
    {
      id: 'timnguoicu',
      from: 2012,
      to: 2100,
      title: 'Tìm lại mối tình đầu',
      bg: () => ({ place: 'phong', time: 'dusk' }),
      text: (x) => [
        `Đứa cháu dạy ${x.me} dùng ${x.year <= 2026 ? 'mạng xã hội' : 'kính tìm người'}. Gõ thử một cái tên cũ, ${x.L(firstLove(x))}, và một gương mặt tóc bạc hiện ra, vẫn nụ cười ấy.`,
        x.s.married ? `${sp(x)} đang tưới cây ngoài ban công.` : 'Căn phòng yên tĩnh đến mức nghe rõ tiếng đồng hồ.',
      ],
      choices: [
        { t: 'Gửi lời chào: "Cậu còn nhớ tớ không?"', do: (fx, x) => (fx.love(firstLove(x), 8), fx.stat('tam', 8)), note: (x) => `${x.L(firstLove(x))} trả lời bằng một tấm ảnh cũ: hai đứa trẻ trong ngõ năm nào.` },
        { t: 'Chỉ ngồi xem ảnh, không nhắn', do: (fx) => (fx.stat('tinh', 6), fx.stat('tam', 3)) },
        { t: 'Gập máy, ra ngồi cạnh người bên cạnh mình', do: (fx, x) => (fx.stat('tam', 6), partnerOf(x) ? fx.love(partnerOf(x)!, 8) : fx.rel('con', 6)) },
      ],
    },
  ],
};

/** nơi đi tiếp sau mỗi ô */
export const SLOT_NEXT: Record<number, string> = { 9: 'c10_he', 11: 'c12_chuyennha', 14: 't15', 16: 't17_thi', 21: 'hub@21#1', 26: 'hub@26#1', 30: 'm32_tet', 35: 'm40_nguoicu', 42: 'm45_viec', 65: 'o75' };
const chapterOf = (age: number) => (age <= 12 ? 'Tuổi thơ' : age <= 17 ? 'Tuổi teen' : age < 30 ? 'Tuổi trẻ' : age < 60 ? 'Lập gia đình' : 'Tuổi già');

export const ERA_EVENT_IDS = Object.values(SLOTS).flat().map((e) => e.id);

/** Cảnh của ô tuổi `age`: tình huống đầu tiên hợp năm và điều kiện; không có thì bỏ qua */
export function eraScene(age: number, x: Ctx): Scene {
  const ev = (SLOTS[age] ?? []).find((e) => x.year >= e.from && x.year <= e.to && (!e.if || e.if(x)));
  const next = SLOT_NEXT[age] ?? 'end';
  if (!ev) return { id: `ev@${age}`, age, chapter: chapterOf(age), title: '', text: () => [], choices: [], next, skip: () => true };
  return {
    id: `ev@${age}`,
    age,
    chapter: chapterOf(age),
    title: ev.title,
    bg: ev.bg,
    who: ev.who,
    text: ev.text,
    choices: ev.choices,
    next,
  };
}
