import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Building2, Plus, RefreshCw, Trash2, Upload,
  LayoutDashboard, Download, LogOut, ChevronRight,
  Users, ShieldCheck, Sparkles
} from 'lucide-react'
import clsx from 'clsx'

const BD_NAV = [
  { to: '',          icon: LayoutDashboard, label: 'Home',         exact: true },
  { to: 'new-lead',  icon: Plus,            label: 'Enter New Lead' },
  { to: 'update-lead',icon: RefreshCw,      label: 'Update Lead' },
  { to: 'delete-lead',icon: Trash2,         label: 'Delete Lead' },
  { to: 'po-upload', icon: Upload,          label: 'PO / Payment' },
]

const PMO_EXTRA = [
  { to: 'dashboard', icon: LayoutDashboard, label: 'Analytics Dashboard', highlight: true },
]

function NavItem({ to, icon: Icon, label, base, highlight = false }) {
  return (
    <NavLink
      to={`${base}/${to}`}
      end={to === ''}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
          'transition-all duration-200 relative',
          isActive
            ? highlight
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
              : 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
            : highlight
              ? 'text-teal-400/70 hover:bg-teal-600/10 hover:text-teal-300'
              : 'text-slate-400 hover:bg-surface-600/60 hover:text-slate-200'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={clsx('flex-shrink-0', isActive && 'drop-shadow-sm')} />
          <span className="flex-1">{label}</span>
          {isActive && (
            <ChevronRight size={14} className="opacity-60" />
          )}
          {highlight && !to.includes('dashboard') && (
            <span className="badge-teal text-[10px] px-1.5 py-0.5">PMO</span>
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ onClose }) {
  const { user, isPMO, logout } = useAuth()
  const navigate = useNavigate()
  const base = isPMO ? '/pmo' : '/bd'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col h-full bg-surface-800 border-r border-surface-300/30 w-64 flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-surface-300/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center shadow-glow-blue/20">
            <Building2 className="text-white" size={18} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">
              {import.meta.env.VITE_APP_NAME || 'Jio CRM'}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              Sales Funnel Platform
            </div>
          </div>
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-3 border-b border-surface-300/20">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-700/60">
          <div className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold',
            isPMO ? 'bg-teal-600/30 text-teal-300' : 'bg-brand-600/30 text-brand-300'
          )}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
            <div className="flex items-center gap-1 mt-0.5">
              {isPMO
                ? <><ShieldCheck size={10} className="text-teal-400" /><span className="text-[10px] text-teal-400">PMO</span></>
                : <><Users size={10} className="text-brand-400" /><span className="text-[10px] text-brand-400">BD Executive</span></>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {BD_NAV.map(item => (
          <NavItem key={item.to} {...item} base={base} />
        ))}

        {isPMO && (
          <>
            <div className="pt-3 pb-1">
              <div className="flex items-center gap-2 px-3 mb-1">
                <div className="flex-1 h-px bg-surface-300/20" />
                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Sparkles size={9} /> PMO Tools
                </span>
                <div className="flex-1 h-px bg-surface-300/20" />
              </div>
            </div>
            {PMO_EXTRA.map(item => (
              <NavItem key={item.to} {...item} base={base} />
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-surface-300/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-slate-400 hover:bg-red-600/10 hover:text-red-400
                     transition-all duration-200"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
