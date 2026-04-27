import { motion } from "framer-motion";

interface Props {
  open: boolean;
  message: string;
}

const SQL = `-- ============ Acoustic AI · schema ============

create table if not exists public.sensor_data (
  id           bigserial primary key,
  "sensorA"    numeric not null,
  "sensorB"    numeric not null,
  "sensorC"    numeric not null,
  prediction   text not null,
  distance_m   numeric,
  created_at   timestamptz not null default now()
);

-- If the table already existed without distance_m, add it:
alter table public.sensor_data
  add column if not exists distance_m numeric;

create table if not exists public.leak_events (
  id              bigserial primary key,
  reading_id      bigint references public.sensor_data(id) on delete set null,
  prediction      text not null,
  distance_m      numeric,
  location_label  text not null,
  confidence      numeric not null default 0.8,
  status          text not null default 'open' check (status in ('open','resolved')),
  detected_at     timestamptz not null default now(),
  resolved_at     timestamptz
);

alter table public.sensor_data  enable row level security;
alter table public.leak_events  enable row level security;

-- Demo policies (open). Tighten for production.
create policy if not exists "anon read sd"   on public.sensor_data
  for select to anon using (true);
create policy if not exists "anon insert sd" on public.sensor_data
  for insert to anon with check (true);

create policy if not exists "anon read le"   on public.leak_events
  for select to anon using (true);
create policy if not exists "anon insert le" on public.leak_events
  for insert to anon with check (true);
create policy if not exists "anon update le" on public.leak_events
  for update to anon using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.sensor_data;
alter publication supabase_realtime add table public.leak_events;`;

export function SetupNotice({ open, message }: Props) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel border-warning/40 bg-warning/[0.04]"
    >
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-warning animate-signal" />
          <span className="panel-title text-warning">Database setup required</span>
        </div>
        <span className="data-label">SUPABASE · SQL EDITOR</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {message} Run the SQL below once in your Supabase SQL Editor to create the
        <span className="font-mono text-foreground"> sensor_data </span> and
        <span className="font-mono text-foreground"> leak_events </span> tables and
        enable realtime.
      </p>
      <pre className="data-value text-xs bg-surface-alt border border-border rounded-md p-4 overflow-x-auto whitespace-pre text-muted-foreground max-h-96">
{SQL}
      </pre>
      <p className="mt-3 text-xs text-muted-foreground">
        Optionally deploy the edge function in
        <span className="font-mono text-foreground"> supabase/functions/predict-leak </span>
        to plug in your Python ML service. Until then, predictions use the built-in
        rule-based heuristic.
      </p>
    </motion.div>
  );
}
