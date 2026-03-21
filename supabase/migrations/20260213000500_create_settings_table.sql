-- Create settings table to store global app configuration
CREATE TABLE IF NOT EXISTS public.settings (
    id integer PRIMARY KEY DEFAULT 1,
    app_name character varying NOT NULL DEFAULT 'Brutal System',
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure only one row exists
ALTER TABLE public.settings ADD CONSTRAINT settings_single_row CHECK (id = 1);

-- Insert default settings
INSERT INTO public.settings (id, app_name) VALUES (1, 'Brutal System') ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (so Login page and Layout can read it)
CREATE POLICY "Allow public read access on settings" ON public.settings FOR SELECT USING (true);

-- Allow update access only to admins
CREATE POLICY "Allow admin update access on settings" ON public.settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
