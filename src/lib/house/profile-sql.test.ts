import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// Migration 0013 on PGlite, on profiles as the earlier migrations leave it: it must extend the
// existing profiles table (key "id", from 0001), run twice without error, and
// enforce its checks.

const dir = new URL("../../../supabase/migrations/", import.meta.url);
const db = new PGlite();
const U = "22222222-2222-2222-2222-222222222222";

before(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    -- profiles as 0001, 0002, 0004 and 0005 leave it (0001 needs pgcrypto,
    -- which PGlite lacks, so its shape is restated here).
    create table public.profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      email text not null, full_name text, organization text, profession text,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      constraint profiles_email_len_chk check (char_length(email) <= 320)
    );
    alter table public.profiles enable row level security;
    create policy "profiles_self_read" on public.profiles for select using ((select auth.uid()) = id);
    create policy "profiles_self_update" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  `);
  for (const f of ["0007_report_orders.sql", "0013_buyer_profile_and_progress.sql"]) {
    await db.exec(readFileSync(new URL(f, dir), "utf8"));
  }
  await db.exec(`insert into auth.users values ('${U}', 'a@b.co', '{}')`);
  await db.exec(`insert into public.profiles (id, email) values ('${U}', 'a@b.co')`);
});
test("0013 runs again without error", async () => {
  await db.exec(readFileSync(new URL("0013_buyer_profile_and_progress.sql", dir), "utf8"));
});

test("signup row gets the buyer defaults and accepts an upsert on id", async () => {
  const r = await db.query<{ units: string; alert_watching: string }>("select units, alert_watching from public.profiles where id = $1", [U]);
  assert.deepEqual(r.rows[0], { units: "us", alert_watching: "email" });
  await db.query(
    "insert into public.profiles (id, email, display_name, stage) values ($1, 'a@b.co', 'Jordan', 'under_contract') on conflict (id) do update set display_name = excluded.display_name, stage = excluded.stage",
    [U],
  );
  const s = await db.query<{ display_name: string }>("select display_name from public.profiles where id = $1", [U]);
  assert.equal(s.rows[0].display_name, "Jordan");
});

test("checks refuse bad values", async () => {
  await assert.rejects(db.query("update public.profiles set units = 'cubits' where id = $1", [U]));
  await assert.rejects(db.query("update public.profiles set phone = 'call me' where id = $1", [U]));
});
