/**
 * Những năm giữa đời (27-74): năm nào cũng có vài dòng tự trôi (tiền bạc, vợ chồng, con cái, bố mẹ, người cũ),
 * thỉnh thoảng dừng hỏi: kỷ niệm ngày cưới như một buổi hẹn hò lại, quên ngày kỷ niệm, trăng mật lần hai,
 * con vào lớp một, con thi đại học, bạn bè giới thiệu người mới cho người còn một mình.
 */

import { LOVE_IDS, type Ctx, type Fx, type LoveId, type Scene } from './story';
import { fmtVND, unitOf } from './money';
import { xemmatName } from './names';
import { newsOfLoves } from './lives';
import { newsOf } from './world';

const pid = (x: Ctx): LoveId | null => (x.s.partner && x.s.partner !== 'xemmat' ? x.s.partner : null);
const sp = (x: Ctx) => (pid(x) ? x.L(pid(x)!) : x.s.partner === 'xemmat' ? xemmatName(x) : x.lg === 'm' ? 'Chồng' : 'Vợ');
const ym = (x: Ctx) => (x.s.marriedAge == null ? 0 : x.age - x.s.marriedAge);
const U = (x: Ctx) => unitOf(x.year, x.age);
const cash = (x: Ctx) => x.s.cash ?? 0;
const pick = <T,>(x: Ctx, k: string, list: T[]) => {
  let h = 7 ^ (x.s.seed ?? 0);
  const key = `${k}|${x.age}`;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x9e3779b1);
  return list[((h >>> 0) % list.length)];
};
/** con đầu sinh năm 33 tuổi (cảnh Chuyện con cái) */
const kidAge = (x: Ctx) => (x.s.kids ? x.age - 33 : -1);
const ANNIV = [1, 5, 10, 15, 20, 30, 40];
const lv = (fx: Fx, x: Ctx, d: number) => (pid(x) ? fx.love(pid(x)!, d) : fx.stat('tam', Math.round(d / 2)));

