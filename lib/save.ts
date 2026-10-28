'use client';

import { currentPlayer, dropSession } from './auth';
import type { Character, Family } from './character';
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
  age: number;
  startedAt: number;
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
