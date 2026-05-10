import { ShoppingCart } from "lucide-react";

export default function MobileCartButton({ itemCount, setCartOpen }) {
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-4 font-black text-black shadow-2xl md:hidden"
    >
      <ShoppingCart /> {itemCount}
    </button>
  );
}