'use client';

import { useEffect, useState } from 'react';

/** Nút đổi giao diện sáng / tối, nhớ trên máy */
export default function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.dataset.theme === 'light');
  }, []);
  function toggle() {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem('dt.theme', next ? 'light' : 'dark');
    } catch {
      /* bỏ qua */
    }
  }
  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-label={light ? 'Đổi sang giao diện tối' : 'Đổi sang giao diện sáng'} title={light ? 'Giao diện tối' : 'Giao diện sáng'}>
      {light ? '☾' : '☀'}
    </button>
  );
}
