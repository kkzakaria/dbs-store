import { describe, it, expect } from "vitest";
import { validateSlideData } from "@/lib/actions/hero-validation";
import type { HeroSlideFormData } from "@/lib/actions/admin-hero";

const base: HeroSlideFormData = {
  title: "T",
  text_align: "center",
  overlay_color: "#000000",
  overlay_opacity: 40,
  is_active: false,
  image_url: "",
};

describe("validateSlideData — image_url", () => {
  it("accepte un chemin /api/media/ servi par le binding", () => {
    expect(validateSlideData({ ...base, image_url: "/api/media/banners/123-abc-x.png" })).toBeNull();
  });

  it("accepte les hôtes https configurés dans remotePatterns (legacy)", () => {
    expect(validateSlideData({ ...base, image_url: "https://cdn.dbs-store.ci/x.png" })).toBeNull();
    expect(validateSlideData({ ...base, image_url: "https://images.unsplash.com/photo-1" })).toBeNull();
  });

  it("rejette un hôte https arbitraire (next/image planterait au rendu)", () => {
    expect(validateSlideData({ ...base, image_url: "https://evil.example/x.png" })).not.toBeNull();
  });

  it("rejette une image_url ni https-autorisée ni /api/media/", () => {
    expect(validateSlideData({ ...base, image_url: "ftp://x" })).not.toBeNull();
    expect(validateSlideData({ ...base, image_url: "javascript:alert(1)" })).not.toBeNull();
  });

  it("rejette une image_url vide", () => {
    expect(validateSlideData({ ...base, image_url: "" })).not.toBeNull();
  });
});

describe("validateSlideData — autres champs", () => {
  const img = "/api/media/banners/x.png";

  it("rejette un titre vide ou blanc", () => {
    expect(validateSlideData({ ...base, image_url: img, title: "" })).not.toBeNull();
    expect(validateSlideData({ ...base, image_url: img, title: "   " })).not.toBeNull();
  });

  it("rejette un text_align invalide", () => {
    expect(
      validateSlideData({ ...base, image_url: img, text_align: "middle" as never })
    ).not.toBeNull();
  });

  it("accepte les bornes d'opacité 0 et 100, rejette -1 et 101", () => {
    expect(validateSlideData({ ...base, image_url: img, overlay_opacity: 0 })).toBeNull();
    expect(validateSlideData({ ...base, image_url: img, overlay_opacity: 100 })).toBeNull();
    expect(validateSlideData({ ...base, image_url: img, overlay_opacity: -1 })).not.toBeNull();
    expect(validateSlideData({ ...base, image_url: img, overlay_opacity: 101 })).not.toBeNull();
  });
});
