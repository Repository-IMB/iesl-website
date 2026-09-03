// Acceso a datos del aula virtual sobre Cloudflare D1.

export interface StudentRow {
  id: number;
  email: string;
  full_name: string;
  password_hash: string;
  active: number;
  is_admin: number;
  created_at: string;
}

/** Busca un alumno por email. El email se guarda y compara en minúsculas. */
export async function getStudentByEmail(
  db: D1Database,
  email: string
): Promise<StudentRow | null> {
  return await db
    .prepare("SELECT * FROM students WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first<StudentRow>();
}

/** Slugs de los cursos del aula a los que el alumno tiene acceso. */
export async function getEnrolledCourses(db: D1Database, studentId: number): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT course_slug FROM enrollments WHERE student_id = ? ORDER BY granted_at ASC")
    .bind(studentId)
    .all<{ course_slug: string }>();
  return (results ?? []).map((row) => row.course_slug);
}

export async function isEnrolled(
  db: D1Database,
  studentId: number,
  courseSlug: string
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM enrollments WHERE student_id = ? AND course_slug = ?")
    .bind(studentId, courseSlug)
    .first<{ ok: number }>();
  return row !== null;
}

export async function createStudent(
  db: D1Database,
  email: string,
  fullName: string,
  passwordHash: string,
  isAdmin = false
): Promise<number> {
  const row = await db
    .prepare(
      `INSERT INTO students (email, full_name, password_hash, active, is_admin)
       VALUES (?1, ?2, ?3, 1, ?4)
       RETURNING id`
    )
    .bind(email.trim().toLowerCase(), fullName, passwordHash, isAdmin ? 1 : 0)
    .first<{ id: number }>();
  if (!row) throw new Error("No se pudo crear el alumno");
  return row.id;
}

export async function enrollStudent(
  db: D1Database,
  studentId: number,
  courseSlug: string
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO enrollments (student_id, course_slug)
       VALUES (?1, ?2)
       ON CONFLICT(student_id, course_slug) DO NOTHING`
    )
    .bind(studentId, courseSlug)
    .run();
}

// ─── Administración ─────────────────────────────────────────────────────────

/**
 * Confirma contra D1 que el alumno sigue activo y con rol de administrador.
 * Se comprueba en cada página y ruta de `/aula/admin` en vez de confiar en el
 * `is_admin` de la sesión, que puede haber quedado obsoleto.
 */
export async function requireAdmin(db: D1Database, studentId: number): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM students WHERE id = ? AND active = 1 AND is_admin = 1")
    .bind(studentId)
    .first<{ ok: number }>();
  return row !== null;
}

/** Un alumno del listado de administración, con sus cursos habilitados. */
export interface StudentSummary {
  id: number;
  email: string;
  full_name: string;
  active: number;
  is_admin: number;
  created_at: string;
  /** Slugs separados por coma, tal como los agrega SQLite. */
  courses: string | null;
}

export async function listStudents(db: D1Database): Promise<StudentSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.email, s.full_name, s.active, s.is_admin, s.created_at,
              GROUP_CONCAT(e.course_slug) AS courses
         FROM students s
         LEFT JOIN enrollments e ON e.student_id = s.id
        GROUP BY s.id
        ORDER BY s.is_admin DESC, s.full_name ASC, s.email ASC`
    )
    .all<StudentSummary>();
  return results ?? [];
}

export async function emailExists(
  db: D1Database,
  email: string,
  exceptId?: number
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM students WHERE email = ?1 AND id != ?2")
    .bind(email.trim().toLowerCase(), exceptId ?? -1)
    .first<{ ok: number }>();
  return row !== null;
}

export async function updateStudent(
  db: D1Database,
  id: number,
  email: string,
  fullName: string,
  active: boolean
): Promise<void> {
  await db
    .prepare("UPDATE students SET email = ?2, full_name = ?3, active = ?4 WHERE id = ?1")
    .bind(id, email.trim().toLowerCase(), fullName, active ? 1 : 0)
    .run();
}

export async function updateStudentPassword(
  db: D1Database,
  id: number,
  passwordHash: string
): Promise<void> {
  await db
    .prepare("UPDATE students SET password_hash = ?2 WHERE id = ?1")
    .bind(id, passwordHash)
    .run();
}

/** Borra al alumno y sus matrículas en una sola transacción. */
export async function deleteStudent(db: D1Database, id: number): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM enrollments WHERE student_id = ?").bind(id),
    db.prepare("DELETE FROM students WHERE id = ?").bind(id),
  ]);
}

/** Reemplaza las matrículas del alumno por la lista indicada. */
export async function setEnrollments(
  db: D1Database,
  studentId: number,
  courseSlugs: string[]
): Promise<void> {
  const statements = [
    db.prepare("DELETE FROM enrollments WHERE student_id = ?").bind(studentId),
    ...courseSlugs.map((slug) =>
      db
        .prepare("INSERT INTO enrollments (student_id, course_slug) VALUES (?1, ?2)")
        .bind(studentId, slug)
    ),
  ];
  await db.batch(statements);
}

/** Cantidad de administradores activos. Evita quedarse sin ninguno. */
export async function countActiveAdmins(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS total FROM students WHERE is_admin = 1 AND active = 1")
    .first<{ total: number }>();
  return row?.total ?? 0;
}
