-- Tabla de Productos (Menu Items)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Perros Sencillos', 'Perros Especiales', 'Bebidas', 'Adicionales', 'Otros')),
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  requires_protein_choice BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Recetas (Ingredientes por Producto)
CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,2) NOT NULL, -- Cantidad a descontar
  is_optional BOOLEAN DEFAULT false, -- Si el cliente puede quitarlo (ej. Cebolla)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);

-- RLS para Productos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- RLS para Ingredientes de Productos
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read product ingredients" ON product_ingredients
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage product ingredients" ON product_ingredients
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
