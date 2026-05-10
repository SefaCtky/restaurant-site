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
    <header className="sticky top-0 z-50 border-b border-yellow-500/20 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <button onClick={() => showPage("Accueil")} className="flex items-center gap-3">
          <img src={LOGO} alt="Chez Omer" className="h-14 w-14 rounded-full object-cover ring-2 ring-yellow-500/50" />
          <span className="hidden text-xl font-black uppercase tracking-wide text-yellow-400 sm:block">Chez Omer</span>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((item) => (
            <button
              key={item}
              onClick={() => showPage(item)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                activePage === item ? "bg-yellow-400 text-black" : "text-stone-300 hover:bg-white/10 hover:text-yellow-300"
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
          className="relative hidden rounded-full bg-yellow-400 px-5 py-3 font-black text-black shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-300 md:inline-flex md:items-center md:gap-2"
        >
          <ShoppingCart size={18} /> Panier
          {itemCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{itemCount}</span>}
        </button>

        <button className="rounded-xl bg-white/10 p-3 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-yellow-500/20 bg-black px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {nav.map((item) => (
              <button key={item} onClick={() => showPage(item)} className="rounded-xl bg-white/5 px-4 py-3 text-left font-bold text-stone-200">
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