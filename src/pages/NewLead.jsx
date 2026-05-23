import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createLead, logAudit } from '@/lib/supabase'
import { SOLUTIONS, PHASES } from '@/lib/constants'
import { todayISO } from '@/lib/dateUtils'
import toast from 'react-hot-toast'
import { Plus, ArrowLeft, Save, Info } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const INITIAL = {
  lead_name:       '',
  solution_offered:'',
  account_size_cr: '',
  num_stores:      '',
  phase:           '',
}

function FormField({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="input-label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Info size={11}/>{hint}</p>}
      {error && <p className="input-error">{error}</p>}
    </div>
  )
}

function validate(form) {
  const errors = {}
  if (!form.lead_name.trim())       errors.lead_name       = 'Lead name is required'
  if (!form.solution_offered)        errors.solution_offered = 'Please select a solution'
  if (!form.account_size_cr || isNaN(Number(form.account_size_cr)) || Number(form.account_size_cr) <= 0)
    errors.account_size_cr = 'Enter a valid account size (> 0)'
  if (!form.num_stores || isNaN(Number(form.num_stores)) || Number(form.num_stores) < 1)
    errors.num_stores = 'Enter a valid number of stores (≥ 1)'
  if (!form.phase)                   errors.phase           = 'Please select a phase'
  return errors
}

export default function NewLead() {
  const [form, setForm]     = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const base       = user?.role === 'pmo' ? '/pmo' : '/bd'

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const today   = todayISO()
      const payload = {
        lead_name:        form.lead_name.trim(),
        solution_offered: form.solution_offered,
        account_size_cr:  Number(form.account_size_cr),
        num_stores:       Number(form.num_stores),
        phase:            form.phase,
        funnel_entry_date:today,
        last_update_date: today,
        created_by:       user?.name,
        is_deleted:       false,
      }
      const lead = await createLead(payload)
      await logAudit({ action:'CREATE', leadId: lead.id, performedBy: user?.name, newData: lead })
      toast.success(`Lead "${form.lead_name}" added successfully!`)
      navigate(base)
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`)
    } finally {
      setLoading(false)
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
          <h2 className="section-title"><Plus size={20} className="text-brand-400" /> Enter New Lead</h2>
          <p className="section-subtitle">Add a new opportunity to the sales funnel</p>
        </div>
      </div>

      {/* Auto-captured metadata card */}
      <div className="card p-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">BD:</span>
          <span className="font-semibold text-brand-300">{user?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Entry Date:</span>
          <span className="font-semibold text-slate-200">{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Aging:</span>
          <span className="font-semibold text-green-400">0 days (new)</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <FormField label="Lead Name" required error={errors.lead_name}
          hint="Full company / account name as it should appear in reports">
          <input
            type="text"
            className={`input ${errors.lead_name ? 'border-red-500/60' : ''}`}
            placeholder="e.g. Reliance Retail – Gujarat Cluster"
            value={form.lead_name}
            onChange={e => update('lead_name', e.target.value)}
            autoFocus
          />
        </FormField>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Solution Offered" required error={errors.solution_offered}>
            <select
              className={`select ${errors.solution_offered ? 'border-red-500/60' : ''}`}
              value={form.solution_offered}
              onChange={e => update('solution_offered', e.target.value)}
            >
              <option value="">Select solution…</option>
              {SOLUTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField label="Phase" required error={errors.phase}>
            <select
              className={`select ${errors.phase ? 'border-red-500/60' : ''}`}
              value={form.phase}
              onChange={e => update('phase', e.target.value)}
            >
              <option value="">Select phase…</option>
              {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Account Size (₹ Cr.)" required error={errors.account_size_cr}
            hint="Estimated deal value in Crore INR">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
              <input
                type="number"
                className={`input pl-7 ${errors.account_size_cr ? 'border-red-500/60' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
                value={form.account_size_cr}
                onChange={e => update('account_size_cr', e.target.value)}
              />
            </div>
          </FormField>

          <FormField label="No. of Stores / Locations" required error={errors.num_stores}>
            <input
              type="number"
              className={`input ${errors.num_stores ? 'border-red-500/60' : ''}`}
              placeholder="e.g. 12"
              min="1"
              step="1"
              value={form.num_stores}
              onChange={e => update('num_stores', e.target.value)}
            />
          </FormField>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(base)} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 btn-lg">
            {loading
              ? <><LoadingSpinner size="sm" /> Saving…</>
              : <><Save size={16} /> Save Lead</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
