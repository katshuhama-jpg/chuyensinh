import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { FIRST_SCENE, ageOfScene, resolverOf } from '../lib/scenes';
import { choose, ctxOf, visibleChoices } from '../lib/story';
const r = Math.random;
const N = 800; let kid = 0, all = 0; const first: Record<string, number> = {}; const cnt: Record<string, number> = {}; const byAge: Record<number, Record<string, number>> = {};
for (let i = 0; i < N; i++) { const fate = rollFate(r); const c = { ...defaultCharacter(fate.gender), name: fate.name, birthYear: fate.birthYear };
  let s = newStory(fate, FIRST_SCENE); const R = resolverOf(c, fate.family);
  for (let k = 0; k < 600 && s.scene !== 'end'; k++) { const sc = R(s.scene, s)!; const x = ctxOf(c, fate.family, s, sc.age); const o = visibleChoices(sc, x); s = choose(R, c, fate.family, s, Math.floor(r() * o.length)).s; }
  all += s.path.length; kid += s.path.filter((p) => p.age < 20).length; first[s.path[0].title] = (first[s.path[0].title] ?? 0) + 1;
  for (const p of s.path.filter((p) => p.scene.startsWith('ly@'))) { cnt[p.title] = (cnt[p.title] ?? 0) + 1; const a = (byAge[p.age] ??= {}); a[p.title] = (a[p.title] ?? 0) + 1; } }
console.log({ perLife: (all / N).toFixed(0), under20: (kid / N).toFixed(0), lyKinds: Object.keys(cnt).length });
console.log('mở đầu:', Object.entries(first).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' | '));
console.log(Object.entries(byAge).map(([a, m]) => { const v = Object.entries(m).sort((x, y) => y[1] - x[1]); return `${a}t: ${v.length} loại, nhiều nhất ${v[0][0]} ${Math.round((100 * v[0][1]) / N)}%`; }).join('\n'));
