import Select from 'react-select'

/**
 * Reusable searchable dropdown for selecting an active lead.
 * Wraps react-select with the app's dark theme.
 */
export default function SearchableLeadDropdown({
  leads = [],
  value,
  onChange,
  placeholder = 'Search and select a lead…',
  isLoading = false,
  isDisabled = false,
}) {
  const options = leads.map(lead => ({
    value: lead.id,
    label: lead.lead_name,
    lead,
  }))

  const selectedOption = value
    ? options.find(o => o.value === value) || null
    : null

  return (
    <Select
      classNamePrefix="rs"
      className="rs-dark"
      options={options}
      value={selectedOption}
      onChange={opt => onChange(opt ? opt.value : null, opt ? opt.lead : null)}
      placeholder={placeholder}
      isLoading={isLoading}
      isDisabled={isDisabled}
      isClearable
      isSearchable
      noOptionsMessage={() => isLoading ? 'Loading leads…' : 'No leads found'}
      formatOptionLabel={({ lead }) => (
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-100">{lead.lead_name}</span>
          <div className="flex items-center gap-2 ml-3">
            <span className="text-xs text-slate-400 bg-surface-600 px-2 py-0.5 rounded-full">
              {lead.phase}
            </span>
            <span className="text-xs text-slate-500">
              {lead.solution_offered}
            </span>
          </div>
        </div>
      )}
    />
  )
}
