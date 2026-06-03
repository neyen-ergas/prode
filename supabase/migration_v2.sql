-- Migration v2: pin_hash nullable + seed participants

ALTER TABLE public.users ALTER COLUMN pin_hash DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN is_admin SET DEFAULT false;

INSERT INTO public.users (name, color) VALUES
  ('Aldana',   '#EF4444'),
  ('Juan',     '#F97316'),
  ('Neyen',    '#EAB308'),
  ('Serena',   '#22C55E'),
  ('Patricia', '#06B6D4'),
  ('Paula',    '#3B82F6'),
  ('Juanma',   '#8B5CF6'),
  ('Hugo',     '#EC4899')
ON CONFLICT (name) DO NOTHING;
