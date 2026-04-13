"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { newsletter_subscribers } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

type NewsletterResult = { success: true } | { success?: never; error: string };

export async function subscribeNewsletter(data: unknown): Promise<NewsletterResult> {
  if (!data || typeof data !== "object") {
    return { error: "Donnees invalides." };
  }

  const obj = data as Record<string, unknown>;

  // Honeypot check
  if (typeof obj.website === "string" && obj.website.length > 0) {
    return { error: "Donnees invalides." };
  }

  const rawEmail = typeof obj.email === "string" ? obj.email : "";
  const email = rawEmail.trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Veuillez entrer une adresse email valide." };
  }

  if (email.length > 254) {
    return { error: "Veuillez entrer une adresse email valide." };
  }

  // Rate limit by IP
  const hdrs = await headers();
  const ip = hdrs.get("cf-connecting-ip") ?? hdrs.get("x-forwarded-for") ?? "unknown";
  const allowed = await checkRateLimit(`newsletter-rl:${ip}`, 3, 3600);
  if (!allowed) {
    return { error: "Trop de tentatives. Veuillez reessayer plus tard." };
  }

  const db = await getDb();

  // Check for existing subscriber — silent success
  const existing = await db
    .select()
    .from(newsletter_subscribers)
    .where(eq(newsletter_subscribers.email, email));

  if (existing.length > 0) {
    return { success: true };
  }

  await db.insert(newsletter_subscribers).values({
    id: randomUUID(),
    email,
    token: randomUUID(),
    is_active: true,
    created_at: new Date(),
  });

  return { success: true };
}

export async function unsubscribeNewsletter(token: unknown): Promise<NewsletterResult> {
  if (typeof token !== "string" || token.trim().length === 0) {
    return { error: "Lien de desinscription invalide." };
  }

  const db = await getDb();

  const existing = await db
    .select()
    .from(newsletter_subscribers)
    .where(eq(newsletter_subscribers.token, token.trim()));

  if (existing.length === 0) {
    return { error: "Lien de desinscription invalide." };
  }

  await db
    .update(newsletter_subscribers)
    .set({ is_active: false })
    .where(eq(newsletter_subscribers.token, token.trim()));

  return { success: true };
}
