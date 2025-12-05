import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { CartProduct, CartItem } from "@/types"
import { createClient } from "@/lib/supabase/client"

// Generate unique key for cart items (product + variant combination)
const makeCartItemKey = (productId: string, variantId?: string | null) =>
  `${productId}:${variantId || "null"}`

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  isHydrated: boolean

  // Actions
  addItem: (product: CartProduct, quantity?: number) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  setHydrated: (state: boolean) => void

  // Computed helpers (as functions to avoid hydration issues)
  getTotalItems: () => number
  getSubtotal: () => number
  getItem: (productId: string, variantId?: string | null) => CartItem | undefined
  isInCart: (productId: string, variantId?: string | null) => boolean

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

      addItem: (product: CartProduct, quantity: number = 1) => {
        const { items } = get()
        const itemKey = makeCartItemKey(product.id, product.variant_id)
        const existingItem = items.find(
          (item) => makeCartItemKey(item.product.id, item.product.variant_id) === itemKey
        )
        const stockQuantity = product.stock_quantity

        if (existingItem) {
          // Update quantity, respecting stock
          const newQuantity = Math.min(
            existingItem.quantity + quantity,
            stockQuantity
          )
          set({
            items: items.map((item) =>
              makeCartItemKey(item.product.id, item.product.variant_id) === itemKey
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

      removeItem: (productId: string, variantId?: string | null) => {
        const itemKey = makeCartItemKey(productId, variantId)
        set({
          items: get().items.filter(
            (item) => makeCartItemKey(item.product.id, item.product.variant_id) !== itemKey
          ),
        })
      },

      updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }

        const { items } = get()
        const itemKey = makeCartItemKey(productId, variantId)
        set({
          items: items.map((item) => {
            if (makeCartItemKey(item.product.id, item.product.variant_id) === itemKey) {
              // Respect stock quantity
              const stockQuantity = item.product.stock_quantity
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

      getItem: (productId: string, variantId?: string | null) => {
        const itemKey = makeCartItemKey(productId, variantId)
        return get().items.find(
          (item) => makeCartItemKey(item.product.id, item.product.variant_id) === itemKey
        )
      },

      isInCart: (productId: string, variantId?: string | null) => {
        const itemKey = makeCartItemKey(productId, variantId)
        return get().items.some(
          (item) => makeCartItemKey(item.product.id, item.product.variant_id) === itemKey
        )
      },

      // Sync local cart to server
      syncWithServer: async (userId: string) => {
        const supabase = createClient()
        const { items } = get()

        // Delete existing cart items for user
        await supabase.from("cart_items").delete().eq("user_id", userId)

        if (items.length === 0) return

        // Insert current cart items with variant support
        const cartItems = items.map((item) => ({
          user_id: userId,
          product_id: item.product.id,
          variant_id: item.product.variant_id || null,
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
            variant_id,
            product:products(id, name, slug, price, stock_quantity, images:product_images(url, is_primary)),
            variant:product_variants(id, sku, price, stock_quantity, options)
          `
          )
          .eq("user_id", userId)

        if (error || !data) return

        const items: CartItem[] = data
          .filter((item) => item.product !== null)
          .map((item) => {
            const p = item.product as any
            const v = item.variant as any
            const primaryImage = p.images?.find((img: any) => img.is_primary === true) || p.images?.[0]

            // Use variant data if available
            const price = v?.price ?? p.price
            const stockQuantity = v?.stock_quantity ?? p.stock_quantity
            const variantOptions = v?.options && typeof v.options === "object" ? v.options : null

            return {
              product: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                price,
                stock_quantity: stockQuantity,
                image: primaryImage?.url || "/images/placeholder-product.png",
                variant_id: item.variant_id || null,
                variant_options: variantOptions,
                variant_sku: v?.sku || null,
              },
              quantity: item.quantity,
            }
          })

        set({ items })
      },

      // Merge server cart with local cart (on login)
      mergeServerCart: async (userId: string) => {
        const supabase = createClient()
        const localItems = get().items

        // Get server cart with variant support
        const { data: serverData } = await supabase
          .from("cart_items")
          .select(
            `
            quantity,
            variant_id,
            product:products(id, name, slug, price, stock_quantity, images:product_images(url, is_primary)),
            variant:product_variants(id, sku, price, stock_quantity, options)
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
          .map((item) => {
            const p = item.product as any
            const v = item.variant as any
            const primaryImage = p.images?.find((img: any) => img.is_primary === true) || p.images?.[0]

            const price = v?.price ?? p.price
            const stockQuantity = v?.stock_quantity ?? p.stock_quantity
            const variantOptions = v?.options && typeof v.options === "object" ? v.options : null

            return {
              product: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                price,
                stock_quantity: stockQuantity,
                image: primaryImage?.url || "/images/placeholder-product.png",
                variant_id: item.variant_id || null,
                variant_options: variantOptions,
                variant_sku: v?.sku || null,
              },
              quantity: item.quantity,
            }
          })

        // Merge: local items take priority, add server items not in local
        const mergedItems = [...localItems]

        for (const serverItem of serverItems) {
          const serverKey = makeCartItemKey(serverItem.product.id, serverItem.product.variant_id)
          const existingIndex = mergedItems.findIndex(
            (item) => makeCartItemKey(item.product.id, item.product.variant_id) === serverKey
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
