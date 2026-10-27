'use client';

import { currentPlayer, dropSession } from './auth';
import type { Profile } from './game/roll';
import { supabase } from './supabase';

export interface Meta {
  /** số đời đã sống xong */
  lives?: number;
  duyen?: number;
  endings?: string[];
}

export interface SaveState {
  char: Profile;
  age: number;
  startedAt: number;
}

const PENDING = 'cs.pending';

/** Hồ sơ vừa gieo nhưng chưa đăng nhập: giữ trên máy, đăng nhập xong thì lưu lên tài khoản */
export function keepPending(p: Profile) {
  try {
    localStorage.setItem(PENDING, JSON.stringify(p));
  } catch {
    /* bỏ qua */
  }
}

export function takePending(): Profile | null {
  try {
    const raw = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export async function loadMe(): Promise<{ username: string; meta: Meta; state: SaveState | null } | null> {
  const p = currentPlayer();
  const sb = supabase();
  if (!p || !sb) return null;
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
  if (!p || !sb) return false;
  const { error } = await sb.rpc('cs_save_game', { p_token: p.token, p_state: state });
  return !error;
}
