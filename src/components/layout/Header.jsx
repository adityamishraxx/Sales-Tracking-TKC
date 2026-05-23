import { useState } from 'react'
import { Menu, X, Bell, Building2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLocation } from 'react-router-dom'

const ROUTE_LABELS = {
  '':             'Home',
  'new-lead':     'Enter New Lead',
  'update-lead':  'Update Lead',
  'delete-lead':  'Delete Lead',
  'po-upload':    'PO / Payment Upload',
  'dashboard':    'Analytics Dashboard',
}

function getPageTitle(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  const last  = parts[parts.length - 1]
  return ROUTE_LABELS[last] || 'Dashboard'
}

export default function Header({ onMenuToggle, sidebarOpen }) {
  const { user } = useAuth()
  const location = useLocation()
  const title    = getPageTitle(location.pathname)

  return (
    <header className="flex-shrink-0 h-14 bg-surface-800/80 backdrop-blur-sm border-b border-surface-300/20
                        flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden btn-icon btn-ghost text-slate-400"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile brand */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-teal-600 flex items-center justify-center">
          <Building2 className="text-white" size={14} />
        </div>
      </div>

      {/* Page title */}
      <h1 className="hidden lg:block text-sm font-semibold text-slate-200">{title}</h1>

      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Date */}
        <span className="hidden md:block text-xs text-slate-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>

        {/* User chip */}
        <div className="flex items-center gap-2 bg-surface-700/60 border border-surface-300/30
                        rounded-xl px-3 py-1.5">
          <div className="w-6 h-6 rounded-lg bg-brand-600/30 flex items-center justify-center
                          text-[11px] font-bold text-brand-300">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-xs font-medium text-slate-300 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  )
}
