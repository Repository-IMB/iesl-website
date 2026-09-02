-- Esquema del aula virtual (Cloudflare D1 / SQLite)
--
-- Alta de alumnos: npm run aula:alta -- --email <email> --nombre "<nombre>" --curso <slug>
-- El panel de administracion web queda fuera de alcance por ahora.

-- Alumnos con credenciales asignadas por el equipo de IESL
CREATE TABLE IF NOT EXISTS students (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,            -- PBKDF2: iteraciones.saltB64.hashB64
  active        INTEGER NOT NULL DEFAULT 1,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Que curso del aula puede ver cada alumno. Sin esta tabla, al sumar el
-- segundo curso beneficio lo verian todos los alumnos automaticamente.
CREATE TABLE IF NOT EXISTS enrollments (
  student_id  INTEGER NOT NULL REFERENCES students(id),
  course_slug TEXT NOT NULL,              -- slug de la collection aulaCursos
  granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, course_slug)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_slug);
