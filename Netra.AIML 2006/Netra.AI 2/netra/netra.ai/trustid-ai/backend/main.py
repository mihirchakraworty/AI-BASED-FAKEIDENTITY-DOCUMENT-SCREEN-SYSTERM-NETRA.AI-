import sys
import logging
import uuid
from pathlib import Path

# Automatically add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from services.ocr import extract_text
from services.validation import validate_document
from services.tampering import detect_tampering
from services.risk_score import calculate_risk
from services.face_verification import verify_face
from services.gov_document import classify_government_document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trustid")

app = FastAPI(
    title="TRUSTID AI",
    description="AI Powered Fake Identity & Document Screening System",
    version="1.0.0"
)

# NOTE: allow_origins=["*"] combined with allow_credentials=True is invalid
# per the CORS spec (browsers will reject it) and unsafe for a service
# handling ID documents / biometrics. Configure your real frontend
# origin(s) via the FRONTEND_ORIGINS env var (comma-separated) before
# deploying; the localhost entries below are only for local dev with the
# Vite dev server.
import os

_env_origins = os.environ.get("FRONTEND_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _env_origins.split(",") if o.strip()] or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB, adjust as needed
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


async def _read_and_validate_upload(file: UploadFile, field_name: str) -> bytes:
    """Validate content-type and size, then read the file into memory."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name}: unsupported content type '{file.content_type}'"
        )

    data = await file.read()

    if len(data) == 0:
        raise HTTPException(status_code=400, detail=f"{field_name}: empty file")

    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name}: file exceeds {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB limit"
        )

    return data


def _mask_id_number(value: str | None) -> str | None:
    """Mask all but the last 4 characters of a sensitive ID/document number
    before it ever leaves the backend, per Part 13 (privacy & security)."""
    if not value:
        return value
    if len(value) <= 4:
        return "*" * len(value)
    return ("*" * (len(value) - 4)) + value[-4:]


@app.post("/api/verify-document")
async def verify_document_endpoint(
    document: UploadFile = File(...),
    live_photo: UploadFile = File(None)
):
    request_id = uuid.uuid4().hex[:8]
    logger.info("[%s] verify-document request received", request_id)

    # --- Input validation ---
    doc_bytes = await _read_and_validate_upload(document, "document")
    live_photo_bytes = (
        await _read_and_validate_upload(live_photo, "live_photo")
        if live_photo is not None else None
    )

    # --- Run each pipeline stage independently so a single failing module
    # doesn't collapse into an opaque generic 500. Blocking/CPU-heavy work
    # is pushed to a thread pool so it doesn't stall the event loop.
    # If your service functions are already `async def`, replace the
    # run_in_threadpool(...) calls below with plain `await func(...)`.

    try:
        ocr_result = await run_in_threadpool(extract_text, doc_bytes, document.filename)
    except Exception as e:
        logger.exception("[%s] OCR stage failed", request_id)
        raise HTTPException(status_code=502, detail="OCR processing failed") from e

    try:
        validation_result = await run_in_threadpool(validate_document, ocr_result)
    except Exception as e:
        logger.exception("[%s] Validation stage failed", request_id)
        raise HTTPException(status_code=502, detail="Document validation failed") from e

    try:
        tamper_result = await run_in_threadpool(detect_tampering, doc_bytes)
    except Exception as e:
        logger.exception("[%s] Tampering detection stage failed", request_id)
        raise HTTPException(status_code=502, detail="Tampering detection failed") from e

    try:
        face_result = await run_in_threadpool(verify_face, doc_bytes, live_photo_bytes)
    except Exception as e:
        logger.exception("[%s] Face verification stage failed", request_id)
        raise HTTPException(status_code=502, detail="Face verification failed") from e

    try:
        risk_summary = calculate_risk(
            ocr_data=ocr_result,
            validation_data=validation_result,
            tamper_data=tamper_result,
            face_data=face_result
        )
    except Exception as e:
        logger.exception("[%s] Risk scoring stage failed", request_id)
        raise HTTPException(status_code=502, detail="Risk scoring failed") from e

    # Government-document detection reuses the OCR stage's output rather
    # than re-analyzing the image, so it can't fail independently of OCR.
    gov_document = classify_government_document(ocr_result)

    logger.info("[%s] verify-document request completed", request_id)

    # Never send full raw OCR text (may contain the full ID number, DOB,
    # etc.) or an unmasked document number back to the client / logs.
    doc_number_raw = ocr_result.get("document_number")
    safe_ocr_result = {
        **ocr_result,
        "document_number": _mask_id_number(doc_number_raw),
        "raw_text": None,  # avoid echoing full sensitive OCR text to the client
    }

    return {
        "requestId": request_id,
        "docId": _mask_id_number(doc_number_raw) or f"DOC-{uuid.uuid4().hex[:5].upper()}",
        "docType": ocr_result.get("document_type", "Passport / ID"),
        "submittedAt": "Just now",
        "officer": "Officer System",  # TODO: replace with authenticated user once auth is added
        "thumbnailLabel": document.filename,
        "status": risk_summary.get("recommendation", "Awaiting officer decision"),
        "riskScore": risk_summary.get("score", 0),
        "riskBreakdown": risk_summary.get("breakdown", {}),
        "modules": {
            "ocr": safe_ocr_result,
            "validation": validation_result,
            "tampering": tamper_result,
            "face_verification": face_result
        },
        "governmentDocument": gov_document
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# import sys
# from pathlib import Path
# import uuid

# # Automatically add the current directory to Python path
# sys.path.append(str(Path(__file__).parent))

# from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.middleware.cors import CORSMiddleware

# from services.ocr import extract_text
# from services.validation import validate_document
# from services.tampering import detect_tampering
# from services.risk_score import calculate_risk
# from services.face_verification import verify_face
# app = FastAPI(
#     title="TRUSTID AI",
#     description="AI Powered Fake Identity & Document Screening System",
#     version="1.0.0"
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.post("/api/verify-document")
# async def verify_document_endpoint(
#     document: UploadFile = File(...),
#     live_photo: UploadFile = File(None)
# ):
#     try:
#         doc_bytes = await document.read()
#         live_photo_bytes = await live_photo.read() if live_photo else None

#         ocr_result = extract_text(doc_bytes, document.filename)
#         validation_result = validate_document(ocr_result)
#         tamper_result = detect_tampering(doc_bytes)
#         face_result = verify_face(doc_bytes, live_photo_bytes)

#         risk_summary = calculate_risk(
#             ocr_data=ocr_result,
#             validation_data=validation_result,
#             tamper_data=tamper_result,
#             face_data=face_result
#         )

#         return {
#             "docId": ocr_result.get("document_number", f"DOC-{uuid.uuid4().hex[:5].upper()}"),
#             "docType": ocr_result.get("document_type", "Passport / ID"),
#             "submittedAt": "Just now",
#             "officer": "Officer System",
#             "thumbnailLabel": document.filename,
#             "status": risk_summary.get("recommendation", "Awaiting officer decision"),
#             "riskScore": risk_summary.get("score", 0),
#             "modules": {
#                 "ocr": ocr_result,
#                 "validation": validation_result,
#                 "tampering": tamper_result,
#                 "face_verification": face_result
#             }
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# def health_check():
#     return {"status": "healthy"}