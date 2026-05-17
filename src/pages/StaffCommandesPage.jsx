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
  const [anneesOuvertes, setAnneesOuvertes] = useState({});
  const [moisOuverts, setMoisOuverts] = useState({});
  const [joursOuverts, setJoursOuverts] = useState({});
  const [nouvelleCommandePopup, setNouvelleCommandePopup] = useState(null);
  const [heureActuelle, setHeureActuelle] = useState(Date.now());

  const audioContextRef = useRef(null);
  const commandesConnuesRef = useRef(new Set());
  const premierChargementRef = useRef(true);

  const playNotificationSound = async (force = false) => {
    if (!force && !soundEnabled) return;
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const playBeep = (delay, frequency) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime + delay
      );

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(
        0.45,
        audioContext.currentTime + delay + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + delay + 0.6
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + 0.6);
    };

    playBeep(0, 1000);
    playBeep(0.7, 1200);
  };
    
  const activerSonStaff = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    audioContextRef.current.resume();

    activerSonCommandes();

    setTimeout(() => {
      playNotificationSound(true);
    }, 100);
  };

  const afficherNotificationCommande = async (commande) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    await playNotificationSound(true);

    setNouvelleCommandePopup(commande);

    setTimeout(() => {
      setNouvelleCommandePopup(null);
    }, 8000);
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

  const nouvellesCommandes = commandesAvecClients.filter(
    (commande) => !commandesConnuesRef.current.has(commande.id)
  );

  if (!premierChargementRef.current && nouvellesCommandes.length > 0) {
    afficherNotificationCommande(nouvellesCommandes[0]);
  }

  commandesAvecClients.forEach((commande) => {
    commandesConnuesRef.current.add(commande.id);
  });

  premierChargementRef.current = false;

  setCommandes(commandesAvecClients);
  setLoading(false);
};

