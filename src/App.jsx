import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  Utensils,
  Wine,
  CalendarDays,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";

const sauces = [
  "Blanche",
  "Ketchup",
  "Mayo",
  "Harissa",
  "Samouraï",
  "Algérienne",
  "Biggy",
  "Curry",
  "BBQ",
  "Fromagère",
  "Tandoori",
  "Piquante",
  "Sauce verte",
  "Sauce sucrée",
  "Sauce salade",
];
const SAUCES_GRATUITES = 2;
const PRIX_SAUCE_SUPPLEMENTAIRE = 0.2;

function calculSupplementSauces(listeSauces) {
  return Math.max(0, listeSauces.length - SAUCES_GRATUITES) * PRIX_SAUCE_SUPPLEMENTAIRE;
}

const cruditeOptions = ["Sans salade", "Sans tomate", "Sans oignon"];

const maxiTacosMeats = [
  { name: "Kebab poulet", extra: 0 },
  { name: "Poulet mariné", extra: 0 },
  { name: "Sucuk", extra: 0 },
  { name: "Tenders", extra: 0 },
  { name: "Cordon bleu", extra: 0 },
  { name: "Kebab veau", extra: 1 },
  { name: "Steak", extra: 1 },
  { name: "Köfte", extra: 1 },
];

const menuItems = [
  {
    category: "Ekmek Arası / Sandwich / Dürüm",
    items: [
      ["Kebab poulet", "Sandwich ou dürüm", "7€", "10€"],
      ["Kebab veau", "Sandwich ou dürüm", "9€", "12€"],
      ["Poulet mariné", "Sandwich ou dürüm", "7€", "10€"],
      ["Köfte", "Sandwich ou dürüm", "7€", "10€"],
      ["Sucuk", "Sandwich ou dürüm", "7€", "10€"],
      ["Tenders", "Sandwich ou dürüm", "7€", "10€"],
      ["Cordon bleu", "Sandwich ou dürüm", "7€", "10€"],
    ],
  },
  {
    category: "Accompagnements",
    items: [
      ["Grande frites", "Portion généreuse", "4,50€"],
      ["Petite frites", "Portion classique", "3€"],
      ["Bulgur", "Accompagnement maison", "3€"],
      ["Pilav", "Riz turc", "3€"],
    ],
  },
  {
    category: "Tacos",
    items: [
      ["Kebab poulet", "Tacos", "8€", "11€"],
      ["Kebab veau", "Tacos", "9€", "12€"],
      ["Poulet mariné", "Tacos", "8€", "11€"],
      ["Köfte", "Tacos", "9€", "12€"],
      ["Sucuk", "Tacos", "8€", "11€"],
      ["Tenders", "Tacos", "8€", "11€"],
      ["Cordon bleu", "Tacos", "8€", "11€"],
      ["Steak", "Tacos", "9€", "12€"],
      ["Maxi tacos", "Deux viandes + deux galettes", "12€", "15€", "maxi-tacos"],
    ],
  },
  {
    category: "Assiettes",
    items: [
      ["Kebab poulet", "Servi avec accompagnement", "13€"],
      ["Kebab veau", "Servi avec accompagnement", "16€"],
      ["Poulet mariné", "Servi avec accompagnement", "13€"],
      ["Köfte", "Servi avec accompagnement", "14€"],
      ["Bulgurlu", "Spécialité maison", "16€"],
      ["Ali nazik", "Spécialité turque", "16€"],
      ["Kuşbaşı", "Spécialité turque", "16€"],
      ["Mixte / Karışık", "Assiette mixte", ""],
    ],
  },
  {
    category: "Burgers",
    items: [
      ["Steak 120g", "Burger", "9€", "12€"],
      ["Poulet", "Burger", "7€", "10€"],
    ],
  },
  {
    category: "Meze",
    items: [
      ["Haydari", "Spécialité turque", "3€"],
      ["Ezme", "Spécialité turque", "3€"],
      ["Havuç tarator", "Carottes façon turque", "3€"],
      ["Pembe sultan", "Meze maison", "3€"],
      ["Çoban salatası", "Salade traditionnelle", "6€"],
      ["Hellim peynirli salata", "Salade au fromage hellim", "7€"],
      ["Yoğurtlu patlıcan közlemesi", "Aubergine grillée au yaourt", "6€"],
    ],
  },
  {
    category: "Tex Mex",
    items: [
      ["Kebab poulet petite", "Petite portion", "6€"],
      ["Kebab poulet grande", "Grande portion", "12€"],
      ["Kebab veau petite", "Petite portion", "7€"],
      ["Kebab veau grande", "Grande portion", "14€"],
      ["4 tenders", "Croustillants", "4€"],
      ["8 tenders", "Croustillants", "7€"],
    ],
  },
  {
    category: "Boissons",
    items: [
      ["Coca Cola", "33cl", "2€"],
      ["Coca Cherry", "33cl", "2€"],
      ["Coca Cola Zéro", "33cl", "2€"],
      ["Sprite", "33cl", "2€"],
      ["Orangina", "33cl", "2€"],
      ["Perrier", "33cl", "2€"],
      ["Eau", "33cl", "1,50€"],
      ["Oasis Tropical", "33cl", "2€"],
      ["Oasis Pomme Cassis", "33cl", "2€"],
      ["Fanta orange", "33cl", "2€"],
      ["Schweppes pomme", "33cl", "2€"],
      ["Schweppes agrume", "33cl", "2€"],
      ["Ice Tea Pêche", "33cl", "2€"],
      ["Ayran", "Boisson traditionnelle", "2€"],
    ],
  },
  {
    category: "Desserts",
    items: [
      ["Tiramisu", "Dessert maison", "3,50€"],
      ["Künefe", "Spécialité turque", "6,50€"],
      ["Sütlaç", "Riz au lait turc", "5€"],
      ["Baklava 2 parts", "Pâtisserie orientale", "4€"],
      ["Tarte Daim", "Dessert gourmand", "3,50€"],
    ],
  },
  {
    category: "Soupe",
    items: [["Mercimek çorbası", "Soupe turque aux lentilles", "5€"]],
  },
  {
    category: "Menu enfant",
    items: [
      ["Menu nuggets", "1 petite frite + 1 compote + 4 nuggets + 1 Capri-Sun/Ayran", "10€"],
      ["Menu burger", "1 petite frite + 1 compote + 1 burger + 1 Capri-Sun/Ayran", "10€"],
    ],
  },
  {
    category: "Sauces",
    items: sauces.map((sauce) => [
      sauce,
      "2 sauces incluses, puis +0,20€ par sauce supplémentaire",
      "",
    ]),
  },
];

