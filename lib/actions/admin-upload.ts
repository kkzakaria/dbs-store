"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireOrgMember } from "@/lib/actions/admin-auth";
import { ALLOWED_CONTENT_TYPES, putMedia } from "@/lib/r2";
import type { MediaPrefix, UploadResult } from "@/lib/r2";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Valide le fichier et l'écrit dans R2 via le binding. Toute défaillance
 * (binding absent, quota, 5xx R2…) est journalisée et renvoyée en `{ error }`
 * — on ne laisse jamais l'action throw : sinon le client reçoit une erreur
 * framework opaque interprétée à tort comme « fichier invalide ».
 */
async function storeUpload(formData: FormData, prefix: MediaPrefix): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucun fichier fourni" };
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return { error: `Type de fichier non autorisé: ${file.type}` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Fichier trop volumineux (max 5 Mo)" };
  }

  try {
    const { env } = await getCloudflareContext<CloudflareEnv>();
    const { path } = await putMedia(env.MEDIA, prefix, file.name, file.type, await file.arrayBuffer());
    return { path };
  } catch (err) {
    console.error(`[storeUpload] échec d'écriture R2 (${prefix}):`, err);
    return { error: "Échec de l'enregistrement de l'image. Veuillez réessayer." };
  }
}

export async function uploadBannerImage(formData: FormData): Promise<UploadResult> {
  await requireOrgMember();
  return storeUpload(formData, "banners");
}

export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  await requireOrgMember();
  return storeUpload(formData, "products");
}
