/** Ngoại hình cố định của dàn người yêu và người xung quanh (bản nam và bản nữ) */

import { defaultCharacter, type Gender, type Look } from './character';
import type { LoveId } from './story';

const base = (g: Gender, p: Partial<Look>): Look => ({ ...defaultCharacter(g).look, ...p });

export const CAST: Record<LoveId | 'xemmat', Record<Gender, Look>> = {
  khoi: {
    m: base('m', { hair: 'unkempt', hairColor: '#4a2f1d', style: 'nangdong', color: '#7fb3d9', brow: 'thick' }),
    f: base('f', { hair: 'shoulderl', hairColor: '#4a2f1d', style: 'nhenhang', color: '#7fb3d9' }),
  },
  long: {
    m: base('m', { hair: 'long_messy', hairColor: '#2a1d16', style: 'catinh', color: '#c4573a', extra: 'earrings', skin: 1 }),
    f: base('f', { hair: 'loose', hairColor: '#a33a28', style: 'catinh', color: '#c4573a', extra: 'earrings', skin: 1 }),
  },
  minh: {
    m: base('m', { hair: 'buzzcut', hairColor: '#2a1d16', style: 'thanhlich', color: '#e8e1d0', eyes: 'gray' }),
    f: base('f', { hair: 'bangs_bun', hairColor: '#2a1d16', style: 'thanhlich', color: '#b48ad9', eyes: 'gray' }),
  },
  xemmat: {
    m: base('m', { hair: 'buzzcut', hairColor: '#2a1d16', style: 'thanhlich', color: '#30343f' }),
    f: base('f', { hair: 'half_up', hairColor: '#2a1d16', style: 'thanhlich', color: '#7fd1b9' }),
  },
};

export const MOM: Look = base('f', { hair: 'bangs_bun', hairColor: '#2a1d16', style: 'thanhlich', color: '#e0b54a', skin: 1 });

export const BESTIE: Record<Gender, Look> = {
  f: base('f', { hair: 'bunches', hairColor: '#7a4a28', style: 'nangdong', color: '#e0b54a' }),
  m: base('m', { hair: 'unkempt', hairColor: '#2a1d16', style: 'nangdong', color: '#7fd1b9', extra: 'stubble' }),
};
