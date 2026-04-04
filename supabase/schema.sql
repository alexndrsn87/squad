-- ============================================================
-- SQUAD — Full Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  nickname    text,
  email       text UNIQUE NOT NULL,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE public.teams (
  id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                   text NOT NULL,
  owner_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  format                 int NOT NULL CHECK (format IN (5, 6, 7)) DEFAULT 5,
  venue                  text,
  subscription_status    text NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'basic', 'pro')),
  stripe_subscription_id text,
  created_at             timestamptz DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view teams" ON public.teams
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Team owners can update teams" ON public.teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE public.team_members (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id            uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_position text DEFAULT 'midfield' CHECK (preferred_position IN ('attacking', 'midfield', 'defensive', 'goalkeeper')),
  joined_at          timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Membership check outside RLS to avoid infinite recursion: roster policy must not
-- subquery team_members directly (that re-triggers this same policy).
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

CREATE POLICY "Team members can view roster" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
    OR public.user_is_member_of_team(team_id)
  );

CREATE POLICY "Team owners can manage members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can join teams" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- GAMES
-- ============================================================
CREATE TABLE public.games (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id          uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  scheduled_at     timestamptz NOT NULL,
  poll_opens_at    timestamptz,
  cost_per_player  decimal(10,2) DEFAULT 0,
  status           text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'polling', 'teams_picked', 'completed', 'cancelled')),
  team_a_label     text DEFAULT 'Bibs',
  team_b_label     text DEFAULT 'Skins',
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- Auto-calculate poll_opens_at (72h before game) if not set
CREATE OR REPLACE FUNCTION set_poll_opens_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.poll_opens_at IS NULL THEN
    NEW.poll_opens_at := NEW.scheduled_at - INTERVAL '72 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_set_poll_opens_at
  BEFORE INSERT OR UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION set_poll_opens_at();

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view games" ON public.games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members WHERE team_id = games.team_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = games.team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Team owners can manage games" ON public.games
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- ============================================================
-- AVAILABILITY
-- ============================================================
CREATE TABLE public.availability (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id            uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status             text NOT NULL CHECK (status IN ('in', 'out', 'maybe', 'reserve')),
  payment_status     text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_intent_id  text,
  responded_at       timestamptz DEFAULT now(),
  UNIQUE (game_id, user_id)
);

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view availability for their games" ON public.availability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.team_members tm ON tm.team_id = g.team_id
      WHERE g.id = availability.game_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can manage their own availability" ON public.availability
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Team owners can manage all availability" ON public.availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE g.id = availability.game_id AND t.owner_id = auth.uid()
    )
  );

-- ============================================================
-- GAME TEAMS (once teams are picked)
-- ============================================================
CREATE TABLE public.game_teams (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id      uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team         text NOT NULL CHECK (team IN ('A', 'B')),
  assigned_at  timestamptz DEFAULT now(),
  UNIQUE (game_id, user_id)
);

ALTER TABLE public.game_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view game teams" ON public.game_teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.team_members tm ON tm.team_id = g.team_id
      WHERE g.id = game_teams.game_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage game teams" ON public.game_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.teams t ON t.id = g.team_id
      WHERE g.id = game_teams.game_id AND t.owner_id = auth.uid()
    )
  );

-- ============================================================
-- RATINGS (never exposed to users — algorithm only)
-- ============================================================
CREATE TABLE public.ratings (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id     uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  rater_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ratee_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score       int NOT NULL CHECK (score BETWEEN 1 AND 10),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (game_id, rater_id, ratee_id),
  CHECK (rater_id != ratee_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- NO SELECT policy for users — ratings are invisible to all users
-- Only service role (server-side) can read ratings
CREATE POLICY "Players can insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM public.game_teams WHERE game_id = ratings.game_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- MOTM VOTES
-- ============================================================
CREATE TABLE public.motm_votes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id     uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  voter_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nominee_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (game_id, voter_id),
  CHECK (voter_id != nominee_id)
);

ALTER TABLE public.motm_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert motm votes" ON public.motm_votes
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id AND
    EXISTS (
      SELECT 1 FROM public.game_teams WHERE game_id = motm_votes.game_id AND user_id = auth.uid()
    )
  );

-- Players can see vote COUNTS (not who voted for whom)
CREATE POLICY "Players can view motm votes for their games" ON public.motm_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.team_members tm ON tm.team_id = g.team_id
      WHERE g.id = motm_votes.game_id AND tm.user_id = auth.uid()
    )
  );

-- ============================================================
-- PLAYER STATS (cached, updated server-side after each game)
-- ============================================================
CREATE TABLE public.player_stats (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id               uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  games_played          int NOT NULL DEFAULT 0,
  avg_rating            decimal(4,2) DEFAULT 0,
  form_score            decimal(4,2) DEFAULT 0,
  ability_score         decimal(4,2) DEFAULT 0,
  motm_count            int NOT NULL DEFAULT 0,
  games_missed_priority int NOT NULL DEFAULT 0,
  last_updated          timestamptz DEFAULT now(),
  UNIQUE (user_id, team_id)
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Players can see their own stats. Organisers can see all team stats.
-- MOTM count visible; ratings-derived scores are implementation details never shown in UI
CREATE POLICY "Players can view stats in their teams" ON public.player_stats
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.team_members WHERE team_id = player_stats.team_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- KITTY (team group fund)
-- ============================================================
CREATE TABLE public.kitty (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id       uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance       decimal(10,2) NOT NULL DEFAULT 0,
  last_updated  timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.kitty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view kitty balances" ON public.kitty
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members WHERE team_id = kitty.team_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = kitty.team_id AND owner_id = auth.uid())
  );

