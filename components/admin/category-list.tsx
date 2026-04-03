"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { CategoryFormDialog } from "./category-form-dialog";
import { deleteCategory } from "@/lib/actions/admin-categories";
import type { Category } from "@/lib/db/schema";

interface CategoryListProps {
  initialCategories: Category[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >(undefined);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const topLevel = initialCategories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    initialCategories.filter((c) => c.parent_id === parentId);

  function handleCreate() {
    setEditingCategory(undefined);
    setFormOpen(true);
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  function handleDeleteClick(category: Category) {
    setDeletingCategory(category);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deletingCategory) return;
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteCategory(deletingCategory.id);

    setDeleting(false);

    if (result.error) {
      setDeleteError(result.error);
      return;
    }

    setDeleteDialogOpen(false);
    setDeletingCategory(null);
    router.refresh();
  }

  if (initialCategories.length === 0) {
    return (
      <div>
        <Button onClick={handleCreate} className="mb-6">
          <Plus className="mr-2 size-4" />
          Nouvelle catégorie
        </Button>
        <p className="text-muted-foreground">Aucune catégorie.</p>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleCreate} className="mb-6">
        <Plus className="mr-2 size-4" />
        Nouvelle catégorie
      </Button>

      <div className="rounded-md border">
        {topLevel.map((cat) => {
          const children = getChildren(cat.id);
          return (
            <div key={cat.id}>
              {/* Top-level category row */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <span className="font-bold">{cat.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {cat.slug}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(cat)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(cat)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {children.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between border-b px-4 py-3 pl-10"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-px bg-border" />
                    <div>
                      <span>{sub.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {sub.slug}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(sub)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(sub)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Form dialog */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editingCategory}
        topLevelCategories={topLevel}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer{" "}
              <strong>{deletingCategory?.name}</strong> ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError ? (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {deleteError}
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
