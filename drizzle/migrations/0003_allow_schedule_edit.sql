GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_slots TO anon, authenticated;
GRANT ALL ON public.schedule_slots TO service_role;
CREATE POLICY "insert slots" ON public.schedule_slots FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update slots" ON public.schedule_slots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete slots" ON public.schedule_slots FOR DELETE TO anon, authenticated USING (true);