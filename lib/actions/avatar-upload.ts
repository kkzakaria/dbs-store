"use server";

import { getCachedSession } from "@/lib/session";
import { ALLOWED_CONTENT_TYPES, createPresignedUpload } from "@/lib/r2";

export async function generateAvatarUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const session = await getCachedSession();
  if (!session?.user) {
    throw new Error("Vous devez être connecté pour modifier votre avatar.");
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  return createPresignedUpload(`avatars/${session.user.id}`, filename, contentType);
}
