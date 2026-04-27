import { motion } from "framer-motion";

interface Props {
  open: boolean;
  message: string;
}

const SQL = `create table public.sensor_data (
  id bigserial primary key,
  "sensorA" numeric not null,
  "sensorB" numeric not null,
  "sensorC" numeric not null,
  prediction text not null,
  created_at timestamptz not null default now()
);

alter table public.sensor_data enable row level security;

-- Demo policies (open). Tighten for production.
create policy "anon read"   on public.sensor_data for select to anon using (true);
create policy "anon insert" on public.sensor_data for insert to anon with check (true);

-- Enable realtime
alter publication supabase_realtime add table public.sensor_data;`;

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
          <span className="panel-title text-warning">One-time setup required</span>
        </div>
        <span className="data-label">SUPABASE · SQL EDITOR</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {message} Run the SQL below once in your Supabase project's SQL Editor to create the
        <span className="font-mono text-foreground"> sensor_data </span> table and enable realtime.
      </p>
      <pre className="data-value text-xs bg-surface-alt border border-border rounded-md p-4 overflow-x-auto whitespace-pre text-muted-foreground">
{SQL}
      </pre>
    </motion.div>
  );
}
