/**
 * Mỗi người yêu có cuộc đời riêng: dù không gặp, dù đã buông tay, năm nào họ cũng đi tiếp.
 * Gặp lại sau mười năm thì người ấy đã khác: đổi nghề, chuyển nhà, có khi đã có gia đình.
 */

import type { Ctx, LoveId } from './story';

/** các mốc đời của từng người theo tuổi (bằng tuổi mình, riêng sếp hơn 5 tuổi) */
const LIFE: Record<LoveId, [number, string][]> = {
  khoi: [[18, 'thi đỗ đại học Bách khoa'], [23, 'về làm kỹ sư ở Đà Nẵng'], [29, 'mở một xưởng cơ khí nhỏ'], [40, 'về lại ngõ cũ, sửa sang nhà bố mẹ'], [55, 'mở lớp dạy làm diều cho trẻ con trong phố']],
  long: [[18, 'bỏ học, ra tiệm sửa xe của chú'], [23, 'mở tiệm xe riêng'], [28, 'bỏ hẳn đua xe đêm'], [36, 'có ba tiệm xe ở ba quận'], [55, 'dẫn đoàn phượt cho người về hưu']],
  minh: [[18, 'đỗ thủ khoa đầu vào'], [22, 'đi học thạc sĩ nước ngoài'], [28, 'về nước làm nghiên cứu'], [38, 'lên phó giáo sư'], [55, 'viết sách cho học sinh']],
  phong: [[18, 'vào trường Y'], [24, 'ra trường, trực đêm liên tục'], [30, 'lên bác sĩ chính'], [42, 'làm trưởng khoa'], [58, 'về quê mở phòng khám nhỏ']],
  hai: [[18, 'bỏ học đi hát quán'], [24, 'ra album đầu tay, bán được 200 bản'], [30, 'có một bài hát bỗng nổi tiếng'], [40, 'mở quán nhạc của riêng mình'], [55, 'dạy đàn cho con hàng xóm']],
  tuananh: [[22, 'du học về'], [27, 'lên giám đốc công ty của bố'], [33, 'mở công ty riêng'], [42, 'lên báo kinh tế'], [58, 'bán công ty, đi trồng cà phê']],
  kai: [[20, 'sang Việt Nam du học'], [26, 'ở lại Việt Nam làm việc'], [32, 'nói tiếng Việt giọng địa phương'], [45, 'mở trường dạy ngoại ngữ'], [60, 'nhập quốc tịch Việt Nam']],
  quan: [[18, 'đi thi tuyển thực tập sinh'], [22, 'ra mắt, nổi tiếng sau một đêm'], [30, 'bị scandal, rút khỏi showbiz một năm'], [35, 'quay lại, đóng phim điện ảnh'], [50, 'làm giám khảo gameshow']],
  bao: [[22, 'đi làm văn phòng'], [28, 'lên trưởng nhóm'], [35, 'làm clip hài cho công ty, bất ngờ nổi tiếng'], [45, 'mở kênh hài riêng'], [58, 'vẫn kể chuyện cười dở nhất phố']],
  duy: [[20, 'đi tàu xuyên Việt một mình'], [26, 'làm nhiếp ảnh tự do'], [32, 'ra sách ảnh về những sân ga'], [45, 'mở homestay cạnh một ga nhỏ'], [60, 'vẫn đi tàu mỗi tháng']],
  hung: [[20, 'ra mắt showbiz'], [25, 'thành ngôi sao hạng A'], [32, 'tự lập công ty giải trí'], [40, 'giảm show, dành thời gian cho mèo và game'], [55, 'đi làm từ thiện khắp nơi']],
  tai: [[20, 'nổi lên từ một clip'], [24, 'ra bài hát đầu tiên'], [30, 'vượt qua anti-fan, đi tour cả nước'], [40, 'về quê mở trường dạy nhạc'], [55, 'hát cho đám cưới của bà con miễn phí']],
};

/** Dạo này người ấy thế nào (theo tuổi hiện tại; đã buông hoặc lâu không gặp thì có thể đã có gia đình) */
export function lifeOf(id: LoveId, x: Ctx): string | null {
  const age = id === 'tuananh' ? x.age + 5 : x.age;
  const steps = LIFE[id].filter(([a]) => a <= age);
  if (!steps.length) return null;
  let t = steps[steps.length - 1][1];
  const gone = x.has(`${id}_out`);
  const mine = x.s.partner === id;
  if (!mine && (gone || !x.s.met.includes(id)) && age >= 32) t += x.s.love[id] >= 50 && !x.s.married ? ', vẫn một mình' : ', đã có gia đình';
  return t;
}

/** Một dòng tin về một người cũ, cho đầu năm (chọn người lâu không gặp) */
export function newsOfLoves(x: Ctx): string | null {
  const ids = x.s.met.filter((id) => x.s.partner !== id && x.has(`${id}_out`));
  if (!ids.length) return null;
  const id = ids[(x.age * 7) % ids.length];
  const t = lifeOf(id, x);
  return t ? `Nghe tin ${x.L(id)}: ${t}.` : null;
}
