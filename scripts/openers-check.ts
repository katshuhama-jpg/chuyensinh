import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { openerOf } from '../lib/openers';
import { ctxOf } from '../lib/story';
let seed = 3;
const r = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const cnt: Record<string, number> = {};
for (let i = 0; i < 3000; i++) {
  const f = rollFate(r);
  const c = { ...defaultCharacter(f.gender), name: f.name, birthYear: f.birthYear };
  const x = ctxOf(c, f.family, newStory(f, 'c6_dieu'), 6);
  const t = openerOf('Tuổi thơ', x);
  cnt[t] = (cnt[t] ?? 0) + 1;
}
console.log(Object.keys(cnt).length, Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8));
