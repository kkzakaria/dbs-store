import { describe, it, expect, vi } from "vitest";
import type { R2Bucket } from "@cloudflare/workers-types";
import { sanitizeFilename, mediaKey, putMedia } from "@/lib/r2";

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

describe("mediaKey", () => {
  it("préfixe la clé et conserve un nom de fichier assaini", () => {
    const key = mediaKey("banners", "Mon Image (1).JPG");
    expect(key.startsWith("banners/")).toBe(true);
    expect(key).toMatch(/Mon-Image-1/);
  });
});

describe("putMedia", () => {
  it("écrit dans le bucket et renvoie la clé + le chemin /api/media", async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    const bucket = { put } as unknown as R2Bucket;
    const body = new ArrayBuffer(4);

    const result = await putMedia(bucket, "banners", "photo.png", "image/png", body);

    expect(put).toHaveBeenCalledTimes(1);
    const [calledKey, calledBody, opts] = put.mock.calls[0];
    expect(calledKey).toBe(result.key);
    expect(calledBody).toBe(body);
    expect(opts).toEqual({ httpMetadata: { contentType: "image/png" } });
    expect(result.key.startsWith("banners/")).toBe(true);
    expect(result.path).toBe(`/api/media/${result.key}`);
  });
});
