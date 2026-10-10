import React, { useState } from "react";
import { X, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

export default function CartDrawer({
  cartOpen,
  setCartOpen,
  cart,
  removeItem,
  changeQuantity,
  formatPrice,
  total,
  fermetureActive,
  isAdminTestMode = false,
}) {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [typeCommande, setTypeCommande] = useState("Sur place");
  const [testReceipt, setTestReceipt] = useState(null);

  if (!cartOpen) return null;

  const afficherIndisponibilite = () => {
    if (cart.length === 0) return;
    if (!isAdminTestMode) {
      setShowComingSoon(true);
      return;
    }
    // Simulation locale uniquement : aucune écriture Supabase, aucun paiement, aucun WhatsApp.
    setTestReceipt({
      reference: `TEST-${Date.now()}`,
      typeCommande,
      lignes: cart.map((item) => ({ ...item })),
      total,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !showComingSoon && !testReceipt) setCartOpen(false); }}>
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-stone-950 text-stone-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-yellow-500/20 p-5">
          <h3 className="text-2xl font-black">Votre panier</h3>
          <button onClick={() => setCartOpen(false)} className="rounded-full bg-white/10 p-3 hover:bg-white/20">
            <X />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {cart.length === 0 ? (
            <div className="rounded-[2rem] border border-yellow-500/20 bg-white/5 p-8 text-center">
              <ShoppingCart className="mx-auto mb-4 text-yellow-300" size={42} />
              <p className="text-lg font-bold">Votre panier est vide.</p>
              <p className="mt-2 text-stone-400">Ajoutez un produit depuis le menu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-yellow-500/20 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-black">{item.name}</h4>
                      <p className="text-sm text-stone-400">{item.category}</p>

                      {item.formulaChoice && <p className="mt-1 text-sm text-yellow-300">Formule : {item.formulaChoice}</p>}
                      {item.drinkSizeChoice && <p className="mt-1 text-sm text-yellow-300">Format : {item.drinkSizeChoice}</p>}
                      {item.waterSizeChoice && <p className="mt-1 text-sm text-yellow-300">Format : {item.waterSizeChoice}</p>}
                      {item.menuEnfantBoisson && <p className="mt-1 text-sm text-yellow-300">Boisson : {item.menuEnfantBoisson}</p>}
                      {item.extraCheddar && <p className="mt-1 text-sm text-yellow-300">Supplément cheddar : +2,00 €</p>}
                      {item.sansSauceFromagere && <p className="mt-1 text-sm text-yellow-300">Sans sauce fromagère</p>}
                      {item.breadChoice && <p className="mt-1 text-sm text-yellow-300">Choix : {item.breadChoice}</p>}
                      {item.accompagnementChoice && <p className="mt-1 text-sm text-yellow-300">Accompagnement : {item.accompagnementChoice}</p>}

                      {item.meats?.length > 0 && (
                        <p className="mt-1 text-sm text-yellow-300">
                          Viandes : {item.meats.map((meat) => meat.name).join(", ")}
                          {item.tacosSimple && item.meats.length === 2 ? " | 2ème viande (+2€)" : ""}
                          {!item.tacosSimple && item.meats.length === 3 ? " | 3ème viande (+2€)" : ""}
                        </p>
                      )}
                    </div>

                    <button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-200">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {item.crudites?.length > 0 && <p className="mt-3 text-sm text-stone-300">Options : {item.crudites.join(", ")}</p>}
                  {item.saucesSandwich?.length > 0 && <p className="mt-3 text-sm text-stone-300">Sauces : {item.saucesSandwich.join(", ")}</p>}
                  {item.saucesFrites?.length > 0 && <p className="mt-3 text-sm text-stone-300">Sauces frites : {item.saucesFrites.join(", ")}</p>}
                  {item.supplementSauces > 0 && <p className="mt-2 text-sm font-bold text-red-300">Supplément sauces : {formatPrice(item.supplementSauces)}</p>}
                  {item.note && <p className="mt-2 text-sm text-stone-300">Note : {item.note}</p>}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => changeQuantity(item.id, -1)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                        <Minus size={16} />
                      </button>

                      <span className="font-black">{item.quantity}</span>

                      <button onClick={() => changeQuantity(item.id, 1)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="font-black text-yellow-300">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-yellow-500/20 p-5">
        <div className="mb-5">
          <p className="mb-3 text-sm font-black text-yellow-300">
            Type de commande
          </p>

          <div className="flex gap-3">
            {["Sur place", "À emporter"].map((type) => (
              <button
                key={type}
                onClick={() => setTypeCommande(type)}
                className={`rounded-full px-5 py-3 font-black transition ${
                  typeCommande === type
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
          <div className="mb-4 flex items-center justify-between text-2xl font-black">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <button
            onClick={afficherIndisponibilite}
            disabled={cart.length === 0}
            className={`block w-full rounded-full px-6 py-4 text-center font-black transition ${
              cart.length > 0
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "pointer-events-none bg-white/10 text-stone-500"
            }`}
          >
            {isAdminTestMode ? "Simuler la commande (admin)" : "Valider mon panier"}
          </button>

          <p className="mt-3 text-center text-xs text-stone-500">
            {isAdminTestMode
              ? "MODE TEST ADMIN — Simulation locale uniquement. Aucune commande envoyée en cuisine ou enregistrée dans Supabase."
              : "Vous pouvez consulter votre panier et son total. La commande en ligne sera bientôt disponible."}
          </p>
        </div>
      </div>

      {testReceipt && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="test-receipt-title" className="w-full max-w-md rounded-[2rem] border border-yellow-400/40 bg-stone-950 p-7 text-white shadow-2xl">
            <p className="text-xs font-black tracking-widest text-yellow-300">MODE TEST ADMIN — NON TRANSMIS</p>
            <h3 id="test-receipt-title" className="mt-2 text-2xl font-black">Commande simulée</h3>
            <p className="mt-2 text-sm text-stone-400">{testReceipt.reference} · {testReceipt.typeCommande}</p>
            <div className="mt-5 max-h-64 space-y-2 overflow-y-auto border-y border-white/10 py-4">
              {testReceipt.lignes.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between gap-3 text-sm">
                  <span>{item.quantity} × {item.name}{item.drinkSizeChoice ? ` (${item.drinkSizeChoice})` : ""}{item.formulaChoice ? ` — ${item.formulaChoice}` : ""}</span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-right text-xl font-black text-yellow-300">Total : {formatPrice(testReceipt.total)}</p>
            <p className="mt-3 text-sm text-stone-400">Aucun paiement, aucun message et aucune insertion dans Supabase. Cette simulation n'apparaîtra pas en cuisine.</p>
            <button type="button" onClick={() => setTestReceipt(null)} className="mt-6 w-full rounded-full bg-yellow-400 px-6 py-3 font-black text-black">Fermer le test</button>
          </div>
        </div>
      )}

      {showComingSoon && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-5" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="commande-indisponible-title" className="w-full max-w-md rounded-[2rem] border border-yellow-400/30 bg-stone-950 p-8 text-center text-white shadow-2xl">
            <div className="mb-4 text-5xl" aria-hidden="true">🍔</div>
            <h3 id="commande-indisponible-title" className="text-2xl font-black text-yellow-300">
              La commande en ligne arrive bientôt !
            </h3>
            <p className="mt-4 text-stone-300">
              Ce service est temporairement indisponible. Vous pourrez bientôt commander directement sur notre site !
            </p>
            <button
              type="button"
              onClick={() => setShowComingSoon(false)}
              className="mt-7 w-full rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
