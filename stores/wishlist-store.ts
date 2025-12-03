import { create } from "zustand"
import type { WishlistProduct } from "@/actions/wishlist"

interface WishlistStore {
  items: WishlistProduct[]
  isLoading: boolean
  isHydrated: boolean

  // Actions
  setItems: (items: WishlistProduct[]) => void
  addItem: (product: WishlistProduct) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  setLoading: (loading: boolean) => void
  setHydrated: (state: boolean) => void

  // Computed helpers
  isInWishlist: (productId: string) => boolean
  getItemCount: () => number
}

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
  items: [],
  isLoading: false,
  isHydrated: false,

  setItems: (items: WishlistProduct[]) => {
    set({ items, isHydrated: true })
  },

  addItem: (product: WishlistProduct) => {
    const { items } = get()
    // Check if already exists
    if (items.some((item) => item.id === product.id)) {
      return
    }
    set({ items: [product, ...items] })
  },

  removeItem: (productId: string) => {
    set({
      items: get().items.filter((item) => item.id !== productId),
    })
  },

  clearWishlist: () => {
    set({ items: [] })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setHydrated: (state: boolean) => {
    set({ isHydrated: state })
  },

  isInWishlist: (productId: string) => {
    return get().items.some((item) => item.id === productId)
  },

  getItemCount: () => {
    return get().items.length
  },
}))
