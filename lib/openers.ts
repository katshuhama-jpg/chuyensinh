/**
 * Câu mở chương theo hoàn cảnh từng đời: nơi sinh (phố / quê, Bắc / Trung / Nam / miền núi),
 * thời kỳ, gia cảnh, bố mẹ, anh chị em. Chương 1 có 30 câu, các chương sau mỗi chương 8 câu.
 * Mỗi đời chọn cố định một câu trong số các câu hợp hoàn cảnh.
 */

import type { Ctx } from './story';

type Line = { t: string; if?: (x: Ctx) => boolean; generic?: boolean };

const SOUTH = ['TP. Hồ Chí Minh', 'Cần Thơ', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang'];
const CENTRAL = ['Đà Nẵng', 'Huế', 'Quảng Trị', 'Quảng Ngãi', 'Khánh Hòa', 'Nghệ An', 'Hà Tĩnh', 'Thanh Hóa'];
const HIGHLAND = ['Lào Cai', 'Lạng Sơn', 'Cao Bằng', 'Tuyên Quang', 'Sơn La', 'Điện Biên', 'Lai Châu', 'Gia Lai', 'Đắk Lắk', 'Lâm Đồng'];
const SEA = ['Hải Phòng', 'Đà Nẵng', 'Quảng Ninh', 'Khánh Hòa', 'Quảng Ngãi', 'Cà Mau'];

const south = (x: Ctx) => SOUTH.includes(x.f.province);
const central = (x: Ctx) => CENTRAL.includes(x.f.province);
const highland = (x: Ctx) => HIGHLAND.includes(x.f.province);
const sea = (x: Ctx) => SEA.includes(x.f.province);
const city = (x: Ctx) => x.f.urban;
const rural = (x: Ctx) => !x.f.urban;
const y = (x: Ctx) => x.c.birthYear;

const LINES: Record<string, Line[]> = {
  'Tuổi thơ': [
    { t: 'Những mùa hè trong ngõ nhỏ', if: (x) => city(x) && !south(x) },
    { t: 'Tiếng ve, cánh diều và con đường đất đỏ', if: rural },
    { t: 'Xếp hàng tem phiếu, chờ bố mẹ tan ca', if: (x) => y(x) < 1984 },
    { t: 'Chiếc tivi đen trắng cả xóm xem chung', if: (x) => y(x) < 1990 },
    { t: 'Băng cassette, kẹo kéo và trò ô ăn quan', if: (x) => y(x) >= 1984 && y(x) < 1996 },
    { t: 'Phim hoạt hình chiều chủ nhật và chiếc xe đạp mini', if: (x) => y(x) >= 1988 && y(x) < 2000 },
    { t: 'Truyện tranh thuê, quán net đầu ngõ, điểm mười đầu tiên', if: (x) => y(x) >= 1995 && y(x) < 2006 },
    { t: 'Điện thoại của mẹ, trò chơi trên máy tính bảng', if: (x) => y(x) >= 2008 && y(x) <= 2020 },
    { t: 'Lớp học online và những ngày không được ra sân', if: (x) => y(x) >= 2008 && y(x) <= 2015 },
    { t: 'Trợ lý AI kể chuyện cổ tích trước giờ ngủ', if: (x) => y(x) > 2020 },
    { t: 'Đom đóm, ruộng lúa và những buổi tắm sông', if: (x) => rural(x) && !highland(x) },
    { t: 'Ghe xuồng, mùa nước nổi và những trưa trốn ngủ', if: (x) => south(x) && rural(x) },
    { t: 'Hẻm nhỏ Sài Gòn, xe bánh mì đầu hẻm', if: (x) => x.f.province === 'TP. Hồ Chí Minh' },
    { t: 'Phố cổ, gánh hàng rong và tiếng rao đêm', if: (x) => x.f.province === 'Hà Nội' },
    { t: 'Gió Lào, nắng cháy và nồi cơm độn khoai', if: (x) => central(x) && rural(x) },
    { t: 'Biển, cát trắng và những con còng gió', if: sea },
    { t: 'Sương núi, chợ phiên và tiếng khèn xa', if: highland },
    { t: 'Đồi chè, sương sớm và con đường lên trường', if: (x) => highland(x) || x.f.province === 'Thái Nguyên' || x.f.province === 'Phú Thọ' },
    { t: 'Ông bà, bếp củi và những câu chuyện ngày xưa', if: (x) => x.f.parents === 'Không còn bố mẹ' || x.f.wealth.startsWith('Mồ côi') },
    { t: 'Những cuộc gọi đường dài của bố mẹ phương xa', if: (x) => x.f.parents === 'Bố mẹ đi làm xa' },
    { t: 'Hai mái nhà và một chiếc cặp sách', if: (x) => x.f.parents === 'Bố mẹ ly thân' },
    { t: 'Bữa cơm không được nói chuyện và những trận đòn roi', if: (x) => x.f.parents === 'Gia trưởng' },
    { t: 'Nhà đông anh em, áo cũ chuyền tay nhau', if: (x) => x.f.siblings.length >= 3 },
    { t: 'Con một, cả nhà xoay quanh một đứa trẻ', if: (x) => x.f.siblings.length === 0 },
    { t: 'Cổng sắt, chú bảo vệ và lớp năng khiếu cuối tuần', if: (x) => x.f.wealth === 'Hào môn' || x.f.wealth === 'Khá giả' },
    { t: 'Sạp hàng ngoài chợ, nơi mẹ ngồi từ sáng sớm', if: (x) => x.f.wealth === 'Tiểu thương' },
    { t: 'Đồng lương của bố và những bữa cơm đủ đầy', if: (x) => x.f.wealth === 'Công chức trung lưu' },
    { t: 'Ruộng nhà, con trâu và mùa gặt', if: (x) => x.f.wealth === 'Nhà nông' },
    { t: 'Khu trọ công nhân, nơi bố mẹ đi làm từ tờ mờ sáng', if: (x) => x.f.wealth === 'Lao động phổ thông' && city(x) },
    { t: 'Ngày Tết đầu tiên còn nhớ được', generic: true },
  ],
  'Tuổi teen': [
    { t: 'Cảm nắng, thi cử và một giọng nói lạ' },
    { t: 'Lưu bút, hoa phượng và những lá thư không gửi', if: (x) => y(x) + 15 < 2006 },
    { t: 'Tin nhắn nửa đêm và dòng trạng thái để ai đó đọc', if: (x) => y(x) + 15 >= 2004 && y(x) + 15 < 2015 },
    { t: 'Trang confession, ảnh tự sướng và một cái tên trong lòng', if: (x) => y(x) + 15 >= 2013 && y(x) + 15 <= 2026 },
    { t: 'Đạp xe qua cổng trường, giả vờ không nhìn', if: (x) => y(x) + 15 < 2012 },
    { t: 'Lò luyện thi, ánh đèn khuya và giấc mơ đại học', if: (x) => y(x) + 17 >= 1995 && y(x) + 17 <= 2014 },
    { t: 'Đi học xa nhà, ở trọ lần đầu', if: rural },
    { t: 'Mười lăm tuổi, cả thế giới như đang thay đổi', if: () => true },
  ],
  'Tuổi trẻ': [
    { t: 'Yêu, hẹn hò, và những ngã rẽ' },
    { t: 'Thành phố lớn, phòng trọ nhỏ và trái tim rộng', if: rural },
    { t: 'Những buổi hẹn bên hồ và chiếc xe đạp cũ', if: (x) => y(x) + 20 < 1998 },
    { t: 'Quẹt trái, quẹt phải và những người lạ', if: (x) => y(x) + 20 >= 2015 && y(x) + 20 <= 2026 },
    { t: 'Đi làm, đi yêu, đi tìm chính mình', if: () => true },
    { t: 'Những năm hai mươi, mỗi người một ngã', if: () => true },
    { t: 'Người cũ, người mới và người còn chưa gặp', if: () => true },
    { t: 'Yêu một người qua màn hình kính', if: (x) => y(x) + 20 > 2026 },
  ],
  'Lập gia đình': [
    { t: 'Cơm áo, nhà chồng nhà vợ, con cái' },
    { t: 'Một mái nhà, hai người lạ hóa thân quen', if: () => true },
    { t: 'Tiền nhà, tiền học và những đêm không ngủ', if: (x) => y(x) + 32 >= 2010 },
    { t: 'Bốn thế hệ dưới một mái nhà', if: (x) => y(x) + 30 < 2005 },
    { t: 'Ra ở riêng, căn hộ nhỏ, giấc mơ lớn', if: (x) => y(x) + 30 >= 2005 },
    { t: 'Ba mươi tuổi, đời bắt đầu hỏi những câu khó', if: () => true },
    { t: 'Những người ở lại sau mùa cưới', if: () => true },
    { t: 'Con cái, sự nghiệp và người cũ gõ cửa', if: () => true },
  ],
  'Tuổi già': [
    { t: 'Những người còn ở lại' },
    { t: 'Tóc bạc, trà chiều và những tấm ảnh cũ', if: () => true },
    { t: 'Con cháu đi xa, nhà rộng thêm', if: () => true },
    { t: 'Nhìn lại một đời đã rẽ lối', if: () => true },
    { t: 'Ngõ cũ, người xưa và tiếng ve năm nào', if: (x) => city(x) },
    { t: 'Mảnh vườn quê, nơi lại về sau cả đời đi xa', if: rural },
    { t: 'Những mùa xuân cuối cùng còn đủ mặt', if: () => true },
    { t: 'Robot pha trà, cháu chắt gọi hình ba chiều', if: (x) => y(x) + 60 > 2040 },
  ],
};

function hash(s: string) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Câu mở chương cho đời này: chọn cố định trong những câu hợp hoàn cảnh */
export function openerOf(chapter: string, x: Ctx): string {
  const all = (LINES[chapter] ?? []).filter((l) => !l.if || l.if(x));
  // câu chung chỉ dùng khi ít câu riêng hợp hoàn cảnh
  const pool = all.filter((l) => !l.generic).length >= 2 ? all.filter((l) => !l.generic) : all;
  if (!pool.length) return '';
  return pool[hash(`${x.c.name}|${x.c.birthYear}|${x.f.province}|${chapter}`) % pool.length].t;
}
