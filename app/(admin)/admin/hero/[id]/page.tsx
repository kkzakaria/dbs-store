import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getHeroSlide } from "@/lib/data/hero-slides";
import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { updateHeroSlide } from "@/lib/actions/admin-hero";
import type { HeroSlideFormData } from "@/lib/actions/admin-hero";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminHeroEditPage({ params }: Props) {
  const { id } = await params;
  const db = await getDb();
  const slide = await getHeroSlide(db, id);

  if (!slide) notFound();

  async function action(data: HeroSlideFormData) {
    "use server";
    return updateHeroSlide(id, data);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Modifier la bannière</h1>
      <HeroSlideForm initial={slide} action={action} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
