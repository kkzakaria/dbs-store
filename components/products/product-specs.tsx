// components/products/product-specs.tsx
export function ProductSpecs({ specs }: { specs: Record<string, string> }) {
  const entries = Object.entries(specs);
  if (entries.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : "bg-background"}>
              <td className="px-4 py-2.5 font-medium text-muted-foreground">{key}</td>
              <td className="px-4 py-2.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
