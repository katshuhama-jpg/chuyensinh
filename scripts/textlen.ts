import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { FIRST_SCENE, ageOfScene, resolverOf } from '../lib/scenes';
import { choose, ctxOf, visibleChoices } from '../lib/story';
let seed = 5;
const r = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const lens: Record<string, number[]> = {};
let total = 0, scenes = 0;
for (let i = 0; i < 300; i++) {
  const f = rollFate(r);
  const c = { ...defaultCharacter(f.gender), name: f.name, birthYear: f.birthYear };
  let s = newStory(f, FIRST_SCENE);
  const R = resolverOf(c, f.family);
  for (let k = 0; k < 400 && s.scene !== 'end'; k++) {
    const sc = R(s.scene, s)!;
    const x = ctxOf(c, f.family, s, ageOfScene(s.scene));
    const t = sc.text(x);
    const n = t.join(' ').length;
    total += n; scenes++;
    (lens[sc.id.replace(/@.*/, '@')] ??= []).push(n);
    const o = visibleChoices(sc, x);
    s = choose(R, c, f.family, s, Math.floor(r() * o.length)).s;
  }
}
console.log('avg chars/scene', Math.round(total / scenes), 'scenes/life', Math.round(scenes / 300));
console.log(Object.entries(lens).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)] as const).sort((a, b) => b[1] - a[1]).slice(0, 15));
