import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatCards from './components/StatCards';
import RiskScoreGauge from './components/RiskScoreGauge';
import LatestScanPanel from './components/LatestScanPanel';
import ExtractedInfoPanel from './components/ExtractedInfoPanel';
import AIVerificationPanel from './components/AIVerificationPanel';
import TamperingAnalysisPanel from './components/TamperingAnalysisPanel';
import FaceVerificationPanel from './components/FaceVerificationPanel';
import TimelinePanel from './components/TimelinePanel';
import DetailsPanel from './components/DetailsPanel';
import RecentHistoryPanel from './components/RecentHistoryPanel';
import RiskDistributionPanel from './components/RiskDistributionPanel';
import GovernmentDocumentPanel from './components/GovernmentDocumentPanel';
import { verifyDocument } from './services/api';
import {
  mapLatestScan,
  mapExtractedInfo,
  mapAiVerification,
  mapTampering,
  mapFaceVerification,
  mapRiskScore,
  mapTimeline,
  mapCaseDetails,
  mapGovernmentDocument,
} from './utils/mapScanResult';

export default function App() {
  const [activeNav, setActiveNav] = useState('Home');
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Real state, backed by the FastAPI backend (backend/main.py). There is
  // no database in this backend, so "history" below is genuine data from
  // this browser session's scans, not persisted across reloads/devices —
  // it is not fabricated/mock data, but it is scoped to the session.
  const [scanResult, setScanResult] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle | loading | error
  const [scanError, setScanError] = useState(null);
  const [history, setHistory] = useState([]);

  const runVerification = useCallback(async (file, livePhoto) => {
    setScanStatus('loading');
    setScanError(null);
    setPreviewFile(file);
    try {
      const result = await verifyDocument(file, livePhoto);
      setScanResult(result);
      setScanStatus('idle');
      setHistory((prev) => [
        {
          id: result.docId,
          type: result.docType,
          time: new Date().toLocaleTimeString(),
          risk: result.riskScore,
          status: result.status,
        },
        ...prev,
      ].slice(0, 20));
    } catch (err) {
      setScanStatus('error');
      setScanError(err.message || 'Verification failed.');
    }
  }, []);

  // Session-derived stats — computed from real scans made this session,
  // not hardcoded. Empty/zeroed until the first scan runs.
  const stats = [
    {
      label: 'Documents Scanned',
      value: String(history.length),
      delta: history.length ? `${history.length} this session` : 'No scans yet',
      trend: history.length ? 'up' : 'flat',
    },
    {
      label: 'Manual Review',
      value: String(history.filter((h) => h.status === 'Manual Review').length),
      delta: 'This session',
      trend: 'flat',
    },
    {
      label: 'High Risk (Reject)',
      value: String(history.filter((h) => h.status === 'Reject').length),
      delta: 'This session',
      trend: history.some((h) => h.status === 'Reject') ? 'down' : 'flat',
    },
    {
      label: 'Avg. Risk Score',
      value: history.length
        ? String(Math.round(history.reduce((sum, h) => sum + (h.risk || 0), 0) / history.length))
        : '—',
      delta: 'This session',
      trend: 'flat',
    },
  ];

  const riskDistribution = (() => {
    if (!history.length) return [];
    const low = history.filter((h) => h.risk < 35).length;
    const mid = history.filter((h) => h.risk >= 35 && h.risk < 70).length;
    const high = history.filter((h) => h.risk >= 70).length;
    const total = history.length;
    return [
      { name: 'Low', value: Math.round((low / total) * 100), color: '#33D6A0' },
      { name: 'Moderate', value: Math.round((mid / total) * 100), color: '#F2B84B' },
      { name: 'High', value: Math.round((high / total) * 100), color: '#F2495C' },
    ];
  })();

  return (
    <div className="grid min-h-screen bg-bg-base grid-cols-[220px_1fr] grid-rows-[64px_1fr] max-[900px]:grid-cols-[72px_1fr]">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />
      <Topbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="min-w-0 flex flex-col gap-4.5 px-7 pt-6 pb-12 max-[700px]:px-4 max-[700px]:pt-4.5">
        <div>
          <h1 className="font-display text-[22px] font-bold text-text-primary mb-1">Verification Dashboard</h1>
          <p className="text-[13px] text-text-secondary max-w-[620px]">
            Real-time document authenticity, biometric match, and risk scoring for the current shift.
          </p>
        </div>

        <StatCards stats={stats} />

        <RiskScoreGauge data={mapRiskScore(scanResult)} />

        <div className="grid gap-3.5 grid-cols-3 max-[1200px]:grid-cols-2 max-[700px]:grid-cols-1">
          <LatestScanPanel
            onSubmit={runVerification}
            status={scanStatus}
            error={scanError}
            scan={mapLatestScan(scanResult, previewFile)}
          />
          <ExtractedInfoPanel rows={mapExtractedInfo(scanResult)} />
          <AIVerificationPanel checks={mapAiVerification(scanResult)} />
        </div>

        <div className="grid gap-3.5 grid-cols-4 max-[1200px]:grid-cols-2 max-[700px]:grid-cols-1">
          <TamperingAnalysisPanel data={mapTampering(scanResult)} />
          <FaceVerificationPanel data={mapFaceVerification(scanResult)} />
          <TimelinePanel events={mapTimeline(scanResult)} />
          <DetailsPanel data={mapCaseDetails(scanResult)} />
        </div>

        <GovernmentDocumentPanel data={mapGovernmentDocument(scanResult)} />

        <div className="grid gap-3.5 grid-cols-[1.6fr_1fr] max-[1200px]:grid-cols-1">
          <RecentHistoryPanel history={history} />
          <RiskDistributionPanel distribution={riskDistribution} />
        </div>
      </main>
    </div>
  );
}
