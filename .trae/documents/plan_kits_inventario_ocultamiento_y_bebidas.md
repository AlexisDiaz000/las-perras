## Resumen

Implementar un sistema de Kits que no rompa el core del inventario/productos, corrigiendo 2 problemas:
- Desinstalación segura: nunca borrar/alterar insumos que se usen en otras recetas; si un insumo del kit queda “sin uso”, ocultarlo sin tocar stock ni historial.
- Bebidas fuera de kits: los kits de comida no deben insertar bebidas para evitar duplicados; el dueño las crea manualmente.

## Análisis del Estado Actual (repo)

**Kits**
- Instalación/desinstalación vive en [kits.ts](file:///c:/Users/USUARIO/Desktop/proyecto%20perras/src/services/kits.ts).
- Instalación:
  - Inventario: “get-or-create” por nombre (consulta `.in('name', ...)`, luego `insert` de faltantes). Mapea IDs por `name`.
  - Productos: consulta por `name`, inserta los faltantes y mapea IDs por `name`.
  - Recetas: borra e inserta `product_ingredients` por `product_id`.
- Desinstalación:
  - Borra productos por IDs (obtenidos por name) y sus recetas.
  - Para inventario: intenta borrar insumos por IDs (obtenidos por name). Si falla por FK (23503), hace “soft delete” llevando stock a 0 y creando un movimiento “out”.

**Limitaciones de la DB**
- `inventory_items` tiene `CHECK` en `category` y `unit` y además tiene unicidad en nombre (constraint `inventory_items_name_key`). Ver [seed_inventory.sql](file:///c:/Users/USUARIO/Desktop/proyecto%20perras/supabase/migrations/20260127000100_seed_inventory.sql#L1-L28).
- `products.name` NO es único (no hay unique constraint). Ver [create_products_schema.sql](file:///c:/Users/USUARIO/Desktop/proyecto%20perras/supabase/migrations/20260128000200_create_products_schema.sql#L1-L13).

**Inventario UI**
- La vista de inventario siempre lista todo lo que devuelve `inventoryService.getItems()` (hoy `select('*')`). Ver [inventory.ts](file:///c:/Users/USUARIO/Desktop/proyecto%20perras/src/services/inventory.ts#L4-L13) y [Inventory.tsx](file:///c:/Users/USUARIO/Desktop/proyecto%20perras/src/pages/Inventory.tsx#L85-L99).
- No existe un mecanismo de “ocultar” (no hay columna `active/is_hidden` en `InventoryItem`).

**Kits incluyen bebidas**
- Los kits actuales incluyen productos/insumos de Bebidas (p.ej. Coca-Cola, jugos), lo que puede crear duplicados o confundir la configuración.

## Problemas a Resolver

1) **Desinstalación peligrosa**
- Hoy se intenta borrar insumos del kit, y si hay FK se fuerza stock a 0.
- Esto es incorrecto cuando el insumo también se usa en otras recetas o kits: no debe tocarse ni ocultarse.
- Además, “forzar stock a 0” es una operación contable/operativa sensible.

2) **Identificación débil de productos del kit**
- Como `products.name` no es único, “buscar por name” es ambiguo: puede encontrar múltiples filas y mapear mal.
- Desinstalar “por name” (directo o indirecto) puede afectar productos del usuario que coincidan en nombre.

3) **Bebidas en kits**
- Se quiere eliminar bebidas de los kits de comidas para evitar duplicados y dejar esa parte al dueño.

## Decisiones Confirmadas (del usuario)

- Al desinstalar: si un insumo del kit ya no está en recetas activas, pero tiene stock o historial, se debe **ocultar conservando stock** (sin ajustes automáticos).  
- “En uso” = **en receta activa** (referenciado por `product_ingredients` de un `product.active=true`).  
- Bebidas: **quitar bebidas de todos los kits**.

## Propuesta Recomendada (sin romper el core)

### A) Añadir trazabilidad mínima + ocultamiento por columna (recomendado)

**Objetivo:** poder instalar/desinstalar por IDs, y ocultar inventario sin borrar datos.

1) **Migraciones Supabase (DB)**
Crear una migración nueva que agregue:
- `inventory_items.is_hidden BOOLEAN NOT NULL DEFAULT FALSE`
- `inventory_items.hidden_reason TEXT NULL`
- `products.kit_id TEXT NULL`
- `products.kit_temp_id TEXT NULL`
- `products.is_kit BOOLEAN NOT NULL DEFAULT FALSE`
- `products.is_hidden BOOLEAN NOT NULL DEFAULT FALSE` (opcional; alternativamente solo usar `active=false`)
- Índice único parcial para kit-products:
  - `UNIQUE (kit_id, kit_temp_id) WHERE kit_id IS NOT NULL AND kit_temp_id IS NOT NULL`

Razonamiento:
- No se cambia la lógica core (inventario sigue siendo la misma tabla).
- Se agrega metadata para operaciones de kits sin depender de `name`.
- No se fuerza unicidad de `products.name`, evitando romper datos existentes.

