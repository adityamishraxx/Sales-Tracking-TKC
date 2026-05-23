import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '⚠️  Supabase env vars missing. Copy .env.example → .env.local and fill in your values.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  global: {
    headers: { 'x-app-name': 'jio-crm' },
  },
})

// ─── Table names ──────────────────────────────────────────
export const TABLES = {
  LEADS:        'leads',
  DELETED_LEADS:'deleted_leads',
  PO_FILES:     'po_files',
  AUDIT_LOG:    'audit_log',
}

export const STORAGE = {
  BUCKET: import.meta.env.VITE_STORAGE_BUCKET || 'po-uploads',
}

// ─── Leads ────────────────────────────────────────────────

export async function fetchActiveLeads() {
  const { data, error } = await supabase
    .from(TABLES.LEADS)
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchLeadById(id) {
  const { data, error } = await supabase
    .from(TABLES.LEADS)
    .select('*, po_files(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createLead(payload) {
  const { data, error } = await supabase
    .from(TABLES.LEADS)
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLead(id, payload) {
  const { data, error } = await supabase
    .from(TABLES.LEADS)
    .update({ ...payload, last_update_date: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Soft delete — moves row to deleted_leads, marks is_deleted=true
export async function softDeleteLead(id, deletedBy) {
  // 1. Fetch the full lead
  const { data: lead, error: fetchErr } = await supabase
    .from(TABLES.LEADS)
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  // 2. Insert into deleted_leads
  const { error: insertErr } = await supabase
    .from(TABLES.DELETED_LEADS)
    .insert([{
      original_id:  lead.id,
      lead_snapshot: lead,
      deleted_by:   deletedBy,
      deleted_at:   new Date().toISOString(),
    }])
  if (insertErr) throw insertErr

  // 3. Mark as deleted in active funnel
  const { error: updateErr } = await supabase
    .from(TABLES.LEADS)
    .update({ is_deleted: true, deleted_by: deletedBy, deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (updateErr) throw updateErr

  return true
}

// ─── PO / Payment Files ───────────────────────────────────

export async function uploadPOFile(leadId, file, uploadedBy) {
  const ext       = file.name.split('.').pop()
  const fileName  = `${leadId}/${Date.now()}_${file.name}`

  // Upload to Supabase Storage
  const { error: storageErr } = await supabase.storage
    .from(STORAGE.BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  if (storageErr) throw storageErr

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE.BUCKET)
    .getPublicUrl(fileName)

  // Save metadata to po_files table
  const { data, error } = await supabase
    .from(TABLES.PO_FILES)
    .insert([{
      lead_id:     leadId,
      file_name:   file.name,
      file_path:   fileName,
      file_url:    urlData.publicUrl,
      file_type:   ext.toUpperCase(),
      file_size:   file.size,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchPOFilesForLead(leadId) {
  const { data, error } = await supabase
    .from(TABLES.PO_FILES)
    .select('*')
    .eq('lead_id', leadId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── Audit Log ────────────────────────────────────────────

export async function logAudit({ action, leadId, performedBy, oldData, newData }) {
  const { error } = await supabase
    .from(TABLES.AUDIT_LOG)
    .insert([{
      action,
      lead_id:      leadId,
      performed_by: performedBy,
      old_data:     oldData || null,
      new_data:     newData || null,
      created_at:   new Date().toISOString(),
    }])
  if (error) console.warn('Audit log failed (non-blocking):', error.message)
}

// ─── Dashboard Analytics ──────────────────────────────────

export async function fetchDashboardData() {
  const { data, error } = await supabase
    .from(TABLES.LEADS)
    .select('*')
    .eq('is_deleted', false)
  if (error) throw error
  return data
}
