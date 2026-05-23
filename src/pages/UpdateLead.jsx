import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchActiveLeads, updateLead, logAudit } from '@/lib/supabase'
import { SOLUTIONS, PHASES } from '@/lib/constants'
import { formatDate, calcUpdateAging } from '@/lib/dateUtils'
import SearchableLeadDropdown from '@/components/ui/SearchableLeadDropdown'
import { PhaseBadge, SolutionBadge } from '@/components/ui/StatusBadge'
import LoadingSpinner, { InlineLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { RefreshCw, ArrowLeft, Save, Clock } from 'lucide-react'

function validate(form) {
  const errors = {}
  if (!form.lead_name?.trim())       errors.lead_name       = 'Lead name is required'
  if (!form.solution_offered)        errors.solution_offered = 'Select a solution'
  if (!form.account_size_cr || Number(form.account_size_cr) <= 0)
    errors.account_size_cr = 'Enter a valid account size'
  if (!form.num_stores || Number(form.num_stores) < 1)
    errors.num_stores = 'Enter a valid number of stores'
  if (!form.phase)                   errors.phase           = 'Select a phase'
  return errors
}

export default function UpdateLead() {
  const [leads, setLeads]   = useState([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [selectedId, setSelectedId]     = useState(null)
  const [currentLead, setCurrentLead]   = useState(null)
  const [form, setForm]     = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const base       = user?.role === 'pmo' ? '/pmo' : '/bd'

  useEffect(() => {
    fetchActiveLeads()
      .then(setLeads)
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLeadsLoading(false))
  }, [])

  function handleLeadSelect(id, lead) {
    setSelectedId(id)
    setCurrentLead(lead)
    if (lead) {
      setForm({
        lead_name:        lead.lead_name,
        solution_offered: lead.solution_offered,
        account_size_cr:  lead.account_size_cr,
        num_stores:       lead.num_stores,
        phase:            lead.phase,
      })
    } else {
      setForm({})
    }
    setErrors({})
  }

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        lead_name:        form.lead_name.trim(),
        solution_offered: form.solution_offered,
        account_size_cr:  Number(form.account_size_cr),
        num_stores:       Number(form.num_stores),
        phase:            form.phase,
      }
      const updated = await updateLead(selectedId, payload)
      await logAudit({
        action: 'UPDATE', leadId: selectedId, performedBy: user?.name,
        oldData: currentLead, newData: updated,
      })
      toast.success(`"${form.lead_name}" updated successfully!`)
      navigate(base)
    } catch (err) {
      toast.error(`Update failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(base)} className="btn btn-ghost btn-sm p-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="section-title"><RefreshCw size={20} className="text-teal-400" /> Update Lead</h2>
          <p className="section-subtitle">Search and edit an existing lead's details</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5 space-y-3">
        <label className="input-label">Search Lead</label>
        {leadsLoading
          ? <InlineLoader message="Loading leads…" />
          : <SearchableLeadDropdown
              leads={leads}
              value={selectedId}
              onChange={handleLeadSelect}
              placeholder="Type to search by lead name…"
            />
        }
        {leads.length === 0 && !leadsLoading && (
          <p className="text-xs text-slate-500 text-center pt-2">No active leads in funnel.</p>
        )}
      </div>

      {/* Current lead snapshot */}
      {currentLead && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-slide-up">
          <div>
            <span className="text-slate-500 block mb-0.5">Current Phase</span>
            <PhaseBadge phase={currentLead.phase} />
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Solution</span>
            <SolutionBadge solution={currentLead.solution_offered} />
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Entry Date</span>
            <span className="text-slate-200">{formatDate(currentLead.funnel_entry_date)}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Last Updated</span>
            <span className="text-slate-200 flex items-center gap-1">
              <Clock size={11} className="text-slate-500" />
              {calcUpdateAging(currentLead.last_update_date)}d ago
            </span>
          </div>
        </div>
      )}

      {/* Edit form */}
      {currentLead && (
        <form onSubmit={handleSave} className="card p-6 space-y-5 animate-slide-up">
          <div>
            <label className="input-label">Lead Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              className={`input ${errors.lead_name ? 'border-red-500/60' : ''}`}
              value={form.lead_name || ''}
              onChange={e => update('lead_name', e.target.value)}
            />
            {errors.lead_name && <p className="input-error">{errors.lead_name}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Solution Offered <span className="text-red-400">*</span></label>
              <select
                className={`select ${errors.solution_offered ? 'border-red-500/60' : ''}`}
                value={form.solution_offered || ''}
                onChange={e => update('solution_offered', e.target.value)}
              >
                <option value="">Select…</option>
                {SOLUTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.solution_offered && <p className="input-error">{errors.solution_offered}</p>}
            </div>

            <div>
              <label className="input-label">Phase <span className="text-red-400">*</span></label>
              <select
                className={`select ${errors.phase ? 'border-red-500/60' : ''}`}
                value={form.phase || ''}
                onChange={e => update('phase', e.target.value)}
              >
                <option value="">Select…</option>
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.phase && <p className="input-error">{errors.phase}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Account Size (₹ Cr.) <span className="text-red-400">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                <input
                  type="number"
                  className={`input pl-7 ${errors.account_size_cr ? 'border-red-500/60' : ''}`}
                  step="0.01" min="0"
                  value={form.account_size_cr || ''}
                  onChange={e => update('account_size_cr', e.target.value)}
                />
              </div>
              {errors.account_size_cr && <p className="input-error">{errors.account_size_cr}</p>}
            </div>

            <div>
              <label className="input-label">No. of Stores / Locations <span className="text-red-400">*</span></label>
              <input
                type="number"
                className={`input ${errors.num_stores ? 'border-red-500/60' : ''}`}
                min="1" step="1"
                value={form.num_stores || ''}
                onChange={e => update('num_stores', e.target.value)}
              />
              {errors.num_stores && <p className="input-error">{errors.num_stores}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-600/5 border border-teal-500/20 text-xs text-teal-300">
            <Clock size={12} />
            Last Update Date and Update Aging will be auto-recalculated on save.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(base)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1 btn-lg">
              {saving ? <><LoadingSpinner size="sm" /> Saving…</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
