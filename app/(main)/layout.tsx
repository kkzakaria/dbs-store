import { AppBar } from "@/components/layout/app-bar";
import { getCachedAllCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allCategories = await getCachedAllCategories();

  return (
    <>
      <AppBar categories={allCategories} />
      <main>{children}</main>
    </>
  );
}
