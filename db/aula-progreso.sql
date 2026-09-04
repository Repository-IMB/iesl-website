-- Progreso por leccion del aula virtual (Cloudflare D1 / SQLite).
--
-- Aplicar con:
--   npm run aula:progreso           (base local)
--   npm run aula:progreso:remoto    (base de Cloudflare)
--
-- Una fila por alumno y leccion. La leccion se identifica por el codigo del
-- temario ("1.1", "2.3"...) dentro de un curso, no por un id numerico: asi el
-- progreso sobrevive a que se reordenen o reescriban los MDX del contenido.

CREATE TABLE IF NOT EXISTS lesson_progress (
  student_id  INTEGER NOT NULL REFERENCES students(id),
  course_slug TEXT NOT NULL,
  lesson_code TEXT NOT NULL,
  passed      INTEGER NOT NULL DEFAULT 0,
  best_score  INTEGER NOT NULL DEFAULT 0,   -- porcentaje 0..100
  attempts    INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, course_slug, lesson_code)
);

-- El caso de uso dominante es "traeme todo el progreso de este alumno en este
-- curso" para calcular que lecciones estan desbloqueadas.
CREATE INDEX IF NOT EXISTS idx_lesson_progress_alumno_curso
  ON lesson_progress(student_id, course_slug);
