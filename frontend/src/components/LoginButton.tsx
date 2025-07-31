import { LOGIN_URL } from "src/constants/auth";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { PropsWithChildren } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

export function LoginLink({ children }: PropsWithChildren) {
  return (
    <a
      href={LOGIN_URL}
      key="login-link"
      className="usa-button"
      onClick={() => {
        const startURL = `${location.pathname}${location.search}`;
        if (startURL !== "") {
          SessionStorage.setItem("login-redirect", startURL);
        }
      }}
    >
      {children}
    </a>
  );
}

export function LoginButton({
  navLoginLinkText,
}: {
  navLoginLinkText: string;
}) {
  return (
    <Button
      type="button"
      className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
      data-testid="sign-in-button"
    >
      <LoginLink>
        <USWDSIcon
          className="usa-icon margin-right-05 margin-left-neg-05"
          name="login"
          key="login-link-icon"
        />
        {navLoginLinkText}
      </LoginLink>
    </Button>
  );
}
