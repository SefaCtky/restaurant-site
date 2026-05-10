import React, { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import { calculateWorkedTime } from "../utils/pointageUtils";
import * as XLSX from "xlsx";

export default function AdminPage({
  supabase,
  userRole,
  verifierSession,
  chargerAnnonce,
  fermetureActive,
  setFermetureActive,
  saveFermeture,
  categoriesData,
  selectedAdminCategory,
  setSelectedAdminCategory,
  produits,
  updateProduit,
  saveProduit,
  chargerProduits,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [messageProfiles, setMessageProfiles] = useState("");
  const isLogged = userRole === "admin";

  const chargerProfiles = async () => {
    setMessageProfiles("");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessageProfiles("Erreur chargement des comptes ❌");
      return;
    }

    setProfiles(data || []);
  };

  const changerRole = async (id, role) => {
    if (!id || !role) return;

    const confirmation = confirm(`Confirmer le passage de ce compte en rôle "${role}" ?`);
    if (!confirmation) return;

    setMessageProfiles("");

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessageProfiles(`Erreur modification rôle : ${error.message} ❌`);
      return;
    }

    setMessageProfiles("Rôle modifié avec succès ✅");
    chargerProfiles();
  };

  const [adminTab, setAdminTab] = useState("produits");

  const [annonceAccueil, setAnnonceAccueil] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [listeEmployes, setListeEmployes] = useState([]);
  const [historiquePointages, setHistoriquePointages] = useState([]);
  const [demandesPointage, setDemandesPointage] = useState([]);
  const [reponsesDemandes, setReponsesDemandes] = useState({});
  const [filtreEmploye, setFiltreEmploye] = useState("all");
  const [rechercheEmploye, setRechercheEmploye] = useState("");

  const [avisClients, setAvisClients] = useState([]);
  const [nouvelAvis, setNouvelAvis] = useState({
    nom: "",
    note: 5,
    commentaire: "",
    actif: true,
    ordre: 999,
  });

  const chargerEmployes = async () => {
    const { data, error } = await supabase
      .from("employes")
      .select("*")
      .order("nom", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setListeEmployes(data || []);
  };

  const chargerPointages = async () => {
    const { data, error } = await supabase
      .from("pointages")
      .select("*")
      .order("arrivee", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setHistoriquePointages(data || []);
  };

  const chargerDemandesPointage = async () => {
    const { data, error } = await supabase
      .from("demandes_modification_pointage")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setDemandesPointage(data || []);
  };

  const chargerAvisClients = async () => {
    const { data, error } = await supabase
      .from("avis_clients")
      .select("*")
      .order("ordre", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erreur chargement avis clients ❌");
      return;
    }

    setAvisClients(data || []);
  };

  useEffect(() => {
    if (isLogged) {
      chargerEmployes();
      chargerPointages();
      chargerDemandesPointage();
      chargerAvisClients();
      chargerProfiles();
    }
  }, [isLogged]);

  const login = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Email ou mot de passe incorrect");
    } else {
      await verifierSession();
      setMessage("Connexion réussie ✅");
    }

    setLoading(false);
  };

  const saveAnnonce = async () => {
    setSaveMessage("");

    const { error } = await supabase.from("annonces").insert({
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

  const modifierPointage = async (id, field, value) => {
    const { error } = await supabase
      .from("pointages")
      .update({ [field]: value ? new Date(value).toISOString() : null })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur modification pointage ❌");
      return;
    }

    alert("Pointage modifié ✅");
    chargerPointages();
  };

  const supprimerPointage = async (id) => {
    if (!confirm("Supprimer ce pointage ?")) return;

    const { error } = await supabase.from("pointages").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur suppression ❌");
      return;
    }

    alert("Pointage supprimé ✅");
    chargerPointages();
    chargerDemandesPointage();
  };

  const forcerDepart = async (id) => {
    const { error } = await supabase
      .from("pointages")
      .update({ depart: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur départ ❌");
      return;
    }

    alert("Départ enregistré ✅");
    chargerPointages();
  };

  const traiterDemandePointage = async (demande, statut) => {
    const reponseAdmin = reponsesDemandes[demande.id] || "";

    if (statut === "refusee" && !reponseAdmin.trim()) {
      alert("Merci d’indiquer une raison en cas de refus ❌");
      return;
    }

    if (statut === "acceptee") {
      const { error: updatePointageError } = await supabase
        .from("pointages")
        .update({
          arrivee: demande.arrivee_demandee,
          depart: demande.depart_demandee,
        })
        .eq("id", demande.pointage_id);

      if (updatePointageError) {
        console.error(updatePointageError);
        alert("Erreur lors de la modification du pointage ❌");
        return;
      }
    }

    const { error } = await supabase
      .from("demandes_modification_pointage")
      .update({
        statut,
        reponse_admin:
          reponseAdmin.trim() ||
          (statut === "acceptee" ? "Modification acceptée." : ""),
        processed_at: new Date().toISOString(),
      })
      .eq("id", demande.id);

    if (error) {
      console.error(error);
      alert("Erreur lors du traitement de la demande ❌");
      return;
    }

    alert(
      statut === "acceptee"
        ? "Demande acceptée et pointage modifié ✅"
        : "Demande refusée ✅"
    );

    chargerPointages();
    chargerDemandesPointage();
  };

  const uploadImageProduit = async (file, produitId) => {
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${produitId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("produits")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      alert("Erreur upload image ❌");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("produits").getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("produits")
      .update({ image: publicUrl })
      .eq("id", produitId);

    if (updateError) {
      console.error(updateError);
      alert("Image uploadée mais erreur d'enregistrement du lien ❌");
      return;
    }

    alert("Image uploadée ✅");
    chargerProduits();
  };

  const ajouterProduit = async () => {
    const categorieId =
      selectedAdminCategory === "all"
        ? categoriesData[0]?.id
        : Number(selectedAdminCategory);

    if (!categorieId) {
      alert("Aucune catégorie trouvée ❌");
      return;
    }

    const nouveauProduit = {
      nom: "Nouveau produit",
      description: "",
      prix: 0,
      prix_menu: 0,
      image: "",
      type: "",
      actif: true,
      in_stock: true,
      ordre: 999,
      categorie_id: categorieId,
    };

    const { error } = await supabase.from("produits").insert([nouveauProduit]);

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      alert("Produit créé ✅");
      chargerProduits();
    }
  };

  const supprimerProduit = async (produit) => {
    if (!confirm(`Supprimer le produit "${produit.nom}" ?`)) return;

    const { error } = await supabase
      .from("produits")
      .delete()
      .eq("id", produit.id);

    if (error) {
      console.error(error);
      alert("Erreur suppression produit ❌");
      return;
    }

    alert("Produit supprimé ✅");
    chargerProduits();
  };

  const ajouterAvis = async () => {
    if (!nouvelAvis.nom.trim() || !nouvelAvis.commentaire.trim()) {
      alert("Merci de renseigner le nom et le commentaire ❌");
      return;
    }

    const { error } = await supabase.from("avis_clients").insert({
      nom: nouvelAvis.nom,
      note: Number(nouvelAvis.note),
      commentaire: nouvelAvis.commentaire,
      actif: nouvelAvis.actif,
      ordre: Number(nouvelAvis.ordre),
    });

    if (error) {
      console.error(error);
      alert("Erreur ajout avis ❌");
      return;
    }

    alert("Avis ajouté ✅");
    setNouvelAvis({
      nom: "",
      note: 5,
      commentaire: "",
      actif: true,
      ordre: 999,
    });
    chargerAvisClients();
  };

  const modifierAvis = async (id, field, value) => {
    const fieldsNumber = ["note", "ordre"];
    const finalValue = fieldsNumber.includes(field) ? Number(value) : value;

    const { error } = await supabase
      .from("avis_clients")
      .update({ [field]: finalValue })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur modification avis ❌");
      return;
    }

    chargerAvisClients();
  };

  const supprimerAvis = async (avis) => {
    if (!confirm(`Supprimer l’avis de "${avis.nom}" ?`)) return;

    const { error } = await supabase
      .from("avis_clients")
      .delete()
      .eq("id", avis.id);

    if (error) {
      console.error(error);
      alert("Erreur suppression avis ❌");
      return;
    }

    alert("Avis supprimé ✅");
    chargerAvisClients();
  };

  const formatInputDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const formatDateHeure = (date) => {
    if (!date) return "Non renseigné";
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEmploye = (employeId) =>
    listeEmployes.find((employe) => employe.id === employeId);

  const formatTotalHeures = (minutes) => {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${heures}h${String(mins).padStart(2, "0")}`;
  };

  const exporterPointagesExcel = () => {
    const totalMinutes = historiquePointages.reduce((total, pointage) => {
      if (!pointage.arrivee || !pointage.depart) return total;

      const arrivee = new Date(pointage.arrivee);
      const depart = new Date(pointage.depart);
      const diffMinutes = Math.max(0, Math.floor((depart - arrivee) / 60000));

      return total + diffMinutes;
    }, 0);

    const lignes = historiquePointages.map((pointage) => {
      const employe = getEmploye(pointage.employe_id);

      return {
        Employé: employe?.nom || "Employé inconnu",
        Poste: employe?.poste || "",
        Arrivée: formatDateHeure(pointage.arrivee),
        Départ: formatDateHeure(pointage.depart),
        "Temps travaillé": calculateWorkedTime(pointage.arrivee, pointage.depart),
        Statut: pointage.depart ? "Hors service" : "En service",
      };
    });

    if (lignes.length === 0) {
      alert("Aucun pointage à exporter ❌");
      return;
    }

    lignes.push({});
    lignes.push({
      Employé: "TOTAL",
      "Temps travaillé": formatTotalHeures(totalMinutes),
    });

    const feuille = XLSX.utils.json_to_sheet(lignes);
    const classeur = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(classeur, feuille, "Pointages");
    XLSX.writeFile(classeur, "pointages-chez-omer.xlsx");
  };

  const demandesEnAttente = demandesPointage.filter(
    (demande) => demande.statut === "en_attente"
  );

  const demandesTraitees = demandesPointage.filter(
    (demande) => demande.statut !== "en_attente"
  );

  const pointagesFiltres = historiquePointages.filter((pointage) => {
    const employe = getEmploye(pointage.employe_id);

    const filtreOK =
      filtreEmploye === "all"
        ? true
        : pointage.employe_id === filtreEmploye;

    const rechercheOK =
      rechercheEmploye.trim() === ""
        ? true
        : employe?.nom
            ?.toLowerCase()
            .includes(rechercheEmploye.toLowerCase());

    return filtreOK && rechercheOK;
  });

  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Administration"
        title="Espace Admin"
        text="Gestion du restaurant Chez Omer"
      />

      {!isLogged && (
        <div className="mx-auto max-w-md rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
          <h2 className="text-2xl font-black text-yellow-300">Connexion admin</h2>

          <div className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none focus:border-yellow-400"
            />

            <button
              onClick={login}
              disabled={loading}
              className="w-full rounded-full bg-yellow-400 px-6 py-4 font-black text-black hover:bg-yellow-300"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            {message && <p className="text-center text-sm text-white">{message}</p>}
          </div>
        </div>
      )}

      {isLogged && (
        <div className="mx-auto max-w-5xl px-5 py-12">
          <h2 className="text-3xl font-black text-yellow-300">Panneau admin</h2>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setAdminTab("produits")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "produits"
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Produits
            </button>

            <button
              onClick={() => setAdminTab("avis")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "avis"
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Avis clients
            </button>

            <button
              onClick={() => setAdminTab("employes")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "employes"
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Employés
            </button>

            <button
              onClick={() => setAdminTab("comptes")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "comptes"
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Comptes
            </button>
          </div>

          {adminTab === "produits" && (
            <>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                  <h3 className="text-xl font-black text-white">Annonce accueil</h3>

                  <textarea
                    value={annonceAccueil}
                    onChange={(e) => setAnnonceAccueil(e.target.value)}
                    className="mt-4 min-h-32 w-full rounded-2xl border border-yellow-500/20 bg-black px-4 py-3 text-white outline-none"
                    placeholder="Exemple : Fermeture exceptionnelle ce soir à 20h..."
                  />

                  <button
                    onClick={saveAnnonce}
                    className="mt-4 rounded-full bg-yellow-400 px-6 py-3 font-black text-black"
                  >
                    Enregistrer
                  </button>

                  {saveMessage && (
                    <p className="mt-3 text-sm font-bold text-yellow-300">
                      {saveMessage}
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                  <h3 className="text-xl font-black text-white">
                    Fermeture exceptionnelle
                  </h3>

                  <button
                    onClick={async () => {
                      const newValue = !fermetureActive;
                      setFermetureActive(newValue);
                      await saveFermeture(newValue);
                    }}
                    className={`mt-4 rounded-full px-6 py-3 font-black text-white ${
                      fermetureActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {fermetureActive
                      ? "Désactiver fermeture"
                      : "Activer fermeture"}
                  </button>
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <h3 className="text-2xl font-black text-yellow-300">
                  Produits Supabase
                </h3>

                <select
                  value={selectedAdminCategory}
                  onChange={(e) => setSelectedAdminCategory(e.target.value)}
                  className="mt-4 w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white"
                >
                  <option value="all">Toutes les catégories</option>

                  {categoriesData.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nom}
                    </option>
                  ))}
                </select>

                <button
                  onClick={ajouterProduit}
                  className="mt-4 rounded-full bg-green-500 px-6 py-3 font-black text-white hover:bg-green-400"
                >
                  + Ajouter un produit
                </button>

                <div className="mt-6 space-y-4">
                  {produits
                    .filter((produit) =>
                      selectedAdminCategory === "all"
                        ? true
                        : produit.categorie_id === Number(selectedAdminCategory)
                    )
                    .map((produit) => (
                      <div
                        key={produit.id}
                        className="rounded-2xl border border-yellow-500/20 bg-black p-4"
                      >
                        <label className="text-sm font-bold text-yellow-300">Nom</label>

                        <input
                          type="text"
                          defaultValue={produit.nom || ""}
                          onBlur={(e) => updateProduit(produit.id, "nom", e.target.value)}
                          className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        />

                        <label className="mt-4 block text-sm font-bold text-yellow-300">
                          Description
                        </label>

                        <textarea
                          defaultValue={produit.description || ""}
                          onBlur={(e) =>
                            updateProduit(produit.id, "description", e.target.value)
                          }
                          className="mt-2 min-h-24 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        />

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-bold text-yellow-300">Prix</label>

                            <input
                              type="text"
                              defaultValue={produit.prix || ""}
                              onBlur={(e) =>
                                updateProduit(produit.id, "prix", e.target.value)
                              }
                              className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-bold text-yellow-300">Prix menu</label>

                            <input
                              type="text"
                              defaultValue={produit.prix_menu || ""}
                              onBlur={(e) =>
                                updateProduit(produit.id, "prix_menu", e.target.value)
                              }
                              className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                            />
                          </div>
                        </div>

                        <label className="mt-4 block text-sm font-bold text-yellow-300">
                          Image
                        </label>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadImageProduit(e.target.files[0], produit.id)}
                          className="mt-3 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        />

                        <input
                          type="text"
                          defaultValue={produit.image || ""}
                          onBlur={(e) =>
                            updateProduit(produit.id, "image", e.target.value)
                          }
                          className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        />

                        {produit.image && (
                          <img
                            src={produit.image}
                            alt={produit.nom}
                            className="mt-4 h-40 w-full rounded-2xl object-cover"
                          />
                        )}

                        <label className="mt-4 block text-sm font-bold text-yellow-300">Type</label>

                        <input
                          type="text"
                          defaultValue={produit.type || ""}
                          onBlur={(e) => updateProduit(produit.id, "type", e.target.value)}
                          className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        />

                        <label className="mt-4 block text-sm font-bold text-yellow-300">Ordre</label>

                        <input
                          type="number"
                          defaultValue={produit.ordre || 0}
                          onBlur={(e) =>
                            updateProduit(produit.id, "ordre", Number(e.target.value))
                          }
                          className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        />

                        <label className="mt-4 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={produit.actif ?? true}
                            onChange={(e) =>
                              updateProduit(produit.id, "actif", e.target.checked)
                            }
                            className="h-5 w-5"
                          />

                          <span className="font-bold text-white">Produit actif</span>
                        </label>

                        <label className="mt-3 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={produit.in_stock ?? true}
                            onChange={(e) =>
                              updateProduit(produit.id, "in_stock", e.target.checked)
                            }
                            className="h-5 w-5"
                          />

                          <span className="font-bold text-white">En stock</span>
                        </label>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={() => saveProduit(produit)}
                            className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                          >
                            Enregistrer
                          </button>

                          <button
                            onClick={() => supprimerProduit(produit)}
                            className="rounded-full bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500"
                          >
                            Supprimer le produit
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          {adminTab === "avis" && (
            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-2xl font-black text-yellow-300">
                  Avis clients
                </h3>

                <button
                  onClick={chargerAvisClients}
                  className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                >
                  Actualiser
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-black p-4">
                <h4 className="text-xl font-black text-white">Ajouter un avis</h4>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Nom du client"
                    value={nouvelAvis.nom}
                    onChange={(e) =>
                      setNouvelAvis((current) => ({
                        ...current,
                        nom: e.target.value,
                      }))
                    }
                    className="rounded-xl bg-white/10 px-4 py-3 text-white outline-none"
                  />

                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Note"
                    value={nouvelAvis.note}
                    onChange={(e) =>
                      setNouvelAvis((current) => ({
                        ...current,
                        note: e.target.value,
                      }))
                    }
                    className="rounded-xl bg-white/10 px-4 py-3 text-white outline-none"
                  />
                </div>

                <textarea
                  placeholder="Commentaire"
                  value={nouvelAvis.commentaire}
                  onChange={(e) =>
                    setNouvelAvis((current) => ({
                      ...current,
                      commentaire: e.target.value,
                    }))
                  }
                  className="mt-4 min-h-24 w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none"
                />

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-3 text-white">
                    <input
                      type="checkbox"
                      checked={nouvelAvis.actif}
                      onChange={(e) =>
                        setNouvelAvis((current) => ({
                          ...current,
                          actif: e.target.checked,
                        }))
                      }
                      className="h-5 w-5"
                    />
                    Avis actif
                  </label>

                  <input
                    type="number"
                    placeholder="Ordre"
                    value={nouvelAvis.ordre}
                    onChange={(e) =>
                      setNouvelAvis((current) => ({
                        ...current,
                        ordre: e.target.value,
                      }))
                    }
                    className="w-32 rounded-xl bg-white/10 px-4 py-3 text-white outline-none"
                  />

                  <button
                    onClick={ajouterAvis}
                    className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                  >
                    + Ajouter l’avis
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {avisClients.length === 0 ? (
                  <p className="text-stone-400">Aucun avis client trouvé.</p>
                ) : (
                  avisClients.map((avis) => (
                    <div
                      key={avis.id}
                      className="rounded-2xl border border-yellow-500/20 bg-black p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-bold text-yellow-300">
                            Nom
                          </label>

                          <input
                            type="text"
                            defaultValue={avis.nom || ""}
                            onBlur={(e) =>
                              modifierAvis(avis.id, "nom", e.target.value)
                            }
                            className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-bold text-yellow-300">
                            Note
                          </label>

                          <input
                            type="number"
                            min="1"
                            max="5"
                            defaultValue={avis.note || 5}
                            onBlur={(e) =>
                              modifierAvis(avis.id, "note", e.target.value)
                            }
                            className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                          />
                        </div>
                      </div>

                      <label className="mt-4 block text-sm font-bold text-yellow-300">
                        Commentaire
                      </label>

                      <textarea
                        defaultValue={avis.commentaire || ""}
                        onBlur={(e) =>
                          modifierAvis(avis.id, "commentaire", e.target.value)
                        }
                        className="mt-2 min-h-24 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                      />

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="flex items-center gap-3 text-white">
                          <input
                            type="checkbox"
                            checked={avis.actif ?? true}
                            onChange={(e) =>
                              modifierAvis(avis.id, "actif", e.target.checked)
                            }
                            className="h-5 w-5"
                          />

                          Avis actif sur le site
                        </label>

                        <div>
                          <label className="text-sm font-bold text-yellow-300">
                            Ordre
                          </label>

                          <input
                            type="number"
                            defaultValue={avis.ordre || 999}
                            onBlur={(e) =>
                              modifierAvis(avis.id, "ordre", e.target.value)
                            }
                            className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => supprimerAvis(avis)}
                        className="mt-4 rounded-full bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500"
                      >
                        Supprimer l’avis
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminTab === "comptes" && (
            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-yellow-300">
                    Gestion des comptes
                  </h3>
                  <p className="mt-1 text-sm text-stone-400">
                    Les clients créent leur compte depuis Connexion. Ici, tu peux changer leur rôle.
                  </p>
                </div>

                <button
                  onClick={chargerProfiles}
                  className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                >
                  Actualiser
                </button>
              </div>

              {messageProfiles && (
                <p className="mt-4 rounded-2xl bg-black px-4 py-3 text-center font-bold text-white">
                  {messageProfiles}
                </p>
              )}

              <div className="mt-6 space-y-4">
                {profiles.length === 0 ? (
                  <p className="text-stone-400">Aucun compte trouvé.</p>
                ) : (
                  profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="rounded-2xl border border-yellow-500/20 bg-black p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-lg font-black text-white">
                            {profile.email || "Email non renseigné"}
                          </p>

                          <p className="mt-1 text-sm text-stone-400">
                            Téléphone : {profile.phone || "Non renseigné"}
                          </p>

                          <p className="mt-2 text-sm font-bold text-yellow-300">
                            Rôle actuel : {profile.role || "client"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => changerRole(profile.id, "client")}
                            className={`rounded-full px-4 py-2 font-black ${
                              profile.role === "client"
                                ? "bg-yellow-400 text-black"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            Client
                          </button>

                          <button
                            onClick={() => changerRole(profile.id, "employe")}
                            className={`rounded-full px-4 py-2 font-black ${
                              profile.role === "employe"
                                ? "bg-blue-500 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            Employé
                          </button>

                          <button
                            onClick={() => changerRole(profile.id, "admin")}
                            className={`rounded-full px-4 py-2 font-black ${
                              profile.role === "admin"
                                ? "bg-red-600 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminTab === "employes" && (
            <>
              <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-2xl font-black text-yellow-300">
                    Liste des employés
                  </h3>

                  <button
                    onClick={() => {
                      chargerEmployes();
                      chargerPointages();
                    }}
                    className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                  >
                    Actualiser
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {listeEmployes.length === 0 ? (
                    <p className="text-stone-400">Aucun employé trouvé.</p>
                  ) : (
                    listeEmployes.map((employe) => {
                      const dernierPointage = historiquePointages.find(
                        (pointage) => pointage.employe_id === employe.id
                      );

                      const enService = dernierPointage && !dernierPointage.depart;

                      const totalMinutesEmploye = historiquePointages
                        .filter(
                          (pointage) =>
                            pointage.employe_id === employe.id &&
                            pointage.arrivee &&
                            pointage.depart
                        )
                        .reduce((total, pointage) => {
                          const arrivee = new Date(pointage.arrivee);
                          const depart = new Date(pointage.depart);

                          return total + Math.floor((depart - arrivee) / 60000);
                        }, 0);

                      return (
                        <div
                          key={employe.id}
                          className="rounded-2xl border border-yellow-500/20 bg-black p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xl font-black text-white">{employe.nom}</p>

                              <p className="mt-1 text-sm text-stone-400">
                                Poste : {employe.poste || "Non renseigné"}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-2 text-xs font-black ${
                                enService
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {enService ? "En service" : "Hors service"}
                            </span>
                          </div>

                          <div className="mt-4 space-y-1 text-sm text-stone-300">
                            <p>
                              Dernière arrivée :{" "}
                              <span className="font-bold text-white">
                                {formatDateHeure(dernierPointage?.arrivee)}
                              </span>
                            </p>

                            <p>
                              Dernier départ :{" "}
                              <span className="font-bold text-white">
                                {formatDateHeure(dernierPointage?.depart)}
                              </span>
                            </p>

                            <p>
                              Total travaillé :{" "}
                              <span className="font-bold text-yellow-300">
                                {formatTotalHeures(totalMinutesEmploye)}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-2xl font-black text-yellow-300">
                    Demandes de modification
                  </h3>

                  <button
                    onClick={() => {
                      chargerEmployes();
                      chargerPointages();
                      chargerDemandesPointage();
                    }}
                    className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                  >
                    Actualiser
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {demandesEnAttente.length === 0 ? (
                    <p className="text-stone-400">Aucune demande en attente.</p>
                  ) : (
                    demandesEnAttente.map((demande) => {
                      const employe = getEmploye(demande.employe_id);

                      return (
                        <div
                          key={demande.id}
                          className="rounded-2xl border border-yellow-500/20 bg-black p-4"
                        >
                          <p className="text-xl font-black text-white">
                            {employe?.nom || "Employé inconnu"}
                          </p>

                          <p className="mt-2 text-stone-300">
                            Motif : {demande.motif}
                          </p>

                          <textarea
                            value={reponsesDemandes[demande.id] || ""}
                            onChange={(e) =>
                              setReponsesDemandes((current) => ({
                                ...current,
                                [demande.id]: e.target.value,
                              }))
                            }
                            className="mt-4 min-h-24 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                            placeholder="Réponse admin..."
                          />

                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              onClick={() => traiterDemandePointage(demande, "acceptee")}
                              className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                            >
                              Accepter et modifier
                            </button>

                            <button
                              onClick={() => traiterDemandePointage(demande, "refusee")}
                              className="rounded-full bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500"
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {demandesTraitees.length > 0 && (
                  <div className="mt-10">
                    <h4 className="text-xl font-black text-white">
                      Demandes traitées
                    </h4>

                    <div className="mt-4 space-y-3">
                      {demandesTraitees.slice(0, 10).map((demande) => {
                        const employe = getEmploye(demande.employe_id);

                        return (
                          <div
                            key={demande.id}
                            className="rounded-2xl bg-black p-4 text-sm text-stone-300"
                          >
                            <p>
                              <span className="font-black text-white">
                                {employe?.nom || "Employé inconnu"}
                              </span>{" "}
                              — {demande.statut === "acceptee" ? "Acceptée" : "Refusée"}
                            </p>

                            {demande.reponse_admin && (
                              <p className="mt-2">Réponse : {demande.reponse_admin}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="text-2xl font-black text-yellow-300">
                    Employés / Pointages
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        chargerEmployes();
                        chargerPointages();
                      }}
                      className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                    >
                      Actualiser
                    </button>

                    <button
                      onClick={exporterPointagesExcel}
                      className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                    >
                      Exporter Excel
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <select
                    value={filtreEmploye}
                    onChange={(e) => setFiltreEmploye(e.target.value)}
                    className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none"
                  >
                    <option value="all">Tous les employés</option>

                    {listeEmployes.map((employe) => (
                      <option key={employe.id} value={employe.id}>
                        {employe.nom}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={rechercheEmploye}
                    onChange={(e) => setRechercheEmploye(e.target.value)}
                    className="w-full rounded-2xl border border-yellow-500/20 bg-black px-5 py-4 text-white outline-none"
                  />
                </div>

                <div className="mt-6 space-y-5">
                  {pointagesFiltres.length === 0 ? (
                    <p className="text-stone-400">Aucun pointage trouvé.</p>
                  ) : (
                    pointagesFiltres.map((pointage) => {
                      const employe = getEmploye(pointage.employe_id);

                      return (
                        <div
                          key={pointage.id}
                          className="rounded-2xl border border-yellow-500/20 bg-black p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xl font-black text-white">
                                {employe?.nom || "Employé inconnu"}
                              </p>

                              <p className="mt-1 text-sm text-stone-400">
                                Poste : {employe?.poste || "Non renseigné"}
                              </p>

                              <p className="mt-2 font-bold text-yellow-300">
                                Temps travaillé :{" "}
                                {calculateWorkedTime(pointage.arrivee, pointage.depart)}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-4 py-2 text-sm font-black ${
                                pointage.depart
                                  ? "bg-red-500 text-white"
                                  : "bg-green-500 text-white"
                              }`}
                            >
                              {pointage.depart ? "Hors service" : "En service"}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="text-sm font-bold text-yellow-300">
                                Arrivée
                              </label>

                              <input
                                type="datetime-local"
                                defaultValue={formatInputDate(pointage.arrivee)}
                                onBlur={(e) =>
                                  modifierPointage(pointage.id, "arrivee", e.target.value)
                                }
                                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-bold text-yellow-300">
                                Départ
                              </label>

                              <input
                                type="datetime-local"
                                defaultValue={formatInputDate(pointage.depart)}
                                onBlur={(e) =>
                                  modifierPointage(pointage.id, "depart", e.target.value)
                                }
                                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            {!pointage.depart && (
                              <button
                                onClick={() => forcerDepart(pointage.id)}
                                className="rounded-full bg-green-600 px-5 py-3 font-black text-white"
                              >
                                Forcer départ maintenant
                              </button>
                            )}

                            <button
                              onClick={() => supprimerPointage(pointage.id)}
                              className="rounded-full bg-red-600 px-5 py-3 font-black text-white"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
