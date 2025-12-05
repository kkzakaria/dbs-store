export type { Database, Json } from './database.types'

import type { Database } from './database.types'

// Table types shortcuts
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Enum types
export type UserRole = Database['public']['Enums']['user_role']
export type StockType = Database['public']['Enums']['stock_type']
export type OrderStatus = Database['public']['Enums']['order_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type PromoType = Database['public']['Enums']['promo_type']
export type LoyaltyType = Database['public']['Enums']['loyalty_type']

// Common entity types
export type User = Tables<'users'>
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type ProductImage = Tables<'product_images'>
export type Address = Tables<'addresses'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Review = Tables<'reviews'>
export type Promotion = Tables<'promotions'>
export type ShippingZone = Tables<'shipping_zones'>
export type ShippingPartner = Tables<'shipping_partners'>
export type Wishlist = Tables<'wishlist'>
export type LoyaltyHistory = Tables<'loyalty_history'>
export type Store = Tables<'stores'>
export type ProductOption = Tables<'product_options'>
export type ProductVariant = Tables<'product_variants'>

// Product with relations
export type ProductWithCategory = Product & {
  category: Category | null
}

export type ProductWithImages = Product & {
  images: ProductImage[]
}

export type ProductFull = Product & {
  category: Category | null
  images: ProductImage[]
}

// Product with variants
export type ProductWithVariants = Product & {
  category: Category | null
  images: ProductImage[]
  options: ProductOption[]
  variants: ProductVariant[]
}

// Order with relations
export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product
  })[]
}

// Simplified product for cart (client-side)
export type CartProduct = {
  id: string
  name: string
  slug: string
  price: number
  image: string
  stock_quantity: number
  variant_id?: string | null
  variant_options?: Record<string, string> | null
  variant_sku?: string | null
}

// Cart item type (for client-side cart)
export type CartItem = {
  product: CartProduct
  quantity: number
}
