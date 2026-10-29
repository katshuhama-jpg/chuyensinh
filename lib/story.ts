/**
 * Engine cốt truyện nhiều nhánh: mỗi lựa chọn đổi chỉ số, độ thân, cắm cờ;
 * cờ cắm từ bé có thể bung ra nhiều năm sau (hiệu ứng cánh bướm).
 * Nội dung cảnh nằm ở lib/scenes.ts.
 */

import { fmtVND as fmtMoney, savingOf, unitOf } from './money';
import type { Character, Family, Gender, Look } from './character';
import type { Bg } from '@/components/Backdrop';

export type StatKey = 'hoc' | 'noi' | 'duyen' | 'tinh' | 'tien' | 'tam' | 'dao' | 'khoe';
export const STAT_LABEL: Record<StatKey, string> = {
  hoc: 'Hiểu biết',
  noi: 'Nổi loạn',
  duyen: 'Nhan sắc',
  tinh: 'Tình cảm',
  tien: 'Tài chính',
  tam: 'Vui vẻ',
  dao: 'Vận đào hoa',
  khoe: 'Sức khỏe',
};

/** 5 trục hiện trên biểu đồ mạng nhện; Tâm lý gộp tâm trạng và tình cảm, Vận đào hoa giữ kín */
export const RADAR: { label: string; of: (s: Record<StatKey, number>) => number }[] = [
  { label: 'Nhan sắc', of: (s) => s.duyen },
  { label: 'Hiểu biết', of: (s) => s.hoc },
  { label: 'Nổi loạn', of: (s) => s.noi },
  { label: 'Tài chính', of: (s) => s.tien },
  { label: 'Vui vẻ', of: (s) => Math.round((s.tam + s.tinh) / 2) },
];
export const STAT_KEYS = Object.keys(STAT_LABEL) as StatKey[];

