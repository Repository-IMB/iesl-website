// Configuración de tracking (Google Tag Manager + Search Console).
// Estos IDs son PÚBLICOS (aparecen en el HTML), así que van hardcodeados aquí para
// que el deploy automático los tome sin configurar variables de entorno.
// El `.env` queda reservado solo para credenciales sensibles.

/** ID del contenedor de Google Tag Manager (formato GTM-XXXXXXX). */
export const GTM_ID = "GTM-P4PFXJ4P";

/**
 * Token de verificación de Google Search Console (atributo `content` del meta).
 * Completar cuando esté disponible (search.google.com/search-console →
 * propiedad "prefijo de URL" → método "Etiqueta HTML").
 */
export const GSC_VERIFICATION = "";

/** Si no hay GTM_ID no se inyecta ningún script. */
export const ANALYTICS_ENABLED = Boolean(GTM_ID);
