import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { getAllHeroSlides } from "@/lib/data/hero-slides";
import { HeroSlideList } from "@/components/admin/hero-slide-list";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const db = await getDb();
  const slides = await getAllHeroSlides(db);
  const activeCount = slides.filter((s) => s.is_active).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero — Bannières</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {slides.length} bannière{slides.length !== 1 ? "s" : ""} —{" "}
            {activeCount} active{activeCount !== 1 ? "s" : ""} sur 5 max.
            Glissez pour réordonner.
          </p>
        </div>
        {activeCount >= 5 ? (
          <Button disabled>
            <Plus className="mr-2 size-4" />
            Nouvelle bannière
          </Button>
        ) : (
          <Button asChild>
            <Link href="/admin/hero/nouveau">
              <Plus className="mr-2 size-4" />
              Nouvelle bannière
            </Link>
          </Button>
        )}
      </div>
      <HeroSlideList initialSlides={slides} />
    </div>
  );
}
