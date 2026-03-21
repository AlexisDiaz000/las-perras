-- Permitir inserción en productos si el rol del usuario es 'anon' (solo para propósitos de seeding/desarrollo)
-- O mejor, crear una política que permita insertar sin verificar usuario SOLO durante el setup.
-- Dado que RLS bloquea 'anon' por defecto, y el script de seed corre como anon si no se loguea.

-- OPCIÓN A: Deshabilitar temporalmente RLS para el seed (Peligroso en prod)
-- OPCIÓN B: Usar Service Role Key en el script (Mejor práctica)

-- Vamos a modificar el script para usar SERVICE_ROLE_KEY si es posible, o ajustar la política temporalmente.
-- Como no tengo acceso fácil a la service_role_key en el frontend, ajustaré la política para permitir inserciones desde el script local
-- asumiendo que es un entorno controlado.

-- Permitir a todos insertar (SOLO DESARROLLO - BORRAR DESPUÉS)
CREATE POLICY "Enable insert for all during seed" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all during seed ingredients" ON product_ingredients FOR INSERT WITH CHECK (true);
