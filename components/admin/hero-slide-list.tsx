"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleHeroSlideActive, deleteHeroSlide, reorderHeroSlides } from "@/lib/actions/admin-hero";
import type { HeroSlide } from "@/lib/db/schema";

interface SortableRowProps {
  slide: HeroSlide;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ slide, onToggle, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn("border-b", isDragging ? "opacity-50 bg-muted" : "")}
    >
      <td className="w-8 px-3 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground"
          aria-label="Réordonner"
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="w-20 px-3 py-3">
        <div className="relative h-10 w-16 overflow-hidden rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      </td>
      <td className="px-3 py-3">
        <p className="text-sm font-medium">{slide.title}</p>
        {slide.badge ? (
          <span className="text-xs text-muted-foreground">{slide.badge}</span>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <button
          onClick={() => onToggle(slide.id, !slide.is_active)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            slide.is_active
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              slide.is_active ? "bg-green-500" : "bg-muted-foreground"
            )}
          />
          {slide.is_active ? "Actif" : "Inactif"}
        </button>
      </td>
      <td className="px-3 py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" asChild aria-label="Modifier la bannière">
            <Link href={`/admin/hero/${slide.id}`}>
              <Pencil className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(slide.id)}
            aria-label="Supprimer la bannière"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

interface HeroSlideListProps {
  initialSlides: HeroSlide[];
}

export function HeroSlideList({ initialSlides }: HeroSlideListProps) {
  const [slides, setSlides] = useState(initialSlides);
  const [actionError, setActionError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(slides, oldIndex, newIndex);
      const prev = slides;
      setSlides(reordered);
      setActionError(null);

      const result = await reorderHeroSlides(reordered.map((s) => s.id));
      if (result?.error) {
        setSlides(prev);
        setActionError(result.error);
      }
    },
    [slides]
  );

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    const previous = slides;
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: active } : s)));
    setActionError(null);

    const result = await toggleHeroSlideActive(id, active);
    if (result?.error) {
      setSlides(previous);
      setActionError(result.error);
    }
  }, [slides]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    const previous = slides;
    setSlides((prev) => prev.filter((s) => s.id !== id));
    setActionError(null);

    const result = await deleteHeroSlide(id);
    if (result?.error) {
      setSlides(previous);
      setActionError(result.error);
    }
  }, [slides]);

  if (slides.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucune bannière. Créez votre première bannière.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="overflow-hidden rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="w-8 px-3 py-2" />
                  <th className="w-20 px-3 py-2">Aperçu</th>
                  <th className="px-3 py-2">Titre</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((slide) => (
                  <SortableRow
                    key={slide.id}
                    slide={slide}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
