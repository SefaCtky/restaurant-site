import React, { useEffect, useState } from "react";
import { ShoppingCart, RotateCcw } from "lucide-react";

export default function HistoriqueCommandesPage({
  supabase,
  user,
  formatPrice,
  setCart,
  setCartOpen,
}) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  const chargerHistorique = async () => {
    if (!user?.id) {
      setCommandes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCommandes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerHistorique();

    if (!user?.id) return;

    const interval = setInterval(() => {
      chargerHistorique();
    }, 3000);

    const channel = supabase
      .channel("historique-commandes-client")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commandes",
        },
        () => {
          chargerHistorique();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const recommander = (commande) => {
    const nouveauPanier = (commande.contenu || []).map((item, index) => ({
      id: `${item.nom}-${Date.now()}-${index}`,
      name: item.nom,
      category: item.categorie,
      quantity: item.quantite || 1,
      price: item.prix_unitaire || 0,
      formulaChoice: item.formule || "",
      drinkSizeChoice: item.format_boisson || "",
      waterSizeChoice: item.format_eau || "",
      menuEnfantBoisson: item.boisson_menu_enfant || "",
      extraCheddar: item.supplement_cheddar || false,
      sansSauceFromagere: item.sans_sauce_fromagere || false,
      breadChoice: item.choix_pain || "",
      accompagnementChoice: item.accompagnement || "",
      meats: item.viandes || [],
      crudites: item.crudites || [],
      saucesSandwich: item.sauces || [],
      saucesFrites: item.sauces_frites || [],
      supplementSauces: item.supplement_sauces || 0,
      note: item.note || "",
    }));

    setCart(nouveauPanier);
    setCartOpen(true);
  };

  const getStatutStyle = (statut) => {
  switch (statut) {
    case "en_attente":
      return {
        text: "En attente",
        className: "bg-red-500/20 text-red-300 border border-red-500/30",
      };

    case "en_preparation":
      return {
        text: "En préparation",
        className:
          "bg-orange-500/20 text-orange-300 border border-orange-500/30",
      };

    case "prete":
      return {
        text: "Prête",
        className:
          "bg-green-500/20 text-green-300 border border-green-500/30",
      };

    case "livree":
      return {
        text: "Livrée",
        className:
          "bg-stone-500/20 text-stone-300 border border-stone-500/30",
      };

    default:
      return {
        text: statut,
        className:
          "bg-white/10 text-white border border-white/20",
      };
  }
};

const getProgressionCommande = (statut) => {
  const etapes = ["En attente", "En préparation", "Prête", "Livrée"];

  const indexActuel = etapes.indexOf(statut);

  return etapes.map((etape, index) => ({
    label: etape,
    active: index <= indexActuel,
  }));
};

const getTempsRestant = (commande) => {
  if (!commande.temps_estime_minutes || !commande.temps_estime_at) {
    return null;
  }

  if (commande.statut === "Prête") {
    return "Votre commande est prête ✅";
  }

  if (commande.statut === "Livrée") {
    return "Commande livrée ✅";
  }

  const debut = new Date(commande.temps_estime_at).getTime();
  const fin = debut + commande.temps_estime_minutes * 60000;
  const restant = Math.max(0, Math.ceil((fin - Date.now()) / 60000));

  return `Temps estimé restant : ${restant} min`;
};

const getMessageStatut = (statut) => {
  switch (statut) {
    case "En attente":
      return "🧾 Votre commande a bien été reçue.";

    case "En préparation":
      return "👨‍🍳 La cuisine prépare votre commande.";

    case "Prête":
      return "✅ Votre commande est prête !";

    case "Livrée":
      return "🎉 Merci pour votre commande Chez Omer.";

    default:
      return "";
  }
};

const getIconStatut = (statut) => {
  switch (statut) {
    case "en_attente":
      return "🧾";

    case "en_preparation":
      return "👨‍🍳";

    case "prete":
      return "✅";

    case "livree":
      return "🎉";

    default:
      return "🍴";
  }
};

  return (
    <main className="px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-black uppercase tracking-[0.5em] text-yellow-400">
            Historique
          </p>

          <h1 className="mt-6 text-5xl font-black text-white">
            Mes commandes
          </h1>

          <p className="mt-4 text-stone-300">
            Retrouvez vos anciennes commandes et recommandez en un clic.
          </p>
        </div>

        <div className="mt-10 space-y-5">
          {loading && (
            <p className="text-center text-stone-400">Chargement...</p>
          )}

          {!loading && commandes.length === 0 && (
            <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-8 text-center">
              <ShoppingCart className="mx-auto mb-4 text-yellow-300" size={42} />
              <p className="font-bold text-white">Aucune commande trouvée.</p>
            </div>
          )}

          {commandes.map((commande) => (
            <div
              key={commande.id}
              className={`rounded-3xl border p-6 ${
                ["En attente", "En préparation", "Prête"].includes(commande.statut)
                  ? "border-green-400 bg-green-500/15 shadow-[0_0_60px_rgba(34,197,94,0.35)] ring-2 ring-green-400/40 animate-pulse"
                  : "border-yellow-500/20 bg-white/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-yellow-300">
                    {commande.numero_commande}
                  </h2>

                  <p className="mt-1 text-sm text-stone-400">
                    {commande.created_at
                      ? new Date(commande.created_at).toLocaleString("fr-FR")
                      : ""}
                  </p>

                  <div
                    className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-black ${getStatutStyle(
                      commande.statut
                    ).className}`}
                  >
                    {getIconStatut(commande.statut)} {getStatutStyle(commande.statut).text}
                  
                  </div>
                  {getTempsRestant(commande) && (
                    <div className="mt-3 space-y-2">
                      <p className="inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white">
                        {getTempsRestant(commande)}
                      </p>

                      {!["Prête", "Livrée"].includes(commande.statut) && (
                        <p className="text-sm font-bold text-stone-300">
                          {getMessageStatut(commande.statut)}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-5 grid grid-cols-4 gap-2">
                    {getProgressionCommande(commande.statut).map((etape) => (
                      <div key={etape.label} className="text-center">
                        <div
                          className={`h-3 rounded-full ${
                            etape.active ? "bg-yellow-400" : "bg-white/10"
                          }`}
                        />

                        <p
                          className={`mt-2 text-xs font-bold ${
                            etape.active ? "text-yellow-300" : "text-stone-500"
                          }`}
                        >
                          {etape.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-white">
                    {formatPrice(commande.total || 0)}
                  </p>

                  <button
                    onClick={() => recommander(commande)}
                    className="mt-3 flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 font-black text-black shadow-[0_0_25px_rgba(250,204,21,0.25)] transition duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(251,146,60,0.4)]"
                  >
                    <RotateCcw size={18} />
                    Recommander
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(commande.contenu || []).map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-yellow-500/10 bg-black/50 p-4 text-sm text-stone-300 transition duration-300 hover:border-yellow-400/30 hover:bg-black/70"
                  >
                    <p className="font-black text-white">
                      {item.quantite}x {item.nom}
                    </p>

                    <p>{item.categorie}</p>

                    <p className="mt-1 text-yellow-300">
                      {formatPrice(item.total_ligne || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}