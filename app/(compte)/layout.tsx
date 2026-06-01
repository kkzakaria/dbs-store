import { AppBar } from "@/components/layout/app-bar";
import { getCachedAllCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function CompteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allCategories = await getCachedAllCategories().catch((err) => {
    console.error("[CompteGroupLayout] getCachedAllCategories failed:", err);
    return [];
  });

  return (
    <>
      <AppBar categories={allCategories} />
      {children}
    </>
  );
}
