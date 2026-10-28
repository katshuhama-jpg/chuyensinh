/**
 * Nhân vật do người chơi tự tạo (không random), chỉ gia cảnh là rút ngẫu nhiên lúc chào đời.
 */

export type Gender = 'f' | 'm';
export type Style = 'nangdong' | 'nhenhang' | 'thanhlich' | 'catinh';

export interface Look {
  /** 0 sáng, 1 trung bình, 2 ngăm, 3 sẫm */
  skin: number;
  /** mã kiểu tóc trong HAIRS */
  hair: string;
  hairColor: string;
  eyes: 'brown' | 'gray' | 'blue';
  brow: 'thin' | 'thick';
  nose: 'button' | 'straight';
  /** điểm nhấn: khuyên tai cho cả hai; râu chỉ cho nam */
  extra: 'none' | 'earrings' | 'stubble' | 'stache' | 'beard_trim';
  style: Style;
  /** màu chủ đạo của đồ */
  color: string;
}

export interface Character {
  name: string;
  gender: Gender;
  birthYear: number;
  look: Look;
}

export interface Family {
  province: string;
  urban: boolean;
  wealth: string;
  parents: string;
  /** anh chị em cụ thể, xếp từ lớn đến bé; rỗng là con một */
  siblings: Sibling[];
}

/** older: lớn hơn nhân vật (anh, chị) hay nhỏ hơn (em) */
export interface Sibling {
  older: boolean;
  gender: Gender;
}

/** Năm hiện tại: chuyện đến hết năm này là có thật, sau đó là giả định */
export const REAL_UNTIL = 2026;
export const YEAR_MIN = 1970;
export const YEAR_MAX = 2100;

export const SKINS = ['Sáng', 'Trung bình', 'Ngăm', 'Sẫm'];
/** màu hiển thị ô chọn da (gần đúng với màu nhuộm trên sprite) */
export const SKIN_SWATCH = ['#f1d3b8', '#d9b08a', '#a87650', '#6e4a36'];

/** Kiểu tóc người lớn; child: kiểu tóc tương ứng lúc bé */
export const HAIRS: { id: string; name: string; child: string; bg?: boolean; for: Gender[] }[] = [
  { id: 'long_straight', name: 'Dài thẳng', child: 'wavy', for: ['f', 'm'] },
  { id: 'shoulderl', name: 'Ngang vai', child: 'parted_side_bangs', bg: true, for: ['f', 'm'] },
  { id: 'ponytail', name: 'Đuôi ngựa', child: 'wavy', bg: true, for: ['f', 'm'] },
  { id: 'loose', name: 'Xõa bồng', child: 'wavy', for: ['f', 'm'] },
  { id: 'half_up', name: 'Búi nửa', child: 'parted_side_bangs', for: ['f', 'm'] },
  { id: 'bangs_bun', name: 'Mái bằng búi', child: 'relm_short', for: ['f', 'm'] },
  { id: 'bunches', name: 'Buộc hai bên', child: 'wavy', bg: true, for: ['f', 'm'] },
  { id: 'curtains_long', name: 'Mái thưa dài', child: 'parted_side_bangs', for: ['f', 'm'] },
  { id: 'buzzcut', name: 'Húi cua', child: 'relm_short', for: ['m', 'f'] },
  { id: 'unkempt', name: 'Rối nhẹ', child: 'relm_short', for: ['m', 'f'] },
  { id: 'long_messy', name: 'Dài bụi', child: 'parted_side_bangs', for: ['m', 'f'] },
];

/** Kiểu tóc xếp theo giới tính: kiểu hay gặp của giới đó lên trước */
export function hairsFor(g: Gender) {
  return [...HAIRS].sort((a, b) => a.for.indexOf(g) - b.for.indexOf(g));
}

