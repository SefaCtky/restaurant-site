import React from "react";
import { MapPin, Clock, Phone } from "lucide-react";

export default function InfosAccueil({
  restaurantAddress,
  phoneNumber,
  showPage,
}) {
  return (
    <section className="px-5 pb-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-black text-yellow-300">
            <MapPin /> Nous trouver
          </h2>

          <p className="mb-5 text-lg font-bold text-white">
            {restaurantAddress}
          </p>

          <iframe
            title="Carte Chez Omer Sevenans"
            src="https://www.google.com/maps?q=15%20Rue%20de%20Belfort%2090400%20Sevenans&output=embed"
            className="h-80 w-full rounded-[1.5rem] border border-yellow-500/20"
            loading="lazy"
          />
        </div>

        <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-6 shadow-xl">
          <h2 className="mb-4 text-2xl font-black text-yellow-300">
            Infos pratiques
          </h2>

          <div className="space-y-4 text-lg text-stone-200">
            <p className="flex items-center gap-3">
              <Clock className="text-yellow-400" />
              Mardi au dimanche : 11h00 – 22h00
            </p>

            <p className="flex items-center gap-3">
              <Phone className="text-yellow-400" />
              {phoneNumber}
            </p>

            <p className="flex items-center gap-3">
              <MapPin className="text-yellow-400" />
              {restaurantAddress}
            </p>
          </div>

          <button
            onClick={() => showPage("Contact")}
            className="mt-8 rounded-full bg-yellow-400 px-7 py-3 font-black text-black hover:bg-yellow-300"
          >
            Page contact
          </button>
        </div>
      </div>
    </section>
  );
}
