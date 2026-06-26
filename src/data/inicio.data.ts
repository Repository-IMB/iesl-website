import type { HomeHeroSection, AboutSection, CommunitySection, WellnessSection, TestimonialCard } from "../types/home.type";
import type { ContactSection, Faq } from "../types/shared.type";

import claseOnline from "../assets/images/inicio/clase-online.webp";
import manosEstrechadas from "../assets/images/inicio/manos-estrechadas.webp";
import trabajoEnEquipo from "../assets/images/inicio/trabajo-en-equipo.webp";
import estudianteClaseOnline from "../assets/images/inicio/estudiante-clase-online.webp";
import workshopAnalisisDatos from "../assets/images/inicio/workshop-analisis-datos.webp";
import workshopContenidoIa from "../assets/images/inicio/workshop-contenido-ia.webp";
import workshopPromptEngineering from "../assets/images/inicio/workshop-prompt-engineering.webp";
import workshopVibeCoding from "../assets/images/inicio/workshop-vibe-coding.webp";
import workshopAutomatizacion from "../assets/images/inicio/workshop-automatizacion.webp";
import accesoDeporvida from "../assets/images/beneficios/acceso-deporvida.webp";
import { ROUTES } from "../constants/routes";

// ─── HERO ───────────────────────────────────────────────────────────────────
export const hero: HomeHeroSection = {
  badge: "Educación práctica potenciada con IA",
  badgeIcon: "mdi:heart"  ,
  title: {
    static: "Estudia, crece y",
    highlight: "potencia tu trabajo con IA",
    end: "sin importar tu profesión.",
  },
  description:
    "Cursos prácticos y accesibles, con workshops de inteligencia artificial gratis y de por vida, para que apliques IA y herramientas tecnológicas en tu día a día —sin importar tu área ni tu nivel técnico.",
  cta: {
    primary: { text: "Ver cursos", href: ROUTES.COURSES },
    secondary: { text: "Conoce los beneficios", href: "#beneficios" },
  },
  slides: [
    {
      image: trabajoEnEquipo,
      floatingBadges: [
        {
          icon: "mdi:clock-outline",
          title: "Horarios flexibles",
          description: "Estudiá cuando puedas",
          color: "primary",
        },
        {
          icon: "fluent:people-team-20-regular",
          title: "Networking",
          description: "Comunidades disponibles",
          color: "red",
        },
      ],
    },
    {
      image: estudianteClaseOnline, // Will be replaced by second image
      floatingBadges: [
        {
          icon: "lucide:circle-check-big",
          title: "Certificado oficial",
          description: "Al terminar el curso",
          color: "primary",
        },
        {
          icon: "boxicons:brain",
          title: "Workshops de IA",
          description: "Gratis y de por vida",
          color: "red",
        },
      ],
    }
  ],
};

// ─── QUIÉNES SOMOS ──────────────────────────────────────────────────────────
export const about: AboutSection = {
  badge: "¿Quiénes somos?",
  title: "Educación que entiende su formación",
  paragraphs: [
    {
      segments: [
        { text: "Somos una formación que sabe lo que es " },
        { text: "querer crecer profesionalmente sin dejar atrás el bienestar personal.", highlight: true },
      ],
    },
    {
      segments: [
        { text: "Por eso creamos IESL Institute: cursos que no te vacían el bolsillo, " },
        { text: "con horarios flexibles que respetan su vida", highlight: true },
        { text: " y con workshops de IA incluidos para potenciar tu trabajo." },
      ],
    },
  ],
  closing: "No somos una institución más. Somos tu aliado.",
  features: [
    {
      icon: "basil:book-outline",
      title: "Formación profesional",
      description:
        "Cursos accesibles enfocados en habilidades aplicables al mundo laboral real.",
      color: "primary",
    },
    {
      icon: "octicon:people-16",
      title: "Comunidad",
      description:
        "Networking genuino, grupos de estudiantes y encuentros que generan oportunidades.",
      color: "purple",
    },
    {
      icon: "boxicons:brain",
      title: "Crecimiento humano",
      description:
        "Talleres de inteligencia emocional, comunicación y liderazgo colaborativo.",
      color: "orange",
    },
    {
      icon: "mdi:rocket-launch-outline",
      title: "IA aplicada a tu trabajo",
      description:
        "Workshops y micro cursos de IA gratis y de por vida para potenciar tu trabajo en cualquier área.",
      color: "red",
    },
  ],
};

// ─── COMUNIDAD ──────────────────────────────────────────────────────────────
export const community: CommunitySection = {
  badge: "Comunidad IESL",
  title: { static: "No estudias solo.", highlight: "Creces en comunidad." },
  description:
    "Al unirse a IESL accedes a una comunidad real de estudiantes y profesionales que comparten objetivos, se apoyan y se conectan para generar oportunidades.",
  items: [
    { icon: "gravity-ui:comment", text: "Grupos de intercambio por curso" },
    { icon: "akar-icons:calendar",            text: "Workshops y eventos mensuales" },
    { icon: "ci:globe",                       text: "Networking online y offline" },
    { icon: "ph:user-check-bold",             text: "Talleres de desarrollo humano" },
  ],
  floatingBadges: [
    { icon: "fluent:people-team-20-regular", title: "+500",       description: "Conexiones activas",        color: "red", image: claseOnline },
    { icon: "ph:user-rectangle",             title: "+10 talleres", description: "De desarrollo humano",    color: "purple", image: manosEstrechadas },
  ],
  cta: { text: "Conocer la comunidad", href: ROUTES.COMMUNITY },
};

