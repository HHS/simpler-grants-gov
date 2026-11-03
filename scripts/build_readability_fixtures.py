"""Build tiny fictional browser-upload fixtures offline; never makes requests."""

import argparse
import hashlib
import json
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

BODY_MARKER = "SYNTHETIC-NOFO-BODY-CHECK-2026"


def pdf(title, paragraphs, author="Synthetic fixture"):
    output = BytesIO()
    styles = getSampleStyleSheet()
    story = [Paragraph(title, styles["Title"]), Spacer(1, 0.15 * inch)]
    for paragraph in paragraphs:
        story.extend([Paragraph(paragraph, styles["BodyText"]), Spacer(1, 0.1 * inch)])
    SimpleDocTemplate(
        output,
        title=title,
        author=author,
        pagesize=(612, 792),
        leftMargin=54,
        rightMargin=54,
        topMargin=45,
        bottomMargin=45,
        invariant=1,
    ).build(story)
    return output.getvalue()


def build(output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    supported = pdf(
        "Synthetic NOFO - test only",
        [
            "Fictional verification document. Not a funding announcement. No real people or application data.",
            "Department of Health and Human Services. Opportunity Number: TEST-2026-001. Assistance Listing Number: 93.000. Reference: https://www.grants.gov/.",
            "Purpose: This fictional program supports neighborhood learning activities. The example organization will offer public workshops and share simple teaching materials. Staff will explain each activity, answer questions, and invite participants to give feedback. The document exists only to exercise the Readability Calculator with selectable text.",
            "Eligibility: Fictional community organizations may apply in this example. Each organization should describe its proposed activities and explain how it will serve its community. No real organization should submit an application. There is no actual application deadline or funding opportunity associated with this document.",
            "Application: Describe the project, the planned schedule, and the resources needed. Explain how staff will welcome participants and measure progress. Include a fictional budget narrative and a clear account of the expected results. Use plain language so that readers can understand the proposal without specialist knowledge.",
            "Review: A fictional review team will assess whether the proposed activities address the stated purpose. The team will consider the clarity of the plan, the proposed schedule, and the explanation of costs. These instructions contain no policy requirements and must not be used for a real competition.",
            f"Verification marker: {BODY_MARKER}. All names, identifiers, amounts and activities are fictional. Delete browser-downloaded reports after the test if they are no longer needed.",
        ],
        author="Department of Health and Human Services - synthetic testing",
    )
    unrelated = pdf(
        "Synthetic gardening notes",
        [
            "Fictional verification document. This page is deliberately unrelated to the calculator's supported document recognition rules.",
            "Prepare a small garden bed by clearing weeds and loosening the soil. Choose plants suited to the season and water them regularly. Keep a record of rainfall and observe how much sunlight reaches the plot. Leave enough space between plants and remove fallen leaves from paths.",
        ],
    )
    drawing = BytesIO()
    c = canvas.Canvas(drawing, pagesize=(612, 792), invariant=1)
    c.setTitle("Synthetic no-text drawing")
    c.setAuthor("Synthetic fixture")
    # Shapes only, deliberately no text objects or NOFO metadata signals.
    c.setFillColor(colors.lightblue)
    c.rect(54, 500, 504, 200, fill=1, stroke=0)
    c.setFillColor(colors.darkblue)
    c.circle(306, 600, 65, fill=1, stroke=0)
    c.showPage()
    c.save()
    encrypted = PdfWriter(clone_from=PdfReader(BytesIO(supported)))
    encrypted.encrypt("synthetic-test-only", algorithm="RC4-128")
    encrypted_output = BytesIO()
    encrypted.write(encrypted_output)
    cases = {
        "synthetic-nofo-supported.pdf": (
            supported,
            "Report returned with generic/untagged PDF caveats",
            "success",
        ),
        "synthetic-unrelated.pdf": (
            unrelated,
            "Document not recognized as an HHS NOFO",
            "format_unsupported",
        ),
        "synthetic-no-text.pdf": (
            drawing.getvalue(),
            "Format cannot be determined without extractable text",
            "format_indeterminate",
        ),
        "synthetic-encrypted.pdf": (
            encrypted_output.getvalue(),
            "Password-protected PDF rejected",
            "encrypted",
        ),
        "synthetic-invalid.pdf": (
            b"Synthetic invalid upload: intentionally not PDF bytes.\n",
            "Invalid PDF rejected",
            "invalid_pdf",
        ),
    }
    manifest = {
        "scope": "Offline fictional public-route PDF fixtures; not deployed evidence",
        "body_marker": BODY_MARKER,
        "fixtures": [],
    }
    for filename, (content, expectation, outcome) in cases.items():
        (output_dir / filename).write_bytes(content)
        manifest["fixtures"].append(
            {
                "file": filename,
                "bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
                "expected_behavior": expectation,
                "expected_recorded_outcome": outcome,
            }
        )
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir", type=Path, default=Path("output/pdf/readability-fixtures")
    )
    build(parser.parse_args().output_dir)
