import * as XLSX from 'xlsx'
import { formatDate, calcUpdateAging } from './dateUtils'

const PHASES_ORDER = [
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

/**
 * Export active funnel leads to a formatted Excel file.
 */
export function exportFunnelToExcel(leads) {
  // Sort by funnel entry date descending
  const sorted = [...leads].sort(
    (a, b) => new Date(b.funnel_entry_date) - new Date(a.funnel_entry_date)
  )

  // Build rows
  const rows = sorted.map((lead, idx) => ({
    'S.No.':                    idx + 1,
    'Lead Name':                lead.lead_name || '',
    'Solution Offered':         lead.solution_offered || '',
    'Account Size (₹ Cr.)':     Number(lead.account_size_cr) || 0,
    'No. of Stores / Locations':Number(lead.num_stores) || 0,
    'Phase':                    lead.phase || '',
    'Funnel Entry Date':        formatDate(lead.funnel_entry_date),
    'Last Update Date':         formatDate(lead.last_update_date),
    'Update Aging (Days)':      calcUpdateAging(lead.last_update_date),
    'BD Name':                  lead.created_by || '',
  }))

  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 6 },   // S.No.
    { wch: 28 },  // Lead Name
    { wch: 22 },  // Solution
    { wch: 20 },  // Account Size
    { wch: 22 },  // Stores
    { wch: 26 },  // Phase
    { wch: 18 },  // Entry Date
    { wch: 18 },  // Last Update
    { wch: 20 },  // Aging
    { wch: 16 },  // BD Name
  ]

  // Style the header row (xlsx doesn't support full cell styling without a pro plugin,
  // but we can freeze the header row)
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' }

  XLSX.utils.book_append_sheet(wb, ws, 'Active Funnel')

  // Summary sheet
  const totalSize  = leads.reduce((s, l) => s + Number(l.account_size_cr || 0), 0)
  const phaseCounts = PHASES_ORDER.map(p => ({
    Phase:          p,
    'No. of Leads': leads.filter(l => l.phase === p).length,
    'Total Size (₹ Cr.)': leads
      .filter(l => l.phase === p)
      .reduce((s, l) => s + Number(l.account_size_cr || 0), 0)
      .toFixed(2),
  }))

  const wsSummary = XLSX.utils.json_to_sheet([
    { 'Metric': 'Export Date',        'Value': formatDate(new Date().toISOString()) },
    { 'Metric': 'Total Active Leads', 'Value': leads.length },
    { 'Metric': 'Total Funnel Size',  'Value': `₹ ${totalSize.toFixed(2)} Cr.` },
    { 'Metric': '',                   'Value': '' },
    { 'Metric': '── Phase Breakdown ──', 'Value': '' },
    ...phaseCounts.map(p => ({ 'Metric': p.Phase, 'Value': `${p['No. of Leads']} leads  |  ₹${p['Total Size (₹ Cr.)']} Cr.` })),
  ])
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 36 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Trigger download
  const fileName = `Jio_Sales_Funnel_${formatDate(new Date().toISOString(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
