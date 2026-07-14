import { env } from "cloudflare:workers";

export function validateApiToken(request: Request): boolean {
  const authHeader = request.headers.get("Authorization") ?? "";
  const incomingToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  return incomingToken === env.SECRET_ACCESS_TOKEN;
}