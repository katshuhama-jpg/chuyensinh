// Chơi dồn vào một người: ưu tiên gặp, nhắn, hẹn, tặng quà, tỏ tình, cầu hôn người đó; đếm số đời cưới được
import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { FIRST_SCENE, ageOfScene, resolverOf } from '../lib/scenes';
import { choose, ctxOf, LOVE_IDS, visibleChoices, type LoveId } from '../lib/story';
let seed = 11;
const r = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const target = (process.argv[2] || 'hung') as LoveId;
let wed = 0, met = 0, night = 0, leak = 0;
const N = 150;
for (let i = 0; i < N; i++) {
  const fate = rollFate(r);
  const c = { ...defaultCharacter(fate.gender), name: fate.name, birthYear: Math.max(1990, fate.birthYear) };
  let s = newStory(fate, FIRST_SCENE);
  const R = resolverOf(c, fate.family);
  for (let k = 0; k < 500 && s.scene !== 'end'; k++) {
    // màn chọn 3 người: luôn chọn người cần nhắm
    if (s.scene.startsWith('fo@') && !s.flags.includes(`pksel_${target}`)) s.flags.push(`pksel_${target}`);
    const sc = R(s.scene, s)!;
    const x = ctxOf(c, fate.family, s, sc.age);
    const o = visibleChoices(sc, x);
    const score = (ch: (typeof o)[number]) => {
      const t = typeof ch.t === 'function' ? ch.t(x) : ch.t;
      let v = r();
      if (ch.loveId === target || (ch.to && String(ch.to).includes(target)) || t.includes(x.L(target))) v += 5;
      if (ch.act === 'drop' && ch.loveId === target) v -= 20;
      if (ch.act === 'drop' && ch.loveId !== target) v += 1;
      if (ch.act === 'confess' && ch.loveId === target) v += 8;
      if (/Gật đầu|duyen|Đến hậu trường|Đến clip/.test(t)) v += 2;
      if (/♥ Yêu|Đi cùng nhau|★/.test(t)) v += 3;
      if (/chia tay|Chia tay|không cưới|Ly hôn/.test(t)) v -= 6;
      return v;
    };
    let best = 0;
    // ở ngã rẽ của tuyến tình: chọn lựa chọn đầu (tốt nhất), trừ màn chọn hướng thì theo người cần nhắm
    if (s.scene.startsWith('route@') && !o.some((ch) => ch.loveId)) {
      s = choose(R, c, fate.family, s, 0).s;
      continue;
    }
    o.forEach((ch, j) => score(ch) > score(o[best]) && (best = j));
    s = choose(R, c, fate.family, s, best).s;
  }
  if (s.met.includes(target)) met++;
  if (s.path.some((p) => p.scene.startsWith('st4@'))) night++;
  if (s.flags.includes(`st_lo_${target}`)) leak++;
  if (s.married && s.partner === target) wed++;
}
console.log(target, { met, wed, night, leak, N });