export const HAIR_COLORS = [
  { c: '#2a1d16', name: 'Đen' },
  { c: '#4a2f1d', name: 'Nâu đen' },
  { c: '#7a4a28', name: 'Nâu' },
  { c: '#b07a40', name: 'Nâu sáng' },
  { c: '#d9b26a', name: 'Vàng' },
  { c: '#a33a28', name: 'Đỏ' },
  { c: '#d97a9c', name: 'Hồng' },
  { c: '#7a5aa8', name: 'Tím' },
  { c: '#4a7ab8', name: 'Xanh' },
];

export const STYLES: { id: Style; name: string; hint: string }[] = [
  { id: 'nangdong', name: 'Năng động', hint: 'Áo phông, quần short' },
  { id: 'nhenhang', name: 'Nhẹ nhàng', hint: 'Áo kiểu, chân váy / sơ mi polo' },
  { id: 'thanhlich', name: 'Thanh lịch', hint: 'Cardigan / sơ mi công sở' },
  { id: 'catinh', name: 'Cá tính', hint: 'Đồ tối màu, quần dài' },
];

export const CLOTH_COLORS = ['#e8e1d0', '#e8789f', '#b48ad9', '#7fb3d9', '#7fd1b9', '#e0b54a', '#c4573a', '#30343f'];

export const EXTRAS: { id: Look['extra']; name: string; for: Gender[] }[] = [
  { id: 'none', name: 'Không', for: ['f', 'm'] },
  { id: 'earrings', name: 'Khuyên tai', for: ['f', 'm'] },
  { id: 'stubble', name: 'Râu lún phún', for: ['m'] },
  { id: 'stache', name: 'Ria mép', for: ['m'] },
  { id: 'beard_trim', name: 'Râu quai nón', for: ['m'] },
];

/** Bấm nhanh một thời kỳ ở màn chọn năm sinh */
export const ERAS = [
  { name: '7x', year: 1975 },
  { name: '8x', year: 1985 },
  { name: '9x', year: 1995 },
  { name: 'Gen Z', year: 2003 },
  { name: 'Gen Alpha', year: 2014 },
  { name: 'Tương lai', year: 2040 },
];

/** Đồ trong tay lúc tuổi trẻ (16 tuổi) theo năm */
export function deviceAt(year: number) {
  if (year < 2000) return 'thư tay, điện thoại bàn, đài cassette';
  if (year < 2010) return 'điện thoại "cục gạch", chat ở quán net';
  if (year <= REAL_UNTIL) return 'smartphone, mạng xã hội, app hẹn hò';
  if (year <= 2045) return 'điện thoại có trợ lý AI nhắn hộ (giả định)';
  if (year <= 2080) return 'kính thực tế ảo (giả định)';
  return 'thiết bị đeo đọc cảm xúc (giả định)';
}

/** Đời này có bao nhiêu phần là thật (đến hết 2026), bao nhiêu là giả định */
export function realityOf(birthYear: number) {
  if (birthYear > REAL_UNTIL) return 'Cả đời là thế giới giả định, drama do game tự nghĩ.';
  const age = REAL_UNTIL - birthYear;
  if (age >= 75) return 'Gần như cả đời là chuyện có thật của Việt Nam.';
  return `Có thật đến năm ${REAL_UNTIL} (lúc ${age} tuổi), từ ${REAL_UNTIL + 1} là thế giới giả định.`;
}

const NAMES: Record<Gender, string[]> = {
  f: ['Minh Anh', 'Khánh Linh', 'Ngọc Hân', 'Bảo Ngọc', 'Thu Trang', 'Phương Thảo', 'Hà My', 'Diệu Linh', 'Thanh Tâm', 'Mai Chi'],
  m: ['Minh Quân', 'Gia Huy', 'Đức Anh', 'Hoàng Nam', 'Tuấn Kiệt', 'Bảo Long', 'Quang Minh', 'Thành Đạt', 'Hải Đăng', 'Nhật Minh'],
};
const SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];

export function suggestName(g: Gender, r = Math.random) {
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  return `${pick(SURNAMES)} ${pick(NAMES[g])}`;
}

