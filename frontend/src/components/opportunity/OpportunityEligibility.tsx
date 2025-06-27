import { upperFirst } from "lodash";
import { eligbilityValueToGroup } from "src/constants/opportunity";
import { getFilterOptionLabel } from "src/utils/search/filterUtils";

import { eligibilityOptions } from "src/components/search/SearchFilterAccordion/SearchFilterOptions";

export const applicantTypesToGroups = (applicantTypes: string[]) =>
  applicantTypes.reduce(
    (groupedApplicantTypes, applicantType) => {
      const group = eligbilityValueToGroup[applicantType];
      const applicantTypeDisplay = getFilterOptionLabel(
        applicantType,
        eligibilityOptions,
      );
      if (!group || !applicantTypeDisplay) {
        return groupedApplicantTypes;
      }
      if (!groupedApplicantTypes[group]) {
        groupedApplicantTypes[group] = [applicantTypeDisplay];
      } else {
        groupedApplicantTypes[group].push(applicantTypeDisplay);
      }
      return groupedApplicantTypes;
    },
    {} as { [key: string]: string[] },
  );

export const OpportunityEligibility = ({
  applicantTypes,
}: {
  applicantTypes: string[];
}) => {
  if (!applicantTypes || !applicantTypes.length) {
    return <div>--</div>;
  }

  return (
    <>
      {Object.entries(applicantTypesToGroups(applicantTypes)).map(
        ([groupName, applicantTypes]) => {
          return (
            <div key={`eligibility-group${groupName}`}>
              <h4>{upperFirst(groupName)}</h4>
              <ul>
                {applicantTypes.map((display) => (
                  <li key={display}>{display}</li>
                ))}
              </ul>
            </div>
          );
        },
      )}
    </>
  );
};
