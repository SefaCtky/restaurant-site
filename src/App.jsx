import { supabase } from "./supabase";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  MapPin,
  Clock,
  Phone,
  Mail,
  Utensils,
  Sandwich,
  Soup,
  CupSoda,
  CakeSlice,
  UtensilsCrossed,
  CalendarDays,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
} from "lucide-react";

const restaurantAddress = "15 Rue de Belfort, 90400 Sevenans";
const phoneNumber = "07 49 19 49 27";
const whatsappNumber = "33749194927";

const LOGO = "/logo.png";
const BACKGROUND_IMAGE = "/carte-visite.png";

const sauces = [
  "Blanche",
  "Ketchup",
  "Mayonnaise",
  "Harissa",
  "Samouraï",
  "Algérienne",
  "Biggy Burger",
  "Curry",
  "BBQ",
  "Fromagère",
];

const SAUCES_GRATUITES = 2;
const PRIX_SAUCE_SUPPLEMENTAIRE = 0.2;
const PRIX_SUPPLEMENT_CHEDDAR = 2;
const PRIX_DEUXIEME_VIANDE_TACOS = 2;

function calculSupplementSauces(listeSauces) {
  return Math.max(0, listeSauces.length - SAUCES_GRATUITES) * PRIX_SAUCE_SUPPLEMENTAIRE;
}

const cruditeOptions = ["Sans salade", "Sans tomate", "Sans oignon"];
const cruditeSauceSaladeOptions = ["Sans salade", "Sans tomate", "Sans oignon", "Sans sauce salade"];
const burgerOptions = ["Sans salade", "Sans tomate", "Sans oignon", "Sans cheddar"];
const accompagnementOptions = ["Riz", "Boulgour", "Frites"];
const menuEnfantBoissons = ["Ayran", "Capri-Sun"];

const tacosMeats = [
  { name: "Kebab poulet", extra: 0 },
  { name: "Kebab veau", extra: 0 },
  { name: "Poulet mariné", extra: 0 },
  { name: "Köfte", extra: 0 },
  { name: "Sucuk", extra: 0 },
  { name: "Tenders", extra: 0 },
  { name: "Cordon bleu", extra: 0 },
  { name: "Steak", extra: 0 },
];

const maxiTacosMeats = [
  { name: "Kebab poulet", extra: 0 },
  { name: "Poulet mariné", extra: 0 },
  { name: "Sucuk", extra: 0 },
  { name: "Tenders", extra: 0 },
  { name: "Cordon bleu", extra: 0 },
  { name: "Kebab veau", extra: 0 },
  { name: "Steak", extra: 0 },
  { name: "Köfte", extra: 0 },
];

const drinkImageNames = {
  "Coca Cola": "Coca cola",
  "Coca Cherry": "Coca cherry",
  "Coca Cola Zéro": "Coca zero",
  Sprite: "Sprite",
  Orangina: "Orangina",
  Perrier: "Perrier",
  "Oasis Tropical": "Oasis Tropical",
  "Oasis Pomme Cassis": "Oasis Pomme Cassis",
  "Fanta orange": "Fanta orange",
  "Schweppes pomme": "Schweppes pomme",
  "Schweppes agrume": "Schweppes agrume",
  "Ice Tea Pêche": "Ice Tea Pêche",
};

