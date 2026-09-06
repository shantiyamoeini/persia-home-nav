CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  deal TEXT NOT NULL DEFAULT 'sale',
  type TEXT NOT NULL DEFAULT 'apartment',
  area INTEGER NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 0,
  floor TEXT NOT NULL DEFAULT '',
  build_year INTEGER NOT NULL DEFAULT 1400,
  city TEXT NOT NULL DEFAULT 'تهران',
  district TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  price BIGINT,
  deposit BIGINT,
  rent BIGINT,
  owner_name TEXT NOT NULL DEFAULT '',
  owner_phone TEXT NOT NULL DEFAULT '',
  features TEXT[] NOT NULL DEFAULT '{}',
  note TEXT NOT NULL DEFAULT '',
  photos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own properties" ON public.properties FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  interest TEXT NOT NULL DEFAULT 'sale',
  type TEXT NOT NULL DEFAULT 'apartment',
  budget BIGINT NOT NULL DEFAULT 0,
  district TEXT NOT NULL DEFAULT '',
  min_area INTEGER NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_time TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'call',
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated;
GRANT ALL ON public.follow_ups TO service_role;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own follow ups" ON public.follow_ups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX properties_user_created_idx ON public.properties (user_id, created_at DESC);
CREATE INDEX clients_user_created_idx ON public.clients (user_id, created_at DESC);
CREATE INDEX follow_ups_user_date_idx ON public.follow_ups (user_id, due_date);
CREATE INDEX follow_ups_client_idx ON public.follow_ups (client_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();