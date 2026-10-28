/**
 * Tin thời sự theo năm: hiện thành dải "TIN NÓNG" trên khung cảnh.
 * Đến 2026 là tin thật (chỉ nêu sự kiện, không gán lời hay chuyện tình cảm cho người thật).
 * Từ 2027 là tin giả định, ghi rõ "(giả định)".
 */

const REAL: Record<number, string> = {
  1975: 'Ngày 30/4, đất nước thống nhất.',
  1976: 'Quốc hội đặt tên nước là Cộng hòa xã hội chủ nghĩa Việt Nam.',
  1980: 'Phi công Phạm Tuân là người Việt Nam đầu tiên bay vào vũ trụ.',
  1986: 'Đại hội VI mở đầu công cuộc Đổi mới.',
  1989: 'Bức tường Berlin sụp đổ.',
  1991: 'Liên Xô tan rã.',
  1994: 'Mỹ bỏ cấm vận kinh tế với Việt Nam.',
  1995: 'Việt Nam gia nhập ASEAN, bình thường hóa quan hệ với Mỹ.',
  1997: 'Internet chính thức có mặt tại Việt Nam (19/11).',
  1999: 'Cả thế giới lo "sự cố máy tính năm 2000" (Y2K).',
  2000: 'Thế giới bước sang thiên niên kỷ mới.',
  2003: 'Việt Nam lần đầu đăng cai SEA Games (SEA Games 22).',
  2004: 'Viettel ra mạng di động, cước rẻ, nhắn tin bùng nổ.',
  2005: 'Trang chia sẻ video YouTube ra đời.',
  2006: 'Hà Nội đăng cai Hội nghị APEC.',
  2007: 'Apple ra mắt iPhone. Việt Nam gia nhập WTO.',
  2008: 'Việt Nam vô địch AFF Cup, cả nước đi bão.',
  2009: 'Mạng 3G đầu tiên được cấp phép ở Việt Nam.',
  2010: 'Đại lễ 1000 năm Thăng Long - Hà Nội.',
  2011: 'Giá vàng lập kỷ lục. Facebook bắt đầu bùng nổ ở Việt Nam.',
  2012: '"Gangnam Style" thành video đầu tiên đạt 1 tỷ lượt xem. Zalo ra mắt.',
  2013: 'SK Telecom T1 vô địch Chung kết Thế giới Liên Minh Huyền Thoại.',
  2014: 'Game Flappy Bird của một lập trình viên Việt gây sốt toàn cầu.',
  2015: 'SK Telecom T1 vô địch Chung kết Thế giới LMHT lần thứ hai.',
  2016: 'Pokémon GO gây sốt. SK Telecom T1 vô địch CKTG LMHT lần thứ ba.',
  2017: 'Mạng 4G phủ sóng toàn quốc. Đà Nẵng đăng cai APEC.',
  2018: 'U23 Việt Nam á quân châu Á giữa tuyết trắng Thường Châu. Việt Nam vô địch AFF Cup.',
  2019: 'Hà Nội tổ chức Hội nghị thượng đỉnh Mỹ - Triều Tiên.',
  2020: 'Đại dịch COVID-19, cả nước giãn cách.',
  2021: 'Tuyến metro Cát Linh - Hà Đông chạy chính thức.',
  2022: 'ChatGPT ra mắt. Việt Nam đăng cai SEA Games 31.',
  2023: 'T1 cùng Faker vô địch Chung kết Thế giới LMHT lần thứ tư.',
  2024: 'T1 vô địch CKTG LMHT lần thứ năm. Metro Bến Thành - Suối Tiên chạy chính thức.',
  2025: 'T1 vô địch CKTG LMHT ba năm liên tiếp, Faker giành danh hiệu thứ sáu. Kỷ niệm 80 năm Quốc khánh.',
  2026: 'World Cup 2026 tổ chức ở Mỹ, Canada và Mexico, lần đầu có 48 đội.',
};

const FUTURE = [
  'Xe tự lái chạy thử trên cao tốc Bắc - Nam',
  'Trợ lý AI được cấp "căn cước số" để đi làm hộ chủ',
  'Thành phố nổi đầu tiên của Việt Nam đón cư dân',
  'Kính thực tế ảo rẻ hơn điện thoại',
  'Tàu cao tốc Bắc - Nam chạy chuyến đầu tiên',
  'Người Việt đầu tiên đặt chân lên Mặt Trăng',
  'Robot giúp việc có mặt trong một nửa số hộ gia đình',
  'Đội tuyển Việt Nam dự World Cup',
];

export function newsOf(year: number): string | null {
  if (year <= 2026) return REAL[year] ?? null;
  return `(giả định) ${FUTURE[year % FUTURE.length]}.`;
}

/** Năm T1 vô địch Chung kết Thế giới LMHT (đến 2025) */
export const LOL_WORLDS = [2013, 2015, 2016, 2023, 2024, 2025];
