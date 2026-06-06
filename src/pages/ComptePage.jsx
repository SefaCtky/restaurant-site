import React, { useState, useEffect } from "react";
import PageTitle from "../components/PageTitle";

export default function ComptePage({ supabase, session, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profil, setProfil] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: ""
  });

  // Charger les infos du profil depuis Supabase
  useEffect(() => {
    if (session?.user) {
      getProfil();
    }
  }, [session]);

  async function getProfil() {
    try {
      setLoading(true);
      const { user } = session;

      const { data, error, status } = await supabase
        .from("profiles")
        .select("nom, prenom, telephone")
        .eq("id", user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfil({
          nom: data.nom || "",
          prenom: data.prenom || "",
          telephone: data.telephone || "",
          email: user.email || ""
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du profil :", error.message);
    } finally {
      setLoading(false);
    }
  }

  // Sauvegarder les modifications dans Supabase
  async function mettreAJourProfil(e) {
    e.preventDefault();
    try {
      setUpdating(true);
      const { user } = session;

      const updates = {
        id: user.id,
        nom: profil.nom,
        prenom: profil.prenom,
        telephone: profil.telephone,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      alert("Profil mis à jour avec succès ! Éœ");
    } catch (error) {
      alert("Erreur lors de la mise à jour ! ❌");
      console.error(error.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black">
        Chargement de votre espace...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white px-5 py-16">
      {/* Arrière-plan Ihlara uniforme avec ton site */}
      <div 
        className="absolute inset-0 -z-10 w-full h-full bg-cover bg-center grayscale opacity-20 blur-[3px]"
        style={{ backgroundImage: "url('/ihlara.png')" }}
      />
      <div className="absolute inset-0 -z-15 bg-gradient-to-b from-black via-black/50 to-black" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-10">
        <PageTitle
          eyebrow="Espace Personnel"
          title="MON COMPTE CHEZ OMER"
          text="Gérez vos informations personnelles pour vos prochaines commandes."
        />

        <div className="rounded-[2rem] bg-black/70 border border-white/10 p-8 md:p-12 backdrop-blur-md shadow-2xl">
          <h3 className="text-2xl font-black text-yellow-400 tracking-tight mb-6">Mes Informations</h3>
          
          <form onSubmit={mettreAJourProfil} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Prénom */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-400">Prénom</label>
                <input
                  type="text"
                  value={profil.prenom}
                  onChange={(e) => setProfil({ ...profil, prenom: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-400 transition"
                  placeholder="Votre prénom"
                />
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-400">Nom</label>
                <input
                  type="text"
                  value={profil.nom}
                  onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-400 transition"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-400">Numéro de téléphone</label>
              <input
                type="tel"
                value={profil.telephone}
                onChange={(e) => setProfil({ ...profil, telephone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-yellow-400 transition"
                placeholder="Ex: 0612345678"
              />
            </div>

            {/* Email (Lecture seule) */}
            <div className="space-y-2 opacity-60">
              <label className="text-sm font-bold text-stone-400">Adresse Email (Non modifiable)</label>
              <input
                type="email"
                value={profil.email}
                disabled
                className="w-full bg-stone-900 border border-white/5 rounded-2xl px-4 py-3.5 text-stone-400 cursor-not-allowed"
              />
            </div>

            {/* Boutons d'actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <button
                type="submit"
                disabled={updating}
                className="w-full sm:w-auto rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-black px-8 py-3.5 tracking-wide transition uppercase text-sm disabled:opacity-50"
              >
                {updating ? "Enregistrement..." : "Sauvegarder les modifications"}
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="text-sm font-bold text-red-400 hover:text-red-300 transition tracking-wider uppercase underline underline-offset-4"
              >
                Se déconnecter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}