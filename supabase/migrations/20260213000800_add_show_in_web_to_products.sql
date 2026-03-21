-- Add show_in_web column to products table to control visibility in the public menu
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_in_web boolean DEFAULT true;

-- Update existing products to show in web by default
UPDATE public.products SET show_in_web = true WHERE show_in_web IS NULL;
