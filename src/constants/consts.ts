export const SITE_TITLE = 'IESL Institute';
export const SITE_DESCRIPTION = 'Crecimiento profesional con enfoque humano. Formación, comunidad y bienestar en un solo lugar.';
export const CONTACT_EMAIL = 'hola@iesl-institute.com';
export const CONTACT_PHONE = '+54 11 1234-5678';

// Número de WhatsApp para inscripciones: solo dígitos, con código de país y
// sin "+" ni espacios (ej. Perú: '51987654321').
export const WHATSAPP_NUMBER = '51986726708';
export const SUPPORT_PHONE = '51941026868';
export const SUPPORT_PHONE_DISPLAY = '+51 941 026 868';
export const ACADEMIC_SUPPORT_EMAIL = 'academicsupport@ieslinstitute.com';
export const CUSTOMER_MANAGEMENT_EMAIL = 'customermanagement@ieslinstitute.com';

/** Link a WhatsApp con mensaje precargado (formato api.whatsapp.com/send). */
export const getWhatsAppLink = (message: string) =>
	`https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;