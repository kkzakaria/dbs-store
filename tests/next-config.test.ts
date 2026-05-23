import { describe, it, expect } from "vitest";
import nextConfig from "@/next.config";

describe("next.config images", () => {
  it("whitelists the R2 public host over https for next/image", () => {
    const r2 = (nextConfig.images?.remotePatterns ?? []).find(
      (p) => p.hostname === "cdn.dbs-store.ci",
    );
    expect(r2).toBeDefined();
    expect(r2?.protocol).toBe("https");
  });

  it("still allows unsplash", () => {
    const hosts = (nextConfig.images?.remotePatterns ?? []).map((p) => p.hostname);
    expect(hosts).toContain("images.unsplash.com");
  });
});
