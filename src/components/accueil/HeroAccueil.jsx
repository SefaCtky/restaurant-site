import React from "react";
import { motion } from "framer-motion";

export default function HeroAccueil({
  fermetureActive,
  annonceSite,
  whatsappNumber,
  showPage,
  LOGO,
}) {
  return (
    <section className="relative overflow-hidden px-5 py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {fermetureActive && (
            <div className="mb-6 rounded-3xl border border-red-500 bg-red-600 px-6 py-4 text-center text-lg font-black text-white shadow-xl">
              🚫 Fermeture exceptionnelle — les commandes sont temporairement indisponibles.
            </div>
          )}

          {annonceSite && (
            <div className="mb-6 rounded-3xl border border-yellow-400 bg-yellow-400 px-6 py-4 text-center text-lg font-black text-black shadow-xl shadow-yellow-500/20">
              ⚠️ {annonceSite}
            </div>
          )}

          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              "Bonjour Chez Omer, je souhaite réserver une table."
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mb-7 block max-w-3xl overflow-hidden rounded-3xl border-2 border-yellow-300 bg-yellow-400 py-4 shadow-[0_0_30px_rgba(250,204,21,0.35)] transition hover:bg-yellow-300"
          >
            <div
              className="whitespace-nowrap text-2xl font-black uppercase tracking-wide text-black md:text-3xl"
              style={{ animation: "reservationMarquee 13s linear infinite" }}
            >
              🔥 Pour réserver votre table cliquez ici ! • 🔥 Pour réserver votre table cliquez ici ! •
            </div>
          </a>

          <div className="mb-6 inline-flex rounded-full border border-yellow-500/40 bg-yellow-500/10 px-6 py-3 text-base font-black text-yellow-300 shadow-lg shadow-yellow-500/10 md:text-lg">
            Restaurant HALAL • Le kebab fait maison
          </div>

          <h1 className="text-6xl font-black uppercase leading-none tracking-tight text-white md:text-8xl">
            CHEZ OMER
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
              RESTAURANT
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-2xl font-semibold leading-10 text-yellow-100">
            Viande sélectionnée, fait maison, cuisson maîtrisée et qualité premium.
            Sur place ou à emporter à Sevenans.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => showPage("Menu")}
              className="rounded-full bg-yellow-400 px-8 py-4 font-black text-black shadow-xl shadow-yellow-500/20 transition hover:bg-yellow-300"
            >
              Voir le menu
            </button>

            <button
              onClick={() => showPage("Commande")}
              className="rounded-full border border-yellow-500/30 bg-white/5 px-8 py-4 font-black text-white transition hover:bg-white/10"
            >
              Commander
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-full bg-yellow-500/20 blur-3xl" />

          <img
            src={LOGO}
            alt="Chez Omer"
            className="relative mx-auto max-h-[520px] w-full object-contain drop-shadow-[0_0_35px_rgba(250,204,21,0.15)]"
          />

          <div className="absolute bottom-6 right-6 rounded-full border border-yellow-400/50 bg-black/85 px-5 py-4 text-center text-yellow-300 shadow-lg">
            <p className="text-3xl font-black">حلال</p>
            <p className="text-sm font-black uppercase">Halal</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
