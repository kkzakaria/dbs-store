"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { ALLOWED_CONTENT_TYPES, putMedia } from "@/lib/r2";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function uploadBannerImage(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  await requireOrgMember();

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
    "banners",
    file.name,
    file.type,
    await file.arrayBuffer()
  );
  return { path };
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  await requireOrgMember();

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
    "products",
    file.name,
    file.type,
    await file.arrayBuffer()
  );
  return { path };
}
