# Botica Belén — Angular + Spring Boot

Web de reservas con recojo en tienda para una botica local: los clientes separan productos y el personal los prepara y entrega.

- **frontend/** — Angular 22 (portal de clientes + panel de gestión). Puerto **4300**.
- **backend-spring/** — Spring Boot 3.5 + Java 21 + JPA: API REST con JWT y arquitectura en capas. Puerto **3200**. Detalle en `backend-spring/README.md`.
- **database/** — `botica_belen.sql`: estructura y datos de prueba en un solo script.
- **docker-compose.yml** — MySQL 8.4 en Docker (puerto **3307**) que carga `database/botica_belen.sql` la primera vez.

## Requisitos

- **Java 21** (Maven no hace falta: el proyecto trae Maven Wrapper).
- **Node.js 24** (o 22.22 en adelante).
- **Docker Desktop** para la base de datos.

## Instalar (primera vez)

```bash
docker compose up -d          # crea la base botica_belen_db en el puerto 3307
cd frontend
npm install
```

Si PowerShell dice que *la ejecución de scripts está deshabilitada*, usa `npm.cmd install`.

## Cómo abrirlo

Con Docker encendido, desde la carpeta del proyecto:

```bash
node iniciar.mjs
```

Abre **http://localhost:4300** cuando aparezca `Local: http://localhost:4300/`. La primera vez Spring Boot descarga dependencias y tarda unos minutos.

### Con las tareas de VS Code

`.vscode/tasks.json` trae tres tareas (*Terminal › Ejecutar tarea…*):

- **API (backend)**: arranca sola al abrir la carpeta y también con `Ctrl+Mayús+B`.
- **Web (frontend)**.
- **Botica Belén: todo** (API + web).

En la terminal de la API verás una línea por petición, por ejemplo `[10:42:15] GET /api/categorias → 200 (4 ms)`. También queda en `backend-spring/logs/api.log`.

## Qué probar

1. **Cliente:** busca un producto, filtra por categoría, pulsa **Separar** y confirma la reserva (Efectivo o Yape, recojo en tienda).
2. **Personal:** en **Mostrador** acepta la reserva, marca la checklist de preparación y avánzala hasta **Entregado**.
3. **Cliente:** en **Mis reservas** sigue el estado y descarga la constancia en PDF.
4. **Admin:** revisa el **Resumen** (ventas, ganancia, conversión), gestiona productos, categorías, personal y roles, edita la información del negocio y exporta el **Reporte** a Excel o PDF.

## Reiniciar los datos

```bash
docker compose down -v
docker compose up -d
```

El contenedor vuelve a cargar `database/botica_belen.sql`. Sin Docker, ejecuta ese script en tu MySQL.

## Despliegue

- **Web:** Vercel (carpeta `frontend`). `frontend/vercel.json` reenvía `/api` a la API.
- **API:** Render con `backend-spring/Dockerfile`. La conexión se define con `DB_URL`, `DB_USER`, `DB_PASS` y `JWT_SECRET`.
- **Base de datos:** cualquier MySQL compatible (por ejemplo TiDB Cloud), cargando `database/botica_belen.sql`.

## Notas

- Los precios incluyen IGV (18 %). El stock se separa al reservar y vuelve si la reserva se cancela, se rechaza o vence.
- Si `npm install` se cuelga, el `.npmrc` del frontend apunta al espejo `registry.npmmirror.com`; cámbialo a `https://registry.npmjs.org/` si falla.
