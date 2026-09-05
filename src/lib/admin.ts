import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "store-media";
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = ["jpg", "jpeg", "png", "webp", "avif", "gif", "mp4", "webm"];

/** Uploads to managed storage and returns the public URL served by our media route. */
export async function uploadMedia(file: File, folder = "products") {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.includes(ext)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, AVIF, MP4 or WEBM.");
  }
  if (file.size > MAX_BYTES) throw new Error("File is too large (20MB maximum).");

  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  return `/api/public/media/${path}`;
}

export function isVideoUrl(url: string | null | undefined) {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}
