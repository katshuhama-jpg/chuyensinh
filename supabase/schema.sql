-- Chuyển Sinh, Tôi Trở Thành... - cấu trúc dữ liệu
-- Tài khoản riêng của game: tên đăng nhập + mật khẩu 3-6 ký tự (mã hóa bcrypt).
-- Trình duyệt không đọc/ghi bảng trực tiếp, mọi thao tác đi qua các hàm cs_* bên dưới.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.cs_players (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,16}$'),
  pass_hash text not null,
  meta jsonb not null default '{}'::jsonb,
  failed int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cs_sessions (
  token uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.cs_players (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days'
);
create index if not exists cs_sessions_player_idx on public.cs_sessions (player_id);

create table if not exists public.cs_saves (
  player_id uuid primary key references public.cs_players (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Không có chính sách nào: trình duyệt không đọc bảng trực tiếp được
alter table public.cs_players enable row level security;
alter table public.cs_sessions enable row level security;
alter table public.cs_saves enable row level security;

-- ---------- Hàm nội bộ: đổi token thành người chơi ----------
create or replace function public.cs_player(p_token uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.player_id from public.cs_sessions s where s.token = p_token and s.expires_at > now();
$$;
revoke execute on function public.cs_player(uuid) from public, anon, authenticated;

-- ---------- Đăng ký ----------
create or replace function public.cs_register(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user text := lower(trim(p_username));
  v_id uuid;
  v_token uuid;
begin
  if v_user !~ '^[a-z0-9_]{3,16}$' then
    raise exception 'USERNAME_INVALID';
  end if;
  if char_length(p_password) < 3 or char_length(p_password) > 6 then
    raise exception 'PASSWORD_INVALID';
  end if;
  if exists (select 1 from public.cs_players where username = v_user) then
    raise exception 'USERNAME_TAKEN';
  end if;
  insert into public.cs_players (username, pass_hash)
  values (v_user, extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning id into v_id;
  insert into public.cs_sessions (player_id) values (v_id) returning token into v_token;
  return json_build_object('token', v_token, 'username', v_user, 'meta', '{}'::json);
end;
$$;

-- ---------- Đăng nhập (khóa 5 phút sau 8 lần sai) ----------
create or replace function public.cs_login(p_username text, p_password text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user text := lower(trim(p_username));
  p public.cs_players;
  v_token uuid;
begin
  select * into p from public.cs_players where username = v_user;
  if not found then
    raise exception 'LOGIN_FAILED';
  end if;
  if p.locked_until is not null and p.locked_until > now() then
    raise exception 'LOCKED';
  end if;
  if p.pass_hash <> extensions.crypt(p_password, p.pass_hash) then
    update public.cs_players
      set failed = failed + 1,
          locked_until = case when failed + 1 >= 8 then now() + interval '5 minutes' else null end
      where id = p.id;
    raise exception 'LOGIN_FAILED';
  end if;
  update public.cs_players set failed = 0, locked_until = null where id = p.id;
  insert into public.cs_sessions (player_id) values (p.id) returning token into v_token;
  return json_build_object('token', v_token, 'username', p.username, 'meta', p.meta);
end;
$$;

create or replace function public.cs_logout(p_token uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.cs_sessions set expires_at = now() where token = p_token;
$$;

-- ---------- Hồ sơ + bản lưu ----------
create or replace function public.cs_me(p_token uuid)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.cs_player(p_token);
begin
  if v_id is null then
    return null;
  end if;
  return (
    select json_build_object('username', p.username, 'meta', p.meta, 'state', s.state)
    from public.cs_players p left join public.cs_saves s on s.player_id = p.id
    where p.id = v_id
  );
end;
$$;

create or replace function public.cs_save_meta(p_token uuid, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.cs_player(p_token);
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  update public.cs_players set meta = coalesce(p_meta, '{}'::jsonb) where id = v_id;
end;
$$;

create or replace function public.cs_save_game(p_token uuid, p_state jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.cs_player(p_token);
begin
  if v_id is null then raise exception 'NOT_LOGGED_IN'; end if;
  insert into public.cs_saves (player_id, state, updated_at) values (v_id, coalesce(p_state, 'null'::jsonb), now())
  on conflict (player_id) do update set state = excluded.state, updated_at = now();
end;
$$;

-- Chỉ các hàm công khai mới gọi được từ trình duyệt
revoke execute on all functions in schema public from public;
grant execute on function public.cs_register(text, text) to anon, authenticated;
grant execute on function public.cs_login(text, text) to anon, authenticated;
grant execute on function public.cs_logout(uuid) to anon, authenticated;
grant execute on function public.cs_me(uuid) to anon, authenticated;
grant execute on function public.cs_save_meta(uuid, jsonb) to anon, authenticated;
grant execute on function public.cs_save_game(uuid, jsonb) to anon, authenticated;
revoke execute on function public.cs_player(uuid) from anon, authenticated;
