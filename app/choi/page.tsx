'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sprite from '@/components/Sprite';
import { BESTIE, CAST, MOM } from '@/lib/cast';
import type { Character, Family } from '@/lib/character';
import { fateResultOf, funeralOf, lifespanOf, loveEndOf, loveTypeOf, MIDS, oldEndOf } from '@/lib/endings';
import { lpcLayers, type Stage } from '@/lib/look';
import { loadMe, saveGame, saveMeta, type SaveState } from '@/lib/save';
import { getScene, sceneTable, SCENES } from '@/lib/scenes';
import { choose, ctxOf, LOVE_IDS, LOVES, rewind, STAT_KEYS, STAT_LABEL, txt, visibleChoices, type Ctx, type Feedback, type Story } from '@/lib/story';
import { useAuth } from '@/lib/useAuth';

const stageOf = (age: number): Stage => (age < 13 ? 'child' : age >= 60 ? 'elder' : 'adult');

export default function Choi() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<SaveState | null | undefined>(undefined);
  const [fb, setFb] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/dang-nhap?next=/choi');
      return;
    }
    // bản lưu cũ không có cốt truyện: coi như chưa có đời nào
    loadMe().then((m) => setState(m?.state?.story ? m.state : null));
  }, [ready, user, router]);

  const update = useCallback(
    (story: Story) => {
      if (!state) return;
      const next = { ...state, story };
      setState(next);
      void saveGame(next);
      window.scrollTo(0, 0);
    },
    [state],
  );

  if (state === undefined) return <main className="app dither" />;
  if (state === null)
    return (
      <main className="app dither">
        <div className="body" style={{ paddingTop: 48 }}>
          <div className="prose">
            <p>Bạn chưa bắt đầu đời nào.</p>
            <Link href="/tao-nhan-vat" className="btn-main">
              ▶ BẮT ĐẦU
            </Link>
          </div>
        </div>
      </main>
    );

  const { char, family, story } = state;
  if (story.scene === 'end' && !fb) return <Ending char={char} family={family} story={story} onRewind={(i) => update(rewind(story, i))} />;

  return (
    <Play
      key={story.path.length}
      char={char}
      family={family}
      story={story}
      fb={fb}
      onChoose={(i) => {
        const x = ctxOf(char, family, story, SCENES[story.scene].age);
        const r = choose(sceneTable(x), char, family, story, i);
        update(r.s);
        const has = r.fb.notes.length || r.fb.sys.length || r.fb.mids.length;
        setFb(has ? r.fb : null);
      }}
      onNext={() => setFb(null)}
    />
  );
}

/* ---------- một cảnh ---------- */
function Play({ char, family, story, fb, onChoose, onNext }: { char: Character; family: Family; story: Story; fb: Feedback | null; onChoose: (i: number) => void; onNext: () => void }) {
  // đang xem phản hồi thì vẫn vẽ cảnh vừa chọn (bước cuối trong path)
  const shownId = fb ? story.path[story.path.length - 1].scene : story.scene;
  const age = SCENES[shownId].age;
  const x = ctxOf(char, family, story, age);
  const sc = getScene(shownId, x);
  const opts = visibleChoices(sc, x);
  const who = sc.who?.(x) ?? null;

  const meLayers = useMemo(() => lpcLayers(char.look, char.gender, stageOf(age)), [char, age]);
  const whoLayers = useMemo(() => {
    if (!who || who === 'he_thong') return null;
    if (who === 'mom') return lpcLayers(MOM, 'f', age >= 30 ? 'elder' : 'adult');
    if (who === 'bestie') return lpcLayers(BESTIE[char.gender], char.gender, stageOf(age));
    return lpcLayers(CAST[who][x.lg], who === 'xemmat' ? x.lg : x.lg, stageOf(age));
  }, [who, age, char.gender, x.lg]);
  const whoName = !who ? '' : who === 'he_thong' ? 'Hệ Thống' : who === 'mom' ? (x.mom === 'mẹ' ? 'Mẹ' : 'Bà') : who === 'bestie' ? story.bestie : who === 'xemmat' ? 'Người xem mắt' : x.L(who);

  return (
    <main className="app dither">
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            {sc.chapter.toUpperCase()} · {age} TUỔI · {x.year}
            {x.year > 2026 ? ' (GIẢ ĐỊNH)' : ''}
          </div>
          <h1>{txt(sc.title, x)}</h1>
        </div>
      </div>

      <div className="body" style={{ paddingTop: 4, gap: 16 }}>
        <div className="stage px">
          <span className="stars" aria-hidden="true" />
          <div className="actors">
            <figure>
              <Sprite layers={meLayers} scale={2} anim="idle" dir={who ? 3 : 2} dy={age < 13 ? -9 : 0} label={`${x.me}, ${age} tuổi`} />
              <figcaption>{x.me}</figcaption>
            </figure>
            {who === 'he_thong' && (
              <figure>
                <div className="ht-box" aria-hidden="true">
                  ◆
                </div>
                <figcaption>Hệ Thống</figcaption>
              </figure>
            )}
            {whoLayers && (
              <figure>
                <Sprite layers={whoLayers} scale={2} anim="idle" dir={1} dy={age < 13 ? -9 : 0} label={whoName} />
                <figcaption>{whoName}</figcaption>
              </figure>
            )}
          </div>
          <span className="ground" aria-hidden="true" />
        </div>

        <div className="textbox px-dim">
          {sc.text(x).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {sc.kind === 'chat' && sc.msgs && <Phone x={x} title={whoName} msgs={sc.msgs(x)} />}

        {fb ? (
          <FeedbackBox fb={fb} onNext={onNext} />
        ) : (
          <Choices opts={opts.map((o) => txt(o.t, x))} timer={sc.kind === 'chat' ? sc.timer : undefined} timeout={sc.timeout} onChoose={onChoose} />
        )}

        <Meters x={x} story={story} />
      </div>
    </main>
  );
}

function Phone({ x, title, msgs }: { x: Ctx; title: string; msgs: { me: boolean; t: string }[] }) {
  const letter = x.year < 2000;
  return (
    <div className={`phone px ${letter ? 'letter' : ''}`}>
      <div className="phone-top">{letter ? `Thư của ${title}` : title}</div>
      <div className="phone-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.me ? 'me' : ''}`} style={{ animationDelay: `${i * 0.6}s` }}>
            {m.t}
          </div>
        ))}
        {!letter && <div className="typing">đang chờ trả lời...</div>}
      </div>
    </div>
  );
}

