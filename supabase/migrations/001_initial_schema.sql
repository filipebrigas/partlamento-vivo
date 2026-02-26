-- =============================================================
-- Parlamento Vivo — Initial Database Schema
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- POLITICIANS TABLE
-- =============================================================
create table if not exists politicians (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  party         text not null,
  photo_url     text,
  parlamento_url text,
  created_at    timestamptz not null default now()
);

comment on table politicians is 'Portuguese parliament deputies (deputados) — 230 total';
comment on column politicians.party is 'Party abbreviation: PS, PSD, CH, IL, BE, PCP, PAN, L, CDS-PP, JPP';

-- Index for party filtering
create index if not exists idx_politicians_party on politicians(party);

-- =============================================================
-- SESSIONS TABLE
-- =============================================================
create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null unique,
  artv_stream_url text,
  start_time      timestamptz not null,
  end_time        timestamptz,
  status          text not null default 'scheduled'
                  check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  created_at      timestamptz not null default now()
);

comment on table sessions is 'Parliament plenary sessions monitored by the AI worker';

create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_sessions_status on sessions(status);

-- =============================================================
-- DETECTIONS TABLE
-- =============================================================
create table if not exists detections (
  id                uuid primary key default uuid_generate_v4(),
  politician_id     uuid not null references politicians(id) on delete cascade,
  timestamp         timestamptz not null,
  confidence_score  numeric(4,3) not null check (confidence_score between 0 and 1),
  video_clip_url    text,
  screenshot_url    text,
  tweeted           boolean not null default false,
  tweet_url         text,
  session_date      date not null,
  created_at        timestamptz not null default now()
);

comment on table detections is 'Phone-usage detection events logged by the AI worker';
comment on column detections.confidence_score is 'YOLOv8 confidence score 0.0–1.0';

create index if not exists idx_detections_politician on detections(politician_id);
create index if not exists idx_detections_session_date on detections(session_date);
create index if not exists idx_detections_tweeted on detections(tweeted);
create index if not exists idx_detections_timestamp on detections(timestamp desc);

-- =============================================================
-- CONVENIENCE VIEW — detections with politician info
-- =============================================================
create or replace view detections_with_politicians as
  select
    d.*,
    p.name        as politician_name,
    p.party       as politician_party,
    p.photo_url   as politician_photo_url,
    p.parlamento_url as politician_parlamento_url
  from detections d
  join politicians p on p.id = d.politician_id;

-- =============================================================
-- CONVENIENCE VIEW — leaderboard
-- =============================================================
create or replace view politician_leaderboard as
  select
    p.*,
    count(d.id)::int as times_caught,
    max(d.timestamp) as last_caught_at
  from politicians p
  left join detections d on d.politician_id = p.id
  group by p.id
  order by times_caught desc;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table politicians enable row level security;
alter table sessions enable row level security;
alter table detections enable row level security;

-- Public read access
create policy "Anyone can read politicians"
  on politicians for select using (true);

create policy "Anyone can read sessions"
  on sessions for select using (true);

create policy "Anyone can read detections"
  on detections for select using (true);

-- Service role can do anything (used by Edge Functions)
create policy "Service role full access to politicians"
  on politicians for all using (auth.role() = 'service_role');

create policy "Service role full access to sessions"
  on sessions for all using (auth.role() = 'service_role');

create policy "Service role full access to detections"
  on detections for all using (auth.role() = 'service_role');
