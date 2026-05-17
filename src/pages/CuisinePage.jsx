import React, { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function CuisinePage({
  supabase,
  formatPrice,
}) {
  const [commandes, setCommandes] = useState([]);
  const [heureActuelle, setHeureActuelle] = useState(Date.now());
  const [nouvelleCommande, setNouvelleCommande] = useState(null);
  const [commandeTempsSelection, setCommandeTempsSelection] = useState(null);
  const [modeCuisineActif, setModeCuisineActif] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const commandesConnuesRef = useRef(new Set());
  const premierChargementRef = useRef(true);
  const audioContextRef = useRef(null);
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const jouerSonCuisine = async () => {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const context =
      audioContextRef.current || new AudioContextClass();

    audioContextRef.current = context;

    if (context.state === "suspended") {
      await context.resume();
    }

    const beep = (delay, frequency) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "square";

      oscillator.frequency.setValueAtTime(
        frequency,
        context.currentTime + delay
      );

      gain.gain.setValueAtTime(
        0.001,
        context.currentTime + delay
      );

      gain.gain.exponentialRampToValueAtTime(
        0.7,
        context.currentTime + delay + 0.03
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + delay + 0.45
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + 0.5);
    };

    beep(0, 900);
    beep(0.55, 1200);
    beep(1.1, 900);
  };

  const chargerCommandes = async () => {
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .in("statut", ["En attente", "En préparation"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const nouvelles = (data || []).filter(
      (commande) => !commandesConnuesRef.current.has(commande.id)
    );

    if (!premierChargementRef.current && nouvelles.length > 0) {
      setNouvelleCommande(nouvelles[0]);
      jouerSonCuisine();

      setTimeout(() => {
        setNouvelleCommande(null);
      }, 7000);
    }

    (data || []).forEach((commande) => {
      commandesConnuesRef.current.add(commande.id);
    });

    premierChargementRef.current = false;

    const commandesTriees = [...(data || [])].sort((a, b) => {
      const prioriteA = a.mode_paiement === "Sur place" ? 1 : 0;
      const prioriteB = b.mode_paiement === "Sur place" ? 1 : 0;

      if (prioriteA !== prioriteB) {
        return prioriteB - prioriteA;
      }

      return (
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );
    });

    setCommandes(commandesTriees);
  };

  useEffect(() => {
    chargerCommandes();

    const interval = setInterval(() => {
      chargerCommandes();
      setHeureActuelle(Date.now());
    }, 3000);

    const channel = supabase
      .channel("cuisine-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commandes",
        },
        () => {
          chargerCommandes();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const activerModeCuisine = async () => {
    setModeCuisineActif(true);

    await jouerSonCuisine();

    if (
      !document.fullscreenElement &&
      document.documentElement.requestFullscreen
    ) {
      document.documentElement
        .requestFullscreen()
        .catch(() => {});
    }
  };

    const getTempsCommande = (dateCommande) => {
      const maintenant = heureActuelle;
      const creation = new Date(dateCommande).getTime();

      return Math.floor((maintenant - creation) / 60000);
    };

    const getTempsPreparation = (commande) => {
      if (!commande.temps_estime_at) return null;

      const debut = new Date(commande.temps_estime_at).getTime();
      const maintenant = heureActuelle;

      return Math.floor((maintenant - debut) / 60000);
    };

    const getNombreArticles = (commande) => {
      return (commande.contenu || []).reduce(
        (total, item) => total + (item.quantite || 0),
        0
      );
    };

  const getUrgenceStyle = (minutes) => {
    if (minutes >= 20) {
      return "border-red-500 bg-red-950/80 shadow-[0_0_70px_rgba(239,68,68,0.9)] scale-[1.01]";
    }

    if (minutes >= 10) {
      return "border-orange-400 bg-orange-950/60 shadow-[0_0_45px_rgba(251,146,60,0.65)]";
    }

    return "border-yellow-500/30 bg-black/70";
  };

  const modifierStatut = async (
    commandeId,
    statut,
    tempsEstime = null
  ) => {
    const updateData = { statut };

    if (tempsEstime !== null) {
      updateData.temps_estime_minutes = tempsEstime;
      updateData.temps_estime_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("commandes")
      .update(updateData)
      .eq("id", commandeId);

    if (error) {
      console.error(error);
      return;
    }

    chargerCommandes();
  };
const commandesPreparation = commandes.filter(
  (commande) =>
    commande.statut === "En attente" ||
    commande.statut === "En préparation"
);

const commandesPretes = [];

  const getTempsRestant = (commande) => {
  if (!commande.temps_estime_minutes || !commande.temps_estime_at) {
    return null;
  }

  if (commande.statut === "Prête") {
    return "Commande prête ✅";
  }

  const debut = new Date(commande.temps_estime_at).getTime();
  const fin = debut + commande.temps_estime_minutes * 60000;
  const restant = Math.max(0, Math.ceil((fin - heureActuelle) / 60000));

  if (restant <= 0) {
  return "⏰ EN RETARD";
}

return `Temps restant : ${restant} min`;
};

const getHeureCommande = (dateCommande) => {
  return new Date(dateCommande).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const renderCommande = (commande) => {
    const minutes = getTempsCommande(commande.created_at);

    return (
      <div
        key={commande.id}
        className={`rounded-3xl border-2 p-6 shadow-2xl transition-all duration-300
        ${getUrgenceStyle(minutes)}
        ${
          commande.mode_paiement === "Sur place"
            ? "xl:scale-[1.03]"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-3xl font-black text-white">
              #{commande.numero_commande || commande.id}
            </p>
            <p className="mt-2 text-lg font-bold text-stone-300">
              Arrivée à {getHeureCommande(commande.created_at)}
            </p>

            {commande.mode_paiement && (
              <p
                className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-black ${
                  commande.mode_paiement === "Sur place"
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-yellow-400 text-black"
                }`}
              >
                {commande.mode_paiement === "Sur place"
                  ? "🔥 SUR PLACE • PRIORITÉ ABSOLUE"
                  : "À EMPORTER"}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white">
                Total : {formatPrice(Number(commande.total || 0))}
              </span>
              <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white">
                {getNombreArticles(commande)} article
                {getNombreArticles(commande) > 1 ? "s" : ""}
              </span>          
            </div>

            <p
              className={`mt-3 text-5xl font-black ${
                getTempsRestant(commande)?.includes("RETARD")
                  ? "text-red-500 animate-pulse"
                  : "text-yellow-300"
              }`}
            >
              {getTempsRestant(commande)
                ? getTempsRestant(commande).replace("Temps restant : ", "")
                : `${minutes} min`}
            </p>

            {getTempsPreparation(commande) !== null && (
              <p className="mt-2 text-sm font-bold text-stone-400">
                En préparation depuis {getTempsPreparation(commande)} min
              </p>
            )}
          </div>

          <div className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
            {commande.statut}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {(commande.contenu || []).map((item, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white/5 p-4"
            >
              <p className="text-2xl font-black text-white">
                {item.quantite}x {item.nom}
              </p>

              {item.viandes?.length > 0 && (
                <div className="mt-3 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4">
                  <p className="text-sm font-black uppercase tracking-wide text-yellow-300">
                    Viandes
                  </p>

                  <p className="mt-2 text-2xl font-black text-yellow-200">
                    {item.viandes.map((v) => v.name || v.nom || v).join(" • ")}
                  </p>
                </div>
              )}

              {item.sans_sauce_fromagere && (
                <p className="mt-3 rounded-2xl border-2 border-red-500 bg-red-950/80 p-4 text-lg font-black text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.55)]">
                  🚨 ALLERGIE / LACTOSE : SANS SAUCE FROMAGÈRE
                </p>
              )}

              {item.supplement_cheddar && (
                <p className="mt-3 rounded-2xl border-2 border-yellow-400 bg-yellow-950/70 p-3 text-lg font-black text-yellow-200">
                  🧀 SUPPLÉMENT CHEDDAR
                </p>
              )}

              {item.sauces?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-black uppercase tracking-wide text-stone-400">
                    Sauces
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {item.sauces.map((sauce, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-white/10 px-4 py-2 text-lg font-black text-white"
                      >
                        {sauce}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.note && (
                <p className="mt-3 rounded-2xl border-2 border-red-500 bg-red-950/70 p-4 text-lg font-black text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.45)]">
                  ⚠️ NOTE CUISINE : {item.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            onClick={() => setCommandeTempsSelection(commande.id)}
            className="rounded-2xl bg-blue-600 py-4 text-lg font-black text-white hover:bg-blue-500"
          >
            Préparation
          </button>

          {commande.statut === "En préparation" && (
            <button
              onClick={() =>
                modifierStatut(
                  commande.id,
                  "Prête"
                )
              }
              className="rounded-2xl bg-green-600 py-4 text-lg font-black text-white hover:bg-green-500"
            >
              Prête
            </button>
          )}      
        </div>
      </div>
    );
  };
  
  return (
    <main className="min-h-screen bg-black p-6">
      <button
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-50 bg-black text-orange-500 p-3 rounded-full shadow-lg border border-orange-500 hover:scale-110 transition"
      >
        {fullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
      </button>
      {!modeCuisineActif && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
          <button
            onClick={activerModeCuisine}
            className="rounded-[3rem] border-4 border-yellow-400 bg-yellow-400 px-14 py-10 text-4xl font-black text-black shadow-[0_0_80px_rgba(250,204,21,0.6)] hover:bg-yellow-300"
          >
            CLIQUER POUR ACTIVER LE MODE CUISINE
          </button>
        </div>
      )}

      {nouvelleCommande && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-red-950/90 backdrop-blur-sm animate-pulse">
          <div className="rounded-[3rem] border-4 border-yellow-400 bg-black p-16 text-center shadow-[0_0_80px_red]">
            <p className="text-3xl font-black text-red-500">
              🚨 NOUVELLE COMMANDE 🚨
            </p>

            <p className="mt-6 text-7xl font-black text-white">
              #{nouvelleCommande.numero_commande || nouvelleCommande.id}
            </p>

            <p className="mt-6 text-5xl font-black text-yellow-300">
              {formatPrice(Number(nouvelleCommande.total || 0))}
            </p>
          </div>
        </div>
      )}

      {commandeTempsSelection && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-3xl border border-yellow-500 bg-black p-8">
            <h2 className="mb-6 text-center text-3xl font-black text-yellow-400">
              Temps estimé
            </h2>

            <div className="space-y-4">
              {[10, 20, 30].map((temps) => (
                <button
                  key={temps}
                  onClick={() => {
                    modifierStatut(
                      commandeTempsSelection,
                      "En préparation",
                      temps
                    );
                    setCommandeTempsSelection(null);
                  }}
                  className="w-full rounded-2xl bg-yellow-400 px-6 py-5 text-2xl font-black text-black hover:bg-yellow-300"
                >
                  {temps} min
                </button>
              ))}
            </div>

            <button
              onClick={() => setCommandeTempsSelection(null)}
              className="mt-6 w-full rounded-2xl bg-white/10 px-6 py-4 font-bold text-white"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            ÉCRAN CUISINE
          </h1>

          <p className="mt-2 text-stone-400">
            {commandesPreparation.length} commande
            {commandesPreparation.length > 1 ? "s" : ""} en cours
          </p>
        </div>
      </div>

      {commandesPreparation.length === 0 ? (
        <div className="rounded-3xl border border-yellow-500/20 bg-black/60 p-20 text-center text-4xl font-black text-stone-500">
          Aucune commande
        </div>
      ) : (
        <div className="space-y-12">
          <div>
            <h2 className="mb-5 text-3xl font-black text-yellow-300">
              EN PRÉPARATION
            </h2>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {commandesPreparation.map(renderCommande)}
            </div>
          </div>          
        </div>
      )}
    </main>
  );
}
