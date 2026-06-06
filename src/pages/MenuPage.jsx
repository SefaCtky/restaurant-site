import React from "react";
import { Plus } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function MenuPage({
  categoriesData,
  activeCategory,
  setActiveCategory,
  produits,
  getCategoryIcon,
  openProduct,
}) {
  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Notre carte"
        title="Menu Chez Omer"
        text="Cliquez sur une catégorie pour voir les produits."
      />

      <div className="mx-auto max-w-7xl space-y-5">
        {!categoriesData || categoriesData.length === 0 ? (
          <div className="text-center py-10 text-stone-500 font-bold">
            Chargement de la carte ou aucune catégorie trouvée...
          </div>
        ) : (
          categoriesData.map((section) => {
            const expanded = activeCategory === section.nom;
            const produitsCategorie = (produits || []).filter(
              (p) => p.categorie_id === section.id && p.actif === true
            );

            return (
              <div
                key={section.id}
                className={`overflow-hidden rounded-[2rem] border transition ${
                  expanded ? "border-yellow-400 bg-white text-stone-950" : "border-yellow-500/20 bg-black/60 text-white"
                }`}
              >
                <button
                  onClick={() => setActiveCategory(expanded ? null : section.nom)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="flex items-center gap-4 text-2xl font-black">
                    {getCategoryIcon(section.nom)}
                    {section.nom}
                  </span>

                  <span className={`rounded-full px-4 py-2 text-sm font-black ${expanded ? "bg-black text-yellow-300" : "bg-yellow-400 text-black"}`}>
                    {expanded ? "Fermer" : "Voir"}
                  </span>
                </button>

                {expanded && (
                  <div className="grid gap-4 border-t border-stone-200 p-6 md:grid-cols-2 lg:grid-cols-3">
                    {produitsCategorie.map((produit) => {
                      const isOutOfStock = produit.in_stock === false;

                      return (
                        <div key={produit.id} className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
                          {isOutOfStock && (
                            <>
                              <div className="absolute inset-0 z-10 rounded-2xl bg-white/45 backdrop-grayscale" />
                              <div className="absolute left-3 top-3 z-30 rounded-full bg-stone-900/85 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-lg">
                                Revient prochainement
                              </div>
                              <div className="absolute left-1/2 top-20 z-30 w-[88%] -translate-x-1/2 overflow-hidden rounded-2xl border border-yellow-200 bg-gradient-to-r from-[#8a5a00] via-[#ffd86b] to-[#8a5a00] px-5 py-3 text-center shadow-[0_0_20px_rgba(255,215,0,0.55)]">
                                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.50),transparent)] opacity-70" />
                                <span
                                  className="relative text-xl font-black tracking-wide text-[#3b2200]"
                                  style={{
                                    fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif",
                                    textShadow: "0 1px 2px rgba(255,255,255,0.45)",
                                  }}
                                >
                                  ✨ Victime de son succès ✨
                                </span>
                              </div>
                            </>
                          )}

                          {produit.image && (
                            <img
                              src={produit.image}
                              alt={produit.nom}
                              className={`mb-4 h-40 w-full rounded-2xl object-cover ${isOutOfStock ? "grayscale" : ""}`}
                            />
                          )}

                          <div className={`flex items-start justify-between gap-4 ${isOutOfStock ? "grayscale opacity-60" : ""}`}>
                            <div>
                              <h3 className="text-xl font-black">{produit.nom}</h3>
                              {produit.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{produit.description}</p>}
                            </div>

                            <p className="whitespace-nowrap text-xl font-black text-yellow-700">{produit.prix}€</p>
                          </div>

                          <button
                            onClick={() => {
                              if (isOutOfStock) return;
                              openProduct(
                                [
                                  produit.nom,
                                  produit.description,
                                  `${produit.prix}€`,
                                  produit.prix_menu ? `${produit.prix_menu}€` : "",
                                  produit.type || "",
                                  produit.image || "",
                                  produit.in_stock ?? true,
                                ],
                                section.nom
                              );
                            }}
                            disabled={isOutOfStock}
                            className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition ${
                              isOutOfStock ? "cursor-not-allowed bg-stone-400 text-white" : "bg-black text-white hover:bg-yellow-400 hover:text-black"
                            }`}
                          >
                            <Plus size={16} />
                            {isOutOfStock ? "Bientôt de retour" : "Ajouter"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}