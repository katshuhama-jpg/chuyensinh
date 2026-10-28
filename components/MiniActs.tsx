'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Màn khóa điện thoại cảm ứng đời đầu: kéo nút sang phải để mở khóa, mở xong mới hiện lựa chọn */
export function SlideUnlock({ children }: { children: ReactNode }) {
  const [x, setX] = useState(0);
  const [open, setOpen] = useState(false);
  const start = useRef<number | null>(null);
  const MAX = 196;
  if (open) return <>{children}</>;
  return (
    <div className="unlock">
      <div className="ul-screen">
        <div className="ul-time">9:41</div>
        <div className="ul-date">Màn hình cảm ứng, không cần bàn phím</div>
        <div
          className="ul-track"
          onPointerMove={(e) => start.current !== null && setX(Math.max(0, Math.min(MAX, e.clientX - start.current)))}
          onPointerUp={() => {
            start.current = null;
            if (x >= MAX - 8) setOpen(true);
            else setX(0);
          }}
          onPointerCancel={() => ((start.current = null), setX(0))}
        >
          <span className="ul-text" style={{ opacity: 1 - x / MAX }}>
            trượt để mở khóa
          </span>
          <button
            type="button"
            className="ul-knob"
            style={{ transform: `translateX(${x}px)` }}
            aria-label="Trượt để mở khóa (hoặc bấm)"
            onPointerDown={(e) => {
              start.current = e.clientX - x;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
          >
            ➜
          </button>
        </div>
      </div>
      <p className="tap-hint">Kéo mũi tên sang phải để mở khóa thử.</p>
    </div>
  );
}

/**
 * Cổ vũ chung kết: bấm thật nhanh trong vài giây để lấp đầy thanh cổ vũ.
 * Đầy thì chọn lựa chọn 0, không đầy thì lựa chọn 1; hai nút nhỏ bên dưới là lựa chọn 2 và 3.
 */
export function CheerMeter({ goal, secs = 6, alt, onChoose }: { goal: number; secs?: number; alt: string[]; onChoose: (i: number) => void }) {
  const [n, setN] = useState(0);
  const [left, setLeft] = useState(secs);
  const [go, setGo] = useState(false);
  const done = useRef(false);
  const pick = (i: number) => {
    if (done.current) return;
    done.current = true;
    onChoose(i);
  };
  useEffect(() => {
    if (!go) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [go]);
  useEffect(() => {
    if (n >= goal) setTimeout(() => pick(0), 600);
    else if (go && left <= 0) pick(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, left]);
  const pct = Math.min(100, (n / goal) * 100);
  return (
    <div className="cheer px">
      <div className="ch-head">
        <b>THANH CỔ VŨ</b>
        <span>{go ? `${Math.max(0, left)} giây` : 'Sẵn sàng'}</span>
      </div>
      <div className="ch-bar" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Thanh cổ vũ">
        <i style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        className={`ch-btn ${n >= goal ? 'full' : ''}`}
        onClick={() => {
          if (done.current) return;
          if (!go) setGo(true);
          setN((v) => v + 1);
        }}
      >
        {n >= goal ? 'VÔ ĐỊCH!!!' : 'HÉT CỔ VŨ!'}
      </button>
      <p className="tap-hint">Bấm liên tục cho đầy thanh trước khi hết giờ.</p>
      <div className="ch-alt">
        {alt.map((t, i) => (
          <button key={i} type="button" className="opt chip px" onClick={() => pick(i + 2)}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
