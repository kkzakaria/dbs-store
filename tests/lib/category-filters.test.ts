// tests/lib/category-filters.test.ts
import { describe, it, expect } from "vitest";
import { parseCategoryParams, buildCategoryHref } from "@/lib/category-filters";

describe("parseCategoryParams", () => {
  it("parse une liste de marques séparées par des virgules", () => {
    expect(parseCategoryParams({ marques: "Apple,Samsung" }).brands).toEqual(["Apple", "Samsung"]);
  });

  it("trim, ignore les entrées vides et dédoublonne", () => {
    expect(parseCategoryParams({ marques: " Apple , ,Apple, Samsung " }).brands).toEqual(["Apple", "Samsung"]);
  });

  it("renvoie un tableau vide quand marques est absent", () => {
    expect(parseCategoryParams({}).brands).toEqual([]);
  });

  it("parse prix_min et prix_max valides", () => {
    const s = parseCategoryParams({ prix_min: "100000", prix_max: "500000" });
    expect(s.prixMin).toBe(100000);
    expect(s.prixMax).toBe(500000);
  });

  it("ignore les prix non numériques ou négatifs", () => {
    const s = parseCategoryParams({ prix_min: "abc", prix_max: "-5" });
    expect(s.prixMin).toBeUndefined();
    expect(s.prixMax).toBeUndefined();
  });

  it("ignore la borne min quand min > max", () => {
    const s = parseCategoryParams({ prix_min: "900000", prix_max: "100000" });
    expect(s.prixMin).toBeUndefined();
    expect(s.prixMax).toBe(100000);
  });

  it("valide tri contre la liste blanche", () => {
    expect(parseCategoryParams({ tri: "prix_asc" }).tri).toBe("prix_asc");
    expect(parseCategoryParams({ tri: "n_importe_quoi" }).tri).toBeUndefined();
  });
});

describe("buildCategoryHref", () => {
  it("construit une URL avec marques jointes par virgule", () => {
    expect(buildCategoryHref("/smartphones", { brands: ["Apple", "Samsung"] }))
      .toBe("/smartphones?marques=Apple%2CSamsung");
  });

  it("inclut les bornes de prix et le tri", () => {
    const href = buildCategoryHref("/smartphones", { brands: [], prixMin: 100000, prixMax: 500000, tri: "prix_asc" });
    expect(href).toContain("prix_min=100000");
    expect(href).toContain("prix_max=500000");
    expect(href).toContain("tri=prix_asc");
  });

  it("renvoie le pathname seul quand l'état est vide", () => {
    expect(buildCategoryHref("/smartphones", { brands: [] })).toBe("/smartphones");
  });
});
