import { createClient } from './client'

const BUCKETS = {
  products: 'products',
  categories: 'categories',
  avatars: 'avatars',
} as const

type BucketName = keyof typeof BUCKETS

export async function uploadImage(
  bucket: BucketName,
  file: File,
  path?: string
): Promise<{ url: string; path: string; error: Error | null }> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName =
    path || `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKETS[bucket])
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { url: '', path: '', error }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(data.path)

  return { url: publicUrl, path: data.path, error: null }
}

export async function deleteImage(
  bucket: BucketName,
  path: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  const { error } = await supabase.storage.from(BUCKETS[bucket]).remove([path])

  return { error }
}

export function getImageUrl(bucket: BucketName, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS[bucket]}/${path}`
}

export { BUCKETS }
