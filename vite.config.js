import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Chez Omer",
        short_name: "Chez Omer",
        description: "Commandez vos meilleurs Tacos, Burgers et Sandwichs Chez Omer à Belfort",
        theme_color: "#000000", // Couleur de la barre d'état sur téléphone (noir pour coller à ton thème)
        background_color: "#000000",
        display: "standalone", // Force l'ouverture en mode application (sans barres de navigateur)
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable" // Permet à Android d'adapter la forme de l'icône (ronde, carrée...)
          }
        ]
      }
    })
  ]
});