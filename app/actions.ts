"use server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

// Dates are written like "2026-10-21".
function isDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function shiftDay(day: string, days: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "Today" should be the date on the person's phone, not the server's (the server runs on
// UTC, which is already tomorrow on a BC evening). Phones are at most a day either side.
function pickToday(phoneToday?: string) {
  const serverToday = new Date().toISOString().slice(0, 10);
  if (isDay(phoneToday) && Math.abs(Date.parse(`${phoneToday}T00:00:00Z`) - Date.parse(`${serverToday}T00:00:00Z`)) <= 86_400_000) {
    return phoneToday;
  }
  return serverToday;
}

export async function completeStep(phoneToday?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const today = pickToday(phoneToday);

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_count, longest_streak, last_completed_date")
    .eq("id", user.id)
    .single();

  // Already counted today (maybe on the phone, before joining friends).
  if (profile?.last_completed_date === today) {
    return { alreadyDone: true, streak: profile.streak_count ?? 0 };
  }

  const { error: insertError } = await supabase
    .from("streak_completions")
    .insert({ user_id: user.id, completed_date: today });

  if (insertError?.code === "23505") {
    return { alreadyDone: true, streak: profile?.streak_count ?? 0 };
  }

  if (insertError) return { error: "Failed to record" };

  const yesterdayStr = shiftDay(today, -1);

  const isConsecutive = profile?.last_completed_date === yesterdayStr;
  const newStreak = isConsecutive ? (profile?.streak_count ?? 0) + 1 : 1;
  const newLongest = Math.max(newStreak, profile?.longest_streak ?? 0);

  await supabase
    .from("profiles")
    .update({ streak_count: newStreak, longest_streak: newLongest, last_completed_date: today })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/friends");
  return { streak: newStreak, longest: newLongest };
}

// startingStreak: the streak that was saved on the phone before joining friends, so
// nobody loses their progress. It only carries over if it's still going.
export async function createProfile(
  username: string,
  startingStreak?: { count: number; longest: number; lastDate: string | null },
  phoneToday?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const clean = username.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    return { error: "3–20 characters: letters, numbers and _ only" };
  }

  const inviteCode = randomBytes(4).toString("hex");

  const today = pickToday(phoneToday);
  const carried =
    startingStreak && isDay(startingStreak.lastDate) && startingStreak.lastDate >= shiftDay(today, -1) && startingStreak.lastDate <= today
      ? startingStreak
      : null;
  const count = carried ? Math.min(3650, Math.max(0, Math.floor(carried.count) || 0)) : 0;
  const longest = Math.min(3650, Math.max(count, Math.floor(startingStreak?.longest ?? 0) || 0));

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username: clean,
    invite_code: inviteCode,
    ...(count > 0 || longest > 0
      ? { streak_count: count, longest_streak: longest, last_completed_date: carried ? carried.lastDate : null }
      : {}),
  });

  if (error?.code === "23505") return { error: "That name is taken. Try another one." };
  if (error) {
    console.error("createProfile error:", error);
    return { error: "That didn't work. Please try again in a minute." };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function sendFriendRequest(targetUsername: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", targetUsername.toLowerCase().trim())
    .single();

  if (!target) return { error: "User not found" };
  if (target.id === user.id) return { error: "That's you!" };

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: target.id,
  });

  if (error?.code === "23505") return { error: "Request already sent" };
  if (error) return { error: "Failed to send request" };

  revalidatePath("/friends");
  return { success: true };
}

export async function acceptFriendRequest(requesterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", requesterId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "Failed to accept" };

  revalidatePath("/friends");
  return { success: true };
}

export async function addFriendByInvite(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: inviter } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("invite_code", inviteCode)
    .single();

  if (!inviter) return { error: "Invalid invite link" };
  if (inviter.id === user.id) return { error: "That's your own invite!" };

  // Insert with accepted status — invite = auto-accept
  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: inviter.id,
    status: "accepted",
  });

  if (error?.code === "23505") return { error: "Already friends" };
  if (error) return { error: "Failed to add friend" };

  revalidatePath("/friends");
  return { success: true, inviterUsername: inviter.username };
}

// Settings > "Leave friends" / "Delete my account". Deletes everything the database holds
// about this person: their circle, streak, photo, profile, and the account itself.
// Their streak was already copied back onto their phone before this runs.
export async function leaveFriends() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  // Photos can only be removed through Supabase's Storage, so do that first.
  await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);

  // delete_my_account (supabase/migrations) removes the rows and the account in one go.
  const { error: rpcError } = await supabase.rpc("delete_my_account");
  if (rpcError) {
    // Not set up yet: remove what we can row by row.
    console.error("delete_my_account error:", rpcError);
    await supabase.from("friendships").delete().or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    await supabase.from("streak_completions").delete().eq("user_id", user.id);
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    if (error) console.error("leaveFriends profile delete error:", error);
  }

  revalidatePath("/friends");
  return { success: true, fullyDeleted: !rpcError };
}
