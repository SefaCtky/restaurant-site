export function calculateWorkedTime(arrivee, depart) {
  if (!arrivee || !depart) return "En cours";

  const start = new Date(arrivee);
  const end = new Date(depart);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Erreur";
  }

  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) {
    return "Erreur";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const heures = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${heures}h${String(minutes).padStart(2, "0")}`;
}