"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpecEditor } from "./spec-editor";
import { ImageUploader } from "./image-uploader";
import { slugify } from "@/lib/utils";
import { categories } from "@/lib/data/categories";
import type { ProductFormData } from "@/lib/actions/admin-products";
import type { Product, ProductBadge } from "@/lib/db/schema";

const topCategories = categories.filter((c) => c.parent_id === null);
const subCategories = categories.filter((c) => c.parent_id !== null);

interface ProductFormProps {
  initial?: Product;
  action: (data: ProductFormData) => Promise<{ error?: string }>;
  submitLabel: string;
}

export function ProductForm({ initial, action, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(initial?.subcategory_id ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(String(initial?.old_price ?? ""));
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [stock, setStock] = useState(String(initial?.stock ?? "0"));
  const [badge, setBadge] = useState<ProductBadge | "">(initial?.badge ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [specs, setSpecs] = useState<Record<string, string>>(initial?.specs ?? {});
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!initial) setSlug(slugify(e.target.value));
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);

    const data: ProductFormData = {
      name,
      slug,
      category_id: categoryId,
      subcategory_id: subcategoryId || undefined,
      price: Number(price),
      old_price: oldPrice ? Number(oldPrice) : undefined,
      brand,
      stock: Number(stock),
      badge: badge || null,
      is_active: isActive,
      description,
      specs,
      images,
    };

    const result = await action(data);
    if (result?.error) {
      setServerError(result.error);
      setSubmitting(false);
    }
    // Si pas d'erreur, `action` redirige via redirect()
  }

  const filteredSubs = subCategories.filter((s) => s.parent_id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {serverError ? (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" value={name} onChange={handleNameChange} required />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            pattern="[a-z0-9-]+"
          />
        </div>

        <div>
          <Label htmlFor="brand">Marque</Label>
          <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}
            required
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              {topCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredSubs.length > 0 ? (
          <div>
            <Label htmlFor="subcategory">Sous-catégorie</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="Optionnel" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="price">Prix (FCFA)</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="old-price">Ancien prix (FCFA)</Label>
          <Input
            id="old-price"
            type="number"
            min={0}
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            placeholder="Optionnel"
          />
        </div>

        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="badge">Badge</Label>
          <Select value={badge} onValueChange={(v) => setBadge(v as ProductBadge | "")}>
            <SelectTrigger id="badge">
              <SelectValue placeholder="Aucun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              <SelectItem value="Nouveau">Nouveau</SelectItem>
              <SelectItem value="Populaire">Populaire</SelectItem>
              <SelectItem value="Promo">Promo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <input
            id="is-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4"
          />
          <Label htmlFor="is-active" className="cursor-pointer">
            Produit actif (visible en boutique)
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      <div>
        <Label className="mb-3 block">Spécifications techniques</Label>
        <SpecEditor specs={specs} onChange={setSpecs} />
      </div>

      <div>
        <Label className="mb-3 block">Images</Label>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
