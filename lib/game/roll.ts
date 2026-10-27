import {
  CARDS,
  COUNTRIES,
  FAMILIES,
  FUTURE,
  HOMES,
  MILESTONES,
  RARITY,
  STAT_NAMES,
  TALENTS,
  THIS_YEAR,
  zodiacOf,
  type DrawMode,
  type Gender,
  type GenderPick,
  type Milestone,
  type Rarity,
  type StatName,
  type Weighted,
  type WorldMode,
} from './world';

export interface Setup {
  world: WorldMode;
  draw: DrawMode;
  gender: GenderPick;
}

export interface Look {
  /** 0 sáng, 1 vừa, 2 ngăm, 3 sẫm */
  skin: number;
  hair: string;
  /** chỉ số kiểu tóc, áo, quần; lpcLayers tự chọn theo giới tính */
  hairStyle: number;
  top: number;
  bottom: number;
  topColor: string;
  bottomColor: string;
}

export interface Profile {
  name: string;
  gender: Gender;
  country: string;
  countryName: string;
  city: string;
  world: Exclude<WorldMode, 'any'>;
  born: { y: number; m: number; d: number };
  zodiac: { name: string; sym: string; el: string };
  family: { id: string; name: string };
  home: string;
  talent: { name: string; mul: number };
  card: { rarity: Rarity; name: string };
  stats: Record<StatName, number>;
  look: Look;
  /** những mốc có thật sẽ đi qua trong đời này (tối đa 5) */
  ahead: Milestone[];
}

type Rng = () => number;

function pick<T>(r: Rng, xs: T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

function pickW<T>(r: Rng, xs: Weighted<T>[]): T {
  const total = xs.reduce((s, x) => s + x.w, 0);
  let n = r() * total;
  for (const x of xs) {
    n -= x.w;
    if (n < 0) return x.v;
  }
  return xs[xs.length - 1].v;
}

const clamp = (n: number) => Math.max(5, Math.min(95, Math.round(n)));

const HAIRS = ['#2a1d16', '#2a1d16', '#4a2f1d', '#6b4426', '#a8763e', '#d9b26a', '#9c3b26'];
const TOPS = ['#e8e1d0', '#3b5b8c', '#c4573a', '#2f7a63', '#d9a441', '#6a4a8c', '#30343f', '#c46a86'];
const BOTTOMS = ['#2b3045', '#3b4f7a', '#5a4632', '#30343f', '#7a6a58', '#8c3b3b'];

export function rollProfile(setup: Setup, r: Rng = Math.random): Profile {
  // thời đại
  const world = setup.world === 'any' ? pick(r, ['past', 'now', 'future'] as const) : setup.world;
  const y = world === 'past' ? 1950 + Math.floor(r() * (THIS_YEAR - 1950)) : THIS_YEAR;
  const m = 1 + Math.floor(r() * 12);
  const d = 1 + Math.floor(r() * 28);

  // nơi sinh
  const c =
    setup.draw === 'births'
      ? pickW(r, COUNTRIES.map((x) => ({ v: x, w: x.births })))
      : setup.draw === 'pop'
        ? pickW(r, COUNTRIES.map((x) => ({ v: x, w: x.pop })))
        : pick(r, COUNTRIES);

  const gender: Gender = setup.gender === 'rand' ? (r() < 0.49 ? 'f' : r() < 0.96 ? 'm' : 'nb') : setup.gender;
  const fam = pick(r, c.family);
  const giv = pick(r, c.given[gender]);
  const name = c.familyFirst ? `${fam} ${giv}` : `${giv} ${fam}`;

  // gia cảnh: chế độ tiểu thuyết theo bảng cố định; đời thật tạm dùng cùng bảng nhưng bớt hào môn
  const famList = setup.draw === 'novel' ? FAMILIES : FAMILIES.map((f) => (f.v.id === 'haomon' || f.v.id === 'trao' ? { ...f, w: f.w / 3 } : f));
  const family = pickW(r, famList);
  const home = family.id === 'mocoi' ? 'Không cha mẹ' : pickW(r, HOMES);
  const talent = pickW(r, TALENTS);
  const rarity = pickW(r, RARITY);
  const card = { rarity, name: pick(r, CARDS[rarity]) };

  const base = () => 30 + r() * 45;
  const stats = {
    'Nhan sắc': base(),
    'Trí tuệ': base() * (0.8 + talent.mul * 0.2),
    'Tinh tế': base(),
    'Vận may': base(),
    'Sức khỏe': base() + (family.id === 'nong' ? 6 : 0),
    'Áp lực': 10 + r() * 30 + (home === 'Gia trưởng' ? 12 : 0) + (home === 'Bố mẹ ly thân' ? 15 : 0) + (family.id === 'mocoi' ? 18 : 0),
  } as Record<StatName, number>;
  if (family.id === 'haomon') stats['Vận may'] += 10;
  for (const k of STAT_NAMES) stats[k] = clamp(stats[k]);

  const skinW = c.skin;
  const skin = pickW(r, skinW.map((w, i) => ({ v: i, w })));
  const look: Look = {
    skin,
    hair: c.id === 'kr' || c.id === 'jp' || c.id === 'vn' ? (r() < 0.85 ? HAIRS[0] : pick(r, HAIRS.slice(1, 4))) : pick(r, HAIRS),
    hairStyle: Math.floor(r() * 100),
    top: Math.floor(r() * 100),
    bottom: Math.floor(r() * 100),
    topColor: pick(r, TOPS),
    bottomColor: pick(r, BOTTOMS),
  };

  const span = 80;
  const all =
    world === 'past'
      ? MILESTONES.filter((ms) => (!ms.c || ms.c === c.id) && ms.year > y && ms.year <= Math.min(THIS_YEAR, y + span))
      : world === 'future'
        ? FUTURE.filter((ms) => ms.year > y && ms.year <= y + span)
        : [];
  all.sort((a, b) => a.year - b.year);
  // nhiều hơn 5 mốc thì lấy rải đều cả đời, ưu tiên mốc của nước mình
  const local = all.filter((x) => x.c);
  const pool = all.length <= 5 ? all : [...local.slice(0, 3), ...all.filter((x) => !x.c)].sort((a, b) => a.year - b.year);
  const ahead = pool.length <= 5 ? pool : [0, 1, 2, 3, 4].map((i) => pool[Math.round((i * (pool.length - 1)) / 4)]);

  return {
    name,
    gender,
    country: c.id,
    countryName: c.name,
    city: pick(r, c.cities),
    world,
    born: { y, m, d },
    zodiac: (({ name: n, sym, el }) => ({ name: n, sym, el }))(zodiacOf(m, d)),
    family,
    home,
    talent,
    card,
    stats,
    look,
    ahead,
  };
}

/** Khóa sinh cùng thời: 2 năm trước và sau năm sinh */
export function cohortOf(p: Profile) {
  return { from: p.born.y - 2, to: p.born.y + 2 };
}
