"use server";

import { requireOrgMember } from "@/lib/actions/admin-auth";
import { ALLOWED_CONTENT_TYPES, createPresignedUpload } from "@/lib/r2";

export async function generatePresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  return createPresignedUpload("products", filename, contentType);
}

export async function generateBannerPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  await requireOrgMember();

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Type de fichier non autorisé: ${contentType}`);
  }

  return createPresignedUpload("banners", filename, contentType);
}
