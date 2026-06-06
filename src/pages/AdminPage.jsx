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
  const [showPointageForce, setShowPointageForce] = useState(false);
  const [employeSelectionne, setEmployeSelectionne] = useState("");
  const [datePointage, setDatePointage] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [messagePointageForce, setMessagePointageForce] = useState("");
  const [planningEmployes, setPlanningEmployes] = useState([]);
  const [messagePlanning, setMessagePlanning] = useState("");
  const [employePlanningOuvert, setEmployePlanningOuvert] = useState(null);
  const [statsCommandes, setStatsCommandes] = useState({
    caJour: 0,
    nbCommandesJour: 0,
    panierMoyen: 0,
    produitTop: "Aucun",
    quantiteTop: 0,
    heureRush: "Aucune",
    nbCommandesRush: 0,
    rushBase: "",
  });
  const [commandesStats, setCommandesStats] = useState([]);
  const [anneesStatsOuvertes, setAnneesStatsOuvertes] = useState({});
  const [moisStatsOuverts, setMoisStatsOuverts] = useState({});

  // ÉTATS COMPLETS POUR LA FENÊTRE MODALE DE MODIFICATION ADMIN
  const [showModifModal, setShowModifModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editPrenom, setEditPrenom] = useState("");
  const [editNom, setEditNom] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [loadingModif, setLoadingModif] = useState(false);

  const formatMontant = (montant) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Number(montant || 0));

  const joursPlanning = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  const chargerPlanning = async () => {
    const { data, error } = await supabase
      .from("planning_employes")
      .select("*");

    if (error) {
      console.error(error);
      setMessagePlanning("Erreur chargement planning.");
      return;
    }

    setPlanningEmployes(data || []);
  };

  const getPlanningJour = (employeId, jour) => {
    return planningEmployes.find(
      (p) => p.employe_id === employeId && p.jour_semaine === jour
    );
  };

  const updatePlanningLocal = (employeId, jour, field, value) => {
    setPlanningEmployes((current) => {
      const existing = current.find(
        (p) => p.employe_id === employeId && p.jour_semaine === jour
      );

      if (existing) {
        return current.map((p) =>
          p.employe_id === employeId && p.jour_semaine === jour
            ? { ...p, [field]: value }
            : p
        );
      }

      return [
        ...current,
        {
          employe_id: employeId,
          jour_semaine: jour,
          debut_matin: "",
          fin_matin: "",
          debut_soir: "",
          fin_soir: "",
          [field]: value,
        },
      ];
    });
  };

  const copierJourSurSemaine = (employeId, jourSource) => {
    const planningSource = getPlanningJour(employeId, jourSource);

    if (!planningSource) {
      alert("Aucun horaire à copier pour ce jour ❌");
      return;
    }

    joursPlanning.forEach((jour) => {
      updatePlanningLocal(employeId, jour, "debut_matin", planningSource.debut_matin || "");
      updatePlanningLocal(employeId, jour, "fin_matin", planningSource.fin_matin || "");
      updatePlanningLocal(employeId, jour, "debut_soir", planningSource.debut_soir || "");
      updatePlanningLocal(employeId, jour, "fin_soir", planningSource.fin_soir || "");
    });
  };

  const sauvegarderPlanning = async () => {
    setMessagePlanning("");

    const lignes = planningEmployes.map((p) => ({
      employe_id: p.employe_id,
      jour_semaine: p.jour_semaine,
      debut_matin: p.debut_matin || null,
      fin_matin: p.fin_matin || null,
      debut_soir: p.debut_soir || null,
      fin_soir: p.fin_soir || null,
    }));

    const { error } = await supabase
      .from("planning_employes")
      .upsert(lignes, {
        onConflict: "employe_id,jour_semaine",
      });

    if (error) {
      console.error(error);
      setMessagePlanning("Erreur lors de l’enregistrement.");
      return;
    }

    setMessagePlanning("Planning enregistré avec succès ✅");
    chargerPlanning();
  };

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

    if (role === "employe") {
      const profile = profiles.find((p) => p.id === id);

      await supabase.from("employes").upsert({
        auth_user_id: id,
        nom:
          `${profile?.prenom || ""} ${profile?.nom_famille || ""}`.trim() ||
          profile?.nom ||
          "Employé",
        email: profile?.email || "",
        actif: true,
      });
    }

    if (role !== "employe") {
      await supabase
        .from("employes")
        .delete()
        .eq("auth_user_id", id);
    }

    if (error) {
      console.error(error);
      setMessageProfiles(`Erreur modification rôle : ${error.message} ❌`);
      return;
    }

    setMessageProfiles("Rôle modifié avec succès ✅");
    chargerProfiles();
  };

  // FONCTIONS DE LA MODALE DE MODIFICATION ADMIN
  const ouvrirModifModal = (profile) => {
    setSelectedProfile(profile);
    setEditPrenom(profile.prenom || "");
    setEditNom(profile.nom_famille || "");
    setEditPhone(profile.phone || "");
    setEditEmail(profile.email || "");
    setEditPassword(""); 
    setShowModifModal(true);
  };

  const sauvegarderCompteAdmin = async () => {
    if (!selectedProfile) return;
    setLoadingModif(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          prenom: editPrenom.trim(),
          nom_famille: editNom.trim(),
          nom: `${editPrenom.trim()} ${editNom.trim()}`,
          phone: editPhone.trim(),
          email: editEmail.trim(),
        })
        .eq("id", selectedProfile.id);

      if (profileError) throw profileError;

      if (editPassword.trim() !== "") {
        if (editPassword.trim().length < 6) {
          alert("Le mot de passe doit contenir au moins 6 caractères.");
          setLoadingModif(false);
          return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(editEmail.trim(), {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (resetError) throw resetError;
        alert("Profil enregistré ! Un e-mail de réinitialisation de mot de passe a été envoyé à l'utilisateur.");
      } else {
        alert("Le compte a été mis à jour avec succès ! 🎉");
      }

      setShowModifModal(false);
      chargerProfiles();
    } catch (error) {
      console.error(error);
      alert(`Erreur lors de la modification : ${error.message}`);
    } finally {
      setLoadingModif(false);
    }
  };

  const [adminTab, setAdminTab] = useState(() => {
    return localStorage.getItem("adminTab") || "produits";
  });

  useEffect(() => {
    localStorage.setItem("adminTab", adminTab);
  }, [adminTab]);

  const [annonceAccueil, setAnnonceAccueil] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [listeEmployes, setListeEmployes] = useState([]);
  const [historiquePointages, setHistoriquePointages] = useState([]);
  const [demandesPointage, setDemandesPointage] = useState([]);
  const [reponsesDemandes, setReponsesDemandes] = useState({});
  const [filtreEmploye, setFiltreEmploye] = useState("all");
  const [rechercheEmploye, setRechercheEmploye] = useState("");
  const [moisExportAdmin, setMoisExportAdmin] = useState(
    new Date().toISOString().slice(0, 7)
  );

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

  const calculerStatsCommandes = async () => {
    const aujourdHui = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("commandes")
      .select("total, created_at, contenu")
      .gte("created_at", `${aujourdHui}T00:00:00`)
      .lt("created_at", `${aujourdHui}T23:59:59`);

    if (error) {
      console.error(error);
      return;
    }

    const caJour = (data || []).reduce(
      (total, commande) => total + Number(commande.total || 0),
      0
    );

    const nbCommandesJour = data?.length || 0;
    
    const compteurProduits = {};
    const compteurHeures = {};
    
    (data || []).forEach((commande) => {
      const heure = new Date(commande.created_at).getHours();

      compteurHeures[heure] =
        (compteurHeures[heure] || 0) + 1;
      (commande.contenu || []).forEach((produit) => {
        const nom = produit.nom || "Produit inconnu";

        compteurProduits[nom] =
          (compteurProduits[nom] || 0) +
          Number(produit.quantite || 0);
      });
    });

    let produitTop = "Aucun";
    let quantiteTop = 0;
   
    Object.entries(compteurProduits).forEach(([nom, quantite]) => {
      if (quantite > quantiteTop) {
        produitTop = nom;
        quantiteTop = quantite;
      }
    });

    const maintenant = new Date();
    const debutAujourdhui = new Date(maintenant);
    debutAujourdhui.setHours(0, 0, 0, 0);

    const debutHistorique = new Date(debutAujourdhui);
    debutHistorique.setDate(debutHistorique.getDate() - 56);

    const jourSemaineActuel = maintenant.getDay();

    const nomsJours = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];

    const { data: commandesHistoriqueRush, error: rushError } = await supabase
      .from("commandes")
      .select("created_at")
      .gte("created_at", debutHistorique.toISOString())
      .lt("created_at", debutAujourdhui.toISOString());

    if (rushError) {
      console.error(rushError);
    }

    const compteurHeuresRush = {};
    const joursAnalyses = new Set();

    (commandesHistoriqueRush || []).forEach((commande) => {
      const dateCommande = new Date(commande.created_at);

      if (dateCommande.getDay() !== jourSemaineActuel) return;

      const jourKey = dateCommande.toISOString().slice(0, 10);
      joursAnalyses.add(jourKey);

      const heure = dateCommande.getHours();

      compteurHeuresRush[heure] =
        (compteurHeuresRush[heure] || 0) + 1;
    });

    let heureRush = "Aucune";
    let nbCommandesRush = 0;

    const nbJoursAnalyses = joursAnalyses.size || 1;

    Object.entries(compteurHeuresRush).forEach(([heure, total]) => {
      const moyenne = total / nbJoursAnalyses;

      if (moyenne > nbCommandesRush) {
        heureRush = `${heure}h`;
        nbCommandesRush = moyenne;
      }
    });

    const rushBase =
      joursAnalyses.size > 0
        ? `Basé sur ${joursAnalyses.size} ancien(s) ${nomsJours[jourSemaineActuel]}`
        : "Pas encore assez d’historique";

    setStatsCommandes({
      caJour,
      nbCommandesJour,
      panierMoyen: nbCommandesJour > 0 ? caJour / nbCommandesJour : 0,
      produitTop,
      quantiteTop,
      heureRush,
      nbCommandesRush: Number(nbCommandesRush.toFixed(1)),
      rushBase,
    });
    const { data: toutesCommandes, error: toutesCommandesError } = await supabase
      .from("commandes")
      .select("numero_commande, total, statut, created_at")
      .order("created_at", { ascending: false });

    if (toutesCommandesError) {
      console.error(toutesCommandesError);
    } else {
      setCommandesStats(toutesCommandes || []);
    }
  };

  const supprimerAnciennesDemandesPointage = async () => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);

    const { error } = await supabase
      .from("demandes_modification_pointage")
      .delete()
      .lt("created_at", limite.toISOString());

    if (error) {
      console.error("Erreur suppression anciennes demandes :", error);
      return;
    }

    chargerDemandesPointage();
  };

  useEffect(() => {
    if (isLogged) {
      chargerEmployes();
      chargerPointages();
      chargerDemandesPointage();
      chargerAvisClients();
      calculerStatsCommandes();
      chargerProfiles();
      chargerPlanning();
      supprimerAnciennesDemandesPointage();
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
      console.log("DEMANDE ACCEPTÉE :", demande);

      const { error: updatePointageError } = await supabase
        .from("pointages")
        .update({
          arrivee: demande.arrivee_demandee,
          depart: demande.depart_demandee,
          origine: "modifie_admin",
          commentaire_admin: "Pointage modifié par l’admin",
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

  const exporterCommandesJourExcel = (jour, commandesJour) => {
    const lignes = commandesJour.map((commande) => ({
      "Numéro commande": commande.numero_commande || commande.id,
      Date: new Date(commande.created_at).toLocaleString("fr-FR"),
      Total: Number(commande.total || 0),
      Statut: commande.statut || "",
    }));

    const totalJour = commandesJour.reduce(
      (total, commande) => total + Number(commande.total || 0),
      0
    );

    lignes.push({});
    lignes.push({
      "Numéro commande": "TOTAL JOUR",
      Total: totalJour,
    });

    const feuille = XLSX.utils.json_to_sheet(lignes);
    const classeur = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(classeur, feuille, "Commandes");
    XLSX.writeFile(classeur, `commandes-${jour.replaceAll("/", "-")}.xlsx`);
  };

  const exporterPointagesExcel = () => {
    const pointagesAExporter = historiquePointages.filter((pointage) => {
      if (!pointage.arrivee) return false;
      return pointage.arrivee.slice(0, 7) === moisExportAdmin;
    });
    const totalMinutes = pointagesAExporter.reduce((total, pointage) => {
      if (!pointage.arrivee || !pointage.depart) return total;

      const arrivee = new Date(pointage.arrivee);
      const depart = new Date(pointage.depart);
      const diffMinutes = Math.max(0, Math.floor((depart - arrivee) / 60000));

      return total + diffMinutes;
    }, 0);

    const lignes = pointagesAExporter.map((pointage) => {
      const employe = getEmploye(pointage.employe_id);

      return {
        Employé: employe?.nom || "Employé inconnu",
        Poste: employe?.poste || "",
        Arrivée: formatDateHeure(pointage.arrivee),
        Départ: formatDateHeure(pointage.depart),
        "Temps travaillé": calculateWorkedTime(pointage.arrivee, pointage.depart),
        Statut: pointage.depart ? "Hors service" : "En service",
        Commentaire:
          pointage.commentaire_admin ||
          (pointage.origine === "modifie_admin"
            ? "Pointage modifié par l’admin"
            : pointage.origine === "ajoute_admin"
            ? "Pointage ajouté par l’admin suite oubli salarié"
            : ""),
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

  const ajouterPointageForce = async () => {
    if (
      !employeSelectionne ||
      !datePointage ||
      !heureDebut ||
      !heureFin
    ) {
      setMessagePointageForce("Veuillez remplir tous les champs.");
      return;
    }

    const debut = `${datePointage}T${heureDebut}:00`;
    const fin = `${datePointage}T${heureFin}:00`;

    const { error } = await supabase.from("pointages").insert([
      {
        employe_id: employeSelectionne,
        arrivee: debut,
        depart: fin,
        force_admin: true,
        origine: "ajoute_admin",
        commentaire_admin: "Pointage ajouté par l’admin suite oubli salarié",
      }
    ]);

    if (error) {
      console.error(error);
      setMessagePointageForce("Erreur lors du pointage.");
      return;
    }

    setMessagePointageForce("Pointage ajouté avec succès.");

    setEmployeSelectionne("");
    setDatePointage("");
    setHeureDebut("");
    setHeureFin("");

    chargerPointages();
  };

  const demandesEnAttente = demandesPointage.filter(
    (demande) => demande.statut === "en_attente"
  );

  const demandesTraitees = demandesPointage.filter(
    (demande) => demande.statut !== "en_attente"
  );

  const commandesStatsGroupees = commandesStats.reduce((acc, commande) => {
    const date = new Date(commande.created_at);
    const annee = String(date.getFullYear());
    const mois = date.toLocaleDateString("fr-FR", { month: "long" });
    const jour = date.toLocaleDateString("fr-FR");

    if (!acc[annee]) acc[annee] = {};
    if (!acc[annee][mois]) acc[annee][mois] = {};
    if (!acc[annee][mois][jour]) acc[annee][mois][jour] = [];

    acc[annee][mois][jour].push(commande);
    return acc;
  }, {});

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

  const supprimerCompte = async (userId) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer définitivement ce compte ?"
    );

    if (!confirmation) return;

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session?.access_token) {
      alert("Erreur : session admin introuvable.");
      return;
    }

    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: userId },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    });

    if (error) {
      console.error("Erreur suppression compte :", error);
      alert("Erreur suppression : " + error.message);
      setMessageProfiles("Erreur lors de la suppression du compte.");
      return;
    }

    if (data?.success === false) {
      alert("Erreur suppression : " + data.error);
      setMessageProfiles(data.error);
      return;
    }

    setMessageProfiles("Compte supprimé avec succès.");
    await chargerProfiles();
  };

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
                adminTab === "produits" ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Produits
            </button>

            <button
              onClick={() => setAdminTab("avis")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "avis" ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Avis clients
            </button>

            <button
              onClick={() => setAdminTab("employes")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "employes" ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Employés
            </button>

            <button
              onClick={() => setAdminTab("stats")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "stats" ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Statistiques
            </button>

            <button
              onClick={() => setAdminTab("planning")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "planning" ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Planning équipe
            </button>

            <button
              onClick={() => setAdminTab("comptes")}
              className={`rounded-full px-6 py-3 font-black ${
                adminTab === "comptes" ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
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

          {adminTab === "stats" && (
            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
              <h3 className="text-2xl font-black text-yellow-300">
                Statistiques du jour
              </h3>

              <div className="mt-6 grid gap-4 md:grid-cols-5">
                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-stone-400">
                    Chiffre d’affaires
                  </p>

                  <p className="mt-2 text-3xl font-black text-yellow-300">
                    {formatMontant(statsCommandes.caJour)}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-stone-400">
                    Commandes
                  </p>

                  <p className="mt-2 text-3xl font-black text-white">
                    {statsCommandes.nbCommandesJour}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-stone-400">
                    Panier moyen
                  </p>

                  <p className="mt-2 text-3xl font-black text-green-400">
                    {formatMontant(statsCommandes.panierMoyen)}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-stone-400">Produit le plus vendu</p>

                  <p className="mt-2 text-xl font-black text-orange-400">
                    {statsCommandes.produitTop}
                  </p>

                  <p className="mt-2 text-sm font-bold text-white">
                    {statsCommandes.quantiteTop} vendu(s)
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5">
                  <p className="text-sm text-stone-400">Rush prévisionnel</p>

                  <p className="mt-2 text-xl font-black text-red-400">
                    {statsCommandes.heureRush}
                  </p>

                  <p className="mt-2 text-sm font-bold text-white">
                    {statsCommandes.nbCommandesRush} commande(s) en moyenne
                  </p>

                  <p className="mt-1 text-xs text-stone-400">
                    {statsCommandes.rushBase}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-black text-yellow-300">
                  Export par jour
                </h3>

                {Object.entries(commandesStatsGroupees).map(([annee, moisData]) => (
                  <div key={annee} className="rounded-2xl bg-black p-4">
                    <button
                      onClick={() =>
                        setAnneesStatsOuvertes((current) => ({
                          ...current,
                          [annee]: !current[annee],
                        }))
                      }
                      className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                    >
                      {anneesStatsOuvertes[annee] ? "▼" : "▶"} {annee}
                    </button>

                    {anneesStatsOuvertes[annee] && (
                      <div className="mt-4 ml-4 space-y-3">
                        {Object.entries(moisData).map(([mois, joursData]) => {
                          const cleMois = `${annee}-${mois}`;

                          return (
                            <div key={cleMois}>
                              <button
                                onClick={() =>
                                  setMoisStatsOuverts((current) => ({
                                    ...current,
                                    [cleMois]: !current[cleMois],
                                  }))
                                }
                                className="rounded-full bg-orange-500 px-5 py-2 font-black text-white"
                              >
                                {moisStatsOuverts[cleMois] ? "▼" : "▶"} {mois}
                              </button>

                              {moisStatsOuverts[cleMois] && (
                                <div className="mt-3 ml-4 space-y-2">
                                  {Object.entries(joursData).map(([jour, commandesJour]) => (
                                    <div
                                      key={jour}
                                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3"
                                    >
                                      <span className="font-black text-white">
                                        {jour} — {commandesJour.length} commande(s)
                                      </span>

                                      <button
                                        onClick={() =>
                                          exporterCommandesJourExcel(jour, commandesJour)
                                        }
                                        className="rounded-full bg-green-600 px-4 py-2 font-black text-white hover:bg-green-500"
                                      >
                                        Exporter ce jour
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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

          {adminTab === "planning" && (
            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-yellow-300">
                    Planning équipe
                  </h3>

                  <p className="mt-2 text-sm text-stone-400">
                    Définis les horaires autorisés pour le pointage des employés.
                  </p>
                </div>

                <button
                  onClick={sauvegarderPlanning}
                  className="rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
                >
                  Enregistrer le planning
                </button>
              </div>

              {messagePlanning && (
                <p className="mt-4 font-bold text-yellow-300">{messagePlanning}</p>
              )}

              <div className="mt-6 space-y-8">
                {profiles
                  .filter((profile) => profile.role === "employe")
                  .map((employe) => (
                    <div
                      key={employe.id}
                      className="rounded-3xl border border-yellow-500/20 bg-black p-5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setEmployePlanningOuvert((current) =>
                            current === employe.id ? null : employe.id
                          )
                        }
                        className="flex w-full items-center justify-between text-left"
                      >
                        <h4 className="text-xl font-black text-white">
                          {employe.nom || employe.email}
                        </h4>

                        <span className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                          {employePlanningOuvert === employe.id ? "Fermer" : "Ouvrir"}
                        </span>
                      </button>
                        
                      {employePlanningOuvert === employe.id && (
                        <div className="mt-5 overflow-x-auto">
                          <table className="w-full min-w-[800px] text-left text-sm">
                            <thead>
                              <tr className="text-yellow-300">
                                <th className="p-3">Jour</th>
                                <th className="p-3">Début matinée</th>
                                <th className="p-3">Fin matinée</th>
                                <th className="p-3">Début soirée</th>
                                <th className="p-3">Fin soirée</th>
                                <th className="p-3">Action</th>
                              </tr>
                            </thead>

                            <tbody>
                              {joursPlanning.map((jour) => {
                                const planning = getPlanningJour(employe.id, jour);

                                return (
                                  <tr
                                    key={jour}
                                    className="border-t border-yellow-500/10"
                                  >
                                    <td className="p-3 font-bold text-white">{jour}</td>

                                    <td className="p-3">
                                      <input
                                        type="time"
                                        value={planning?.debut_matin || ""}
                                        onChange={(e) =>
                                          updatePlanningLocal(
                                            employe.id,
                                            jour,
                                            "debut_matin",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-white"
                                      />
                                    </td>

                                    <td className="p-3">
                                      <input
                                        type="time"
                                        value={planning?.fin_matin || ""}
                                        onChange={(e) =>
                                          updatePlanningLocal(
                                            employe.id,
                                            jour,
                                            "fin_matin",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-white"
                                      />
                                    </td>

                                    <td className="p-3">
                                      <input
                                        type="time"
                                        value={planning?.debut_soir || ""}
                                        onChange={(e) =>
                                          updatePlanningLocal(
                                            employe.id,
                                            jour,
                                            "debut_soir",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-white"
                                      />
                                    </td>

                                    <td className="p-3">
                                      <input
                                        type="time"
                                        value={planning?.fin_soir || ""}
                                        onChange={(e) =>
                                          updatePlanningLocal(
                                            employe.id,
                                            jour,
                                            "fin_soir",
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-xl bg-white/10 px-3 py-2 text-white"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <button
                                        type="button"
                                        onClick={() => copierJourSurSemaine(employe.id, jour)}
                                        className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black hover:bg-yellow-300"
                                      >
                                        Copier semaine
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
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
                            {profile.prenom || profile.nom_famille 
                              ? `${profile.prenom || ""} ${profile.nom_famille || ""}`.trim() 
                              : profile.nom || "Identité non renseignée"}
                          </p>

                          <p className="mt-1 text-sm text-stone-400">
                            Email : {profile.email || "Email non renseigné"}
                          </p>

                          <p className="text-sm text-stone-400">
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

                          <button
                            type="button"
                            onClick={() => ouvrirModifModal(profile)}
                            className="rounded-full bg-orange-500 px-4 py-2 font-black text-white hover:bg-orange-400"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              supprimerCompte(profile.id);
                            }}
                            className="rounded-full bg-red-700 px-4 py-2 font-black text-white hover:bg-red-600"
                          >
                            Supprimer
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
                      const moisActuel = new Date().toISOString().slice(0, 7);

                      const totalMinutesEmploye = historiquePointages
                        .filter(
                          (pointage) =>
                            pointage.employe_id === employe.id &&
                            pointage.arrivee &&
                            pointage.depart &&
                            pointage.arrivee.slice(0, 7) === moisActuel
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
                          <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-white/5 p-4 text-sm text-stone-300">
                            <p className="font-black text-yellow-300">Pointage actuel</p>
                            <p>Arrivée : {formatDateHeure(demande.arrivee_actuelle)}</p>
                            <p>Départ : {formatDateHeure(demande.depart_actuel)}</p>

                            <p className="mt-3 font-black text-green-400">Modification demandée</p>
                            <p>Nouvelle arrivée : {formatDateHeure(demande.arrivee_demandee)}</p>
                            <p>Nouveau départ : {formatDateHeure(demande.depart_demandee)}</p>
                          </div>

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
                      type="button"
                      onClick={() => {
                        chargerEmployes();
                        chargerPointages();
                      }}
                      className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black"
                    >
                      Actualiser
                    </button>

                    <div className="flex flex-wrap gap-3">
                      <select
                        value={moisExportAdmin.split("-")[1]}
                        onChange={(e) => {
                          const annee = moisExportAdmin.split("-")[0];
                          setMoisExportAdmin(`${annee}-${e.target.value}`);
                        }}
                        className="rounded-full bg-black px-5 py-3 font-bold text-white border border-yellow-500/30"
                      >
                        <option value="01">Janvier</option>
                        <option value="02">Février</option>
                        <option value="03">Mars</option>
                        <option value="04">Avril</option>
                        <option value="05">Mai</option>
                        <option value="06">Juin</option>
                        <option value="07">Juillet</option>
                        <option value="08">Août</option>
                        <option value="09">Septembre</option>
                        <option value="10">Octobre</option>
                        <option value="11">Novembre</option>
                        <option value="12">Décembre</option>
                      </select>

                      <select
                        value={moisExportAdmin.split("-")[0]}
                        onChange={(e) => {
                          const mois = moisExportAdmin.split("-")[1];
                          setMoisExportAdmin(`${e.target.value}-${mois}`);
                        }}
                        className="rounded-full bg-black px-5 py-3 font-bold text-white border border-yellow-500/30"
                      >
                        {[2026, 2027, 2028, 2029, 2030].map((annee) => (
                          <option key={annee} value={annee}>
                            {annee}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => exporterPointagesExcel()}
                      className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                    >
                      Exporter Excel
                    </button>

                    <button
                      onClick={() => setShowPointageForce(true)}
                      className="rounded-full bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                    >
                      Ajouter
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

      {showPointageForce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 p-6 text-white shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold text-yellow-400">Pointage forcé</h2>
            <div className="space-y-4">
              <select
                value={employeSelectionne}
                onChange={(e) => setEmployeSelectionne(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 p-3"
              >
                <option value="">Choisir un employé</option>
                {(listeEmployes || []).map((employe) => (
                  <option key={employe.id} value={employe.id}>
                    {employe.nom}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={datePointage}
                onChange={(e) => setDatePointage(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <input
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <input
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              {messagePointageForce && (
                <p className="text-sm text-yellow-400">
                  {messagePointageForce}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={ajouterPointageForce}
                  className="flex-1 rounded-xl bg-green-600 py-3 font-bold hover:bg-green-700"
                >
                  Valider
                </button>

                <button
                  onClick={() => setShowPointageForce(false)}
                  className="flex-1 rounded-xl bg-red-600 py-3 font-bold hover:bg-red-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}  

      {/* MODALE ADMIN MODIFICATION COMPTE SANS AUCUNE PERTE DE CODE */}
      {showModifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-yellow-500/20 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-black text-yellow-300">Modifier le Compte</h3>
            <p className="mt-1 text-sm text-stone-400">Édition complète des informations de l'utilisateur.</p>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Prénom</label>
                  <input 
                    type="text" 
                    value={editPrenom} 
                    onChange={(e) => setEditPrenom(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-zinc-900 border border-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Nom</label>
                  <input 
                    type="text" 
                    value={editNom} 
                    onChange={(e) => setEditNom(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-zinc-900 border border-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Numéro de Téléphone</label>
                <input 
                  type="tel" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-zinc-900 border border-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Adresse Email</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl bg-zinc-900 border border-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Réinitialiser Mot de passe</label>
                <input 
                  type="password" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Saisir un mdp pour forcer le renouvellement"
                  className="mt-1 w-full rounded-2xl bg-zinc-900 border border-white/5 px-4 py-3 text-white outline-none focus:border-yellow-400 text-sm"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModifModal(false)}
                className="flex-1 rounded-full bg-white/10 px-5 py-3 font-black text-white hover:bg-white/20 transition"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={loadingModif}
                onClick={sauvegarderCompteAdmin}
                className="flex-1 rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300 transition flex items-center justify-center gap-2"
              >
                {loadingModif && <span className="h-4 w-4 animate-spin border-2 border-black border-t-transparent rounded-full" />}
                {loadingModif ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}