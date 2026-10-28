/**
 * Bảng đời kiểu 1 in 8 Billion: mỗi lựa chọn (hay mỗi quãng năm trôi qua) được ghi vào nhật ký đời,
 * tô bản đồ đời theo tâm trạng, và cộng hiệu ứng của "trọng tâm năm nay" cho mỗi năm đi qua.
 */

import { ageOfScene } from './scenes';
import { MIDS } from './endings';
import { choose, ctxOf, txt, visibleChoices, type Feedback, type LogLine, type Resolve, type Story } from './story';
import type { Character, Family } from './character';

export type Focus = { k: string; t: string; d: string };

/** trọng tâm theo tuổi */
export function focusesOf(age: number): Focus[] {
  if (age < 12)
    return [
      { k: 'hoc', t: 'Học', d: 'Hiểu biết ↑' },
      { k: 'choi', t: 'Chơi với bạn', d: 'Bạn bè ↑ Vui ↑' },
      { k: 'nha', t: 'Giúp nhà', d: 'Gần bố mẹ ↑' },
      { k: 'minh', t: 'Vận động', d: 'Sức khỏe ↑ Vui ↑' },
    ];
  if (age < 18)
    return [
      { k: 'hoc', t: 'Học', d: 'Hiểu biết ↑ Vui ↓' },
      { k: 'yeu', t: 'Để ý crush', d: 'Tình cảm ↑' },
      { k: 'choi', t: 'Bạn bè', d: 'Bạn bè ↑' },
      { k: 'minh', t: 'Chăm bản thân', d: 'Nhan sắc ↑' },
    ];
  if (age < 60)
    return [
      { k: 'yeu', t: 'Yêu', d: 'Tình cảm ↑ Duyên ↑' },
      { k: 'lam', t: 'Sự nghiệp', d: 'Tài chính ↑ Sức khỏe ↓' },
      { k: 'nha', t: 'Gia đình', d: 'Bố mẹ, con cái ↑' },
      { k: 'minh', t: 'Bản thân', d: 'Sức khỏe ↑ Vui ↑' },
      { k: 'hoc', t: 'Học thêm', d: 'Hiểu biết ↑' },
    ];
  return [
    { k: 'yeu', t: 'Bạn đời', d: 'Tình cảm ↑' },
    { k: 'nha', t: 'Con cháu', d: 'Con cái ↑' },
    { k: 'minh', t: 'Sức khỏe', d: 'Sức khỏe ↑ Vui ↑' },
  ];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** cộng hiệu ứng trọng tâm cho một năm đi qua */
function applyFocus(s: Story, age: number) {
  const k = s.focus && focusesOf(age).some((f) => f.k === s.focus) ? s.focus : focusesOf(age)[0].k;
  const st = s.stats;
  const love = () => {
    const p = s.partner && s.partner !== 'xemmat' ? s.partner : [...s.met].filter((id) => !s.flags.includes(`${id}_out`)).sort((a, b) => s.love[b] - s.love[a])[0];
    if (p) s.love[p] = clamp(s.love[p] + 2);
  };
  if (k === 'hoc') (st.hoc = clamp(st.hoc + 2), (st.tam = clamp(st.tam - 1)));
  if (k === 'choi') ((s.rel.banthan = clamp(s.rel.banthan + 3)), (st.tam = clamp(st.tam + 1)));
  if (k === 'nha') ((s.rel.bome = clamp(s.rel.bome + 3)), s.kids && (s.rel.con = clamp(s.rel.con + 2)));
  if (k === 'minh') ((st.tam = clamp(st.tam + 2)), (st.duyen = clamp(st.duyen + 1)), (st.khoe = clamp((st.khoe ?? 70) + 2)));
  if (k === 'lam') ((st.tien = clamp(st.tien + 3)), (st.tam = clamp(st.tam - 1)), (st.khoe = clamp((st.khoe ?? 70) - 1)));
  // có tuổi thì sức khỏe đi xuống dần
  if (age >= 45) st.khoe = clamp((st.khoe ?? 70) - (age >= 65 ? 2 : 1));
  if (k === 'yeu') ((st.dao = clamp(st.dao + 1)), love());
}

/** Chọn lựa chọn i ở cảnh hiện tại rồi ghi nhật ký, bản đồ đời, trọng tâm */
export function commit(R: Resolve, c: Character, f: Family, before0: Story, i: number, note0?: string): { s: Story; fb: Feedback } {
  // cảnh chọn người: danh sách người được chọn đi kèm dưới dạng "pick:a,b,c"
  const picks = note0?.startsWith('pick:') ? note0.slice(5).split(',').filter(Boolean) : null;
  const note = picks ? undefined : note0;
  const before = picks ? { ...before0, flags: [...before0.flags, ...picks.map((id) => `pksel_${id}`)] } : before0;
  const sc = R(before.scene, before)!;
  const age0 = sc.age;
  const x0 = ctxOf(c, f, before, age0);
  const r = choose(R, c, f, before, i);
  const s = r.s;
  const add: LogLine[] = [];
  if (sc.kind === 'feed') for (const l of sc.feed?.(x0) ?? []) add.push({ ...l, k: 'feed' });
  else {
    const opt = visibleChoices(sc, x0)[i];
    add.push({ age: age0, year: x0.year, t: `${txt(sc.title, x0)}: ${opt ? txt(opt.t, x0) : ''}`, k: 'pick' });
    for (const n of [...r.fb.notes.slice(0, 2), ...r.fb.sys.slice(0, 1)]) add.push({ age: age0, year: x0.year, t: n, k: 'note' });
    for (const m of r.fb.mids) add.push({ age: age0, year: x0.year, t: `★ Kết cục giữa chừng: ${MIDS[m]?.name ?? m}`, k: 'note' });
    for (const id of r.fb.met) add.push({ age: age0, year: x0.year, t: `♥ Gặp ${x0.L(id)} lần đầu.`, k: 'note' });
  }
  if (note) {
    s.notes = [...(s.notes ?? []), { age: age0, q: sc.ask?.(x0) ?? '', a: note }];
    add.push({ age: age0, year: x0.year, t: `Đã viết: “${note}”`, k: 'note' });
  }
  // sang chương mới
  const nx = s.scene !== 'end' ? R(s.scene, s) : undefined;
  if (nx && nx.chapter !== sc.chapter) add.push({ age: nx.age, year: c.birthYear + nx.age, t: `— ${nx.chapter} —`, k: 'ch' });
  // năm đi qua: tô bản đồ đời và cộng trọng tâm
  const age1 = s.scene === 'end' ? age0 + 1 : ageOfScene(s.scene);
  const mood = [...(s.mood ?? [])];
  for (let a = age0; a < Math.max(age1, age0 + (sc.kind === 'feed' ? 1 : 0)); a++) {
    applyFocus(s, a);
    mood[a] = s.stats.tam;
  }
  mood[age0] = mood[age0] ?? s.stats.tam;
  s.mood = mood;
  s.log = [...(s.log ?? []), ...add].slice(-500);
  return { s, fb: r.fb };
}
