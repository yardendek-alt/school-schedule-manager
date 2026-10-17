CREATE TABLE public.schedule_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  slots jsonb NOT NULL,
  working_days jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.schedule_snapshots TO anon, authenticated;
GRANT ALL ON public.schedule_snapshots TO service_role;
ALTER TABLE public.schedule_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read snapshots" ON public.schedule_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "delete snapshots" ON public.schedule_snapshots FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.create_schedule_snapshot(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO schedule_snapshots(name, slots, working_days) VALUES (
    _name,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('teacher_id', teacher_id, 'day_of_week', day_of_week, 'period', period, 'activity_type', activity_type, 'subject', subject, 'class_room', class_room)) FROM schedule_slots), '[]'::jsonb),
    COALESCE((SELECT jsonb_object_agg(id::text, to_jsonb(working_days)) FROM teachers), '{}'::jsonb)
  ) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.restore_schedule_snapshot(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE snap schedule_snapshots;
BEGIN
  SELECT * INTO snap FROM schedule_snapshots WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'snapshot not found'; END IF;
  DELETE FROM schedule_slots WHERE teacher_id IS NOT NULL;
  INSERT INTO schedule_slots(teacher_id, day_of_week, period, activity_type, subject, class_room)
  SELECT (e->>'teacher_id')::uuid, e->>'day_of_week', (e->>'period')::int, e->>'activity_type', e->>'subject', e->>'class_room'
  FROM jsonb_array_elements(snap.slots) e
  WHERE EXISTS (SELECT 1 FROM teachers t WHERE t.id = (e->>'teacher_id')::uuid);
  UPDATE teachers t SET working_days = ARRAY(SELECT jsonb_array_elements_text(snap.working_days -> t.id::text))
  WHERE snap.working_days ? t.id::text;
END $$;

GRANT EXECUTE ON FUNCTION public.create_schedule_snapshot(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_schedule_snapshot(uuid) TO anon, authenticated;