import React, { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import * as XLSX from "xlsx";

export default function DashboardPage({ supabase, formatPrice }) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [derniereCommande, setDerniereCommande] = useState(null);
  const derniereCommandeRef = useRef(null);
  const premierChargementRef = useRef(true);  
  const [periode, setPeriode] = useState("jour");
  const [dateSelectionnee, setDateSelectionnee] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [dateComparaisonA, setDateComparaisonA] = useState("");
  const [dateComparaisonB, setDateComparaisonB] = useState("");
  

  const chargerDashboard = async () => {
    if (commandes.length === 0) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCommandes(data || []);
    if (data?.length > 0) {
      const nouvelleCommande = data[0];

      if (premierChargementRef.current) {
        derniereCommandeRef.current = nouvelleCommande;
        setDerniereCommande(nouvelleCommande);
        premierChargementRef.current = false;
      } else if (
        derniereCommandeRef.current &&
        nouvelleCommande.id !== derniereCommandeRef.current.id
      ) {
        if (Notification.permission === "granted") {
          new Notification("Nouvelle commande Chez Omer 🍔", {
            body: `Commande #${
              nouvelleCommande.numero_commande || nouvelleCommande.id
            } • ${Number(nouvelleCommande.total || 0).toFixed(2)} €`,
          });
        }

        derniereCommandeRef.current = nouvelleCommande;
        setDerniereCommande(nouvelleCommande);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    chargerDashboard();

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      chargerDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const aujourdHui = new Date().toISOString().slice(0, 10);

  const getCommandesFiltrees = () => {
    const maintenant = new Date();

    return commandes.filter((commande) => {
      const dateCommande = new Date(commande.created_at);

      if (periode === "jour") {
        return commande.created_at?.startsWith(dateSelectionnee);
      }

      if (periode === "7jours") {
        const limite = new Date();
        limite.setDate(maintenant.getDate() - 7);
        return dateCommande >= limite;
      }

      if (periode === "30jours") {
        const limite = new Date();
        limite.setDate(maintenant.getDate() - 30);
        return dateCommande >= limite;
      }

      return true;
    });
  };

  const commandesDuJour = getCommandesFiltrees();

  const chiffreAffairesJour = commandesDuJour.reduce(
    (total, commande) => total + Number(commande.total || 0),
    0
  );

  const commandesEnCours = commandes.filter(
    (commande) =>
      commande.statut === "En attente" || commande.statut === "En préparation"
  );

  const commandesLivreesJour = commandesDuJour.filter(
    (commande) => commande.statut === "Livrée"
  );

  const produitsVendus = {};

  commandesDuJour.forEach((commande) => {
    (commande.contenu || []).forEach((item) => {
      const nom = item.nom || "Produit inconnu";
      produitsVendus[nom] =
        (produitsVendus[nom] || 0) + Number(item.quantite || 1);
    });
  });

  const produitTop =
    Object.entries(produitsVendus).sort((a, b) => b[1] - a[1])[0] || null;

  const ventesParJour = {};

commandes.forEach((commande) => {
  const date = new Date(commande.created_at).toLocaleDateString("fr-FR");

  ventesParJour[date] =
    (ventesParJour[date] || 0) + Number(commande.total || 0);
});

const graphiqueData = Object.entries(ventesParJour)
  .map(([date, total]) => ({
    date,
    total,
  }))
  .slice(-7);
  
const topProduitsParCategorie = {};

commandesDuJour.forEach((commande) => {
  (commande.contenu || []).forEach((item) => {
    const categorie = item.categorie || item.category || "Sans catégorie";
    const nom = item.nom || "Produit inconnu";
    const quantite = Number(item.quantite || 1);

    if (!topProduitsParCategorie[categorie]) {
      topProduitsParCategorie[categorie] = {};
    }

    topProduitsParCategorie[categorie][nom] =
      (topProduitsParCategorie[categorie][nom] || 0) + quantite;
  });
});

const classementParCategorie = Object.entries(topProduitsParCategorie).map(
  ([categorie, produits]) => {
    const topProduit = Object.entries(produits).sort((a, b) => b[1] - a[1])[0];

    return {
      categorie,
      nom: topProduit?.[0] || "Aucun produit",
      quantite: topProduit?.[1] || 0,
    };
  }
);

const panierMoyen =
  commandesDuJour.length > 0
    ? chiffreAffairesJour / commandesDuJour.length
    : 0;

const joursStats = {};

commandesDuJour.forEach((commande) => {
  const date = new Date(commande.created_at).toLocaleDateString("fr-FR");

  if (!joursStats[date]) {
    joursStats[date] = {
      ca: 0,
      commandes: 0,
    };
  }

  joursStats[date].ca += Number(commande.total || 0);
  joursStats[date].commandes += 1;
});

const joursArray = Object.entries(joursStats).map(([date, stats]) => ({
  date,
  ...stats,
}));

const meilleurJour = joursArray.sort((a, b) => b.ca - a.ca)[0] || null;
const pireJour = joursArray.sort((a, b) => a.ca - b.ca)[0] || null;

const moyenneCommandesJour =
  joursArray.length > 0
    ? commandesDuJour.length / joursArray.length
    : 0;

const commandesParHeure = {};

commandesDuJour.forEach((commande) => {
  const heure = new Date(commande.created_at).getHours();
  const label = `${heure}h`;

  commandesParHeure[label] = (commandesParHeure[label] || 0) + 1;
});

const heureRush =
  Object.entries(commandesParHeure).sort((a, b) => b[1] - a[1])[0] || null;

const commandesSurPlace = commandesDuJour.filter(
  (commande) => commande.mode_paiement === "Sur place"
).length;

const commandesAEmporter = commandesDuJour.filter(
  (commande) => commande.mode_paiement !== "Sur place"
).length;

const produitsFaibles = Object.entries(produitsVendus)
  .sort((a, b) => a[1] - b[1])
  .slice(0, 5);

const graphiqueResume = [
  {
    nom: "CA",
    valeur: Number(chiffreAffairesJour.toFixed(2)),
  },
  {
    nom: "Panier moyen",
    valeur: Number(panierMoyen.toFixed(2)),
  },
  {
    nom: "Commandes",
    valeur: commandesDuJour.length,
  },
  {
    nom: "Sur place",
    valeur: commandesSurPlace,
  },
  {
    nom: "À emporter",
    valeur: commandesAEmporter,
  },
];

const getStatsPourDate = (date) => {
  const commandesDate = commandes.filter((commande) =>
    commande.created_at?.startsWith(date)
  );

  const ca = commandesDate.reduce(
    (total, commande) => total + Number(commande.total || 0),
    0
  );

  const panierMoyenDate =
    commandesDate.length > 0 ? ca / commandesDate.length : 0;

  return {
    date,
    ca,
    commandes: commandesDate.length,
    panierMoyen: panierMoyenDate,
  };
};

const exporterExcel = () => {
  const lignesCommandes = commandesDuJour.map((commande) => ({
    "Numéro commande": commande.numero_commande || commande.id,
    "Date": new Date(commande.created_at).toLocaleString("fr-FR"),
    "Statut": commande.statut || "",
    "Mode": commande.mode_paiement || "",
    "Total": Number(commande.total || 0),
    "Produits": (commande.contenu || [])
      .map((item) => `${item.quantite || 1}x ${item.nom}`)
      .join(" / "),
  }));

  const lignesProduits = Object.entries(produitsVendus).map(
    ([nom, quantite]) => ({
      Produit: nom,
      "Quantité vendue": quantite,
    })
  );

const lignesResume = [
  {
    Indicateur: "CA période",
    Valeur: chiffreAffairesJour,
  },
  {
    Indicateur: "Commandes période",
    Valeur: commandesDuJour.length,
  },
  {
    Indicateur: "Panier moyen",
    Valeur: panierMoyen,
  },
  {
    Indicateur: "Moyenne commandes / jour",
    Valeur: moyenneCommandesJour,
  },
];

const comparaison =
  dateComparaisonA && dateComparaisonB
    ? [getStatsPourDate(dateComparaisonA), getStatsPourDate(dateComparaisonB)]
    : [];

const lignesComparaison = comparaison.map((item) => ({
  Date: item.date,
  "CA": item.ca,
  "Commandes": item.commandes,
  "Panier moyen": item.panierMoyen,
}));

  const wb = XLSX.utils.book_new();

  const wsCommandes = XLSX.utils.json_to_sheet(lignesCommandes);
  const wsProduits = XLSX.utils.json_to_sheet(lignesProduits);

  const wsResume = XLSX.utils.json_to_sheet(lignesResume);
const wsComparaison = XLSX.utils.json_to_sheet(lignesComparaison);

XLSX.utils.book_append_sheet(wb, wsResume, "Résumé");
XLSX.utils.book_append_sheet(wb, wsComparaison, "Comparaison dates");
XLSX.utils.book_append_sheet(wb, wsProduits, "Produits vendus");
XLSX.utils.book_append_sheet(wb, wsCommandes, "Commandes");
  
  XLSX.writeFile(wb, `dashboard-chez-omer-${periode}.xlsx`);
};

    const cartes = [
      
  {
      titre: "CA période",
      valeur: formatPrice(chiffreAffairesJour),
      couleur: "text-green-400",
    },
    {
      titre: "Commandes période",
      valeur: commandesDuJour.length,
      couleur: "text-yellow-300",
    },
    {
      titre: "Commandes en cours",
      valeur: commandesEnCours.length,
      couleur: "text-blue-400",
    },
    {
      titre: "Commandes livrées",
      valeur: commandesLivreesJour.length,
      couleur: "text-purple-400",
    },
    {
      titre: "Panier moyen",
      valeur: formatPrice(panierMoyen),
      couleur: "text-orange-400",
    },
    {
      titre: "Moy. commandes/jour",
      valeur: moyenneCommandesJour.toFixed(1),
      couleur: "text-pink-400",
    },

    {
      titre: "Heure de rush",
      valeur: heureRush ? `${heureRush[0]} • ${heureRush[1]} cmd` : "Aucune",
      couleur: "text-red-400",
    },
    {
  titre: "Sur place",
  valeur: commandesSurPlace,
  couleur: "text-red-400",
},
{
  titre: "À emporter",
  valeur: commandesAEmporter,
  couleur: "text-yellow-300",
},
  ];
  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-400">
            Chez Omer
          </p>

          <h1 className="mt-3 text-5xl font-black text-white">
            Dashboard restaurant
          </h1>

          <p className="mt-3 text-stone-400">
            Suivi des commandes, du chiffre d’affaires et des produits vendus.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              ["jour", "Aujourd’hui"],
              ["7jours", "7 jours"],
              ["30jours", "30 jours"],
              ["tout", "Tout"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPeriode(value)}
                className={`rounded-full px-5 py-3 font-black ${
                  periode === value
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {periode === "jour" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-black uppercase tracking-wide text-stone-400">
              Choisir une date
            </label>

            <input
              type="date"
              value={dateSelectionnee}
              onChange={(e) => setDateSelectionnee(e.target.value)}
              className="rounded-2xl border border-yellow-500/20 bg-black px-5 py-3 font-black text-white outline-none focus:border-yellow-400"
            />
          </div>
        )}

        <button
          onClick={exporterExcel}
          className="mt-4 rounded-full bg-green-600 px-6 py-3 font-black text-white hover:bg-green-500"
        >
          Exporter Excel
        </button>

        <div className="mt-4 flex flex-wrap gap-3">
          <div>
            <label className="mb-2 block text-sm font-black uppercase tracking-wide text-stone-400">
              Comparer date 1
            </label>
            <input
              type="date"
              value={dateComparaisonA}
              onChange={(e) => setDateComparaisonA(e.target.value)}
              className="rounded-2xl border border-yellow-500/20 bg-black px-5 py-3 font-black text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black uppercase tracking-wide text-stone-400">
              Comparer date 2
            </label>
            <input
              type="date"
              value={dateComparaisonB}
              onChange={(e) => setDateComparaisonB(e.target.value)}
              className="rounded-2xl border border-yellow-500/20 bg-black px-5 py-3 font-black text-white outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-yellow-500/20 bg-black/60 p-10 text-center text-xl font-black text-yellow-300">
            Chargement du dashboard...
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {cartes.map((carte) => (
                <div
                  key={carte.titre}
                  className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6 shadow-xl"
                >
                  <p className="text-sm font-bold uppercase tracking-wide text-stone-400">
                    {carte.titre}
                  </p>

                  <p className={`mt-4 text-4xl font-black ${carte.couleur}`}>
                    {carte.valeur}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
              <h2 className="text-3xl font-black text-yellow-300">
                Résumé période
              </h2>

              <div className="mt-6 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphiqueResume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="nom" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip />
                    <Bar dataKey="valeur" fill="#facc15" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <h2 className="text-2xl font-black text-yellow-300">
                  Produit le plus vendu aujourd’hui
                </h2>

                {produitTop ? (
                  <div className="mt-6 rounded-2xl bg-black/60 p-5">
                    <p className="text-3xl font-black text-white">
                      {produitTop[0]}
                    </p>

                    <p className="mt-2 text-xl font-black text-green-400">
                      {produitTop[1]} vendu(s)
                    </p>
                  </div>
                ) : (
                  <p className="mt-6 text-stone-400">
                    Aucun produit vendu aujourd’hui.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <h2 className="text-2xl font-black text-yellow-300">
                  Commandes récentes
                </h2>

                <div className="mt-5 space-y-3">
                  {commandes.slice(0, 8).map((commande) => (
                    <div
                      key={commande.id}
                      className="flex items-center justify-between rounded-2xl bg-black/60 p-4"
                    >
                      <div>
                        <p className="font-black text-white">
                          #{commande.numero_commande || commande.id}
                        </p>

                        <p className="text-sm text-stone-400">
                          {commande.statut}
                        </p>
                      </div>

                      <p className="font-black text-yellow-300">
                        {formatPrice(Number(commande.total || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
              <h2 className="text-3xl font-black text-yellow-300">
                Top produit vendu par catégorie
              </h2>

              <div className="mt-8 grid gap-6 xl:grid-cols-2">

                <div className="rounded-3xl border border-green-500/20 bg-green-950/10 p-6">
                  <h2 className="text-2xl font-black text-green-400">
                    Meilleur jour
                  </h2>

                  {meilleurJour ? (
                    <>
                      <p className="mt-5 text-4xl font-black text-white">
                        {meilleurJour.date}
                      </p>

                      <p className="mt-3 text-2xl font-black text-green-400">
                        {formatPrice(meilleurJour.ca)}
                      </p>

                      <p className="mt-2 text-stone-300">
                        {meilleurJour.commandes} commande(s)
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 text-stone-400">
                      Aucune donnée.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6">
                  <h2 className="text-2xl font-black text-red-400">
                    Jour le plus calme
                  </h2>

                  {pireJour ? (
                    <>
                      <p className="mt-5 text-4xl font-black text-white">
                        {pireJour.date}
                      </p>

                      <p className="mt-3 text-2xl font-black text-red-400">
                        {formatPrice(pireJour.ca)}
                      </p>

                      <p className="mt-2 text-stone-300">
                        {pireJour.commandes} commande(s)
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 text-stone-400">
                      Aucune donnée.
                    </p>
                  )}
                </div>

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {classementParCategorie.map((item) => (
                  <div
                    key={item.categorie}
                    className="rounded-2xl border border-yellow-500/20 bg-black/60 p-5"
                  >
                    <p className="text-sm font-black uppercase tracking-wide text-stone-400">
                      {item.categorie}
                    </p>

                    <p className="mt-3 text-2xl font-black text-white">
                      {item.nom}
                    </p>

                    <p className="mt-2 text-lg font-black text-green-400">
                      {item.quantite} vendu(s)
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 rounded-3xl border border-orange-500/20 bg-white/5 p-6">
              <h2 className="text-3xl font-black text-orange-400">
                Produits à surveiller
              </h2>

              <p className="mt-2 text-stone-400">
                Produits les moins vendus sur la période sélectionnée.
              </p>

              {produitsFaibles.length === 0 ? (
                <p className="mt-6 text-stone-400">
                  Aucun produit vendu sur cette période.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {produitsFaibles.map(([nom, quantite]) => (
                  <div
                    key={nom}
                    className="rounded-2xl border border-orange-500/20 bg-black/60 p-5"
                  >
                    <p className="text-xl font-black text-white">
                      {nom}
                    </p>

                    <p className="mt-3 text-lg font-black text-orange-400">
                      {quantite} vendu(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </main>
);
}