const reviews = [
  "Une cuisine généreuse, familiale et pleine de goût.",
  "Service rapide, accueil chaleureux et produits HALAL de qualité.",
  "Des saveurs turques authentiques, généreuses et pleines de caractère.",
];

function parsePrice(price) {
  if (!price) return 0;
  return Number(price.replace("€", "").replace(",", ".").trim()) || 0;
}

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function formatMenuSupplement(price, menuPrice) {
  const supplement = parsePrice(menuPrice) - parsePrice(price);
  return supplement > 0 ? `+${formatPrice(supplement)}` : "";
}

export default function RestaurantWebsite() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [selectedSaucesSandwich, setSelectedSaucesSandwich] = useState([]);
  const [selectedSaucesFrites, setSelectedSaucesFrites] = useState([]);

  const [selectedCrudites, setSelectedCrudites] = useState([]);
  const [selectedMeats, setSelectedMeats] = useState([]);
  const [breadChoice, setBreadChoice] = useState("Sandwich");
  const [formulaChoice, setFormulaChoice] = useState("Seul");
  const [note, setNote] = useState("");

  const nav = ["Accueil", "Menu", "À propos", "Commande", "Contact"];

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const needsSauceChoice = (category) =>
    !["Boissons", "Desserts", "Soupe", "Sauces", "Accompagnements"].includes(category);

  const needsCruditeChoice = (category) =>
    ["Ekmek Arası / Sandwich / Dürüm", "Tacos", "Assiettes", "Burgers"].includes(category);

  const needsBreadChoice = (category) => category === "Ekmek Arası / Sandwich / Dürüm";

  const hasFormulaChoice = (product) => Boolean(product?.menuPriceLabel);

  const isMaxiTacos = (product) => product?.type === "maxi-tacos";

  const openProduct = (product, category) => {
    const [name, desc, price, menuPrice, type] = product;
    if (!price) return;

    setSelectedProduct({
      name,
      desc,
      basePrice: parsePrice(price),
      basePriceLabel: price,
      menuPrice: menuPrice ? parsePrice(menuPrice) : null,
      menuPriceLabel: menuPrice || "",
      category,
      type: type || "",
    });

    setSelectedSaucesSandwich([]);
    setSelectedSaucesFrites([]);
    setSelectedCrudites([]);
    setSelectedMeats([]);
    setBreadChoice("Sandwich");
    setFormulaChoice("Seul");
    setNote("");
  };

  const toggleSauce = (sauce, type) => {
    if (type === "sandwich") {
      setSelectedSaucesSandwich((current) =>
        current.includes(sauce)
          ? current.filter((s) => s !== sauce)
          : [...current, sauce]
      );
    }

    if (type === "frites") {
      setSelectedSaucesFrites((current) =>
        current.includes(sauce)
          ? current.filter((s) => s !== sauce)
          : [...current, sauce]
      );
    }
  };

  const toggleCrudite = (option) =>
    setSelectedCrudites((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );

  const toggleMeat = (meat) => {
    setSelectedMeats((current) => {
      const exists = current.some((item) => item.name === meat.name);
      if (exists) return current.filter((item) => item.name !== meat.name);
      if (current.length >= 2) return current;
      return [...current, meat];
    });
  };

  const selectedMeatsExtra = selectedMeats.reduce((sum, meat) => sum + meat.extra, 0);

  const supplementSaucesSandwich = calculSupplementSauces(selectedSaucesSandwich);
  const supplementSaucesFrites =
    formulaChoice === "Menu" ? calculSupplementSauces(selectedSaucesFrites) : 0;
  const supplementSaucesTotal = supplementSaucesSandwich + supplementSaucesFrites;

  const selectedProductPrice = selectedProduct
    ? (formulaChoice === "Menu" && selectedProduct.menuPrice
        ? selectedProduct.menuPrice
        : selectedProduct.basePrice) +
      selectedMeatsExtra +
      supplementSaucesTotal
    : 0;

  const addToCart = () => {
    if (!selectedProduct) return;
    if (isMaxiTacos(selectedProduct) && selectedMeats.length === 0) return;

    const cartItem = {
      id: `${selectedProduct.name}-${selectedProduct.category}-${Date.now()}`,
      name: selectedProduct.name,
      desc: selectedProduct.desc,
      category: selectedProduct.category,
      price: selectedProductPrice,
      formulaChoice: hasFormulaChoice(selectedProduct) ? formulaChoice : "",
      breadChoice: needsBreadChoice(selectedProduct.category) ? breadChoice : "",
      meats: isMaxiTacos(selectedProduct) ? selectedMeats : [],
      saucesSandwich: selectedSaucesSandwich,
      saucesFrites: formulaChoice === "Menu" ? selectedSaucesFrites : [],
      supplementSauces: supplementSaucesTotal,
      crudites: selectedCrudites,
      note,
      quantity: 1,
    };

    setCart((current) => [...current, cartItem]);
    setSelectedProduct(null);
    setCartOpen(true);
  };

  const changeQuantity = (id, delta) =>
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );

  const removeItem = (id) => setCart((current) => current.filter((item) => item.id !== id));

  const orderLines = cart
    .map((item) => {
      const formule = item.formulaChoice ? `\n  Formule : ${item.formulaChoice}` : "";
      const choix = item.breadChoice ? `\n  Choix : ${item.breadChoice}` : "";
      const meats = item.meats?.length
        ? `\n  Viandes : ${item.meats
            .map((meat) => `${meat.name}${meat.extra ? " (+1€)" : ""}`)
            .join(", ")}`
        : "";
      const crudites = item.crudites?.length
        ? `\n  Crudités : ${item.crudites.join(", ")}`
        : "";
      const saucesSandwichText = item.saucesSandwich?.length
        ? `\n  Sauces sandwich : ${item.saucesSandwich.join(", ")}`
        : "";
      const saucesFritesText = item.saucesFrites?.length
        ? `\n  Sauces frites : ${item.saucesFrites.join(", ")}`
        : "";
      const supplementSaucesText =
        item.supplementSauces > 0
          ? `\n  Supplément sauces : ${formatPrice(item.supplementSauces)}`
          : "";
      const noteText = item.note ? `\n  Note : ${item.note}` : "";

      return `- ${item.quantity}x ${item.name} (${item.category}) - ${formatPrice(
        item.price * item.quantity
      )}${formule}${choix}${meats}${crudites}${saucesSandwichText}${saucesFritesText}${supplementSaucesText}${noteText}`;
    })
    .join("\n\n");

  const orderMessage = encodeURIComponent(
    `Bonjour Chez Omer, je souhaite passer commande :\n\n${orderLines}\n\nTotal : ${formatPrice(total)}`
  );

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#accueil" className="text-xl font-bold tracking-wide">
            Chez Omer
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace("à ", "a-").replace("é", "e")}`}
                className="text-sm text-stone-300 transition hover:text-amber-300"
              >
                {item}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setCartOpen(true)}
            className="relative hidden rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 md:inline-flex md:items-center md:gap-2"
          >
            <ShoppingCart size={18} />
            Panier
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                {itemCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Ouvrir le menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-stone-950 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {nav.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace("à ", "a-").replace("é", "e")}`}
                  onClick={() => setOpen(false)}
                  className="text-stone-300"
                >
                  {item}
                </a>
              ))}

              <button
                onClick={() => setCartOpen(true)}
                className="rounded-full bg-amber-400 px-5 py-3 font-bold text-stone-950"
              >
                Voir le panier ({itemCount})
              </button>
            </div>
          </div>
        )}
      </header>

      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-amber-400 px-5 py-4 font-black text-stone-950 shadow-2xl md:hidden"
      >
        <ShoppingCart /> {itemCount}
      </button>

