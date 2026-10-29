/**
 * Tiền và tình đan vào nhau:
 * - lúc yêu: mỗi người một kiểu tiêu tiền, ai trả hóa đơn, chuyện nhà cửa, chuyện bỏ việc theo đam mê;
 * - cưới: gu tiền bạc có hợp không quyết định cưới xong hạnh phúc hay lệch nhịp;
 * - giàu lên hay trắng tay: những gì đã làm với tiền lúc trước quyết định người ấy ở lại hay bỏ đi.
 */

import { LOVE_IDS, LOVES, type Choice, type Ctx, type Fx, type LoveId, type Scene } from './story';
import { fmtVND, unitOf } from './money';

export type MoneyKind = 'chiase' | 'phong' | 'tinhtoan' | 'mo' | 'giau';
export const MONEY_OF: Record<LoveId, MoneyKind> = {
  khoi: 'chiase',
  long: 'phong',
  minh: 'tinhtoan',
  phong: 'chiase',
  hai: 'mo',
  tuananh: 'giau',
  kai: 'chiase',
  quan: 'giau',
  bao: 'phong',
  duy: 'mo',
  hung: 'giau',
  tai: 'tinhtoan',
};
export const MONEY_LABEL: Record<MoneyKind, string> = {
  chiase: 'sòng phẳng, thích hai người cùng góp',
  phong: 'nay tiêu mai tính, hào phóng với bạn bè',
  tinhtoan: 'tính trước tính sau, ghét tiêu hoang',
  mo: 'coi nhẹ tiền, sợ người tính toán',
  giau: 'quen sống sung túc, hay giành trả',
};

