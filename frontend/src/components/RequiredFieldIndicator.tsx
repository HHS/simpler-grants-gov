import { PropsWithChildren } from "react";

export const RequiredFieldIndicator = ({ children }: PropsWithChildren) => (
  <span className="usa-hint usa-hint--required">{children}</span>
);
