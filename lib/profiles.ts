/**
 * Hồ sơ đời thường của từng người yêu: ở đâu, đi xe gì.
 * Theo nghề, gia cảnh và năm đang sống (xe đạp, Cub, Dream, Wave, xe ga, ô tô, xe điện, xe tự lái),
 * để đúng logic: học bá còn đi học thì đạp xe, sếp lớn thì mới có ô tô, ngôi sao thì tránh fan.
 */

import { LOVES, type Ctx, type LoveId } from './story';

/** y: năm, f: người ấy là nữ, a: tuổi người ấy */
type P = { home: (y: number, f: boolean, a: number) => string; ride: (y: number, f: boolean) => string };

const fut = (y: number) => y > 2026;

const PROFILE: Record<LoveId, P> = {
  khoi: {
    home: (y) => (y < 2005 ? 'nhà ống hai tầng trong ngõ, sát vách nhà mình' : 'vẫn căn nhà trong ngõ cũ, giờ sơn lại màu xanh'),
    ride: (y) => (y < 1993 ? 'xe đạp Phượng Hoàng của bố' : y < 1999 ? 'Cub 81 cũ của bố, hay chở mình đi học thêm' : y < 2012 ? 'Wave cũ, hay chở mình đi học thêm' : fut(y) ? 'xe máy điện tự cân bằng' : 'Vision trắng, mũ bảo hiểm luôn có hai cái'),
  },
  long: {
    home: (y, f) => (f ? 'phòng trọ trên tầng thượng, cửa dán đầy sticker' : 'gác xép trên tiệm sửa xe của chú'),
    ride: (y) => (y < 2000 ? 'xe đạp tự độ, phanh chân' : y < 2006 ? 'Dream độ ống pô, nổ to cả phố' : fut(y) ? 'mô tô điện tự độ đèn neon' : 'Exciter độ, dán decal đỏ'),
  },
  minh: {
    home: (y, f, a) => (a < 18 || y < 2005 ? 'nhà tập thể của bố mẹ là giáo viên' : a < 23 ? 'ký túc xá, giường tầng chất đầy sách' : 'căn hộ thuê gần trường đại học, giá sách kín tường'),
    ride: (y) => (y < 2008 ? 'xe đạp, đi đúng giờ không sai một phút' : y < 2018 ? 'xe buýt, vừa đi vừa đọc sách' : fut(y) ? 'tàu điện ngầm' : 'xe máy điện, sạc ở nhà'),
  },
  phong: {
    home: (y, f, a) => (a < 18 ? 'nhà bố mẹ trong khu tập thể bệnh viện' : a < 24 ? 'ký túc xá trường Y, đêm nào cũng học đến khuya' : y < 2005 ? 'phòng trong khu tập thể bệnh viện' : 'căn hộ chung cư gần bệnh viện, tủ lạnh chỉ có nước và trái cây'),
    ride: (y) => (y < 1999 ? 'Cub 50 cũ' : y < 2012 ? 'Wave, luôn để sẵn áo mưa' : y < 2016 ? 'Air Blade' : fut(y) ? 'ô tô điện tự lái, ngủ bù trên đường đi trực' : 'ô tô cũ mua trả góp, để đi trực đêm'),
  },
  hai: {
    home: (y, f) => (f ? 'phòng trọ gác lửng, tường dán poster nhạc cũ' : 'phòng trọ gác xép, nửa phòng là đàn với loa'),
    ride: (y) => (y < 2002 ? 'xe đạp, đeo đàn sau lưng' : fut(y) ? 'xe đạp điện, chở đàn phía sau' : 'xe máy cũ mua lại, đề mãi mới nổ'),
  },
  tuananh: {
    home: (y) => (y < 2010 ? 'nhà phố mặt đường, tầng một cho thuê' : fut(y) ? 'căn hộ thông minh trên tầng 50' : 'căn hộ cao cấp tầng 30, nhìn xuống cả thành phố'),
    ride: (y, f) => (y < 2003 ? 'Dream Thái, thời đó là cả gia tài' : y < 2008 ? 'SH nhập khẩu' : fut(y) ? 'ô tô điện tự lái màu đen' : f ? 'ô tô sedan trắng, tự lái' : 'ô tô sedan đen có tài xế'),
  },
  kai: {
    home: (y) => (y < 2010 ? 'nhà trọ sinh viên quốc tế' : 'homestay trong hẻm, thích nghe chủ nhà kể chuyện'),
    ride: (y) => (y < 2005 ? 'xe đạp thuê theo tháng' : y < 2016 ? 'xe máy thuê, vẫn đang tập đi' : fut(y) ? 'xe đạp công cộng thông minh' : 'Grab, gọi hoài thành khách quen'),
  },
  quan: {
    home: () => 'biệt thự cổng kín, có bảo vệ trực đêm',
    ride: (y) => (y < 2003 ? 'Dream, đeo khẩu trang kín mặt' : y < 2010 ? 'SH đen, đi cùng quản lý' : fut(y) ? 'ô tô bay riêng' : 'ô tô 7 chỗ kính tối màu'),
  },
  bao: {
    home: () => 'nhà thuê ở chung với hai đồng nghiệp, tủ lạnh dán đầy giấy nhắn',
    ride: (y) => (y < 2002 ? 'xe đạp mini' : y < 2012 ? 'Wave Alpha' : fut(y) ? 'xe máy điện dán sticker hài' : 'Vision đỏ, móc khóa con vịt'),
  },
  duy: {
    home: () => 'phòng thuê gần ga tàu, cửa sổ nhìn ra đường ray',
    ride: (y) => (y < 2005 ? 'tàu hỏa và đôi chân' : fut(y) ? 'tàu cao tốc Bắc - Nam' : 'xe máy cũ, hay đi một mình xuyên Việt'),
  },
  hung: {
    home: (y, f) => (y < 2008 ? 'biệt thự nhỏ trong hẻm kín, cổng luôn đóng' : f ? 'căn hộ penthouse kín tiếng, phòng khách toàn sách kịch bản' : 'căn hộ penthouse kín tiếng, có cả phòng riêng cho mèo'),
    ride: (y) => (y < 2016 ? 'ô tô có tài xế, ra phố thì đội mũ lưỡi trai' : fut(y) ? 'ô tô tự lái kính tối, nhưng thích đi bộ ban đêm' : 'ô tô có tài xế, trốn fan thì gọi xe ôm công nghệ'),
  },
  tai: {
    home: (y, f) => (f ? 'căn hộ thuê, nửa phòng là quần áo đi diễn' : 'nhà vườn ven sông ở quê, mới cơi thêm phòng thu nhỏ'),
    ride: (y, f) => (f ? (fut(y) ? 'xe điện màu hồng' : 'xe ga màu hồng, ai cũng nhận ra') : 'xuồng máy ở quê, lên phố thì Wave cũ'),
  },
};

