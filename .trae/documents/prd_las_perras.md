# PRD — Las Perras (Sistema POS + Gestión + Pedidos Web)

Última actualización: 2026-03-28

## 0. Historial de cambios

| Fecha | Cambio | Nota |
|---|---|---|
| 2026-03-28 | Actualización mayor del PRD para reflejar el estado actual del producto | Incluye pedidos web, Realtime, recetas por ingredientes, estados y KPIs |

## 1. Resumen del Producto

“Las Perras” es un sistema web para operación diaria de un local de comida rápida (perros calientes) que integra:

- Venta en mostrador (POS).
- Gestión de pedidos operativos (“Caja / Pedidos” para preparación → cobro).
- Pedidos desde un menú público (web) con aprobación interna.
- Inventario por insumos con consumo automático por receta.
- Registro de gastos y comprobantes.
- KPIs y reportes (ventas, gastos, CMV/COGS, utilidad).

El objetivo es operar el negocio con trazabilidad, control de costos y flujo de trabajo rápido, evitando errores de stock y consolidando información financiera para decisiones diarias y cierre.

## 2. Objetivos y No Objetivos

### 2.1 Objetivos (Outcomes)

- Reducir pérdidas por inventario y errores de despacho mediante consumo automático por receta.
- Permitir operación “cobrar al entregar” y controlar estados del pedido sin inconsistencias.
- Permitir pedidos web sin exponer la base de datos a escritura directa desde usuarios anónimos.
- Mantener la experiencia operativa en tiempo real (sin recargar pantallas para ver pedidos).
- Proveer KPIs diarios/mensuales: ventas, gastos, CMV, utilidad neta y distribución (70/30).

### 2.2 No Objetivos (Por ahora)

- Integraciones con pasarelas de pago o facturación electrónica.
- Manejo multi-sucursal / multi-bodega.
- Gestión de domicilios con ruteo y tracking.

## 3. Usuarios, Roles y Permisos

### 3.1 Roles

| Rol | Quién es | Permisos principales |
|---|---|---|
| Admin | Dueño / Administrador | Acceso total: configuración, usuarios, inventario, productos/recetas, reportes, gastos, ventas y pedidos web |
| Vendor | Cajero / Vendedor | Acceso operativo: POS, Caja/Pedidos, Pedidos Web (aceptar/rechazar), lectura de inventario (según configuración), dashboard básico |

### 3.2 Usuario público (anónimo)

El usuario público no se autentica. Solo puede:

- Ver productos publicados (activos + visibles en web).
- Enviar un pedido web mediante una función segura (RPC) en base de datos.

## 4. Módulos y Alcance Funcional

### 4.1 Rutas y páginas (actual)

| Ruta | Pantalla | Audiencia | Propósito |
|---|---|---|---|
| / | Landing | Público | Entrada/marketing y acceso al menú |
| /menu | Menú Público | Público | Catálogo web y creación de pedido (local/delivery) |
| /login | Login | Staff | Autenticación (Supabase Auth + perfil en `users`) |
| /dashboard | Dashboard | Staff | KPIs, gráficos y resumen del negocio |
| /pos | POS | Vendor/Admin | Crear ventas rápidas (mostrador) |
| /orders | Pedidos (Caja) | Vendor/Admin | Gestionar pedidos en estados operativos (preparación → cobro) |
| /web-orders | Pedidos Web | Vendor/Admin | Aprobar/rechazar pedidos web entrantes |
| /inventory | Inventario | Staff | Ver stock, alertas, movimientos, costos |
| /products | Productos/Recetas | Admin | CRUD productos, publicación web, receta por ingredientes |
| /expenses | Gastos | Staff | Registro/edición/eliminación y comprobantes |
| /reports | Reportes | Staff | Exportación/analítica de ventas, gastos e inventario |
| /settings | Configuración | Admin | Usuarios, ajustes del negocio (nombre/logo, etc.) |

### 4.2 Pedidos y Estados (Venta/Pedido)

#### Tipos de pedido (`order_type`)

- `pos`: venta creada desde POS.
- `local`: pedido web para consumir en el local (sin dirección).
- `delivery`: pedido web con dirección, datos de contacto y costo de envío.

#### Estados (`status`)

- `draft`: borrador/orden creada pero no necesariamente cobrada.
- `pending_approval`: pedido web creado por usuario público y en espera de aprobación.
- `preparing`: pedido en preparación.
- `ready`: pedido listo para entregar.
- `delivered`: pedido entregado (puede estar pendiente de cobro).
- `paid`: pedido pagado/cerrado.
- `voided`: anulado (requiere motivo).
- `refunded`: reembolsado (posterior a `paid`, requiere motivo).
- `rejected`: pedido web rechazado (requiere motivo).

#### Reglas de transición (en base de datos)

El sistema restringe transiciones de estado para evitar inconsistencias operativas. Ejemplos clave:

- `pending_approval` → `preparing` o `rejected`.
- `preparing` → `ready`/`delivered`/`voided`.
- `delivered` → `paid` o `voided`.
- `paid` → `refunded`.

