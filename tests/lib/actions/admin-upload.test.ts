import { describe, it, expect, vi, beforeEach } from "vitest";

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
import { generatePresignedUrl } from "@/lib/actions/admin-upload";

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
    process.env.R2_PUBLIC_URL = "https://cdn.dbs-store.ci";
    process.env.R2_BUCKET_NAME = "test-bucket";

    const result = await generatePresignedUrl("photo.jpg", "image/jpeg");
    expect(result).toMatchObject({
      uploadUrl: "https://r2.example.com/presigned",
      publicUrl: expect.stringContaining("photo.jpg"),
    });
  });
});
