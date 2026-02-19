import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

// Must import AFTER mock is registered
const { sendOtpEmail } = await import("@/lib/email");

describe("sendOtpEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  it("calls resend.emails.send with the recipient email and correct from", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "forget-password");
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@exemple.com");
    expect(call.from).toContain("dbs-store.ci");
  });

  it("uses the correct subject for forget-password type", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "forget-password");
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toMatch(/réinitialisation/i);
  });

  it("uses the correct subject for email-verification type", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "email-verification");
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toMatch(/vérifiez votre adresse/i);
  });

  it("uses the correct subject for sign-in type", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "sign-in");
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toMatch(/code de connexion/i);
  });

  it("includes the OTP code in the html body", async () => {
    await sendOtpEmail("user@exemple.com", "654321", "forget-password");
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain("654321");
  });

  it("throws if resend returns an error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });
    await expect(sendOtpEmail("user@exemple.com", "123456", "forget-password"))
      .rejects.toThrow("Invalid API key");
  });

  it("throws with error.name fallback if message is absent", async () => {
    mockSend.mockResolvedValue({ data: null, error: { name: "RateLimitError" } });
    await expect(sendOtpEmail("user@exemple.com", "123456", "forget-password"))
      .rejects.toThrow("RateLimitError");
  });
});
