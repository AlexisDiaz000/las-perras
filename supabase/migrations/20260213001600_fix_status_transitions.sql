-- Update the transition function to support 'pending_approval' and 'rejected' states
CREATE OR REPLACE FUNCTION check_sales_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_status TEXT := COALESCE(OLD.status, 'draft');
  new_status TEXT := NEW.status;
  allowed BOOLEAN := FALSE;
BEGIN
  IF old_status = new_status THEN
    RETURN NEW;
  END IF;

  -- Transiciones permitidas
  IF old_status = 'pending_approval' AND new_status IN ('preparing', 'rejected') THEN
    allowed := TRUE;
  ELSIF old_status = 'draft' AND new_status IN ('preparing','voided') THEN
    allowed := TRUE;
  ELSIF old_status = 'preparing' AND new_status IN ('ready','delivered','voided') THEN
    allowed := TRUE;
  ELSIF old_status = 'ready' AND new_status IN ('delivered','voided') THEN      
    allowed := TRUE;
  ELSIF old_status = 'delivered' AND new_status IN ('paid','voided') THEN       
    allowed := TRUE;
  ELSIF old_status = 'paid' AND new_status IN ('refunded') THEN
    allowed := TRUE;
  END IF;

  IF NOT allowed THEN
    RAISE EXCEPTION 'Transición de estado no permitida: % -> %', old_status, new_status;
  END IF;

  RETURN NEW;
END;
$$;