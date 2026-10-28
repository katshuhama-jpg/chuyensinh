'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import {
  CLOTH_COLORS,
  EXTRAS,
  HAIR_COLORS,
  SKINS,
  SKIN_SWATCH,
  STYLES,
  defaultCharacter,
  hairsFor,
  siblingText,
  suggestName,
  type Character,
  type Look,
} from '@/lib/character';
import { introOf, newStory, rollFate, type Fate } from '@/lib/fate';
import { lpcLayers, type Stage } from '@/lib/look';
import { saveGame } from '@/lib/save';
import { FIRST_SCENE } from '@/lib/scenes';
import { useAuth } from '@/lib/useAuth';

const STAGES: { id: Stage; name: string }[] = [
  { id: 'child', name: 'Lúc bé' },
  { id: 'adult', name: 'Lúc lớn' },
  { id: 'elder', name: 'Lúc già' },
];
const EYES: { id: Look['eyes']; name: string }[] = [
  { id: 'brown', name: 'Nâu' },
  { id: 'gray', name: 'Xám' },
  { id: 'blue', name: 'Xanh' },
];

/** Bắt đầu: số phận random (giới tính, năm sinh, gia cảnh, lời thầy bói), rồi người chơi chọn vẻ ngoài */
export default function BatDau() {
  const router = useRouter();
  const { ready } = useAuth();
  const [fate, setFate] = useState<Fate | null>(null);
  const [rolls, setRolls] = useState(0);
  const [c, setC] = useState<Character | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // chưa đăng nhập vẫn chơi thử được, đời lưu trong trình duyệt
    if (!fate) {
      setFate(rollFate());
      setRolls(1);
    }
  }, [ready, fate]);

  function reroll() {
    setFate(rollFate());
    setRolls((n) => n + 1);
    window.scrollTo(0, 0);
  }

  function toLook() {
    if (!fate) return;
    setC({ ...defaultCharacter(fate.gender), name: fate.name, birthYear: fate.birthYear });
    window.scrollTo(0, 0);
  }

  async function start() {
    if (!fate || !c) return;
    setBusy(true);
    const char = { ...c, name: c.name.trim() };
    await saveGame({ char, family: fate.family, story: newStory(fate, FIRST_SCENE), startedAt: Date.now() });
    router.push('/choi');
  }

  if (!ready || !fate) return <main className="app" />;
  if (c) return <LookStep c={c} setC={(f) => setC((x) => (x ? f(x) : x))} onBack={() => setC(null)} onStart={start} busy={busy} />;
  return <FateStep key={rolls} fate={fate} rolls={rolls} onRoll={reroll} onNext={toLook} />;
}

/** Bước 1: đoạn giới thiệu số phận */
function FateStep({ fate, rolls, onRoll, onNext }: { fate: Fate; rolls: number; onRoll: () => void; onNext: () => void }) {
  const intro = introOf(fate);
  const layers = useMemo(() => lpcLayers(defaultCharacter(fate.gender).look, fate.gender, 'child'), [fate]);
  const fam = fate.family;
  return (
    <main className={`app ${rolls > 1 ? 'rolling' : ''}`}>
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            SỐ PHẬN AN BÀI
          </div>
          <h1>Chào đời</h1>
        </div>
      </div>
      <div className="body" style={{ paddingTop: 12 }}>
        <div className="card px">
          <div className="who">
            <Sprite layers={layers} scale={2} anim="walk" dir={2} dy={-9} label="Đứa trẻ vừa chào đời" />
            <div className="facts">
              <span>
                {fate.gender === 'f' ? 'Bé gái' : 'Bé trai'} · {fate.birthYear}
              </span>
              <span>
                {fam.province}, {fam.urban ? 'thành thị' : 'nông thôn'}
              </span>
            </div>
          </div>
          <div className="name">{fate.name}</div>
          <div className="dash" aria-hidden="true" />
          <dl className="kv" style={{ margin: 0 }}>
            <div>
              <dt>Gia cảnh</dt>
              <dd>{fam.wealth}</dd>
            </div>
            <div>
              <dt>Bố mẹ</dt>
              <dd>{fam.parents}</dd>
            </div>
            <div>
              <dt>Anh chị em</dt>
              <dd>{siblingText(fam.siblings)}</dd>
            </div>
          </dl>
        </div>
        <div className="story px-dim">
          {intro.map((p, i) => (
            <p key={i} className={p.startsWith('“') ? 'quote' : i === intro.length - 1 ? 'ask' : ''}>
              {p}
            </p>
          ))}
        </div>
      </div>
      <div className="foot">
        <div className="row">
          <button type="button" className="btn-sub px" onClick={onRoll}>
            Gieo lại
            <br />
            số phận
          </button>
          <button type="button" className="btn-main" onClick={onNext}>
            CHỌN VẺ NGOÀI
          </button>
        </div>
      </div>
    </main>
  );
}

