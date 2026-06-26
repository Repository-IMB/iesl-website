export const SITE_TITLE = 'IESL Institute';
export const SITE_DESCRIPTION = 'Crecimiento profesional con enfoque humano. Formación, comunidad y bienestar en un solo lugar.';
export const CONTACT_EMAIL = 'hola@iesl-institute.com';
export const CONTACT_PHONE = '+54 11 1234-5678';

// Número de WhatsApp para inscripciones: solo dígitos, con código de país y
// sin "+" ni espacios (ej. Perú: '51987654321'). COMPLETAR antes de publicar.
export const WHATSAPP_NUMBER = '';

/** Link a WhatsApp con mensaje precargado (formato wa.me). */
export const getWhatsAppLink = (message: string) =>
	`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;