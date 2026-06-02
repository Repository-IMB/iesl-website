// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypePromptPlaceholders from './src/lib/rehype-prompt-placeholders.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://ieslinstitute.com',
  image: {
    domains: ["i.pravatar.cc"],
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Poppins",
      cssVariable: "--font-poppins",
    },
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-inter",
    }
  ],
  integrations: [icon(), sitemap(), mdx()],
  markdown: {
    rehypePlugins: [rehypePromptPlaceholders],
  },
  vite: {
    plugins: [tailwindcss()],
    // Pre-empaqueta estas deps al arrancar el dev server (evita el "reload"
    // a mitad de navegación la primera vez que se monta el formulario de contacto).
    optimizeDeps: {
      include: ["intl-tel-input", "intl-tel-input/utils"],
    },
  },
});
