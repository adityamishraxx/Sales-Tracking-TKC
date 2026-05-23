import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Plus, RefreshCw, Trash2, Upload, TrendingUp, Activity } from 'lucide-react'

const ACTIONS = [
  {
    to:       'new-lead',
    icon:     Plus,
    label:    'Enter New Lead',
    desc:     'Add a fresh opportunity to the funnel',
    color:    'brand',
    gradient: 'from-brand-600/20 to-brand-600/5',
    border:   'border-brand-500/30',
    hover:    'hover:border-brand-500/60 hover:shadow-glow-blue/10',
    badge:    null,
  },
  {
    to:       'update-lead',
    icon:     RefreshCw,
    label:    'Update Lead',
    desc:     'Edit phase, details, or progress of an existing lead',
    color:    'teal',
    gradient: 'from-teal-600/20 to-teal-600/5',
    border:   'border-teal-500/30',
    hover:    'hover:border-teal-500/60 hover:shadow-glow-teal/10',
    badge:    null,
  },
  {
    to:       'delete-lead',
    icon:     Trash2,
    label:    'Remove Lead',
    desc:     'Soft-delete a lead (archived, not destroyed)',
    color:    'red',
    gradient: 'from-red-600/10 to-red-600/5',
    border:   'border-red-500/20',
    hover:    'hover:border-red-500/40',
    badge:    null,
  },
  {
    to:       'po-upload',
    icon:     Upload,
    label:    'PO / Payment Upload',
    desc:     'Attach purchase order or payment receipt to a lead',
    color:    'amber',
    gradient: 'from-amber-600/20 to-amber-600/5',
    border:   'border-amber-500/30',
    hover:    'hover:border-amber-500/60',
    badge:    null,
  },
]

const ICON_COLOR = {
  brand:  'text-brand-400',
  teal:   'text-teal-400',
  red:    'text-red-400',
  amber:  'text-amber-400',
  purple: 'text-purple-400',
}

const ICON_BG = {
  brand:  'bg-brand-600/20 border-brand-500/30',
  teal:   'bg-teal-600/20 border-teal-500/30',
  red:    'bg-red-600/20 border-red-500/20',
  amber:  'bg-amber-600/20 border-amber-500/30',
  purple: 'bg-purple-600/20 border-purple-500/30',
}

export default function BDHome() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const base       = '/bd'
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {greeting}, <span className="text-gradient">{user?.name}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              What would you like to do today?
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface-700/60 border border-surface-300/30 rounded-xl px-4 py-2">
            <Activity size={14} className="text-brand-400" />
            <span className="text-xs text-slate-400">BD Executive</span>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid sm:grid-cols-2 gap-4 animate-slide-up">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon
          return (
            <button
              key={action.to}
              onClick={() => navigate(`${base}/${action.to}`)}
              className={`group p-6 rounded-2xl border bg-gradient-to-br ${action.gradient}
                          ${action.border} ${action.hover}
                          transition-all duration-300 text-left hover:scale-[1.01]
                          hover:shadow-card-hover`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center
                                flex-shrink-0 transition-all duration-300
                                group-hover:scale-110 ${ICON_BG[action.color]}`}>
                  <Icon size={22} className={ICON_COLOR[action.color]} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-base">{action.label}</span>
                    {action.badge && (
                      <span className="badge-teal text-[10px]">{action.badge}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{action.desc}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <div className={`text-xs font-semibold ${ICON_COLOR[action.color]}`}>→</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tip */}
      <div className="card p-4 flex items-start gap-3 bg-brand-600/5 border-brand-500/20">
        <TrendingUp size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-brand-300">Pro Tip</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Keep leads updated at least every 7 days to ensure accurate funnel aging reports.
            Accounts not updated in 14+ days are flagged in the PMO dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
