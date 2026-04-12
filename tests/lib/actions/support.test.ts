import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEnqueueEmail = vi.fn();

vi.mock("@/lib/email/enqueue", () => ({
  enqueueEmail: mockEnqueueEmail,
}));

vi.mock("@/lib/email/templates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email/templates")>();
  return {
    ...actual,
    buildContactEmail: actual.buildContactEmail,
  };
});

const { submitContactForm } = await import("@/lib/actions/support");

describe("submitContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnqueueEmail.mockResolvedValue(undefined);
  });

  it("returns error when data is null", async () => {
    const result = await submitContactForm(null);
    expect(result.error).toBeDefined();
  });

  it("returns error when data is not an object", async () => {
    const result = await submitContactForm("string");
    expect(result.error).toBeDefined();
  });

  it("returns error when fields are non-string types", async () => {
    const result = await submitContactForm({
      name: 123,
      email: null,
      subject: ["array"],
      message: {},
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when name is empty", async () => {
    const result = await submitContactForm({
      name: "",
      email: "a@b.ci",
      subject: "Hello",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when name is too short", async () => {
    const result = await submitContactForm({
      name: "A",
      email: "a@b.ci",
      subject: "Hello",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when email is invalid", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "not-an-email",
      subject: "Hello",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when subject is too short", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "a@b.ci",
      subject: "Hi",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when message is too short", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "a@b.ci",
      subject: "Hello world",
      message: "Court",
    });
    expect(result.error).toBeDefined();
  });

  it("calls enqueueEmail on valid input", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "kouame@test.ci",
      subject: "Question livraison",
      message: "Bonjour, je voudrais savoir le délai.",
    });
    expect(result.error).toBeUndefined();
    expect(mockEnqueueEmail).toHaveBeenCalledOnce();
  });

  it("passes correct email structure to enqueueEmail", async () => {
    await submitContactForm({
      name: "Kouamé",
      email: "kouame@test.ci",
      subject: "Question livraison",
      message: "Bonjour, je voudrais savoir le délai.",
    });
    const emailArg = mockEnqueueEmail.mock.calls[0][0];
    expect(emailArg.subject).toBe("[Contact] Question livraison");
    expect(emailArg.html).toContain("Kouamé");
    expect(emailArg.html).toContain("kouame@test.ci");
  });

  it("returns error when name is whitespace-only", async () => {
    const result = await submitContactForm({
      name: "   ",
      email: "a@test.ci",
      subject: "Hello world",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when name exceeds 100 characters", async () => {
    const result = await submitContactForm({
      name: "A".repeat(101),
      email: "a@test.ci",
      subject: "Hello world",
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when subject exceeds 200 characters", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "a@test.ci",
      subject: "A".repeat(201),
      message: "Un message assez long.",
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when message exceeds 2000 characters", async () => {
    const result = await submitContactForm({
      name: "Kouamé",
      email: "a@test.ci",
      subject: "Hello world",
      message: "A".repeat(2001),
    });
    expect(result.error).toBeDefined();
  });

  it("returns error when enqueueEmail fails", async () => {
    mockEnqueueEmail.mockRejectedValue(new Error("queue down"));
    const result = await submitContactForm({
      name: "Kouamé",
      email: "kouame@test.ci",
      subject: "Question livraison",
      message: "Bonjour, je voudrais savoir le délai.",
    });
    expect(result.error).toBeDefined();
  });
});
