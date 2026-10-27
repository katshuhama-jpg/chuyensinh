'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';
import { useAuth } from '@/lib/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { enabled } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = mode === 'in' ? await signIn(username, password) : await signUp(username, password);
    if (err) {
      setBusy(false);
      setError(err);
      return;
    }
    const next = new URLSearchParams(window.location.search).get('next');
    router.push(next && next.startsWith('/') ? next : '/chao-doi');
  }

  return (
    <main className="app">
      <div className="head">
        <Link href="/" className="back" aria-label="Quay lại">
          ‹
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ fontSize: 18 }}>
            TÀI KHOẢN
          </div>
          <h1>{mode === 'in' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        </div>
      </div>

      <form className="body form" onSubmit={submit}>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'up'} className={`opt chip ${mode === 'up' ? 'px-on' : 'px-dim'}`} onClick={() => setMode('up')}>
            Tạo tài khoản
          </button>
          <button type="button" role="tab" aria-selected={mode === 'in'} className={`opt chip ${mode === 'in' ? 'px-on' : 'px-dim'}`} onClick={() => setMode('in')}>
            Đăng nhập
          </button>
        </div>

        {!enabled && <p className="err">Chưa kết nối được máy chủ, thử lại sau ít phút.</p>}
        <p className="mute">Cần tài khoản để lưu đời đang sống, đổi máy vẫn chơi tiếp được.</p>

        <label className="field">
          <span>Tên đăng nhập</span>
          <input
            className="px-dim"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={16}
            placeholder="vd: minhanh89"
            required
          />
          <small className="mute">3-16 ký tự: chữ thường không dấu, số, dấu _</small>
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            className="px-dim"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            maxLength={6}
            required
          />
          <small className="mute">3-6 ký tự</small>
        </label>

        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-main" disabled={busy || !enabled} style={{ marginTop: 12 }}>
          {busy ? 'ĐANG VÀO...' : mode === 'in' ? 'VÀO GAME' : 'TẠO VÀ VÀO GAME'}
        </button>
      </form>
    </main>
  );
}
