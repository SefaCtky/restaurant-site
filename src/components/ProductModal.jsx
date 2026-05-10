import React from "react";
import { X } from "lucide-react";

export default function ProductModal({
  selectedProduct,
  setSelectedProduct,
  getDynamicImage,
  formatPrice,
  selectedProductPrice,
  isSimpleTacos,
  isMaxiTacos,
  selectedMeats,
  extraCheddar,
  supplementSaucesTotal,
  needsDrinkSizeChoice,
  drinkSizeChoice,
  setDrinkSizeChoice,
  needsWaterSizeChoice,
  waterSizeChoice,
  setWaterSizeChoice,
  hasFormulaChoice,
  formulaChoice,
  setFormulaChoice,
  needsMenuEnfantDrink,
  menuEnfantBoissons,
  menuEnfantBoisson,
  setMenuEnfantBoisson,
  needsExtraCheddar,
  setExtraCheddar,
  needsSansSauceFromagere,
  sansSauceFromagere,
  setSansSauceFromagere,
  needsAccompagnementChoice,
  accompagnementOptions,
  accompagnementChoice,
  setAccompagnementChoice,
  tacosMeats,
  maxiTacosMeats,
  toggleMeat,
  needsBreadChoice,
  breadChoice,
  setBreadChoice,
  needsCruditeChoice,
  getCruditeList,
  selectedCrudites,
  toggleCrudite,
  needsSauceChoice,
  sauces,
  selectedSaucesSandwich,
  selectedSaucesFrites,
  toggleSauce,
  supplementSaucesSandwich,
  note,
  setNote,
  addToCart,
  isAddDisabled,
}) {
  if (!selectedProduct) return null;

  const isTacosCategory = selectedProduct.category === "Tacos";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur">
      <div className="max-h-[86vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-white p-6 text-stone-950 shadow-2xl">
        <div className="grid items-start gap-7 lg:grid-cols-[420px_1fr]">
          {getDynamicImage() && (
            <div className="sticky top-0 self-start overflow-hidden rounded-3xl bg-white p-2">
              <img src={getDynamicImage()} alt={selectedProduct.name} className="h-auto max-h-[360px] w-full rounded-2xl object-contain" />
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-yellow-700">Ajouter au panier</p>
                <h3 className="mt-2 text-3xl font-black">{selectedProduct.name}</h3>
                {selectedProduct.desc && <p className="mt-2 whitespace-pre-line text-stone-600">{selectedProduct.desc}</p>}
                <p className="mt-3 text-2xl font-black text-yellow-700">{formatPrice(selectedProductPrice)}</p>

                {selectedProduct.type === "durum-only" && <p className="mt-1 text-sm font-bold text-yellow-700">Dürüm imposé pour ce produit</p>}
                {isSimpleTacos(selectedProduct) && selectedMeats.length === 2 && <p className="mt-1 text-sm font-bold text-red-600">2ème viande : +2,00 €</p>}
                {isMaxiTacos(selectedProduct) && selectedMeats.length === 3 && <p className="mt-1 text-sm font-bold text-red-600">3ème viande : +2,00 €</p>}
                {extraCheddar && <p className="mt-1 text-sm font-bold text-red-600">Supplément cheddar : +2,00 €</p>}
                {supplementSaucesTotal > 0 && <p className="mt-1 text-sm font-bold text-red-600">Supplément sauces : +{formatPrice(supplementSaucesTotal)}</p>}
              </div>

              <button onClick={() => setSelectedProduct(null)} className="rounded-full bg-stone-100 p-3 hover:bg-stone-200">
                <X />
              </button>
            </div>

            {needsDrinkSizeChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choisissez le format</h4>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setDrinkSizeChoice("33cl")} className={`rounded-2xl border px-5 py-3 font-bold transition ${drinkSizeChoice === "33cl" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>33cl • {selectedProduct.basePriceLabel}</button>
                  <button onClick={() => setDrinkSizeChoice("50cl")} className={`rounded-2xl border px-5 py-3 font-bold transition ${drinkSizeChoice === "50cl" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>50cl • {selectedProduct.menuPriceLabel}</button>
                </div>
              </div>
            )}

            {needsWaterSizeChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choisissez le format</h4>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setWaterSizeChoice("50cl")} className={`rounded-2xl border px-5 py-3 font-bold transition ${waterSizeChoice === "50cl" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>50cl • {selectedProduct.basePriceLabel}</button>
                  <button onClick={() => setWaterSizeChoice("1L verre consigné")} className={`rounded-2xl border px-5 py-3 font-bold transition ${waterSizeChoice === "1L verre consigné" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>1L verre consigné • {selectedProduct.menuPriceLabel}</button>
                </div>
              </div>
            )}

            {hasFormulaChoice(selectedProduct) && !needsDrinkSizeChoice(selectedProduct) && !needsWaterSizeChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Formule</h4>
                <p className="mt-1 text-sm text-stone-600">Le menu ajoute une boisson et une frite.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setFormulaChoice("Seul")} className={`rounded-2xl border px-5 py-3 font-bold transition ${formulaChoice === "Seul" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>Seul • {selectedProduct.basePriceLabel}</button>
                  <button onClick={() => setFormulaChoice("Menu")} className={`rounded-2xl border px-5 py-3 font-bold transition ${formulaChoice === "Menu" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>Menu • {selectedProduct.menuPriceLabel}</button>
                </div>
              </div>
            )}

            {needsMenuEnfantDrink(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choisissez la boisson</h4>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {menuEnfantBoissons.map((choice) => (
                    <button key={choice} onClick={() => setMenuEnfantBoisson(choice)} className={`rounded-2xl border px-5 py-3 font-bold transition ${menuEnfantBoisson === choice ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{choice}</button>
                  ))}
                </div>
              </div>
            )}

            {needsExtraCheddar(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Supplément</h4>
                <button onClick={() => setExtraCheddar(!extraCheddar)} className={`mt-4 rounded-2xl border px-5 py-3 font-bold transition ${extraCheddar ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>Supplément cheddar +2€</button>
              </div>
            )}

            {needsSansSauceFromagere(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Allergène lactose</h4>
                <button onClick={() => setSansSauceFromagere(!sansSauceFromagere)} className={`mt-4 rounded-2xl border px-5 py-3 font-bold transition ${sansSauceFromagere ? "border-red-500 bg-red-500 text-white" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-red-400"}`}>Sans sauce fromagère</button>
              </div>
            )}

            {needsAccompagnementChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choisissez votre accompagnement</h4>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {accompagnementOptions.map((choice) => (
                    <button key={choice} onClick={() => setAccompagnementChoice(choice)} className={`rounded-2xl border px-5 py-3 font-bold transition ${accompagnementChoice === choice ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{choice}</button>
                  ))}
                </div>
              </div>
            )}

            {isSimpleTacos(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choix des viandes</h4>
                <p className="mt-1 text-sm text-stone-600">Choisissez 1 ou 2 viandes maximum. La 2ème viande ajoute +2€.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {tacosMeats.map((meat) => {
                    const selectedMeat = selectedMeats.find((item) => item.name === meat.name);
                    const active = Boolean(selectedMeat);
                    const locked = Boolean(selectedMeat?.locked);
                    const disabled = locked || (!active && selectedMeats.length >= 2);

                    return (
                      <button key={meat.name} onClick={() => toggleMeat(meat)} disabled={disabled} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? "border-yellow-500 bg-yellow-400 text-black" : disabled ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>
                        {meat.name}{locked ? " • inclus" : ""}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm font-bold text-yellow-700">Viandes sélectionnées : {selectedMeats.length}/2{selectedMeats.length === 2 ? " • 2ème viande +2€" : ""}</p>
              </div>
            )}

            {isMaxiTacos(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choix des viandes</h4>
                <p className="mt-1 text-sm text-stone-600">Choisissez jusqu’à 3 viandes. La 3ème viande ajoute +2€.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {maxiTacosMeats.map((meat) => {
                    const active = selectedMeats.some((item) => item.name === meat.name);
                    const disabled = !active && selectedMeats.length >= 3;

                    return (
                      <button key={meat.name} onClick={() => toggleMeat(meat)} disabled={disabled} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? "border-yellow-500 bg-yellow-400 text-black" : disabled ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>
                        {meat.name}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm font-bold text-yellow-700">Viandes sélectionnées : {selectedMeats.length}/3</p>
              </div>
            )}

            {needsBreadChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choisissez votre pain</h4>
                <div className="mt-4 flex gap-3">
                  {["Sandwich", "Dürüm"].map((choice) => (
                    <button key={choice} onClick={() => setBreadChoice(choice)} className={`rounded-2xl border px-5 py-3 font-bold transition ${breadChoice === choice ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{choice}</button>
                  ))}
                </div>
              </div>
            )}

            {!isTacosCategory && needsCruditeChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Options</h4>
                <p className="mt-1 text-sm text-stone-600">Sélectionnez ce que vous ne voulez pas dans votre plat.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {getCruditeList(selectedProduct).map((option) => (
                    <button key={option} onClick={() => toggleCrudite(option)} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedCrudites.includes(option) ? "border-red-500 bg-red-500 text-white" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-red-400"}`}>{option}</button>
                  ))}
                </div>
              </div>
            )}

            {needsSauceChoice(selectedProduct.category, selectedProduct.name, selectedProduct.type) && (
              <div className="mt-7">
                <h4 className="font-black">Sauces</h4>
                <p className="mt-1 text-sm text-stone-600">2 sauces au choix incluses. À partir de la 3ème : +0,20€ par sauce.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sauces.map((sauce) => (
                    <button key={`sandwich-${sauce}`} onClick={() => toggleSauce(sauce, "sandwich")} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedSaucesSandwich.includes(sauce) ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{sauce}</button>
                  ))}
                </div>

                {supplementSaucesSandwich > 0 && <p className="mt-3 text-sm font-bold text-red-600">Supplément sauces : {formatPrice(supplementSaucesSandwich)}</p>}

                {formulaChoice === "Menu" && selectedProduct.category !== "Accompagnements" && (
                  <div className="mt-7">
                    <h4 className="font-black">Sauces frites</h4>
                    <p className="mt-1 text-sm text-stone-600">2 sauces au choix incluses. À partir de la 3ème : +0,20€ par sauce.</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {sauces.map((sauce) => (
                        <button key={`frites-${sauce}`} onClick={() => toggleSauce(sauce, "frites")} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedSaucesFrites.includes(sauce) ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{sauce}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-7">
              <h4 className="font-black">Note</h4>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-yellow-500" placeholder="Exemple : bien cuit, sauce à part..." />
            </div>

            <button onClick={addToCart} disabled={isAddDisabled} className={`mt-6 w-full rounded-full px-6 py-4 font-black transition ${isAddDisabled ? "cursor-not-allowed bg-stone-300 text-stone-500" : "bg-black text-white hover:bg-yellow-400 hover:text-black"}`}>
              Ajouter au panier • {formatPrice(selectedProductPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