export function defaultCharacter(g: Gender): Character {
  return {
    name: '',
    gender: g,
    birthYear: 2000,
    look: {
      skin: 0,
      hair: g === 'f' ? 'long_straight' : 'unkempt',
      hairColor: HAIR_COLORS[0].c,
      eyes: 'brown',
      brow: g === 'f' ? 'thin' : 'thick',
      nose: 'button',
      extra: 'none',
      style: 'nangdong',
      color: CLOTH_COLORS[1],
    },
  };
}

/* ---------- gia cảnh: phần duy nhất random ---------- */

/** 34 tỉnh thành sau sáp nhập 1/7/2025; tên này cũng đều có từ trước đó */
const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế', 'Quảng Ninh', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh',
  'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa',
  'Lâm Đồng', 'Đắk Lắk', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang', 'Lạng Sơn', 'Cao Bằng',
  'Tuyên Quang', 'Sơn La', 'Điện Biên', 'Lai Châu',
];
/** hai thành phố lớn ra nhiều hơn, gần với nơi đông dân */
const PROVINCE_W = PROVINCES.map((p) => (p === 'Hà Nội' || p === 'TP. Hồ Chí Minh' ? 6 : 1));

const WEALTH = [
  { v: 'Nhà nông', w: 25 },
  { v: 'Lao động phổ thông', w: 22 },
  { v: 'Công chức trung lưu', w: 25 },
  { v: 'Tiểu thương', w: 16 },
  { v: 'Khá giả', w: 8 },
  { v: 'Hào môn', w: 3 },
  { v: 'Mồ côi, ở với ông bà', w: 1 },
];
const PARENTS = [
  { v: 'Hòa thuận, cởi mở', w: 55 },
  { v: 'Gia trưởng', w: 20 },
  { v: 'Bố mẹ đi làm xa', w: 12 },
  { v: 'Bố mẹ ly thân', w: 10 },
  { v: 'Bố mẹ hay cãi nhau', w: 3 },
];
/** số anh chị em: con một, một, hai, ba */
const SIBLING_COUNT = [
  { v: '0', w: 22 },
  { v: '1', w: 43 },
  { v: '2', w: 25 },
  { v: '3', w: 10 },
];

/** Gọi tên anh chị em: "1 anh trai, 2 em gái" */
export function siblingText(xs: Sibling[]) {
  if (!xs.length) return 'Con một';
  const kinds: [string, (x: Sibling) => boolean][] = [
    ['anh trai', (x) => x.older && x.gender === 'm'],
    ['chị gái', (x) => x.older && x.gender === 'f'],
    ['em trai', (x) => !x.older && x.gender === 'm'],
    ['em gái', (x) => !x.older && x.gender === 'f'],
  ];
  return kinds
    .map(([name, f]) => [xs.filter(f).length, name] as const)
    .filter(([n]) => n > 0)
    .map(([n, name]) => `${n} ${name}`)
    .join(', ');
}

function pickW(r: () => number, xs: { v: string; w: number }[]) {
  let n = r() * xs.reduce((s, x) => s + x.w, 0);
  for (const x of xs) {
    n -= x.w;
    if (n < 0) return x.v;
  }
  return xs[xs.length - 1].v;
}

export function rollFamily(r = Math.random): Family {
  const province = pickW(r, PROVINCES.map((v, i) => ({ v, w: PROVINCE_W[i] })));
  const big = province === 'Hà Nội' || province === 'TP. Hồ Chí Minh';
  const wealth = pickW(r, WEALTH);
  const urban = wealth === 'Nhà nông' ? false : r() < (big ? 0.8 : 0.35);
  // mồ côi thì không có mục bố mẹ
  const parents = wealth.startsWith('Mồ côi') ? 'Không còn bố mẹ' : pickW(r, PARENTS);
  const n = Number(pickW(r, SIBLING_COUNT));
  const siblings: Sibling[] = Array.from({ length: n }, () => ({ older: r() < 0.5, gender: (r() < 0.5 ? 'f' : 'm') as Gender }));
  siblings.sort((a, b) => Number(b.older) - Number(a.older));
  return { province, urban, wealth, parents, siblings };
}
