"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactForm } from "@/lib/actions/support";
import type { ContactFormData } from "@/lib/email/templates";

type ContactFormProps = {
  action?: (data: ContactFormData) => Promise<{ error?: string }>;
};

export function ContactForm({ action }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: ContactFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const submit = action ?? submitContactForm;
    const result = await submit(data);

    if (result.error) {
      setServerError(result.error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setSubmitting(false);
      form.reset();
    }
  }

  return (
    <section aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="text-xl font-bold tracking-tight">
        Nous contacter
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Vous n&apos;avez pas trouvé de réponse ? Envoyez-nous un message.
      </p>

      {success ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-medium text-green-800">
            Votre message a été envoyé avec succès !
          </p>
          <p className="mt-1 text-sm text-green-700">
            Nous vous répondrons dans les plus brefs délais.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSuccess(false)}
          >
            Envoyer un autre message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nom</Label>
              <Input
                id="contact-name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder="votre@email.ci"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">Sujet</Label>
            <Input
              id="contact-subject"
              name="subject"
              required
              minLength={5}
              maxLength={200}
              placeholder="Le sujet de votre message"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Décrivez votre demande en détail..."
            />
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="gap-2">
            <Send className="size-4" />
            {submitting ? "Envoi en cours..." : "Envoyer le message"}
          </Button>
        </form>
      )}
    </section>
  );
}
