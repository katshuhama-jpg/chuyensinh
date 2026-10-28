/**
 * Engine cốt truyện nhiều nhánh: mỗi lựa chọn đổi chỉ số, độ thân, cắm cờ;
 * cờ cắm từ bé có thể bung ra nhiều năm sau (hiệu ứng cánh bướm).
 * Nội dung cảnh nằm ở lib/scenes.ts.
 */

import type { Character, Family, Gender, Look } from './character';

export type StatKey = 'hoc' | 'noi' | 'duyen' | 'tinh' | 'tien' | 'tam' | 'dao';
export const STAT_LABEL: Record<StatKey, string> = {
  hoc: 'Học vấn',
  noi: 'Nổi loạn',
  duyen: 'Duyên dáng',
  tinh: 'Tình cảm',
  tien: 'Tài chính',
  tam: 'Tâm trạng',
  dao: 'Vận đào hoa',
};
export const STAT_KEYS = Object.keys(STAT_LABEL) as StatKey[];

export type LoveId = 'khoi' | 'long' | 'minh';
export const LOVE_IDS: LoveId[] = ['khoi', 'long', 'minh'];

/** Người yêu: bản nam gặp khi nhân vật chính là nữ, bản nữ khi là nam */
export const LOVES: Record<LoveId, { m: string; f: string; kind: string; likes: StatKey; likesName: string }> = {
  khoi: { m: 'Khôi', f: 'Thảo', kind: 'Thanh mai trúc mã, nhà bên cạnh', likes: 'tinh', likesName: 'người sống tình cảm, nhớ chuyện cũ' },
  long: { m: 'Long', f: 'Vy', kind: 'Ngoài lạnh trong ấm, sống bụi', likes: 'noi', likesName: 'người dám liều, không sợ bị nói' },
  minh: { m: 'Minh', f: 'Ngọc', kind: 'Học bá lạnh lùng', likes: 'hoc', likesName: 'người học giỏi, thành thật' },
};

export interface Step {
  scene: string;
  age: number;
  title: string;
  choice: string;
}

/** Trạng thái một đời đang chơi */
export interface StoryCore {
  scene: string;
  stats: Record<StatKey, number>;
  love: Record<LoveId, number>;
  /** thân với bố mẹ (hoặc ông bà), bạn thân, con cái */
  rel: { bome: number; banthan: number; con: number };
  flags: string[];
  partner: LoveId | 'xemmat' | null;
  married: boolean;
  marriedAge: number | null;
  kids: number;
  /** kết cục tình yêu chốt lúc cầu hôn hoặc lúc 28 tuổi */
  loveEnd: string | null;
  /** kết cục giữa chừng mở được trong đời này */
  mids: string[];
  path: Step[];
  /** lời thầy bói lúc đầy tháng */
  fate: string;
  /** tên bạn thân (cùng giới với nhân vật) */
  bestie: string;
}

export interface Story extends StoryCore {
  /** ảnh chụp trạng thái trước mỗi lựa chọn, để quay lại ngã rẽ */
  hist: StoryCore[];
}

/** Mọi thứ một cảnh cần để viết chữ */
export interface Ctx {
  c: Character;
  f: Family;
  s: Story;
  /** tên gọi ngắn: chữ cuối của tên */
  me: string;
  age: number;
  year: number;
  /** tên người yêu theo giới */
  L: (id: LoveId) => string;
  /** giới của người yêu */
  lg: Gender;
  /** "anh ấy" / "cô ấy" */
  ay: string;
  /** người yêu xưng (lúc lớn) */
  xung: string;
  /** người yêu gọi nhân vật chính (lúc lớn) */
  goi: string;
  /** "bố mẹ" hoặc "ông bà" nếu mồ côi */
  bm: string;
  /** "mẹ" hoặc "bà" */
  mom: string;
  has: (flag: string) => boolean;
}

export interface Choice {
  t: string | ((x: Ctx) => string);
  /** chỉ hiện khi điều kiện đúng */
  if?: (x: Ctx) => boolean;
  /** thay đổi trạng thái; gọi x... qua hàm tiện ích trong Fx */
  do?: (fx: Fx, x: Ctx) => void;
  /** dòng báo cánh bướm: "Khôi sẽ nhớ chuyện này" */
  note?: string | ((x: Ctx) => string);
  /** Hệ Thống lên tiếng sau khi chọn */
  sys?: string | ((x: Ctx) => string);
  /** cảnh kế tiếp riêng của lựa chọn này */
  to?: string | ((x: Ctx) => string);
  /** cảnh quẹt: lựa chọn này ứng với Match người nào */
  loveId?: LoveId;
}

export interface Scene {
  id: string;
  age: number;
  chapter: string;
  /** ai đứng cạnh nhân vật chính trong cảnh */
  who?: (x: Ctx) => LoveId | 'mom' | 'bestie' | 'he_thong' | 'xemmat' | null;
  kind?: 'talk' | 'chat' | 'swipe';
  title: string | ((x: Ctx) => string);
  text: (x: Ctx) => string[];
  /** cảnh tin nhắn: tin hiện trong khung chat */
  msgs?: (x: Ctx) => { me: boolean; t: string }[];
  /** cảnh chat có đồng hồ: hết giờ thì tính là lựa chọn thứ timeout */
  timer?: number;
  timeout?: number;
  /** cảnh quẹt: các thẻ hồ sơ; thẻ có loveId là người thật, Match thì chọn lựa chọn mang cùng loveId */
  cards?: (x: Ctx) => SwipeCard[];
  /** bài đăng trên Tường hiện trong cảnh */
  post?: (x: Ctx) => Post;
  choices: Choice[];
  next: string | ((x: Ctx) => string);
  /** bỏ qua cảnh này nếu điều kiện đúng */
  skip?: (x: Ctx) => boolean;
}

