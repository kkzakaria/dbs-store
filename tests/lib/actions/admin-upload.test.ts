import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), listOrganizations: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function () { return {}; }),
  PutObjectCommand: vi.fn(function (input: unknown) { return { input }; }),
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://r2.example.com/presigned"),
}));

import { auth } from "@/lib/auth";
import { generatePresignedUrl, generateBannerPresignedUrl } from "@/lib/actions/admin-upload";

describe("generatePresignedUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lève UNAUTHORIZED si pas de session", async () => {
    (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(generatePresignedUrl("test.jpg", "image/jpeg")).rejects.toThrow("UNAUTHORIZED");
  });

  it("lève UNAUTHORIZED si pas membre org", async () => {
    (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1", email: "admin@dbs.ci" },
    });
    (auth.api.listOrganizations as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await expect(generatePresignedUrl("test.jpg", "image/jpeg")).rejects.toThrow("UNAUTHORIZED");
  });

  it("retourne uploadUrl et publicUrl si autorisé", async () => {
    (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1", email: "admin@dbs.ci" },
    });
    (auth.api.listOrganizations as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "org1" }]);
    process.env.R2_ACCOUNT_ID = "test-account-id";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "test-bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.dbs-store.ci";

    const result = await generatePresignedUrl("photo.jpg", "image/jpeg");
    expect(result).toMatchObject({
      uploadUrl: "https://r2.example.com/presigned",
      publicUrl: expect.stringContaining("photo.jpg"),
    });
  });
});

describe("generateBannerPresignedUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1", email: "admin@dbs.ci" },
    });
    (auth.api.listOrganizations as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "org1" }]);
    process.env = {
      ...originalEnv,
      R2_ACCOUNT_ID: "test-account",
      R2_ACCESS_KEY_ID: "test-key",
      R2_SECRET_ACCESS_KEY: "test-secret",
      R2_BUCKET_NAME: "test-bucket",
      R2_PUBLIC_URL: "https://cdn.dbs-store.ci",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("retourne uploadUrl et publicUrl avec le préfixe banners/", async () => {
    const result = await generateBannerPresignedUrl("photo.jpg", "image/jpeg");
    expect(result.uploadUrl).toBe("https://r2.example.com/presigned");
    expect(result.publicUrl).toMatch(/^https:\/\/cdn\.dbs-store\.ci\/banners\//);
  });

  it("utilise le préfixe products/ pour generatePresignedUrl", async () => {
    const result = await generatePresignedUrl("photo.jpg", "image/jpeg");
    expect(result.publicUrl).toMatch(/^https:\/\/cdn\.dbs-store\.ci\/products\//);
  });

  it("lève une erreur pour un type de fichier non autorisé", async () => {
    await expect(
      generateBannerPresignedUrl("script.js", "application/javascript")
    ).rejects.toThrow("Type de fichier non autorisé");
  });

  it("lève une erreur si les variables R2 manquent", async () => {
    delete process.env.R2_PUBLIC_URL;
    await expect(
      generateBannerPresignedUrl("photo.jpg", "image/jpeg")
    ).rejects.toThrow("Configuration R2 manquante");
  });
});
