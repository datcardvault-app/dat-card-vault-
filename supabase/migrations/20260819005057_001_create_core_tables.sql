/*
# DatCARDVault Core Schema

## Overview
Creates the core tables for DatCARDVault — a pocket business assistant for TCG vendors.
Supports scanning, storing, labeling cards, tracking sealed products, buying deals,
earnings, calendar notes, teams, nudges, and feedback.

## Tables Created
1. users — vendor profiles (business info, theme, currency, scan settings)
2. cards — trading cards inventory (name, game, set, condition, prices, images)
3. labels — QR price labels linked to cards
4. scan_logs — scan history log
5. sealed_products — sealed product inventory with barcodes
6. buying_deals — consignment/buying deals with profit splits
7. calendar_notes — calendar events and notes
8. earnings_snapshots — daily earnings summary snapshots
9. daily_earnings — daily earnings tracking
10. feedback — user feedback (positive/negative)
11. teams — team groups
12. team_members — team membership
13. nudges — nudge messages between team members
14. nudge_replies — replies to nudges
15. activity_logs — activity logging
16. presence — online presence tracking

## Security
- RLS enabled on ALL tables
- Owner-scoped CRUD policies (auth.uid() = user_id) for user data tables
- Team-scoped access for team-related tables
- All owner columns default to auth.uid()
*/

-- ============ USERS ============
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  name text,
  username text,
  username_last_changed timestamptz,
  business_name text,
  currency text DEFAULT 'GBP',
  theme_mode text DEFAULT 'dark',
  scan_sound boolean DEFAULT false,
  scan_sound_type text DEFAULT 'cash',
  scan_haptics boolean DEFAULT false,
  event_active boolean DEFAULT false,
  onboarding_complete boolean DEFAULT false,
  sender_email text DEFAULT 'datcardvault@gmail.com',
  instagram text,
  website text,
  sale_target numeric,
  sale_target_set_at date,
  is_affiliated boolean DEFAULT false,
  is_supporter boolean DEFAULT false,
  suspended boolean DEFAULT false,
  logo_storage_id text,
  profile_image_storage_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user" ON users;
CREATE POLICY "select_own_user" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_user" ON users;
CREATE POLICY "insert_own_user" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_user" ON users;
CREATE POLICY "update_own_user" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ CARDS ============
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  game text DEFAULT 'Pokémon',
  set_name text,
  card_number text,
  condition text DEFAULT 'Near Mint',
  rarity text,
  grade text,
  language text DEFAULT 'English',
  market_value numeric DEFAULT 0,
  purchase_price numeric DEFAULT 0,
  sold boolean DEFAULT false,
  sold_date date,
  notes text,
  image_storage_id text,
  image_back_storage_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cards" ON cards;
CREATE POLICY "select_own_cards" ON cards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cards" ON cards;
CREATE POLICY "insert_own_cards" ON cards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cards" ON cards;
CREATE POLICY "update_own_cards" ON cards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cards" ON cards;
CREATE POLICY "delete_own_cards" ON cards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_sold ON cards(sold);

-- ============ LABELS ============
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
  qr_value text,
  label_data jsonb,
  currency text DEFAULT 'GBP',
  width_mm numeric DEFAULT 56,
  height_mm numeric DEFAULT 35,
  print_count integer DEFAULT 0,
  printed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_labels" ON labels;
CREATE POLICY "select_own_labels" ON labels FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_labels" ON labels;
CREATE POLICY "insert_own_labels" ON labels FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_labels" ON labels;
CREATE POLICY "update_own_labels" ON labels FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_labels" ON labels;
CREATE POLICY "delete_own_labels" ON labels FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);
CREATE INDEX IF NOT EXISTS idx_labels_card_id ON labels(card_id);

-- ============ SCAN LOGS ============
CREATE TABLE IF NOT EXISTS scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  label_id uuid REFERENCES labels(id) ON DELETE SET NULL,
  qr_value text,
  action text DEFAULT 'scan',
  scanned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scan_logs" ON scan_logs;
CREATE POLICY "select_own_scan_logs" ON scan_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scan_logs" ON scan_logs;
CREATE POLICY "insert_own_scan_logs" ON scan_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scan_logs" ON scan_logs;
CREATE POLICY "delete_own_scan_logs" ON scan_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);

