'use client';

/**
 * Sân khấu nhìn từ trên xuống chéo, cùng góc với nhân vật LPC.
 * Cây, đá, nước, tường, đồ vật: cắt từ LPC Tile Atlas (CC-BY-SA 3.0 / GPL 3.0, xem /tac-gia).
 * Trời, núi, giờ trong ngày và mùa: vẽ thêm trong game.
 * Vẽ ở cỡ gốc (ô 32px) lên canvas 200x144 rồi phóng đúng 2 lần, như nhân vật.
 */

import { useEffect, useRef, type ReactNode } from 'react';

export type Time = 'day' | 'dusk' | 'night';
export type Season = 'xuan' | 'he' | 'thu' | 'dong' | 'tet';

export const W = 200;
export const H = 144;
const T = 32;

type Atlas = 't' | 'b';
/** Dán một khối ô: atlas, ô gốc (cột, hàng), số ô rộng x cao, vị trí đích (px) */
export type Tile = { a: Atlas; c: number; r: number; w?: number; h?: number; x: number; y: number };
/** Phủ kín một vùng bằng một ô lặp lại (đổi vài ô cho đỡ đều) */
export type Fill = { fill: [Atlas, number, number][]; x: number; y: number; w: number; h: number };
/** Khối màu tự vẽ (đồ hiện đại không có trong bộ LPC) */
export type Px = { px: [number, number, number, number, string][] };
export type Op = Tile | Fill | Px | { sky: true; h: number } | { hills: true; y: number };

const SKY: Record<Time, string[]> = {
  day: ['#7fbfe8', '#93cbee', '#a8d6f2', '#bde0f5'],
  dusk: ['#6a4f9a', '#b8628a', '#e48a8a', '#f2b08a'],
  night: ['#120e24', '#181232', '#1f183c', '#281f48'],
};
const HILL: Record<Time, [string, string]> = {
  day: ['#7aa8b8', '#5f8f6a'],
  dusk: ['#8a5a8a', '#5a3f6a'],
  night: ['#2a2450', '#1c1838'],
};

const imgs: Partial<Record<Atlas, Promise<HTMLImageElement>>> = {};
function atlas(a: Atlas) {
  return (imgs[a] ??= new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.src = a === 't' ? '/tiles/terrain_atlas.png' : '/tiles/base_out_atlas.png';
  }));
}

function draw(ctx: CanvasRenderingContext2D, ops: Op[], time: Time, at: Record<Atlas, HTMLImageElement>) {
  ctx.clearRect(0, 0, W, H);
  for (const o of ops) {
    if ('sky' in o) {
      const b = SKY[time];
      const s = Math.ceil(o.h / b.length);
      b.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, i * s, W, s);
      });
      if (time === 'night') {
        ctx.fillStyle = '#fbeff2';
        for (const [x, y] of [[14, 4], [40, 9], [66, 3], [92, 7], [150, 4], [176, 10], [120, 12]]) ctx.fillRect(x, y, 1, 1);
        ctx.fillStyle = '#fdf1c4';
        ctx.fillRect(160, 3, 6, 6);
      } else if (time === 'day') {
        ctx.fillStyle = '#ffffff';
        for (const [x, y, w] of [[20, 6, 18], [24, 4, 10], [120, 10, 22], [126, 8, 10]]) ctx.fillRect(x, y, w, 2);
      } else {
        ctx.fillStyle = '#ffd28a';
        ctx.fillRect(150, o.h - 8, 12, 6);
      }
    } else if ('hills' in o) {
      // hai lớp núi răng cưa, bước 2px cho ra nét pixel
      const [far, near] = HILL[time];
      for (const [col, amp, ph, base] of [
        [far, 10, 0.7, o.y],
        [near, 6, 1.9, o.y + 4],
      ] as [string, number, number, number][]) {
        ctx.fillStyle = col;
        for (let x = 0; x < W; x += 2) {
          const h = Math.round(amp * (0.6 + 0.4 * Math.sin(x / 17 + ph) * Math.sin(x / 7 + ph * 2)));
          ctx.fillRect(x, base - h, 2, h + 8);
        }
      }
    } else if ('fill' in o) {
      let k = 0;
      for (let y = o.y; y < o.y + o.h; y += T)
        for (let x = o.x; x < o.x + o.w; x += T) {
          const [a, c, r] = o.fill[(k++ * 7 + (y >> 5) * 3) % o.fill.length];
          const w = Math.min(T, o.x + o.w - x);
          const h = Math.min(T, o.y + o.h - y);
          ctx.drawImage(at[a], c * T, r * T, w, h, x, y, w, h);
        }
    } else if ('px' in o) {
      for (const [x, y, w, h, c] of o.px) {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, w, h);
      }
    } else {
      const w = (o.w ?? 1) * T;
      const h = (o.h ?? 1) * T;
      ctx.drawImage(at[o.a], o.c * T, o.r * T, w, h, o.x, o.y, w, h);
    }
  }
}

/** Phủ màu theo giờ: chiều ngả cam, đêm xanh tối có quầng đèn */
const TINT: Record<Time, string | null> = { day: null, dusk: 'rgba(255,140,90,0.22)', night: 'rgba(30,24,80,0.55)' };

export default function TileStage({
  src,
  ops = [],
  front = [],
  time = 'day',
  season,
  lights = [],
  children,
}: {
  /** ảnh nền ghép sẵn 200x144 (scripts/bg/compose.py) */
  src?: string;
  ops?: Op[];
  /** vẽ sau nhân vật (tán cây che phía trước) */
  front?: Op[];
  time?: Time;
  season?: Season;
  /** đèn sáng lúc tối: [x, y, bán kính] theo px gốc */
  lights?: [number, number, number][];
  children?: ReactNode;
}) {
  const back = useRef<HTMLCanvasElement>(null);
  const fore = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    Promise.all([atlas('t'), atlas('b')]).then(([t, b]) => {
      if (!live) return;
      for (const [cv, list] of [
        [back.current, ops],
        [fore.current, front],
      ] as const) {
        const ctx = cv?.getContext('2d');
        if (ctx) draw(ctx, list, time, { t, b });
      }
    });
    return () => {
      live = false;
    };
  }, [ops, front, time]);

  return (
    <div className="ts" style={{ width: W * 2, height: H * 2 }}>
      {src && <img src={src} alt="" className="ts-cv" />}
      <canvas ref={back} width={W} height={H} className="ts-cv" />
      <div className="ts-actors">{children}</div>
      <canvas ref={fore} width={W} height={H} className="ts-cv ts-front" />
      {TINT[time] && <div className="ts-tint" style={{ background: TINT[time]! }} />}
      {time !== 'day' &&
        lights.map(([x, y, r], i) => (
          <i key={i} className="ts-light" style={{ left: (x - r) * 2, top: (y - r) * 2, width: r * 4, height: r * 4 }} />
        ))}
      {season && <div className={`ts-season ts-${season}`} aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.53) % 4}s`, animationDuration: `${4 + (i % 4)}s` }} />)}</div>}
    </div>
  );
}
