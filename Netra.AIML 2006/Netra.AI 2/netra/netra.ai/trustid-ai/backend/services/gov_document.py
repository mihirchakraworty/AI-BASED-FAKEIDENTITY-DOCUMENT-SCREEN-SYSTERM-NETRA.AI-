"""
Government document detection & classification service.

Builds on top of the existing OCR output (services/ocr.py) instead of
introducing a second, duplicate classification pipeline. `ocr.extract_text`
already does keyword-based detection of a handful of Indian government
document types (Aadhaar, PAN, Passport, Driving Licence) from the raw
OCR text — this module turns that signal into the richer, user-facing
structure the frontend needs: category, importance (HIGH/MEDIUM/LOW),
a plain-language reason, practical use cases, and an honest confidence
figure.

This is intentionally a rules table, not a new ML model — it re-uses
whatever document_type + ocr_confidence the OCR stage already produced.
If OCR could not confidently read the document, this returns an
"Unknown" classification rather than guessing.
"""

import logging

logger = logging.getLogger("trustid.gov_document")

# Minimum OCR confidence (0-100) below which we refuse to assert a
# specific document type, even if a keyword happened to match.
MIN_CLASSIFICATION_CONFIDENCE = 40.0

# document_type (as produced by services/ocr.py) -> classification info.
# "Passport / ID" is the OCR module's generic fallback when no specific
# keyword matched, so it is deliberately NOT treated as a confident
# government-document match here.
GOV_DOCUMENT_TABLE = {
    "Aadhaar Card": {
        "category": "Government ID",
        "importance": "HIGH",
        "reason": (
            "This is a government-issued identity document and may be used "
            "for identity verification, official applications, financial/KYC "
            "processes, or other verification purposes."
        ),
        "uses": [
            "Identity verification",
            "Government service applications",
            "Address/identity-related verification",
            "Certain KYC processes",
        ],
    },
    "PAN Card": {
        "category": "Government ID",
        "importance": "HIGH",
        "reason": (
            "This is a government-issued identity document and may be used "
            "for identity verification, official applications, financial/KYC "
            "processes, or other verification purposes."
        ),
        "uses": [
            "Tax-related identification",
            "Financial/KYC processes",
            "Certain banking and investment activities",
        ],
    },
    "Passport": {
        "category": "Government ID",
        "importance": "HIGH",
        "reason": (
            "This is a government-issued identity document and may be used "
            "for identity verification, official applications, financial/KYC "
            "processes, or other verification purposes."
        ),
        "uses": [
            "International travel",
            "Identity verification",
            "Visa/immigration processes",
        ],
    },
    "Driving Licence": {
        "category": "Government ID",
        "importance": "HIGH",
        "reason": (
            "This is a government-issued identity document and may be used "
            "for identity verification, official applications, financial/KYC "
            "processes, or other verification purposes."
        ),
        "uses": [
            "Driving authorization",
            "Identity/address verification in some contexts",
        ],
    },
}


def _empty_or_unknown(reason: str) -> dict:
    return {
        "documentType": "Unknown",
        "category": "Unknown",
        "isGovernmentDocument": False,
        "importance": None,
        "confidence": 0,
        "reason": reason,
        "uses": [],
    }


def classify_government_document(ocr_data: dict) -> dict:
    """
    Classify OCR output as a government document (or not), with an
    importance level, plain-language reason, and use cases.

    Never asserts a specific document type unless OCR confidence clears
    MIN_CLASSIFICATION_CONFIDENCE — low-confidence input is reported as
    Unknown rather than guessed at.

    Returns a dict shaped like:
    {
        "documentType": str,
        "category": str,
        "isGovernmentDocument": bool,
        "importance": "HIGH" | "MEDIUM" | "LOW" | None,
        "confidence": int,        # 0-100
        "reason": str,
        "uses": [str, ...],
    }
    """
    doc_type = ocr_data.get("document_type")
    ocr_confidence = ocr_data.get("ocr_confidence", 0.0) or 0.0
    raw_text = (ocr_data.get("raw_text") or "").strip()

    if not raw_text:
        return _empty_or_unknown(
            "No readable text could be extracted from the document, so it "
            "could not be confidently classified."
        )

    if ocr_confidence < MIN_CLASSIFICATION_CONFIDENCE:
        return _empty_or_unknown(
            f"OCR confidence ({ocr_confidence}%) was too low to confidently "
            "identify this document. Please upload a clearer image with the "
            "complete document visible."
        )

    entry = GOV_DOCUMENT_TABLE.get(doc_type)
    if entry is None:
        # Either the OCR fallback ("Passport / ID") or a type we don't
        # have a classification entry for — do not assert a government
        # match without a real keyword hit.
        return _empty_or_unknown(
            "The document could not be confidently identified as a "
            "specific government-issued document from its text content."
        )

    # Confidence shown to the user tracks OCR confidence directly, since
    # that's what the keyword match was based on.
    confidence = int(round(min(100.0, ocr_confidence)))

    result = {
        "documentType": doc_type,
        "category": entry["category"],
        "isGovernmentDocument": True,
        "importance": entry["importance"],
        "confidence": confidence,
        "reason": entry["reason"],
        "uses": entry["uses"],
    }

    logger.info(
        "Government document classification: type=%s importance=%s confidence=%s",
        doc_type, entry["importance"], confidence,
    )
    return result
