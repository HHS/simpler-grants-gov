import { upperFirst } from "lodash";
import {
  eligbilityValueToGroup,
  eligibilityValueToLabel,
} from "src/constants/opportunity";

export const applicantTypesToGroups = (applicantTypes: string[]) =>
  applicantTypes.reduce(
    (groupedApplicantTypes, applicantType) => {
      const group = eligbilityValueToGroup[applicantType];
      const applicantTypeDisplay = eligibilityValueToLabel[applicantType];
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
