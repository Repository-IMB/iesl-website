import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ session }) => {
  // destroy() borra el dato del KV y limpia la cookie de sesión.
  session?.destroy();
  return new Response(null, { status: 303, headers: { Location: "/aula/login" } });
};
