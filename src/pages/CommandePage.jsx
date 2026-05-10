import React from "react";
import PageTitle from "../components/PageTitle";

export default function CommandePage({
  fermetureActive,
  cart,
  formatPrice,
  total,
  setCartOpen,
}) {
  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Panier"
        title="Votre panier Chez Omer"
        text="Retrouvez ici les produits ajoutés au panier, puis finalisez votre commande."
      />

      <div className="mx-auto max-w-3xl rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
        {fermetureActive && (
          <div className="mb-6 rounded-3xl border border-red-500 bg-red-600 px-6 py-4 text-center text-lg font-black text-white">
            Commandes temporairement fermées
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-center text-stone-400">Votre panier est vide.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/10 p-4">
                <div className="flex justify-between gap-4">
                  <p className="font-bold">
                    {item.quantity}x {item.name}
                  </p>

                  <p className="font-black text-yellow-300">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                {item.formulaChoice && (
                  <p className="mt-1 text-sm text-yellow-200">
                    Formule : {item.formulaChoice}
                  </p>
                )}

                {item.breadChoice && (
                  <p className="mt-1 text-sm text-yellow-200">
                    Choix : {item.breadChoice}
                  </p>
                )}

                {item.crudites?.length > 0 && (
                  <p className="mt-1 text-sm text-stone-300">
                    Options : {item.crudites.join(", ")}
                  </p>
                )}

                {item.saucesSandwich?.length > 0 && (
                  <p className="mt-1 text-sm text-stone-300">
                    Sauces : {item.saucesSandwich.join(", ")}
                  </p>
                )}

                {item.saucesFrites?.length > 0 && (
                  <p className="mt-1 text-sm text-stone-300">
                    Sauces frites : {item.saucesFrites.join(", ")}
                  </p>
                )}

                {item.note && (
                  <p className="mt-2 rounded-xl bg-yellow-400/10 px-3 py-2 text-sm font-bold text-yellow-200">
                    Note : {item.note}
                  </p>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-yellow-500/20 pt-4 text-2xl font-black">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setCartOpen(true)}
          className="mt-6 w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300"
        >
          Ouvrir le panier
        </button>
      </div>
    </main>
  );
}
