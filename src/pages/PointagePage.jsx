import React, { useEffect, useState } from "react";
import PageTitle from "../components/PageTitle";
import { calculateWorkedTime } from "../utils/pointageUtils";
import * as XLSX from "xlsx";

function calculDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PointagePage({ supabase }) {
  const [historique, setHistorique] = useState([]);
  const [demandesModification, setDemandesModification] = useState([]);
  const [messagePointage, setMessagePointage] = useState("");
  const [employeConnecte, setEmployeConnecte] = useState(null);
  const [loadingEmploye, setLoadingEmploye] = useState(true);
  const [demandeOpenId, setDemandeOpenId] = useState(null);
  const [demandeArrivee, setDemandeArrivee] = useState("");
  const [demandeDepart, setDemandeDepart] = useState("");
  const [demandeMotif, setDemandeMotif] = useState("");
  const [savingDemande, setSavingDemande] = useState(false);
  const [planningSemaine, setPlanningSemaine] = useState([]);
  const [mesPointages, setMesPointages] = useState([]);
  const [mesDemandes, setMesDemandes] = useState([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [moisExport, setMoisExport] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    verifierUtilisateur();
  }, []);
  
  const verifierUtilisateur = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingEmploye(false);
      return;
    }

    const { data, error } = await supabase
      .from("employes")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      console.error(error);
      setEmployeConnecte(null);
      setLoadingEmploye(false);
      return;
    }

    setEmployeConnecte(data);
await chargerHistorique(data.id);
await chargerDemandesModification(data.id);
setMesPointages(data ? await chargerMesPointagesEmploye(data.id) : []);
setMesDemandes(data ? await chargerMesDemandesEmploye(data.id) : []);

console.log("EMPLOYE CONNECTE :", data);

await chargerPlanningSemaine(data.auth_user_id);

