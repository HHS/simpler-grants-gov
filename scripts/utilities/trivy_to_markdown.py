import argparse
import json
import os
from pathlib import Path

# trivy_to_markdown.py \
#   --results <results.json> \
#   --directory <dir> \
#   --env <env> \
#   --scan-ref <scan-ref>
# Output is markdown table for nice viewing in Github


# For auto-linking
def file_link(target, start_line):
    resolved = Path(args.scan_ref) / target
    resolved = resolved.resolve().relative_to(Path.cwd())
    if can_link:
        url = f"{server_url}/{repository}/blob/{sha}/{resolved}#L{start_line}"
        return f"[{resolved}:{start_line}]({url})"
    return f"`{resolved}:{start_line}`"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--results", required=True, help="Path to trivy JSON results file"
    )
    parser.add_argument(
        "--directory", required=True, help="Terraform playbook directory"
    )
    parser.add_argument("--env", required=True, help="Environment (dev, test, prod)")
    parser.add_argument(
        "--scan-ref",
        required=True,
        help="The trivy scan-ref path (e.g. dol-ui-claimant-intake/app)",
    )
    args = parser.parse_args()

    # For auto-linking to the finding to make everyone's life easier
    # Default env vars
    server_url = os.environ.get("GITHUB_SERVER_URL")
    repository = os.environ.get("GITHUB_REPOSITORY")
    sha = os.environ.get("GITHUB_SHA")
    # If these are all defined, we can link and will add links
    can_link = all([server_url, repository, sha])

    # Open the trivy file for parsing
    with open(args.results) as f:
        data = json.load(f)

    # Pull out just what we want to get info on
    findings = []
    for result in data.get("Results", []):
        if result.get("MisconfSummary", {}).get("Failures", 0) > 0:
            findings.append(result)

    # Breakdown the output so we can see what the findings are for
    lines = [f"## Trivy Scan — {args.directory} ({args.env})\n"]

    if not findings:
        # We don't want a lot of step summaries we don't need
        lines = []
    else:
        for result in findings:
            target = result["Target"]
            misconfigs = result.get("Misconfigurations", [])
            count = len(misconfigs)
            lines.append(
                f"### `{target}` ({count} finding{'s' if count != 1 else ''})\n"
            )
            lines.append("| Severity | ID | Title | Message | Location |")
            lines.append("|----------|----|-------|---------|----------|")
            for m in misconfigs:
                severity = m.get("Severity", "")
                rule_id = m.get("ID", "")
                title = m.get("Title", "").replace("|", "\\|")
                message = m.get("Message", "").replace("\n", " ").replace("|", "\\|")
                cause = m.get("CauseMetadata", {})
                start_line = cause.get("StartLine", 0)
                location = (
                    file_link(target, start_line) if start_line else f"`{target}`"
                )
                lines.append(
                    f"| {severity} | {rule_id} | {title} | {message} | {location} |"
                )
            lines.append("")

    print("\n".join(lines))