function Choices({ opts, timer, timeout, onChoose }: { opts: string[]; timer?: number; timeout?: number; onChoose: (i: number) => void }) {
  const [left, setLeft] = useState(timer ?? 0);
  const done = useRef(false);
  const pick = (i: number) => {
    if (done.current) return;
    done.current = true;
    onChoose(i);
  };
  useEffect(() => {
    if (!timer) return;
    const t = setInterval(() => setLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);
  useEffect(() => {
    if (timer && left <= 0) pick(timeout ?? opts.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  return (
    <div className="choices">
      {timer ? (
        <div className="timer" role="timer" aria-label={`Còn ${Math.max(0, left)} giây`}>
          <i style={{ width: `${(Math.max(0, left) / timer) * 100}%` }} />
          <span>{Math.max(0, left)}s</span>
        </div>
      ) : null}
      {opts.map((t, i) => (
        <button key={i} type="button" className="opt px" onClick={() => pick(i)}>
          <b>{t}</b>
        </button>
      ))}
    </div>
  );
}

function FeedbackBox({ fb, onNext }: { fb: Feedback; onNext: () => void }) {
  return (
    <div className="fb px" role="status">
      {fb.notes.map((n, i) => (
        <p key={`n${i}`} className="fb-note">
          ✦ {n}
        </p>
      ))}
      {fb.sys.map((n, i) => (
        <p key={`s${i}`} className="fb-sys">
          {n}
        </p>
      ))}
      {fb.mids.map((id) => (
        <div key={id} className="fb-mid">
          <span>KẾT CỤC GIỮA CHỪNG</span>
          <b>{MIDS[id]?.name}</b>
          <small>{MIDS[id]?.desc}</small>
        </div>
      ))}
      <button type="button" className="btn-main" onClick={onNext} style={{ fontSize: 26, minHeight: 52 }}>
        TIẾP ▶
      </button>
    </div>
  );
}

/** Độ thân với dàn người yêu và chỉ số */
function Meters({ x, story }: { x: Ctx; story: Story }) {
  const met = LOVE_IDS.filter((id) => story.love[id] > 0 || story.flags.includes(`${id}_out`));
  return (
    <details className="meters px-dim">
      <summary>Người ấy và chỉ số</summary>
      {met.map((id) => (
        <div className="stat" key={id}>
          <span>
            {x.L(id)}
            {story.partner === id ? ' ♥' : ''}
          </span>
          <span className="cells" role="meter" aria-label={`Độ thân với ${x.L(id)}`} aria-valuenow={story.love[id]} aria-valuemin={0} aria-valuemax={100}>
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className={i < Math.round(story.love[id] / 10) ? 'on looks' : ''} />
            ))}
          </span>
          <span>{story.flags.includes(`${id}_out`) ? '-' : story.love[id]}</span>
        </div>
      ))}
      {STAT_KEYS.map((k) => (
        <div className="stat" key={k}>
          <span>{STAT_LABEL[k]}</span>
          <span className="cells" role="meter" aria-label={STAT_LABEL[k]} aria-valuenow={story.stats[k]} aria-valuemin={0} aria-valuemax={100}>
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} className={i < Math.round(story.stats[k] / 10) ? 'on' : ''} />
            ))}
          </span>
          <span>{story.stats[k]}</span>
        </div>
      ))}
    </details>
  );
}

