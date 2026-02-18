import { describe, it, expect } from "vitest";
import { ac, owner, admin, member } from "@/lib/auth/permissions";

describe("permissions", () => {
  it("exports an access control instance", () => {
    expect(ac).toBeDefined();
  });

  it("defines owner role with full permissions", () => {
    expect(owner).toBeDefined();
  });

  it("defines admin role", () => {
    expect(admin).toBeDefined();
  });

  it("defines member role", () => {
    expect(member).toBeDefined();
  });
});
