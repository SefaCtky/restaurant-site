import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Star } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function AccueilPage({
  supabase,
  fermetureActive,
  annonceSite,
  whatsappNumber,
  showPage,
  LOGO,
  restaurantAddress,
  phoneNumber,
}) {
  const [avisValides, setAvisValides] = useState([]);
  const [avisLoading, setAvisLoading] = useState(false);
  const [avisMessage, setAvisMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [nouvelAvis, setNouvelAvis] = useState({
    nom: "",
    prenom: "",
    note: 5,
    commentaire: "",
  });

  const chargerAvisValides = async () => {
    const { data, error } = await supabase
      .from("avis_clients")
      .select("*")
      .eq("actif", true)
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setAvisValides(data || []);
  };

  const chargerUtilisateur = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUser(user || null);

    if (!user) {
      setCurrentProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nom, prenom, nom_famille, email, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setCurrentProfile(null);
      return;
    }

    setCurrentProfile(data || null);
    setNouvelAvis((current) => ({
      ...current,
      prenom: data?.prenom || "",
      nom: data?.nom_famille || data?.nom || "",
    }));
  };

  useEffect(() => {
    chargerAvisValides();
    chargerUtilisateur();
  }, []);

  const formatDateAvis = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getNomAvis = (avis) => {
    const prenom = avis?.prenom || "";
    const nom = avis?.nom || "";

    if (prenom && nom) return `${prenom} ${nom}`;
    if (nom) return nom;
    if (prenom) return prenom;

    return "Client Chez Omer";
  };

  const envoyerAvis = async () => {
    setAvisMessage("");
    setAvisLoading(true);

    const prenomFinal = (currentProfile?.prenom || nouvelAvis.prenom).trim();
    const nomFinal = (currentProfile?.nom_famille || currentProfile?.nom || nouvelAvis.nom).trim();
    const commentaireFinal = nouvelAvis.commentaire.trim();
    const noteFinal = Number(nouvelAvis.note);

    if (!prenomFinal || !nomFinal || !commentaireFinal) {
      setAvisMessage("Merci de renseigner votre nom, prénom et commentaire ❌");
      setAvisLoading(false);
      return;
    }

    if (noteFinal < 1 || noteFinal > 5) {
      setAvisMessage("La note doit être entre 1 et 5 ❌");
      setAvisLoading(false);
      return;
    }

    const { error } = await supabase.from("avis_clients").insert({
      user_id: currentUser?.id || null,
      prenom: prenomFinal,
      nom: nomFinal,
      note: noteFinal,
      commentaire: commentaireFinal,
      statut: "en_attente",
      actif: false,
      ordre: 999,
    });

    if (error) {
      console.error(error);
      setAvisMessage(`Erreur lors de l'envoi de l'avis : ${error.message} ❌`);
      setAvisLoading(false);
      return;
    }

    setAvisMessage("Merci ! Votre avis est envoyé et sera visible après validation ✅");
    setNouvelAvis((current) => ({
      ...current,
      note: 5,
      commentaire: "",
      prenom: currentProfile?.prenom || "",
      nom: currentProfile?.nom_famille || currentProfile?.nom || "",
    }));
    setAvisLoading(false);
  };

  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {annonceSite && (
            <div className="mb-8 overflow-hidden rounded-full bg-yellow-400 px-6 py-4 font-black text-black shadow-[0_0_40px_rgba(250,204,21,0.35)]">
              <div
                className="whitespace-nowrap text-xl"
                style={{ animation: "reservationMarquee 12s linear infinite" }}
              >
                🔥 {annonceSite}
              </div>
            </div>
          )}

          {fermetureActive && (
            <div className="mb-6 rounded-3xl border border-red-500/40 bg-red-600/20 p-5 font-black text-red-200">
              Le restaurant est actuellement fermé exceptionnellement. Les commandes en ligne sont temporairement désactivées.
            </div>
          )}

          <div className="inline-flex rounded-full border border-yellow-500/30 bg-black/60 px-6 py-3 font-black text-yellow-300">
            Restaurant HALAL • Le kebab fait maison
          </div>

          <h1 className="mt-8 text-6xl font-black uppercase leading-none text-white md:text-8xl">
            Chez Omer
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text text-transparent">
              Restaurant
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-2xl font-bold leading-relaxed text-white">
            Viande sélectionnée, fait maison, cuisson maîtrisée et qualité premium. Sur place ou à emporter à Sevenans.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => showPage("Menu")}
              className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black shadow-xl hover:bg-yellow-300"
            >
              Voir le menu
            </button>

            <button
              onClick={() => showPage("Commande")}
              className="rounded-full border border-yellow-500/40 bg-black px-8 py-4 font-black text-white hover:bg-white/10"
            >
              Commander
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-full bg-yellow-500/20 blur-3xl" />
          <img src={LOGO} alt="Chez Omer" className="relative mx-auto max-h-[520px] w-full object-contain" />
          <div className="absolute bottom-6 right-6 rounded-full border border-yellow-500 bg-black/80 px-5 py-4 text-center font-black text-yellow-300">
            حلال<br />HALAL
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
            <MapPin className="text-yellow-400" />
            <h3 className="mt-4 text-xl font-black text-white">Adresse</h3>
            <p className="mt-2 text-stone-300">{restaurantAddress}</p>
          </div>

          <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
            <Phone className="text-yellow-400" />
            <h3 className="mt-4 text-xl font-black text-white">Téléphone</h3>
            <p className="mt-2 text-stone-300">{phoneNumber}</p>
          </div>

          <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
            <h3 className="text-xl font-black text-white">Commande WhatsApp</h3>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-full bg-green-600 px-6 py-3 font-black text-white hover:bg-green-500"
            >
              Contacter
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <PageTitle
          eyebrow="Avis clients"
          title="Ils ont goûté Chez Omer"
          text="Les avis affichés ici sont validés par l'équipe Chez Omer."
        />

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {avisValides.length === 0 ? (
            <p className="text-stone-400">Aucun avis validé pour le moment.</p>
          ) : (
            avisValides.slice(0, 6).map((avis) => (
              <div key={avis.id} className="rounded-3xl border border-yellow-500/20 bg-black/60 p-6">
                <div className="flex gap-1 text-yellow-400">
                  {Array.from({ length: Number(avis.note) || 5 }).map((_, index) => (
                    <Star key={index} size={18} fill="currentColor" />
                  ))}
                </div>

                <p className="mt-4 text-lg font-bold text-white">“{avis.commentaire}”</p>

                <p className="mt-4 font-black text-yellow-300">
                  {getNomAvis(avis)}
                </p>

                <p className="text-sm text-stone-400">
                  Avis du {formatDateAvis(avis.validated_at || avis.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-[2rem] border border-yellow-500/20 bg-white/5 p-8">
          <h2 className="text-3xl font-black text-yellow-300">Laisser un avis</h2>
          <p className="mt-2 text-stone-300">Votre avis sera publié après validation par l'admin.</p>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Prénom"
                value={currentProfile?.prenom || nouvelAvis.prenom}
                disabled={Boolean(currentProfile?.prenom)}
                onChange={(e) =>
                  setNouvelAvis((current) => ({
                    ...current,
                    prenom: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400 disabled:opacity-70"
              />

              <input
                type="text"
                placeholder="Nom"
                value={currentProfile?.nom_famille || currentProfile?.nom || nouvelAvis.nom}
                disabled={Boolean(currentProfile?.nom_famille || currentProfile?.nom)}
                onChange={(e) =>
                  setNouvelAvis((current) => ({
                    ...current,
                    nom: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400 disabled:opacity-70"
              />
            </div>

            <select
              value={nouvelAvis.note}
              onChange={(e) =>
                setNouvelAvis((current) => ({
                  ...current,
                  note: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
            >
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>

            <textarea
              placeholder="Votre avis..."
              value={nouvelAvis.commentaire}
              onChange={(e) =>
                setNouvelAvis((current) => ({
                  ...current,
                  commentaire: e.target.value,
                }))
              }
              className="min-h-32 w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
            />

            <button
              onClick={envoyerAvis}
              disabled={avisLoading}
              className="w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {avisLoading ? "Envoi..." : "Envoyer mon avis"}
            </button>

            {avisMessage && <p className="text-center font-bold text-white">{avisMessage}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