useEffect(() => {
  const interval = setInterval(() => {
    setHeureActuelle(Date.now());
  }, 1000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    chargerCommandes();
    const refreshInterval = setInterval(() => {
      chargerCommandes();
    }, 3000);

    const channel = supabase
      .channel("commandes-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commandes",
        },
        (payload) => {
          console.log("NOUVELLE COMMANDE REALTIME :", payload.new);

          afficherNotificationCommande(payload.new);

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
      clearInterval(refreshInterval);
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

const getTempsCommande = (commande) => {
  const maintenant = heureActuelle;

  const historiqueLivraison = commande.historique_statuts?.find(
    (item) => item.nouveau_statut === "Livrée"
  );

  const dateFin = historiqueLivraison?.created_at
    ? new Date(historiqueLivraison.created_at).getTime()
    : maintenant;

  const creation = new Date(commande.created_at).getTime();

  return Math.floor((dateFin - creation) / 60000);
};

const getTempsDepuisStatut = (commande, statutRecherche) => {
  const historique = commande.historique_statuts?.find(
    (item) => item.nouveau_statut === statutRecherche
  );

  if (!historique?.created_at) return null;

  const maintenant = heureActuelle;
  const dateStatut = new Date(historique.created_at).getTime();

  return Math.floor((maintenant - dateStatut) / 60000);
};

const getCouleurTemps = (minutes) => {
  if (minutes >= 20) {
    return "text-red-500";
  }

  if (minutes >= 10) {
    return "text-orange-400";
  }

  return "text-green-400";
};

const getBordureUrgence = (minutes) => {
  if (minutes >= 20) {
    return "border-red-500 animate-pulse shadow-red-500/30";
  }

  if (minutes >= 10) {
    return "border-orange-400 shadow-orange-400/20";
  }

  return "border-yellow-500/20";
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

const commandesTermineesNonLivreesDuJour = commandes.filter((commande) => {
  const dateCommande = new Date(commande.created_at)
    .toISOString()
    .slice(0, 10);

  return commande.statut === "Terminée" && dateCommande === aujourdHui;
});

const commandesLivreesDuJour = commandes.filter((commande) => {
  const dateCommande = new Date(commande.created_at)
    .toISOString()
    .slice(0, 10);

  return commande.statut === "Livrée" && dateCommande === aujourdHui;
});

const commandesTermineesDuJour = [
  ...commandesTermineesNonLivreesDuJour,
  ...commandesLivreesDuJour,
];

const commandesArchivees = commandes.filter((commande) => {
  const dateCommande = new Date(commande.created_at)
    .toISOString()
    .slice(0, 10);

  return (
    (commande.statut === "Terminée" || commande.statut === "Livrée") &&
    dateCommande !== aujourdHui
  );
});

const commandesArchiveesGroupees = commandesArchivees.reduce(
  (acc, commande) => {
    const date = new Date(commande.created_at);

    const annee = String(date.getFullYear());

    const mois = date.toLocaleDateString("fr-FR", {
      month: "long",
    });

    const jour = date.toLocaleDateString("fr-FR");

    if (!acc[annee]) {
      acc[annee] = {};
    }

    if (!acc[annee][mois]) {
      acc[annee][mois] = {};
    }

    if (!acc[annee][mois][jour]) {
      acc[annee][mois][jour] = [];
    }

    acc[annee][mois][jour].push(commande);

    return acc;
  },
  {}
);

const imprimerTicketCuisine = (commande) => {
  const contenuProduits = (commande.contenu || [])
    .map((item) => {
      return `
        <div class="produit">
          <strong>${item.quantite}x ${item.nom}</strong>
          ${item.formule ? `<p>Formule : ${item.formule}</p>` : ""}
          ${item.choix_pain ? `<p>Choix : ${item.choix_pain}</p>` : ""}
          ${item.accompagnement ? `<p>Accompagnement : ${item.accompagnement}</p>` : ""}
          ${item.viandes?.length > 0 ? `<p>Viandes : ${item.viandes.map((v) => v.name || v.nom || v).join(", ")}</p>` : ""}
          ${item.crudites?.length > 0 ? `<p>Options : ${item.crudites.join(", ")}</p>` : ""}
          ${item.sauces?.length > 0 ? `<p>Sauces : ${item.sauces.join(", ")}</p>` : ""}
          ${item.sauces_frites?.length > 0 ? `<p>Sauces frites : ${item.sauces_frites.join(", ")}</p>` : ""}
          ${item.note ? `<p><strong>Note : ${item.note}</strong></p>` : ""}
        </div>
      `;
    })
    .join("");

  const fenetre = window.open("", "_blank", "width=400,height=700");

  fenetre.document.write(`
    <html>
      <head>
        <title>Ticket cuisine</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 12px;
            font-size: 14px;
            color: #000;
          }

          h1 {
            text-align: center;
            font-size: 22px;
            margin-bottom: 5px;
          }

          .center {
            text-align: center;
          }

          .info {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }

          .produit {
            border-bottom: 1px dashed #000;
            padding: 10px 0;
          }

          .produit p {
            margin: 3px 0;
          }

          .total {
            margin-top: 15px;
            font-size: 18px;
            font-weight: bold;
            text-align: right;
          }

          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <h1>CHEZ OMER</h1>
        <p class="center"><strong>TICKET CUISINE</strong></p>

        <div class="info">
          <p><strong>Commande :</strong> ${commande.numero_commande || commande.id}</p>
          <p><strong>Date :</strong> ${formatDate(commande.created_at)}</p>
          <p><strong>Client :</strong> ${
            commande.client?.nom ||
            `${commande.client?.prenom || ""} ${commande.client?.nom_famille || ""}`.trim() ||
            "Invité"
          }</p>
          <p><strong>Statut :</strong> ${commande.statut || ""}</p>
        </div>

        ${contenuProduits}

        <p class="total">Total : ${formatPrice(Number(commande.total || 0))}</p>

        <button onclick="window.print()">Imprimer</button>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  fenetre.document.close();
};

const activerPleinEcran = () => {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  }
};

const renderCommande = (commande) => (
  <div
    key={commande.id}
    onClick={() =>
      setCommandeOuverteId((current) =>
        current === commande.id ? null : commande.id
      )
    }
    className={`cursor-pointer rounded-[2rem] border bg-black/70 p-6 shadow-xl ${
  ongletCommandes === "archivees"
    ? "border-yellow-500/20"
    : getBordureUrgence(getTempsCommande(commande))
}`}
  >
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {commande.mode_paiement && (
          <p
            className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm font-black ${
              commande.mode_paiement === "Sur place"
                ? "bg-red-600 text-white"
                : "bg-yellow-400 text-black"
            }`}
          >
            {commande.mode_paiement === "Sur place"
              ? "🔥 SUR PLACE"
              : "À EMPORTER"}
          </p>
        )}

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

        <p
  className={`mt-2 text-lg font-black ${
    ongletCommandes === "archivees"
      ? "text-stone-400"
      : getCouleurTemps(getTempsCommande(commande))
  }`}
>
  ⏱️ {getTempsCommande(commande)} min
</p>

{commande.statut === "Prête" && getTempsDepuisStatut(commande, "Prête") !== null && (
  <p
    className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-black ${
      getTempsDepuisStatut(commande, "Prête") >= 10
        ? "bg-red-600 text-white animate-pulse"
        : getTempsDepuisStatut(commande, "Prête") >= 5
        ? "bg-orange-500 text-white"
        : "bg-green-600 text-white"
    }`}
  >
    Prête depuis {getTempsDepuisStatut(commande, "Prête")} min
  </p>
)}

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
        <h3 className="font-black text-yellow-300">Détail de la commande</h3>

        {(commande.contenu || []).map((item, index) => (
          <div key={index} className="rounded-xl bg-white/5 p-4 text-sm text-stone-300">
            <p className="font-black text-white">
              {item.quantite}x {item.nom}
            </p>

            <p>{item.categorie}</p>
            {item.formule && <p>Formule : {item.formule}</p>}
            {item.choix_pain && <p>Choix : {item.choix_pain}</p>}
            {item.accompagnement && <p>Accompagnement : {item.accompagnement}</p>}
            {item.viandes?.length > 0 && <p>Viandes : {item.viandes.map((v) => v.name || v.nom || v).join(", ")}</p>}
            {item.crudites?.length > 0 && <p>Options : {item.crudites.join(", ")}</p>}
            {item.sauces?.length > 0 && <p>Sauces : {item.sauces.join(", ")}</p>}
            {item.sauces_frites?.length > 0 && <p>Sauces frites : {item.sauces_frites.join(", ")}</p>}
            {item.note && <p>Note : {item.note}</p>}

            <p className="mt-2 font-black text-yellow-300">
              {formatPrice(item.total_ligne || 0)}
            </p>
          </div>
        ))}

        {commande.historique_statuts?.length > 0 && (
          <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-black/60 p-4">
            <h3 className="font-black text-yellow-300">Historique des statuts</h3>

            <div className="mt-3 space-y-2">
              {commande.historique_statuts.map((historique) => (
                <div key={historique.id} className="rounded-xl bg-white/5 p-3 text-sm text-stone-300">
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          imprimerTicketCuisine(commande);
        }}
        className="rounded-full bg-purple-600 px-5 py-3 font-black text-white hover:bg-purple-500"
      >
        Imprimer ticket
      </button>
      {ongletCommandes === "en_cours" ? (
        <>
          <button onClick={(e) => { e.stopPropagation(); modifierStatut(commande.id, "En attente"); }} className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300">
            En attente
          </button>

          <button onClick={(e) => { e.stopPropagation(); modifierStatut(commande.id, "En préparation"); }} className="rounded-full bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500">
            En préparation
          </button>

          <button onClick={(e) => { e.stopPropagation(); modifierStatut(commande.id, "Prête"); }} className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500">
            Prête
          </button>

          <button onClick={(e) => { e.stopPropagation(); modifierStatut(commande.id, "Terminée"); }} className="rounded-full bg-stone-600 px-5 py-3 font-black text-white hover:bg-stone-500">
            Terminée
          </button>
        </>
      ) : (
        <>
          {commande.statut === "Terminée" && (
            <button onClick={(e) => { e.stopPropagation(); modifierStatut(commande.id, "Livrée"); }} className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500">
              Marquer comme livrée
            </button>
          )}
       
        </>
      )}
    </div>
  </div>
);

const commandesAffichees =
  ongletCommandes === "en_cours"
    ? commandesEnCours
    : ongletCommandes === "terminees"
    ? commandesTermineesDuJour
    : commandesArchivees;
    
  if (!["admin", "employe"].includes(userRole)) {
    return (
      <main className="px-5 py-16">
        {nouvelleCommandePopup && (
          <div className="fixed right-5 top-5 z-50 animate-bounce rounded-3xl border-2 border-yellow-400 bg-black px-6 py-5 shadow-2xl shadow-yellow-400/30">
            <p className="text-sm font-black text-yellow-300">
              🔔 Nouvelle commande
            </p>

            <p className="mt-2 text-2xl font-black text-white">
              {nouvelleCommandePopup.numero_commande || "Commande"}
            </p>

            <p className="mt-1 text-lg font-black text-green-400">
              {formatPrice(Number(nouvelleCommandePopup.total || 0))}
            </p>
          </div>
        )}
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
      {nouvelleCommandePopup && (
        <div className="fixed right-5 top-5 z-50 animate-bounce rounded-3xl border-2 border-yellow-400 bg-black px-6 py-5 shadow-2xl shadow-yellow-400/30">
          <p className="text-sm font-black text-yellow-300">🔔 Nouvelle commande</p>

          <p className="mt-2 text-2xl font-black text-white">
            {nouvelleCommandePopup.numero_commande || "Commande"}
          </p>

          <p className="mt-1 text-lg font-black text-green-400">
            {formatPrice(Number(nouvelleCommandePopup.total || 0))}
          </p>
        </div>
      )}
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
              onClick={activerSonStaff}
              className={`rounded-full px-6 py-3 font-black ${
                soundEnabled
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {soundEnabled ? "Son activé ✅" : "Activer le son 🔔"}
            </button>

            <button
              onClick={activerPleinEcran}
              className="rounded-full bg-purple-600 px-6 py-3 font-black text-white hover:bg-purple-500"
            >
              Plein écran cuisine
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

      {ongletCommandes === "terminees" ? (
        <div className="space-y-10">
          <div className="rounded-[2rem] border border-yellow-500/30 bg-black/60 p-6">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-3xl font-black text-yellow-300">
                À LIVRER
              </h2>

              <span className="rounded-xl bg-yellow-400 px-3 py-1 text-sm font-black text-black">
                {commandesTermineesNonLivreesDuJour.length}
              </span>
            </div>

            {commandesTermineesNonLivreesDuJour.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-yellow-500/20 bg-black/40 p-6 text-center text-stone-400">
                Aucune commande à livrer.
              </div>
            ) : (
              <div className="space-y-5">
                {commandesTermineesNonLivreesDuJour.map((commande) =>
                  renderCommande(commande)
                )}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-green-500/30 bg-green-950/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-3xl font-black text-green-400">
                LIVRÉES
              </h2>

              <span className="rounded-xl bg-green-600 px-3 py-1 text-sm font-black text-white">
                {commandesLivreesDuJour.length}
              </span>
            </div>

            {commandesLivreesDuJour.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-green-500/20 bg-black/40 p-6 text-center text-stone-400">
                Aucune commande livrée.
              </div>
            ) : (
              <div className="space-y-5 opacity-80">
                {commandesLivreesDuJour.map((commande) =>
                  renderCommande(commande)
                )}
              </div>
            )}
          </div>
        </div>
      ) : commandesAffichees.length === 0 ? (
        <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8 text-center text-stone-400">
          Aucune commande pour le moment.
        </div>
      ) : ongletCommandes === "archivees" ? (
        <div className="space-y-5">
          {Object.entries(commandesArchiveesGroupees).map(([annee, moisData]) => (
            <div key={annee} className="rounded-3xl border border-yellow-500/20 bg-black/60 p-5">
              <button
                onClick={() =>
                  setAnneesOuvertes((current) => ({
                    ...current,
                    [annee]: !current[annee],
                  }))
                }
                className="rounded-full bg-yellow-400 px-6 py-3 font-black text-black"
              >
                {anneesOuvertes[annee] ? "▼" : "▶"} {annee}
              </button>

              {anneesOuvertes[annee] && (
                <div className="mt-4 ml-4 space-y-4">
                  {Object.entries(moisData).map(([mois, joursData]) => {
                    const cleMois = `${annee}-${mois}`;

                    return (
                      <div key={cleMois}>
                        <button
                          onClick={() =>
                            setMoisOuverts((current) => ({
                              ...current,
                              [cleMois]: !current[cleMois],
                            }))
                          }
                          className="rounded-full bg-orange-500 px-5 py-2 font-black text-white"
                        >
                          {moisOuverts[cleMois] ? "▼" : "▶"} {mois}
                        </button>

                        {moisOuverts[cleMois] && (
                          <div className="mt-3 ml-4 space-y-3">
                            {Object.entries(joursData).map(([jour, commandesJour]) => {
                              const cleJour = `${cleMois}-${jour}`;

                              return (
                                <div key={cleJour}>
                                  <button
                                    onClick={() =>
                                      setJoursOuverts((current) => ({
                                        ...current,
                                        [cleJour]: !current[cleJour],
                                      }))
                                    }
                                    className="rounded-full bg-stone-700 px-4 py-2 font-black text-white"
                                  >
                                    {joursOuverts[cleJour] ? "▼" : "▶"} {jour} ({commandesJour.length})
                                  </button>

                                  {joursOuverts[cleJour] && (
                                    <div className="mt-4 space-y-5">
                                      {commandesJour.map((commande) => renderCommande(commande))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
           ) : (
        <div className="space-y-5">
          {commandesAffichees.map((commande) => renderCommande(commande))}
        </div>
            )}

    </div>
  </main>
  );
}