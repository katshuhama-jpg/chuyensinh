'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import { rollProfile, cohortOf, type Profile, type Setup } from '@/lib/game/roll';
import { STAT_NAMES, type DrawMode, type GenderPick, type WorldMode } from '@/lib/game/world';
import { lpcLayers } from '@/lib/look';
import { keepPending, saveGame } from '@/lib/save';
import { useAuth } from '@/lib/useAuth';

const WORLDS: { id: WorldMode; label: string; sub: string }[] = [
  { id: 'past', label: 'Quá khứ', sub: '1950 - 2025, lịch sử thật' },
  { id: 'now', label: 'Hôm nay', sub: 'Số liệu năm nay' },
  { id: 'future', label: 'Tương lai', sub: 'Theo dự báo LHQ' },
  { id: 'any', label: 'Bất kỳ', sub: 'Để số phận chọn' },
];
const DRAWS: { id: DrawMode; label: string; sub: string }[] = [
  { id: 'novel', label: 'Đời tiểu thuyết', sub: 'Nhiều drama' },
  { id: 'births', label: 'Theo trẻ sinh ra', sub: 'Như đời thật' },
  { id: 'pop', label: 'Theo dân số', sub: 'Theo số dân' },
];
const GENDERS: { id: GenderPick; label: string }[] = [
  { id: 'rand', label: 'Ngẫu nhiên' },
  { id: 'f', label: 'Nữ' },
  { id: 'm', label: 'Nam' },
  { id: 'nb', label: 'Phi nhị nguyên' },
];
const GENDER_NAME = { f: 'Nữ', m: 'Nam', nb: 'Phi nhị nguyên' };

const pad = (n: number) => String(n).padStart(2, '0');

