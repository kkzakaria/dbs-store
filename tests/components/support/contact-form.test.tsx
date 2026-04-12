import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/support/contact-form";

describe("ContactForm", () => {
  it("renders all form fields", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sujet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();
  });

  it("disables the submit button while submitting", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn(() => new Promise<{ error?: string }>(() => {}));
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(screen.getByRole("button", { name: /envoi/i })).toBeDisabled();
  });

  it("shows success message after successful submission", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({});
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(await screen.findByText(/message.*envoyé/i)).toBeInTheDocument();
  });

  it("shows server error message on failure", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({ error: "Email invalide" });
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
  });

  it("shows error message when the action throws (network error)", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(await screen.findByText(/impossible.*serveur/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /envoyer/i })).not.toBeDisabled();
  });

  it("returns to form when clicking 'send another message'", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({});
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(await screen.findByText(/message.*envoyé/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /autre message/i }));

    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    expect(screen.queryByText(/message.*envoyé/i)).not.toBeInTheDocument();
  });

  it("passes correct data to the action", async () => {
    const user = userEvent.setup();
    const mockAction = vi.fn().mockResolvedValue({});
    render(<ContactForm action={mockAction} />);

    await user.type(screen.getByLabelText(/nom/i), "Kouamé");
    await user.type(screen.getByLabelText(/email/i), "k@t.ci");
    await user.type(screen.getByLabelText(/sujet/i), "Question test");
    await user.type(screen.getByLabelText(/message/i), "Un message de test assez long");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(mockAction).toHaveBeenCalledWith({
      name: "Kouamé",
      email: "k@t.ci",
      subject: "Question test",
      message: "Un message de test assez long",
    });
  });
});
