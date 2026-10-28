'use client';

import { useMemo, useRef, useState } from 'react';
import Sprite from './Sprite';
import { lpcLayers } from '@/lib/look';
import type { SwipeCard } from '@/lib/story';

export type DeckSkin = 'paper' | 'forum' | 'app' | 'ai';
export const deckSkinOf = (year: number): DeckSkin => (year < 2005 ? 'paper' : year < 2015 ? 'forum' : year <= 2026 ? 'app' : 'ai');

const TITLE: Record<DeckSkin, string> = {
  paper: 'MỤC TÌM BẠN BỐN PHƯƠNG',
  forum: 'DIỄN ĐÀN KẾT BẠN',
  app: 'Quẹt',
  ai: 'Quẹt AI · ghép đôi theo độ hợp',
};

/**
 * Thẻ hồ sơ kéo trái (bỏ qua) phải (thích). Thích đúng người thật thì Match;
 * thích nhầm hồ sơ ảo thì bật ra một chuyện dở khóc dở cười rồi quẹt tiếp.
 * Hết thẻ mà không match thì gọi onDone(null).
 */
export default function SwipeDeck({
  cards,
  year,
  gold,
  onDone,
}: {
  cards: SwipeCard[];
  year: number;
  /** gói Vàng: can = đủ Tài chính để mua */
  gold?: { can: boolean; price: number };
  onDone: (loveId: string | null, gold: boolean) => void;
}) {
  const skin = deckSkinOf(year);
  const [vip, setVip] = useState(false);
  const [shop, setShop] = useState(false);
  const likedMe = cards.filter((c) => c.loveId).length;
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [fly, setFly] = useState<0 | -1 | 1>(0);
  const [pop, setPop] = useState<{ kind: 'fake' | 'match'; text: string; id?: string } | null>(null);
  const start = useRef<number | null>(null);
  const card = cards[i];
  const nextCard = cards[i + 1];

  function decide(dir: -1 | 1) {
    if (!card || fly || pop) return;
    setFly(dir);
    setTimeout(() => {
      setFly(0);
      setDx(0);
      if (dir === 1 && card.loveId) setPop({ kind: 'match', text: card.match ?? '', id: card.loveId });
      else if (dir === 1 && card.result) setPop({ kind: 'fake', text: card.result });
      else advance();
    }, 260);
  }
  function advance() {
    setPop(null);
    if (i + 1 >= cards.length) onDone(null, vip);
    else setI(i + 1);
  }

  const onDown = (e: React.PointerEvent) => {
    if (fly || pop) return;
    start.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current !== null) setDx(e.clientX - start.current);
  };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx > 90) decide(1);
    else if (dx < -90) decide(-1);
    else setDx(0);
  };

  const x = fly ? fly * 520 : dx;
  return (
    <div className={`deck deck-${skin}`}>
      <div className="dk-bar">
        <b>{TITLE[skin]}</b>
        {gold && (skin === 'app' || skin === 'ai') && (
          <button type="button" className={`dk-gold ${vip ? 'on' : ''}`} onClick={() => !vip && setShop(true)} aria-label="Gói Vàng">
            ★ {vip ? 'VÀNG' : `${likedMe} người thích bạn`}
          </button>
        )}
        <span>
          {Math.min(i + 1, cards.length)}/{cards.length}
        </span>
      </div>
      {shop && (
        <div className="dk-pop gold" role="dialog" aria-label="Mua gói Vàng">
          <div className="dk-match">★ QUẸT VÀNG</div>
          <p>Xem ngay ai đã thích bạn, match chắc chắn hơn. Giá: -{gold!.price} Tài chính.</p>
          <div className="dk-goldrow">
            {Array.from({ length: Math.max(1, likedMe) }, (_, k) => (
              <i key={k} className="dk-blur" aria-hidden="true">
                ♥
              </i>
            ))}
          </div>
          {gold!.can ? (
            <button type="button" className="btn-main" onClick={() => (setVip(true), setShop(false))}>
              MUA GÓI VÀNG
            </button>
          ) : (
            <p className="dk-poor">Tài chính chưa đủ. Đi làm thêm rồi quay lại nhé.</p>
          )}
          <button type="button" className="btn-sub px" onClick={() => setShop(false)}>
            Để sau
          </button>
        </div>
      )}
      <div className="dk-stack">
        {nextCard && <Card c={nextCard} skin={skin} under />}
        {card && (
          <div
            className="dk-top"
            style={{ transform: `translateX(${x}px) rotate(${x / 18}deg)`, transition: start.current === null ? 'transform 0.26s ease-out' : 'none' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <Card c={card} skin={skin} liked={vip && !!card.loveId} />
            <span className="dk-stamp like" style={{ opacity: Math.max(0, Math.min(1, x / 90)) }}>
              {skin === 'paper' ? 'VIẾT THƯ' : 'THÍCH'}
            </span>
            <span className="dk-stamp nope" style={{ opacity: Math.max(0, Math.min(1, -x / 90)) }}>
              BỎ QUA
            </span>
          </div>
        )}
      </div>
      <div className="dk-btns">
        <button type="button" className="dk-no" aria-label="Bỏ qua" onClick={() => decide(-1)}>
          ✕
        </button>
        <button type="button" className="dk-yes" aria-label={skin === 'paper' ? 'Viết thư làm quen' : 'Thích'} onClick={() => decide(1)}>
          ♥
        </button>
      </div>
      <p className="dk-hint">Kéo thẻ sang phải để {skin === 'paper' ? 'viết thư làm quen' : 'thích'}, sang trái để bỏ qua.</p>

      {pop && (
        <div className={`dk-pop ${pop.kind}`} role="dialog" aria-label={pop.kind === 'match' ? 'Match' : 'Kết quả'}>
          {pop.kind === 'match' ? (
            <>
              <div className="dk-match">{skin === 'paper' ? 'CÓ THƯ HỒI ÂM!' : 'MATCH!'}</div>
              <p>{pop.text}</p>
              <button type="button" className="btn-main" onClick={() => onDone(pop.id ?? null, vip)}>
                {skin === 'paper' ? 'ĐỌC THƯ ▶' : 'NHẮN TIN ▶'}
              </button>
            </>
          ) : (
            <>
              <div className="dk-oops">Ối!</div>
              <p>{pop.text}</p>
              <button type="button" className="btn-sub px" onClick={advance}>
                Quẹt tiếp
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ c, skin, under, liked }: { c: SwipeCard; skin: DeckSkin; under?: boolean; liked?: boolean }) {
  const layers = useMemo(() => lpcLayers(c.look, c.gender, 'adult'), [c]);
  return (
    <div className={`dk-card ${under ? 'under' : ''}`}>
      {skin !== 'paper' ? (
        <div className="dk-photo" style={{ background: c.bg }}>
          <Sprite layers={layers} scale={3} anim="idle" dir={2} label={`Ảnh của ${c.name}`} />
          {skin === 'ai' && <span className="dk-score">Độ hợp {c.score ?? 70}%</span>}
          {liked && <span className="dk-liked">★ Đã thích bạn</span>}
        </div>
      ) : (
        <div className="dk-clip">Hộp thư số {c.box ?? 128}</div>
      )}
      <div className="dk-info">
        <b>
          {c.name}, {c.age}
        </b>
        <small>{c.where}</small>
        <p>{c.bio}</p>
        {c.tags && (
          <div className="dk-tags">
            {c.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
