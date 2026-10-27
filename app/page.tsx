'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import ThemeToggle from '@/components/ThemeToggle';
import type { Look } from '@/lib/game/roll';
import type { Gender } from '@/lib/game/world';
import { lpcLayers } from '@/lib/look';
import { loadMe, type Meta } from '@/lib/save';
import { useAuth } from '@/lib/useAuth';

// mỗi lần đổi là một thân phận khác: ý tưởng "trở thành ai cũng được"
const DEMO: { g: Gender; look: Look; cap: string }[] = [
  { g: 'f', cap: '...nữ tổng tài', look: { skin: 0, hair: '#2a1d16', hairStyle: 2, top: 3, bottom: 1, topColor: '#e8e1d0', bottomColor: '#30343f' } },
  { g: 'm', cap: '...tuyển thủ esports', look: { skin: 1, hair: '#2a1d16', hairStyle: 1, top: 0, bottom: 0, topColor: '#c4573a', bottomColor: '#2b3045' } },
  { g: 'f', cap: '...ca sĩ phòng trà', look: { skin: 2, hair: '#4a2f1d', hairStyle: 0, top: 2, bottom: 0, topColor: '#6a4a8c', bottomColor: '#30343f' } },
  { g: 'm', cap: '...bác sĩ', look: { skin: 3, hair: '#2a1d16', hairStyle: 0, top: 4, bottom: 1, topColor: '#e8e1d0', bottomColor: '#2b3045' } },
  { g: 'nb', cap: '...dân du mục số', look: { skin: 0, hair: '#d9b26a', hairStyle: 0, top: 1, bottom: 2, topColor: '#2f7a63', bottomColor: '#7a6a58' } },
];

/** Khoảng 132 triệu trẻ sinh mỗi năm trên thế giới (LHQ, dự báo 2026), tức khoảng 4,2 em bé mỗi giây */
const BIRTHS_PER_SEC = 132_500_000 / (365.25 * 24 * 3600);

export default function Home() {
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta>({});
  const [i, setI] = useState(0);
  const [born, setBorn] = useState(0);

  useEffect(() => {
    if (user) loadMe().then((m) => m && setMeta(m.meta));
  }, [user]);

  useEffect(() => {
    const t0 = Date.now();
    const a = setInterval(() => setBorn(Math.floor(((Date.now() - t0) / 1000) * BIRTHS_PER_SEC)), 250);
    const b = setInterval(() => setI((n) => (n + 1) % DEMO.length), 2600);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  const demo = DEMO[i];
  const layers = useMemo(() => lpcLayers(demo.look, demo.g, 'adult'), [demo]);
  const lifeNo = (meta.lives ?? 0) + 1;

  return (
    <main className="app dither home">
      <div className="topbar">
        {ready && user ? (
          <span className="mute">@{user.username}</span>
        ) : (
          <Link href="/dang-nhap">Đăng nhập</Link>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent)' }}>Duyên {meta.duyen ?? 0}</span>
          <ThemeToggle />
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        <div className="eyebrow">KIẾP NÀY MÌNH CHỌN · ĐỜI THỨ {lifeNo}</div>
        <h1 className="logo">
          CHUYỂN SINH,
          <br />
          TÔI TRỞ THÀNH
          <br />
          ...
        </h1>
        <p className="mute" style={{ marginTop: 8, fontSize: 22 }}>
          Sinh ra ở đâu, năm nào, trong nhà ai - bạn không chọn được. Sống thế nào thì có.
        </p>
      </div>

      <div className="scene px">
        <span className="stars" aria-hidden="true" />
        <div className="scene-cap" aria-live="polite">
          {demo.cap}
        </div>
        <Sprite layers={layers} scale={2} anim="walk" dir={2} label={`Nhân vật mẫu: ${demo.cap.replace('...', '')}`} />
        <span className="ground" aria-hidden="true" />
      </div>

      <div className="counter">
        <i aria-hidden="true" />
        <span>Từ lúc bạn mở trang, {born.toLocaleString('vi-VN')} em bé đã chào đời trên Trái Đất</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 'auto', padding: '0 4px 8px' }}>
        <Link href="/chao-doi" className="btn-main">
          ▶ CHÀO ĐỜI
        </Link>
        <div className="grid3">
          <button type="button" className="tile px is-soon" disabled>
            Album đời
            <small>sắp có</small>
          </button>
          <button type="button" className="tile px is-soon" disabled>
            Xếp hạng
            <small>sắp có</small>
          </button>
          <button type="button" className="tile px is-soon" disabled>
            Hội bạn
            <small>sắp có</small>
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 18 }} className="mute">
          Sổ Đời {meta.endings?.length ?? 0}/32 kết cục · <Link href="/tac-gia">Ghi nguồn hình ảnh</Link>
        </div>
      </div>
    </main>
  );
}
