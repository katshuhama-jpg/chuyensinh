/**
 * Một đêm hẹn với ngôi sao (nhân vật hư cấu hoàn toàn: Mr. Hến/Diệp, Quân/Mai, Long Miền Tây/Yến).
 * Bốn chặng: tin nhắn lúc một giờ sáng - ăn đêm đội khẩu trang (có tay săn ảnh) -
 * ảnh lộ thì công khai, phủ nhận hay lùi lại - đêm diễn có một bài hát (hoặc một lời cảm ơn) dành cho mình.
 */

import type { Bg } from '@/components/Backdrop';
import type { Choice, Ctx, LoveId, Scene } from './story';

export const STARS: LoveId[] = ['hung', 'quan', 'tai'];

/** ngôi sao này hát (ca sĩ) hay đóng phim (diễn viên) */
const sings = (id: LoveId, x: Ctx) => !((id === 'hung' || id === 'quan') && x.lg === 'f');
const Up = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const roll = (x: Ctx, salt: number) => {
  const n = Math.sin((x.s.path.length + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
};
/** báo chí theo thời */
const press = (y: number) => (y < 2010 ? 'mấy tờ báo lá cải' : y < 2016 ? 'các trang tin giải trí' : 'các hội nhóm bóc phốt trên mạng');
const work = (id: LoveId, x: Ctx) => (sings(id, x) ? 'phòng thu' : 'trường quay');
const food = (id: LoveId) => (id === 'tai' ? 'hủ tiếu gõ' : id === 'quan' ? 'cháo sườn' : 'ốc luộc');

/** đủ điều kiện để có một đêm như thế (mỗi ngôi sao một lần) */
export const starNight = (x: Ctx, id: LoveId) => STARS.includes(id) && !x.s.married && x.s.love[id] >= 28 && !x.has(`st_${id}`);

export function starScene(step: 1 | 2 | 3 | 4, age: number, id: LoveId, after: string, x0: Ctx): Scene {
  const key = `${age}:${id}`;
  const base = { age, chapter: 'Tuổi trẻ', who: () => id };
  const lo = `st_lo_${id}`;
  const L = (x: Ctx) => x.L(id);

  if (step === 1)
    return {
      ...base,
      id: `st1@${key}`,
      kind: 'chat',
      timer: 12,
      timeout: 1,
      bg: () => ({ place: 'phong', time: 'night' }),
      title: (x) => `Một giờ sáng, ${L(x)} nhắn`,
      device: (x) => (x.year < 2004 ? 'letter' : x.year < 2012 ? 'nokia' : x.year <= 2026 ? 'smart' : 'ai'),
      text: (x) => [x.year < 2004 ? `Điện thoại bàn reo lúc một giờ sáng. Đầu dây bên kia là ${L(x)}.` : `${L(x)} vừa nhắn, lúc một giờ sáng.`],
      msgs: (x) => [
        { me: false, t: `Vừa xong việc ở ${work(id, x)}.` },
        { me: false, t: `Cả thành phố ngủ rồi, chỉ còn quán ${food(id)} đầu phố mở.` },
        { me: false, t: `Ra không? ${x.xung === 'anh' ? 'Anh' : 'Em'} đội mũ, đeo khẩu trang, không ai nhận ra đâu.` },
      ],
      choices: [
        { t: 'Đi ngay, bắt xe ra luôn', do: (fx) => (fx.flag(`st_${id}`), fx.love(id, 6)), sys: 'Đinh! Ký chủ đang hẹn hò với người có hai triệu người theo dõi. Bản Hệ Thống run quá.' },
        { t: '"Mai còn đi làm sớm, hẹn hôm khác nhé"', do: (fx) => (fx.flag(`st_${id}`), fx.love(id, -2)), to: after },
      ],
      next: `st2@${key}`,
    };

  if (step === 2)
    return {
      ...base,
      id: `st2@${key}`,
      timer: 10,
      timeout: 1,
      bg: () => ({ place: 'pho', time: 'night' }),
      title: 'Ăn đêm, đội khẩu trang',
      text: (x) => [
        `Quán ${food(id)} vỉa hè, ghế nhựa thấp lè tè. ${L(x)} kéo khẩu trang xuống ăn được hai miếng thì cười sặc vì ${x.me} kể chuyện.`,
        `Bàn bên có người cứ nhìn sang, tay cầm điện thoại${x.year < 2008 ? ' có camera' : ''}. Bên kia đường, một chiếc xe máy đỗ im, đèn tắt.`,
      ],
      choices: [
        { t: 'Kéo mũ thấp, đổi chỗ ngồi quay lưng ra đường', do: (fx, x) => (fx.love(id, 6), fx.say(`${L(x)} thì thầm: "${x.goi === 'em' ? 'Em' : 'Anh'} còn giỏi trốn hơn cả quản lý của ${x.xung}."`)) },
        {
          t: 'Kệ, cứ ăn tự nhiên, kể tiếp chuyện cười',
          do: (fx, x) => {
            fx.love(id, 10);
            if (roll(x, age * 37) < 0.5) fx.flag(lo);
            fx.say(`Lần đầu sau nhiều năm, ${L(x)} được ăn một bữa như người bình thường.`);
          },
        },
        {
          t: 'Bỏ khẩu trang ra, chụp chung một tấm',
          do: (fx, x) => {
            fx.love(id, 14);
            if (roll(x, age * 41) < 0.8) fx.flag(lo);
            fx.photo({ who: id, place: `Quán ${food(id)} lúc hai giờ sáng`, bg: { place: 'pho', time: 'night' }, line: 'Hai khuôn mặt sát nhau, đèn flash hơi chói. Tấm ảnh không ai được xem.' });
          },
          note: () => '▣ Một tấm ảnh vừa vào album kỷ niệm.',
        },
      ],
      next: `st3@${key}`,
    };

  if (step === 3)
    return {
      ...base,
      id: `st3@${key}`,
      kind: x0.has(lo) ? 'chat' : undefined,
      timer: x0.has(lo) ? 15 : undefined,
      timeout: 1,
      bg: () => ({ place: 'phong', time: 'day' }),
      title: (x) => (x.has(lo) ? 'Ảnh lộ' : 'Bí mật nhỏ của hai người'),
      device: (x) => (x.year < 2004 ? 'letter' : x.year < 2012 ? 'nokia' : x.year <= 2026 ? 'smart' : 'ai'),
      text: (x) =>
        x.has(lo)
          ? [`Sáng hôm sau, ${press(x.year)} đăng ảnh mờ: "${L(x)} hẹn hò bí mật lúc nửa đêm với người lạ?" Điện thoại ${x.me} rung không ngừng.`]
          : [`Không ai chụp được gì. Từ hôm ấy, ${L(x)} lưu tên ${x.me} trong máy là "${Up(food(id))}".`],
      msgs: (x) =>
        x.has(lo)
          ? [
              { me: false, t: `Quản lý của ${L(x)}: Xóa hết ảnh, đừng trả lời phóng viên.` },
              { me: false, t: `${L(x)}: ${x.goi === 'em' ? 'Em' : 'Anh'} có sao không? ${x.xung === 'anh' ? 'Anh' : 'Em'} xin lỗi.` },
              { me: false, t: `${L(x)}: ${x.goi === 'em' ? 'Em' : 'Anh'} muốn mình làm gì, ${x.xung} làm theo.` },
            ]
          : [],
      choices: [
        {
          t: 'Cùng người ấy công khai',
          if: (x) => x.has(lo) && x.s.love[id] >= 50,
          do: (fx, x) => (fx.flag(`st_cong_${id}`), fx.love(id, 15), fx.stat('noi', 6), fx.stat('tam', -4), fx.say(`${L(x)} đăng một tấm ảnh hai bàn tay. Mất hai hợp đồng quảng cáo, được cả một trời lời chúc.`)),
          sys: 'Đinh! Ký chủ vừa lên top tìm kiếm. Bản Hệ Thống tự hào nhưng cũng hơi sợ.',
        },
        { t: 'Để quản lý phủ nhận: "Chỉ là bạn"', if: (x) => x.has(lo), do: (fx, x) => (fx.flag(`st_phu_${id}`), fx.love(id, -6), fx.stat('tam', -4), fx.say(`Bài báo bị gỡ. Hai người phải hẹn nhau ở những nơi xa hơn, muộn hơn.`)) },
        {
          t: 'Lùi lại, để người ấy yên ổn với sự nghiệp',
          if: (x) => x.has(lo),
          do: (fx, x) => (fx.flag(`st_lui_${id}`), fx.love(id, -20), fx.unflag(`pool_${id}`), fx.say(`${L(x)} nhắn đúng một chữ: "Sao?". Rồi thôi không nhắn nữa.`)),
        },
        { t: 'Giữ bí mật thêm một thời gian', if: (x) => !x.has(lo), do: (fx) => (fx.flag(`st_bimat_${id}`), fx.love(id, 6)) },
        {
          t: 'Hỏi thẳng: "Mình có định công khai không?"',
          if: (x) => !x.has(lo),
          do: (fx, x) =>
            x.s.love[id] >= 55
              ? (fx.flag(`st_cong_${id}`), fx.love(id, 10), fx.say(`${L(x)} im một lúc rồi gật: "Đợi hết hợp đồng này. ${x.xung === 'anh' ? 'Anh' : 'Em'} hứa."`))
              : (fx.love(id, -4), fx.say(`${L(x)} nhìn đi chỗ khác: "Chưa được. Hợp đồng còn ràng buộc."`)),
        },
      ],
      next: `st4@${key}`,
    };

  // đêm diễn: bài hát (hoặc lời cảm ơn trên sân khấu) dành cho mình
  const stage = (x: Ctx) => (sings(id, x) ? `đêm ${x.year < 2005 ? 'ca nhạc' : 'concert'} ở ${x.year < 2003 ? 'nhà thi đấu' : 'sân vận động'}` : `lễ trao giải điện ảnh`);
  const choices: Choice[] = [
    {
      t: (x) => (sings(id, x) ? 'Giơ cao đèn, hát theo cả bài' : 'Vỗ tay đến đỏ cả tay'),
      do: (fx, x) => (fx.love(id, 8), fx.photo({ who: id, place: Up(stage(x)), bg: concertBg, line: x.has(`st_cong_${id}`) ? 'Ba vạn ngọn đèn quay về một phía.' : 'Một ánh mắt tìm thấy mình giữa đám đông.' })),
      note: () => '▣ Một tấm ảnh vừa vào album kỷ niệm.',
    },
    { t: 'Khóc, không giấu được', do: (fx) => (fx.love(id, 6), fx.stat('tinh', 4)) },
    { t: (x) => `Lặng lẽ về trước, nhắn: "${sings(id, x) ? 'Hát hay lắm' : 'Xứng đáng lắm'}"`, do: (fx) => (fx.love(id, 4), fx.stat('tam', 3)) },
  ];
  return {
    ...base,
    id: `st4@${key}`,
    bg: () => concertBg,
    skip: (x) => x.has(`st_lui_${id}`),
    title: (x) => Up(stage(x)),
    text: (x) => {
      const n = L(x);
      if (!sings(id, x))
        return x.has(`st_cong_${id}`)
          ? [`${n} lên nhận giải nữ chính. Cầm cúp trên tay, ${x.ay} nói: "Cảm ơn ${x.me}, người đợi tôi sau mọi buổi quay." Cả khán phòng quay lại tìm.`]
          : [`${n} lên nhận giải. Cuối bài phát biểu: "Cảm ơn một người luôn đợi tôi ở cửa sau." Chỉ ${x.me} hiểu câu ấy nói về ai.`];
      if (x.has(`st_cong_${id}`)) return [`Giữa ${stage(x)}, ${n} dừng nhạc: "Bài này viết cho một người đang đứng ở hàng ghế thứ bảy." Ba vạn ngọn đèn quay về phía ${x.me}.`];
      if (x.has(`st_phu_${id}`)) return [`${n} hát một bài chưa từng công bố, chậm và buồn. Hôm sau báo viết: "Ca khúc về một mối tình không được gọi tên."`];
      return [`Hát xong, ${n} nhìn về khán đài phía Tây, hàng thứ bảy, chạm tay lên ngực hai lần. Ám hiệu chỉ hai người biết.`];
    },
    choices,
    next: after,
  };
}

const concertBg: Bg = { place: 'pho', time: 'night' };
