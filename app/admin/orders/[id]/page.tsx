import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, Truck, CreditCard, MapPin, User, Phone, Mail } from "lucide-react"
import { getAdminOrder } from "@/actions/admin/orders"
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/validations/admin"
import { OrderStatusActions } from "@/components/admin/orders/OrderStatusActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/config"
import { cn } from "@/lib/utils"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const result = await getAdminOrder({ id })

  if (!result.data || "error" in result.data) {
    notFound()
  }

  const { order } = result.data
  if (!order) {
    notFound()
  }

  const shippingAddress = order.shipping_address as {
    full_name?: string
    phone?: string
    address_line?: string
    city?: string
    commune?: string
    landmark?: string
  } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Commande {order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {order.created_at && new Date(order.created_at).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm", order.status && statusColors[order.status])}>
            {order.status && ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <Badge className={cn("text-sm", order.payment_status && paymentStatusColors[order.payment_status])}>
            <CreditCard className="mr-1 h-3 w-3" />
            {order.payment_status && PAYMENT_STATUS_LABELS[order.payment_status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => {
                  const snapshot = item.product_snapshot as {
                    name?: string
                    price?: number
                    image_url?: string
                  } | null
                  const product = item.product as {
                    id: string
                    name: string
                    slug: string
                    images?: Array<{ url: string; is_primary: boolean | null }>
                  } | null
                  const imageUrl = product?.images?.find(img => img.is_primary)?.url || product?.images?.[0]?.url

                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={snapshot?.name || "Produit"}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{snapshot?.name || "Produit inconnu"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.unit_price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right font-medium">
                        {formatPrice(item.total_price)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator className="my-4" />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise {order.promo_code && `(${order.promo_code})`}</span>
                    <span>-{formatPrice(order.discount ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Livraison</span>
                  <span>{(order.shipping_fee ?? 0) > 0 ? formatPrice(order.shipping_fee ?? 0) : "Gratuit"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking */}
          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Suivi de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Numéro de suivi: <span className="font-mono font-medium">{order.tracking_number}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <OrderStatusActions order={order} />

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.user?.full_name || "Client inconnu"}</span>
              </div>
              {order.user?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.user.phone}`} className="text-primary hover:underline">
                    {order.user.phone}
                  </a>
                </div>
              )}
              {order.user?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${order.user.email}`} className="text-primary hover:underline">
                    {order.user.email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingAddress ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{shippingAddress.full_name}</p>
                  <p>{shippingAddress.address_line}</p>
                  <p>
                    {shippingAddress.commune && `${shippingAddress.commune}, `}
                    {shippingAddress.city}
                  </p>
                  {shippingAddress.landmark && (
                    <p className="text-muted-foreground">Repère: {shippingAddress.landmark}</p>
                  )}
                  {shippingAddress.phone && (
                    <p className="mt-2">
                      <Phone className="mr-1 inline h-3 w-3" />
                      {shippingAddress.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune adresse</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Méthode</span>
                <span className="capitalize">{order.payment_method?.replace("_", " ") || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono">{order.payment_ref || "-"}</span>
              </div>
              {(order.loyalty_points_earned ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Points gagnés</span>
                  <span>+{order.loyalty_points_earned}</span>
                </div>
              )}
              {(order.loyalty_points_used ?? 0) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Points utilisés</span>
                  <span>-{order.loyalty_points_used}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
