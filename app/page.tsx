'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import ThemeToggle from '@/components/ThemeToggle';
import { defaultCharacter, type Look } from '@/lib/character';
import { lpcLayers } from '@/lib/look';
import { loadMe, type Meta } from '@/lib/save';
import { useAuth } from '@/lib/useAuth';

const base = { f: defaultCharacter('f').look, m: defaultCharacter('m').look };
const L = (g: 'f' | 'm', p: Partial<Look>): Look => ({ ...base[g], ...p });

// mỗi lần đổi là một lối rẽ khác: cùng một cô gái, gặp người khác thì ra chuyện khác
const DEMO: { me: Look; them: Look; cap: string }[] = [
  { cap: '...cưới cậu bạn nhà bên', me: L('f', { hair: 'ponytail', style: 'nhenhang' }), them: L('m', { hair: 'unkempt', style: 'nangdong', color: '#7fb3d9' }) },
  { cap: '...yêu boy phố', me: L('f', { hair: 'ponytail', style: 'nangdong' }), them: L('m', { hair: 'long_messy', style: 'catinh', color: '#c4573a', extra: 'earrings' }) },
  { cap: '...lỡ hẹn với học bá', me: L('f', { hair: 'ponytail', style: 'thanhlich', color: '#b48ad9' }), them: L('m', { hair: 'buzzcut', style: 'thanhlich' }) },
  { cap: '...hẹn hò ngôi sao', me: L('f', { hair: 'ponytail', style: 'catinh', color: '#e8789f' }), them: L('m', { hair: 'curtains_long', style: 'nhenhang', color: '#e0b54a', hairColor: '#d9b26a' }) },
];

export default function Home() {
  const { user, ready } = useAuth();
  const [meta, setMeta] = useState<Meta>({});
  const [i, setI] = useState(0);

  useEffect(() => {
    // chơi thử cũng có Sổ Tình, lưu trên máy
    if (ready) loadMe().then((m) => m && setMeta(m.meta));
  }, [ready, user]);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % DEMO.length), 2800);
    return () => clearInterval(t);
  }, []);

  const demo = DEMO[i];
  const me = useMemo(() => lpcLayers(demo.me, 'f', 'adult'), [demo]);
  const them = useMemo(() => lpcLayers(demo.them, 'm', 'adult'), [demo]);

  return (
    <main className="app dither home">
      <div className="topbar">
        {ready && user ? <span className="mute">@{user.username}</span> : <span className="mute">Đang chơi thử</span>}
        <ThemeToggle />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        <div className="eyebrow">LOVE&apos;S ALTERED LINES</div>
        <h1 className="logo">
          ĐƯỜNG TÌNH
          <br />
          RẼ LỐI
        </h1>
        <p className="mute" style={{ marginTop: 8, fontSize: 22 }}>
          Không day dứt, chỉ tò mò: Nếu rẽ lối khác, đời mình sẽ ra sao?
        </p>
      </div>

      <div className="scene px">
        <span className="stars" aria-hidden="true" />
        <div className="scene-cap" aria-live="polite">
          {demo.cap}
        </div>
        <span className="heart" aria-hidden="true">
          ♥
        </span>
        <div className="couple">
          <Sprite layers={me} scale={2} anim="idle" dir={3} label="Nhân vật chính" />
          <Sprite layers={them} scale={2} anim="idle" dir={1} label={`Người ấy: ${demo.cap.replace('...', '')}`} />
        </div>
        <span className="ground" aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 'auto', padding: '0 4px 8px' }}>
        {ready && user ? (
          <Link href="/tao-nhan-vat" className="btn-main">
            ▶ BẮT ĐẦU
          </Link>
        ) : (
          <>
            {/* chưa có tài khoản: chơi thử ngay, đời lưu trên máy; đăng ký sau vẫn mang theo được */}
            <Link href="/tao-nhan-vat" className="btn-main">
              ▶ CHƠI THỬ
            </Link>
            <Link href="/dang-nhap" className="btn-sub px">
              Đăng ký / Đăng nhập
            </Link>
            <p className="mute" style={{ fontSize: 17, textAlign: 'center', marginTop: -6 }}>
              Chơi thử lưu trên máy này. Đăng ký để chơi tiếp ở máy khác.
            </p>
          </>
        )}
        <div className="grid3">
          <button type="button" className="tile px is-soon" disabled>
            Sổ Tình
            <small>sắp có</small>
          </button>
          <button type="button" className="tile px is-soon" disabled>
            Ngã rẽ
            <small>sắp có</small>
          </button>
          <Link href="/choi" className="tile px">
            Chơi tiếp
          </Link>
        </div>
        <div style={{ textAlign: 'center', fontSize: 18 }} className="mute">
          Sổ Tình {meta.endings?.length ?? 0} kết cục · <Link href="/tac-gia">Ghi nguồn hình ảnh</Link>
        </div>
      </div>
    </main>
  );
}
