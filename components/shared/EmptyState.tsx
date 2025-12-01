import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ShoppingCart,
  Heart,
  Package,
  Search,
  type LucideIcon,
} from "lucide-react"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// Pre-built variants

function EmptyCart({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <EmptyState
      icon={<ShoppingCart className="size-8" />}
      title="Votre panier est vide"
      description="Parcourez nos produits et ajoutez vos articles favoris au panier."
      action={{
        label: "Voir les produits",
        href: "/products",
      }}
      className={className}
      {...props}
    />
  )
}

function EmptyWishlist({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <EmptyState
      icon={<Heart className="size-8" />}
      title="Votre liste de souhaits est vide"
      description="Sauvegardez vos produits favoris pour les retrouver facilement."
      action={{
        label: "Découvrir les produits",
        href: "/products",
      }}
      className={className}
      {...props}
    />
  )
}

function EmptyOrders({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <EmptyState
      icon={<Package className="size-8" />}
      title="Aucune commande"
      description="Vous n'avez pas encore passé de commande. Commencez vos achats dès maintenant !"
      action={{
        label: "Commencer mes achats",
        href: "/products",
      }}
      className={className}
      {...props}
    />
  )
}

interface NoSearchResultsProps extends React.ComponentProps<"div"> {
  query?: string
}

function NoSearchResults({
  query,
  className,
  ...props
}: NoSearchResultsProps) {
  return (
    <EmptyState
      icon={<Search className="size-8" />}
      title="Aucun résultat"
      description={
        query
          ? `Aucun produit ne correspond à "${query}". Essayez avec d'autres termes.`
          : "Aucun produit trouvé. Essayez avec d'autres critères de recherche."
      }
      action={{
        label: "Voir tous les produits",
        href: "/products",
      }}
      className={className}
      {...props}
    />
  )
}

export {
  EmptyState,
  EmptyCart,
  EmptyWishlist,
  EmptyOrders,
  NoSearchResults,
}
