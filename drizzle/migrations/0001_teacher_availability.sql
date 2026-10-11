ALTER TABLE public.teachers ADD COLUMN no_substitute boolean NOT NULL DEFAULT false;
ALTER TABLE public.teachers ADD COLUMN away_until date;
ALTER TABLE public.teachers ADD COLUMN away_reason text NOT NULL DEFAULT '';
GRANT UPDATE ON public.teachers TO anon, authenticated;
CREATE POLICY "update teachers" ON public.teachers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);