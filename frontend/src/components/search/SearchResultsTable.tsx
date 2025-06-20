import clsx from "clsx";
import { isNil } from "lodash";
import { OpportunityStatus } from "src/types/opportunity/opportunityResponseTypes";
import { SearchResponseData } from "src/types/search/searchRequestTypes";
import { toShortMonthDate } from "src/utils/dateUtil";
import { formatCurrency } from "src/utils/formatCurrencyUtil";
import { getOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";
import { Table } from "@trussworks/react-uswds";

const statusColorClasses = {
  posted: "bg-accent-warm-light",
  forecasted: "bg-accent-warm-lightest",
  closed: "bg-base-lightest",
  archived: "bg-base-lightest",
};

export const SearchTableStatusDisplay = ({
  status,
}: {
  status: OpportunityStatus;
}) => {
  const t = useTranslations("Search.table");
  const backgroundClass = statusColorClasses[status];
  return (
    <div
      className={clsx("text-center padding-y-05 minw-15 radius-md", {
        [backgroundClass]: !!backgroundClass,
      })}
    >
      {t(`statuses.${status}`)}
    </div>
  );
};

export const SearchResultsTable = ({
  searchResults,
}: {
  searchResults: SearchResponseData;
}) => {
  const t = useTranslations("Search.table");
  return (
    <Table>
      <thead>
        <tr>
          <th scope="col" className="bg-base-lightest padding-y-205 minw-15">
            {t("headings.closeDate")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205 minw-15">
            {t("headings.status")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205 minw-15">
            {t("headings.title")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205 minw-15">
            {t("headings.agency")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205 minw-15">
            {t("headings.awardMin")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205 minw-15">
            {t("headings.awardMax")}
          </th>
        </tr>
      </thead>
      <tbody>
        {searchResults.map((result) => {
          return (
            <tr key={result.opportunity_id}>
              <td>
                {result.summary.close_date
                  ? toShortMonthDate(result.summary.close_date)
                  : t("tbd")}
              </td>
              <td>
                <SearchTableStatusDisplay status={result.opportunity_status} />
              </td>
              <td>
                <div className="font-sans-lg text-bold">
                  <a href={getOpportunityUrl(result.opportunity_id)}>
                    {result.opportunity_title}
                  </a>
                </div>
                <div className="font-sans-xs">
                  <span className="text-bold">{t("number")}:</span>{" "}
                  {result.opportunity_number}
                </div>
              </td>
              <td>
                <div className="margin-bottom-1">{result.agency_name}</div>
                <div className="font-sans-xs">
                  <span className="text-bold">{t("published")}</span>:{" "}
                  {result.summary.post_date}
                </div>
                <div className="font-sans-xs">
                  {t("expectedAwards")}:{" "}
                  {isNil(result.summary.expected_number_of_awards)
                    ? "--"
                    : result.summary.expected_number_of_awards}
                </div>
              </td>
              <td>
                {isNil(result.summary.award_floor)
                  ? "$--"
                  : formatCurrency(result.summary.award_floor)}
              </td>
              <td>
                {isNil(result.summary.award_ceiling)
                  ? "$--"
                  : formatCurrency(result.summary.award_ceiling)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
