import Link from "next/link";
import { Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { getAdminProducts, PAGE_SIZE } from "@/lib/data/admin-products";
import { categories } from "@/lib/data/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleProductActive } from "@/lib/actions/admin-products";
import { formatFCFA } from "@/lib/utils";

type Props = { searchParams: Promise<{ search?: string; cat?: string; page?: string }> };

const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

export default async function AdminProduitsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const db = await getDb();
  const { products, total } = await getAdminProducts(
    db,
    { search: sp.search, category_id: sp.cat },
    page
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produits ({total})</h1>
        <Button asChild>
          <Link href="/admin/produits/nouveau">
            <Plus className="mr-2 size-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Produit</th>
              <th className="px-4 py-3 text-left font-medium">Catégorie</th>
              <th className="px-4 py-3 text-right font-medium">Prix</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-center font-medium">Statut</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded-md bg-muted" />
                    )}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {categoryMap[p.category_id] ?? p.category_id}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatFCFA(p.price)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={p.stock <= 3 ? "font-medium text-destructive" : ""}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={p.is_active ? "default" : "outline"}>
                    {p.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/produits/${p.id}`}>Éditer</Link>
                    </Button>
                    <form
                      action={async () => {
                        "use server";
                        await toggleProductActive(p.id, !p.is_active);
                      }}
                    >
                      <Button variant="ghost" size="sm" type="submit">
                        {p.is_active ? "Désactiver" : "Activer"}
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucun produit trouvé.
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`rounded px-3 py-1 text-sm ${
                p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
