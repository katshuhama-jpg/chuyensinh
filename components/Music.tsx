'use client';

import { useEffect, useRef, useState } from 'react';

const KEY = 'dt.music';

/**
 * Nhạc nền "A Handheld Promise": phát lặp, nút ♪ ở góc dưới để bật / tắt, nhớ lựa chọn trên máy.
 * Trình duyệt chặn tự phát, nên nhạc bắt đầu ở lần chạm đầu tiên nếu đang để bật.
 */
export default function Music() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === 'off') setOn(false);
    } catch {}
    const a = new Audio('/music/a-handheld-promise.mp3');
    a.loop = true;
    a.volume = 0.45;
    a.preload = 'auto';
    a.onplay = () => setPlaying(true);
    a.onpause = () => setPlaying(false);
    audio.current = a;
    return () => a.pause();
  }, []);

  // bắt đầu phát ở lần chạm đầu tiên (nếu đang bật)
  useEffect(() => {
    if (!on) return;
    const start = () => {
      audio.current?.play().catch(() => {});
    };
    start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [on]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(KEY, next ? 'on' : 'off');
    } catch {}
    if (next) audio.current?.play().catch(() => {});
    else audio.current?.pause();
  };

  return (
    <button type="button" className={`music px ${on && playing ? 'on' : ''}`} onClick={toggle} aria-pressed={on} aria-label={on ? 'Tắt nhạc' : 'Bật nhạc'}>
      <span aria-hidden="true">{on ? '♪' : '♪̸'}</span>
      <small>{on ? 'NHẠC' : 'TẮT'}</small>
    </button>
  );
}
