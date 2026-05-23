import { PHASE_COLORS } from '@/lib/constants'

const SOLUTION_MAP = {
  'Surveillance':    'badge-blue',
  'Shutter Solution':'badge-teal',
  'Home Automation': 'badge-amber',
}

export function PhaseBadge({ phase }) {
  const color = PHASE_COLORS[phase] || '#6366f1'
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {phase}
    </span>
  )
}

export function SolutionBadge({ solution }) {
  const cls = SOLUTION_MAP[solution] || 'badge-gray'
  return <span className={cls}>{solution}</span>
}

export function AgingBadge({ days }) {
  let cls = 'badge-green'
  let label = `${days}d`
  if (days > 30)      cls = 'badge-red'
  else if (days > 14) cls = 'badge-amber'
  else if (days > 7)  cls = 'badge-blue'
  return <span className={cls}>{label}</span>
}
