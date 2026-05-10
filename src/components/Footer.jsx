export default function Footer({ LOGO }) {
  return (
    <footer className="border-t border-yellow-500/20 px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center text-stone-400 md:flex-row md:text-left">
        <div className="flex items-center gap-3">
          <img
            src={LOGO}
            alt="Logo Chez Omer"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="font-black text-yellow-300">Chez Omer</p>
            <p>Le kebab fait maison • Restaurant HALAL</p>
          </div>
        </div>

        <p>© 2026 Chez Omer. Tous droits réservés.</p>
      </div>
    </footer>
  );
}