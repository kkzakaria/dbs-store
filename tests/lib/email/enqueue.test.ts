import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQueueSend = vi.fn();
const mockSendEmail = vi.fn();
const mockGetCfContext = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCfContext,
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: mockSendEmail,
}));

const { enqueueEmail } = await import("@/lib/email/enqueue");

describe("enqueueEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
    mockQueueSend.mockResolvedValue(undefined);
  });

  it("sends to EMAIL_QUEUE when binding is present", async () => {
    mockGetCfContext.mockResolvedValue({
      env: { EMAIL_QUEUE: { send: mockQueueSend } },
    });

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await enqueueEmail(msg);

    expect(mockQueueSend).toHaveBeenCalledWith(msg);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("falls back to sendEmail when EMAIL_QUEUE binding is missing", async () => {
    mockGetCfContext.mockResolvedValue({ env: {} });

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await enqueueEmail(msg);

    expect(mockSendEmail).toHaveBeenCalledWith(msg);
    expect(mockQueueSend).not.toHaveBeenCalled();
  });

  it("falls back to sendEmail when getCloudflareContext throws (Node dev)", async () => {
    mockGetCfContext.mockRejectedValue(new Error("no cf context"));

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await enqueueEmail(msg);

    expect(mockSendEmail).toHaveBeenCalledWith(msg);
  });

  it("propagates queue.send errors instead of falling back (avoid duplicates)", async () => {
    mockGetCfContext.mockResolvedValue({
      env: { EMAIL_QUEUE: { send: mockQueueSend } },
    });
    mockQueueSend.mockRejectedValue(new Error("queue down"));

    const msg = { to: "u@x.ci", subject: "S", html: "H" };
    await expect(enqueueEmail(msg)).rejects.toThrow("queue down");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
