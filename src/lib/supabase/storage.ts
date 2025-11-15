import { createServerClient } from './server'

/**
 * Upload an image to Supabase storage
 * @param bucket - The storage bucket name ('project-images' or 'blog-images')
 * @param file - The file to upload
 * @param path - Optional path within the bucket (e.g., 'project-name/image.jpg')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  bucket: 'project-images' | 'blog-images',
  file: File,
  path?: string
): Promise<string | null> {
  const supabase = createServerClient()

  // Generate a unique filename if path not provided
  const filename = path || `${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Delete an image from Supabase storage
 * @param bucket - The storage bucket name
 * @param path - The path to the file in the bucket
 */
export async function deleteImage(
  bucket: 'project-images' | 'blog-images',
  path: string
): Promise<boolean> {
  const supabase = createServerClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error('Error deleting image:', error)
    return false
  }

  return true
}

/**
 * Get the public URL for an image
 * @param bucket - The storage bucket name
 * @param path - The path to the file in the bucket
 */
export function getImageUrl(
  bucket: 'project-images' | 'blog-images',
  path: string
): string {
  const supabase = createServerClient()

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return publicUrl
}
