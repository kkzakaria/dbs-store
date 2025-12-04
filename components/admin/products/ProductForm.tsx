"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ProductSpecsEditor } from "./ProductSpecsEditor"
import { ProductImageUpload } from "./ProductImageUpload"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import { createProduct, updateProduct } from "@/actions/admin/products"
import { adminProductSchema, generateSlug, type AdminProductInput } from "@/lib/validations/admin"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: { id: string; name: string; slug: string } | null
  images?: Array<{
    id: string
    url: string
    alt: string | null
    position: number | null
    is_primary: boolean | null
  }> | null
}

type Category = {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [images, setImages] = useState(product?.images || [])

  const form = useForm<AdminProductInput>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      brand: product?.brand || "",
      sku: product?.sku || "",
      price: product?.price || 0,
      compare_price: product?.compare_price || undefined,
      category_id: product?.category_id || undefined,
      stock_quantity: product?.stock_quantity || 0,
      stock_type: (product?.stock_type as "physical" | "dropshipping") || "physical",
      low_stock_threshold: product?.low_stock_threshold || 5,
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      meta_title: product?.meta_title || "",
      meta_description: product?.meta_description || "",
      specifications: (product?.specifications as Record<string, string>) || {},
    },
  })

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createProduct, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Produit cree avec succes")
        router.push("/admin/products")
      } else if (result.data?.error) {
        toast.error(result.data.error)
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue")
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateProduct, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Produit mis a jour")
        router.push("/admin/products")
      } else if (result.data?.error) {
        toast.error(result.data.error)
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue")
    },
  })

  const isLoading = isCreating || isUpdating

  // Auto-generate slug from name
  const watchName = form.watch("name")
  useEffect(() => {
    if (!isEditing && watchName) {
      const slug = generateSlug(watchName)
      form.setValue("slug", slug)
    }
  }, [watchName, isEditing, form])

  const onSubmit = (data: AdminProductInput) => {
    if (isEditing && product) {
      executeUpdate({ ...data, id: product.id })
    } else {
      executeCreate(data)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Modifier le produit" : "Nouveau produit"}
        description={isEditing ? `Modification de "${product?.name}"` : "Creer un nouveau produit"}
      >
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="pricing">Prix & Stock</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="specs">Specs</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations generales</CardTitle>
                      <CardDescription>
                        Les informations de base du produit
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du produit *</FormLabel>
                            <FormControl>
                              <Input placeholder="iPhone 15 Pro Max" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug (URL)</FormLabel>
                            <FormControl>
                              <Input placeholder="iphone-15-pro-max" {...field} />
                            </FormControl>
                            <FormDescription>
                              Genere automatiquement a partir du nom
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Description detaillee du produit..."
                                className="min-h-[120px]"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marque</FormLabel>
                              <FormControl>
                                <Input placeholder="Apple" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input placeholder="IPH-15-PM-256" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categorie</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectionner une categorie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pricing & Stock Tab */}
                <TabsContent value="pricing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prix</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix de vente (FCFA) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={field.value as number || ""}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="compare_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix barre (FCFA)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={(field.value as number | null | undefined) || ""}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormDescription>
                                Ancien prix pour afficher une remise
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Stock</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="stock_quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantite en stock</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  value={(field.value as number) || 0}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="low_stock_threshold"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seuil d'alerte</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  value={(field.value as number) || 5}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormDescription>
                                Alerte stock bas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stock_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de stock</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="physical">Physique</SelectItem>
                                  <SelectItem value="dropshipping">Dropshipping</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Referencement (SEO)</CardTitle>
                      <CardDescription>
                        Optimisez le referencement de votre produit
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="meta_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titre SEO</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Titre pour les moteurs de recherche"
                                maxLength={60}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              {(field.value?.length || 0)}/60 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="meta_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description SEO</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Description pour les moteurs de recherche"
                                maxLength={160}
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              {(field.value?.length || 0)}/160 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Specs Tab */}
                <TabsContent value="specs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Specifications techniques</CardTitle>
                      <CardDescription>
                        Ajoutez les caracteristiques techniques du produit
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="specifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ProductSpecsEditor
                                value={field.value || {}}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>
                    Ajoutez des images pour votre produit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductImageUpload
                    productId={product?.id}
                    images={images}
                    onImagesChange={setImages}
                    maxImages={10}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Statut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Actif</FormLabel>
                          <FormDescription>
                            Visible sur la boutique
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Produit vedette</FormLabel>
                          <FormDescription>
                            Affiche sur la page d'accueil
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card>
                <CardContent className="pt-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditing ? "Mise a jour..." : "Creation..."}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isEditing ? "Mettre a jour" : "Creer le produit"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
