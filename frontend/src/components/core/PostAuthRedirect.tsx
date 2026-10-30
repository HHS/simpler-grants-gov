import { LOGIN_REDIRECT_STORAGE_KEY } from "src/constants/auth";
import SessionStorage from "src/services/sessionStorage/sessionStorage";
import { getSafeLoginRedirect } from "src/utils/userUtils";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import { USWDSIcon } from "./USWDSIcon";

type PostAuthRedirectProps = {
  checkPiv?: boolean;
  displayMessage?: string;
};

export function PostAuthRedirect({
  checkPiv,
  displayMessage,
}: PostAuthRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // the saved destination is cleared on the first run, so a repeated effect run
  // (e.g. React Strict Mode) must not navigate again to the fallback
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) {
      return;
    }
    hasRedirected.current = true;

    const destination = getSafeLoginRedirect(
      SessionStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY),
    );
    SessionStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
    if (checkPiv && searchParams.get("pivError")) {
      SessionStorage.setItem("showPivError", "true");
    }
    router.replace(destination);
  }, [router, searchParams, checkPiv]);

  return (
    <GridContainer className="margin-y-5">
      <Grid className="flex-align-center display-flex">
        <USWDSIcon name="autorenew" className="usa-icon--size-3" />
        <div className="padding-left-05 padding-top-05 font-sans-md">
          {displayMessage || "Redirecting..."}
        </div>
      </Grid>
    </GridContainer>
  );
}
