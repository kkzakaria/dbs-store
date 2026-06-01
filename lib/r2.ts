import type { R2Bucket } from "@cloudflare/workers-types";

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Réduit un nom de fichier fourni par le client à un token sûr pour une clé
 * d'objet R2 et pour une URL : on ne garde que le basename (pas de séparateurs
 * de répertoire ni de "../"), on n'autorise que [A-Za-z0-9._-], et on borne la
 * longueur. Le préfixe horodaté garantit déjà l'unicité de la clé, donc ce token
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

/** Construit une clé d'objet R2 unique et sûre, préfixée par un dossier logique. */
export function mediaKey(keyPrefix: string, filename: string): string {
  const safeName = sanitizeFilename(filename);
  return `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
}

/**
 * Écrit un objet dans le bucket R2 (binding) et renvoie sa clé et son chemin
 * same-origin servi par `app/api/media/[...key]/route.ts`.
 * Le caller DOIT avoir vérifié l'autorisation et le contentType avant d'appeler.
 */
export async function putMedia(
  bucket: R2Bucket,
  keyPrefix: string,
  filename: string,
  contentType: string,
  body: ArrayBuffer
): Promise<{ key: string; path: string }> {
  const key = mediaKey(keyPrefix, filename);
  await bucket.put(key, body, { httpMetadata: { contentType } });
  return { key, path: `/api/media/${key}` };
}
