import { Label } from "@trussworks/react-uswds";

export const FieldLabel = ({
  idFor,
  title,
  required,
}: {
  idFor: string;
  title: string | undefined;
  required: boolean | undefined;
}) => {
  return (
    <Label key={`label-for-${idFor}`} htmlFor={idFor}>
      {title}
      {required && (
        <span className="usa-hint usa-hint--required text-no-underline">*</span>
      )}
    </Label>
  );
};
