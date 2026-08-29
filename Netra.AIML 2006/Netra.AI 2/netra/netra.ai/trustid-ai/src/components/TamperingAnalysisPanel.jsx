import Panel from './Panel';

function scoreColor(score) {
  if (score < 20) return '#33D6A0';
  if (score < 50) return '#F2B84B';
  return '#F2495C';
}

export default function TamperingAnalysisPanel({ data }) {
  const regions = data?.regions ?? [];
  return (
    <Panel eyebrow={data?.overallFlag || 'No data'} title="Tampering Analysis">
      {regions.length > 0 ? (
        <>
          <ul className="list-none m-0 p-0 flex flex-col gap-3">
            {regions.map((r) => {
              const color = scoreColor(r.anomalyScore);
              return (
                <li key={r.area} className="grid grid-cols-2 items-center gap-2.5" style={{ gridTemplateColumns: '1fr 1fr 28px' }}>
                  <span className="text-xs text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">{r.area}</span>
                  <div className="h-1.5 rounded-full bg-bg-inset overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.anomalyScore}%`, background: color }} />
                  </div>
                  <span className="font-mono text-[11.5px] text-right" style={{ color }}>{r.anomalyScore}</span>
                </li>
              );
            })}
          </ul>
          {data?.notes && <p className="text-[11px] text-text-muted mt-1">{data.notes}</p>}
        </>
      ) : (
        <p className="text-[12.5px] text-text-muted m-0">Upload a document to run tampering analysis.</p>
      )}
    </Panel>
  );
}
