-- =============================================================
-- Parlamento Vivo — Speech Intelligence Schema (v2)
-- =============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for text search on transcripts

-- =============================================================
-- POLITICIANS TABLE
-- =============================================================
create table if not exists politicians (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  party           text not null,
  photo_url       text,
  parlamento_url  text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_politicians_party on politicians(party);

-- =============================================================
-- SESSIONS TABLE
-- Updated: tracks live plenário sessions from canal.parlamento.pt
-- =============================================================
create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  date            date not null,
  stream_url      text not null default 'https://canal.parlamento.pt/plenario',
  title           text,                -- e.g. "Sessão Plenária nº 45"
  start_time      timestamptz not null,
  end_time        timestamptz,
  status          text not null default 'scheduled'
                  check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  total_words     integer default 0,
  total_filler_words integer default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sessions_date on sessions(date desc);
create index if not exists idx_sessions_status on sessions(status);

-- =============================================================
-- FILLER WORDS CATALOG TABLE
-- =============================================================
create table if not exists filler_words (
  id          uuid primary key default uuid_generate_v4(),
  word        text not null unique,
  category    text not null check (category in ('marcador', 'hesitação', 'óbvio', 'vago', 'repetição')),
  severity    text not null check (severity in ('low', 'medium', 'high')),
  description text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- SPEECHES TABLE
-- Each row = one continuous speaking segment by one politician
-- =============================================================
create table if not exists speeches (
  id                  uuid primary key default uuid_generate_v4(),
  session_id          uuid not null references sessions(id) on delete cascade,
  politician_id       uuid not null references politicians(id) on delete cascade,
  started_at          timestamptz not null,
  ended_at            timestamptz,
  duration_seconds    integer generated always as (
                        extract(epoch from (ended_at - started_at))::integer
                      ) stored,
  transcript          text,            -- full transcribed text
  word_count          integer default 0,
  filler_word_count   integer default 0,
  filler_word_pct     numeric(5,2) generated always as (
                        case when word_count > 0
                        then round((filler_word_count::numeric / word_count) * 100, 2)
                        else 0 end
                      ) stored,
  words_per_minute    numeric(6,1),
  filler_occurrences  jsonb default '{}',  -- {"portanto": 5, "então": 3, ...}
  identified_via      text check (identified_via in ('face', 'voice', 'manual', 'context')),
  confidence          numeric(4,3),        -- speaker ID confidence 0-1
  created_at          timestamptz not null default now()
);

create index if not exists idx_speeches_session on speeches(session_id);
create index if not exists idx_speeches_politician on speeches(politician_id);
create index if not exists idx_speeches_started_at on speeches(started_at desc);
create index if not exists idx_speeches_filler_pct on speeches(filler_word_pct desc);
create index if not exists idx_speeches_transcript on speeches using gin(to_tsvector('portuguese', coalesce(transcript, '')));

-- =============================================================
-- LIVE TRANSCRIPT EVENTS (for realtime feed)
-- Each row = one transcribed sentence/chunk, streamed live
-- =============================================================
create table if not exists transcript_events (
  id              uuid primary key default uuid_generate_v4(),
  speech_id       uuid references speeches(id) on delete cascade,
  session_id      uuid not null references sessions(id) on delete cascade,
  politician_id   uuid references politicians(id),
  text            text not null,
  is_filler       boolean not null default false,
  filler_words_found text[],            -- array of filler words found in this chunk
  timestamp       timestamptz not null default now()
);

create index if not exists idx_transcript_events_session on transcript_events(session_id, timestamp desc);

-- =============================================================
-- CONVENIENCE VIEWS
-- =============================================================

-- Politician speech statistics (all-time)
create or replace view politician_speech_stats as
  select
    p.id,
    p.name,
    p.party,
    p.photo_url,
    p.parlamento_url,
    count(distinct s.session_id)          as sessions_participated,
    count(s.id)                           as total_speeches,
    coalesce(sum(s.duration_seconds), 0)  as total_seconds_speaking,
    coalesce(sum(s.word_count), 0)        as total_words,
    coalesce(sum(s.filler_word_count), 0) as total_filler_words,
    case
      when coalesce(sum(s.word_count), 0) > 0
      then round((sum(s.filler_word_count)::numeric / sum(s.word_count)) * 100, 2)
      else 0
    end                                   as overall_filler_pct,
    round(avg(s.words_per_minute), 1)     as avg_words_per_minute,
    max(s.started_at)                     as last_spoke_at
  from politicians p
  left join speeches s on s.politician_id = p.id and s.ended_at is not null
  group by p.id, p.name, p.party, p.photo_url, p.parlamento_url;

-- Session summary with top speaker
create or replace view session_summaries as
  select
    sess.*,
    (select p.name from speeches sp
     join politicians p on p.id = sp.politician_id
     where sp.session_id = sess.id
     group by p.id, p.name
     order by sum(sp.duration_seconds) desc nulls last
     limit 1) as top_speaker,
    count(distinct sp.politician_id) as unique_speakers
  from sessions sess
  left join speeches sp on sp.session_id = sess.id
  group by sess.id;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table politicians enable row level security;
alter table sessions enable row level security;
alter table speeches enable row level security;
alter table filler_words enable row level security;
alter table transcript_events enable row level security;

create policy "Public read" on politicians for select using (true);
create policy "Public read" on sessions for select using (true);
create policy "Public read" on speeches for select using (true);
create policy "Public read" on filler_words for select using (true);
create policy "Public read" on transcript_events for select using (true);

create policy "Service role full access" on politicians for all using (auth.role() = 'service_role');
create policy "Service role full access" on sessions for all using (auth.role() = 'service_role');
create policy "Service role full access" on speeches for all using (auth.role() = 'service_role');
create policy "Service role full access" on filler_words for all using (auth.role() = 'service_role');
create policy "Service role full access" on transcript_events for all using (auth.role() = 'service_role');

-- =============================================================
-- SEED: Portuguese Parliament Filler Words Catalog
-- =============================================================
insert into filler_words (word, category, severity, description) values
  -- Marcadores de discurso
  ('portanto', 'marcador', 'high', 'Marcador de conclusão muito frequente em PT'),
  ('então', 'marcador', 'medium', 'Marcador de sequência temporal ou lógica'),
  ('ora', 'marcador', 'medium', 'Marcador de introdução ou contraste'),
  ('pronto', 'marcador', 'medium', 'Marcador de conclusão ou aceitação'),
  ('bom', 'marcador', 'low', 'Marcador de hesitação ou introdução'),
  ('pois', 'marcador', 'low', 'Marcador de concordância'),
  ('bem', 'marcador', 'low', 'Marcador de transição'),
  -- Hesitação
  ('né', 'hesitação', 'high', 'Partícula de confirmação/hesitação informal'),
  ('tipo', 'hesitação', 'high', 'Marcador de aproximação, informal'),
  ('digamos', 'hesitação', 'medium', 'Expressão de aproximação ou suavização'),
  ('sei lá', 'hesitação', 'high', 'Expressão de incerteza'),
  ('quer dizer', 'hesitação', 'medium', 'Reformulação ou esclarecimento'),
  ('ou seja', 'hesitação', 'low', 'Reformulação — pode ser legítimo mas frequentemente vazio'),
  -- Óbvio/Redundante
  ('obviamente', 'óbvio', 'medium', 'Afirmação de algo como evidente'),
  ('claramente', 'óbvio', 'medium', 'Afirmação de clareza desnecessária'),
  ('evidentemente', 'óbvio', 'medium', 'Afirmação de evidência'),
  ('naturalmente', 'óbvio', 'low', 'Afirmação de naturalidade'),
  ('logicamente', 'óbvio', 'low', 'Afirmação de lógica presumida'),
  ('certamente', 'óbvio', 'low', 'Afirmação de certeza'),
  -- Vago/Evasivo
  ('de certa forma', 'vago', 'high', 'Aproximação vaga'),
  ('de alguma forma', 'vago', 'high', 'Aproximação muito vaga'),
  ('em termos de', 'vago', 'medium', 'Relação imprecisa'),
  ('ao nível de', 'vago', 'medium', 'Localização vaga'),
  ('no fundo', 'vago', 'medium', 'Essencialização vaga'),
  ('de facto', 'vago', 'low', 'Ênfase que pode ser desnecessária'),
  ('efetivamente', 'vago', 'low', 'Confirmação que pode ser redundante'),
  ('basicamente', 'vago', 'medium', 'Simplificação frequentemente enganosa'),
  ('concretamente', 'vago', 'low', 'Promessa de concretização frequentemente não cumprida'),
  ('neste contexto', 'vago', 'low', 'Referência contextual frequentemente desnecessária'),
  ('na prática', 'vago', 'low', 'Distinção teoria/prática frequentemente artificial'),
  ('no âmbito de', 'vago', 'medium', 'Enquadramento vago e burocrático'),
  -- Repetição/Enchimento
  ('muito obrigado', 'repetição', 'low', 'Fórmula de cortesia repetida'),
  ('sr. presidente', 'repetição', 'low', 'Vocativo protocolar repetido (não conta como filler real)'),
  ('srs. deputados', 'repetição', 'low', 'Vocativo protocolar repetido')
on conflict (word) do nothing;
