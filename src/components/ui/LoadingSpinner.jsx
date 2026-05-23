import clsx from 'clsx'

export default function LoadingSpinner({ size = 'md', className = '', label = '' }) {
  const sizes = {
    xs: 'w-3 h-3 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[3px]',
  }

  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <span
        className={clsx(
          sizes[size],
          'rounded-full border-surface-300/30 border-t-brand-500 animate-spin inline-block'
        )}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </span>
  )
}

export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="xl" />
      <p className="text-slate-400 text-sm animate-pulse">{message}</p>
    </div>
  )
}

export function InlineLoader({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <LoadingSpinner size="md" />
      <span className="text-slate-400 text-sm">{message}</span>
    </div>
  )
}
