
import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "../supabase";

const CONSENT_KEY = "chezomer_marketing_consent_v1";
const TOKEN_KEY = "chezomer_fcm_token_v1";

export default function NotificationsPromo() {
  const isAndroid =
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android";

  useEffect(() => {
    if (!isAndroid) return;

    let stopped = false;
    const listeners = [];

    function logError(label, error) {
      console.error(label, error);
      console.error("Type :", error?.name);
      console.error("Message :", error?.message);

      if (error?.cause) {
        console.error("Cause :", error.cause);
      }
    }

    async function getSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data.session) {
        console.log("Supabase : session existante disponible");
        return data.session;
      }

      console.log("Supabase : création d'une session anonyme");

      const result = await supabase.auth.signInAnonymously();

      if (result.error) throw result.error;

      if (!result.data.session) {
        throw new Error("Session anonyme indisponible");
      }

      console.log("Supabase : session anonyme créée");

      return result.data.session;
    }

    async function callRegisterPush(body, session) {
      console.log("Appel de la fonction register-push");
      console.log("URL Supabase :", supabase.supabaseUrl);
      console.log("Session disponible :", !!session?.access_token);
      console.log("Action :", body.action);

      const { data, error } = await supabase.functions.invoke("rapid-handler",
                {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body,
        }
      );

      if (error) {
        logError("Erreur Edge Function :", error);

        if (error.context) {
          console.error(
            "Statut HTTP :",
            error.context.status ?? "Indisponible"
          );

          if (typeof error.context.clone === "function") {
            try {
              const responseText =
                await error.context.clone().text();

              console.error(
                "Réponse serveur :",
                responseText
              );
            } catch (readError) {
              console.error(
                "Impossible de lire la réponse serveur",
                readError
              );
            }
          }
        }

        throw error;
      }

      if (!data?.success) {
        console.error("Réponse register-push :", data);
        throw new Error(
          data?.error || "Enregistrement refusé par Supabase"
        );
      }

      console.log("register-push : opération réussie");

      return data;
    }

    async function saveToken(token) {
      if (stopped) return;

      if (!token) {
        console.error("Firebase : jeton vide");
        return;
      }

      const consent = localStorage.getItem(CONSENT_KEY);

      if (consent !== "yes") {
        console.log(
          "Notifications : aucun consentement promotionnel"
        );
        return;
      }

      console.log("Firebase : jeton disponible");

      const session = await getSession();

      if (stopped) return;

      await callRegisterPush(
        {
          action: "subscribe",
          token,
          marketing_consent: true,
        },
        session
      );

      if (stopped) return;

      localStorage.setItem(TOKEN_KEY, token);

      console.log(
        "Téléphone enregistré dans Supabase. " +
        "Notifications promotionnelles activées !"
      );
    }

    async function init() {
      try {
        const registrationListener =
          await PushNotifications.addListener(
            "registration",
            async ({ value }) => {
              try {
                console.log(
                  "Firebase : enregistrement du téléphone réussi"
                );

                await saveToken(value);
              } catch (error) {
                logError("Inscription Supabase :", error);

                console.error(
                  "Firebase fonctionne, mais l'inscription " +
                  "Supabase a échoué."
                );
              }
            }
          );

        listeners.push(registrationListener);

        const errorListener =
          await PushNotifications.addListener(
            "registrationError",
            (error) => {
              logError("Erreur Firebase :", error);
            }
          );

        listeners.push(errorListener);

        if (stopped) return;

        let consent = localStorage.getItem(CONSENT_KEY);

        if (!consent) {
          const accepted = window.confirm(
            "Chez Omer souhaite vous envoyer des " +
            "notifications promotionnelles : offres " +
            "spéciales et nouveautés.\n\n" +
            "Acceptez-vous de les recevoir ?\n\n" +
            "Vous pourrez retirer votre accord " +
            "à tout moment."
          );

          consent = accepted ? "yes" : "no";

          localStorage.setItem(CONSENT_KEY, consent);
        }

        if (consent !== "yes") {
          console.log(
            "Notifications promotionnelles refusées"
          );
          return;
        }

        console.log(
          "Notifications : consentement promotionnel accepté"
        );

        let permission =
          await PushNotifications.checkPermissions();

        if (permission.receive !== "granted") {
          permission =
            await PushNotifications.requestPermissions();
        }

        if (stopped) return;

        if (permission.receive !== "granted") {
          console.warn(
            "Notifications : autorisation Android refusée"
          );
          return;
        }

        console.log(
          "Notifications : autorisation Android accordée"
        );

        console.log(
          "Firebase : demande d'enregistrement du téléphone"
        );

        await PushNotifications.register();
      } catch (error) {
        logError("Notifications Chez Omer :", error);
      }
    }

    init();

    return () => {
      stopped = true;

      listeners.forEach((listener) => {
        listener.remove();
      });
    };
  }, [isAndroid]);

  // Aucun encadré visible sur la page d'accueil.
  return null;
}
