
-- Habilitar RLS en tablas clave si no lo está
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas para Inventory Items
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_items;
CREATE POLICY "Enable read access for authenticated users" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON inventory_items;
CREATE POLICY "Enable write access for authenticated users" ON inventory_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para Inventory Movements
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_movements;
CREATE POLICY "Enable read access for authenticated users" ON inventory_movements
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_movements;
CREATE POLICY "Enable insert for authenticated users" ON inventory_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas para Sales
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sales;
CREATE POLICY "Enable read access for authenticated users" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sales;
CREATE POLICY "Enable insert for authenticated users" ON sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON sales;
CREATE POLICY "Enable update for authenticated users" ON sales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para Sale Items
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sale_items;
CREATE POLICY "Enable read access for authenticated users" ON sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sale_items;
CREATE POLICY "Enable insert for authenticated users" ON sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Re-insertar items de inventario (UPSERT)
INSERT INTO inventory_items (name, category, unit, min_threshold, current_stock) VALUES
  ('Pan de perro', 'Panadería', 'unidades', 20, 100),
  ('Salchicha', 'Carnes', 'unidades', 20, 100),
  ('Desmechada de Res', 'Proteínas', 'gramos', 500, 2000),
  ('Carne de Pollo', 'Proteínas', 'gramos', 500, 2000),
  ('Carne de Cerdo', 'Proteínas', 'gramos', 500, 2000),
  ('Tocineta', 'Proteínas', 'gramos', 200, 1000),
  ('Huevos de Codorniz', 'Proteínas', 'unidades', 50, 200),
  ('Cebolla', 'Complementos', 'gramos', 200, 1000),
  ('Papa Fosforito', 'Complementos', 'gramos', 200, 1000),
  ('Queso', 'Complementos', 'gramos', 200, 1000),
  ('Salsa BBQ', 'Aderezos', 'gramos', 200, 1000),
  ('Salsa Mayonesa', 'Aderezos', 'gramos', 200, 1000),
  ('Salsa Mostaza', 'Aderezos', 'gramos', 200, 1000),
  ('CocaCola Personal', 'Bebidas', 'unidades', 10, 50),
  ('CocaCola 1L', 'Bebidas', 'unidades', 5, 20),
  ('CocaCola 1.5L', 'Bebidas', 'unidades', 5, 20)
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  unit = EXCLUDED.unit;
