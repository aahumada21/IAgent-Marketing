 "use client";
 import { supabase } from "@/lib/supabase/client";

 /**
  * Config: define si usas URL pública o Signed URL.
  * - Público: bucket 'content' public => true y policy de SELECT.
  * - Privado: public => false y usamos signed URL (1 año por defecto).
  * Cambia este flag según tu preferencia o usa una env var.
  */
 const USE_PUBLIC_URL = false; // cambia a false para usar signed URLs

 /**
   * Sube un archivo a storage/content y retorna una URL usable.
  * - Si USE_PUBLIC_URL = true -> getPublicUrl
  * - Si USE_PUBLIC_URL = false -> createSignedUrl (expira en 31536000 s ~ 1 año)
  */
 export async function uploadImageAndGetUrl(
   f: File,
   orgId: string | null
 ): Promise<string> {
   const path = `${orgId ?? "org"}/${crypto.randomUUID()}_${f.name}`;
   const { data, error } = await supabase.storage
     .from("content")
     .upload(path, f, { cacheControl: "3600", upsert: false });
   if (error) {
     if (String(error.message).toLowerCase().includes("not found")) {
       throw new Error("Bucket 'content' no existe en este proyecto. Créalo (privado) y vuelve a intentar.");
     }
     throw error;
     }

   if (USE_PUBLIC_URL) {
     const { data: pub } = supabase.storage.from("content").getPublicUrl(data.path);
     return pub.publicUrl;
   } else {
     const { data: signed, error: sErr } = await supabase.storage
       .from("content")
       .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 año
     if (sErr || !signed?.signedUrl) throw sErr ?? new Error("No signed URL");
     return signed.signedUrl;
   }
 }