/** Gắn kết: trung bình độ thân với bố mẹ, bạn thân, người yêu và con cái (nếu có) */
export function bondsOf(s: StoryCore) {
  const xs = [s.rel.bome, s.rel.banthan];
  if (s.partner && s.partner !== 'xemmat') xs.push(s.love[s.partner]);
  if (s.kids) xs.push(s.rel.con);
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

/** 4 chỉ số chính kiểu 1in8b (Sức khỏe, Vui vẻ, Hiểu biết, Gắn kết) và Tình duyên cho game tình yêu */
export const MAIN_STATS: { label: string; of: (s: StoryCore) => number }[] = [
  { label: 'Sức khỏe', of: (s) => s.stats.khoe ?? 70 },
  { label: 'Vui vẻ', of: (s) => s.stats.tam },
  { label: 'Hiểu biết', of: (s) => s.stats.hoc },
  { label: 'Gắn kết', of: (s) => bondsOf(s) },
  { label: 'Tình duyên', of: (s) => Math.max(0, ...s.met.filter((id) => !s.flags.includes(`${id}_out`)).map((id) => s.love[id])) },
];

export type LoveId = 'khoi' | 'long' | 'minh' | 'phong' | 'hai' | 'tuananh' | 'kai' | 'quan' | 'bao' | 'duy' | 'hung' | 'tai';
export const LOVE_IDS: LoveId[] = ['khoi', 'long', 'minh', 'phong', 'hai', 'tuananh', 'kai', 'quan', 'bao', 'duy', 'hung', 'tai'];

/** Cùng lúc giữ tối đa 5 người, cả đời gặp tối đa 10 người */
export const MAX_ACTIVE = 5;
export const MAX_LIFE = 10;

/** Người yêu: bản nam gặp khi nhân vật chính là nữ, bản nữ khi là nam */
export const LOVES: Record<LoveId, { m: string; f: string; kind: string; job: [string, string]; likes: StatKey; likesName: string; happy: string }> = {
  khoi: { m: 'Khôi', f: 'Thảo', kind: 'Thanh mai trúc mã, nhà bên cạnh', job: ['bạn nhà bên', 'bạn nhà bên'], likes: 'tinh', likesName: 'người sống tình cảm, nhớ chuyện cũ', happy: 'Thanh Mai Trúc Mã' },
  long: { m: 'Long', f: 'Vy', kind: 'Ngoài lạnh trong ấm, sống bụi', job: ['boy phố', 'chị đại'], likes: 'noi', likesName: 'người dám liều, không sợ bị nói', happy: 'Lãng Tử Quay Đầu' },
  minh: { m: 'Minh', f: 'Ngọc', kind: 'Học bá lạnh lùng', job: ['lớp trưởng', 'lớp phó học tập'], likes: 'hoc', likesName: 'người học giỏi, thành thật', happy: 'Học Bá Tan Chảy' },
  phong: { m: 'Phong', f: 'Hà', kind: 'Bác sĩ điềm đạm', job: ['bác sĩ', 'bác sĩ'], likes: 'tam', likesName: 'người lạc quan, biết giữ sức khỏe', happy: 'Chữa Lành Trái Tim' },
  hai: { m: 'Hải', f: 'Linh', kind: 'Nghệ sĩ nghèo, lãng mạn', job: ['ca sĩ indie', 'ca sĩ hát quán'], likes: 'duyen', likesName: 'người duyên dáng, biết cảm nhạc', happy: 'Bản Tình Ca Cuối' },
  tuananh: { m: 'Tuấn Anh', f: 'Lan Anh', kind: 'Sếp hơn 5 tuổi, lạnh ngoài nóng trong', job: ['tổng tài', 'nữ giám đốc'], likes: 'tien', likesName: 'người tự lo được tài chính', happy: 'Tổng Tài Cũng Biết Yêu' },
  kai: { m: 'Kai', f: 'Mia', kind: 'Du học sinh vui vẻ, học tiếng Việt', job: ['du học sinh', 'du học sinh'], likes: 'noi', likesName: 'người thích khám phá, dám đi xa', happy: 'Yêu Xuyên Biên Giới' },
  quan: { m: 'Quân', f: 'Mai', kind: 'Ngôi sao màn ảnh', job: ['ca sĩ thần tượng', 'diễn viên'], likes: 'duyen', likesName: 'người duyên dáng, không ham nổi tiếng', happy: 'Cặp Đôi Quốc Dân' },
  bao: { m: 'Bảo', f: 'Trâm', kind: 'Đồng nghiệp hài hước', job: ['đồng nghiệp bàn bên', 'đồng nghiệp bàn bên'], likes: 'tam', likesName: 'người vui tính, hay cười', happy: 'Cười Cả Đời' },
  // hai ngôi sao hư cấu hoàn toàn (tên, quê, tiểu sử đều tự nghĩ), chỉ giữ "vibe" người nổi tiếng
  hung: { m: 'Mr. Capy', f: 'Diệp', kind: 'Ngôi sao: trước ống kính lạnh lùng, bùng nổ; ở riêng thì nhắng nhít, nuôi một bé capybara tên Bơ', job: ['ca sĩ trăm triệu view', 'nữ diễn viên phim trăm tỷ'], likes: 'tinh', likesName: 'người chân thành, coi mình như người thường', happy: 'Ngôi Sao Về Nhà' },
  tai: { m: 'Long Miền Tây', f: 'Yến', kind: 'Ca sĩ nhạc miền Tây: giọng ngọt như phù sa, hát bolero lẫn vọng cổ, nổi lên từ một clip hát trên xuồng', job: ['ca sĩ nhạc miền Tây', 'nữ ca sĩ bolero miền Tây'], likes: 'noi', likesName: 'người dám đứng cạnh mình trước dư luận', happy: 'Mặc Kệ Thiên Hạ' },
  duy: { m: 'Duy', f: 'Hạ', kind: 'Người lạ định mệnh', job: ['người lạ trên chuyến tàu', 'người lạ trên chuyến tàu'], likes: 'dao', likesName: 'người có Vận đào hoa cao', happy: 'Định Mệnh Trên Chuyến Tàu' },
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
  /** những người đã gặp trong đời, theo thứ tự gặp (tối đa 10) */
  met: LoveId[];
  /** người mới đang chờ vào đời khi đã đủ 5 người */
  pending: LoveId | null;
  /** cảnh đi tiếp sau khi chọn buông ai */
  resume: string | null;
  /** số người thân (độ thân từ 50) cùng lúc nhiều nhất từng có */
  peak: number;
  /** album kỷ niệm: mỗi buổi hẹn để lại một tấm ảnh */
  album: Photo[];
  /** câu trả lời ở các mốc tuổi (người chơi tự gõ) */
  notes: { age: number; q: string; a: string }[];
  /** ngã rẽ (số thứ tự trong path) đã chốt kết cục tình yêu */
  endAt?: number;
  /** hạt ngẫu nhiên riêng của đời này: cùng tên, cùng năm sinh vẫn ra chuyện khác */
  seed?: number;
  /** nhật ký đời (mới nhất ở cuối), kiểu "Life record" */
  log?: LogLine[];
  /** tâm trạng từng năm (theo Tâm lý), để vẽ bản đồ đời */
  mood?: number[];
  /** trọng tâm đang chọn, đổi lúc nào cũng được */
  focus?: string;
  /** những lựa chọn lớn với từng người, để nhiều năm sau người ấy nhắc lại */
  memo?: { age: number; who: LoveId; t: string; d: number; used?: boolean }[];
  /** tài sản bằng tiền thật (VNĐ), cộng dồn theo năm; âm là đang nợ */
  cash?: number;
}

export interface LogLine {
  age: number;
  year: number;
  t: string;
  /** feed: năm trôi qua; pick: lựa chọn; note: hệ quả; ch: sang chương */
  k: 'feed' | 'pick' | 'note' | 'ch';
}

export interface Photo {
  age: number;
  year: number;
  who: LoveId;
  place: string;
  bg: Bg;
  line: string;
}

export interface Story extends StoryCore {
  /** ảnh chụp trạng thái trước mỗi lựa chọn, để quay lại ngã rẽ */
  /** ảnh chụp gọn (không có path, log) trước mỗi lựa chọn; chỉ giữ ở ngã rẽ lớn và vài bước gần nhất, còn lại là null */
  hist: (StoryCore | null)[];
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
  /** cảnh quẹt: lựa chọn này ứng với Match người nào; Bảng tình duyên: việc này làm với ai */
  loveId?: LoveId;
  /** Bảng tình duyên: loại việc (nhắn tin, hẹn hò, tỏ tình, buông, quẹt, đi chỗ mới...) */
  act?: 'chat' | 'date' | 'confess' | 'drop' | 'quet' | 'explore' | 'friends' | 'work' | 'gift' | 'gold';
}

export interface Scene {
  id: string;
  age: number;
  chapter: string;
  /** ai đứng cạnh nhân vật chính trong cảnh */
  who?: (x: Ctx) => LoveId | 'mom' | 'bestie' | 'he_thong' | 'xemmat' | null;
  kind?: 'talk' | 'chat' | 'swipe' | 'hub' | 'call' | 'tap' | 'gift' | 'unlock' | 'cheer' | 'reflect' | 'feed' | 'pick';
  /** cảnh chọn người: danh sách người có thể chọn để tìm hiểu (chọn tối đa 3) */
  cands?: (x: Ctx) => LoveId[];
  /** dòng thời gian: những năm trôi qua không cần chọn */
  feed?: (x: Ctx) => { age: number; year: number; t: string }[];
  /** cảnh ngẫm (kiểu 1 in 8 Billion): câu hỏi để người chơi tự viết */
  ask?: (x: Ctx) => string;
  /** cảnh chat: máy dùng (mặc định theo năm); 'pc' là phần mềm chat ở quán net */
  device?: (x: Ctx) => 'letter' | 'nokia' | 'pc' | 'smart' | 'ai';
  /** cảnh gọi điện: chiều gọi, gọi video, tên người kia, dòng phụ, câu người kia nói khi thông máy */
  call?: (x: Ctx) => { dir: 'in' | 'out'; video?: boolean; name: string; sub?: string; lines?: string[] };
  /** cảnh trò chơi chạm: đạt mục tiêu thì chọn lựa chọn đầu, không thì lựa chọn thứ hai */
  tap?: { goal: number };
  title: string | ((x: Ctx) => string);
  text: (x: Ctx) => string[];
  /** cảnh tin nhắn: tin hiện trong khung chat */
  msgs?: (x: Ctx) => { me: boolean; t: string }[];
  /** cảnh chat có đồng hồ: hết giờ thì tính là lựa chọn thứ timeout */
  timer?: number;
  timeout?: number;
  /** cảnh quẹt: các thẻ hồ sơ; thẻ có loveId là người thật, Match thì chọn lựa chọn mang cùng loveId */
  cards?: (x: Ctx) => SwipeCard[];
  /** nền pixel của cảnh: nơi chốn, giờ, dịp Tết */
  bg?: (x: Ctx) => Bg;
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
  /** ly hôn: hết vợ chồng, người kia rời khỏi đời mình */
  divorce: () => void;
  /** hủy cưới trước ngày cưới: không tính là ly hôn */
  cancelWedding: () => void;
  /** bạn thân phản bội: từ nay bạn thân là người khác */
  newBestie: (name: string) => void;
  /** cộng/trừ tiền thật (VNĐ đúng năm); điểm Tài chính đi theo */
  cash: (vnd: number) => void;
  /** mất một phần tài sản đang có (0-1) */
  lose: (part: number) => void;
  /** xóa nợ, làm lại từ con số không */
  clearDebt: () => void;
  kids: (n: number) => void;
  /** chụp một tấm ảnh vào album kỷ niệm */
  photo: (p: Omit<Photo, 'age' | 'year'>) => void;
  loveEnd: (id: string) => void;
  /** mở một kết cục giữa chừng */
  mid: (id: string) => void;
  /** báo thêm một dòng sau lựa chọn */
  say: (t: string) => void;
  /** gặp một người mới (tôn trọng giới hạn 5 cùng lúc, 10 cả đời) */
  meet: (id: LoveId) => void;
  /** buông một người: rời khỏi đời mình */
  drop: (id: LoveId) => void;
  /** nhận người mới đang chờ (sau khi đã buông bớt một người) */
  acceptPending: () => void;
  /** thôi không quen người mới đang chờ */
  rejectPending: () => void;
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
  /** người mới gặp ở lựa chọn này */
  met: LoveId[];
  /** lựa chọn vừa rồi đã đổi gì: "Khôi ♥ +12 · Vui vẻ +5 · Tiền -2 triệu" */
  delta?: string;
  /** cảnh này nhắc lại lựa chọn cũ nào */
  memo?: string;
}

/** Những người đang có trong đời (đã gặp, chưa buông) */
export const activeOf = (s: StoryCore) => s.met.filter((id) => !s.flags.includes(`${id}_out`));
export const isOut = (s: StoryCore, id: LoveId) => s.flags.includes(`${id}_out`);

/** Tìm cảnh theo mã; cảnh động (Mùa yêu, tin nhắn, hẹn hò...) dựng theo trạng thái */
export type Resolve = (id: string, s: Story) => Scene | undefined;

/**
 * Chọn một lựa chọn: chụp trạng thái, áp thay đổi, ghi ngã rẽ, tìm cảnh kế tiếp (bỏ qua các cảnh có skip).
 */
/** lựa chọn cũ (cách đây từ hai năm) với người này mà người ấy sẽ nhắc lại */
export function memoFor(s: StoryCore, id: LoveId, age: number) {
  return (s.memo ?? []).find((e) => e.who === id && !e.used && age - e.age >= 2) ?? null;
}
/** dòng nhắc lại lựa chọn cũ, đặt ở đầu cảnh */
export function memoLine(s: StoryCore, id: LoveId, age: number, name: string) {
  const m = memoFor(s, id, age);
  if (!m) return null;
  const t = m.t.replace(/\s*[★♥]\s*$/u, '').replace(/^["“(]+|["”)]+$/g, '');
  return m.d > 0 ? `🦋 ${name} vẫn nhớ năm ${m.age} tuổi, bạn đã chọn: "${t}".` : `🦋 ${name} chưa quên chuyện năm ${m.age} tuổi, khi bạn chọn: "${t}".`;
}

