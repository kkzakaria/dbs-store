import { AppBar } from "@/components/layout/app-bar";
import { getDb } from "@/lib/db";
import { getAllCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await getDb();
  const allCategories = await getAllCategories(db);

  return (
    <>
      <AppBar categories={allCategories} />
      <main>{children}</main>
    </>
  );
}
