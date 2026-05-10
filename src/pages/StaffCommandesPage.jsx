import React, { useEffect, useRef, useState } from "react";
import PageTitle from "../components/PageTitle";

export default function StaffCommandesPage({
  supabase,
  userRole,
  formatPrice,
  soundEnabled,
  activerSonCommandes,
}) {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const audioContextRef = useRef(null);

  const playNotificationSound = () => {
    if (!soundEnabled || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;

    const playBeep = (startTime, frequency) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    };

    const now = audioContext.currentTime;
    playBeep(now, 880);
    playBeep(now + 0.35, 1175);
  };

  const chargerCommandes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erreur chargement commandes ❌");
      setLoading(false);
      return;
    }

    setCommandes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerCommandes();

    const channel = supabase
      .channel("commandes-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commandes",
        },
        () => {
          playNotificationSound();
          chargerCommandes();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commandes",
        },
        () => {
          chargerCommandes();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "commandes",
        },
        () => {
          chargerCommandes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  const getNomEmployeConnecte = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return "Employé";

    const { data: profile } = await supabase
      .from("profiles")
      .select("nom")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.nom || user.email || "Employé";
  };

  const modifierStatut = async (commandeId, nouveauStatut) => {
    const updateData = {
      statut: nouveauStatut,
    };

    if (nouveauStatut === "En préparation") {
      updateData.pris_en_charge_par = await getNomEmployeConnecte();
    }

    const { error } = await supabase
      .from("commandes")
      .update(updateData)
      .eq("id", commandeId);

    if (error) {
      console.error(error);
      alert("Erreur modification statut ❌");
      return;
    }

    chargerCommandes();
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatutStyle = (statut) => {
    if (statut === "En attente") return "bg-yellow-400 text-black";
    if (statut === "En préparation") return "bg-blue-600 text-white";
    if (statut === "Prête") return "bg-green-600 text-white";
    if (statut === "Terminée") return "bg-stone-600 text-white";

    return "bg-white/10 text-white";
  };

  if (!["admin", "employe"].includes(userRole)) {
    return (
      <main className="px-5 py-16">
        <PageTitle
          eyebrow="Commandes"
          title="Accès refusé"
          text="Cette page est réservée à l’équipe Chez Omer."
        />
      </main>
    );
  }

  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="Commandes"
        title="Commandes reçues"
        text="Suivez les commandes en temps réel et mettez à jour leur statut."
      />

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-yellow-300">
              Commandes en cours
            </h2>

            <p className="mt-2 text-sm text-stone-400">
              {soundEnabled
                ? "🔔 Son activé pour les nouvelles commandes"
                : "🔕 Son désactivé"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={activerSonCommandes}
              className={`rounded-full px-6 py-3 font-black ${
                soundEnabled
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {soundEnabled ? "Son activé ✅" : "Activer le son 🔔"}
            </button>

            <button
              onClick={chargerCommandes}
              className="rounded-full bg-yellow-400 px-6 py-3 font-black text-black hover:bg-yellow-300"
            >
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>
        </div>

        {commandes.length === 0 ? (
          <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8 text-center text-stone-400">
            Aucune commande pour le moment.
          </div>
        ) : (
          <div className="space-y-5">
            {commandes.map((commande) => (
              <div
                key={commande.id}
                className="rounded-[2rem] border border-yellow-500/20 bg-black/70 p-6 shadow-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-white">
                      {commande.numero_commande || `Commande #${commande.id}`}
                    </p>

                    <p className="mt-1 text-sm text-stone-400">
                      Reçue le {formatDate(commande.created_at)}
                    </p>

                    <p className="mt-2 text-2xl font-black text-yellow-300">
                      {formatPrice(Number(commande.total || 0))}
                    </p>

                    {commande.pris_en_charge_par && (
                      <p className="mt-3 inline-flex rounded-full border border-yellow-500/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-300">
                        Pris en charge par : {commande.pris_en_charge_par}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-5 py-3 text-sm font-black ${getStatutStyle(
                      commande.statut
                    )}`}
                  >
                    {commande.statut}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => modifierStatut(commande.id, "En attente")}
                    className="rounded-full bg-yellow-400 px-5 py-3 font-black text-black hover:bg-yellow-300"
                  >
                    En attente
                  </button>

                  <button
                    onClick={() =>
                      modifierStatut(commande.id, "En préparation")
                    }
                    className="rounded-full bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
                  >
                    En préparation
                  </button>

                  <button
                    onClick={() => modifierStatut(commande.id, "Prête")}
                    className="rounded-full bg-green-600 px-5 py-3 font-black text-white hover:bg-green-500"
                  >
                    Prête
                  </button>

                  <button
                    onClick={() => modifierStatut(commande.id, "Terminée")}
                    className="rounded-full bg-stone-600 px-5 py-3 font-black text-white hover:bg-stone-500"
                  >
                    Terminée
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
