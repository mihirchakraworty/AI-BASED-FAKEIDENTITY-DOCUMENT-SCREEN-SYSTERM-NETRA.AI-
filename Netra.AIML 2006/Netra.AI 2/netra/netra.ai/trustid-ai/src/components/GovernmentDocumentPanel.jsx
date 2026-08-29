import { ShieldCheck, ShieldAlert, ShieldQuestion, Info } from 'lucide-react';
import Panel from './Panel';

const IMPORTANCE_STYLE = {
  HIGH: { icon: ShieldCheck, text: 'text-risk-high', bg: 'bg-risk-high-dim', border: 'border-risk-high/30' },
  MEDIUM: { icon: ShieldAlert, text: 'text-risk-mid', bg: 'bg-risk-mid-dim', border: 'border-risk-mid/30' },
  LOW: { icon: Info, text: 'text-risk-low', bg: 'bg-risk-low-dim', border: 'border-risk-low/30' },
};

export default function GovernmentDocumentPanel({ data }) {
  if (!data) {
    return (
      <Panel eyebrow="Government Document Scanner" title="Document Analysis">
        <p className="text-[12.5px] text-text-muted m-0">
          Scan or upload a document above to check whether it's a government-issued
          document or ID, and see its importance and typical uses.
        </p>
      </Panel>
    );
  }

  const isUnknown = !data.isGovernmentDocument;
  const style = IMPORTANCE_STYLE[data.importance] || IMPORTANCE_STYLE.LOW;
  const Icon = isUnknown ? ShieldQuestion : style.icon;

  return (
    <Panel eyebrow="Government Document Scanner" title="Document Analysis">
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start max-[700px]:grid-cols-1">
        <div className={`w-12 h-12 rounded-full grid place-items-center border ${isUnknown ? 'text-text-muted bg-bg-inset border-border-hairline' : `${style.text} ${style.bg} ${style.border}`}`}>
          <Icon size={24} strokeWidth={1.6} />
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div className="grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
            <div>
              <div className="font-mono text-[10.5px] tracking-wider uppercase text-text-muted mb-0.5">Document Type</div>
              <div className="font-display text-[15px] font-semibold text-text-primary">{data.documentType}</div>
            </div>
            <div>
              <div className="font-mono text-[10.5px] tracking-wider uppercase text-text-muted mb-0.5">Category</div>
              <div className="text-[13px] text-text-primary">{data.category}</div>
            </div>
            <div>
              <div className="font-mono text-[10.5px] tracking-wider uppercase text-text-muted mb-0.5">Confidence</div>
              <div className="text-[13px] text-text-primary font-mono">
                {data.confidence > 0 ? `${data.confidence}%` : 'Low / uncertain'}
              </div>
            </div>
          </div>

          {isUnknown ? (
            <p className="text-[12.5px] text-text-secondary bg-bg-inset border-l-2 border-border-hairline py-2 px-2.5 rounded-r-md m-0">
              {data.reason}
            </p>
          ) : (
            <>
              <div>
                <span className={`inline-block text-[10.5px] font-mono font-semibold rounded-full py-0.5 px-2.5 border ${style.text} ${style.bg} ${style.border}`}>
                  Importance: {data.importance}
                </span>
              </div>
              <p className="text-[12.5px] text-text-secondary bg-bg-inset border-l-2 border-accent-cyan py-2 px-2.5 rounded-r-md m-0">
                {data.reason}
              </p>
              {data.uses?.length > 0 && (
                <div>
                  <div className="font-mono text-[10.5px] tracking-wider uppercase text-text-muted mb-1.5">How it can be used</div>
                  <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
                    {data.uses.map((use) => (
                      <li key={use} className="text-[12.5px] text-text-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
