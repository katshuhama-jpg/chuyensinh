'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import { lpcLayers } from '@/lib/look';
import { loadMe, type SaveState } from '@/lib/save';
import { useAuth } from '@/lib/useAuth';

/** Màn chơi chính: tạm thời chỉ hiện nhân vật vừa tạo. Cốt truyện nhiều nhánh làm ở bước sau. */
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
    // bản lưu cũ của Chuyển Sinh không có gia cảnh: coi như chưa có đời nào
    loadMe().then((m) => setState(m?.state?.family ? m.state : null));
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
          <h1>{state ? state.char.name : 'Chưa có nhân vật'}</h1>
        </div>
      </div>
      <div className="body">
        {state === undefined && <p className="mute">Đang tải...</p>}
        {state === null && (
          <div className="prose">
            <p>Bạn chưa tạo nhân vật nào.</p>
            <Link href="/tao-nhan-vat" className="btn-main">
              ▶ TẠO NHÂN VẬT
            </Link>
          </div>
        )}
        {state && (
          <>
            <div className="scene px">
              <span className="stars" aria-hidden="true" />
              <div className="scene-cap">
                {state.char.birthYear} · {state.family.province}
              </div>
              <Sprite layers={layers} scale={2} anim="walk" dir={2} label={`${state.char.name} lúc nhỏ`} />
              <span className="ground" aria-hidden="true" />
            </div>
            <div className="ahead px-dim">
              <div className="eyebrow" style={{ fontSize: 18 }}>
                CỐT TRUYỆN ĐANG ĐƯỢC VIẾT
              </div>
              <p style={{ fontSize: 20 }}>Nhân vật đã lưu vào tài khoản. Tuổi thơ, các mối tình và những ngã rẽ sẽ có ở bản tới.</p>
            </div>
            <Link href="/tao-nhan-vat" className="btn-sub px">
              Tạo nhân vật khác
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
