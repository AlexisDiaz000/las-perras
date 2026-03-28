# Brutal System

Brutal System es un sistema web (SPA) para operación diaria de negocios de comida rápida: punto de venta (POS), control de pedidos, pedidos web (menú público), inventario por insumos con consumo por receta, gastos, KPIs y reportes.

## Módulos principales

- Login y roles (Admin / Vendor)
- Dashboard (KPIs, gráficos, utilidad y distribución)
- POS (ventas rápidas)
- Pedidos / Caja (flujo de preparación → entrega → cobro)
- Pedidos Web (aprobación/rechazo de pedidos entrantes)
- Inventario (stock, costos, movimientos y reversos)
- Productos/Recetas (productos, ingredientes, publicación web)
- Gastos (categorías y comprobantes)
- Reportes (exportación y análisis)

## Arquitectura (resumen)

- Frontend: React 18 + TypeScript + Vite
- Estilos/UI: Tailwind CSS + Headless UI + Heroicons
- Estado global: Zustand
- Backend: Supabase (Auth + PostgreSQL + Storage + Realtime)
- Pedidos Web públicos: creación mediante RPC segura (para no exponer escrituras directas en tablas)
- Tiempo real: Realtime (WebSockets) para sincronizar pedidos en operación

Documentación interna:

- PRD: [.trae/documents/prd_brutal_system.md](.trae/documents/prd_brutal_system.md)
- Arquitectura técnica: [.trae/documents/technical_architecture_brutal_system.md](.trae/documents/technical_architecture_brutal_system.md)

## Requisitos

- Node.js (recomendado LTS)
- npm

## Scripts

```bash
npm install
npm run dev
```

Otros:

```bash
npm run build
npm run lint
npm run check
```

## Supabase

La app usa Supabase como backend. Actualmente el proyecto tiene URL y anon key configurados en código en [supabase.ts](src/lib/supabase.ts).

Para producción, se recomienda mover esta configuración a variables de entorno (por ejemplo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) y evitar hardcodear valores.
