import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function ConnexionPage({ supabase, verifierSession, setActivePage }) {
  const [mode, setMode] = useState("connexion");

  const [identifiant, setIdentifiant] = useState("");
  const [emailInscription, setEmailInscription] = useState("");
  const [telephoneInscription, setTelephoneInscription] = useState("");
  const [prenomInscription, setPrenomInscription] = useState("");
  const [nomInscription, setNomInscription] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [loadingConnexion, setLoadingConnexion] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [messageConnexion, setMessageConnexion] = useState("");

  const nettoyerTelephone = (value) => value.replace(/\s/g, "").trim();
  const isEmail = (value) => value.includes("@");

  const resetMessages = () => setMessageConnexion("");

  const connexionGoogle = async () => {
    setLoadingGoogle(true);
    setMessageConnexion("");

    const redirectUrl = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error(error);
      setMessageConnexion(`Erreur connexion Google : ${error.message} ❌`);
      setLoadingGoogle(false);
    }
  };

  const connexion = async () => {
    setLoadingConnexion(true);
    setMessageConnexion("");

    const identifiantTrim = identifiant.trim();
    let emailConnexion = identifiantTrim.toLowerCase();

    if (!identifiantTrim || !password) {
      setMessageConnexion("Veuillez remplir tous les champs ❌");
      setLoadingConnexion(false);
      return;
    }

    if (!isEmail(identifiantTrim)) {
      const phoneClean = nettoyerTelephone(identifiantTrim);

      const { data: profil, error: profilError } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", phoneClean)
        .maybeSingle();

      if (profilError || !profil?.email) {
        setMessageConnexion("Téléphone introuvable ❌");
        setLoadingConnexion(false);
        return;
      }

      emailConnexion = profil.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailConnexion,
      password,
    });

    if (error) {
      setMessageConnexion("Identifiant ou mot de passe incorrect ❌");
      setLoadingConnexion(false);
      return;
    }

    const role = await verifierSession();

    setMessageConnexion("Connexion réussie ✅");

    setTimeout(() => {
      if (role === "admin") {
        setActivePage("Admin");
      } else if (role === "employe") {
        setActivePage("Pointage");
      } else {
        setActivePage("Accueil");
      }
    }, 800);

    setLoadingConnexion(false);
  };

  const inscription = async () => {
    setLoadingConnexion(true);
    setMessageConnexion("");

    const emailClean = emailInscription.trim().toLowerCase();
    const phoneClean = nettoyerTelephone(telephoneInscription);
    const prenomClean = prenomInscription.trim();
    const nomClean = nomInscription.trim();

    if (!prenomClean || !nomClean || !emailClean || !phoneClean || !password || !passwordConfirmation) {
      setMessageConnexion("Veuillez remplir tous les champs ❌");
      setLoadingConnexion(false);
      return;
    }

    if (!emailClean.includes("@")) {
      setMessageConnexion("Adresse email invalide ❌");
      setLoadingConnexion(false);
      return;
    }

    if (phoneClean.length < 8) {
      setMessageConnexion("Numéro de téléphone invalide ❌");
      setLoadingConnexion(false);
      return;
    }

    if (password.length < 6) {
      setMessageConnexion("Le mot de passe doit contenir au moins 6 caractères ❌");
      setLoadingConnexion(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setMessageConnexion("Les mots de passe ne correspondent pas ❌");
      setLoadingConnexion(false);
      return;
    }

    const { data: phoneExiste } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", phoneClean)
      .maybeSingle();

    if (phoneExiste) {
      setMessageConnexion("Ce numéro de téléphone est déjà utilisé ❌");
      setLoadingConnexion(false);
      return;
    }

    // 1. Inscription dans Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: emailClean,
      password,
      options: {
        data: {
          prenom: prenomClean,
          nom: nomClean,
          nom_famille: nomClean,
          full_name: `${prenomClean} ${nomClean}`,
          phone: phoneClean,
        },
      },
    });

    if (error) {
      setMessageConnexion(`Erreur création compte Auth : ${error.message} ❌`);
      setLoadingConnexion(false);
      return;
    }

    const userId = data?.user?.id;

    if (!userId) {
      setMessageConnexion("Compte créé. Vérifiez votre email pour confirmer l'inscription ✅");
      setLoadingConnexion(false);
      return;
    }

    // 2. CORRECTION ICI : On alimente explicitement les colonnes prenom et nom_famille
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email: emailClean,
      phone: phoneClean,
      prenom: prenomClean,      // Envoie la valeur dans ta colonne prenom
      nom_famille: nomClean,    // Envoie la valeur dans ta colonne nom_famille
      nom: `${prenomClean} ${nomClean}`,
      role: "client",
    });

    if (profileError) {
      setMessageConnexion(`Compte créé, mais profil client non enregistré : ${profileError.message} ❌`);
      setLoadingConnexion(false);
      return;
    }

    setMessageConnexion("Compte client créé avec succès ✅");

    setTimeout(() => {
      setMode("connexion");
      setIdentifiant(emailClean);
      setEmailInscription("");
      setTelephoneInscription("");
      setPrenomInscription("");
      setNomInscription("");
      setPassword("");
      setPasswordConfirmation("");
    }, 1000);

    setLoadingConnexion(false);
  };

  const envoyerResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes("@")) {
      setMessageConnexion("Adresse email invalide ❌");
      return;
    }

    setResetLoading(true);
    setMessageConnexion("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim().toLowerCase(),
      {
        redirectTo: window.location.origin + "/reset-password",
      }
    );

    setResetLoading(false);

    if (error) {
      setMessageConnexion(`Erreur : ${error.message} ❌`);
      return;
    }

    setResetModalOpen(false);
    setMessageConnexion("Email de réinitialisation envoyé ✅");
  };

  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Compte"
        title={mode === "connexion" ? "Connexion" : "Créer un compte"}
        text={mode === "connexion" ? "Connectez-vous à votre espace Chez Omer." : "Créez votre compte client Chez Omer."}
      />

      <div className="mx-auto max-w-md rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-full bg-stone-950 p-2">
          <button
            onClick={() => {
              setMode("connexion");
              resetMessages();
              setPassword("");
              setPasswordConfirmation("");
            }}
            className={`rounded-full px-4 py-3 font-black transition ${
              mode === "connexion" ? "bg-yellow-400 text-black" : "text-white hover:bg-white/10"
            }`}
          >
            Connexion
          </button>

          <button
            onClick={() => {
              setMode("inscription");
              resetMessages();
              setPassword("");
              setPasswordConfirmation("");
            }}
            className={`rounded-full px-4 py-3 font-black transition ${
              mode === "inscription" ? "bg-yellow-400 text-black" : "text-white hover:bg-white/10"
            }`}
          >
            Inscription
          </button>
        </div>

        <h2 className="text-3xl font-black text-yellow-300">
          {mode === "connexion" ? "Se connecter" : "Créer un compte"}
        </h2>

        <div className="mt-6 space-y-4">
          <button
            onClick={connexionGoogle}
            disabled={loadingGoogle || loadingConnexion}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white px-6 py-4 font-black text-black transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xl font-black text-black">
              G
            </span>
            {loadingGoogle ? "Connexion Google..." : "Continuer avec Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-yellow-500/20" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
              ou
            </span>
            <div className="h-px flex-1 bg-yellow-500/20" />
          </div>

          {mode === "connexion" ? (
            <>
              <input
                type="text"
                placeholder="Email ou téléphone"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 pr-14 text-white outline-none focus:border-yellow-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetEmail(identifiant.includes("@") ? identifiant : "");
                  setResetModalOpen(true);
                }}
                className="text-sm font-bold text-yellow-300 hover:text-yellow-200"
              >
                Mot de passe oublié ?
              </button>

              <button
                onClick={connexion}
                disabled={loadingConnexion || loadingGoogle}
                className="w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingConnexion ? "Connexion..." : "Connexion"}
              </button>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={prenomInscription}
                  onChange={(e) => setPrenomInscription(e.target.value)}
                  className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
                />

                <input
                  type="text"
                  placeholder="Nom"
                  value={nomInscription}
                  onChange={(e) => setNomInscription(e.target.value)}
                  className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <input
                type="email"
                placeholder="Adresse email"
                value={emailInscription}
                onChange={(e) => setEmailInscription(e.target.value)}
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
              />

              <input
                type="tel"
                placeholder="Numéro de téléphone"
                value={telephoneInscription}
                onChange={(e) => setTelephoneInscription(e.target.value)}
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
              />

              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
              />

              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") inscription();
                }}
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
              />

              <button
                onClick={inscription}
                disabled={loadingConnexion || loadingGoogle}
                className="w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingConnexion ? "Création..." : "Créer mon compte"}
              </button>
            </>
          )}

          {messageConnexion && <p className="text-center font-bold text-white">{messageConnexion}</p>}
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 px-5">
          <div className="w-full max-w-md rounded-[2rem] border border-yellow-500/20 bg-stone-950 p-6 text-white">
            <h2 className="text-2xl font-black text-yellow-300">
              Mot de passe oublié
            </h2>

            <p className="mt-2 text-sm text-stone-400">
              Entrez votre adresse email. Vous recevrez un lien pour modifier votre mot de passe.
            </p>

            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="mt-5 w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="flex-1 rounded-full bg-white/10 px-5 py-3 font-black text-white hover:bg-white/20"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={resetLoading}
                onClick={envoyerResetPassword}
                className="flex-1 rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                {resetLoading ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}