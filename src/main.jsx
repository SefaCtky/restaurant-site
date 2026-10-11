
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";

import "./index.css";
import App from "./App.jsx";

// Détecter l'application mobile native
const isNativeApp = Capacitor.isNativePlatform();

// Afficher l'application React
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Gestion du service worker uniquement sur le site web
if (!isNativeApp) {
  registerSW();
} else {
  // Supprimer les anciens service workers enregistrés
  // dans la WebView Android
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });

        console.log(
          "Chez Omer Android : anciens service workers désactivés"
        );
      })
      .catch((error) => {
        console.error(
          "Erreur de suppression des service workers :",
          error
        );
      });
  }
}
