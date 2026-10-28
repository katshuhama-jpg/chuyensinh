import type { Ctx } from './story';

/** tên người xem mắt (đổi theo từng đời) */
export const xemmatName = (x: Ctx) => {
  const m = ['Tuấn', 'Hoàng', 'Thắng', 'Đức', 'Việt', 'Trung', 'Khoa', 'Lâm'];
  const f = ['Thu', 'Hằng', 'Phương', 'Nga', 'Hiền', 'Ngọc', 'Trang', 'Loan'];
  const list = x.lg === 'm' ? m : f;
  return list[(x.s.seed ?? x.c.birthYear) % list.length];
};

/** các tỉnh phía Nam (từ Đồng Nai, Lâm Đồng trở vào) */
const SOUTH = ['TP. Hồ Chí Minh', 'Cần Thơ', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang', 'Lâm Đồng', 'Bình Dương', 'Bà Rịa - Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Sóc Trăng', 'Kiên Giang', 'Bạc Liêu', 'Hậu Giang', 'Trà Vinh', 'Bình Phước'];
export const isSouth = (province: string) => SOUTH.includes(province);
/** các tỉnh miền Trung */
const CENTER = ['Đà Nẵng', 'Huế', 'Quảng Trị', 'Quảng Ngãi', 'Khánh Hòa', 'Gia Lai', 'Đắk Lắk', 'Nghệ An', 'Hà Tĩnh', 'Quảng Nam', 'Quảng Bình', 'Thanh Hóa', 'Bình Định', 'Phú Yên', 'Kon Tum', 'Đắk Nông', 'Ninh Thuận', 'Bình Thuận'];
export const regionOf = (province: string): 'bac' | 'trung' | 'nam' => (isSouth(province) ? 'nam' : CENTER.includes(province) ? 'trung' : 'bac');
