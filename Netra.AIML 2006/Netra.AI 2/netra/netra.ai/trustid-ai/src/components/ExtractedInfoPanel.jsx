import Panel from './Panel';

export default function ExtractedInfoPanel({ rows = [] }) {
  return (
    <Panel eyebrow="OCR Output" title="Extracted Information">
      {rows.length > 0 ? (
        <dl className="flex flex-col m-0">
          {rows.map((row, i) => (
            <div
              key={row.field}
              className={`flex items-baseline justify-between gap-3 py-2 ${i < rows.length - 1 ? 'border-b border-border-soft' : ''}`}
            >
              <dt className="text-[11.5px] text-text-muted shrink-0">{row.field}</dt>
              <dd className="m-0 font-mono text-[12.5px] text-text-primary text-right break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-[12.5px] text-text-muted m-0">No document scanned yet — OCR fields will appear here.</p>
      )}
    </Panel>
  );
}
