"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createCategory, updateCategory } from "@/actions/admin/categories"
import { adminCategorySchema, generateSlug, type AdminCategoryInput } from "@/lib/validations/admin"
import { toast } from "sonner"
import type { Database } from "@/types/database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  categories: Array<{ id: string; name: string; parent_id: string | null }>
  onSuccess?: () => void
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  categories,
  onSuccess,
}: CategoryFormDialogProps) {
  const isEditing = !!category

  const form = useForm<AdminCategoryInput>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image_url: "",
      parent_id: null,
      position: 0,
      is_active: true,
    },
  })

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          image_url: category.image_url || "",
          parent_id: category.parent_id || null,
          position: category.position || 0,
          is_active: category.is_active ?? true,
        })
      } else {
        form.reset({
          name: "",
          slug: "",
          description: "",
          image_url: "",
          parent_id: null,
          position: 0,
          is_active: true,
        })
      }
    }
  }, [open, category, form])

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createCategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Categorie creee avec succes")
        onOpenChange(false)
        onSuccess?.()
      } else if (result.data?.error) {
        toast.error(result.data.error)
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue")
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateCategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success("Categorie mise a jour avec succes")
        onOpenChange(false)
        onSuccess?.()
      } else if (result.data?.error) {
        toast.error(result.data.error)
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue")
    },
  })

  const isLoading = isCreating || isUpdating

  const onSubmit = (data: AdminCategoryInput) => {
    if (isEditing && category) {
      executeUpdate({ ...data, id: category.id })
    } else {
      executeCreate(data)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    form.setValue("name", name)
    const currentSlug = form.getValues("slug")
    if (!currentSlug || !isEditing) {
      form.setValue("slug", generateSlug(name))
    }
  }

  // Filter out current category and its children from parent options
  const parentOptions = categories.filter((c) => {
    if (!category) return true
    if (c.id === category.id) return false
    // Also filter out children of the current category
    let parent = categories.find((p) => p.id === c.parent_id)
    while (parent) {
      if (parent.id === category.id) return false
      parent = categories.find((p) => p.id === parent?.parent_id)
    }
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la categorie" : "Nouvelle categorie"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la categorie"
              : "Creez une nouvelle categorie pour vos produits"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Smartphones"
                    />
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ex: smartphones" />
                  </FormControl>
                  <FormDescription>URL de la categorie</FormDescription>
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
                      {...field}
                      value={field.value || ""}
                      placeholder="Description de la categorie..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l&apos;image</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="https://..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorie parente</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune (racine)</SelectItem>
                        {parentOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={typeof field.value === 'number' ? field.value : 0}
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
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      La categorie sera visible sur le site
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
