import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardData } from '@/lib/supabase'
import { exportFunnelToExcel } from '@/lib/exportToExcel'
import { calcUpdateAging, calcFunnelAge, monthLabel, formatDate } from '@/lib/dateUtils'
import { PHASES, PHASE_COLORS, SOLUTION_COLORS, CHART_COLORS } from '@/lib/constants'
import { InlineLoader } from '@/components/ui/LoadingSpinner'
import { PhaseBadge, SolutionBadge } from '@/components/ui/StatusBadge'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  LayoutDashboard, Download, RefreshCw, TrendingUp,
  Users, IndianRupee, Award, CheckCircle2, Activity,
  Clock, AlertTriangle, Target, Calendar, ArrowLeft, Zap
} from 'lucide-react'

// ── Custom Tooltip ─────────────────────────────────────────
const DarkTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-600 border border-surface-300/40 rounded-xl px-3 py-2.5 shadow-card text-xs">
      {label && <p className="text-slate-400 mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}{suffix}
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color = 'brand', trend }) {
  const colorMap = {
    brand:  { bg: 'bg-brand-600/15',  text: 'text-brand-400',  border: 'border-brand-500/20' },
    teal:   { bg: 'bg-teal-600/15',   text: 'text-teal-400',   border: 'border-teal-500/20' },
    amber:  { bg: 'bg-amber-600/15',  text: 'text-amber-400',  border: 'border-amber-500/20' },
    green:  { bg: 'bg-green-600/15',  text: 'text-green-400',  border: 'border-green-500/20' },
    purple: { bg: 'bg-purple-600/15', text: 'text-purple-400', border: 'border-purple-500/20' },
    red:    { bg: 'bg-red-600/15',    text: 'text-red-400',    border: 'border-red-500/20' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <div className={`kpi-card border ${c.border}`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={18} className={c.text} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-100 tabular-nums">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5 font-medium">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ── Chart wrapper ──────────────────────────────────────────
function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-200">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Funnel stage row ───────────────────────────────────────
function FunnelRow({ phase, count, size, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  const color = PHASE_COLORS[phase] || '#6366f1'
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs text-slate-400 truncate flex-shrink-0">{phase}</div>
      <div className="flex-1 h-5 bg-surface-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="w-16 text-right">
        <span className="text-xs font-bold text-slate-200">{count}</span>
        <span className="text-xs text-slate-500 ml-1">leads</span>
      </div>
      <div className="w-20 text-right">
        <span className="text-xs font-semibold" style={{ color }}>₹{size.toFixed(1)}Cr</span>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────
export default function Dashboard() {
  const [leads, setLeads]     = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await fetchDashboardData()
      setLeads(data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Computed analytics ──────────────────────────────────
  const analytics = useMemo(() => {
    if (!leads.length) return null

    const totalSize    = leads.reduce((s,l) => s + Number(l.account_size_cr||0), 0)
    const totalCount   = leads.length
    const closedWon    = leads.filter(l => l.phase === 'Closed (Won)')
    const revRealised  = leads.filter(l => l.phase === 'Revenue Realised')
    const closedSize   = closedWon.reduce((s,l) => s + Number(l.account_size_cr||0), 0)
    const revSize      = revRealised.reduce((s,l) => s + Number(l.account_size_cr||0), 0)

    // BD-wise
    const bdMap = {}
    leads.forEach(l => {
      const bd = l.created_by || 'Unknown'
      if (!bdMap[bd]) bdMap[bd] = { name: bd, count: 0, size: 0 }
      bdMap[bd].count++
      bdMap[bd].size += Number(l.account_size_cr||0)
    })
    const bdData = Object.values(bdMap).sort((a,b) => b.size - a.size)

    // Phase-wise
    const phaseMap = {}
    PHASES.forEach(p => { phaseMap[p] = { phase: p, count: 0, size: 0 } })
    leads.forEach(l => {
      if (phaseMap[l.phase]) {
        phaseMap[l.phase].count++
        phaseMap[l.phase].size += Number(l.account_size_cr||0)
      }
    })
    const phaseData = PHASES.map(p => phaseMap[p]).filter(p => p.count > 0)
    const maxPhaseCount = Math.max(...phaseData.map(p => p.count), 1)

    // Solution mix
    const solMap = {}
    leads.forEach(l => {
      const s = l.solution_offered || 'Unknown'
      if (!solMap[s]) solMap[s] = { name: s, count: 0, size: 0 }
      solMap[s].count++
      solMap[s].size += Number(l.account_size_cr||0)
    })
    const solutionData = Object.values(solMap)

    // Aging analysis
    const aging = leads.map(l => calcUpdateAging(l.last_update_date))
    const fresh    = aging.filter(d => d <= 7).length
    const moderate = aging.filter(d => d > 7 && d <= 14).length
    const stale    = aging.filter(d => d > 14 && d <= 30).length
    const critical = aging.filter(d => d > 30).length
    const agingData = [
      { name: '≤7 days (Fresh)',   value: fresh,    color: '#10b981' },
      { name: '8–14 days',         value: moderate, color: '#f59e0b' },
      { name: '15–30 days',        value: stale,    color: '#f97316' },
      { name: '>30 days (Stale)',  value: critical, color: '#ef4444' },
    ].filter(d => d.value > 0)

    // Monthly trend
    const monthMap = {}
    leads.forEach(l => {
      const m = monthLabel(l.funnel_entry_date)
      if (!monthMap[m]) monthMap[m] = { month: m, leads: 0, size: 0, date: l.funnel_entry_date }
      monthMap[m].leads++
      monthMap[m].size += Number(l.account_size_cr||0)
    })
    const monthlyData = Object.values(monthMap)
      .sort((a,b) => new Date(a.date) - new Date(b.date))
      .slice(-12)

    // Funnel conversion (ordered by phase)
    const funnelConvData = PHASES.map((p, i) => ({
      value: phaseMap[p]?.count || 0,
      name:  p,
      fill:  CHART_COLORS[i % CHART_COLORS.length],
    })).filter(d => d.value > 0)

    // Stale leads (>14 days not updated)
    const staleLeads = leads
      .filter(l => calcUpdateAging(l.last_update_date) > 14)
      .sort((a,b) => calcUpdateAging(b.last_update_date) - calcUpdateAging(a.last_update_date))
      .slice(0, 5)

    // Top leads by size
    const topLeads = [...leads]
      .sort((a,b) => Number(b.account_size_cr) - Number(a.account_size_cr))
      .slice(0, 5)

    const avgSize = totalSize / totalCount
    const funnelAge = leads.map(l => calcFunnelAge(l.funnel_entry_date))
    const avgAge = funnelAge.reduce((s,d) => s+d, 0) / totalCount

    return {
      totalSize, totalCount, closedWon: closedWon.length, closedSize,
      revRealised: revRealised.length, revSize,
      bdData, phaseData, maxPhaseCount, solutionData,
      agingData, monthlyData, funnelConvData,
      staleLeads, topLeads, avgSize, avgAge,
      staleCount: stale + critical,
    }
  }, [leads])

  function handleExport() {
    if (!leads.length) { toast.error('No data to export.'); return }
    try {
      exportFunnelToExcel(leads)
      toast.success('Excel file downloaded!')
    } catch (err) {
      toast.error(`Export failed: ${err.message}`)
    }
  }

  if (loading) return <InlineLoader message="Loading analytics data…" />

  if (!analytics) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Activity size={40} className="text-slate-500" />
      <p className="text-slate-400">No funnel data available yet.</p>
      <p className="text-xs text-slate-500">Have BD executives add leads to see analytics.</p>
    </div>
  )

  const a = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pmo')} className="btn btn-ghost btn-sm p-2">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="section-title">
              <LayoutDashboard size={20} className="text-brand-400" /> Analytics Dashboard
            </h2>
            <p className="section-subtitle">
              Real-time funnel intelligence · {a.totalCount} active leads · Last refreshed {new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="btn btn-success">
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── KPIs Row 1 ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={IndianRupee}  label="Total Funnel Size"    value={`₹${a.totalSize.toFixed(1)} Cr`}      color="brand"  />
        <KPICard icon={Users}        label="Active Accounts"      value={a.totalCount}                          color="teal"   />
        <KPICard icon={Award}        label="Avg. Deal Size"       value={`₹${a.avgSize.toFixed(2)} Cr`}        color="purple" />
        <KPICard icon={CheckCircle2} label="Closed Won"           value={`${a.closedWon} leads`}               color="green"  sub={`₹${a.closedSize.toFixed(1)} Cr`} />
        <KPICard icon={Zap}          label="Revenue Realised"     value={`₹${a.revSize.toFixed(1)} Cr`}        color="amber"  sub={`${a.revRealised} accounts`} />
        <KPICard icon={AlertTriangle} label="Stale (>14 days)"    value={a.staleCount}                          color="red"    sub="Need attention" />
      </div>

      {/* ── Row 2: BD + Phase charts ─── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* BD-wise accounts */}
        <ChartCard title="BD-wise Accounts Handled" subtitle="Count and total funnel size per BD">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={a.bdData} margin={{ top:4, right:4, left:-16, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
              <XAxis dataKey="name" tick={{ fill:'#94a3b8', fontSize:11 }} />
              <YAxis yAxisId="l" tick={{ fill:'#94a3b8', fontSize:10 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill:'#94a3b8', fontSize:10 }} tickFormatter={v=>`₹${v}`} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill:'rgba(59,130,246,0.05)' }} />
              <Legend wrapperStyle={{ fontSize:'11px', color:'#94a3b8', paddingTop:'8px' }} />
              <Bar yAxisId="l" dataKey="count" name="Leads" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar yAxisId="r" dataKey="size"  name="Size (₹Cr)" fill="#14b8a6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Solution Mix */}
        <ChartCard title="Solution Mix" subtitle="Surveillance vs Shutter vs Home Automation">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={a.solutionData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  strokeWidth={0}
                >
                  {a.solutionData.map((entry) => (
                    <Cell key={entry.name} fill={SOLUTION_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {a.solutionData.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: SOLUTION_COLORS[s.name] || '#6366f1' }} />
                    <span className="text-xs text-slate-300">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-100">{s.count}</span>
                    <span className="text-xs text-slate-500 ml-1">leads</span>
                    <div className="text-xs text-slate-500">₹{s.size.toFixed(1)}Cr</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 3: Phase funnel ─── */}
      <ChartCard
        title="Phase-wise Funnel Distribution"
        subtitle="Lead count and account size across all 10 funnel stages"
      >
        <div className="space-y-2.5">
          {a.phaseData.map(p => (
            <FunnelRow
              key={p.phase}
              phase={p.phase}
              count={p.count}
              size={p.size}
              maxCount={a.maxPhaseCount}
            />
          ))}
        </div>
      </ChartCard>

      {/* ── Row 4: Account size by phase + Aging ─── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Account size by phase bar */}
        <ChartCard title="Account Size by Phase" subtitle="₹ Crore allocation across funnel stages">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={a.phaseData} layout="vertical" margin={{ top:4, right:50, left:4, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" horizontal={false} />
              <XAxis type="number" tick={{ fill:'#94a3b8', fontSize:10 }} tickFormatter={v=>`₹${v}`} />
              <YAxis type="category" dataKey="phase" tick={{ fill:'#94a3b8', fontSize:9 }} width={130} />
              <Tooltip content={<DarkTooltip prefix="₹" suffix=" Cr" />} cursor={{ fill:'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="size" name="Size (₹Cr)" radius={[0,4,4,0]} fill="#3b82f6">
                {a.phaseData.map(entry => (
                  <Cell key={entry.phase} fill={PHASE_COLORS[entry.phase] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Aging analysis */}
        <ChartCard title="Update Aging Analysis" subtitle="Days since last lead update">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={a.agingData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={0}
                >
                  {a.agingData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {a.agingData.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-slate-300">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold" style={{ color: d.color }}>{d.value}</span>
                    <span className="text-xs text-slate-500 ml-1">leads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Row 5: Monthly trend ─── */}
      {a.monthlyData.length > 1 && (
        <ChartCard title="Monthly Funnel Growth Trend" subtitle="Lead additions and cumulative size over time">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={a.monthlyData} margin={{ top:4, right:24, left:-16, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
              <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:11 }} />
              <YAxis yAxisId="l" tick={{ fill:'#94a3b8', fontSize:10 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill:'#94a3b8', fontSize:10 }} tickFormatter={v=>`₹${v}`} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize:'11px', color:'#94a3b8' }} />
              <Line yAxisId="l" type="monotone" dataKey="leads" name="New Leads" stroke="#3b82f6" strokeWidth={2} dot={{ fill:'#3b82f6', r:4 }} activeDot={{ r:6 }} />
              <Line yAxisId="r" type="monotone" dataKey="size"  name="Size (₹Cr)" stroke="#14b8a6" strokeWidth={2} dot={{ fill:'#14b8a6', r:4 }} activeDot={{ r:6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Row 6: Top leads + Stale leads ─── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top leads by size */}
        <ChartCard title="Top Accounts by Size" subtitle="Highest-value leads in active funnel">
          <div className="space-y-2">
            {a.topLeads.map((lead, i) => (
              <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-600/30 transition-colors">
                <div className="w-6 h-6 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-[11px] font-bold text-brand-400">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{lead.lead_name}</p>
                  <PhaseBadge phase={lead.phase} />
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-100">₹{lead.account_size_cr} Cr</p>
                  <p className="text-xs text-slate-500">{lead.created_by}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Stale leads alert */}
        <ChartCard
          title="Attention Required"
          subtitle="Leads not updated in >14 days"
          action={a.staleLeads.length > 0 ? <span className="badge-red">{a.staleLeads.length} stale</span> : <span className="badge-green">All fresh</span>}
        >
          {a.staleLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle2 size={32} className="text-green-400" />
              <p className="text-sm text-green-400 font-medium">All leads are up to date!</p>
              <p className="text-xs text-slate-500">No leads older than 14 days.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {a.staleLeads.map(lead => {
                const aging = calcUpdateAging(lead.last_update_date)
                return (
                  <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-600/5 border border-red-500/15">
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{lead.lead_name}</p>
                      <PhaseBadge phase={lead.phase} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-red-400">{aging}d old</p>
                      <p className="text-xs text-slate-500">{lead.created_by}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Export CTA ─── */}
      <div
        onClick={handleExport}
        className="card p-5 flex items-center gap-4 cursor-pointer hover:shadow-card-hover
                   transition-all duration-300 bg-gradient-to-r from-teal-600/10 to-brand-600/10
                   border-teal-500/20 hover:border-teal-500/40 group"
      >
        <div className="w-12 h-12 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center">
          <Download className="text-teal-400" size={22} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-100">Export Full Funnel to Excel</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Downloads all {a.totalCount} active leads with 10 columns + summary sheet · Formatted .xlsx
          </p>
        </div>
        <span className="btn btn-success group-hover:scale-105 transition-transform">
          <Download size={14} /> Download Now
        </span>
      </div>
    </div>
  )
}