const menuItems = [
  {
    category: "Accompagnements",
    items: [
      ["Grande frite", "Portion généreuse", "4,50€", "", "", "/images/accompagnement/Grande-frite.webp"],
      ["Petite frite", "Portion classique", "3€", "", "", "/images/accompagnement/Petite-frite.webp"],
      ["Bulgur pilavi", "Boulgour", "3€", "", "", "/images/accompagnement/Bulgur.webp"],
      ["Pirinç pilavi", "Riz turc", "3€", "", "", "/images/accompagnement/Pilav.webp"],
    ],
  },
  {
    category: "Soupe",
    items: [["Mercimek çorbası", "Soupe turque aux lentilles", "5€", "", "", "/images/accompagnement/Soupe/Mercimek-corbasi.webp"]],
  },
  {
    category: "Mezzés et salades",
    items: [
      ["Haydari", "Crème de yaourt à l’ail et aux herbes", "3€", "", "", "/images/accompagnement/Mezze/Haydari.png"],
      ["Ezme", "Concassé de tomates, poivrons et herbes fraîches", "3€", "", "", "/images/accompagnement/Mezze/Ezme.png"],
      ["Havuç tarator", "Crème de carottes au yaourt", "3€", "", "", "/images/accompagnement/Mezze/Havuç tarator.png"],
      ["Pembe sultan", "Crème de betterave au yaourt", "3€", "", "", "/images/accompagnement/Mezze/Pembe sultan.png"],
      ["Çoban salatası", "Salade de tomates, concombres et oignons", "6€", "", "", "/images/accompagnement/Mezze/Çoban salatası.png"],
      ["Hellim peynirli salata", "Salade au halloumi grillé", "7€", "", "", "/images/accompagnement/Mezze/Hellim peynirli salata.png"],
      ["Yoğurtlu patlıcan közlemesi", "Aubergine grillée au yaourt", "6€", "", "", "/images/accompagnement/Mezze/Yoğurtlu patlıcan közlemesi.png"],
    ],
  },
  {
    category: "Assiettes",
    items: [
      ["Kebab poulet", "Riz, boulgour ou frites", "13€", "", "assiette-accompagnement"],
      ["Kebab veau", "Riz, boulgour ou frites", "16€", "", "assiette-accompagnement"],
      ["Poulet mariné", "Riz, boulgour ou frites", "13€", "", "assiette-accompagnement"],
      ["Köfte", "Riz, boulgour ou frites", "14€", "", "assiette-accompagnement"],
      ["Kuşbaşı", "Émincé de viande grillée", "16€", "", "assiette-accompagnement"],
      ["Ali nazik", "Viande sur purée d’aubergines fumées au yaourt", "16€"],
      ["Patlicanli iskender", "Viande kebab de veau sur aubergines grillées", "16€"],
      ["Yogurtlu iskender", "Viande kebab de veau nappée de yaourt", "16€"],
      ["Bulgurlu iskender", "Viande kebab de veau accompagnée de boulgour", "16€"],
    ],
  },
  {
    category: "Sandwichs / Dürüms",
    items: [
      ["Kebab poulet", "Sandwich ou dürüm\nSalade, tomates et oignons", "7€", "10€", "", "/images/accompagnement/Sandwich-Durum/Sandwich/Kebab poulet.png"],
      ["Kebab veau", "Sandwich ou dürüm\nSalade, tomates et oignons", "9€", "12€", "", "/images/accompagnement/Sandwich-Durum/Sandwich/Kebab veau.png"],
      ["Poulet mariné", "Sandwich ou dürüm\nSalade, tomates et oignons", "7€", "10€", "", "/images/accompagnement/Sandwich-Durum/Sandwich/Poulet mariné.png"],
      ["Köfte", "Sandwich ou dürüm\nSalade, tomates et oignons", "7€", "10€", "", "/images/accompagnement/Sandwich-Durum/Sandwich/Kofte.png"],
      ["Sucuk", "Sandwich ou dürüm\nSalade, tomates et oignons", "7€", "10€", "", "/images/accompagnement/Sandwich-Durum/Sandwich/Sucuk.png"],
      ["Tenders", "Dürüm\nSalade, tomates et oignons", "7€", "10€", "durum-only", "/images/accompagnement/Sandwich-Durum/Durum/Tenders.png"],
      ["Cordon bleu", "Dürüm\nSalade, tomates et oignons", "7€", "10€", "durum-only", "/images/accompagnement/Sandwich-Durum/Durum/Cordon bleu.png"],
    ],
  },
  {
    category: "Tacos",
    items: [
      ["Kebab poulet", "Une galette", "8€", "11€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Kebab veau", "Une galette", "9€", "12€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Poulet mariné", "Une galette", "8€", "11€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Köfte", "Une galette", "9€", "12€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Sucuk", "Une galette", "8€", "11€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Tenders", "Une galette", "8€", "11€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Cordon bleu", "Une galette", "8€", "11€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Steak", "Une galette", "9€", "12€", "tacos-simple", "/images/Tacos/Tacos.png"],
      ["Maxi tacos", "Deux viandes + deux galettes", "12€", "15€", "maxi-tacos", "/images/Tacos/MaxiTacos.png"],
    ],
  },
  {
    category: "Burgers",
    items: [
      ["Steak 120g", "Salade, tomates, oignons et cheddar", "9€", "12€", "", "/images/Burgers/Steak.png"],
      ["Poulet", "Salade, tomates, oignons et cheddar", "7€", "10€", "", "/images/Burgers/Poulet.png"],
    ],
  },
  {
    category: "Tex Mex",
    items: [
      ["Kebab poulet petite", "Petite portion", "6€", "", "", "/images/TexMex/Kebab poulet petite.png"],
      ["Kebab poulet grande", "Grande portion", "12€", "", "", "/images/TexMex/Kebab poulet grande.png"],
      ["Kebab veau petite", "Petite portion", "7€", "", "", "/images/TexMex/Kebab veau petite.png"],
      ["Kebab veau grande", "Grande portion", "14€", "", "", "/images/TexMex/Kebab veau grande.png"],
      ["4 tenders", "Croustillants", "4€", "", "", "/images/TexMex/Quatre tenders.png"],
      ["8 tenders", "Croustillants", "7€", "", "", "/images/TexMex/Huit tenders.png"],
    ],
  },
  {
    category: "Menus enfants",
    items: [
      ["Menu nuggets", "1 petite frite + 1 compote + 4 nuggets", "10€", "", "menu-enfant", "/images/Menu enfant/Menu nuggets.png"],
      ["Menu burger", "1 petite frite + 1 compote + 1 burger", "10€", "", "menu-enfant-burger", "/images/Menu enfant/Menu burger.png"],
    ],
  },
  {
    category: "Boissons",
    items: [
      ["Coca Cola", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Coca cola.png"],
      ["Coca Cherry", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Coca cherry.png"],
      ["Coca Cola Zéro", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Coca zero.png"],
      ["Sprite", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Sprite.png"],
      ["Orangina", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Orangina.png"],
      ["Perrier", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Perrier.png"],
      ["Eau", "50cl ou 1L verre consigné", "1,50€", "3€", "water-size", "/images/Boissons/Bouteille Evian 50cl.png"],
      ["Oasis Tropical", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Oasis Tropical.png"],
      ["Oasis Pomme Cassis", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Oasis Pomme Cassis.png"],
      ["Fanta orange", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Fanta orange.png"],
      ["Schweppes pomme", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Schweppes pomme.png"],
      ["Schweppes agrume", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Schweppes agrume.png"],
      ["Ice Tea Pêche", "33cl ou 50cl", "2€", "4€", "drink-size", "/images/Boissons/Canette/Ice Tea Pêche.png"],
      ["Ayran", "Boisson au yaourt salée", "2€", "", "", "/images/Boissons/Ayran.png"],
    ],
  },
  {
    category: "Desserts",
    items: [
      ["Tiramisu", "Dessert maison", "3,50€", "", "", "/images/Dessert/Tiramisu.png"],
      ["Künefe", "Dessert chaud au fromage et cheveux d’ange", "6,50€", "", "", "/images/Dessert/Kunefe.png"],
      ["Sütlaç", "Riz au lait turc", "5€", "", "", "/images/Dessert/Sutlac.png"],
      ["Baklava 2 parts", "Pâte feuilletée à la noix", "4€", "", "", "/images/Dessert/Baklava.png"],
      ["Tarte Daim", "Dessert gourmand", "3,50€", "", "", "/images/Dessert/Tarte Daim.png"],
    ],
  },
  {
    category: "Sauces",
    items: sauces.map((sauce) => [sauce, "", "0,20€"]),
  },
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

function getCategoryIcon(category) {
  if (category.includes("Sandwich") || category.includes("Dürüm") || category === "Tacos") return <Sandwich className="text-yellow-500" />;
  if (category === "Assiettes") return <UtensilsCrossed className="text-yellow-500" />;
  if (category === "Boissons") return <CupSoda className="text-yellow-500" />;
  if (category === "Desserts") return <CakeSlice className="text-yellow-500" />;
  if (category === "Soupe") return <Soup className="text-yellow-500" />;
  return <Utensils className="text-yellow-500" />;
}

export default function RestaurantWebsite() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [activePage, setActivePage] = useState("Accueil");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSaucesSandwich, setSelectedSaucesSandwich] = useState([]);
  const [selectedSaucesFrites, setSelectedSaucesFrites] = useState([]);
  const [selectedCrudites, setSelectedCrudites] = useState([]);
  const [selectedMeats, setSelectedMeats] = useState([]);
  const [breadChoice, setBreadChoice] = useState("Sandwich");
  const [formulaChoice, setFormulaChoice] = useState("Seul");
  const [accompagnementChoice, setAccompagnementChoice] = useState("");
  const [drinkSizeChoice, setDrinkSizeChoice] = useState("33cl");
  const [waterSizeChoice, setWaterSizeChoice] = useState("50cl");
  const [menuEnfantBoisson, setMenuEnfantBoisson] = useState("Capri-Sun");
  const [extraCheddar, setExtraCheddar] = useState(false);
  const [sansSauceFromagere, setSansSauceFromagere] = useState(false);
  const [note, setNote] = useState("");
  const [annonceSite, setAnnonceSite] = useState("");
  const [fermetureActive, setFermetureActive] = useState(false);

  const nav = ["Accueil", "Menu", "À propos", "Commande", "Contact", "Admin"];

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const chargerAnnonce = async () => {
    const { data, error } = await supabase
      .from("annonces")
      .select("contenu, actif")
      .eq("actif", true)
      .order("id", { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      setAnnonceSite(data[0].contenu);
    }
  };

  const chargerFermeture = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("fermeture_active")
      .eq("id", 1)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setFermetureActive(Boolean(data?.fermeture_active));
  };

  const saveFermeture = async (value) => {
    const { error } = await supabase
      .from("settings")
      .update({ fermeture_active: value })
      .eq("id", 1);

    if (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    chargerAnnonce();
    chargerFermeture();
  }, []);

  const isSimpleTacos = (product) => product?.type === "tacos-simple";
  const isMaxiTacos = (product) => product?.type === "maxi-tacos";
  const needsTacosMeatChoice = (product) => isSimpleTacos(product) || isMaxiTacos(product);

  const needsSauceChoice = (category, productName = "") => {
    if (["Boissons", "Desserts", "Soupe", "Sauces", "Mezzés et salades", "Assiettes"].includes(category)) return false;
    if (category === "Accompagnements" && !["Grande frite", "Petite frite"].includes(productName)) return false;
    return true;
  };

  const needsCruditeChoice = (product) => {
    if (!product) return false;
    if (product.type === "menu-enfant-burger") return true;
    if (product.type === "assiette-accompagnement") return true;
    if (product.category === "Burgers") return true;
    const assiettesSansCrudites = ["Ali nazik", "Patlicanli iskender", "Yogurtlu iskender", "Bulgurlu iskender"];
    if (product.category === "Assiettes" && assiettesSansCrudites.includes(product.name)) return false;
    return ["Sandwichs / Dürüms", "Tacos"].includes(product.category);
  };

  const getCruditeList = (product) => {
    if (!product) return cruditeOptions;
    if (product.category === "Burgers" || product.type === "menu-enfant-burger") return burgerOptions;
    if (product.type === "assiette-accompagnement") return cruditeSauceSaladeOptions;
    return cruditeOptions;
  };

  const needsBreadChoice = (product) => product?.category === "Sandwichs / Dürüms" && product?.type !== "durum-only";
  const hasFormulaChoice = (product) => Boolean(product?.menuPriceLabel);
  const needsAccompagnementChoice = (product) => product?.type === "assiette-accompagnement";
  const needsDrinkSizeChoice = (product) => product?.type === "drink-size";
  const needsWaterSizeChoice = (product) => product?.type === "water-size";
  const needsMenuEnfantDrink = (product) => product?.type === "menu-enfant" || product?.type === "menu-enfant-burger";
  const needsExtraCheddar = (product) => product?.category === "Sandwichs / Dürüms" || product?.category === "Tacos";
  const needsSansSauceFromagere = (product) => product?.category === "Tacos";

  const openProduct = (product, category) => {
    const [name, desc, price, menuPrice, type, image] = product;
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
      image: image || "",
    });
    setSelectedSaucesSandwich([]);
    setSelectedSaucesFrites([]);
    setSelectedCrudites([]);
    setBreadChoice("Sandwich");
    setFormulaChoice("Seul");
    setAccompagnementChoice("");
    setDrinkSizeChoice("33cl");
    setWaterSizeChoice("50cl");
    setMenuEnfantBoisson("Capri-Sun");
    setExtraCheddar(false);
    setSansSauceFromagere(false);
    setNote("");
    if (type === "tacos-simple") setSelectedMeats([{ name, extra: 0, locked: true }]);
    else setSelectedMeats([]);
  };

  const toggleSauce = (sauce, type) => {
    const setter = type === "sandwich" ? setSelectedSaucesSandwich : setSelectedSaucesFrites;
    setter((current) => (current.includes(sauce) ? current.filter((s) => s !== sauce) : [...current, sauce]));
  };

  const toggleCrudite = (option) => {
    setSelectedCrudites((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]));
  };

  const toggleMeat = (meat) => {
    setSelectedMeats((current) => {
      const existingMeat = current.find((item) => item.name === meat.name);
      if (existingMeat?.locked) return current;
      if (existingMeat) return current.filter((item) => item.name !== meat.name);
      const maxMeats = isSimpleTacos(selectedProduct) ? 2 : 3;
      if (current.length >= maxMeats) return current;
      return [...current, meat];
    });
  };

  const selectedMeatsExtra = isSimpleTacos(selectedProduct)
    ? selectedMeats.length === 2
      ? PRIX_DEUXIEME_VIANDE_TACOS
      : 0
    : selectedMeats.reduce((sum, meat) => sum + meat.extra, 0) + (selectedMeats.length === 3 ? 2 : 0);

  const supplementSaucesSandwich = calculSupplementSauces(selectedSaucesSandwich);
  const supplementSaucesFrites = formulaChoice === "Menu" ? calculSupplementSauces(selectedSaucesFrites) : 0;
  const supplementSaucesTotal = supplementSaucesSandwich + supplementSaucesFrites;
  const supplementCheddarTotal = extraCheddar ? PRIX_SUPPLEMENT_CHEDDAR : 0;

  const getDynamicImage = () => {
    if (!selectedProduct) return "";

    const sandwichImageNames = {
      Köfte: "Kofte",
    };

    if (selectedProduct.category === "Sandwichs / Dürüms") {
      const imageName = sandwichImageNames[selectedProduct.name] || selectedProduct.name;
      if (selectedProduct.type === "durum-only") return `/images/accompagnement/Sandwich-Durum/Durum/${imageName}.png`;
      if (breadChoice === "Dürüm") return `/images/accompagnement/Sandwich-Durum/Durum/${imageName}.png`;
      return `/images/accompagnement/Sandwich-Durum/Sandwich/${imageName}.png`;
    }

    if (selectedProduct.category === "Boissons") {
      if (selectedProduct.name === "Ayran") return "/images/Boissons/Ayran.png";
      if (selectedProduct.name === "Eau") {
        return waterSizeChoice === "1L verre consigné"
          ? "/images/Boissons/Bouteille Evian 1l.png"
          : "/images/Boissons/Bouteille Evian 50cl.png";
      }
      if (needsDrinkSizeChoice(selectedProduct)) {
        const imageName = drinkImageNames[selectedProduct.name] || selectedProduct.name;
        return drinkSizeChoice === "50cl"
          ? `/images/Boissons/Bouteille/${imageName}.png`
          : `/images/Boissons/Canette/${imageName}.png`;
      }
    }

    return selectedProduct.image;
  };

  const selectedProductPrice = selectedProduct
    ? (needsDrinkSizeChoice(selectedProduct) && drinkSizeChoice === "50cl" && selectedProduct.menuPrice
        ? selectedProduct.menuPrice
        : needsWaterSizeChoice(selectedProduct) && waterSizeChoice === "1L verre consigné" && selectedProduct.menuPrice
        ? selectedProduct.menuPrice
        : formulaChoice === "Menu" && selectedProduct.menuPrice
        ? selectedProduct.menuPrice
        : selectedProduct.basePrice) +
      selectedMeatsExtra +
      supplementSaucesTotal +
      supplementCheddarTotal
    : 0;

  const isAddDisabled =
    selectedProduct &&
    ((needsTacosMeatChoice(selectedProduct) && selectedMeats.length === 0) ||
      (needsAccompagnementChoice(selectedProduct) && !accompagnementChoice));

  const addToCart = () => {
    if (!selectedProduct) return;
    if (needsTacosMeatChoice(selectedProduct) && selectedMeats.length === 0) return;
    if (needsAccompagnementChoice(selectedProduct) && !accompagnementChoice) return;

    setCart((current) => [
      ...current,
      {
        id: `${selectedProduct.name}-${selectedProduct.category}-${Date.now()}`,
        name: selectedProduct.name,
        desc: selectedProduct.desc,
        category: selectedProduct.category,
        price: selectedProductPrice,
        formulaChoice:
          hasFormulaChoice(selectedProduct) && !needsDrinkSizeChoice(selectedProduct) && !needsWaterSizeChoice(selectedProduct)
            ? formulaChoice
            : "",
        drinkSizeChoice: needsDrinkSizeChoice(selectedProduct) ? drinkSizeChoice : "",
        waterSizeChoice: needsWaterSizeChoice(selectedProduct) ? waterSizeChoice : "",
        menuEnfantBoisson: needsMenuEnfantDrink(selectedProduct) ? menuEnfantBoisson : "",
        extraCheddar: needsExtraCheddar(selectedProduct) ? extraCheddar : false,
        sansSauceFromagere: needsSansSauceFromagere(selectedProduct) ? sansSauceFromagere : false,
        breadChoice: selectedProduct.type === "durum-only" ? "Dürüm" : needsBreadChoice(selectedProduct) ? breadChoice : "",
        accompagnementChoice: needsAccompagnementChoice(selectedProduct) ? accompagnementChoice : "",
        meats: needsTacosMeatChoice(selectedProduct) ? selectedMeats : [],
        meatsExtra: needsTacosMeatChoice(selectedProduct) ? selectedMeatsExtra : 0,
        tacosSimple: isSimpleTacos(selectedProduct),
        saucesSandwich: selectedSaucesSandwich,
        saucesFrites: formulaChoice === "Menu" ? selectedSaucesFrites : [],
        supplementSauces: supplementSaucesTotal,
        crudites: selectedCrudites,
        note,
        quantity: 1,
      },
    ]);

    setSelectedProduct(null);
    setCartOpen(true);
  };

  const changeQuantity = (id, delta) => {
    setCart((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item)).filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => setCart((current) => current.filter((item) => item.id !== id));

  const orderLines = cart
    .map((item) => {
      const formule = item.formulaChoice ? `\n  Formule : ${item.formulaChoice}` : "";
      const formatBoisson = item.drinkSizeChoice ? `\n  Format : ${item.drinkSizeChoice}` : "";
      const formatEau = item.waterSizeChoice ? `\n  Format : ${item.waterSizeChoice}` : "";
      const boissonEnfant = item.menuEnfantBoisson ? `\n  Boisson : ${item.menuEnfantBoisson}` : "";
      const cheddar = item.extraCheddar ? `\n  Supplément cheddar : +2,00 €` : "";
      const sansFromagere = item.sansSauceFromagere ? `\n  Sans sauce fromagère` : "";
      const choix = item.breadChoice ? `\n  Choix : ${item.breadChoice}` : "";
      const accompagnement = item.accompagnementChoice ? `\n  Accompagnement : ${item.accompagnementChoice}` : "";
      const meats = item.meats?.length
        ? `\n  Viandes : ${item.meats.map((meat) => `${meat.name}`).join(", ")}${
            item.tacosSimple && item.meats.length === 2 ? " | 2ème viande (+2€)" : ""
          }${!item.tacosSimple && item.meats.length === 3 ? " | 3ème viande (+2€)" : ""}`
        : "";
      const crudites = item.crudites?.length ? `\n  Options : ${item.crudites.join(", ")}` : "";
      const saucesSandwichText = item.saucesSandwich?.length ? `\n  Sauces : ${item.saucesSandwich.join(", ")}` : "";
      const saucesFritesText = item.saucesFrites?.length ? `\n  Sauces frites : ${item.saucesFrites.join(", ")}` : "";
      const supplementSaucesText = item.supplementSauces > 0 ? `\n  Supplément sauces : ${formatPrice(item.supplementSauces)}` : "";
      const noteText = item.note ? `\n  Note : ${item.note}` : "";
      return `- ${item.quantity}x ${item.name} (${item.category}) - ${formatPrice(
        item.price * item.quantity
      )}${formule}${formatBoisson}${formatEau}${boissonEnfant}${cheddar}${sansFromagere}${choix}${accompagnement}${meats}${crudites}${saucesSandwichText}${saucesFritesText}${supplementSaucesText}${noteText}`;
    })
    .join("\n\n");

  const orderMessage = encodeURIComponent(`Bonjour Chez Omer, je souhaite passer commande :\n\n${orderLines}\n\nTotal : ${formatPrice(total)}`);

  const showPage = (page) => {
    setActivePage(page);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const Header = () => (
    <header className="sticky top-0 z-50 border-b border-yellow-500/20 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <button onClick={() => showPage("Accueil")} className="flex items-center gap-3">
          <img src={LOGO} alt="Chez Omer" className="h-14 w-14 rounded-full object-cover ring-2 ring-yellow-500/50" />
          <span className="hidden text-xl font-black uppercase tracking-wide text-yellow-400 sm:block">Chez Omer</span>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((item) => (
            <button
              key={item}
              onClick={() => showPage(item)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                activePage === item ? "bg-yellow-400 text-black" : "text-stone-300 hover:bg-white/10 hover:text-yellow-300"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setCartOpen(true)}
          className="relative hidden rounded-full bg-yellow-400 px-5 py-3 font-black text-black shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-300 md:inline-flex md:items-center md:gap-2"
        >
          <ShoppingCart size={18} /> Panier
          {itemCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{itemCount}</span>}
        </button>

        <button className="rounded-xl bg-white/10 p-3 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-yellow-500/20 bg-black px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {nav.map((item) => (
              <button key={item} onClick={() => showPage(item)} className="rounded-xl bg-white/5 px-4 py-3 text-left font-bold text-stone-200">
                {item}
              </button>
            ))}
            <button onClick={() => setCartOpen(true)} className="rounded-xl bg-yellow-400 px-4 py-3 font-black text-black">
              Voir le panier ({itemCount})
            </button>
          </div>
        </div>
      )}
    </header>
  );

  const PageTitle = ({ eyebrow, title, text }) => (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-400">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">{title}</h1>
      {text && <p className="mt-5 text-lg leading-8 text-stone-300">{text}</p>}
    </div>
  );

  const AccueilPage = () => (
    <main>
      <section className="relative overflow-hidden px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {fermetureActive && (
              <div className="mb-6 rounded-3xl border border-red-500 bg-red-600 px-6 py-4 text-center text-lg font-black text-white shadow-xl">
                🚫 Fermeture exceptionnelle — les commandes sont temporairement indisponibles.
              </div>
            )}

            {annonceSite && (
              <div className="mb-6 rounded-3xl border border-yellow-400 bg-yellow-400 px-6 py-4 text-center text-lg font-black text-black shadow-xl shadow-yellow-500/20">
                ⚠️ {annonceSite}
              </div>
            )}

            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Bonjour Chez Omer, je souhaite réserver une table.")}`}
              target="_blank"
              rel="noreferrer"
              className="mb-7 block max-w-3xl overflow-hidden rounded-3xl border-2 border-yellow-300 bg-yellow-400 py-4 shadow-[0_0_30px_rgba(250,204,21,0.35)] transition hover:bg-yellow-300"
            >
              <div className="whitespace-nowrap text-2xl font-black uppercase tracking-wide text-black md:text-3xl" style={{ animation: "reservationMarquee 13s linear infinite" }}>
                🔥 Pour réserver votre table cliquez ici ! • 🔥 Pour réserver votre table cliquez ici ! • 🔥 Pour réserver votre table cliquez ici ! •
              </div>
            </a>

            <div className="mb-6 inline-flex rounded-full border border-yellow-500/40 bg-yellow-500/10 px-6 py-3 text-base font-black text-yellow-300 shadow-lg shadow-yellow-500/10 md:text-lg">
              Restaurant HALAL • Le kebab fait maison
            </div>
            <h1 className="text-6xl font-black uppercase leading-none tracking-tight text-white md:text-8xl">
              CHEZ OMER
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent">RESTAURANT</span>
            </h1>
            <p className="mt-7 max-w-2xl text-2xl font-semibold leading-10 text-yellow-100">
              Viande sélectionnée, fait maison, cuisson maîtrisée et qualité premium. Sur place ou à emporter à Sevenans.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => showPage("Menu")} className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black shadow-xl shadow-yellow-500/20 transition hover:bg-yellow-300">
                Voir le menu
              </button>
              <button onClick={() => showPage("Commande")} className="rounded-full border border-yellow-500/30 bg-white/5 px-8 py-4 font-black text-white transition hover:bg-white/10">
                Commander
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
            <div className="absolute -inset-8 rounded-full bg-yellow-500/20 blur-3xl" />
            <img src={LOGO} alt="Chez Omer" className="relative mx-auto max-h-[520px] w-full object-contain drop-shadow-[0_0_35px_rgba(250,204,21,0.15)]" />
            <div className="absolute bottom-6 right-6 rounded-full border border-yellow-400/50 bg-black/85 px-5 py-4 text-center text-yellow-300 shadow-lg">
              <p className="text-3xl font-black">حلال</p>
              <p className="text-sm font-black uppercase">Halal</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-6 shadow-xl">
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-black text-yellow-300"><MapPin /> Nous trouver</h2>
            <p className="mb-5 text-lg font-bold text-white">{restaurantAddress}</p>
            <iframe title="Carte Chez Omer Sevenans" src="https://www.google.com/maps?q=15%20Rue%20de%20Belfort%2090400%20Sevenans&output=embed" className="h-80 w-full rounded-[1.5rem] border border-yellow-500/20" loading="lazy" />
          </div>
          <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-black text-yellow-300">Infos pratiques</h2>
            <div className="space-y-4 text-lg text-stone-200">
              <p className="flex items-center gap-3"><Clock className="text-yellow-400" /> Mardi au dimanche : 11h00 – 22h00</p>
              <p className="flex items-center gap-3"><Phone className="text-yellow-400" /> {phoneNumber}</p>
              <p className="flex items-center gap-3"><MapPin className="text-yellow-400" /> {restaurantAddress}</p>
            </div>
            <button onClick={() => showPage("Contact")} className="mt-8 rounded-full bg-yellow-400 px-7 py-3 font-black text-black hover:bg-yellow-300">Page contact</button>
          </div>
        </div>
      </section>
    </main>
  );

  const MenuPage = () => (
    <main className="px-5 py-16">
      <PageTitle eyebrow="Notre carte" title="Menu Chez Omer" text="Cliquez sur une catégorie pour voir les produits. Recliquez dessus pour refermer." />
      <div className="mx-auto max-w-7xl space-y-5">
        {menuItems.map((section) => {
          const expanded = activeCategory === section.category;
          return (
            <div key={section.category} className={`overflow-hidden rounded-[2rem] border transition ${expanded ? "border-yellow-400 bg-white text-stone-950" : "border-yellow-500/20 bg-black/60 text-white"}`}>
              <button onClick={() => setActiveCategory(expanded ? null : section.category)} className="flex w-full items-center justify-between gap-4 p-6 text-left">
                <span className="flex items-center gap-4 text-2xl font-black">{getCategoryIcon(section.category)} {section.category}</span>
                <span className={`rounded-full px-4 py-2 text-sm font-black ${expanded ? "bg-black text-yellow-300" : "bg-yellow-400 text-black"}`}>{expanded ? "Fermer" : "Voir"}</span>
              </button>
              {expanded && (
                <div className="grid gap-4 border-t border-stone-200 p-6 md:grid-cols-2 lg:grid-cols-3">
                  {section.items.map(([name, desc, price, menuPrice, type, image]) => (
                    <div key={`${section.category}-${name}-${desc}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
                      {image && <img src={image} alt={name} className="mb-4 h-40 w-full rounded-2xl object-cover" />}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black">{name}</h3>
                          {desc && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{desc}</p>}
                          {menuPrice && type !== "drink-size" && type !== "water-size" && <p className="mt-2 text-sm font-black text-yellow-700">Menu : {menuPrice} ({formatMenuSupplement(price, menuPrice)} de plus)</p>}
                          {type === "tacos-simple" && <p className="mt-2 text-sm font-black text-red-700">Jusqu’à 2 viandes • 2ème viande +2€</p>}
                          {type === "maxi-tacos" && <p className="mt-2 text-sm font-black text-red-700">Jusqu’à 3 viandes • 3ème viande +2€</p>}
                        </div>
                        <p className="whitespace-nowrap text-xl font-black text-yellow-700">{price}</p>
                      </div>
                      {price && (
                        <button onClick={() => openProduct([name, desc, price, menuPrice, type, image], section.category)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-yellow-400 hover:text-black">
                          <Plus size={16} /> Ajouter
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );

  const AProposPage = () => (
    <main className="px-5 py-16">
      <PageTitle eyebrow="À propos" title="Le goût du vrai kebab maison" text="Une identité forte, une cuisine généreuse et une ambiance inspirée de notre carte noire et jaune." />
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-5"><img src={BACKGROUND_IMAGE} alt="Carte Chez Omer" className="h-full w-full rounded-[1.5rem] object-cover" /></div>
        <div className="flex flex-col justify-center rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
          <h2 className="text-4xl font-black text-yellow-300">Chez Omer Restaurant</h2>
          <p className="mt-6 text-lg leading-8 text-stone-300">Nous vous accueillons avec des kebabs, tacos, assiettes et burgers 100% HALAL. Notre objectif : un service rapide, généreux et une qualité constante.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["100% HALAL", "Viande sélectionnée", "Fait maison"].map((item) => <div key={item} className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4 text-center font-black text-yellow-300">{item}</div>)}
          </div>
        </div>
      </div>
    </main>
  );

  const CommandePage = () => (
    <main className="px-5 py-16">
      <PageTitle eyebrow="Commande" title="Commander chez Chez Omer" text="Ajoutez vos produits au panier puis envoyez la commande par WhatsApp." />
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
        {fermetureActive && (
          <div className="mb-6 rounded-3xl border border-red-500 bg-red-600 px-6 py-4 text-center text-lg font-black text-white">
            Commandes temporairement fermées
          </div>
        )}
        {cart.length === 0 ? <p className="text-center text-stone-400">Votre panier est vide.</p> : (
          <div className="space-y-4">
            {cart.map((item) => <div key={item.id} className="rounded-2xl bg-white/10 p-4"><div className="flex justify-between gap-4"><p className="font-bold">{item.quantity}x {item.name}</p><p className="font-black text-yellow-300">{formatPrice(item.price * item.quantity)}</p></div></div>)}
            <div className="flex items-center justify-between border-t border-yellow-500/20 pt-4 text-2xl font-black"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
        )}
        <button onClick={() => setCartOpen(true)} className="mt-6 w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300">Ouvrir le panier</button>
      </div>
    </main>
  );

  const ContactPage = () => (
    <main className="px-5 py-16">
      <PageTitle eyebrow="Contact" title="Nous contacter" text="Retrouvez Chez Omer à Sevenans." />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
          <div className="space-y-5 text-lg text-stone-200">
            <p className="flex items-center gap-3"><MapPin className="text-yellow-400" /> {restaurantAddress}</p>
            <p className="flex items-center gap-3"><Phone className="text-yellow-400" /> {phoneNumber}</p>
            <p className="flex items-center gap-3"><Mail className="text-yellow-400" /> contact@chezomer.fr</p>
            <p className="flex items-center gap-3"><CalendarDays className="text-yellow-400" /> Ouvert du mardi au dimanche, 11h00 – 22h00</p>
          </div>
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-7 py-4 font-black text-black hover:bg-yellow-300"><MessageCircle /> WhatsApp</a>
        </div>
        <iframe title="Carte Chez Omer Sevenans" src="https://www.google.com/maps?q=15%20Rue%20de%20Belfort%2090400%20Sevenans&output=embed" className="h-[420px] w-full rounded-[2rem] border border-yellow-500/20" loading="lazy" />
      </div>
    </main>
  );

  const AdminPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isLogged, setIsLogged] = useState(false);
    const [annonceAccueil, setAnnonceAccueil] = useState("");
    const [saveMessage, setSaveMessage] = useState("");

    const login = async () => {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("Email ou mot de passe incorrect");
        console.error(error);
        setIsLogged(false);
      } else {
        console.log("ADMIN CONNECTÉ :", data);
        setMessage("Connexion réussie ✅");
        setIsLogged(true);
      }

      setLoading(false);
    };

    const saveAnnonce = async () => {
      setSaveMessage("");

      const { error } = await supabase
        .from("annonces")
        .insert({
          titre: "Annonce accueil",
          contenu: annonceAccueil,
          actif: true,
        });

      if (error) {
        console.error(error);
        setSaveMessage("Erreur lors de l’enregistrement ❌");
      } else {
        setSaveMessage("Annonce enregistrée ✅");
        chargerAnnonce();
      }
    };

    return (
      <main className="px-5 py-16">
        <PageTitle eyebrow="Administration" title="Espace Admin" text="Connexion sécurisée Chez Omer" />

        {!isLogged && (
          <div className="mx-auto max-w-md rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
            <h2 className="text-2xl font-black text-yellow-300">Connexion</h2>

            <div className="mt-6 space-y-4">
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400" />
              <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400" />
              <button onClick={login} disabled={loading} className="w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300">
                {loading ? "Connexion..." : "Se connecter"}
              </button>
              {message && <p className="text-center text-sm text-white">{message}</p>}
            </div>
          </div>
        )}

        {isLogged && (
          <div className="mx-auto max-w-5xl px-5 py-12">
            <h2 className="text-3xl font-black text-yellow-300">Panneau admin</h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <h3 className="text-xl font-black text-white">Annonce accueil</h3>
                <p className="mt-2 text-stone-400">Ici tu pourras écrire un message visible sur l’accueil.</p>
                <textarea value={annonceAccueil} onChange={(e) => setAnnonceAccueil(e.target.value)} className="mt-4 min-h-32 w-full rounded-2xl border border-yellow-500/20 bg-black px-4 py-3 text-white outline-none" placeholder="Exemple : Fermeture exceptionnelle ce soir à 20h..." />
                <button onClick={saveAnnonce} className="mt-4 rounded-full bg-yellow-400 px-6 py-3 font-black text-black">Enregistrer</button>
                {saveMessage && <p className="mt-3 text-sm font-bold text-yellow-300">{saveMessage}</p>}
              </div>

              <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <h3 className="text-xl font-black text-white">Fermeture exceptionnelle</h3>
                <p className="mt-2 text-stone-400">Active ou désactive un message de fermeture.</p>
                <button
                  onClick={async () => {
                    const newValue = !fermetureActive;
                    setFermetureActive(newValue);
                    await saveFermeture(newValue);
                  }}
                  className={`mt-4 rounded-full px-6 py-3 font-black text-white ${fermetureActive ? "bg-green-500" : "bg-red-500"}`}
                >
                  {fermetureActive ? "Désactiver fermeture" : "Activer fermeture"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  };

  const CurrentPage = () => {
    if (activePage === "Menu") return <MenuPage />;
    if (activePage === "À propos") return <AProposPage />;
    if (activePage === "Commande") return <CommandePage />;
    if (activePage === "Contact") return <ContactPage />;
    if (activePage === "Admin") return <AdminPage />;
    return <AccueilPage />;
  };

  return (
    <div className="min-h-screen bg-black text-stone-100">
      <div className="fixed inset-0 -z-10 bg-black" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.13),transparent_36%),linear-gradient(to_bottom,#050505,#0a0803,#000)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.07] bg-[url('/carte-visite.png')] bg-cover bg-center" />
      <style>{`@keyframes reservationMarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
      <Header />
      <button onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-4 font-black text-black shadow-2xl md:hidden"><ShoppingCart /> {itemCount}</button>
      <CurrentPage />
      <footer className="border-t border-yellow-500/20 px-5 py-10"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center text-stone-400 md:flex-row md:text-left"><div className="flex items-center gap-3"><img src={LOGO} alt="Logo Chez Omer" className="h-12 w-12 rounded-full object-cover" /><div><p className="font-black text-yellow-300">Chez Omer</p><p>Le kebab fait maison • Restaurant HALAL</p></div></div><p>© 2026 Chez Omer. Tous droits réservés.</p></div></footer>

      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 backdrop-blur">
          <div className="max-h-[86vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-white p-6 text-stone-950 shadow-2xl">
            <div className="grid items-start gap-7 lg:grid-cols-[420px_1fr]">
              {getDynamicImage() && <div className="sticky top-0 self-start overflow-hidden rounded-3xl bg-white p-2"><img src={getDynamicImage()} alt={selectedProduct.name} className="h-auto max-h-[360px] w-full rounded-2xl object-contain" /></div>}
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
                  <button onClick={() => setSelectedProduct(null)} className="rounded-full bg-stone-100 p-3 hover:bg-stone-200"><X /></button>
                </div>

                {needsDrinkSizeChoice(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choisissez le format</h4><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => setDrinkSizeChoice("33cl")} className={`rounded-2xl border px-5 py-3 font-bold transition ${drinkSizeChoice === "33cl" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>33cl • {selectedProduct.basePriceLabel}</button><button onClick={() => setDrinkSizeChoice("50cl")} className={`rounded-2xl border px-5 py-3 font-bold transition ${drinkSizeChoice === "50cl" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>50cl • {selectedProduct.menuPriceLabel}</button></div></div>}
                {needsWaterSizeChoice(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choisissez le format</h4><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => setWaterSizeChoice("50cl")} className={`rounded-2xl border px-5 py-3 font-bold transition ${waterSizeChoice === "50cl" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>50cl • {selectedProduct.basePriceLabel}</button><button onClick={() => setWaterSizeChoice("1L verre consigné")} className={`rounded-2xl border px-5 py-3 font-bold transition ${waterSizeChoice === "1L verre consigné" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>1L verre consigné • {selectedProduct.menuPriceLabel}</button></div></div>}
                {hasFormulaChoice(selectedProduct) && !needsDrinkSizeChoice(selectedProduct) && !needsWaterSizeChoice(selectedProduct) && <div className="mt-7"><h4 className="font-black">Formule</h4><p className="mt-1 text-sm text-stone-600">Le menu ajoute une boisson et une frite.</p><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => setFormulaChoice("Seul")} className={`rounded-2xl border px-5 py-3 font-bold transition ${formulaChoice === "Seul" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>Seul • {selectedProduct.basePriceLabel}</button><button onClick={() => setFormulaChoice("Menu")} className={`rounded-2xl border px-5 py-3 font-bold transition ${formulaChoice === "Menu" ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>Menu • {selectedProduct.menuPriceLabel}</button></div></div>}
                {needsMenuEnfantDrink(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choisissez la boisson</h4><div className="mt-4 grid grid-cols-2 gap-3">{menuEnfantBoissons.map((choice) => <button key={choice} onClick={() => setMenuEnfantBoisson(choice)} className={`rounded-2xl border px-5 py-3 font-bold transition ${menuEnfantBoisson === choice ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{choice}</button>)}</div></div>}
                {needsExtraCheddar(selectedProduct) && <div className="mt-7"><h4 className="font-black">Supplément</h4><button onClick={() => setExtraCheddar(!extraCheddar)} className={`mt-4 rounded-2xl border px-5 py-3 font-bold transition ${extraCheddar ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>Supplément cheddar +2€</button></div>}
                {needsSansSauceFromagere(selectedProduct) && <div className="mt-7"><h4 className="font-black">Allergène lactose</h4><button onClick={() => setSansSauceFromagere(!sansSauceFromagere)} className={`mt-4 rounded-2xl border px-5 py-3 font-bold transition ${sansSauceFromagere ? "border-red-500 bg-red-500 text-white" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-red-400"}`}>Sans sauce fromagère</button></div>}
                {needsAccompagnementChoice(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choisissez votre accompagnement</h4><div className="mt-4 grid grid-cols-3 gap-3">{accompagnementOptions.map((choice) => <button key={choice} onClick={() => setAccompagnementChoice(choice)} className={`rounded-2xl border px-5 py-3 font-bold transition ${accompagnementChoice === choice ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{choice}</button>)}</div></div>}
                {isSimpleTacos(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choix des viandes</h4><p className="mt-1 text-sm text-stone-600">Choisissez 1 ou 2 viandes maximum. La 2ème viande ajoute +2€.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{tacosMeats.map((meat) => { const selectedMeat = selectedMeats.find((item) => item.name === meat.name); const active = Boolean(selectedMeat); const locked = Boolean(selectedMeat?.locked); const disabled = locked || (!active && selectedMeats.length >= 2); return <button key={meat.name} onClick={() => toggleMeat(meat)} disabled={disabled} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? "border-yellow-500 bg-yellow-400 text-black" : disabled ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{meat.name}{locked ? " • inclus" : ""}</button>; })}</div><p className="mt-3 text-sm font-bold text-yellow-700">Viandes sélectionnées : {selectedMeats.length}/2{selectedMeats.length === 2 ? " • 2ème viande +2€" : ""}</p></div>}
                {isMaxiTacos(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choix des viandes</h4><p className="mt-1 text-sm text-stone-600">Choisissez jusqu’à 3 viandes. La 3ème viande ajoute +2€.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{maxiTacosMeats.map((meat) => { const active = selectedMeats.some((item) => item.name === meat.name); const disabled = !active && selectedMeats.length >= 3; return <button key={meat.name} onClick={() => toggleMeat(meat)} disabled={disabled} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${active ? "border-yellow-500 bg-yellow-400 text-black" : disabled ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{meat.name}</button>; })}</div><p className="mt-3 text-sm font-bold text-yellow-700">Viandes sélectionnées : {selectedMeats.length}/3</p></div>}
                {needsBreadChoice(selectedProduct) && <div className="mt-7"><h4 className="font-black">Choisissez votre pain</h4><div className="mt-4 flex gap-3">{["Sandwich", "Dürüm"].map((choice) => <button key={choice} onClick={() => setBreadChoice(choice)} className={`rounded-2xl border px-5 py-3 font-bold transition ${breadChoice === choice ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{choice}</button>)}</div></div>}
                {needsCruditeChoice(selectedProduct) && <div className="mt-7"><h4 className="font-black">Options</h4><p className="mt-1 text-sm text-stone-600">Sélectionnez ce que vous ne voulez pas dans votre plat.</p><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{getCruditeList(selectedProduct).map((option) => <button key={option} onClick={() => toggleCrudite(option)} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedCrudites.includes(option) ? "border-red-500 bg-red-500 text-white" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-red-400"}`}>{option}</button>)}</div></div>}
                {needsSauceChoice(selectedProduct.category, selectedProduct.name) && <div className="mt-7"><h4 className="font-black">Sauces</h4><p className="mt-1 text-sm text-stone-600">2 sauces au choix incluses. À partir de la 3ème : +0,20€ par sauce.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{sauces.map((sauce) => <button key={`sandwich-${sauce}`} onClick={() => toggleSauce(sauce, "sandwich")} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedSaucesSandwich.includes(sauce) ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{sauce}</button>)}</div>{supplementSaucesSandwich > 0 && <p className="mt-3 text-sm font-bold text-red-600">Supplément sauces : {formatPrice(supplementSaucesSandwich)}</p>}{formulaChoice === "Menu" && selectedProduct.category !== "Accompagnements" && <div className="mt-7"><h4 className="font-black">Sauces frites</h4><p className="mt-1 text-sm text-stone-600">2 sauces au choix incluses. À partir de la 3ème : +0,20€ par sauce.</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{sauces.map((sauce) => <button key={`frites-${sauce}`} onClick={() => toggleSauce(sauce, "frites")} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${selectedSaucesFrites.includes(sauce) ? "border-yellow-500 bg-yellow-400 text-black" : "border-stone-200 bg-stone-50 text-stone-700 hover:border-yellow-400"}`}>{sauce}</button>)}</div></div>}</div>}
                <div className="mt-7"><h4 className="font-black">Note</h4><textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none focus:border-yellow-500" placeholder="Exemple : bien cuit, sauce à part..." /></div>
                <button onClick={addToCart} disabled={isAddDisabled} className={`mt-6 w-full rounded-full px-6 py-4 font-black transition ${isAddDisabled ? "cursor-not-allowed bg-stone-300 text-stone-500" : "bg-black text-white hover:bg-yellow-400 hover:text-black"}`}>Ajouter au panier • {formatPrice(selectedProductPrice)}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-stone-950 text-stone-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-yellow-500/20 p-5"><h3 className="text-2xl font-black">Votre panier</h3><button onClick={() => setCartOpen(false)} className="rounded-full bg-white/10 p-3 hover:bg-white/20"><X /></button></div>
            <div className="flex-1 overflow-auto p-5">
              {cart.length === 0 ? <div className="rounded-[2rem] border border-yellow-500/20 bg-white/5 p-8 text-center"><ShoppingCart className="mx-auto mb-4 text-yellow-300" size={42} /><p className="text-lg font-bold">Votre panier est vide.</p><p className="mt-2 text-stone-400">Ajoutez un produit depuis le menu.</p></div> : <div className="space-y-4">{cart.map((item) => <div key={item.id} className="rounded-[1.5rem] border border-yellow-500/20 bg-white/5 p-5"><div className="flex items-start justify-between gap-4"><div><h4 className="font-black">{item.name}</h4><p className="text-sm text-stone-400">{item.category}</p>{item.formulaChoice && <p className="mt-1 text-sm text-yellow-300">Formule : {item.formulaChoice}</p>}{item.drinkSizeChoice && <p className="mt-1 text-sm text-yellow-300">Format : {item.drinkSizeChoice}</p>}{item.waterSizeChoice && <p className="mt-1 text-sm text-yellow-300">Format : {item.waterSizeChoice}</p>}{item.menuEnfantBoisson && <p className="mt-1 text-sm text-yellow-300">Boisson : {item.menuEnfantBoisson}</p>}{item.extraCheddar && <p className="mt-1 text-sm text-yellow-300">Supplément cheddar : +2,00 €</p>}{item.sansSauceFromagere && <p className="mt-1 text-sm text-yellow-300">Sans sauce fromagère</p>}{item.breadChoice && <p className="mt-1 text-sm text-yellow-300">Choix : {item.breadChoice}</p>}{item.accompagnementChoice && <p className="mt-1 text-sm text-yellow-300">Accompagnement : {item.accompagnementChoice}</p>}{item.meats?.length > 0 && <p className="mt-1 text-sm text-yellow-300">Viandes : {item.meats.map((meat) => `${meat.name}`).join(", ")}{item.tacosSimple && item.meats.length === 2 ? " | 2ème viande (+2€)" : ""}{!item.tacosSimple && item.meats.length === 3 ? " | 3ème viande (+2€)" : ""}</p>}</div><button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-200"><Trash2 size={18} /></button></div>{item.crudites?.length > 0 && <p className="mt-3 text-sm text-stone-300">Options : {item.crudites.join(", ")}</p>}{item.saucesSandwich?.length > 0 && <p className="mt-3 text-sm text-stone-300">Sauces : {item.saucesSandwich.join(", ")}</p>}{item.saucesFrites?.length > 0 && <p className="mt-3 text-sm text-stone-300">Sauces frites : {item.saucesFrites.join(", ")}</p>}{item.supplementSauces > 0 && <p className="mt-2 text-sm font-bold text-red-300">Supplément sauces : {formatPrice(item.supplementSauces)}</p>}{item.note && <p className="mt-2 text-sm text-stone-300">Note : {item.note}</p>}<div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => changeQuantity(item.id, -1)} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Minus size={16} /></button><span className="font-black">{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Plus size={16} /></button></div><p className="font-black text-yellow-300">{formatPrice(item.price * item.quantity)}</p></div></div>)}</div>}
            </div>
            <div className="border-t border-yellow-500/20 p-5">
              <div className="mb-4 flex items-center justify-between text-2xl font-black"><span>Total</span><span>{formatPrice(total)}</span></div>
              <a href={cart.length > 0 && !fermetureActive ? `https://wa.me/${whatsappNumber}?text=${orderMessage}` : undefined} target="_blank" rel="noreferrer" className={`block rounded-full px-6 py-4 text-center font-black transition ${cart.length > 0 && !fermetureActive ? "bg-yellow-400 text-black hover:bg-yellow-300" : "pointer-events-none bg-white/10 text-stone-500"}`}>
                {fermetureActive ? "Commandes temporairement fermées" : "Envoyer la commande WhatsApp"}
              </a>
              <p className="mt-3 text-center text-xs text-stone-500">Paiement en ligne à ajouter à l’étape suivante.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
