'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import { endingInfo, MIDS, ROUTE_ENDS, SOLO_ENDS } from '@/lib/endings';
import { lpcLayers } from '@/lib/look';
import { CAST } from '@/lib/cast';
import { loadMe, type Meta } from '@/lib/save';
import { LOVE_IDS, LOVES, type LoveId } from '@/lib/story';
import { useAuth } from '@/lib/useAuth';

/** mốc danh hiệu theo số kết cục đã mở */
const RANKS: [number, string][] = [
  [5, 'Người Mới Yêu'],
  [15, 'Kẻ Đa Tình'],
  [30, 'Bậc Thầy Rẽ Lối'],
  [50, 'Nguyệt Lão'],
];
const KIND_LABEL: Record<string, string> = { hanhphuc: 'Hạnh phúc', dodang: 'Dở dang', chilaban: 'Mãi là bạn', lohen: 'Lỡ hẹn', muon: 'Tình muộn', lyhon: 'Ly hôn' };

export default function SoTinh() {
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [tab, setTab] = useState<'map' | 'mem'>('map');
  const [lg, setLg] = useState<'m' | 'f'>('m');

  useEffect(() => {
    if (ready) loadMe().then((m) => setMeta(m?.meta ?? {}));
  }, [ready, user]);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#tuong-niem') setTab('mem');
  }, []);

  const got = useMemo(() => new Set(meta?.endings ?? []), [meta]);
  const total = LOVE_IDS.length * ROUTE_ENDS.length + SOLO_ENDS.length + Object.keys(MIDS).length;
  const n = got.size;
  const rank = [...RANKS].reverse().find(([k]) => n >= k);
  const nextRank = RANKS.find(([k]) => n < k);

  return (
    <main className="app dither">
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            SỔ TÌNH
          </div>
          <h1>{tab === 'map' ? 'Bản đồ tình duyên' : 'Sổ tưởng niệm'}</h1>
        </div>
      </div>
      <div className="body" style={{ paddingTop: 8 }}>
        <div className="chips" role="tablist">
          <button type="button" role="tab" aria-pressed={tab === 'map'} className="opt chip px" onClick={() => setTab('map')}>
            <b>Bản đồ</b>
          </button>
          <button type="button" role="tab" aria-pressed={tab === 'mem'} className="opt chip px" onClick={() => setTab('mem')}>
            <b>Tưởng niệm</b>
          </button>
        </div>

        {!meta ? (
          <p className="mute">Đang mở sổ...</p>
        ) : tab === 'map' ? (
          <>
            <div className="card px st-sum">
              <b>
                {n}/{total} kết cục
              </b>
              <span>{rank ? `★ ${rank[1]}` : 'Chưa có danh hiệu'}</span>
              {nextRank && <small className="mute">Mở {nextRank[0] - n} kết cục nữa để thành "{nextRank[1]}"</small>}
              <small className="mute">Đã sống {meta.lives ?? 0} đời</small>
            </div>
            <div className="chips">
              <button type="button" aria-pressed={lg === 'm'} className="opt chip px" onClick={() => setLg('m')}>
                <b>Dàn nam</b>
              </button>
              <button type="button" aria-pressed={lg === 'f'} className="opt chip px" onClick={() => setLg('f')}>
                <b>Dàn nữ</b>
              </button>
            </div>
            <div className="st-tree">
              {LOVE_IDS.map((id) => (
                <LoverBranch key={id} id={id} lg={lg} got={got} />
              ))}
            </div>
            <div className="mt-h">KẾT CỤC KHÁC</div>
            <ul className="st-ends">
              {[...SOLO_ENDS, ...Object.keys(MIDS)].map((id) => {
                const on = got.has(id);
                const e = endingInfo(id, lg);
                return (
                  <li key={id} className={on ? 'on' : ''}>
                    <b>{on ? e.name : '? ? ?'}</b>
                    {on && <small>{e.desc}</small>}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <Memorials meta={meta} />
        )}
      </div>
    </main>
  );
}

function LoverBranch({ id, lg, got }: { id: LoveId; lg: 'm' | 'f'; got: Set<string> }) {
  const layers = useMemo(() => lpcLayers(CAST[id][lg], lg, 'adult'), [id, lg]);
  const opened = ROUTE_ENDS.filter((k) => got.has(`${k}_${id}`)).length;
  return (
    <details className="st-branch px-dim">
      <summary>
        <span className="st-face">
          <Sprite layers={layers} scale={1} anim="idle" dir={2} label={LOVES[id][lg]} />
        </span>
        <span className="st-name">
          <b>{LOVES[id][lg]}</b>
          <small>{LOVES[id].kind}</small>
        </span>
        <span className="st-dots" aria-label={`Đã mở ${opened}/${ROUTE_ENDS.length}`}>
          {ROUTE_ENDS.map((k) => (
            <i key={k} className={got.has(`${k}_${id}`) ? `on k-${k}` : ''} />
          ))}
        </span>
      </summary>
      <ol className="st-leaves">
        {ROUTE_ENDS.map((k) => {
          const key = `${k}_${id}`;
          const on = got.has(key);
          const e = endingInfo(key, lg);
          return (
            <li key={k} className={on ? 'on' : ''}>
              <span className="mute">{KIND_LABEL[k]}</span>
              <b>{on ? e.name : '? ? ?'}</b>
              {on && <small>{e.desc}</small>}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function Memorials({ meta }: { meta: Meta }) {
  const ms = meta.memorials ?? [];
  if (!ms.length) return <p className="mute">Chưa có đời nào sống trọn. Sống hết một đời để thấy ở đây.</p>;
  return (
    <ol className="st-mem">
      {ms.map((m, i) => (
        <li key={i} className="card px">
          <b>{m.name}</b>
          <span className="mute">
            {m.born} - {m.born + m.age} · {m.province}
          </span>
          <span>
            ♥ {m.love}
            {m.who ? ` · cùng ${m.who}` : ''}
          </span>
          {m.photos > 0 && <small className="mute">▣ {m.photos} tấm ảnh kỷ niệm</small>}
          {m.notes.map((n, k) => (
            <small key={k} className="st-note">
              {n.age} tuổi: “{n.a}”
            </small>
          ))}
        </li>
      ))}
    </ol>
  );
}
