// Contraseñas del aula: derivación y verificación con PBKDF2.
//
// Las sesiones NO se manejan acá: Astro 7 las provee de forma nativa vía
// `Astro.session`, con el driver de Cloudflare KV que el adapter ya configura
// sobre el binding SESSION (el mismo cuyo id parchea inject-kv-id.mjs).
// Astro se encarga de la cookie, del almacenamiento y del vencimiento.
//
// Web Crypto se comporta igual en el runtime workerd de Cloudflare y en
// Node 18+, así que el mismo código sirve para la web y para el script de alta
// de alumnos.

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// El salt se tipa sobre ArrayBuffer y no sobre ArrayBufferLike: desde
// TypeScript 5.7 Uint8Array es generico en su buffer, y BufferSource (lo que
// espera crypto.subtle) solo acepta vistas respaldadas por un ArrayBuffer.
async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    DERIVED_BITS
  );
  return new Uint8Array(bits);
}

/** Formato almacenado en D1: "iteraciones.saltB64.hashB64". */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_ITERATIONS}.${toBase64(salt)}.${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(".");
  if (parts.length !== 3) return false;

  const iterations = Number(parts[0]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  let salt: Uint8Array<ArrayBuffer>;
  let expected: Uint8Array;
  try {
    salt = fromBase64(parts[1]);
    expected = fromBase64(parts[2]);
  } catch {
    // Hash corrupto en la base: se trata como credencial inválida.
    return false;
  }

  const actual = await deriveKey(password, salt, iterations);
  if (actual.length !== expected.length) return false;

  // Comparación en tiempo constante: no filtra en qué byte difieren.
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

/** Datos del alumno que se guardan en la sesión. */
export interface AulaSession {
  id: number;
  email: string;
  full_name: string;
}

export const SESSION_KEY = "aula" as const;
