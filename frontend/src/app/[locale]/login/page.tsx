"use client";

import SessionStorage from "src/utils/sessionStorage";

import { useRef } from "react";

export default function Login() {
  const redirecting = useRef<boolean>(false);

  if (typeof window !== "undefined") {
    // without this check, even wrapped in a useEffect this would fire twice and the second time redirect to / because sessionStorage was empty.
    if (!redirecting.current) {
      redirecting.current = true;
      const redirectURL = SessionStorage.getItem("login-redirect");
      SessionStorage.removeItem("login-redirect");

      if (
        redirectURL === null ||
        redirectURL === "" ||
        redirectURL.substring(0, 1) !== "/"
      ) {
        window.location.assign("/");
        return;
      }

      window.location.assign(redirectURL);

      return <>Redirecting...</>;
    }
  }
}
