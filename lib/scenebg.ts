/**
 * Chọn ảnh nền LPC cho từng cảnh (ảnh ghép sẵn trong /public/bg, xem scripts/bg/compose.py),
 * cùng mùa, đèn sáng lúc tối và hàng chân nhân vật đứng.
 */

import type { Bg, Place } from '@/components/Backdrop';
import type { Season } from '@/components/TileStage';

/** Nơi ngoài trời có 3 bộ theo mùa; mùa đông Việt Nam không có tuyết nên dùng cảnh thu */
const OUTDOOR: Partial<Record<Place, string>> = { ngo: 'ngo', cong: 'cong', congvien: 'congvien', vuon: 'que' };
const SHEET: Record<Season, string> = { xuan: 'spring', tet: 'spring', he: 'summer', thu: 'autumn', dong: 'autumn' };
const SEASONS: Season[] = ['xuan', 'he', 'thu', 'dong'];

/** Đèn sáng lúc chiều tối: [x, y, bán kính] theo px gốc 200x144 */
const LIGHTS: Partial<Record<Place, [number, number, number][]>> = {
  phong: [[35, 22, 22], [145, 50, 18]],
  net: [[28, 52, 14], [172, 52, 14], [28, 98, 14], [172, 98, 14], [126, 26, 20]],
  pho: [[52, 46, 26], [162, 46, 26]],
  ngo: [[190, 52, 24]],
  nha: [[112, 50, 18]],
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Nơi có bản đời cũ (trước 2008: bảng đen, màn hình CRT, tivi hộp, chưa có laptop) */
const OLD: Place[] = ['phong', 'nha', 'vanphong', 'lop', 'net'];

export function stageOf(bg: Bg, sceneId: string, year = 2020) {
  // mùa: Tết là xuân; còn lại cố định theo cảnh để chơi lại vẫn thấy cùng một mùa
  const season: Season = bg.tet ? 'tet' : SEASONS[hash(sceneId) % 4];
  const out = OUTDOOR[bg.place];
  const src = `/bg/${out ? `${out}_${SHEET[season]}` : bg.place}${!out && year < 2008 && OLD.includes(bg.place) ? '_old' : ''}.png`;
  return {
    src,
    // trong nhà không có hoa lá rơi, trừ ngày Tết
    season: out || bg.tet ? (season === 'dong' ? undefined : season) : undefined,
    lights: LIGHTS[bg.place] ?? [],
    feet: bg.place === 'pho' ? 114 : 132,
  };
}
