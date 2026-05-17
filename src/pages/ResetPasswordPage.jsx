import React, { useState } from "react";

export default function ResetPasswordPage({ supabase }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const changerMotDePasse = async () => {
    setMessage("");

    if (!password || !passwordConfirmation) {
      setMessage("Veuillez remplir les deux champs ❌");
      return;
    }

    if (password.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères ❌");
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage("Les mots de passe ne correspondent pas ❌");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(`Erreur : ${error.message} ❌`);
      setLoading(false);
      return;
    }

    setMessage("Mot de passe modifié avec succès ✅");

    setTimeout(() => {
      window.location.href = "/";
    }, 1500);

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black px-5 py-16 text-white">
      <div className="mx-auto max-w-md rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
        <h1 className="text-3xl font-black text-yellow-300">
          Nouveau mot de passe
        </h1>

        <p className="mt-3 text-stone-400">
          Choisissez votre nouveau mot de passe.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
          />

          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
          />

          <button
            onClick={changerMotDePasse}
            disabled={loading}
            className="w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300 disabled:opacity-60"
          >
            {loading ? "Modification..." : "Modifier mon mot de passe"}
          </button>

          {message && (
            <p className="text-center font-bold text-white">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}