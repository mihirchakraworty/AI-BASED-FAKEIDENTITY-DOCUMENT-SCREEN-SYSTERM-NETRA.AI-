import { ScanFace } from 'lucide-react';
import Panel from './Panel';

export default function FaceVerificationPanel({ data }) {
  if (!data) {
    return (
      <Panel eyebrow="Biometric Match" title="Face Verification">
        <p className="text-[12.5px] text-text-muted m-0">Upload a document (and optionally a live photo) to run face verification.</p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow="Biometric Match" title="Face Verification">
      <div className="flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-full border-[1.5px] border-accent-cyan shadow-[0_0_0_4px_var(--color-accent-cyan-glow)] grid place-items-center text-accent-cyan shrink-0">
          <ScanFace size={30} strokeWidth={1.4} />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-2xl font-bold text-text-primary">
            {data.matchScore != null ? `${data.matchScore}%` : '—'}
          </span>
          <span className="text-[11.5px] text-text-muted">Match confidence</span>
        </div>
      </div>
      <dl className="flex flex-col gap-2.5 m-0 mt-3">
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Face detection</dt>
          <dd className="m-0 text-[12.5px] text-text-primary">{data.livenessCheck}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Match result</dt>
          <dd className="m-0 text-[12.5px] text-text-primary">{data.matchLabel}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Method</dt>
          <dd className="m-0 font-mono text-[12.5px] text-text-primary">{data.method || '—'}</dd>
        </div>
      </dl>
      {data.notes && <p className="text-[11px] text-text-muted mt-1">{data.notes}</p>}
    </Panel>
  );
}
