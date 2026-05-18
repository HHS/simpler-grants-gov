#!/usr/bin/env python3
"""Convert internal markdown links to root-relative form.

Scans tracked .md files. For each inline link ``[text](url)`` or image
``![alt](url)`` whose URL resolves to a path inside the repository, rewrites
the URL to start with ``/`` (root-relative, resolved from the repo root).
External links, anchor-only links, and already-root-relative links are left
untouched. Reports rewrites and cases that could not be validated.

Does NOT rewrite HTML ``<a href>`` tags, reference-style link definitions
(``[ref]: url``), or content inside fenced code blocks (``` / ~~~) or inline
backticks.

Usage:
    python3 scripts/convert-markdown-links.py --dry-run --report /tmp/r.csv
    python3 scripts/convert-markdown-links.py --report /tmp/r.csv
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote


INLINE_LINK_RE = re.compile(r"(!?)\[([^\]\n]*)\]\(([^)\n]*)\)")
FENCE_RE = re.compile(r"^\s{0,3}(`{3,}|~{3,})")
INLINE_CODE_RE = re.compile(r"`+[^`\n]*`+")
SCHEME_RE = re.compile(r"^[a-z][a-z0-9+.\-]*:", re.IGNORECASE)


def is_external_url(url: str) -> bool:
    return bool(SCHEME_RE.match(url)) or url.startswith("//")


def split_url_and_title(target: str) -> tuple[str, str]:
    """Split ``(...)`` contents into ``(url, title_suffix)``.

    ``title_suffix`` begins with the whitespace that separates the URL from an
    optional title and is preserved verbatim so the reassembled link is stable.
    Returns ``("", "")`` for angle-bracketed ``<url>`` forms — those are rare
    and we leave them untouched rather than risk a bad round-trip.
    """
    if target.lstrip().startswith("<"):
        return "", ""
    m = re.search(r"\s", target)
    if m:
        return target[: m.start()], target[m.start() :]
    return target, ""


def split_path_and_anchor(url: str) -> tuple[str, str]:
    """Split ``path#anchor`` or ``path?query`` into ``(path, suffix)``.

    The suffix retains the leading ``#`` or ``?``.
    """
    idx = len(url)
    for ch in "#?":
        i = url.find(ch)
        if i != -1 and i < idx:
            idx = i
    return url[:idx], url[idx:]


def mask_inline_code(line: str) -> str:
    """Replace inline backtick spans with NULs so link regex skips them."""
    return INLINE_CODE_RE.sub(lambda m: "\x00" * len(m.group(0)), line)


def tracked_md_files(repo_root: Path) -> list[Path]:
    out = subprocess.run(
        ["git", "ls-files", "-z", "*.md"],
        cwd=repo_root,
        capture_output=True,
        check=True,
    )
    return [repo_root / p.decode() for p in out.stdout.split(b"\x00") if p]


def rewrite_target(
    repo_root: Path, source: Path, url: str
) -> tuple[str, str, str]:
    """Return ``(new_url, status, reason)``.

    status is one of: ``rewritten`` / ``unchanged`` / ``unable to validate``.
    """
    path, suffix = split_path_and_anchor(url)
    if not path:
        return url, "unchanged", "anchor-only or query-only"

    decoded = unquote(path)
    had_trailing_slash = decoded.endswith("/")
    joined = os.path.normpath(os.path.join(str(source.parent), decoded))
    resolved = Path(joined)

    try:
        rel = resolved.relative_to(repo_root)
    except ValueError:
        return url, "unable to validate", "resolves outside repo root"

    if not resolved.exists():
        return url, "unable to validate", "target does not exist"

    new_path = "/" + str(rel).replace(os.sep, "/")
    if had_trailing_slash and not new_path.endswith("/"):
        new_path += "/"
    if "%20" in path:
        new_path = new_path.replace(" ", "%20")
    new_url = new_path + suffix
    if new_url == url:
        return url, "unchanged", "already equivalent"
    return new_url, "rewritten", ""


def process_file(repo_root: Path, source: Path) -> tuple[str, list[dict]]:
    text = source.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    rows: list[dict] = []
    in_fence = False
    new_lines: list[str] = []

    for lineno, line in enumerate(lines, start=1):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            new_lines.append(line)
            continue
        if in_fence:
            new_lines.append(line)
            continue

        masked = mask_inline_code(line)
        replacements: list[tuple[int, int, str]] = []
        for match in INLINE_LINK_RE.finditer(masked):
            bang = match.group(1)
            text_part = match.group(2)
            target = match.group(3)

            url, title_suffix = split_url_and_title(target)
            if not url:
                continue
            if url.startswith("#") or is_external_url(url) or url.startswith("/"):
                continue

            new_url, status, reason = rewrite_target(repo_root, source, url)
            if status == "rewritten":
                new_whole = f"{bang}[{text_part}]({new_url}{title_suffix})"
                replacements.append((match.start(), match.end(), new_whole))
                rows.append({
                    "file": str(source.relative_to(repo_root)),
                    "line": lineno,
                    "old": url,
                    "new": new_url,
                    "status": "rewritten",
                    "reason": "",
                })
            elif status == "unable to validate":
                rows.append({
                    "file": str(source.relative_to(repo_root)),
                    "line": lineno,
                    "old": url,
                    "new": "",
                    "status": "unable to validate",
                    "reason": reason,
                })

        if replacements:
            new_line = line
            for start, end, new_whole in reversed(replacements):
                new_line = new_line[:start] + new_whole + new_line[end:]
            new_lines.append(new_line)
        else:
            new_lines.append(line)

    return "".join(new_lines), rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="do not write files")
    parser.add_argument("--report", type=Path, help="CSV report path")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    repo_root = Path(
        subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            check=True,
            text=True,
        ).stdout.strip()
    ).resolve()

    files = tracked_md_files(repo_root)
    all_rows: list[dict] = []
    changed_files: list[str] = []

    for path in files:
        try:
            new_content, rows = process_file(repo_root, path.resolve())
        except Exception as e:  # pragma: no cover
            print(f"ERROR {path}: {e}", file=sys.stderr)
            continue
        rewrites = [r for r in rows if r["status"] == "rewritten"]
        all_rows.extend(rows)
        if rewrites:
            changed_files.append(str(path.relative_to(repo_root)))
            if not args.dry_run:
                path.write_text(new_content, encoding="utf-8")

    if args.report:
        with args.report.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f, fieldnames=["file", "line", "old", "new", "status", "reason"]
            )
            writer.writeheader()
            writer.writerows(all_rows)

    n_rewrite = sum(1 for r in all_rows if r["status"] == "rewritten")
    n_invalid = sum(1 for r in all_rows if r["status"] == "unable to validate")
    mode = "dry-run" if args.dry_run else "applied"
    print(f"[{mode}] files scanned:        {len(files)}")
    print(f"[{mode}] files with changes:   {len(changed_files)}")
    print(f"[{mode}] links rewritten:      {n_rewrite}")
    print(f"[{mode}] unable to validate:   {n_invalid}")
    if args.report:
        print(f"[{mode}] report: {args.report}")

    if args.verbose:
        for f in changed_files:
            print(f"  changed: {f}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
