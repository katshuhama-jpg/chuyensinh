'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Sprite from '@/components/Sprite';
import { rollProfile, cohortOf, type Profile } from '@/lib/game/roll';
import { STAT_NAMES } from '@/lib/game/world';
import { lpcLayers } from '@/lib/look';
import { saveGame } from '@/lib/save';
import { useAuth } from '@/lib/useAuth';

const GENDER_NAME = { f: 'Nữ', m: 'Nam', nb: 'Phi nhị nguyên' };
const pad = (n: number) => String(n).padStart(2, '0');

/** Mọi thứ đều do số phận: thời, nước, giới tính, gia cảnh... rút ngẫu nhiên như VKL */
const roll = () => rollProfile({ world: 'any', draw: 'novel', gender: 'rand' });

export default function ChaoDoi() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rolls, setRolls] = useState(0);
  const [busy, setBusy] = useState(false);

  // phải đăng nhập trước mới vào luân hồi
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/dang-nhap?next=/chao-doi');
    else if (!profile) {
      setProfile(roll());
      setRolls(1);
    }
  }, [ready, user, profile, router]);

  function reroll() {
    setProfile(roll());
    setRolls((n) => n + 1);
    window.scrollTo(0, 0);
  }

  async function start() {
    if (!profile) return;
    setBusy(true);
    await saveGame({ char: profile, age: 0, startedAt: Date.now() });
    router.push('/choi');
  }

  if (!profile) return <main className="app" />;
  return <ProfileView key={rolls} p={profile} rolls={rolls} onRoll={reroll} onStart={start} busy={busy} />;
}

function ProfileView({ p, rolls, onRoll, onStart, busy }: { p: Profile; rolls: number; onRoll: () => void; onStart: () => void; busy: boolean }) {
  const layers = useMemo(() => lpcLayers(p.look, p.gender, 'child'), [p]);
  const co = cohortOf(p);
  const era = p.world === 'past' ? 'Quá khứ' : p.world === 'now' ? 'Hôm nay' : 'Tương lai';
  return (
    <main className={`app ${rolls > 1 ? 'rolling' : ''}`}>
      <div className="head">
        <Link href="/" className="back" aria-label="Về trang đầu">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            THẾ GIỚI: {era.toUpperCase()}
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
                {/* bỏ ký hiệu cung: điện thoại tự đổi thành emoji, lạc kiểu pixel */}
                Cung {p.zodiac.name} · {p.zodiac.el}
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
            Gieo lại
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
