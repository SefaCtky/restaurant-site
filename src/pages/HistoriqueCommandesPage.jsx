import React, { useEffect, useState } from "react";
import { ShoppingCart, RotateCcw, User, Save, Loader2, Lock, Mail, Phone } from "lucide-react";

export default function HistoriqueCommandesPage({
  supabase,
  user,
  formatPrice,
  setCart,
  setCartOpen,
}) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour la gestion du profil client
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [updatingProfil, setUpdatingProfil] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // Charger les données de sécurité et de profil
  const chargerProfil = async () => {
    if (!user?.id) return;
    try {
      setLoadingProfil(true);
      
      const { data, error, status } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setPhone(data.phone || "");
      }

      if (user.email) {
        setEmail(user.email);
      }

    } catch (error) {
      console.error("Erreur chargement profil:", error.message);
    } finally {
      setLoadingProfil(false);
    }
  };

  // Sauvegarder les modifications (Téléphone, Email, Mot de passe)
  const sauvegarderProfil = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setUpdatingProfil(true);

      // 1. Mise à jour de la table profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, phone: phone, updated_at: new Date() });
      if (profileError) throw profileError;

      // 2. Mise à jour Auth (Email ou Password)
      const authUpdates = {};
      if (email !== user.email && email.trim() !== "") authUpdates.email = email;
      if (password.trim() !== "") {
        if (password.length < 6) throw new Error("Le mot de passe doit faire 6 caractères min.");
        if (password !== passwordConfirmation) throw new Error("Les mots de passe ne correspondent pas.");
        authUpdates.password = password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      alert("Vos informations ont bien été mises à jour ! 🎉");
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      alert(`Erreur : ${error.message}`);
    } finally {
      setUpdatingProfil(false);
    }
  };

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
    chargerProfil();

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
  }, [user?.id, user?.email]);

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
      case "en_attente": return { text: "En attente", className: "bg-red-500/20 text-red-300 border border-red-500/30" };
      case "en_preparation": return { text: "En préparation", className: "bg-orange-500/20 text-orange-300 border border-orange-500/30" };
      case "prete": return { text: "Prête", className: "bg-green-500/20 text-green-300 border border-green-500/30" };
      case "livree": return { text: "Livrée", className: "bg-stone-500/20 text-stone-300 border border-stone-500/30" };
      default: return { text: statut, className: "bg-white/10 text-white border border-white/20" };
    }
  };

  const getProgressionCommande = (statut) => {
    const etapes = ["en_attente", "en_preparation", "prete", "livree"]; // Valeurs de ta BDD
    const indexActuel = etapes.indexOf(statut);
    
    // Noms affichés à l'écran
    const labels = ["En attente", "En prépa", "Prête", "Livrée"];
    
    return labels.map((label, index) => ({
      label: label,
      active: index <= indexActuel,
    }));
  };

  const getTempsRestant = (commande) => {
    if (!commande.temps_estime_minutes || !commande.temps_estime_at) return null;
    if (commande.statut === "Prête") return "Votre commande est prête ✅";
    if (commande.statut === "Livrée") return "Commande livrée ✅";

    const debut = new Date(commande.temps_estime_at).getTime();
    const fin = debut + commande.temps_estime_minutes * 60000;
    const restant = Math.max(0, Math.ceil((fin - Date.now()) / 60000));
    return `Temps estimé restant : ${restant} min`;
  };

  const getMessageStatut = (statut) => {
    switch (statut) {
      case "En attente": return "🧾 Votre commande a bien été reçue.";
      case "En préparation": return "👨‍🍳 La cuisine prépare votre commande.";
      case "Prête": return "✅ Votre commande est prête !";
      case "Livrée": return "🎉 Merci pour votre commande Chez Omer.";
      default: return "";
    }
  };

  const getIconStatut = (statut) => {
    switch (statut) {
      case "en_attente": return "🧾";
      case "en_preparation": return "👨‍🍳";
      case "prete": return "✅";
      case "livree": return "🎉";
      default: return "🍴";
    }
  };

  return (
    <main className="px-5 py-16">
      <div className="mx-auto max-w-5xl space-y-12">
        
        {/* TITRE PRINCIPAL */}
        <div className="text-center">
          <p className="font-black uppercase tracking-[0.5em] text-yellow-400">
            Espace Client
          </p>
          <h1 className="mt-4 text-5xl font-black text-white">
            Mon Compte Chez Omer
          </h1>
        </div>

        {/* SECTION SÉCURITÉ & CONTACT */}
        <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6 md:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-yellow-400" size={24} />
            <h2 className="text-2xl font-black text-white">Sécurité &amp; Contact</h2>
          </div>

          {loadingProfil ? (
            <p className="text-stone-400 text-sm">Chargement de vos identifiants...</p>
          ) : (
            <form onSubmit={sauvegarderProfil} className="space-y-5">
              
              {/* Téléphone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="text-yellow-400" size={14} /> Numéro de Téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm transition"
                  placeholder="Ex: 06 12 34 56 78"
                />
              </div>

              {/* Adresse Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="text-yellow-400" size={14} /> Adresse Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm transition"
                  placeholder="votre.email@exemple.com"
                  required
                />
                <p className="text-[11px] text-stone-500 italic mt-0.5">
                  Changer l'email demandera une confirmation par message sur votre nouvelle boîte.
                </p>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="text-yellow-400" size={14} /> Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm transition"
                  placeholder="•••••••• (Laissez vide pour ne pas changer)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="text-yellow-400" size={14} /> Confirmer le Mot de Passe
                </label>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 text-sm transition"
                  placeholder="Retapez votre nouveau mot de passe"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfil}
                  className="flex items-center gap-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 text-sm uppercase tracking-wider transition disabled:opacity-50 shadow-lg"
                >
                  {updatingProfil ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {updatingProfil ? "Mise à jour..." : "Enregistrer"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* SECTION HISTORIQUE */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white tracking-tight border-b border-stone-800 pb-4">
            Historique de mes commandes ({commandes.length})
          </h2>

          {loading && (
            <p className="text-center text-stone-400">Chargement de vos commandes...</p>
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
                    {commande.created_at ? new Date(commande.created_at).toLocaleString("fr-FR") : ""}
                  </p>
                  <div className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-black ${getStatutStyle(commande.statut).className}`}>
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
                        <div className={`h-3 rounded-full ${etape.active ? "bg-yellow-400" : "bg-white/10"}`} />
                        <p className={`mt-2 text-xs font-bold ${etape.active ? "text-yellow-300" : "text-stone-500"}`}>{etape.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{formatPrice(commande.total || 0)}</p>
                  <button onClick={() => recommander(commande)} className="mt-3 flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 font-black text-black transition duration-300 hover:scale-105">
                    <RotateCcw size={18} /> Recommander
                  </button>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {(commande.contents || commande.contenu || []).map((item, index) => (
                  <div key={index} className="rounded-2xl border border-yellow-500/10 bg-black/50 p-4 text-sm text-stone-300">
                    <p className="font-black text-white">{item.quantite}x {item.nom}</p>
                    <p>{item.categorie}</p>
                    <p className="mt-1 text-yellow-300">{formatPrice(item.total_ligne || 0)}</p>
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