/* ---------- cuối đời ---------- */
function Ending({ char, family, story, onRewind }: { char: Character; family: Family; story: Story; onRewind: (i: number) => void }) {
  const love = loveEndOf(char, story);
  const old = oldEndOf(story);
  const type = loveTypeOf(story);
  const fate = fateResultOf(story);
  const funeral = funeralOf(char, family, story);
  const me = char.name.trim().split(/\s+/).pop();
  const layers = useMemo(() => lpcLayers(char.look, char.gender, 'elder'), [char]);
  const saved = useRef(false);

  // ghi kết cục vào Sổ Tình (một lần mỗi lần tới cuối)
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    loadMe().then((m) => {
      const meta = m?.meta ?? {};
      const endings = Array.from(new Set([...(meta.endings ?? []), love.id, old.id, ...story.mids]));
      void saveMeta({ ...meta, endings, lives: (meta.lives ?? 0) + 1 });
    });
  }, [love.id, old.id, story.mids]);

  return (
    <main className="app dither">
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            HẾT MỘT ĐỜI
          </div>
          <h1>{char.name}</h1>
        </div>
      </div>
      <div className="body" style={{ paddingTop: 8 }}>
        <div className="card px">
          <div className="who">
            <Sprite layers={layers} scale={2} anim="idle" dir={2} label={`${me} lúc già`} />
            <div className="facts">
              <span>
                {char.birthYear} - {char.birthYear + lifespanOf(char, story)} ({lifespanOf(char, story)} tuổi)
              </span>
              <span>{family.province}</span>
            </div>
          </div>
          <div className="dash" aria-hidden="true" />
          <div className="end-row">
            <span>Kết cục tình yêu</span>
            <b>{love.name}</b>
            <small>{love.desc}</small>
          </div>
          <div className="end-row">
            <span>Cuối đời</span>
            <b>{old.name}</b>
            <small>{old.desc}</small>
          </div>
          <div className="end-row">
            <span>Bạn yêu kiểu gì</span>
            <b>{type.name}</b>
            <small>{type.desc}</small>
          </div>
        </div>

        <div className="note px-dim">
          <span className="mute">Lời thầy bói năm đầy tháng:</span>
          <span>“{fate.text}”</span>
          <b style={{ fontWeight: 400, color: 'var(--accent)' }}>{fate.came ? 'Lời phán đã ứng nghiệm.' : `${me} đã thay đổi được vận mệnh.`}</b>
        </div>

        <div className="note px-dim">
          <span className="mute">Những người đến tiễn:</span>
          {funeral.map((p) => (
            <span key={p}>· {p}</span>
          ))}
        </div>

        {story.mids.length > 0 && (
          <div className="note px-dim">
            <span className="mute">Kết cục giữa chừng đã mở:</span>
            {story.mids.map((id) => (
              <span key={id}>
                · <b style={{ fontWeight: 400 }}>{MIDS[id]?.name}</b> - {MIDS[id]?.desc}
              </span>
            ))}
          </div>
        )}

        <section className="group">
          <div className="label">Sơ đồ ngã rẽ</div>
          <span className="mute" style={{ fontSize: 18 }}>
            Bấm vào một ngã để quay lại đó và rẽ lối khác.
          </span>
          <ol className="path">
            {story.path.map((p, i) => (
              <li key={i}>
                <button type="button" className="opt px-dim" onClick={() => onRewind(i)}>
                  <span>
                    {p.age} tuổi · {p.title}
                  </span>
                  <b>{p.choice}</b>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="note px-dim">
          <span className="mute">Dàn người yêu đời này:</span>
          {LOVE_IDS.map((id) => (
            <span key={id}>
              · {LOVES[id][char.gender === 'f' ? 'm' : 'f']} ({LOVES[id].kind.toLowerCase()}): độ thân {story.love[id]}
            </span>
          ))}
        </div>

        <Link href="/tao-nhan-vat" className="btn-main">
          ▶ SỐNG MỘT ĐỜI MỚI
        </Link>
      </div>
    </main>
  );
}
