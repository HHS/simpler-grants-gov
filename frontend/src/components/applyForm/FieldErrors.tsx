import { ErrorMessage } from "@trussworks/react-uswds";

export const FieldErrors = ({
  fieldName,
  rawErrors,
}: {
  fieldName: string;
  rawErrors: string[] | undefined;
}): React.ReactNode | null => {
  if (rawErrors) {
    if (rawErrors.length > 1) {
      return (
        <ErrorMessage id={`error-for-${fieldName}`}>
          <ul>
            {rawErrors.map((error, idx) => (
              <li key={idx}>{String(error)}</li>
            ))}
          </ul>
        </ErrorMessage>
      );
    } else {
      return (
        <ErrorMessage id={`error-for-${fieldName}`}>
          {String(rawErrors[0])}
        </ErrorMessage>
      );
    }
  }
};