/** Nhà ở và xe của người ấy, đúng năm hiện tại */
export function profileOf(id: LoveId, x: Ctx) {
  const p = PROFILE[id];
  const f = x.lg === 'f';
  const a = ageOfLove(id, x.age);
  // còn nhỏ thì chưa có xe riêng; dưới 18 chưa được đi xe máy trên 50 phân khối
  const ride = a < 16 ? (x.year < 1995 ? 'đi bộ đến trường' : 'ngồi sau xe bố mẹ đi học') : a < 18 ? (x.year < 2010 ? 'xe đạp' : 'xe đạp điện') : p.ride(x.year, f);
  return { home: p.home(x.year, f, a), ride };
}

/** Tuổi người ấy: sếp hơn 5 tuổi, còn lại bằng tuổi mình */
export const ageOfLove = (id: LoveId, age: number) => (id === 'tuananh' ? age + 5 : age);

/** Nghề / vai của người ấy theo tuổi và năm (học bá lớn lên thì đi làm, du học sinh ở lại thì thôi là du học sinh) */
export function jobOf(id: LoveId, lg: 'm' | 'f', age: number, year: number): string {
  const a = ageOfLove(id, age);
  const g = (m: string, f: string) => (lg === 'm' ? m : f);
  switch (id) {
    case 'minh':
      return a < 18 ? g('cậu bạn học giỏi nhất lớp', 'cô bạn học giỏi nhất lớp') : a < 23 ? 'sinh viên trường top' : g('kỹ sư nghiên cứu', 'giảng viên đại học');
    case 'phong':
      return a < 18 ? 'học sinh chuyên Sinh' : a < 24 ? 'sinh viên trường Y' : g('bác sĩ', 'bác sĩ');
    case 'kai':
      return a < 26 ? 'du học sinh' : g('anh Tây ở lại Việt Nam', 'cô Tây ở lại Việt Nam');
    case 'long':
      return a < 20 ? g('boy phố', 'chị đại') : g('thợ sửa xe, boy phố', 'chủ tiệm sửa xe, chị đại');
    case 'tuananh':
      return a < 26 ? g('thiếu gia mới về nước', 'tiểu thư mới về nước') : g('tổng tài', 'nữ giám đốc');
    case 'hung':
      return year < 2012 ? g('ca sĩ có album bán chạy nhất năm', 'nữ diễn viên phim truyền hình giờ vàng') : year < 2017 ? g('ca sĩ MV triệu view', 'nữ diễn viên phim ăn khách') : LOVES.hung.job[lg === 'm' ? 0 : 1];
    default:
      return LOVES[id].job[lg === 'm' ? 0 : 1];
  }
}

/** Chỉ số của từng người yêu (cố định theo tính cách), cùng 5 trục với biểu đồ của người chơi */
export const PERSONA: Record<LoveId, [number, number, number, number, number]> = {
  // Nhan sắc, Thông minh, Nổi loạn, Tài chính, Tâm lý
  khoi: [60, 55, 30, 40, 80],
  long: [72, 40, 90, 35, 55],
  minh: [65, 95, 20, 50, 45],
  phong: [68, 85, 25, 70, 85],
  hai: [70, 60, 75, 15, 60],
  tuananh: [75, 85, 35, 95, 50],
  kai: [78, 65, 70, 55, 85],
  quan: [95, 55, 50, 90, 40],
  bao: [55, 60, 45, 45, 95],
  duy: [70, 70, 60, 35, 70],
  hung: [92, 70, 65, 95, 45],
  tai: [80, 50, 80, 40, 75],
};
export const PERSONA_AXES = ['Nhan sắc', 'Thông minh', 'Nổi loạn', 'Tài chính', 'Tâm lý'];