## 5. Flujos Core (End-to-End)

### 5.1 Flujo POS (Mostrador)

1. Staff entra a POS y arma el carrito (productos + cantidades; algunos productos pueden requerir elección de proteína).
2. Se crea la venta (`sales`) y sus items (`sale_items`) con `order_type = pos`.
3. Se descuenta inventario automáticamente según receta/consumo de insumos (movimientos `inventory_movements` tipo `out`).
4. El pedido queda en flujo operativo (por lo general `preparing` → `ready` → `delivered` → `paid`).
5. Si se anula o reembolsa:
   - Se registra motivo (`void_reason`) y auditoría (quién/cuándo).
   - Se generan movimientos reversos (`inventory_movements` tipo `in`) asociados al pedido para devolver insumos, cuando aplique.

### 5.2 Flujo Pedido Web (Público → Operación)

1. Usuario público entra al menú web, ve productos publicados y crea pedido.
2. El pedido se crea vía RPC segura en DB (no inserciones directas del cliente en `sales`):
   - Calcula el total con precios reales de la tabla `products`.
   - Crea `sales` con `status = pending_approval`.
   - Inserta `sale_items` con nombre/precio real.
   - Aplica costo fijo de envío cuando `order_type = delivery`.
3. Staff ve el pedido en “Pedidos Web” en tiempo real.
4. Staff decide:
   - Aceptar: `pending_approval` → `preparing` y se descuenta inventario en ese momento.
   - Rechazar: `pending_approval` → `rejected`, se guarda motivo. No hay devolución de inventario porque no se consumió.
5. Pedido aceptado entra al flujo de “Caja / Pedidos” para completar preparación y cobro.

### 5.3 Tiempo Real (Operación)

El sistema escucha cambios en pedidos mediante suscripción WebSocket a la tabla `sales`. Esto permite:

- Ver pedidos web entrantes sin recargar.
- Reflejar cambios de estado inmediatamente en Caja/Pedidos.
- Mantener una bandeja “pendientes” + “activos” sincronizada en toda la app.

## 6. Inventario y Recetas

### 6.1 Modelo de receta

- `products`: productos vendibles (nombre, precio, categoría, flags de publicación web y requerimientos).
- `product_ingredients`: ingredientes por producto (relación con `inventory_items`, cantidad y opcionalidad).

### 6.2 Consumo

Cuando una venta/pedido entra a preparación (POS inmediato o aceptación de pedido web):

- Se calcula consumo total por ingrediente según receta y cantidad de items.
- Se generan movimientos de inventario `out` con vínculo al `sale_id` para auditoría y cálculo de CMV.

### 6.3 Reversos

Si un pedido se anula y corresponde devolver insumos:

- Se generan movimientos `in` como reverso de movimientos anteriores (con `reversal_of`).

## 7. KPIs y Reportes

### 7.1 KPIs principales

- Ventas totales: suma de `total_amount` para estados operativos considerados “venta efectiva”.
- Gastos totales: suma de `expenses.amount` por rango.
- CMV / COGS: suma de (cantidad * costo unitario) de movimientos `inventory_movements` tipo `out` en el rango.
- Utilidad neta: ventas - gastos - CMV.
- Distribución de utilidad: 70% / 30% (parámetro de negocio).

### 7.2 Reportes

- Ventas por producto (“hotdog_type” en `sale_items` representa el nombre del producto vendido).
- Gastos por categoría.
- Exportación de datos (PDF/Excel) para contabilidad y revisión.

## 8. Requisitos No Funcionales

### 8.1 Seguridad

- RLS (Row Level Security) habilitado en tablas sensibles.
- Inserción de pedidos web anónimos solo mediante RPC `SECURITY DEFINER`.
- Política de lectura pública limitada a productos publicados y configuración pública mínima.
- No exponer llaves privadas (service role) en frontend.

### 8.2 Rendimiento y UX

- Tiempo real para pedidos (sin recargar).
- Operación rápida en POS y Caja (acciones en 1–2 clics).
- Tolerancia a latencia: UI debe mostrar “cargando” y errores claros.

### 8.3 Trazabilidad

- Movimientos de inventario auditables (tipo, motivo, usuario, venta asociada, reversos).
- Cambios de estado restringidos para evitar saltos inválidos.

## 9. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Desfase de inventario por recetas incompletas | Medio/Alto | Validación en productos/recetas, alertas de stock bajo, pruebas de consumo |
| Pedidos web con manipulación de precios | Alto | RPC recalcula precios desde DB (fuente de verdad) |
| Caída de Realtime / WebSockets | Medio | Fallback manual “Actualizar” y recarga inicial al iniciar sesión |
| Costos por crecimiento de datos | Medio | Índices, partición por fecha futura, archivado de ventas antiguas |

## 10. Roadmap sugerido

- Realtime completo para `sale_items` (opcional) o caché eficiente por pedido.
- Configuración editable de costo de envío (desde `settings`).
- Impresión de tickets y plantillas personalizadas por local.
- Modo cocina/pantalla de preparación dedicada (Kitchen Display).
