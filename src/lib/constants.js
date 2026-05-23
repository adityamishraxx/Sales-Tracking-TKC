// ─── BD Names ─────────────────────────────────────────────
export const BD_NAMES = ['Tushar', 'Karuna', 'Som', 'Uday']

// ─── Solutions ────────────────────────────────────────────
export const SOLUTIONS = [
  'Surveillance',
  'Shutter Solution',
  'Home Automation',
]

// ─── Sales Funnel Phases ──────────────────────────────────
export const PHASES = [
  'Identification',
  'Demo Request',
  'Demo Ongoing',
  'Post Demo Discussion',
  'Proposal Submitted',
  'Commercial Negotiation',
  'PO Expected',
  'PO and Closure',
  'Closed (Won)',
  'Revenue Realised',
]

// Phase progress value (0–100) for funnel visualization
export const PHASE_PROGRESS = {
  'Identification':        10,
  'Demo Request':          20,
  'Demo Ongoing':          30,
  'Post Demo Discussion':  40,
  'Proposal Submitted':    50,
  'Commercial Negotiation':60,
  'PO Expected':           70,
  'PO and Closure':        80,
  'Closed (Won)':          90,
  'Revenue Realised':      100,
}

// ─── Roles ────────────────────────────────────────────────
export const ROLES = {
  BD:  'bd',
  PMO: 'pmo',
}

// ─── File types allowed for PO upload ─────────────────────
export const ALLOWED_FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png']
export const MAX_FILE_SIZE_MB   = 10

// ─── Phase color map ──────────────────────────────────────
export const PHASE_COLORS = {
  'Identification':        '#6366f1',
  'Demo Request':          '#8b5cf6',
  'Demo Ongoing':          '#a78bfa',
  'Post Demo Discussion':  '#3b82f6',
  'Proposal Submitted':    '#0ea5e9',
  'Commercial Negotiation':'#14b8a6',
  'PO Expected':           '#10b981',
  'PO and Closure':        '#22c55e',
  'Closed (Won)':          '#f59e0b',
  'Revenue Realised':      '#ef4444',
}

// ─── Solution color map ───────────────────────────────────
export const SOLUTION_COLORS = {
  'Surveillance':    '#3b82f6',
  'Shutter Solution':'#14b8a6',
  'Home Automation': '#f59e0b',
}

// ─── Chart palette ────────────────────────────────────────
export const CHART_COLORS = [
  '#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6',
  '#10b981', '#ef4444', '#6366f1', '#ec4899',
]
