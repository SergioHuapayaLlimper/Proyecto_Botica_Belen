// Levanta la API (puerto 3200) y la web (puerto 4300) con un solo comando:
//   node iniciar.mjs          -> API Spring Boot (backend-spring) + web
//   node iniciar.mjs node     -> API Node.js (backend, versión anterior) + web
// Ctrl + C detiene ambos.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const usarNode = process.argv[2] === 'node';
const windows = process.platform === 'win32';

const api = usarNode
  ? { nombre: 'API', carpeta: 'backend', comando: 'npm', args: ['run', 'dev'] }
  : { nombre: 'API', carpeta: 'backend-spring', comando: windows ? 'mvnw.cmd' : './mvnw', args: ['spring-boot:run'] };

const partes = [api, { nombre: 'WEB', carpeta: 'frontend', comando: 'npm', args: ['start'] }];

for (const { nombre, carpeta, comando, args } of partes) {
  const cwd = fileURLToPath(new URL(`./${carpeta}/`, import.meta.url));
  const proceso = spawn(comando, args, { cwd, shell: true, stdio: 'inherit' });
  proceso.on('exit', (codigo) => console.log(`[${nombre}] se detuvo (código ${codigo}).`));
}

console.log(`\nBotica Belén (API ${usarNode ? 'Node.js' : 'Spring Boot'}): abre http://localhost:4300 cuando aparezca "Local: http://localhost:4300/".`);
if (!usarNode) console.log('La primera vez Spring Boot descarga dependencias: puede tardar unos minutos.\n');
