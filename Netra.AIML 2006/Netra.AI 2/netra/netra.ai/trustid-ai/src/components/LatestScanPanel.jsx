import { useState } from 'react';
import { ScanLine, Upload, AlertTriangle } from 'lucide-react';
import Panel from './Panel';

export default function LatestScanPanel({ onSubmit, status = 'idle', error, scan }) {
  const loading = status === 'loading';
  const [livePhoto, setLivePhoto] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSubmit?.(file, livePhoto);
  };

  const handleLivePhotoChange = (e) => {
    setLivePhoto(e.target.files?.[0] || null);
  };

  const displayDocId = scan?.docId ?? 'PENDING';
  const displayDocType = scan?.docType ?? 'Upload Pending';
  const displaySubmittedAt = scan?.submittedAt ?? '--:--';
  const displayOfficer = scan?.officer ?? 'Officer Desk 1';
  const displayStatus = error
    ? 'Error connecting to backend'
    : loading
    ? 'Analyzing Document...'
    : scan?.status ?? 'Ready to Upload';

  return (
    <Panel eyebrow="Live Feed" title="Latest Scan">
      {/* File Upload Box */}
      <label className="relative overflow-hidden h-[120px] rounded-lg bg-bg-inset border border-dashed border-border-hairline flex flex-col items-center justify-center gap-1.5 text-text-muted text-[11.5px] cursor-pointer hover:border-accent-cyan transition-colors">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {scan?.previewUrl ? (
          <img src={scan.previewUrl} alt="Scan Preview" className="h-full w-full object-cover rounded-lg" />
        ) : (
          <>
            {loading ? <ScanLine size={26} className="animate-spin text-accent-cyan" /> : <Upload size={26} strokeWidth={1.5} />}
            <span>Click to upload a document image or PDF</span>
          </>
        )}

        {loading && (
          <div className="animate-scan absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent shadow-[0_0_10px_var(--color-accent-cyan)]" />
        )}
      </label>

      <label className="text-[11px] text-text-muted flex items-center gap-2 cursor-pointer hover:text-text-secondary">
        <input type="file" accept="image/*" onChange={handleLivePhotoChange} className="hidden" />
        <span className="underline decoration-dotted">
          {livePhoto ? `Live photo attached: ${livePhoto.name}` : 'Optionally attach a live selfie for face match'}
        </span>
      </label>

      {/* Details List */}
      <dl className="flex flex-col gap-2.5 m-0 mt-1">
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Document ID</dt>
          <dd className="m-0 font-mono text-[12.5px] text-text-primary text-right">{displayDocId}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Type</dt>
          <dd className="m-0 text-[12.5px] text-text-primary text-right">{displayDocType}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Submitted</dt>
          <dd className="m-0 font-mono text-[12.5px] text-text-primary text-right">{displaySubmittedAt}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Officer</dt>
          <dd className="m-0 font-mono text-[12.5px] text-text-primary text-right">{displayOfficer}</dd>
        </div>
      </dl>

      {/* Status Box */}
      <div
        className={`flex items-center justify-center gap-1.5 text-[11.5px] rounded-md py-1.5 px-2.5 text-center mt-1 ${
          error
            ? 'text-risk-high bg-risk-high-dim border border-risk-high/30'
            : 'text-risk-mid bg-risk-mid-dim border border-risk-mid/30'
        }`}
      >
        {error && <AlertTriangle size={13} strokeWidth={1.8} />}
        {error || displayStatus}
      </div>
    </Panel>
  );
}
