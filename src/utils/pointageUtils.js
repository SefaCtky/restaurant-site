export function calculateWorkedTime(start, end) {
  if (!start || !end) return "En cours";

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffMs = endDate - startDate;
  if (diffMs <= 0) return "Erreur";

  const totalMinutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}