export default function ChaoDoi() {
  const router = useRouter();
  const { user } = useAuth();
  const [setup, setSetup] = useState<Setup>({ world: 'past', draw: 'novel', gender: 'rand' });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rolls, setRolls] = useState(0);
  const [busy, setBusy] = useState(false);

  function roll() {
    setProfile(rollProfile(setup));
    setRolls((n) => n + 1);
    window.scrollTo(0, 0);
  }

  async function start() {
    if (!profile) return;
    setBusy(true);
    if (user) {
      await saveGame({ char: profile, age: 0, startedAt: Date.now() });
      router.push('/choi');
    } else {
      keepPending(profile);
      router.push('/dang-nhap?next=/choi');
    }
  }

  if (!profile) {
    return (
      <main className="app">
        <div className="head">
          <Link href="/" className="back" aria-label="Quay lại">
            ‹
          </Link>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ fontSize: 18 }}>
              BƯỚC 1/2
            </div>
            <h1>Chuẩn bị chào đời</h1>
          </div>
        </div>

        <div className="body">
          <div className="group">
            <div className="label">Thế giới bạn sinh ra</div>
            <div className="grid2">
              {WORLDS.map((w) => (
                <button key={w.id} type="button" className={`opt ${setup.world === w.id ? 'px-on' : 'px-dim'}`} aria-pressed={setup.world === w.id} onClick={() => setSetup({ ...setup, world: w.id })} style={{ minHeight: 64 }}>
                  <b>{w.label}</b>
                  <span>{w.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="group">
            <div className="label">Cách rút nơi sinh</div>
            {DRAWS.map((d) => (
              <button key={d.id} type="button" className={`opt row ${setup.draw === d.id ? 'px-on' : 'px-dim'}`} aria-pressed={setup.draw === d.id} onClick={() => setSetup({ ...setup, draw: d.id })}>
                <b style={{ fontSize: 22 }}>{d.label}</b>
                <span>{d.sub}</span>
              </button>
            ))}
          </div>

          <div className="group">
            <div className="label">Giới tính</div>
            <div className="chips">
              {GENDERS.map((g) => (
                <button key={g.id} type="button" className={`opt chip ${setup.gender === g.id ? 'px-on' : 'px-dim'}`} aria-pressed={setup.gender === g.id} onClick={() => setSetup({ ...setup, gender: g.id })}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="boost px-dim">
            <div>
              <div style={{ fontSize: 22 }}>Lợi thế khởi đầu</div>
              <div className="mute" style={{ fontSize: 17 }}>
                Tiêu Duyên để mua trước khi chào đời
              </div>
            </div>
            <div className="mute">sắp có</div>
          </div>
        </div>

        <div className="foot">
          <div className="mute" style={{ fontSize: 18, textAlign: 'center' }}>
            Bản đầu có 6 nước: Việt Nam, Hàn Quốc, Nhật Bản, Mỹ, Pháp, Brazil
          </div>
          <button type="button" className="btn-main" onClick={roll}>
            GIEO HỒ SƠ ›
          </button>
        </div>
      </main>
    );
  }

  return <ProfileView key={rolls} p={profile} rolls={rolls} onBack={() => setProfile(null)} onRoll={roll} onStart={start} busy={busy} />;
}

function ProfileView({ p, rolls, onBack, onRoll, onStart, busy }: { p: Profile; rolls: number; onBack: () => void; onRoll: () => void; onStart: () => void; busy: boolean }) {
  const layers = useMemo(() => lpcLayers(p.look, p.gender, 'child'), [p]);
  const co = cohortOf(p);
  return (
    <main className={`app ${rolls > 1 ? 'rolling' : ''}`}>
      <div className="head">
        <button type="button" className="back" aria-label="Quay lại" onClick={onBack}>
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            BƯỚC 2/2
          </div>
          <h1>Hồ sơ chào đời</h1>
        </div>
      </div>

      <div className="body" style={{ paddingTop: 12 }}>
        <div className="card px">
          <div className="who">
            <Sprite layers={layers} scale={2} anim="walk" dir={2} label={`${p.name} lúc nhỏ`} />
            <div className="facts">
              <span>
                {GENDER_NAME[p.gender]} · {pad(p.born.d)}/{pad(p.born.m)}/{p.born.y}
              </span>
              <span>
                {p.city}, {p.countryName}
              </span>
              <span className="zodiac">
                {p.zodiac.sym}
                {'︎'} {p.zodiac.name} · {p.zodiac.el}
              </span>
            </div>
          </div>
          <div className="name">{p.name}</div>
          <div className="dash" aria-hidden="true" />
          <dl className="kv" style={{ margin: 0 }}>
            <div>
              <dt>Gia cảnh</dt>
              <dd>{p.family.name}</dd>
            </div>
            <div>
              <dt>Nếp nhà</dt>
              <dd>{p.home}</dd>
            </div>
            <div>
              <dt>Tố chất</dt>
              <dd>
                {p.talent.name} ×{p.talent.mul}
              </dd>
            </div>
            <div>
              <dt>Thẻ tính cách</dt>
              <dd className={p.card.rarity === 'Thường' ? '' : 'rare'}>
                [{p.card.rarity}] {p.card.name}
              </dd>
            </div>
          </dl>
        </div>

        <div className="stats">
          {STAT_NAMES.map((s) => {
            const v = p.stats[s];
            const n = Math.round(v / 10);
            const cls = s === 'Nhan sắc' ? 'looks' : s === 'Áp lực' ? 'stress' : '';
            return (
              <div className="stat" key={s}>
                <span>{s}</span>
                <span className="cells" role="meter" aria-label={s} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} className={i < n ? `on ${cls}` : ''} />
                  ))}
                </span>
                <span>{v}</span>
              </div>
            );
          })}
        </div>

        <div className="ahead px-dim">
          <div className="eyebrow" style={{ fontSize: 18 }}>
            {p.world === 'now' ? 'THẾ GIỚI HÔM NAY' : 'ĐỜI NÀY SẼ ĐI QUA'}
          </div>
          {p.ahead.length ? (
            <ul>
              {p.ahead.map((m) => (
                <li key={m.year + m.text}>
                  <b>{m.year}</b>
                  {m.text}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 19 }}>Số liệu năm {p.born.y} giữ nguyên đến cuối đời.</p>
          )}
          <div className="mute" style={{ fontSize: 18 }}>
            Khóa {co.from}-{co.to}, {p.countryName}
          </div>
        </div>
      </div>

      <div className="foot">
        <div className="row">
          <button type="button" className="btn-sub px" onClick={onRoll}>
            Rút lại
            <br />
            miễn phí
          </button>
          <button type="button" className="btn-main" onClick={onStart} disabled={busy}>
            {busy ? 'ĐANG LƯU...' : 'BẮT ĐẦU ĐỜI NÀY'}
          </button>
        </div>
      </div>
    </main>
  );
}
