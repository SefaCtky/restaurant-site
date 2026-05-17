import { supabase } from "./supabase";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AccueilPage from "./pages/AccueilPage";
import HistoriqueCommandesPage from "./pages/HistoriqueCommandesPage";
import MenuPage from "./pages/MenuPage";
import AProposPage from "./pages/AProposPage";
import StaffCommandesPage from "./pages/StaffCommandesPage";
import ContactPage from "./pages/ContactPage";
import PointagePage from "./pages/PointagePage";
import AdminPage from "./pages/AdminPage";
import ConnexionPage from "./pages/ConnexionPage";
import ProductModal from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import MobileCartButton from "./components/MobileCartButton";
import Footer from "./components/Footer";
import Header from "./components/Header";
import {
  Utensils,
  Sandwich,
  Soup,
  CupSoda,
  CakeSlice,
  UtensilsCrossed,
  Bell,
  BellOff,
} from "lucide-react";
import CuisinePage from "./pages/CuisinePage";

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

function parsePrice(price) {
  if (!price) return 0;
  return Number(String(price).replace("€", "").replace(",", ".").trim()) || 0;
}

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
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
  const [activePage, setActivePage] = useState(
    window.location.pathname === "/cuisine" ? "Cuisine" : "Accueil"
  );  const [activeCategory, setActiveCategory] = useState(null);
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
  const [produits, setProduits] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [selectedAdminCategory, setSelectedAdminCategory] = useState("all");
  const [fermetureActive, setFermetureActive] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("client");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const audioContextRef = useRef(null);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const nav = [
    "Accueil",
    "Menu",
    "À propos",
    ...(user ? ["Historique"] : []),
    "Contact",
    ...(userRole === "admin" || userRole === "employe"
      ? ["Pointage", "Commandes", "Cuisine"]
      : []),
    ...(userRole === "admin" ? ["Admin"] : []),
    ...(!user ? ["Connexion"] : []),
  ];

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const creerAudioContext = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      alert("Votre navigateur ne permet pas d'activer le son ❌");
      return null;
    }

    const context = audioContextRef.current || new AudioContextClass();

    if (context.state === "suspended") {
      await context.resume();
    }

    audioContextRef.current = context;
    return context;
  };

  const jouerBipTest = (context) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);

    gainNode.gain.setValueAtTime(0.001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  };

  const playNotificationSound = () => {
    if (!soundEnabledRef.current || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;

    const playBeep = (startTime, frequency) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    };

    const now = audioContext.currentTime;
    playBeep(now, 900);
    playBeep(now + 0.45, 1200);
    playBeep(now + 0.9, 900);
  };

  const activerSonCommandes = async () => {
    if (soundEnabledRef.current) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      setNewOrderFlash(false);
      return;
    }

    const context = await creerAudioContext();
    if (!context) return;

    soundEnabledRef.current = true;
    setSoundEnabled(true);
    jouerBipTest(context);
  };

  useEffect(() => {
    if (!["admin", "employe"].includes(userRole)) return;

    const channel = supabase
      .channel("app-commandes-sound-global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commandes",
        },
        () => {
          playNotificationSound();
          setNewOrderFlash(true);
          setTimeout(() => setNewOrderFlash(false), 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const chargerCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("ordre", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setCategoriesData(data || []);
  };

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

    setAnnonceSite(data && data.length > 0 ? data[0].contenu : "");
  };

  const chargerFermeture = async () => {
    const { data, error } = await supabase.from("settings").select("fermeture_active").eq("id", 1).single();
    if (error) {
      console.error(error);
      return;
    }
    setFermetureActive(Boolean(data?.fermeture_active));
  };

  const saveFermeture = async (value) => {
    const { error } = await supabase.from("settings").update({ fermeture_active: value }).eq("id", 1);
    if (error) console.error(error);
  };

  const chargerProduits = async () => {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("categorie_id", { ascending: true })
      .order("ordre", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setProduits(data || []);
  };

  const updateProduit = (id, field, value) => {
    setProduits((current) => current.map((produit) => (produit.id === id ? { ...produit, [field]: value } : produit)));
  };

  const saveProduit = async (produit) => {
    const { error } = await supabase
      .from("produits")
      .update({
        nom: produit.nom,
        description: produit.description,
        prix: produit.prix,
        prix_menu: produit.prix_menu,
        type: produit.type,
        image: produit.image,
        ordre: produit.ordre,
        actif: produit.actif,
        in_stock: produit.in_stock ?? true,
        categorie_id: produit.categorie_id,
      })
      .eq("id", produit.id);

    if (error) {
      console.error(error);
      alert("Erreur lors de l’enregistrement ❌");
    } else {
      alert("Produit enregistré ✅");
      chargerProduits();
    }
  };

  const verifierSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      setUserRole("client");
      setLoadingAuth(false);
      return "client";
    }

    setUser(user);

    const { data, error } = await supabase.from("profiles").select("id, nom, role").eq("id", user.id).maybeSingle();

    if (error || !data) {
      console.error(error);
      setUserRole("client");
      setLoadingAuth(false);
      return "client";
    }

    setUserRole(data.role);
    setLoadingAuth(false);
    return data.role;
  };

  useEffect(() => {
    verifierSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      verifierSession();
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
  const handlePopState = () => {
    setActivePage(
      window.location.pathname === "/cuisine"
        ? "Cuisine"
        : "Accueil"
    );
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);

  useEffect(() => {
    chargerAnnonce();
    chargerFermeture();
    chargerCategories();
    chargerProduits();
  }, []);

  const isSimpleTacos = (product) => product?.type === "tacos-simple";
  const isMaxiTacos = (product) => product?.type === "maxi-tacos";
  const needsTacosMeatChoice = (product) => isSimpleTacos(product) || isMaxiTacos(product);

  const needsSauceChoice = (category, productName = "", productType = "") => {
    if (productType === "frite-sauce") return true;
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
    const [name, desc, price, menuPrice, type, image, inStock] = product;

    if (!price) return;
    if (inStock === false) return;

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
      in_stock: inStock ?? true,
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

    if (type === "tacos-simple") {
      setSelectedMeats([{ name, extra: 0, locked: true }]);
    } else {
      setSelectedMeats([]);
    }
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
        return waterSizeChoice === "1L verre consigné" ? "/images/Boissons/Bouteille Evian 1l.png" : "/images/Boissons/Bouteille Evian 50cl.png";
      }
      if (needsDrinkSizeChoice(selectedProduct)) {
        const imageName = drinkImageNames[selectedProduct.name] || selectedProduct.name;
        return drinkSizeChoice === "50cl" ? `/images/Boissons/Bouteille/${imageName}.png` : `/images/Boissons/Canette/${imageName}.png`;
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
    (selectedProduct.in_stock === false ||
      (needsTacosMeatChoice(selectedProduct) && selectedMeats.length === 0) ||
      (needsAccompagnementChoice(selectedProduct) && !accompagnementChoice));

  const addToCart = () => {
    if (!selectedProduct) return;
    if (selectedProduct.in_stock === false) return;
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
          hasFormulaChoice(selectedProduct) && !needsDrinkSizeChoice(selectedProduct) && !needsWaterSizeChoice(selectedProduct) ? formulaChoice : "",
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
    setCart((current) => current.map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item)).filter((item) => item.quantity > 0));
  };

  const removeItem = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

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
        ? `\n  Viandes : ${item.meats.map((meat) => `${meat.name}`).join(", ")}${item.tacosSimple && item.meats.length === 2 ? " | 2ème viande (+2€)" : ""}${
            !item.tacosSimple && item.meats.length === 3 ? " | 3ème viande (+2€)" : ""
          }`
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

    if (page === "Cuisine") {
      window.history.pushState({}, "", "/cuisine");
    } else {
      window.history.pushState({}, "", "/");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const CurrentPage = () => {
    if (activePage === "Menu") {
      return (
        <MenuPage
          categoriesData={categoriesData}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          produits={produits}
          getCategoryIcon={getCategoryIcon}
          openProduct={openProduct}
        />
      );
    }

    if (activePage === "Historique") {
  return (
    <HistoriqueCommandesPage
      supabase={supabase}
      user={user}
      formatPrice={formatPrice}
      setCart={setCart}
      setCartOpen={setCartOpen}
    />
  );
}

    if (activePage === "À propos") return <AProposPage BACKGROUND_IMAGE={BACKGROUND_IMAGE} />;

    if (activePage === "Contact") {
      return <ContactPage restaurantAddress={restaurantAddress} phoneNumber={phoneNumber} whatsappNumber={whatsappNumber} />;
    }

    if (activePage === "Pointage") return <PointagePage supabase={supabase} />;

    if (activePage === "Commandes") {
      return (
        <StaffCommandesPage
          supabase={supabase}
          userRole={userRole}
          formatPrice={formatPrice}
          soundEnabled={soundEnabled}
          activerSonCommandes={activerSonCommandes}
        />
      );
    }

    if (activePage === "Cuisine") {
      return (
        <CuisinePage
          supabase={supabase}
          formatPrice={formatPrice}
          soundEnabled={soundEnabled}
          activerSonCommandes={activerSonCommandes}
        />
      );
    }

    if (activePage === "Admin") {
      return (
        <AdminPage
          supabase={supabase}
          userRole={userRole}
          verifierSession={verifierSession}
          chargerAnnonce={chargerAnnonce}
          fermetureActive={fermetureActive}
          setFermetureActive={setFermetureActive}
          saveFermeture={saveFermeture}
          categoriesData={categoriesData}
          selectedAdminCategory={selectedAdminCategory}
          setSelectedAdminCategory={setSelectedAdminCategory}
          produits={produits}
          updateProduit={updateProduit}
          saveProduit={saveProduit}
          chargerProduits={chargerProduits}
        />
      );
    }

    if (activePage === "Connexion") {
      return <ConnexionPage supabase={supabase} verifierSession={verifierSession} setActivePage={setActivePage} />;
    }

    return (
      <AccueilPage
        supabase={supabase}
        fermetureActive={fermetureActive}
        annonceSite={annonceSite}
        whatsappNumber={whatsappNumber}
        showPage={showPage}
        LOGO={LOGO}
        restaurantAddress={restaurantAddress}
        phoneNumber={phoneNumber}
      />
    );
  };

  if (window.location.pathname === "/cuisine") {
    return (
      <CuisinePage
        supabase={supabase}
        formatPrice={formatPrice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-stone-100">
      <div className="fixed inset-0 -z-10 bg-black" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.13),transparent_36%),linear-gradient(to_bottom,#050505,#0a0803,#000)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.07] bg-[url('/carte-visite.png')] bg-cover bg-center" />
      <style>{`@keyframes reservationMarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>

      {activePage !== "Cuisine" && (
        <Header
          LOGO={LOGO}
          nav={nav}
          activePage={activePage}
          showPage={showPage}
          user={user}
          setUser={setUser}
          setUserRole={setUserRole}
          setActivePage={setActivePage}
          setOpen={setOpen}
          open={open}
          itemCount={itemCount}
          setCartOpen={setCartOpen}
          supabase={supabase}
        />
      )}

      
      {activePage !== "Cuisine" && (
        <MobileCartButton
          itemCount={itemCount}
          setCartOpen={setCartOpen}
        />
      )}
      <CurrentPage />
      {activePage !== "Cuisine" && (
        <Footer LOGO={LOGO} />
      )}

      <ProductModal
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        getDynamicImage={getDynamicImage}
        formatPrice={formatPrice}
        selectedProductPrice={selectedProductPrice}
        isSimpleTacos={isSimpleTacos}
        isMaxiTacos={isMaxiTacos}
        selectedMeats={selectedMeats}
        extraCheddar={extraCheddar}
        supplementSaucesTotal={supplementSaucesTotal}
        needsDrinkSizeChoice={needsDrinkSizeChoice}
        drinkSizeChoice={drinkSizeChoice}
        setDrinkSizeChoice={setDrinkSizeChoice}
        needsWaterSizeChoice={needsWaterSizeChoice}
        waterSizeChoice={waterSizeChoice}
        setWaterSizeChoice={setWaterSizeChoice}
        hasFormulaChoice={hasFormulaChoice}
        formulaChoice={formulaChoice}
        setFormulaChoice={setFormulaChoice}
        needsMenuEnfantDrink={needsMenuEnfantDrink}
        menuEnfantBoissons={menuEnfantBoissons}
        menuEnfantBoisson={menuEnfantBoisson}
        setMenuEnfantBoisson={setMenuEnfantBoisson}
        needsExtraCheddar={needsExtraCheddar}
        setExtraCheddar={setExtraCheddar}
        needsSansSauceFromagere={needsSansSauceFromagere}
        sansSauceFromagere={sansSauceFromagere}
        setSansSauceFromagere={setSansSauceFromagere}
        needsAccompagnementChoice={needsAccompagnementChoice}
        accompagnementOptions={accompagnementOptions}
        accompagnementChoice={accompagnementChoice}
        setAccompagnementChoice={setAccompagnementChoice}
        tacosMeats={tacosMeats}
        maxiTacosMeats={maxiTacosMeats}
        toggleMeat={toggleMeat}
        needsBreadChoice={needsBreadChoice}
        breadChoice={breadChoice}
        setBreadChoice={setBreadChoice}
        needsCruditeChoice={needsCruditeChoice}
        getCruditeList={getCruditeList}
        selectedCrudites={selectedCrudites}
        toggleCrudite={toggleCrudite}
        needsSauceChoice={needsSauceChoice}
        sauces={sauces}
        selectedSaucesSandwich={selectedSaucesSandwich}
        selectedSaucesFrites={selectedSaucesFrites}
        toggleSauce={toggleSauce}
        supplementSaucesSandwich={supplementSaucesSandwich}
        note={note}
        setNote={setNote}
        addToCart={addToCart}
        isAddDisabled={isAddDisabled}
      />

      <CartDrawer
        user={user}
        setCart={setCart}
        supabase={supabase}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cart={cart}
        removeItem={removeItem}
        changeQuantity={changeQuantity}
        formatPrice={formatPrice}
        total={total}
        fermetureActive={fermetureActive}
        whatsappNumber={whatsappNumber}
        orderMessage={orderMessage}
      />
    </div>
  );
}
