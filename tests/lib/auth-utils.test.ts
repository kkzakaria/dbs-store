// tests/lib/auth-utils.test.ts
import { describe, it, expect } from "vitest";
import { hasCredentialAccount, translateAuthError } from "@/lib/auth-utils";

describe("translateAuthError", () => {
  it("traduit le message 'Verification email isn't enabled' en français", () => {
    expect(
      translateAuthError("Verification email isn't enabled", "fallback")
    ).toBe("Vous devez d'abord vérifier votre adresse email actuelle.");
  });
});

describe("hasCredentialAccount", () => {
  it("retourne true si un compte credential existe", () => {
    expect(
      hasCredentialAccount([{ provider: "credential" }, { provider: "google" }])
    ).toBe(true);
  });

  it("retourne false pour des comptes sociaux uniquement", () => {
    expect(hasCredentialAccount([{ provider: "google" }])).toBe(false);
  });

  it("retourne false pour une liste vide", () => {
    expect(hasCredentialAccount([])).toBe(false);
  });
});
