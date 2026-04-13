import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterForm } from "@/components/newsletter-form";

describe("NewsletterForm", () => {
  it("renders email input and submit button", () => {
    render(<NewsletterForm />);
    expect(screen.getByPlaceholderText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it("renders hidden honeypot field", () => {
    render(<NewsletterForm />);
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot.getAttribute("aria-hidden")).toBe("true");
    expect(honeypot.tabIndex).toBe(-1);
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ success: true });
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "test@example.ci");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(await screen.findByText(/merci/i)).toBeInTheDocument();
  });

  it("shows error message on failure", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ error: "Email invalide" });
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "bad");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
  });

  it("disables button while submitting", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn(() => new Promise<{ success: true }>(() => {}));
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "test@example.ci");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("passes honeypot value to action", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ success: true });
    render(<NewsletterForm action={mockAction} />);

    await user.type(screen.getByPlaceholderText(/adresse email/i), "test@example.ci");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(mockAction).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.ci", website: "" })
    );
  });
});
