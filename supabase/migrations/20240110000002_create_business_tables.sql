-- Tabla de items de inventario
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('Panadería', 'Proteínas', 'Aderezos', 'Complementos', 'Bebidas', 'Carnes')),
  unit VARCHAR(20) CHECK (unit IN ('unidades', 'gramos', 'litros')),
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 10,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para inventory_items
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory_items(current_stock) WHERE current_stock <= min_threshold;

-- RLS para inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read inventory" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admin can modify inventory" ON inventory_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card')),
  seller_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  hotdog_type VARCHAR(20) CHECK (hotdog_type IN ('Básico', 'Mejorado', 'Especial', 'Carnívoro', 'Tricarne', 'Supremo')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

-- RLS para ventas
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read sales" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Vendors can create sales" ON sales
  FOR INSERT WITH CHECK (seller_id = auth.uid());

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('Insumos', 'Servicios', 'Transporte', 'Alimentación', 'Personal', 'Otros')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);

-- RLS para gastos
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read expenses" ON expenses
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create own expenses" ON expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin can modify all expenses" ON expenses
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id),
  type VARCHAR(10) CHECK (type IN ('in', 'out')),
  quantity DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para movimientos
CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(created_at DESC);

-- RLS para movimientos
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read movements" ON inventory_movements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can create movements" ON inventory_movements
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Datos iniciales de inventario (solo si no existen)
INSERT INTO inventory_items (name, category, unit, current_stock, min_threshold, unit_cost) 
SELECT name, category, unit, current_stock, min_threshold, unit_cost
FROM (
  VALUES 
    ('Pan de perro', 'Panadería', 'unidades', 100, 20, 500),
    ('Salchicha', 'Proteínas', 'unidades', 150, 30, 1200),
    ('Tocineta', 'Proteínas', 'gramos', 5000, 1000, 80),
    ('Cebolla', 'Complementos', 'gramos', 3000, 500, 40),
    ('Salsa BBQ', 'Aderezos', 'gramos', 2000, 300, 25),
    ('Salsa Mayonesa', 'Aderezos', 'gramos', 2000, 300, 20),
    ('Salsa Mostaza', 'Aderezos', 'gramos', 1500, 200, 15),
    ('Papa Fosforito', 'Complementos', 'gramos', 8000, 1500, 35),
    ('Queso', 'Complementos', 'gramos', 4000, 800, 60),
    ('CocaCola Personal', 'Bebidas', 'unidades', 50, 15, 2500),
    ('CocaCola 1L', 'Bebidas', 'unidades', 30, 10, 4500),
    ('CocaCola 1.5L', 'Bebidas', 'unidades', 25, 8, 5500),
    ('Carne de Cerdo', 'Carnes', 'gramos', 3000, 500, 120),
    ('Carne de Pollo', 'Carnes', 'gramos', 2500, 400, 100),
    ('Desmechada de Res', 'Carnes', 'gramos', 2000, 300, 150),
    ('Huevos de Codorniz', 'Complementos', 'unidades', 48, 12, 300)
) AS t(name, category, unit, current_stock, min_threshold, unit_cost)
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE name = t.name);