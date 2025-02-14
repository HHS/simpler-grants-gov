"use client";

import { useRef } from "react";

export default function Login() {
  const redirecting = useRef<boolean>(false);

  if (typeof window !== "undefined") {
    // without this check, even wrapped in a useEffect this would fire twice and the second time redirect to / because sessionStorage was empty.
    if (!redirecting.current) {
      redirecting.current = true;
      const redirectURL = window?.sessionStorage?.getItem("login-redirect");
      window?.sessionStorage?.removeItem("login-redirect");

      if (redirectURL === null || redirectURL === "") {
        window.location.assign("/");
        return;
      }

      window.location.assign(redirectURL);

      return <>Redirecting...</>;
    }
  }
}
