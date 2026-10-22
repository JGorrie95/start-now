"use client";
// Your profile photo: how it's shown, and how a new one is saved.
import { createClient } from "@/lib/supabase/client";
import { SparkMark } from "@/app/spark-mark";

// A round photo, or the Start Now mark on green when there isn't one yet.
export function Avatar({ url, size = 44, label = "Your profile photo" }: { url: string | null | undefined; size?: number; label?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={label} width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }} />;
  }
  return (
    <span role="img" aria-label={label} style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(150deg, #1F5A4B 0%, #2B735F 55%, #368268 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <SparkMark size={Math.round(size * 0.52)} stroke="#FFFFFF" dot="#9FD9C6" />
    </span>
  );
}

// Phone photos are big (often 3–5 MB). This makes a 512×512 square from the middle of
// the photo, which is plenty for a profile picture and uploads in a blink.
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo couldn't be opened."));
    };
    img.src = url;
  });
}

async function squarePhoto(file: File, size = 512): Promise<Blob> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("That photo couldn't be opened.");
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("That photo couldn't be saved."))), "image/jpeg", 0.86),
  );
}

// A small photo for people without an account. It becomes a tiny picture saved on this
// device only (nothing is uploaded). Resolves with the picture, or a friendly error.
export async function makeLocalPhoto(file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return { error: "Please choose a photo." };
  try {
    const blob = await squarePhoto(file, 256);
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("That photo couldn't be opened."));
      reader.readAsDataURL(blob);
    });
    return { url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "That photo couldn't be opened." };
  }
}

// Saves a new profile photo. Resolves with its web address, or a friendly error.
export async function uploadAvatar(file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return { error: "Please choose a photo." };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  let photo: Blob;
  try {
    photo = await squarePhoto(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "That photo couldn't be opened." };
  }

  const path = `${user.id}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, photo, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    return { error: "The photo didn't save. Please try again in a minute." };
  }

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`; // a new address, so phones don't show the old photo
  const { error: saveError } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (saveError) {
    console.error("Avatar save error:", saveError);
    return { error: "The photo didn't save. Please try again in a minute." };
  }
  return { url };
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: "That didn't work. Please try again in a minute." };
  await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);
  return {};
}
