import { HeroSlideForm } from "@/components/admin/hero-slide-form";
import { createHeroSlide } from "@/lib/actions/admin-hero";

export default function AdminHeroNouveauPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nouvelle bannière</h1>
      <HeroSlideForm action={createHeroSlide} submitLabel="Créer la bannière" />
    </div>
  );
}
