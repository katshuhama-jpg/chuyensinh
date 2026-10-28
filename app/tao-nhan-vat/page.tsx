'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import {
  CLOTH_COLORS,
  ERAS,
  EXTRAS,
  HAIR_COLORS,
  SKINS,
  SKIN_SWATCH,
  STYLES,
  YEAR_MAX,
  YEAR_MIN,
  defaultCharacter,
  deviceAt,
  hairsFor,
  realityOf,
  rollFamily,
  suggestName,
  type Character,
  type Family,
  type Gender,
  type Look,
} from '@/lib/character';
import { lpcLayers, type Stage } from '@/lib/look';
import { saveGame } from '@/lib/save';
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

/** Màn tạo nhân vật: người chơi tự chọn hết, bấm Chào đời thì game rút gia cảnh */
export default function TaoNhanVat() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [c, setC] = useState<Character>(() => defaultCharacter('f'));
  const [stage, setStage] = useState<Stage>('adult');
  const [family, setFamily] = useState<Family | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace('/dang-nhap?next=/tao-nhan-vat');
  }, [ready, user, router]);

  const layers = useMemo(() => lpcLayers(c.look, c.gender, stage), [c, stage]);
  const set = (p: Partial<Look>) => setC((x) => ({ ...x, look: { ...x.look, ...p } }));

  function setGender(g: Gender) {
    setC((x) => {
      const extra = EXTRAS.find((e) => e.id === x.look.extra)?.for.includes(g) ? x.look.extra : 'none';
      // còn để tóc mặc định của giới kia thì đổi sang tóc mặc định của giới mới
      const hair = x.look.hair === defaultCharacter(x.gender).look.hair ? defaultCharacter(g).look.hair : x.look.hair;
      return { ...x, gender: g, look: { ...x.look, extra, hair, brow: g === 'f' ? 'thin' : 'thick' } };
    });
  }

  async function start() {
    if (!family) return;
    setBusy(true);
    await saveGame({ char: { ...c, name: c.name.trim() }, family, age: 0, startedAt: Date.now() });
    router.push('/choi');
  }

  if (!ready || !user) return <main className="app" />;
  if (family) return <Born c={c} family={family} onBack={() => setFamily(null)} onStart={start} busy={busy} />;

  const name = c.name.trim();
  const youth = c.birthYear + 16;

  return (
    <main className="app">
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            BƯỚC ĐẦU TIÊN
          </div>
          <h1>Tạo nhân vật</h1>
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
        <Group label="Giới tính">
          <div className="grid2">
            {(['f', 'm'] as const).map((g) => (
              <button key={g} type="button" className="opt chip px-dim" aria-pressed={c.gender === g} onClick={() => setGender(g)}>
                {g === 'f' ? 'Nữ' : 'Nam'}
              </button>
            ))}
          </div>
          <span className="mute" style={{ fontSize: 18 }}>
            {c.gender === 'f' ? 'Bạn sẽ gặp bản nam của dàn người yêu.' : 'Bạn sẽ gặp bản nữ của dàn người yêu.'}
          </span>
        </Group>

        <Group label="Năm sinh">
          <div className="year">
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={c.birthYear}
              onChange={(e) => setC((x) => ({ ...x, birthYear: Number(e.target.value) }))}
              aria-label="Năm sinh"
            />
            <output>{c.birthYear}</output>
          </div>
          <div className="chips">
            {ERAS.map((e) => (
              <button key={e.name} type="button" className="opt chip px-dim" aria-pressed={c.birthYear === e.year} onClick={() => setC((x) => ({ ...x, birthYear: e.year }))}>
                {e.name}
              </button>
            ))}
          </div>
          <div className="note px-dim">
            <span>
              Tuổi 16 rơi vào năm {youth}: {deviceAt(youth)}.
            </span>
            <span className="mute">{realityOf(c.birthYear)}</span>
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
            Đồ tự đổi theo tuổi và thời kỳ, giữ đúng phong cách này. Đồ đi hẹn, đồ cưới, áo dài Tết mở dần trong game.
          </span>
        </Group>

        <Group label="Màu chủ đạo">
          <div className="swatches">
            {CLOTH_COLORS.map((col) => (
              <button key={col} type="button" className="sw px-dim" style={{ background: col }} aria-pressed={c.look.color === col} aria-label={`Màu đồ ${col}`} onClick={() => set({ color: col })} />
            ))}
          </div>
        </Group>

        <Group label="Tên">
          <div className="name-row">
            <input
              value={c.name}
              maxLength={30}
              placeholder="Người yêu sẽ gọi bạn bằng tên này"
              onChange={(e) => setC((x) => ({ ...x, name: e.target.value }))}
              aria-label="Tên nhân vật"
              className="px-dim"
            />
            <button type="button" className="btn-sub px" style={{ minHeight: 48 }} onClick={() => setC((x) => ({ ...x, name: suggestName(x.gender) }))}>
              Gợi ý
            </button>
          </div>
        </Group>
      </div>

      <div className="foot">
        {!name && (
          <span className="mute" style={{ fontSize: 18, textAlign: 'center' }}>
            Đặt tên để chào đời
          </span>
        )}
        <button type="button" className="btn-main" disabled={!name} onClick={() => setFamily(rollFamily())}>
          ▶ CHÀO ĐỜI
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

/** Thẻ chào đời: gia cảnh vừa rút */
function Born({ c, family, onBack, onStart, busy }: { c: Character; family: Family; onBack: () => void; onStart: () => void; busy: boolean }) {
  const layers = useMemo(() => lpcLayers(c.look, c.gender, 'child'), [c]);
  return (
    <main className="app rolling">
      <div className="head">
        <button type="button" className="back" aria-label="Sửa nhân vật" onClick={onBack}>
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            GIA CẢNH DO SỐ PHẬN
          </div>
          <h1>Chào đời</h1>
        </div>
      </div>
      <div className="body" style={{ paddingTop: 12 }}>
        <div className="card px">
          <div className="who">
            <Sprite layers={layers} scale={2} anim="walk" dir={2} dy={-9} label={`${c.name} lúc nhỏ`} />
            <div className="facts">
              <span>
                {c.gender === 'f' ? 'Nữ' : 'Nam'} · sinh năm {c.birthYear}
              </span>
              <span>
                {family.province}, {family.urban ? 'thành thị' : 'nông thôn'}
              </span>
            </div>
          </div>
          <div className="name">{c.name.trim()}</div>
          <div className="dash" aria-hidden="true" />
          <dl className="kv" style={{ margin: 0 }}>
            <div>
              <dt>Gia cảnh</dt>
              <dd>{family.wealth}</dd>
            </div>
            <div>
              <dt>Bố mẹ</dt>
              <dd>{family.parents}</dd>
            </div>
            <div>
              <dt>Anh chị em</dt>
              <dd>{family.siblings}</dd>
            </div>
          </dl>
        </div>
        <div className="note px-dim">
          <span>{realityOf(c.birthYear)}</span>
          <span className="mute">Gia cảnh mở ra kiểu drama riêng, nhưng không khóa người yêu nào.</span>
        </div>
      </div>
      <div className="foot">
        <div className="row">
          <button type="button" className="btn-sub px" onClick={onBack}>
            Sửa
            <br />
            nhân vật
          </button>
          <button type="button" className="btn-main" onClick={onStart} disabled={busy}>
            {busy ? 'ĐANG LƯU...' : 'BẮT ĐẦU ĐỜI NÀY'}
          </button>
        </div>
      </div>
    </main>
  );
}
