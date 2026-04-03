"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "./image-uploader";
import { slugify } from "@/lib/utils";
import {
  createCategory,
  updateCategory,
} from "@/lib/actions/admin-categories";
import type { Category } from "@/lib/db/schema";
import type { CategoryFormData } from "@/lib/actions/admin-categories";
import { CATEGORY_ICONS, type CategoryIcon } from "@/lib/data/category-icons";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Category;
  topLevelCategories: Category[];
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  topLevelCategories,
}: CategoryFormDialogProps) {
  const router = useRouter();
  const isEditing = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [icon, setIcon] = useState<CategoryIcon | "">(initial?.icon as CategoryIcon ?? "");
  const [image, setImage] = useState<string[]>(
    initial?.image ? [initial.image] : []
  );
  const [parentId, setParentId] = useState<string | null>(
    initial?.parent_id ?? null
  );
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens/closes or initial changes
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlug(initial?.slug ?? "");
      setIcon(initial?.icon ?? "");
      setImage(initial?.image ? [initial.image] : []);
      setParentId(initial?.parent_id ?? null);
      setOrder(initial?.order ?? 0);
      setError(null);
    }
  }, [open, initial]);

  function handleNameChange(value: string) {
    setName(value);
    if (!isEditing) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data: CategoryFormData = {
        name,
        slug,
        icon: icon as CategoryIcon,
        image: image[0] || null,
        parent_id: parentId,
        order,
      };

      const result = isEditing
        ? await updateCategory(initial.id, data)
        : await createCategory(data);

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  const parentOptions = topLevelCategories.filter(
    (c) => !isEditing || c.id !== initial.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nom</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
            />
          </div>

          <div className="space-y-2">
            <Label>Icône Lucide</Label>
            <Select value={icon} onValueChange={(v) => setIcon(v as CategoryIcon)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une icône" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ICONS.map((ic) => (
                  <SelectItem key={ic} value={ic}>
                    {ic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <ImageUploader images={image} onChange={setImage} />
          </div>

          <div className="space-y-2">
            <Label>Parent</Label>
            <Select
              value={parentId ?? "__none__"}
              onValueChange={(v) =>
                setParentId(v === "__none__" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  Aucun (top-level)
                </SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-order">Ordre</Label>
            <Input
              id="cat-order"
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Enregistrement..."
                : isEditing
                  ? "Mettre à jour"
                  : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