2) **Definición de kits (datos)**
Actualizar los kits en `src/lib/kits/*.ts` para:
- Eliminar productos de categoría `Bebidas` y los insumos asociados de Bebidas.
- Mantener únicamente comidas/ingredientes de comidas.

3) **Servicio de instalación**
Actualizar `installKit` en `src/services/kits.ts`:
- Inventario:
  - Mantener “get-or-create” por `inventory_items.name` (la tabla es única por name).
  - Si un insumo existe y estaba oculto por un kit, **desocultarlo** (`is_hidden=false`) solo si el usuario lo instala (y opcionalmente solo si fue ocultado por kits).
- Productos:
  - Insertar/actualizar usando `(kit_id, kit_temp_id)` como clave de kit (no por nombre).
  - Al crear, setear: `is_kit=true`, `kit_id=kit.id`, `kit_temp_id=prod.tempId`, `active=true`.
- Recetas:
  - Regenerar `product_ingredients` para los productos del kit (los identificados por su `kit_id/tempId`).

4) **Servicio de desinstalación**
Actualizar `uninstallKit` en `src/services/kits.ts`:
- Productos:
  - Obtener productos del kit por `kit_id=kit.id` y `is_kit=true`.
  - En vez de borrar, hacer **soft-delete**: `active=false` y `show_in_web=false` (si aplica) para sacarlos del menú sin perder historial.  
  - Borrar `product_ingredients` solo para esos `product_id`.
- Inventario:
  - Para cada insumo del kit (por name, porque inventario es único por name), calcular si está “en uso”:
    - Contar referencias en `product_ingredients` donde `products.active=true` (y el producto no esté desactivado por esta desinstalación).
  - Si está en uso: **no hacer nada** (ni ocultar, ni stock).
  - Si NO está en uso: marcar `inventory_items.is_hidden=true` y `hidden_reason='Kit uninstall: <kit.id>'`.
  - **Nunca** forzar stock a 0 ni crear movimientos automáticos en desinstalación (por decisión).

5) **Inventario UI**
Cambiar el flujo de datos para soportar ocultos:
- `inventoryService.getItems()` debe traer por defecto solo `is_hidden=false` (y agregar método/flag `includeHidden`).
- `Inventory.tsx` debe agregar un toggle (admin) “Mostrar ocultos”.
  - Default: ocultos OFF (para reducir ruido).
  - Cuando ON: muestra todo y permite al usuario editar/ajustar lo que quedó oculto.

### B) Alternativas (por si no quieres tocar DB)

**B1) Ocultar solo a nivel UI (sin columna)**
- Calcular “insumos en uso” con un query a `product_ingredients` + `products.active=true`.
- En UI: ocultar cualquier insumo cuyo `name` esté dentro del catálogo de nombres de kits y no esté en uso.
Limitación: si el usuario renombra insumos del kit, deja de detectarlos; no queda trazabilidad.

**B2) Tabla de relación kit_entities (más robusto, más trabajo)**
- Crear tabla `kit_entities(kit_id, entity_type, entity_id, created_by_kit, installed_at)` y operar solo por IDs.
Ventaja: trazabilidad completa; Desventaja: más queries/migraciones.

## Archivos Afectados (si se ejecuta el plan)

- DB:
  - `supabase/migrations/<new>_kits_soft_hide.sql` (nueva migración)
- Kits:
  - `src/lib/kits/perreria.ts` (quitar bebidas)
  - `src/lib/kits/hamburgueseria.ts` (quitar bebidas)
  - `src/lib/kits/pizzeria.ts` (quitar bebidas)
  - `src/lib/kits/restaurante.ts` (quitar bebidas)
- Servicios:
  - `src/services/kits.ts` (instalar/desinstalar con IDs + ocultamiento seguro)
  - `src/services/inventory.ts` (filtro por `is_hidden`)
- UI:
  - `src/pages/Inventory.tsx` (toggle “Mostrar ocultos”)
  - `src/pages/Settings.tsx` (opcional: indicar que bebidas no están incluidas)

## Supuestos

- El usuario que instala/desinstala es admin (RLS permite modificaciones).
- “En uso” se define por referencias en `product_ingredients` de productos activos.
- Inventario tiene unicidad por nombre, por lo que “get-or-create por name” es válido.

## Verificación (criterios de aceptación)

1) Instalar un kit en base limpia:
- Crea productos/recetas; inventario queda visible.
- No crea bebidas.

2) Desinstalar kit:
- Productos del kit dejan de aparecer (active=false) y sus recetas se eliminan.
- Insumos del kit:
  - Si siguen en recetas activas (de otros productos), permanecen visibles y sin cambios.
  - Si NO están en recetas activas, quedan ocultos (`is_hidden=true`) sin tocar stock ni crear movimientos.

3) Inventario UI:
- Por defecto no muestra ocultos.
- Con “Mostrar ocultos” se ven los insumos ocultos (para ajustes manuales).

4) Reinstalar kit:
- Rehabilita productos del kit y regenera sus recetas.
- Desoculta insumos del kit que estaban ocultos (sin duplicar nombres).

