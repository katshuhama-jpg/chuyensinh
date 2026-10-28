'use client';

/** Trang mẫu: thử sân khấu nhìn từ trên xuống bằng LPC Tile Atlas (chưa nối vào game) */

import { useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import TileStage, { type Op, type Season, type Time } from '@/components/TileStage';
import { CAST } from '@/lib/cast';
import { lpcLayers } from '@/lib/look';

const GRASS: [ 't', number, number][] = [['t', 22, 3], ['t', 22, 5], ['t', 21, 5], ['t', 23, 5]];
const DIRT: ['t', number, number][] = [['t', 9, 21], ['t', 10, 22], ['t', 10, 21], ['t', 9, 22]];
const COBBLE: ['t', number, number][] = [['t', 16, 26], ['t', 17, 27], ['t', 18, 26], ['t', 17, 26]];

/** Công viên: cỏ, hoa, hồ sen, thông, bụi cây */
const congvien: Op[] = [
  { sky: true, h: 40 },
  { hills: true, y: 34 },
  { fill: GRASS, x: 0, y: 36, w: 200, h: 108 },
  { a: 't', c: 24, r: 16, w: 3, h: 4, x: -30, y: -22 },
  { a: 't', c: 27, r: 16, w: 3, h: 4, x: 30, y: -30 },
  { a: 't', c: 21, r: 11, w: 3, x: 0, y: 76 },
  { a: 't', c: 21, r: 11, w: 3, x: 96, y: 104 },
  { a: 't', c: 6, r: 11, w: 3, h: 3, x: 118, y: 34 },
  { a: 't', c: 6, r: 30, w: 3, h: 2, x: 118, y: 50 },
  { a: 't', c: 27, r: 26, w: 2, h: 2, x: 92, y: 40 },
  { a: 't', c: 23, r: 18, x: 66, y: 60 },
];
const congvienFront: Op[] = [{ a: 't', c: 24, r: 12, w: 3, h: 3, x: -46, y: 84 }];

/** Nhà ở quê ngày Tết: tường gạch, cửa gỗ, câu đối, cành đào, vườn rau sau hàng rào */
const que: Op[] = [
  { sky: true, h: 36 },
  { hills: true, y: 30 },
  { fill: DIRT, x: 0, y: 32, w: 200, h: 112 },
  { a: 'b', c: 0, r: 9, w: 3, h: 3, x: -8, y: 4 },
  { a: 'b', c: 3, r: 9, h: 2, x: 32, y: 36 },
  { a: 'b', c: 8, r: 9, h: 2, x: 2, y: 30 },
  // câu đối đỏ hai bên cửa
  { px: [[25, 38, 5, 26, '#c4302a'], [26, 42, 3, 2, '#ffd24a'], [26, 50, 3, 2, '#ffd24a'], [26, 58, 3, 2, '#ffd24a'], [66, 38, 5, 26, '#c4302a'], [67, 42, 3, 2, '#ffd24a'], [67, 50, 3, 2, '#ffd24a'], [67, 58, 3, 2, '#ffd24a']] },
  // cành đào trong chậu
  { px: [[176, 96, 14, 12, '#a33a28'], [175, 96, 16, 2, '#c4573a'], [182, 70, 2, 26, '#5a3a24'], [178, 78, 4, 2, '#5a3a24'], [184, 74, 5, 2, '#5a3a24'], [176, 74, 4, 4, '#f39ac0'], [186, 70, 4, 4, '#f6b8d0'], [180, 66, 4, 4, '#f39ac0'], [190, 78, 4, 4, '#f39ac0'], [174, 82, 4, 4, '#f6b8d0'], [184, 62, 3, 3, '#f6b8d0']] },
  { a: 't', c: 15, r: 27, h: 2, x: 112, y: 14 },
  { a: 't', c: 15, r: 27, h: 2, x: 134, y: 14 },
  { a: 't', c: 13, r: 27, x: 156, y: 30 },
  { a: 't', c: 11, r: 27, x: 178, y: 30 },
  { a: 't', c: 19, r: 19, w: 3, h: 2, x: 104, y: 30 },
  { a: 'b', c: 15, r: 14, h: 2, x: 84, y: 54 },
];

/** Phố cổ buổi tối: dãy nhà gạch, vỉa hè lát đá, cột đèn, xe máy, biển quán (đồ hiện đại tự vẽ) */
const pho: Op[] = [
  { a: 'b', c: 0, r: 9, w: 3, h: 3, x: -40, y: -12 },
  { a: 'b', c: 0, r: 9, w: 3, h: 3, x: 56, y: -12 },
  { a: 'b', c: 0, r: 9, w: 3, h: 3, x: 152, y: -12 },
  { a: 'b', c: 8, r: 9, h: 2, x: 16, y: 6 },
  { a: 'b', c: 5, r: 9, h: 2, x: 108, y: 20 },
  { a: 'b', c: 8, r: 9, h: 2, x: 72, y: 6 },
  { a: 'b', c: 8, r: 9, h: 2, x: 168, y: 6 },
  { fill: COBBLE, x: 0, y: 84, w: 200, h: 60 },
  { px: [[0, 84, 200, 2, '#3a3448'], [0, 136, 200, 8, '#2a2838'], [0, 135, 200, 1, '#6a6478']] },
  // biển quán phở
  { px: [[60, 0, 46, 12, '#c4302a'], [60, 0, 46, 1, '#e8584a'], [60, 11, 46, 1, '#7a1e1a'], [64, 3, 3, 6, '#ffd24a'], [67, 3, 3, 2, '#ffd24a'], [67, 6, 3, 1, '#ffd24a'], [69, 3, 1, 4, '#ffd24a'], [72, 3, 2, 6, '#ffd24a'], [76, 3, 2, 6, '#ffd24a'], [74, 5, 2, 2, '#ffd24a'], [80, 3, 6, 6, '#ffd24a'], [82, 5, 2, 2, '#c4302a']] },
  // cột đèn
  { px: [[150, 40, 3, 92, '#30343f'], [151, 40, 1, 92, '#4a4e5a'], [144, 34, 15, 6, '#30343f'], [146, 36, 11, 3, '#ffe9a0'], [147, 130, 9, 4, '#30343f']] },
  // xe máy (nhìn ngang, nét tối viền)
  { px: [[10, 112, 34, 2, '#211833'], [12, 104, 26, 9, '#c4302a'], [14, 105, 10, 3, '#e8584a'], [26, 100, 10, 5, '#211833'], [36, 98, 3, 9, '#5a5a6a'], [34, 96, 7, 2, '#211833'], [10, 113, 12, 12, '#211833'], [13, 116, 6, 6, '#8a8a9a'], [32, 113, 12, 12, '#211833'], [35, 116, 6, 6, '#8a8a9a'], [40, 102, 3, 3, '#ffe9a0']] },
];

const SCENES: { id: string; name: string; ops: Op[]; front?: Op[]; times: Time[]; season?: Season; lights?: [number, number, number][]; pair: [number, number] }[] = [
  { id: 'cv', name: 'Công viên', ops: congvien, front: congvienFront, times: ['day', 'dusk', 'night'], season: 'thu', pair: [54, 104] },
  { id: 'que', name: 'Nhà ở quê, ngày Tết', ops: que, times: ['day', 'dusk', 'night'], season: 'tet', lights: [[48, 60, 18]], pair: [96, 140] },
  { id: 'pho', name: 'Phố cổ buổi tối', ops: pho, times: ['night', 'dusk', 'day'], lights: [[151, 40, 26], [24, 22, 14], [80, 22, 14], [176, 22, 14], [41, 103, 10]], pair: [66, 112] },
];

function Actor({ layers, x, dir, name }: { layers: ReturnType<typeof lpcLayers>; x: number; dir: number; name: string }) {
  // x: tâm chân theo px gốc; chân đứng ở hàng 126, tên nằm ngay dưới chân
  return (
    <figure className="ts-actor" style={{ left: x * 2 - 64, top: 126 * 2 - 124 }}>
      <i className="ts-shadow" />
      <Sprite layers={layers} scale={2} anim="idle" dir={dir} label={name} />
      <figcaption>{name}</figcaption>
    </figure>
  );
}

export default function MauNen() {
  const [time, setTime] = useState<Record<string, Time>>({});
  const a = useMemo(() => lpcLayers(CAST.minh.f, 'f', 'adult'), []);
  const b = useMemo(() => lpcLayers(CAST.long.m, 'm', 'adult'), []);
  return (
    <main className="app dither">
      <div className="head">
        <div>
          <div className="eyebrow">MẪU NỀN</div>
          <h1>Nhìn từ trên xuống</h1>
        </div>
      </div>
      <div className="body" style={{ gap: 20 }}>
        <p className="mute">Cây, đá, nước, tường, cửa, rau: LPC Tile Atlas. Trời, núi, giờ, mùa, đồ hiện đại: vẽ thêm.</p>
        {SCENES.map((s) => {
          const t = time[s.id] ?? s.times[0];
          return (
            <section key={s.id} className="group">
              <div className="label">{s.name}</div>
              <div className="stage-ts px">
                <TileStage ops={s.ops} front={s.front} time={t} season={s.season} lights={s.lights}>
                  <Actor layers={a} x={s.pair[0]} dir={3} name="Ngọc" />
                  <Actor layers={b} x={s.pair[1]} dir={1} name="Long" />
                </TileStage>
              </div>
              <div className="ts-times">
                {s.times.map((v) => (
                  <button key={v} type="button" className={`opt chip px ${v === t ? 'on' : ''}`} onClick={() => setTime({ ...time, [s.id]: v })}>
                    {v === 'day' ? 'Ngày' : v === 'dusk' ? 'Chiều' : 'Đêm'}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
