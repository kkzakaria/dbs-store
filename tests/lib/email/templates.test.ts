import { describe, it, expect } from "vitest";
import { buildOtpEmail } from "@/lib/email/templates";

describe("buildOtpEmail", () => {
  it("returns an EmailMessage with the recipient", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "forget-password");
    expect(msg.to).toBe("u@x.ci");
  });

  it("uses the forget-password subject", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "forget-password");
    expect(msg.subject).toMatch(/réinitialisation/i);
  });

  it("uses the email-verification subject", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "email-verification");
    expect(msg.subject).toMatch(/vérifiez votre adresse/i);
  });

  it("uses the sign-in subject", () => {
    const msg = buildOtpEmail("u@x.ci", "123456", "sign-in");
    expect(msg.subject).toMatch(/code de connexion/i);
  });

  it("embeds the OTP code in the html body", () => {
    const msg = buildOtpEmail("u@x.ci", "654321", "forget-password");
    expect(msg.html).toContain("654321");
  });

  it("includes the DBS Store header", () => {
    const msg = buildOtpEmail("u@x.ci", "1", "sign-in");
    expect(msg.html).toContain("DBS Store");
  });

  it("returns distinct subjects for each OTP type", () => {
    const subjects = new Set([
      buildOtpEmail("u@x.ci", "1", "sign-in").subject,
      buildOtpEmail("u@x.ci", "1", "email-verification").subject,
      buildOtpEmail("u@x.ci", "1", "forget-password").subject,
    ]);
    expect(subjects.size).toBe(3);
  });
});
