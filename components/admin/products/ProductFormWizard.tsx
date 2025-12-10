"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { ProductFormStepper, type ProductFormStep, getNextStep, getPreviousStep, isLastStep } from "./ProductFormStepper"
import { WizardNavigation } from "./WizardNavigation"
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
  type ProductOptionValue,
  getOptionValueName,
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
  values: unknown
  position: number | null
}

type ProductVariant = {
  id: string
  sku: string
  price: number
  compare_price: number | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  options: unknown
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

interface ProductFormWizardProps {
  product?: Product | null
  categories: Category[]
}

// Helper to parse option values from database
function parseOptionValues(values: unknown): ProductOptionValue[] {
  if (!Array.isArray(values)) return []
  return values as ProductOptionValue[]
}

export function ProductFormWizard({ product, categories }: ProductFormWizardProps) {
  const router = useRouter()
  const isEditing = !!product

  // Wizard state
  const [currentStep, setCurrentStep] = useState<ProductFormStep>("general")
  const [completedSteps, setCompletedSteps] = useState<Set<ProductFormStep>>(new Set())
  const [isValidating, setIsValidating] = useState(false)

  // Form state
  const [images, setImages] = useState<ProductImage[]>(product?.images || [])
  const [hasVariants, setHasVariants] = useState(product?.has_variants ?? false)
  const [productOptions, setProductOptions] = useState<ProductOptionInput[]>(
    product?.options?.map((o) => ({
      id: o.id,
      name: o.name,
      values: parseOptionValues(o.values),
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
      options: (typeof v.options === "object" && v.options !== null
        ? v.options
        : {}) as Record<string, string>,
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
      stock_type:
        (product?.stock_type as "physical" | "dropshipping") || "physical",
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

  const { execute: executeCreate, isExecuting: isCreating } = useAction(
    createProductWithVariants,
    {
      onSuccess: (result) => {
        if (result.data?.success) {
          toast.success("Produit créé avec succès")
          router.push("/admin/products")
        } else if (result.data?.error) {
          toast.error(result.data.error)
        }
      },
      onError: () => {
        toast.error("Une erreur est survenue")
      },
    }
  )

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(
    updateProductWithVariants,
    {
      onSuccess: (result) => {
        if (result.data?.success) {
          toast.success("Produit mis à jour")
          router.push("/admin/products")
        } else if (result.data?.error) {
          toast.error(result.data.error)
        }
      },
      onError: () => {
        toast.error("Une erreur est survenue")
      },
    }
  )

  const { execute: executeAssignImage } = useAction(assignImageToVariant, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Image assignée")
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

  // Step validation
  const validateStep = useCallback(
    async (step: ProductFormStep): Promise<boolean> => {
      setIsValidating(true)

      try {
        switch (step) {
          case "general":
            return await form.trigger(["name", "slug", "description", "brand", "sku", "category_id"])
          case "pricing":
            return await form.trigger(["price", "compare_price", "stock_quantity", "low_stock_threshold", "stock_type"])
          case "variants":
            // Validate options and variants if enabled
            if (hasVariants) {
              if (productOptions.length === 0) {
                toast.error("Ajoutez au moins une option")
                return false
              }
              // Check each option has at least one value
              for (const opt of productOptions) {
                if (opt.values.length === 0) {
                  toast.error(`L'option "${opt.name}" doit avoir au moins une valeur`)
                  return false
                }
              }
              if (productVariants.length === 0) {
                toast.error("Générez ou ajoutez au moins une variante")
                return false
              }
            }
            return true
          case "images":
            // Images are optional
            return true
          case "seo":
            return await form.trigger(["meta_title", "meta_description"])
          case "specs":
            return await form.trigger(["specifications"])
          default:
            return true
        }
      } finally {
        setIsValidating(false)
      }
    },
    [form, hasVariants, productOptions, productVariants]
  )

  // Navigation handlers
  const goToNext = useCallback(async () => {
    const isValid = await validateStep(currentStep)
    if (!isValid) return

    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    const nextStep = getNextStep(currentStep)
    if (nextStep) {
      setCurrentStep(nextStep)
    }
  }, [currentStep, validateStep])

  const goToPrevious = useCallback(() => {
    const prevStep = getPreviousStep(currentStep)
    if (prevStep) {
      setCurrentStep(prevStep)
    }
  }, [currentStep])

  const goToStep = useCallback(
    (step: ProductFormStep) => {
      // Allow going back to completed or previous steps
      setCurrentStep(step)
    },
    []
  )

  const onSubmit = async (data: AdminProductWithVariantsInput) => {
    // Only allow submission on the last step
    if (!isLastStep(currentStep)) {
      return
    }

    // Validate current step first
    const isValid = await validateStep(currentStep)
    if (!isValid) return

    // Prepare option values for submission - extract names from ColorValue objects
    const preparedOptions = productOptions.map((opt) => ({
      ...opt,
      values: opt.values.map((v) => getOptionValueName(v)),
    }))

    const submitData = {
      ...data,
      has_variants: hasVariants,
      options: hasVariants ? preparedOptions : [],
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
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, variant_id: variantId } : img
        )
      )
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "general":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
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
                      Généré automatiquement à partir du nom
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
                        placeholder="Description détaillée du produit..."
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
                        <Input
                          placeholder="Apple"
                          {...field}
                          value={field.value || ""}
                        />
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
                        <Input
                          placeholder="IPH-15-PM-256"
                          {...field}
                          value={field.value || ""}
                        />
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
                    <FormLabel>Catégorie</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une catégorie" />
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
        )

      case "pricing":
        return (
          <>
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
                            value={(field.value as number) || ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
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
                        <FormLabel>Prix barré (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            value={
                              (field.value as number | null | undefined) || ""
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
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
                        <FormLabel>Quantité en stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={(field.value as number) || 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
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
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>Alerte stock bas</FormDescription>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="physical">Physique</SelectItem>
                            <SelectItem value="dropshipping">
                              Dropshipping
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )

      case "variants":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configuration des variantes</CardTitle>
              <CardDescription>
                Définissez les options et variantes de ce produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle has_variants */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Ce produit a des variantes</Label>
                  <p className="text-sm text-muted-foreground">
                    Activez pour gérer plusieurs versions (couleur, taille,
                    stockage...)
                  </p>
                </div>
                <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
              </div>

              {hasVariants && (
                <>
                  {/* Options Editor */}
                  <div className="space-y-2">
                    <Label className="text-base">Options</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Définissez les types d'options (ex: Couleur, Taille) et
                      leurs valeurs
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
                      Gérez le SKU, prix et stock de chaque variante
                    </p>
                    <ProductVariantsEditor
                      options={productOptions}
                      variants={productVariants}
                      onChange={setProductVariants}
                      productName={form.watch("name")}
                    />
                  </div>
                </>
              )}

              {!hasVariants && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Activez les variantes pour configurer plusieurs versions de ce
                  produit.
                </p>
              )}
            </CardContent>
          </Card>
        )

      case "images":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Ajoutez des images pour votre produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProductImageUpload
                productId={product?.id}
                images={images}
                onImagesChange={setImages}
                maxImages={10}
              />

              {/* Variant Image Assignment (only in edit mode with existing product) */}
              {isEditing &&
                images.length > 0 &&
                hasVariants &&
                productVariants.some((v) => v.id) && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-base">Images par variante</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Assignez des images spécifiques à chaque variante
                    </p>
                    <VariantImageAssignment
                      images={images}
                      variants={productVariants}
                      onAssign={handleAssignImage}
                    />
                  </div>
                )}
            </CardContent>
          </Card>
        )

      case "seo":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Référencement (SEO)</CardTitle>
              <CardDescription>
                Optimisez le référencement de votre produit
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
                      {field.value?.length || 0}/60 caractères
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
                      {field.value?.length || 0}/160 caractères
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )

      case "specs":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Spécifications techniques</CardTitle>
              <CardDescription>
                Ajoutez les caractéristiques techniques du produit
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
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Modifier le produit" : "Nouveau produit"}
        description={
          isEditing
            ? `Modification de "${product?.name}"`
            : "Créer un nouveau produit"
        }
      >
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </PageHeader>

      {/* Stepper */}
      <ProductFormStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
        className="mb-6"
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form (except in textareas)
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.preventDefault()
            }
          }}
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {renderStepContent()}

              {/* Navigation */}
              <WizardNavigation
                currentStep={currentStep}
                onPrevious={goToPrevious}
                onNext={goToNext}
                isValidating={isValidating}
                isSubmitting={isLoading}
              />
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
                            Affiché sur la page d'accueil
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

              {/* Quick Save Card (visible on last step) */}
              {isLastStep(currentStep) && (
                <Card>
                  <CardContent className="pt-6">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditing ? "Mise à jour..." : "Création..."}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isEditing ? "Mettre à jour" : "Créer le produit"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Progress indicator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Complété</span>
                      <span className="font-medium">
                        {completedSteps.size}/6 étapes
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(completedSteps.size / 6) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