-- ============ SEALED PRODUCTS ============
CREATE TABLE IF NOT EXISTS sealed_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  game text DEFAULT 'Pokémon',
  type text DEFAULT 'Other',
  barcode text,
  quantity integer DEFAULT 1,
  purchase_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sealed_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sealed_products" ON sealed_products;
CREATE POLICY "select_own_sealed_products" ON sealed_products FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sealed_products" ON sealed_products;
CREATE POLICY "insert_own_sealed_products" ON sealed_products FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sealed_products" ON sealed_products;
CREATE POLICY "update_own_sealed_products" ON sealed_products FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sealed_products" ON sealed_products;
CREATE POLICY "delete_own_sealed_products" ON sealed_products FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sealed_products_user_id ON sealed_products(user_id);

-- ============ BUYING DEALS ============
CREATE TABLE IF NOT EXISTS buying_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  card_count integer DEFAULT 1,
  card_price numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  pct numeric DEFAULT 80,
  you_keep numeric DEFAULT 0,
  note text,
  date date DEFAULT CURRENT_DATE,
  at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buying_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_buying_deals" ON buying_deals;
CREATE POLICY "select_own_buying_deals" ON buying_deals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_buying_deals" ON buying_deals;
CREATE POLICY "insert_own_buying_deals" ON buying_deals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_buying_deals" ON buying_deals;
CREATE POLICY "update_own_buying_deals" ON buying_deals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_buying_deals" ON buying_deals;
CREATE POLICY "delete_own_buying_deals" ON buying_deals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_buying_deals_user_id ON buying_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_buying_deals_date ON buying_deals(date);

-- ============ CALENDAR NOTES ============
CREATE TABLE IF NOT EXISTS calendar_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_calendar_notes" ON calendar_notes;
CREATE POLICY "select_own_calendar_notes" ON calendar_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_calendar_notes" ON calendar_notes;
CREATE POLICY "insert_own_calendar_notes" ON calendar_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_calendar_notes" ON calendar_notes;
CREATE POLICY "update_own_calendar_notes" ON calendar_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_calendar_notes" ON calendar_notes;
CREATE POLICY "delete_own_calendar_notes" ON calendar_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_notes_user_id ON calendar_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON calendar_notes(date);

-- ============ EARNINGS SNAPSHOTS ============
CREATE TABLE IF NOT EXISTS earnings_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_earned numeric DEFAULT 0,
  cards_sold integer DEFAULT 0,
  top_card text,
  top_card_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE earnings_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_earnings_snapshots" ON earnings_snapshots;
CREATE POLICY "select_own_earnings_snapshots" ON earnings_snapshots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_earnings_snapshots" ON earnings_snapshots;
CREATE POLICY "insert_own_earnings_snapshots" ON earnings_snapshots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_earnings_snapshots" ON earnings_snapshots;
CREATE POLICY "update_own_earnings_snapshots" ON earnings_snapshots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_earnings_snapshots" ON earnings_snapshots;
CREATE POLICY "delete_own_earnings_snapshots" ON earnings_snapshots FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_earnings_snapshots_user_id ON earnings_snapshots(user_id);

-- ============ DAILY EARNINGS ============
CREATE TABLE IF NOT EXISTS daily_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric DEFAULT 0,
  source text,
  card_id uuid REFERENCES cards(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily_earnings" ON daily_earnings;
CREATE POLICY "select_own_daily_earnings" ON daily_earnings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily_earnings" ON daily_earnings;
CREATE POLICY "insert_own_daily_earnings" ON daily_earnings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily_earnings" ON daily_earnings;
CREATE POLICY "update_own_daily_earnings" ON daily_earnings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_daily_earnings" ON daily_earnings;
CREATE POLICY "delete_own_daily_earnings" ON daily_earnings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_earnings_user_id ON daily_earnings(user_id);

-- ============ FEEDBACK ============
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  name text,
  message text NOT NULL,
  type text DEFAULT 'positive',
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_feedback" ON feedback;
CREATE POLICY "update_own_feedback" ON feedback FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_feedback" ON feedback;
CREATE POLICY "delete_own_feedback" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ TEAMS ============
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_teams" ON teams;
CREATE POLICY "select_own_teams" ON teams FOR SELECT
  TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "insert_own_teams" ON teams;
CREATE POLICY "insert_own_teams" ON teams FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_own_teams" ON teams;
CREATE POLICY "update_own_teams" ON teams FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_own_teams" ON teams;
CREATE POLICY "delete_own_teams" ON teams FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- ============ TEAM MEMBERS ============
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_team_members" ON team_members;
CREATE POLICY "select_own_team_members" ON team_members FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()));

