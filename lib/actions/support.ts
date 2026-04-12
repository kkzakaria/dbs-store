"use server";

import { enqueueEmail } from "@/lib/email/enqueue";
import { buildContactEmail } from "@/lib/email/templates";
import type { ContactFormData } from "@/lib/email/templates";

const EMAIL_REGEX = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

function validateContactForm(
  data: unknown
): { success: true; data: ContactFormData } | { success: false; error: string } {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Données invalides." };
  }

  const obj = data as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name : "";
  const email = typeof obj.email === "string" ? obj.email : "";
  const subject = typeof obj.subject === "string" ? obj.subject : "";
  const message = typeof obj.message === "string" ? obj.message : "";

  if (name.trim().length < 2 || name.trim().length > 100) {
    return { success: false, error: "Le nom doit contenir entre 2 et 100 caractères." };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { success: false, error: "Veuillez entrer une adresse email valide." };
  }
  if (subject.trim().length < 5 || subject.trim().length > 200) {
    return { success: false, error: "Le sujet doit contenir entre 5 et 200 caractères." };
  }
  if (message.trim().length < 10 || message.trim().length > 2000) {
    return { success: false, error: "Le message doit contenir entre 10 et 2000 caractères." };
  }
  return {
    success: true,
    data: {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    },
  };
}

export async function submitContactForm(
  data: unknown
): Promise<{ error?: string }> {
  const validation = validateContactForm(data);
  if (!validation.success) {
    return { error: validation.error };
  }

  try {
    const emailMessage = buildContactEmail(validation.data);
    await enqueueEmail(emailMessage);
    return {};
  } catch (err) {
    console.error("[submitContactForm]", err);
    return { error: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." };
  }
}
