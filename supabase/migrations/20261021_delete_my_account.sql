-- Lets a signed-in person delete their own account completely (Apple requires this).
-- Run once in Supabase: SQL Editor > paste > Run.
-- Photos are removed by the app first (Supabase only allows that through its Storage API).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in';
  end if;
  delete from public.friendships where requester_id = me or addressee_id = me;
  delete from public.streak_completions where user_id = me;
  delete from public.profiles where id = me;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
