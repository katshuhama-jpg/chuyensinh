'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Backdrop from '@/components/Backdrop';
import Feed from '@/components/Feed';
import Phone, { skinOf } from '@/components/Phone';
import Sprite from '@/components/Sprite';
import SwipeDeck from '@/components/SwipeDeck';
import { BESTIE, CAST, MOM } from '@/lib/cast';
import type { Character, Family } from '@/lib/character';
import { fateResultOf, funeralOf, lifespanOf, loveEndOf, loveTypeOf, MIDS, oldEndOf, titlesOf } from '@/lib/endings';
import { lpcLayers, type Stage } from '@/lib/look';
import { loadMe, saveGame, saveMeta, type SaveState } from '@/lib/save';
import { ageOfScene, resolverOf, statusOf } from '@/lib/scenes';
import { activeOf, choose, ctxOf, LOVE_IDS, LOVES, MAX_ACTIVE, MAX_LIFE, normalizeStory, rewind, STAT_KEYS, STAT_LABEL, txt, visibleChoices, type Choice, type Ctx, type Feedback, type LoveId, type Resolve, type Story } from '@/lib/story';
import { useAuth } from '@/lib/useAuth';

const stageOf = (age: number): Stage => (age < 13 ? 'child' : age >= 60 ? 'elder' : 'adult');

export default function Choi() {
  const { user, ready } = useAuth();
  const [state, setState] = useState<SaveState | null | undefined>(undefined);
  const [fb, setFb] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!ready) return;
    // bản lưu cũ không có cốt truyện: coi như chưa có đời nào
    loadMe().then((m) => setState(m?.state?.story ? { ...m.state, story: normalizeStory(m.state.story) } : null));
  }, [ready, user]);

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
      R={resolverOf(char, family)}
      key={`${story.path.length}${fb ? "f" : "n"}`}
      char={char}
      family={family}
      story={story}
      fb={fb}
      onChoose={(i) => {
        const r = choose(resolverOf(char, family), char, family, story, i);
        update(r.s);
        const has = r.fb.notes.length || r.fb.sys.length || r.fb.mids.length;
        setFb(has ? r.fb : null);
      }}
      onNext={() => setFb(null)}
    />
  );
}

/* ---------- một cảnh ---------- */
const CH_NO: Record<string, number> = { 'Tuổi thơ': 1, 'Tuổi teen': 2, 'Tuổi trẻ': 3, 'Lập gia đình': 4, 'Tuổi già': 5 };
const CH_ID: Record<string, string> = { 'Tuổi thơ': 'tho', 'Tuổi teen': 'teen', 'Tuổi trẻ': 'tre', 'Lập gia đình': 'nha', 'Tuổi già': 'gia' };
const CH_LINE: Record<string, string> = {
  'Tuổi thơ': 'Những mùa hè trong ngõ nhỏ',
  'Tuổi teen': 'Cảm nắng, thi cử và một giọng nói lạ',
  'Tuổi trẻ': 'Yêu, hẹn hò, và những ngã rẽ',
  'Lập gia đình': 'Cơm áo, nhà chồng nhà vợ, con cái',
  'Tuổi già': 'Những người còn ở lại',
};

