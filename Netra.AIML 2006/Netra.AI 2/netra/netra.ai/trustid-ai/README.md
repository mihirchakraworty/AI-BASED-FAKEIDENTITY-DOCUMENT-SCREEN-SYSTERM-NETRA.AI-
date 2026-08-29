# TrustID AI (NETRA)

AI-powered document authenticity, biometric match, risk scoring, and
government-document detection. Fully wired frontend (React + Vite) ↔
backend (FastAPI).

## Running locally

**Backend**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Also requires the Tesseract OCR binary installed on the OS
(`sudo apt-get install tesseract-ocr` on Ubuntu/Debian, `brew install
tesseract` on macOS).

**Frontend**

```bash
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend isn't on :8000
npm install
npm run dev
```

Open the printed local URL (default `http://127.0.0.1:5173`).

## What's wired up

- `src/services/api.js` — single place all requests to the backend go
  through (`POST /api/verify-document`, `GET /health`).
- `src/utils/mapScanResult.js` — maps the raw backend response into the
  small shapes each dashboard panel needs.
- The dashboard, extracted-info, AI verification, tampering, face
  verification, timeline, case details, recent history, and risk
  distribution panels all render real data from the last scan (and this
  session's scan history) instead of mock data. They show an explicit
  empty state until you scan a document.
- `backend/services/gov_document.py` — classifies OCR output as a
  government document (Aadhaar/PAN/Passport/Driving Licence), with an
  importance level (HIGH/MEDIUM/LOW), a plain-language reason, and
  typical use cases. Low-confidence OCR is reported as "Unknown" rather
  than guessed.
- The backend never returns raw OCR text or an unmasked document number
  to the client (only the last 4 characters of the ID number are shown).

## Notes / limitations

- This backend has no database or authentication yet — "history" shown
  in the UI is scoped to the current browser session, not persisted.
  `main.py` has a `# TODO` where an authenticated officer identity would
  replace the placeholder `"Officer System"`.
- Face verification uses the OpenCV histogram fallback unless
  `face_recognition`/dlib is installed (see `backend/services/
  face_verification.py`) — treat its similarity score as a weak proxy,
  not a real biometric match, until that dependency is added.
- Tampering detection is a classic ELA heuristic, not a trained forgery
  classifier — see `backend/services/tampering.py` for caveats.

---

# React + Vite (template info)

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
