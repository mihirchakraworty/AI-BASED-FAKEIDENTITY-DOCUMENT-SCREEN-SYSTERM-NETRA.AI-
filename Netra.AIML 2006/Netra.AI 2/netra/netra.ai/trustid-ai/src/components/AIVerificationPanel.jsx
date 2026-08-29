import { CheckCircle2, AlertTriangle } from 'lucide-react';
import Panel from './Panel';

export default function AIVerificationPanel({ checks = [] }) {
  return (
    <Panel eyebrow="Model Output" title="AI Verification Results">
      {checks.length > 0 ? (
        <ul className="list-none m-0 p-0 flex flex-col gap-8">
          {checks.map((row) => {
            const pass = row.result === 'Pass';
            const Icon = pass ? CheckCircle2 : AlertTriangle;
            return (
              <li key={row.check} className="grid grid-cols-[18px_1fr_70px_40px] items-center gap-2.5">
                <Icon size={16} strokeWidth={1.8} className={pass ? 'text-risk-low' : 'text-risk-mid'} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[12.5px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{row.check}</span>
                  <span className={`text-[10.5px] font-mono ${pass ? 'text-risk-low' : 'text-risk-mid'}`}>{row.result}</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-inset overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pass ? 'bg-risk-low' : 'bg-risk-mid'}`}
                    style={{ width: `${row.confidence}%` }}
                  />
                </div>
                <span className="font-mono text-[11.5px] text-text-secondary text-right">{row.confidence}%</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[12.5px] text-text-muted m-0">Upload a document to run AI verification checks.</p>
      )}
    </Panel>
  );
}
