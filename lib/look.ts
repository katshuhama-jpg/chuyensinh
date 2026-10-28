import type { Layer } from './lpc';
import { HAIRS, type Gender, type Look } from './character';

export type Stage = 'child' | 'adult' | 'elder';

/** Màu da nhân lên ảnh gốc (dấu * là nhuộm nhân, giữ sắc độ) */
const SKIN = [undefined, '*#e6c3a0', '*#b98a66', '*#7d5640'];

/** Đồ theo phong cách: [áo, quần] cho nữ và nam */
const OUTFIT: Record<Look['style'], Record<Gender, [string, string]>> = {
  nangdong: { f: ['tshirt_f', 'shorts_f'], m: ['tshirt_m', 'shorts_m'] },
  nhenhang: { f: ['blouse_f', 'skirt_f'], m: ['polo_m', 'slacks_m'] },
  thanhlich: { f: ['cardigan_f', 'slacks_f'], m: ['formal_m', 'slacks_m'] },
  catinh: { f: ['tshirt_f', 'pants'], m: ['cardigan_m', 'pants_m'] },
};
/** quần hoặc váy đi kèm, nhuộm màu này cho hợp áo */
const BOTTOM_TINT: Record<Look['style'], string> = {
  nangdong: '#3b4f7a',
  nhenhang: '#e8e1d0',
  thanhlich: '#30343f',
  catinh: '#1e2028',
};

/** Danh sách lớp ảnh LPC theo nhân vật người chơi tạo. Ghép bằng lib/lpc.ts. */
export function lpcLayers(look: Look, gender: Gender, stage: Stage = 'adult'): Layer[] {
  const skin = SKIN[look.skin] ?? undefined;
  const hairDef = HAIRS.find((h) => h.id === look.hair) ?? HAIRS[0];
  const hair = stage === 'elder' ? '#b9b4ab' : look.hairColor;
  const male = gender === 'm';
  // cá tính thì áo tối, các kiểu khác áo theo màu chủ đạo
  const topTint = look.style === 'catinh' ? '#30343f' : look.color;
  const bottomTint = look.style === 'catinh' ? look.color : BOTTOM_TINT[look.style];

  if (stage === 'child') {
    return [
      { key: 'body_child', tint: skin },
      { key: 'head_c', tint: skin },
      { key: 'eyes_c' },
      { key: !male && look.style === 'nhenhang' ? 'skirt_c' : 'pants_c', tint: bottomTint },
      { key: 'shirt_c', tint: topTint },
      // tóc dài gợn sóng chỉ cho bé gái
      { key: `hairc_${male && hairDef.child === 'wavy' ? 'parted_side_bangs' : hairDef.child}`, tint: hair },
    ];
  }

  const elder = stage === 'elder';
  const [top, bottom] = OUTFIT[look.style][gender];
  const out: Layer[] = [];
  if (hairDef.bg) out.push({ key: `hair_${hairDef.id}_bg`, tint: hair });
  out.push(
    { key: male ? 'body_male' : 'body_adult', tint: skin },
    { key: male ? (elder ? 'head_me' : 'head_m') : elder ? 'head_fe' : 'head_f', tint: skin },
    { key: `eyes_${look.eyes}` },
  );
  if (!elder) out.push({ key: `nose_${look.nose}`, tint: skin });
  out.push({ key: `brow_${look.brow}`, tint: hair });
  out.push({ key: bottom, tint: bottomTint });
  out.push({ key: male ? 'shoes_m' : 'shoes_f', tint: '#3a3330' });
  // sơ mi trắng công sở giữ màu gốc
  out.push({ key: top, tint: top === 'formal_m' ? undefined : topTint });
  if (male && (look.extra === 'stubble' || look.extra === 'stache' || look.extra === 'beard_trim')) out.push({ key: look.extra, tint: hair });
  out.push({ key: `hair_${hairDef.id}_fg`, tint: hair });
  if (look.extra === 'earrings') out.push({ key: 'earrings' });
  return out;
}
