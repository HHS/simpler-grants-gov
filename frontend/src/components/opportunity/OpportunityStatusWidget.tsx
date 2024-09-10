import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";

type Props = {
  opportunityData: Opportunity;
};

const statusTagFormatter = (
  status: string,
  closeDate: string,
  archiveDate: string,
) => {
  switch (status) {
    case "archived":
      return (
        <div className="usa-tag bg-base-lighter text-ink border-radius-2 border-base-lightest width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
          <p>
            <strong>Archived: </strong>
            <span>{formatDate(archiveDate)}</span>
          </p>
        </div>
      );
    case "closed":
      return (
        <div className="usa-tag bg-base-lighter text-ink border-radius-2 border-base-lightest width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
          <p>
            <strong>Closed: </strong>
            <span>{formatDate(closeDate)}</span>
          </p>
        </div>
      );
    case "posted":
      return (
        <>
          <div className="usa-tag bg-accent-warm-dark width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
            <p>
              <strong>Closing: </strong>
              <span>{formatDate(closeDate)}</span>
            </p>
          </div>
          <div className="border radius-md border-base-lighter padding-x-2">
            <p className="line-height-sans-5">
              Electronically submitted applications must be submitted no later
              than 5:00 p.m., ET, on the listed application due date.
            </p>
          </div>
        </>
      );
    case "forecasted":
      return (
        <div className="usa-tag bg-base-dark border-radius-2 width-100 radius-md margin-right-0 font-sans-sm text-center text-no-uppercase">
          <p>
            <strong>Forecasted </strong>
          </p>
        </div>
      );
    default:
      return null;
  }
};

const OpportunityStatusWidget = ({ opportunityData }: Props) => {
  let opportunityStatus = opportunityData.opportunity_status;
  let opportunityCloseDate = opportunityData.summary.close_date;
  const opportunityArchiveDate = opportunityData.summary.archive_date;

  return (
    <div usa-prose margin-top-2>
      {statusTagFormatter(
        opportunityStatus,
        opportunityCloseDate,
        opportunityArchiveDate,
      )}
    </div>
  );
};

export default OpportunityStatusWidget;
