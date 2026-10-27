'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import { lpcLayers } from '@/lib/look';
import { loadMe, type SaveState } from '@/lib/save';
import { useAuth } from '@/lib/useAuth';

/** Màn chơi chính: tạm thời chỉ hiện đời đang sống. Vòng năm, trọng tâm, biến cố sẽ làm ở bước sau. */
export default function Choi() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<SaveState | null | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/dang-nhap?next=/choi');
      return;
    }
    loadMe().then((m) => setState(m?.state ?? null));
  }, [ready, user, router]);

  const layers = useMemo(() => (state ? lpcLayers(state.char.look, state.char.gender, 'child') : []), [state]);

  return (
    <main className="app dither">
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            ĐỜI ĐANG SỐNG
          </div>
          <h1>{state ? state.char.name : 'Chưa có đời nào'}</h1>
        </div>
      </div>
      <div className="body">
        {state === undefined && <p className="mute">Đang tải...</p>}
        {state === null && (
          <div className="prose">
            <p>Bạn chưa bắt đầu đời nào.</p>
            <Link href="/chao-doi" className="btn-main">
              ▶ CHÀO ĐỜI
            </Link>
          </div>
        )}
        {state && (
          <>
            <div className="scene px">
              <span className="stars" aria-hidden="true" />
              <div className="scene-cap">
                {state.char.born.y} · {state.char.city}, {state.char.countryName}
              </div>
              <Sprite layers={layers} scale={2} anim="walk" dir={2} label={`${state.char.name} lúc nhỏ`} />
              <span className="ground" aria-hidden="true" />
            </div>
            <div className="ahead px-dim">
              <div className="eyebrow" style={{ fontSize: 18 }}>
                MÀN CHƠI ĐANG ĐƯỢC LÀM
              </div>
              <p style={{ fontSize: 20 }}>Hồ sơ đã lưu vào tài khoản. Vòng năm, chọn trọng tâm và thẻ biến cố sẽ có ở bản tới.</p>
            </div>
            <Link href="/chao-doi" className="btn-sub px">
              Chào đời lại
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
