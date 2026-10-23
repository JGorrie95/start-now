"use client";
// Your profile photo: how it's shown, and how a new one is saved.
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { colors, tint } from "@/app/theme";

// The colours a letter circle can be (the same ones as the quick start tiles).
const letterColours = ["var(--g-lagoon)", "var(--g-dusk)", "var(--g-tide)", "var(--g-ember)", "var(--g-rose)"];

// The same name always gets the same colour, so a friend stays easy to spot.
function colourFor(name: string) {
  let sum = 0;
  for (const ch of name.toLowerCase()) sum = (sum * 31 + ch.charCodeAt(0)) % 9973;
  return letterColours[sum % letterColours.length];
}

// A round photo. With no photo: a circle with the first letter of the name, or, with no
// name yet, a plain person outline.
export function Avatar({ url, size = 44, label = "Your profile photo", name }: { url: string | null | undefined; size?: number; label?: string; name?: string | null }) {
  // If a photo can't load (offline, or it was removed), show the fallback instead of a broken image.
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  if (url && url !== brokenUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={label} width={size} height={size} onError={() => setBrokenUrl(url)} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }} />;
  }
  const initial = (name ?? "").trim().charAt(0).toUpperCase();
  if (initial) {
    return (
      <span role="img" aria-label={label} style={{ width: size, height: size, borderRadius: "50%", background: colourFor(name ?? ""), color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: Math.round(size * 0.46), lineHeight: 1, textDecoration: "none", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
        {initial}
      </span>
    );
  }
  return (
    <span role="img" aria-label={label} style={{ width: size, height: size, borderRadius: "50%", background: tint(colors.ink, 0.1), color: colors.inkSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={Math.round(size * 0.52)} height={Math.round(size * 0.52)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.8" />
        <path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
      </svg>
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
    const blob = await squarePhoto(file, 400);
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

// Saves a new profile photo for friends to see. Resolves with its web address, or a friendly error.
export async function uploadAvatar(file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return { error: "Please choose a photo." };
  let photo: Blob;
  try {
    photo = await squarePhoto(file);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "That photo couldn't be opened." };
  }
  return savePhoto(photo);
}

// Shares the photo that's on this phone with friends (only when someone ticks the box).
export async function shareLocalPhoto(dataUrl: string): Promise<{ url?: string; error?: string }> {
  try {
    const photo = await (await fetch(dataUrl)).blob();
    return savePhoto(photo);
  } catch {
    return { error: "The photo didn't save. You can add it later in Profile." };
  }
}

async function savePhoto(photo: Blob): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please join friends first." };

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
