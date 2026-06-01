import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("Configuration R2 manquante (variables d'environnement)");
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function createR2Client(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string
) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

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

/**
 * Génère une URL d'upload présignée pour une clé préfixée.
 * Le caller DOIT avoir vérifié l'autorisation et le contentType avant d'appeler.
 */
export async function createPresignedUpload(
  keyPrefix: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl: baseUrl } =
    getR2Config();
  // Seul le nom assaini est utilisé pour composer la clé (et donc l'URL publique),
  // ce qui garantit une clé/URL sûre et cohérente.
  const safeName = sanitizeFilename(filename);
  const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(
    createR2Client(accountId, accessKeyId, secretAccessKey),
    command,
    { expiresIn: 300 }
  );

  return { uploadUrl, publicUrl: `${baseUrl}/${key}` };
}
