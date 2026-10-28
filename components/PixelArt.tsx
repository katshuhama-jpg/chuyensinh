'use client';

import { useEffect, useRef } from 'react';

/** Vẽ một hình pixel từ các dòng ký tự (mỗi ký tự là một ô màu theo bảng màu), phóng nguyên lần */
export default function PixelArt({ rows, pal, scale = 4, className, label }: { rows: string[]; pal: Record<string, string>; scale?: number; className?: string; label?: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  useEffect(() => {
    const ctx = cv.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        const c = pal[ch];
        if (!c) return;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }),
    );
  }, [rows, pal, w, h]);
  return <canvas ref={cv} width={w} height={h} className={className} style={{ width: w * scale, height: h * scale, imageRendering: 'pixelated' }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

/** Điện thoại bàn quay số màu kem (32x20) */
export const LANDLINE = {
  rows: [
    '......oooooooooooooooooooo......',
    '....oohhhhhhhhhhhhhhhhhhhhoo....',
    '...ohhcccccccccccccccccccchho...',
    '...ohcccooooooooooooooocccho....',
    '...occcco..............occco....',
    '....ooo..................ooo....',
    '.......ooooooooooooooooooo......',
    '.....oohhhhhhhhhhhhhhhhhhhoo....',
    '....ohhcccccooooooocccccccho....',
    '...ohcccccoodddddddooccccccho...',
    '...occcccodd.d.d.d.ddocccccco...',
    '..ohcccccod.d.ooo.d.docccccho...',
    '..occcccccdd.ooxoo.ddccccccco...',
    '..occcccccd.d.ooo.d.dcccccco....',
    '..ohcccccccdd.d.d.ddcccccccho...',
    '..occccccccoodddddoocccccccco...',
    '..ossssssssssssssssssssssssso...',
    '..ossssssssssssssssssssssssso...',
    '...ooooooooooooooooooooooooo....',
  ],
  pal: { o: '#3a2a1a', h: '#fbf3df', c: '#e8dcc0', d: '#c8b890', x: '#c4302a', s: '#b0a078' },
};

/** Ống nghe nhấc lên (khi đã thông máy) */
export const HANDSET = {
  rows: [
    '..oooo..............oooo..',
    '.ohhcco............ohhcco.',
    'ohcccco............occccho',
    'occcccooooooooooooooccccco',
    '.occcchhhhhhhhhhhhhhcccco.',
    '..ooocccccccccccccccccooo.',
    '.....oooooooooooooooooo...',
  ],
  pal: { o: '#3a2a1a', h: '#fbf3df', c: '#e8dcc0' },
};
