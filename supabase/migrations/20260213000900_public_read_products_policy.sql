-- Allow anonymous public access to read active products that are marked to show in web
CREATE POLICY "Public users can read active web products" ON products
  FOR SELECT USING (active = true AND show_in_web = true);