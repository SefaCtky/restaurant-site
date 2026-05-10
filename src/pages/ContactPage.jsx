import React from "react";
import { MapPin, Phone, Mail, CalendarDays, MessageCircle } from "lucide-react";
import PageTitle from "../components/PageTitle";

export default function ContactPage({ restaurantAddress, phoneNumber, whatsappNumber }) {
  return (
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

          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-7 py-4 font-black text-black hover:bg-yellow-300"
          >
            <MessageCircle /> WhatsApp
          </a>
        </div>

        <iframe
          title="Carte Chez Omer Sevenans"
          src="https://www.google.com/maps?q=15%20Rue%20de%20Belfort%2090400%20Sevenans&output=embed"
          className="h-[420px] w-full rounded-[2rem] border border-yellow-500/20"
          loading="lazy"
        />
      </div>
    </main>
  );
}
