/**
 * Những năm giữa đời (27-74): năm nào cũng có vài dòng tự trôi (tiền bạc, vợ chồng, con cái, bố mẹ, người cũ),
 * thỉnh thoảng dừng hỏi: kỷ niệm ngày cưới như một buổi hẹn hò lại, quên ngày kỷ niệm, trăng mật lần hai,
 * con vào lớp một, con thi đại học, bạn bè giới thiệu người mới cho người còn một mình.
 */

import { LOVE_IDS, type Ctx, type Fx, type LoveId, type Scene } from './story';
import { fmtGold, fmtVND, priceAt, unitOf } from './money';
import { bornOf, eldest, goldOf, goldText, goldVND, homeOf, kidsWord, youngest } from './family';
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
/** tuổi đứa lớn (theo năm con thật sự chào đời) */
const kidAge = eldest;
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
        ? pick(x, 'no', [`Vẫn còn nợ ${fmtVND(-c)}. Tháng nào ${x.age >= 60 ? 'lương hưu' : 'lương'} về cũng chia ba: lãi, chợ, điện nước.`, `Nợ ${fmtVND(-c)}, mỗi lần điện thoại reo lại giật mình.`, `Khoản nợ ${fmtVND(-c)} như hòn đá treo trên đầu. Tết năm nay ${x.age >= 60 ? 'không dám mừng tuổi các cháu nhiều' : 'không dám về quê'}.`, `Cắt hết khoản ăn ngoài, đi chợ cũng tính từng nghìn. Nợ còn ${fmtVND(-c)}.`])
        : pick(x, 'tien', [`Cuối năm ngồi tính sổ: để dành được ${fmtVND(c)}.`, `Tài khoản có ${fmtVND(c)}. ${x.s.stats.tien >= 60 ? 'Năm nay thưởng Tết to.' : 'Tiêu dè sẻn thì cũng đủ.'}`, `${x.age >= 60 ? 'Lương hưu đủ ăn, không phải ngửa tay xin con.' : x.s.stats.tien >= 55 ? 'Lên lương.' : 'Lương vẫn thế, giá cả thì lên.'} Trong sổ tiết kiệm có ${fmtVND(c)}.`, `${x.year < 2010 ? 'Mua được chỉ vàng thứ mười, cất dưới đáy tủ.' : 'Gửi thêm một sổ tiết kiệm kỳ hạn mười hai tháng.'} Tổng cộng ${fmtVND(c)}.`, `Lần đầu dám đi ăn nhà hàng mà không nhìn giá. Trong tài khoản vẫn còn ${fmtVND(c)}.`]),
    );
  // vợ chồng hoặc một mình
  if (x.s.married) {
    const v = pid(x) ? x.s.love[pid(x)!] : x.s.stats.tam;
    if (r('vcon') < 4)
      out.push(
        v >= 70
          ? pick(x, 'vc', [
              `${sp(x)} vẫn pha trà mỗi sáng, để sẵn ly của ${x.me} bên cạnh.`,
              `Tối nào hai người cũng đi bộ một vòng quanh ${x.f.urban ? 'phố' : 'xóm'}.`,
              `${sp(x)} vẫn gọi ${x.me} bằng cái tên hồi mới yêu.`,
              `Hai người cãi nhau vì cái điều khiển tivi, năm phút sau đã cười.`,
              ...(x.age < 58
                ? [`${sp(x)} lén để một mảnh giấy trong ví: "Ăn trưa đủ vào."`, `Ngày mưa, ${sp(x)} đứng đợi ở cổng cơ quan với chiếc áo mưa, như hồi mới yêu.`]
                : [`Về hưu rồi, sáng nào hai người cũng ra ${x.f.urban ? 'công viên' : 'đầu làng'} tập dưỡng sinh, ${sp(x)} toàn đứng sai hàng.`, `${sp(x)} trồng một giàn mướp trước sân, quả đầu tiên để dành cho ${x.me}.`]),
            ])
          : v >= 45
            ? pick(x, 'vc', [`Hai vợ chồng ${x.age < 58 ? 'bận' : 'già'}, ít nói chuyện hơn, nhưng vẫn nhớ mua đồ ăn cho nhau.`, `Thỉnh thoảng cãi nhau chuyện nhỏ, rồi làm lành bằng một bữa ăn ngoài.`, `${sp(x)} ngủ trước, ${x.me} lướt điện thoại đến khuya. Ngày nào cũng thế.`, `Cuối tuần ${x.f.parents !== 'Không còn bố mẹ' && x.age < 58 ? 'cả nhà về bên nội ăn cơm' : 'con cháu về ăn cơm'}, ${sp(x)} hơi mệt nhưng không than.`])
            : pick(x, 'vc', [`Có những tuần hai người chỉ nói với nhau về tiền điện, ${x.s.kids && kidAge(x) < 22 ? 'tiền học' : 'tiền chợ'}.`, `${sp(x)} ${x.age < 58 ? 'về muộn' : 'ngồi quán chè đầu ngõ đến tối mới về'}. ${x.me} cũng không hỏi nữa.`, `Hai người ăn cơm mỗi người một góc, mỗi người một cái điện thoại.`, `Ngày giỗ bên nội, ${sp(x)} viện cớ bận không về.`]),
      );
  } else
    out.push(pick(x, 'don', [`Vẫn một mình. Cuối tuần đi cà phê với ${x.s.bestie}.`, `Một mình mà không buồn: tự nấu ăn, tự đi du lịch, tự sửa bóng đèn.`, `${x.s.bestie} hỏi: "Định một mình đến bao giờ?" ${x.me} cười cho qua.`, `Nuôi một con mèo. Tối về có đứa đợi cửa.`, `Đăng ký học vẽ buổi tối. Lớp toàn người lạ, vui hơn tưởng.`, `Đám cưới bạn bè nhiều đến mức có hẳn một ngăn tủ để phong bì.`]));
  // con: theo tuổi thật của từng đứa
  const k = kidAge(x);
  const born = bornOf(x.s);
  // đứa thứ hai, thứ ba chào đời / vào lớp Một
  born.slice(1).forEach((b, i) => {
    const a = x.age - b;
    const th = i === 0 ? 'thứ hai' : 'thứ ba';
    if (a === 1) out.push(`Đứa ${th} thôi nôi. ${i === 0 ? 'Đứa lớn ghé tai em thì thầm, không ai biết nói gì.' : 'Nhà ba đứa, sáng nào cũng như cái chợ.'}`);
    if (a === 6) out.push(`Đứa ${th} vào lớp Một, mặc lại bộ đồng phục cũ của anh chị.`);
  });
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
      [26, 'Con dẫn người yêu về ra mắt.'],
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
    const prevN = ANNIV[ANNIV.indexOf(n) - 1];
    const room = cash(x) >= U(x) * 10;
    return {
      ...base,
      title: `${n} năm ngày cưới`,
      who: (cx) => (cx.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>,
      bg: () => ({ place: 'quan', time: 'night' }),
      text: (cx) => [
        n === 1 ? `Tròn một năm ngày cưới. ${sp(cx)} vẫn còn ngượng khi gọi "${cx.c.gender === 'm' ? 'chồng' : 'vợ'} ơi".` : `${n} năm ngày cưới. ${n >= 20 ? 'Tóc hai người đã điểm bạc.' : cx.s.kids && kidAge(cx) >= 8 ? `${kidsWord(cx) === 'con' ? 'Con' : kidsWord(cx).charAt(0).toUpperCase() + kidsWord(cx).slice(1)} đã lớn, tự trông nhau được một tối.` : cx.s.kids ? 'Con còn nhỏ, gửi ông bà một tối.' : 'Hai người vẫn hai người, như hồi mới cưới.'}`,
        prevN && cx.has(`kn_quen_${prevN}`)
          ? `🦋 Lần kỷ niệm ${prevN} năm, ${cx.me} quên mất. Lần này ${sp(cx)} nhắc từ một tuần trước.`
          : cx.s.kids && kidAge(cx) >= 0 && kidAge(cx) < 3
            ? `Con còn nhỏ, ${cx.c.gender === 'f' ? 'bà ngoại' : 'bà nội'} bảo: "Cứ đi đi, mẹ trông cho một tối."`
            : `${sp(cx)} hỏi: "Năm nay mình làm gì?"`,
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
          do: (fx, cx) => (fx.flag(`kn_${n}`), fx.flag(`kn_quen_${n}`), lv(fx, cx, -12)),
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
        ...(old
          ? [cx.has(`vccu_${old}`) ? `Người ấy là ${cx.L(old)}, người từng là ${cx.lg === 'm' ? 'chồng' : 'vợ'} của ${cx.me}.${cx.s.kids ? ` ${bornOf(cx.s).length > 1 ? 'Các con' : 'Con'} ngồi bàn bên, giả vờ không nhìn.` : ''}` : `Người ấy hóa ra là ${cx.L(old)}. ${cx.age} tuổi rồi, cả hai đều vẫn một mình.`]
          : ['Người lạ, nói chuyện được, cũng hay cười.']),
      ],
      choices: [
        ...(old ? [{ t: `Lần này nắm lấy tay ${x.L(old)}`, do: (fx: Fx) => (fx.unflag(`${old}_out`), fx.partner(old), fx.love(old, 15), fx.marry(), fx.loveEnd(`muon_${old}`)), note: () => '🦋 Muộn, nhưng không trễ.' }] : []),
        { t: 'Thử tìm hiểu xem sao', if: () => !old, do: (fx: Fx, cx: Ctx) => (cx.s.stats.duyen + cx.s.stats.dao >= 100 ? (fx.partner('xemmat'), fx.marry(), fx.loveEnd('muonxm')) : fx.say('Gặp thêm hai lần, rồi thưa dần.')) },
        { t: 'Cảm ơn, nhưng mình quen một mình rồi', do: (fx: Fx) => fx.stat('tam', 4) },
      ],
    };
  }

  // nợ kéo dài: vài năm một lần phải tính chuyện trả nợ
  if (cash(x) < -U(x) * 5 && age % 6 === 3 && age < 58 && !x.has(`tn_${age}`)) {
    return {
      ...base,
      title: 'Món nợ dai dẳng',
      who: (cx) => (cx.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [`Nợ vẫn còn ${fmtVND(-cash(cx))}, lãi chồng lên lãi.${cx.s.married ? ` ${sp(cx)} đặt cuốn sổ chi tiêu lên bàn: "Phải tính thôi."` : ''}`],
      choices: [
        { t: 'Làm thêm buổi tối, cuối tuần chạy xe', do: (fx, cx) => (fx.flag(`tn_${age}`), fx.cash(U(cx) * 8), fx.stat('khoe', -6), lv(fx, cx, 4)) },
        { t: 'Bán ô tô, đi xe máy', if: (cx) => cx.has('oto'), do: (fx, cx) => (fx.flag(`tn_${age}`), fx.unflag('oto'), fx.unflag('ms_xe'), fx.cash(U(cx) * 7), fx.stat('tam', -4)) },
        {
          t: (cx) => `Mở hộp gỗ, bán ${goldText(cx)}`,
          if: (cx) => goldOf(cx) > 0,
          do: (fx, cx) => (fx.flag(`tn_${age}`), fx.sellGold(), cx.s.married ? lv(fx, cx, -4) : fx.stat('tam', -4)),
          note: (cx) => (cx.s.married ? `${sp(cx)} cầm sợi dây chuyền lên ngắm lần cuối rồi mới đưa cho thợ.` : 'Hộp gỗ giờ trống trơn.'),
        },
        { t: 'Nhờ con giúp một phần', if: (cx) => kidAge(cx) >= 23, do: (fx, cx) => (fx.flag(`tn_${age}`), fx.cash(U(cx) * 12), fx.rel('con', -4), fx.stat('tam', -6)) },
        { t: 'Thôi, đến đâu hay đến đó', do: (fx, cx) => (fx.flag(`tn_${age}`), lv(fx, cx, -6)) },
      ],
    };
  }

  // sắp về hưu mà còn nợ: phải khép món nợ lại, không để sang tuổi già
  if (cash(x) < -U(x) * 2 && age >= 58 && age <= 64 && !x.has('no_xong')) {
    const debt = -cash(x);
    return {
      ...base,
      title: 'Về hưu với một món nợ',
      who: (cx) => (cx.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [
        `Quyết định nghỉ hưu đã có. Lương sắp chỉ còn một nửa, mà nợ vẫn còn ${fmtVND(debt)}.`,
        homeOf(cx) === 'gop' || homeOf(cx) === 'nha' || homeOf(cx) === 'xay' ? 'Thứ đáng tiền nhất trong nhà là chính căn nhà đang ở.' : 'Nhà vẫn đi thuê, chẳng có gì đáng tiền để bán.',
        cx.s.kids && kidAge(cx) >= 23 ? `${kidsWord(cx) === 'con' ? 'Con' : 'Các con'} đã đi làm, biết chuyện, gọi về hỏi: "Bố mẹ cần bao nhiêu?"` : `${cx.s.married ? `${sp(cx)} bảo: "Không để nợ lại cho ai cả."` : 'Không muốn để nợ lại cho ai.'}`,
      ],
      choices: [
        {
          t: 'Bán nhà to, về ở căn nhỏ hơn, trả sạch nợ',
          if: (cx) => !!homeOf(cx) && homeOf(cx) !== 'thue' && homeOf(cx) !== 'chung',
          do: (fx, cx) => (fx.flag('no_xong'), fx.clearDebt(), fx.cash(U(cx) * 6), fx.stat('tam', -4), lv(fx, cx, 4)),
          note: () => '🦋 Căn nhỏ hơn, nhưng đêm ngủ không còn giật mình vì điện thoại.',
        },
        {
          t: 'Nhận tiền con gửi, trả nợ một lần',
          if: (cx) => !!cx.s.kids && kidAge(cx) >= 23,
          do: (fx, cx) => (fx.flag('no_xong'), fx.clearDebt(), fx.rel('con', cx.s.rel.con >= 50 ? 6 : -8), fx.stat('tam', -4)),
          note: (cx) => (cx.s.rel.con >= 50 ? 'Con bảo: "Hồi nhỏ bố mẹ lo cho con, giờ đến lượt con."' : 'Con gửi tiền, kèm một câu: "Lần cuối thôi đấy."'),
        },
        {
          t: (cx) => `Bán nốt ${fmtGold(goldOf(cx))} vàng cưới, còn thiếu thì trả dần bằng lương hưu`,
          if: (cx) => goldOf(cx) > 0,
          do: (fx, cx) => (fx.flag('no_xong'), fx.sellGold(), fx.clearDebt(), fx.stat('tam', -2), lv(fx, cx, 2)),
        },
        {
          t: 'Thắt lưng buộc bụng, lương hưu trả dần',
          do: (fx, cx) => (fx.flag('no_xong'), fx.clearDebt(), fx.stat('tam', -8), fx.stat('khoe', -3), lv(fx, cx, cx.s.married ? 2 : 0)),
          note: () => 'Mười năm không mua cái áo mới. Năm bảy mươi tuổi thì trả xong đồng cuối cùng.',
        },
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

/* =========================================================
   NGÃ RẼ SAU CƯỚI: mua nhà hay mua xe, vay vốn làm ăn, thuê nhà, đẻ mấy đứa.
   Mỗi lựa chọn mở một nhánh riêng, vài năm sau rẽ tiếp thành nhánh mới.
   ========================================================= */
type Branch = { id: string; due: (x: Ctx) => boolean; scene: (x: Ctx, base: Pick<Scene, 'id' | 'age' | 'chapter' | 'next'>) => Scene };
/** tuổi lúc cờ được cắm (cờ dạng ten_<tuổi>) */
const since = (x: Ctx, pre: string) => {
  const f = x.s.flags.find((g) => g.startsWith(pre) && /\d+$/.test(g));
  return f ? x.age - Number(f.slice(pre.length)) : -1;
};
/** tiền trả trước khi mua nhà trả góp: thành phố lớn đắt gấp đôi tỉnh */
const downOf = (x: Ctx) => priceAt(x.f.province === 'Hà Nội' || x.f.province === 'TP. Hồ Chí Minh' ? 500_000_000 : 200_000_000, x.year);
const roll = (x: Ctx, k: string) => pick(x, k, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const who = (x: Ctx) => (x.s.partner ?? null) as ReturnType<NonNullable<Scene['who']>>;

/** chữ "nhà nội"/"nhà ngoại" theo giới của mình */
const inLaws = (x: Ctx) => (x.c.gender === 'f' ? 'nhà chồng' : 'bố mẹ');
const sinh = (fx: Fx, x: Ctx, n: number) => (fx.kids(n), fx.rel('con', n === 1 ? 55 : 6), fx.cash(-U(x) * 2), fx.stat('khoe', -2), lv(fx, x, 5));

const BRANCHES: Branch[] = [
  {
    // năm đầu sau cưới: ở đâu
    id: 'br_o',
    due: (x) => x.s.married && ym(x) >= 1 && ym(x) <= 3 && !x.has('br_o') && !x.has('ms_nha'),
    scene: (x, base) => ({
      ...base,
      title: (cx) => (cx.year < 2005 && cx.c.gender === 'f' ? 'Về làm dâu' : 'Năm đầu chung một nhà'),
      who,
      bg: () => ({ place: 'nha', time: 'dusk' }),
      text: (cx) => [
        cx.year < 2005
          ? `Cưới xong, theo lệ, hai vợ chồng về ở chung với ${inLaws(cx)}. Ba thế hệ dưới một mái nhà, mâm cơm nào cũng phải đợi ông bà ngồi trước.`
          : cx.f.urban
            ? `Một năm ở tạm nhà ${inLaws(cx)}, đi đâu về muộn cũng có người hỏi. Giá thuê một căn hộ nhỏ ở ${cx.f.province} bằng nửa tháng lương.`
            : `Một năm ở chung với ${inLaws(cx)}. Bố mẹ bảo: "Nhà rộng thế này, ra ngoài làm gì cho tốn."`,
        `${sp(cx)} nhìn ${cx.me}, chờ.`,
      ],
      choices: [
        { t: (cx) => (cx.year < 2005 ? 'Chiều lòng ông bà, ở chung' : 'Ở chung, để dành tiền'), do: (fx, cx) => (fx.flag('br_o'), fx.flag('o_chung'), fx.rel('bome', 10), fx.cash(U(cx) * 3), fx.stat('tam', -4)), note: () => '🦋 Ở chung thì để dành được. Mà chuyện trong nhà cũng nhiều hơn.' },
        { t: (cx) => (cx.year < 2005 ? 'Xin ra ở riêng (cả họ xì xào)' : 'Thuê nhà ra ở riêng'), do: (fx, cx) => (fx.flag('br_o'), fx.flag(`thue_${cx.age}`), fx.rel('bome', -6), fx.cash(-U(cx) * 2), lv(fx, cx, 8)), note: () => '🦋 Tự do. Đầu tháng nào cũng có một khoản tiền nhà.' },
        { t: 'Dựng gian nhà nhỏ cạnh nhà bố mẹ', if: (cx) => !cx.f.urban, do: (fx, cx) => (fx.flag('br_o'), fx.flag('o_chung'), fx.flag('o_que'), fx.rel('bome', 6), fx.cash(-U(cx) * 3), lv(fx, cx, 4)) },
      ],
    }),
  },
  {
    // chuyện con cái: một năm sau cưới, ở đâu thì nói chuyện ở đấy
    id: 'br_con',
    due: (x) => x.s.married && ym(x) >= 1 && ym(x) <= 8 && (x.has('br_o') || x.has('ms_nha')) && !x.has('br_con') && !x.s.kids && x.age <= 44 && !x.s.path.some((p) => p.scene === 'm33_con'),
    scene: (x, base) => ({
      ...base,
      title: 'Chuyện con cái',
      who,
      bg: () => ({ place: 'nha', time: 'dusk' }),
      text: (cx) => [
        homeOf(cx) === 'chung'
          ? `Ở chung với ${inLaws(cx)}, bữa cơm nào ${cx.mom === 'mẹ' ? 'mẹ' : 'bà'} cũng gắp cho ${cx.c.gender === 'f' ? cx.me : sp(cx)} miếng ngon nhất, rồi hỏi bóng gió: "Bao giờ cho mẹ bế cháu?"`
          : homeOf(cx) === 'thue'
            ? `Phòng thuê hai mươi mét vuông, kê thêm cái nôi là hết chỗ đi. Nhưng tối nào ${sp(cx)} cũng xem video em bé.`
            : `Nhà mới còn thơm mùi sơn, căn phòng nhỏ vẫn để trống.`,
        cash(cx) > 0 ? `Tiền để dành: ${fmtVND(cash(cx))}. Sinh một đứa, mỗi năm tốn thêm chừng ${fmtVND(U(cx) * 1.6)}.` : `Tiền thì chưa để dành được. Sinh một đứa, mỗi năm tốn thêm chừng ${fmtVND(U(cx) * 1.6)}.`,
      ],
      choices: [
        { t: 'Sinh con ngay', do: (fx, cx) => (fx.flag('br_con'), sinh(fx, cx, 1)), note: (cx) => `🦋 Con chào đời năm ${cx.year}. Từ giờ mọi tính toán đều có thêm một người.`, sys: 'Đinh! Mở khóa danh hiệu "Phụ huynh mất ngủ".' },
        { t: 'Sinh hai đứa, đứa thứ hai cách vài năm', do: (fx, cx) => (fx.flag('br_con'), fx.flag('con_ke2'), sinh(fx, cx, 1)), note: () => '🦋 Đứa đầu ra đời. Vài năm nữa sẽ có em.' },
        { t: (cx) => (cx.f.urban ? 'Ba đứa, nhà đông mới vui' : 'Ba đứa, ở quê có đất có vườn, lo gì'), do: (fx, cx) => (fx.flag('br_con'), fx.flag('con_ke3'), sinh(fx, cx, 1)), note: () => '🦋 Mới đứa đầu. Còn hai đứa nữa đang "xếp hàng".' },
        { t: 'Đợi mua được nhà rồi mới sinh', if: (cx) => !cx.has('ms_nha'), do: (fx, cx) => (fx.flag('br_con'), fx.flag(`con_doinha_${cx.age}`), fx.stat('tien', 3)), note: () => '🦋 Có nhà thì có con. Còn bao giờ có nhà thì chưa biết.' },
        { t: 'Chưa muốn có con', do: (fx, cx) => (fx.flag('br_con'), fx.flag(`con_chua_${cx.age}`), fx.stat('tam', 4), lv(fx, cx, -4)) },
      ],
    }),
  },
  {
    // đã hẹn "có nhà rồi sinh" hoặc "chưa muốn": vài năm sau hỏi lại
    id: 'br_con2',
    due: (x) =>
      x.s.married && !x.s.kids && !x.has('br_con2') && x.age <= 42 &&
      ((since(x, 'con_doinha_') >= 1 && (x.has('ms_nha') || since(x, 'con_doinha_') >= 4)) || since(x, 'con_chua_') >= 4),
    scene: (x, base) => ({
      ...base,
      title: (cx) => (cx.has('ms_nha') && since(cx, 'con_doinha_') >= 0 ? 'Căn phòng để trống' : 'Hỏi lại chuyện cũ'),
      who,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) =>
        since(cx, 'con_doinha_') >= 0
          ? cx.has('ms_nha')
            ? [`Dọn vào nhà mới được ít lâu. Căn phòng nhỏ cạnh phòng ngủ vẫn để trống.`, `${sp(cx)} đứng ở cửa phòng: "Hồi ấy mình hẹn có nhà rồi mới sinh. Giờ có nhà rồi đấy."`]
            : [`Hẹn "có nhà rồi mới sinh" đã ${since(cx, 'con_doinha_')} năm. Nhà vẫn chưa mua được, giá thì mỗi năm một cao.`, `${sp(cx)} nói nhỏ: "Nhà thì đợi được. Tuổi thì không."`]
          : [`${since(cx, 'con_chua_')} năm sau câu "chưa muốn có con", bạn bè cùng lứa con đã vào lớp Một.`, `${sp(cx)} hỏi lại, lần này nghiêm túc: "Còn bây giờ thì sao?"`],
      choices: [
        { t: 'Sinh con thôi', do: (fx, cx) => (fx.flag('br_con2'), sinh(fx, cx, 1)), note: (cx) => `🦋 Con chào đời năm ${cx.year}, khi ${cx.me} ${cx.age} tuổi.` },
        { t: 'Thêm vài năm nữa', do: (fx, cx) => (fx.flag('br_con2'), lv(fx, cx, -6)), note: () => '🦋 Vài năm nữa, câu hỏi này sẽ khó trả lời hơn.' },
      ],
    }),
  },
  {
    // đứa thứ hai / thứ ba theo kế hoạch: ai trông con
    id: 'br_dua2',
    due: (x) => x.s.kids === 1 && (x.has('con_ke2') || x.has('con_ke3')) && youngest(x) >= 2 && !x.has('br_dua2') && x.age <= 45,
    scene: (x, base) => ({
      ...base,
      title: 'Đứa thứ hai chào đời',
      who,
      bg: () => ({ place: 'nha', time: 'day' }),
      text: (cx) => [
        `Đứa thứ hai chào đời, đúng như hai vợ chồng tính từ hồi mới cưới. Đứa lớn ${youngest(cx)} tuổi, đứng nhìn em qua thành nôi.`,
        `Hai đứa nhỏ, hai người đi làm. Ai trông con?`,
      ],
      choices: [
        { t: (cx) => `Nhờ ${cx.c.gender === 'f' ? 'mẹ chồng' : 'mẹ vợ'} lên trông`, if: (cx) => cx.f.parents !== 'Không còn bố mẹ', do: (fx, cx) => (fx.flag('br_dua2'), fx.flag('ba_trong'), fx.kids(2), fx.rel('bome', 6), fx.stat('tam', -3), lv(fx, cx, 2)), note: () => '🦋 Có bà trông thì yên tâm đi làm. Nhưng hai thế hệ, hai cách nuôi con.' },
        { t: (cx) => `Gửi nhà trẻ tư (${fmtVND(U(cx) * 2)} một năm)`, do: (fx, cx) => (fx.flag('br_dua2'), fx.kids(2), fx.cash(-U(cx) * 2), fx.rel('con', 4)) },
        { t: (cx) => `${cx.c.gender === 'f' ? cx.me : sp(cx)} nghỉ việc ở nhà trông con`, do: (fx, cx) => (fx.flag('br_dua2'), fx.flag('nghi_trongcon'), fx.kids(2), fx.stat('tien', -8), fx.rel('con', 8), lv(fx, cx, cx.c.gender === 'f' ? 4 : 6)), note: () => '🦋 Nhà còn một nguồn lương. Mấy năm tới phải tính từng đồng.' },
      ],
    }),
  },
  {
    id: 'br_dua3',
    due: (x) => x.s.kids === 2 && x.has('con_ke3') && youngest(x) >= 2 && !x.has('br_dua3') && x.age <= 46,
    scene: (x, base) => ({
      ...base,
      title: 'Đứa thứ ba',
      who,
      bg: () => ({ place: 'nha', time: 'day' }),
      text: (cx) => [`Đứa thứ ba chào đời. Ba đứa, ba cái tên ${cx.year < 2000 ? 'ông nội đặt' : 'cả nhà cãi nhau cả tháng mới chọn'}. ${homeOf(cx) === 'thue' ? 'Căn nhà thuê' : homeOf(cx) === 'chung' ? 'Nhà ông bà' : 'Nhà'} bỗng chật hẳn.`],
      choices: [
        { t: 'Cả nhà xoay xở, chen nhau mà vui', do: (fx, cx) => (fx.flag('br_dua3'), fx.kids(3), fx.stat('khoe', -4), lv(fx, cx, 4)) },
        { t: (cx) => (goldOf(cx) > 0 ? `Bán ${fmtGold(goldOf(cx))} vàng cưới, cơi nới thêm một phòng` : 'Vay thêm, cơi nới thêm một phòng'), do: (fx, cx) => (fx.flag('br_dua3'), fx.kids(3), goldOf(cx) > 0 ? fx.sellGold() : 0, fx.cash(-U(cx) * 5), fx.stat('tam', 4)) },
      ],
    }),
  },
  {
    // khoản tiền lớn đầu tiên sau cưới
    id: 'br_mua',
    due: (x) => x.s.married && ym(x) >= 2 && x.age >= 25 && x.has('br_con') && !x.has('br_mua') && !x.has('ms_nha'),
    scene: (x, base) => ({
      ...base,
      title: 'Khoản để dành đầu tiên',
      who,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [
        `Cưới được ${ym(cx)} năm, hai vợ chồng ngồi tính sổ. ${cash(cx) > 0 ? `Trong tài khoản có ${fmtVND(cash(cx))}` : 'Tiền để dành chưa được bao nhiêu'}${goldOf(cx) > 0 ? `, trong tủ còn ${goldText(cx)}.` : '.'}`,
        homeOf(cx) === 'chung' ? `Ở chung với ${inLaws(cx)} đã ${ym(cx)} năm.${cx.s.kids ? ' Con lớn dần, phòng thì vẫn một.' : ''}` : homeOf(cx) === 'thue' ? `Tiền thuê nhà ${ym(cx)} năm cộng lại đủ mua một chiếc xe.${cx.s.kids ? ' Con thì sắp đến tuổi đi học.' : ''}` : '',
        since(cx, 'con_doinha_') >= 0 ? `🦋 Hồi ấy hai người hẹn "có nhà rồi mới sinh con".` : '',
        cx.f.urban ? `Giá nhà ${cx.f.province} mỗi năm một cao. Bạn bè thì đứa mua xe, đứa mở quán.` : `Bố mẹ bảo: "Đất nhà còn một mảnh, về đây mà xây." Bạn bè trên phố thì rủ góp vốn làm ăn.`,
        `${sp(cx)} hỏi: "Mình làm gì với số tiền này?"`,
      ],
      choices: [
        {
          t: (cx) => `Mua căn hộ trả góp hai mươi năm (trả trước ${fmtVND(downOf(cx))}${cash(cx) < downOf(cx) ? `, bán cả ${fmtGold(goldOf(cx))} vàng cưới góp vào` : ''})`,
          if: (cx) => (cx.f.urban || cx.has('daihoc')) && cash(cx) + goldVND(cx) >= downOf(cx),
          do: (fx, cx) => (fx.flag('br_mua'), cash(cx) < downOf(cx) && fx.sellGold(), fx.flag(`nha_gop_${cx.age}`), fx.flag('ms_nha'), fx.flag('nha_chung'), fx.cash(-downOf(cx)), lv(fx, cx, 6), fx.stat('tam', 4)),
          note: (cx) => `🦋 Có nhà rồi. Hai mươi năm tới, đến năm ${cx.year + 20}, tháng nào cũng có một khoản trả góp.`,
        },
        {
          t: (cx) => `Về quê xây nhà trên đất bố mẹ cho (${fmtVND(priceAt(250_000_000, cx.year))}, thiếu thì vay)`,
          if: (cx) => !cx.f.urban,
          do: (fx, cx) => (fx.flag('br_mua'), fx.flag('nha_xay'), fx.flag('ms_nha'), fx.flag('o_que'), fx.cash(-priceAt(250_000_000, cx.year)), fx.rel('bome', 10), lv(fx, cx, cx.c.gender === 'f' ? -4 : 4)),
          note: (cx) => (cx.c.gender === 'f' ? '🦋 Ở gần nhà chồng, chuyện mẹ chồng nàng dâu sẽ khác.' : '🦋 Ở gần bố mẹ, nhưng việc làm thì xa.'),
        },
        {
          t: (cx) => `Mua ô tô cũ (${fmtVND(priceAt(250_000_000, cx.year))})`,
          if: (cx) => cx.year >= 2005 && !cx.has('ms_xe') && cash(cx) >= priceAt(250_000_000, cx.year),
          do: (fx, cx) => (fx.flag('br_mua'), fx.flag(`oto_${cx.age}`), fx.flag('oto'), fx.flag('ms_xe'), fx.cash(-priceAt(250_000_000, cx.year)), fx.stat('duyen', 4), lv(fx, cx, 4)),
          note: () => '🦋 Có xe rồi thì đi đâu cũng tiện. Mà tiền xăng, tiền gửi xe cũng đều tay.',
        },
        {
          t: (cx) => `Vay thêm, mở ${cx.year >= 2015 ? 'cửa hàng online kiêm kho hàng' : cx.year >= 2000 ? 'cửa hàng' : 'sạp hàng ở chợ'} (${fmtVND(priceAt(100_000_000, cx.year))} vốn)`,
          do: (fx, cx) => (fx.flag('br_mua'), fx.flag(`kd_${cx.age}`), fx.cash(-priceAt(100_000_000, cx.year)), fx.stat('noi', 6)),
          note: () => '🦋 Làm chủ thì không ai sai bảo. Nhưng cũng không ai trả lương.',
        },
        {
          t: (cx) => (homeOf(cx) === 'chung' ? `Ở chung với ${inLaws(cx)} tiếp, gửi tiết kiệm` : 'Cứ thuê nhà, gửi tiết kiệm cho chắc'),
          do: (fx, cx) => (fx.flag('br_mua'), homeOf(cx) === 'chung' ? fx.rel('bome', 4) : fx.flag(`thue_${cx.age}`), fx.cash(U(cx) * 2), lv(fx, cx, -2)),
        },
      ],
    }),
  },
  {
    // trả góp nhà: lãi suất tăng
    id: 'br_laisuat',
    due: (x) => since(x, 'nha_gop_') >= 4 && !x.has('br_laisuat'),
    scene: (x, base) => ({
      ...base,
      title: 'Lãi suất thả nổi',
      who,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [`Hết ưu đãi, lãi vay mua nhà nhảy lên gần gấp đôi. Mỗi tháng trả góp ngốn quá nửa lương hai vợ chồng.${cx.s.kids ? ' Con lại sắp vào học.' : ''}`],
      choices: [
        { t: 'Cả hai làm thêm buổi tối, gồng tiếp', do: (fx, cx) => (fx.flag('br_laisuat'), fx.cash(U(cx) * 6), fx.stat('khoe', -6), lv(fx, cx, 4)), note: () => 'Ba năm không đi đâu chơi. Nhưng căn nhà vẫn là của mình.' },
        { t: 'Cho thuê bớt một phòng', do: (fx, cx) => (fx.flag('br_laisuat'), fx.cash(U(cx) * 4), lv(fx, cx, -4), fx.stat('tam', -3)) },
        {
          t: 'Bán nhà, quay lại đi thuê',
          do: (fx, cx) => {
            fx.flag('br_laisuat');
            fx.unflag('ms_nha');
            for (const g of cx.s.flags) if (g.startsWith('nha_gop_')) fx.unflag(g);
            fx.flag(`thue_${cx.age}`);
            fx.cash(U(cx) * 14);
            lv(fx, cx, -6);
          },
          note: () => '🦋 Bán xong thì nhẹ nợ. Nhưng lại bắt đầu những năm chuyển trọ.',
        },
      ],
    }),
  },
  {
    // xe nhà: chuyến đi xa, hoặc gánh nặng
    id: 'br_oto',
    due: (x) => since(x, 'oto_') >= 3 && !x.has('br_oto'),
    scene: (x, base) => ({
      ...base,
      title: 'Chiếc xe nhà mình',
      who,
      bg: () => ({ place: 'pho', time: 'dusk' }),
      text: (cx) => [`Xe mua được ba năm. ${cx.s.kids ? 'Con đòi đi biển từ đầu hè.' : `${sp(cx)} bảo lâu lắm rồi hai người chưa đi đâu xa.`} Còn tiền xăng, tiền bảo dưỡng, tiền gửi xe thì tháng nào cũng đều tay.`],
      choices: [
        {
          t: 'Cả nhà lái xe xuyên Việt một tuần',
          do: (fx, cx) => (fx.flag('br_oto'), fx.cash(-U(cx) * 2), lv(fx, cx, 12), cx.s.kids ? fx.rel('con', 10) : fx.stat('tam', 6), pid(cx) && fx.photo({ who: pid(cx)!, place: 'Chuyến xuyên Việt', bg: { place: 'pho', time: 'dusk' }, line: 'Đèo Hải Vân, gió lộng, cả nhà hát sai lời một bài hát cũ.' })),
          note: () => '▣ Một tấm ảnh vừa vào album kỷ niệm.',
        },
        { t: 'Bán xe, đi xe máy cho nhẹ', do: (fx, cx) => (fx.flag('br_oto'), fx.unflag('oto'), fx.unflag('ms_xe'), fx.cash(U(cx) * 7), fx.stat('tam', 2)) },
        { t: 'Chạy xe công nghệ cuối tuần cho xe tự nuôi xe', if: (cx) => cx.year >= 2016, do: (fx, cx) => (fx.flag('br_oto'), fx.cash(U(cx) * 5), fx.stat('khoe', -3), lv(fx, cx, -3)) },
      ],
    }),
  },
  {
    // làm ăn năm thứ ba
    id: 'br_kd',
    due: (x) => since(x, 'kd_') >= 3 && !x.has('br_kd'),
    scene: (x, base) => {
      const good = x.s.stats.tien + x.s.stats.hoc + roll(x, 'kd') * 8 >= 110;
      return {
        ...base,
        title: good ? 'Làm ăn khấm khá' : 'Cửa hàng ế ẩm',
        who,
        bg: () => ({ place: 'quan', time: 'day' }),
        text: (cx) => [
          good ? `Năm thứ ba, cửa hàng có khách quen, tháng nào cũng có lãi. Có người gợi ý vay thêm mở chi nhánh thứ hai.` : `Năm thứ ba, cửa hàng vẫn lỗ. Tiền vay ngân hàng đến hạn, ${sp(cx)} bắt đầu mất ngủ.`,
        ],
        choices: good
          ? [
              { t: 'Vay thêm, mở chi nhánh thứ hai', do: (fx, cx) => (fx.flag('br_kd'), fx.flag(`kd2_${cx.age}`), fx.cash(-U(cx) * 25), fx.stat('noi', 6)), note: () => '🦋 Lớn hơn thì lãi to hơn. Lỗ cũng to hơn.' },
              { t: 'Giữ nhỏ thôi, chắc ăn', do: (fx, cx) => (fx.flag('br_kd'), fx.cash(U(cx) * 12), lv(fx, cx, 6)) },
              { t: 'Bán lại cửa hàng được giá, nghỉ ngơi', do: (fx, cx) => (fx.flag('br_kd'), fx.cash(U(cx) * 30), fx.stat('tam', 6)) },
            ]
          : [
              { t: 'Đóng cửa, cắt lỗ, đi làm thuê lại', do: (fx, cx) => (fx.flag('br_kd'), fx.cash(-U(cx) * 6), fx.stat('tam', -4), fx.stat('hoc', 4)) },
              { t: 'Vay tiếp, gồng thêm', do: (fx, cx) => (fx.flag('br_kd'), roll(cx, 'kd2') >= 6 ? (fx.cash(U(cx) * 20), fx.say('Năm sau thị trường quay lại. Gồng được thì thắng.')) : (fx.cash(-U(cx) * 30), fx.stat('tam', -10), fx.say('Gồng thêm một năm, nợ gấp đôi.'))) },
              { t: (cx) => `Bán ${goldText(cx)} để cứu cửa hàng`, if: (cx) => cx.s.married && goldOf(cx) > 0, do: (fx, cx) => (fx.flag('br_kd'), fx.sellGold(), lv(fx, cx, x.s.stats.tam >= 45 ? 6 : -10)), note: (cx) => `${sp(cx)} tháo chiếc nhẫn cưới ra đặt vào hộp cuối cùng: "Cái này thì giữ lại."` },
            ],
      };
    },
  },
  {
    // chi nhánh thứ hai: giàu to hay vỡ to
    id: 'br_kd2',
    due: (x) => since(x, 'kd2_') >= 3 && !x.has('br_kd2'),
    scene: (x, base) => {
      const win = roll(x, 'kd3') + x.s.stats.tien / 20 >= 7;
      return {
        ...base,
        title: win ? 'Chuỗi cửa hàng' : 'Vỡ nợ chi nhánh',
        who,
        bg: () => ({ place: 'pho', time: 'day' }),
        text: () => [win ? 'Hai cửa hàng thành năm. Báo địa phương viết bài về "doanh nhân trẻ". Họ hàng bắt đầu gọi điện nhờ vả.' : 'Chi nhánh mới vắng khách, kéo sập luôn cửa hàng đầu. Nhà cung cấp kéo đến đòi nợ.'],
        choices: win
          ? [
              { t: 'Mua nhà to, đón bố mẹ lên ở cùng', do: (fx, cx) => (fx.flag('br_kd2'), fx.cash(U(cx) * 40), fx.flag('ms_nha'), fx.rel('bome', 12)) },
              { t: 'Giữ tiền, chia lãi cho nhân viên', do: (fx, cx) => (fx.flag('br_kd2'), fx.cash(U(cx) * 60), fx.stat('tinh', 6)) },
              { t: 'Ăn mừng, đổi xe sang, sống như người giàu', do: (fx, cx) => (fx.flag('br_kd2'), fx.cash(U(cx) * 30), fx.stat('noi', 6), lv(fx, cx, -4), fx.flag('giau_khoe')), note: () => '🦋 Tiền nhiều thì người tìm đến cũng nhiều.' },
            ]
          : [
              { t: 'Bán hết, trả nợ, làm lại từ con số không', do: (fx, cx) => (fx.flag('br_kd2'), fx.cash(-U(cx) * 20), fx.stat('tam', -8)) },
              { t: 'Vay nóng bên ngoài để cứu', do: (fx, cx) => (fx.flag('br_kd2'), fx.cash(-U(cx) * 50), fx.stat('tam', -12)), note: () => '🦋 Lãi vay nóng không ngủ bao giờ.' },
            ],
      };
    },
  },
  {
    // đi thuê: chủ nhà lấy lại nhà
    id: 'br_thue',
    due: (x) => since(x, 'thue_') >= 4 && !x.has('br_thue') && !x.has('ms_nha'),
    scene: (x, base) => ({
      ...base,
      title: 'Chủ nhà lấy lại nhà',
      who,
      bg: () => ({ place: 'pho', time: 'day' }),
      text: (cx) => [`Chủ nhà báo trước một tháng: con trai họ cưới vợ, cần lại căn nhà. Lại một lần chuyển trọ${cx.s.kids ? ', con lại phải đổi trường' : ''}.`],
      choices: [
        { t: (cx) => `Dồn hết tiền, mua căn nhỏ ở ngoại ô trả góp (trả trước ${fmtVND(downOf(cx) / 2)})`, if: (cx) => cash(cx) >= downOf(cx) / 2, do: (fx, cx) => (fx.flag('br_thue'), fx.flag(`nha_gop_${cx.age}`), fx.flag('ms_nha'), fx.cash(-downOf(cx) / 2), lv(fx, cx, 6)) },
        { t: 'Chuyển ra ngoại thành, rẻ hơn mà xa hơn', do: (fx, cx) => (fx.flag('br_thue'), fx.cash(U(cx) * 2), fx.stat('khoe', -3)) },
        { t: (cx) => (cx.f.urban ? 'Thôi, cả nhà về quê' : 'Về quê, xây nhà trên đất bố mẹ'), do: (fx, cx) => (fx.flag('br_thue'), fx.flag('o_que'), fx.flag('ms_nha'), fx.cash(-U(cx) * 6), fx.rel('bome', 10), fx.stat('tam', 4)) },
      ],
    }),
  },
  {
    // một con: có sinh thêm không
    id: 'br_them',
    due: (x) => x.s.married && x.s.kids === 1 && !x.has('con_ke2') && !x.has('con_ke3') && eldest(x) >= 5 && eldest(x) <= 9 && x.age <= 42 && !x.has('br_them'),
    scene: (x, base) => ({
      ...base,
      title: 'Thêm một đứa nữa?',
      who,
      bg: () => ({ place: 'nha', time: 'dusk' }),
      text: (cx) => [`Con đầu đã ${eldest(cx)} tuổi${eldest(cx) >= 6 ? ', đi học lớp ' + (eldest(cx) - 5) : ''}. ${cx.year < 2005 ? 'Ông bà giục: "Sinh thêm đứa nữa cho có anh có em."' : `Đứa nhỏ hỏi: "Sao bạn con có em mà con không có?"`} ${sp(cx)} nhìn ${cx.me}, chờ.`],
      choices: [
        { t: 'Sinh thêm một đứa', do: (fx, cx) => (fx.flag('br_them'), fx.kids(2), fx.rel('con', 6), fx.stat('khoe', -3), lv(fx, cx, 6)), note: () => '🦋 Nhà có hai đứa, chuyện cũng gấp đôi.' },
        { t: 'Một là đủ, dồn sức cho con', do: (fx, cx) => (fx.flag('br_them'), fx.rel('con', 4), lv(fx, cx, -2)) },
      ],
    }),
  },
  {
    // chưa có con: chọn đường nào
    id: 'br_khongcon',
    due: (x) => x.s.married && !x.s.kids && x.has('br_con') && (x.age >= 37 || (x.has('br_con2') && since(x, 'con_chua_') + since(x, 'con_doinha_') >= 6)) && x.age <= 46 && !x.has('br_khongcon'),
    scene: (x, base) => ({
      ...base,
      title: 'Nhà chỉ có hai người',
      who,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [
        `${cx.age} tuổi, nhà vẫn chỉ có hai người.${since(cx, 'con_doinha_') >= 0 ? ' Hồi ấy hẹn có nhà rồi mới sinh, rồi cứ lần lữa mãi.' : since(cx, 'con_chua_') >= 0 ? ` Năm ${cx.year - since(cx, 'con_chua_')}, hai người bảo "chưa muốn". Giờ thì muốn, mà mãi chưa có.` : ''}`,
        `Họ hàng hỏi mãi, ${cx.c.gender === 'f' ? 'mẹ chồng' : 'mẹ vợ'} thì đi chùa cầu tự. ${sp(cx)} hỏi nhỏ: "Mình có muốn thật không?"`,
      ],
      choices: [
        {
          t: (cx) => `Đi làm thụ tinh nhân tạo (${fmtVND(U(cx) * 15)})`,
          if: (cx) => cx.year >= 2000,
          do: (fx, cx) => {
            fx.flag('br_khongcon');
            fx.cash(-U(cx) * 15);
            if (roll(cx, 'ivf') >= 4) (fx.kids(1), fx.rel('con', 60), lv(fx, cx, 10), fx.say('Lần thứ hai thì có tin vui. Hai người ôm nhau khóc ở hành lang bệnh viện.'));
            else (lv(fx, cx, 4), fx.stat('tam', -8), fx.say('Ba lần, ba lần không được. Nhưng hai người vẫn nắm tay nhau về.'));
          },
        },
        { t: 'Nhận một đứa trẻ về nuôi', do: (fx, cx) => (fx.flag('br_khongcon'), fx.flag('connuoi'), fx.kids(1), fx.rel('con', 50), lv(fx, cx, 8)), note: () => '🦋 Không cùng máu mủ, nhưng cùng một mái nhà.' },
        { t: 'Sống hai vợ chồng son, đi khắp nơi', do: (fx, cx) => (fx.flag('br_khongcon'), fx.flag('vcson'), lv(fx, cx, 8), fx.stat('tam', 8)), note: () => '🦋 Năm nào cũng một chuyến đi xa, chỉ hai người.' },
      ],
    }),
  },
  {
    // hai đứa trở lên: anh em tranh nhau
    id: 'br_anhem',
    due: (x) => (x.s.kids ?? 0) >= 2 && youngest(x) >= 6 && youngest(x) <= 12 && !x.has('br_anhem'),
    scene: (x, base) => ({
      ...base,
      title: 'Hai đứa lại cãi nhau',
      who: () => 'mom',
      bg: () => ({ place: 'nha', time: 'day' }),
      text: (cx) => [`Đứa lớn bảo bố mẹ thiên vị em. Đứa nhỏ khóc vì anh chị giành ${cx.year >= 2012 ? 'cái máy tính bảng' : 'cái tivi'}.${(cx.s.kids ?? 0) >= 3 ? ' Đứa thứ ba thì nhân lúc lộn xộn ăn hết bánh.' : ''}`],
      choices: [
        { t: 'Ngồi nghe từng đứa nói', do: (fx) => (fx.flag('br_anhem'), fx.rel('con', 10), fx.stat('tinh', 4)) },
        { t: 'Phạt cả hai cho công bằng', do: (fx) => (fx.flag('br_anhem'), fx.rel('con', -4), fx.stat('noi', 2)) },
        { t: 'Cho đứa lớn đi học nội trú, đứa nhỏ ở nhà', if: (cx) => eldest(cx) >= 11, do: (fx, cx) => (fx.flag('br_anhem'), fx.cash(-U(cx) * 6), fx.rel('con', 2)) },
      ],
    }),
  },
  {
    // ba đứa: học phí
    id: 'br_bacon',
    due: (x) => (x.s.kids ?? 0) >= 3 && youngest(x) >= 6 && eldest(x) <= 18 && !x.has('br_bacon'),
    scene: (x, base) => ({
      ...base,
      title: 'Học phí ba đứa',
      who,
      bg: () => ({ place: 'nha', time: 'night' }),
      text: (cx) => [`Đầu năm học, ba bộ sách, ba suất học thêm, ba bộ đồng phục. Cộng lại hết ${fmtVND(U(cx) * 6)}.`],
      choices: [
        { t: 'Vay thêm cho con học đủ', do: (fx, cx) => (fx.flag('br_bacon'), fx.cash(-U(cx) * 6), fx.rel('con', 8)) },
        { t: 'Bớt học thêm, tự kèm con buổi tối', do: (fx) => (fx.flag('br_bacon'), fx.stat('khoe', -3), fx.rel('con', 6)) },
        { t: 'Đứa lớn nghỉ học sớm, đi làm phụ', do: (fx) => (fx.flag('br_bacon'), fx.rel('con', -12), fx.stat('tien', 4)), note: () => '🦋 Đứa lớn sẽ nhớ chuyện này cả đời.' },
      ],
    }),
  },
];

/** ngã rẽ sau cưới đến hạn ở tuổi này */
export function branchAt(age: number, x: Ctx, next: string): Scene | null {
  if (age < 22 || age > 60) return null;
  const b = BRANCHES.find((r) => r.due(x));
  if (!b) return null;
  const sc = b.scene(x, { id: `br@${age}`, age, chapter: age < 30 ? 'Tuổi trẻ' : 'Lập gia đình', next });
  return { ...sc, text: (cx) => sc.text(cx).filter(Boolean) };
}
