import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const safeLocalStorage = createJSONStorage(() => ({
  getItem(name: string) {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(name); }
    catch (e) { console.error("[cart] Impossible de lire le panier:", e); return null; }
  },
  setItem(name: string, value: string) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(name, value); }
    catch (e) { console.error("[cart] Impossible de sauvegarder le panier:", e); }
  },
  removeItem(name: string) {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(name); }
    catch (e) { console.error("[cart] Impossible de supprimer le panier:", e); }
  },
}));

export type CartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  price: number;
  image: string;
  colorName: string | null;
  colorHex: string | null;
  quantity: number;
};

// Clé d'unicité : variantId si présent, sinon productId
const cartKey = (i: Pick<CartItem, "variantId" | "productId">) =>
  i.variantId ?? i.productId;

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem(item) {
        set((state) => {
          const key = cartKey(item);
          const existing = state.items.find((i) => cartKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },
      removeItem(key) {
        set((state) => ({ items: state.items.filter((i) => cartKey(i) !== key) }));
      },
      setQuantity(key, quantity) {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            cartKey(i) === key ? { ...i, quantity } : i
          ),
        }));
      },
      clear() {
        set({ items: [] });
      },
      total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: "dbs-cart",
      version: 2,
      storage: safeLocalStorage,
      migrate: () => ({ items: [] }),
      onRehydrateStorage: () => (_, error) => {
        if (error) console.error("[cart] Erreur de chargement du panier:", error);
      },
    }
  )
);