const U = (x: Ctx) => unitOf(x.year, x.age);
const cash = (x: Ctx) => x.s.cash ?? 0;
const inPool = (x: Ctx) => LOVE_IDS.filter((id) => x.has(`pool_${id}`) && !x.has(`${id}_out`));
const topOf = (x: Ctx): LoveId | null => {
  if (x.s.partner && x.s.partner !== 'xemmat') return x.s.partner;
  return inPool(x).sort((a, b) => x.s.love[b] - x.s.love[a])[0] ?? null;
};
const Up = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Hóa đơn hay chuyện tiền lớn của năm (vòng yêu 20-26, chưa cưới) */
export function moneyLoveScene(age: number, next: string): Scene {
  const big = age >= 23 && age % 2 === 1;
  const base = { id: `tm@${age}`, age, chapter: 'Tuổi trẻ', next, who: (x: Ctx) => topOf(x) };
  // hai năm một lần, năm chẵn là hóa đơn, năm lẻ từ 23 là chuyện lớn
  const skip = (x: Ctx) => x.s.married || !topOf(x) || x.s.love[topOf(x)!] < 25 || (!big && age % 2 === 1);

  if (!big) {
    const react: Record<MoneyKind, [number, number, number]> = {
      // [giành trả, chia đôi, để người ấy trả]
      chiase: [2, 8, -6],
      phong: [6, -2, 2],
      tinhtoan: [-2, 6, -8],
      mo: [4, 2, -2],
      giau: [2, -4, 4],
    };
    const say: Record<MoneyKind, [string, string, string]> = {
      chiase: ['"Lần sau để mình trả nhé, cho công bằng."', '"Thế mới phải chứ!" Người ấy cười tít mắt.', 'Người ấy trả, nhưng cả tối hơi im.'],
      phong: ['"Hôm nay vui quá, mai mình bao lại!"', '"Chia đôi à? Lạ ghê." Rồi cũng bật cười.', 'Người ấy trả luôn cả bàn bên cạnh.'],
      tinhtoan: ['"Tiêu thế này thì bao giờ mua được nhà?"', 'Người ấy gật gù, ghi luôn vào sổ chi tiêu.', 'Người ấy trả, rồi về nhà tính lại cả tháng.'],
      mo: ['Người ấy không để ý chuyện ai trả, chỉ nhớ tối nay trăng đẹp.', '"Mình chia thế này hay hơn, không ai nợ ai."', '"Để tớ, tớ vừa bán được một bài."'],
      giau: ['"Ơ, sao không để anh/em trả?" Người ấy hơi ngại.', '"Chia đôi à? Kỳ thế." Không khí chùng xuống.', 'Người ấy trả, nhẹ như không.'],
    };
    const opt = (k: 0 | 1 | 2, t: (x: Ctx) => string): Choice => ({
      t,
      if: k === 0 ? (x) => cash(x) >= U(x) * 0.4 : undefined,
      do: (fx: Fx, x: Ctx) => {
        const id = topOf(x)!;
        const m = MONEY_OF[id];
        fx.flag(`hd_${id}_${k}`);
        if (k === 0) fx.cash(-U(x) * 0.4);
        if (k === 1) fx.cash(-U(x) * 0.2);
        fx.love(id, react[m][k]);
        const line = say[m][k].replace('anh/em', x.xung);
        fx.say(line.startsWith('"') ? `${x.L(id)}: ${line}` : line.replace(/^Người ấy/, x.L(id)));
      },
    });
    return {
      ...base,
      title: 'Hóa đơn',
      bg: () => ({ place: 'quan', time: 'night' }),
      // mỗi người chỉ một lần hóa đơn
      skip: (x) => skip(x) || [0, 1, 2].some((k) => x.has(`hd_${topOf(x)}_${k}`)),
      text: (x) => {
        const id = topOf(x)!;
        return [`Ăn tối xong với ${x.L(id)} ở ${x.year < 2000 ? 'quán phở' : x.year < 2012 ? 'quán lẩu' : 'nhà hàng'}. Tờ hóa đơn ${fmtVND(U(x) * 0.4)} nằm giữa bàn.`, `${Up(x.ay)} vốn ${MONEY_LABEL[MONEY_OF[id]]}.`];
      },
      choices: [opt(0, () => 'Giành trả hết'), opt(1, () => 'Chia đôi'), opt(2, (x) => `Để ${x.L(topOf(x)!)} trả`)],
    };
  }

  // chuyện tiền lớn khi đã thân: nhà cửa, đam mê, quỹ chung
  return {
    ...base,
    title: (x) => {
      const m = MONEY_OF[topOf(x)!];
      return m === 'tinhtoan' || m === 'giau' ? 'Bao giờ có nhà?' : m === 'chiase' ? 'Quỹ chung' : 'Bỏ việc theo đam mê';
    },
    bg: () => ({ place: 'phong', time: 'night' }),
    skip: (x) => skip(x) || x.s.love[topOf(x)!] < 40 || x.has(`tl_${topOf(x)}`),
    text: (x) => {
      const id = topOf(x)!;
      const m = MONEY_OF[id];
      if (m === 'tinhtoan' || m === 'giau')
        return [`${x.L(id)} hỏi thẳng: "Lương ${x.goi} bao nhiêu? Mình định bao giờ mua được nhà?" ${m === 'giau' ? `Nhà ${x.ay} đã có sẵn một căn chung cư chờ ${x.ay} cưới.` : `${Up(x.ay)} đã có cả một file tính toán đến năm 40 tuổi.`}`, `Trong tài khoản ${x.me} đang có ${fmtVND(Math.max(0, cash(x)))}.`];
      if (m === 'chiase') return [`${x.L(id)} đề nghị lập một tài khoản chung: mỗi tháng mỗi người góp một phần, để dành cho đám cưới và căn nhà sau này.`];
      return [`${x.L(id)} muốn nghỉ việc ổn định để ${id === 'hai' ? 'làm album riêng' : id === 'duy' ? 'đi chụp ảnh khắp nước' : 'mở một quán nhỏ của riêng mình'}. "Chắc phải một hai năm không có thu nhập. ${Up(x.goi)} có tin ${x.xung} không?"`];
    },
    choices: [
      {
        t: (x) => {
          const m = MONEY_OF[topOf(x)!];
          return m === 'tinhtoan' || m === 'giau' ? 'Nói thật lương, cùng lập kế hoạch để dành' : m === 'chiase' ? 'Đồng ý, tháng nào cũng góp đều' : `Tin chứ. Mình lo phần ăn ở, cứ làm đi`;
        },
        do: (fx, x) => {
          const id = topOf(x)!;
          const m = MONEY_OF[id];
          fx.flag(`tl_${id}`);
          fx.flag(`tlok_${id}`);
          fx.love(id, 12);
          if (m === 'mo' || m === 'phong') fx.cash(-U(x) * 6);
          if (m === 'chiase') fx.flag('quychung');
        },
        note: (x) => `🦋 ${x.L(topOf(x)!)} sẽ nhớ ${x.me} đã cùng mình tính chuyện tiền thế nào.`,
      },
      {
        t: (x) => {
          const m = MONEY_OF[topOf(x)!];
          return m === 'tinhtoan' || m === 'giau' ? 'Nói khoác lên một chút cho người ấy yên tâm' : m === 'chiase' ? 'Chưa cưới, cứ giữ riêng đã' : 'Khuyên người ấy giữ việc, đam mê làm thêm';
        },
        do: (fx, x) => {
          const id = topOf(x)!;
          const m = MONEY_OF[id];
          fx.flag(`tl_${id}`);
          if (m === 'tinhtoan' || m === 'giau') (fx.flag(`noikhoac_${id}`), fx.love(id, 6));
          else fx.love(id, -6);
        },
        note: (x) => (MONEY_OF[topOf(x)!] === 'tinhtoan' || MONEY_OF[topOf(x)!] === 'giau' ? '🦋 Lời nói khoác về tiền, sớm muộn cũng lộ.' : ''),
      },
      {
        t: (x) => (MONEY_OF[topOf(x)!] === 'mo' || MONEY_OF[topOf(x)!] === 'phong' ? 'Cùng làm thêm buổi tối để đỡ cho người ấy' : 'Chuyển chủ đề, nói chuyện khác'),
        do: (fx, x) => {
          const id = topOf(x)!;
          fx.flag(`tl_${id}`);
          const m = MONEY_OF[id];
          if (m === 'mo' || m === 'phong') (fx.love(id, 8), fx.stat('khoe', -3), fx.flag(`tlok_${id}`));
          else fx.love(id, m === 'giau' ? -2 : -8);
        },
      },
    ],
  };
}