export function choose(resolve: Resolve, c: Character, f: Family, s0: Story, idx: number): { s: Story; fb: Feedback } {
  const scene = resolve(s0.scene, s0)!;
  const x0 = ctxOf(c, f, s0, scene.age);
  const opts = visibleChoices(scene, x0);
  const ch = opts[idx];
  const s: Story = { ...core(s0), hist: pruneHist([...s0.hist, lite(core(s0))], [...s0.path, { scene: scene.id, age: scene.age, title: '', choice: '' }]) };
  const fb: Feedback = { notes: [], sys: [], mids: [], met: [] };
  const lg: Gender = c.gender === 'f' ? 'm' : 'f';
  const name = (id: LoveId) => LOVES[id][lg];
  const fx: Fx = {
    stat: (k, d) => {
      s.stats[k] = clamp(s.stats[k] + d);
      // tiền thật đi theo điểm Tài chính: được thì cộng, tiêu thì trừ đúng số tiền (hết tiền thì thành nợ)
      if (k === 'tien') s.cash = (s.cash ?? 0) + d * unitOf(c.birthYear + scene.age, scene.age);
    },
    love: (id, d) => {
      // thêm độ thân với người chưa quen là gặp người đó
      if (d > 0 && !s.met.includes(id)) fx.meet(id);
      if (s.met.includes(id)) s.love[id] = clamp(s.love[id] + d);
    },
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
    cash: (vnd) => {
      const u = unitOf(c.birthYear + scene.age, scene.age);
      s.cash = (s.cash ?? 0) + vnd;
      s.stats.tien = clamp(s.stats.tien + vnd / u);
    },
    lose: (part) => {
      const have = Math.max(0, s.cash ?? 0);
      fx.cash(-have * part);
    },
    clearDebt: () => {
      if ((s.cash ?? 0) < 0) s.cash = 0;
    },
    newBestie: (name) => {
      fx.flag(`bestie_cu`);
      s.bestie = name;
    },
    cancelWedding: () => {
      if (s.partner && s.partner !== 'xemmat') fx.flag(`${s.partner}_out`);
      s.married = false;
      s.partner = null;
      s.endAt = undefined;
      s.loveEnd = null;
    },
    divorce: () => {
      if (s.partner && s.partner !== 'xemmat') fx.flag(`${s.partner}_out`);
      s.married = false;
      s.partner = null;
      fx.flag('lyhon');
    },
    kids: (n) => (s.kids = n),
    photo: (p) => {
      s.album = [...(s.album ?? []), { ...p, age: scene.age, year: c.birthYear + scene.age }];
    },
    loveEnd: (id) => ((s.loveEnd = id), (s.endAt = s.path.length)),
    mid: (id) => {
      if (!s.mids.includes(id)) s.mids.push(id);
      fb.mids.push(id);
    },
    say: (t) => fb.notes.push(t),
    meet: (id) => {
      if (s.met.includes(id) || s.pending === id) return;
      if (s.met.length >= MAX_LIFE) {
        fb.notes.push(`Đời này đã gặp đủ ${MAX_LIFE} người. ${name(id)} chỉ lướt qua.`);
        return;
      }
      if (activeOf(s).length >= MAX_ACTIVE) {
        s.pending = id;
        return;
      }
      s.met.push(id);
      fb.met.push(id);
    },
    drop: (id) => {
      fx.flag(`${id}_out`);
      if (s.partner === id) s.partner = null;
    },
    acceptPending: () => {
      const id = s.pending;
      s.pending = null;
      if (id) fx.meet(id);
    },
    rejectPending: () => {
      s.pending = null;
    },
  };
  const x = ctxOf(c, f, s, scene.age);
  const before = { love: { ...s.love }, stats: { ...s.stats }, rel: { ...s.rel }, cash: s.cash ?? 0 };
  ch.do?.(fx, x);
  // hệ quả nhìn thấy được: lựa chọn vừa rồi đổi những gì
  {
    const parts: string[] = [];
    for (const id of LOVE_IDS) {
      const d = Math.round(s.love[id] - before.love[id]);
      if (d && s.met.includes(id)) parts.push(`${name(id)} ♥ ${d > 0 ? '+' : ''}${d}`);
    }
    for (const k of STAT_KEYS) {
      if (k === 'tien') continue;
      const d = Math.round(s.stats[k] - before.stats[k]);
      if (Math.abs(d) >= 3) parts.push(`${STAT_LABEL[k]} ${d > 0 ? '+' : ''}${d}`);
    }
    const RL: Record<string, string> = { bome: x.bm === 'ông bà' ? 'Ông bà' : 'Bố mẹ', banthan: 'Bạn thân', con: 'Con cái' };
    for (const k of Object.keys(s.rel) as (keyof typeof s.rel)[]) {
      const d = Math.round(s.rel[k] - before.rel[k]);
      if (Math.abs(d) >= 3) parts.push(`${RL[k]} ${d > 0 ? '+' : ''}${d}`);
    }
    const dc = (s.cash ?? 0) - before.cash;
    if (Math.abs(dc) >= 1000) parts.push(`Tiền ${dc > 0 ? '+' : '-'}${fmtMoney(Math.abs(dc))}`);
    if (parts.length) fb.delta = parts.slice(0, 4).join(' · ');
    // lựa chọn lớn với một người: người ấy sẽ nhớ
    const ids = LOVE_IDS.filter((id) => Math.abs(s.love[id] - before.love[id]) >= 8 && s.met.includes(id));
    const t0 = txt(ch.t, x0);
    if (t0 && !t0.startsWith('▶')) for (const id of ids) s.memo = [...(s.memo ?? []), { age: scene.age, who: id, t: t0, d: s.love[id] - before.love[id] }].slice(-40);
    // cảnh này đã nhắc lại một lựa chọn cũ: đánh dấu đã dùng
    const w = scene.who?.(x0);
    const m = typeof w === 'string' && (LOVE_IDS as string[]).includes(w) ? memoFor(s0, w as LoveId, scene.age) : null;
    if (m && s.memo) s.memo = s.memo.map((e) => (e.age === m.age && e.who === m.who && e.t === m.t ? { ...e, used: true } : e));
  }
  const note = txt(ch.note, x);
  if (note) fb.notes.unshift(note);
  const sys = txt(ch.sys, x);
  if (sys) fb.sys.push(sys);
  s.path.push({ scene: scene.id, age: scene.age, title: txt(scene.title, x0), choice: txt(ch.t, x0) });
  s.peak = Math.max(s.peak ?? 0, activeOf(s).filter((id) => s.love[id] >= 50).length);

  let next = ch.to ? txt(ch.to, x) : txt(scene.next, x);
  // đủ 5 người mà gặp thêm: hỏi buông ai trước khi đi tiếp
  if (s.pending && !scene.id.startsWith('drop@')) {
    s.resume = next;
    next = `drop@${scene.age}`;
  }
  // bỏ qua các cảnh không hợp với nhánh hiện tại
  const skipOn = () => {
    for (let guard = 0; guard < 50; guard++) {
      const sc = resolve(next, s);
      if (!sc) break;
      const xs = ctxOf(c, f, s, sc.age);
      if (!sc.skip || !sc.skip(xs)) break;
      next = txt(sc.next, xs);
    }
  };
  skipOn();
  // mỗi năm trôi qua: cộng khoản để dành của năm ấy (bé: lì xì vào heo đất; lớn: lương trừ chi tiêu)
  const na = next === 'end' ? scene.age + 1 : resolve(next, s)?.age ?? scene.age;
  for (let a = scene.age; a < na; a++) {
    s.cash = (s.cash ?? 0) + savingOf(s, c.birthYear + a, a);
    // nợ thì đẻ lãi mỗi năm
    if (s.cash < 0) s.cash *= 1.06;
  }
  // tiền đổi có thể làm cảnh chen ngang (phá sản) xuất hiện hoặc biến mất: bỏ qua thêm một lượt
  skipOn();
  s.scene = next;
  return { s, fb };
}

