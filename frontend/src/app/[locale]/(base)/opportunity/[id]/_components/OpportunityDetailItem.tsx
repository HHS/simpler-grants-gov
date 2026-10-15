import clsx from "clsx";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

import { ReactNode } from "react";

export const ADDITIONAL_ELIGIBILITY_INFO_ID =
  "opportunity-additional-eligibility-info";

// section headings follow the design's type scale rather than the larger USWDS h2 default
export const SECTION_HEADING_CLASSES =
  "font-sans-lg margin-top-0 margin-bottom-2";

// formatDate warns on null, so only call it when there is a date to format
export const formatOptionalDate = (date: string | null) =>
  date ? formatDate(date) : "";

// forecasts never have a close date, so the missing close date handling only applies to other statuses
export const isCloseDateMissing = ({
  opportunity_status,
  summary,
}: Pick<OpportunityDetail, "opportunity_status" | "summary">) =>
  opportunity_status !== "forecasted" &&
  !formatOptionalDate(summary.close_date);

export const OpportunityDetailsCard = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "border radius-md border-base-lighter padding-x-2 padding-y-1",
      className,
    )}
  >
    {children}
  </div>
);

export const OpportunityDetailItem = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <p className="margin-y-1">
    <strong>{label}:</strong> {children}
  </p>
);
