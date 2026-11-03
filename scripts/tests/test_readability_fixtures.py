"""Check fictional fixture integrity and parser properties without network access."""

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "scripts/tests/fixtures/readability"
SPEC = importlib.util.spec_from_file_location(
    "build_fixtures", ROOT / "scripts/build_readability_fixtures.py"
)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class FixtureTests(unittest.TestCase):
    def verify(self, root):
        manifest = json.loads((root / "manifest.json").read_text())
        self.assertEqual(len(manifest["fixtures"]), 5)
        self.assertEqual(
            {c["expected_recorded_outcome"] for c in manifest["fixtures"]},
            {
                "success",
                "encrypted",
                "format_unsupported",
                "format_indeterminate",
                "invalid_pdf",
            },
        )
        for case in manifest["fixtures"]:
            with self.subTest(file=case["file"]):
                content = (root / case["file"]).read_bytes()
                self.assertEqual(len(content), case["bytes"])
                self.assertLess(len(content), 10000)
                self.assertEqual(hashlib.sha256(content).hexdigest(), case["sha256"])
        supported = PdfReader(root / "synthetic-nofo-supported.pdf")
        self.assertEqual(len(supported.pages), 1)
        text = supported.pages[0].extract_text()
        for signal in (
            builder.BODY_MARKER,
            "TEST-2026-001",
            "93.000",
            "https://www.grants.gov/",
        ):
            self.assertIn(signal, text)
        self.assertIn("synthetic", supported.metadata.author.lower())
        unrelated = PdfReader(root / "synthetic-unrelated.pdf")
        unrelated_text = " ".join(p.extract_text() for p in unrelated.pages)
        self.assertNotIn("Grants.gov", unrelated_text)
        self.assertNotIn("Department of Health", unrelated_text)
        no_text = PdfReader(root / "synthetic-no-text.pdf")
        self.assertEqual("".join(p.extract_text() for p in no_text.pages).strip(), "")
        encrypted = PdfReader(root / "synthetic-encrypted.pdf")
        self.assertTrue(encrypted.is_encrypted)
        encrypted.decrypt("synthetic-test-only")
        self.assertIn(builder.BODY_MARKER, encrypted.pages[0].extract_text())
        with self.assertRaises(PdfReadError):
            PdfReader(root / "synthetic-invalid.pdf")

    def test_committed_fixtures_are_intact_and_have_expected_properties(self):
        self.verify(FIXTURES)

    def test_generator_recreates_the_same_cases_offline(self):
        with tempfile.TemporaryDirectory() as directory:
            builder.build(Path(directory))
            self.verify(Path(directory))


if __name__ == "__main__":
    unittest.main()
