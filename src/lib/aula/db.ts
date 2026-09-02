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

// ─── Alta de alumnos (script CLI) ───────────────────────────────────────────

export async function createStudent(
  db: D1Database,
  email: string,
  fullName: string,
  passwordHash: string
): Promise<number> {
  const row = await db
    .prepare(
      `INSERT INTO students (email, full_name, password_hash, active, is_admin)
       VALUES (?1, ?2, ?3, 1, 0)
       RETURNING id`
    )
    .bind(email.trim().toLowerCase(), fullName, passwordHash)
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