export function visibleChoices(scene: Scene, x: Ctx) {
  return scene.choices.filter((ch) => !ch.if || ch.if(x));
}

/** Những cảnh quan trọng không tự chọn hộ khi tua nhanh (cầu hôn, cưới, người cũ) */
export const STOP_AT = ['y27_cauhon', 'y28_hethong', 'y29_quaylai', 'm40_nguoicu'];
/** cảnh lớn theo tiền tố (cầu hôn, đêm trước cưới, đêm hẹn ngôi sao): không tự chọn hộ */
export const isStop = (id: string) => STOP_AT.includes(id) || /^(ch|rv|st1|st3)@/.test(id);

/** Tua nhanh hết thời kỳ hiện tại (kiểu Auto của 1 in 8 Billion): tự chọn ngẫu nhiên đến khi sang chương mới
 *  hoặc gặp một ngã rẽ lớn. Trả về trạng thái mới và các dòng tóm tắt đã trôi qua. */
export function fastForward(resolve: Resolve, c: Character, f: Family, s0: Story, rnd = Math.random) {
  const start = resolve(s0.scene, s0)?.chapter;
  let s = s0;
  const lines: { age: number; year: number; t: string }[] = [];
  for (let k = 0; k < 300 && s.scene !== 'end'; k++) {
    const sc = resolve(s.scene, s);
    if (!sc || sc.chapter !== start || (k > 0 && isStop(sc.id))) break;
    const x = ctxOf(c, f, s, sc.age);
    const opts = visibleChoices(sc, x);
    if (!opts.length) break;
    // cảnh ngẫm thì để sau; dòng thời gian thì sống tiếp; còn lại chọn ngẫu nhiên
    const idx = sc.kind === 'reflect' ? opts.length - 1 : sc.kind === 'feed' ? 0 : Math.floor(rnd() * opts.length);
    const before = s.path.length;
    const r = choose(resolve, c, f, s, idx);
    s = r.s;
    if (sc.kind === 'feed') for (const l of sc.feed?.(x) ?? []) lines.push(l);
    else for (const p of s.path.slice(before)) lines.push({ age: p.age, year: c.birthYear + p.age, t: `${p.title}: ${p.choice}` });
    for (const n of r.fb.notes.slice(0, 1)) lines.push({ age: sc.age, year: c.birthYear + sc.age, t: `↳ ${n}` });
  }
  return { s, lines };
}

