-- Otorgar permisos para insertar usuarios al rol anon (para registro)
GRANT INSERT ON users TO anon;

-- Crear política para permitir registro de nuevos usuarios
CREATE POLICY "Allow registration" ON users
  FOR INSERT WITH CHECK (true);

-- También otorgar permisos al rol authenticated
GRANT INSERT ON users TO authenticated;

-- Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND grantee IN ('anon', 'authenticated');