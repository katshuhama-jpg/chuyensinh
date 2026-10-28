'use client';

import { currentPlayer, dropSession } from './auth';
import type { Character, Family } from './character';
import type { Story } from './story';
import { supabase } from './supabase';

export interface Meta {
  /** số đời đã sống xong */
  lives?: number;
  /** các kết cục đã mở, ghi trong Sổ Tình */
  endings?: string[];
}

export interface SaveState {
  char: Character;
  family: Family;
  story: Story;
  startedAt: number;
}

/* ---------- chơi thử không cần tài khoản: lưu trong trình duyệt ---------- */
const GUEST = 'dt.guest';
type GuestData = { meta: Meta; state: SaveState | null };
function readGuest(): GuestData {
  try {
    const raw = localStorage.getItem(GUEST);
    if (raw) return JSON.parse(raw) as GuestData;
  } catch {
    /* bỏ qua */
  }
  return { meta: {}, state: null };
}
function writeGuest(d: GuestData) {
  try {
    localStorage.setItem(GUEST, JSON.stringify(d));
  } catch {
    /* bỏ qua */
  }
}

/** Sau khi đăng ký hoặc đăng nhập: chuyển đời đang chơi thử và Sổ Tình vào tài khoản */
export async function migrateGuest() {
  const g = readGuest();
  if (!g.state && !g.meta.endings?.length) return;
  const me = await loadMe();
  if (!me || me.guest) return;
  if (g.state && !me.state?.story) await saveGame(g.state);
  const endings = Array.from(new Set([...(me.meta.endings ?? []), ...(g.meta.endings ?? [])]));
  await saveMeta({ ...me.meta, endings, lives: (me.meta.lives ?? 0) + (g.meta.lives ?? 0) });
  try {
    localStorage.removeItem(GUEST);
  } catch {
    /* bỏ qua */
  }
}

export async function loadMe(): Promise<{ username: string; meta: Meta; state: SaveState | null; guest?: boolean } | null> {
  const p = currentPlayer();
  const sb = supabase();
  if (!p || !sb) {
    const g = readGuest();
    return { username: 'Khách', meta: g.meta, state: g.state, guest: true };
  }
  const { data, error } = await sb.rpc('cs_me', { p_token: p.token });
  if (error) return null;
  if (!data) {
    // phiên hết hạn
    dropSession();
    return null;
  }
  const d = data as { username: string; meta: Meta | null; state: SaveState | null };
  return { username: d.username, meta: d.meta ?? {}, state: d.state };
}

export async function saveGame(state: SaveState | null): Promise<boolean> {
  const p = currentPlayer();
  const sb = supabase();
  if (!p || !sb) {
    writeGuest({ ...readGuest(), state });
    return true;
  }
  const { error } = await sb.rpc('cs_save_game', { p_token: p.token, p_state: state });
  return !error;
}

export async function saveMeta(meta: Meta): Promise<boolean> {
  const p = currentPlayer();
  const sb = supabase();
  if (!p || !sb) {
    writeGuest({ ...readGuest(), meta });
    return true;
  }
  const { error } = await sb.rpc('cs_save_meta', { p_token: p.token, p_meta: meta });
  return !error;
}
