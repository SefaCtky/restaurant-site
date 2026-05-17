import React, { useEffect, useState } from "react";

export default function CuisinePage({
  supabase,
  formatPrice,
}) {
  const [commandes, setCommandes] = useState([]);
  const [heureActuelle, setHeureActuelle] = useState(Date.now());
  const [nouvelleCommande, setNouvelleCommande] = useState(null);

  const commandesConnuesRef = React.useRef(new Set());
  const premierChargementRef = React.useRef(true);
  const audioContextRef = React.useRef(null);

  const [modeCuisineActif, setModeCuisineActif] = useState(false);

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
      .neq("statut", "Terminée")
      .neq("statut", "Livrée")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const nouvelles = (data || []).filter(
      (commande) =>
        !commandesConnuesRef.current.has(commande.id)
    );

    if (
      !premierChargementRef.current &&
      nouvelles.length > 0
    ) {
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

  const getUrgenceStyle = (minutes) => {
    if (minutes >= 20) {
      return "border-red-500 bg-red-950/50 animate-pulse shadow-[0_0_35px_rgba(239,68,68,0.45)]";
    }

    if (minutes >= 10) {
      return "border-orange-400 bg-orange-950/30 shadow-[0_0_25px_rgba(251,146,60,0.35)]";
    }

    return "border-yellow-500/30 bg-black/70";
  };

  const modifierStatut = async (
    commandeId,
    statut
  ) => {
    const { error } = await supabase
      .from("commandes")
      .update({ statut })
      .eq("id", commandeId);

    if (error) {
      console.error(error);
    }

    chargerCommandes();
  };

  const commandesPreparation = commandes.filter(
    (commande) => commande.statut !== "Prête"
  );

  const commandesPretes = commandes.filter(
    (commande) => commande.statut === "Prête"
  );

  const renderCommande = (commande) => {
    const minutes = getTempsCommande(
      commande.created_at
    );

    return (
      <div
        key={commande.id}
        className={`rounded-3xl border-2 p-6 shadow-2xl ${getUrgenceStyle(
          minutes
        )}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {commande.mode_paiement && (
              <p
                className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-black ${
                  commande.mode_paiement === "Sur place"
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-yellow-400 text-black"
                }`}
              >
                {commande.mode_paiement === "Sur place"
                  ? "🔥 SUR PLACE - PRIORITÉ"
                  : "À EMPORTER"}
              </p>
            )}

            <p className="mt-3 text-5xl font-black text-yellow-300">
              {minutes} min
            </p>
          </div>

          <div className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
            {commande.statut}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {(commande.contenu || []).map(
            (item, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white/5 p-4"
              >
                <p className="text-2xl font-black text-white">
                  {item.quantite}x {item.nom}
                </p>

                {item.viandes?.length > 0 && (
                  <p className="mt-2 text-lg text-yellow-300">
                    {item.viandes
                      .map(
                        (v) => v.name || v.nom || v
                      )
                      .join(", ")}
                  </p>
                )}

                {item.sauces?.length > 0 && (
                  <p className="mt-2 text-stone-300">
                    Sauces :{" "}
                    {item.sauces.join(", ")}
                  </p>
                )}

                {item.note && (
                  <p className="mt-3 rounded-xl bg-red-500/20 p-3 font-bold text-red-300">
                    NOTE : {item.note}
                  </p>
                )}
              </div>
            )
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() =>
              modifierStatut(
                commande.id,
                "En préparation"
              )
            }
            className="rounded-2xl bg-blue-600 py-4 text-lg font-black text-white hover:bg-blue-500"
          >
            Préparation
          </button>

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

          <button
            onClick={() =>
              modifierStatut(
                commande.id,
                "Terminée"
              )
            }
            className="col-span-2 rounded-2xl bg-stone-700 py-4 text-lg font-black text-white hover:bg-stone-600"
          >
            Terminée
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-black p-6">
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
              #
              {nouvelleCommande.numero_commande ||
                nouvelleCommande.id}
            </p>

            <p className="mt-6 text-5xl font-black text-yellow-300">
              {formatPrice(
                Number(
                  nouvelleCommande.total || 0
                )
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            ÉCRAN CUISINE
          </h1>

          <p className="mt-2 text-stone-400">
            {commandes.length} commande
            {commandes.length > 1 ? "s" : ""} en
            cours
          </p>
        </div>

        <button
          onClick={() =>
            document.documentElement.requestFullscreen()
          }
          className="rounded-full bg-purple-600 px-6 py-4 text-lg font-black text-white hover:bg-purple-500"
        >
          Plein écran
        </button>
      </div>

      {commandes.length === 0 ? (
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
              {commandesPreparation.map(
                renderCommande
              )}
            </div>
          </div>

          {commandesPretes.length > 0 && (
            <div>
              <h2 className="mb-5 text-3xl font-black text-green-400">
                PRÊTES À SERVIR
              </h2>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {commandesPretes.map(
                  renderCommande
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