setLoadingEmploye(false);
  };

  const chargerHistorique = async (employeId) => {
    const { data, error } = await supabase
      .from("pointages")
      .select("*")
      .eq("employe_id", employeId)
      .order("arrivee", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setHistorique(data || []);
  };

  const chargerDemandesModification = async (employeId) => {
    const { data, error } = await supabase
      .from("demandes_modification_pointage")
      .select("*")
      .eq("employe_id", employeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setDemandesModification(data || []);
  };

  const chargerMesPointagesEmploye = async (employeId) => {
  setLoadingHistorique(true);

  const { data, error } = await supabase
    .from("pointages")
    .select("*")
    .eq("employe_id", employeId)
    .order("arrivee", { ascending: false })
    .limit(30);

  if (error) {
    console.error(error);
    setLoadingHistorique(false);
    return [];
  }

  setLoadingHistorique(false);
  return data || [];
};

  const chargerMesDemandesEmploye = async (employeId) => {
  const { data, error } = await supabase
    .from("demandes_modification_pointage")
    .select("*")
    .eq("employe_id", employeId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
};

  const chargerPlanningSemaine = async (authUserId) => {
  const { data, error } = await supabase
    .from("planning_employes")
    .select("*")
    .eq("employe_id", authUserId);

  console.log("ID utilisé planning :", authUserId);
  console.log("Planning reçu :", data);
  console.log("Erreur planning :", error);

  if (error) {
    console.error(error);
    return;
  }

  setPlanningSemaine(data || []);
};

  const pointer = async () => {
    if (!employeConnecte) {
      alert("Aucun employé connecté ❌");
      return;
    }

    if (!navigator.geolocation) {
      alert("La géolocalisation n’est pas disponible sur cet appareil ❌");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const restaurantLat = 47.6402;
        const restaurantLon = 6.8653;

        const distance = calculDistance(latitude, longitude, restaurantLat, restaurantLon);
        console.log("Distance :", Math.round(distance), "m");

        if (distance > 150) {
          alert(`Vous devez être au restaurant pour pointer ❌ Distance actuelle : ${Math.round(distance)} m`);
          return;
        }

        const maintenant = new Date();

const jours = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

const jourActuel = jours[maintenant.getDay()];

const heureActuelle =
  String(maintenant.getHours()).padStart(2, "0") +
  ":" +
  String(maintenant.getMinutes()).padStart(2, "0");

const { data: planning, error: planningError } = await supabase
  .from("planning_employes")
  .select("*")
  .eq("employe_id", employeConnecte.auth_user_id)
  .eq("jour_semaine", jourActuel)
  .maybeSingle();

if (planningError) {
  console.error(planningError);
  alert("Erreur lors de la vérification du planning ❌");
  return;
}

if (!planning) {
  alert("Aucun horaire de pointage prévu aujourd’hui ❌");
  return;
}

const heureEnMinutes = (heure) => {
  const [h, m] = heure.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

const maintenantMinutes =
  maintenant.getHours() * 60 + maintenant.getMinutes();

const margeAvant = 5;
const margeApres = 5;

const autorise =
  (planning.debut_matin &&
    planning.fin_matin &&
    maintenantMinutes >=
      heureEnMinutes(planning.debut_matin) - margeAvant &&
    maintenantMinutes <=
      heureEnMinutes(planning.fin_matin) + margeApres) ||

  (planning.debut_soir &&
    planning.fin_soir &&
    maintenantMinutes >=
      heureEnMinutes(planning.debut_soir) - margeAvant &&
    maintenantMinutes <=
      heureEnMinutes(planning.fin_soir) + margeApres);

if (!autorise) {
  alert(
    `Vous ne pouvez pas pointer en dehors de vos horaires ❌\n\nAujourd’hui (${jourActuel}) :\nMatin : ${
      planning.debut_matin || "--:--"
    } - ${planning.fin_matin || "--:--"}\nSoir : ${
      planning.debut_soir || "--:--"
    } - ${planning.fin_soir || "--:--"}`
  );
  return;
}

        const { data: dernierPointage, error: lastError } = await supabase
          .from("pointages")
          .select("*")
          .eq("employe_id", employeConnecte.id)
          .is("depart", null)
          .order("arrivee", { ascending: false })
          .limit(1);

        if (lastError) {
          console.error(lastError);
          alert("Erreur lors de la vérification du pointage ❌");
          return;
        }

        if (dernierPointage && dernierPointage.length > 0) {
          const pointageOuvert = dernierPointage[0];

          const { error: updateError } = await supabase
            .from("pointages")
            .update({ depart: new Date().toISOString() })
            .eq("id", pointageOuvert.id);

          if (updateError) {
            console.error(updateError);
            alert("Erreur lors du dépointage ❌");
            return;
          }

          setMessagePointage("Dépointage enregistré ✅");
        } else {
          const { error: insertError } = await supabase
            .from("pointages")
            .insert([{ employe_id: employeConnecte.id, arrivee: new Date().toISOString() }]);

          if (insertError) {
            console.error(insertError);
            alert("Erreur lors du pointage ❌");
            return;
          }

          setMessagePointage("Pointage enregistré ✅");
        }

        await chargerHistorique(employeConnecte.id);
        await chargerDemandesModification(employeConnecte.id);
        setMesPointages(await chargerMesPointagesEmploye(employeConnecte.id));
        setMesDemandes(await chargerMesDemandesEmploye(employeConnecte.id));
      },
      (error) => {
        console.error(error);
        alert("Localisation refusée ou indisponible ❌");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("fr-FR");

  const formatHeure = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatInputDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const ouvrirDemandeModification = (pointage) => {
    setDemandeOpenId(pointage.id);
    setDemandeArrivee(formatInputDate(pointage.arrivee));
    setDemandeDepart(formatInputDate(pointage.depart));
    setDemandeMotif("");
  };

  const envoyerDemandeModification = async (pointage) => {
    if (!employeConnecte) return;

    if (!demandeArrivee) {
      alert("Merci d’indiquer une heure d’arrivée souhaitée ❌");
      return;
    }

    if (!demandeMotif.trim()) {
      alert("Merci d’écrire un motif pour la demande ❌");
      return;
    }

    setSavingDemande(true);

    const { error } = await supabase.from("demandes_modification_pointage").insert([
      {
        pointage_id: pointage.id,
        employe_id: employeConnecte.id,
        arrivee_actuelle: pointage.arrivee,
        depart_actuel: pointage.depart,
        arrivee_demandee: new Date(demandeArrivee).toISOString(),
        depart_demandee: demandeDepart ? new Date(demandeDepart).toISOString() : null,
        motif: demandeMotif.trim(),
        statut: "en_attente",
      },
    ]);

    setSavingDemande(false);

    if (error) {
      console.error(error);
      alert("Erreur lors de l’envoi de la demande ❌");
      return;
    }

    alert("Demande envoyée à l’admin ✅");
    setDemandeOpenId(null);
    setDemandeMotif("");
    chargerDemandesModification(employeConnecte.id);
  };

  const getDemandePourPointage = (pointageId) => {
    return demandesModification.find((demande) => String(demande.pointage_id) === String(pointageId));
  };

  const getStatutLabel = (statut) => {
    if (statut === "acceptee") return "Acceptée";
    if (statut === "refusee") return "Refusée";
    return "En attente";
  };

  const getStatutClass = (statut) => {
    if (statut === "acceptee") return "bg-green-500 text-white";
    if (statut === "refusee") return "bg-red-500 text-white";
    return "bg-yellow-400 text-black";
  };

  const pointageActif = historique.find((pointage) => !pointage.depart);
  const estEnService = Boolean(pointageActif);

const exporterPointagesMois = () => {
  if (!moisExport) {
    alert("Choisis un mois à exporter ❌");
    return;
  }

  const pointagesDuMois = historique.filter((p) => {
    if (!p.arrivee) return false;
    return p.arrivee.slice(0, 7) === moisExport;
  });

  if (pointagesDuMois.length === 0) {
    alert("Aucun pointage trouvé pour ce mois ❌");
    return;
  }

  const lignes = pointagesDuMois.map((p) => ({
    Date: new Date(p.arrivee).toLocaleDateString("fr-FR"),
    Arrivée: p.arrivee ? formatHeure(p.arrivee) : "",
    Départ: p.depart ? formatHeure(p.depart) : "En cours",
    "Temps travaillé": p.arrivee && p.depart
      ? calculateWorkedTime(p.arrivee, p.depart)
      : "En cours",
  }));

  const worksheet = XLSX.utils.json_to_sheet(lignes);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Pointages");

  XLSX.writeFile(
    workbook,
    `pointages_${employeConnecte?.nom || "employe"}_${moisExport}.xlsx`
  );
};

  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Employés"
        title="Pointage"
        text="Pointez votre arrivée et votre départ. En cas d’erreur, envoyez une demande de modification à l’admin."
      />

      <div className="mx-auto max-w-4xl rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
        <h2 className="text-2xl font-black text-yellow-300">Pointage employé</h2>

        <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-black px-5 py-4">
          <p className="text-sm text-stone-400">Employé connecté</p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xl font-black text-yellow-300">
              {loadingEmploye ? "Chargement..." : employeConnecte?.nom || "Non connecté"}
            </p>

            {!loadingEmploye && employeConnecte && (
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${estEnService ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                <span className="h-3 w-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                {estEnService ? "En service" : "Hors service"}
              </div>
            )}
          </div>

          {estEnService && <p className="mt-3 text-sm font-bold text-green-400">Arrivée enregistrée à {formatHeure(pointageActif.arrivee)}</p>}
        </div>

          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-black p-5">
  <h3 className="text-xl font-black text-yellow-300">
    Mon planning de la semaine
  </h3>

  <div className="mt-4 space-y-3">
    {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map(
      (jour) => {
        const planning = planningSemaine.find(
          (p) => p.jour_semaine === jour
        );

        return (
          <div
            key={jour}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3"
          >
            <span className="font-black text-white">{jour}</span>

            <span className="text-sm font-bold text-stone-300">
              Matin : {planning?.debut_matin?.slice(0, 5) || "--:--"} -{" "}
              {planning?.fin_matin?.slice(0, 5) || "--:--"} | Soir :{" "}
              {planning?.debut_soir?.slice(0, 5) || "--:--"} -{" "}
              {planning?.fin_soir?.slice(0, 5) || "--:--"}
            </span>
          </div>
        );
      }
    )}
  </div>
</div>


        <button
          onClick={pointer}
          disabled={!employeConnecte}
          className={`mt-6 w-full rounded-full px-6 py-4 font-black text-black disabled:cursor-not-allowed disabled:bg-stone-500 disabled:text-white ${
            estEnService ? "bg-red-500 text-white hover:bg-red-400" : "bg-yellow-400 hover:bg-yellow-300"
          }`}
        >
          {estEnService ? "Je dépointe" : "Je pointe"}
        </button>

        {messagePointage && <p className="mt-4 text-center font-bold text-yellow-300">{messagePointage}</p>}
<div className="mt-8 rounded-2xl border border-yellow-500/30 bg-black p-5">
  <h3 className="text-xl font-black text-yellow-300">
    Exporter mes pointages
  </h3>

  <div className="mt-4 flex flex-wrap gap-3">

    <select
      value={moisExport.split("-")[1]}
      onChange={(e) => {
        const annee = moisExport.split("-")[0];
        setMoisExport(`${annee}-${e.target.value}`);
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
      value={moisExport.split("-")[0]}
      onChange={(e) => {
        const mois = moisExport.split("-")[1];
        setMoisExport(`${e.target.value}-${mois}`);
      }}
      className="rounded-full bg-black px-5 py-3 font-bold text-white border border-yellow-500/30"
    >
      {[2026, 2027, 2028, 2029, 2030].map((annee) => (
        <option key={annee} value={annee}>
          {annee}
        </option>
      ))}
    </select>

    <button
      onClick={exporterPointagesMois}
      className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300"
    >
      Exporter en Excel
    </button>

  </div>
</div>
<div className="mt-8 bg-neutral-900 border border-yellow-500/30 rounded-2xl p-5">
  <h2 className="text-xl font-bold text-yellow-400 mb-4">
    Mes derniers pointages
  </h2>

  {loadingHistorique ? (
    <p className="text-gray-300">Chargement de tes pointages...</p>
  ) : mesPointages.length === 0 ? (
    <p className="text-gray-400">Aucun pointage trouvé.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-yellow-400 border-b border-yellow-500/30">
            <th className="py-2">Jour</th>
            <th className="py-2">Arrivée</th>
            <th className="py-2">Départ</th>
            <th className="py-2">Temps travaillé</th>
          </tr>
        </thead>

        <tbody>
          {mesPointages.map((p) => (
            <tr key={p.id} className="border-b border-white/10 text-gray-200">
              <td className="py-2">
                {p.arrivee
                   ? new Date(p.arrivee).toLocaleDateString("fr-FR")
                   : "-"}
              </td>

              <td className="py-2">
                {p.arrivee
                  ? new Date(p.arrivee).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </td>

              <td className="py-2">
                {p.depart
                  ? new Date(p.depart).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </td>

              <td className="py-2">
                {p.arrivee && p.depart
                  ? calculateWorkedTime(p.arrivee, p.depart)
                  : "En cours"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

<div className="mt-6 bg-neutral-900 border border-orange-500/30 rounded-2xl p-5">
  <h2 className="text-xl font-bold text-orange-400 mb-4">
    Mes demandes de modification
  </h2>

  {mesDemandes.length === 0 ? (
    <p className="text-gray-400">Aucune demande envoyée.</p>
  ) : (
    <div className="space-y-3">
      {mesDemandes.map((d) => (
        <div
          key={d.id}
          className="bg-black/40 border border-white/10 rounded-xl p-4"
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-white font-semibold">
              Demande du{" "}
              {d.created_at
                ? new Date(d.created_at).toLocaleDateString("fr-FR")
                : "-"}
            </p>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                d.statut === "acceptee"
                  ? "bg-green-600 text-white"
                  : d.statut === "refusee"
                  ? "bg-red-600 text-white"
                  : "bg-yellow-500 text-black"
              }`}
            >
              {d.statut === "acceptee"
                ? "Acceptée"
                : d.statut === "refusee"
                ? "Refusée"
                : "En attente"}
            </span>
          </div>

          <p className="text-gray-300 text-sm">
            Motif : {d.motif || "Non renseigné"}
          </p>

          {d.reponse_admin && (
            <p className="text-gray-300 text-sm mt-2">
              Réponse admin : {d.reponse_admin}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>
        <div className="mt-10">
          <h3 className="text-xl font-black text-white">Historique</h3>

          <div className="mt-4 space-y-4">
            {historique.map((pointage) => {
              const demande = getDemandePourPointage(pointage.id);
              const pointageEnCours = !pointage.depart;

              return (
                <div key={pointage.id} className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-yellow-300">{formatDate(pointage.arrivee)}</p>
                      <p className="mt-2 text-white">Arrivée : {formatHeure(pointage.arrivee)}</p>
                      <p className="text-white">Départ : {pointage.depart ? formatHeure(pointage.depart) : "En cours"}</p>
                      <p className="mt-2 font-bold text-green-400">Temps travaillé : {calculateWorkedTime(pointage.arrivee, pointage.depart)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {pointageEnCours && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-black text-white">
                          <span className="h-3 w-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                          En service
                        </span>
                      )}

                      {demande && <span className={`rounded-full px-4 py-2 text-sm font-black ${getStatutClass(demande.statut)}`}>Demande : {getStatutLabel(demande.statut)}</span>}
                    </div>
                  </div>

                  {demande && (
                    <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-black/50 p-4 text-sm text-stone-300">
                      <p className="font-bold text-yellow-300">Motif envoyé :</p>
                      <p className="mt-1 whitespace-pre-line">{demande.motif}</p>
                      {demande.reponse_admin && (
                        <p className="mt-3 text-stone-200">
                          <span className="font-bold text-yellow-300">Réponse admin :</span> {demande.reponse_admin}
                        </p>
                      )}
                    </div>
                  )}

                  <button onClick={() => ouvrirDemandeModification(pointage)} className="mt-4 rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300">
                    Demander une modification
                  </button>

                  {demandeOpenId === pointage.id && (
                    <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-black p-4">
                      <h4 className="font-black text-yellow-300">Demande de modification</h4>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-bold text-yellow-300">Nouvelle arrivée souhaitée</label>
                          <input type="datetime-local" value={demandeArrivee} onChange={(e) => setDemandeArrivee(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white" />
                        </div>

                        <div>
                          <label className="text-sm font-bold text-yellow-300">Nouveau départ souhaité</label>
                          <input type="datetime-local" value={demandeDepart} onChange={(e) => setDemandeDepart(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-white" />
                        </div>
                      </div>

                      <label className="mt-4 block text-sm font-bold text-yellow-300">Motif de la demande</label>
                      <textarea
                        value={demandeMotif}
                        onChange={(e) => setDemandeMotif(e.target.value)}
                        className="mt-2 min-h-24 w-full rounded-xl bg-white/10 px-4 py-3 text-white"
                        placeholder="Exemple : j’ai oublié de badger en partant, j’ai terminé à 14h30."
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button onClick={() => envoyerDemandeModification(pointage)} disabled={savingDemande} className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500 disabled:bg-stone-500">
                          {savingDemande ? "Envoi..." : "Envoyer la demande"}
                        </button>

                        <button onClick={() => setDemandeOpenId(null)} className="rounded-full bg-stone-700 px-5 py-3 font-black text-white hover:bg-stone-600">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
