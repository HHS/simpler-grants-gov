"use client";

import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const redirectURL = SessionStorage.getItem("login-redirect");
      SessionStorage.removeItem("login-redirect");

      // Normalize invalid URLs to "/"
      const finalRedirectURL =
        redirectURL === null ||
        redirectURL === "" ||
        redirectURL.substring(0, 1) !== "/"
          ? "/"
          : redirectURL;

      router.push(finalRedirectURL);
      return () => SessionStorage.removeItem("login-redirect");
    } else {
      console.error("window is undefined");
    }
  }, [router]);

  return (
    <GridContainer className="margin-y-5">
      <Grid className="flex-align-center display-flex">
        <USWDSIcon name="autorenew" className="usa-icon--size-3" />
        <div className="padding-left-05 padding-top-05 font-sans-md">
          Redirecting...
        </div>
      </Grid>
    </GridContainer>
  );
}
