'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { ANIM, composeStrip, readyStrip, type Anim, type Layer } from '@/lib/lpc';

/**
 * Nhân vật LPC. Khung gốc 64x64, hiển thị phóng to đúng bội số nguyên (mặc định 2 lần = 128px)
 * để pixel không bị nhòe.
 */
export default function Sprite({ layers, scale = 2, anim = 'idle', dir = 2, label }: { layers: Layer[]; scale?: number; anim?: Anim; dir?: number; label: string }) {
  const key = JSON.stringify([layers, anim, dir]);
  const [strip, setStrip] = useState<{ key: string; url: string } | null>(() => {
    const u = typeof window !== 'undefined' ? readyStrip(layers, anim, dir) : undefined;
    return u ? { key, url: u } : null;
  });
  useEffect(() => {
    let live = true;
    composeStrip(layers, anim, dir).then((url) => {
      if (live) setStrip({ key, url });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const box = 64 * scale;
  // dải ghép có khung 128 (người 64 nằm giữa), nên phóng gấp đôi khung hiển thị
  const cell = box * 2;
  const meta = ANIM[anim];
  const url = strip?.url;
  const ready = strip?.key === key;
  const style: CSSProperties = {
    width: cell,
    height: cell,
    left: (box - cell) / 2,
    top: (box - cell) / 2,
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: `${meta.frames * cell}px ${cell}px`,
    ['--lpc-end' as string]: `-${meta.frames * cell}px`,
    animation: ready ? `lpc-play ${meta.frames / meta.fps}s steps(${meta.frames}) infinite` : 'none',
  };
  return (
    <div className="lpc" style={{ width: box, height: box }} role="img" aria-label={label}>
      {!url && <span className="lpc-wait" />}
      <span className="lpc-strip" style={style} />
    </div>
  );
}