function lines(x: Ctx): string[] {
  const out: string[] = [];
  const r = (k: string) => pick(x, k, [0, 1, 2, 3, 4, 5]);
  // thời sự năm ấy (có thật đến 2026)
  const nw = newsOf(x.year);
  if (nw && (x.year <= 2026 ? r('nw') < 3 : r('nw') < 1)) out.push(`Năm ${x.year}: ${nw}`);
  // tiền: không phải năm nào cũng nhắc
  const c = cash(x);
  if (r('tienon') < 3)
    out.push(
      c < 0
        ? pick(x, 'no', [`Vẫn còn nợ ${fmtVND(-c)}. Tháng nào lương về cũng chia ba: lãi, chợ, điện nước.`, `Nợ ${fmtVND(-c)}, mỗi lần điện thoại reo lại giật mình.`, `Khoản nợ ${fmtVND(-c)} như hòn đá treo trên đầu. Tết năm nay không dám về quê.`, `Cắt hết khoản ăn ngoài, đi chợ cũng tính từng nghìn. Nợ còn ${fmtVND(-c)}.`])
        : pick(x, 'tien', [`Cuối năm ngồi tính sổ: để dành được ${fmtVND(c)}.`, `Tài khoản có ${fmtVND(c)}. ${x.s.stats.tien >= 60 ? 'Năm nay thưởng Tết to.' : 'Tiêu dè sẻn thì cũng đủ.'}`, `${x.s.stats.tien >= 55 ? 'Lên lương.' : 'Lương vẫn thế, giá cả thì lên.'} Trong sổ tiết kiệm có ${fmtVND(c)}.`, `${x.year < 2010 ? 'Mua được chỉ vàng thứ mười, cất dưới đáy tủ.' : 'Gửi thêm một sổ tiết kiệm kỳ hạn mười hai tháng.'} Tổng cộng ${fmtVND(c)}.`, `Lần đầu dám đi ăn nhà hàng mà không nhìn giá. Trong tài khoản vẫn còn ${fmtVND(c)}.`]),
    );
  // vợ chồng hoặc một mình
  if (x.s.married) {
    const v = pid(x) ? x.s.love[pid(x)!] : x.s.stats.tam;
    if (r('vcon') < 4)
      out.push(
        v >= 70
          ? pick(x, 'vc', [`${sp(x)} vẫn pha trà mỗi sáng, để sẵn ly của ${x.me} bên cạnh.`, `Tối nào hai người cũng đi bộ một vòng quanh ${x.f.urban ? 'phố' : 'xóm'}.`, `${sp(x)} vẫn gọi ${x.me} bằng cái tên hồi mới yêu.`, `Hai người cãi nhau vì cái điều khiển tivi, năm phút sau đã cười.`, `${sp(x)} lén để một mảnh giấy trong ví: "Ăn trưa đủ vào."`, `Ngày mưa, ${sp(x)} đứng đợi ở cổng cơ quan với chiếc áo mưa, như hồi mới yêu.`])
          : v >= 45
            ? pick(x, 'vc', [`Hai vợ chồng bận, ít nói chuyện hơn, nhưng vẫn nhớ mua đồ ăn cho nhau.`, `Thỉnh thoảng cãi nhau chuyện nhỏ, rồi làm lành bằng một bữa ăn ngoài.`, `${sp(x)} ngủ trước, ${x.me} lướt điện thoại đến khuya. Ngày nào cũng thế.`, `Cuối tuần cả nhà về bên nội ăn cơm, ${sp(x)} hơi mệt nhưng không than.`])
            : pick(x, 'vc', [`Có những tuần hai người chỉ nói với nhau về tiền điện, tiền học.`, `${sp(x)} về muộn. ${x.me} cũng không hỏi nữa.`, `Hai người ăn cơm mỗi người một góc, mỗi người một cái điện thoại.`, `Ngày giỗ bên nội, ${sp(x)} viện cớ bận không về.`]),
      );
  } else
    out.push(pick(x, 'don', [`Vẫn một mình. Cuối tuần đi cà phê với ${x.s.bestie}.`, `Một mình mà không buồn: tự nấu ăn, tự đi du lịch, tự sửa bóng đèn.`, `${x.s.bestie} hỏi: "Định một mình đến bao giờ?" ${x.me} cười cho qua.`, `Nuôi một con mèo. Tối về có đứa đợi cửa.`, `Đăng ký học vẽ buổi tối. Lớp toàn người lạ, vui hơn tưởng.`, `Đám cưới bạn bè nhiều đến mức có hẳn một ngăn tủ để phong bì.`]));
  // con
  const k = kidAge(x);
  if (k >= 0) {
    const kl = [
      [0, 'Con chào đời. Cả nhà thức trắng mấy tháng liền.'],
      [1, 'Con thôi nôi, bốc trúng cây bút. Ông bà cười tít.'],
      [2, 'Con bập bẹ gọi "bố", "mẹ". Nhà lúc nào cũng có tiếng cười.'],
      [4, 'Con đi mẫu giáo, khóc mất ba ngày.'],
      [8, 'Con được giấy khen, khoe với cả xóm.'],
      [10, `Con đòi ${x.year >= 2015 ? 'điện thoại riêng' : 'xe đạp mới'}. Cả nhà họp ba buổi.`],
      [11, 'Con vào cấp hai, bắt đầu đóng cửa phòng.'],
      [14, 'Con dậy thì, ít nói hẳn. Hỏi gì cũng "kệ con".'],
      [16, `Con xin tiền đi học thêm. ${x.year >= 2015 ? 'Một tháng học thêm bằng nửa tháng lương.' : 'Học thêm thì ai cũng phải học.'}`],
      [20, 'Con lên thành phố học đại học. Nhà vắng hẳn.'],
      [23, 'Con ra trường, đi làm, tháng nào cũng gửi về một ít.'],
      [28, 'Con dẫn người yêu về ra mắt.'],
      [31, 'Có cháu. Lần đầu được bế cháu, tay run run.'],
    ] as const;
    const hit = kl.find(([a]) => a === k);
    if (hit) out.push(hit[1]);
  }
  // sức khỏe
  if (x.age >= 40 && (x.s.stats.khoe ?? 70) < 50 && r('khoe') < 2) out.push(pick(x, 'kh', ['Đi khám định kỳ, bác sĩ dặn bớt mặn, bớt ngọt, bớt thức khuya.', 'Lưng bắt đầu đau mỗi sáng. Tuổi tác không chừa ai.', 'Lần đầu phải đeo kính lão để đọc tin nhắn.']));
  // bố mẹ
  if (x.f.parents !== 'Không còn bố mẹ' && x.age >= 40 && x.age <= 58 && x.age % 4 === 0)
    out.push(pick(x, 'bm', [`${x.mom === 'mẹ' ? 'Mẹ' : 'Bà'} dạo này hay quên, gọi điện hỏi lại một chuyện ba lần.`, `${x.bm === 'ông bà' ? 'Ông' : 'Bố'} đi khám, bác sĩ dặn bỏ rượu. ${x.bm === 'ông bà' ? 'Ông' : 'Bố'} bảo "uống ít thôi".`, `Về quê, thấy ${x.bm} già đi nhiều quá.`]));
  // người cũ
  const n = newsOfLoves(x);
  if (n) out.push(n);
  if (!out.length) out.push(pick(x, 'em', ['Một năm bình yên, không có gì đáng kể. Có khi thế lại là may.', 'Năm nay trôi qua nhanh như một cái chớp mắt.', 'Cả năm chỉ nhớ nhất một bữa cơm đông đủ ngày Tết.']));
  return out;
}