DROP POLICY IF EXISTS "insert_own_team_members" ON team_members;
CREATE POLICY "insert_own_team_members" ON team_members FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()));

DROP POLICY IF EXISTS "delete_own_team_members" ON team_members;
CREATE POLICY "delete_own_team_members" ON team_members FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============ NUDGES ============
CREATE TABLE IF NOT EXISTS nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  from_name text,
  sent_at bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_nudges" ON nudges;
CREATE POLICY "select_own_nudges" ON nudges FOR SELECT
  TO authenticated USING (auth.uid() = from_user_id OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = nudges.team_id AND team_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_nudges" ON nudges;
CREATE POLICY "insert_own_nudges" ON nudges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "delete_own_nudges" ON nudges;
CREATE POLICY "delete_own_nudges" ON nudges FOR DELETE
  TO authenticated USING (auth.uid() = from_user_id);

CREATE INDEX IF NOT EXISTS idx_nudges_team_id ON nudges(team_id);

-- ============ NUDGE REPLIES ============
CREATE TABLE IF NOT EXISTS nudge_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  from_name text,
  sent_at bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nudge_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_nudge_replies" ON nudge_replies;
CREATE POLICY "select_own_nudge_replies" ON nudge_replies FOR SELECT
  TO authenticated USING (auth.uid() = from_user_id OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = nudge_replies.team_id AND team_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_nudge_replies" ON nudge_replies;
CREATE POLICY "insert_own_nudge_replies" ON nudge_replies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "delete_own_nudge_replies" ON nudge_replies;
CREATE POLICY "delete_own_nudge_replies" ON nudge_replies FOR DELETE
  TO authenticated USING (auth.uid() = from_user_id);

CREATE INDEX IF NOT EXISTS idx_nudge_replies_team_id ON nudge_replies(team_id);

-- ============ ACTIVITY LOGS ============
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  action text,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity_logs" ON activity_logs;
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activity_logs" ON activity_logs;
CREATE POLICY "insert_own_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_activity_logs" ON activity_logs;
CREATE POLICY "delete_own_activity_logs" ON activity_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- ============ PRESENCE ============
CREATE TABLE IF NOT EXISTS presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'offline',
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_presence" ON presence;
CREATE POLICY "select_own_presence" ON presence FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_presence" ON presence;
CREATE POLICY "insert_own_presence" ON presence FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_presence" ON presence;
CREATE POLICY "update_own_presence" ON presence FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_presence" ON presence;
CREATE POLICY "delete_own_presence" ON presence FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence(user_id);

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('cards', 'cards', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cards bucket
DROP POLICY IF EXISTS "cards_bucket_select" ON storage.objects;
CREATE POLICY "cards_bucket_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'cards');

DROP POLICY IF EXISTS "cards_bucket_insert" ON storage.objects;
CREATE POLICY "cards_bucket_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'cards');

DROP POLICY IF EXISTS "cards_bucket_update" ON storage.objects;
CREATE POLICY "cards_bucket_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'cards') WITH CHECK (bucket_id = 'cards');

DROP POLICY IF EXISTS "cards_bucket_delete" ON storage.objects;
CREATE POLICY "cards_bucket_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'cards');

-- Storage policies for profiles bucket
DROP POLICY IF EXISTS "profiles_bucket_select" ON storage.objects;
CREATE POLICY "profiles_bucket_select" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles_bucket_insert" ON storage.objects;
CREATE POLICY "profiles_bucket_insert" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles_bucket_update" ON storage.objects;
CREATE POLICY "profiles_bucket_update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'profiles') WITH CHECK (bucket_id = 'profiles');

DROP POLICY IF EXISTS "profiles_bucket_delete" ON storage.objects;
CREATE POLICY "profiles_bucket_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'profiles');