/** gu tiền bạc có hợp nhau không (dùng lúc cưới) */
export function moneyFit(x: Ctx, id: LoveId) {
  const m = MONEY_OF[id];
  if (x.has(`noikhoac_${id}`)) return false;
  if (x.has(`tlok_${id}`)) return true;
  if (m === 'tinhtoan') return cash(x) >= U(x) * 8 || x.has(`hd_${id}_1`);
  if (m === 'giau') return !x.has(`hd_${id}_1`) || cash(x) >= U(x) * 15;
  if (m === 'chiase') return !x.has(`hd_${id}_2`);
  return true;
}

/** Lúc trắng tay: người ấy có ở lại không */
export function staysInRuin(x: Ctx): boolean {
  const id = x.s.partner && x.s.partner !== 'xemmat' ? x.s.partner : null;
  if (!id) return x.s.stats.tam >= 45;
  if (x.has(`noikhoac_${id}`) || x.has('dr_quyden') && !x.has('dr_lotquyden_ok')) return x.s.love[id] >= 75;
  const shared = x.has('quychung') || x.has('dr_nopluong') || x.has(`tlok_${id}`) || x.has('nha_chung');
  const m = MONEY_OF[id];
  const need = (m === 'giau' ? 70 : m === 'tinhtoan' ? 60 : 45) - (shared ? 15 : 0);
  return x.s.love[id] >= need;
}

