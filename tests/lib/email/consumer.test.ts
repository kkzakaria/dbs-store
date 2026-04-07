import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MessageBatch } from "@cloudflare/workers-types";

const mockSendEmail = vi.fn();

vi.mock("@/lib/email/send", () => ({
  sendEmail: mockSendEmail,
}));

const { handleEmailQueue } = await import("@/lib/email/consumer");

function makeBatch(messages: Array<{ id: string; body: unknown; attempts?: number }>) {
  const acks: string[] = [];
  const retries: string[] = [];
  return {
    batch: {
      queue: "dbs-store-emails",
      messages: messages.map((m) => ({
        id: m.id,
        timestamp: new Date(),
        body: m.body,
        attempts: m.attempts ?? 1,
        ack: () => acks.push(m.id),
        retry: () => retries.push(m.id),
      })),
    } as unknown as MessageBatch<unknown>,
    acks,
    retries,
  };
}

describe("handleEmailQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acks each message after successful send", async () => {
    mockSendEmail.mockResolvedValue(undefined);
    const { batch, acks } = makeBatch([
      { id: "1", body: { to: "a@x.ci", subject: "S", html: "H" } },
      { id: "2", body: { to: "b@x.ci", subject: "S", html: "H" } },
    ]);

    await handleEmailQueue(batch);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(acks).toEqual(["1", "2"]);
  });

  it("calls retry() on a message when sendEmail throws", async () => {
    mockSendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("resend down"));
    const { batch, acks, retries } = makeBatch([
      { id: "1", body: { to: "a@x.ci", subject: "S", html: "H" } },
      { id: "2", body: { to: "b@x.ci", subject: "S", html: "H" } },
    ]);

    await handleEmailQueue(batch);

    expect(acks).toEqual(["1"]);
    expect(retries).toEqual(["2"]);
  });

  it("retries the failing message and acks the later successful one", async () => {
    // Failure-then-success isolation: an early failure must NOT prevent
    // later messages from being attempted/acked.
    mockSendEmail
      .mockRejectedValueOnce(new Error("first down"))
      .mockResolvedValueOnce(undefined);
    const { batch, acks, retries } = makeBatch([
      { id: "1", body: { to: "a@x.ci", subject: "S", html: "H" } },
      { id: "2", body: { to: "b@x.ci", subject: "S", html: "H" } },
    ]);

    await handleEmailQueue(batch);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(acks).toContain("2");
    expect(retries).toContain("1");
    expect(acks).toHaveLength(1);
    expect(retries).toHaveLength(1);
  });

  it("acks invalid payloads instead of retrying them", async () => {
    const { batch, acks, retries } = makeBatch([
      { id: "bad", body: { not: "an email" } },
    ]);

    await handleEmailQueue(batch);

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(acks).toEqual(["bad"]);
    expect(retries).toEqual([]);
  });
});
