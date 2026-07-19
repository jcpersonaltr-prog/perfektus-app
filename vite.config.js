import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serve o site num subcaminho (ex: /perfektus-app/) —
// ajusta "base" para o nome do teu repositório GitHub.
// GitHub Pages serve em /perfektus-app/ — em desenvolvimento local o Vite ignora isto? Não:
// usamos variável: produção = /perfektus-app/, dev local = /
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/perfektus-app/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Método Perfektus",
        short_name: "Perfektus",
        description: "Ficha de treino, progressão e check-in diário.",
        theme_color: "#0A0A0A",
        background_color: "#0A0A0A",
        display: "standalone",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
}));