// ─── BIENESTAR ──────────────────────────────────────────────────────────────
export const wellness: WellnessSection = {
  badge: "Incluído con su curso",
  title: { static: "Más que un curso:", highlight: "potenciá tu trabajo con inteligencia artificial." },
  description:
    "Al inscribirte a cualquier curso IESL sumás workshops de IA totalmente gratis y de por vida, pensados para que potencies tu trabajo y aprendas a usar inteligencia artificial y herramientas tecnológicas, sin importar tu área ni tu nivel técnico.",
  slides: [
    [
      { icon: "boxicons:brain", title: "Prompt Engineering para IA", description: "Workshop gratis y de por vida", color: "primary", image: workshopPromptEngineering },
      { icon: "fluent:code-24-regular", title: "Vibe coding", description: "Crea apps sin saber programar — gratis", color: "purple", image: workshopVibeCoding },
    ],
    [
      { icon: "boxicons:thunder", title: "Automatización de procesos", description: "Automatiza tu trabajo — gratis", color: "orange", image: workshopAutomatizacion },
      { icon: "mdi:clock-outline", title: "Acceso de por vida", description: "Tus cursos y workshops, para siempre", color: "red", image: accesoDeporvida },
    ],
    [
      { icon: "octicon:graph-16", title: "Análisis de datos con IA", description: "Decisiones sin saber programar — gratis", color: "red", image: workshopAnalisisDatos },
      { icon: "fluent:design-ideas-24-regular", title: "Creación de contenido con IA", description: "Textos, imágenes y más — gratis", color: "primary", image: workshopContenidoIa },
    ]
  ],
};

// ─── TESTIMONIOS ────────────────────────────────────────────────────────────
export const testimonials: TestimonialCard[] = [
  {
    quote:
      "IESL ha cambiado mi forma de ver la educación. El curso fue increíble, pero lo que más me sorprendió fue la comunidad. Conecté con gente que hoy son colegas y amigos.",
    highlight: "“La comunidad lo cambia todo”",
    name: "Juliana Gonzáles",
    role: "Estudiante de contabilidad",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote:
      "Gracias al curso de UX conseguí mi primer trabajo. El precio era accesible, los horarios se adaptaron a mis tiempos y el contenido era exactamente lo que necesitaba.",
    highlight: "“Conseguí mi primer trabajo”",
    name: "Martín Gómez",
    role: "Diseñador UX, recién egresado",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote:
      "El taller de inteligencia emocional fue un antes y un después. No esperaba que una plataforma de cursos me ofreciera algo así. IESL es diferente, y se nota.",
    highlight: "“Un antes y un después”",
    name: "Carolina Ruíz",
    role: "Joven profesional de RRHH",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

// ─── FAQ ────────────────────────────────────────────────────────────────────
export const faqs: Faq[] = [
  {
    question: "¿Los cursos son 100% online?",
    answer:
      "Sí, los cursos son 100% online y en vivo, con sesiones dinámicas y orientadas a tu crecimiento profesional.",
  },
  {
    question: "¿Incluyen certificado?",
    answer:
      "Sí. Incluimos certificados modulares con ID de autenticidad y visibles en LinkedIn, para que puedas avanzar en tu carrera.",
  },
  {
    question: "¿Qué pasa si no puedo ver las clases en vivo?",
    answer:
      "Las grabaciones quedan disponibles en el aula virtual hasta 1 año después de la finalización del curso.",
  },
  {
    question: "¿Los beneficios se activan automáticamente?",
    answer:
      "Sí. Desde nuestra comunidad tenés acceso a todos nuestros workshops y micro cursos en inteligencia artificial.",
  },
  {
    question: "¿Puedo hacer más de un curso a la vez?",
    answer:
      "Claro. Los cursos se complementan entre sí y te permiten alcanzar certificaciones progresivas, todas visibles desde tu perfil público de estudiante.",
  },
];

// ─── FORMULARIO / CTA FINAL ─────────────────────────────────────────────────
export const contactForm: ContactSection = {
  title: { static: "Tu futuro no tiene que", highlight: "costarte el presente" },
  description: "Empieza hoy con cursos accesibles, comunidad activa y beneficios de bienestar. ",
  closing: "Crece siendo tú",
  formTitle: { static: "Déjanos tus datos y", highlight: "te contactamos" },
  formDescription:
    "Un asesor de IESL te va a ayudar a encontrar el curso ideal para ti, sin compromisos.",
  countries: ["Argentina", "México", "Colombia"],
  submitText: "Quiero agendar una llamada",
  privacyNote: "*Tus datos están protegidos según nuestra política de privacidad.",
};