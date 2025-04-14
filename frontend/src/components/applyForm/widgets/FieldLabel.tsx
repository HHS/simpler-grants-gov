import { Label } from "@trussworks/react-uswds";

export const FieldLabel = ({
  description,
  idFor,
  title,
  required,
}: {
  description?: string;
  idFor: string;
  title: string | undefined;
  required: boolean | undefined;
}) => {
  return (
    <Label id={`label-for-${idFor}`} key={`label-for-${idFor}`} htmlFor={idFor}>
      {title}
      {required && (
        <span className="usa-hint usa-hint--required text-no-underline">*</span>
      )}
      {description && (
        <span>
          <br /> {description}
        </span>
      )}
    </Label>
  );
};
