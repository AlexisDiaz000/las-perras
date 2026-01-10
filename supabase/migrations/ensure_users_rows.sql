-- Insertar registros en public.users para usuarios existentes en auth
INSERT INTO public.users (id, email, name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), 'vendor'
FROM auth.users u
WHERE u.email IN ('admin@lasperras.com','vendedor@lasperras.com','axel.608@hotmail.com')
ON CONFLICT (id) DO NOTHING;

-- Elevar rol del admin
UPDATE public.users SET role = 'admin', name = COALESCE(name, 'Administrador Principal')
WHERE email = 'admin@lasperras.com';
