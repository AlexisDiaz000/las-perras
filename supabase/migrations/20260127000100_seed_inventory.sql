
-- Asegurar unicidad en nombres de inventario
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_name_key') THEN
        ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_name_key UNIQUE (name);
    END IF;
END $$;

-- Insertar ingredientes base
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
ON CONFLICT (name) DO NOTHING;
