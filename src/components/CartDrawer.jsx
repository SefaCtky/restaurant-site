import React, { useState } from "react";
import { X, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

export default function CartDrawer({
  user,
  cartOpen,
  setCartOpen,
  cart,
  setCart,
  removeItem,
  changeQuantity,
  formatPrice,
  total,
  fermetureActive,
  whatsappNumber,
  orderMessage,
  supabase,
}) {
  const [sendingOrder, setSendingOrder] = useState(false);
  const [typeCommande, setTypeCommande] = useState("Sur place");

  if (!cartOpen) return null;

  const enregistrerEtEnvoyerCommande = async () => {
    if (cart.length === 0 || fermetureActive || sendingOrder) return;

    setSendingOrder(true);

    const maintenant = new Date();

    const annee = maintenant.getFullYear();
    const mois = String(maintenant.getMonth() + 1).padStart(2, "0");

    const debutMois = new Date(annee, maintenant.getMonth(), 1)
      .toISOString();

    const finMois = new Date(annee, maintenant.getMonth() + 1, 1)
      .toISOString();

    const prefix = `OMER-${annee}-${mois}-`;

const { data: derniereCommande, error: numeroError } = await supabase
  .from("commandes")
  .select("numero_commande")
  .like("numero_commande", `${prefix}%`)
  .order("numero_commande", { ascending: false })
  .limit(1);

if (numeroError) {
  console.error(numeroError);
  alert("Erreur génération numéro de commande ❌");
  return;
}

let dernierNumero = 0;

if (derniereCommande?.length > 0) {
  dernierNumero =
    parseInt(derniereCommande[0].numero_commande.split("-")[3], 10) || 0;
}

const prochainNumero = String(dernierNumero + 1).padStart(5, "0");

const numeroCommande = `${prefix}${prochainNumero}`;

    const contenuCommande = cart.map((item) => ({
      nom: item.name,
      categorie: item.category,
      quantite: item.quantity,
      prix_unitaire: item.price,
      total_ligne: item.price * item.quantity,
      formule: item.formulaChoice || "",
      format_boisson: item.drinkSizeChoice || "",
      format_eau: item.waterSizeChoice || "",
      boisson_menu_enfant: item.menuEnfantBoisson || "",
      supplement_cheddar: item.extraCheddar || false,
      sans_sauce_fromagere: item.sansSauceFromagere || false,
      choix_pain: item.breadChoice || "",
      accompagnement: item.accompagnementChoice || "",
      viandes: item.meats || [],
      crudites: item.crudites || [],
      sauces: item.saucesSandwich || [],
      sauces_frites: item.saucesFrites || [],
      supplement_sauces: item.supplementSauces || 0,
      note: item.note || "",
    }));

    console.log("USER COMMANDE :", user);

    const { error } = await supabase.from("commandes").insert({
      numero_commande: numeroCommande,
      user_id: user?.id || null,
      contenu: contenuCommande,
      total,
      statut: "En attente",
      mode_paiement: typeCommande,
      notes: "",
    });

    if (error) {
      console.error(error);
      alert("Erreur lors de l’enregistrement de la commande ❌");
      setSendingOrder(false);
      return;
    }

    const messageAvecNumero = `${decodeURIComponent(orderMessage)}%0A%0ANuméro de commande : ${numeroCommande}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${messageAvecNumero}`, "_blank");

    if (setCart) {
      setCart([]);
    }

    setCartOpen(false);
    setSendingOrder(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm">
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
            onClick={enregistrerEtEnvoyerCommande}
            disabled={cart.length === 0 || fermetureActive || sendingOrder}
            className={`block w-full rounded-full px-6 py-4 text-center font-black transition ${
              cart.length > 0 && !fermetureActive
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "pointer-events-none bg-white/10 text-stone-500"
            }`}
          >
            {fermetureActive
              ? "Commandes temporairement fermées"
              : sendingOrder
              ? "Enregistrement..."
              : "Envoyer la commande WhatsApp"}
          </button>

          <p className="mt-3 text-center text-xs text-stone-500">
            La commande est enregistrée automatiquement avant l’envoi WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
