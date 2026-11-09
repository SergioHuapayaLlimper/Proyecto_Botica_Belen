// Levanta la API Spring Boot (puerto 3200) y la web Angular (puerto 4300) con un solo comando:
//   node iniciar.mjs
// Ctrl + C detiene ambos.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const windows = process.platform === 'win32';

const partes = [
  { nombre: 'API', carpeta: 'backend-spring', comando: windows ? 'mvnw.cmd' : './mvnw', args: ['spring-boot:run'] },
  { nombre: 'WEB', carpeta: 'frontend', comando: 'npm', args: ['start'] },
];

for (const { nombre, carpeta, comando, args } of partes) {
  const cwd = fileURLToPath(new URL(`./${carpeta}/`, import.meta.url));
  const proceso = spawn(comando, args, { cwd, shell: true, stdio: 'inherit' });
  proceso.on('exit', (codigo) => console.log(`[${nombre}] se detuvo (código ${codigo}).`));
}

console.log('\nBotica Belén: abre http://localhost:4300 cuando aparezca "Local: http://localhost:4300/".');
console.log('La primera vez Spring Boot descarga dependencias: puede tardar unos minutos.\n');
