import React from "react";
import PageTitle from "../components/PageTitle";

export default function AProposPage({ BACKGROUND_IMAGE }) {
  return (
    <main className="px-5 py-16">
      <PageTitle
        eyebrow="À propos"
        title="Le goût du vrai kebab maison"
        text="Une identité forte, une cuisine généreuse et une ambiance inspirée de notre carte noire et jaune."
      />

      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-yellow-500/20 bg-black/60 p-5">
          <img
            src={BACKGROUND_IMAGE}
            alt="Carte Chez Omer"
            className="h-full w-full rounded-[1.5rem] object-cover"
          />
        </div>

        <div className="flex flex-col justify-center rounded-[2rem] border border-yellow-500/20 bg-black/60 p-8">
          <h2 className="text-4xl font-black text-yellow-300">
            Chez Omer Restaurant
          </h2>

          <p className="mt-6 text-lg leading-8 text-stone-300">
            Nous vous accueillons avec des kebabs, tacos, assiettes et burgers
            100% HALAL. Notre objectif : un service rapide, généreux et une
            qualité constante.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["100% HALAL", "Viande sélectionnée", "Fait maison"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4 text-center font-black text-yellow-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
