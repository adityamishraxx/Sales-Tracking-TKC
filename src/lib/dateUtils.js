import { differenceInDays, format, parseISO, isValid } from 'date-fns'

/**
 * Calculate Update Aging in days.
 * Aging = today − last_update_date
 */
export function calcUpdateAging(lastUpdateDate) {
  if (!lastUpdateDate) return 0
  const last = typeof lastUpdateDate === 'string' ? parseISO(lastUpdateDate) : lastUpdateDate
  if (!isValid(last)) return 0
  return differenceInDays(new Date(), last)
}

/**
 * Calculate Funnel Age in days.
 * Age = today − funnel_entry_date
 */
export function calcFunnelAge(funnelEntryDate) {
  if (!funnelEntryDate) return 0
  const entry = typeof funnelEntryDate === 'string' ? parseISO(funnelEntryDate) : funnelEntryDate
  if (!isValid(entry)) return 0
  return differenceInDays(new Date(), entry)
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return isValid(d) ? format(d, fmt) : '—'
  } catch {
    return '—'
  }
}

/**
 * Returns today as ISO date string (YYYY-MM-DD).
 */
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Returns today as full ISO timestamp.
 */
export function nowISO() {
  return new Date().toISOString()
}

/**
 * Get a human-readable aging label.
 */
export function agingLabel(days) {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7)   return `${days} days ago`
  if (days < 14)  return `${Math.floor(days / 7)}w ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/**
 * Get aging status color class.
 */
export function agingColor(days) {
  if (days <= 7)  return 'text-green-400'
  if (days <= 14) return 'text-yellow-400'
  if (days <= 30) return 'text-orange-400'
  return 'text-red-400'
}

/**
 * Get month label from ISO date string.
 */
export function monthLabel(dateStr) {
  if (!dateStr) return 'Unknown'
  try {
    const d = parseISO(dateStr)
    return format(d, 'MMM yyyy')
  } catch {
    return 'Unknown'
  }
}
