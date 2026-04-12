"use server";

import { enqueueEmail } from "@/lib/email/enqueue";
import { buildContactEmail } from "@/lib/email/templates";
import type { ContactFormData } from "@/lib/email/templates";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(
  data: ContactFormData
): { success: true } | { success: false; error: string } {
  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 100) {
    return { success: false, error: "Le nom doit contenir entre 2 et 100 caractères." };
  }
  if (!data.email || !EMAIL_REGEX.test(data.email.trim())) {
    return { success: false, error: "Veuillez entrer une adresse email valide." };
  }
  if (!data.subject || data.subject.trim().length < 5 || data.subject.trim().length > 200) {
    return { success: false, error: "Le sujet doit contenir entre 5 et 200 caractères." };
  }
  if (!data.message || data.message.trim().length < 10 || data.message.trim().length > 2000) {
    return { success: false, error: "Le message doit contenir entre 10 et 2000 caractères." };
  }
  return { success: true };
}

export async function submitContactForm(
  data: ContactFormData
): Promise<{ error?: string }> {
  const validation = validateContactForm(data);
  if (!validation.success) {
    return { error: validation.error };
  }

  const trimmed: ContactFormData = {
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject.trim(),
    message: data.message.trim(),
  };

  try {
    const emailMessage = buildContactEmail(trimmed);
    await enqueueEmail(emailMessage);
    return {};
  } catch (err) {
    console.error("[submitContactForm]", err);
    return { error: "Une erreur est survenue lors de l'envoi. Veuillez réessayer." };
  }
}
