'use client';

import Link from 'next/link';
import { composeStrip } from '@/lib/lpc';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Bg } from '@/components/Backdrop';
import TileStage from '@/components/TileStage';
import Feed from '@/components/Feed';
import Phone, { skinOf } from '@/components/Phone';
import CallScreen, { callSkinOf } from '@/components/CallScreen';
import TapGame from '@/components/TapGame';
import { CheerMeter, SlideUnlock } from '@/components/MiniActs';
import Sprite from '@/components/Sprite';
import SwipeDeck from '@/components/SwipeDeck';
import { BESTIE, CAST, MOM } from '@/lib/cast';
import { placeOf, siblingText, type Character, type Family } from '@/lib/character';
import { fateResultOf, funeralOf, lifespanOf, loveEndOf, loveTypeOf, MIDS, oldEndOf, titlesOf } from '@/lib/endings';
import { lpcLayers, type Stage } from '@/lib/look';
import { loadMe, saveGame, saveMeta, type SaveState } from '@/lib/save';
import { activeMission, ageOfScene, resolverOf, statusOf } from '@/lib/scenes';
import { STARS } from '@/lib/stars';
import { historyOf } from '@/lib/drama';
import { moneyLabelOf } from '@/lib/lovemoney';
import { commit } from '@/lib/board';
import { AREAS, doAction, doMilestone, lifePathOf, mByParents, milestoneDue, mOptions, mPrice, mWealth, optionsOf, tallyOf, type AreaKey, type Milestone } from '@/lib/actions';
import { cashOf, fmtCash, fmtVND, pointsOf, priceAt } from '@/lib/money';
import { activeOf, choose, ctxOf, canRewind, fastForward, isStop, prevOf, LOVE_IDS, LOVES, MAX_ACTIVE, MAX_LIFE, normalizeStory, rewind, MAIN_STATS, STAT_KEYS, STAT_LABEL, txt, visibleChoices, type Choice, type Ctx, type Feedback, type LoveId, type Photo, type Resolve, type Story } from '@/lib/story';
import { useAuth } from '@/lib/useAuth';
import { stageOf as bgStage } from '@/lib/scenebg';
import { newsOf } from '@/lib/world';
import { openerOf } from '@/lib/openers';
import { PERSONA, PERSONA_AXES, jobOf, profileOf } from '@/lib/profiles';
import { lifeOf } from '@/lib/lives';
import { FLAVOR } from '@/lib/dates';
import { GIFT_CAT, type GiftCat } from '@/lib/gifts';

const stageOf = (age: number): Stage => (age < 13 ? 'child' : age >= 60 ? 'elder' : 'adult');

export default function Choi() {
  const { user, ready } = useAuth();
  const [state, setState] = useState<SaveState | null | undefined>(undefined);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [ff, setFf] = useState<{ ch: string; lines: { age: number; year: number; t: string }[] } | null>(null);

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
  if (ff)
    return (
      <main className="app dither">
        <div className="head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ fontSize: 18 }}>
              ⏩ TUA NHANH
            </div>
            <h1>{ff.ch}</h1>
          </div>
        </div>
        <div className="body" style={{ paddingTop: 4 }}>
          <LifeFeed lines={ff.lines} onDone={() => setFf(null)} />
        </div>
      </main>
    );
  if (story.scene === 'end' && !fb) return <Ending char={char} family={family} story={story} onRewind={(i) => update(rewind(story, i))} />;

  return (
    <Board
      char={char}
      family={family}
      story={story}
      fb={fb}
      onCommit={(i, note) => {
        const r = commit(resolverOf(char, family), char, family, story, i, note);
        update(r.s);
        const has = r.fb.notes.length || r.fb.sys.length || r.fb.mids.length || r.fb.met.length;
        return has ? r.fb : null;
      }}
      setFb={setFb}
      onStory={(st) => update(st)}
      onFast={(ch) => {
        const r = fastForward(resolverOf(char, family), char, family, story);
        const add = r.lines.map((l) => ({ ...l, k: 'feed' as const }));
        update({ ...r.s, log: [...(r.s.log ?? []), ...add].slice(-500) });
        setFb(null);
        setFf({ ch, lines: r.lines.length ? r.lines : [{ age: 0, year: char.birthYear, t: 'Không có gì để tua.' }] });
      }}
    />
  );
}


/* ---------- bảng đời kiểu 1 in 8 Billion ---------- */
const WEALTH_DOTS: Record<string, number> = { 'Mồ côi, ở với ông bà': 1, 'Nhà nông': 2, 'Lao động phổ thông': 2, 'Tiểu thương': 3, 'Công chức trung lưu': 3, 'Khá giả': 4, 'Hào môn': 5 };
const SPEEDS = [1, 2, 4, 8, 12, 16];
/** 1× = 60 giây một năm, 16× = khoảng 4 giây một năm */
const YEAR_SEC = 60;

