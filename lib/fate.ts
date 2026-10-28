/**
 * Số phận: phần random lúc bắt đầu (giới tính, năm sinh, gia cảnh, tên gợi ý, lời thầy bói)
 * và đoạn giới thiệu nhân vật.
 */

import { REAL_UNTIL, placeOf, rollFamily, siblingText, suggestName, type Family, type Gender } from './character';
import { LOVE_IDS, type Story, type StoryCore } from './story';

export interface Fate {
  gender: Gender;
  birthYear: number;
  name: string;
  family: Family;
  fate: string;
  bestie: string;
}

/** Lời thầy bói. check: cuối đời xem lời phán có ứng nghiệm không */
export const PROPHECIES: { id: string; text: string; check: (s: StoryCore) => boolean }[] = [
  { id: 'thanhmai', text: 'Duyên nằm ngay sau nhà. Người cùng lớn lên sẽ là người cùng già đi.', check: (s) => s.married && s.partner === 'khoi' },
  { id: 'nganh', text: 'Kẻ ngông nhất lại là người chung tình nhất. Đừng sợ người ta nói.', check: (s) => s.married && s.partner === 'long' },
  { id: 'hoc', text: 'Đèn sách thành danh, nhân duyên đến từ chốn học đường.', check: (s) => s.married && s.partner === 'minh' },
  { id: 'daohoa', text: 'Số đào hoa, ba lần đò mới cập bến.', check: (s) => Object.values(s.love).filter((v) => v >= 40).length >= 3 || s.mids.length >= 2 },
  { id: 'muon', text: 'Duyên muộn, ngoài ba mươi mới yên bề gia thất.', check: (s) => s.married && (s.marriedAge ?? 0) >= 28 },
  { id: 'codoc', text: 'Số cô độc, yêu nhiều mà chẳng giữ được ai.', check: (s) => !s.married },
];

const BESTIES: Record<Gender, string[]> = {
  f: ['Hà', 'Trang', 'Mai', 'Quỳnh', 'Hương'],
  m: ['Tùng', 'Hùng', 'Dũng', 'Hiếu', 'Bình'],
};

/** Phần lớn sinh trong 1975-2015 (có thật), khoảng 1/7 rơi vào tương lai */
function rollYear(r: () => number) {
  if (r() < 0.14) return REAL_UNTIL + 1 + Math.floor(r() * 35);
  return 1975 + Math.floor(r() * 41);
}

export function rollFate(r = Math.random): Fate {
  const gender: Gender = r() < 0.5 ? 'f' : 'm';
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const birthYear = rollYear(r);
  return {
    gender,
    birthYear,
    name: suggestName(gender, r),
    family: rollFamily(r, birthYear),
    fate: pick(PROPHECIES).id,
    bestie: pick(BESTIES[gender]),
  };
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Đoạn giới thiệu: sinh ra ở đâu, nhà thế nào, thầy bói phán gì */
export function introOf(f: Fate): string[] {
  const short = f.name.trim().split(/\s+/).pop() || f.name;
  const fam = f.family;
  const where = placeOf(fam).long;
  const wealth = fam.wealth.startsWith('Mồ côi') ? 'không còn bố mẹ, được ông bà nuôi' : `trong một gia đình ${lower(fam.wealth)}`;
  const parents: Record<string, string> = {
    'Hòa thuận, cởi mở': 'Bố mẹ hiền, hiếm khi to tiếng.',
    'Gia trưởng': 'Bố nói một là một, cả nhà không ai dám cãi.',
    'Bố mẹ đi làm xa': 'Bố mẹ đi làm xa, mỗi năm chỉ về dịp Tết.',
    'Bố mẹ ly thân': 'Bố mẹ đã ly thân, mỗi người một nơi.',
    'Bố mẹ hay cãi nhau': 'Bố mẹ cãi nhau như cơm bữa.',
    'Không còn bố mẹ': '',
  };
  const sib = fam.siblings.length ? `Trong nhà có ${siblingText(fam.siblings)}.` : 'Là con một, được cả nhà cưng.';
  const future = f.birthYear > REAL_UNTIL ? ' Đó là một thế giới chưa ai biết trước.' : '';
  const p = PROPHECIES.find((x) => x.id === f.fate)!;
  return [
    `Năm ${f.birthYear}, ${f.name} cất tiếng khóc chào đời ở ${where}, ${wealth}.${future}`,
    [parents[fam.parents], sib].filter(Boolean).join(' '),
    `Đầy tháng, ${fam.parents === 'Không còn bố mẹ' ? 'bà' : 'bà nội'} bế ${short} đi xem bói. Ông thầy cầm bàn tay bé xíu, nhíu mày rồi phán:`,
    `“${p.text}”`,
    `Liệu ${short} có thay đổi được vận mệnh?`,
  ];
}

const START: Record<string, Partial<StoryCore['stats']>> = {
  'Nhà nông': { tien: 15, tinh: 40 },
  'Lao động phổ thông': { tien: 20, noi: 35 },
  'Công chức trung lưu': { tien: 40, hoc: 40 },
  'Tiểu thương': { tien: 45, duyen: 40 },
  'Khá giả': { tien: 60 },
  'Hào môn': { tien: 85, noi: 35 },
  'Mồ côi, ở với ông bà': { tien: 15, tinh: 45 },
};

export function newStory(f: Fate, first: string): Story {
  const stats = { hoc: 30, noi: 30, duyen: 30, tinh: 30, tien: 30, tam: 60, dao: 50, khoe: 72, ...START[f.family.wealth] };
  const p = f.family.parents;
  if (p === 'Gia trưởng') stats.noi += 5;
  if (p === 'Bố mẹ ly thân' || p === 'Bố mẹ hay cãi nhau') stats.tam -= 10;
  const bome = p === 'Hòa thuận, cởi mở' ? 65 : p === 'Gia trưởng' ? 45 : 50;
  return {
    scene: first,
    stats,
    love: Object.fromEntries(LOVE_IDS.map((id) => [id, 0])) as StoryCore['love'],
    rel: { bome, banthan: 40, con: 0 },
    flags: [],
    partner: null,
    married: false,
    marriedAge: null,
    kids: 0,
    loveEnd: null,
    mids: [],
    path: [],
    fate: f.fate,
    bestie: f.bestie,
    met: [],
    pending: null,
    resume: null,
    peak: 0,
    album: [],
    notes: [],
    seed: Math.floor(Math.random() * 1e9),
    hist: [],
  };
}
