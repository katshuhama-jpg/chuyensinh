/**
 * Tặng quà (như Love Too Easily 2): mỗi người có gu riêng theo tính cách.
 * Đúng gu thì độ thân tăng mạnh, trúng thứ người ấy ghét thì giảm. Tặng đúng một lần là ghi vào Sổ tay.
 * Tên món quà đổi theo thời; quà đắt cần Tài chính đủ cao.
 */

import type { LoveId, StatKey } from './story';

export type GiftCat = 'hoa' | 'sach' | 'congnghe' | 'doan' | 'trangsuc' | 'handmade' | 'thethao' | 'amnhac' | 'trainghiem' | 'gaubong';

export const GIFT_CAT: Record<GiftCat, { label: string; icon: string; price: number; name: (y: number) => string }> = {
  hoa: { label: 'hoa', icon: '✿', price: 4, name: (y) => (y < 2000 ? 'Bó hoa hồng bọc giấy báo' : y <= 2026 ? 'Bó hoa hồng' : 'Hoa hồng không bao giờ héo') },
  sach: { label: 'sách', icon: '▤', price: 3, name: (y) => (y >= 2008 && y <= 2015 ? 'Bộ truyện ngôn tình đang hot' : y < 2000 ? 'Cuốn tiểu thuyết bìa cứng' : 'Cuốn sách hay vừa ra') },
  congnghe: {
    label: 'đồ công nghệ',
    icon: '▣',
    price: 10,
    name: (y) => (y < 2004 ? 'Đồng hồ điện tử' : y < 2012 ? 'Thẻ cào điện thoại và chiếc USB' : y <= 2026 ? 'Tai nghe không dây' : 'Kính thực tế ảo mini'),
  },
  doan: { label: 'đồ ăn', icon: '◒', price: 2, name: (y) => (y < 2000 ? 'Gói ô mai và hộp bánh quy' : y < 2012 ? 'Hộp bánh kem nhỏ' : y <= 2026 ? 'Trà sữa và bánh ngọt' : 'Hộp bánh in 3D') },
  trangsuc: { label: 'trang sức', icon: '◇', price: 12, name: (y) => (y < 2000 ? 'Chiếc đồng hồ đeo tay' : 'Chiếc nhẫn bạc khắc tên') },
  handmade: { label: 'quà tự làm', icon: '♥', price: 0, name: (y) => (y < 2004 ? 'Lọ hạc giấy tự gấp' : y < 2016 ? 'Chiếc khăn len tự đan' : 'Cuốn album ảnh tự làm') },
  thethao: { label: 'đồ thể thao', icon: '◎', price: 8, name: (y) => (y < 2000 ? 'Quả bóng da' : 'Đôi giày chạy bộ') },
  amnhac: { label: 'âm nhạc', icon: '♪', price: 3, name: (y) => (y < 2004 ? 'Băng cassette tự thu những bài hay' : y < 2012 ? 'Đĩa CD tự ghi' : 'Một playlist tự chọn kèm lời nhắn') },
  trainghiem: { label: 'chuyến đi, buổi xem', icon: '✈', price: 10, name: (y) => (y < 2000 ? 'Hai vé xem phim ở rạp' : y < 2016 ? 'Hai vé xem phim ở rạp mới' : 'Chuyến đi Đà Lạt hai ngày') },
  gaubong: { label: 'gấu bông', icon: '❀', price: 5, name: (y) => (y < 2000 ? 'Con búp bê vải' : 'Con gấu bông thật to') },
};

/** Gu quà của từng người: thích hai thứ, ghét một thứ, cộng một chỉ số của mình khi được tặng đúng */
export const GIFT_PREF: Record<LoveId, { likes: [GiftCat, GiftCat]; hates: GiftCat; why: string }> = {
  khoi: { likes: ['handmade', 'doan'], hates: 'trangsuc', why: 'quý những thứ có kỷ niệm, thấy đồ đắt tiền là xa cách' },
  long: { likes: ['thethao', 'amnhac'], hates: 'sach', why: 'sống bụi, mê bóng đá và nhạc, ngại chữ nghĩa' },
  minh: { likes: ['sach', 'congnghe'], hates: 'gaubong', why: 'thực tế, thích thứ dùng được, chê gấu bông trẻ con' },
  phong: { likes: ['thethao', 'sach'], hates: 'doan', why: 'giữ sức khỏe, ngại đồ ngọt' },
  hai: { likes: ['amnhac', 'handmade'], hates: 'congnghe', why: 'nghệ sĩ, thích thứ có hồn hơn máy móc' },
  tuananh: { likes: ['trainghiem', 'congnghe'], hates: 'gaubong', why: 'bận rộn, quý thời gian bên nhau và đồ chất lượng' },
  kai: { likes: ['doan', 'trainghiem'], hates: 'trangsuc', why: 'mê ẩm thực Việt và đi đây đi đó' },
  quan: { likes: ['handmade', 'hoa'], hates: 'congnghe', why: 'nhận quá nhiều quà đắt của fan, chỉ cảm động trước tấm lòng' },
  bao: { likes: ['doan', 'gaubong'], hates: 'hoa', why: 'vui tính, thích đồ ăn và thứ ngộ nghĩnh, thấy hoa sến' },
  duy: { likes: ['sach', 'trainghiem'], hates: 'trangsuc', why: 'thích những chuyến đi và câu chuyện' },
  hung: { likes: ['doan', 'handmade'], hates: 'trangsuc', why: 'cả ngày bị quà đắt tiền vây quanh, chỉ thèm bữa cơm nhà và món quà tự tay làm' },
  tai: { likes: ['amnhac', 'trainghiem'], hates: 'congnghe', why: 'sống bằng âm nhạc, thích về quê, sợ điện thoại vì mỗi lần mở lên lại bị chửi' },
};

/** Món quà tự làm tốn công: cần Tình cảm đủ cao mới làm đẹp được */
export const HANDMADE_NEED: StatKey = 'tinh';

/** 5 món bày trong "cửa hàng" lượt này: luôn có ít nhất một món người ấy thích, xoay vòng theo tuổi */
export function shelfOf(id: LoveId, age: number, n: number): GiftCat[] {
  const all = Object.keys(GIFT_CAT) as GiftCat[];
  const pref = GIFT_PREF[id];
  const start = (age * 7 + n * 3 + id.length) % all.length;
  const rot = [...all.slice(start), ...all.slice(0, start)];
  const like = pref.likes[(age + n) % 2];
  const out = [like, ...rot.filter((c) => c !== like)].slice(0, 5);
  // xáo vị trí món thích cho khỏi luôn đứng đầu
  const k = (age + n * 2) % 5;
  [out[0], out[k]] = [out[k], out[0]];
  return out;
}
