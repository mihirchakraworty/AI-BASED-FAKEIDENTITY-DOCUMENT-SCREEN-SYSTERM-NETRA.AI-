// Turns the raw response from POST /api/verify-document (see backend/main.py)
// into the small view-model shapes each dashboard panel expects. Keeping
// this mapping in one place means panels don't each re-parse the API
// response, and the empty/loading states stay consistent everywhere.

function riskBand(value) {
  if (value < 34) return 'Low';
  if (value < 67) return 'Moderate';
  return 'High';
}

export function mapLatestScan(scanResult, file) {
  if (!scanResult) return null;
  return {
    docId: scanResult.docId,
    docType: scanResult.docType,
    submittedAt: scanResult.submittedAt,
    officer: scanResult.officer,
    status: scanResult.status,
    previewUrl: file ? URL.createObjectURL(file) : null,
  };
}

export function mapExtractedInfo(scanResult) {
  if (!scanResult) return [];
  const ocr = scanResult.modules?.ocr || {};
  const rows = [
    { field: 'Document Type', value: ocr.document_type || 'Unknown' },
    { field: 'Document No.', value: ocr.document_number || 'Not detected' },
    { field: 'Name', value: ocr.name || 'Not detected' },
    { field: 'Date of Birth', value: ocr.date_of_birth || 'Not detected' },
    { field: 'OCR Confidence', value: `${ocr.ocr_confidence ?? 0}%` },
  ];
  return rows;
}

export function mapAiVerification(scanResult) {
  if (!scanResult) return [];
  const validation = scanResult.modules?.validation || {};
  const tampering = scanResult.modules?.tampering || {};
  const face = scanResult.modules?.face_verification || {};
  const ocr = scanResult.modules?.ocr || {};

  return [
    {
      check: 'Field validation',
      result: validation.is_valid ? 'Pass' : 'Review',
      confidence: Math.round(
        (Number(validation.checks?.fields_present) +
          Number(validation.checks?.ocr_confidence_ok) +
          Number(validation.checks?.dob_plausible)) /
          3 *
          100
      ) || 0,
    },
    {
      check: 'OCR text extraction',
      result: (ocr.ocr_confidence ?? 0) >= 60 ? 'Pass' : 'Review',
      confidence: Math.round(ocr.ocr_confidence ?? 0),
    },
    {
      check: 'Tampering (ELA heuristic)',
      result: tampering.risk_level === 'low' ? 'Pass' : 'Review',
      confidence: Math.max(0, 100 - Math.round(tampering.tamper_score ?? 0)),
    },
    {
      check: 'Face presence / match',
      result: face.match === false ? 'Review' : 'Pass',
      confidence: face.similarity_score != null ? Math.round(face.similarity_score) : (face.face_detected_on_document ? 100 : 0),
    },
  ];
}

export function mapTampering(scanResult) {
  if (!scanResult) return null;
  const t = scanResult.modules?.tampering || {};
  return {
    overallFlag: `${(t.risk_level || 'unknown')[0]?.toUpperCase()}${(t.risk_level || 'unknown').slice(1)} anomaly`,
    regions: [
      { area: 'Overall ELA score', anomalyScore: Math.round(t.tamper_score ?? 0) },
    ],
    notes: t.notes,
    method: t.method,
  };
}

export function mapFaceVerification(scanResult) {
  if (!scanResult) return null;
  const f = scanResult.modules?.face_verification || {};
  return {
    matchScore: f.similarity_score != null ? f.similarity_score : null,
    livenessCheck: f.face_detected_on_live_photo === true ? 'Face detected' : (f.face_detected_on_live_photo === false ? 'No face detected' : 'Not checked'),
    spoofAttempt: 'Not evaluated by this backend',
    matchLabel: f.match === true ? 'Match' : f.match === false ? 'No match' : 'Not compared',
    method: f.method,
    notes: f.notes,
  };
}

export function mapRiskScore(scanResult) {
  if (!scanResult) return null;
  const value = scanResult.riskScore ?? 0;
  const breakdown = scanResult.riskBreakdown || {};
  return {
    value,
    band: riskBand(value),
    reasons: [
      { label: `Validation risk: ${breakdown.validation_risk ?? '—'}`, weight: (breakdown.validation_risk ?? 0) > 40 ? 'high' : (breakdown.validation_risk ?? 0) > 15 ? 'medium' : 'low' },
      { label: `Tampering risk: ${breakdown.tampering_risk ?? '—'}`, weight: (breakdown.tampering_risk ?? 0) > 40 ? 'high' : (breakdown.tampering_risk ?? 0) > 15 ? 'medium' : 'low' },
      { label: `Face match risk: ${breakdown.face_match_risk ?? '—'}`, weight: (breakdown.face_match_risk ?? 0) > 40 ? 'high' : (breakdown.face_match_risk ?? 0) > 15 ? 'medium' : 'low' },
    ],
  };
}

export function mapTimeline(scanResult) {
  if (!scanResult) return [];
  const t = scanResult.modules?.tampering || {};
  const f = scanResult.modules?.face_verification || {};
  return [
    { time: scanResult.submittedAt, event: `Document "${scanResult.thumbnailLabel}" uploaded` },
    { time: scanResult.submittedAt, event: 'OCR extraction completed' },
    { time: scanResult.submittedAt, event: `Tampering analysis completed — risk: ${t.risk_level ?? 'unknown'}` },
    { time: scanResult.submittedAt, event: f.face_detected_on_live_photo == null ? 'Face match skipped (no live photo)' : 'Face match executed against live photo' },
    { time: scanResult.submittedAt, event: `Risk score computed — recommendation: ${scanResult.status}` },
  ];
}

export function mapCaseDetails(scanResult) {
  if (!scanResult) return null;
  return {
    caseId: scanResult.requestId ? `REQ-${scanResult.requestId}` : '—',
    priority: scanResult.riskScore >= 70 ? 'High' : scanResult.riskScore >= 35 ? 'Medium' : 'Low',
    assignedOfficer: scanResult.officer,
    location: 'Not tracked by this backend',
    notes: (scanResult.modules?.validation?.issues || []).join('; ') || 'No validation issues raised.',
  };
}

export function mapGovernmentDocument(scanResult) {
  if (!scanResult) return null;
  return scanResult.governmentDocument || null;
}