CREATE TABLE public.kitty_transactions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id      uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount       decimal(10,2) NOT NULL,
  type         text NOT NULL CHECK (type IN ('top_up', 'game_payment', 'chip_in', 'reward', 'refund')),
  description  text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.kitty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view kitty transactions" ON public.kitty_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members WHERE team_id = kitty_transactions.team_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- CHIP-IN ITEMS (group purchases split across players)
-- ============================================================
CREATE TABLE public.chip_in_items (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id           uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by        uuid NOT NULL REFERENCES public.users(id),
  name              text NOT NULL,
  total_cost        decimal(10,2) NOT NULL,
  per_player_amount decimal(10,2) NOT NULL,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.chip_in_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view chip-in items" ON public.chip_in_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members WHERE team_id = chip_in_items.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage chip-in items" ON public.chip_in_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- ============================================================
-- PRIORITY CREDITS (rotation fairness system)
-- ============================================================
CREATE TABLE public.priority_credits (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id       uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credits       int NOT NULL DEFAULT 0,
  last_updated  timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.priority_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own credits" ON public.priority_credits
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- ============================================================
-- TEAM INVITES
-- ============================================================
CREATE TABLE public.team_invites (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by  uuid NOT NULL REFERENCES public.users(id),
  expires_at  timestamptz DEFAULT now() + INTERVAL '7 days',
  max_uses    int DEFAULT NULL,
  use_count   int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view valid invites" ON public.team_invites
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Team owners can manage invites" ON public.team_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- ============================================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Update player stats after game completion
-- Called server-side after ratings are submitted
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_player_stats(p_game_id uuid)
RETURNS void AS $$
DECLARE
  v_team_id uuid;
  player_record RECORD;
  v_avg_rating decimal;
  v_form_score decimal;
  v_ability_score decimal;
  recent_ratings decimal[];
  weight_factors decimal[] := ARRAY[0.30, 0.25, 0.20, 0.15, 0.10];
  v_idx int;
BEGIN
  -- Get team for this game
  SELECT team_id INTO v_team_id FROM public.games WHERE id = p_game_id;

  -- For each player who played in this game
  FOR player_record IN
    SELECT gt.user_id
    FROM public.game_teams gt
    WHERE gt.game_id = p_game_id
  LOOP
    -- Calculate all-time average rating (hidden from UI)
    SELECT AVG(score)::decimal(4,2) INTO v_avg_rating
    FROM public.ratings
    WHERE ratee_id = player_record.user_id
      AND game_id IN (
        SELECT gt2.game_id FROM public.game_teams gt2
        JOIN public.games g2 ON g2.id = gt2.game_id
        WHERE g2.team_id = v_team_id
      );

    -- Calculate form score (weighted last 5 games)
    SELECT ARRAY_AGG(avg_game_rating ORDER BY game_date DESC)
    INTO recent_ratings
    FROM (
      SELECT
        AVG(r.score) as avg_game_rating,
        g.scheduled_at as game_date
      FROM public.ratings r
      JOIN public.games g ON g.id = r.game_id
      WHERE r.ratee_id = player_record.user_id
        AND g.team_id = v_team_id
        AND g.status = 'completed'
      GROUP BY g.id, g.scheduled_at
      ORDER BY g.scheduled_at DESC
      LIMIT 5
    ) recent;

    v_form_score := 0;
    IF recent_ratings IS NOT NULL THEN
      FOR v_idx IN 1..LEAST(array_length(recent_ratings, 1), 5) LOOP
        v_form_score := v_form_score + (recent_ratings[v_idx] * weight_factors[v_idx]);
      END LOOP;
    END IF;

    -- Ability score = 50% avg + 50% form
    v_ability_score := COALESCE(v_avg_rating, 5.0) * 0.5 + COALESCE(v_form_score, 5.0) * 0.5;

    -- Upsert player stats
    INSERT INTO public.player_stats (user_id, team_id, games_played, avg_rating, form_score, ability_score, last_updated)
    VALUES (player_record.user_id, v_team_id, 1, COALESCE(v_avg_rating, 0), v_form_score, v_ability_score, now())
    ON CONFLICT (user_id, team_id)
    DO UPDATE SET
      games_played = player_stats.games_played + 1,
      avg_rating = COALESCE(v_avg_rating, player_stats.avg_rating),
      form_score = v_form_score,
      ability_score = v_ability_score,
      games_missed_priority = 0, -- reset on play
      last_updated = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_games_team_id ON public.games(team_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_scheduled_at ON public.games(scheduled_at);
CREATE INDEX idx_availability_game_id ON public.availability(game_id);
CREATE INDEX idx_availability_user_id ON public.availability(user_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_ratings_ratee_id ON public.ratings(ratee_id);
CREATE INDEX idx_player_stats_team_id ON public.player_stats(team_id);
CREATE INDEX idx_kitty_team_id ON public.kitty(team_id);