<section
  id="accueil"
  className="relative flex min-h-screen items-center overflow-hidden bg-black pt-24"
>
  {/* Fond */}
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20" />

    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.15),transparent_35%),linear-gradient(to_bottom,rgba(0,0,0,0.7),rgba(0,0,0,0.96))]" />

    {/* Glow orange */}
    <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
    <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
  </div>

  <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-2">
    {/* Texte */}
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-sm text-amber-200 backdrop-blur">
        <Utensils size={16} />
        Restaurant HALAL • Fait maison
      </div>

      <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">
        Le goût du vrai
        <span className="block bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
          kebab maison.
        </span>
      </h1>

      <p className="mt-8 max-w-xl text-lg leading-8 text-stone-300">
        Viandes sélectionnées, recettes maison, cuisson maîtrisée et ambiance
        authentique. Chez Omer vous propose une expérience street food premium
        100% HALAL.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <a
          href="#menu"
          className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-4 text-center font-black text-black shadow-2xl shadow-orange-500/30 transition hover:scale-105"
        >
          Voir le menu
        </a>

        <button
          onClick={() => setCartOpen(true)}
          className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-center font-bold text-white backdrop-blur transition hover:border-amber-400 hover:bg-white/10"
        >
          Voir mon panier
        </button>
      </div>

      {/* Stats */}
      <div className="mt-12 flex flex-wrap gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <p className="text-3xl font-black text-amber-300">100%</p>
          <p className="text-sm text-stone-300">HALAL</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <p className="text-3xl font-black text-amber-300">Maison</p>
          <p className="text-sm text-stone-300">Recettes authentiques</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
          <p className="text-3xl font-black text-amber-300">⭐ 5/5</p>
          <p className="text-sm text-stone-300">Avis clients</p>
        </div>
      </div>
    </motion.div>

    {/* Image */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9 }}
      className="relative"
    >
      <div className="absolute -inset-5 rounded-[3rem] bg-gradient-to-r from-orange-500/20 to-amber-400/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
        <div className="h-[600px] rounded-[2rem] bg-[url('https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
      </div>

      {/* Badge */}
      <div className="absolute -bottom-6 left-6 rounded-3xl border border-white/10 bg-black/70 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-1 text-amber-300">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={18} fill="currentColor" />
          ))}
        </div>

        <p className="mt-2 text-sm text-stone-300">
          Le kebab fait maison • Chez Omer
        </p>
      </div>
    </motion.div>
  </div>
