import React, { useEffect, useRef, useState } from "react";
import PageTitle from "../components/PageTitle";

export default function StaffCommandesPage({
  supabase,
  userRole,
  formatPrice,
  soundEnabled,
  activerSonCommandes,
}) {
  
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ongletCommandes, setOngletCommandes] = useState("en_cours");
  const [commandeOuverteId, setCommandeOuverteId] = useState(null);

  const audioContextRef = useRef(null);

  const playNotificationSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;

    const playBeep = (startTime, frequency) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    };

    const now = audioContext.currentTime;
    playBeep(now, 880);
    playBeep(now + 0.35, 1175);
  };

  const chargerCommandes = async () => {
  setLoading(true);

  const { data: commandesData, error: commandesError } = await supabase
    .from("commandes")
    .select("*")
    .order("created_at", { ascending: false });

  if (commandesError) {
    console.error(commandesError);
    alert("Erreur chargement commandes ❌");
    setLoading(false);
    return;
  }

  const userIds = [
    ...new Set(
      (commandesData || [])
        .map((commande) => commande.user_id)
        .filter(Boolean)
    ),
  ];

  let profilesMap = {};

  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nom, prenom, nom_famille, email")
      .in("id", userIds);

    if (profilesError) {
      console.error(profilesError);
    }

    profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});
  }

  const commandeIds = (commandesData || []).map((commande) => commande.id);

let historiquesMap = {};

if (commandeIds.length > 0) {
  const { data: historiquesData, error: historiquesError } = await supabase
    .from("commandes_statuts_historique")
    .select("*")
    .in("commande_id", commandeIds)
    .order("created_at", { ascending: true });

  if (historiquesError) {
    console.error(historiquesError);
  }

  historiquesMap = (historiquesData || []).reduce((acc, historique) => {
    if (!acc[historique.commande_id]) {
      acc[historique.commande_id] = [];
    }

    acc[historique.commande_id].push(historique);
    return acc;
  }, {});
}

