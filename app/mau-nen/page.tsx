'use client';

/** Trang mẫu: nền nhìn từ trên xuống ghép từ LPC Revised, LPC Tile Atlas, LPC Streets (chưa nối vào game) */

import { useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import TileStage, { type Season, type Time } from '@/components/TileStage';
import { CAST } from '@/lib/cast';
import { lpcLayers } from '@/lib/look';

type S = { id: string; name: string; time?: Time; season?: Season; feet?: number; pair?: [number, number]; lights?: [number, number, number][] };

const SCENES: S[] = [
  { id: 'phong', name: 'Phòng ngủ', time: 'night', lights: [[35, 22, 22], [145, 50, 18]] },
  { id: 'nha', name: 'Phòng khách' },
  { id: 'lop', name: 'Lớp học' },
  { id: 'net', name: 'Quán net', time: 'night', lights: [[28, 52, 14], [172, 52, 14], [28, 98, 14], [172, 98, 14], [126, 26, 20]] },
  { id: 'quan', name: 'Quán cà phê', time: 'dusk' },
  { id: 'vanphong', name: 'Văn phòng' },
  { id: 'pho', name: 'Phố', time: 'night', feet: 114, lights: [[52, 46, 26], [162, 46, 26]] },
  { id: 'que', name: 'Nhà ở quê', pair: [96, 150] },
  { id: 'congvien_spring', name: 'Công viên - xuân', season: 'xuan' },
  { id: 'congvien_summer', name: 'Công viên - hạ', season: 'he' },
  { id: 'congvien_autumn', name: 'Công viên - thu', season: 'thu', time: 'dusk' },
  { id: 'congvien_winter', name: 'Công viên - đông', season: 'dong' },
];

function Actor({ layers, x, feet, dir, name }: { layers: ReturnType<typeof lpcLayers>; x: number; feet: number; dir: number; name: string }) {
  // x: tâm chân, feet: hàng chân đứng (px gốc 200x144)
  return (
    <figure className="ts-actor" style={{ left: x * 2 - 64, top: feet * 2 - 124 }}>
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
          <div className="eyebrow">MẪU NỀN · LPC</div>
          <h1>Ghép thử bối cảnh</h1>
        </div>
      </div>
      <div className="body" style={{ gap: 20 }}>
        <p className="mute">Đồ đạc, nhà cửa: LPC Revised. Cây, đất, mùa: LPC Revised Terrain. Đường: LPC Streets. Giờ trong ngày, đèn, mùa rơi: vẽ thêm.</p>
        {SCENES.map((s) => {
          const t = time[s.id] ?? s.time ?? 'day';
          const [x1, x2] = s.pair ?? [72, 124];
          const feet = s.feet ?? 132;
          return (
            <section key={s.id} className="group">
              <div className="label">{s.name}</div>
              <div className="stage-ts px">
                <TileStage src={`/bg/${s.id}.png`} time={t} season={s.season} lights={s.lights}>
                  <Actor layers={a} x={x1} feet={feet} dir={3} name="Ngọc" />
                  <Actor layers={b} x={x2} feet={feet} dir={1} name="Long" />
                </TileStage>
              </div>
              <div className="ts-times">
                {(['day', 'dusk', 'night'] as Time[]).map((v) => (
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
