import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price < 0) {
    console.error("[formatPrice] Prix invalide:", price);
    return "—";
  }
  return price.toLocaleString("fr-FR");
}
