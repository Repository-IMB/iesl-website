import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { isEnrolled } from "../../../lib/aula/db";
import { getAulaCurso, getModulosDeCurso } from "../../../lib/aula/content";
import {
  estadoDeLecciones,
  getProgresoDelCurso,
  registrarIntento,
} from "../../../lib/aula/progreso";

export const prerender = false;

/**
 * Corrige la evaluación de una lección.
 *
 * La corrección ocurre acá y no en el navegador: `correctIndex` vive solo en el
 * MDX y nunca se serializa a la página, así que el alumno no puede leer las
 * respuestas ni marcar la lección como aprobada por su cuenta.
 *
 * Responde con un 303 de vuelta a la lección; el resultado viaja en la query
 * string. Así el formulario funciona sin JavaScript.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const student = locals.student!;
  const db = env.DB_AULA;

  const form = await request.formData();
  const cursoSlug = String(form.get("curso") ?? "");
  const leccionCode = String(form.get("leccion") ?? "");

  const curso = await getAulaCurso(cursoSlug);
  if (!curso) return new Response("Curso inexistente", { status: 404 });

  const modulos = await getModulosDeCurso(cursoSlug);
  const modulo = modulos.find((m) =>
    m.data.lessons.some((l) => l.code === leccionCode)
  );
  const leccion = modulo?.data.lessons.find((l) => l.code === leccionCode);

  if (!modulo || !leccion) return new Response("Lección inexistente", { status: 404 });

  const volver = (params: Record<string, string>) =>
    new Response(null, {
      status: 303,
      headers: {
        Location:
          `/aula/${cursoSlug}/modulo/${modulo.data.number}` +
          `?${new URLSearchParams(params)}` +
          `#leccion-${leccionCode.replace(/\./g, "-")}`,
      },
    });

  if (leccion.questions.length === 0) {
    return volver({ error: "Esta lección todavía no tiene evaluación." });
  }

  try {
    if (!(await isEnrolled(db, student.id, cursoSlug))) {
      return new Response("Sin acceso a este curso", { status: 403 });
    }

    // No se admite responder una lección que todavía está bloqueada: sin este
    // control se podría saltar el orden enviando el formulario a mano.
    const progresoPrevio = await getProgresoDelCurso(db, student.id, cursoSlug);
    const estados = estadoDeLecciones(modulos, progresoPrevio);
    if (!estados.get(leccionCode)?.desbloqueada) {
      return volver({ error: "Todavía no podés responder esta lección." });
    }

    // Corrección. Una pregunta sin responder cuenta como incorrecta.
    const incorrectas: string[] = [];
    let aciertos = 0;

    leccion.questions.forEach((pregunta, indice) => {
      const respuesta = Number(form.get(`p${indice}`));
      if (Number.isInteger(respuesta) && respuesta === pregunta.correctIndex) {
        aciertos++;
      } else {
        incorrectas.push(String(indice + 1));
      }
    });

    const score = Math.round((aciertos / leccion.questions.length) * 100);
    const resultado = await registrarIntento(
      db,
      student.id,
      cursoSlug,
      leccionCode,
      score,
      curso.data.passScore
    );

    return volver({
      leccion: leccionCode,
      puntaje: String(score),
      aprobado: resultado.passed ? "1" : "0",
      // Se informa qué preguntas estuvieron mal, pero no cuál era la opción
      // correcta: si se revelara, reintentar sería trivial y la evaluación
      // dejaría de ser una condición real para avanzar.
      falladas: incorrectas.join(","),
    });
  } catch (error) {
    console.error("[aula] no se pudo corregir la evaluación:", error);
    return volver({ error: "No se pudo registrar tu evaluación. Volvé a intentar." });
  }
};
