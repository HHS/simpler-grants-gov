import { ExternalRoutes } from "src/constants/routes";

import Link from "next/link";
import { ReactNode } from "react";

export default function GithubIssueLink({
  issueNumber,
  chunks,
  extraClasses = "",
}: {
  issueNumber?: number;
  chunks: ReactNode;
  extraClasses?: string;
}) {
  return (
    <Link
      target="_blank"
      className={`usa-link--external text-bold ${extraClasses}`}
      href={`${ExternalRoutes.GITHUB_REPO}/issues/${issueNumber !== undefined ? issueNumber : "?q=is%3Aissue%20type%3ADeliverable%20"}`}
    >
      {chunks}
    </Link>
  );
}

export const gitHubLinkForIssue = (issueNumber: number) => {
  const PartialIssueLink = (chunks: ReactNode) => (
    <GithubIssueLink issueNumber={issueNumber} chunks={chunks} />
  );
  PartialIssueLink.displayName = "GithubIssueLink";
  return PartialIssueLink;
};
