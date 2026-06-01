import { randomUUID } from "crypto";
import type { R2Bucket } from "@cloudflare/workers-types";

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Préfixes de clé R2 valides. Couplé à l'allowlist de `app/api/media/[...key]`
 * (`ALLOWED_PREFIXES`) : un préfixe hors de cette union produirait un objet
 * uploadé mais jamais servi (404). Les avatars sont rangés par utilisateur.
 */
export type MediaPrefix = "banners" | "products" | `avatars/${string}`;

/** Résultat d'un upload : soit un chemin same-origin, soit une erreur — jamais les deux. */
export type UploadResult = { path: string } | { error: string };

/**
 * Réduit un nom de fichier fourni par le client à un token sûr pour une clé
 * d'objet R2 et pour une URL : on ne garde que le basename (pas de séparateurs
 * de répertoire ni de "../"), on n'autorise que [A-Za-z0-9._-], et on borne la
 * longueur. Le préfixe UUID garantit déjà l'unicité de la clé, donc ce token
 * n'est que cosmétique et peut retomber sur "file" s'il ne reste rien de sûr.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "";
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "-") // remplace tout caractère non sûr
    .replace(/-+/g, "-") // évite les tirets répétés
    .replace(/^[.-]+/, "") // pas de point/tiret en tête (évite "..", fichiers cachés)
    .slice(0, 100) // borne la longueur
    .replace(/[.-]+$/, ""); // pas de point/tiret en fin (y compris après la coupe)
  return cleaned || "file";
}

/** Construit une clé d'objet R2 unique (UUID) et sûre, préfixée par un dossier logique. */
export function mediaKey(keyPrefix: MediaPrefix, filename: string): string {
  const safeName = sanitizeFilename(filename);
  return `${keyPrefix}/${randomUUID()}-${safeName}`;
}

/**
 * Écrit un objet dans le bucket R2 (binding) et renvoie sa clé et son chemin
 * same-origin servi par `app/api/media/[...key]/route.ts`.
 * Le caller DOIT avoir vérifié l'autorisation, le contentType ET la taille avant d'appeler.
 */
export async function putMedia(
  bucket: R2Bucket,
  keyPrefix: MediaPrefix,
  filename: string,
  contentType: string,
  body: ArrayBuffer
): Promise<{ key: string; path: string }> {
  const key = mediaKey(keyPrefix, filename);
  await bucket.put(key, body, { httpMetadata: { contentType } });
  return { key, path: `/api/media/${key}` };
}
