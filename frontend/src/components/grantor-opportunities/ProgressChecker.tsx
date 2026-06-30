import { useTranslations } from "next-intl";

type RequiredFieldsMap = {
  [key: string]: boolean | RequiredFieldsMap;
};

export const progressType = {
  notStarted: "Not Started", // If all fields are null, undefined or have an empty string
  inProgress: "In Progress", // If any of the fields contain a non-empty string or non-undefined value
  complete: "Complete", // If all REQUIRED fields are provided
  // completed is not supported at this time
};

// Recursively check for required fields
function checkRequiredFields<T extends object>(
  requiredFields: RequiredFieldsMap,
  dataToCheck: T,
): boolean {
  let missingRequiredField = false;
  const data = dataToCheck as Record<string, unknown>;

  if (!data && requiredFields) {
    return true; // missingRequiredField is true
  }

  for (const [key, value] of Object.entries(requiredFields)) {
    const dataValue = data[key];
    // console.log(`Key: ${key}, Value: ${value}, dataValue: ${dataValue}`);
    if (
      dataValue === undefined ||
      dataValue === null ||
      (typeof dataValue === "string" && dataValue.trim() === "")
    ) {
      missingRequiredField = true;
      break; // we only need to know that one required field is missing
    } else if (typeof value !== "boolean") {
      // Recursively check nested objects!
      missingRequiredField = checkRequiredFields(
        value,
        data[key] as Record<string, unknown>,
      );
      if (missingRequiredField) break;
    }
  }
  return missingRequiredField;
}
// Recursively check the data for any values
function checkDataValues<T extends object>(dataToCheck: T): boolean {
  let dataValuesFound = false;

  if (!dataToCheck) {
    return false; // dataValuesFound is false
  }

  for (const value of Object.values(dataToCheck as Record<string, unknown>)) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      // Value not found
    } else {
      // Value found
      if (typeof value === "object" && !Array.isArray(value)) {
        // Recursively check nested objects!
        dataValuesFound = checkDataValues(value as Record<string, unknown>);
        if (dataValuesFound) break;
      } else {
        dataValuesFound = true;
        break; // we only need to know that progress has started
      }
    }
  }
  return dataValuesFound;
}

// Check dataToCheck and return the appropriate progressType as defined above.
export function getProgess<T extends object>(
  requiredFields: RequiredFieldsMap,
  dataToCheck: T,
) {
  const missingRequiredField = checkRequiredFields(requiredFields, dataToCheck);
  const dataValuesFound = checkDataValues(dataToCheck);
  // 'not started' if all fields are null, undefined or have an empty string
  if (!dataValuesFound) return progressType.notStarted;
  // 'complete' if all REQUIRED fields are provided
  if (!missingRequiredField) return progressType.complete;
  // 'in progress' if any of the fields contain a non-empty string or non-undefined value
  return progressType.inProgress;
}

// This function will return an HTML component after checking the data entry progress
export function ProgressChecker<T extends object>({
  requiredFields,
  dataToCheck,
}: {
  requiredFields: RequiredFieldsMap;
  dataToCheck: T;
}) {
  const t = useTranslations("ProgressChecker");
  const status = getProgess(requiredFields, dataToCheck);
  return (
    <>
      {status === progressType.notStarted && (
        <span className="display-inline-block width-15 padding-05 text-center bg-base-dark text-white">
          {t("notStarted")}
        </span>
      )}

      {status === progressType.inProgress && (
        <span className="display-inline-block width-15 padding-05 text-center bg-accent-warm-lightest">
          {t("inProgress")}
        </span>
      )}

      {status === progressType.complete && (
        <span className="display-inline-block width-15 padding-05 text-center bg-primary-lighter">
          {t("complete")}
        </span>
      )}
    </>
  );
}
