import { ErrorMessage } from "@trussworks/react-uswds";

export function ConditionalFormActionError<
  T extends { [key: string]: string[] },
>({ errors, fieldName }: { errors?: T; fieldName: keyof T }) {
  if (!errors) {
    return;
  }
  const error = errors[fieldName];
  if (error) {
    return <ErrorMessage className="maxw-mobile-lg">{error[0]}</ErrorMessage>;
  }
}
