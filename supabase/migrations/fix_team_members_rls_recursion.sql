-- Fix: infinite recursion detected in policy for relation "team_members"
-- Cause: the SELECT policy subqueried team_members, which re-evaluated the same policy.
-- Run in Supabase → SQL Editor (once per project).

CREATE OR REPLACE FUNCTION public.user_is_member_of_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = p_team_id AND tm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_member_of_team(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_member_of_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_member_of_team(uuid) TO service_role;

-- Either name may exist depending on which schema you started from.
DROP POLICY IF EXISTS "Team members can view roster" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;

CREATE POLICY "Team members can view roster" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
    OR public.user_is_member_of_team(team_id)
  );
