import React from "react";
import PageTitle from "../components/PageTitle";

export default function AProposPage() {
  return (
    <div className="relative min-h-screen bg-black">
      
      {/* IMAGE D'ARRIÈRE-PLAN : Opacité doublée (30) et flou réduit (2px) pour mieux capter les détails d'Ihlara */}
      <div 
        className="absolute inset-0 z-0 w-full h-full bg-cover bg-center bg-no-repeat grayscale opacity-30 blur-[2px]"
        style={{ backgroundImage: "url('/ihlara.png')" }}
      />
      
      {/* Overlay dégradé légèrement adouci au centre */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-black via-black/40 to-black opacity-80" />

      {/* CONTENU */}
      <div className="relative z-10 max-w-5xl mx-auto space-y-20 px-5 py-16">
        
        <PageTitle
          eyebrow="À propos"
          title="LE GOÛT DU VRAI KEBAB MAISON"
          text="Une identité forte, une cuisine généreuse et une ambiance inspirée de notre carte noire et jaune."
        />

        {/* EN-TÊTE INTRODUCTIF ÉPURÉ */}
        <div className="text-center max-w-3xl mx-auto space-y-6 rounded-[2rem] bg-black/70 p-8 border border-white/10 backdrop-blur-md shadow-2xl">
          <h3 className="text-4xl font-black text-yellow-400 tracking-tight">Chez Omer Restaurant</h3>
          <p className="text-lg leading-8 text-stone-300 font-medium">
            Nous vous accueillons avec des kebabs, tacos, assiettes et burgers 100% HALAL. 
            Notre objectif est simple : vous offrir un service rapide, généreux et une qualité constante au quotidien.
          </p>
          
          {/* Les 3 Badges */}
          <div className="pt-4 flex flex-wrap justify-center gap-4 text-sm font-black uppercase tracking-wider">
            <span className="rounded-full border border-yellow-500/30 bg-black/80 px-6 py-2.5 text-yellow-400 backdrop-blur-md">
              100% HALAL
            </span>
            <span className="rounded-full border border-yellow-500/30 bg-black/80 px-6 py-2.5 text-yellow-400 backdrop-blur-md">
              Viande sélectionnée
            </span>
            <span className="rounded-full border border-yellow-500/30 bg-black/80 px-6 py-2.5 text-yellow-400 backdrop-blur-md">
              Fait maison
            </span>
          </div>
        </div>

        <hr className="border-stone-800/60" />

        {/* SECTION NOTRE HISTOIRE STYLE MAGAZINE */}
        <div className="space-y-24 rounded-[2rem] bg-black/60 p-8 lg:p-12 border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="space-y-4 text-center">
            <h3 className="text-3xl font-black uppercase tracking-widest text-white">
              L'Histoire de Notre Chef
            </h3>
            <div className="mx-auto h-1 w-16 bg-yellow-400 rounded-full" />
          </div>

          <div className="space-y-20 text-stone-300">
            
            {/* Époque 1 */}
            <div className="grid gap-8 md:grid-cols-[200px_1fr] items-start border-l-2 border-yellow-400 pl-6 md:border-l-0 md:pl-0">
              <div className="text-xl font-black text-yellow-400 md:text-right md:pr-8 md:pt-1">
                01 . ORIGINES
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-white tracking-tight">L'apprentissage à Istanbul</h4>
                <p className="text-base leading-7 text-stone-400 max-w-3xl">
                  Tout commence en Turquie, à Aksaray, au cœur de la splendide vallée de Ihlara. Dès son plus jeune âge, Omer intègre le monde de la cuisine pour soutenir sa famille. À seulement 15 ans, il fait ses premières armes à Istanbul comme commis dans un tout petit restaurant traditionnel. Passionné et déterminé, il gravit rapidement les échelons au sein de grands établissements de la mégapole.
                </p>
              </div>
            </div>

            {/* Époque 2 */}
            <div className="grid gap-8 md:grid-cols-[200px_1fr] items-start border-l-2 border-yellow-400 pl-6 md:border-l-0 md:pl-0">
              <div className="text-xl font-black text-yellow-400 md:text-right md:pr-8 md:pt-1">
                02 . MAÎTRISE
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-white tracking-tight">Le statut de Chef à Aksaray</h4>
                <p className="text-base leading-7 text-stone-400 max-w-3xl">
                  De commis à apprenti, il apprend les secrets du métier auprès du Chef Bayram Yaşar. Devenu Chef de cuisine à son tour, son travail rigoureux et ses efforts constants lui permettent de prendre la direction des cuisines. À 24 ans, riche de son expérience, le Chef Omer ouvre son propre grand restaurant à Aksaray. Là-bas, il met un point d'honneur à former la jeune génération, leur partageant son savoir-faire unique et son amour du goût.
                </p>
              </div>
            </div>

            {/* Époque 3 */}
            <div className="grid gap-8 md:grid-cols-[200px_1fr] items-start border-l-2 border-yellow-400 pl-6 md:border-l-0 md:pl-0">
              <div className="text-xl font-black text-yellow-400 md:text-right md:pr-8 md:pt-1">
                03 . LE DÉPART
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-white tracking-tight">De la Savoie à Belfort</h4>
                <p className="text-base leading-7 text-stone-400 max-w-3xl">
                  C'est lors d'un voyage professionnel en Europe que le Chef tombe sous le charme de la France, et plus particulièrement de la beauté d'Annecy. Après s'y être installé, l'appel des fourneaux se fait rapidement ressentir. Il lance alors un foodtruck qui fait rapidement parler de lui dans toute la région grâce à la qualité exceptionnelle de sa viande. Fort de ce succès, il prend la décision d'ouvrir son premier restaurant en dur : c'est à <strong>Belfort</strong> que l'aventure <strong>Chez Omer</strong> s'installe définitivement pour vous proposer le goût du vrai kebab maison.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}