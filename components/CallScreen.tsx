'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import PixelArt, { HANDSET, LANDLINE } from './PixelArt';

export type CallSkin = 'ban' | 'nokia' | 'smart' | 'ai';
export const callSkinOf = (year: number): CallSkin => (year < 2004 ? 'ban' : year < 2012 ? 'nokia' : year <= 2026 ? 'smart' : 'ai');

/**
 * Màn hình cuộc gọi theo thời kỳ: điện thoại bàn reng reng, "cục gạch" rung, smartphone gọi video, trợ lý AI.
 * Gọi đến thì máy rung và vòng sóng lan ra; gọi đi thì hiện "Đang đổ chuông..." rồi người kia nói.
 * Lựa chọn đầu là nút xanh (nghe / nói), lựa chọn cuối là nút đỏ (từ chối / cúp máy).
 */
export default function CallScreen({
  skin,
  dir,
  video,
  name,
  sub,
  avatar,
  lines = [],
  opts,
  picked,
  onChoose,
}: {
  skin: CallSkin;
  dir: 'in' | 'out';
  video?: boolean;
  name: string;
  sub?: string;
  avatar?: ReactNode;
  /** câu người kia nói khi máy đã thông */
  lines?: string[];
  opts?: string[];
  /** lựa chọn vừa bấm (sau khi chọn) */
  picked?: string;
  onChoose?: (i: number) => void;
}) {
  const live = !!opts && !!onChoose;
  // gọi đi: đổ chuông 2 giây rồi mới thông máy
  const [connected, setConnected] = useState(dir === 'in' ? false : !live);
  const [sec, setSec] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (dir !== 'out' || !live) return;
    const t = setTimeout(() => setConnected(true), 2200);
    return () => clearTimeout(t);
  }, [dir, live]);
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSec((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);
  const pick = (i: number) => {
    if (done.current || !onChoose) return;
    done.current = true;
    onChoose(i);
  };
  const ringing = live && !connected;
  const clock = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const status = !live ? (picked ? 'Cuộc gọi đã kết thúc' : '') : ringing ? (dir === 'in' ? (video ? 'Cuộc gọi video đến...' : 'Đang gọi đến...') : 'Đang đổ chuông...') : clock;

  const buttons = live && (dir === 'in' ? true : connected) && (
    <div className="cl-btns">
      {opts!.map((t, i) => (
        <button
          key={i}
          type="button"
          className={`cl-btn ${i === 0 ? 'ok' : i === opts!.length - 1 ? 'no' : 'mid'}`}
          onClick={() => pick(i)}
        >
          <i aria-hidden="true">{i === 0 ? (dir === 'in' && !connected ? '✆' : '✎') : i === opts!.length - 1 ? '✕' : '…'}</i>
          <span>{t}</span>
        </button>
      ))}
    </div>
  );
  const said = connected && lines.length > 0 && (
    <div className="cl-lines">
      {lines.map((l, i) => (
        <p key={i} style={{ animationDelay: `${0.3 + i * 0.9}s` }}>
          {l}
        </p>
      ))}
    </div>
  );

  if (skin === 'ban')
    return (
      <div className={`call cl-ban ${ringing ? 'ring' : ''}`}>
        <div className="cl-desk" aria-hidden="true">
          {connected && <PixelArt rows={HANDSET.rows} pal={HANDSET.pal} scale={4} className="cl-lift" />}
          <PixelArt rows={LANDLINE.rows} pal={LANDLINE.pal} scale={5} className="cl-phone" />
          {ringing && <span className="cl-reng">Reng... reng...</span>}
        </div>
        <div className="cl-who">
          <b>{dir === 'out' ? `Gọi đến nhà ${name}` : `Điện thoại bàn reo`}</b>
          <small>{status}</small>
          {sub && <small>{sub}</small>}
        </div>
        {said}
        {picked && <p className="cl-picked">{picked}</p>}
        {buttons}
      </div>
    );

  if (skin === 'nokia')
    return (
      <div className={`call cl-nokia ${ringing ? 'ring' : ''}`}>
        <div className="nk-body">
          <div className="nk-screen cl-nkscreen">
            <div className="nk-top">
              <span>▮▮▮▯</span>
              <span>{dir === 'in' ? '☏ CUỘC GỌI' : '☏ ĐANG GỌI'}</span>
              <span>▭</span>
            </div>
            <div className="cl-nkname">{name}</div>
            <div className="cl-nkstat">{status}</div>
            {sub && <div className="cl-nkstat">{sub}</div>}
            {ringing && <div className="cl-nkwave" aria-hidden="true">((( ☏ )))</div>}
            {said}
            {picked && <p className="nk-sent">{picked}</p>}
          </div>
          {buttons}
        </div>
      </div>
    );

  const ai = skin === 'ai';
  return (
    <div className={`call cl-smart ${ai ? 'holo' : ''} ${video ? 'video' : ''} ${ringing ? 'ring' : ''}`}>
      <div className="cl-bg" aria-hidden="true" />
      {video && connected && <div className="cl-self" aria-hidden="true">Bạn</div>}
      <div className="cl-avwrap">
        {ringing && (
          <>
            <i className="cl-pulse" />
            <i className="cl-pulse d2" />
          </>
        )}
        <span className="cl-av">{avatar}</span>
      </div>
      <div className="cl-who">
        <b>{name}</b>
        <small>{status}</small>
        {sub && <small>{sub}</small>}
      </div>
      {said}
      {picked && <p className="cl-picked">{picked}</p>}
      {buttons}
    </div>
  );
}
