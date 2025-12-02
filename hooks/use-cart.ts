"use client"

import { useEffect, useMemo } from "react"
import { useCartStore, useCartHydration } from "@/stores/cart-store"
import { formatPrice } from "@/lib/config"
import type { CartProduct, CartItem } from "@/types"

interface UseCartReturn {
  // State
  items: CartItem[]
  isOpen: boolean
  isHydrated: boolean

  // Computed
  totalItems: number
  subtotal: number
  formattedSubtotal: string
  hasItems: boolean

  // Actions
  addItem: (product: CartProduct, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void

  // Helpers
  getItem: (productId: string) => CartItem | undefined
  isInCart: (productId: string) => boolean

  // Server sync
  syncWithServer: (userId: string) => Promise<void>
  loadFromServer: (userId: string) => Promise<void>
  mergeServerCart: (userId: string) => Promise<void>
}

export function useCart(): UseCartReturn {
  // Hydrate store on mount
  const isHydrated = useCartHydration()

  // Select store values
  const items = useCartStore((state) => state.items)
  const isOpen = useCartStore((state) => state.isOpen)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const openCart = useCartStore((state) => state.openCart)
  const closeCart = useCartStore((state) => state.closeCart)
  const getItem = useCartStore((state) => state.getItem)
  const isInCart = useCartStore((state) => state.isInCart)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const syncWithServer = useCartStore((state) => state.syncWithServer)
  const loadFromServer = useCartStore((state) => state.loadFromServer)
  const mergeServerCart = useCartStore((state) => state.mergeServerCart)

  // Computed values with memoization
  const totalItems = useMemo(() => getTotalItems(), [items, getTotalItems])
  const subtotal = useMemo(() => getSubtotal(), [items, getSubtotal])
  const formattedSubtotal = useMemo(() => formatPrice(subtotal), [subtotal])
  const hasItems = items.length > 0

  return {
    // State
    items,
    isOpen,
    isHydrated,

    // Computed
    totalItems,
    subtotal,
    formattedSubtotal,
    hasItems,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,

    // Helpers
    getItem,
    isInCart,

    // Server sync
    syncWithServer,
    loadFromServer,
    mergeServerCart,
  }
}

// Hook for syncing cart with server when user logs in
export function useCartSync(userId: string | null | undefined) {
  const mergeServerCart = useCartStore((state) => state.mergeServerCart)
  const syncWithServer = useCartStore((state) => state.syncWithServer)
  const isHydrated = useCartStore((state) => state.isHydrated)

  useEffect(() => {
    if (!userId || !isHydrated) return

    // Merge local cart with server cart on login
    mergeServerCart(userId)
  }, [userId, isHydrated, mergeServerCart])

  // Return sync function for manual syncing (e.g., before checkout)
  return {
    sync: () => (userId ? syncWithServer(userId) : Promise.resolve()),
  }
}
