import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) {
  const btnClass =
    confirmVariant === 'danger'
      ? 'btn-danger'
      : 'btn-primary'

  return (
    <Modal open={open} onClose={onClose} size="sm" title="">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle className="text-red-400" size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          {message && <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3 w-full pt-2">
          <button
            className="btn btn-secondary flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`btn ${btnClass} flex-1`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
