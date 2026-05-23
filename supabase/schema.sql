-- ═══════════════════════════════════════════════════════════════════════════
--  Jio CRM — Supabase Database Schema
--  Version: 1.0.0
--  Run this entire file in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enable UUID extension ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enum types ───────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE solution_type AS ENUM (
    'Surveillance',
    'Shutter Solution',
    'Home Automation'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE phase_type AS ENUM (
    'Identification',
    'Demo Request',
    'Demo Ongoing',
    'Post Demo Discussion',
    'Proposal Submitted',
    'Commercial Negotiation',
    'PO Expected',
    'PO and Closure',
    'Closed (Won)',
    'Revenue Realised'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── TABLE: leads (Active Funnel) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_name         VARCHAR(255) NOT NULL,
  solution_offered  TEXT         NOT NULL,
  account_size_cr   NUMERIC(12,2) NOT NULL DEFAULT 0,
  num_stores        INTEGER      NOT NULL DEFAULT 1,
  phase             TEXT         NOT NULL,
  funnel_entry_date DATE         NOT NULL DEFAULT CURRENT_DATE,
  last_update_date  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by        VARCHAR(100) NOT NULL,
  is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
  deleted_by        VARCHAR(100),
  deleted_at        TIMESTAMP WITH TIME ZONE,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Computed: update_aging in days (virtual, can also be computed in app)
-- update_aging = CURRENT_DATE - last_update_date::date

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_is_deleted    ON leads(is_deleted);
CREATE INDEX IF NOT EXISTS idx_leads_phase          ON leads(phase);
CREATE INDEX IF NOT EXISTS idx_leads_solution       ON leads(solution_offered);
CREATE INDEX IF NOT EXISTS idx_leads_created_by     ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_entry_date     ON leads(funnel_entry_date);
CREATE INDEX IF NOT EXISTS idx_leads_last_update    ON leads(last_update_date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── TABLE: deleted_leads (Archive) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS deleted_leads (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_id   UUID         NOT NULL,
  lead_snapshot JSONB        NOT NULL,
  deleted_by    VARCHAR(100) NOT NULL,
  deleted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_deleted_leads_original_id ON deleted_leads(original_id);
CREATE INDEX IF NOT EXISTS idx_deleted_leads_deleted_by  ON deleted_leads(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_leads_deleted_at  ON deleted_leads(deleted_at);

-- ─── TABLE: po_files (PO / Payment Uploads) ───────────────────────────────
CREATE TABLE IF NOT EXISTS po_files (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID         NOT NULL REFERENCES leads(id) ON DELETE SET NULL,
  file_name   VARCHAR(500) NOT NULL,
  file_path   TEXT         NOT NULL,
  file_url    TEXT         NOT NULL,
  file_type   VARCHAR(10)  NOT NULL,    -- PDF, JPG, PNG, JPEG
  file_size   BIGINT,
  uploaded_by VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_files_lead_id     ON po_files(lead_id);
CREATE INDEX IF NOT EXISTS idx_po_files_uploaded_by ON po_files(uploaded_by);

-- ─── TABLE: audit_log (Audit Trail) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  action        VARCHAR(50)  NOT NULL,  -- CREATE, UPDATE, DELETE, PO_UPLOAD
  lead_id       UUID,
  performed_by  VARCHAR(100) NOT NULL,
  old_data      JSONB,
  new_data      JSONB,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_lead_id      ON audit_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_action       ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at   ON audit_log(created_at DESC);

-- ─── VIEWS ────────────────────────────────────────────────────────────────

-- Active funnel view (convenience, auto-calculates aging)
CREATE OR REPLACE VIEW active_funnel AS
SELECT
  id,
  lead_name,
  solution_offered,
  account_size_cr,
  num_stores,
  phase,
  funnel_entry_date,
  last_update_date,
  EXTRACT(DAY FROM (NOW() - last_update_date))::INTEGER AS update_aging_days,
  EXTRACT(DAY FROM (NOW() - funnel_entry_date))::INTEGER AS funnel_age_days,
  created_by,
  created_at
FROM leads
WHERE is_deleted = FALSE
ORDER BY created_at DESC;

-- Dashboard summary view
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  COUNT(*)                                          AS total_leads,
  SUM(account_size_cr)                              AS total_size_cr,
  AVG(account_size_cr)                              AS avg_size_cr,
  COUNT(*) FILTER (WHERE phase = 'Closed (Won)')    AS closed_won_count,
  SUM(account_size_cr) FILTER (WHERE phase = 'Closed (Won)') AS closed_won_size,
  COUNT(*) FILTER (WHERE phase = 'Revenue Realised') AS revenue_realised_count,
  SUM(account_size_cr) FILTER (WHERE phase = 'Revenue Realised') AS revenue_realised_size,
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM NOW() - last_update_date) > 14
  )                                                 AS stale_leads_count
FROM leads
WHERE is_deleted = FALSE;

-- ─── STORAGE BUCKET ───────────────────────────────────────────────────────
-- Run this in Supabase Dashboard → Storage → Create bucket named "po-uploads"
-- Set to public: true
-- Then apply the storage policy below.

-- Note: Storage bucket creation must be done via the Supabase Dashboard UI
-- or via their Management API. The SQL below sets RLS on the objects table.

-- ═══════════════════════════════════════════════════════════════════════════
--  Finished. Now run rls_policies.sql
-- ═══════════════════════════════════════════════════════════════════════════
