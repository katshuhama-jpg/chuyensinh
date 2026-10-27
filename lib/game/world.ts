/**
 * Thế giới của game: nước, tên, gia cảnh, tố chất, cung hoàng đạo, thẻ tính cách, mốc lịch sử.
 * Hồ sơ chào đời được rút ngẫu nhiên từ đây.
 *
 * Số trẻ sinh mỗi năm và dân số là số gần đúng (khoảng năm 2024) để chạy thử chế độ rút theo đời thật.
 * Cần thay bằng số liệu World Population Prospects 2024 của LHQ trước khi ra mắt.
 */

export type WorldMode = 'past' | 'now' | 'future' | 'any';
export type DrawMode = 'novel' | 'births' | 'pop';
export type Gender = 'f' | 'm' | 'nb';
export type GenderPick = Gender | 'rand';

export const THIS_YEAR = 2026;

export interface Country {
  id: string;
  name: string;
  /** số trẻ sinh mỗi năm, triệu (gần đúng) */
  births: number;
  /** dân số, triệu (gần đúng) */
  pop: number;
  cities: string[];
  /** họ tên: hàm ghép tên theo thứ tự của nước đó */
  family: string[];
  given: Record<Gender, string[]>;
  /** họ đứng trước tên (Việt, Hàn, Nhật) */
  familyFirst: boolean;
  /** tỉ lệ màu da để rút ngoại hình: [sáng, vừa, ngăm, sẫm] */
  skin: [number, number, number, number];
}

