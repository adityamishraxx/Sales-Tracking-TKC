import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { fetchDashboardData } from '@/lib/supabase'
import {
  Plus, RefreshCw, Trash2, Upload, LayoutDashboard,
  TrendingUp, Users, IndianRupee, Activity, ArrowRight
} from 'lucide-react'
import { InlineLoader } from '@/components/ui/LoadingSpinner'

const ACTIONS = [
  { to: 'new-lead',    icon: Plus,           label: 'New Lead',        desc: 'Add lead to funnel',            color: 'brand' },
  { to: 'update-lead', icon: RefreshCw,      label: 'Update Lead',     desc: 'Edit lead details / phase',     color: 'teal' },
  { to: 'delete-lead', icon: Trash2,         label: 'Remove Lead',     desc: 'Archive from active funnel',    color: 'red' },
  { to: 'po-upload',   icon: Upload,         label: 'PO / Payment',    desc: 'Upload PO or payment receipt',  color: 'amber' },
  { to: 'dashboard',   icon: LayoutDashboard,label: 'Analytics',       desc: 'View full dashboard + export',  color: 'purple', highlight: true },
]

const ICON_COLOR = { brand:'text-brand-400', teal:'text-teal-400', red:'text-red-400', amber:'text-amber-400', purple:'text-purple-400' }
const ICON_BG    = { brand:'bg-brand-600/20 border-brand-500/30', teal:'bg-teal-600/20 border-teal-500/30', red:'bg-red-600/20 border-red-500/20', amber:'bg-amber-600/20 border-amber-500/30', purple:'bg-purple-600/20 border-purple-500/30' }

export default function PMOHome() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
      .then(leads => {
        const totalSize    = leads.reduce((s,l) => s + Number(l.account_size_cr||0), 0)
        const closedWon    = leads.filter(l => l.phase === 'Closed (Won)').length
        const revenue      = leads.filter(l => l.phase === 'Revenue Realised').reduce((s,l) => s + Number(l.account_size_cr||0), 0)
        setStats({ total: leads.length, totalSize, closedWon, revenue })
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {greeting}, <span className="text-gradient">PMO</span> 🎯
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Full access · Manage funnel data and analytics
            </p>
          </div>
          <div className="flex items-center gap-2 bg-teal-600/10 border border-teal-500/30 rounded-xl px-4 py-2">
            <Activity size={14} className="text-teal-400" />
            <span className="text-xs text-teal-300 font-medium">PMO Access</span>
          </div>
        </div>
      </div>

      {/* Quick KPIs */}
      {loading ? (
        <InlineLoader message="Loading funnel summary…" />
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label:'Active Leads',      value: stats.total,             icon: Users,        color:'brand' },
            { label:'Total Funnel Size', value: `₹${stats.totalSize.toFixed(1)} Cr.`, icon: IndianRupee, color:'teal' },
            { label:'Closed Won',        value: stats.closedWon,          icon: TrendingUp,   color:'green' },
            { label:'Revenue Realised',  value: `₹${stats.revenue.toFixed(1)} Cr.`, icon: Activity,    color:'amber' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">{s.label}</span>
                  <Icon size={14} className={ICON_COLOR[s.color] || 'text-slate-400'} />
                </div>
                <div className="text-2xl font-bold text-slate-100">{s.value}</div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Action grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.to}
              onClick={() => navigate(`/pmo/${action.to}`)}
              className={`group p-5 rounded-2xl border bg-surface-700/60 text-left
                          transition-all duration-300 hover:scale-[1.01] hover:shadow-card-hover
                          ${action.highlight
                            ? 'border-purple-500/40 bg-gradient-to-br from-purple-600/15 to-purple-600/5 hover:border-purple-500/70'
                            : 'border-surface-300/30 hover:border-brand-500/30'
                          }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center
                                flex-shrink-0 transition-transform duration-200 group-hover:scale-110
                                ${ICON_BG[action.color]}`}>
                  <Icon size={18} className={ICON_COLOR[action.color]} />
                </div>
                {action.highlight && (
                  <span className="badge-purple text-[10px]">PMO Exclusive</span>
                )}
              </div>
              <div className="font-semibold text-slate-100">{action.label}</div>
              <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={ICON_COLOR[action.color]}>Open</span>
                <ArrowRight size={12} className={ICON_COLOR[action.color]} />
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA for dashboard */}
      <div
        onClick={() => navigate('/pmo/dashboard')}
        className="card p-5 flex items-center gap-4 cursor-pointer hover:shadow-card-hover
                   transition-all duration-300 bg-gradient-to-r from-brand-600/10 to-teal-600/10
                   border-brand-500/20 hover:border-brand-500/40 group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-teal-600
                        flex items-center justify-center shadow-glow-blue/20 group-hover:shadow-glow-blue">
          <LayoutDashboard className="text-white" size={22} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-100">Open Full Analytics Dashboard</div>
          <p className="text-xs text-slate-400 mt-0.5">12 KPIs · Charts · Excel Export · Real-time data</p>
        </div>
        <ArrowRight className="text-brand-400 group-hover:translate-x-1 transition-transform" size={20} />
      </div>
    </div>
  )
}
