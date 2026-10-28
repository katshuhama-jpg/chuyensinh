'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Trò "Chim Vỗ Cánh" (gợi nhớ cơn sốt game chim vỗ cánh năm 2014): chạm để chim bay lên, né ống.
 * Vẽ pixel trên canvas 160x120 phóng 2 lần. Hết lượt thì báo điểm.
 */
export default function TapGame({ goal, onEnd }: { goal: number; onEnd: (score: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const g = useRef({ y: 60, v: 0, pipes: [] as { x: number; gap: number; passed: boolean }[], t: 0, score: 0 });
  const flap = () => {
    if (state === 'over') return;
    if (state === 'ready') setState('play');
    g.current.v = -2.6;
  };

  useEffect(() => {
    if (state !== 'play') return;
    const ctx = cv.current!.getContext('2d')!;
    let raf = 0;
    const s = g.current;
    s.y = 60;
    s.v = 0;
    s.pipes = [];
    s.t = 0;
    s.score = 0;
    const step = () => {
      s.t++;
      s.v += 0.16;
      s.y += s.v;
      if (s.t % 70 === 1) s.pipes.push({ x: 170, gap: 30 + ((s.t * 37) % 50), passed: false });
      for (const p of s.pipes) {
        p.x -= 1.2;
        if (!p.passed && p.x < 40) {
          p.passed = true;
          s.score++;
          setScore(s.score);
        }
      }
      s.pipes = s.pipes.filter((p) => p.x > -20);
      // vẽ
      ctx.fillStyle = '#7fbfe8';
      ctx.fillRect(0, 0, 160, 120);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 18, 18, 3);
      ctx.fillRect(100, 26, 22, 3);
      ctx.fillStyle = '#5fae52';
      ctx.fillRect(0, 108, 160, 12);
      ctx.fillStyle = '#d9c9a0';
      ctx.fillRect(0, 112, 160, 8);
      let hit = s.y < 0 || s.y > 104;
      for (const p of s.pipes) {
        for (const [y0, y1] of [
          [0, p.gap],
          [p.gap + 34, 108],
        ]) {
          ctx.fillStyle = '#3f9a3a';
          ctx.fillRect(p.x, y0, 16, y1 - y0);
          ctx.fillStyle = '#7fd16a';
          ctx.fillRect(p.x + 2, y0, 3, y1 - y0);
          ctx.fillStyle = '#2b5a28';
          ctx.fillRect(p.x - 2, y0 === 0 ? y1 - 6 : y0, 20, 6);
        }
        if (p.x < 46 && p.x + 16 > 36 && (s.y < p.gap || s.y + 8 > p.gap + 34)) hit = true;
      }
      // chim
      ctx.fillStyle = '#211833';
      ctx.fillRect(35, s.y - 1, 12, 10);
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect(36, s.y, 10, 8);
      ctx.fillStyle = '#fbeff2';
      ctx.fillRect(42, s.y + 1, 3, 3);
      ctx.fillStyle = '#211833';
      ctx.fillRect(44, s.y + 2, 1, 1);
      ctx.fillStyle = '#e8584a';
      ctx.fillRect(46, s.y + 4, 4, 2);
      ctx.fillStyle = '#e0b54a';
      ctx.fillRect(36, s.y + (s.t % 10 < 5 ? 3 : 5), 5, 3);
      if (hit) {
        setState('over');
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  // màn chờ: vẽ trời, đất và chim đứng yên
  useEffect(() => {
    if (state !== 'ready') return;
    const ctx = cv.current!.getContext('2d')!;
    ctx.fillStyle = '#7fbfe8';
    ctx.fillRect(0, 0, 160, 120);
    ctx.fillStyle = '#5fae52';
    ctx.fillRect(0, 108, 160, 12);
    ctx.fillStyle = '#d9c9a0';
    ctx.fillRect(0, 112, 160, 8);
    ctx.fillStyle = '#211833';
    ctx.fillRect(35, 59, 12, 10);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(36, 60, 10, 8);
  }, [state]);

  useEffect(() => {
    if (state !== 'over') return;
    const t = setTimeout(() => onEnd(g.current.score), 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="tap px">
      <div className="tap-head">
        <b>CHIM VỖ CÁNH</b>
        <span>
          Điểm: {score} / mục tiêu {goal}
        </span>
      </div>
      <canvas
        ref={cv}
        width={160}
        height={120}
        className="tap-cv"
        onPointerDown={(e) => {
          e.preventDefault();
          flap();
        }}
        aria-label="Chạm để chim bay lên"
      />
      {state === 'ready' && <p className="tap-hint">Chạm vào màn hình để chim bay. Qua {goal} ống là thắng.</p>}
      {state === 'over' && <p className="tap-hint">{score >= goal ? `Qua ${score} ống! Cả lớp trầm trồ.` : `Rơi rồi! ${score} ống.`}</p>}
    </div>
  );
}
