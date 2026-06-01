import { describe, it, expect } from "vitest";
import { validateSlideData } from "@/lib/actions/admin-hero";
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

  it("accepte une URL https externe (héritée)", () => {
    expect(validateSlideData({ ...base, image_url: "https://cdn.dbs-store.ci/x.png" })).toBeNull();
  });

  it("rejette une image_url ni https ni /api/media/", () => {
    expect(validateSlideData({ ...base, image_url: "ftp://x" })).not.toBeNull();
    expect(validateSlideData({ ...base, image_url: "javascript:alert(1)" })).not.toBeNull();
  });

  it("rejette une image_url vide", () => {
    expect(validateSlideData({ ...base, image_url: "" })).not.toBeNull();
  });
});
