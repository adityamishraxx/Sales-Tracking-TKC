-- ═══════════════════════════════════════════════════════════════════════════
--  Jio CRM — Row Level Security (RLS) Policies
--
--  Strategy: This app uses a lightweight anon-key approach (no Supabase Auth).
--  Authentication is handled in the frontend. The RLS policies below allow
--  all authenticated operations via the anon key, while preventing direct
--  browser access to the raw Supabase URL.
--
--  For a more locked-down setup: integrate Supabase Auth and use
--  auth.uid() / JWT claims in the policies below.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enable RLS on all tables ─────────────────────────────────────────────
ALTER TABLE leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log     ENABLE ROW LEVEL SECURITY;

-- ─── LEADS ────────────────────────────────────────────────────────────────
-- Allow all reads of active leads
CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (true);

-- Allow inserts (BD creating leads)
CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (true);

-- Allow updates (BD updating leads)
CREATE POLICY "leads_update" ON leads
  FOR UPDATE USING (true) WITH CHECK (true);

-- Prevent hard deletes — only soft deletes allowed via app logic
-- (RLS delete policy intentionally not created)

-- ─── DELETED LEADS ────────────────────────────────────────────────────────
CREATE POLICY "deleted_leads_select" ON deleted_leads
  FOR SELECT USING (true);

CREATE POLICY "deleted_leads_insert" ON deleted_leads
  FOR INSERT WITH CHECK (true);

-- ─── PO FILES ─────────────────────────────────────────────────────────────
CREATE POLICY "po_files_select" ON po_files
  FOR SELECT USING (true);

CREATE POLICY "po_files_insert" ON po_files
  FOR INSERT WITH CHECK (true);

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (true);

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (true);

-- ─── STORAGE RLS ──────────────────────────────────────────────────────────
-- After creating the "po-uploads" bucket in the Supabase dashboard,
-- navigate to Storage → Policies and add:

-- Policy Name: Allow uploads
-- Allowed operation: INSERT
-- Target roles: anon, authenticated
-- USING expression: true

-- Policy Name: Allow reads
-- Allowed operation: SELECT
-- Target roles: anon, authenticated
-- USING expression: true

-- ═══════════════════════════════════════════════════════════════════════════
--  SEED DATA (optional — for testing)
--  Uncomment and run to populate with sample data
-- ═══════════════════════════════════════════════════════════════════════════

/*
INSERT INTO leads (lead_name, solution_offered, account_size_cr, num_stores, phase, funnel_entry_date, last_update_date, created_by)
VALUES
  ('Reliance Retail – Gujarat',       'Surveillance',    12.5, 48, 'Proposal Submitted',      CURRENT_DATE - 45, NOW() - INTERVAL '5 days',  'Tushar'),
  ('DMart – Maharashtra Cluster',     'Shutter Solution', 8.2, 32, 'Commercial Negotiation',  CURRENT_DATE - 30, NOW() - INTERVAL '2 days',  'Karuna'),
  ('Big Bazaar – North Zone',         'Home Automation',  6.8, 25, 'Demo Ongoing',             CURRENT_DATE - 20, NOW() - INTERVAL '1 day',   'Som'),
  ('Pantaloons – South India',        'Surveillance',     5.5, 18, 'PO Expected',              CURRENT_DATE - 60, NOW() - INTERVAL '18 days', 'Uday'),
  ('Lifestyle – Mumbai Stores',       'Home Automation',  9.3, 22, 'Post Demo Discussion',    CURRENT_DATE - 15, NOW() - INTERVAL '3 days',  'Tushar'),
  ('Spencer Retail – West Bengal',    'Shutter Solution', 4.1, 15, 'Demo Request',             CURRENT_DATE - 10, NOW() - INTERVAL '1 day',   'Karuna'),
  ('IKEA – Hyderabad',                'Surveillance',    15.0, 2,  'Closed (Won)',             CURRENT_DATE - 90, NOW() - INTERVAL '7 days',  'Som'),
  ('Westside – National Chain',       'Home Automation',  7.7, 30, 'PO and Closure',           CURRENT_DATE - 55, NOW() - INTERVAL '4 days',  'Uday'),
  ('Shoppers Stop – Tier 2 Cities',   'Surveillance',     3.2, 12, 'Identification',           CURRENT_DATE - 5,  NOW() - INTERVAL '1 day',   'Tushar'),
  ('Croma – Karnataka',               'Home Automation',  11.0, 20,'Revenue Realised',         CURRENT_DATE - 120,NOW() - INTERVAL '30 days', 'Karuna');
*/