export interface SwipeCard {
  name: string;
  age: number;
  gender: Gender;
  look: Look;
  where: string;
  bio: string;
  tags?: string[];
  bg?: string;
  /** người thật trong dàn người yêu */
  loveId?: LoveId;
  /** dòng hiện khi Match */
  match?: string;
  /** chuyện xảy ra nếu thích nhầm hồ sơ ảo */
  result?: string;
  score?: number;
  box?: number;
}

export interface Post {
  author: string;
  time: string;
  text: string;
  likes: number;
  comments: { who: string; t: string }[];
  /** ảnh trong bài: ai đứng trong ảnh */
  photo?: LoveId[];
}

/** Thao tác lên trạng thái, dùng trong Choice.do */
export interface Fx {
  stat: (k: StatKey, d: number) => void;
  love: (id: LoveId, d: number) => void;
  rel: (k: keyof StoryCore['rel'], d: number) => void;
  flag: (f: string) => void;
  unflag: (f: string) => void;
  partner: (p: StoryCore['partner']) => void;
  marry: () => void;
  kids: (n: number) => void;
  loveEnd: (id: string) => void;
  /** mở một kết cục giữa chừng */
  mid: (id: string) => void;
  /** báo thêm một dòng sau lựa chọn */
  say: (t: string) => void;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function ctxOf(c: Character, f: Family, s: Story, age: number): Ctx {
  const lg: Gender = c.gender === 'f' ? 'm' : 'f';
  const orphan = f.parents === 'Không còn bố mẹ';
  return {
    c,
    f,
    s,
    me: c.name.trim().split(/\s+/).pop() || c.name,
    age,
    year: c.birthYear + age,
    L: (id) => LOVES[id][lg],
    lg,
    ay: lg === 'm' ? 'anh ấy' : 'cô ấy',
    xung: lg === 'm' ? 'anh' : 'em',
    goi: lg === 'm' ? 'em' : 'anh',
    bm: orphan ? 'ông bà' : 'bố mẹ',
    mom: orphan ? 'bà' : 'mẹ',
    has: (fl) => s.flags.includes(fl),
  };
}

export const txt = (v: string | ((x: Ctx) => string) | undefined, x: Ctx) => (typeof v === 'function' ? v(x) : (v ?? ''));

function core(s: Story): StoryCore {
  // bỏ hist khi chụp ảnh trạng thái
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hist, ...rest } = s;
  return JSON.parse(JSON.stringify(rest));
}

export interface Feedback {
  notes: string[];
  sys: string[];
  mids: string[];
}

/**
 * Chọn một lựa chọn: chụp trạng thái, áp thay đổi, ghi ngã rẽ, tìm cảnh kế tiếp (bỏ qua các cảnh có skip).
 */
export function choose(
  scenes: Record<string, Scene>,
  c: Character,
  f: Family,
  s0: Story,
  idx: number,
): { s: Story; fb: Feedback } {
  const scene = scenes[s0.scene];
  const x0 = ctxOf(c, f, s0, scene.age);
  const opts = visibleChoices(scene, x0);
  const ch = opts[idx];
  const s: Story = { ...core(s0), hist: [...s0.hist, core(s0)] };
  const fb: Feedback = { notes: [], sys: [], mids: [] };
  const fx: Fx = {
    stat: (k, d) => (s.stats[k] = clamp(s.stats[k] + d)),
    love: (id, d) => (s.love[id] = clamp(s.love[id] + d)),
    rel: (k, d) => (s.rel[k] = clamp(s.rel[k] + d)),
    flag: (fl) => {
      if (!s.flags.includes(fl)) s.flags.push(fl);
    },
    unflag: (fl) => (s.flags = s.flags.filter((x) => x !== fl)),
    partner: (p) => (s.partner = p),
    marry: () => {
      s.married = true;
      s.marriedAge = scene.age;
    },
    kids: (n) => (s.kids = n),
    loveEnd: (id) => (s.loveEnd = id),
    mid: (id) => {
      if (!s.mids.includes(id)) s.mids.push(id);
      fb.mids.push(id);
    },
    say: (t) => fb.notes.push(t),
  };
  const x = ctxOf(c, f, s, scene.age);
  ch.do?.(fx, x);
  const note = txt(ch.note, x);
  if (note) fb.notes.unshift(note);
  const sys = txt(ch.sys, x);
  if (sys) fb.sys.push(sys);
  s.path.push({ scene: scene.id, age: scene.age, title: txt(scene.title, x0), choice: txt(ch.t, x0) });

  let next = ch.to ? txt(ch.to, x) : txt(scene.next, x);
  // bỏ qua các cảnh không hợp với nhánh hiện tại
  for (let guard = 0; guard < 50; guard++) {
    const sc = scenes[next];
    if (!sc) break;
    const xs = ctxOf(c, f, s, sc.age);
    if (!sc.skip || !sc.skip(xs)) break;
    next = txt(sc.next, xs);
  }
  s.scene = next;
  return { s, fb };
}

export function visibleChoices(scene: Scene, x: Ctx) {
  return scene.choices.filter((ch) => !ch.if || ch.if(x));
}

/** Quay lại ngã rẽ thứ i: trạng thái ngay trước lựa chọn đó */
export function rewind(s: Story, i: number): Story {
  const snap = s.hist[i];
  return { ...JSON.parse(JSON.stringify(snap)), hist: s.hist.slice(0, i) };
}
