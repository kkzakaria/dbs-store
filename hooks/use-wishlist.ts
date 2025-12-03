"use client"

import * as React from "react"
import { toast } from "sonner"
import { useWishlistStore } from "@/stores/wishlist-store"
import {
  getWishlist,
  toggleWishlist as toggleWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  type WishlistProduct,
} from "@/actions/wishlist"
import { useUser } from "./use-user"

/**
 * Hook to manage wishlist state and actions
 */
export function useWishlist() {
  const { user } = useUser()

  const items = useWishlistStore((state) => state.items)
  const isLoading = useWishlistStore((state) => state.isLoading)
  const isHydrated = useWishlistStore((state) => state.isHydrated)
  const setItems = useWishlistStore((state) => state.setItems)
  const addItem = useWishlistStore((state) => state.addItem)
  const removeItem = useWishlistStore((state) => state.removeItem)
  const setLoading = useWishlistStore((state) => state.setLoading)
  const setHydrated = useWishlistStore((state) => state.setHydrated)
  const storeIsInWishlist = useWishlistStore((state) => state.isInWishlist)
  const getItemCount = useWishlistStore((state) => state.getItemCount)

  // Load wishlist from server on user change
  React.useEffect(() => {
    async function loadWishlist() {
      if (!user) {
        setItems([])
        setHydrated(true)
        return
      }

      setLoading(true)
      try {
        const { items: serverItems } = await getWishlist()
        setItems(serverItems.map((item) => item.product))
      } catch (error) {
        console.error("Error loading wishlist:", error)
      } finally {
        setLoading(false)
      }
    }

    loadWishlist()
  }, [user, setItems, setLoading, setHydrated])

  // Check if a product is in wishlist
  const isInWishlist = React.useCallback(
    (productId: string): boolean => {
      return storeIsInWishlist(productId)
    },
    [storeIsInWishlist]
  )

  // Toggle product in wishlist
  const toggleWishlist = React.useCallback(
    async (product: WishlistProduct): Promise<boolean> => {
      if (!user) {
        toast.error("Connectez-vous pour gérer vos favoris")
        return false
      }

      const wasInWishlist = storeIsInWishlist(product.id)

      // Optimistic update
      if (wasInWishlist) {
        removeItem(product.id)
      } else {
        addItem(product)
      }

      try {
        const result = await toggleWishlistAction({ productId: product.id })

        if (result?.data?.error) {
          // Revert on error
          if (wasInWishlist) {
            addItem(product)
          } else {
            removeItem(product.id)
          }
          toast.error(result.data.error)
          return false
        }

        // Show success message
        if (result?.data?.action === "added") {
          toast.success("Ajouté aux favoris")
        } else if (result?.data?.action === "removed") {
          toast.success("Retiré des favoris")
        }

        return true
      } catch (error) {
        // Revert on error
        if (wasInWishlist) {
          addItem(product)
        } else {
          removeItem(product.id)
        }
        toast.error("Erreur lors de la mise à jour des favoris")
        return false
      }
    },
    [user, storeIsInWishlist, addItem, removeItem]
  )

  // Remove from wishlist
  const removeFromWishlist = React.useCallback(
    async (productId: string): Promise<boolean> => {
      if (!user) {
        toast.error("Connectez-vous pour gérer vos favoris")
        return false
      }

      // Find the product before removing (for potential revert)
      const product = items.find((item) => item.id === productId)

      // Optimistic update
      removeItem(productId)

      try {
        const result = await removeFromWishlistAction({ productId })

        if (result?.data?.error) {
          // Revert on error
          if (product) {
            addItem(product)
          }
          toast.error(result.data.error)
          return false
        }

        toast.success("Retiré des favoris")
        return true
      } catch (error) {
        // Revert on error
        if (product) {
          addItem(product)
        }
        toast.error("Erreur lors de la suppression")
        return false
      }
    },
    [user, items, addItem, removeItem]
  )

  // Refresh wishlist from server
  const refresh = React.useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { items: serverItems } = await getWishlist()
      setItems(serverItems.map((item) => item.product))
    } catch (error) {
      console.error("Error refreshing wishlist:", error)
    } finally {
      setLoading(false)
    }
  }, [user, setItems, setLoading])

  return {
    // State
    items,
    isLoading,
    isHydrated,
    itemCount: getItemCount(),
    hasItems: items.length > 0,

    // Actions
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    refresh,
  }
}

/**
 * Hook to check if a specific product is in wishlist
 * More efficient for single product checks
 */
export function useIsInWishlist(productId: string): boolean {
  const isInWishlist = useWishlistStore((state) => state.isInWishlist)
  return isInWishlist(productId)
}
