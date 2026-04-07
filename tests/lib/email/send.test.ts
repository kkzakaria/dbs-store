import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

const { sendEmail } = await import("@/lib/email/send");

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "id" }, error: null });
  });

  it("calls Resend with the message fields and a from address", async () => {
    await sendEmail({ to: "u@x.ci", subject: "S", html: "<p>H</p>" });
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("u@x.ci");
    expect(call.subject).toBe("S");
    expect(call.html).toBe("<p>H</p>");
    expect(call.from).toContain("dbs-store.ci");
  });

  it("throws when Resend returns an error.message", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      sendEmail({ to: "u@x.ci", subject: "S", html: "H" })
    ).rejects.toThrow("boom");
  });

  it("throws with error.name fallback when message is absent", async () => {
    mockSend.mockResolvedValue({ data: null, error: { name: "RateLimitError" } });
    await expect(
      sendEmail({ to: "u@x.ci", subject: "S", html: "H" })
    ).rejects.toThrow("RateLimitError");
  });
});
