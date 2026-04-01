-- ============================================================
-- SCHEMA ADDITIONS — run after schema.sql
-- ============================================================

-- Team invite codes table (if not already in schema.sql)
CREATE TABLE IF NOT EXISTS team_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE,
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_invites_code_idx ON team_invites(code);
CREATE INDEX IF NOT EXISTS team_invites_team_id_idx ON team_invites(team_id);

-- RLS on team_invites
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read valid invite codes"
  ON team_invites FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Team owners can manage invites"
  ON team_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invites.team_id
        AND teams.owner_id = auth.uid()
    )
  );

-- ─── adjust_kitty function ───────────────────────────────────────────────────
-- Used by chip-in to adjust a member's kitty balance.
CREATE OR REPLACE FUNCTION adjust_kitty(
  p_team_id UUID,
  p_user_id UUID,
  p_amount  NUMERIC
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO kitty (team_id, user_id, balance, last_updated)
  VALUES (p_team_id, p_user_id, p_amount, NOW())
  ON CONFLICT (team_id, user_id) DO UPDATE
    SET balance      = kitty.balance + EXCLUDED.balance,
        last_updated = NOW();
END;
$$;

-- Unique constraint on kitty to allow ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kitty_team_id_user_id_key'
  ) THEN
    ALTER TABLE kitty ADD CONSTRAINT kitty_team_id_user_id_key UNIQUE (team_id, user_id);
  END IF;
END $$;

-- ─── update_player_stats callable with p_game_id param ───────────────────────
-- Some Supabase RPC calls use named params; ensure function signature matches.
CREATE OR REPLACE FUNCTION update_player_stats(p_game_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Get team_id for this game
  SELECT team_id INTO v_team_id FROM games WHERE id = p_game_id;

  -- Update avg_rating for all players who were rated in this game
  UPDATE player_stats ps
  SET
    avg_rating   = (
      SELECT AVG(r.score)::NUMERIC(5,2)
      FROM ratings r
      WHERE r.ratee_id = ps.user_id
        AND r.game_id IN (
          SELECT g.id FROM games g WHERE g.team_id = ps.team_id
        )
    ),
    form_score   = (
      SELECT COALESCE(AVG(r.score), 5)::NUMERIC(5,2)
      FROM ratings r
      WHERE r.ratee_id = ps.user_id
        AND r.game_id IN (
          SELECT g.id FROM games g
          WHERE g.team_id = ps.team_id
            AND g.status = 'completed'
          ORDER BY g.scheduled_at DESC
          LIMIT 5
        )
    ),
    last_updated = NOW()
  WHERE ps.team_id = v_team_id
    AND ps.user_id IN (
      SELECT DISTINCT ratee_id FROM ratings WHERE game_id = p_game_id
    );

  -- Recompute ability_score = 50% avg_rating + 50% form_score (normalised to 1–10 scale)
  UPDATE player_stats
  SET ability_score = (avg_rating * 0.5 + form_score * 0.5)
  WHERE team_id = v_team_id;

  -- Increment games_played for players who were 'in'
  UPDATE player_stats ps
  SET games_played = ps.games_played + 1
  WHERE ps.team_id = v_team_id
    AND ps.user_id IN (
      SELECT user_id FROM availability
      WHERE game_id = p_game_id AND status = 'in'
    )
    AND NOT EXISTS (
      SELECT 1 FROM ratings
      WHERE game_id = p_game_id AND rater_id = ps.user_id
        AND ps.games_played > (
          SELECT COUNT(*) FROM availability a2
          JOIN games g2 ON g2.id = a2.game_id
          WHERE a2.user_id = ps.user_id
            AND g2.team_id = ps.team_id
            AND g2.status = 'completed'
            AND g2.id != p_game_id
        )
    );

  -- Simpler: just ensure player_stats row exists for all 'in' players
  INSERT INTO player_stats (user_id, team_id, games_played)
  SELECT a.user_id, v_team_id, 1
  FROM availability a
  WHERE a.game_id = p_game_id AND a.status = 'in'
  ON CONFLICT (user_id, team_id) DO UPDATE
    SET games_played = player_stats.games_played + 1,
        last_updated = NOW();

END;
$$;