</section>

      <section id="menu" className="bg-stone-100 px-5 py-24 text-stone-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              Notre carte
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Notre menu Chez Omer
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-stone-600">
              Choisissez vos plats, vos sauces sandwich et vos sauces frites.
              2 sauces incluses, puis +0,20€ par sauce supplémentaire.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {menuItems.map((section) => (
              <div
                key={section.category}
                className="rounded-[2rem] bg-white p-7 shadow-xl shadow-stone-300/40"
              >
                <h3 className="mb-6 flex items-center gap-3 text-2xl font-black">
                  <Wine className="text-amber-700" /> {section.category}
                </h3>

                <div className="space-y-5">
                  {section.items.map(([name, desc, price, menuPrice, type]) => (
                    <div
                      key={`${section.category}-${name}-${desc}`}
                      className="border-b border-stone-200 pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold">{name}</h4>
                          <p className="mt-2 text-sm leading-6 text-stone-600">{desc}</p>
                          {menuPrice && (
                            <p className="mt-1 text-xs font-bold text-amber-700">
                              Menu : {menuPrice} ({formatMenuSupplement(price, menuPrice)} de plus)
                            </p>
                          )}
                          {type === "maxi-tacos" && (
                            <p className="mt-1 text-xs font-bold text-red-700">
                              Choix de 2 viandes max • +1€ pour veau, steak ou köfte
                            </p>
                          )}
                        </div>
                        <span className="whitespace-nowrap text-right font-black text-amber-700">
                          {price || ""}
                        </span>
                      </div>

                      {price && section.category !== "Sauces" && (
                        <button
                          onClick={() =>
                            openProduct([name, desc, price, menuPrice, type], section.category)
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-stone-950"
                        >
                          <Plus size={16} /> Ajouter
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-6 text-stone-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-700">
                  Ajouter au panier
                </p>
                <h3 className="mt-2 text-3xl font-black">{selectedProduct.name}</h3>
                <p className="mt-2 text-stone-600">{selectedProduct.desc}</p>
                <p className="mt-3 text-2xl font-black text-amber-700">
                  {formatPrice(selectedProductPrice)}
                </p>

                {selectedProduct.menuPriceLabel && (
                  <p className="mt-1 text-sm font-bold text-stone-600">
                    Menu : {selectedProduct.menuPriceLabel} (
                    {formatMenuSupplement(
                      selectedProduct.basePriceLabel,
                      selectedProduct.menuPriceLabel
                    )}{" "}
                    de plus)
                  </p>
                )}

                {isMaxiTacos(selectedProduct) && selectedMeatsExtra > 0 && (
                  <p className="mt-1 text-sm font-bold text-red-600">
                    Supplément viandes : +{formatPrice(selectedMeatsExtra)}
                  </p>
                )}

                {supplementSaucesTotal > 0 && (
                  <p className="mt-1 text-sm font-bold text-red-600">
                    Supplément sauces : +{formatPrice(supplementSaucesTotal)}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-full bg-stone-100 p-3 hover:bg-stone-200"
              >
                <X />
              </button>
            </div>

            {hasFormulaChoice(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Formule</h4>
                <p className="mt-1 text-sm text-stone-600">
                  Le menu ajoute une boisson et une frite.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormulaChoice("Seul")}
                    className={`rounded-2xl border px-5 py-3 font-bold transition ${
                      formulaChoice === "Seul"
                        ? "border-amber-500 bg-amber-400 text-stone-950"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400"
                    }`}
                  >
                    Seul • {selectedProduct.basePriceLabel}
                  </button>
                  <button
                    onClick={() => setFormulaChoice("Menu")}
                    className={`rounded-2xl border px-5 py-3 font-bold transition ${
                      formulaChoice === "Menu"
                        ? "border-amber-500 bg-amber-400 text-stone-950"
                        : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400"
                    }`}
                  >
                    Menu • {selectedProduct.menuPriceLabel}
                  </button>
                </div>
              </div>
            )}

            {isMaxiTacos(selectedProduct) && (
              <div className="mt-7">
                <h4 className="font-black">Choix des viandes</h4>
                <p className="mt-1 text-sm text-stone-600">
                  Choisissez 2 viandes maximum. Kebab veau, steak et köfte ajoutent +1€ par viande.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {maxiTacosMeats.map((meat) => {
                    const active = selectedMeats.some((item) => item.name === meat.name);
                    const disabled = !active && selectedMeats.length >= 2;

                    return (
                      <button
                        key={meat.name}
                        onClick={() => toggleMeat(meat)}
                        disabled={disabled}
                        className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                          active
                            ? "border-amber-500 bg-amber-400 text-stone-950"
                            : disabled
                            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400"
                        }`}
                      >
                        {meat.name}
                        {meat.extra ? " +1€" : ""}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm font-bold text-amber-700">
                  Viandes sélectionnées : {selectedMeats.length}/2
                </p>
              </div>
            )}

            {needsBreadChoice(selectedProduct.category) && (
              <div className="mt-7">
                <h4 className="font-black">Choisissez votre pain</h4>
                <div className="mt-4 flex gap-3">
                  {["Sandwich", "Dürüm"].map((choice) => (
                    <button
                      key={choice}
                      onClick={() => setBreadChoice(choice)}
                      className={`rounded-2xl border px-5 py-3 font-bold transition ${
                        breadChoice === choice
                          ? "border-amber-500 bg-amber-400 text-stone-950"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {needsCruditeChoice(selectedProduct.category) && (
              <div className="mt-7">
                <h4 className="font-black">Crudités</h4>
                <p className="mt-1 text-sm text-stone-600">
                  Sélectionnez ce que vous ne voulez pas dans votre plat.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {cruditeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleCrudite(option)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                        selectedCrudites.includes(option)
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:border-red-400"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {needsSauceChoice(selectedProduct.category) && (
              <div className="mt-7">
                <h4 className="font-black">Sauces sandwich</h4>
                <p className="mt-1 text-sm text-stone-600">
                  2 sauces au choix incluses. À partir de la 3ème : +0,20€ par sauce.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sauces.map((sauce) => (
                    <button
                      key={`sandwich-${sauce}`}
                      onClick={() => toggleSauce(sauce, "sandwich")}
                      className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                        selectedSaucesSandwich.includes(sauce)
                          ? "border-amber-500 bg-amber-400 text-stone-950"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400"
                      }`}
                    >
                      {sauce}
                    </button>
                  ))}
                </div>

                {supplementSaucesSandwich > 0 && (
                  <p className="mt-3 text-sm font-bold text-red-600">
                    Supplément sauces sandwich : {formatPrice(supplementSaucesSandwich)}
                  </p>
                )}

                {formulaChoice === "Menu" && (
                  <div className="mt-7">
                    <h4 className="font-black">Sauces frites</h4>
                    <p className="mt-1 text-sm text-stone-600">
                      2 sauces au choix incluses. À partir de la 3ème : +0,20€ par sauce.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {sauces.map((sauce) => (
                        <button
                          key={`frites-${sauce}`}
                          onClick={() => toggleSauce(sauce, "frites")}
                          className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                            selectedSaucesFrites.includes(sauce)
                              ? "border-amber-500 bg-amber-400 text-stone-950"
                              : "border-stone-200 bg-stone-50 text-stone-700 hover:border-amber-400"
                          }`}
                        >
                          {sauce}
                        </button>
                      ))}
                    </div>

                    {supplementSaucesFrites > 0 && (
                      <p className="mt-3 text-sm font-bold text-red-600">
                        Supplément sauces frites : {formatPrice(supplementSaucesFrites)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-7">
              <h4 className="font-black">Note</h4>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-3 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                placeholder="Exemple : bien cuit, sauce à part..."
              />
            </div>

            <button
              onClick={addToCart}
              disabled={isMaxiTacos(selectedProduct) && selectedMeats.length === 0}
              className={`mt-6 w-full rounded-full px-6 py-4 font-black transition ${
                isMaxiTacos(selectedProduct) && selectedMeats.length === 0
                  ? "cursor-not-allowed bg-stone-300 text-stone-500"
                  : "bg-stone-950 text-white hover:bg-amber-500 hover:text-stone-950"
              }`}
            >
              Ajouter au panier • {formatPrice(selectedProductPrice)}
            </button>
          </div>
        </div>
      )}

      <section id="a-propos" className="px-5 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-80 rounded-[2rem] bg-[url('https://images.unsplash.com/photo-1662116765994-1e4200c43589?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
            <div className="mt-12 h-80 rounded-[2rem] bg-[url('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">
              À propos
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Le goût du vrai kebab maison
            </h2>
            <p className="mt-6 text-lg leading-8 text-stone-300">
              Chez Omer vous accueille sur place ou à emporter avec des kebabs, tacos, assiettes et burgers 100% HALAL.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["100% HALAL", "Viande sélectionnée", "Fait maison"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center font-semibold"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-900 px-5 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">
            Avis clients
          </p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">
            Pourquoi choisir Chez Omer
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((review) => (
              <div
                key={review}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-left"
              >
                <div className="mb-4 flex text-amber-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="leading-7 text-stone-300">“{review}”</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="commande" className="bg-amber-400 px-5 py-24 text-stone-950">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em]">
              Commande
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Commander chez Chez Omer
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-800">
              Ajoutez vos plats au panier, choisissez vos sauces sandwich et vos sauces frites, puis envoyez votre commande par WhatsApp.
            </p>
            <div className="mt-8 space-y-4 font-semibold">
              <p className="flex items-center gap-3">
                <Clock /> Mardi au dimanche : 11h00 – 22h00
              </p>
              <p className="flex items-center gap-3">
                <Phone /> 07 49 19 49 27
              </p>
              <p className="flex items-center gap-3">
                <Mail /> contact@chezomer.fr
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-stone-950 p-7 text-stone-100 shadow-2xl">
            <h3 className="mb-4 text-2xl font-black">Aperçu du panier</h3>

            {cart.length === 0 ? (
              <p className="text-stone-400">Votre panier est vide pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {cart.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/10 p-4">
                    <div className="flex justify-between gap-4">
                      <p className="font-bold">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="font-black text-amber-300">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    {item.formulaChoice && (
                      <p className="mt-1 text-sm text-stone-300">
                        Formule : {item.formulaChoice}
                      </p>
                    )}
                    {item.breadChoice && (
                      <p className="mt-1 text-sm text-stone-300">
                        Choix : {item.breadChoice}
                      </p>
                    )}
                    {item.meats?.length > 0 && (
                      <p className="mt-1 text-sm text-stone-300">
                        Viandes :{" "}
                        {item.meats
                          .map((meat) => `${meat.name}${meat.extra ? " (+1€)" : ""}`)
                          .join(", ")}
                      </p>
                    )}
                    {item.crudites?.length > 0 && (
                      <p className="mt-1 text-sm text-stone-300">
                        Crudités : {item.crudites.join(", ")}
                      </p>
                    )}
                    {item.saucesSandwich?.length > 0 && (
                      <p className="mt-1 text-sm text-stone-300">
                        Sauces sandwich : {item.saucesSandwich.join(", ")}
                      </p>
                    )}
                    {item.saucesFrites?.length > 0 && (
                      <p className="mt-1 text-sm text-stone-300">
                        Sauces frites : {item.saucesFrites.join(", ")}
                      </p>
                    )}
                    {item.supplementSauces > 0 && (
                      <p className="mt-1 text-sm font-bold text-red-300">
                        Supplément sauces : {formatPrice(item.supplementSauces)}
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xl font-black">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="mt-6 w-full rounded-full bg-amber-400 px-6 py-3 font-black text-stone-950 transition hover:bg-amber-300"
            >
              Ouvrir le panier
            </button>
          </div>
        </div>
      </section>

      <footer id="contact" className="px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/10 pt-10 md:grid-cols-3">
          <div>
            <h3 className="text-2xl font-black">Chez Omer</h3>
            <p className="mt-3 text-stone-400">
              Le kebab fait maison • Restaurant HALAL.
            </p>
          </div>
          <div className="space-y-3 text-stone-300">
            <p className="flex items-center gap-3">
              <MapPin size={18} /> Restaurant HALAL • Sur place ou à emporter
            </p>
            <p className="flex items-center gap-3">
              <Phone size={18} /> 07 49 19 49 27
            </p>
            <p className="flex items-center gap-3">
              <CalendarDays size={18} /> Ouvert du mardi au dimanche, 11h00 – 22h00
            </p>
          </div>
          <div className="text-stone-400 md:text-right">
            <p>© 2026 Chez Omer.</p>
            <p>Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-stone-950 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h3 className="text-2xl font-black">Votre panier</h3>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full bg-white/10 p-3 hover:bg-white/20"
              >
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {cart.length === 0 ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
                  <ShoppingCart className="mx-auto mb-4 text-amber-300" size={42} />
                  <p className="text-lg font-bold">Votre panier est vide.</p>
                  <p className="mt-2 text-stone-400">Ajoutez un produit depuis le menu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-black">{item.name}</h4>
                          <p className="text-sm text-stone-400">{item.category}</p>
                          {item.formulaChoice && (
                            <p className="mt-1 text-sm text-amber-300">
                              Formule : {item.formulaChoice}
                            </p>
                          )}
                          {item.breadChoice && (
                            <p className="mt-1 text-sm text-amber-300">
                              Choix : {item.breadChoice}
                            </p>
                          )}
                          {item.meats?.length > 0 && (
                            <p className="mt-1 text-sm text-amber-300">
                              Viandes :{" "}
                              {item.meats
                                .map((meat) => `${meat.name}${meat.extra ? " (+1€)" : ""}`)
                                .join(", ")}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-300 hover:text-red-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {item.crudites?.length > 0 && (
                        <p className="mt-3 text-sm text-stone-300">
                          Crudités : {item.crudites.join(", ")}
                        </p>
                      )}

                      {item.saucesSandwich?.length > 0 && (
                        <p className="mt-3 text-sm text-stone-300">
                          Sauces sandwich : {item.saucesSandwich.join(", ")}
                        </p>
                      )}

                      {item.saucesFrites?.length > 0 && (
                        <p className="mt-3 text-sm text-stone-300">
                          Sauces frites : {item.saucesFrites.join(", ")}
                        </p>
                      )}

                      {item.supplementSauces > 0 && (
                        <p className="mt-2 text-sm font-bold text-red-300">
                          Supplément sauces : {formatPrice(item.supplementSauces)}
                        </p>
                      )}

                      {item.note && (
                        <p className="mt-2 text-sm text-stone-300">
                          Note : {item.note}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                            className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-black">{item.quantity}</span>
                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                            className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="font-black text-amber-300">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between text-2xl font-black">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <a
                href={
                  cart.length > 0
                    ? `https://wa.me/33749194927?text=${orderMessage}`
                    : undefined
                }
                target="_blank"
                rel="noreferrer"
                className={`block rounded-full px-6 py-4 text-center font-black transition ${
                  cart.length > 0
                    ? "bg-amber-400 text-stone-950 hover:bg-amber-300"
                    : "pointer-events-none bg-white/10 text-stone-500"
                }`}
              >
                Envoyer la commande WhatsApp
              </a>

              <p className="mt-3 text-center text-xs text-stone-500">
                Paiement en ligne à ajouter à l’étape suivante.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
