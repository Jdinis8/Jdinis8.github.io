#!/usr/bin/env python3

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import update_papers


class PublicationUpdaterTests(unittest.TestCase):
    def test_extracts_supported_arxiv_identifiers(self) -> None:
        cases = {
            "2604.11888": "2604.11888",
            "2604.11888v2": "2604.11888",
            "https://arxiv.org/abs/2506.15311v3": "2506.15311",
            "https://arxiv.org/pdf/2011.10425.pdf": "2011.10425",
        }

        for value, expected in cases.items():
            with self.subTest(value=value):
                self.assertEqual(update_papers.extract_arxiv_id(value), expected)

    def test_writes_ordered_utf8_json_data(self) -> None:
        identifiers = ["second", "first"]
        papers = {
            "first": {
                "id": "first",
                "url": "https://arxiv.org/abs/first",
                "title": "First",
                "published": "2024-01-02T00:00:00Z",
                "authors": ["João D. Álvares"],
                "category": "gr-qc",
            },
            "second": {
                "id": "second",
                "url": "https://arxiv.org/abs/second",
                "title": "Second",
                "published": "2025-03-04T00:00:00Z",
                "authors": ["João D. Álvares"],
                "category": "gr-qc",
            },
        }

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "papers.json"

            with patch.object(update_papers, "PAPERS_DATA_FILE", output):
                update_papers.write_papers_data(identifiers, papers)

            generated = json.loads(output.read_text(encoding="utf-8"))

        self.assertEqual([paper["id"] for paper in generated], identifiers)
        self.assertEqual(generated[0]["display_date"], "4 Mar 2025")
        self.assertEqual(generated[0]["authors"], ["João D. Álvares"])


if __name__ == "__main__":
    unittest.main()
