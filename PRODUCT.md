# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular 22 (standalone components, signals) para el frontend y una API REST en Node.js + Express con MySQL (`botica_belen_db`, el mismo esquema que la versión PHP original). Se ejecuta desde Visual Studio Code con `npm`; no se usa XAMPP. Decidido por el usuario.

## Users

- **Clientes de la botica** en Cañete (Lima, Perú): consultan precios y stock desde el celular, reservan productos de venta libre y pasan a recogerlos a la tienda.
- **Empleados** de la botica: atienden las reservas en mostrador y las hacen avanzar por estados hasta la entrega; consultan stock.
- **Administrador**: revisa ventas y pedidos, mantiene el catálogo y el stock, y gestiona las cuentas del personal.
- **Evaluación académica**: el proyecto se presenta en el curso Soluciones Web y Aplicaciones Distribuidas (UNDC); el docente lo revisará funcionando.

## Product Purpose

Sistema web de Botica Belén para reservar productos en línea y recogerlos en tienda, más el panel interno que gestiona esas reservas, el inventario y las ventas. Éxito: el cliente encuentra el producto, sabe si hay stock y cuánto pagará antes de salir de casa; el personal ve cada reserva nueva y la entrega sin errores de stock ni de precio.

## Positioning

Botica de barrio en Cañete: el valor está en "lo reservas y te lo separamos" con stock real y precios con IGV incluido, pagando en tienda o con Yape/Plin. No compite con cadenas nacionales por catálogo, sino por cercanía y rapidez de recojo.

## Operating Context

- Flujo principal del cliente: buscar → ver stock → agregar al carrito → reservar (solo recojo en tienda; no hay delivery) → elegir pago (Efectivo, Yape, Plin o Tarjeta) → recibir código de pedido (formato `BB-AAMMDD-HHMMSS-NNN`) → recoger.
- Flujo del empleado: Pendiente → Aceptado → En preparación → Listo para entregar → Entregado; puede Rechazar o Cancelar con motivo. Cancelar devuelve el stock.
- Los productos que requieren receta médica no se reservan en línea: se adquieren en tienda.
- Uso del personal en computadora de mostrador; clientes mayormente en celular.

## Capabilities and Constraints

- Roles: `Admin`, `Empleado`, `Cliente` (valores exactos del ENUM de la base de datos).
- Admin consulta pedidos pero no cambia estados (los gestionan los empleados); el Empleado no modifica stock.
- Precios en soles (S/) con IGV (18 %) incluido; el desglose se calcula como total / 1.18.
- El stock se aparta al reservar y vuelve si el pedido se cancela o rechaza.
- Cuentas bloqueadas tras 5 intentos fallidos de inicio de sesión; las reactiva el Admin.
- Catálogo de unas 200 referencias en 10 categorías; muchas sin imagen (no hay fotos de producto propias).
- Debe seguir siendo compatible con la base de datos y las contraseñas de la versión PHP.

## Brand Commitments

- Nombre: **Botica Belén** — "Farmacia y Cuidado Personal".
- Logo existente: emblema circular con cruz roja y azul, estrella y figura materna (`public/img/logo.jpg` del proyecto original; ojo: `logo.png` de ese proyecto es un logo antiguo de otro negocio, "D'Alicias Cocina", y no debe usarse).
- Colores del logo: rojo `#D92534`, azul oscuro `#0E2954`, azul medio `#1F6CB0`.

## Evidence on Hand

- Logo oficial (PNG/JPG 1024 × 1024).
- Catálogo y pedidos de ejemplo en `database/` (scripts del usuario).
- Datos de contacto (dirección, horario, teléfono/WhatsApp, número de Yape): **no proporcionados**. El usuario autorizó usar datos de ejemplo, siempre marcados como ficticios en el README; no inventar testimonios, premios ni cifras de clientes.

## Product Principles

1. Stock y precio verdaderos antes que nada: el cliente nunca debe llegar a la tienda por algo agotado ni pagar un monto distinto al mostrado.
2. Reservar en menos pasos de los que toma llamar por teléfono.
3. El mostrador primero: el personal debe ver de un vistazo qué reservas están pendientes y qué sigue.
4. Claridad para todas las edades: muchos clientes son adultos mayores o compran para ellos.

## Accessibility & Inclusion

Público amplio que incluye adultos mayores: textos legibles, contraste suficiente (WCAG AA), objetivos táctiles cómodos en celular y mensajes en español claro, sin jerga técnica.
