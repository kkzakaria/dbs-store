import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Product, CartItem } from "@/types"
import { createClient } from "@/lib/supabase/client"

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  isHydrated: boolean

  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  setHydrated: (state: boolean) => void

  // Computed helpers (as functions to avoid hydration issues)
  getTotalItems: () => number
  getSubtotal: () => number
  getItem: (productId: string) => CartItem | undefined
  isInCart: (productId: string) => boolean

  // Supabase sync
  syncWithServer: (userId: string) => Promise<void>
  loadFromServer: (userId: string) => Promise<void>
  mergeServerCart: (userId: string) => Promise<void>
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isHydrated: false,

      addItem: (product: Product, quantity: number = 1) => {
        const { items } = get()
        const existingItem = items.find((item) => item.product.id === product.id)
        const stockQuantity = product.stock_quantity ?? 0

        if (existingItem) {
          // Update quantity, respecting stock
          const newQuantity = Math.min(
            existingItem.quantity + quantity,
            stockQuantity
          )
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity }
                : item
            ),
          })
        } else {
          // Add new item
          const itemQuantity = Math.min(quantity, stockQuantity)
          if (itemQuantity > 0) {
            set({
              items: [...items, { product, quantity: itemQuantity }],
            })
          }
        }
      },

      removeItem: (productId: string) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        })
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        const { items } = get()
        set({
          items: items.map((item) => {
            if (item.product.id === productId) {
              // Respect stock quantity
              const stockQuantity = item.product.stock_quantity ?? 0
              const newQuantity = Math.min(quantity, stockQuantity)
              return { ...item, quantity: newQuantity }
            }
            return item
          }),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setHydrated: (state: boolean) => set({ isHydrated: state }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          // price is the current selling price
          const price = item.product.price
          return total + price * item.quantity
        }, 0)
      },

      getItem: (productId: string) => {
        return get().items.find((item) => item.product.id === productId)
      },

      isInCart: (productId: string) => {
        return get().items.some((item) => item.product.id === productId)
      },

      // Sync local cart to server
      syncWithServer: async (userId: string) => {
        const supabase = createClient()
        const { items } = get()

        // Delete existing cart items for user
        await supabase.from("cart_items").delete().eq("user_id", userId)

        if (items.length === 0) return

        // Insert current cart items
        const cartItems = items.map((item) => ({
          user_id: userId,
          product_id: item.product.id,
          quantity: item.quantity,
        }))

        await supabase.from("cart_items").insert(cartItems)
      },

      // Load cart from server (replaces local)
      loadFromServer: async (userId: string) => {
        const supabase = createClient()

        const { data, error } = await supabase
          .from("cart_items")
          .select(
            `
            quantity,
            product:products(*)
          `
          )
          .eq("user_id", userId)

        if (error || !data) return

        const items: CartItem[] = data
          .filter((item) => item.product !== null)
          .map((item) => ({
            product: item.product as unknown as Product,
            quantity: item.quantity,
          }))

        set({ items })
      },

      // Merge server cart with local cart (on login)
      mergeServerCart: async (userId: string) => {
        const supabase = createClient()
        const localItems = get().items

        // Get server cart
        const { data: serverData } = await supabase
          .from("cart_items")
          .select(
            `
            quantity,
            product:products(*)
          `
          )
          .eq("user_id", userId)

        if (!serverData) {
          // No server cart, just sync local to server
          await get().syncWithServer(userId)
          return
        }

        const serverItems: CartItem[] = serverData
          .filter((item) => item.product !== null)
          .map((item) => ({
            product: item.product as unknown as Product,
            quantity: item.quantity,
          }))

        // Merge: local items take priority, add server items not in local
        const mergedItems = [...localItems]

        for (const serverItem of serverItems) {
          const existingIndex = mergedItems.findIndex(
            (item) => item.product.id === serverItem.product.id
          )
          if (existingIndex === -1) {
            // Add server item not in local cart
            mergedItems.push(serverItem)
          }
          // If exists locally, keep local quantity (user's recent action)
        }

        set({ items: mergedItems })

        // Sync merged cart back to server
        await get().syncWithServer(userId)
      },
    }),
    {
      name: "dbs-cart-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

// Hydration helper for client components
export function useCartHydration() {
  const setHydrated = useCartStore((state) => state.setHydrated)
  const isHydrated = useCartStore((state) => state.isHydrated)

  // Rehydrate on mount
  if (typeof window !== "undefined" && !isHydrated) {
    useCartStore.persist.rehydrate()
  }

  return isHydrated
}
