// Chơi ngẫu nhiên nhiều đời để kiểm tra không lỗi, in thống kê theo thời kỳ
import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { FIRST_SCENE, ageOfScene, resolverOf } from '../lib/scenes';
import { choose, ctxOf, visibleChoices } from '../lib/story';

let seed = 7;
const r = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const N = Number(process.argv[2] || 2000);
let errs = 0, ends = 0;
const pass: Record<string, [number, number]> = {};
const sib: Record<string, number[]> = {};
for (let i = 0; i < N; i++) {
  const fate = rollFate(r);
  const c = { ...defaultCharacter(fate.gender), name: fate.name, birthYear: fate.birthYear };
  const dec = fate.birthYear < 1985 ? '<1985' : fate.birthYear < 1995 ? '1985-94' : '1995+';
  (sib[dec] ??= []).push(fate.family.siblings.length);
  let s = newStory(fate, FIRST_SCENE);
  const R = resolverOf(c, fate.family);
  try {
    for (let k = 0; k < 400 && s.scene !== 'end'; k++) {
      const sc = R(s.scene, s)!;
      const x = ctxOf(c, fate.family, s, ageOfScene(s.scene));
      if (s.scene === 't17_thi') {
        const e = c.birthYear + 17 < 2000 ? '<2000' : c.birthYear + 17 < 2015 ? '2000-14' : '2015+';
        const p = (pass[e] ??= [0, 0]);
        p[1]++;
        if (sc.text(x)[0].includes('đỗ')) p[0]++;
      }
      const opts = visibleChoices(sc, x);
      const idx = Math.floor(r() * opts.length);
      s = choose(R, c, fate.family, s, idx).s;
    }
    if (s.scene === 'end') ends++;
  } catch (e) {
    if (errs++ < 3) console.log('ERR', s.scene, String(e));
  }
}
console.log({ N, ends, errs });
console.log('đỗ đại học', Object.fromEntries(Object.entries(pass).map(([k, [a, b]]) => [k, `${Math.round((100 * a) / b)}% (${b})`])));
console.log('anh chị em TB', Object.fromEntries(Object.entries(sib).map(([k, v]) => [k, (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)])));
