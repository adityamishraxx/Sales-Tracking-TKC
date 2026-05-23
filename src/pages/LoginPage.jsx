import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { BD_NAMES } from '@/lib/constants'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  Building2, Users, ShieldCheck, ChevronRight,
  Eye, EyeOff, ArrowLeft, Sparkles
} from 'lucide-react'

// ── Step 1: Role selection ─────────────────────────────────
function RoleSelector({ onSelect }) {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="text-center mb-8">
        <p className="text-slate-400 text-sm">Select your access role to continue</p>
      </div>

      <button
        onClick={() => onSelect('bd')}
        className="w-full group p-5 card-glass hover:border-brand-500/50 hover:shadow-glow-blue/10
                   transition-all duration-300 text-left flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30
                        flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
          <Users className="text-brand-400" size={22} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-100">BD Executive</div>
          <div className="text-xs text-slate-400 mt-0.5">Enter leads, update funnel, upload POs</div>
        </div>
        <ChevronRight className="text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1
                                  transition-all" size={18} />
      </button>

      <button
        onClick={() => onSelect('pmo')}
        className="w-full group p-5 card-glass hover:border-teal-500/50 hover:shadow-glow-teal/10
                   transition-all duration-300 text-left flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-teal-600/20 border border-teal-500/30
                        flex items-center justify-center group-hover:bg-teal-600/30 transition-colors">
          <ShieldCheck className="text-teal-400" size={22} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-100">PMO</div>
          <div className="text-xs text-slate-400 mt-0.5">Full access + dashboards + export</div>
        </div>
        <ChevronRight className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1
                                  transition-all" size={18} />
      </button>
    </div>
  )
}

// ── Step 2a: BD name selection ─────────────────────────────
function BDLogin({ onBack, onLogin }) {
  const [selected, setSelected]   = useState('')
  const [showModal, setShowModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit() {
    const name = selected === 'Other' ? customName.trim() : selected
    if (!name) { toast.error('Please select or enter your name.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // brief UX delay
    onLogin(name)
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div>
        <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30
                        flex items-center justify-center mb-4">
          <Users className="text-brand-400" size={22} />
        </div>
        <h3 className="text-xl font-bold text-slate-100">BD Login</h3>
        <p className="text-sm text-slate-400 mt-1">Select your name to access your dashboard</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[...BD_NAMES, 'Other'].map(name => (
          <button
            key={name}
            onClick={() => {
              setSelected(name)
              if (name === 'Other') setShowModal(true)
            }}
            className={`p-4 rounded-xl border text-sm font-medium transition-all duration-200
              ${selected === name
                ? 'bg-brand-600/20 border-brand-500/60 text-brand-300 shadow-glow-blue/10'
                : 'bg-surface-800 border-surface-300/30 text-slate-300 hover:border-brand-500/40 hover:bg-surface-700'
              }`}
          >
            {name}
          </button>
        ))}
      </div>

      {selected === 'Other' && customName && (
        <div className="p-3 rounded-xl bg-brand-600/10 border border-brand-500/20 text-sm text-brand-300">
          Name entered: <strong>{customName}</strong>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected || loading || (selected === 'Other' && !customName)}
        className="btn btn-primary btn-lg w-full"
      >
        {loading ? <><LoadingSpinner size="sm" /> Logging in…</> : 'Enter Dashboard →'}
      </button>

      {/* Custom name modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelected('') }}
        title="Enter Your Name"
        subtitle="Type your full name as it should appear in records"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Rajesh Kumar"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && customName.trim()) setShowModal(false) }}
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowModal(false)}
            disabled={!customName.trim()}
            className="btn btn-primary w-full"
          >
            Confirm Name
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ── Step 2b: PMO PIN entry ─────────────────────────────────
function PMOLogin({ onBack, onLogin }) {
  const [pin, setPin]         = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!pin) { setError('Please enter your PIN.'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    try {
      onLogin(pin)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div>
        <div className="w-12 h-12 rounded-xl bg-teal-600/20 border border-teal-500/30
                        flex items-center justify-center mb-4">
          <ShieldCheck className="text-teal-400" size={22} />
        </div>
        <h3 className="text-xl font-bold text-slate-100">PMO Login</h3>
        <p className="text-sm text-slate-400 mt-1">Enter your secure 6-digit PIN</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">PMO PIN</label>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              className={`input pr-11 tracking-widest text-lg font-mono ${error ? 'border-red-500/60' : ''}`}
              placeholder="••••••"
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              maxLength={8}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="input-error">{error}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn btn-success btn-lg w-full">
          {loading
            ? <><LoadingSpinner size="sm" /> Verifying…</>
            : 'Access PMO Dashboard →'
          }
        </button>
      </form>

      <p className="text-xs text-slate-500 text-center">
        Default PIN: <span className="font-mono text-slate-400">123456</span>
        &nbsp;(set VITE_PMO_PIN in .env.local)
      </p>
    </div>
  )
}

// ── Main Login Page ────────────────────────────────────────
export default function LoginPage() {
  const [step, setStep] = useState('role') // 'role' | 'bd' | 'pmo'
  const { loginBD, loginPMO } = useAuth()
  const navigate = useNavigate()

  function handleBDLogin(name) {
    loginBD(name)
    toast.success(`Welcome, ${name}! 👋`)
    navigate('/bd')
  }

  function handlePMOLogin(pin) {
    loginPMO(pin)
    toast.success('Welcome, PMO! Full access granted.')
    navigate('/pmo')
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-600/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full bg-brand-900/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header / Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-brand-600 to-teal-600 shadow-glow-blue mb-4">
            <Building2 className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-bold text-gradient">
            {import.meta.env.VITE_APP_NAME || 'Jio CRM'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {import.meta.env.VITE_APP_SUBTITLE || 'Sales Funnel Automation Platform'}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Sparkles size={12} className="text-brand-400" />
            <span className="text-xs text-slate-500">Management Consulting · Jio</span>
            <Sparkles size={12} className="text-teal-400" />
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          {step === 'role' && (
            <>
              <h2 className="text-lg font-bold text-slate-100 mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm mb-6">Choose your role to get started</p>
              <RoleSelector onSelect={setStep} />
            </>
          )}
          {step === 'bd'  && <BDLogin  onBack={() => setStep('role')} onLogin={handleBDLogin}  />}
          {step === 'pmo' && <PMOLogin onBack={() => setStep('role')} onLogin={handlePMOLogin} />}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Internal tool · Jio Platforms Ltd. · Confidential
        </p>
      </div>
    </div>
  )
}