export const COUNTRIES: Country[] = [
  {
    id: 'vn',
    name: 'Việt Nam',
    births: 1.4,
    pop: 101,
    cities: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế', 'Nghệ An', 'Thái Bình', 'An Giang', 'Đắk Lắk'],
    family: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Phan', 'Võ', 'Đặng', 'Bùi', 'Đỗ'],
    given: {
      f: ['Thị Lan', 'Minh Anh', 'Thu Trang', 'Ngọc Hân', 'Thanh Hương', 'Bảo Ngọc', 'Phương Linh', 'Thùy Dung', 'Mai Chi', 'Khánh Vy'],
      m: ['Văn Hùng', 'Minh Quân', 'Đức Anh', 'Quốc Bảo', 'Hoàng Long', 'Tuấn Kiệt', 'Gia Huy', 'Thành Đạt', 'Văn Nam', 'Hải Đăng'],
      nb: ['Minh An', 'Khánh', 'Bảo', 'Gia An', 'Hải', 'Thanh', 'Nhật Minh', 'An Nhiên'],
    },
    familyFirst: true,
    skin: [30, 50, 18, 2],
  },
  {
    id: 'kr',
    name: 'Hàn Quốc',
    births: 0.23,
    pop: 52,
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gwangju', 'Daejeon', 'Suwon', 'Jeju'],
    family: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim'],
    given: {
      f: ['Ji-yeon', 'Seo-yeon', 'Min-ji', 'Ha-eun', 'Soo-ah', 'Ye-jin', 'Eun-bi'],
      m: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ji-hoon', 'Hyun-woo', 'Jae-won', 'Sung-min'],
      nb: ['Ji-woo', 'Ha-neul', 'Yoon', 'Seo-yun', 'Eun'],
    },
    familyFirst: true,
    skin: [60, 36, 4, 0],
  },
  {
    id: 'jp',
    name: 'Nhật Bản',
    births: 0.73,
    pop: 123,
    cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo', 'Fukuoka', 'Nagoya', 'Sendai', 'Hiroshima'],
    family: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'],
    given: {
      f: ['Yui', 'Sakura', 'Haruka', 'Aoi', 'Mio', 'Rin', 'Yuna', 'Mei'],
      m: ['Haruto', 'Ren', 'Sota', 'Yuto', 'Kenta', 'Takumi', 'Riku', 'Daiki'],
      nb: ['Hikaru', 'Makoto', 'Akira', 'Nao', 'Sora', 'Yuki'],
    },
    familyFirst: true,
    skin: [62, 34, 4, 0],
  },
  {
    id: 'us',
    name: 'Mỹ',
    births: 3.6,
    pop: 345,
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Atlanta', 'Seattle', 'Miami', 'Detroit', 'Phoenix', 'Boston'],
    family: ['Smith', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Nguyen', 'Kim', 'Wilson', 'Taylor'],
    given: {
      f: ['Emily', 'Olivia', 'Madison', 'Sophia', 'Jessica', 'Ava', 'Maya', 'Grace'],
      m: ['James', 'Michael', 'Ethan', 'Daniel', 'Noah', 'Tyler', 'Marcus', 'Jacob'],
      nb: ['Alex', 'Jordan', 'Taylor', 'Riley', 'Sam', 'Casey', 'Quinn'],
    },
    familyFirst: false,
    skin: [45, 25, 15, 15],
  },
  {
    id: 'fr',
    name: 'Pháp',
    births: 0.68,
    pop: 66,
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Strasbourg', 'Nice'],
    family: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Laurent'],
    given: {
      f: ['Camille', 'Léa', 'Chloé', 'Manon', 'Inès', 'Juliette', 'Sarah', 'Louise'],
      m: ['Lucas', 'Hugo', 'Louis', 'Gabriel', 'Nathan', 'Arthur', 'Théo', 'Karim'],
      nb: ['Camille', 'Dominique', 'Claude', 'Sacha', 'Charlie', 'Eden'],
    },
    familyFirst: false,
    skin: [60, 22, 10, 8],
  },
  {
    id: 'br',
    name: 'Brazil',
    births: 2.5,
    pop: 212,
    cities: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília', 'Belo Horizonte', 'Recife', 'Fortaleza', 'Porto Alegre', 'Manaus'],
    family: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Lima', 'Ferreira'],
    given: {
      f: ['Ana', 'Maria', 'Juliana', 'Larissa', 'Beatriz', 'Gabriela', 'Fernanda', 'Camila'],
      m: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Matheus', 'Bruno', 'Thiago'],
      nb: ['Ariel', 'Alex', 'Cris', 'Dani', 'Sasha', 'Rafa'],
    },
    familyFirst: false,
    skin: [35, 30, 20, 15],
  },
  {
    id: 'cn',
    name: 'Trung Quốc',
    births: 9.0,
    pop: 1410,
    cities: ['Bắc Kinh', 'Thượng Hải', 'Quảng Châu', 'Thâm Quyến', 'Thành Đô', 'Hàng Châu', 'Vũ Hán', 'Tây An'],
    family: ['Vương', 'Lý', 'Trương', 'Lưu', 'Trần', 'Dương', 'Hoàng', 'Triệu', 'Chu', 'Ngô'],
    given: {
      f: ['Tịnh', 'Mỹ Linh', 'Hiểu Yến', 'Vũ Đồng', 'Tư Vũ', 'Lệ Na', 'Tuyết'],
      m: ['Vĩ', 'Hạo Nhiên', 'Tử Hiên', 'Kiến Quốc', 'Minh Hiên', 'Hạo', 'Lỗi'],
      nb: ['Tử Hàm', 'Vũ Hàm', 'An Kỳ', 'Văn'],
    },
    familyFirst: true,
    skin: [55, 40, 5, 0],
  },
  {
    id: 'th',
    name: 'Thái Lan',
    births: 0.5,
    pop: 71,
    cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Khon Kaen', 'Pattaya', 'Hat Yai', 'Udon Thani'],
    family: ['Saetang', 'Srisuk', 'Wongsa', 'Chaiyaporn', 'Boonmee', 'Kittisak', 'Rattanakul', 'Thongdee'],
    given: {
      f: ['Ploy', 'Nicha', 'Kanya', 'Malee', 'Pim', 'Fah', 'Mint'],
      m: ['Somchai', 'Anan', 'Krit', 'Narong', 'Thanakorn', 'Boon', 'Kla'],
      nb: ['Nat', 'Ton', 'Bam', 'Jay'],
    },
    familyFirst: false,
    skin: [25, 50, 22, 3],
  },
  {
    id: 'uk',
    name: 'Anh',
    births: 0.68,
    pop: 68,
    cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh', 'Bristol', 'Leeds', 'Cardiff'],
    family: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Evans', 'Patel', 'Khan', 'Murphy'],
    given: {
      f: ['Olivia', 'Amelia', 'Isla', 'Emily', 'Charlotte', 'Aisha', 'Sophie'],
      m: ['Oliver', 'George', 'Harry', 'Jack', 'Mohammed', 'Thomas', 'Leo'],
      nb: ['Charlie', 'Frankie', 'Robin', 'Jamie', 'Sam'],
    },
    familyFirst: false,
    skin: [65, 18, 10, 7],
  },
  {
    id: 'in',
    name: 'Ấn Độ',
    births: 23,
    pop: 1440,
    cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad', 'Jaipur', 'Lucknow', 'Pune'],
    family: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Das', 'Khan', 'Mehta'],
    given: {
      f: ['Priya', 'Ananya', 'Aisha', 'Kavya', 'Diya', 'Meera', 'Pooja'],
      m: ['Arjun', 'Rahul', 'Vikram', 'Aarav', 'Rohan', 'Amit', 'Kabir'],
      nb: ['Kiran', 'Ashwin', 'Sasha', 'Noor'],
    },
    familyFirst: false,
    skin: [5, 35, 45, 15],
  },
];

/** Mốc lịch sử có thật. Chỉ ghi điều đã xảy ra, kể trung tính. */
export interface Milestone {
  year: number;
  text: string;
  /** nước, bỏ trống là toàn cầu */
  c?: string;
}

export const MILESTONES: Milestone[] = [
  { year: 1969, text: 'Con người đặt chân lên Mặt Trăng' },
  { year: 1989, text: 'Bức tường Berlin sụp đổ' },
  { year: 1991, text: 'Liên Xô tan rã' },
  { year: 1997, text: 'Khủng hoảng tài chính châu Á' },
  { year: 2000, text: 'Bong bóng dot-com vỡ' },
  { year: 2007, text: 'iPhone đầu tiên ra mắt' },
  { year: 2008, text: 'Khủng hoảng tài chính toàn cầu' },
  { year: 2009, text: 'Bitcoin ra đời' },
  { year: 2020, text: 'Đại dịch COVID-19' },
  { year: 2022, text: 'ChatGPT ra mắt' },

  { c: 'vn', year: 1975, text: 'Đất nước thống nhất' },
  { c: 'vn', year: 1986, text: 'Đổi mới' },
  { c: 'vn', year: 1995, text: 'Việt - Mỹ bình thường hóa quan hệ' },
  { c: 'vn', year: 1997, text: 'Internet về Việt Nam' },
  { c: 'vn', year: 2007, text: 'Việt Nam vào WTO' },
  { c: 'vn', year: 2008, text: 'Vô địch AFF Cup lần đầu' },

  { c: 'kr', year: 1988, text: 'Olympic Seoul' },
  { c: 'kr', year: 1997, text: 'Khủng hoảng IMF' },
  { c: 'kr', year: 2002, text: 'World Cup Hàn - Nhật' },
  { c: 'kr', year: 2018, text: 'Olympic mùa đông Pyeongchang' },

  { c: 'jp', year: 1964, text: 'Olympic Tokyo' },
  { c: 'jp', year: 1991, text: 'Bong bóng kinh tế vỡ' },
  { c: 'jp', year: 1995, text: 'Động đất Kobe' },
  { c: 'jp', year: 2011, text: 'Động đất và sóng thần Tōhoku' },
  { c: 'jp', year: 2021, text: 'Olympic Tokyo (hoãn từ 2020)' },

  { c: 'us', year: 2001, text: 'Sự kiện 11/9' },
  { c: 'us', year: 2008, text: 'Khủng hoảng nhà đất' },
  { c: 'us', year: 2015, text: 'Hôn nhân đồng giới hợp pháp toàn quốc' },

  { c: 'fr', year: 1968, text: 'Biến động tháng Năm' },
  { c: 'fr', year: 1998, text: 'Vô địch World Cup' },
  { c: 'fr', year: 2002, text: 'Đổi sang đồng euro' },
  { c: 'fr', year: 2024, text: 'Olympic Paris' },

  { c: 'br', year: 1970, text: 'Vô địch World Cup lần thứ ba' },
  { c: 'br', year: 1985, text: 'Kết thúc chế độ quân sự' },
  { c: 'br', year: 1994, text: 'Đổi sang đồng real' },
  { c: 'br', year: 2002, text: 'Vô địch World Cup lần thứ năm' },
  { c: 'br', year: 2016, text: 'Olympic Rio' },

  { c: 'cn', year: 1978, text: 'Cải cách mở cửa' },
  { c: 'cn', year: 1997, text: 'Tiếp nhận Hồng Kông' },
  { c: 'cn', year: 2001, text: 'Trung Quốc vào WTO' },
  { c: 'cn', year: 2008, text: 'Olympic Bắc Kinh' },

  { c: 'th', year: 2004, text: 'Sóng thần Ấn Độ Dương' },
  { c: 'th', year: 2011, text: 'Đại hồng thủy' },

  { c: 'uk', year: 1966, text: 'Vô địch World Cup' },
  { c: 'uk', year: 2012, text: 'Olympic London' },
  { c: 'uk', year: 2016, text: 'Trưng cầu Brexit' },

  { c: 'in', year: 1983, text: 'Vô địch World Cup cricket' },
  { c: 'in', year: 1991, text: 'Cải cách kinh tế' },
  { c: 'in', year: 2023, text: 'Tàu Chandrayaan-3 đáp xuống Mặt Trăng' },
];

/** Mốc tương lai theo dự báo dân số của LHQ (World Population Prospects 2024, phương án trung bình) */
export const FUTURE: Milestone[] = [
  { year: 2037, text: 'Thế giới khoảng 9 tỷ người (dự báo)' },
  { year: 2054, text: 'Dân số Ấn Độ đạt đỉnh (dự báo)' },
  { year: 2080, text: 'Người từ 65 tuổi nhiều hơn trẻ dưới 18 (dự báo)' },
  { year: 2084, text: 'Dân số thế giới đạt đỉnh khoảng 10,3 tỷ (dự báo)' },
];

export interface Weighted<T> {
  v: T;
  w: number;
}

export const FAMILIES: Weighted<{ id: string; name: string }>[] = [
  { v: { id: 'nong', name: 'Nhà nông' }, w: 25 },
  { v: { id: 'laodong', name: 'Lao động' }, w: 25 },
  { v: { id: 'trungluu', name: 'Công chức trung lưu' }, w: 25 },
  { v: { id: 'tieuthuong', name: 'Tiểu thương' }, w: 14 },
  { v: { id: 'mocoi', name: 'Mồ côi' }, w: 6 },
  { v: { id: 'haomon', name: 'Hào môn' }, w: 4 },
  { v: { id: 'trao', name: 'Bị tráo lúc sinh' }, w: 1 },
];

export const HOMES: Weighted<string>[] = [
  { v: 'Cởi mở', w: 70 },
  { v: 'Gia trưởng', w: 20 },
  { v: 'Bố mẹ ly thân', w: 10 },
];

export const TALENTS: Weighted<{ name: string; mul: number }>[] = [
  { v: { name: 'Thiên tài', mul: 2.0 }, w: 3 },
  { v: { name: 'Xuất sắc', mul: 1.5 }, w: 12 },
  { v: { name: 'Khá', mul: 1.2 }, w: 30 },
  { v: { name: 'Bình thường', mul: 0.9 }, w: 40 },
  { v: { name: 'Chậm', mul: 0.5 }, w: 15 },
];

export type Rarity = 'Thường' | 'Ít gặp' | 'Hiếm' | 'Sử thi' | 'Huyền thoại';
export const RARITY: Weighted<Rarity>[] = [
  { v: 'Thường', w: 58 },
  { v: 'Ít gặp', w: 28 },
  { v: 'Hiếm', w: 11 },
  { v: 'Sử thi', w: 2.9 },
  { v: 'Huyền thoại', w: 0.1 },
];

export const CARDS: Record<Rarity, string[]> = {
  Thường: ['Khỏe như vâm', 'Lanh lợi', 'Mồm mép', 'Mụn tuổi dậy thì', 'Ham ăn', 'Ngủ nhiều', 'Nghèo mà chí lớn'],
  'Ít gặp': ['Xui tận mạng', 'Nghiện mua sắm', 'Hút người theo đuổi', 'Mệnh cứng', 'Người tốt quá mức', 'Trời sinh u sầu'],
  Hiếm: ['Đốn ngộ', 'Thể trạng vàng', 'Ngậm thìa vàng', 'Đa tài mà đoản thọ'],
  'Sử thi': ['Hệ Thống', 'Người sống lại', 'Vai phụ bị viết chết'],
  'Huyền thoại': ['Nhân vật chính'],
};

export const ZODIAC: { name: string; sym: string; el: 'Lửa' | 'Đất' | 'Khí' | 'Nước'; from: [number, number] }[] = [
  { name: 'Ma Kết', sym: '♑', el: 'Đất', from: [12, 22] },
  { name: 'Bảo Bình', sym: '♒', el: 'Khí', from: [1, 20] },
  { name: 'Song Ngư', sym: '♓', el: 'Nước', from: [2, 19] },
  { name: 'Bạch Dương', sym: '♈', el: 'Lửa', from: [3, 21] },
  { name: 'Kim Ngưu', sym: '♉', el: 'Đất', from: [4, 20] },
  { name: 'Song Tử', sym: '♊', el: 'Khí', from: [5, 21] },
  { name: 'Cự Giải', sym: '♋', el: 'Nước', from: [6, 21] },
  { name: 'Sư Tử', sym: '♌', el: 'Lửa', from: [7, 23] },
  { name: 'Xử Nữ', sym: '♍', el: 'Đất', from: [8, 23] },
  { name: 'Thiên Bình', sym: '♎', el: 'Khí', from: [9, 23] },
  { name: 'Bọ Cạp', sym: '♏', el: 'Nước', from: [10, 23] },
  { name: 'Nhân Mã', sym: '♐', el: 'Lửa', from: [11, 22] },
];

export function zodiacOf(month: number, day: number) {
  // cung có ngày bắt đầu muộn nhất mà vẫn trước hoặc bằng ngày sinh; trước 20/1 là Ma Kết
  let best = ZODIAC[0];
  for (const z of ZODIAC.slice(1)) {
    const [m, d] = z.from;
    if (month > m || (month === m && day >= d)) best = z;
  }
  if (month === 12 && day >= 22) best = ZODIAC[0];
  return best;
}

export const STAT_NAMES = ['Nhan sắc', 'Trí tuệ', 'Tinh tế', 'Vận may', 'Sức khỏe', 'Áp lực'] as const;
export type StatName = (typeof STAT_NAMES)[number];
