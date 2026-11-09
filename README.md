# Botica Belén — Angular + Spring Boot

Reserva en línea con recojo en tienda. Mismo modelo de datos MySQL del proyecto PHP original, ahora con:

- **frontend/** — Angular 22 (portal de clientes + panel de gestión). Puerto **4300**.
- **backend-spring/** — **Spring Boot 3.5 + Java 21 + JPA** (API REST con JWT, arquitectura en capas). Puerto **3200**. Es la API por defecto: ver `backend-spring/README.md`.
- **backend/** — Node.js + Express 5 (versión anterior de la API, mismas rutas). Puerto **3200**.
- **docker-compose.yml** — MySQL 8.4 en Docker (puerto **3307**) que carga los scripts de `database/` la primera vez.
- **database/** — scripts SQL (estructura, catálogo de 200 productos y datos de demostración).

No necesita Apache ni PHP: solo MySQL y Node.js. Todo se corre desde la terminal de VS Code.

## Instalar en otra PC (primera vez)

Necesitas:
- **Node.js 24** (o 22.22 en adelante).
- **MySQL 8**. También sirve el MySQL/MariaDB de XAMPP: solo enciende *MySQL* en su panel.

1. **Crea la base de datos.** En phpMyAdmin, MySQL Workbench o la consola de MySQL, ejecuta en este orden:
   `database/01_estructura.sql`, `database/02_catalogo_200.sql` y `database/03_datos_demo.sql`.
2. **Revisa `backend/.env`.** Viene listo para MySQL en el puerto **3306**, usuario `root` y sin contraseña (lo normal en XAMPP).
   Si tu MySQL usa otro puerto o tiene contraseña, cámbialo ahí (`DB_PORT`, `DB_PASS`).
3. **Instala las dependencias** (una sola vez). Abre una terminal en la carpeta del proyecto y ejecuta:

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

   Si PowerShell dice que *la ejecución de scripts está deshabilitada*, escribe `npm.cmd install` en lugar de `npm install`, o usa una terminal *Command Prompt*.
   Si npm muestra un aviso `allow-scripts` sobre `msgpackr-extract`, ignóralo: es opcional y no afecta al proyecto.
4. **Arráncalo** como se explica en la sección siguiente.

## Cómo abrirlo (desde VS Code)

1. Verifica que MySQL esté encendido. El puerto, el usuario y la contraseña están en `backend/.env`.
2. Abre una terminal en esta carpeta (`botica-belen-angular`) y ejecuta:

   ```bash
   node iniciar.mjs
   ```

3. Cuando aparezca `Local: http://localhost:4300/`, abre **http://localhost:4300** en el navegador.

También puedes usar dos terminales por separado: `npm run dev` dentro de `backend/` y `npm start` dentro de `frontend/`.

### Con las tareas de VS Code

La carpeta trae `.vscode/tasks.json` con tres tareas:

- **API (backend)**: arranca sola al abrir la carpeta (si VS Code pregunta, elige *Permitir*). También se lanza con `Ctrl+Mayús+B`.
- **Web (frontend)** y **Botica Belén: todo** (API + web): desde *Terminal › Ejecutar tarea…*.

En la terminal de la API verás una línea por cada petición, por ejemplo `[10:42:15] GET /api/categorias → 200 (4 ms)`.
Para que la API no arranque sola, borra la línea `"runOptions"` de la tarea en `.vscode/tasks.json`.

## Cuentas de prueba

Todas usan la contraseña `admin123`. En la pantalla **Ingresar** hay botones para entrar con un clic.

| Rol | Correo | Entra a |
|---|---|---|
| Cliente | juan.perez@gmail.com | Catálogo, reservas, mi cuenta |
| Empleado | empleado1@botica.com | Gestión › Mostrador (acepta y prepara pedidos) |
| Admin | admin@botica.com | Gestión › Resumen, productos, reporte, personal |

## Qué probar

1. **Como visitante:** busca un producto, filtra por categoría y pulsa **Separar**.
2. Ve a **Tu reserva**, ingresa como Cliente, elige el método de pago y confirma. Todas las reservas se recogen en tienda (no hay delivery).
3. **Como Empleado:** en **Mostrador** acepta la reserva, márcala en "Qué preparar ahora" y avánzala hasta **Entregado**.
4. **Como Cliente:** en **Mis reservas** verás la tarjeta de control con el sello de cada etapa.
5. **Como Admin:** revisa el **Resumen** (ventas y gráficos), edita el stock en **Productos** y exporta el **Reporte** a CSV.

## Reiniciar los datos

Para volver a los datos iniciales, ejecuta en orden los scripts de `database/` en tu MySQL (borran y recrean la base `botica_belen_db`):
`01_estructura.sql`, `02_catalogo_200.sql` y `03_datos_demo.sql`.

Si tu base se creó con una versión anterior (que tenía delivery), ejecuta una sola vez `04_quitar_delivery.sql`.
Ese script quita la columna `direccionEntrega` y el estado "Enviado o en camino" sin borrar tus pedidos.

## Notas

- La dirección, el teléfono y el WhatsApp de la tienda que aparecen en la web son **datos de ejemplo** (`frontend/src/app/core/modelos.ts`).
- Los precios incluyen IGV (18 %). El stock se reserva al crear el pedido y se devuelve si se cancela o se rechaza.
- Si `npm install` se cuelga, el proyecto ya trae `.npmrc` apuntando al espejo `registry.npmmirror.com`.
