'use client';

import { useEffect, useRef } from 'react';

/**
 * Biểu đồ mạng nhện kiểu pixel: vẽ từng điểm ảnh lên canvas nhỏ (không khử răng cưa) rồi phóng nguyên lần.
 * values 0-100, mỗi trục một nhãn.
 */
export default function Radar({ axes, size = 120, scale = 2 }: { axes: { label: string; value: number }[]; size?: number; scale?: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const n = axes.length;
  const c = size / 2;
  const R = size / 2 - 6;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r)];
  };
  useEffect(() => {
    const ctx = cv.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    const dot = (x: number, y: number, col: string) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    };
    const line = (a: [number, number], b: [number, number], col: string, step = 1) => {
      let [x0, y0] = a;
      const [x1, y1] = b;
      const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
      let err = dx + dy, k = 0;
      for (;;) {
        if (k++ % step === 0) dot(x0, y0, col);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) (err += dy), (x0 += sx);
        if (e2 <= dx) (err += dx), (y0 += sy);
      }
    };
    // tô đa giác bằng quét từng hàng (giữ nét pixel)
    const fill = (ps: [number, number][], col: string) => {
      ctx.fillStyle = col;
      const ys = ps.map((p) => p[1]);
      for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
        const xs: number[] = [];
        for (let i = 0; i < ps.length; i++) {
          const [ax, ay] = ps[i], [bx, by] = ps[(i + 1) % ps.length];
          if (ay === by) continue;
          if (y >= Math.min(ay, by) && y < Math.max(ay, by)) xs.push(Math.round(ax + ((y - ay) * (bx - ax)) / (by - ay)));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) ctx.fillRect(xs[k], y, xs[k + 1] - xs[k] + 1, 1);
      }
    };
    const grid = '#4f3d6b';
    for (const f of [0.25, 0.5, 0.75, 1]) {
      const ring = axes.map((_, i) => pt(i, R * f));
      ring.forEach((p, i) => line(p, ring[(i + 1) % n], f === 1 ? '#7a6a9a' : grid, f === 1 ? 1 : 2));
    }
    axes.forEach((_, i) => line([c, c], pt(i, R), grid, 2));
    const shape = axes.map((a, i) => pt(i, (R * Math.max(4, a.value)) / 100));
    fill(shape, 'rgba(232,120,159,0.55)');
    shape.forEach((p, i) => line(p, shape[(i + 1) % n], '#e8789f'));
    shape.forEach(([x, y]) => {
      ctx.fillStyle = '#fbeff2';
      ctx.fillRect(x - 1, y - 1, 3, 3);
    });
  }, [axes, size, n, R, c]);

  // nhãn quanh hình (chữ thường, đặt theo tọa độ đỉnh)
  return (
    <div className="radar" style={{ width: size * scale + 120, height: size * scale + 56 }}>
      <canvas ref={cv} width={size} height={size} style={{ width: size * scale, height: size * scale, imageRendering: 'pixelated' }} role="img" aria-label={axes.map((a) => `${a.label} ${a.value}`).join(', ')} />
      {axes.map((a, i) => {
        const [x, y] = pt(i, R + 8);
        return (
          <span key={a.label} className="rd-label" style={{ left: 60 + x * scale, top: 28 + y * scale }}>
            {a.label}
            <b>{a.value}</b>
          </span>
        );
      })}
    </div>
  );
}
