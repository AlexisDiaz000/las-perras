
-- Drop the old version of the function that causes the ambiguity error
DROP FUNCTION IF EXISTS crear_pedido_publico(character varying, character varying, character varying, text, text, public.cart_item_input[]);