/** Quay lại ngã rẽ thứ i: trạng thái ngay trước lựa chọn đó */
/** ảnh chụp gọn: bỏ path và nhật ký (dựng lại từ đời hiện tại khi quay lại) để bản lưu không phình to */
function lite(c: StoryCore): StoryCore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { path, log, ...rest } = c;
  return rest as StoryCore;
}
/** ngã rẽ lớn: còn quay lại được từ trang cuối đời */
const KEY = /^(ch|rv|st1|st3|tq|ms|fo|wd|ps|gl|bat|route|dr|hs)@|^(y2\d_|m\d\d_|c\d+_|t1\d|o\d)/;
/** chỉ giữ ảnh chụp ở ngã rẽ lớn và 3 bước gần nhất */
export function pruneHist(h: (StoryCore | null)[], path: Step[]): (StoryCore | null)[] {
  const n = h.length;
  return h.map((e, i) => (e && (i >= n - 3 || KEY.test(path[i]?.scene ?? '')) ? (e.path || e.log ? lite(e) : e) : null));
}
/** trạng thái ngay trước bước cuối (để vẽ lại cảnh vừa chọn) */
export function prevOf(s: Story): Story | null {
  const e = s.hist[s.hist.length - 1];
  return e ? { ...e, path: s.path.slice(0, -1), log: s.log, hist: [] } : null;
}
export const canRewind = (s: Story, i: number) => !!s.hist[i];
export function rewind(s: Story, i: number): Story {
  const snap = s.hist[i];
  if (!snap) return s;
  const age = s.path[i]?.age ?? 0;
  return { ...JSON.parse(JSON.stringify(snap)), path: s.path.slice(0, i), log: (s.log ?? []).filter((l) => l.age < age || (l.age === age && l.k === 'feed')), hist: s.hist.slice(0, i) };
}

/** Bản lưu cũ (trước khi có 10 người yêu): bổ sung trường còn thiếu để chơi tiếp được */
export function normalizeStory(s: Story): Story {
  const fix = <T extends StoryCore>(c: T): T => {
    const love = { ...Object.fromEntries(LOVE_IDS.map((id) => [id, 0])), ...c.love } as Record<LoveId, number>;
    return {
      ...c,
      love,
      met: c.met ?? LOVE_IDS.filter((id) => love[id] > 0 || c.flags.includes(`${id}_out`)),
      pending: c.pending ?? null,
      resume: c.resume ?? null,
      peak: c.peak ?? 0,
      album: c.album ?? [],
      notes: c.notes ?? [],
      stats: { ...c.stats, khoe: c.stats.khoe ?? 70 },
      log: c.log ?? [],
      mood: c.mood ?? [],
    };
  };
  const top = fix(s);
  // bản lưu cũ có thể rất to (ảnh chụp đầy đủ mỗi bước): thu gọn ngay khi tải
  return { ...top, hist: pruneHist((s.hist ?? []).map((h) => (h ? fix({ ...h, path: h.path ?? [], log: h.log ?? [] }) : null)), top.path) };
}
