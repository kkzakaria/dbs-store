"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/actions/newsletter";

type NewsletterResult = { success: true } | { success?: never; error: string };

type NewsletterFormProps = {
  action?: (data: { email: string; website: string }) => Promise<NewsletterResult>;
};

export function NewsletterForm({ action }: NewsletterFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const website = formData.get("website") as string;

    try {
      const submit = action ?? subscribeNewsletter;
      const result = await submit({ email, website });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <p className="text-sm font-medium text-green-600">
        Merci pour votre inscription !
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm gap-2">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input
        type="text"
        inputMode="email"
        name="email"
        placeholder="Votre adresse email"
        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "..." : "S'inscrire"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