/** Giàu lên lần đầu: thử lòng người bên cạnh, người cũ, họ hàng */
export function windfallAt(age: number, x: Ctx, next: string): Scene | null {
  if (age < 25 || x.has('gl_done') || cash(x) < U(x) * 80) return null;
  const ex = x.s.met.filter((id) => id !== x.s.partner && x.s.love[id] >= 30).sort((a, b) => x.s.love[b] - x.s.love[a])[0] ?? null;
  const sp = x.s.partner && x.s.partner !== 'xemmat' ? x.L(x.s.partner) : x.s.married ? (x.lg === 'm' ? 'Chồng' : 'Vợ') : null;
  return {
    id: `gl@${age}`,
    age,
    chapter: age < 30 ? 'Tuổi trẻ' : age < 60 ? 'Lập gia đình' : 'Tuổi già',
    title: 'Lần đầu có của',
    bg: () => ({ place: 'nha', time: 'dusk' }),
    who: (cx) => (cx.s.partner ?? ex ?? null) as ReturnType<NonNullable<Scene['who']>>,
    text: (cx) => [
      `Tài khoản lần đầu chạm ${fmtVND(cash(cx))}. ${cx.year < 2005 ? 'Cả xóm đồn ầm lên.' : 'Chưa kịp nói với ai, họ hàng đã biết.'}`,
      ...(ex ? [`Cùng tuần ấy, ${cx.L(ex)} - người cũ - bỗng nhắn hỏi thăm sau bao năm im lặng.`] : []),
      `${cx.bm === 'ông bà' ? 'Ông bà' : 'Bố mẹ'} gọi: "Nhà bác Hai đang khó, con xem giúp được gì không."`,
    ],
    choices: [
      ...(sp
        ? [
            {
              t: `Mua căn nhà, đứng tên cả hai vợ chồng`,
              if: (cx: Ctx) => cx.s.married,
              do: (fx: Fx, cx: Ctx) => (fx.flag('gl_done'), fx.flag('nha_chung'), fx.cash(-U(cx) * 50), cx.s.partner && cx.s.partner !== 'xemmat' ? fx.love(cx.s.partner, 12) : fx.stat('tam', 6)),
              note: () => '🦋 Sổ đỏ có tên hai người. Sau này có chuyện gì, căn nhà ấy vẫn là của chung.',
            },
            {
              t: `Mua nhà, nhưng chỉ đứng tên mình cho chắc`,
              if: (cx: Ctx) => cx.s.married,
              do: (fx: Fx, cx: Ctx) => (fx.flag('gl_done'), fx.flag('nha_rieng'), fx.cash(-U(cx) * 50), cx.s.partner && cx.s.partner !== 'xemmat' ? fx.love(cx.s.partner, -10) : fx.stat('tam', -4)),
              note: () => `${sp} không nói gì, nhưng tối ấy quay mặt vào tường.`,
            },
          ]
        : []),
      ...(ex
        ? [
            {
              t: `Hẹn ${x.L(ex)} đi cà phê`,
              do: (fx: Fx, cx: Ctx) => {
                fx.flag('gl_done');
                fx.love(ex, 8);
                if (cx.s.married) (fx.flag('gl_nguoicu'), cx.s.partner && cx.s.partner !== 'xemmat' && fx.love(cx.s.partner, -8));
                fx.say(cx.s.married ? `Ly cà phê với ${cx.L(ex)} kéo dài ba tiếng. Về nhà, ${sp} hỏi: "Đi đâu mà lâu thế?"` : `${cx.L(ex)} nhìn ${cx.me} rất lâu: "Hồi ấy ${cx.xung} sai rồi." Câu ấy đến muộn mấy năm.`);
              },
            },
          ]
        : []),
      { t: 'Gửi bác Hai một khoản, không cần trả', do: (fx: Fx, cx: Ctx) => (fx.flag('gl_done'), fx.cash(-U(cx) * 10), fx.rel('bome', 10), fx.stat('tinh', 6)) },
      { t: 'Giữ kín, gửi tiết kiệm, sống như cũ', do: (fx: Fx) => (fx.flag('gl_done'), fx.stat('hoc', 4), fx.stat('tam', 2)) },
    ],
    next,
  };
}

export const moneyLabelOf = (id: LoveId) => MONEY_LABEL[MONEY_OF[id]];
void LOVES;
