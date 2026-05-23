import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchActiveLeads, softDeleteLead, logAudit } from '@/lib/supabase'
import { formatDate, calcUpdateAging } from '@/lib/dateUtils'
import SearchableLeadDropdown from '@/components/ui/SearchableLeadDropdown'
import { PhaseBadge, SolutionBadge } from '@/components/ui/StatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import LoadingSpinner, { InlineLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { Trash2, ArrowLeft, AlertTriangle, Archive, IndianRupee, MapPin, Calendar, Clock } from 'lucide-react'

export default function DeleteLead() {
  const [leads, setLeads]         = useState([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [selectedId, setSelectedId]     = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [deleting, setDeleting]         = useState(false)
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
    setSelectedLead(lead)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await softDeleteLead(selectedId, user?.name)
      await logAudit({
        action: 'DELETE', leadId: selectedId,
        performedBy: user?.name, oldData: selectedLead,
      })
      toast.success(`"${selectedLead.lead_name}" archived successfully. Data is preserved.`)
      setShowConfirm(false)
      navigate(base)
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    } finally {
      setDeleting(false)
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
          <h2 className="section-title"><Trash2 size={20} className="text-red-400" /> Remove Lead</h2>
          <p className="section-subtitle">Archive a lead from the active funnel</p>
        </div>
      </div>

      {/* Important notice */}
      <div className="card p-4 flex items-start gap-3 bg-amber-600/5 border-amber-500/20">
        <Archive size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-300">Data is never permanently destroyed</p>
          <p className="text-xs text-slate-400 mt-1">
            Removing a lead moves it to the archive (Deleted Leads table). The complete record,
            history, and PO files are preserved with a timestamp and your name.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5 space-y-3">
        <label className="input-label">Select Lead to Remove</label>
        {leadsLoading
          ? <InlineLoader message="Loading leads…" />
          : <SearchableLeadDropdown
              leads={leads}
              value={selectedId}
              onChange={handleLeadSelect}
              placeholder="Search lead to archive…"
            />
        }
      </div>

      {/* Lead detail card */}
      {selectedLead && (
        <div className="card p-6 space-y-5 animate-slide-up border-red-500/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{selectedLead.lead_name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <PhaseBadge phase={selectedLead.phase} />
                <SolutionBadge solution={selectedLead.solution_offered} />
              </div>
            </div>
            <div className="badge-red">Active Lead</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-300/20">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <IndianRupee size={11} /> Account Size
              </div>
              <div className="font-bold text-slate-100">₹ {selectedLead.account_size_cr} Cr.</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-300/20">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <MapPin size={11} /> Stores
              </div>
              <div className="font-bold text-slate-100">{selectedLead.num_stores}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-300/20">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Calendar size={11} /> Entry Date
              </div>
              <div className="font-bold text-slate-100">{formatDate(selectedLead.funnel_entry_date)}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-300/20">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock size={11} /> Last Updated
              </div>
              <div className="font-bold text-slate-100">{formatDate(selectedLead.last_update_date)}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-300/20">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                Update Aging
              </div>
              <div className="font-bold text-slate-100">{calcUpdateAging(selectedLead.last_update_date)} days</div>
            </div>
            <div className="p-3 rounded-xl bg-surface-800/60 border border-surface-300/20">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                BD Owner
              </div>
              <div className="font-bold text-slate-100">{selectedLead.created_by || '—'}</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate(base)} className="btn btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => setShowConfirm(true)}
              className="btn btn-danger flex-1 btn-lg"
            >
              <Trash2 size={16} /> Archive This Lead
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Archive this lead?"
        message={`"${selectedLead?.lead_name}" will be moved to the archive. All data is preserved and can be viewed by PMO. This action is logged with your name and timestamp.`}
        confirmLabel="Yes, Archive Lead"
        confirmVariant="danger"
      />
    </div>
  )
}
