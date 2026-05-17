import React from "react";
import { Menu, X, ShoppingCart } from "lucide-react";

export default function Header({
  LOGO,
  nav,
  activePage,
  showPage,
  user,
  setUser,
  setUserRole,
  setActivePage,
  setOpen,
  open,
  itemCount,
  setCartOpen,
  supabase,
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-yellow-500/10 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <button onClick={() => showPage("Accueil")} className="flex items-center gap-3">
          <img src={LOGO} alt="Chez Omer" className="h-16 w-16 rounded-full object-cover ring-2 ring-yellow-400/70 shadow-[0_0_25px_rgba(250,204,21,0.45)] transition duration-300 hover:scale-110 hover:rotate-2 animate-[pulse_4s_infinite]" />
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.filter((item) => item !== "Accueil").map((item) => (
            <button
              key={item}
              onClick={() => {
                showPage(item);
                setOpen(false);
              }}
              className={`rounded-full px-6 py-3 text-sm font-black tracking-wide transition duration-300 ${
                activePage === item
                  ? "bg-gradient-to-r from-yellow-300 to-orange-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.45)]"
                  : "text-stone-300 hover:bg-yellow-500/10 hover:text-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]"
              }`}
            >
              {item}
            </button>
          ))}
          {user && (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.clear();
                setUser(null);
                setUserRole("client");
                setActivePage("Accueil");
              }}
              className="rounded-full border border-red-500/40 bg-red-600 px-5 py-2 text-sm font-black text-white hover:bg-red-500"
            >
              Déconnexion
            </button>
          )}
        </nav>

        <button
          onClick={() => setCartOpen(true)}
          className="relative hidden rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 font-black text-black shadow-[0_0_25px_rgba(250,204,21,0.35)] transition duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(251,146,60,0.45)] md:inline-flex md:items-center md:gap-2"
        >
          <ShoppingCart size={18} /> Panier
          {itemCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{itemCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-2xl border border-yellow-500/20 bg-white/5 p-3 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.08)] backdrop-blur-md transition duration-300 hover:scale-105 hover:border-yellow-400/40 hover:bg-yellow-500/10 md:hidden"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-yellow-500/10 bg-black/95 px-5 py-5 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-3">
            {nav.filter((item) => item !== "Accueil").map((item) => (
              <button key={item} onClick={() => {
                showPage(item);
                setOpen(false);
              }}
              className="rounded-2xl border border-yellow-500/10 bg-white/5 px-5 py-4 text-left font-black text-stone-200 transition duration-300 hover:border-yellow-400/30 hover:bg-yellow-500/10 hover:text-yellow-300">
                {item}
              </button>
            ))}
            {user && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.clear();
                  setUser(null);
                  setUserRole("client");
                  setActivePage("Accueil");
                  setOpen(false);
                }}
                className="rounded-xl bg-red-600 px-4 py-3 text-left font-black text-white"
              >
                Déconnexion
              </button>
            )}
            <button onClick={() => setCartOpen(true)} className="rounded-xl bg-yellow-400 px-4 py-3 font-black text-black">
              Voir le panier ({itemCount})
            </button>
          </div>
        </div>
      )}
    </header>
  );
}