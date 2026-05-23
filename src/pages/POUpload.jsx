import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { fetchActiveLeads, uploadPOFile, fetchPOFilesForLead, logAudit } from '@/lib/supabase'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants'
import { formatDate } from '@/lib/dateUtils'
import SearchableLeadDropdown from '@/components/ui/SearchableLeadDropdown'
import { PhaseBadge } from '@/components/ui/StatusBadge'
import LoadingSpinner, { InlineLoader } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  Upload, ArrowLeft, FileText, Image, Check,
  ExternalLink, AlertCircle, X, UploadCloud
} from 'lucide-react'

const FILE_ICONS = {
  PDF:  FileText,
  JPG:  Image,
  JPEG: Image,
  PNG:  Image,
}

function FilePreview({ file, onRemove }) {
  const Icon = FILE_ICONS[file.type?.toUpperCase()] || FileText
  const sizeMB = (file.size / 1024 / 1024).toFixed(2)
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-600/10 border border-brand-500/30">
      <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
        <p className="text-xs text-slate-500">{sizeMB} MB · {file.type?.split('/')[1]?.toUpperCase()}</p>
      </div>
      <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors p-1">
        <X size={16} />
      </button>
    </div>
  )
}

function UploadedFileRow({ file }) {
  const Icon = FILE_ICONS[file.file_type?.toUpperCase()] || FileText
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/60 border border-surface-300/20
                    hover:border-surface-300/40 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{file.file_name}</p>
        <p className="text-xs text-slate-500">
          {file.file_type} · Uploaded {formatDate(file.uploaded_at)} by {file.uploaded_by}
        </p>
      </div>
      <a
        href={file.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost btn-sm text-brand-400 hover:text-brand-300"
        title="Open file"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  )
}

export default function POUpload() {
  const [leads, setLeads]               = useState([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [selectedId, setSelectedId]     = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [file, setFile]                 = useState(null)
  const [existingFiles, setExistingFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [dragOver, setDragOver]         = useState(false)
  const fileRef = useRef()
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const base       = user?.role === 'pmo' ? '/pmo' : '/bd'

  useEffect(() => {
    fetchActiveLeads()
      .then(setLeads)
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLeadsLoading(false))
  }, [])

  async function handleLeadSelect(id, lead) {
    setSelectedId(id)
    setSelectedLead(lead)
    setFile(null)
    if (!id) { setExistingFiles([]); return }
    setFilesLoading(true)
    try {
      const files = await fetchPOFilesForLead(id)
      setExistingFiles(files)
    } catch {
      setExistingFiles([])
    } finally {
      setFilesLoading(false)
    }
  }

  function validateFile(f) {
    const ext = f.name.split('.').pop().toLowerCase()
    if (!ALLOWED_FILE_TYPES.includes(ext)) {
      toast.error(`File type .${ext} not allowed. Use: ${ALLOWED_FILE_TYPES.join(', ')}`)
      return false
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Max size: ${MAX_FILE_SIZE_MB} MB`)
      return false
    }
    return true
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (f && validateFile(f)) setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && validateFile(f)) setFile(f)
  }

  async function handleUpload() {
    if (!file || !selectedId) return
    setUploading(true)
    try {
      const uploaded = await uploadPOFile(selectedId, file, user?.name)
      await logAudit({ action: 'PO_UPLOAD', leadId: selectedId, performedBy: user?.name, newData: { fileName: file.name } })
      setExistingFiles(prev => [uploaded, ...prev])
      setFile(null)
      toast.success(`"${file.name}" uploaded successfully!`)
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(base)} className="btn btn-ghost btn-sm p-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="section-title"><Upload size={20} className="text-amber-400" /> PO / Payment Upload</h2>
          <p className="section-subtitle">Attach purchase orders or payment receipts to a lead</p>
        </div>
      </div>

      {/* Lead search */}
      <div className="card p-5 space-y-3">
        <label className="input-label">Select Lead</label>
        {leadsLoading
          ? <InlineLoader message="Loading leads…" />
          : <SearchableLeadDropdown
              leads={leads}
              value={selectedId}
              onChange={handleLeadSelect}
              placeholder="Search lead to attach file…"
            />
        }
      </div>

      {selectedLead && (
        <div className="space-y-4 animate-slide-up">
          {/* Lead summary */}
          <div className="card p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-slate-100">{selectedLead.lead_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <PhaseBadge phase={selectedLead.phase} />
                <span className="text-xs text-slate-500">₹ {selectedLead.account_size_cr} Cr.</span>
              </div>
            </div>
          </div>

          {/* Upload zone */}
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-200">Upload PO / Payment Receipt</p>
            <p className="text-xs text-slate-500">Allowed: PDF, JPG, JPEG, PNG · Max {MAX_FILE_SIZE_MB} MB</p>

            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3
                            cursor-pointer transition-all duration-200
                            ${dragOver
                              ? 'border-brand-500/80 bg-brand-600/10'
                              : 'border-surface-300/40 hover:border-brand-500/50 hover:bg-surface-700/40'
                            }`}
              >
                <div className="w-14 h-14 rounded-xl bg-surface-600/60 flex items-center justify-center">
                  <UploadCloud size={26} className="text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-200">Drop file here or click to browse</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG · Max {MAX_FILE_SIZE_MB} MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <FilePreview file={file} onRemove={() => setFile(null)} />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn btn-primary w-full btn-lg"
                >
                  {uploading
                    ? <><LoadingSpinner size="sm" /> Uploading…</>
                    : <><Upload size={16} /> Upload File</>
                  }
                </button>
              </div>
            )}
          </div>

          {/* Existing files */}
          <div className="card p-5 space-y-3">
            <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText size={14} className="text-slate-400" />
              Uploaded Files
              {existingFiles.length > 0 && (
                <span className="badge-teal text-xs ml-1">{existingFiles.length}</span>
              )}
            </p>
            {filesLoading
              ? <InlineLoader message="Loading files…" />
              : existingFiles.length === 0
                ? <p className="text-xs text-slate-500 text-center py-4">No files uploaded yet for this lead.</p>
                : <div className="space-y-2">
                    {existingFiles.map(f => <UploadedFileRow key={f.id} file={f} />)}
                  </div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
