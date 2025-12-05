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
import { ProductOptionsEditor } from "./ProductOptionsEditor"
import { ProductVariantsEditor } from "./ProductVariantsEditor"
import { VariantImageAssignment } from "./VariantImageAssignment"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import {
  createProductWithVariants,
  updateProductWithVariants,
  assignImageToVariant,
} from "@/actions/admin/products"
import {
  adminProductWithVariantsSchema,
  generateSlug,
  type AdminProductWithVariantsInput,
  type ProductOptionInput,
  type ProductVariantInput,
} from "@/lib/validations/admin"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"

type ProductImage = {
  id: string
  url: string
  alt: string | null
  position: number | null
  is_primary: boolean | null
  variant_id?: string | null
}

type ProductOption = {
  id: string
  name: string
  values: unknown // Json type from database, will be parsed as string[]
  position: number | null
}

type ProductVariant = {
  id: string
  sku: string
  price: number
  compare_price: number | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  options: unknown // Json type from database, will be parsed as Record<string, string>
  position: number | null
  is_active: boolean | null
}

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  category?: { id: string; name: string; slug: string } | null
  images?: ProductImage[] | null
  options?: ProductOption[] | null
  variants?: ProductVariant[] | null
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

  const [images, setImages] = useState<ProductImage[]>(product?.images || [])
  const [hasVariants, setHasVariants] = useState(product?.has_variants ?? false)
  const [productOptions, setProductOptions] = useState<ProductOptionInput[]>(
    product?.options?.map((o) => ({
      id: o.id,
      name: o.name,
      values: Array.isArray(o.values) ? o.values as string[] : [],
      position: o.position ?? 0,
    })) || []
  )
  const [productVariants, setProductVariants] = useState<ProductVariantInput[]>(
    product?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      compare_price: v.compare_price,
      stock_quantity: v.stock_quantity ?? 0,
      low_stock_threshold: v.low_stock_threshold ?? 5,
      options: (typeof v.options === "object" && v.options !== null ? v.options : {}) as Record<string, string>,
      position: v.position ?? 0,
      is_active: v.is_active ?? true,
    })) || []
  )

  const form = useForm<AdminProductWithVariantsInput>({
    resolver: zodResolver(adminProductWithVariantsSchema),
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
      has_variants: product?.has_variants ?? false,
      options: [],
      variants: [],
    },
  })

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createProductWithVariants, {
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

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateProductWithVariants, {
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

  const { execute: executeAssignImage } = useAction(assignImageToVariant, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Image assignee")
      } else if (result.data?.error) {
        toast.error(result.data.error)
      }
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

  const onSubmit = (data: AdminProductWithVariantsInput) => {
    // Include options and variants from state
    const submitData = {
      ...data,
      has_variants: hasVariants,
      options: hasVariants ? productOptions : [],
      variants: hasVariants ? productVariants : [],
    }

    if (isEditing && product) {
      executeUpdate({ ...submitData, id: product.id })
    } else {
      executeCreate(submitData)
    }
  }

  const handleAssignImage = (imageId: string, variantId: string | null) => {
    if (isEditing && product) {
      executeAssignImage({ imageId, variantId })
      // Update local state
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, variant_id: variantId } : img
        )
      )
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="pricing">Prix & Stock</TabsTrigger>
                  <TabsTrigger value="variants">Variantes</TabsTrigger>
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

                {/* Variants Tab */}
                <TabsContent value="variants" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration des variantes</CardTitle>
                      <CardDescription>
                        Definissez les options et variantes de ce produit
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Toggle has_variants */}
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Ce produit a des variantes</Label>
                          <p className="text-sm text-muted-foreground">
                            Activez pour gerer plusieurs versions (couleur, taille, stockage...)
                          </p>
                        </div>
                        <Switch
                          checked={hasVariants}
                          onCheckedChange={setHasVariants}
                        />
                      </div>

                      {hasVariants && (
                        <>
                          {/* Options Editor */}
                          <div className="space-y-2">
                            <Label className="text-base">Options</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                              Definissez les types d'options (ex: Couleur, Taille) et leurs valeurs
                            </p>
                            <ProductOptionsEditor
                              options={productOptions}
                              onChange={setProductOptions}
                            />
                          </div>

                          {/* Variants Editor */}
                          <div className="space-y-2 pt-4 border-t">
                            <Label className="text-base">Variantes</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                              Gerez le SKU, prix et stock de chaque variante
                            </p>
                            <ProductVariantsEditor
                              options={productOptions}
                              variants={productVariants}
                              onChange={setProductVariants}
                              productName={form.watch("name")}
                            />
                          </div>

                          {/* Variant Image Assignment (only in edit mode with existing product) */}
                          {isEditing && images.length > 0 && productVariants.some((v) => v.id) && (
                            <div className="space-y-2 pt-4 border-t">
                              <Label className="text-base">Images par variante</Label>
                              <p className="text-sm text-muted-foreground mb-4">
                                Assignez des images specifiques a chaque variante
                              </p>
                              <VariantImageAssignment
                                images={images}
                                variants={productVariants}
                                onAssign={handleAssignImage}
                              />
                            </div>
                          )}
                        </>
                      )}

                      {!hasVariants && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Activez les variantes pour configurer plusieurs versions de ce produit.
                        </p>
                      )}
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
