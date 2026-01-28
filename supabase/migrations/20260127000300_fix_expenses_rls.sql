
-- Habilitar RLS en tabla expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Políticas para Expenses
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
CREATE POLICY "Enable read access for authenticated users" ON expenses
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
CREATE POLICY "Enable insert for authenticated users" ON expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
CREATE POLICY "Enable update for authenticated users" ON expenses
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;
CREATE POLICY "Enable delete for authenticated users" ON expenses
  FOR DELETE USING (auth.role() = 'authenticated');
