# Botica Belén — API Spring Boot

API REST en **Spring Boot 3.5 + Java 21 + Spring Data JPA + MySQL** que consume el frontend Angular (`../frontend`).

## Arquitectura en capas

```
Angular  ──HTTP/JSON──►  controller  ──►  service  ──►  repository  ──►  MySQL
                         (REST)          (negocio)     (JPA / SQL)
```

| Capa | Paquete | Qué hace |
|---|---|---|
| Presentación | `controller` | Recibe la petición HTTP, llama al servicio y devuelve JSON. Sin lógica de negocio. |
| Negocio | `service` | Reglas de la botica: validaciones, IGV, stock, máquina de estados del pedido, transacciones. |
| Datos | `repository` | `JpaRepository` para guardar/editar entidades y consultas SQL nativas para listados y reportes. |
| Modelo | `entity` | Tablas de MySQL mapeadas con JPA (`Usuario`, `Categoria`, `Producto`, `Pedido`, `DetallePedido`). |
| Transferencia | `dto` | `Solicitudes` (lo que llega) y `Respuestas` (lo que sale). |
| Transversal | `seguridad`, `excepcion`, `config`, `util` | JWT + roles (`@Requiere`), errores `{ "message" }`, CORS, validaciones. |

Ejemplo de flujo — reservar: `PedidoController.registrar` → `PedidoService.registrar` (valida, bloquea stock con `SELECT … FOR UPDATE`, calcula IGV) → `ProductoRepository` / `PedidoRepository` → tablas `pedido` y `detalle_pedido`.

## Cómo correrlo

Requisitos: **Java 21** y la base de datos de `docker-compose.yml` encendida (`docker compose up -d` en la carpeta raíz). Maven **no** hace falta: el proyecto trae Maven Wrapper (`mvnw`).

```powershell
cd backend-spring
.\mvnw.cmd spring-boot:run
```

La primera vez descarga Maven y las dependencias (unos minutos). Queda lista cuando aparece:
`API de Botica Belén (Spring Boot) lista en http://localhost:3200/api`.

Prueba rápida: http://localhost:3200/api/salud

## Configuración

`src/main/resources/application.properties`. Cada valor se puede cambiar con una variable de entorno:

| Variable | Por defecto |
|---|---|
| `PORT` | `3200` (el mismo que usa Angular) |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3307` (MySQL de Docker) |
| `DB_USER` / `DB_PASS` / `DB_NAME` | `root` / `root` / `botica_belen_db` |
| `JWT_SECRET` | clave de desarrollo (cámbiala, mínimo 32 caracteres) |
| `CORS_ORIGIN` | `http://localhost:4200,http://localhost:4300` |
| `DB_URL` | URL JDBC completa; si se define, reemplaza a `DB_HOST`/`DB_PORT`/`DB_NAME` (útil en la nube) |
