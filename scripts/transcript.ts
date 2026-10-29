// In ra một đời chơi (tự chọn ngẫu nhiên, ưu tiên chuyện tình) để đọc thử như người chơi
import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { FIRST_SCENE, resolverOf } from '../lib/scenes';
import { commit } from '../lib/board';
import { ctxOf, txt, visibleChoices } from '../lib/story';
const fate = rollFate();
if (process.argv[3] === 'que') fate.family = { ...fate.family, urban: false, province: 'Nghệ An', district: undefined };
if (process.argv[3] === 'pho') fate.family = { ...fate.family, urban: true, province: 'Hà Nội', district: undefined };
const c = { ...defaultCharacter(fate.gender), name: fate.name, birthYear: Number(process.argv[2]) || fate.birthYear };
const R = resolverOf(c, fate.family);
let s = newStory(fate, FIRST_SCENE);
console.log(`# ${c.name} (${c.gender === 'f' ? 'nữ' : 'nam'}), sinh ${c.birthYear} ở ${fate.family.province}, ${fate.family.wealth}, ${fate.family.parents}`);
for (let k = 0; k < 700 && s.scene !== 'end'; k++) {
  const sc = R(s.scene, s)!; const x = ctxOf(c, fate.family, s, sc.age); const o = visibleChoices(sc, x);
  if (sc.kind === 'feed') { for (const l of sc.feed?.(x) ?? []) console.log(`  [${l.age}t ${l.year}] ${l.t}`); }
  else {
    console.log(`\n== ${sc.age}t ${x.year} | ${txt(sc.title, x)} (${sc.kind ?? 'talk'})`);
    for (const t of sc.text(x)) console.log(`   ${t}`);
    sc.msgs?.(x).forEach((m) => console.log(`   ${m.me ? '>' : '<'} ${m.t}`));
    o.forEach((ch, i) => console.log(`   ${i + 1}. ${txt(ch.t, x)}`));
  }
  let idx = Math.floor(Math.random() * o.length);
  const pref = o.findIndex((ch) => /Gật đầu|Tỏ tình|Hẹn|★/.test(txt(ch.t, x)));
  if (pref >= 0 && Math.random() < 0.7) idx = pref;
  const r = commit(R, c, fate.family, s, sc.kind === 'feed' ? 0 : idx);
  if (sc.kind !== 'feed') console.log(`   -> chọn ${idx + 1}${r.fb.delta ? ' [' + r.fb.delta + ']' : ''}${[...r.fb.notes, ...r.fb.sys].length ? ' | ' + [...r.fb.notes, ...r.fb.sys].join(' / ') : ''}`);
  s = r.s;
}
console.log(`\n# Kết: cưới=${s.married} loveEnd=${s.loveEnd} con=${s.kids} đã gặp=${s.met.join(',')}`);
