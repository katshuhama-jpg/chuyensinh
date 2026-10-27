import type { Layer } from './lpc';
import type { Look } from './game/roll';
import type { Gender } from './game/world';

export type Stage = 'child' | 'adult' | 'elder';

/** Màu da nhân lên ảnh gốc (dấu * là nhuộm nhân, giữ sắc độ) */
const SKIN = [undefined, '*#e6c3a0', '*#b98a66', '*#7d5640'];

const HAIR_F = ['ponytail', 'shoulderl', 'long_straight', 'bunches', 'loose', 'half_up', 'bangs_bun', 'curtains_long'];
const HAIR_M = ['buzzcut', 'unkempt', 'long_messy', 'buzzcut', 'unkempt'];
const HAIR_NB = ['shoulderl', 'unkempt', 'loose', 'buzzcut', 'half_up'];
const HAS_BG = new Set(['ponytail', 'shoulderl', 'bunches']);
const HAIR_C = ['relm_short', 'parted_side_bangs', 'wavy'];

const TOP_F = ['tshirt_f', 'polo_f', 'cardigan_f', 'blouse_f'];
const TOP_M = ['tshirt_m', 'polo_m', 'cardigan_m', 'shirt_m', 'formal_m'];
const BOTTOM_F = ['skirt_f', 'slacks_f', 'pants', 'skirt2_f', 'shorts_f'];
const BOTTOM_M = ['pants_m', 'slacks_m', 'shorts_m', 'pants_m'];

/** Danh sách lớp ảnh LPC theo ngoại hình. Ghép bằng lib/lpc.ts. */
export function lpcLayers(look: Look, gender: Gender, stage: Stage = 'adult'): Layer[] {
  const skin = SKIN[look.skin] ?? undefined;
  const hair = stage === 'elder' ? '#b9b4ab' : look.hair;
  if (stage === 'child') {
    const girl = gender === 'f';
    return [
      { key: 'body_child', tint: skin },
      { key: 'head_c', tint: skin },
      { key: 'eyes_c' },
      { key: girl && look.bottom % 2 === 0 ? 'skirt_c' : 'pants_c', tint: look.bottomColor },
      { key: 'shirt_c', tint: look.topColor },
      // tóc dài gợn sóng chỉ cho bé gái
      { key: `hairc_${(girl ? HAIR_C : HAIR_C.slice(0, 2))[look.hairStyle % (girl ? 3 : 2)]}`, tint: hair },
    ];
  }
  // phi nhị nguyên: dáng người rút theo mã ngoại hình
  const male = gender === 'm' || (gender === 'nb' && look.hairStyle % 2 === 1);
  const elder = stage === 'elder';
  const styles = gender === 'nb' ? HAIR_NB : male ? HAIR_M : HAIR_F;
  let hs = styles[look.hairStyle % styles.length];
  if (male && elder && look.hairStyle % 3 === 0) hs = 'balding';
  const top = (male ? TOP_M : TOP_F)[look.top % (male ? TOP_M.length : TOP_F.length)];
  // phi nhị nguyên không mặc váy
  const bottoms = male ? BOTTOM_M : gender === 'nb' ? ['slacks_f', 'pants', 'shorts_f'] : BOTTOM_F;
  const bottom = bottoms[look.bottom % bottoms.length];
  const out: Layer[] = [];
  if (HAS_BG.has(hs)) out.push({ key: `hair_${hs}_bg`, tint: hair });
  out.push(
    { key: male ? 'body_male' : 'body_adult', tint: skin },
    { key: male ? (elder ? 'head_me' : 'head_m') : elder ? 'head_fe' : 'head_f', tint: skin },
    { key: look.skin >= 2 ? 'eyes_brown' : ['eyes_brown', 'eyes_brown', 'eyes_gray', 'eyes_blue'][look.top % 4] },
  );
  if (!elder) out.push({ key: look.bottom % 2 ? 'nose_straight' : 'nose_button', tint: skin });
  out.push({ key: male ? 'brow_thick' : 'brow_thin', tint: hair });
  out.push({ key: bottom, tint: look.bottomColor });
  out.push({ key: male ? 'shoes_m' : 'shoes_f', tint: '#3a3330' });
  // áo sơ mi trắng formal giữ màu gốc, các áo khác nhuộm theo màu rút được
  out.push({ key: top, tint: top === 'formal_m' ? undefined : look.topColor });
  if (male && look.hairStyle % 4 === 0) out.push({ key: 'stubble', tint: hair });
  out.push({ key: `hair_${hs}_fg`, tint: hair });
  return out;
}
