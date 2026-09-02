// Arranca `astro dev` con más heap de Node.
//
// Por qué: el optimizador de dependencias de Vite rehace su caché cada vez que
// aparece un archivo nuevo en src/, y con este árbol de dependencias el
// "program reload" que sigue desborda el heap por defecto (~4 GB) y mata el
// dev server sin mensaje útil (el error real queda en .astro/dev.log).
//
// Es un wrapper y no `cross-env` para no sumar una dependencia: NODE_OPTIONS
// no se puede fijar de forma multiplataforma dentro de un script de npm.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const astroBin = resolve(dirname(require.resolve("astro/package.json")), "bin", "astro.mjs");

const child = spawn(
  process.execPath,
  [astroBin, "dev", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim(),
    },
  }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