function Board({
  char,
  family,
  story,
  fb,
  onCommit,
  setFb,
  onStory,
  onFast,
}: {
  char: Character;
  family: Family;
  story: Story;
  fb: Feedback | null;
  onCommit: (i: number, note?: string) => Feedback | null;
  setFb: (f: Feedback | null) => void;
  onStory: (s: Story) => void;
  onFast: (chapter: string) => void;
}) {
  const R = useMemo(() => resolverOf(char, family), [char, family]);
  const sc = story.scene !== 'end' ? R(story.scene, story) : undefined;
  const age = sc?.age ?? 0;
  const x = ctxOf(char, family, story, age);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(false);
  const [menu, setMenu] = useState(false);
  const [shown, setShown] = useState(0);
  const [more, setMore] = useState(24);
  const [born, setBorn] = useState(story.path.length > 0);
  const [area, setArea] = useState<AreaKey | null>(null);
  const isFeed = sc?.kind === 'feed';
  const lines = useMemo(() => (isFeed && sc?.feed ? sc.feed(x) : []), [story.scene, story.path.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const stop = !!sc && isStop(sc.id);
  const ageNow = isFeed ? (lines[Math.max(0, shown - 1)]?.age ?? age) : age;
  const busy = !!fb || (!!sc && !isFeed && (!auto || stop));
  // mốc đời: đến tuổi thì dừng đồng hồ và hỏi
  const ms = born && !busy ? milestoneDue(story, ageNow) : null;
  const running = born && !paused && !menu && !area && !ms;

  useEffect(() => setShown(0), [story.scene, story.path.length]);

  const [toast, setToast] = useState<string | null>(null);
  // hệ quả của lựa chọn vừa rồi, hiện ở đầu khung ngã rẽ kế tiếp (khi các ngã rẽ nối nhau)
  const [lastFx, setLastFx] = useState<string | null>(null);
  // chọn xong là đóng ngay, không hiện lại cảnh vừa chọn; hệ quả hiện thành một dòng nhắc nhỏ và vào nhật ký
  const go = useCallback(
    (i: number, note?: string, quiet = false) => {
      const f = onCommit(i, note);
      setFb(null);
      // hệ quả thấy ngay: đổi gì (♥, chỉ số, tiền) và một dòng chuyện kèm theo
      const msg = f && !quiet ? [f.delta ? `→ ${f.delta}` : null, [...f.notes, ...f.sys][0] ?? null].filter(Boolean).join('\n') || null : null;
      // đang trong chuỗi ngã rẽ thì gom lại, hiện ba dòng gần nhất khi khung đóng
      if (msg) setToast((t) => (t ? `${t}\n${msg}`.split('\n').slice(-3).join('\n') : msg));
      setLastFx(msg);
    },
    [onCommit, setFb],
  );
  // thuyết minh khi sang năm mới (không tính dòng thời gian, vì nó tự ghi năm)
  const prevAge = useRef(age);
  useEffect(() => {
    if (age > prevAge.current && !isFeed) {
      const n = age - prevAge.current;
      const line = `⏩ ${n > 1 ? `${n} năm trôi qua` : 'Một năm trôi qua'}. Năm ${char.birthYear + age}, ${x.me} ${age} tuổi.`;
      setToast((t) => (t ? `${t}\n${line}`.split('\n').slice(-3).join('\n') : line));
    }
    prevAge.current = age;
  }, [age]); // eslint-disable-line react-hooks/exhaustive-deps
  // dòng nhắc chỉ hiện khi không có khung ngã rẽ che, và chỉ đếm giờ lúc đang hiện
  const [toastHold, setToastHold] = useState(false);
  useEffect(() => {
    if (!toast || toastHold) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast, toastHold]);

  // đồng hồ: mỗi nhịp hiện một năm; hết các năm thì sang cảnh tiếp
  useEffect(() => {
    if (!isFeed || !running || fb) return;
    const t = setTimeout(() => (shown < lines.length ? setShown(shown + 1) : go(0, undefined, true)), (shown === 0 ? 600 : YEAR_SEC * 1000) / speed);
    return () => clearTimeout(t);
  }, [isFeed, running, fb, shown, lines.length, speed, go]);

  // tự chọn hộ cả mốc đời (chọn ngẫu nhiên trong những việc đủ tiền)
  useEffect(() => {
    if (!ms || !auto || paused) return;
    const t = setTimeout(() => {
      const mx = ctxOf(char, family, story, ageNow);
      const ok = mOptions(ms, mx).map((o, i) => (mPrice(ms, o, mx) <= mWealth(ms, mx) ? i : -1)).filter((i) => i >= 0);
      const i = ok[Math.floor(Math.random() * ok.length)] ?? 0;
      const r = doMilestone(R, char, family, story, ageNow, ms, i);
      onStory({ ...r.s, log: [...(r.s.log ?? []), { age: ageNow, year: char.birthYear + ageNow, t: `${ms.title(mx)}: ${r.t}`, k: 'pick' as const }].slice(-500) });
    }, 1400 / speed);
    return () => clearTimeout(t);
  });

  // tự chọn hộ (trừ những ngã rẽ lớn)
  useEffect(() => {
    if (!sc || isFeed || !auto || stop || fb || !running) return;
    const t = setTimeout(() => {
      const opts = visibleChoices(sc, x);
      go(sc.kind === 'reflect' ? opts.length - 1 : Math.floor(Math.random() * opts.length), undefined, true);
    }, 1400 / speed);
    return () => clearTimeout(t);
  }); // chạy lại mỗi lần vẽ là đủ: đã có điều kiện chặn

  const curAge = isFeed ? (lines[Math.max(0, shown - 1)]?.age ?? age) : age;
  const year = char.birthYear + curAge;
  const pending = isFeed ? lines.slice(0, shown) : [];
  const log = [...(story.log ?? []), ...pending.map((l) => ({ ...l, k: 'feed' as const }))].reverse();
  const decide = !!sc && born && ((!isFeed && (!auto || stop)) || !!fb);
  // khung ngã rẽ: giữ lại một nhịp khi đóng để trượt xuống êm; ngã rẽ kế tiếp đến ngay thì chỉ đổi nội dung, không trượt lại
  const [sheetOn, setSheetOn] = useState(decide);
  const lastSheet = useRef<ReactNode>(null);
  useEffect(() => {
    setToastHold(decide);
    if (decide) return setSheetOn(true);
    setLastFx(null);
    const t = setTimeout(() => setSheetOn(false), 260);
    return () => clearTimeout(t);
  }, [decide]);
  const xa = ctxOf(char, family, story, curAge);
  const tally = tallyOf(story);
  const span = Math.max(80, lifespanOf(char, story));


  if (!born) return <BirthCard char={char} family={family} story={story} onBegin={() => setBorn(true)} />;

  return (
    <main className="app dither lb">
      <div className="lb-top">
        <div className="lb-age">
          <span>Tuổi</span>
          <b>{curAge}</b>
          <small>
            {year} · {x.me}
             · 1 năm ≈ {Math.round(YEAR_SEC / speed)} giây
          </small>
          <Notebook x={x} story={story} />
        </div>
        <div className="lb-money" aria-label="Tài sản">
          <span>{curAge < 15 ? 'Heo đất' : 'Tài sản'}</span>
          <b>{fmtCash(cashOf(story, year, curAge))}</b>
        </div>
        <div className="lb-bar" aria-hidden="true">
          <i key={`${story.path.length}-${shown}`} style={{ animationDuration: `${YEAR_SEC / speed}s`, animationPlayState: running && isFeed ? 'running' : 'paused' }} />
        </div>
        <div className="lb-ctl" role="toolbar" aria-label="Điều khiển thời gian">
          <button type="button" className="px" onClick={() => setPaused(!paused)} aria-pressed={paused}>
            {paused ? '▶ Chạy' : '❚❚ Dừng'}
          </button>
          {SPEEDS.map((v) => (
            <button key={v} type="button" className={`px ${speed === v ? 'on' : ''}`} onClick={() => (setSpeed(v), setPaused(false))}>
              {v}×
            </button>
          ))}
          <button type="button" className="px" onClick={() => (isFeed ? (shown < lines.length ? setShown(lines.length) : go(0, undefined, true)) : undefined)} disabled={!isFeed}>
            Tiếp »
          </button>
          <button type="button" className="px" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Thêm">
            ⋯
          </button>
        </div>
        {menu && (
          <div className="lb-menu px">
            <button type="button" onClick={() => (setAuto(!auto), setMenu(false))}>
              {auto ? '✓ Đang tự chọn hộ (bấm để tắt)' : 'Để game tự chọn hộ'}
            </button>
            {sc && (
              <button type="button" onClick={() => (setMenu(false), onFast(sc.chapter))}>
                ⏭ Tua hết {sc.chapter.toLowerCase()}
              </button>
            )}
            <button type="button" onClick={() => setMenu(false)}>
              Đóng
            </button>
          </div>
        )}
        <HeartLine story={story} x={x} />
        <div className="lb-stats">
          {MAIN_STATS.map((r, i) => (
            <div key={r.label} className={`ms-${i}`}>
              <span>{r.label}</span>
              <b>{Math.round(r.of(story))}</b>
              <i>
                <em style={{ width: `${r.of(story)}%` }} />
              </i>
            </div>
          ))}
        </div>
      </div>

      <LifeStage x={xa} char={char} story={story} age={curAge} />

      <div className="body lb-body">
        <section className="card-d px-dim">
          <div className="lb-h">
            <b>Nhật ký đời</b>
            <small>MỚI NHẤT Ở TRÊN</small>
          </div>
          {isFeed && shown < lines.length && <p className="lb-wait">{paused ? '❚❚ Đang dừng' : '… năm tháng đang trôi'}</p>}
          <ol className="lb-log">
            {log.slice(0, more).map((l, i) => (
              <li key={`${log.length - i}`} className={`k-${l.k} ${i < pending.length ? 'new' : ''}`}>
                <span className="lb-y">{l.k === 'ch' ? '' : `${l.age} tuổi`}</span>
                <span>{l.t}</span>
              </li>
            ))}
          </ol>
          {log.length > more && (
            <button type="button" className="btn-sub px" onClick={() => setMore(more + 40)}>
              Xem những năm trước
            </button>
          )}
        </section>

        {(() => {
          const m = activeMission(xa);
          return m ? (
            <section className="card-d px-dim">
              <p className={`mt-hint lb-mission ${m.done ? 'ok' : ''}`}>
                ✦ Nhiệm vụ Hệ Thống: <b>{m.t}</b>
                {m.done ? ' - đã xong!' : ''}
              </p>
            </section>
          ) : null;
        })()}

        <FamilyPanel char={char} family={family} story={story} age={curAge} x={x} />

        <section className="card-d px-dim">
          <div className="lb-h">
            <b>Bản đồ đời</b>
            <small>1 Ô = 1 NĂM</small>
          </div>
          <div className="lb-map">
            {Array.from({ length: Math.ceil(span / 10) * 10 }, (_, a) => {
              const m = story.mood?.[a];
              return <i key={a} className={a === curAge ? 'now' : ''} style={m !== undefined && a < curAge ? { background: `color-mix(in srgb, var(--stat) ${Math.max(15, m)}%, var(--stat-empty))` } : undefined} title={`${a} tuổi`} />;
            })}
          </div>
          <p className="mt-hint">Màu càng đậm là năm càng vui. Ô viền sáng là năm đang sống.</p>
        </section>
      </div>

      {area && !decide && (
        <div className="lb-veil" onClick={() => setArea(null)}>
          <div className="lb-sheet lb-small px" role="dialog" aria-modal="true" aria-label="Chọn việc" onClick={(e) => e.stopPropagation()}>
            <div className="lb-sh">
              <span>
                {AREAS.find((a) => a.k === area)?.icon} {AREAS.find((a) => a.k === area)?.t.toUpperCase()} · {curAge} tuổi · {year}
              </span>
              <button type="button" onClick={() => setArea(null)}>
                Đóng
              </button>
            </div>
            <div className="choices lb-acts">
              {optionsOf(area, xa).map((o, i) => (
                <button
                  key={i}
                  type="button"
                  className="opt px"
                  onClick={() => {
                    const r = doAction(R, char, family, story, curAge, area, i);
                    const name = AREAS.find((a) => a.k === area)!.t;
                    const add = [{ age: curAge, year, t: `${name}: ${r.t}`, k: 'pick' as const }, ...(r.fb.delta ? [{ age: curAge, year, t: `→ ${r.fb.delta}`, k: 'note' as const }] : []), ...[...r.fb.notes, ...r.fb.sys].slice(0, 2).map((t) => ({ age: curAge, year, t, k: 'note' as const }))];
                    onStory({ ...r.s, focus: area, log: [...(r.s.log ?? []), ...add].slice(-500) });
                    setToast([...r.fb.sys, ...r.fb.notes][0] ?? `${name}: ${r.t}`);
                    setArea(null);
                  }}
                >
                  <b>{txt(o.t, xa)}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {ms && (
        <MilestoneSheet
          m={ms}
          x={ctxOf(char, family, story, ageNow)}
          onPick={(i) => {
            const r = doMilestone(R, char, family, story, ageNow, ms, i);
            const add = [{ age: ageNow, year: char.birthYear + ageNow, t: `${ms.title(xa)}: ${r.t}`, k: 'pick' as const }, ...(r.fb.delta ? [{ age: ageNow, year: char.birthYear + ageNow, t: `→ ${r.fb.delta}`, k: 'note' as const }] : []), ...[...r.fb.notes, ...r.fb.sys].slice(0, 2).map((t) => ({ age: ageNow, year: char.birthYear + ageNow, t, k: 'note' as const }))];
            onStory({ ...r.s, log: [...(r.s.log ?? []), ...add].slice(-500) });
            setToast([...r.fb.sys, ...r.fb.notes][0] ?? `${ms.title(xa)}: ${r.t}`);
          }}
        />
      )}



      {!decide && sheetOn && lastSheet.current && (
        <div className="lb-veil out" aria-hidden="true">
          <div className="lb-sheet px">{lastSheet.current}</div>
        </div>
      )}

      {decide && (
        <div className="lb-veil">
          <div className="lb-sheet px" role="dialog" aria-modal="true" aria-label="Một ngã rẽ" ref={(el) => void (el && (lastSheet.current = <div dangerouslySetInnerHTML={{ __html: el.innerHTML }} />))}>
            <div className="lb-sh">
              <span>
                {fb ? 'CHUYỆN VỪA XẢY RA' : 'MỘT NGÃ RẼ'} · {age} tuổi · {char.birthYear + age}
              </span>
              {!fb && !stop && (
                <button type="button" onClick={() => setAuto(true)}>
                  Để game tự chọn
                </button>
              )}
            </div>
            {lastFx && (
              <p className="lb-last" role="status">
                <span>Vừa rồi</span> {lastFx}
              </p>
            )}
            <Play
              R={R}
              key={`${story.path.length}${fb ? 'f' : 'n'}`}
              char={char}
              family={family}
              story={story}
              fb={fb}
              embedded
              onChoose={(i, note) => go(i, note)}
              onNext={() => setFb(null)}
              onFast={onFast}
            />
          </div>
        </div>
      )}
    </main>
  );
}

/** Người trong lòng: người yêu, hoặc những người đang tìm hiểu */
function HeartLine({ story, x }: { story: Story; x: Ctx }) {
  const p = story.partner && story.partner !== 'xemmat' ? story.partner : null;
  const pool = LOVE_IDS.filter((id) => story.flags.includes(`pool_${id}`) && !story.flags.includes(`${id}_out`) && id !== p).sort((a, b) => story.love[b] - story.love[a]);
  const hearts = (id: LoveId) => '♥'.repeat(Math.max(1, Math.min(5, Math.ceil(story.love[id] / 20))));
  if (!p && !pool.length) return null;
  return (
    <div className="lb-heart">
      <span>{story.married ? (x.lg === 'm' ? 'Chồng' : 'Vợ') : p ? 'Người yêu' : 'Đang tìm hiểu'}</span>
      <b>
        {p
          ? `${x.L(p)} ${hearts(p)}`
          : pool
              .slice(0, 3)
              .map((id) => `${x.L(id)} ${hearts(id)}`)
              .join(' · ')}
      </b>
    </div>
  );
}

function BirthCard({ char, family, story, onBegin }: { char: Character; family: Family; story: Story; onBegin: () => void }) {
  const dots = WEALTH_DOTS[family.wealth] ?? 3;
  const h = story.seed ?? 0;
  const mom = 20 + (h % 11);
  const dad = mom + 1 + ((h >>> 4) % 6);
  const orphan = family.parents === 'Không còn bố mẹ';
  const row = (k: string, v: ReactNode) => (
    <div className="bc-row">
      <span>{k}</span>
      <b>{v}</b>
    </div>
  );
  return (
    <main className="app dither">
      <div className="body" style={{ paddingTop: 24 }}>
        <div className="bc px">
          <div className="bc-h">
            <b>Giấy khai sinh</b>
            <small>Số {String((h % 9000000) + 1000000)}</small>
          </div>
          <div className="bc-in">
            <small className="mute">HỌ VÀ TÊN</small>
            <h1>{char.name}</h1>
            <p>
              Năm {char.birthYear}, {char.gender === 'f' ? 'một bé gái' : 'một bé trai'} chào đời ở {placeOf(family).long}, trong một gia đình {family.wealth.toLowerCase()}.{' '}
              {family.siblings.length ? `Trong nhà có ${siblingText(family.siblings)}.` : 'Là con một.'}
            </p>
            <div className="bc-grid">
              {row('Giới tính', char.gender === 'f' ? 'Nữ' : 'Nam')}
              {row('Nơi sinh', placeOf(family).short)}
              {row('Gia cảnh', `${'●'.repeat(dots)}${'○'.repeat(5 - dots)}`)}
              {row(orphan ? 'Người nuôi' : 'Bố mẹ', orphan ? 'Ông bà' : `Mẹ ${mom} tuổi · Bố ${dad} tuổi`)}
              {row('Không khí gia đình', family.parents)}
              {row('Bạn thân sau này', story.bestie)}
            </div>
          </div>
        </div>
        <button type="button" className="btn-main" onClick={onBegin}>
          ▶ BẮT ĐẦU ĐỜI NÀY
        </button>
      </div>
    </main>
  );
}

function FamilyPanel({ char, family, story, age, x }: { char: Character; family: Family; story: Story; age: number; x: Ctx }) {
  const h = story.seed ?? 0;
  const mom = 20 + (h % 11);
  const dad = mom + 1 + ((h >>> 4) % 6);
  const orphan = family.parents === 'Không còn bố mẹ';
  const old = age >= 60;
  const sib = family.siblings.map((s, i) => `${s.older ? (s.gender === 'm' ? 'Anh trai' : 'Chị gái') : s.gender === 'm' ? 'Em trai' : 'Em gái'}, ${Math.max(0, age + (s.older ? 2 + i * 2 : -2 - i * 2))} tuổi`).filter((t) => !t.endsWith(', 0 tuổi') || true);
  const p = story.partner && story.partner !== 'xemmat' ? story.partner : null;
  return (
    <section className="card-d px-dim">
      <div className="lb-h">
        <b>Gia đình và cuộc đời</b>
      </div>
      <dl className="lb-fam">
        {orphan ? (
          <>
            <dt>Ông bà</dt>
            <dd>{old ? 'Đã đi xa' : 'Nuôi mình từ bé'}</dd>
          </>
        ) : (
          <>
            <dt>Mẹ</dt>
            <dd>{age + mom >= 85 ? 'Đã đi xa' : `${age + mom} tuổi`}</dd>
            <dt>Bố</dt>
            <dd>{age + dad >= 82 ? 'Đã đi xa' : `${age + dad} tuổi`}</dd>
          </>
        )}
        <dt>Anh chị em</dt>
        <dd>{sib.length ? sib.join(' · ') : 'Con một'}</dd>
        <dt>Bạn thân</dt>
        <dd>{story.bestie}</dd>
        <dt>{story.married ? (x.lg === 'm' ? 'Chồng' : 'Vợ') : 'Người yêu'}</dt>
        <dd>{p ? `${x.L(p)} · ${statusOf(story, p)}` : story.partner === 'xemmat' ? 'Người xem mắt' : 'Chưa có'}</dd>
        {story.kids > 0 && (
          <>
            <dt>Con</dt>
            <dd>{story.kids} đứa</dd>
          </>
        )}
        <dt>Đã gặp</dt>
        <dd>
          {story.met.length}/{MAX_LIFE} người trong đời
        </dd>
      </dl>
    </section>
  );
}

/* ---------- một cảnh ---------- */
const Shell = ({ embedded, children }: { embedded?: boolean; children: ReactNode }) => (embedded ? <div className="lb-play">{children}</div> : <main className="app dither">{children}</main>);

const CH_NO: Record<string, number> = { 'Tuổi thơ': 1, 'Tuổi teen': 2, 'Tuổi trẻ': 3, 'Lập gia đình': 4, 'Tuổi già': 5 };
const CH_ID: Record<string, string> = { 'Tuổi thơ': 'tho', 'Tuổi teen': 'teen', 'Tuổi trẻ': 'tre', 'Lập gia đình': 'nha', 'Tuổi già': 'gia' };
const CH_LINE: Record<string, string> = {
  'Tuổi thơ': 'Những mùa hè trong ngõ nhỏ',
  'Tuổi teen': 'Cảm nắng, thi cử và một giọng nói lạ',
  'Tuổi trẻ': 'Yêu, hẹn hò, và những ngã rẽ',
  'Lập gia đình': 'Cơm áo, nhà chồng nhà vợ, con cái',
  'Tuổi già': 'Những người còn ở lại',
};

function Play({ R, char, family, story, fb, onChoose, onNext, onFast, embedded }: { R: Resolve; char: Character; family: Family; story: Story; fb: Feedback | null; onChoose: (i: number, note?: string) => void; onNext: () => void; onFast: (chapter: string) => void; embedded?: boolean }) {
  // đang xem phản hồi thì vẫn vẽ cảnh vừa chọn (bước cuối trong path)
  const last = story.path[story.path.length - 1];
  const shownId = fb ? last.scene : story.scene;
  const age = ageOfScene(shownId);
  // lúc xem phản hồi, vẽ cảnh bằng trạng thái ngay trước lựa chọn (người yêu có thể vừa chia tay)
  const before = (fb && prevOf(story)) || story;
  const x = ctxOf(char, family, before, age);
  const sc = R(shownId, before)!;
  const opts = visibleChoices(sc, x);
  const who = sc.who?.(x) ?? null;
  // sang chương mới thì hiện màn chương
  const prevCh = !fb && last ? R(last.scene, prevOf(story) ?? story)?.chapter : undefined;
  const [card, setCard] = useState(!embedded && !fb && (story.path.length === 0 || prevCh !== sc.chapter));

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
  const call = sc.kind === 'call' && sc.call ? sc.call(x) : null;
  const tap = sc.kind === 'tap' && sc.tap;


  if (card)
    return (
      <main className={`app chcard ch-${CH_ID[sc.chapter]}`} onClick={() => setCard(false)}>
        <div className="chc-in">
          <div className="chc-no">CHƯƠNG {CH_NO[sc.chapter]}</div>
          <h1 className="chc-title">{sc.chapter}</h1>
          <p className="chc-line">{openerOf(sc.chapter, x) || CH_LINE[sc.chapter]}</p>
          <p className="chc-year">
            {x.me} · {age} tuổi · năm {x.year}
          </p>
          <button type="button" className="btn-main" onClick={() => setCard(false)}>
            ▶ VÀO CHƯƠNG
          </button>
        </div>
      </main>
    );

  return (
    <Shell embedded={embedded}>
      <div className="head">
        {!embedded && (
          <Link href="/" className="back" aria-label="Về trang đầu">
            ‹
          </Link>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            {sc.chapter.toUpperCase()} · {age} TUỔI · {x.year}
          </div>
          <h1>{txt(sc.title, x)}</h1>
        </div>
        {!embedded && <Notebook x={x} story={story} />}
      </div>

      <div className="body" style={{ paddingTop: 4, gap: 16 }}>
        {!swipe && !(embedded && (chat || call)) && (
          <Stage x={x} bg={sc.bg ? sc.bg(x) : { place: 'nha', time: 'day' }} sceneId={shownId}>
            <Actor x={whoLayers || who === 'he_thong' ? 72 : 100} feet={stg(sc.bg ? sc.bg(x) : null, shownId).feet}>
              <Sprite layers={meLayers} scale={2} anim="idle" dir={who ? 3 : 2} dy={age < 13 ? -9 : 0} label={`${x.me}, ${age} tuổi`} />
              <figcaption>{x.me}</figcaption>
            </Actor>
            {who && (
              <span className="spark ts-spark" style={{ left: 196, top: stg(sc.bg ? sc.bg(x) : null, shownId).feet * 2 - 100 }} aria-hidden="true">
                {who === 'he_thong' ? '!' : '♥'}
              </span>
            )}
            {who === 'he_thong' && (
              <Actor x={124} feet={stg(sc.bg ? sc.bg(x) : null, shownId).feet}>
                <div className="ht-box" aria-hidden="true">
                  <span>◆</span>
                </div>
                <figcaption>Hệ Thống</figcaption>
              </Actor>
            )}
            {whoLayers && (
              <Actor x={124} feet={stg(sc.bg ? sc.bg(x) : null, shownId).feet}>
                <Sprite layers={whoLayers} scale={2} anim="idle" dir={1} dy={age < 13 ? -9 : 0} label={whoName} />
                <figcaption>{whoName}</figcaption>
              </Actor>
            )}
            {who === 'he_thong' && <span className="ht-scan" aria-hidden="true" />}
          </Stage>
        )}

        <TextBox key={'tb' + shownId + String(!!fb)} lines={sc.text(x)} ht={who === 'he_thong'} />

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
            key={'ph' + shownId + String(!!fb)}
            skin={sc.device?.(x) ?? skinOf(x.year)}
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

        {call && (
          <CallScreen
            key={'cs' + shownId + String(!!fb)}
            skin={callSkinOf(x.year)}
            dir={call.dir}
            video={call.video}
            name={call.name}
            sub={call.sub}
            lines={call.lines}
            avatar={whoLayers ? <Sprite layers={whoLayers} scale={1} anim="idle" dir={2} label="" /> : undefined}
            opts={fb ? undefined : opts.map((o) => txt(o.t, x))}
            picked={fb ? last.choice : undefined}
            onChoose={onChoose}
          />
        )}

        {tap && !fb && <TapGame goal={tap.goal} onEnd={(n) => onChoose(n >= tap.goal ? 0 : Math.min(1, opts.length - 1))} />}

        {swipe && !fb && (
          <SwipeDeck
            cards={sc.cards!(x)}
            year={x.year}
            gold={x.year >= 2015 ? { can: cashOf(x.s, x.year, x.age) >= priceAt(250_000, x.year), price: pointsOf(priceAt(250_000, x.year), x.year, x.age), label: fmtVND(priceAt(250_000, x.year)) + ' một tháng' } : undefined}
            onDone={(id, gold) => {
              const isGold = (o: Choice) => o.act === 'gold';
              let k = opts.findIndex((o) => (id ? o.loveId === id : !o.loveId) && isGold(o) === gold);
              if (k < 0) k = opts.findIndex((o) => !o.loveId && !isGold(o));
              onChoose(k >= 0 ? k : opts.length - 1);
            }}
          />
        )}

        {fb ? (
          <FeedbackBox fb={fb} x={x} after={story} onNext={onNext} />
        ) : sc.kind === 'cheer' ? (
          <CheerMeter goal={sc.tap?.goal ?? 24} alt={opts.slice(2).map((o) => txt(o.t, x))} onChoose={onChoose} />
        ) : sc.kind === 'unlock' ? (
          <SlideUnlock>
            <Choices opts={opts.map((o) => txt(o.t, x))} onChoose={onChoose} />
          </SlideUnlock>
        ) : sc.kind === 'pick' ? (
          <PickPeople key={sc.id} x={x} ids={sc.cands?.(x) ?? []} onDone={(ids) => onChoose(0, `pick:${ids.join(',')}`)} />
        ) : sc.kind === 'feed' ? (
          <LifeFeed key={sc.id} lines={sc.feed?.(x) ?? []} onDone={() => onChoose(0)} />
        ) : sc.kind === 'reflect' ? (
          <Reflect key={sc.id} ask={sc.ask?.(x) ?? ''} onDone={(t) => (t ? onChoose(0, t) : onChoose(Math.min(1, opts.length - 1)))} />
        ) : sc.kind === 'gift' ? (
          <GiftShelf opts={opts.map((o) => txt(o.t, x))} onChoose={onChoose} />
        ) : sc.kind === 'hub' ? (
          <HubBoard x={x} opts={opts} onChoose={onChoose} />
        ) : (
          !chat && !swipe && !call && !tap && <Choices key={sc.id} opts={opts.map((o) => txt(o.t, x))} onChoose={onChoose} timer={sc.timer} timeout={sc.timeout} />
        )}

        {!fb && !embedded && (
          <button type="button" className="ff-btn" onClick={() => onFast(sc.chapter)}>
            ⏩ Tua nhanh hết {sc.chapter.toLowerCase()}
          </button>
        )}
      </div>
    </Shell>
  );
}

/** Lời kể ngắn: hiện câu đầu (và lời Hệ Thống); phần còn lại gấp lại, bấm "Đọc thêm" mới mở */
function TextBox({ lines, ht }: { lines: string[]; ht: boolean }) {
  const [more, setMore] = useState(false);
  // giữ câu đầu, câu cuối (thường là chuyện cần chọn) và lời Hệ Thống; câu giữa gấp lại
  const keep = lines.filter((p, i) => i === 0 || i === lines.length - 1 || (ht && p.startsWith('"')));
  const rest = lines.filter((p) => !keep.includes(p));
  const shown = more ? lines : keep;
  if (!lines.length) return null;
  return (
    <div className="textbox px-dim">
      {(more ? lines : lines.filter((p) => shown.includes(p))).map((p, i) => (
        <p key={i} className={`tw ${ht && p.startsWith('"') ? 'ht-line' : ''}`} style={{ animationDelay: `${i * 0.25}s` }}>
          {p}
        </p>
      ))}
      {rest.length > 0 && !more && (
        <button type="button" className="tb-more" onClick={() => setMore(true)}>
          Đọc thêm ▾
        </button>
      )}
    </div>
  );
}

/** Kệ quà: mỗi món một ô có biểu tượng, giá; ô cuối là "để lần sau" */
function GiftShelf({ opts, onChoose }: { opts: string[]; onChoose: (i: number) => void }) {
  const done = useRef(false);
  return (
    <div className="gifts">
      {opts.map((t, i) => {
        const [name, price] = t.split(' · ');
        const icon = name.charAt(0);
        const last = i === opts.length - 1;
        return (
          <button
            key={i}
            type="button"
            className={`gift px ${last ? 'skip' : ''}`}
            style={{ animationDelay: `${0.1 + i * 0.07}s` }}
            onClick={() => {
              if (done.current) return;
              done.current = true;
              onChoose(i);
            }}
          >
            {!last && <i aria-hidden="true">{icon}</i>}
            <b>{last ? t : name.slice(2)}</b>
            {price && <small>{price}</small>}
          </button>
        );
      })}
    </div>
  );
}

function Choices({ opts, onChoose, timer, timeout }: { opts: string[]; onChoose: (i: number) => void; timer?: number; timeout?: number }) {
  const done = useRef(false);
  const pick = (i: number) => {
    if (done.current) return;
    done.current = true;
    onChoose(i);
  };
  const [left, setLeft] = useState(timer ?? 0);
  useEffect(() => {
    if (!timer) return;
    const t = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);
  useEffect(() => {
    if (timer && left <= 0) pick(Math.min(timeout ?? opts.length - 1, opts.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  return (
    <div className="choices">
      {!!timer && (
        <div className="timer px" aria-label={`Còn ${Math.max(0, left)} giây`}>
          <i style={{ width: `${(100 * Math.max(0, left)) / timer}%` }} />
          <span>{Math.max(0, left)}s</span>
        </div>
      )}
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
          <span>{jobOf(id, x.lg, x.age, x.year)}</span>
          <small>{LOVES[id].kind}</small>
          <small className="nf-like">Thích {LOVES[id].likesName}</small>
          <small className="nf-life">⌂ {profileOf(id, x).home}</small>
          <small className="nf-life">➤ {profileOf(id, x).ride}</small>
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
  const [all, setAll] = useState(false);
  // 4 người thân nhất ở hàng đầu; ô cuối là nút xem thêm
  const act = [...activeOf(x.s)].sort((a, b) => x.s.love[b] - x.s.love[a]);
  const top = act.slice(0, 4);
  const rest = act.length - top.length;
  const shown: (LoveId | null)[] = all ? act : [...top, ...Array(Math.max(0, 4 - top.length)).fill(null)];
  const global = opts.filter((o) => !o.loveId);
  const ICON: Record<string, string> = { chat: '✉', date: '♥', gift: '✦', confess: '❀', drop: '✕', quet: '⇆', explore: '✈', friends: '☺', work: '▣' };
  return (
    <div className="hub">
      <div className="hub-slots">
        {shown.map((id, i) =>
          id ? (
            <Slot key={id} id={id} x={x} open={open === id} onOpen={() => setOpen(open === id ? null : id)} />
          ) : (
            <div key={`e${i}`} className="slot empty" aria-label="Ô trống">
              <span>?</span>
              <small>Ô trống</small>
            </div>
          ),
        )}
        {!all &&
          (rest > 0 ? (
            <button type="button" className="slot more" onClick={() => setAll(true)} aria-label={`Xem thêm ${rest} người`}>
              <span>+{rest}</span>
              <small>Xem</small>
            </button>
          ) : (
            <div className="slot empty" aria-label="Ô trống">
              <span>?</span>
              <small>Ô trống</small>
            </div>
          ))}
      </div>
      <button type="button" className="hub-all" onClick={() => setAll(!all)}>
        {all ? 'Thu gọn ▴' : `Xem tất cả (${act.length}/${MAX_ACTIVE} người · đã gặp ${x.s.met.length}/${MAX_LIFE}) ▾`}
      </button>
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
    <button type="button" className={`slot ${open ? 'on' : ''} st-${st === 'Người yêu' ? 'yeu' : st === 'Mập mờ' || st === 'Say nắng' ? 'mapmo' : 'moi'}`} onClick={onOpen} aria-expanded={open}>
      <span className="slot-photo">
        <Sprite layers={layers} scale={1} anim="idle" dir={2} label={x.L(id)} />
      </span>
      <b>{x.L(id)}</b>
      <small>{st === 'Người yêu' ? '♥ Người yêu' : st}</small>
      <Hearts v={x.s.love[id]} />
    </button>
  );
}

/** Nút Sổ tay ở góc trên: bấm mở bảng tình cảm với những người đã gặp và chỉ số của bạn */
/** Chọn tối đa 3 người muốn tìm hiểu */
function PickPeople({ x, ids, onDone }: { x: Ctx; ids: LoveId[]; onDone: (ids: LoveId[]) => void }) {
  const [sel, setSel] = useState<LoveId[]>([]);
  const done = useRef(false);
  const toggle = (id: LoveId) => setSel((v) => (v.includes(id) ? v.filter((k) => k !== id) : v.length >= 3 ? v : [...v, id]));
  return (
    <div className="choices pick">
      <p className="pk-h">
        Đã chọn <b>{sel.length}</b>/3 · {ids.length} người đang chờ
      </p>
      <div className="pk-grid">
        {ids.map((id) => (
          <PickCard key={id} id={id} x={x} on={sel.includes(id)} onTap={() => toggle(id)} />
        ))}
      </div>
      <button
        type="button"
        className="btn-main"
        disabled={!sel.length}
        onClick={() => {
          if (done.current) return;
          done.current = true;
          onDone(sel);
        }}
      >
        ♥ CHỌN XONG ({sel.length}/3)
      </button>
    </div>
  );
}
function PickCard({ id, x, on, onTap }: { id: LoveId; x: Ctx; on: boolean; onTap: () => void }) {
  const layers = useMemo(() => lpcLayers(CAST[id][x.lg], x.lg, 'adult'), [id, x.lg]);
  const met = x.s.met.includes(id);
  return (
    <button type="button" className={`pk-card px ${on ? 'on' : ''}`} onClick={onTap} aria-pressed={on}>
      <span className="pk-face">
        <Sprite layers={layers} scale={1} anim="idle" dir={2} label={x.L(id)} />
      </span>
      <b>{x.L(id)}</b>
      <small>{jobOf(id, x.lg, x.age, x.year)}</small>
      <small className="pk-st">{STARS.includes(id) ? '★ Ngôi sao · ' : ''}{met ? statusOf(x.s, id) : 'Người mới'}</small>
      {on && <i className="pk-tick">♥</i>}
    </button>
  );
}

/** Dòng thời gian: các năm lần lượt trôi qua, không cần chọn; chạm để hiện hết */
function LifeFeed({ lines, onDone }: { lines: { age: number; year: number; t: string }[]; onDone: () => void }) {
  const [n, setN] = useState(1);
  const done = useRef(false);
  useEffect(() => {
    if (n >= lines.length) return;
    const t = setTimeout(() => setN((v) => v + 1), 1100);
    return () => clearTimeout(t);
  }, [n, lines.length]);
  const all = n >= lines.length;
  return (
    <div className="lf" onClick={() => !all && setN(lines.length)}>
      <ol className="lf-list" aria-live="polite">
        {lines.slice(0, n).map((l, i) => (
          <li key={i} className="lf-line">
            <span className="lf-y">
              {l.age} tuổi · {l.year}
            </span>
            <span>{l.t}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn-main"
        onClick={(e) => {
          e.stopPropagation();
          if (!all) return setN(lines.length);
          if (done.current) return;
          done.current = true;
          onDone();
        }}
      >
        {all ? '▶ SỐNG TIẾP' : '▶▶ TUA NHANH'}
      </button>
    </div>
  );
}

/** Cảnh ngẫm: tự viết vài dòng, cuối đời đọc lại */
function Reflect({ ask, onDone }: { ask: string; onDone: (t: string | null) => void }) {
  const [t, setT] = useState('');
  const done = useRef(false);
  const go = (v: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(v);
  };
  return (
    <div className="reflect">
      <p className="rf-q">{ask}</p>
      <textarea className="rf-in px-dim" rows={3} maxLength={200} value={t} onChange={(e) => setT(e.target.value)} placeholder="Viết gì cũng được, chỉ mình đọc..." aria-label={ask} />
      <div className="rf-row">
        <button type="button" className="btn-main" disabled={!t.trim()} onClick={() => go(t.trim())}>
          ✎ GHI LẠI
        </button>
        <button type="button" className="btn-sub px" onClick={() => go(null)}>
          Để sau
        </button>
      </div>
    </div>
  );
}

/** Album kỷ niệm: mỗi buổi hẹn một tấm ảnh pixel */
function Album({ photos, char, lg }: { photos: Photo[]; char: Character; lg: 'm' | 'f' }) {
  const me = useMemo(() => lpcLayers(char.look, char.gender, 'adult'), [char]);
  if (!photos.length) return <p className="mt-hint">Chưa có tấm ảnh nào. Đi hẹn hò đi!</p>;
  return (
    <div className="album">
      {photos.map((p, i) => (
        <AlbumPhoto key={i} p={p} me={me} lg={lg} />
      ))}
    </div>
  );
}
function AlbumPhoto({ p, me, lg }: { p: Photo; me: ReturnType<typeof lpcLayers>; lg: 'm' | 'f' }) {
  const them = useMemo(() => lpcLayers(CAST[p.who][lg], lg, 'adult'), [p.who, lg]);
  const st = bgStage(p.bg, `album${p.age}${p.who}`, p.year);
  return (
    <figure className="photo px">
      <div className="ph-img" style={{ backgroundImage: `url(${st.src})` }}>
        <span className="ph-a">
          <Sprite layers={me} scale={1} anim="idle" dir={3} label="" />
        </span>
        <span className="ph-b">
          <Sprite layers={them} scale={1} anim="idle" dir={1} label="" />
        </span>
      </div>
      <figcaption>
        <b>
          {LOVES[p.who][lg]} · {p.year}
        </b>
        <small>{p.place}</small>
        <small className="ph-line">{p.line}</small>
      </figcaption>
    </figure>
  );
}

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
            <Assets x={x} story={story} />
            <Meters x={x} story={story} met={met} />
            <div className="mt-h">▣ ALBUM KỶ NIỆM ({(story.album ?? []).length})</div>
            <Album photos={story.album ?? []} char={x.c} lg={x.lg} />
          </div>
        </div>
      )}
    </>
  );
}

/** Tài sản: tiền, nhà, xe, nợ, quỹ chung, và chuyện tiền đã ảnh hưởng tới tình cảm thế nào */
function Assets({ x, story }: { x: Ctx; story: Story }) {
  const cash = cashOf(story, x.year, x.age);
  const has = (f: string) => story.flags.includes(f);
  const rows: [string, string][] = [[cash < 0 ? 'Đang nợ' : x.age < 15 ? 'Heo đất' : 'Tiền để dành', fmtCash(cash).replace('Nợ ', '')]];
  if (has('ms_nha') || has('nha_chung') || has('nha_rieng')) rows.push(['Nhà', has('nha_rieng') ? 'đứng tên mình' : has('nha_chung') || story.married ? 'đứng tên hai vợ chồng' : 'đứng tên mình']);
  if (has('ms_xe')) rows.push(['Xe', 'đã có xe riêng']);
  if (has('h_dat_mua')) rows.push(['Đất', 'một lô đất nền mua lúc sốt']);
  if (story.married) rows.push(['Tiền nhà', has('quychung') ? 'quỹ chung, mỗi người góp' : has('dr_nopluong') ? 'đưa hết cho bạn đời giữ' : has('dr_quyden') ? 'nộp lương, còn giữ quỹ đen' : 'chưa bàn rõ']);
  if (has('phasan') || has('trono')) rows.push(['Từng', has('trono') ? 'trắng tay, phải bỏ đi tỉnh khác' : 'trắng tay, làm lại từ đầu']);
  const p = story.partner && story.partner !== 'xemmat' ? story.partner : null;
  return (
    <div className="as">
      <div className="mt-h">₫ TÀI SẢN</div>
      <ul className="as-list">
        {rows.map(([k, v]) => (
          <li key={k} className={k === 'Đang nợ' ? 'no' : ''}>
            <span>{k}</span>
            <b>{v}</b>
          </li>
        ))}
      </ul>
      {p && <p className="mt-hint">{x.L(p)} vốn {moneyLabelOf(p)}. Chuyện tiền bạc ảnh hưởng thẳng đến việc người ấy có ở lại khi khó khăn hay không.</p>}
    </div>
  );
}

/** 10 ô, mỗi ô 10 điểm; ô đang dở được tô theo phần tư (8 điểm khác hẳn 12 điểm) */
const cells = (v: number, cls = '') =>
  Array.from({ length: 10 }, (_, i) => {
    const part = Math.max(0, Math.min(1, (v - i * 10) / 10));
    const q = Math.round(part * 4) / 4;
    return (
      <i key={i} className={q >= 1 ? `on ${cls}` : ''}>
        {q > 0 && q < 1 && <b className={`part ${cls}`} style={{ width: `${q * 100}%` }} />}
      </i>
    );
  });

/** Chỉ số dạng 10 ô pixel, mỗi ô 10 điểm */
const MAIN_COLORS = ['#5a9a62', '#c99a3e', '#4a9a90', '#b8455e', 'var(--stat)'];
function StatBars({ rows }: { rows: { label: string; value: number; color?: string }[] }) {
  return (
    <>
      {rows.map((r) => (
        <div className="stat" key={r.label} style={r.color ? ({ '--c': r.color } as React.CSSProperties) : undefined}>
          <span>{r.label}</span>
          <span className="cells" role="meter" aria-label={r.label} aria-valuenow={r.value} aria-valuemin={0} aria-valuemax={100}>
            {cells(r.value)}
          </span>
          <span>{Math.round(r.value)}</span>
        </div>
      ))}
    </>
  );
}

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
      <p className="mt-hint">Lúc cầu hôn: phải thật thương nhau (4 tim trở lên) và đúng kiểu người ấy thích thì mới thành đôi hạnh phúc.</p>

      <div className="mt-h">CHỈ SỐ CỦA BẠN (0 ĐẾN 100)</div>
      <StatBars rows={MAIN_STATS.map((m, i) => ({ label: m.label, value: m.of(story), color: MAIN_COLORS[i] }))} />
      <div className="mt-h">TÍNH CÁCH VÀ VẬN</div>
      <StatBars rows={(['duyen', 'noi', 'tinh', 'tien', 'dao'] as const).map((k) => ({ label: STAT_LABEL[k], value: story.stats[k] }))} />
    </div>
  );
}

function LoveRow({ id, x, story }: { id: LoveId; x: Ctx; story: Story }) {
  const [open, setOpen] = useState(false);
  const layers = useMemo(() => lpcLayers(CAST[id][x.lg], x.lg, 'adult'), [id, x.lg]);
  const lost = story.flags.includes(`${id}_out`);
  const st = story.partner === id ? (story.married ? '♥ Bạn đời' : '♥ Người yêu') : lost ? 'Đã lỡ nhau' : statusOf(story, id);
  return (
    <>
    <div
      role="button"
      tabIndex={0}
      className={`nb-row tap ${lost ? 'lost' : ''}`}
      onClick={() => setOpen(true)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
      aria-label={`Xem hồ sơ ${x.L(id)}`}
    >
      <span className="nb-photo">
        <Sprite layers={layers} scale={1} anim="idle" dir={2} label={x.L(id)} />
      </span>
      <div className="nb-info">
        <div className="nb-name">
          <b>{x.L(id)}</b>
          <small className={story.partner === id ? 'yeu' : ''}>{st}</small>
        </div>
        <small>
          {jobOf(id, x.lg, x.age, x.year)} · thích {LOVES[id].likesName}
        </small>
        <small>
          ⌂ {profileOf(id, x).home} · ➤ {profileOf(id, x).ride}
        </small>
        <small className="nb-gift">
          {(() => {
            const cats = Object.keys(GIFT_CAT) as GiftCat[];
            const yes = cats.filter((c) => story.flags.includes(`qua_${id}_${c}`)).map((c) => GIFT_CAT[c].label);
            const no = cats.filter((c) => story.flags.includes(`ghet_${id}_${c}`)).map((c) => GIFT_CAT[c].label);
            if (!yes.length && !no.length) return '✦ Quà: chưa biết gu, thử tặng xem';
            return `✦ Quà: ${yes.length ? `thích ${yes.join(', ')}` : ''}${yes.length && no.length ? ' · ' : ''}${no.length ? `không thích ${no.join(', ')}` : ''}`;
          })()}
        </small>
        <Hearts v={lost ? 0 : story.love[id]} />
        <small className="nb-open">Xem hồ sơ ▸</small>
      </div>
    </div>
    {open && <LoveDetail id={id} x={x} story={story} st={st} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Độ thân giấu số: 5 trái tim pixel theo mức (Mới quen, Bạn bè, Mập mờ, Say nắng, Thương) */
function Hearts({ v }: { v: number }) {
  const n = v >= 80 ? 5 : v >= 60 ? 4 : v >= 40 ? 3 : v >= 20 ? 2 : v > 0 ? 1 : 0;
  return (
    <span className="hearts" aria-label={`Mức tình cảm ${n} trên 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < n ? 'on' : ''} aria-hidden="true">
          ♥
        </i>
      ))}
    </span>
  );
}
const signOf = (v: number, n: string) =>
  v >= 80 ? `${n} nhìn bạn như thể cả thế giới chỉ còn một người.` : v >= 60 ? `${n} hay tìm cớ gặp bạn.` : v >= 40 ? `${n} trả lời tin nhắn rất nhanh.` : v >= 20 ? `${n} coi bạn là bạn tốt.` : `${n} mới chỉ biết tên bạn.`;

/** Hồ sơ chi tiết một người: ảnh, nghề, nhà, xe, chỉ số của người ấy (mạng nhện), độ thân, gu */
function LoveDetail({ id, x, story, st, onClose }: { id: LoveId; x: Ctx; story: Story; st: string; onClose: () => void }) {
  const layers = useMemo(() => lpcLayers(CAST[id][x.lg], x.lg, 'adult'), [id, x.lg]);
  const pf = profileOf(id, x);
  const p = PERSONA[id];
  return (
    <div className="nb-veil ld-veil" onClick={(e) => (e.stopPropagation(), onClose())}>
      <div className="nb-sheet px" role="dialog" aria-modal="true" aria-label={`Hồ sơ ${x.L(id)}`} onClick={(e) => e.stopPropagation()}>
        <div className="nb-h">
          <button type="button" className="nb-x" onClick={onClose} aria-label="Quay lại sổ tay">
            ‹ Sổ tay
          </button>
          <b>HỒ SƠ {x.L(id).toUpperCase()}</b>
        </div>
        <div className="ld-top">
          <span className="ld-photo">
            <Sprite layers={layers} scale={2} anim="idle" dir={2} label={x.L(id)} />
          </span>
          <div className="ld-id">
            <b>{x.L(id)}</b>
            <span>{jobOf(id, x.lg, x.age, x.year)}</span>
            <small>{LOVES[id].kind}</small>
            <small className="yeu">{st}</small>
          </div>
        </div>
        <ul className="ld-facts">
          <li>⌂ {pf.home}</li>
          <li>➤ {pf.ride}</li>
          <li>♥ Thích {LOVES[id].likesName}</li>
          <li>₫ Tiền bạc: {moneyLabelOf(id)}</li>
          {lifeOf(id, x) && <li>✦ Dạo này: {lifeOf(id, x)}</li>}
          {x.has(`kv_${id}`) && <li>◆ Kỷ vật: {FLAVOR[id].keep}</li>}
        </ul>
        <div className="mt-h">CHỈ SỐ CỦA {x.L(id).toUpperCase()} (0 ĐẾN 100)</div>
        <StatBars rows={PERSONA_AXES.map((label, i) => ({ label, value: p[i] }))} />
        <div className="mt-h">TÌNH CẢM VỚI BẠN</div>
        <Hearts v={story.love[id]} />
        <p className="mt-hint">{signOf(story.love[id], x.L(id))}</p>
      </div>
    </div>
  );
}

const stg = (bg: Bg | null, id: string) => bgStage(bg ?? { place: 'nha', time: 'day' }, id);

/** Sân khấu: nền LPC ghép sẵn, đổi theo nơi, giờ, mùa; không viền */
function Stage({ x, bg, sceneId, children }: { x: Ctx; bg: Bg; sceneId: string; children: ReactNode }) {
  const st = bgStage(bg, sceneId, x.year);
  const news = newsOf(x.year);
  return (
    <div className="stage-ts play">
      <TileStage src={st.src} time={bg.time} season={st.season} lights={st.lights}>
        {children}
      </TileStage>
      {news && (
        <div className="news" role="note" aria-label={`Tin năm ${x.year}: ${news}`}>
          <b>TIN NÓNG {x.year}</b>
          <span className="news-run">
            <span style={{ animationDuration: `${Math.max(14, Math.round(news.length / 7))}s` }}>{news}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/** Đặt nhân vật theo tâm chân x, hàng chân feet (px gốc 200x144) */
/** Khung cảnh trên nhật ký đời: nhân vật đứng giữa nơi mình đang sống ở tuổi này (nhà, trường, phố, chỗ làm, vườn quê) */
function lifePlace(age: number, x: Ctx): Bg['place'] {
  const rural = !x.f.urban;
  const r = (age * 7 + (x.s.seed ?? 0)) % 4;
  if (age < 6) return rural ? (['nha', 'vuon', 'ngo', 'nha'] as const)[r] : (['nha', 'ngo', 'nha', 'congvien'] as const)[r];
  if (age < 13) return rural ? (['lop', 'vuon', 'cong', 'ngo'] as const)[r] : (['lop', 'cong', 'ngo', 'congvien'] as const)[r];
  // tuổi teen thời quán net (2001-2012) hay trốn ra net
  if (age < 18) return x.year >= 2001 && x.year <= 2012 && r === 3 ? 'net' : rural ? (['lop', 'cong', 'vuon', 'ngo'] as const)[r] : (['lop', 'cong', 'pho', 'phong'] as const)[r];
  if (age < 23) return x.has('daihoc') && !x.has('dilam') ? (['cong', 'congvien', 'pho', 'quan'] as const)[r] : rural ? (['vuon', 'pho', 'quan', 'ngo'] as const)[r] : (['pho', 'vanphong', 'quan', 'phong'] as const)[r];
  if (age < 60) return x.s.married && r < 2 ? 'nha' : rural && !x.has('daihoc') ? (['vuon', 'quan', 'pho', 'nha'] as const)[r] : (['vanphong', 'quan', 'pho', 'phong'] as const)[r];
  return (['vuon', 'nha', 'congvien', 'ngo'] as const)[r];
}
/** màu ảnh theo thời: trước 1990 ngả nâu như ảnh cũ, 1990-2004 hơi phai, sau 2026 hơi xanh tương lai */
const eraClass = (y: number) => (y < 1990 ? 'era-80' : y < 2005 ? 'era-90' : y > 2026 ? 'era-fut' : '');

/** Nhân vật đi qua đi lại trong khung cảnh: đi một quãng, đứng nghỉ, quay đầu đi tiếp */
function useWalk(on: boolean, from = 60, to = 140) {
  const [st, setSt] = useState({ x: 100, dir: 2, face: 3, walking: false, ms: 0 });
  useEffect(() => {
    if (!on || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)) return;
    let live = true;
    let t: ReturnType<typeof setTimeout>;
    let x = 100;
    const step = () => {
      if (!live) return;
      const nx = from + Math.round(Math.random() * (to - from));
      const ms = Math.max(600, Math.abs(nx - x) * 45);
      setSt({ x: nx, dir: nx > x ? 3 : 1, face: nx > x ? 3 : 1, walking: true, ms });
      x = nx;
      t = setTimeout(() => {
        if (!live) return;
        setSt((s) => ({ ...s, walking: false, dir: Math.random() < 0.5 ? 2 : s.dir, ms: 0 }));
        t = setTimeout(step, 1200 + Math.random() * 2200);
      }, ms);
    };
    t = setTimeout(step, 800);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [on, from, to]);
  return st;
}

function LifeStage({ x, char, story, age }: { x: Ctx; char: Character; story: Story; age: number }) {
  const bg: Bg = { place: lifePlace(age, x), time: age % 5 === 4 ? 'dusk' : 'day' };
  const id = `life-${age}`;
  const feet = stg(bg, id).feet;
  const me = useMemo(() => lpcLayers(char.look, char.gender, stageOf(age)), [char, age]);
  const pid = story.partner && story.partner !== 'xemmat' ? story.partner : null;
  const mate = useMemo(() => (pid ? lpcLayers(CAST[pid][x.lg], x.lg, stageOf(age)) : null), [pid, x.lg, age]);
  // dựng sẵn dải hình đi và đứng hai hướng, để lúc quay đầu không bị nháy
  useEffect(() => {
    for (const l of [me, mate]) if (l) for (const a of ['walk', 'idle'] as const) for (const d of [1, 2, 3]) void composeStrip(l, a, d);
  }, [me, mate]);
  // em bé chưa biết đi: dưới 2 tuổi đứng yên, 2-3 tuổi chập chững quãng ngắn
  const w = useWalk(age >= 2, age < 4 ? 80 : mate ? 50 : 40, age < 4 ? 120 : mate ? 140 : 160);
  const anim = w.walking ? 'walk' : 'idle';
  const move = { transition: `left ${w.ms}ms linear` };
  // đi cùng người yêu: người ấy đi ngay sau, cùng hướng; đứng lại thì quay vào nhau
  const mateX = w.x + (w.face === 1 ? 26 : -26);
  return (
    <div className={`lb-stage ${eraClass(x.year)}`}>
      <Stage x={x} bg={bg} sceneId={id}>
        <Actor x={w.x} feet={feet} style={move}>
          <Sprite layers={me} scale={2} anim={anim} dir={w.walking ? w.dir : mate ? (mateX > w.x ? 3 : 1) : w.dir} dy={age < 13 ? -9 : 0} label={`${x.me}, ${age} tuổi`} />
          <figcaption>{x.me}</figcaption>
        </Actor>
        {mate && pid && (
          <Actor x={mateX} feet={feet} style={move}>
            <Sprite layers={mate} scale={2} anim={anim} dir={w.walking ? w.dir : mateX > w.x ? 1 : 3} dy={age < 13 ? -9 : 0} label={x.L(pid)} />
            <figcaption>{x.L(pid)}</figcaption>
          </Actor>
        )}
      </Stage>
    </div>
  );
}

/** Mốc đời hiện lên hỏi: tranh minh họa, câu hỏi, các lựa chọn kèm giá; không đủ tiền thì khóa */
function MilestoneSheet({ m, x, onPick }: { m: Milestone; x: Ctx; onPick: (i: number) => void }) {
  const opts = mOptions(m, x);
  const have = mWealth(m, x);
  const bg: Bg = { place: m.place, time: 'day' };
  return (
    <div className="lb-veil">
      <div className="lb-sheet lb-ms px" role="dialog" aria-modal="true" aria-label={m.title(x)}>
        <div className="lb-sh">
          <span>
            MỐC ĐỜI · {x.age} tuổi · {x.year}
          </span>
        </div>
        <div className="ms-art">
          <Stage x={x} bg={bg} sceneId={`ms-${m.id}`}>
            <Actor x={100} feet={stg(bg, `ms-${m.id}`).feet}>
              <Sprite layers={lpcLayers(x.c.look, x.c.gender, stageOf(x.age))} scale={2} anim="idle" dir={2} dy={x.age < 13 ? -9 : 0} label={`${x.me}, ${x.age} tuổi`} />
              <figcaption>{x.me}</figcaption>
            </Actor>
          </Stage>
        </div>
        <h2 className="ms-title">{m.title(x)}</h2>
        <p className="mt-hint">{m.sub(x)}</p>
        <p className="ms-wallet">
          {mByParents(m) ? 'Bố mẹ có thể lo cho con' : 'Tài sản đang có'}: <b>{fmtVND(have)}</b>
        </p>
        <div className="choices lb-acts">
          {opts.map((o, i) => {
            const cost = mPrice(m, o, x);
            const lock = cost > have;
            return (
              <button key={i} type="button" className={`opt px ms-opt ${lock ? 'lock' : ''}`} disabled={lock} onClick={() => onPick(i)}>
                <b>{txt(o.t, x)}</b>
                <small>{cost ? (lock ? `Cần ${fmtVND(cost)} · chưa đủ tiền` : `${mByParents(m) ? 'Bố mẹ chi' : 'Tốn'} ${fmtVND(cost)}`) : 'Không tốn tiền'}</small>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Actor({ x, feet, children, style }: { x: number; feet: number; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <figure className="ts-actor" style={{ left: x * 2 - 64, top: feet * 2 - 124, ...style }}>
      <i className="ts-shadow" />
      {children}
    </figure>
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
      // sổ tưởng niệm: giữ 30 đời gần nhất
      const mem = {
        name: char.name,
        born: char.birthYear,
        age: lifespanOf(char, story),
        province: family.province,
        love: love.name,
        who: story.partner && story.partner !== 'xemmat' ? LOVES[story.partner][char.gender === 'f' ? 'm' : 'f'] : null,
        notes: story.notes ?? [],
        photos: (story.album ?? []).length,
      };
      void saveMeta({ ...meta, endings, lives: (meta.lives ?? 0) + 1, memorials: [mem, ...(meta.memorials ?? [])].slice(0, 30) });
    });
  }, [love.id, love.name, old.id, story, char, family]);

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
          {lifePathOf(story) && (
            <div className="end-row">
              <span>Cả đời dành cho</span>
              <b>{lifePathOf(story)!.name}</b>
              <small>
                {lifePathOf(story)!.desc} (chọn {lifePathOf(story)!.n} năm)
              </small>
            </div>
          )}
          {historyOf(story).length > 0 && (
            <div className="end-row">
              <span>Thời cuộc đã chạm vào đời</span>
              {historyOf(story).map((t, i) => (
                <small key={i}>• {t}</small>
              ))}
            </div>
          )}
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

        {story.endAt !== undefined && story.path[story.endAt] && (
          <div className="note px-dim">
            <span className="mute">Ngã rẽ đã đổi số phận:</span>
            <span>
              {story.path[story.endAt].age} tuổi · {story.path[story.endAt].title}
            </span>
            <b style={{ fontWeight: 400, color: 'var(--accent)' }}>→ {story.path[story.endAt].choice}</b>
            <button type="button" className="btn-sub px" onClick={() => onRewind(story.endAt!)} disabled={!canRewind(story, story.endAt!)}>
              ↺ Quay lại ngã rẽ này
            </button>
          </div>
        )}

        {(story.notes ?? []).length > 0 && (
          <div className="note px-dim">
            <span className="mute">Những dòng đã viết:</span>
            {story.notes.map((n, i) => (
              <span key={i}>
                <small className="mute">
                  {n.age} tuổi · {n.q}
                </small>
                <br />“{n.a}”
              </span>
            ))}
          </div>
        )}

        <section className="group">
          <div className="label">▣ Album kỷ niệm</div>
          <Album photos={story.album ?? []} char={char} lg={char.gender === 'f' ? 'm' : 'f'} />
        </section>

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
            {story.path.map((p, i) => ({ p, i })).filter(({ i }) => canRewind(story, i)).map(({ p, i }) => (
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