/** Bước 2: chọn vẻ ngoài và tên */
function LookStep({ c, setC, onBack, onStart, busy }: { c: Character; setC: (f: (x: Character) => Character) => void; onBack: () => void; onStart: () => void; busy: boolean }) {
  const [stage, setStage] = useState<Stage>('adult');
  const layers = useMemo(() => lpcLayers(c.look, c.gender, stage), [c, stage]);
  const set = (p: Partial<Look>) => setC((x) => ({ ...x, look: { ...x.look, ...p } }));
  const name = c.name.trim();

  return (
    <main className="app">
      <div className="head">
        <button type="button" className="back" aria-label="Về màn số phận" onClick={onBack}>
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            {c.gender === 'f' ? 'NỮ' : 'NAM'} · SINH NĂM {c.birthYear}
          </div>
          <h1>Chọn vẻ ngoài</h1>
        </div>
      </div>

      <div className="preview px-dim">
        <Sprite layers={layers} scale={2} anim="idle" dir={2} dy={stage === 'child' ? -9 : 0} label={`Xem trước nhân vật ${STAGES.find((s) => s.id === stage)!.name.toLowerCase()}`} />
        <div className="stage-tabs" role="group" aria-label="Xem theo tuổi">
          {STAGES.map((s) => (
            <button key={s.id} type="button" className="opt chip px-dim" aria-pressed={stage === s.id} onClick={() => setStage(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="body">
        <Group label="Tên">
          <div className="name-row">
            <input value={c.name} maxLength={30} onChange={(e) => setC((x) => ({ ...x, name: e.target.value }))} aria-label="Tên nhân vật" className="px-dim" />
            <button type="button" className="btn-sub px" style={{ minHeight: 48 }} onClick={() => setC((x) => ({ ...x, name: suggestName(x.gender) }))}>
              Đổi tên
            </button>
          </div>
        </Group>

        <Group label="Mắt">
          <div className="chips">
            {EYES.map((e) => (
              <button key={e.id} type="button" className="opt chip px-dim" aria-pressed={c.look.eyes === e.id} onClick={() => set({ eyes: e.id })}>
                {e.name}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Lông mày và mũi">
          <div className="chips">
            <button type="button" className="opt chip px-dim" aria-pressed={c.look.brow === 'thin'} onClick={() => set({ brow: 'thin' })}>
              Mày mảnh
            </button>
            <button type="button" className="opt chip px-dim" aria-pressed={c.look.brow === 'thick'} onClick={() => set({ brow: 'thick' })}>
              Mày rậm
            </button>
            <button type="button" className="opt chip px-dim" aria-pressed={c.look.nose === 'button'} onClick={() => set({ nose: 'button' })}>
              Mũi tròn
            </button>
            <button type="button" className="opt chip px-dim" aria-pressed={c.look.nose === 'straight'} onClick={() => set({ nose: 'straight' })}>
              Mũi thẳng
            </button>
          </div>
        </Group>

        <Group label="Điểm nhấn">
          <div className="chips">
            {EXTRAS.filter((e) => e.for.includes(c.gender)).map((e) => (
              <button key={e.id} type="button" className="opt chip px-dim" aria-pressed={c.look.extra === e.id} onClick={() => set({ extra: e.id })}>
                {e.name}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Kiểu tóc">
          <div className="chips">
            {hairsFor(c.gender).map((h) => (
              <button key={h.id} type="button" className="opt chip px-dim" aria-pressed={c.look.hair === h.id} onClick={() => set({ hair: h.id })}>
                {h.name}
              </button>
            ))}
          </div>
        </Group>

        <Group label={`Màu tóc: ${HAIR_COLORS.find((h) => h.c === c.look.hairColor)?.name ?? ''}`}>
          <div className="swatches">
            {HAIR_COLORS.map((h) => (
              <button key={h.c} type="button" className="sw px-dim" style={{ background: h.c }} aria-pressed={c.look.hairColor === h.c} aria-label={`Tóc ${h.name}`} onClick={() => set({ hairColor: h.c })} />
            ))}
          </div>
        </Group>

        <Group label={`Màu da: ${SKINS[c.look.skin]}`}>
          <div className="swatches">
            {SKINS.map((s, i) => (
              <button key={s} type="button" className="sw px-dim" style={{ background: SKIN_SWATCH[i] }} aria-pressed={c.look.skin === i} aria-label={`Da ${s}`} onClick={() => set({ skin: i })} />
            ))}
          </div>
        </Group>

        <Group label="Phong cách quần áo">
          <div className="grid2">
            {STYLES.map((s) => (
              <button key={s.id} type="button" className="opt px-dim" aria-pressed={c.look.style === s.id} onClick={() => set({ style: s.id })}>
                <b>{s.name}</b>
                <span>{s.hint}</span>
              </button>
            ))}
          </div>
          <span className="mute" style={{ fontSize: 18 }}>
            Đồ tự đổi theo tuổi, giữ đúng phong cách này.
          </span>
        </Group>

        <Group label="Màu chủ đạo">
          <div className="swatches">
            {CLOTH_COLORS.map((col) => (
              <button key={col} type="button" className="sw px-dim" style={{ background: col }} aria-pressed={c.look.color === col} aria-label={`Màu đồ ${col}`} onClick={() => set({ color: col })} />
            ))}
          </div>
        </Group>
      </div>

      <div className="foot">
        <button type="button" className="btn-main" disabled={!name || busy} onClick={onStart}>
          {busy ? 'ĐANG LƯU...' : '▶ BẮT ĐẦU ĐỜI NÀY'}
        </button>
      </div>
    </main>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="group">
      <div className="label">{label}</div>
      {children}
    </section>
  );
}
