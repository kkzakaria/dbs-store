// App configuration
export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'DBS Store',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description: 'Boutique en ligne de produits electroniques premium',
  },

  // Currency settings
  currency: {
    code: 'XOF',
    symbol: 'FCFA',
    locale: 'fr-CI',
  },

  // Loyalty program
  loyalty: {
    pointsPerUnit: 1000, // 1 point per 1000 FCFA
    pointValue: 100, // 1 point = 100 FCFA discount
  },

  // Stock thresholds
  stock: {
    lowThreshold: 5,
    outOfStockThreshold: 0,
  },

  // Phone format (Cote d'Ivoire)
  phone: {
    countryCode: '+225',
    pattern: /^\+225\d{10}$/,
    placeholder: '+225 XX XX XX XX XX',
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 50,
  },
} as const

// Format price in XOF
export function formatPrice(price: number): string {
  return new Intl.NumberFormat(config.currency.locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' ' + config.currency.symbol
}

// Format phone number
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+225 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  }
  return phone
}

// Calculate loyalty points from order total
export function calculateLoyaltyPoints(total: number): number {
  return Math.floor(total / config.loyalty.pointsPerUnit)
}

// Calculate discount from loyalty points
export function calculatePointsDiscount(points: number): number {
  return points * config.loyalty.pointValue
}
