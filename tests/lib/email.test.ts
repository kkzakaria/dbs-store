import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Must import AFTER mock is registered
const { sendOtpEmail } = await import("@/lib/email");

describe("sendOtpEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  it("calls resend.emails.send with the recipient email", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "forget-password");
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@exemple.com");
  });

  it("uses the correct subject for forget-password type", async () => {
    await sendOtpEmail("user@exemple.com", "123456", "forget-password");
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toMatch(/réinitialisation/i);
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
});