/** kỷ niệm ngày cưới rơi vào khoảng tuổi (last, to]: trả về tuổi ấy */
export function annivAgeIn(x: { s: { married: boolean; marriedAge?: number | null; flags: string[] } }, last: number, to: number) {
  if (!x.s.married || x.s.marriedAge == null) return null;
  for (let a = last + 1; a <= to; a++) {
    const n = a - x.s.marriedAge;
    if (ANNIV.includes(n) && !x.s.flags.includes(`kn_${n}`)) return a;
  }
  return null;
}

/** Năm giữa đời ở tuổi `age`; `next` là cảnh thật ở phía sau */
export function midlifeAt(age: number, x: Ctx, next: string): Scene | null {
  const annivNow = x.s.married && ANNIV.includes(ym(x)) && !x.has(`kn_${ym(x)}`);
  if ((age < 27 && !annivNow) || age > 74) return null;
  const chapter = age < 30 ? 'Tuổi trẻ' : age < 60 ? 'Lập gia đình' : 'Tuổi già';
  const base = { id: `ml@${age}`, age, chapter, next };

  // kỷ niệm ngày cưới: một buổi hẹn hò lại
  if (x.s.married && ANNIV.includes(ym(x)) && !x.has(`kn_${ym(x)}`)) {
    const n = ym(x);
    const room = cash(x) >= U(x) * 10;
    return {
      ...base,
      title: `${n} năm ngày cưới`,
      who: (cx) => (cx.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>,
      bg: () => ({ place: 'quan', time: 'night' }),
      text: (cx) => [
        n === 1 ? `Tròn một năm ngày cưới. ${sp(cx)} vẫn còn ngượng khi gọi "${cx.c.gender === 'm' ? 'chồng' : 'vợ'} ơi".` : `${n} năm ngày cưới. ${n >= 20 ? 'Tóc hai người đã điểm bạc.' : cx.s.kids ? 'Con đã lớn, tự trông nhau được một tối.' : 'Hai người vẫn hai người, như hồi mới cưới.'}`,
        cx.has(`kn_quen`) ? `🦋 Năm ngoái ${cx.me} quên mất ngày này. Năm nay ${sp(cx)} nhắc từ một tuần trước.` : `${sp(cx)} hỏi: "Năm nay mình làm gì?"`,
      ],
      choices: [
        {
          t: 'Về lại đúng chỗ hẹn hò đầu tiên',
          do: (fx, cx) => {
            fx.flag(`kn_${n}`);
            lv(fx, cx, 10);
            if (pid(cx)) fx.photo({ who: pid(cx)!, place: `${n} năm ngày cưới`, bg: { place: 'quan', time: 'night' }, line: 'Vẫn chỗ cũ, vẫn món cũ, chỉ có hai người là già đi.' });
          },
          note: () => '▣ Một tấm ảnh vừa vào album kỷ niệm.',
        },
        {
          t: `Đi trăng mật lần hai (${fmtVND(U(x) * 8)})`,
          if: () => room,
          do: (fx, cx) => {
            fx.flag(`kn_${n}`);
            fx.cash(-U(cx) * 8);
            lv(fx, cx, 14);
            fx.stat('tam', 6);
            if (pid(cx)) fx.photo({ who: pid(cx)!, place: 'Trăng mật lần hai', bg: { place: 'congvien', time: 'dusk' }, line: 'Lần này không phải lo tiền phòng, chỉ lo ngủ quên mất hoàng hôn.' });
          },
          note: () => '▣ Một tấm ảnh vừa vào album kỷ niệm.',
        },
        { t: 'Mua một món quà nhỏ, nấu bữa tối ở nhà', do: (fx, cx) => (fx.flag(`kn_${n}`), fx.cash(-U(cx) * 0.5), lv(fx, cx, 6)) },
        {
          t: 'Bận quá, để năm sau',
          do: (fx, cx) => (fx.flag(`kn_${n}`), fx.flag('kn_quen'), lv(fx, cx, -12)),
          note: (cx) => `${sp(cx)} dọn bàn ăn đã bày sẵn hai cây nến, không nói gì.`,
          sys: 'Đinh! Ký chủ vừa quên ngày kỷ niệm. Bản Hệ Thống xin phép không bênh.',
        },
      ],
    };
  }

  // con vào lớp một, con thi đại học: tiền và lựa chọn
  const k = kidAge(x);
  if ((k === 6 || k === 18) && !x.has(`kc_${k}`)) {
    const school = k === 6;
    return {
      ...base,
      title: school ? 'Con vào lớp Một' : 'Con thi đại học',
      who: () => 'mom',
      bg: () => ({ place: 'cong', time: 'day' }),
      text: (cx) => [
        school ? `Con tròn sáu tuổi, chuẩn bị vào lớp Một. ${cx.year >= 2010 ? 'Trường quốc tế gần nhà học phí một năm bằng một chiếc xe máy.' : 'Trường điểm trên phố phải xin mới được vào.'}` : `Con thi đại học. ${cx.year >= 2015 ? 'Con muốn đi du học, cần một khoản lớn.' : 'Con đỗ trường ở thành phố, phải thuê trọ.'}`,
        `${sp(cx)} hỏi: "Mình tính thế nào?"`,
      ],
      choices: [
        { t: school ? 'Cho con học trường tốt nhất có thể' : 'Dốc hết tiền cho con đi học', if: (cx) => cash(cx) >= U(cx) * (school ? 6 : 20), do: (fx, cx) => (fx.flag(`kc_${k}`), fx.cash(-U(cx) * (school ? 6 : 20)), fx.rel('con', 10), lv(fx, cx, 4)) },
        { t: school ? 'Học trường gần nhà, tiền để dành' : 'Vay thêm cho con đi', do: (fx, cx) => (fx.flag(`kc_${k}`), school ? fx.rel('con', 2) : (fx.cash(-U(cx) * 20), fx.rel('con', 12), fx.stat('tam', -4))) },
        { t: 'Để con tự chọn', do: (fx) => (fx.flag(`kc_${k}`), fx.rel('con', 6)) },
      ],
    };
  }

  // còn một mình: năm năm một lần, bạn bè giới thiệu hoặc người cũ quay lại
  if (!x.s.married && !x.s.partner && age % 5 === 2 && age <= 57) {
    const old = LOVE_IDS.filter((id) => x.s.met.includes(id) && x.s.love[id] >= 35).sort((a, b) => x.s.love[b] - x.s.love[a])[0];
    return {
      ...base,
      title: 'Mai mối',
      who: (cx) => old ?? (cx.c.gender === 'f' ? 'bestie' : 'bestie'),
      bg: () => ({ place: 'quan', time: 'day' }),
      text: (cx) => [
        `${cx.s.bestie} hẹn đi cà phê, rồi "tình cờ" có một người ngồi sẵn ở bàn.`,
        ...(old ? [`Người ấy hóa ra là ${cx.L(old)}. ${cx.age} tuổi rồi, cả hai đều vẫn một mình.`] : ['Người lạ, nói chuyện được, cũng hay cười.']),
      ],
      choices: [
        ...(old ? [{ t: `Lần này nắm lấy tay ${x.L(old)}`, do: (fx: Fx) => (fx.unflag(`${old}_out`), fx.partner(old), fx.love(old, 15), fx.marry(), fx.loveEnd(`muon_${old}`)), note: () => '🦋 Muộn, nhưng không trễ.' }] : []),
        { t: 'Thử tìm hiểu xem sao', if: () => !old, do: (fx: Fx, cx: Ctx) => (cx.s.stats.duyen + cx.s.stats.dao >= 100 ? (fx.partner('xemmat'), fx.marry(), fx.loveEnd('muonxm')) : fx.say('Gặp thêm hai lần, rồi thưa dần.')) },
        { t: 'Cảm ơn, nhưng mình quen một mình rồi', do: (fx: Fx) => fx.stat('tam', 4) },
      ],
    };
  }

  // nợ kéo dài: vài năm một lần phải tính chuyện trả nợ
  if (cash(x) < -U(x) * 5 && age % 6 === 3 && !x.has(`tn_${age}`)) {
    return {
      ...base,
      title: 'Món nợ dai dẳng',
      who: (cx) => (cx.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [`Nợ vẫn còn ${fmtVND(-cash(cx))}, lãi chồng lên lãi.${cx.s.married ? ` ${sp(cx)} đặt cuốn sổ chi tiêu lên bàn: "Phải tính thôi."` : ''}`],
      choices: [
        { t: 'Làm thêm buổi tối, cuối tuần chạy xe', do: (fx, cx) => (fx.flag(`tn_${age}`), fx.cash(U(cx) * 8), fx.stat('khoe', -6), lv(fx, cx, 4)) },
        { t: (cx) => (cx.has('ms_xe') ? 'Bán xe, đi xe buýt' : 'Bán vàng cưới'), do: (fx, cx) => (fx.flag(`tn_${age}`), fx.cash(U(cx) * 10), fx.stat('tam', -4)) },
        { t: 'Nhờ con giúp một phần', if: (cx) => kidAge(cx) >= 23, do: (fx, cx) => (fx.flag(`tn_${age}`), fx.cash(U(cx) * 12), fx.rel('con', -4), fx.stat('tam', -6)) },
        { t: 'Thôi, đến đâu hay đến đó', do: (fx, cx) => (fx.flag(`tn_${age}`), lv(fx, cx, -6)) },
      ],
    };
  }

  // năm bình thường: vài dòng tự trôi
  return {
    ...base,
    kind: 'feed',
    title: `Năm ${x.year}`,
    bg: () => ({ place: 'nha', time: 'day' }),
    text: () => [],
    feed: (cx) => lines(cx).map((t) => ({ age, year: cx.year, t })),
    choices: [{ t: '▶ Sống tiếp' }],
  };
}
