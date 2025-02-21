"use client";

import SessionStorage from "src/utils/sessionStorage";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const redirectURL = SessionStorage.getItem("login-redirect");
      SessionStorage.removeItem("login-redirect");

      if (
        redirectURL === null ||
        redirectURL === "" ||
        redirectURL.substring(0, 1) !== "/"
      ) {
        router.push("/");
      }
      router.push(redirectURL || "/");
      return () => SessionStorage.removeItem("login-redirect");
    } else {
      console.error("window is undefined");
    }
  }, [router]);
  return <>Redirecting...</>;
}