function Play({ R, char, family, story, fb, onChoose, onNext }: { R: Resolve; char: Character; family: Family; story: Story; fb: Feedback | null; onChoose: (i: number) => void; onNext: () => void }) {
  // đang xem phản hồi thì vẫn vẽ cảnh vừa chọn (bước cuối trong path)
  const last = story.path[story.path.length - 1];
  const shownId = fb ? last.scene : story.scene;
  const age = ageOfScene(shownId);
  // lúc xem phản hồi, vẽ cảnh bằng trạng thái ngay trước lựa chọn (người yêu có thể vừa chia tay)
  const before = fb && story.hist.length ? { ...story.hist[story.hist.length - 1], hist: [] } : story;
  const x = ctxOf(char, family, before, age);
  const sc = R(shownId, before)!;
  const opts = visibleChoices(sc, x);
  const who = sc.who?.(x) ?? null;
  // sang chương mới thì hiện màn chương
  const prevCh = !fb && last ? R(last.scene, story.hist[story.hist.length - 1] ? { ...story.hist[story.hist.length - 1], hist: [] } : story)?.chapter : undefined;
  const [card, setCard] = useState(!fb && (story.path.length === 0 || prevCh !== sc.chapter));

  const meLayers = useMemo(() => lpcLayers(char.look, char.gender, stageOf(age)), [char, age]);
  const whoLayers = useMemo(() => {
    if (!who || who === 'he_thong') return null;
    if (who === 'mom') return lpcLayers(MOM, 'f', age >= 30 ? 'elder' : 'adult');
    if (who === 'bestie') return lpcLayers(BESTIE[char.gender], char.gender, stageOf(age));
    return lpcLayers(CAST[who][x.lg], x.lg, stageOf(age));
  }, [who, age, char.gender, x.lg]);
  const whoName = !who ? '' : who === 'he_thong' ? 'Hệ Thống' : who === 'mom' ? (x.mom === 'mẹ' ? 'Mẹ' : 'Bà') : who === 'bestie' ? story.bestie : who === 'xemmat' ? 'Người xem mắt' : x.L(who);
  const post = sc.post?.(x);
  const chat = sc.kind === 'chat' && sc.msgs;
  const swipe = sc.kind === 'swipe' && sc.cards;

  if (card)
    return (
      <main className={`app chcard ch-${CH_ID[sc.chapter]}`} onClick={() => setCard(false)}>
        <div className="chc-in">
          <div className="chc-no">CHƯƠNG {CH_NO[sc.chapter]}</div>
          <h1 className="chc-title">{sc.chapter}</h1>
          <p className="chc-line">{CH_LINE[sc.chapter]}</p>
          <p className="chc-year">
            {x.me} · {age} tuổi · năm {x.year}
            {x.year > 2026 ? ' (giả định)' : ''}
          </p>
          <button type="button" className="btn-main" onClick={() => setCard(false)}>
            ▶ VÀO CHƯƠNG
          </button>
        </div>
      </main>
    );

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
        <Notebook x={x} story={story} />
      </div>

      <div className="body" style={{ paddingTop: 4, gap: 16 }}>
        {!swipe && (
          <div className="stage px">
            {sc.bg && <Backdrop bg={sc.bg(x)} year={x.year} />}
            {who === 'he_thong' && <span className="ht-scan" aria-hidden="true" />}
            <div className="actors">
              <figure>
                <Sprite layers={meLayers} scale={2} anim="idle" dir={who ? 3 : 2} dy={age < 13 ? -9 : 0} label={`${x.me}, ${age} tuổi`} />
                <figcaption>{x.me}</figcaption>
              </figure>
              {who && <span className="spark" aria-hidden="true">{who === 'he_thong' ? '!' : '♥'}</span>}
              {who === 'he_thong' && (
                <figure>
                  <div className="ht-box" aria-hidden="true">
                    <span>◆</span>
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
            
          </div>
        )}

        <div className="textbox px-dim">
          {sc.text(x).map((p, i) => (
            <p key={i} className={`tw ${who === 'he_thong' && p.startsWith('"') ? 'ht-line' : ''}`} style={{ animationDelay: `${i * 0.35}s` }}>
              {p}
            </p>
          ))}
        </div>

        {post && (
          <Feed
            post={post}
            photo={
              post.photo ? (
                <Sprite layers={lpcLayers(CAST[post.photo[0]][x.lg], x.lg, 'adult')} scale={2} anim="idle" dir={2} label={`Ảnh của ${post.author}`} />
              ) : undefined
            }
          />
        )}

        {chat && (
          <Phone
            key={shownId + String(!!fb)}
            skin={skinOf(x.year)}
            me={x.me}
            name={whoName}
            year={x.year}
            avatar={whoLayers ? <Sprite layers={whoLayers} scale={1} anim="idle" dir={2} label="" /> : undefined}
            msgs={sc.msgs!(x)}
            opts={fb ? undefined : opts.map((o) => txt(o.t, x))}
            sent={fb && /^["(]/.test(last.choice) ? last.choice : undefined}
            timer={sc.timer}
            timeout={sc.timeout}
            onChoose={onChoose}
          />
        )}

        {swipe && !fb && (
          <SwipeDeck
            cards={sc.cards!(x)}
            year={x.year}
            onDone={(id) => {
              const k = opts.findIndex((o) => o.loveId === id);
              onChoose(k >= 0 ? k : opts.length - 1);
            }}
          />
        )}

        {fb ? (
          <FeedbackBox fb={fb} x={x} after={story} onNext={onNext} />
        ) : sc.kind === 'hub' ? (
          <HubBoard x={x} opts={opts} onChoose={onChoose} />
        ) : (
          !chat && !swipe && <Choices opts={opts.map((o) => txt(o.t, x))} onChoose={onChoose} />
        )}

      </div>
    </main>
  );
}

function Choices({ opts, onChoose }: { opts: string[]; onChoose: (i: number) => void }) {
  const done = useRef(false);
  const pick = (i: number) => {
    if (done.current) return;
    done.current = true;
    onChoose(i);
  };
  return (
    <div className="choices">
      {opts.map((t, i) => (
        <button key={i} type="button" className="opt px" style={{ animationDelay: `${0.3 + i * 0.08}s` }} onClick={() => pick(i)}>
          <b>{t}</b>
        </button>
      ))}
    </div>
  );
}

function FeedbackBox({ fb, x, after, onNext }: { fb: Feedback; x: Ctx; after: Story; onNext: () => void }) {
  return (
    <div className="fb" role="status">
      {fb.met.map((id) => (
        <NewFace key={id} id={id} x={x} count={after.met.indexOf(id) + 1} />
      ))}
      {fb.sys.map((n, i) => (
        <div key={`s${i}`} className="ht-pop">
          <div className="ht-pop-h">◆ HỆ THỐNG</div>
          <p>{n}</p>
        </div>
      ))}
      {fb.notes.map((n, i) => (
        <p key={`n${i}`} className="fb-note">
          ✦ {n}
        </p>
      ))}
      {fb.mids.map((id) => (
        <div key={id} className="stamp-card">
          <span className="stamp-mark">KẾT CỤC GIỮA CHỪNG</span>
          <b>{MIDS[id]?.name}</b>
          <small>{MIDS[id]?.desc}</small>
          <small className="stamp-sub">Đã ghi vào Sổ Tình · đời vẫn tiếp tục</small>
        </div>
      ))}
      <button type="button" className="btn-main" onClick={onNext} style={{ fontSize: 26, minHeight: 52 }}>
        TIẾP ▶
      </button>
    </div>
  );
}

/** Thẻ hồ sơ người mới bước vào đời */
function NewFace({ id, x, count }: { id: LoveId; x: Ctx; count: number }) {
  const layers = useMemo(() => lpcLayers(CAST[id][x.lg], x.lg, stageOf(x.age)), [id, x.lg, x.age]);
  return (
    <div className="newface">
      <span className="nf-tag">NGƯỜI MỚI BƯỚC VÀO ĐỜI BẠN</span>
      <div className="nf-row">
        <div className="nf-photo">
          <Sprite layers={layers} scale={2} anim="idle" dir={2} label={x.L(id)} />
        </div>
        <div className="nf-info">
          <b>{x.L(id)}</b>
          <span>{LOVES[id].job[x.lg === 'm' ? 0 : 1]}</span>
          <small>{LOVES[id].kind}</small>
          <small className="nf-like">Thích {LOVES[id].likesName}</small>
        </div>
      </div>
      <div className="nf-count">
        Người thứ {count}/{MAX_LIFE} trong đời
      </div>
    </div>
  );
}

/** Bảng tình duyên: 5 ô người ấy, mỗi ô có việc riêng; bên dưới là việc chung */
function HubBoard({ x, opts, onChoose }: { x: Ctx; opts: Choice[]; onChoose: (i: number) => void }) {
  const [open, setOpen] = useState<LoveId | null>(null);
  const done = useRef(false);
  const pick = (c: Choice) => {
    if (done.current) return;
    done.current = true;
    onChoose(opts.indexOf(c));
  };
  const act = activeOf(x.s);
  const slots: (LoveId | null)[] = [...act, ...Array(Math.max(0, MAX_ACTIVE - act.length)).fill(null)];
  const global = opts.filter((o) => !o.loveId);
  const ICON: Record<string, string> = { chat: '✉', date: '♥', confess: '❀', drop: '✕', quet: '⇆', explore: '✈', friends: '☺', work: '▣' };
  return (
    <div className="hub">
      <div className="hub-top">
        <span>
          Đang có <b>{act.length}</b>/{MAX_ACTIVE} người
        </span>
        <span>
          Đã gặp <b>{x.s.met.length}</b>/{MAX_LIFE} người trong đời
        </span>
      </div>
      <div className="hub-slots">
        {slots.map((id, i) =>
          id ? (
            <Slot key={id} id={id} x={x} open={open === id} onOpen={() => setOpen(open === id ? null : id)} />
          ) : (
            <div key={`e${i}`} className="slot empty" aria-label="Ô trống">
              <span>?</span>
              <small>Ô trống</small>
            </div>
          ),
        )}
      </div>
      {open && (
        <div className="hub-acts px-dim">
          <div className="hub-acts-h">Với {x.L(open)}:</div>
          {opts
            .filter((o) => o.loveId === open)
            .map((o) => (
              <button key={o.act} type="button" className={`opt px act-${o.act}`} onClick={() => pick(o)}>
                <b>
                  {ICON[o.act ?? '']} {txt(o.t, x)}
                </b>
              </button>
            ))}
        </div>
      )}
      {!open && act.length > 0 && <p className="mute hub-hint">Bấm vào một người để nhắn tin, hẹn hò, tỏ tình hoặc buông tay.</p>}
      <div className="hub-global">
        {global.map((o) => (
          <button key={o.act} type="button" className="tile px hub-g" onClick={() => pick(o)}>
            <i aria-hidden="true">{ICON[o.act ?? '']}</i>
            {txt(o.t, x)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slot({ id, x, open, onOpen }: { id: LoveId; x: Ctx; open: boolean; onOpen: () => void }) {
  const layers = useMemo(() => lpcLayers(CAST[id][x.lg], x.lg, 'adult'), [id, x.lg]);
  const st = statusOf(x.s, id);
  return (
    <button type="button" className={`slot ${open ? 'on' : ''} st-${st === 'Người yêu' ? 'yeu' : st === 'Mập mờ' ? 'mapmo' : 'moi'}`} onClick={onOpen} aria-expanded={open}>
      <span className="slot-photo">
        <Sprite layers={layers} scale={1} anim="idle" dir={2} label={x.L(id)} />
      </span>
      <b>{x.L(id)}</b>
      <small>{st === 'Người yêu' ? '♥ Người yêu' : st}</small>
      <span className="slot-meter" aria-label={`Độ thân ${x.s.love[id]}`}>
        <i style={{ width: `${x.s.love[id]}%` }} />
      </span>
    </button>
  );
}

/** Nút Sổ tay ở góc trên: bấm mở bảng tình cảm với những người đã gặp và chỉ số của bạn */
function Notebook({ x, story }: { x: Ctx; story: Story }) {
  const [open, setOpen] = useState(false);
  const met = story.met ?? LOVE_IDS.filter((id) => story.love[id] > 0);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  return (
    <>
      <button type="button" className="nb-btn px" onClick={() => setOpen(true)} aria-label="Mở Sổ tay tình cảm">
        <span aria-hidden="true">♥</span>
        <small>SỔ TAY</small>
        {met.length > 0 && <i className="nb-count">{met.length}</i>}
      </button>
      {open && (
        <div className="nb-veil" onClick={() => setOpen(false)}>
          <div className="nb-sheet px" role="dialog" aria-modal="true" aria-label="Sổ tay tình cảm" onClick={(e) => e.stopPropagation()}>
            <div className="nb-h">
              <b>♥ SỔ TAY TÌNH CẢM</b>
              <button type="button" className="nb-x" onClick={() => setOpen(false)} aria-label="Đóng">
                ✕
              </button>
            </div>
            <Meters x={x} story={story} met={met} />
          </div>
        </div>
      )}
    </>
  );
}

const cells = (v: number, cls = '') => Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.round(v / 10) ? `on ${cls}` : ''} />);

/** Độ thân với những người đã gặp và chỉ số của bạn */
function Meters({ x, story, met }: { x: Ctx; story: Story; met: LoveId[] }) {
  return (
    <div className="meters">
      <p className="mt-hint">
        Đã gặp {met.length}/{MAX_LIFE} người trong đời. Mỗi lựa chọn làm độ thân và chỉ số lên xuống.
      </p>
      {met.length === 0 && <p className="mt-hint">Chưa gặp ai. Người ấy đang ở đâu đó thôi.</p>}
      <div className="nb-list">
        {met.map((id) => (
          <LoveRow key={id} id={id} x={x} story={story} />
        ))}
      </div>
      <p className="mt-hint">Lúc cầu hôn: độ thân từ 70 và đúng kiểu người ấy thích thì mới thành đôi hạnh phúc.</p>

      <div className="mt-h">BẠN - CHỈ SỐ (0 ĐẾN 100)</div>
      {STAT_KEYS.map((k) => (
        <div className="stat" key={k}>
          <span>{STAT_LABEL[k]}</span>
          <span className="cells" role="meter" aria-label={STAT_LABEL[k]} aria-valuenow={story.stats[k]} aria-valuemin={0} aria-valuemax={100}>
            {cells(story.stats[k])}
          </span>
          <span>{story.stats[k]}</span>
        </div>
      ))}
    </div>
  );
}

function LoveRow({ id, x, story }: { id: LoveId; x: Ctx; story: Story }) {
  const layers = useMemo(() => lpcLayers(CAST[id][x.lg], x.lg, 'adult'), [id, x.lg]);
  const lost = story.flags.includes(`${id}_out`);
  const st = story.partner === id ? (story.married ? '♥ Bạn đời' : '♥ Người yêu') : lost ? 'Đã lỡ nhau' : statusOf(story, id);
  return (
    <div className={`nb-row ${lost ? 'lost' : ''}`}>
      <span className="nb-photo">
        <Sprite layers={layers} scale={1} anim="idle" dir={2} label={x.L(id)} />
      </span>
      <div className="nb-info">
        <div className="nb-name">
          <b>{x.L(id)}</b>
          <small className={story.partner === id ? 'yeu' : ''}>{st}</small>
        </div>
        <small>
          {LOVES[id].job[x.lg === 'm' ? 0 : 1]} · thích {LOVES[id].likesName}
        </small>
        <div className="stat">
          <span className="cells" role="meter" aria-label={`Độ thân với ${x.L(id)}`} aria-valuenow={story.love[id]} aria-valuemin={0} aria-valuemax={100}>
            {cells(story.love[id], 'looks')}
          </span>
          <span>{lost ? '-' : story.love[id]}</span>
        </div>
      </div>
    </div>
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
          {titlesOf(story).map((t) => (
            <div className="end-row" key={t.name}>
              <span>Danh hiệu</span>
              <b>★ {t.name}</b>
              <small>{t.desc}</small>
            </div>
          ))}
          <div className="end-row">
            <span>Những người đã gặp</span>
            <b>
              {(story.met ?? []).length}/{MAX_LIFE} người
            </b>
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
          {(story.met ?? []).map((id) => (
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
