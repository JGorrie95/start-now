"use server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function completeStep() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const today = new Date().toISOString().split("T")[0];

  const { error: insertError } = await supabase
    .from("streak_completions")
    .insert({ user_id: user.id, completed_date: today });

  if (insertError?.code === "23505") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count")
      .eq("id", user.id)
      .single();
    return { alreadyDone: true, streak: profile?.streak_count ?? 0 };
  }

  if (insertError) return { error: "Failed to record" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("streak_count, longest_streak, last_completed_date")
    .eq("id", user.id)
    .single();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

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

export async function createProfile(username: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const clean = username.toLowerCase().trim();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    return { error: "3–20 chars, letters, numbers and _ only" };
  }

  const inviteCode = randomBytes(4).toString("hex");

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username: clean,
    invite_code: inviteCode,
  });

  if (error?.code === "23505") return { error: "Username already taken" };
  if (error) return { error: "Failed to create profile" };

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
