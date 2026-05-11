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
              className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6"
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

                  <p className="mt-2 font-bold text-white">
                    Statut : {commande.statut}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-white">
                    {formatPrice(commande.total || 0)}
                  </p>

                  <button
                    onClick={() => recommander(commande)}
                    className="mt-3 flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300"
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
                    className="rounded-2xl bg-black/40 p-4 text-sm text-stone-300"
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