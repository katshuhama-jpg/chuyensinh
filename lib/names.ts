import type { Ctx } from './story';

/** tên người xem mắt (đổi theo từng đời) */
export const xemmatName = (x: Ctx) => {
  const m = ['Tuấn', 'Hoàng', 'Thắng', 'Đức', 'Việt', 'Trung', 'Khoa', 'Lâm'];
  const f = ['Thu', 'Hằng', 'Phương', 'Nga', 'Hiền', 'Yến', 'Trang', 'Loan'];
  const list = x.lg === 'm' ? m : f;
  return list[(x.s.seed ?? x.c.birthYear) % list.length];
};
