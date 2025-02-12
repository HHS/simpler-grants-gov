"use client";

import { useUser } from "src/services/auth/useUser";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// this component is designed to be used on any page that requires the user to be logged in
// and will redirect to an unauthenticated error page if the user is not logged in
// NOTE: when used on server rendered pages, there will likely be a flicker of content before redirect
// we'll figure that out later on
export function SessionCheck() {
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    // if user isn't defined yet we just need to wait til next render
    if (!user) {
      return;
    }
    if (!user.token) {
      router.push("/unauthenticated");
    }
  }, [user, router]);
  return <></>;
}
