import Panel from './Panel';

const STATUS_CLASS = {
  Approve: 'text-risk-low bg-risk-low-dim',
  'Manual Review': 'text-risk-mid bg-risk-mid-dim',
  Reject: 'text-risk-high bg-risk-high-dim',
};

export default function RecentHistoryPanel({ history = [] }) {
  return (
    <Panel eyebrow={`Last ${history.length} Cases`} title="Recent Verification History">
      <div className="flex flex-col">
        <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.6fr_1fr] items-center gap-2.5 py-2.5 px-1 border-b border-border-soft font-mono text-[10.5px] tracking-wide uppercase text-text-muted max-[700px]:grid-cols-[1.2fr_1fr_1fr]">
          <span>Document</span>
          <span>Type</span>
          <span className="max-[700px]:hidden">Time</span>
          <span>Risk</span>
          <span>Status</span>
        </div>
        {history.length > 0 ? (
          history.map((row, i) => (
            <div
              key={`${row.id}-${i}`}
              className={`grid grid-cols-[1.3fr_1fr_0.8fr_0.6fr_1fr] items-center gap-2.5 py-2.5 px-1 text-[12.5px] text-text-primary max-[700px]:grid-cols-[1.2fr_1fr_1fr] ${i < history.length - 1 ? 'border-b border-border-soft' : ''}`}
            >
              <span className="font-mono">{row.id}</span>
              <span>{row.type}</span>
              <span className="font-mono text-text-muted max-[700px]:hidden">{row.time}</span>
              <span className="font-mono">{row.risk}</span>
              <span>
                <span className={`inline-block text-[11px] font-semibold py-1 px-2.5 rounded-full ${STATUS_CLASS[row.status] || 'text-text-muted bg-bg-inset'}`}>
                  {row.status}
                </span>
              </span>
            </div>
          ))
        ) : (
          <p className="text-[12.5px] text-text-muted py-4">No verifications yet this session.</p>
        )}
      </div>
    </Panel>
  );
}
