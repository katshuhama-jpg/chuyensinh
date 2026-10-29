// Dựng trạng thái chơi tới một cảnh (theo tiền tố id) để chụp màn hình
import { writeFileSync } from 'fs';
import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { FIRST_SCENE, ageOfScene, resolverOf } from '../lib/scenes';
import { choose, ctxOf, visibleChoices } from '../lib/story';
const want = process.argv.slice(2);
let seed = 5; const r = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const out: Record<string, unknown> = {};
for (let i = 0; i < 400 && Object.keys(out).length < want.length; i++) {
  const fate = rollFate(r); const c = { ...defaultCharacter(fate.gender), name: fate.name, birthYear: Math.max(1996, fate.birthYear) };
  let s = newStory(fate, FIRST_SCENE); const R = resolverOf(c, fate.family);
  for (let k = 0; k < 500 && s.scene !== 'end'; k++) {
    for (const w of want) if (!out[w] && s.scene.startsWith(w) && (w !== 'end' )) out[w] = { char: c, family: fate.family, story: s };
    const sc = R(s.scene, s)!; const x = ctxOf(c, fate.family, s, sc.age); const o = visibleChoices(sc, x);
    let idx = Math.floor(r() * o.length);
    const pref = o.findIndex((ch) => /Hẹn|★/.test(typeof ch.t === 'function' ? ch.t(x) : ch.t));
    if (pref >= 0 && r() < 0.8) idx = pref;
    s = choose(R, c, fate.family, s, idx).s;
  }
  if (want.includes('end') && !out.end && s.album.length >= 2) out.end = { char: c, family: fate.family, story: s };
}
writeFileSync(process.env.OUT!, JSON.stringify(out));
console.log(Object.keys(out));
