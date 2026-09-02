/// <reference path="../.astro/types.d.ts" />

import type { AulaSession } from "./lib/aula/auth";

declare global {
  namespace App {
    /** Claves guardadas en `Astro.session` (respaldadas por el KV SESSION). */
    interface SessionData {
      aula: AulaSession;
    }

    interface Locals {
      /** Alumno autenticado en la petición actual, o null. */
      student: AulaSession | null;
    }
  }
}

export {};
