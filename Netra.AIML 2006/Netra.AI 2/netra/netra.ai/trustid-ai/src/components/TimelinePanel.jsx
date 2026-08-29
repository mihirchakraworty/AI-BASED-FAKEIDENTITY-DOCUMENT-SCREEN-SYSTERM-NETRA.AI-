import Panel from './Panel';

export default function TimelinePanel({ events = [] }) {
  return (
    <Panel eyebrow="Case Activity" title="Timeline">
      {events.length > 0 ? (
        <ol className="list-none m-0 p-0">
          {events.map((t, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center w-2.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-accent-cyan shadow-[0_0_0_3px_var(--color-accent-cyan-glow)] mt-0.5" />
                {i < events.length - 1 && <span className="flex-1 w-px bg-border-hairline my-1" />}
              </div>
              <div className="flex flex-col gap-0.5 pb-4 min-w-0">
                <span className="font-mono text-[10.5px] text-text-muted">{t.time}</span>
                <span className="text-[12.5px] text-text-secondary">{t.event}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[12.5px] text-text-muted m-0">No activity yet — scan a document to build a timeline.</p>
      )}
    </Panel>
  );
}
