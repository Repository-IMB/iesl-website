// Alta de alumnos del aula virtual.
//
// Uso:
//   npm run aula:alta -- --email ana@empresa.com --pass Clave123 \
//                        --nombre "Ana Perez" --curso power-bi-fundamentos [--admin] [--remoto]
//
// Con --admin la cuenta puede entrar al panel de /aula/admin y administrar
// alumnos. El rol solo se asigna desde aca, a proposito: asi ningun clic en el
// panel puede dejar al aula sin administradores. Un admin no necesita --curso.
//
// Por defecto escribe en la base D1 local (.wrangler/state/), que es la que usa
// `npm run dev`. Con --remoto escribe en la base de Cloudflare, lo que exige
// tener wrangler autenticado en la cuenta de este proyecto.
//
// Genera el hash PBKDF2 con el mismo formato que src/lib/aula/auth.ts.

import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const PBKDF2_ITERATIONS = 100_000;
const DB_NAME = "iesl-aula";

// Flags nombrados y no posicionales: npm parte los argumentos con espacios al
// reenviarlos, asi que "Ana Perez" posicional llegaba como dos argumentos.
function parseArgs(argv) {
  const flags = { remoto: false, admin: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--remoto") {
      flags.remoto = true;
    } else if (arg === "--admin") {
      flags.admin = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) continue;
      // Se reconstruye el valor con los tokens siguientes hasta el proximo
      // flag, para tolerar que npm haya partido un nombre con espacios.
      const parts = [];
      while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        parts.push(argv[++i]);
      }
      flags[key] = parts.join(" ");
    }
  }
  return flags;
}

const { email, pass, nombre = "", curso, remoto, admin } = parseArgs(process.argv.slice(2));

// Un administrador no necesita curso; un alumno si, o no veria nada al entrar.
if (!email || !pass || (!curso && !admin)) {
  console.error(
    "Uso: npm run aula:alta -- --email <email> --pass <contrasena> --nombre <nombre> --curso <slug> [--admin] [--remoto]\n" +
      "Alumno: npm run aula:alta -- --email ana@empresa.com --pass Clave123 --nombre Ana Perez --curso power-bi-fundamentos\n" +
      "Admin:  npm run aula:alta -- --email admin@iesl.com --pass ClaveSegura1 --nombre Equipo IESL --admin"
  );
  process.exit(1);
}

async function hashPassword(plain) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");
  return `${PBKDF2_ITERATIONS}.${b64(salt)}.${b64(new Uint8Array(bits))}`;
}

/** Escapa comillas simples para SQL literal. */
const esc = (value) => String(value).replace(/'/g, "''");

const hash = await hashPassword(pass);
const normalizedEmail = email.trim().toLowerCase();

// Un alta repetida actualiza nombre y contrasena y reactiva al alumno, en vez
// de fallar por el UNIQUE del email.
const isAdmin = admin ? 1 : 0;

const matricula = curso
  ? `
INSERT INTO enrollments (student_id, course_slug)
SELECT id, '${esc(curso)}' FROM students WHERE email = '${esc(normalizedEmail)}'
ON CONFLICT(student_id, course_slug) DO NOTHING;`
  : "";

const sql = `
INSERT INTO students (email, full_name, password_hash, active, is_admin)
VALUES ('${esc(normalizedEmail)}', '${esc(nombre)}', '${esc(hash)}', 1, ${isAdmin})
ON CONFLICT(email) DO UPDATE SET
  full_name = excluded.full_name,
  password_hash = excluded.password_hash,
  active = 1,
  is_admin = ${isAdmin};
${matricula}
`.trim();

const tmpFile = join(tmpdir(), `iesl-aula-alta-${Date.now()}.sql`);
writeFileSync(tmpFile, sql, "utf8");

// Se invoca el entrypoint JS de wrangler con node en vez de npx: Node en
// Windows rechaza spawnSync sobre archivos .cmd sin shell (EINVAL).
const require = createRequire(import.meta.url);
const wranglerBin = resolve(
  dirname(require.resolve("wrangler/package.json")),
  "bin",
  "wrangler.js"
);

try {
  const result = spawnSync(
    process.execPath,
    [
      wranglerBin,
      "d1",
      "execute",
      DB_NAME,
      remoto ? "--remote" : "--local",
      `--file=${tmpFile}`,
      "--yes",
    ],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    console.error("\nwrangler devolvio un error: el alumno no se dio de alta.");
    process.exit(result.status ?? 1);
  }

  console.log(
    `\n${admin ? "Administrador" : "Alumno"} dado de alta en la base ` +
      `${remoto ? "remota" : "local"}: ${normalizedEmail}${curso ? ` -> ${curso}` : ""}`
  );
} finally {
  unlinkSync(tmpFile);
}