const commandesAvecClients = (commandesData || []).map((commande) => ({
  ...commande,
  client: profilesMap[commande.user_id] || null,
  historique_statuts: historiquesMap[commande.id] || [],
}));

  setCommandes(commandesAvecClients);
  setLoading(false);
};

  useEffect(() => {
    chargerCommandes();

    const channel = supabase
      .channel("commandes-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commandes",
        },
        () => {
          playNotificationSound();
          chargerCommandes();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commandes",
        },
        () => {
          chargerCommandes();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "commandes",
        },
        () => {
          chargerCommandes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  const getNomEmployeConnecte = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return "Employé";

    const { data: profile } = await supabase
      .from("profiles")
      .select("nom")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.nom || user.email || "Employé";
  };

  const modifierStatut = async (commandeId, nouveauStatut) => {
  const commandeActuelle = commandes.find((commande) => commande.id === commandeId);
  const ancienStatut = commandeActuelle?.statut || "";

  const nomEmploye = await getNomEmployeConnecte();

  const updateData = {
    statut: nouveauStatut,
  };

  if (nouveauStatut === "En préparation") {
    updateData.pris_en_charge_par = nomEmploye;
  }

  const { error } = await supabase
    .from("commandes")
    .update(updateData)
    .eq("id", commandeId);

  if (error) {
    console.error(error);
    alert("Erreur modification statut ❌");
    return;
  }

  await supabase.from("commandes_statuts_historique").insert({
    commande_id: commandeId,
    ancien_statut: ancienStatut,
    nouveau_statut: nouveauStatut,
    modifie_par: nomEmploye,
  });

  chargerCommandes();
};

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatutStyle = (statut) => {
    if (statut === "En attente") return "bg-yellow-400 text-black";
    if (statut === "En préparation") return "bg-blue-600 text-white";
    if (statut === "Prête") return "bg-green-600 text-white";
    if (statut === "Terminée") return "bg-stone-600 text-white";

    return "bg-white/10 text-white";
  };

  const commandesEnCours = commandes.filter(
  (commande) =>
    commande.statut !== "Terminée" && commande.statut !== "Livrée"
);

  const aujourdHui = new Date().toISOString().slice(0, 10);

const commandesTermineesDuJour = commandes.filter((commande) => {
  const dateCommande = new Date(commande.created_at)
    .toISOString()
    .slice(0, 10);

  return (
    (commande.statut === "Terminée" ||
      commande.statut === "Livrée") &&
    dateCommande === aujourdHui
  );
});

const commandesArchivees = commandes.filter((commande) => {
  const dateCommande = new Date(commande.created_at)
    .toISOString()
    .slice(0, 10);

  return (
    (commande.statut === "Terminée" ||
      commande.statut === "Livrée") &&
    dateCommande !== aujourdHui
  );
});


const commandesAffichees =
  ongletCommandes === "en_cours"
    ? commandesEnCours
    : ongletCommandes === "terminees"
    ? commandesTermineesDuJour
    : commandesArchivees;
    
  if (!["admin", "employe"].includes(userRole)) {
    return (
      <main className="px-5 py-16">
        <PageTitle
          eyebrow="Commandes"
          title="Accès refusé"
          text="Cette page est réservée à l’équipe Chez Omer."
        />
      </main>
    );
  }

  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Commandes"
        title="Commandes reçues"
        text="Suivez les commandes en temps réel et mettez à jour leur statut."
      />

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-yellow-300">
              {ongletCommandes === "en_cours"
                ? "Commandes en cours"
                : "Commandes terminées"}
            </h2>

            <p className="mt-2 text-sm text-stone-400">
              {soundEnabled
                ? "🔔 Son activé pour les nouvelles commandes"
                : "🔕 Son désactivé"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={activerSonCommandes}
              className={`rounded-full px-6 py-3 font-black ${
                soundEnabled
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {soundEnabled ? "Son activé ✅" : "Activer le son 🔔"}
            </button>

            <button
              onClick={chargerCommandes}
              className="rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
            >
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>
          <div className="mb-6 flex flex-wrap gap-3">
  <button
    onClick={() => setOngletCommandes("en_cours")}
    className={`rounded-full px-6 py-3 font-black ${
      ongletCommandes === "en_cours"
        ? "bg-yellow-400 text-black"
        : "bg-white/10 text-white hover:bg-white/20"
    }`}
  >
    Commandes en cours
  </button>

  <button
    onClick={() => setOngletCommandes("terminees")}
    className={`rounded-full px-6 py-3 font-black ${
      ongletCommandes === "terminees"
        ? "bg-yellow-400 text-black"
        : "bg-white/10 text-white hover:bg-white/20"
    }`}
  >
    Commandes terminées
  </button>

  <button
  onClick={() => setOngletCommandes("archivees")}
  className={`rounded-full px-6 py-3 font-black ${
    ongletCommandes === "archivees"
      ? "bg-yellow-400 text-black"
      : "bg-white/10 text-white hover:bg-white/20"
  }`}
>
  Commandes archivées
</button>

</div>

        </div>

{commandesAffichees.length === 0 ? (
  <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8 text-center text-stone-400">
    Aucune commande pour le moment.
  </div>
) : (
  <div className="space-y-5">
    {commandesAffichees.map((commande) => (
      <div
        key={commande.id}
        onClick={() =>
          setCommandeOuverteId((current) =>
            current === commande.id ? null : commande.id
          )
        }
        className="cursor-pointer rounded-[2rem] border border-yellow-500/20 bg-black/70 p-6 shadow-xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xl font-black text-white">
              {commande.numero_commande || `Commande #${commande.id}`}
            </p>

            <p className="mt-2 text-sm font-bold text-stone-300">
              Client :{" "}
              {commande.client?.nom ||
                `${commande.client?.prenom || ""} ${
                  commande.client?.nom_famille || ""
                }`.trim() ||
                "Invité"}
            </p>

            <p className="mt-2 text-2xl font-black text-yellow-300">
              {formatPrice(Number(commande.total || 0))}
            </p>

            {commande.pris_en_charge_par && (
              <p className="mt-3 inline-flex rounded-full border border-yellow-500/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300">
                Pris en charge par : {commande.pris_en_charge_par}
              </p>
            )}
          </div>

          <span
            className={`rounded-full px-5 py-3 text-sm font-black ${getStatutStyle(
              commande.statut
            )}`}
          >
            {commande.statut}
          </span>
        </div>

        {commandeOuverteId === commande.id && (
          <div className="mt-5 space-y-3 rounded-2xl border border-yellow-500/20 bg-black/50 p-4">
            <h3 className="font-black text-yellow-300">
              Détail de la commande
            </h3>

            {(commande.contenu || []).map((item, index) => (
              <div
                key={index}
                className="rounded-xl bg-white/5 p-4 text-sm text-stone-300"
              >
                <p className="font-black text-white">
                  {item.quantite}x {item.nom}
                </p>

                <p>{item.categorie}</p>

                {item.formule && <p>Formule : {item.formule}</p>}
                {item.choix_pain && <p>Choix : {item.choix_pain}</p>}
                {item.accompagnement && (
                  <p>Accompagnement : {item.accompagnement}</p>
                )}

                {item.viandes?.length > 0 && (
                  <p>
                    Viandes :{" "}
                    {item.viandes
                      .map((v) => v.name || v.nom || v)
                      .join(", ")}
                  </p>
                )}

                {item.crudites?.length > 0 && (
                  <p>Options : {item.crudites.join(", ")}</p>
                )}

                {item.sauces?.length > 0 && (
                  <p>Sauces : {item.sauces.join(", ")}</p>
                )}

                {item.sauces_frites?.length > 0 && (
                  <p>Sauces frites : {item.sauces_frites.join(", ")}</p>
                )}

                {item.note && <p>Note : {item.note}</p>}

                <p className="mt-2 font-black text-yellow-300">
                  {formatPrice(item.total_ligne || 0)}
                </p>
              </div>
            ))}

            {commande.historique_statuts?.length > 0 && (
              <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-black/60 p-4">
                <h3 className="font-black text-yellow-300">
                  Historique des statuts
                </h3>

                <div className="mt-3 space-y-2">
                  {commande.historique_statuts.map((historique) => (
                    <div
                      key={historique.id}
                      className="rounded-xl bg-white/5 p-3 text-sm text-stone-300"
                    >
                      <p>
                        <span className="font-bold text-white">
                          {historique.modifie_par || "Employé"}
                        </span>{" "}
                        a changé le statut de{" "}
                        <span className="text-yellow-300">
                          {historique.ancien_statut || "Nouveau"}
                        </span>{" "}
                        à{" "}
                        <span className="text-green-400">
                          {historique.nouveau_statut}
                        </span>
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        {formatDate(historique.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      
                <div className="mt-6 flex flex-wrap gap-3">
                  {ongletCommandes === "en_cours" ? (
                    <>
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        modifierStatut(commande.id, "En attente");
                      }}
                      className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300"
                    >
                      En attente
                    </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierStatut(commande.id, "En préparation");
                    }}
                    className="rounded-full bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                  >
                    En préparation
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierStatut(commande.id, "Prête");
                    }}
                    className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                  >
                    Prête
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      modifierStatut(commande.id, "Terminée");
                    }}
                    className="rounded-full bg-stone-600 px-5 py-3 font-black text-white hover:bg-stone-500"
                  >
                    Terminée
                  </button>
                </>
              ) : (
                <>
                  {commande.statut === "Terminée" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        modifierStatut(commande.id, "Livrée");
                      }}
                      className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                    >
                      Marquer comme livrée
                    </button>
                  )}

                  {commande.statut === "Livrée" && (
                    <span className="rounded-full bg-green-700 px-5 py-3 font-black text-white">
                      Commande livrée
                    </span>
                  )}
                </>
              )}
            </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
