// Soát logic: chơi ngẫu nhiên nhiều đời, gom mọi chữ hiện ra kèm tuổi / năm, rồi bắt các chỗ lệch thời đại, lệch tuổi, lệch hoàn cảnh
import { defaultCharacter } from '../lib/character';
import { newStory, rollFate } from '../lib/fate';
import { profileOf } from '../lib/profiles';
import { FIRST_SCENE, ageOfScene, resolverOf } from '../lib/scenes';
import { choose, ctxOf, txt, visibleChoices } from '../lib/story';

let seed = 11;
const r = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const N = Number(process.argv[2] || 1500);

// từ khóa -> [năm sớm nhất, năm muộn nhất] ở Việt Nam
const ERA: [RegExp, number, number][] = [
  [/iPhone/i, 2007, 9999],
  [/Facebook|Tường\b/, 2008, 9999],
  [/Zalo/, 2012, 9999],
  [/\bGrab\b|xe ôm công nghệ/, 2014, 9999],
  [/Quẹt|quẹt phải|quẹt trái/, 2013, 9999],
  [/Chat Vàng|BUZZ|Yahoo/, 1999, 2018],
  [/Nokia/, 1996, 2016],
  [/tin nhắn|nhắn tin|SMS/, 1997, 9999],
  [/quán net|internet|lên mạng|lướt mạng|online/i, 1998, 9999],
  [/livestream/i, 2016, 9999],
  [/TikTok/i, 2018, 9999],
  [/triệu view|triệu lượt xem|viral/i, 2008, 9999],
  [/video call|gọi video|gọi hình/i, 2010, 9999],
  [/selfie|tự sướng/i, 2008, 9999],
  [/confession/i, 2012, 9999],
  [/smartphone|điện thoại thông minh|màn hình cảm ứng/i, 2008, 9999],
  [/ChatGPT|trợ lý AI|\bAI\b/, 2022, 9999],
  [/COVID|giãn cách|học online|lớp học online/i, 2020, 9999],
  [/metro|tàu điện ngầm/i, 2021, 9999],
  [/Vision\b/, 2011, 9999],
  [/Air Blade/, 2007, 9999],
  [/Exciter/, 2006, 9999],
  [/\bSH\b/, 2001, 9999],
  [/\bWave\b/, 1999, 9999],
  [/xe máy điện|xe điện/, 2010, 9999],
  [/penthouse|căn hộ cao cấp|tầng 30|tầng 50/, 2008, 9999],
  [/chung cư/, 1975, 9999],
  [/tem phiếu/, 1975, 1990],
  [/cassette/i, 1978, 2005],
  [/đĩa CD|VCD|DVD/, 1995, 2012],
  [/karaoke/i, 1992, 9999],
  [/máy nhắn tin|pager/i, 1993, 2003],
  [/Shopee|Lazada|săn sale|mua online/i, 2015, 9999],
  [/Flappy/, 2014, 2014],
];

// từ khóa -> tuổi tối thiểu của người chơi khi chữ đó nói về chính mình
const AGE: [RegExp, number][] = [
  [/hiến máu/, 18],
  [/đi làm|công ty mới|đồng nghiệp|sếp\b|lương/i, 18],
  [/cưới|kết hôn|cầu hôn/, 18],
  [/rượu|bia\b|nhậu/, 16],
  [/hôn\b/, 15],
  [/ở trọ|phòng trọ/, 15],
  [/thi đại học|sinh viên/, 17],
];

const hits: Record<string, { n: number; ex: string }> = {};
const add = (k: string, ex: string) => {
  const h = (hits[k] ??= { n: 0, ex });
  h.n++;
};

for (let i = 0; i < N; i++) {
  const fate = rollFate(r);
  const c = { ...defaultCharacter(fate.gender), name: fate.name, birthYear: fate.birthYear };
  const fam = fate.family;
  let s = newStory(fate, FIRST_SCENE);
  const R = resolverOf(c, fam);
  for (let k = 0; k < 400 && s.scene !== 'end'; k++) {
    const sc = R(s.scene, s)!;
    const age = sc.age;
    const x = ctxOf(c, fam, s, age);
    const opts = visibleChoices(sc, x);
    const lines = [txt(sc.title, x), ...sc.text(x), ...opts.map((o) => txt(o.t, x))];
    const idx = Math.floor(r() * opts.length);
    const out = choose(R, c, fam, s, idx);
    lines.push(...out.fb.notes, ...out.fb.sys);
    const tag = s.scene.replace(/[@#].*/, '') + '|' + s.scene.split(/[@#]/)[0];
    for (const id of s.met) {
      const p = profileOf(id, x);
      lines.push(`[hồ sơ ${id}] ${p.home} / ${p.ride}`);
    }
    for (const l of lines) {
      for (const [re, a, b] of ERA) if (re.test(l) && (x.year < a || x.year > b)) add(`NĂM ${re.source} @${s.scene.split(/[#:]/)[0]}`, `${x.year} (${age}t): ${l.slice(0, 140)}`);
      if (!l.startsWith('[hồ sơ')) for (const [re, a] of AGE) if (re.test(l) && age < a) add(`TUỔI ${re.source} @${s.scene.split(/[#:]/)[0]}`, `${age}t ${x.year}: ${l.slice(0, 140)}`);
      if (fam.parents === 'Không còn bố mẹ' && !l.startsWith('[hồ sơ') && /(?<!\p{L})(bố|mẹ)(?!\p{L})/u.test(l) && !/bố mẹ (đã|mất)|ông bà|không còn/.test(l)) add(`MỒ CÔI nhắc bố mẹ @${s.scene.split(/[#:]/)[0]}`, l.slice(0, 140));
      if (!fam.siblings.length && /\b(anh trai|chị gái|em trai|em gái)\b/.test(l) && !/[A-ZĐ]\w+ (có|là)/.test(l)) add(`CON MỘT nhắc anh chị em @${s.scene.split(/[#:]/)[0]}`, l.slice(0, 140));
      if (!fam.urban && /ngõ phố|giữa phố|phố cổ|chung cư|tòa nhà/.test(l) && age < 18) add(`QUÊ mà phố @${s.scene.split(/[#:]/)[0]}`, `${fam.province}: ${l.slice(0, 140)}`);
    }
    void tag;
    s = out.s;
    if (s.kids > 0 && !s.married && !s.flags.includes('donthan')) add('CÓ CON chưa cưới', `${s.scene}`);
    if (s.married && s.marriedAge !== null && s.marriedAge < (c.gender === 'f' ? 18 : 20)) add('CƯỚI dưới tuổi luật', `${s.marriedAge}t`);
  }
}
const rows = Object.entries(hits).sort((a, b) => b[1].n - a[1].n);
for (const [k, v] of rows) console.log(`${v.n}\t${k}\n\t${v.ex}`);
console.log(rows.length, 'loại');
