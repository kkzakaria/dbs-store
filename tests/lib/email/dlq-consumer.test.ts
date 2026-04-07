import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MessageBatch } from "@cloudflare/workers-types";

const mockInsert = vi.fn();
const mockValues = vi.fn();

vi.mock("drizzle-orm/d1", () => ({
  drizzle: () => ({
    insert: () => {
      mockInsert();
      return { values: mockValues };
    },
  }),
}));

vi.mock("@/lib/db/schema", () => ({
  failed_emails: {},
}));

const { handleEmailDlq } = await import("@/lib/email/dlq-consumer");

function makeBatch(messages: Array<{ id: string; body: unknown; attempts?: number }>) {
  const acks: string[] = [];
  const retries: string[] = [];
  return {
    batch: {
      queue: "dbs-store-emails-dlq",
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

describe("handleEmailDlq", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
  });

  it("inserts each dead-lettered message into failed_emails and acks", async () => {
    const { batch, acks } = makeBatch([
      { id: "m1", body: { to: "a@x.ci", subject: "S", html: "H" }, attempts: 3 },
    ]);

    await handleEmailDlq(batch, { DB: {} } as unknown as CloudflareEnv);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledTimes(1);
    const inserted = mockValues.mock.calls[0][0];
    expect(inserted.id).toBe("m1");
    expect(inserted.to).toBe("a@x.ci");
    expect(inserted.attempts).toBe(3);
    expect(acks).toEqual(["m1"]);
  });

  it("retries when the D1 insert throws", async () => {
    mockValues.mockRejectedValue(new Error("d1 down"));
    const { batch, acks, retries } = makeBatch([
      { id: "m1", body: { to: "a@x.ci", subject: "S", html: "H" } },
    ]);

    await handleEmailDlq(batch, { DB: {} } as unknown as CloudflareEnv);

    expect(retries).toEqual(["m1"]);
    expect(acks).toEqual([]);
  });
});
