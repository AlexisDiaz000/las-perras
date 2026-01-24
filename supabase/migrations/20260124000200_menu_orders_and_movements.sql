-- Expandir el modelo para permitir menú escalable, estados de orden y movimientos auditables

-- Permitir nombres de productos más largos y sin enum rígido
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_hotdog_type_check;
ALTER TABLE sale_items ALTER COLUMN hotdog_type TYPE TEXT;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS modifiers JSONB;

-- Estados de orden/venta (para operación donde se cobra al entregar)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'paid';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE sales ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES users(id);

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_status_check CHECK (status IN ('draft', 'preparing', 'delivered', 'paid', 'voided', 'refunded'));

-- Vincular movimientos de inventario a ventas y soportar reversos
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES sales(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS reversal_of UUID REFERENCES inventory_movements(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS movement_group UUID;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_sale ON inventory_movements(sale_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_group ON inventory_movements(movement_group);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reversal ON inventory_movements(reversal_of);

-- Actualizar stock automáticamente con trigger (evita permisos de UPDATE desde el cliente)
CREATE OR REPLACE FUNCTION apply_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  delta NUMERIC;
BEGIN
  IF NEW.type = 'in' THEN
    delta := NEW.quantity;
  ELSE
    delta := -NEW.quantity;
  END IF;

  UPDATE inventory_items
    SET current_stock = current_stock + delta,
        updated_at = NOW()
    WHERE id = NEW.item_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_inventory_movement ON inventory_movements;
CREATE TRIGGER trg_apply_inventory_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION apply_inventory_movement();

-- Políticas: permitir insertar movimientos vinculados a ventas propias (vendedor) o cualquier movimiento (admin)
DROP POLICY IF EXISTS "Admin can create movements" ON inventory_movements;
CREATE POLICY "Users can create sale movements" ON inventory_movements
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      (sale_id IS NOT NULL AND EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id AND s.seller_id = auth.uid()))
      OR
      (sale_id IS NULL AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read sale items" ON sale_items;
CREATE POLICY "Authenticated users can read sale items" ON sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Vendors can insert sale items for own sales" ON sale_items;
CREATE POLICY "Vendors can insert sale items for own sales" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id AND s.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors can update own sales" ON sales;
CREATE POLICY "Vendors can update own sales" ON sales
  FOR UPDATE USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());
