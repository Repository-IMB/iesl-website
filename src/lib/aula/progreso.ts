// Progreso por lección y desbloqueo secuencial del aula.
//
// El avance es lineal en todo el curso, no dentro de cada módulo: la última
// lección del módulo 1 desbloquea la primera del módulo 2.

import type { AulaModulo } from "./content";

export interface LessonProgressRow {
  student_id: number;
  course_slug: string;
  lesson_code: string;
  passed: number;
  best_score: number;
  attempts: number;
  updated_at: string;
}

export type ProgresoPorLeccion = Map<string, LessonProgressRow>;

export async function getProgresoDelCurso(
  db: D1Database,
  studentId: number,
  courseSlug: string
): Promise<ProgresoPorLeccion> {
  const { results } = await db
    .prepare("SELECT * FROM lesson_progress WHERE student_id = ? AND course_slug = ?")
    .bind(studentId, courseSlug)
    .all<LessonProgressRow>();

  const mapa: ProgresoPorLeccion = new Map();
  for (const fila of results ?? []) mapa.set(fila.lesson_code, fila);
  return mapa;
}

/**
 * Registra un intento y devuelve el progreso resultante. `passed` y
 * `best_score` nunca bajan: un intento peor no borra un aprobado anterior.
 */
export async function registrarIntento(
  db: D1Database,
  studentId: number,
  courseSlug: string,
  lessonCode: string,
  score: number,
  passScore: number
): Promise<{ passed: boolean; bestScore: number; attempts: number }> {
  const passed = score >= passScore;

  const fila = await db
    .prepare(
      `INSERT INTO lesson_progress
         (student_id, course_slug, lesson_code, passed, best_score, attempts, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 1, datetime('now'))
       ON CONFLICT(student_id, course_slug, lesson_code) DO UPDATE SET
         passed = MAX(lesson_progress.passed, excluded.passed),
         best_score = MAX(lesson_progress.best_score, excluded.best_score),
         attempts = lesson_progress.attempts + 1,
         updated_at = datetime('now')
       RETURNING passed, best_score, attempts`
    )
    .bind(studentId, courseSlug, lessonCode, passed ? 1 : 0, score)
    .first<{ passed: number; best_score: number; attempts: number }>();

  return {
    passed: (fila?.passed ?? 0) === 1,
    bestScore: fila?.best_score ?? score,
    attempts: fila?.attempts ?? 1,
  };
}

// ─── Secuencia de lecciones y desbloqueo ────────────────────────────────────

export interface LeccionEnSecuencia {
  /** Código del temario, p.ej. "1.1". */
  code: string;
  moduleNumber: number;
  /** Cantidad de preguntas de su evaluación. */
  questionCount: number;
}

/**
 * Aplana las lecciones del curso en el orden en que se cursan. Los módulos
 * llegan ya ordenados por `getModulosDeCurso`.
 */
export function secuenciaDeLecciones(modulos: AulaModulo[]): LeccionEnSecuencia[] {
  return modulos.flatMap((modulo) =>
    modulo.data.lessons.map((leccion) => ({
      code: leccion.code,
      moduleNumber: modulo.data.number,
      questionCount: leccion.questions.length,
    }))
  );
}

/**
 * Una lección cuenta como completada si el alumno aprobó su evaluación, o si
 * todavía no tiene preguntas cargadas. Lo segundo es deliberado: permite ir
 * sumando evaluaciones de a poco sin que el curso quede trabado en la primera
 * lección sin examen.
 */
function estaCompletada(
  leccion: LeccionEnSecuencia,
  progreso: ProgresoPorLeccion
): boolean {
  if (leccion.questionCount === 0) return true;
  return (progreso.get(leccion.code)?.passed ?? 0) === 1;
}

export interface EstadoLeccion {
  code: string;
  desbloqueada: boolean;
  completada: boolean;
  /** Mejor porcentaje obtenido, 0 si nunca la intentó. */
  mejorPuntaje: number;
  intentos: number;
  /** Código de la lección que hay que aprobar para desbloquear esta. */
  requiere: string | null;
}

/**
 * Calcula el estado de cada lección del curso. La primera siempre está
 * disponible; el resto se abre cuando la anterior queda completada.
 */
export function estadoDeLecciones(
  modulos: AulaModulo[],
  progreso: ProgresoPorLeccion
): Map<string, EstadoLeccion> {
  const secuencia = secuenciaDeLecciones(modulos);
  const estados = new Map<string, EstadoLeccion>();

  // Primera lección incompleta de la secuencia: es la que traba todo lo que
  // viene después. Se guarda para que el mensaje de bloqueo señale la lección
  // sobre la que el alumno puede actuar, y no simplemente la anterior.
  let bloqueante: string | null = null;

  for (const leccion of secuencia) {
    const fila = progreso.get(leccion.code);
    const completada = estaCompletada(leccion, progreso);
    const desbloqueada = bloqueante === null;

    estados.set(leccion.code, {
      code: leccion.code,
      desbloqueada,
      completada,
      mejorPuntaje: fila?.best_score ?? 0,
      intentos: fila?.attempts ?? 0,
      requiere: bloqueante,
    });

    if (bloqueante === null && !completada) bloqueante = leccion.code;
  }

  return estados;
}

/** Cuántas lecciones del curso completó el alumno, para la barra de avance. */
export function contarCompletadas(estados: Map<string, EstadoLeccion>): number {
  let total = 0;
  for (const estado of estados.values()) if (estado.completada) total++;
  return total;
}
