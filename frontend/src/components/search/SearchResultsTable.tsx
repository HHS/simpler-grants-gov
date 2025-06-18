import { SearchResponseData } from "src/types/search/searchRequestTypes";
import { getOpportunityUrl } from "src/utils/opportunity/opportunityUtils";

import { useTranslations } from "next-intl";
import { Table } from "@trussworks/react-uswds";

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
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("headings.closeDate")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("headings.status")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("headings.title")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("headings.agency")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("headings.awardMin")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("headings.awardMax")}
          </th>
        </tr>
      </thead>
      <tbody>
        {searchResults.map((result) => {
          return (
            <tr key={result.opportunity_id}>
              <td>{result.summary.close_date}</td>
              <td>{result.opportunity_status}</td>
              <td>
                <div>
                  <a href={getOpportunityUrl(result.opportunity_id)}>
                    {result.opportunity_title}
                  </a>
                </div>
                <div>
                  {t("number")}: {result.opportunity_number}
                </div>
              </td>
              <td>
                <div>{result.agency_name}</div>
                <div>
                  {t("published")}: {result.summary.post_date}
                </div>
                <div>
                  {t("expectedAwards")}:{" "}
                  {result.summary.expected_number_of_awards}
                </div>
              </td>
              <td>{result.summary.award_ceiling}</td>
              <td>{result.summary.award_floor}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
