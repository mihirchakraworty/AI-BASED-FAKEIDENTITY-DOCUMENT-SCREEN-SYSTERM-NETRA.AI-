import { useState } from 'react';
import Panel from './Panel';

const PRIORITY_CLASS = {
  High: 'text-risk-high bg-risk-high-dim border-risk-high/30',
  Medium: 'text-risk-mid bg-risk-mid-dim border-risk-mid/30',
  Low: 'text-risk-low bg-risk-low-dim border-risk-low/30',
};

export default function DetailsPanel({ data }) {
  const [decision, setDecision] = useState(null); // null | 'cleared' | 'flagged'

  if (!data) {
    return (
      <Panel eyebrow="Case File" title="Details">
        <p className="text-[12.5px] text-text-muted m-0">No active case — scan a document to open a case file.</p>
      </Panel>
    );
  }

  const priorityClass = PRIORITY_CLASS[data.priority] || PRIORITY_CLASS.Low;

  return (
    <Panel eyebrow="Case File" title="Details">
      <dl className="flex flex-col gap-2.5 m-0">
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Case ID</dt>
          <dd className="m-0 font-mono text-[12.5px] text-text-primary text-right">{data.caseId}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Priority</dt>
          <dd className="m-0 text-right">
            <span className={`inline-block text-[10.5px] font-mono rounded-full py-0.5 px-2.5 border ${priorityClass}`}>
              {data.priority}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Assigned Officer</dt>
          <dd className="m-0 font-mono text-[12.5px] text-text-primary text-right">{data.assignedOfficer}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2.5">
          <dt className="text-[11.5px] text-text-muted">Location</dt>
          <dd className="m-0 text-[12.5px] text-text-primary text-right">{data.location}</dd>
        </div>
      </dl>
      <p className="text-xs leading-relaxed text-text-secondary bg-bg-inset border-l-2 border-accent-cyan py-2 px-2.5 rounded-r-md mt-0.5 mb-0">
        {data.notes}
      </p>
      {decision ? (
        <div
          className={`text-center text-xs font-semibold rounded-md py-2.5 px-2.5 mt-0.5 ${
            decision === 'cleared' ? 'bg-risk-low-dim text-risk-low' : 'bg-risk-high-dim text-risk-high'
          }`}
        >
          {decision === 'cleared' ? 'Case cleared' : 'Flagged for review'}
        </div>
      ) : (
        <div className="flex gap-2 mt-0.5">
          <button
            onClick={() => setDecision('cleared')}
            className="flex-1 rounded-md py-2.5 px-2.5 text-xs font-semibold cursor-pointer bg-risk-low-dim text-risk-low border border-risk-low/30"
          >
            Clear
          </button>
          <button
            onClick={() => setDecision('flagged')}
            className="flex-1 rounded-md py-2.5 px-2.5 text-xs font-semibold cursor-pointer bg-risk-high-dim text-risk-high border border-risk-high/30"
          >
            Flag for review
          </button>
        </div>
      )}
    </Panel>
  );
}
