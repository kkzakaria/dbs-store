import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "@/lib/r2";

describe("sanitizeFilename", () => {
  it("conserve un nom simple avec son extension", () => {
    expect(sanitizeFilename("photo.png")).toBe("photo.png");
    expect(sanitizeFilename("mon_fichier-2.webp")).toBe("mon_fichier-2.webp");
  });

  it("retire les séparateurs de répertoire et les fragments ../", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("a/b/c.jpg")).toBe("c.jpg");
    expect(sanitizeFilename("a\\b\\c.jpg")).toBe("c.jpg");
  });

  it("remplace les caractères non sûrs et ne laisse que [A-Za-z0-9._-]", () => {
    const out = sanitizeFilename("mon image (1)!.png");
    expect(out).toMatch(/^[a-zA-Z0-9._-]+$/);
    expect(out).not.toContain(" ");
    expect(out.endsWith(".png")).toBe(true);
  });

  it("borne la longueur à 100 caractères", () => {
    const out = sanitizeFilename("a".repeat(200) + ".png");
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out).toMatch(/^[a-zA-Z0-9._-]+$/);
  });

  it("retombe sur 'file' quand il ne reste rien de sûr", () => {
    expect(sanitizeFilename("")).toBe("file");
    expect(sanitizeFilename("../")).toBe("file");
    expect(sanitizeFilename("...")).toBe("file");
    expect(sanitizeFilename("///")).toBe("file");
  });

  it("retire les points/tirets en tête (pas de fichier caché)", () => {
    expect(sanitizeFilename(".hidden.png")).toBe("hidden.png");
    expect(sanitizeFilename("--weird.jpg")).toBe("weird.jpg");
  });
});
