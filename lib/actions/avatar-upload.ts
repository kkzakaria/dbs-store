"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCachedSession } from "@/lib/session";
import { ALLOWED_CONTENT_TYPES, putMedia } from "@/lib/r2";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function uploadAvatarImage(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  const session = await getCachedSession();
  if (!session?.user) {
    return { error: "Vous devez être connecté pour modifier votre avatar." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier fourni" };
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return { error: `Type de fichier non autorisé: ${file.type}` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Fichier trop volumineux (max 5 Mo)" };
  }

  const { env } = await getCloudflareContext<CloudflareEnv>();
  const { path } = await putMedia(
    env.MEDIA,
    `avatars/${session.user.id}`,
    file.name,
    file.type,
    await file.arrayBuffer()
  );
  return { path };
}
