// Centralized API layer for the TrustID AI backend (backend/main.py).
// Every request to the backend should go through here rather than being
// duplicated with raw fetch() calls inside components.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Submit a document (and optional live selfie) for full verification:
 * OCR, validation, tampering detection, face match, risk scoring, and
 * government-document classification, in one call to
 * POST /api/verify-document.
 *
 * @param {File} documentFile
 * @param {File|null} livePhotoFile
 * @returns {Promise<object>} the backend's verification response
 */
export async function verifyDocument(documentFile, livePhotoFile = null) {
  if (!documentFile) {
    throw new ApiError('A document file is required.', 400);
  }

  const formData = new FormData();
  formData.append('document', documentFile);
  if (livePhotoFile) {
    formData.append('live_photo', livePhotoFile);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/verify-document`, {
      method: 'POST',
      body: formData,
    });
  } catch (networkErr) {
    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}. Is it running?`,
      0
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON response body, fall through to status-based error below
  }

  if (!response.ok) {
    const detail = payload?.detail || `Request failed with status ${response.status}`;
    throw new ApiError(detail, response.status);
  }

  return payload;
}

/** GET /health */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === 'healthy';
  } catch {
    return false;
  }
}

export { ApiError };
