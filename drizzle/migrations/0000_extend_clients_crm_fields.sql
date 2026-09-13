ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS budget_max bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_area integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS districts text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS requirements text NOT NULL DEFAULT ''::text;

UPDATE public.clients SET districts = district WHERE districts = '' AND district <> '';

CREATE INDEX IF NOT EXISTS clients_agency_created_idx ON public.clients (agency_id, created_at DESC);